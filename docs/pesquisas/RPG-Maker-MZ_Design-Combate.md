# **Arquitetura de Design de Sistemas de Combate: Escala Épica e Matemática em Turnos no RPG Maker MZ**

## **1\. Introdução: A Filosofia da Escala Numérica em RPGs**

O design de sistemas de combate para Jogos de Interpretação de Papéis (RPGs), especificamente aqueles que emulam a grandiosidade da "Era de Ouro" dos JRPGs (SNES e PlayStation, com a linhagem *Final Fantasy* como arquétipo primário), exige uma ruptura fundamental com a aritmética simples de números pequenos. Enquanto jogos como *Paper Mario* ou os primeiros *Dragon Quest* operam em um espectro onde um incremento de \+1 em Ataque representa um aumento significativo de poder, a proposta de uma "Escala Alta" ou "Épica" — onde o dano pode escalar de 50 para 9.999 ou mesmo 99.999 — demanda uma infraestrutura matemática robusta. Este relatório técnico detalha a construção teórica e a implementação prática de tais sistemas no RPG Maker MZ, utilizando a suíte VisuStella para transcender as limitações nativas da engine.

O problema central abordado aqui é a "Orientação Inicial": como um designer transforma um banco de dados vazio em um ecossistema matemático coerente que suporta 100 níveis de progressão sem colapsar em trivialidade ou tédio. A solução reside não na inserção aleatória de dados, mas no **Design Determinístico**, onde fórmulas quadráticas e curvas de crescimento pré-calculadas ditam a experiência do jogador, e os plugins servem apenas como veículos para essa lógica.

### **1.1 A Estética Matemática do Estilo "Final Fantasy"**

Para replicar a sensação visceral de um Final Fantasy (especialmente do VI ao X), é necessário compreender que a matemática subjacente não é linear. A progressão linear (onde o Nível 99 é simplesmente 99 vezes mais forte que o Nível 1\) falha em transmitir a sensação de poder divino que o gênero exige.  
A estética matemática desses jogos baseia-se em três pilares teóricos:

1. **Crescimento Exponencial Controlado:** O poder do personagem segue uma curva polinomial. O salto de poder do nível 50 para o 51 é matematicamente maior do que do 10 para o 11, criando uma sensação de aceleração.  
2. **Inflação de Recursos como Ritmo:** Pontos de Magia (MP) e Pontos de Tática/Limit (TP) não são apenas munição; são reguladores de ritmo. Em escalas altas, o gerenciamento de MP evolui de uma restrição de escassez para uma restrição de eficiência de turno.1  
3. **Ruptura de Limites (Break Damage Limit):** A existência de "tetos de vidro" visuais (9.999) que são quebrados no *endgame* serve como um marcador psicológico de progressão suprema.2

Este documento priorizará a teoria matemática (80%) como a base imutável, utilizando o suporte de plugins VisuStella (20%) para viabilizar essa teoria dentro das restrições do RPG Maker MZ.

## ---

**2\. Fundamentação Teórica: Atributos e Curvas de Progressão**

O primeiro passo no design não ocorre dentro do software RPG Maker, mas sim em planilhas de cálculo. O erro mais comum em projetos iniciantes é a "Pintura de Banco de Dados" — a atribuição arbitrária de estatísticas. Para um jogo de escala épica, devemos estabelecer as **Âncoras de Realidade**.

### **2.1 A Curva de Progressão e as Âncoras**

As âncoras são pontos fixos que definem a realidade do jogo em momentos chave. Para um sistema que visa o nível 99 (ou 255 com VisuStella Core Engine), definimos quatro estágios críticos.

| Estágio de Jogo | Nível (L) | HP (Tanque) | HP (Mago) | ATK (Guerreiro) | Dano Esperado (Ataque Básico) | Dano Esperado (Skill Suprema) |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **Início** | 1 | 150 | 80 | 18 | 30 | 50 |
| **Mid-Game** | 40 | 3.500 | 1.800 | 140 | 1.200 | 2.500 |
| **End-Game** | 99 | 9.999 | 6.500 | 255 (Soft Cap) | 5.000 | 9.999 (Cap) |
| **Post-Game** | 99+ | 50.000+ | 25.000+ | 999 (Hard Cap) | 25.000 | 99.999 (Break) |

