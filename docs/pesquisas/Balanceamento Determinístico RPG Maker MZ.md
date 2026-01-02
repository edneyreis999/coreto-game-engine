# **Engenharia e Arquitetura para Balanceamento Determinístico em RPGs de Turno: Um Framework de Tooling para RPG Maker MZ e VisuStella**

## **Resumo Executivo**

O desenvolvimento de Role-Playing Games (RPGs) baseados em turnos no ecossistema RPG Maker MZ (RMMZ) enfrenta um desafio estrutural crítico: a dissonância entre a acessibilidade da interface gráfica do editor e a necessidade de rigor matemático exigida pelo design de sistemas avançado. A introdução da suíte de plugins VisuStella MZ, embora enriqueça as capacidades mecânicas do motor, introduz uma camada de opacidade ("black box") devido à ofuscação de código, dificultando a análise estática e a validação de fórmulas de combate. Este relatório técnico propõe a arquitetura de um "Wrapper de Verdade" (Source of Truth Wrapper) — uma camada de ferramental externa baseada em Node.js e Jest. Esta solução visa desacoplar a definição matemática do equilíbrio (design) da sua implementação (runtime), permitindo a geração determinística de dados baseada em âncoras, a injeção automatizada de curvas de progressão e a simulação de Time to Kill (TTK) em ambientes de Integração Contínua (CI) headless. A análise a seguir detalha a fundamentação matemática, a engenharia reversa comportamental necessária para interoperar com a VisuStella e a implementação de testes unitários que emulam o núcleo do RMMZ.

## ---

**1\. Fundamentação Teórica: Design Matemático e Determinismo**

Para arquitetar um wrapper capaz de impor equilíbrio a um sistema complexo, é imperativo estabelecer primeiro os axiomas matemáticos que regerão a "Fonte da Verdade". Em um ambiente de RPG de turno, o equilíbrio não é um estado estático de igualdade, mas uma interação dinâmica e previsível de desigualdades controladas ao longo do tempo. O objetivo desta seção é definir os modelos matemáticos que o wrapper Node.js deverá processar antes de tocar em qualquer arquivo JSON do RPG Maker.

### **1.1 O Paradigma do Design Baseado em Âncoras**

A abordagem tradicional de preencher bancos de dados de RPGs — inserindo valores manualmente para cada monstro ou item — é insustentável para projetos de média e longa escala. Ela resulta em curvas de dificuldade "dente de serra", onde a experiência do jogador oscila imprevisivelmente entre o trivial e o impossível. A solução de engenharia para este problema é o "Design Baseado em Âncoras" (Anchor-Based Design), conforme teorizado por designers sistêmicos como Ian Schreiber.1

Neste paradigma, o designer não define os atributos de cada entidade individualmente. Em vez disso, define-se um conjunto esparso de "Âncoras" — pontos fixos no espaço cartesiano de *Nível x Poder* — que representam a experiência de jogo idealizada em marcos críticos. O wrapper atua, então, como um motor de interpolação, preenchendo o vácuo entre essas âncoras com curvas matematicamente perfeitas.

#### **1.1.1 Definição Vetorial das Âncoras**

Para um sistema RMMZ determinístico, uma âncora não é um único número, mas um vetor de estado que descreve a interação de combate desejada. O wrapper deve aceitar como entrada (via arquivos de configuração YAML/JSON) definições de âncoras como:

| Âncora (Level) | HP Jogador | TTK Alvo (Turnos) | Dano Inimigo (Derivado) | Ações p/ Matar Inimigo |
| :---- | :---- | :---- | :---- | :---- |
| **Early ($L=1$)** | 100 | 3 | 34 | 3 |
| **Mid ($L=25$)** | 2500 | 4 | 625 | 5 |
| **End ($L=50$)** | 9999 | 6 | 1666 | 8 |

A "Fonte da Verdade" calcula o *Dano Inimigo* não como um valor arbitrário, mas como uma função derivada: $Dano\_{inimigo} \= \\lceil HP\_{jogador} / TTK\_{alvo} \\rceil$. Isso garante que, se o designer decidir alterar o HP do jogador na âncora inicial, todo o dano dos inimigos do jogo será recalculado automaticamente para manter o TTK de 3 turnos, preservando a integridade do design.3

### **1.2 Topologia das Curvas de Progressão**

Uma vez estabelecidas as âncoras, o wrapper deve utilizar funções matemáticas para gerar os valores intermediários. A escolha da função de interpolação define a "sensação" de progressão do jogo. Em contextos de RPG Maker, onde os números tendem a inflacionar, o controle sobre a derivada da curva é essencial.5

#### **1.2.1 Curvas Lineares vs. Geométricas**

O wrapper deve implementar classes utilitárias em TypeScript/JavaScript para processar dois tipos primários de crescimento:

