# **Relatório Técnico de Pesquisa: Arquitetura e Implementação de Simulação Headless de Alta Fidelidade para RPG Maker MZ em Node.js**

## **Sumário Executivo**

A modernização das metodologias de balanceamento de jogos exige uma transição dos testes manuais ("playtesting") para a simulação automatizada de alta velocidade. No contexto de jogos desenvolvidos com o motor RPG Maker MZ (RMMZ), o acoplamento intrínseco da lógica do jogo com o pipeline de renderização visual (PIXI.js) e o loop de eventos do navegador (requestAnimationFrame) apresenta uma barreira técnica significativa para a automação backend. Este relatório detalha a arquitetura e a implementação prática de um BattleManager "Headless" (sem interface gráfica) executado dentro de um ambiente Node.js.

O objetivo primário desta arquitetura é reduzir o ciclo de feedback do balanceamento de combate de dias para minutos, executando batalhas em um estado determinístico e acelerado. Isso exige a construção de um ambiente de simulação de alta fidelidade que trate o código original do jogo como uma "caixa preta" (ADR-001), garantindo que os resultados simulados correspondam lógica e matematicamente ao cliente do jogo real (ADR-003).

Este documento serve como um guia técnico exaustivo para a construção da Prova de Conceito (POC) delineada no DR-002. O foco reside na implementação arquitetural do "Sync Warp Loop" (ADR-029) para desacoplar o tempo do jogo do tempo do relógio ("wall-clock time"), e na "Arquitetura de Shims/Mocks" (ADR-015) para virtualizar os subsistemas gráficos e de áudio. Ao substituir o loop de renderização assíncrono do navegador por um modelo de execução síncrono e ao criar "stubs" (esboços funcionais) para dependências visuais, alcançamos simulações de batalha capazes de executar milhares de turnos em milissegundos.

## ---

**1\. Fundamentação Arquitetural: O Ambiente de Execução Node.js e JSDOM**

Para executar os scripts principais ("core scripts") do RPG Maker MZ — originalmente projetados para um ambiente de navegador (Chromium via NW.js) — dentro de um ambiente de servidor Node.js, é necessária uma arquitetura de tempo de execução ("runtime") especializada. O objetivo é criar um ambiente de navegador sintético que satisfaça as dependências do motor sem incorrer na sobrecarga ("overhead") de renderização real ou processamento de áudio.

O RPG Maker MZ, desde sua concepção, opera sobre uma pilha tecnológica que mistura HTML5, CSS e JavaScript, utilizando a biblioteca PIXI.js para renderização WebGL e a Web Audio API para som.1 O desafio central da simulação headless reside no fato de que o motor do jogo não separa estritamente a "Lógica de Jogo" da "Lógica de Apresentação". O BattleManager aguarda que animações visuais terminem (Spriteset\_Battle) e que mensagens de texto sejam "lidas" (Window\_BattleLog) antes de prosseguir para o próximo turno lógico. Em um servidor sem monitor, essas esperas visuais devem ser eliminadas ou simuladas instantaneamente.

### **1.1 A Pilha Tecnológica do Runtime**

O ambiente de simulação é construído sobre a seguinte pilha:

* **Runtime:** Node.js (Versão LTS Atual). Proporciona a execução de JavaScript no backend e acesso direto ao sistema de arquivos, essencial para substituir requisições HTTP (XHR) por leituras de disco síncronas.  
* **Emulação de DOM:** JSDOM. Esta biblioteca é crítica para fornecer as interfaces globais window, document e HTMLElement nas quais o rmmz\_core.js e os gerenciadores de plugins confiam. Embora o JSDOM forneça a estrutura do documento, ele carece deliberadamente de um motor de layout visual e contextos WebGL, o que exige mocking adicional.2  
* **Sistema de Módulos:** CommonJS (CJS) adaptado. Dado que o RMMZ utiliza classes ES6 nativas mas opera extensivamente no escopo global (poluindo o objeto window), o carregador da simulação deve ingerir scripts via módulo fs e executá-los dentro do contexto do JSDOM, replicando o comportamento das tags \<script\> do index.html.

### **1.2 O Princípio da "Caixa Preta" (ADR-001)**

Uma decisão arquitetural crítica é o tratamento dos scripts principais do RPG Maker (rmmz\_core.js, rmmz\_managers.js, rmmz\_objects.js, rmmz\_scenes.js, rmmz\_sprites.js, rmmz\_windows.js) como uma "caixa preta". Não modificamos esses arquivos diretamente. A modificação direta dos scripts principais introduz o risco de "deriva lógica" (logic drift), onde a simulação se comporta de maneira diferente do jogo implantado, invalidando os dados de balanceamento gerados.

Em vez disso, utilizamos **Injeção de Dependência** e **Monkey Patching** (sobrescrita em tempo de execução) *antes* e *depois* do carregamento dos scripts.

1. **Shims Pré-Carregamento:** Injetamos classes simuladas (ex: PIXI, AudioContext) no escopo global antes de carregar o núcleo do RMMZ. Isso previne falhas do tipo ReferenceError durante a análise inicial ("parsing") dos scripts do motor.4  
2. **Overrides Pós-Carregamento:** Uma vez que o motor é carregado na memória, sobrescrevemos seletivamente métodos específicos no BattleManager, SceneManager e Window\_BattleLog para sequestrar o fluxo de controle, redirecionando-o para nossa simulação de alta velocidade.

### **1.3 Limitações Críticas do JSDOM e Adaptação**