**Análise das Âncoras:** Observe que o HP escala muito mais agressivamente que o ATK. Isso é intencional. Em sistemas de escala alta, o "Time-to-Kill" (Tempo para Matar) do jogador deve diminuir ligeiramente ou manter-se estável, enquanto a capacidade de sobrevivência deve aumentar para permitir mecânicas de chefe mais complexas (ataques em área massivos) sem causar *Game Over* instantâneo. A suíte VisuStella permite remover os limites nativos de 9.999 HP e 999 em atributos, facilitando o design do "Post-Game".4

### **2.2 Modelagem Matemática das Curvas**

Uma vez estabelecidas as âncoras, o preenchimento dos níveis intermediários não deve ser linear. A fórmula recomendada para gerar uma curva de progressão estilo JRPG clássico é uma função polinomial com expoente ajustável.

A fórmula geral para um Atributo Base em qualquer Nível ($L$) é:

$$Atributo\_L \= Base \+ (Max \- Base) \\times \\left( \\frac{L \- 1}{L\_{Max} \- 1} \\right)^{P}$$  
Onde:

* $L$: Nível atual.  
* $L\_{Max}$: Nível máximo (ex: 99).  
* $Base$: Valor no nível 1\.  
* $Max$: Valor no nível 99\.  
* $P$: Potência da curva.  
  * Se $P \= 1$: Crescimento Linear (Reta).  
  * Se $P \> 1$ (ex: 2.0): Crescimento Quadrático (Lento no início, explosivo no final).  
  * Se $P \< 1$ (ex: 0.7): Crescimento Logarítmico (Rápido no início, estagna no final).

Para um jogo estilo *Final Fantasy*, recomenda-se um **$P$ entre 1.8 e 2.2** para atributos ofensivos (ATK, MAT) e EXP, criando uma sensação de aceleração de poder. Para atributos defensivos e HP, um **$P$ próximo de 1.2 a 1.5** garante uma sobrevivência mais consistente desde o início.7

### **2.3 Taxonomia dos Atributos no RPG Maker MZ**

No contexto de escala alta, os atributos padrão assumem funções de design específicas:

#### **2.3.1 HP (Hit Points) como Recurso de Erro**

Em jogos de números pequenos, 1 HP é a diferença entre vida e morte de forma binária. Em jogos de números altos, o HP funciona como uma "barra de erro". Um HP de 9.999 permite que o designer crie chefes que causam 4.000 de dano em área. Isso não mata o jogador, mas cria uma "crise" que exige cura. O design de *High HP* desloca o foco da "morte súbita" para a "gestão de crise" e eficiência de cura.6

#### **2.3.2 MP (Magic Points) e a Economia de Atrição**

Diferente do HP, o MP não deve escalar exponencialmente. Se o MP de um mago for 9.999, o custo das magias torna-se irrelevante.

* **Recomendação de Design:** Mantenha o MP relativamente baixo (ex: Max 999\) ou faça o custo das habilidades escalar percentualmente. A VisuStella permite custos percentuais via notetags, o que mantém a relevância do gerenciamento de recursos até o nível 99\.  
* **TP (Tactical Points):** Emula a barra de "Limit Break". Deve ser configurada para carregar com dano recebido ou ações realizadas, servindo como um mecanismo de *comeback* (virada).9

#### **2.3.3 Agilidade (AGI) e a Ruptura da Economia de Turnos**

A Agilidade é o atributo mais perigoso matematicamente. Em sistemas baseados em turnos (seja o padrão, TPB ou ATB da VisuStella), uma disparidade linear em AGI resulta em uma vantagem exponencial de ações.  
Se o Jogador A tem 100 AGI e o Chefe B tem 50 AGI, o jogador age duas vezes para cada ação do chefe. Se o jogador tiver 200 AGI, ele age quatro vezes. Isso torna qualquer balanceamento de dano irrelevante.

* **Solução VisuStella:** Utilize as configurações do Battle Core para aplicar uma fórmula logarítmica à velocidade de ação ou imponha *soft caps* onde o excesso de agilidade oferece retornos decrescentes (diminishing returns).10

