# Diana — Assistente de IA Pessoal para Desenvolvimento

> **Nota para quem for usar este documento (humano ou agente de IA):** este arquivo existe para
> dar contexto completo e verificado sobre o projeto, para servir de matéria-prima a uma página de
> portfólio pessoal. Todo o conteúdo abaixo foi conferido diretamente no código-fonte dos três
> repositórios do projeto (não é uma descrição aspiracional) e é o mais atual disponível na data de
> escrita. Onde há limitações reais, elas estão descritas explicitamente — não omita nem infle
> essas partes ao escrever a página; é um projeto pessoal em construção contínua, não um produto
> comercial pronto, e a honestidade sobre o estágio atual é parte do valor de portfólio. Ao final
> há uma seção "Guia para quem for montar a página" com sugestões de estrutura e tom.

**Autor:** Dayvid Santana
**Tipo de projeto:** pessoal, local-first, em desenvolvimento contínuo
**Repositórios:**
- Backend/chat — https://github.com/dayvid-santana/Cortana
- Frontend web — https://github.com/dayvid-santana/Cortana-Front
- Orquestrador de agentes — https://github.com/dayvid-santana/Agentes-de-Desenvolvimento

---

## 1. O que é, em uma frase

Uma assistente de IA pessoal, local-first, que **conhece de verdade os repositórios do autor** —
conversa sobre documentação e código citando arquivo/linha/commit em vez de inventar respostas, lê
documentos em voz alta, e coordena mais de vinte agentes de IA especializados que analisam e, sob
aprovação humana explícita, escrevem código em branches e worktrees isolados.

Não é um chatbot genérico plugado em um repositório: é uma assistente com memória estruturada do
histórico do projeto (commits → documentos → decisões → perguntas em aberto → conversas), e uma
camada separada de execução autônoma com controles de segurança explícitos (aprovação humana,
isolamento de escrita, nenhuma ação destrutiva sem confirmação).

## 2. O problema que motivou o projeto

Assistentes de IA genéricos respondem sobre um repositório com base em recortes de contexto ad hoc
e frequentemente "alucinam" — inventam comportamento que o código não tem, ou tratam decisões
implícitas como se fossem regras estabelecidas. E ferramentas de IA que "escrevem código sozinhas"
tendem a esconder o quanto de autonomia real estão exercendo, sem uma trilha clara de aprovação e
isolamento.

O projeto nasceu para resolver dois problemas específicos do dia a dia do autor como desenvolvedor:

1. **Contexto real, não achismo.** Toda resposta sobre documentação ou código deve vir com uma
   fonte verificável — path, linhas, hash do commit — ou dizer explicitamente que não sabe.
2. **Autonomia com controles reais, não com aviso de rodapé.** Se um agente de IA vai escrever
   código, isso precisa acontecer isolado do checkout principal, com decisão humana registrada
   para mudanças estruturais, e nada mesclado sem revisão do diff.

## 3. Arquitetura — três serviços locais, um fluxo único

O sistema é composto por três aplicações independentes, cada uma seu próprio repositório Git,
rodando na máquina do autor e conversando por HTTP em loopback (nunca expostas fora da rede local):

```
┌─────────────────────────────┐
│   Diana — Frontend Web       │  React 19 · Vite · TanStack Router/Query
│   http://localhost:5174      │  UI de chat, timeline de commits, decisões,
└──────────────┬───────────────┘  leitura em voz alta, configuração de agentes
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
┌───────────────────┐   ┌──────────────────────────┐
│  Cortana (DevMate) │   │  Agents (dev-agent)       │
│  backend de chat/  │   │  orquestrador de agentes  │
│  documentação      │   │  de IA para escrita       │
│  127.0.0.1:8000     │   │  127.0.0.1:8765            │
│  Python · FastAPI   │   │  Python · FastAPI          │
└───────────────────┘   └──────────────────────────┘
```

Os três serviços sobem juntos com um único script (`start.ps1`) e cada um pode também ser operado
de forma independente por linha de comando (`devmate ...`, `dev-agent ...`).

### 3.1 Cortana (pacote `devmate`) — o backend de chat e documentação

O motor que entende a evolução da documentação e do código de um repositório Git. Roda como CLI
local e como API HTTP fina sobre os mesmos serviços de aplicação (nunca duplica regras entre os
dois modos de uso).

**O que faz:**
- Indexa commits e mudanças em Markdown, guardando metadados, decisões e perguntas detectadas em
  SQLite local (nunca em nuvem).