O JSDOM é uma implementação JavaScript dos padrões WHATWG DOM e HTML, mas não é um navegador completo. Ele não executa refluxos ("reflows") de layout nem renderização real. Consequentemente, métodos como element.getBoundingClientRect() geralmente retornam zeros, e o window.requestAnimationFrame é emulado usando setTimeout, o que o vincula ao tempo real (relógio de parede), tornando-o inadequado para simulação acelerada.2

Além disso, contextos gráficos como CanvasRenderingContext2D e WebGLRenderingContext estão ausentes ou não funcionais para os propósitos de um motor de jogo. Essas limitações não são falhas do JSDOM, mas características de design que nossa arquitetura deve contornar através da camada de "Shim/Mock" detalhada na Seção 2\.

## ---

**2\. Arquitetura de Shims e Mocks (ADR-015)**

Para executar o BattleManager sem um display ("headless"), devemos construir virtualmente os subsistemas com os quais ele espera interagir. O motor RMMZ é rigidamente acoplado ao PIXI.js para gráficos e à Web Audio API para som. Tentar remover essas referências do código fonte violaria o princípio da "Caixa Preta". Portanto, a solução é fornecer objetos falsos (Mocks) que respondam às chamadas do motor de maneira complacente, mas silenciosa.

### **2.1 Mocking do Subsistema Gráfico (PIXI.js)**

O RPG Maker MZ utiliza o PIXI.js (geralmente v5, ou v8 em atualizações/mods recentes da comunidade) como seu motor de renderização. As classes principais Sprite, Window e Scene herdam diretamente de objetos PIXI. Se o objeto global PIXI estiver indefinido, o rmmz\_core.js falhará imediatamente ao tentar estender classes bases inexistentes.1

#### **2.1.1 Estratégia de Shim do PIXI**

Não precisamos de um renderizador WebGL funcional; precisamos de um renderizador *lógico*. A simulação preocupa-se com o *estado* de um sprite (ex: "a animação está tocando?", "a janela está aberta?"), não com seus pixels. Definimos um objeto global PIXI contendo classes "stub" (esboços). Esses stubs devem imitar a cadeia de herança e a superfície da API usada pelo RMMZ.

A tabela abaixo detalha as classes PIXI críticas que devem ser mockadas para garantir a estabilidade do rmmz\_core.js:

| Classe PIXI | Função no RMMZ | Necessidade no Mock |
| :---- | :---- | :---- |
| PIXI.Container | Classe base para todos os objetos de exibição. | Métodos addChild, removeChild, propriedades children, visible, alpha, x, y. |
| PIXI.Sprite | Herda de Container. Exibe imagens. | Propriedades anchor, scale, rotation, blendMode. |
| PIXI.Graphics | Desenho de formas (fundos de janelas). | Métodos clear, beginFill, drawRect. |
| PIXI.Rectangle | **Crítico.** Cálculos de layout de janelas. | Métodos contains, propriedades x, y, width, height. Se falhar, quebra o cálculo de UI. |
| PIXI.Point | Coordenadas. | Propriedades x, y. |
| PIXI.TextStyle | Estilização de texto. | Objeto de configuração de fonte. |
| PIXI.utils | Utilitários internos. | EventEmitter para gestão de eventos. |

**Padrão de Implementação: O Renderizador Nulo**

Devemos implementar um Mock que simule a hierarquia de objetos sem realizar operações de GPU. Um ponto de atenção especial é a classe PIXI.Rectangle. O RMMZ utiliza esta classe extensivamente para determinar áreas clicáveis e layouts de janelas (Window\_Base.prototype.updatePadding, hitTest). Se o mock de Rectangle não implementar a lógica geométrica básica (ex: contains(x, y)), o código do jogo pode gerar valores NaN (Not a Number) que se propagam para a lógica de batalha, causando comportamentos indefinidos.8

JavaScript

// Padrão de Código: Estrutura Shim PIXI para Node.js  
const PIXI \= {};

class DisplayObject {  
    constructor() {  
        this.x \= 0;  
        this.y \= 0;  
        this.parent \= null;  
        this.worldAlpha \= 1;  
        this.transform \= { worldTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 } };  
        this.visible \= true;  
        this.renderable \= true;  
    }  
    destroy() {}  
    getGlobalPosition() { return { x: 0, y: 0 }; }  
    setParent(container) { this.parent \= container; }  
}

class Container extends DisplayObject {  
    constructor() {  
        super();  
        this.children \=;  
    }  
    addChild(child) {  
        if (\!child) return child;  
        if (child.parent) child.parent.removeChild(child);  
        child.parent \= this;  
        this.children.push(child);  
        return child;  
    }  
    removeChild(child) {  
        const index \= this.children.indexOf(child);  
        if (index \> \-1) {  
            this.children.splice(index, 1);  
            child.parent \= null;  
        }  
        return child;  
    }  
    // Shim recursivo para satisfazer loops de atualização visual  
    updateTransform() {  
        for (const child of this.children) {  
            if (child.updateTransform) child.updateTransform();  
        }  
    }  
}

// Crítico: Rectangle deve funcionar logicamente para layouts de Janela  
class Rectangle {  
    constructor(x \= 0, y \= 0, width \= 0, height \= 0) {  
        this.x \= x;  
        this.y \= y;  
        this.width \= width;  
        this.height \= height;  
    }  
    contains(x, y) {  
        return (this.width \> 0 && this.height \> 0 &&  
                x \>= this.x && x \< this.x \+ this.width &&  
                y \>= this.y && y \< this.y \+ this.height);  
    }  
}