#### **2.3.4 Sorte (LUK) e Críticos**

Nativamente, a Sorte é frequentemente ignorada. No entanto, para alcançar a profundidade de *systems design* desejada, a Sorte deve ser vinculada a mecânicas ofensivas. A VisuStella Battle Core permite alterar a fórmula de Dano Crítico para incluir a Sorte do usuário, transformando-a em um atributo primário para classes como Ladrões ou Arqueiros.11

## ---

**3\. Engenharia de Fórmulas de Dano (O Núcleo Matemático)**

A fórmula de dano é o motor do jogo. A escolha da fórmula dita como os atributos interagem e como o jogador percebe a evolução do seu personagem. Para o estilo *Final Fantasy*, a fórmula padrão do RPG Maker é insuficiente.

### **3.1 Análise da Fórmula Padrão (Subtração)**

A fórmula nativa do MZ é:

$$Dano \= (a.atk \\times 4\) \- (b.def \\times 2)$$  
Por que evitar em Escala Épica:  
Esta fórmula sofre do "Problema do Limiar" (Threshold Problem).

* Cenário: Jogador tem 100 ATK. Inimigo tem 200 DEF.  
  * Cálculo: $(100 \\times 4\) \- (200 \\times 2\) \= 400 \- 400 \= 0$.  
* Se o jogador equipar uma espada que dá \+5 ATK:  
  * Cálculo: $(105 \\times 4\) \- 400 \= 420 \- 400 \= 20$.  
* Um aumento de 5% no atributo resultou em um dano infinito (de 0 para 20). Em escalas altas (ex: 500 ATK vs 1000 DEF), essa volatilidade torna o balanceamento impossível. Inimigos tornam-se invulneráveis ou papel, sem meio-termo.12

### **3.2 A Abordagem de Razão (Ratio)**

$$Dano \= \\frac{a.atk}{b.def} \\times Potência$$  
Vantagens: Nunca resulta em zero. Escala suavemente.  
Desvantagens: Sente-se "fraca" em escalas altas. Dobrar o ataque apenas dobra o dano, o que pode parecer pouco recompensador quando os números de HP dos inimigos crescem exponencialmente.

### **3.3 A Fórmula Quadrática "Final Fantasy" (Recomendada)**

Para capturar a sensação de "Limit Break" e poder épico, a fórmula deve ser quadrática em relação ao ataque, mas moderada pela defesa de forma assintótica. A fórmula clássica derivada de jogos como *Final Fantasy VII* e *Pokemon* (adaptada) é ideal.

Fórmula Mestra Sugerida:

$$Dano \= \\frac{a.atk \\times a.atk}{a.atk \+ b.def} \\times Multiplicador$$  
**Implementação no RPG Maker MZ:**

JavaScript

(a.atk \* a.atk) / (a.atk \+ b.def) \* variancia

(Onde variancia é um multiplicador de habilidade, ex: 4 para ataque básico, 10 para magia forte).

**Análise Matemática:**

1. **Crescimento Quadrático ($a.atk^2$):** Recompensa agressivamente o investimento em ataque. Um aumento de 10% em ATK resulta em aproximadamente 21% a mais de dano (antes da redução de defesa). Isso cria a sensação de "escalada épica".13  
2. **Mitigação Suave ($a.atk \+ b.def$):** Ao dividir pela soma, a defesa nunca anula completamente o dano, mas oferece rendimentos decrescentes. Isso evita o cenário de "Dano 0" e garante que tanques com defesa altíssima ainda sofram *chip damage* (dano de desgaste), mantendo a necessidade de cura.13

### **3.4 Resolvendo o Problema do Zero e Variância**

Mesmo com fórmulas robustas, a engine pode arredondar para zero em casos extremos. Para garantir integridade profissional, deve-se usar funções JavaScript nativas dentro da caixa de fórmula.

**Fórmula Robusta com *Floor* (Piso):**

JavaScript

Math.max((a.atk \* a.atk) / (a.atk \+ b.def) \* 4, 1)

