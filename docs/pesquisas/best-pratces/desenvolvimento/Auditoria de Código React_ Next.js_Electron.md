# **Arquitetura de Software Frontend: Auditoria Técnica e Padrões de Saúde em Ecossistemas Next.js e Electron**

O desenvolvimento de interfaces modernas transcendeu a simples manipulação do Document Object Model (DOM) para se tornar uma disciplina de engenharia de sistemas complexos. No contexto de aplicações que operam simultaneamente em ambientes web, através do Next.js, e desktop, via Electron, a necessidade de uma arquitetura robusta não é apenas uma preferência estética, mas uma condição para a sobrevivência do projeto a longo prazo. A criação de um Agente de Inteligência Artificial voltado para a auditoria técnica de tais projetos exige a definição de parâmetros clínicos que possam medir a "saúde" do código, focando na manutenibilidade e na testabilidade sem se perder na mera verificação da existência de arquivos de teste. A auditoria deve centrar-se na capacidade intrínseca do sistema de ser testado e mantido, o que é um subproduto direto da separação de preocupações e da inversão de dependência.1

A arquitetura de software, quando aplicada ao frontend, busca isolar as regras de negócio das tecnologias de interface, garantindo que mudanças no framework de UI, no cliente de API ou no sistema operacional não provoquem um efeito cascata de erros no núcleo da aplicação.3 Este relatório detalha os critérios de auditoria, os padrões de design recomendados e as métricas de saúde que um Agente de IA deve validar para garantir que um ecossistema baseado em React, TypeScript, Tailwind e Apollo Client permaneça escalável e resiliente.

## **Fundamentos da Arquitetura Limpa e a Auditoria de Saúde do Código**

A base de qualquer projeto frontend saudável reside na aplicação dos princípios de Arquitetura Limpa, que organiza o sistema em camadas concêntricas onde a dependência flui invariavelmente para dentro. O Agente auditor deve validar se o projeto respeita essa hierarquia, impedindo que detalhes de infraestrutura poluam o domínio da aplicação.1 A testabilidade é uma métrica direta desta separação: se uma regra de negócio pode ser verificada sem instanciar um navegador ou um servidor, a arquitetura é considerada saudável.3

### **Camadas Arquiteturais e Fluxo de Dependência**

A estrutura de diretórios e a organização de módulos fornecem o primeiro sinal clínico da saúde do projeto. Uma arquitetura limpa em React deve ser dividida em camadas que isolem a lógica pura do framework de interface.1

| Camada | Função Clínica | Conteúdo Auditável | Dependências Permitidas |
| :---- | :---- | :---- | :---- |
| **Domínio (Domain)** | Núcleo de regras de negócio. | Entidades, Value Objects, Interfaces de Repositório. | Nenhuma (Camada Pura). |
| **Aplicação (Application)** | Orquestração de fluxos de dados. | Casos de Uso (Use Cases), Interactors, DTOs. | Domínio. |
| **Interface (Adapters)** | Conversão de dados para o mundo externo. | Controllers, Presenters, Gateways de API. | Aplicação, Domínio. |
| **Infraestrutura (Infrastructure)** | Detalhes técnicos e ferramentas. | Apollo Client, Electron IPC, Tailwind, UI React. | Todas as camadas internas. |

A auditoria deve verificar se não existem importações cruzadas que violem esta ordem. Por exemplo, uma entidade de domínio nunca deve importar um hook do React ou um tipo específico do Apollo Client.2 Se a camada de domínio for contaminada por dependências de infraestrutura, a manutenção torna-se arriscada, pois qualquer atualização de biblioteca pode quebrar a lógica central do negócio.3

### **Inversão de Dependência como Métrica de Testabilidade**

O Princípio de Inversão de Dependência (DIP) estabelece que módulos de alto nível não devem depender de módulos de baixo nível, mas ambos devem depender de abstrações.2 Em um sistema auditável, as camadas de aplicação utilizam interfaces para interagir com o mundo externo. O Agente auditor deve buscar padrões onde os repositórios são definidos por contratos (interfaces TypeScript) e as implementações reais são injetadas em tempo de execução ou via containers de Inversão de Controle (IoC).2

Essa técnica permite que, durante os testes, o auditor possa substituir um repositório que faz chamadas reais ao Apollo Client por um "mock" que retorna dados estáticos, permitindo a validação da lógica de negócio em milissegundos e sem efeitos colaterais de rede.3 A ausência de interfaces de repositório é um indicador de alto acoplamento e baixa testabilidade.2

## **O Ecossistema Next.js: Auditoria de Server e Client Components**

A transição do Next.js para o modelo de React Server Components (RSC) introduziu uma nova fronteira arquitetural que o Agente auditor deve monitorar. A saúde de um projeto Next.js é medida pela clareza na distinção entre o que é processado no servidor e o que é interativo no cliente.6

### **A Pureza dos Server Components**

Os Server Components devem ser tratados como a camada de entrada de dados primária. O auditor deve validar se estes componentes permanecem "magros", limitando-se a buscar dados via Casos de Uso e passá-los para componentes de apresentação.6 A lógica de negócio pesada deve residir em funções assíncronas no servidor, evitando que o JavaScript de processamento seja enviado ao navegador do usuário.6

| Indicador de Saúde RSC | Estado Desejado | Sinal de Patologia (Code Smell) |
| :---- | :---- | :---- |
| **Diretiva 'use client'** | Aplicada apenas em folhas da árvore (folhas interativas). | Aplicada no topo da árvore ou em componentes de layout globais. |
| **Busca de Dados** | Realizada diretamente no servidor via fetch ou Use Cases. | Realizada via useEffect ou useQuery no cliente sem necessidade. |
| **Segurança** | Segredos de API acessados apenas em Server Components. | Chaves de API expostas em props passadas para Client Components. |
| **Tamanho do Bundle** | Lógica de transformação de dados executada no servidor. | Bibliotecas pesadas (ex: date-fns) importadas em Client Components. |