// Atribuição ao escopo global  
PIXI.DisplayObject \= DisplayObject;  
PIXI.Container \= Container;  
PIXI.Sprite \= class extends Container {  
    constructor() {  
        super();  
        this.anchor \= { x: 0, y: 0 };  
        this.scale \= { x: 1, y: 1 };  
        this.blendMode \= 0;  
        this.texture \= { baseTexture: { width: 0, height: 0 }, frame: new Rectangle() };  
    }  
};  
PIXI.Rectangle \= Rectangle;  
PIXI.utils \= { EventEmitter: class { on() {} off() {} emit() {} } };  
PIXI.Loader \= { shared: { add: () \=\> {}, load: (cb) \=\> cb && cb() } };  
PIXI.filters \= { ColorMatrixFilter: class {} }; // Necessário para plugins de estado

global.PIXI \= PIXI;

#### **2.1.2 Tratamento do Effekseer**

O RMMZ introduziu o Effekseer para animações de partículas avançadas. Chamadas para Graphics.playEffect instanciam contextos Effekseer que dependem de módulos WebAssembly (WASM) e contextos WebGL. Em um ambiente headless, o módulo WASM do Effekseer falhará ao carregar ou ao tentar encontrar um contexto gráfico.

**Estratégia:** Criar "stubs" para Graphics.createEffekseerContext e métodos relacionados no rmmz\_core.js (via override pós-carregamento) para simplesmente não fazer nada. A simulação precisa saber *que* uma animação está tocando (o que é gerenciado pela lógica de duração no Spriteset\_Battle), mas não precisa calcular a trajetória física das partículas.9

### **2.2 Mocking do Subsistema de Áudio (Web Audio API)**

O RMMZ utiliza a classe WebAudio (um wrapper) que interage diretamente com o AudioContext do navegador. O Node.js não possui esse global nativamente. Se não for tratado, o jogo falhará durante a inicialização do SoundManager.10

#### **2.2.1 O Mock do AudioContext**

Precisamos de um stub que implemente a interface AudioContext mas que não gere som. Embora existam bibliotecas como standardized-audio-context-mock 11 para testes unitários rigorosos, um shim personalizado leve é superior para desempenho neste caso de uso específico, pois queremos estritamente ignorar a lógica de áudio, não verificar seu grafo de sinal.

**Detalhes da Implementação do Mock:**

* **AudioContext:** Deve implementar métodos como createGain, createBufferSource, decodeAudioData. A propriedade currentTime é essencial para temporizadores de áudio.  
* **AudioNodes:** Mockar GainNode e AudioBufferSourceNode.  
* **Callbacks de Término:** Crucialmente, o AudioBufferSourceNode deve ter um método start() e suportar callbacks onended. O RMMZ às vezes aguarda que um efeito sonoro (SE) ou música (ME) termine antes de prosseguir com uma sequência de eventos. Se o evento onended nunca disparar, o jogo pode entrar em "soft-lock" (travamento lógico).12

Para o modo "Speed" headless, uma otimização adicional é sobrescrever o AudioManager para desabilitar o áudio completamente (AudioManager.playBgm \= function() {};), evitando até mesmo a criação dos nós de áudio simulados. No entanto, para manter a integridade da "caixa preta" dos scripts principais, mockar a API global.AudioContext é arquiteturalmente mais limpo do que reescrever o rmmz\_managers.js.

### **2.3 Neutralização de Input**

Em um sistema de batalha automatizado, a entrada do usuário vem de um agente de IA ou de um script pré-definido, não de um teclado ou mouse físico.

* **Input.update():** Normalmente faz o polling do DOM para teclas pressionadas. Sobrescrevemos para não fazer nada.  
* **TouchInput.update():** Sobrescrevemos para não fazer nada.  
* **Input Programático:** Contornamos a classe Input completamente para a tomada de decisão. O agente de IA invocará diretamente métodos como BattleManager.inputtingAction().setSkill(id) e BattleManager.selectNextCommand(), simulando o *resultado* da entrada em vez do evento de hardware.14

## ---

**3\. O Sync Warp Loop (ADR-029)**

O loop de jogo padrão do RMMZ é impulsionado pelo SceneManager.run, que utiliza requestAnimationFrame. Isso trava a velocidade do jogo à taxa de atualização do monitor (ou do mock, geralmente 60Hz via setTimeout no JSDOM).15 Para uma "Simulação de Alta Fidelidade" usada em balanceamento, precisamos de "Velocidade de Dobra" (Warp Speed) — executando quadros tão rápido quanto a CPU permitir, potencialmente milhares de quadros por segundo.

### **3.1 Arquitetura do Loop Síncrono**

Substituímos a recursão assíncrona do requestAnimationFrame por um loop while síncrono. Este loop deve gerenciar manualmente a contagem de quadros (Graphics.frameCount) para garantir que a lógica dependente do tempo (turnos de buffs, expiração de estados, temporizadores de eventos) funcione corretamente.

**O Padrão SyncWarpLoop:**

A classe SyncWarpLoop é responsável por orquestrar a execução. Ela substitui o SceneManager.run padrão.

JavaScript

class SyncWarpLoop {  
    constructor(maxFrames \= 10000) {  
        this.maxFrames \= maxFrames;  
        this.running \= false;  
        this.simulatedFrames \= 0;  
    }

