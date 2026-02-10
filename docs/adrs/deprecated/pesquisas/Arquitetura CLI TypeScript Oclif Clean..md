# **Blueprint Arquitetônico: CLI Enterprise em TypeScript com Oclif, Clean Architecture e Engine de Simulação Stateful**

## **Sumário Executivo**

O presente relatório técnico delineia uma estratégia arquitetural robusta para o desenvolvimento de Interfaces de Linha de Comando (CLIs) de alta complexidade em TypeScript, utilizando o framework Oclif. O foco central desta análise reside na construção de uma *engine* de simulação "stateful" (com estado persistente e mutável), exigindo um rigoroso desacoplamento entre a lógica de apresentação (CLI) e as regras de negócio nucleares (Core).

A arquitetura proposta adota os princípios da Clean Architecture para inverter dependências, garantindo que o núcleo da simulação permaneça agnóstico quanto ao método de entrega. Para atender aos requisitos de alta performance no ciclo de desenvolvimento e build, o relatório detalha a integração de ferramentas de compilação rápida (tsx e esbuild) em detrimento do compilador padrão (tsc), abordando os desafios técnicos específicos que essa escolha impõe sobre a Injeção de Dependência (DI). Além disso, estabelece-se uma estratégia de testes de integração utilizando Jest, superando as configurações padrão do Oclif baseadas em Mocha, para assegurar a confiabilidade sistêmica.

## **1\. Fundamentos Arquiteturais e Separação de Camadas**

A aplicação da Clean Architecture no contexto de uma CLI impõe uma mudança de paradigma: a CLI deixa de ser a "aplicação" em si para tornar-se apenas um mecanismo de entrega (um "detalhe", na terminologia de Robert C. Martin). Para uma engine de simulação, essa distinção é crítica. A simulação deve ser capaz de executar de forma autônoma, testável e portátil, sem qualquer acoplamento com bibliotecas de interface como o Oclif.

### **1.1 A Regra de Dependência Aplicada**

A estrutura do projeto deve refletir estritamente a regra de dependência, onde o código fonte só pode apontar para dentro, em direção às políticas de alto nível. Para este projeto, definimos quatro camadas concêntricas, mapeadas fisicamente na estrutura de diretórios:

1. **Entidades (Domain Layer):** O núcleo inalterável. Contém a lógica de estado da simulação, regras físicas ou matemáticas e invariantes de negócio. Não possui dependências externas.  
2. **Casos de Uso (Application Layer):** Orquestra o fluxo de dados para e a partir das entidades. Define operações como ExecutarPassoSimulacao, CarregarCenario ou ExportarResultados. Define interfaces (Portas) para persistência e notificação.  
3. **Adaptadores de Interface (Adapter Layer):** Converte dados entre o formato conveniente para os casos de uso e o formato exigido por agentes externos. Inclui:  
   * **Controllers:** Os comandos Oclif (src/cli/commands), que recebem *flags* e argumentos.  
   * **Presenters:** Formatadores que transformam o estado da simulação em barras de progresso ou tabelas.1  
   * **Gateways:** Implementações concretas de repositórios que persistem o estado em disco ou banco de dados.3  
4. **Frameworks e Drivers (Infrastructure Layer):** Ferramentas externas como o próprio Oclif, drivers de sistema de arquivos (fs-extra), e mecanismos de log.

### **1.2 O Desafio do Estado em Ambientes Efêmeros**

Diferente de servidores web que mantêm processos de longa duração, CLIs são frequentemente transacionais (inicia, executa, encerra). Uma engine de simulação *stateful* introduz complexidade pois exige continuidade. A arquitetura deve suportar dois modos de operação:

* **Persistência Serializada:** O estado é carregado de um meio persistente (arquivo JSON/SQLite), mutado em memória e salvo.  
* **Continuidade de Runtime:** O processo Node.js mantém o *Event Loop* ativo durante a simulação. Isso exige que o Core seja desenhado como um emissor de eventos, permitindo que a CLI "escute" o progresso sem acoplar a lógica de processamento à lógica de renderização visual.5