A auditoria clínica deve sinalizar como risco o uso excessivo de hooks de estado em componentes que poderiam ser puramente estáticos ou gerados no servidor. A eficiência hídrica da aplicação — a quantidade de hidratação necessária no cliente — é um fator determinante para a performance e manutenibilidade.6

### **Auditoria de Server Actions e Camada de API**

As Server Actions representam uma evolução na forma como o frontend interage com o backend, eliminando a necessidade de gerenciar endpoints REST/GraphQL manuais para mutações simples. Contudo, elas podem se tornar um "depósito de lógica" se não forem devidamente auditadas.1 O Agente auditor deve verificar se as Server Actions atuam meramente como adaptadores que validam a entrada (usando esquemas como Zod) e delegam a execução para a camada de Aplicação.1

A testabilidade das Server Actions é garantida quando elas são desacopladas da lógica de negócio. Se o auditor identificar que uma Action contém cálculos complexos ou regras de validação cruzada que não estão documentadas no Domínio, ele deve recomendar a refatoração para garantir que essa lógica possa ser testada unitariamente fora do contexto do Next.js.1

## **A Arquitetura Electron: Isolamento e Segurança de Processos**

O Electron combina o poder do Node.js com a flexibilidade do Chromium, mas essa união traz riscos significativos de segurança e complexidade arquitetural. Uma auditoria clínica deve focar no isolamento entre o processo Main (principal) e os processos Renderer (renderização).10

### **O Papel Crítico do ContextBridge e Preload Scripts**

A saúde de uma aplicação Electron é medida pela integridade da sua ponte de comunicação. O Agente auditor deve invalidar qualquer projeto que utilize nodeIntegration: true ou que exponha o módulo ipcRenderer diretamente ao frontend.10 O padrão ouro exige o uso de um script de preload que utiliza o contextBridge para expor uma API mínima e segura ao objeto window.10

Essa camada de abstração não serve apenas para segurança; ela é fundamental para a testabilidade. Ao definir uma API de ponte clara (ex: window.electronAPI), o auditor pode validar se o frontend é capaz de funcionar em um ambiente de navegador comum através de "shims" ou mocks, permitindo testes de UI sem a necessidade de rodar todo o ambiente Electron.13

### **Abstração de Serviços Cross-Platform**

Aplicações saudáveis que visam web e desktop devem implementar um padrão de "Shell com Núcleo Compartilhado". A auditoria deve verificar se o código de UI é agnóstico ao ambiente.12 Se o componente React precisa salvar um arquivo, ele não deve chamar o fs do Node.js nem o IPC do Electron diretamente; ele deve chamar um serviço de FileStorage injetado.7

| Ambiente | Implementação do Serviço | Mecanismo de Injeção |
| :---- | :---- | :---- |
| **Web (Next.js)** | Cloud API ou LocalStorage. | Injeção via Context/DI no build web. |
| **Desktop (Electron)** | Sistema de arquivos local via IPC. | Injeção via Context/DI no build desktop. |

O Agente auditor deve buscar por ramificações condicionais (ex: if (window.electron)) espalhadas pelo código. A presença de tais condicionais dentro de componentes de UI é um indicador de arquitetura frágil. O comportamento específico de plataforma deve ser resolvido na camada de infraestrutura ou no momento da inicialização (bootstrap) da aplicação.4

## **Estratégias de Dados com Apollo Client sem Estado Global**

A decisão de evitar bibliotecas de estado global como Redux ou Zustand coloca uma responsabilidade adicional sobre o Apollo Client e os hooks nativos do React. A auditoria deve garantir que o cache do Apollo não se torne uma "caixa preta" de dados desestruturados e que a lógica de busca de dados não esteja acoplada à UI.19

### **Desacoplamento via Custom Hooks de Dados**

A inserção direta de useQuery em componentes complexos é um sintoma de baixa manutenibilidade. O Agente auditor deve exigir que cada entidade ou funcionalidade de dados possua seus próprios Custom Hooks.20 Um hook saudável deve abstrair a query GraphQL, tratar a normalização inicial dos dados e fornecer estados de erro e carregamento que façam sentido para o domínio, e não apenas repassar o estado bruto do Apollo.20

A testabilidade desses hooks é verificada através da sua capacidade de serem testados de forma isolada usando provedores de mock (como o MockedProvider do Apollo). Se o hook estiver muito acoplado a outros estados globais ou contextos específicos de UI, ele falhará no critério de isolamento.21

### **Gestão de Cache e Consistência de Dados**

Sem um gerenciador de estado externo, o cache do Apollo atua como a única fonte de verdade para dados vindos do servidor. A auditoria deve monitorar a eficácia das atualizações de cache. O uso de refetchQueries deve ser desencorajado em favor de atualizações granulares via cache.modify ou uso de fragmentos compartilhados, que garantem que todos os componentes ouvintes sejam atualizados automaticamente sem tráfego de rede desnecessário.22

Para estados locais persistentes (como preferências de UI), o auditor deve validar o uso de Reactive Variables ou queries locais com a diretiva @client. Esses mecanismos permitem que o estado local seja gerenciado com a mesma interface das queries de servidor, mantendo a consistência arquitetural.21

## **Encapsulamento de Lógica em Custom Hooks Nativos**

A essência de um componente React saudável é sua natureza declarativa. Toda lógica imperativa, cálculos derivados e coordenação de efeitos devem ser extraídos para Custom Hooks.8 Esta prática não apenas limpa a visualização do componente, mas transforma a lógica de negócio em unidades independentes e auditáveis.24