    start() {  
        this.running \= true;  
        console.log("Iniciando simulação Sync Warp...");  
          
        // Finaliza processos anteriores do SceneManager para limpar estado  
        SceneManager.terminate();   
          
        // NÃO chamamos SceneManager.run(), pois isso iniciaria o loop assíncrono.  
        // Inicializamos manualmente a cena de Boot se necessário.  
        if (\!SceneManager.\_scene) {  
            SceneManager.goto(Scene\_Boot);  
        }

        try {  
            // O Loop de "Dobra"  
            while (this.running && this.simulatedFrames \< this.maxFrames) {  
                this.tick();  
            }  
        } catch (e) {  
            console.error("Simulação falhou com erro crítico:", e);  
            throw e;   
        }  
    }

    tick() {  
        // 1\. Avançar o tempo lógico  
        // Graphics.frameCount é usado para temporizadores de estados e buffs.  
        Graphics.frameCount++;  
          
        // 2\. Atualizar Gerenciadores  
        // Pulamos SceneManager.updateMain() pois ele depende de renderização.  
        // Chamamos diretamente as atualizações lógicas.  
        SceneManager.updateInputData(); // Atualiza estado dos wrappers de Input (agora mocks)  
        SceneManager.changeScene();     // Gerencia transições (Mapa \-\> Batalha)  
        SceneManager.updateScene();     // Chama.update() na cena atual (Scene\_Battle)  
          
        // 3\. Verificação Condicional de Fim de Batalha  
        // Se a cena mudar para Scene\_Title ou Scene\_Gameover, a batalha acabou.  
        if (SceneManager.\_scene instanceof Scene\_Title |

| SceneManager.\_scene instanceof Scene\_Gameover) {  
            this.running \= false;  
        }  
          
        this.simulatedFrames++;  
    }  
}

### **3.2 Superando o Problema da "Espera Visual"**

O principal gargalo nas batalhas do RMMZ é a Window\_BattleLog. Por padrão, ela empurra texto para uma fila e espera que ele seja "lido" (passagem de frames) antes de prosseguir. Da mesma forma, o Spriteset\_Battle espera que as animações terminem.17 Em uma simulação headless, o visual não existe. Esperar 60 frames por uma animação de "Corte" em um canvas inexistente é um desperdício de ciclos de CPU.

#### **3.2.1 A Sobrescrita do Estado "Busy"**

Precisamos neutralizar as verificações de isBusy (ocupado). A lógica do jogo pausa sempre que BattleManager.isBusy() retorna verdadeiro.

O BattleManager.isBusy() verifica internamente:

1. $gameMessage.isBusy(): Se há texto sendo exibido.  
2. this.\_spriteset.isBusy(): Se há animações visuais ocorrendo.  
3. this.\_logWindow.isBusy(): Se o log de batalha está processando mensagens ou efeitos.

Não podemos simplesmente retornar false sempre, pois isso quebraria a sequência lógica (ex: cálculo de dano ocorrendo antes do processamento de morte). Devemos permitir que a lógica processe, mas instantaneamente.

**Implementação da "Velocidade Instantânea":**

Em vez de remover as esperas, aumentamos drasticamente a taxa de processamento para que elas se resolvam em 0 ou 1 frame lógico.

1. **Window\_BattleLog:** Sobrescrevemos messageSpeed para retornar 0\. Sobrescrevemos update para limpar contadores de espera imediatamente.  
2. **Spriteset\_Battle:** Sobrescrevemos isAnimationPlaying para retornar false.  
3. **Animações:** Interceptamos requisições de animação para não criar objetos pesados.

**Padrão de Código para Eliminação de Esperas:**

JavaScript

// Shim aplicado APÓS o carregamento dos scripts principais

// 1\. Texto Instantâneo  
Window\_BattleLog.prototype.messageSpeed \= function() { return 0; };

// 2\. Espera Instantânea (para animações/efeitos dentro do log)  
// O log normalmente espera usando this.\_waitCount  
const \_Window\_BattleLog\_update \= Window\_BattleLog.prototype.update;  
Window\_BattleLog.prototype.update \= function() {  
    // Força contagem de espera para 0 a cada frame para pular delays  
    this.\_waitCount \= 0;   
      
    // Se o log está esperando um efeito (áudio/tremor), limpa o modo  
    this.\_waitMode \= '';   
      
    // Chama o update original para processar a fila de mensagens  
    \_Window\_BattleLog\_update.call(this);  
};

// 3\. Verificação de Busy do Spriteset  
// Normalmente verifica se animações PIXI ou Effekseer estão rodando.  
Spriteset\_Battle.prototype.isBusy \= function() {  
    // Na simulação de alta fidelidade, ignoramos animações visuais.  
    return false;   
};

// 4\. Bypass de Requisição de Animação  
// Previne a criação de objetos Sprite\_Animation pesados e contextos Effekseer  
const \_Temp\_requestAnimation \= Game\_Temp.prototype.requestAnimation;  
Game\_Temp.prototype.requestAnimation \= function(targets, animationId, mirror) {  
    // NÃO chamamos o original. Não queremos carregar animações MV/MZ.  
    // Apenas logamos se o debug for necessário.  
    // console.log(\` Animação ${animationId} requisitada.\`);  
};

Esta configuração coloca o motor de batalha em "Hyper-Speed", onde o único limite é a capacidade da CPU de processar a lógica JavaScript das fórmulas de dano e árvores de decisão da IA.19

