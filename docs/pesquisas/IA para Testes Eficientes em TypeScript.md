# **Governança de Arquitetura e Otimização de Inferência: Um Guia para Instrução de Agentes de IA em Testes de Software com NestJS e React**

A ascensão da inteligência artificial generativa no desenvolvimento de software transformou a velocidade com que o código é produzido, mas introduziu um desafio crítico: a explosão de testes unitários e de integração que, embora sintaticamente corretos, são funcionalmente redundantes ou excessivamente acoplados à implementação.1 O problema central que as organizações enfrentam hoje não é a falta de testes, mas o custo oculto da manutenção de suítes de testes geradas por IA que consomem volumes massivos de tokens, diluem a atenção do modelo e falham em validar o comportamento real do usuário.3 Para mitigar esses riscos, é imperativo estabelecer diretrizes de arquitetura que governem a instrução de agentes de IA, focando na eficiência de tokens, na resiliência do código e na aplicação de padrões de design como o FakeBuilder para simplificar o estado dos testes.6

## **O Paradigma da Economia de Tokens e a Eficiência da Inferência**

No ecossistema de desenvolvimento auxiliado por IA, o token é a moeda fundamental. Cada interação com um modelo de linguagem, seja para gerar código ou para analisar um erro, envolve o processamento de tokens que representam unidades de dados extraídas de grandes blocos de informação.8 A eficiência de tokens não é apenas uma questão de redução de custos financeiros, mas de preservação da capacidade cognitiva do modelo.5 Quando um agente de IA recebe um contexto inflado por definições de classes extensas, comentários desnecessários ou configurações de teste repetitivas, ocorre o fenômeno da diluição de atenção, onde o modelo perde a precisão técnica necessária para identificar vulnerabilidades lógicas ou sugerir refatorações ideais.11

A relação entre o comprimento do texto e a contagem de tokens pode ser expressa matematicamente, embora varie conforme o tokenizador (como o cl100k\_base da OpenAI ou o usado pelo Claude 3.5). Em termos gerais, para o código TypeScript, a contagem de tokens ![][image1] pode ser aproximada pela função do número de caracteres ![][image2], onde:

![][image3]  
Essa métrica demonstra que a verbosidade do código fonte impacta diretamente a latência e o custo de inferência.13 Portanto, a adoção de técnicas de compressão de prompt e notações otimizadas para tokens, como o TOON (Token-Oriented Object Notation), torna-se um diferencial competitivo na arquitetura de software moderna.14 O TOON, ao substituir chaves pesadas e colchetes por identação e declarações de cabeçalho únicas, pode reduzir o consumo de tokens em até 60% em comparação com o JSON tradicional, permitindo que até 40% a mais de contexto seja inserido no mesmo orçamento de tokens.14

### **Comparativo de Eficiência de Formatos de Dados para IA**

| Formato de Dados | Redução Média de Tokens | Precisão de Recuperação | Aplicabilidade em Agentes |
| :---- | :---- | :---- | :---- |
| JSON Estruturado | 0% | 69.7% | Padrão da indústria; alta compatibilidade.14 |
| YAML (Identação) | 25-30% | 71.2% | Boa legibilidade; reduz ruído sintático.15 |
| TOON (Cabeçalhos) | 30-60% | 73.9% | Otimizado para RAG e listas repetitivas.14 |
| Token Sugarization | 11-15% | 72.5% | Substitui padrões comuns por shorthand único.10 |
| Skim (Apenas Tipos) | 85-92% | N/A | Focado em análise de arquitetura e documentação.16 |

A governança eficaz exige que as instruções enviadas aos agentes de IA incentivem a brevidade e a precisão. Ao instruir um agente a gerar testes para um serviço NestJS, por exemplo, o arquiteto deve fornecer apenas as assinaturas das interfaces e o contrato do serviço, em vez da implementação completa de todas as dependências.16 Isso reduz a carga de processamento e força o agente a focar no comportamento externo e nos contratos de API, que são os elementos que realmente devem ser validados.18

## **Governança de Código e o Padrão de Projeto FakeBuilder**