### **Auditoria de Responsabilidade Única (SRP)**

O Agente de IA deve analisar a proporção entre código JSX e código lógico dentro dos componentes. Componentes que excedem 150-200 linhas de código costumam esconder múltiplas responsabilidades.28 O auditor deve sinalizar componentes que gerenciam simultaneamente estados de UI, chamadas de API e manipulação de eventos complexos.

A lógica deve ser fatorada seguindo o padrão de "Controlador e Visão". O componente React atua como a visão, enquanto o Custom Hook atua como o controlador que fornece o estado e as ações necessárias.30 Se o auditor conseguir descrever o que o hook faz sem mencionar nenhum elemento visual, o encapsulamento é considerado bem-sucedido.24

### **Métrica de Saúde: Complexidade de Efeitos**

O hook useEffect é frequentemente mal utilizado para sincronizar estados que poderiam ser derivados. O Agente auditor deve monitorar a complexidade ciclomática dos efeitos. Efeitos com muitas dependências ou que disparam atualizações de estado em cadeia são fontes primárias de bugs de performance e inconsistência.28

Para medir a testabilidade de um componente, o auditor pode aplicar a análise de dependência de efeitos:

![][image1]  
Onde ![][image2] é o índice de testabilidade, ![][image3] é o número de dependências em um efeito e ![][image4] é o número de efeitos colaterais disparados. Quanto menor o valor de ![][image2], mais difícil é prever o comportamento do componente e, consequentemente, testá-lo.28

## **Formulários e Validação sem Bibliotecas Externas**

A ausência de bibliotecas como React Hook Form exige uma abordagem disciplinada no uso de useState, useReducer e das APIs nativas do navegador. A auditoria deve validar se a complexidade do formulário é compatível com a estratégia de estado escolhida.32

### **A Transição Clínica de useState para useReducer**

Formulários pequenos podem ser gerenciados com useState individual para cada campo. Contudo, assim que surge uma dependência entre campos ou validações cruzadas, a manutenção desse estado torna-se frágil.32 O Agente auditor deve recomendar a transição para useReducer quando o formulário apresenta as seguintes características:

1. Mais de 5 campos de entrada.  
2. Campos que dependem dos valores de outros (ex: selecionar país altera as opções de estado).  
3. Necessidade de resetar ou carregar todo o estado do formulário de uma vez.34

O useReducer permite que a lógica de transição de estado seja testada como uma função pura, independente do React. O auditor deve verificar se o reducer é definido fora da função do componente, o que é um indicador chave de testabilidade unitária.32

### **Validação via Constraint Validation API**

O Agente auditor deve buscar o uso extensivo de validação declarativa através do HTML5. Atributos como required, pattern, min, max e type fornecem uma base de validação que não consome bundle de JavaScript e é respeitada pelo navegador e por tecnologias assistivas.37

Uma arquitetura de formulário auditável utiliza o useRef para interagir com a API de validação nativa. O auditor deve validar o fluxo onde a aplicação captura o evento de invalid para exibir mensagens de erro customizadas, mas deixa o "trabalho pesado" de verificar a conformidade para o navegador.37 Esta abordagem reduz drasticamente a quantidade de código que precisa ser mantido e testado manualmente.37

## **TypeScript como Alicerce de Auditoria e Documentação Tipo-Estática**

TypeScript em um projeto React de alta escala não é apenas um verificador de tipos, mas o contrato que define como os módulos interagem. A saúde do projeto está intrinsecamente ligada ao rigor do compilador e à expressividade das interfaces.39

### **Configuração Estrita e Eliminação do Tipo 'Any'**

O Agente auditor deve começar sua análise pelo arquivo tsconfig.json. Configurações permissivas são janelas para dívida técnica oculta. O auditor deve validar a presença de:

* strict: true: Ativa todas as verificações rigorosas de tipo.  
* noImplicitAny: true: Impede que variáveis assumam o tipo any silenciosamente.  
* strictNullChecks: true: Garante que valores null ou undefined sejam tratados explicitamente, eliminando uma das maiores causas de erros em produção.39

O uso do tipo any ou de casts agressivos com o operador as deve ser tratado pelo auditor como uma falha de integridade. Em vez disso, deve-se encorajar o uso de unknown com guardas de tipo (type guards) ou funções de asserção, que forçam o desenvolvedor a provar a forma do dado antes de usá-lo.39

### **Modelagem com Uniões Discriminadas**

Para auditar a clareza do código, o auditor deve buscar o uso de Uniões Discriminadas em estados complexos. Em vez de ter múltiplas flags booleanas independentes (ex: isSuccess, isError, data), que podem levar a estados impossíveis (como isSuccess e isError sendo true simultaneamente), um estado saudável é modelado como uma união de tipos com uma propriedade discriminante (ex: status: 'idle' | 'loading' | 'success' | 'error').39

Esta prática torna o código autodocumentado e facilita a auditoria por IA, pois o fluxo lógico torna-se previsível e exaustivo. O auditor pode verificar se todos os casos de uma união estão sendo tratados em instruções switch ou blocos condicionais.39

## **Tailwind CSS: Escalabilidade Visual e Manutenibilidade de Estilos**

A escolha pelo Tailwind CSS permite uma abordagem de design system atômico que, se bem estruturada, simplifica a auditoria visual do código. Contudo, o uso desordenado de utilitários pode comprometer a legibilidade.42

### **Componentização de Estilos e Design Tokens**

O auditor deve validar se o projeto evita a duplicação de longas strings de classes. A saúde estética é mantida através da criação de componentes de base que encapsulam a identidade visual. Em vez de repetir px-4 py-2 bg-blue-500 rounded em todos os botões, o auditor deve esperar encontrar um componente \<Button /\>.30