## **2\. Estrutura de Diretórios e Organização Modular**

Para impor fisicamente a separação de responsabilidades e evitar vazamento de abstrações, recomenda-se uma estrutura de pastas que simule um *monorepo* lógico, onde src/core atua como uma biblioteca interna consumida por src/cli.

### **2.1 Hierarquia de Pastas Recomendada**

A estrutura abaixo foi desenhada para isolar o Oclif e permitir o uso de esbuild sem quebrar a descoberta dinâmica de comandos.

/  
├── bin/ \# Pontos de entrada executáveis  
│ ├── dev.js \# Executor de desenvolvimento (via tsx)  
│ └── run.js \# Executor de produção (via node dist)  
├── src/  
│ ├── core/ \# DOMÍNIO PURO (Zero dependência de Oclif)  
│ │ ├── domain/ \# Entidades e Value Objects  
│ │ │ ├── SimulationState.ts  
│ │ │ └── Snapshot.ts  
│ │ ├── use-cases/ \# Regras de Negócio da Aplicação  
│ │ │ ├── ports/ \# Interfaces (Ports) para IoC  
│ │ │ │ ├── ISimulationRepository.ts  
│ │ │ │ └── ILogger.ts  
│ │ │ ├── RunSimulationStep.ts  
│ │ │ └── InitializeEngine.ts  
│ │ └── errors/ \# Erros tipados do domínio  
│ │  
│ ├── infrastructure/ \# IMPLEMENTAÇÃO TÉCNICA  
│ │ ├── adapters/  
│ │ │ ├── FileSystemRepository.ts  
│ │ │ └── OclifLoggerAdapter.ts  
│ │ └── di/ \# Configuração do Container de Injeção  
│ │ ├── container.ts  
│ │ └── tokens.ts  
│ │  
│ ├── cli/ \# CAMADA DE APRESENTAÇÃO (Oclif)  
│ │ ├── commands/ \# Controllers  
│ │ │ ├── sim/  
│ │ │ │ └── start.ts  
│ │ │ └── config/  
│ │ │ └── init.ts  
│ │ ├── hooks/ \# Hooks de ciclo de vida (init, prerun)  
│ │ │ └── graceful-shutdown.ts  
│ │ └── ui/ \# Presenters (Barras de progresso, Tabelas)  
│ │ └── ProgressRenderer.ts  
│ │  
│ └── lib/ \# Utilitários compartilhados (agnósticos)  
├── tests/ \# Estratégia de Testes Híbrida  
│ ├── unit/ \# Testes unitários do Core (Jest puro)  
│ └── integration/ \# Testes de integração da CLI (Jest \+ Oclif)  
├── package.json  
├── tsconfig.json  
└── esbuild.config.js \# Script de build customizado

### **2.2 Análise dos Componentes**

* **src/core:** Deve ser tratado como um pacote intocável pela CLI. Ele define o *quê* o sistema faz. Se futuramente a simulação precisar rodar em um servidor API, esta pasta é portada integralmente sem alterações.7  
* **src/infrastructure:** É a "cola" do sistema. Implementa as interfaces definidas no Core. Por exemplo, OclifLoggerAdapter implementa ILogger (do Core) mas internamente chama this.log() ou this.warn() do Oclif. Isso resolve o problema de o Core precisar logar sem depender do framework de CLI.9  
* **src/cli:** Contém exclusivamente a lógica de interação com o usuário: parsing de argumentos, validação de entrada via flags do Oclif e renderização de saída.10

## **3\. Estratégia de Tooling: Performance com tsx e esbuild**

A escolha de tsx (para desenvolvimento) e esbuild (para produção) em detrimento do ts-node e tsc tradicionais oferece ganhos de performance de ordens de magnitude, mas introduz desafios significativos para a Injeção de Dependência.

### **3.1 O Conflito dos Metadados de Decorator**

Bibliotecas tradicionais de DI em TypeScript, como **TSyringe** ou **InversifyJS**, dependem historicamente da flag emitDecoratorMetadata do compilador TypeScript (tsc). Essa flag instrui o compilador a emitir metadados de tipo em tempo de execução, permitindo que o container infira automaticamente que um construtor constructor(repo: IRepo) precisa receber uma instância de RepoImpl.11