## ---

**4\. Persistência de Dados: Abstração do Sistema de Arquivos**

O RMMZ utiliza a classe DataManager para carregar arquivos de banco de dados JSON (Actors.json, System.json, etc.) via XMLHttpRequest (XHR), pois assume um ambiente de navegador. No Node.js, o objeto XMLHttpRequest está ausente (a menos que usemos polyfills), mas temos acesso ao módulo fs (File System), que é superior para este propósito.

O uso de fs.readFileSync é preferível a polyfills de XHR porque é **síncrono**. Isso permite que o banco de dados seja totalmente carregado e esteja pronto na memória *antes* de iniciar o loop de simulação, garantindo determinismo absoluto na inicialização e simplificando a complexidade de promessas (async/await).21

### **4.1 O Wrapper FS**

Interceptamos o método DataManager.loadDataFile.

JavaScript

const fs \= require('fs');  
const path \= require('path');

// Caminho base para a pasta "data" do projeto RMMZ  
const DATA\_PATH \= path.join(\_\_dirname, '..', 'project', 'data');

// Override DataManager.loadDataFile para usar fs  
DataManager.loadDataFile \= function(name, src) {  
    const filePath \= path.join(DATA\_PATH, src);  
    try {  
        // Leitura síncrona do arquivo JSON  
        const data \= fs.readFileSync(filePath, 'utf8');  
          
        // Parse do JSON e atribuição à variável global (ex: $dataActors)  
        // O RMMZ espera que window\[name\] seja populado.  
        window\[name\] \= JSON.parse(data);  
          
        // Crítico: O RMMZ usa um sistema de callbacks ou contadores.  
        // loadDataFile original espera XHR.onload.  
        // Devemos disparar onLoad manualmente para atualizar o contador de carregamento.  
        DataManager.onLoad(window\[name\]);  
    } catch (e) {  
        console.error(\`Falha ao carregar ${src} via fs:\`, e);  
        // Define flag de erro para o DataManager tratar (embora no headless devamos falhar rápido)  
        DataManager.\_errorUrl \= name;  
    }  
};

### **4.2 Manipulação de Imagens e Estados "Ready"**

O ImageManager é outra barreira de carregamento. A lógica do RMMZ frequentemente verifica ImageManager.isReady() antes de iniciar uma batalha ou transição de cena. Em um ambiente headless, nunca carregamos pixels reais, então as imagens nunca estariam "prontas" em um sistema real.

Devemos mockar o ImageManager para satisfazer essas verificações instantaneamente. Se isso não for feito, a Scene\_Boot ficará presa em um loop infinito esperando o carregamento de bitmaps.24

JavaScript

// Mock para ImageManager carregar bitmaps falsos instantaneamente  
ImageManager.loadBitmap \= function(folder, filename) {  
    // Retorna um objeto bitmap "dummy" que está sempre pronto  
    return {  
        isReady: () \=\> true,  
        addLoadListener: (cb) \=\> cb && cb(), // Dispara callback imediatamente  
        width: 1,  
        height: 1,  
        \_canvas: { width: 1, height: 1 }, // Stub para evitar erro em blt  
        \_context: null  
    };  
};

// Assegura que o sistema pense que todas as imagens estão carregadas  
ImageManager.isReady \= function() { return true; };

## ---

**5\. Fase 2: Carregamento Defensivo de Plugins**

Um requisito importante para um simulador robusto é a capacidade de lidar com plugins de terceiros (User-Generated Content). Plugins no RMMZ (especialmente pacotes populares como VisuStella ou plugins de interface) frequentemente assumem a presença de um DOM completo e podem acessar document.body, adicionar listeners globais (window.addEventListener) ou utilizar filtros PIXI específicos que não implementamos no Shim básico.7

### **5.1 A Estratégia de "Bail Out" (Abandono Defensivo)**

Ao carregar plugins dinamicamente, corremos o risco de encontrar erros de sintaxe ou exceções em tempo de execução devido a recursos de ambiente ausentes.

**Estratégia:**

1. **Execução em Sandbox:** Carregar plugins usando um bloco try-catch ao redor da sequência fs.readFileSync \+ eval.  
2. **Expansão de Shim sob Demanda:** Se um plugin falhar porque PluginManager.parameters() falha (comum em Node, pois depende de parsing de scripts carregados no DOM), devemos mockar esse método para ler o arquivo js/plugins.js manualmente usando fs e parsear os parâmetros.  
3. **Detecção de Falha Crítica:** Se um plugin tentar modificar o protótipo de um objeto que não existe (ex: um filtro PIXI obscuro), capturamos o erro. Se o erro for fatal para a *lógica* (ex: altera fórmula de dano), abortamos. Se for visual (ex: altera cor da janela), logamos o erro e continuamos ("Bail Out"), permitindo que o sistema funcione sem aquele efeito visual.

### **5.2 Determinismo e Plugins**

Plugins que introduzem aleatoriedade (ex: variância de dano customizada no "Battle Core") podem quebrar a reprodutibilidade científica da simulação.

Aleatoriedade Determinística (ADR-XXX):  
Devemos sobrescrever o Math.random. O RMMZ não usa um RNG (Random Number Generator) com semente ("seeded") por padrão. Para a simulação, substituímos o Math.random nativo por um Gerador Linear Congruente (LCG) com semente fixa.

JavaScript

// Substituição do Math.random para Determinismo  
let seed \= 12345; // Pode ser configurado via argumento de linha de comando  
Math.random \= function() {  
    seed \= (seed \* 9301 \+ 49297) % 233280;  
    return seed / 233280;  
};

Isso garante que executar a mesma simulação de batalha duas vezes produza exatamente os mesmos números de dano, acertos críticos e comportamento da IA, crucial para testes A/B de mudanças de balanceamento.11

## ---

**6\. Guia de Implementação: Construindo a POC (DR-002)**

Esta seção sintetiza a arquitetura em um roteiro prático para a construção da Prova de Conceito.

### **Passo 1: Configuração do Projeto**

Inicialize um projeto Node.js e instale as dependências mínimas.

Bash

npm init \-y  
npm install jsdom

### **Passo 2: O Executor da Simulação (sim\_runner.js)**

Este é o ponto de entrada (entry point). Ele orquestra a configuração do ambiente JSDOM, carrega os shims e inicia o motor.

JavaScript

// sim\_runner.js  
const { JSDOM } \= require('jsdom');  
const fs \= require('fs');  
const path \= require('path');

// 1\. Configuração do JSDOM (Ambiente Browser Sintético)  
const dom \= new JSDOM('\<\!DOCTYPE html\>\<html\>\<body\>\</body\>\</html\>', {  
    url: "http://localhost/",  
    runScripts: "dangerously", // Necessário para executar scripts  
    resources: "usable"  
});

// Expor globais do DOM para o escopo do Node  
global.window \= dom.window;  
global.document \= dom.window.document;  
global.navigator \= dom.window.navigator;  
global.HTMLElement \= dom.window.HTMLElement; // Necessário para herança de elementos

// 2\. Carregar Shims (PIXI, Audio, Utils) \- Ver Seção 2  
require('./shims/pixi\_shim.js');  
require('./shims/audio\_shim.js');  
require('./shims/input\_shim.js');

// 3\. Definir Variáveis Globais do RMMZ (prevenir Reference Errors)  
// O motor espera que estas existam antes de rodar.  
global.$dataActors \= null;  
global.$dataClasses \= null;  
global.$dataSkills \= null;  
global.$dataItems \= null;  
global.$dataWeapons \= null;  
global.$dataArmors \= null;  
global.$dataEnemies \= null;  
global.$dataTroops \= null;  
global.$dataStates \= null;  
global.$dataAnimations \= null;  
global.$dataTilesets \= null;  
global.$dataCommonEvents \= null;  
global.$dataSystem \= null;  
global.$dataMapInfos \= null;  
global.$dataMap \= null;  
global.$gameTemp \= null;  
global.$gameSystem \= null;  
global.$gameScreen \= null;  
global.$gameTimer \= null;  
global.$gameMessage \= null;  
global.$gameSwitches \= null;  
global.$gameVariables \= null;  
global.$gameSelfSwitches \= null;  
global.$gameActors \= null;  
global.$gameParty \= null;  
global.$gameTroop \= null;  
global.$gameMap \= null;  
global.$gamePlayer \= null;

// 4\. Carregar Core Scripts (Ordem é Crítica\!)  
const coreScripts \=;

const BASE\_JS\_PATH \= path.join(\_\_dirname, 'project', 'js');

coreScripts.forEach(script \=\> {  
    const scriptPath \= path.join(BASE\_JS\_PATH, script);  
    try {  
        const code \= fs.readFileSync(scriptPath, 'utf8');  
        // Executa no contexto global usando eval indireto para que as classes fiquem globais  
        (0, eval)(code);   
    } catch (e) {  
        console.error(\`Erro ao carregar script do núcleo ${script}:\`, e);  
        process.exit(1);  
    }  
});

// 5\. Aplicar Overrides de "Caixa Preta" (Lógica Sync Warp \- Seção 3\)  
require('./overrides/headless\_overrides.js');

// 6\. Inicializar o Jogo  
// Substitui o DataManager.loadDatabase original pelo nosso wrapper FS  
DataManager.loadDatabase(); 

// Loop de Espera pelo Banco de Dados  
// Mesmo sendo síncrono no FS, mantemos a verificação para garantir integridade.  
const waitForDB \= setInterval(() \=\> {  
    if (DataManager.isDatabaseLoaded()) {  
        clearInterval(waitForDB);  
        startSimulation();  
    }  
}, 10);

function startSimulation() {  
    console.log("Banco de dados carregado. Iniciando Batalha...");  
      
    // Configura um teste de batalha (Battle Test)  
    // Isso popula $gameParty e $gameTroop com base nos dados do banco.  
    DataManager.setupBattleTest();  
      
    // Força a ida para a Cena de Batalha  
    SceneManager.goto(Scene\_Battle);  
      
    // Inicia o Loop Sync Warp  
    const warpLoop \= new SyncWarpLoop(5000); // Limite de segurança de 5000 frames  
    warpLoop.start();  
      
    // Ao final, extrair resultados  
    if (BattleManager.\_phase \=== 'battleEnd') {  
        console.log("Batalha Concluída\!");  
        // Análise de resultados: HP restante, Turnos, Vitória/Derrota  
        console.log(\`Turnos: ${$gameTroop.turnCount()}\`);  
        console.log(\`Vitória: ${$gameParty.isAllDead()? 'Não' : 'Sim'}\`);  
    } else {  
        console.log("Simulação abortada ou limite de frames atingido.");  
    }  
}

### **Passo 3: Manipulação de Plugins (Fase 2\)**

Para integrar plugins, o processo deve ler o js/plugins.js (que é um arquivo JSON-like contendo configurações). Iteramos sobre a lista, carregamos o arquivo .js correspondente via fs e executamos via eval.

* **Insight de Implementação:** Se um plugin falhar devido à detecção de navegador móvel (comum em plugins de UI), atualize o shim do JSDOM para fornecer uma string navigator.userAgent falsa que simule um desktop.  
* **Insight VisuStella:** Plugins ofuscados frequentemente verificam a integridade das funções nativas. Não modifique o código fonte deles. Em vez disso, garanta que o ambiente (objetos globais e mocks PIXI) corresponda perfeitamente ao que eles esperam, incluindo a presença de métodos que você talvez não use, apenas para satisfazer as verificações de inicialização.

## ---

**7\. Implicações Futuras e Conclusão**

Esta arquitetura headless cria uma mudança fundamental no desenvolvimento de RPGs com RMMZ.

1. **CI/CD para Balanceamento de Jogo:** É possível rodar "Testes Unitários" para batalhas. Uma regra como "O Chefe X não deve derrotar o Grupo Y em menos de 5 turnos" torna-se um teste automatizado que falha em um pipeline de Integração Contínua (GitHub Actions) sempre que um designer altera os atributos do monstro inadvertidamente.  
2. **Balanceamento Monte Carlo:** Executar 10.000 batalhas em paralelo (usando Node.js Cluster ou Worker Threads) permite gerar mapas de calor de probabilidade para taxas de vitória, ajustando a curva de dificuldade matematicamente em vez de por "sentimento" ("feeling").  
3. **Ambiente de Treinamento de IA:** Esta configuração expõe o sistema de batalha do RMMZ como um ambiente de aprendizado por reforço (semelhante ao OpenAI Gym), permitindo que agentes de IA aprendam estratégias ótimas explorando o espaço de estados do jogo em velocidade acelerada.

A execução de um BattleManager headless do RPG Maker MZ em Node.js é não apenas viável, mas altamente performática. A chave reside na adesão rígida à filosofia de "Caixa Preta", suportada por uma camada abrangente de Shims/Mocks (ADR-015) e um Sync Warp Loop (ADR-029) customizado. Ao virtualizar as interfaces gráficas PIXI e de áudio, e contornar os mecanismos de temporização assíncronos do navegador, alcançamos uma simulação determinística e de alta velocidade capaz de transformar o fluxo de trabalho de balanceamento de jogos.

#### **Referências citadas**

1. RPG Maker MZ \- A Technical Rundown From a Frantic Programmer : r/RPGMaker \- Reddit, acessado em janeiro 4, 2026, [https://www.reddit.com/r/RPGMaker/comments/1hx2ewf/rpg\_maker\_mz\_a\_technical\_rundown\_from\_a\_frantic/](https://www.reddit.com/r/RPGMaker/comments/1hx2ewf/rpg_maker_mz_a_technical_rundown_from_a_frantic/)  
2. Why I Won't Use JSDOM | Epic Web Dev, acessado em janeiro 4, 2026, [https://www.epicweb.dev/why-i-won-t-use-jsdom](https://www.epicweb.dev/why-i-won-t-use-jsdom)  
3. jsdom/jsdom: A JavaScript implementation of various web standards, for use with Node.js \- GitHub, acessado em janeiro 4, 2026, [https://github.com/jsdom/jsdom](https://github.com/jsdom/jsdom)  
4. Web Worker Environment \- PixiJS, acessado em janeiro 4, 2026, [https://pixijs.download/dev/docs/environment.html](https://pixijs.download/dev/docs/environment.html)  
5. pixijs-userland/node: Run PixiJS but in Node.js environments, no browser required\! \- GitHub, acessado em janeiro 4, 2026, [https://github.com/pixijs-userland/node](https://github.com/pixijs-userland/node)  
6. Client side javascript in a node.js environment using jsdom \- Dustin Pfister \- GitHub Pages, acessado em janeiro 4, 2026, [https://dustinpfister.github.io/2018/01/11/nodejs-jsdom/](https://dustinpfister.github.io/2018/01/11/nodejs-jsdom/)  
7. PIXI.js V8. Next generation of RPG Maker is possible ? | Page 3, acessado em janeiro 4, 2026, [https://forums.rpgmakerweb.com/index.php?threads/pixi-js-v8-next-generation-of-rpg-maker-is-possible.161775/page-3](https://forums.rpgmakerweb.com/index.php?threads/pixi-js-v8-next-generation-of-rpg-maker-is-possible.161775/page-3)  
8. MZ \- Looking for window examples\! \- RPG Maker Forums, acessado em janeiro 4, 2026, [https://forums.rpgmakerweb.com/index.php?threads/looking-for-window-examples.144524/](https://forums.rpgmakerweb.com/index.php?threads/looking-for-window-examples.144524/)  
9. RMMZ Changelog \- Yanfly.moe Wiki, acessado em janeiro 4, 2026, [http://www.yanfly.moe/wiki/RMMZ\_Changelog](http://www.yanfly.moe/wiki/RMMZ_Changelog)  
10. WebAudio.js \- RPG Maker MZ API Documentation, acessado em janeiro 4, 2026, [https://rpgmakerofficial.com/product/mz/rmmz\_api/WebAudio.js.html](https://rpgmakerofficial.com/product/mz/rmmz_api/WebAudio.js.html)  
11. standardized-audio-context-mock \- NPM, acessado em janeiro 4, 2026, [https://www.npmjs.com/package/standardized-audio-context-mock](https://www.npmjs.com/package/standardized-audio-context-mock)  
12. Web Audio API \- MDN Web Docs \- Mozilla, acessado em janeiro 4, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/Web\_Audio\_API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)  
13. Audio Lag Fix | RPG Maker Forums, acessado em janeiro 4, 2026, [https://forums.rpgmakerweb.com/index.php?threads/audio-lag-fix.73031/](https://forums.rpgmakerweb.com/index.php?threads/audio-lag-fix.73031/)  
14. Solid understanding to the default RMMV battle flow implementations \- RPG Maker Forums, acessado em janeiro 4, 2026, [https://forums.rpgmakerweb.com/index.php?threads/solid-understanding-to-the-default-rmmv-battle-flow-implementations.57255/](https://forums.rpgmakerweb.com/index.php?threads/solid-understanding-to-the-default-rmmv-battle-flow-implementations.57255/)  
15. RPG Maker MZ Plugin Tutorial Part 2: Overriding Engine Functions : r/RPGMaker \- Reddit, acessado em janeiro 4, 2026, [https://www.reddit.com/r/RPGMaker/comments/13g3k5d/rpg\_maker\_mz\_plugin\_tutorial\_part\_2\_overriding/](https://www.reddit.com/r/RPGMaker/comments/13g3k5d/rpg_maker_mz_plugin_tutorial_part_2_overriding/)  
16. MV \- Why is SceneManager.renderScene() called on every requested frame? | RPG Maker Forums, acessado em janeiro 4, 2026, [https://forums.rpgmakerweb.com/index.php?threads/why-is-scenemanager-renderscene-called-on-every-requested-frame.169623/](https://forums.rpgmakerweb.com/index.php?threads/why-is-scenemanager-renderscene-called-on-every-requested-frame.169623/)  
17. MZ \- Plugin help for making Battle Skill Invocation Repeats that inflict status effects have no delay in battle | RPG Maker Forums, acessado em janeiro 4, 2026, [https://forums.rpgmakerweb.com/index.php?threads/plugin-help-for-making-battle-skill-invocation-repeats-that-inflict-status-effects-have-no-delay-in-battle.159510/](https://forums.rpgmakerweb.com/index.php?threads/plugin-help-for-making-battle-skill-invocation-repeats-that-inflict-status-effects-have-no-delay-in-battle.159510/)  
18. How to make the Battle Log wait for button input? \- RPG Maker Forums, acessado em janeiro 4, 2026, [https://forums.rpgmakerweb.com/index.php?threads/how-to-make-the-battle-log-wait-for-button-input.84060/](https://forums.rpgmakerweb.com/index.php?threads/how-to-make-the-battle-log-wait-for-button-input.84060/)  
19. looking for a way to fast forward RPG Maker MZ games without needing to make code. : r/RPGMaker \- Reddit, acessado em janeiro 4, 2026, [https://www.reddit.com/r/RPGMaker/comments/1als6vb/looking\_for\_a\_way\_to\_fast\_forward\_rpg\_maker\_mz/](https://www.reddit.com/r/RPGMaker/comments/1als6vb/looking_for_a_way_to_fast_forward_rpg_maker_mz/)  
20. Slow down battle text | RPG Maker Forums, acessado em janeiro 4, 2026, [https://forums.rpgmakerweb.com/index.php?threads/slow-down-battle-text.161371/](https://forums.rpgmakerweb.com/index.php?threads/slow-down-battle-text.161371/)  
21. RPG Maker MZ Data Management | PDF | Computer Data | Software \- Scribd, acessado em janeiro 4, 2026, [https://www.scribd.com/document/721768932/Rmmz-Managers](https://www.scribd.com/document/721768932/Rmmz-Managers)  
22. DataManager loading a custom JSON file \- RPG Maker Forums, acessado em janeiro 4, 2026, [https://forums.rpgmakerweb.com/index.php?threads/datamanager-loading-a-custom-json-file.119654/](https://forums.rpgmakerweb.com/index.php?threads/datamanager-loading-a-custom-json-file.119654/)  
23. RPGMakerMV & Node.js Part 1: Reading And Writing Files | RPG Maker Forums, acessado em janeiro 4, 2026, [https://forums.rpgmakerweb.com/index.php?threads/rpgmakermv-node-js-part-1-reading-and-writing-files.80140/](https://forums.rpgmakerweb.com/index.php?threads/rpgmakermv-node-js-part-1-reading-and-writing-files.80140/)  
24. imagemanager \- RPG Maker Forums, acessado em janeiro 4, 2026, [https://forums.rpgmakerweb.com/index.php?tags/imagemanager/](https://forums.rpgmakerweb.com/index.php?tags/imagemanager/)  
25. MV \- How to properly load and show pictures in a Window??? | RPG \- RPG Maker Forums, acessado em janeiro 4, 2026, [https://forums.rpgmakerweb.com/index.php?threads/how-to-properly-load-and-show-pictures-in-a-window.140819/](https://forums.rpgmakerweb.com/index.php?threads/how-to-properly-load-and-show-pictures-in-a-window.140819/)  
26. Pixi Filters Documentation \- Casper Gaming's Developer Corner, acessado em janeiro 4, 2026, [https://www.caspergaming.com/plugins/cgmz/pixifilters/documentation/](https://www.caspergaming.com/plugins/cgmz/pixifilters/documentation/)