- Responde perguntas em modo "somente documentação" (`docs`) ou "documentação + código
  explicitamente autorizado" (`code`) — nunca mistura os dois sem pedido explícito.
- **Toda resposta cita a fonte**: path, linha inicial/final e hash do commit de onde a informação
  saiu. Sem evidência no repositório, a resposta diz isso em vez de inventar.
- Lê documentos em voz alta (narração local por padrão, ou vozes remotas da OpenAI), com
  checkpoint de retomada — se o arquivo mudou desde a última leitura, a retomada é recusada em vez
  de continuar sobre um conteúdo desatualizado.
- Conversa por voz ponta a ponta: grava, transcreve localmente com Whisper (CPU), responde e narra
  a resposta — mantendo o histórico de rodadas anteriores no mesmo diálogo.
- Providers de linguagem plugáveis: `mock` (determinístico, para testes/offline), `codex` (CLI da
  OpenAI já autenticada na máquina, sandbox somente-leitura), `openai` (Responses API) e
  `openai_compatible` (qualquer endpoint compatível).
- Comandos dedicados por atividade sobre código selecionado: `review`, `architecture`, `docs`,
  `refactor`, `edit` — os três últimos **propõem** mudanças com diff calculado localmente; nada é
  escrito sem confirmação explícita por arquivo.

**Por que é tecnicamente interessante:**
- **Streaming SSE resiliente a reconexão.** O endpoint de chat em stream (`/chat/runs/{id}/events`)
  mantém um log append-only de eventos por execução; uma reconexão do `EventSource` do navegador
  (`Last-Event-ID`) reproduz exatamente os eventos que faltam, sem duplicar nem perder nenhum —
  mesmo sob o comportamento padrão do `EventSource` de tentar reconectar indefinidamente após
  qualquer fim de resposta.
- **Segurança por padrão, não por configuração.** Escopo padrão é sempre "só documentação"; código
  só entra mediante `--scope code`/`--full-repo` explícitos (ou uma flag de projeto que o próprio
  usuário liga conscientemente). Caminhos, symlinks externos e padrões de segredo são bloqueados
  antes de qualquer leitura ou escrita. Git e síntese de voz nunca usam `shell=True`.
- **Escrita nunca é a exceção silenciosa.** É a única operação que sai do modo somente-leitura, e
  mesmo assim só ocorre um arquivo por vez, com diff calculado localmente e confirmação explícita
  (ou `--yes` para todos de uma vez).

### 3.2 Diana — o frontend web

Interface web local-first para o Cortana/DevMate, e também a porta de entrada visual para o
orquestrador de agentes de escrita.

**O que faz:**
- Chat de documentação/código com citações clicáveis que abrem o trecho exato do arquivo.
- Timeline de commits, decisões detectadas e perguntas em aberto por projeto.
- Configuração de providers de IA e de voz, diagnóstico de conexão, sessões de leitura em voz alta
  com áudio por segmento.
- **Entrada e saída de voz nativas do navegador** (Web Speech API — `SpeechRecognition` e
  `speechSynthesis`), sem pipeline de áudio adicional, sem chave de API extra: o texto reconhecido
  segue pelo mesmo caminho de uma mensagem digitada.
- Tela de agentes que envia tarefas de escrita ao orquestrador (`dev-agent`), com um modal de
  confirmação explícita antes de qualquer ação que possa criar ou alterar arquivos.

**Por que é tecnicamente interessante:**
- **Contrato tipado ponta a ponta.** Cliente HTTP gerado a partir de um schema OpenAPI
  (`openapi-fetch`), então toda chamada de API é verificada em tempo de compilação contra o
  mesmo contrato que o backend implementa.
- **Testes deterministas sem depender de rede real.** Mock Service Worker intercepta as chamadas
  em teste (Vitest + Playwright); a decisão de rodar com ou sem mocks no ambiente de
  desenvolvimento/produção é uma única flag, sem nenhum fallback silencioso — o app fala com o
  backend real por padrão.
- Acessibilidade tratada como requisito, não detalhe: cobertura de contraste WCAG AA verificada
  com `axe-core` em testes end-to-end reais, estrutura semântica de listas corrigida onde o
  Playwright pegou violações reais.

### 3.3 Agents (`dev-agent`) — orquestrador de agentes de escrita

Um coordenador local de tarefas de desenvolvimento assistidas por IA, plugável em qualquer projeto
que declare um `dev-agent.yaml` — inclusive nos próprios repositórios deste ecossistema.