**O Problema:** O esbuild (e por extensão o tsx, que o utiliza internamente) **não suporta** emitDecoratorMetadata. O esbuild prioriza velocidade e ignora a fase de checagem de tipos, tratando o TypeScript apenas como uma transpilação de sintaxe (strip types). Consequentemente, os metadados de tipos são perdidos, e a injeção automática falha silenciosamente ou lança erros em runtime.12

### **3.2 Solução Arquitetural: Injeção Baseada em Tokens**

Para viabilizar o tooling rápido sem sacrificar a Clean Architecture, adota-se a **Injeção Baseada em Tokens Explícitos**. Em vez de confiar na inferência automática de tipos via metadados, declaramos explicitamente qual dependência deve ser injetada usando decoradores de parâmetro.

Esta abordagem desacopla o código da implementação do compilador, tornando-o robusto e compatível com qualquer bundler moderno (SWC, esbuild, Vite).

**Implementação com TSyringe (Compatível com esbuild):**

1. Definição de Tokens (src/infrastructure/di/tokens.ts):  
   Utiliza-se Symbol ou strings para garantir unicidade e evitar colisões.  
   TypeScript  
   export const TOKENS \= {  
     Logger: Symbol.for('ILogger'),  
     SimulationRepository: Symbol.for('ISimulationRepository'),  
     Engine: Symbol.for('SimulationEngine'),  
   };

2. Injeção no Core (src/core/use-cases/RunSimulation.ts):  
   Uso explícito de @inject(). O tsx transpila isso corretamente pois trata o decorador apenas como uma chamada de função, sem precisar analisar o sistema de tipos.  
   TypeScript  
   import { inject, injectable } from 'tsyringe';  
   import { TOKENS } from '../../infrastructure/di/tokens';  
   import type { ILogger } from './ports/ILogger';

   @injectable()  
   export class RunSimulation {  
     constructor(  
       @inject(TOKENS.Logger) private logger: ILogger  
     ) {}

     async execute(): Promise\<void\> {  
       this.logger.info('Simulação iniciada');  
     }  
   }

3. **Registro no Container (src/infrastructure/di/container.ts):**  
   TypeScript  
   import { container } from 'tsyringe';  
   import { TOKENS } from './tokens';  
   import { OclifLoggerAdapter } from '../adapters/OclifLoggerAdapter';

   // Registro explícito vinculando o Token à Implementação Concreta  
   container.register(TOKENS.Logger, { useClass: OclifLoggerAdapter });

   export { container };

### **3.3 Configuração de Build Híbrida**

A CLI do Oclif possui um mecanismo de descoberta de comandos ("Command Discovery") que varre o sistema de arquivos procurando arquivos em src/commands ou dist/commands. Bundlers que geram um único arquivo (bundle.js) quebram esse mecanismo, pois a estrutura de diretórios deixa de existir.15

**Estratégia:** Utilizar o esbuild em modo de "Transpilação Preservando Estrutura", e não em modo de "Bundling Monolítico".

**Configuração do esbuild.config.js:**

JavaScript

const esbuild \= require('esbuild');  
const glob \= require('glob'); // Necessário para encontrar os entrypoints

// Localiza todos os arquivos TS, preservando a estrutura  
const entryPoints \= glob.sync('./src/\*\*/\*.ts');

esbuild.build({  
  entryPoints,  
  outdir: 'dist',       // Replica a estrutura de 'src' dentro de 'dist'  
  platform: 'node',  
  target: 'node18',  
  format: 'cjs',        // Oclif opera nativamente melhor com CommonJS em produção  
  sourcemap: true,  
  bundle: false,        // CRÍTICO: Não fazer bundle para manter arquivos individuais  
  keepNames: true,      // Importante para Reflection/Discovery do Oclif  
}).catch(() \=\> process.exit(1));

**Análise de Impacto:**