Um dos maiores desafios na escrita de testes em TypeScript, especialmente em sistemas enterprise-grade com objetos complexos e aninhados, é a configuração do estado inicial ou "Arrange". O uso de objetos literais crus em cada teste leva a um código frágil; qualquer alteração em uma propriedade obrigatória de uma interface exige atualizações em centenas de arquivos de teste, um processo que a IA pode automatizar, mas que consome milhares de tokens e gera ruído nas revisões de código.3 O padrão FakeBuilder surge como a solução arquitetônica para simplificar o estado dos testes e aumentar a relevância do que é testado.7

O FakeBuilder permite que o desenvolvedor e o agente de IA definam valores padrão sensatos para todas as propriedades de um objeto, permitindo que o teste individual substitua apenas os campos relevantes para o cenário específico sob validação.6 Isso elimina o antipadrão do "Mystery Guest" (Hóspede Misterioso), onde o leitor do teste não consegue identificar quais dados estão afetando o resultado final devido ao volume de boilerplate.7

### **Implementação Conceptual do FakeBuilder em TypeScript**

Em vez de depender de Object Mothers estáticos que crescem descontroladamente com métodos como createAdminUser e createRegularUser, o FakeBuilder utiliza uma abordagem fluente e baseada em classes abstratas.7

TypeScript

export abstract class AbstractDataBuilder\<T\> {  
  protected data: Partial\<T\> \= {};

  with\<K extends keyof T\>(key: K, value: T\[K\] | undefined): this {  
    this.data\[key\] \= value;  
    return this;  
  }

  protected abstract getDefaults(): T;

  get build(): T {  
    return Object.freeze({  
     ...this.getDefaults(),  
     ...this.data  
    });  
  }  
}

Esta estrutura garante a imutabilidade dos dados de teste através do Object.freeze, prevenindo o "Test Bleed" (vazamento de estado), onde um teste altera um objeto compartilhado e afeta a execução de testes subsequentes.6 Ao instruir um agente de IA, deve-se exigir que ele utilize builders para qualquer entidade de domínio ou DTO complexo. Isso reduz o tamanho do código gerado no prompt de teste de dezenas de linhas de JSON para chamadas de método concisas, otimizando drasticamente o uso de tokens e a clareza da intenção do teste.15

Além da economia de tokens, o uso de builders facilita a evolução do esquema de dados. Se uma nova propriedade obrigatória for adicionada a uma interface, apenas o método getDefaults() do builder precisa ser atualizado, em vez de todos os arquivos de teste.3 Para a IA, isso significa que ela pode realizar refatorações em larga escala com prompts muito menores, pois o conhecimento sobre a estrutura básica do objeto está encapsulado no builder.7

## **Estratégias de Teste para NestJS: Otimizando o Backend**

O framework NestJS, com seu sistema de injeção de dependência (DI) inspirado no Angular, oferece facilidades nativas para testes, mas que podem se tornar armadilhas de desempenho se mal utilizadas por agentes de IA.26 A classe Test do NestJS permite a criação de módulos de teste isolados que simulam o runtime da aplicação, mas a inicialização desses módulos é computacionalmente cara e consome tempo de execução valioso nos loops de feedback da IA.26

Para otimizar a geração de código por IA no NestJS, a instrução deve focar em duas frentes: a automação do mocking e a separação de efeitos colaterais.17 O uso de utilitários como o createMock da biblioteca @golevelup/ts-jest permite que o agente gere mocks tipados de interfaces complexas em uma única linha de código, eliminando a necessidade de definir manualmente cada método da dependência no bloco providers do módulo de teste.26

### **Comparativo de Estratégias de Injeção em Testes NestJS**

| Técnica | Verbosidade para IA | Custo de Tokens | Confiança nos Testes |
| :---- | :---- | :---- | :---- |
| Mock Manual | Alta | Elevado | Alta (controle total).26 |
| Auto-Mocking (useMocker) | Mínima | Baixíssimo | Média (depende da factory).26 |
| Injeção de Instância Real | Média | Moderado | Altíssima (testa integração).28 |
| Substituição por Provedores | Alta | Elevado | Alta (configuração explícita).26 |