**O que faz:**
- Um **catálogo de 26 agentes especializados** (contexto, requisitos, guarda arquitetural,
  implementação, documentação de projeto/código, autoria de testes, execução de suíte, reprodução
  de bug, revisão de diff, debug, e doze especialistas de análise sob demanda — segurança, banco de
  dados, contrato de API, qualidade, dependências, padrões de projeto, performance, frontend,
  observabilidade, release, refactor, modelagem de código).
- **Fluxo fixo e auditável para tarefas que escrevem**: `plano sem escrita` → decisão arquitetural
  humana registrada quando o pedido é estrutural (autenticação, schema de banco, contrato público,
  fila, deploy) → execução só após confirmação explícita → testes/revisão automáticos → resultado.
- **Isolamento real, não simbólico**: cada execução cria uma branch (`dev-agent/<id>`) e um
  worktree Git separado ao lado do checkout principal. O checkout que o autor tem aberto no editor
  nunca é tocado pela tarefa.
- **Checkpoint e retomada.** Cada fase concluída persiste um checkpoint; um job interrompido fica
  `blocked` e pode ser retomado no mesmo worktree (até três vezes), sem repetir fases já feitas.
- **Cancelamento cooperativo** e `cleanup` explícito do worktree ao final.
- Redação de segredos automática em contexto, diffs, respostas e logs (chaves de API, tokens
  Bearer, chaves privadas PEM, credenciais em URL).

**Por que é tecnicamente interessante:**
- **Guarda arquitetural por heurística + aprovação humana obrigatória**, não apenas um aviso: um
  pedido que menciona termos estruturais bloqueia a execução até uma decisão de 10–1000 caracteres
  ser registrada explicitamente — a API se recusa a enfileirar o job sem isso.
- **Aprendizado real sobre orquestrar múltiplos agentes de IA**: em produção, o provider de código
  por trás de alguns agentes às vezes respondia como se não tivesse acesso a um arquivo que estava,
  de fato, disponível no sandbox — não um bug determinístico, mas o modelo decidindo por conta
  própria se aciona ou não uma ferramenta de leitura. A lição prática: tratar cada resposta de um
  agente de IA como potencialmente inconsistente, nunca como uma chamada de função garantida.
- **Nenhuma automação de Git além do que é auditável**: o agente `git` só *sugere* agrupamentos de
  Conventional Commits — nunca cria commit, nunca dá push, nunca faz rollback automático.

## 4. Stack técnica

| Componente | Linguagem/Runtime | Principais dependências |
|---|---|---|
| Cortana (backend/chat) | Python 3.12+ | FastAPI, SQLAlchemy + Alembic, Pydantic v2, `openai` SDK, `openai-codex` SDK, `markdown-it-py`, `tomlkit`, Typer, Rich, `faster-whisper` (opcional, voz) |
| Diana (frontend) | TypeScript (strict), Node | Vite, React 19, TanStack Router + Query, Tailwind CSS v4, Base UI, Zod, React Hook Form, `react-markdown` (sanitizado), Shiki, `openapi-fetch`, Zustand |
| Agents (dev-agent) | Python 3.11+ | FastAPI, Uvicorn, Pydantic v2, PyYAML, Typer, Rich, HTTPX |
| Testes | — | Pytest + mypy strict + Ruff (Python); Vitest + Testing Library + MSW + Playwright + ESLint (TypeScript) |
| Infra | — | Docker/Compose por serviço; SQLite local (sem banco externo); sem dependência de nuvem obrigatória |

Execução de modelo de linguagem em produção depende de um provider já autenticado na máquina
(CLI Codex) ou de uma chave de API própria (OpenAI) — nunca embutida no código ou no repositório.

## 5. Modelo de segurança (resumo prático)

- **Local-first por padrão real, não por marketing.** As três APIs escutam só em `127.0.0.1`, sem
  autenticação — porque a premissa é que elas nunca deveriam sair da máquina. CORS restrito a
  origens locais conhecidas (o próprio dev server).
- **Nada é escrito sem confirmação explícita.** Vale tanto para uma edição pontual de um arquivo
  (Cortana) quanto para uma tarefa completa de agentes (`dev-agent`) — em ambos os casos há uma
  etapa de aprovação visível antes de qualquer escrita.
- **Separação de leitura e escrita como fronteira arquitetural**, não como convenção: análise e
  sugestão são livres; escrita é um caminho à parte, com isolamento de execução real (branch +
  worktree) e revisão de diff antes de qualquer merge.
- **Redação de segredos em múltiplas camadas**: variáveis de ambiente nunca entram no TOML de
  configuração; padrões de chave/token/senha são removidos de contexto, diffs, logs e respostas de
  agente antes de serem persistidos.