O uso de Math.max(x, 1\) garante que o ataque sempre cause pelo menos 1 de dano, comunicando ao jogador que o inimigo foi atingido, mas é resistente, ao invés de parecer um erro ou imunidade total.15

### **3.5 O Mecanismo de "Armor Scaling" da VisuStella**

A VisuStella Battle Core introduz um conceito moderno: **Armor Scaling** (Escalonamento de Armadura). Em vez de usar a defesa diretamente na fórmula de subtração, a defesa atua como um redutor percentual de dano.

A lógica interna (simplificada) utilizada pelo plugin quando este modo está ativo é:

$$DanoReal \= DanoBase \\times \\left( \\frac{100}{100 \+ Defesa} \\right)$$  
Esta abordagem, comum em MOBAs (como *League of Legends*) e MMOs, é matematicamente superior para balanceamento competitivo, mas altera drasticamente a construção das fórmulas. Se você ativar o "Armor Scaling" nos parâmetros do VisuStella, **não** use defesa na sua fórmula de banco de dados.

* **Fórmula no Banco de Dados (com Armor Scaling ativo):** a.atk \* 4 (A defesa é aplicada automaticamente pelo plugin após o cálculo).  
* **Fórmula no Banco de Dados (com Armor Scaling inativo \- Estilo Clássico):** (a.atk \* a.atk) / (a.atk \+ b.def) \* 4\.

**Recomendação:** Para um primeiro projeto buscando controle total e "feeling" clássico, **desative** o Armor Scaling automático ou use o modo "Manual" nos Damage Styles da VisuStella, implementando a fórmula quadrática sugerida acima diretamente na caixa de notas.17

## ---

**4\. O Ecossistema VisuStella: Infraestrutura e Suporte (20%)**

A teoria matemática acima é inexequível no RPG Maker MZ puro devido aos limites rígidos (Dano máx 9.999, Atributos máx 999). A suíte VisuStella atua como a infraestrutura técnica que remove essas barreiras.

### **4.1 VisuStella Core Engine: Quebrando Limites**

Este plugin é obrigatório para escalas épicas. Ele reescreve as classes base do jogo para aceitar inteiros maiores.

* **Configuração Essencial:**  
  * Acesse Plugin Parameters \> Quality of Life \> Parameter Settings.  
  * Altere Max HP Cap para 99999 (ou 999999).  
  * Altere Max Param Cap (ATK, DEF, etc.) para 999 ou 9999\.4  
* **Nível Acima de 99:**  
  * Use a notetag \<Max Level: 255\> (ou valor desejado) na caixa de notas dos Atores ou Classes.  
  * *Atenção Crítica:* O editor do MZ não permite desenhar curvas de atributos acima do nível 99\. Você deve usar notetags \<Param: x\> ou plugins de gerenciamento de curvas externas (como arquivos CSV importados via plugins auxiliares ou configuração JS manual) para definir o crescimento pós-nível 99\.19

### **4.2 VisuStella Battle Core: Estilos de Dano e Críticos**

O Battle Core centraliza o processamento de batalha.

#### **4.2.1 Damage Styles (Estilos de Dano)**

O plugin permite predefinir fórmulas globais. No entanto, para fins educacionais e de controle fino, recomenda-se configurar o estilo para **"Standard"** ou **"Manual"**. Isso garante que o que você escreve na caixa de fórmula da habilidade seja exatamente o que é executado, sem multiplicadores ocultos do plugin.17

#### **4.2.2 Reformulação de Críticos**

O crítico padrão do MZ (Dano x 3\) é simplista. A VisuStella permite vincular o multiplicador crítico à Sorte (LUK).  
Configuração Sugerida (Estilo MMO/Moderno):  
No parâmetro JS: Critical Damage Formula, altere para algo como:

JavaScript

// Dano base multiplicado por (1.5 \+ bônus de Sorte)  
damage \* (1.5 \+ (user.luk / 1000))

Isso torna a Sorte um atributo de escala de dano para o *late game*.11

### **4.3 Skills & States Core: Mecânicas Avançadas**

Para implementar limites de dano variáveis (ex: "Break Damage Limit" do FFX), usamos as *Traits* e *Notetags* deste plugin.