Os agentes de IA devem ser instruídos a preferir testes unitários para lógica de negócios pura, extraindo essa lógica de dentro dos serviços para funções puras sempre que possível.17 Isso permite que o agente escreva testes que não dependem do overhead do NestJS TestingModule, resultando em execuções centenas de vezes mais rápidas e prompts mais curtos.17 Para testes que realmente exigem o contexto do framework, como interceptores ou guardas, a governança deve exigir o uso de mocks automáticos para todas as dependências que não são o alvo direto do teste.26

Além disso, a distinção entre testes unitários e de integração deve ser clara nas instruções do sistema. Enquanto os testes unitários validam a corretude de uma função isolada, os testes de integração no NestJS devem focar na interação entre componentes, utilizando bancos de dados em memória ou contêineres Docker para garantir que os contratos de dados e as transações distribuídas funcionem conforme o esperado em um ambiente que mimetiza a produção.28 O erro comum das IAs é gerar testes de integração que utilizam mocks para tudo, o que anula o propósito do teste, pois ele acaba validando apenas o comportamento dos mocks e não a integração real com a infraestrutura.19

## **React e o Foco no Comportamento: Frontend Resiliente**

No desenvolvimento frontend com React, o desafio da instrução de IA reside em evitar a criação de testes baseados em detalhes de implementação, como o estado interno do componente ou a estrutura exata do DOM.31 A filosofia da React Testing Library (RTL) é o pilar fundamental para a governança de testes de UI: "Quanto mais seus testes se assemelham à forma como seu software é usado, mais confiança eles podem lhe dar".32

Instruir agentes de IA a usar seletores baseados em papéis de acessibilidade (ARIA roles) em vez de classes CSS ou IDs de teste é uma diretriz de arquitetura que garante a longevidade da suíte de testes.31 Quando um componente é refatorado — por exemplo, mudando de um div clicável para um button real — um teste que busca por um papel de "button" continuará passando, enquanto um teste baseado em seletores de implementação falharia injustificadamente.31

### **Hierarquia de Seletores Recomendada para Agentes de IA**

| Prioridade | Método de Consulta | Justificativa Comportamental |
| :---- | :---- | :---- |
| 1 | getByRole | Reflete como usuários de tecnologias assistivas navegam.31 |
| 2 | getByLabelText | Garante que formulários sejam acessíveis e legíveis.31 |
| 3 | getByPlaceholderText | Alternativa para campos de entrada sem labels explícitos.32 |
| 4 | getByText | Valida o conteúdo visível para o usuário final.34 |
| 5 | getByDisplayValue | Útil para verificar o estado atual de formulários preenchidos.34 |
| 6 | getByTestId | Último recurso para elementos sem significado semântico.32 |

A IA deve ser proibida de usar shallow rendering, uma técnica que renderiza apenas um nível da árvore de componentes, pois isso impede a validação de interações reais entre componentes pai e filho e encoraja testes acoplados à estrutura de props.36 Em vez disso, a instrução deve exigir o uso de user-event em vez de fireEvent para disparar interações, pois o primeiro simula a sequência completa de eventos do navegador (como o foco e o pressionamento de teclas), oferecendo uma fidelidade muito maior ao comportamento humano.31

Outro padrão de design essencial para simplificar o estado dos testes no React é o uso de Page Objects para abstrair a complexidade da UI.38 Ao definir um Page Object que encapsula como "fazer uma busca" ou "preencher um perfil", o agente de IA pode reutilizar essa lógica em múltiplos testes, economizando tokens e garantindo que, se o layout da página mudar, apenas o Page Object precise ser atualizado.38

## **Engenharia de Contexto e Gerenciamento de Memória de Agentes**

Para que agentes de IA operem de forma autônoma e eficiente em tarefas de teste de longo prazo, a gestão do contexto da conversa é crucial. Sessões de codificação prolongadas podem gerar milhões de tokens de histórico, o que excede a memória de trabalho de qualquer modelo atual.11 A engenharia de contexto é a disciplina de selecionar estrategicamente quais informações alimentar ao modelo em cada turno, garantindo um sinal alto e baixo ruído.5