1. **Crescimento Linear ($f(x) \= mx \+ b$):** Utilizado para atributos primários (Força, Defesa) em sistemas onde a mitigação de dano é subtrativa. A linearidade garante que a relação entre Ataque e Defesa permaneça legível para o jogador. O wrapper calcula a inclinação $m$ baseada na diferença entre as âncoras $A\_{end}$ e $A\_{base}$.  
2. **Crescimento Geométrico/Exponencial ($f(x) \= a(1 \+ r)^x$):** Essencial para custos de XP e curvas de economia (Ouro). Em RPGs, o tempo necessário para ganhar um nível deve aumentar progressivamente (logarítmico em relação ao XP, o que implica XP exponencial em relação ao nível). O wrapper deve resolver a taxa de crescimento $r$ tal que $Val(L\_{max}) \\approx A\_{end}$.5

#### **1.2.2 A Curva Logística para Probabilidades**

Para atributos percentuais limitados (Hit Rate, Critical Chance, Evasion), o wrapper não deve utilizar funções lineares ou exponenciais, pois estas rompem rapidamente os limites de 0% ou 100%. A implementação correta utiliza a Função Sigmoide ou Logística, que possui assíntotas horizontais naturais.

$$P(L) \= \\frac{L\_{max}}{1 \+ e^{-k(L \- L\_0)}}$$

Isso permite que o wrapper gere, por exemplo, uma curva de Crítico que cresce rapidamente no meio do jogo (níveis 20-30) mas desacelera conforme se aproxima do "soft cap" de 100%, sem nunca excedê-lo matematicamente, garantindo a integridade dos dados injetados no JSON do RMMZ.

### **1.3 Matemática do Time to Kill (TTK) e HP Efetivo**

O Time to Kill é a métrica soberana do balanceamento. No entanto, calcular o TTK apenas com HP nominal é insuficiente devido às mecânicas de mitigação (Defesa, Resistência Elemental, Buffs). O wrapper deve operar com o conceito de **HP Efetivo (EHP)**.

O EHP normaliza a sobrevivência de um personagem convertendo mitigação em "pontos de vida virtuais".

* Para mitigação percentual (comum em plugins VisuStella com Armor Penetration):

  $$EHP \= \\frac{HP\_{nominal}}{1 \- Mitigação\\%}$$  
* Para mitigação subtrativa (padrão RMMZ):

  $$EHP(Ataque) \= \\frac{HP\_{nominal} \\times Ataque}{Ataque \- Defesa}$$

A complexidade introduzida pela VisuStella reside na alteração das fórmulas de mitigação. O wrapper deve ser configurado para simular o *comportamento* da fórmula VisuStella (extraída via engenharia reversa dos parâmetros, ver Seção 2\) para calcular o EHP correto. Se o plugin VisuStella define que a defesa reduz o dano em (Defesa / (Defesa \+ 100)), o wrapper deve usar exatamente esta função em seus testes unitários para prever o TTK.4

### **1.4 Determinismo em Ambientes Estocásticos**

RPGs são inerentemente estocásticos (RNG, Variância, Críticos). Para que o wrapper sirva como "Fonte da Verdade", ele deve ser capaz de converter processos estocásticos em valores determinísticos para fins de validação. Isso é realizado através do cálculo do **Valor Esperado ($E\[X\]$)**.

Ao validar se um "Goblin" é derrotado em 3 turnos, o teste automatizado não deve "rolar dados". Ele deve usar a média ponderada:

$$E \= (Dano\_{base} \\times (1 \- P\_{crit} \- P\_{miss})) \+ (Dano\_{crit} \\times P\_{crit}) \+ (0 \\times P\_{miss})$$

No ambiente de teste Jest, o gerador de números aleatórios (Math.random) deve ser "mockado" (substituído) por uma função que retorna um valor fixo (ex: 0.5) ou iterado em uma simulação de Monte Carlo para verificar os extremos da curva de variância.3

## ---

**2\. Engenharia Reversa e Integração com VisuStella MZ**

A integração com a suíte VisuStella representa o maior desafio técnico devido à ofuscação do código fonte.9 Não podemos ler diretamente a lógica interna; portanto, a arquitetura deve tratar a VisuStella como uma "Black Box API", onde controlamos rigorosamente as entradas (Parâmetros e Notetags) e verificamos as saídas (Comportamento em Teste).

### **2.1 Análise da Estrutura de plugins.js**

Diferente dos dados padrão do RMMZ ($dataActors, $dataSkills), as configurações dos plugins VisuStella residem no arquivo js/plugins.js. Este arquivo não é um JSON puro, mas um script JS que define uma variável global $plugins.

A estrutura de dados dos parâmetros VisuStella é notoriamente complexa. Eles frequentemente utilizam "JSON strings" aninhadas dentro de valores de parâmetros.