* **Break Damage Limit (BDL):**  
  * Crie um Estado passivo ou Trait em uma arma final.  
  * Use a notetag \<Damage Cap: 99999\>.  
  * Sem essa tag, o dano será limitado pelo padrão global configurado no Core Engine (ex: 9.999). Isso transforma a quebra de limite em uma recompensa tangível de gameplay.21

### **4.4 Sistema de "Break" (Escudos e Fraquezas)**

Inspirado em *Octopath Traveler* e suportado pelo plugin **VisuStella Break Shields**.

* **Lógica:** Adiciona uma camada estratégica onde o jogador deve "quebrar" a defesa do inimigo antes de causar dano real massivo.  
* **Implementação:**  
  * Use a notetag \<Break Shields: x\> nos inimigos para definir a resistência.  
  * Configure as fraquezas elementais no banco de dados padrão.  
  * Quando os escudos chegam a 0, o inimigo entra em estado de "Stun".  
  * *Sinergia Matemática:* Configure o estado de Stun para aplicar um traço de "Receber Dano x 2.0". Isso cria janelas de oportunidade para o jogador despejar seus ataques de alto custo (TP).22

## ---

**5\. Roteiro de Implementação (Roadmap)**

Este roteiro guia o desenvolvimento desde o conceito zero até a primeira batalha funcional.

### **Fase 1: A Planilha Mestra (Dias 1-3)**

**Objetivo:** Definir a realidade matemática antes de tocar na engine.

1. **Crie a Tabela de Âncoras:** Defina HP/ATK/DEF para Níveis 1, 10, 50, 99\.  
2. **Simule a Fórmula:** No Excel, crie uma célula para "Atacante ATK" e "Defensor DEF". Insira a fórmula quadrática: (ATK^2) / (ATK \+ DEF).  
3. **Teste de Stress:** Insira valores díspares. O que acontece se o ATK for 999 e a DEF for 10? O dano explode ou se mantém legível? Ajuste o multiplicador da fórmula até que os resultados pareçam satisfatórios (ex: Dano nível 99 deve ser aprox. 5.000 a 8.000).

### **Fase 2: Configuração da Engine (Dias 4-5)**

**Objetivo:** Preparar o terreno técnico.

1. **Instalação:** Instale VisuStella Core, Battle Core, Skills & States, Elements & Status Menu.  
2. **Desbloqueio:** No Core Engine, defina Max Level para 99, Max HP para 99999, Max Param para 999\.  
3. **Limpeza:** No Battle Core, verifique se "Armor Scaling" está desativado ou configurado conforme sua escolha de design (recomenda-se desativado para controle manual da fórmula).

### **Fase 3: Povoamento do Banco de Dados (Dias 6-10)**

**Objetivo:** Inserção de dados baseada nas curvas.

1. **Curvas de Classe:** Insira os valores das âncoras no gerador de curvas do MZ. Ajuste os sliders para obter o formato polinomial (lento no início, rápido no fim).  
2. **Habilidade "Ataque":** Substitua a fórmula padrão pela quadrática: (a.atk \* a.atk) / (a.atk \+ b.def) \* 4\.  
3. **Inimigo de Teste:** Crie um "Slime de Treino" com estatísticas de Nível 1, e um "Deus de Treino" com estatísticas de Nível 99\.

### **Fase 4: Implementação de Mecânicas Específicas (Dias 11-15)**

**Objetivo:** Diferenciação e "Juice".

1. **Limit Breaks:**  
   * Renomeie TP para "Limit" ou "Overdrive".  
   * Crie habilidades que custam 100 TP.  
   * Use fórmulas com multiplicadores absurdos (ex: \* 10 ou \* 15\) para garantir que o Limit Break seja o evento mais impactante da batalha.  
2. **Configuração de Break:**  
   * Adicione \<Break Shields: 3\> aos inimigos de teste.  
   * Teste o fluxo: Atacar Fraqueza \-\> Quebrar Escudo \-\> Inimigo Atordoado \-\> Limit Break \-\> Dano Massivo.

## ---

**6\. Considerações Avançadas: O Problema do "Time-to-Kill"**