As estratégias de gerenciamento de contexto para agentes de teste incluem o Pruning (poda estratégica), a Summarization (sumarização ancorada) e o gerenciamento de artefatos.11 Sem essas técnicas, o agente pode começar a "alucinar" soluções ou esquecer decisões de arquitetura tomadas no início da sessão, resultando em testes que violam os padrões estabelecidos ou que tentam validar infraestruturas inexistentes.11

### **Estratégias de Gestão de Contexto para Fluxos de Trabalho de IA**

| Técnica | Mecanismo de Ação | Benefício para a Governança |
| :---- | :---- | :---- |
| Pruning Cronológico | Remove as primeiras ![][image4] mensagens do histórico. | Mantém o custo de inferência controlado em chats longos.12 |
| Poda Heurística | Remove confirmações e "conversas fiadas" irrelevantes. | Preserva o foco técnico e reduz distrações do modelo.39 |
| Sumarização Ancorada | Mantém um resumo estruturado de decisões e arquivos alterados. | Garante continuidade e evita que o agente repita erros passados.11 |
| Contexto Semântico | Recupera apenas os trechos de código relevantes via RAG. | Minimiza a carga de tokens ao focar no módulo sob teste.15 |

A instrução dos agentes deve incluir metadados sobre o estado atual da tarefa: o que já foi tentado, o que falhou e quais são os próximos passos.11 No contexto de testes unitários, isso significa que o agente deve manter um registro claro de quais cenários de borda já foram cobertos, evitando a geração de testes redundantes que apenas aumentam a cobertura de código sem adicionar valor real à detecção de bugs.40

## **Diretrizes de Instrução: O Processo Red-Green-Refactor para IA**

Para eliminar testes inúteis, o agente de IA deve ser instruído a seguir um rigoroso processo de Test-Driven Development (TDD). A governança não deve permitir que o agente gere código e testes simultaneamente; em vez disso, ele deve atuar como um engenheiro de TDD disciplinado.2

1. **Clareza da Stack:** O agente deve confirmar o framework e as bibliotecas antes de iniciar (ex: Vitest vs Jest, RTL vs Enzyme).17  
2. **Proposta de API:** Antes de escrever o teste, o agente propõe a assinatura da função ou componente para aprovação humana, garantindo uma boa experiência de desenvolvedor.17  
3. **Ciclo de Iteração:** O agente escreve um único teste que falha, implementa o código necessário para passar, e então refatora para melhorar a legibilidade e remover duplicações.2  
4. **Localidade e Isolamento:** Cada teste deve demonstrar localidade, não dependendo de estados globais ou da ordem de execução de outros testes.7

A instrução do sistema (System Prompt) deve forçar o agente a responder cinco perguntas fundamentais para cada teste gerado: Qual é a unidade sob teste? Qual é o comportamento esperado? Qual é a saída real? Qual é o valor esperado? E como esse teste ajuda a localizar um bug futuro?.17 Se o agente não puder responder a essas perguntas de forma clara e concisa, o teste é considerado de baixo valor e deve ser descartado antes de ser persistido no repositório.41

## **O Futuro da Automação de Testes e a Governança de IA**

A transição para um modelo de desenvolvimento "Agent-First" exige que a governança de código evolua de regras estáticas para princípios dinâmicos de arquitetura. A eficiência de tokens e o uso de padrões como o FakeBuilder não são apenas técnicas de otimização, mas componentes essenciais de uma infraestrutura que permite a escala sustentável da produção de software.1

Ao focar em testes que validam o comportamento em vez da implementação, e ao simplificar o estado dos testes através de abstrações inteligentes, as equipes de engenharia podem reduzir drasticamente o inchaço dos repositórios e aumentar a confiabilidade dos sistemas.23 A inteligência artificial, quando bem instruída sob esses pilares, deixa de ser uma fonte de código redundante para se tornar uma aliada poderosa na criação de sistemas robustos, resilientes e economicamente viáveis na nova era da computação cognitiva.1

#### **Referências citadas**