* *Exemplo de Estrutura:* Um parâmetro chamado Mechanics pode conter uma string que, ao ser parseada, revela outro objeto JSON com chaves como Damage Formula, Critical Cap, etc.  
* *Estratégia do Wrapper:* O wrapper Node.js deve possuir um parser robusto capaz de ler o arquivo plugins.js como texto, extrair o bloco de parâmetros do plugin VisuMZ\_1\_BattleCore, e realizar o *JSON.parse* recursivo nos valores. Isso permite que a "Fonte da Verdade" injete constantes de balanceamento (ex: alterar o multiplicador de crítico global) diretamente na configuração do plugin, sem interação humana no editor.11

### **2.2 Desconstrução das Fórmulas de Dano VisuStella**

Com base na pesquisa 13, a VisuStella substitui o avaliador de fórmula padrão (eval) por um sistema de "Damage Styles". O wrapper precisa replicar a lógica do estilo escolhido para que as simulações de TTK sejam precisas.

A fórmula observada para o "Estilo Padrão" da VisuStella tende a seguir o padrão:

1. **Dano Base:** Definido pelo poder da habilidade \+ atributo do usuário (ATK/MAT).  
2. **Mitigação:** Subtração da Defesa ou Resistência Mágica, frequentemente ajustada por parâmetros de "Penetração de Armadura" e "Redução de Armadura" que são exclusivos da VisuStella.  
3. **Multiplicadores:** Aplicação de *Damage Rate*, *Critical Damage*, e *Elemental Rate*.  
4. **Scaling:** A VisuStella introduz conceitos de "Stat Scale" e "Damage Scale" nos parâmetros do Battle Core, que aplicam multiplicadores globais ou curvas de ajuste ao resultado final.

O wrapper deve conter uma classe VisuStellaEmulator que replica essa pipeline. Se a VisuStella usa (a.atk \* power) \- (b.def \* armor\_scale), o emulador deve usar a mesma lógica. A validação dessa replicação é feita comparando o resultado do emulador com logs de dano reais extraídos de uma execução de teste do jogo.14

### **2.3 Gerenciamento de Parâmetros Customizados (Custom Parameters)**

Uma das funcionalidades mais poderosas da VisuStella é a criação de Parâmetros Customizados (ex: Strength, Vitality, Dexterity) que não existem nativamente no RMMZ.16 O balanceamento determinístico exige controle total sobre esses novos status.

O wrapper deve automatizar a injeção destes parâmetros via **Notetags**.

* *Problema:* Inserir manualmente \<JS Parameter: STR\> em 50 classes e 200 inimigos é propenso a erro.  
* *Solução:* O wrapper gera as notetags programaticamente baseadas nas curvas calculadas na Seção 1\. O script percorre o arquivo Classes.json, localiza o campo note, remove qualquer definição anterior de parâmetros customizados (usando Regex) e insere o novo bloco de configuração calculado.  
  * Exemplo de Injeção: \<JS Base Param: STR\> return level \* 2.5 \+ 10; \</JS Base Param\>  
    Isso garante que a curva de crescimento do parâmetro customizado seja exatamente a definida pela função matemática do wrapper, eliminando a discrepância entre design e implementação.18

### **2.4 Action Sequences como Variáveis de Tempo**

As "Action Sequences" da VisuStella transformam o combate em eventos cinemáticos.19 Para o balanceamento de TTK, o visual não importa, mas o **tempo** sim. Uma animação de ataque que leva 120 frames (2 segundos) afeta o DPS (Dano por Segundo) real do jogador, embora RPGs de turno foquem em Dano por Ação (DPA).

Entretanto, em sistemas Active Time Battle (ATB) ou Time Progress Battle (TPB), que são suportados pela VisuStella, a duração da animação *bloqueia* o turno do personagem. O wrapper deve ser capaz de ler as configurações de Action Sequence (geralmente em Common Events) e estimar o "Custo de Tempo" da ação.

* Se a sequência possui comandos WAIT: 60, o wrapper deve somar esses valores para calcular o "Cooldown Implícito" da habilidade no modelo de simulação. Isso é vital para balancear habilidades rápidas vs. habilidades lentas em sistemas ATB.20

## ---

**3\. Arquitetura do Wrapper: "Source of Truth"**

A solução proposta inverte o fluxo de trabalho tradicional do RPG Maker. Em vez de o Editor ser a fonte da verdade, ele se torna apenas um visualizador. A verdade reside em arquivos de configuração (YAML/JSON) processados pelo wrapper.

### **3.1 Pipeline de Dados Unidirecional**

O fluxo de dados deve ser estritamente unidirecional para garantir a integridade referencial:

1. **Camada de Definição (Input):** Arquivos YAML definem as Âncoras, Curvas, Definições de Classes e Inimigos. Este é o único ponto de entrada manual.  
2. **Motor de Processamento (Node.js):**  
   * Lê as definições.  
   * Aplica as funções matemáticas (Linear, Sigmoide, etc.).  
   * Gera os objetos de dados completos (Stat Blocks para cada nível de 1 a 99).  