* **Startup Time:** Com tsx em desenvolvimento, o startup cai de \~1.5s (ts-node com typecheck) para \~200ms.  
* **Deploy:** O build de produção gera arquivos .js limpos em dist/, permitindo que o Node.js execute a CLI com overhead mínimo, mantendo a estrutura de pastas exigida pelo Oclif.16

## **4\. Gerenciamento de Estado e Engine de Simulação**

Uma engine de simulação stateful impõe desafios de concorrência e feedback visual. Oclif e Node.js são single-threaded. Uma simulação pesada (CPU-bound) pode bloquear o Event Loop, congelando a interface da CLI (spinners/barras de progresso).

### **4.1 Desacoplamento via Event Emitter**

Para evitar congelamento e manter a Clean Architecture, o Core nunca deve manipular a UI diretamente. O padrão **Observer/Event Emitter** é obrigatório aqui.

Implementação no Core:  
A classe de simulação estende EventEmitter (ou implementa um padrão Observer próprio para evitar dependência do módulo events do Node, se pureza extrema for desejada, embora events seja considerado estável o suficiente).

TypeScript

// src/core/domain/SimulationEngine.ts  
import { EventEmitter } from 'events';

export class SimulationEngine extends EventEmitter {  
  public runStep(stepIndex: number): void {  
    // Lógica pesada de simulação...  
      
    // Emite evento de progresso desacoplado da UI  
    this.emit('progress', {   
      step: stepIndex,   
      metrics: this.currentMetrics   
    });  
  }  
}

Implementação na CLI (Controller):  
O comando Oclif assina os eventos e atualiza a UI.

TypeScript

// src/cli/commands/sim/run.ts  
import { Command } from '@oclif/core';  
import { SingleBar } from 'cli-progress'; // UI Library externa  
import { container } from '../../../infrastructure/di/container';  
import { TOKENS } from '../../../infrastructure/di/tokens';

export default class RunCommand extends Command {  
  async run() {  
    const engine \= container.resolve(TOKENS.Engine);  
    const progressBar \= new SingleBar({});

    progressBar.start(100, 0);

    // O Controller traduz Eventos de Domínio para Atualizações de UI  
    engine.on('progress', (data) \=\> {  
      progressBar.update(data.step);  
    });

    await engine.execute();  
    progressBar.stop();  
  }  
}

### **4.2 Graceful Shutdown e Persistência de Estado**

Em simulações longas, o usuário pode interromper o processo (SIGINT / Ctrl+C). Interrupções abruptas corrompem o estado da simulação.

**Padrão de Implementação:**

1. **Core:** Expõe um método shutdown() que realiza um *snapshot* seguro do estado atual para o repositório.  
2. **Infrastructure:** O Oclif fornece hooks, mas o tratamento direto de process é mais robusto para sinais do sistema operacional.

Recomenda-se um **Hook de Inicialização (init hook)** no Oclif que registra os listeners de sinal globalmente, garantindo que qualquer comando em execução possa ser encerrado graciosamente.

TypeScript

// src/cli/hooks/init/signal-handler.ts  
import { Hook } from '@oclif/core';  
import { container } from '../../../infrastructure/di/container';  
import { TOKENS } from '../../../infrastructure/di/tokens';

const hook: Hook\<'init'\> \= async function () {  
  process.on('SIGINT', async () \=\> {  
    console.log('\\nInterrupção detectada. Salvando estado...');  
      
    const engine \= container.resolve(TOKENS.Engine);  
    if (engine.isRunning()) {  
        await engine.saveSnapshot();  
    }  
      
    console.log('Estado salvo. Encerrando.');  
    process.exit(0);  
  });  
};  
export default hook;

Este padrão assegura a integridade dos dados (propriedade ACID) mesmo em ambientes de CLI voláteis.19

## **5\. Estratégia de Testes: Jest e Integração**

O ecossistema Oclif favorece o Mocha, mas o Jest é preferível em projetos React/Fullstack modernos. A arquitetura desacoplada facilita essa substituição.

### **5.1 Testes Unitários (Camada Core)**

Como a camada Core não depende do Oclif, seus testes são triviais e rápidos. Não é necessário *mockar* a CLI, apenas as interfaces (Portas).