O balanceamento final não é sobre números de dano, mas sobre Turnos.  
A métrica dourada é o TTK (Time to Kill).

* **Inimigos Comuns:** Devem morrer em 1 a 2 turnos com gasto de recursos (MP), ou 3 a 4 turnos apenas com ataques básicos.  
* **Chefes:** Devem durar entre 8 a 15 turnos.

Como calcular:  
Se o seu grupo de 4 personagens causa, em média, 2.000 de dano por turno no nível 50 (500 cada), e você quer que o chefe dure 10 turnos, o chefe precisa ter:

$$2.000 \\times 10 \= 20.000 \\text{ HP Efetivo}$$  
Se o chefe tiver defesa alta que reduz o dano em 50%, o HP nominal no banco de dados deve ser ajustado ou a defesa reduzida. Use a planilha para fazer essa engenharia reversa: comece com o tempo que você quer que a batalha dure, e calcule o HP do inimigo a partir do dano projetado do jogador.1

## ---

**7\. Conclusão e Perspectivas**

A criação de um sistema de combate de alta escala no RPG Maker MZ é um exercício de disciplina matemática. O uso de fórmulas quadráticas oferece a sensação de crescimento explosivo característica de *Final Fantasy*, enquanto a suíte VisuStella fornece a arquitetura necessária para suportar números além dos limites nativos.

A chave para o sucesso não está na complexidade dos plugins, mas na solidez da **Curva de Progressão** definida na Fase 1\. Se a matemática base for sólida (evitando o problema do dano zero e garantindo relevância de todos os atributos), os plugins servirão para exaltar a experiência, criando batalhas que são visualmente impressionantes e taticamente profundas. O designer deve resistir à tentação de inflar números sem propósito; cada dígito adicional no dano deve representar uma conquista tangível na jornada do jogador.

## ---

**Apêndice: Referência de Fórmulas e Notetags**

### **Tabela A.1: Fórmulas Recomendadas para a Caixa de Habilidade**

| Tipo de Habilidade | Fórmula Sugerida (JS) | Propósito |
| :---- | :---- | :---- |
| **Ataque Físico Padrão** | (a.atk \* a.atk) / (a.atk \+ b.def) \* 4 | Dano base com escala quadrática e mitigação suave. |
| **Magia Ofensiva** | (a.mat \* a.mat) / (a.mat \+ b.mdf) \* 6 | Multiplicador maior (6) para justificar o custo de MP. |
| **Cura (Late Game)** | (b.mhp \* 0.30) \+ (a.mat \* 4\) | Cura 30% do HP Máx do alvo \+ bônus de poder mágico. |
| **Ataque "Perfurante"** | a.atk \* 3 | Ignora defesa (útil para inimigos blindados ou slimes). |
| **Dano Misto** | ((a.atk \+ a.mat) \* (a.atk \+ a.mat)) / (a.atk \+ b.def \+ a.mat \+ b.mdf) \* 5 | Para classes tipo "Paladino" ou "Cavaleiro Mágico". |

### **Tabela A.2: Notetags Essenciais VisuStella (Core & Battle)**

| Notetag | Plugin | Onde Usar | Função |
| :---- | :---- | :---- | :---- |
| \<Max Level: 255\> | Core Engine | Ator/Classe | Permite upar além do nível 99\. |
| \<Param Max: 9999\> | Core Engine | Ator/Classe | Permite atributos base acima de 999\. |
| \<Damage Cap: 99999\> | Battle Core | Arma/Estado | Define o teto de dano (Break Damage Limit). |
| \<Break Shields: x\> | Skills & States | Inimigo | Define quantos hits de fraqueza para "Quebrar" o inimigo. |
| \<JS Pre-Damage\> | Battle Core | Skill | Permite lógica complexa (ex: aumentar dano se HP alvo \< 50%). |
| \<Bypass Damage Cap\> | Battle Core | Skill | Habilidade específica que ignora o limite de dano global. |

1

#### **Referências citadas**