3. **Camada de Validação (Linter):** Verifica se os dados gerados violam regras de integridade do RMMZ (ex: HP \> 0, MP \< 9999\) ou regras de design (ex: Dano do Boss Lvl 10 \> HP do Jogador Lvl 10).  
4. **Camada de Injeção (Output):** O wrapper serializa os objetos validados e sobrescreve os arquivos data/Classes.json, data/Enemies.json, data/Skills.json e modifica o js/plugins.js.22

### **3.2 Manipulação de Arquivos JSON do RMMZ**

O wrapper deve utilizar o módulo fs do Node.js para manipulação de arquivos de baixo nível. É crucial entender o schema dos arquivos do RMMZ.22

* **Classes.json:** Contém a matriz params. O wrapper deve gerar uma matriz \`\` (8 status, 99 níveis \+ índice 0\) preenchida com os valores interpolados.  
* **Enemies.json:** Diferente de classes, inimigos geralmente têm status fixos. O wrapper deve injetar os valores baseados no nível do inimigo (definido no YAML) e na curva de poder correspondente àquele nível.  
* **Skills.json:** O campo damage.formula é uma string. O wrapper deve construir essa string dinamicamente. Se o design mudar de uma fórmula subtrativa para uma divisiva, o wrapper regera todas as fórmulas de todas as habilidades em uma única execução, garantindo consistência global.25

### **3.3 Tratamento de Assets Gráficos e Metadados**

Embora o foco seja numérico, o wrapper deve preservar metadados visuais. Ao sobrescrever o Classes.json, o wrapper deve ler o arquivo original primeiro, preservar os campos de name, note (que não sejam de status) e referências a gráficos (characterName, faceName), e apenas atualizar os campos numéricos. Isso impede que o balanceamento destrua o trabalho artístico configurado no editor.27

## ---

**4\. Ambiente de Simulação Headless com Jest e JSDOM**

Para validar o equilíbrio, é necessário executar o código do jogo. Fazer isso manualmente é lento e impreciso. A solução é criar um ambiente "Headless" (sem interface gráfica) que roda o motor do RMMZ dentro de testes automatizados usando Jest.

### **4.1 Emulação do Browser em Node.js**

O RPG Maker MZ é uma aplicação web baseada em HTML5, dependendo de objetos globais como window, document, e XMLHttpRequest. O Node.js não possui esses objetos nativamente.

#### **4.1.1 Configuração do JSDOM**

A biblioteca **JSDOM** é essencial para recriar o ambiente do navegador. O arquivo de setup do Jest deve instanciar um ambiente JSDOM antes de carregar qualquer script do RMMZ.28

JavaScript

// jest.config.js  
module.exports \= {  
  testEnvironment: 'jsdom',  
  setupFiles: \['./tests/setup/rmmz\_mocks.js'\],  
  moduleNameMapper: {  
    // Mocks para arquivos estáticos que o Jest não processa  
    '\\\\.(jpg|png|ogg)$': '\<rootDir\>/tests/mocks/fileMock.js',  
  },  
};

### **4.2 Estratégia de Mocking e Stubbing**

O RMMZ utiliza bibliotecas pesadas como **PIXI.js** (renderização) e **Effekseer** (partículas). Estas bibliotecas tentam acessar o Canvas e WebGL, que não funcionam bem (ou de todo) no JSDOM. Para testes de balanceamento, a renderização é irrelevante; apenas os números importam. Portanto, devemos "mockar" (substituir por objetos falsos) essas dependências.30

#### **4.2.1 Mocking do PIXI e Graphics**

O wrapper deve injetar stubs para PIXI e Graphics no escopo global antes de carregar o rmmz\_core.js. O uso de jest-canvas-mock é altamente recomendado para evitar erros quando o RMMZ tenta criar elementos de Canvas contextuais.32

JavaScript

// tests/setup/rmmz\_mocks.js  
global.PIXI \= {  
    Container: class { addChild() {} removeChild() {} },  
    Sprite: class { constructor() { this.anchor \= {x:0, y:0}; } },  
    // Stubs adicionais conforme necessário para evitar crash  
};  
global.Graphics \= {  
    initialize: () \=\> {},  
    render: () \=\> {},  
    frameCount: 0  
};

#### **4.2.2 O Problema do Effekseer**

Effekseer é carregado como um módulo WASM (effekseer.wasm). O JSDOM falhará ao tentar carregar binários WASM. É crítico mockar o objeto global effekseer para evitar que a inicialização de batalha trave. Snippets indicam que falhas no carregamento do Effekseer são comuns e fatais.31 O mock deve interceptar chamadas como effekseer.initRuntime e effekseer.update.

### **4.3 Carregamento Síncrono da Database**

Em produção, o RMMZ carrega dados via XMLHttpRequest (assíncrono). Em testes unitários, isso gera condições de corrida e complexidade desnecessária. O wrapper deve sobrescrever o DataManager.loadDataFile para usar o fs.readFileSync do Node.js, carregando os JSONs (gerados pelo próprio wrapper) instantaneamente.36

## ---

**5\. Simulação de TTK e Validação Automatizada**

Com o ambiente emulado operante, podemos implementar a validação lógica. O objetivo não é testar se o código funciona (isso é responsabilidade da VisuStella/KADOKAWA), mas se o **Design** funciona.

### **5.1 Testes de Unidade de Fórmula de Dano**

O primeiro nível de teste valida se a fórmula de dano (incluindo as modificações da VisuStella) produz os resultados esperados.

**Cenário de Teste:**

1. Instanciar Game\_Actor (Herói Lvl 10\) e Game\_Enemy (Orc Lvl 10).  
2. Forçar atributos deterministicamente (ex: Herói ATK \= 50, Orc DEF \= 30).  
3. Instanciar Game\_Action configurada com a habilidade "Ataque".  
4. Executar action.makeDamageValue(orc).  
5. Comparar o resultado com o Valor Esperado calculado pela "Fonte da Verdade".

Se houver discrepância, isso indica que ou a fórmula no JSON está errada, ou a VisuStella está aplicando modificadores ocultos (ex: redução de dano por script) que o designer não contabilizou. Isso força o "desmascaramento" da lógica oculta.8

### **5.2 Simulação de Batalha (Monte Carlo Headless)**

Para validar o TTK, o wrapper deve executar simulações de batalha completas.

**Algoritmo de Simulação:**

1. **Setup:** Cria uma Batalha (BattleManager.setup) com a Party e Troop definidas na âncora.  
2. **Loop de Turnos:**  
   * Itera turnos até a vitória ou derrota.  
   * Em cada passo, simula a escolha de ação da IA (ou força uma rotação ótima para teste de stress).  
   * Executa as ações chamando action.apply().  
   * Registra dano causado, recursos gastos (MP/TP) e estados aplicados.  
3. **Coleta de Métricas:** Ao final, retorna:  
   * Turnos Totais.  
   * HP Restante da Party.  
   * Dano Total por Personagem.  
4. **Assertividade:** O teste Jest falha se Turnos Totais \> TTK Alvo \+ Tolerância.

Este processo deve ser repetido centenas de vezes (Monte Carlo) em segundos, variando as "seeds" de RNG (se o RNG não estiver mockado) para gerar um mapa de calor de probabilidade de vitória.39

### **5.3 Integração Contínua (CI)**

Todo este ecossistema deve ser encapsulado em um pipeline de CI (como GitHub Actions).

* **Trigger:** Push no repositório.  
* **Job 1 (Build):** O wrapper processa os YAMLs e gera os JSONs.  
* **Job 2 (Test):** O Jest roda a suíte de simulação de batalha usando os JSONs gerados.  
* **Relatório:** Se o TTK do Boss do Capítulo 3 subiu de 10 para 20 turnos devido a uma mudança na fórmula de defesa, o CI falha e bloqueia o merge, alertando o designer.41

## ---

**6\. Conclusão e Plano de Estudos Curado**

A implementação desta arquitetura transforma o desenvolvimento de RPG Maker de uma atividade artesanal propensa a erros em uma disciplina de engenharia de software rigorosa. Ao tratar a VisuStella e o RMMZ como componentes de uma pipeline de dados controlada por um wrapper externo, recuperamos o controle determinístico sobre o balanceamento.

A opacidade da VisuStella é contornada não pela leitura de seu código, mas pelo encapsulamento de seus comportamentos em testes de caixa preta e pela injeção programática de seus parâmetros de configuração. O uso de Jest e JSDOM permite que validações complexas de TTK, que levariam horas em playtest manual, sejam executadas em segundos a cada alteração de design.

### **Roteiro de Implementação (Study Plan)**

Para concretizar esta visão, recomenda-se a seguinte progressão de estudos e desenvolvimento:

1. **Fundamentos de Node.js e File System:**  
   * Estudar manipulação de arquivos (fs), streams e parsing de JSON.  
   * *Meta:* Criar script que lê Skills.json, altera uma fórmula e salva.  
   * *Recursos:* 37 (Node em RMMV)22 (Estrutura JSON).  
2. **Matemática de Design:**  
   * Estudar curvas de progressão (Lineares vs. Logísticas) e EHP.  
   * *Meta:* Implementar classe CurveGenerator que aceita âncoras e retorna array de valores.  
   * *Recursos:* 5 (Curvas)1 (Livro Game Balance).  
3. **Ambiente de Teste (Jest/JSDOM):**  
   * Configurar Jest com JSDOM. Aprender a mockar globais (window, Graphics).  
   * *Meta:* Conseguir instanciar um Game\_Actor dentro de um teste Jest sem o RMMZ travar.  
   * *Recursos:* 28 (Headless Testing)29 (JSDOM)30 (Mocking PIXI/Canvas).  
4. **Engenharia Reversa de VisuStella:**  
   * Analisar plugins.js e a estrutura de parâmetros.  
   * *Meta:* Criar parser que injeta configurações no VisuMZ\_1\_BattleCore.  
   * *Recursos:* 11 (Análise de Fórmulas e Parâmetros).  
5. **Automação de Simulação:**  
   * Escrever testes que rodam loops de batalha (BattleManager).  
   * *Meta:* Teste que valida se "Atacar" causa dano correto considerando defesa.  
   * *Recursos:* (Game\_Action mock)38 (Lógica de Hit).

## ---

**Tabelas de Referência**

### **Comparativo: Abordagem Tradicional vs. Wrapper Determinístico**

| Característica | Abordagem Tradicional (Editor) | Abordagem Wrapper (Proposta) |
| :---- | :---- | :---- |
| **Entrada de Dados** | Manual, célula a célula no Database | Arquivos de Configuração (YAML) com Âncoras |
| **Validação** | Playtest manual (subjetivo) | Testes Automatizados Jest (objetivo) |
| **VisuStella** | Configuração via UI do Plugin Manager | Injeção direta em plugins.js e Notetags geradas |
| **Curvas** | Limitadas às ferramentas do editor | Matemáticas complexas (Sigmoide, Bezier) |
| **TTK** | "Parece bom" (Gut feeling) | Validado via simulação de Monte Carlo |
| **Controle de Versão** | Difícil (JSONs monolíticos mudam muito) | Fácil (YAMLs de configuração são limpos) |

### **Mapeamento de Arquivos Críticos do RMMZ**

| Arquivo (data/) | Responsabilidade do Wrapper | Risco de Corrupção |
| :---- | :---- | :---- |
| Classes.json | Injetar curvas de status e notetags VisuStella. | Médio (Preservar IDs) |
| Skills.json | Injetar fórmulas de dano e metadados de custo. | Baixo |
| Enemies.json | Injetar status baseados no Nível do inimigo. | Médio |
| System.json | Ler configurações globais (não sobrescrever). | Alto |
| js/plugins.js | Injetar parâmetros de configuração dos plugins. | Crítico (Sintaxe estrita) |

#### **Referências citadas**

1. Game Balance | Ian Schreiber, Brenda Romero \- Taylor & Francis eBooks, acessado em janeiro 2, 2026, [https://www.taylorfrancis.com/books/mono/10.1201/9781315156422/game-balance-ian-schreiber-brenda-romero](https://www.taylorfrancis.com/books/mono/10.1201/9781315156422/game-balance-ian-schreiber-brenda-romero)  
2. Game Balance by Ian Schreiber | Goodreads, acessado em janeiro 2, 2026, [https://www.goodreads.com/book/show/60030450-game-balance](https://www.goodreads.com/book/show/60030450-game-balance)  
3. Game Balance | PDF | Determinism | Poker \- Scribd, acessado em janeiro 2, 2026, [https://www.scribd.com/document/81031658/Game-Balance](https://www.scribd.com/document/81031658/Game-Balance)  
4. For a turn based RPG, how do you determine the "math" in regards to encounter design? : r/gamedesign \- Reddit, acessado em janeiro 2, 2026, [https://www.reddit.com/r/gamedesign/comments/1oqv557/for\_a\_turn\_based\_rpg\_how\_do\_you\_determine\_the/](https://www.reddit.com/r/gamedesign/comments/1oqv557/for_a_turn_based_rpg_how_do_you_determine_the/)  
5. The Mathematics of Game Balance | Blog \- UserWise, acessado em janeiro 2, 2026, [https://blog.userwise.io/blog/the-mathematics-of-game-balance](https://blog.userwise.io/blog/the-mathematics-of-game-balance)  
6. Game Balance, acessado em janeiro 2, 2026, [https://api.pageplace.de/preview/DT0400.9781498799584\_A38640931/preview-9781498799584\_A38640931.pdf](https://api.pageplace.de/preview/DT0400.9781498799584_A38640931/preview-9781498799584_A38640931.pdf)  
7. Blog Post All About Damage Formulas : r/gamedesign \- Reddit, acessado em janeiro 2, 2026, [https://www.reddit.com/r/gamedesign/comments/1aml0e2/blog\_post\_all\_about\_damage\_formulas/](https://www.reddit.com/r/gamedesign/comments/1aml0e2/blog_post_all_about_damage_formulas/)  
8. MZ \- Hit, Evasion and Game\_Action.prototype.apply \= function(target) | RPG Maker Forums, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/hit-evasion-and-game\_action-prototype-apply-function-target.179483/](https://forums.rpgmakerweb.com/index.php?threads/hit-evasion-and-game_action-prototype-apply-function-target.179483/)  
9. VisuStella BattleCore Help : r/RPGMaker \- Reddit, acessado em janeiro 2, 2026, [https://www.reddit.com/r/RPGMaker/comments/ipxyr4/visustella\_battlecore\_help/](https://www.reddit.com/r/RPGMaker/comments/ipxyr4/visustella_battlecore_help/)  
10. How to read visuStella code--or where is it | RPG Maker Forums, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/how-to-read-visustella-code-or-where-is-it.125598/](https://forums.rpgmakerweb.com/index.php?threads/how-to-read-visustella-code-or-where-is-it.125598/)  
11. VisuStella MZ \- Yanfly.moe Wiki, acessado em janeiro 2, 2026, [http://www.yanfly.moe/wiki/VisuStella\_MZ](http://www.yanfly.moe/wiki/VisuStella_MZ)  
12. Beginner's Guide to Plugins \- RPG Maker MZ \- Steam Community, acessado em janeiro 2, 2026, [https://steamcommunity.com/sharedfiles/filedetails/?l=danish\&id=2470222580](https://steamcommunity.com/sharedfiles/filedetails/?l=danish&id=2470222580)  
13. Visustella Battle Core Damage Formulae : r/RPGMaker \- Reddit, acessado em janeiro 2, 2026, [https://www.reddit.com/r/RPGMaker/comments/1bcj9w4/visustella\_battle\_core\_damage\_formulae/](https://www.reddit.com/r/RPGMaker/comments/1bcj9w4/visustella_battle_core_damage_formulae/)  
14. MZ \- Need help with Visustella battle core damage styles | RPG Maker Forums, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/need-help-with-visustella-battle-core-damage-styles.181411/](https://forums.rpgmakerweb.com/index.php?threads/need-help-with-visustella-battle-core-damage-styles.181411/)  
15. Can't figure out Visustella damage styles. :: RPG Maker MZ General Discussions, acessado em janeiro 2, 2026, [https://steamcommunity.com/app/1096900/discussions/0/727997490786214750/](https://steamcommunity.com/app/1096900/discussions/0/727997490786214750/)  
16. MZ \- Visustella Custom Parameters help \- RPG Maker Forums, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/visustella-custom-parameters-help.177294/](https://forums.rpgmakerweb.com/index.php?threads/visustella-custom-parameters-help.177294/)  
17. How to use VisuStella Custom Parameters \- RPG Maker Forums, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/how-to-use-visustella-custom-parameters.160140/](https://forums.rpgmakerweb.com/index.php?threads/how-to-use-visustella-custom-parameters.160140/)  
18. \[VisuStella MZ addon\] Custom Parameters with leveling and gearing \- RPG Maker Forums, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/visustella-mz-addon-custom-parameters-with-leveling-and-gearing.132760/](https://forums.rpgmakerweb.com/index.php?threads/visustella-mz-addon-custom-parameters-with-leveling-and-gearing.132760/)  
19. Battle Core VisuStella MZ \- Yanfly.moe Wiki, acessado em janeiro 2, 2026, [http://www.yanfly.moe/wiki/Battle\_Core\_VisuStella\_MZ](http://www.yanfly.moe/wiki/Battle_Core_VisuStella_MZ)  
20. MZ \- VisuMZ Battle Core Default Action Sequence Order | RPG Maker Forums, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/visumz-battle-core-default-action-sequence-order.178048/](https://forums.rpgmakerweb.com/index.php?threads/visumz-battle-core-default-action-sequence-order.178048/)  
21. MZ \- VisuStella Action Sequence help? Trying to make a hybrid skill \- RPG Maker Forums, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/visustella-action-sequence-help-trying-to-make-a-hybrid-skill.177923/](https://forums.rpgmakerweb.com/index.php?threads/visustella-action-sequence-help-trying-to-make-a-hybrid-skill.177923/)  
22. RPG Maker MZ Script Call Reference | PDF | Array Data Type | Json \- Scribd, acessado em janeiro 2, 2026, [https://www.scribd.com/document/558127301/Copy-of-RPG-Maker-MZ-Script-Call-Reference](https://www.scribd.com/document/558127301/Copy-of-RPG-Maker-MZ-Script-Call-Reference)  
23. save editor WITH items & data json ability? : r/RPGMaker \- Reddit, acessado em janeiro 2, 2026, [https://www.reddit.com/r/RPGMaker/comments/1ll32th/save\_editor\_with\_items\_data\_json\_ability/](https://www.reddit.com/r/RPGMaker/comments/1ll32th/save_editor_with_items_data_json_ability/)  
24. Working with JSON in RPG \- (YAJL Open Source JSON Tool) \- Scott Klement's, acessado em janeiro 2, 2026, [https://www.scottklement.com/presentations/Working%20with%20JSON%20in%20RPG.pdf](https://www.scottklement.com/presentations/Working%20with%20JSON%20in%20RPG.pdf)  
25. Use Base MZ Damage System with VizuStella Battlecore? \- RPG Maker Forums, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/use-base-mz-damage-system-with-vizustella-battlecore.174783/](https://forums.rpgmakerweb.com/index.php?threads/use-base-mz-damage-system-with-vizustella-battlecore.174783/)  
26. A Guide to Damage Formulas | RPG Maker Forums, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/a-guide-to-damage-formulas.145148/](https://forums.rpgmakerweb.com/index.php?threads/a-guide-to-damage-formulas.145148/)  
27. Graphics Changer | RPG Maker Forums, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/graphics-changer.47958/](https://forums.rpgmakerweb.com/index.php?threads/graphics-changer.47958/)  
28. Automate headless browser testing with Nodejs & Jest | by Mukesh sharma | Medium, acessado em janeiro 2, 2026, [https://medium.com/@mukeshsharma20120/automate-headless-browser-testing-with-nodejs-jest-4904d7681ea4](https://medium.com/@mukeshsharma20120/automate-headless-browser-testing-with-nodejs-jest-4904d7681ea4)  
29. JSDOM: How to Get Started \- Testim, acessado em janeiro 2, 2026, [https://www.testim.io/blog/jsdom-a-guide-to-how-to-get-started-and-what-you-can-do/](https://www.testim.io/blog/jsdom-a-guide-to-how-to-get-started-and-what-you-can-do/)  
30. \[CGMZ\] Pixi Filters for RPG Maker MZ by Casper Gaming \- itch.io, acessado em janeiro 2, 2026, [https://casper-gaming.itch.io/cgmz-pixi-filters](https://casper-gaming.itch.io/cgmz-pixi-filters)  
31. Effekseer \- RPG Maker MZ HELP, acessado em janeiro 2, 2026, [https://rmmz.neocities.org/01\_08\_09\_01](https://rmmz.neocities.org/01_08_09_01)  
32. hustcc/jest-canvas-mock: :last\_quarter\_moon \- GitHub, acessado em janeiro 2, 2026, [https://github.com/hustcc/jest-canvas-mock](https://github.com/hustcc/jest-canvas-mock)  
33. How to add support to my tests in Jest? \- Stack Overflow, acessado em janeiro 2, 2026, [https://stackoverflow.com/questions/33269093/how-to-add-canvas-support-to-my-tests-in-jest](https://stackoverflow.com/questions/33269093/how-to-add-canvas-support-to-my-tests-in-jest)  
34. RPG MAKER MZ \- Effekseer Custom Animations Not Loading\!\!\!\!\!\!, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/rpg-maker-mz-effekseer-custom-animations-not-loading.156168/](https://forums.rpgmakerweb.com/index.php?threads/rpg-maker-mz-effekseer-custom-animations-not-loading.156168/)  
35. Failed to load js/libs/effekseer.min.js :: RPG Maker MZ General Discussions, acessado em janeiro 2, 2026, [https://steamcommunity.com/app/1096900/discussions/0/3084376689336218577/](https://steamcommunity.com/app/1096900/discussions/0/3084376689336218577/)  
36. Can you "include" JS from a separate file? \- RPG Maker Forums, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/can-you-include-js-from-a-separate-file.53268/](https://forums.rpgmakerweb.com/index.php?threads/can-you-include-js-from-a-separate-file.53268/)  
37. RPGMakerMV & Node.js Part 1: Reading And Writing Files | RPG Maker Forums, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/rpgmakermv-node-js-part-1-reading-and-writing-files.80140/](https://forums.rpgmakerweb.com/index.php?threads/rpgmakermv-node-js-part-1-reading-and-writing-files.80140/)  
38. Need help for RPG MV custom plugin coding, don't know what's wrong : r/RPGMaker, acessado em janeiro 2, 2026, [https://www.reddit.com/r/RPGMaker/comments/13w6yox/need\_help\_for\_rpg\_mv\_custom\_plugin\_coding\_dont/](https://www.reddit.com/r/RPGMaker/comments/13w6yox/need_help_for_rpg_mv_custom_plugin_coding_dont/)  
39. Question for RPG game devs, how do you come up with damage/growth/etc. formulas?, acessado em janeiro 2, 2026, [https://www.reddit.com/r/gamedev/comments/icj71h/question\_for\_rpg\_game\_devs\_how\_do\_you\_come\_up/](https://www.reddit.com/r/gamedev/comments/icj71h/question_for_rpg_game_devs_how_do_you_come_up/)  
40. Featured Blog | The art of game balance: evolution, acessado em janeiro 2, 2026, [https://www.gamedeveloper.com/design/the-art-of-game-balance-evolution](https://www.gamedeveloper.com/design/the-art-of-game-balance-evolution)  
41. MZ \- Unit Testing Plugins \- RPG Maker Forums, acessado em janeiro 2, 2026, [https://forums.rpgmakerweb.com/index.php?threads/unit-testing-plugins.137094/](https://forums.rpgmakerweb.com/index.php?threads/unit-testing-plugins.137094/)