TypeScript

// tests/unit/core/RunSimulation.spec.ts  
import 'reflect-metadata';  
import { RunSimulation } from '../../../src/core/use-cases/RunSimulation';

// Mock simples da interface ILogger  
const mockLogger \= { info: jest.fn(), error: jest.fn() };

describe('UseCase: RunSimulation', () \=\> {  
  it('deve logar o início da simulação', async () \=\> {  
    const useCase \= new RunSimulation(mockLogger);  
    await useCase.execute();  
    expect(mockLogger.info).toHaveBeenCalledWith('Simulação iniciada');  
  });  
});

### **5.2 Testes de Integração (Camada CLI)**

O objetivo aqui é testar se o comando Oclif instancia corretamente o container DI, processa as flags e invoca o caso de uso. **Não** devemos testar a lógica da simulação aqui, apenas a "fiação" (wiring).

Para usar Jest com Oclif, devemos utilizar o helper runCommand do pacote @oclif/test (ou criar um wrapper similar) e interceptar o stdout. Um desafio comum é o conflito de captura de console entre o Jest e o Oclif.

Estratégia de Mock do Container DI:  
Para testes de integração, é vital substituir as implementações reais (que podem escrever em disco ou demorar muito) por Mocks dentro do container DI antes da execução do comando.

TypeScript

// tests/integration/commands/run.spec.ts  
import { runCommand } from '@oclif/test';  
import { container } from 'tsyringe';  
import { TOKENS } from '../../../src/infrastructure/di/tokens';

// Mock do Engine para não rodar a simulação real  
const mockEngine \= {  
  execute: jest.fn().mockResolvedValue(true),  
  on: jest.fn()  
};

describe('Command: sim:run', () \=\> {  
  beforeEach(() \=\> {  
    container.clearInstances();  
    // Substitui a implementação real pelo Mock no container  
    container.registerInstance(TOKENS.Engine, mockEngine);  
  });

  it('deve invocar o engine com as flags corretas', async () \=\> {  
    const result \= await runCommand(\['sim:run', '--iterations', '500'\]);  
      
    // Verifica se o comando chamou o Use Case  
    expect(mockEngine.execute).toHaveBeenCalled();  
    // Verifica a saída na CLI  
    expect(result.stdout).toContain('Simulação iniciada');  
  });  
});

Esta abordagem valida a integração ponta-a-ponta: Argumentos CLI \-\> Oclif \-\> DI \-\> Use Case \-\> Saída.22

## **6\. Comparativo e Recomendação de Tooling**

A tabela abaixo sintetiza a análise técnica que justifica a escolha do stack proposto para este projeto específico.

| Característica | tsc (Padrão) | ts-node | tsx / esbuild (Recomendado) | Justificativa para a Escolha |
| :---- | :---- | :---- | :---- | :---- |
| **Velocidade de Build** | Lento (Segundos) | Médio | **Instantâneo (ms)** | Essencial para DX fluida em projetos grandes. |
| **Verificação de Tipos** | Sim | Sim (Opcional) | **Não** | O tsx foca em execução. Type-check deve rodar em paralelo na IDE ou CI. |
| **Suporte a Decorators** | Nativo (Completo) | Nativo | **Parcial** | Exige a estratégia de tokens manuais detalhada na Seção 3.2. |
| **Compatibilidade Oclif** | Nativa | Nativa | **Requer Config** | Necessita de configuração específica de outdir e bundle: false. |
| **Produção** | Arquivos JS pesados | Não recomendado | **JS Otimizado** | esbuild gera artefatos menores e mais rápidos de carregar. |

**Recomendação Final:** Utilize tsx para o loop de desenvolvimento local (bin/dev) pela velocidade de feedback. Utilize esbuild no pipeline de CI/CD para gerar a pasta dist/ de produção. Mantenha o tsc \--noEmit rodando em um terminal separado ou como hook de *pre-commit* para garantir a integridade dos tipos, já que o esbuild irá ignorá-los silenciosamente.25

## **7\. Conclusão**