1. For a turn based RPG, how do you determine the "math" in regards to encounter design? : r/gamedesign \- Reddit, acessado em dezembro 31, 2025, [https://www.reddit.com/r/gamedesign/comments/1oqv557/for\_a\_turn\_based\_rpg\_how\_do\_you\_determine\_the/](https://www.reddit.com/r/gamedesign/comments/1oqv557/for_a_turn_based_rpg_how_do_you_determine_the/)  
2. Visustella Battle Core Damage Formulae : r/RPGMaker \- Reddit, acessado em dezembro 31, 2025, [https://www.reddit.com/r/RPGMaker/comments/1bcj9w4/visustella\_battle\_core\_damage\_formulae/](https://www.reddit.com/r/RPGMaker/comments/1bcj9w4/visustella_battle_core_damage_formulae/)  
3. What is an easy way to set a 9999 damage cap? :: RPG Maker VX Ace General Discussions, acessado em dezembro 31, 2025, [https://steamcommunity.com/app/220700/discussions/0/3730701400339093669/](https://steamcommunity.com/app/220700/discussions/0/3730701400339093669/)  
4. MZ \- Visustella Core Engine: Parameter Formula and Custom Parameters Editing, acessado em dezembro 31, 2025, [https://forums.rpgmakerweb.com/index.php?threads/visustella-core-engine-parameter-formula-and-custom-parameters-editing.174857/](https://forums.rpgmakerweb.com/index.php?threads/visustella-core-engine-parameter-formula-and-custom-parameters-editing.174857/)  
5. How to set max stat limits | RPG Maker Forums, acessado em dezembro 31, 2025, [https://forums.rpgmakerweb.com/index.php?threads/how-to-set-max-stat-limits.164529/](https://forums.rpgmakerweb.com/index.php?threads/how-to-set-max-stat-limits.164529/)  
6. Is there a script line to increase an enemy's HP of more than 9999? \- RPG Maker Forums, acessado em dezembro 31, 2025, [https://forums.rpgmakerweb.com/index.php?threads/is-there-a-script-line-to-increase-an-enemys-hp-of-more-than-9999.170873/](https://forums.rpgmakerweb.com/index.php?threads/is-there-a-script-line-to-increase-an-enemys-hp-of-more-than-9999.170873/)  
7. Base 'Parameter Curve' Generation 'Growth' Formulas? \- RPG Maker Forums, acessado em dezembro 31, 2025, [https://forums.rpgmakerweb.com/index.php?threads/base-parameter-curve-generation-growth-formulas.98167/](https://forums.rpgmakerweb.com/index.php?threads/base-parameter-curve-generation-growth-formulas.98167/)  
8. When the Damage is Just Too High | RPG Maker Forums, acessado em dezembro 31, 2025, [https://forums.rpgmakerweb.com/index.php?threads/when-the-damage-is-just-too-high.82749/](https://forums.rpgmakerweb.com/index.php?threads/when-the-damage-is-just-too-high.82749/)  
9. Battle Core VisuStella MZ \- Yanfly.moe Wiki, acessado em dezembro 31, 2025, [http://www.yanfly.moe/wiki/Battle\_Core\_VisuStella\_MZ](http://www.yanfly.moe/wiki/Battle_Core_VisuStella_MZ)  
10. Balancing Turn-Based RPGs: Party Members | Envato Tuts+ \- Code, acessado em dezembro 31, 2025, [https://code.tutsplus.com/balancing-turn-based-rpgs-party-members--gamedev-8964a](https://code.tutsplus.com/balancing-turn-based-rpgs-party-members--gamedev-8964a)  
11. MZ \- \[SOLVED\] Visustella Battle Core \- Customizing Critical Hit Damage Multiplier | RPG Maker Forums, acessado em dezembro 31, 2025, [https://forums.rpgmakerweb.com/index.php?threads/solved-visustella-battle-core-customizing-critical-hit-damage-multiplier.142568/](https://forums.rpgmakerweb.com/index.php?threads/solved-visustella-battle-core-customizing-critical-hit-damage-multiplier.142568/)  
12. What damage formulas do you use? \- RPG Maker Forums, acessado em dezembro 31, 2025, [https://forums.rpgmakerweb.com/index.php?threads/what-damage-formulas-do-you-use.138968/](https://forums.rpgmakerweb.com/index.php?threads/what-damage-formulas-do-you-use.138968/)  
13. What damage formulas do you use? | Page 4 \- RPG Maker Forums, acessado em dezembro 31, 2025, [https://forums.rpgmakerweb.com/index.php?threads/what-damage-formulas-do-you-use.138968/page-4](https://forums.rpgmakerweb.com/index.php?threads/what-damage-formulas-do-you-use.138968/page-4)  
14. Balancing damage output with low stats (MV, Ace) \- RPG Maker Forums, acessado em dezembro 31, 2025, [https://forums.rpgmakerweb.com/index.php?threads/balancing-damage-output-with-low-stats-mv-ace.110096/](https://forums.rpgmakerweb.com/index.php?threads/balancing-damage-output-with-low-stats-mv-ace.110096/)  
15. Give me an example of a good, simple stat and damage formula | RPG Maker Forums, acessado em dezembro 31, 2025, [https://forums.rpgmakerweb.com/index.php?threads/give-me-an-example-of-a-good-simple-stat-and-damage-formula.107096/](https://forums.rpgmakerweb.com/index.php?threads/give-me-an-example-of-a-good-simple-stat-and-damage-formula.107096/)  
16. Damage Calculations? : r/RPGMaker \- Reddit, acessado em dezembro 31, 2025, [https://www.reddit.com/r/RPGMaker/comments/7z1hww/damage\_calculations/](https://www.reddit.com/r/RPGMaker/comments/7z1hww/damage_calculations/)  
17. Use Base MZ Damage System with VizuStella Battlecore? \- RPG Maker Forums, acessado em dezembro 31, 2025, [https://forums.rpgmakerweb.com/index.php?threads/use-base-mz-damage-system-with-vizustella-battlecore.174783/](https://forums.rpgmakerweb.com/index.php?threads/use-base-mz-damage-system-with-vizustella-battlecore.174783/)  
18. MZ \- Need help with Visustella battle core damage styles | RPG Maker Forums, acessado em dezembro 31, 2025, [https://forums.rpgmakerweb.com/index.php?threads/need-help-with-visustella-battle-core-damage-styles.181411/](https://forums.rpgmakerweb.com/index.php?threads/need-help-with-visustella-battle-core-damage-styles.181411/)  
19. Is it possible to change the max level in MZ to above 99 with the Visustella sample plugins? Or anywhere in engine? : r/RPGMaker \- Reddit, acessado em dezembro 31, 2025, [https://www.reddit.com/r/RPGMaker/comments/1dkj83e/is\_it\_possible\_to\_change\_the\_max\_level\_in\_mz\_to/](https://www.reddit.com/r/RPGMaker/comments/1dkj83e/is_it_possible_to_change_the_max_level_in_mz_to/)  
20. Parameter Tables \- 姫HimeWorks, acessado em dezembro 31, 2025, [https://himeworks.com/2016/01/parameter-tables-mv/](https://himeworks.com/2016/01/parameter-tables-mv/)  
21. Damage Core (YEP) \- Yanfly.moe Wiki, acessado em dezembro 31, 2025, [http://www.yanfly.moe/wiki/Damage\_Core\_(YEP)](http://www.yanfly.moe/wiki/Damage_Core_\(YEP\))  
22. Break Shields VisuStella MZ \- Yanfly.moe Wiki, acessado em dezembro 31, 2025, [http://www.yanfly.moe/wiki/Break\_Shields\_VisuStella\_MZ](http://www.yanfly.moe/wiki/Break_Shields_VisuStella_MZ)  
23. Balancing Turn-Based RPGs: Enemies | Envato Tuts+ \- Code, acessado em dezembro 31, 2025, [https://code.tutsplus.com/balancing-turn-based-rpgs-enemies--gamedev-9624a](https://code.tutsplus.com/balancing-turn-based-rpgs-enemies--gamedev-9624a)  
24. Core Engine VisuStella MZ \- Yanfly.moe Wiki, acessado em dezembro 31, 2025, [http://www.yanfly.moe/wiki/Core\_Engine\_VisuStella\_MZ](http://www.yanfly.moe/wiki/Core_Engine_VisuStella_MZ)