1. More Tests, More Problems: Rethinking AI-Driven Test Generation \- Digital.ai, acessado em janeiro 31, 2026, [https://digital.ai/catalyst-blog/more-tests-more-problems-rethinking-ai-driven-test-generation/](https://digital.ai/catalyst-blog/more-tests-more-problems-rethinking-ai-driven-test-generation/)  
2. TDD & BDD in the Age of AI: Why AI Agents Demand 100% More Test-First Development, acessado em janeiro 31, 2026, [https://natshah.com/blog/tdd-bdd-age-ai-why-ai-agents-demand-100-more-test-first-development](https://natshah.com/blog/tdd-bdd-age-ai-why-ai-agents-demand-100-more-test-first-development)  
3. Simplify test maintenance with the builder factory pattern \- Harness, acessado em janeiro 31, 2026, [https://www.harness.io/blog/builder-factory-pattern-testing](https://www.harness.io/blog/builder-factory-pattern-testing)  
4. AI Test Generation: A Dev's Guide Without Shooting Yourself in the Foot \- foojay, acessado em janeiro 31, 2026, [https://foojay.io/today/ai-driven-testing-best-practices/](https://foojay.io/today/ai-driven-testing-best-practices/)  
5. Context Engineering for AI Agents: Mastering Token Optimization and Agent Performance, acessado em janeiro 31, 2026, [https://www.flowhunt.io/blog/context-engineering-ai-agents-token-optimization/](https://www.flowhunt.io/blog/context-engineering-ai-agents-token-optimization/)  
6. Mock-Factory-Pattern in TypeScript \- DEV Community, acessado em janeiro 31, 2026, [https://dev.to/davelosert/mock-factory-pattern-in-typescript-44l9](https://dev.to/davelosert/mock-factory-pattern-in-typescript-44l9)  
7. Testing With The Builder Pattern \- DEV Community, acessado em janeiro 31, 2026, [https://dev.to/jonashdown/testing-with-the-builder-pattern-33gn](https://dev.to/jonashdown/testing-with-the-builder-pattern-33gn)  
8. Explaining Tokens — the Language and Currency of AI \- NVIDIA Blog, acessado em janeiro 31, 2026, [https://blogs.nvidia.com/blog/ai-tokens-explained/](https://blogs.nvidia.com/blog/ai-tokens-explained/)  
9. Impact of Code Context and Prompting Strategies on Automated Unit Test Generation with Modern General-Purpose Large Language Models \- arXiv, acessado em janeiro 31, 2026, [https://arxiv.org/html/2507.14256v1](https://arxiv.org/html/2507.14256v1)  
10. Token Sugar: Making Source Code Sweeter for LLMs through Token-Efficient Shorthand \- arXiv, acessado em janeiro 31, 2026, [https://arxiv.org/html/2512.08266v1](https://arxiv.org/html/2512.08266v1)  
11. Evaluating Context Compression for AI Agents | Factory.ai, acessado em janeiro 31, 2026, [https://factory.ai/news/evaluating-compression](https://factory.ai/news/evaluating-compression)  
12. Context Engineering \- Short-Term Memory Management with Sessions from OpenAI Agents SDK, acessado em janeiro 31, 2026, [https://cookbook.openai.com/examples/agents\_sdk/session\_memory](https://cookbook.openai.com/examples/agents_sdk/session_memory)  
13. Avoid the $50K Refactor: The NestJS Architecture Pattern That Lets You Swap AI Providers Seamlessly | by Joosep Wong \- Dev Genius, acessado em janeiro 31, 2026, [https://blog.devgenius.io/avoid-the-50k-refactor-the-nestjs-architecture-pattern-that-lets-you-swap-ai-providers-seamlessly-81852d58e781](https://blog.devgenius.io/avoid-the-50k-refactor-the-nestjs-architecture-pattern-that-lets-you-swap-ai-providers-seamlessly-81852d58e781)  
14. TOON (Token-Oriented Object Notation): The Guide to Maximizing ..., acessado em janeiro 31, 2026, [https://vatsalshah.in/blog/toon-token-oriented-object-notation-guide](https://vatsalshah.in/blog/toon-token-oriented-object-notation-guide)  
15. TOON Prompting: Moving Past Natural Language and JSON to Token-Optimized Data | by Sunil Rao | Jan, 2026 | Towards AI, acessado em janeiro 31, 2026, [https://pub.towardsai.net/toon-prompting-moving-past-natural-language-and-json-to-token-optimized-data-2318aac6e8a8](https://pub.towardsai.net/toon-prompting-moving-past-natural-language-and-json-to-token-optimized-data-2318aac6e8a8)  
16. dean0x/skim: Skim intelligently strips function bodies and implementation details while preserving the information AI agents need to understand your code. \- GitHub, acessado em janeiro 31, 2026, [https://github.com/dean0x/skim](https://github.com/dean0x/skim)  
17. Better AI Driven Development with Test Driven Development | by ..., acessado em janeiro 31, 2026, [https://medium.com/effortless-programming/better-ai-driven-development-with-test-driven-development-d4849f67e339](https://medium.com/effortless-programming/better-ai-driven-development-with-test-driven-development-d4849f67e339)  
18. Behavior Driven Testing: What It Is, How to Do It & Best Tools \- Testsigma, acessado em janeiro 31, 2026, [https://testsigma.com/blog/behavior-driven-testing/](https://testsigma.com/blog/behavior-driven-testing/)  
19. Why AI Code Demands System-Level QA, Not Just Unit Tests \- Testkube, acessado em janeiro 31, 2026, [https://testkube.io/blog/system-level-testing-ai-generated-code](https://testkube.io/blog/system-level-testing-ai-generated-code)  
20. Test Data Builders and Object Mother: another look \- Java Code Geeks, acessado em janeiro 31, 2026, [https://www.javacodegeeks.com/2014/06/test-data-builders-and-object-mother-another-look.html](https://www.javacodegeeks.com/2014/06/test-data-builders-and-object-mother-another-look.html)  
21. A Guide to the Builder Design Pattern in TypeScript and Node.js with Practical Examples | by Robin Viktorsson | Medium, acessado em janeiro 31, 2026, [https://medium.com/@robinviktorsson/a-guide-to-the-builder-design-pattern-in-typescript-and-node-js-with-practical-examples-9e113413ad63](https://medium.com/@robinviktorsson/a-guide-to-the-builder-design-pattern-in-typescript-and-node-js-with-practical-examples-9e113413ad63)  
22. Builder Vs Object Mother by ecararus \- Eugeniu Cararus, acessado em janeiro 31, 2026, [https://ecararus.github.io/BuilderVsObjectMother/](https://ecararus.github.io/BuilderVsObjectMother/)  
23. Test Data Builders: an alternative to the Object Mother pattern \- Nat Pryce, acessado em janeiro 31, 2026, [http://www.natpryce.com/articles/000714.html](http://www.natpryce.com/articles/000714.html)  
24. Creating Test Objects via Design Patterns \- NimblePros Blog, acessado em janeiro 31, 2026, [https://blog.nimblepros.com/blogs/creating-test-objects-via-design-patterns/](https://blog.nimblepros.com/blogs/creating-test-objects-via-design-patterns/)  
25. Test Data Builders and Object Mother: another look \- Codeleak.pl, acessado em janeiro 31, 2026, [https://blog.codeleak.pl/2014/06/test-data-builders-and-object-mother.html](https://blog.codeleak.pl/2014/06/test-data-builders-and-object-mother.html)  
26. Testing | NestJS \- A progressive Node.js framework, acessado em janeiro 31, 2026, [https://docs.nestjs.com/fundamentals/testing](https://docs.nestjs.com/fundamentals/testing)  
27. Optimize Your Nest.js App Performance with These Practices \- Brilworks, acessado em janeiro 31, 2026, [https://www.brilworks.com/blog/optimize-your-nest-js-app-performance/](https://www.brilworks.com/blog/optimize-your-nest-js-app-performance/)  
28. Unit Testing vs Integration Testing: Key Differences and Best Practices \- Harness, acessado em janeiro 31, 2026, [https://www.harness.io/harness-devops-academy/unit-testing-vs-integration-testing](https://www.harness.io/harness-devops-academy/unit-testing-vs-integration-testing)  
29. Testing NestJS Applications: Unit and Integration Testing | by @rnab \- Medium, acessado em janeiro 31, 2026, [https://arnab-k.medium.com/testing-nestjs-applications-unit-and-integration-testing-46136e728a1f](https://arnab-k.medium.com/testing-nestjs-applications-unit-and-integration-testing-46136e728a1f)  
30. unit vs integration vs e2e testing in nestjs projects? : r/Nestjs\_framework \- Reddit, acessado em janeiro 31, 2026, [https://www.reddit.com/r/Nestjs\_framework/comments/1qjtpwc/unit\_vs\_integration\_vs\_e2e\_testing\_in\_nestjs/](https://www.reddit.com/r/Nestjs_framework/comments/1qjtpwc/unit_vs_integration_vs_e2e_testing_in_nestjs/)  
31. Best Practices for Using React Testing Library | by Frontend Highlights \- Medium, acessado em janeiro 31, 2026, [https://medium.com/@ignatovich.dm/best-practices-for-using-react-testing-library-0f71181bb1f4](https://medium.com/@ignatovich.dm/best-practices-for-using-react-testing-library-0f71181bb1f4)  
32. Introducing the react-testing-library \- Kent C. Dodds, acessado em janeiro 31, 2026, [https://kentcdodds.com/blog/introducing-the-react-testing-library](https://kentcdodds.com/blog/introducing-the-react-testing-library)  
33. FAQ | Testing Library, acessado em janeiro 31, 2026, [https://testing-library.com/docs/react-testing-library/faq/](https://testing-library.com/docs/react-testing-library/faq/)  
34. Let's talk about best practices in React Testing Library | by Tay Bencardino \- Medium, acessado em janeiro 31, 2026, [https://taybencardino.medium.com/lets-talk-about-best-practices-in-react-testing-library-a96dbdc3059b](https://taybencardino.medium.com/lets-talk-about-best-practices-in-react-testing-library-a96dbdc3059b)  
35. Writing User Focused Tests with React Testing Library \- Method, acessado em janeiro 31, 2026, [https://www.method.com/insights/writing-user-focused-tests-with-react-testing-library/](https://www.method.com/insights/writing-user-focused-tests-with-react-testing-library/)  
36. Snapshot testing in React Testing Library \- The Same Tech, acessado em janeiro 31, 2026, [https://thesametech.com/snapshot-testing-in-rtl/](https://thesametech.com/snapshot-testing-in-rtl/)  
37. Comparing React testing libraries \- LogRocket Blog, acessado em janeiro 31, 2026, [https://blog.logrocket.com/compare-react-testing-libraries/](https://blog.logrocket.com/compare-react-testing-libraries/)  
38. User-Centric Testing using React Testing Library \- Marmelab, acessado em janeiro 31, 2026, [https://marmelab.com/blog/2023/05/26/react-user-centric-testing.html](https://marmelab.com/blog/2023/05/26/react-user-centric-testing.html)  
39. Context Engineering: The Invisible Discipline Keeping AI Agents from Drowning in Their Own Memory | by Juan C Olamendy | Medium, acessado em janeiro 31, 2026, [https://medium.com/@juanc.olamendy/context-engineering-the-invisible-discipline-keeping-ai-agents-from-drowning-in-their-own-memory-c0283ca6a954](https://medium.com/@juanc.olamendy/context-engineering-the-invisible-discipline-keeping-ai-agents-from-drowning-in-their-own-memory-c0283ca6a954)  
40. Using AI Code Assistants to Generate Unit Tests and Maximize Coverage \- Qt, acessado em janeiro 31, 2026, [https://www.qt.io/quality-assurance/blog/a-practical-guide-to-generating-unit-tests-with-ai-code-assistants](https://www.qt.io/quality-assurance/blog/a-practical-guide-to-generating-unit-tests-with-ai-code-assistants)  
41. AI Unit Testing: How to Use AI for Fast & Smart Test Generation \- Testomat.io, acessado em janeiro 31, 2026, [https://testomat.io/blog/ai-unit-testing-a-detailed-guide/](https://testomat.io/blog/ai-unit-testing-a-detailed-guide/)  
42. Two Types of Heuristics to Improve Your Testing Process\! \- Checkpoint Technologies Inc., acessado em janeiro 31, 2026, [https://checkpointech.com/two-types-of-heuristics-to-improve-your-testing-process/](https://checkpointech.com/two-types-of-heuristics-to-improve-your-testing-process/)  
43. How to Write Better Prompts for Cleaner AI-Generated Code \- OnSpace.AI, acessado em janeiro 31, 2026, [https://www.onspace.ai/blog/better-prompts-cleaner-ai-code](https://www.onspace.ai/blog/better-prompts-cleaner-ai-code)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAYCAYAAADKx8xXAAAAmElEQVR4XmNgGDlgMxD/JwHDAYgThiwAFUNRBAQayGJCDBAbkQETA0TBBTRxEHgEY2wFYkYkCRAoYIBo9EcTZwPiPhgnH0kCBt4zYDoTBASAWBxdEBlg8x9BwMwA0XQGXYIQKGeAaPRGlyAEPjOQ4UwQIMt/oOAmy3+zGSAaE9DEsYIgIP7GAIm7t1AM8ucvBjKcPAoGBAAAiastbKanIo0AAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAYCAYAAAAlBadpAAAAsUlEQVR4XmNgGJZAGogLgHgmECshiVshsTHAYiD+D8S3gdgbiFWBeBoQPwdiS6gcVgCS+AfE/OgSQFDJAJG/hC4BAn8Y8JgKBSD5IHTBD1AJTnQJNIBhuC5U8Ba6BBaAofkvVBCbPwkCkEYME4kFZGtmZoBofIkugQVgtYAYmy2AOAFdEATuMkA0g1yBDYDEX6ELIgOQZlAiQTfACIhfo4lhBbsZEF74CqVTUVSMgqEIAG1gK0HBSgf2AAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAyCAYAAADhjoeLAAACQ0lEQVR4Xu3dPa8NQRwH4PHyBdQoJSLRUKAgEYUEEYmGwlvhI2hcNdFItFohdAoFCYVGTadQCQnFzY2XKMTbf7J7Y87k7HHinrN78TzJL7szs9v/smfPTkoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwz7gZ+RE5HNkS+R7ZEzlWXgQAwDAWUlPQarnAAQAwsH2pu5h1zQMA0KNcytbUky2FDQBgYBeTUgYAsKp9TAobAMCq9jryrZ5sPaonAADoX353bdwTtnWRzfUkAADDuJKa0rYjsi01n/fYNHIFAMB/bGdqylJXun6uBACgJ28iG9vztWn058nbkfvFGACAATwtzu+l0SdqZyO7izEAAAPLT9eOFuO8p2eXfO279ljbW08AADAb48rXOG+r8dXU3LsrcibyYnQZAIBZWJ+mL2xd20gBADBHDyJf68kJcrl70h7rAneoGgMAMAO5eB2pJzt8qMbnUnP/6cjlyJ3RZQAAVuJxat45y4Urv5tmOygAAAAA+BscT81Tvd99mPduZENka2SpWgMAYE4ORK635yfT5H+n5rXlb74BANCT7anZ4D3L326bVNj21xMAAPQrb4V1qp4s5MJ2K3KtXgAAYP5uRD7Vk5WHxfmkJ3EAAMzRtEVs2usAAFihZ5HzxXjcbgnZy8hiMVbYAAB6kovX52q8bKE4fxW5UIwVNgCAnhxMv7av+hK5VKzVpex5e3wfOVEuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwB/6CYALX5og5OS4AAAAAElFTkSuQmCC>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAXCAYAAADUUxW8AAAA30lEQVR4Xu2SPQ4BQRzF/z4ajYuQaJxA5SQaQuUGOoV7aBQSjdBLJLiAkgYh4iNCeLMzs2aeJdHvL/klO+/t7MxkViSmBudwAWcw79cBUziCAy4sT+OVC5CFJ7jmwnKEd9EfSFGn2HNgKcAmLImePPbrAJVH0pP3anb7zIQDi/tyx4zrTlaBZWfswefh1VfOs0cC9injyVHHCGjAYkSmJrTN+OZ0HjsODHb1HGxRF/JtS0PR3RJmqAtIi/7tokjK59lD1L1u5Mf9gTO8cNiFB7gVfU0Pvw5Rf16Vw5g/eAFYLTaYStM1ZQAAAABJRU5ErkJggg==>