A arquitetura apresentada resolve o conflito central entre a rigidez necessária para uma engine de simulação confiável e a agilidade exigida no desenvolvimento moderno de CLIs. Ao isolar o src/core e adotar a Injeção de Dependência baseada em tokens, o projeto ganha imunidade contra as limitações de metadados do esbuild, permitindo builds instantâneos. O tratamento de estado via *Event Emitters* e *Graceful Shutdown Hooks* assegura que a experiência do usuário na linha de comando seja responsiva e segura, sem comprometer a pureza da lógica de negócio. Esta estrutura provê uma fundação sólida, testável e escalável para aplicações de simulação complexas em TypeScript.

#### **Referências citadas**

1. Configuring Your CLI | oclif: The Open CLI Framework, acessado em janeiro 4, 2026, [https://oclif.github.io/docs/configuring\_your\_cli/](https://oclif.github.io/docs/configuring_your_cli/)  
2. oclif: The Open CLI Framework, acessado em janeiro 4, 2026, [https://oclif.io/](https://oclif.io/)  
3. Setting up the Clean Architecture Project with Typescript \- Señor Developer, acessado em janeiro 4, 2026, [https://maxmartinez.dev/setting-up-the-clean-architecture-project-with-typescript](https://maxmartinez.dev/setting-up-the-clean-architecture-project-with-typescript)  
4. A TypeScript Stab at Clean Architecture \- freeCodeCamp, acessado em janeiro 4, 2026, [https://www.freecodecamp.org/news/a-typescript-stab-at-clean-architecture-b51fbb16a304/](https://www.freecodecamp.org/news/a-typescript-stab-at-clean-architecture-b51fbb16a304/)  
5. Process | Node.js v25.2.1 Documentation, acessado em janeiro 4, 2026, [https://nodejs.org/api/process.html](https://nodejs.org/api/process.html)  
6. Event-Driven Architecture of NodeJS \- GeeksforGeeks, acessado em janeiro 4, 2026, [https://www.geeksforgeeks.org/node-js/explain-the-event-driven-architecture-of-node-js/](https://www.geeksforgeeks.org/node-js/explain-the-event-driven-architecture-of-node-js/)  
7. A definitive guide to building a NodeJS app, using Clean Architecture (and TypeScript), acessado em janeiro 4, 2026, [https://vitalii-zdanovskyi.medium.com/a-definitive-guide-to-building-a-nodejs-app-using-clean-architecture-and-typescript-41d01c6badfa](https://vitalii-zdanovskyi.medium.com/a-definitive-guide-to-building-a-nodejs-app-using-clean-architecture-and-typescript-41d01c6badfa)  
8. Building a Todo App with TypeScript Using Clean Architecture: A Detailed Look at the Directory Structure | by Walid Karray | Medium, acessado em janeiro 4, 2026, [https://medium.com/@walid.karray/building-a-todo-app-with-typescript-using-clean-hexagonal-architecture-a-detailed-look-at-the-d9e177f9f31](https://medium.com/@walid.karray/building-a-todo-app-with-typescript-using-clean-hexagonal-architecture-a-detailed-look-at-the-d9e177f9f31)  
9. The Ultimate Clean Architecture Template for TypeScript Projects \- DEV Community, acessado em janeiro 4, 2026, [https://dev.to/aziznal/the-ultimate-clean-architecture-template-for-typescript-projects-3mfd](https://dev.to/aziznal/the-ultimate-clean-architecture-template-for-typescript-projects-3mfd)  
10. Introduction | oclif: The Open CLI Framework, acessado em janeiro 4, 2026, [https://oclif.io/docs/introduction/](https://oclif.io/docs/introduction/)  
11. TSyringe and Dependency Injection in TypeScript \- DEV Community, acessado em janeiro 4, 2026, [https://dev.to/gdsources/tsyringe-and-dependency-injection-in-typescript-3i67](https://dev.to/gdsources/tsyringe-and-dependency-injection-in-typescript-3i67)  
12. esbuild should emit a warning when \`emitDecoratorMetadata\` is found in \`tsconfig\` · Issue \#3680 \- GitHub, acessado em janeiro 4, 2026, [https://github.com/evanw/esbuild/issues/3680](https://github.com/evanw/esbuild/issues/3680)  
13. Support emitting typescript decorator metadata · Issue \#257 · evanw/esbuild \- GitHub, acessado em janeiro 4, 2026, [https://github.com/evanw/esbuild/issues/257](https://github.com/evanw/esbuild/issues/257)  
14. Reflect-metadata doesn't work for tsyringe · Issue \#4677 · oven-sh/bun \- GitHub, acessado em janeiro 4, 2026, [https://github.com/oven-sh/bun/issues/4677](https://github.com/oven-sh/bun/issues/4677)  
15. Command Discovery Strategies | oclif: The Open CLI Framework, acessado em janeiro 4, 2026, [https://oclif.github.io/docs/command\_discovery\_strategies/](https://oclif.github.io/docs/command_discovery_strategies/)  
16. API \- ESBuild, acessado em janeiro 4, 2026, [https://esbuild.github.io/api/](https://esbuild.github.io/api/)  
17. outDir \- TypeScript: TSConfig Option, acessado em janeiro 4, 2026, [https://www.typescriptlang.org/tsconfig/outDir.html](https://www.typescriptlang.org/tsconfig/outDir.html)  
18. how to keep original directory structure？ \#728 \- egoist/tsup \- GitHub, acessado em janeiro 4, 2026, [https://github.com/egoist/tsup/issues/728](https://github.com/egoist/tsup/issues/728)  
19. Implementing NodeJS HTTP Graceful Shutdown \- Blog \- Dashlane, acessado em janeiro 4, 2026, [https://blog.dashlane.com/implementing-nodejs-http-graceful-shutdown/](https://blog.dashlane.com/implementing-nodejs-http-graceful-shutdown/)  
20. Proper Way to Add Graceful Shutdown — Node.js \- Bits and Pieces, acessado em janeiro 4, 2026, [https://blog.bitsrc.io/proper-way-to-add-graceful-shutdown-nodejs-6c7b35c047aa](https://blog.bitsrc.io/proper-way-to-add-graceful-shutdown-nodejs-6c7b35c047aa)  
21. How to properly handle SIGINT with Express.js? \- Stack Overflow, acessado em janeiro 4, 2026, [https://stackoverflow.com/questions/14372288/how-to-properly-handle-sigint-with-express-js](https://stackoverflow.com/questions/14372288/how-to-properly-handle-sigint-with-express-js)  
22. @oclif/test \- npm, acessado em janeiro 4, 2026, [https://www.npmjs.com/package/@oclif/test](https://www.npmjs.com/package/@oclif/test)  
23. oclif runCommand vitest test fails with command X not found \- Stack Overflow, acessado em janeiro 4, 2026, [https://stackoverflow.com/questions/79603195/oclif-runcommand-vitest-test-fails-with-command-x-not-found](https://stackoverflow.com/questions/79603195/oclif-runcommand-vitest-test-fails-with-command-x-not-found)  
24. How not to do dependency injection \- configuring the IoC container in unit test projects, acessado em janeiro 4, 2026, [https://www.devtrends.co.uk/blog/how-not-to-do-dependency-injection-configuring-the-ioc-container-in-unit-test-projects](https://www.devtrends.co.uk/blog/how-not-to-do-dependency-injection-configuring-the-ioc-container-in-unit-test-projects)  
25. TSX vs ts-node: The Definitive TypeScript Runtime Comparison | Better Stack Community, acessado em janeiro 4, 2026, [https://betterstack.com/community/guides/scaling-nodejs/tsx-vs-ts-node/](https://betterstack.com/community/guides/scaling-nodejs/tsx-vs-ts-node/)  
26. Navigating TypeScript Transpilers \- A Guide to tsc, esbuild, and swc | Leapcell, acessado em janeiro 4, 2026, [https://leapcell.io/blog/navigating-typescript-transpilers-a-guide-to-tsc-esbuild-and-swc](https://leapcell.io/blog/navigating-typescript-transpilers-a-guide-to-tsc-esbuild-and-swc)