A auditoria também deve verificar se o arquivo tailwind.config.ts é a única fonte de verdade para tokens de design. O uso excessivo de valores arbitrários (ex: text-\[13px\] ou bg-\[\#f4f4f4\]) espalhados pelo código indica uma falha na padronização visual e dificulta manutenções globais, como uma alteração na paleta de cores da marca ou ajuste de espaçamentos para acessibilidade.43

### **Utilitários de Combinação e Condicionais de Estilo**

A manipulação dinâmica de classes deve ser feita de forma robusta. O Agente auditor deve procurar pelo uso de utilitários como clsx ou tailwind-merge para evitar conflitos de classes quando múltiplas condições se aplicam ao mesmo elemento.28 A legibilidade de componentes com muitas variantes visuais é melhorada pelo uso de bibliotecas de variantes como a class-variance-authority (CVA), que permite definir estilos baseados em props de forma declarativa e tipada.47

## **Guia de Checklists de Arquitetura para o Agente Auditor**

Para que o Agente de IA possa atuar como um auditor técnico eficaz, os critérios de avaliação devem ser transformados em checklists objetivos. Estes checklists medem a conformidade do código com os princípios de saúde arquitetural estabelecidos.28

### **Tabela 1: Checklist de Estrutura e Camadas (Clean Architecture)**

| Critério de Auditoria | Pergunta de Validação para a IA | Gravidade se Falhar |
| :---- | :---- | :---- |
| **Isolamento de Domínio** | Existem importações de bibliotecas de terceiros (ex: React, Apollo) em arquivos de domínio? | **Alta** |
| **Casos de Uso Abstratos** | A lógica de negócio está em funções puras que recebem apenas dados primitivos ou entidades? | **Média** |
| **Inversão de Repositório** | Os componentes de UI dependem de interfaces de repositório ou de implementações concretas? | **Média** |
| **Fronteiras de Camada** | Existem importações circulares entre as pastas domain, application e infrastructure? | **Crítica** |

### **Tabela 2: Checklist de Ecossistema Next.js e Electron**

| Critério de Auditoria | Pergunta de Validação para a IA | Referência Técnica |
| :---- | :---- | :---- |
| **Pureza RSC** | Quantos componentes de servidor contêm a diretiva 'use client' desnecessariamente? | 6 |
| **Segurança Electron** | O projeto utiliza contextBridge para isolar o processo Main do Renderer? | 10 |
| **Agnosticismo de SO** | Chamadas a APIs nativas (ex: FS, Dialog) estão isoladas em serviços injetáveis? | 16 |
| **Validação de Actions** | Todas as Server Actions validam o payload de entrada usando esquemas (ex: Zod)? | 9 |

### **Tabela 3: Checklist de Lógica de React e TypeScript**

| Critério de Auditoria | Pergunta de Validação para a IA | Gravidade se Falhar |
| :---- | :---- | :---- |
| **Encapsulamento de Hooks** | A lógica de estado e efeitos está contida em Custom Hooks fora do componente principal? | **Média** |
| **Saúde de Efeitos** | Existem useEffect sem dependências declaradas ou com dependências que causam loops? | **Alta** |
| **Rigor de Tipagem** | Qual a porcentagem de uso do tipo any ou as em comparação com tipos explícitos? | **Média** |
| **Estados Impossíveis** | O estado é gerenciado por flags booleanas esparsas ou por Uniões Discriminadas? | **Baixa** |

### **Tabela 4: Checklist de Apollo Client e Dados**

| Critério de Auditoria | Pergunta de Validação para a IA | Referência Técnica |
| :---- | :---- | :---- |
| **Abstração GraphQL** | Os documentos GraphQL (gql) estão definidos dentro ou fora dos componentes de UI? | 20 |
| **Normalização de Cache** | O projeto utiliza IDs consistentes para permitir a normalização automática do cache? | 21 |
| **Atualização Granular** | Após mutações, o sistema faz refetch total ou atualiza campos específicos no cache? | 22 |
| **Estado Local Apollo** | Variáveis reativas são usadas para estados que precisam persistir entre rotas? | 26 |

## **Medindo a Saúde Clínica: Métricas de Auditoria Automatizável**

Para que a auditoria seja quantitativa, o Agente de IA pode calcular índices de saúde baseados em estática de código. Estas métricas fornecem uma visão objetiva da manutenibilidade do sistema.28

### **Índice de Manutenibilidade (MI)**

O índice de manutenibilidade é um valor calculado que varia de 0 a 100 e representa a facilidade de manter o código. Um valor abaixo de 65 indica que o código é difícil de manter e deve ser refatorado.28 A fórmula simplificada é:

![][image5]  
Onde:

* ![][image6] é o Volume de Halstead (quantidade de operadores e operandos).  
* ![][image7] é a Complexidade Ciclomática (número de caminhos lógicos independentes).  
* ![][image8] é o número de linhas de código fonte.

### **Coesão e Acoplamento em Componentes**

A saúde arquitetural também pode ser medida pela métrica de **LACK (Lack of Cohesion in Methods)** adaptada para componentes funcionais e hooks. Se um Custom Hook retorna 10 funções, mas cada componente que o utiliza usa apenas 1 ou 2, o hook está perdendo sua coesão e tornando-se um "God Hook".28

O auditor deve validar o **Grau de Fan-in e Fan-out**:

* **Fan-in**: Quantos componentes dependem de um determinado hook ou utilitário? Um Fan-in alto em módulos de infraestrutura é aceitável, mas em módulos de UI pode indicar acoplamento excessivo.  
* **Fan-out**: De quantos módulos externos um componente depende? Um Fan-out alto (\> 7\) é um sinal clínico de que o componente está fazendo coisas demais.28

## **Considerações Finais e Visão de Futuro para a Auditoria Técnica**

A arquitetura frontend evoluiu para um estado onde a separação de preocupações não é mais opcional, especialmente em aplicações híbridas que fundem as fronteiras entre o desktop e a nuvem. Um Agente de IA capaz de auditar tais sistemas deve possuir uma compreensão profunda não apenas das bibliotecas utilizadas, mas de como a estrutura do código permite ou impede a evolução do software.

A manutenibilidade é garantida quando o auditor verifica que cada decisão técnica — do uso de Tailwind à abstração do Apollo — serve ao propósito de manter o núcleo da aplicação puro e testável. A testabilidade, por sua vez, deixa de ser uma tarefa de escrita de arquivos .test.ts para se tornar uma propriedade emergente de um design que prioriza a inversão de dependência e o desacoplamento de frameworks.

Para o futuro, espera-se que tais auditorias clínicas integrem análises de fluxo de dados em tempo real e verificação formal de tipos, garantindo que a saúde do projeto seja monitorada não apenas durante revisões de código, mas como uma parte integrante do ciclo de vida de desenvolvimento, transformando a "saúde do código" em um indicador de desempenho chave (KPI) mensurável e acionável. A adoção rigorosa dos checklists e métricas aqui apresentados posiciona qualquer projeto Next.js e Electron na vanguarda da qualidade de engenharia de software moderna.

#### **Referências citadas**

1. Clean Architecture in Next.js 14: A Practical Guide | by Entekume ..., acessado em fevereiro 4, 2026, [https://medium.com/@entekumejeffrey/image-source-the-clean-code-blog-https-blog-cleancoder-com-uncle-bob-2012-08-13-the-clean-arch-c5fa5b84ca10](https://medium.com/@entekumejeffrey/image-source-the-clean-code-blog-https-blog-cleancoder-com-uncle-bob-2012-08-13-the-clean-arch-c5fa5b84ca10)  
2. nikolovlazar/nextjs-clean-architecture: Watch tutorial: https ... \- GitHub, acessado em fevereiro 4, 2026, [https://github.com/nikolovlazar/nextjs-clean-architecture](https://github.com/nikolovlazar/nextjs-clean-architecture)  
3. Clean Architecture in Next.js 14: A Practical Guide (Part Two) | by Entekume jeffrey | Medium, acessado em fevereiro 4, 2026, [https://medium.com/@entekumejeffrey/clean-architecture-in-next-js-14-a-practical-guide-part-two-3e5d8dbf5a7c](https://medium.com/@entekumejeffrey/clean-architecture-in-next-js-14-a-practical-guide-part-two-3e5d8dbf5a7c)  
4. Production-Proven Clean Architecture in Next.js: A Practical Guide \- DEV Community, acessado em fevereiro 4, 2026, [https://dev.to/behnamrhp/stop-spaghetti-code-how-clean-architecture-saves-nextjs-projects-4l18](https://dev.to/behnamrhp/stop-spaghetti-code-how-clean-architecture-saves-nextjs-projects-4l18)  
5. Unit Testing AI Systems for Robust Performance \- Galileo AI, acessado em fevereiro 4, 2026, [https://galileo.ai/blog/unit-testing-ai-systems-first-principles](https://galileo.ai/blog/unit-testing-ai-systems-first-principles)  
6. SaaS Architecture Patterns with Next.js: Complete Development Guide \- Vladimir Siedykh, acessado em fevereiro 4, 2026, [https://vladimirsiedykh.com/blog/saas-architecture-patterns-nextjs](https://vladimirsiedykh.com/blog/saas-architecture-patterns-nextjs)  
7. The ultimate Electron app with Next.js and React Server Components | by Kirill Konshin, acessado em fevereiro 4, 2026, [https://medium.com/@kirill.konshin/the-ultimate-electron-app-with-next-js-and-react-server-components-a5c0cabda72b](https://medium.com/@kirill.konshin/the-ultimate-electron-app-with-next-js-and-react-server-components-a5c0cabda72b)  
8. Creating custom hooks using Apollo in React | by Selina Byeon | Dev Genius \- DevGenius.io, acessado em fevereiro 4, 2026, [https://blog.devgenius.io/creating-custom-hooks-using-apollo-in-react-c93ca13cd0c3](https://blog.devgenius.io/creating-custom-hooks-using-apollo-in-react-c93ca13cd0c3)  
9. React 19 Form Hooks vs react-hook-form: A Complete Comparison \- DEV Community, acessado em fevereiro 4, 2026, [https://dev.to/wildboar\_developer/react-19-form-hooks-vs-react-hook-form-a-complete-comparison-34kn](https://dev.to/wildboar_developer/react-19-form-hooks-vs-react-hook-form-a-complete-comparison-34kn)  
10. Inter-Process Communication \- Electron, acessado em fevereiro 4, 2026, [https://electronjs.org/docs/latest/tutorial/ipc](https://electronjs.org/docs/latest/tutorial/ipc)  
11. Inter-Process Communication (IPC) in ElectronJS \- GeeksforGeeks, acessado em fevereiro 4, 2026, [https://www.geeksforgeeks.org/node-js/inter-process-communication-ipc-in-electronjs/](https://www.geeksforgeeks.org/node-js/inter-process-communication-ipc-in-electronjs/)  
12. Advanced Electron.js architecture \- LogRocket Blog, acessado em fevereiro 4, 2026, [https://blog.logrocket.com/advanced-electron-js-architecture/](https://blog.logrocket.com/advanced-electron-js-architecture/)  
13. Electron \+ Next.js: Build a Desktop App Without Nextron \- Prishusoft, acessado em fevereiro 4, 2026, [https://prishusoft.com/blog/electron-nextjs-without-nextron](https://prishusoft.com/blog/electron-nextjs-without-nextron)  
14. Electron nextjs \- DEV Community, acessado em fevereiro 4, 2026, [https://dev.to/turingvangisms/electron-nextjs-477o](https://dev.to/turingvangisms/electron-nextjs-477o)  
15. Building Desktop Apps Reinvented: A Next.js & Electron Monorepo Template, acessado em fevereiro 4, 2026, [https://tharushkaheshan.medium.com/building-desktop-apps-reinvented-a-next-js-electron-monorepo-template-a825d163258a](https://tharushkaheshan.medium.com/building-desktop-apps-reinvented-a-next-js-electron-monorepo-template-a825d163258a)  
16. Approaches to Electron application architecture | by Corey Flynn ..., acessado em fevereiro 4, 2026, [https://medium.com/@coreyjflynn/approaches-to-electron-application-architecture-a1a8357b74fc](https://medium.com/@coreyjflynn/approaches-to-electron-application-architecture-a1a8357b74fc)  
17. Electron vs Web Apps (specifically, with React) \[closed\] \- Stack Overflow, acessado em fevereiro 4, 2026, [https://stackoverflow.com/questions/55639442/electron-vs-web-apps-specifically-with-react](https://stackoverflow.com/questions/55639442/electron-vs-web-apps-specifically-with-react)  
18. How would you package an cross-platform (Desktop and browser) app with Electron.js?, acessado em fevereiro 4, 2026, [https://www.reddit.com/r/electronjs/comments/1ij9xzi/how\_would\_you\_package\_an\_crossplatform\_desktop/](https://www.reddit.com/r/electronjs/comments/1ij9xzi/how_would_you_package_an_crossplatform_desktop/)  
19. Get started with Apollo Client \- Apollo GraphQL Docs, acessado em fevereiro 4, 2026, [https://www.apollographql.com/docs/react/get-started](https://www.apollographql.com/docs/react/get-started)  
20. useQuery in REACT with Apollo Client | by Wayne Chen \- Medium, acessado em fevereiro 4, 2026, [https://medium.com/@wayne80361/usequery-in-react-with-apollo-client-b5de830be308](https://medium.com/@wayne80361/usequery-in-react-with-apollo-client-b5de830be308)  
21. Testing React components \- Apollo GraphQL Docs, acessado em fevereiro 4, 2026, [https://www.apollographql.com/docs/react/development-testing/testing](https://www.apollographql.com/docs/react/development-testing/testing)  
22. Managing State with React and Apollo Client | DoltHub Blog, acessado em fevereiro 4, 2026, [https://www.dolthub.com/blog/2021-09-15-state-using-apollo-client/](https://www.dolthub.com/blog/2021-09-15-state-using-apollo-client/)  
23. React Hooks in Apollo Client for GraphQL Queries and Mutations \- Atheros Learning, acessado em fevereiro 4, 2026, [https://learning.atheros.ai/blog/react-hooks-in-apollo-client-for-graphql-queries-and-mutations](https://learning.atheros.ai/blog/react-hooks-in-apollo-client-for-graphql-queries-and-mutations)  
24. the case for writing business logic in custom hooks, with a sort of MVVM pattern \- Reddit, acessado em fevereiro 4, 2026, [https://www.reddit.com/r/reactjs/comments/1g8i778/the\_case\_for\_writing\_business\_logic\_in\_custom/](https://www.reddit.com/r/reactjs/comments/1g8i778/the_case_for_writing_business_logic_in_custom/)  
25. Using the new Apollo Client React Hooks implementation | by Christopher Bartling | Medium, acessado em fevereiro 4, 2026, [https://medium.com/@cbartling/using-the-new-apollo-client-react-hooks-implementation-8ab998c79aee](https://medium.com/@cbartling/using-the-new-apollo-client-react-hooks-implementation-8ab998c79aee)  
26. Simplifying Apollo Client Local Cache with React Hooks \- Atomic Spin, acessado em fevereiro 4, 2026, [https://spin.atomicobject.com/simplifying-apollo-client-local-cache/](https://spin.atomicobject.com/simplifying-apollo-client-local-cache/)  
27. Local state management with Apollo and React hooks. | by Sean Rennie \- Medium, acessado em fevereiro 4, 2026, [https://sean-rennie.medium.com/local-state-management-with-apollo-and-react-hooks-e242d3efc7bf](https://sean-rennie.medium.com/local-state-management-with-apollo-and-react-hooks-e242d3efc7bf)  
28. Front-end JavaScript/TypeScript Code Review Checklist \- GitHub, acessado em fevereiro 4, 2026, [https://gist.github.com/OleksandrKucherenko/e09b4d2a8be484d2b72aaeee22d1de71](https://gist.github.com/OleksandrKucherenko/e09b4d2a8be484d2b72aaeee22d1de71)  
29. Code Review Checklist for JavaScript/React \- IBM TechXchange Community, acessado em fevereiro 4, 2026, [https://community.ibm.com/community/user/blogs/marina-mascarenhas/2025/07/15/code-review-checklist-for-javascriptreact](https://community.ibm.com/community/user/blogs/marina-mascarenhas/2025/07/15/code-review-checklist-for-javascriptreact)  
30. React Code Review Checklist: Boost Security & Performance \- Redwerk, acessado em fevereiro 4, 2026, [https://redwerk.com/blog/react-code-review-checklist-boost-security-performance/](https://redwerk.com/blog/react-code-review-checklist-boost-security-performance/)  
31. 5 Design Patterns for Building Scalable Next.js Applications \- DEV Community, acessado em fevereiro 4, 2026, [https://dev.to/nithya\_iyer/5-design-patterns-for-building-scalable-nextjs-applications-1c80](https://dev.to/nithya_iyer/5-design-patterns-for-building-scalable-nextjs-applications-1c80)  
32. Difference Between useState and useReducerHook \- GeeksforGeeks, acessado em fevereiro 4, 2026, [https://www.geeksforgeeks.org/reactjs/difference-between-usestate-and-usereducer/](https://www.geeksforgeeks.org/reactjs/difference-between-usestate-and-usereducer/)  
33. Code Reviews in Frontend Teams: Best Practices for Developers \- Medium, acessado em fevereiro 4, 2026, [https://medium.com/@ignatovich.dm/code-reviews-in-frontend-teams-best-practices-for-developers-55ac475553ec](https://medium.com/@ignatovich.dm/code-reviews-in-frontend-teams-best-practices-for-developers-55ac475553ec)  
34. React Forms Battle: useState vs. useReducer vs. react-hook-form — Which One Should You Use? | by craftByPhanitha | Medium, acessado em fevereiro 4, 2026, [https://medium.com/@emailtophanitham/react-forms-battle-usestate-vs-usereducer-vs-react-hook-form-which-one-should-you-use-38a07ff223c2](https://medium.com/@emailtophanitham/react-forms-battle-usestate-vs-usereducer-vs-react-hook-form-which-one-should-you-use-38a07ff223c2)  
35. Choosing between useReducer and useState in React \- Saeloun Blog, acessado em fevereiro 4, 2026, [https://blog.saeloun.com/2023/03/30/when-to-use-usestate-vs-usereducer/](https://blog.saeloun.com/2023/03/30/when-to-use-usestate-vs-usereducer/)  
36. Can someone please explain the difference between useState and useReducer hook like I'm 5? : r/reactjs \- Reddit, acessado em fevereiro 4, 2026, [https://www.reddit.com/r/reactjs/comments/ry256i/can\_someone\_please\_explain\_the\_difference\_between/](https://www.reddit.com/r/reactjs/comments/ry256i/can_someone_please_explain_the_difference_between/)  
37. You don't need a validation library: how to build accessible React ..., acessado em fevereiro 4, 2026, [https://www.kevinmcgillivray.net/react-form-validation/](https://www.kevinmcgillivray.net/react-form-validation/)  
38. Implement Form Validation in React Without Any Libraries ..., acessado em fevereiro 4, 2026, [https://hackernoon.com/implement-form-validation-in-react-without-any-libraries](https://hackernoon.com/implement-form-validation-in-react-without-any-libraries)  
39. TypeScript Code Review: Best Practices, Tools, and Checklist \- Bito AI, acessado em fevereiro 4, 2026, [https://bito.ai/blog/typescript-code-review/](https://bito.ai/blog/typescript-code-review/)  
40. Typescript Code Quality | Checklist \- Kodus, acessado em fevereiro 4, 2026, [https://kodus.io/en/typescript-code-quality/](https://kodus.io/en/typescript-code-quality/)  
41. Angular Code Review: Checklist, Best Practices, and Tools \- DevCom, acessado em fevereiro 4, 2026, [https://devcom.com/tech-blog/angular-code-review-checklist/](https://devcom.com/tech-blog/angular-code-review-checklist/)  
42. Tailwind CSS \- Rapidly build modern websites without ever leaving your HTML., acessado em fevereiro 4, 2026, [https://tailwindcss.com/](https://tailwindcss.com/)  
43. React with Tailwind: Building Fast, Responsive, and Scalable Interfaces \- DEV Community, acessado em fevereiro 4, 2026, [https://dev.to/santiaghou/react-with-tailwind-building-fast-responsive-and-scalable-interfaces-cpk](https://dev.to/santiaghou/react-with-tailwind-building-fast-responsive-and-scalable-interfaces-cpk)  
44. React UI Component Library Built with Tailwind CSS \- Tailgrids, acessado em fevereiro 4, 2026, [https://tailgrids.com/react](https://tailgrids.com/react)  
45. Tailwind CSS – 5-Minute Quick Review for React Developers \- DEV Community, acessado em fevereiro 4, 2026, [https://dev.to/tishonator/tailwind-css-5-minute-quick-review-for-react-developers-1np5](https://dev.to/tishonator/tailwind-css-5-minute-quick-review-for-react-developers-1np5)  
46. Responsive design \- Core concepts \- Tailwind CSS, acessado em fevereiro 4, 2026, [https://tailwindcss.com/docs/responsive-design](https://tailwindcss.com/docs/responsive-design)  
47. Frontend Handbook | React / Tailwind / Best practices \- Infinum, acessado em fevereiro 4, 2026, [https://infinum.com/handbook/frontend/react/tailwind/best-practices](https://infinum.com/handbook/frontend/react/tailwind/best-practices)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAA0CAYAAAA312SWAAADl0lEQVR4Xu3dTchtUxgH8BUXIR/llo/JLUJkILpToiSJYmYiBqKYUAZKSpm4mRO5+UhChDJlYCpfpUwwoRRC8v25ns4+3vU+d+/z7nOdc89+8/vVv7PXs9fZ531nT2uds3cpAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAByePbkAAMA0fFXzdxcAACbqnqJhAwCYNA0bAMDEadgAACZOwwYAMHEaNgCAidOwAQBM2Ftl67YeH9bct/00AAAAAJStFaShAACwYQ83x9Gg3dCMn2qOAQDYgHvTOK+ovZ3GAABs0FHl0IYNAIAJeaPmj1wc4dmUZ8psK/VgzRM11/47EwCA/yRW1zRXAAATNrQd+lrN87nYOLBDrtuaCgDA4Tqu9DdsH3Wv+7ZVAQA4YvbW/FDzTc23Nb/WPNSc72vidpP4+7+uubDmgu71oppLam6tebKbEzm2e09rp+/0xXU25eyaD3IRAPj/+aR7vXNbdfXOqHm35sV8YgWiGTs3F5Mza35Pte/SOHu8zH6osUkn1FyTiwAA6/J6Wa5h258LA64v41YKH0zj99M4i2sek4sbMOZ/AwBYiXU1bOGnslxj83Lp3yJtjb3e1TVH52KZbT+vQjyUHgDgiFhnwxaiwTo5FwcMNWOP1LxTZk+AGJrTJ8+9sebEVMvi17nx/cL83uzmMltFBABYu2jYXsrFBZZt2O4vOzc/c33zPq25rTuOhuvn5twY82vGe09qT/SIufHkiXBae6JHfP/v6VwEAFiHaNhiK7JPbE9GE7MoY8S8v3KxR9/12toXNZc34zh3RTMeEvNOz8XktzJbWYsffMT8i5tzzzXHrY9zAQBgHaJhezUXF1h2hS38mAsDcsN2Xqrl82PMG8U7yuLvxy177WgAX8lFAIB1iIYtMtayDdsyTU1f0zSvHd8cn1pmz0/tm9/Kq3q3l+FfmMb98M5qxqeU2Rbq96X/c26quSoXAQBW6a6aL2s+7xI3uh1jmYbtsjLcIM21v+S8pebSZhxiOzIapn1ltiUaW5dzjzXH2Tm50Fl0/7Rfyuyzonlr/ZnGId8/DgBgMuJO/2PsqbkyF3vk1as8HvJC93pwW3X14kkNsbp3fqqP/TsBACZrp23WaPyi6Xk01dtHdC1yd817ubgGsf36Wao9kMYAALtONGJj02fKN6V9sxy62gYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMDu8w+eTbc3hpx76gAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAYCAYAAAD3Va0xAAAAyklEQVR4XmNgGAXEgs1A/J8EjBOAJMOwiKFr0sAiBgdCDBAXIQMmBoiGC2jiIPAIXQAGtgIxI5pYAQPEIH80cTYg7kMTg4N8dAEgeM+A3QsCQCyOLogPYAsfkgEzA8SQM+gSpIJyBohB3ugSpILPDFTwFghQJXxA0UtM+FwE4pVA/BpdAgZmM0AMSkATRwYgeVCEwNhwEATE3xggaectFIPC6RcDphdnAvE9NDGywF8gDkEXJAccAGI3JD5FhoK8tgFK86DJjQI8AADrwThsH+NIVQAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAYCAYAAADzoH0MAAAA2UlEQVR4XmNgGBFAAohl0AWJAQuB+D8UF6HJEQ00GSAGsKBLEAtWMkAMIBuANH9FFyQEeoC4CcoGGVCDJIcXVALxLyhblQERgOxwFXhAKgNEMQeS2CWoGFEApPA5FrHvaGIgcBKI+ZAFPBggitORBaFiDWhiINCKLrCMAdOpKlAxZC/hBFMYMA1YgiS2FErLA/E+IJ4L5cMBNwOqAcFQPkwMRt8GYiEg/gvlowBnBoSmbKjYPygfpAkGQAEYgcQnGaB7lSTgwADxBi8QC6BKEQ9+APFydMGRDgBhbjHxDDeR+wAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAXCAYAAADUUxW8AAAArUlEQVR4XmNgGAUjFXgD8XogtkeXwAdqgPg/EDtC+R1APBEhjRvANDIhiQkD8TEkPk4A0ngVymYF4jSoGDo4CcR8yALpDBCF4siCxIIUBuy2oAM3dAEQADkDpFkKTZwfiL9B2Veg9C8ojQJ2A/FrBogGFSDeAsQLkOQjgDgLiLcjiaEANiCOBmIZdAkoALmOA12QGMDMgAiXJGQJYoAuEK8C4jnoEsQCJXSBIQoAq9cavUysRywAAAAASUVORK5CYII=>

[image5]: <data:image/png;base64,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>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAXCAYAAAAC9s/ZAAAAo0lEQVR4XmNgGAUgwAjEH4D4PxJ+i6ICAv4yIORBbAwwnwEi6YAmjgxA8jhBAgNEQTWaOAxsBGJjdEFkoMwAMWAbugQQcAHxM3RBbABkwEd0QSD4hS6AC8ACCRkkA3ENmhhOgM0AdD5egG7ANSAWReITBLcYIAYwA/FOINZBlSYM5jFADPAD4ntockSBBAZMb5AEFBkgmtPRJUgBp9EFRsFgBwCn7iceXggXuAAAAABJRU5ErkJggg==>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAYCAYAAAAlBadpAAAAyklEQVR4XmNgGJZAGogLgHgmECshiVshsTHAYiD+D8S3gdgbiFWBeBoQPwdiS6gcVgCS+A3E3OgSQFDJAJG/hC4BAn8Y8JgKBSD5IHTBD1AJZnQJNIBhuC5U8CG6BBaAofkvVJAXXYIYANKIYSKxAJ9mfyB2BmJ7IHYAYhcGtHABaXyNLIAEsoG4ngFhQTkQMyErwGczDIDkb6ELgsA1BogkO7oEFOQyQOTD0SVgAGY7ipOAQA5JDi/Yy4BQ+A5KN0Ll1sAUjYIhBwDP2zLKnm6VTgAAAABJRU5ErkJggg==>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAYCAYAAAAh8HdUAAAAjklEQVR4XmNgGP5gHhB/AuL/SPgjEPchK8IFYBqIBowMEA1n0SXwgWwGiCYvdAl84CUDiU4DAZL9AwIgDSfQBfEBQv5xQhcAgdcM+J0GijMMgM8/NUDsiC7IzADRcBFdAghkGXAY1s8AkQhEE58BFb+ALLgYiH8B8V8g/gdVAMMg/h8g/g7EMjANo4DuAAC9SCmctvS58wAAAABJRU5ErkJggg==>