- **Comandos destrutivos de Git/terminal são bloqueados por política** (`git reset --hard`,
  `git push --force`, `rm -rf` e equivalentes) a menos que explicitamente confirmados.

## 6. Estado atual e limites conhecidos (honestidade > propaganda)

Isto é um projeto pessoal em construção ativa, não um produto acabado. Vale deixar claro para quem
for ler a página:

- Sem autenticação/autorização, TLS ou isolamento multiusuário em nenhum dos três serviços — são
  desenhados para rodar só na máquina do autor, nunca publicados em rede aberta.
- Sem CI configurado, sem pipeline de release/publicação, sem licença declarada nos repositórios.
- O grafo de dependências entre agentes do `dev-agent` é declarativo, mas o único fluxo de tarefa
  implementado hoje é a sequência fixa do orquestrador — não é um agendador genérico ainda.
- Fora do escopo do MVP do Cortana/DevMate: embeddings/banco vetorial, leitura de PDF, geração de
  pull request, execução de testes por agente, múltiplos agentes coordenados nesse serviço
  especificamente, sincronização em nuvem, plugins MCP, aplicativo móvel.
- O provider de fala padrão (`system`, mecanismo do próprio sistema operacional) fala direto no
  dispositivo local e não gera arquivo de áudio — então tocar áudio pelo navegador (preview de voz,
  sessões de leitura) exige configurar um provider remoto (OpenAI).

## 7. Qualidade e cobertura de testes (números reais, verificados)

- Cortana (backend): **165 testes automatizados** (pytest), tipagem estrita com mypy, lint com
  Ruff — suíte 100% verde.
- Diana (frontend): **121 testes automatizados** (Vitest + Testing Library), TypeScript estrito,
  ESLint, mais testes end-to-end reais com Playwright/axe-core para acessibilidade.
- dev-agent: mais de **100 testes automatizados** (pytest), com fakes para provider e Git — nenhum
  teste depende de uma conta Codex real.
- Toda a API do Cortana foi validada não só por testes automatizados como por uma sessão real de
  ponta a ponta: backend e frontend rodando ao mesmo tempo, contra um repositório Git real, sem
  nenhum dado simulado.

## 8. Como o autor descreve o projeto (voz própria, para citação direta)

> "Não um chatbot genérico, mas algo que realmente conhece os meus repositórios e pode operar
> sobre eles." — trecho do texto de divulgação do autor sobre o projeto, reaproveitável como
> citação/depoimento na página.

> "Dar autonomia real a agentes de IA sobre código de produção só faz sentido com camadas
> explícitas de segurança — aprovação humana, isolamento de execução, e nenhuma ação destrutiva
> sem confirmação visível."

(Texto completo disponível em `linkedin-post.md` na raiz deste diretório, caso seja útil citar
mais trechos ou adaptar o tom.)

## 9. Guia para quem for montar a página

- **Tom sugerido:** direto, técnico, sem hipérbole. O diferencial real do projeto é a disciplina de
  engenharia (citações verificáveis, isolamento de escrita, testes reais) — deixe os números e as
  decisões técnicas falarem, em vez de adjetivos.
- **Estrutura de página sugerida:** (1) hero com a frase de abertura da seção 1; (2) o problema
  (seção 2); (3) três blocos de arquitetura/funcionalidade (seção 3, um card por serviço); (4) uma
  seção "decisões técnicas interessantes" puxando os destaques de "por que é tecnicamente
  interessante" de cada subseção 3.x — esse é o conteúdo com mais valor para um recrutador técnico;
  (5) stack (seção 4, pode virar uma lista de badges/ícones); (6) números de qualidade (seção 7);
  (7) limitações honestas (seção 6) — pequeno, mas reforça credibilidade; (8) links para os três
  repositórios.
- **Não afirme** que há uma demonstração pública hospedada, autenticação multiusuário, ou uso em
  produção por terceiros — nada disso existe hoje. Se o autor quiser um demo público futuramente,
  isso exigiria trabalho adicional de deploy/autenticação não coberto por este documento.
- **Screenshots/imagens**: não existem capturas de tela prontas neste repositório no momento da
  escrita; a página deve prever placeholders ou pedir ao autor para gerá-las rodando `start.ps1`
  localmente.
- Se quiser uma versão em inglês deste documento para uma página bilíngue, pedir para gerar — este
  arquivo foi escrito em português por consistência com todo o restante do projeto (READMEs,
  commits, comentários de código).
