# LABGAME 3.0 — arquitetura oficial de oito agentes

O manifesto oficial contém exatamente oito especialistas em `manifest.json` e `agents/<id>/agent.md`:

1. `ai-engineer` — orquestração técnica, política de custo e motor editorial dos estudos.
2. `backend-engineer` — lógica do servidor, RPCs, Edge Functions e relógio.
3. `database-engineer` — PostgreSQL, migrations, integridade bíblica e backup/restore.
4. `security-engineer` — RLS, privilégios, autenticação e auditoria.
5. `frontend-ux-engineer` — interface React/TypeScript e fluxos de conta.
6. `qa-reliability-engineer` — CI, PostgreSQL 16/17, Auth/RLS e E2E.
7. `integration-engineer` — e-mail, autenticação, webhooks e integrações.
8. `platform-observability-engineer` — GitHub Actions, Vercel, logs e limites do plano.

As especialidades anteriores de arquitetura principal, cânon, plano anual e gamificação foram incorporadas a esses oito papéis.

## Execução e limites

- LAB CI valida os contratos e executa testes determinísticos em ambientes efêmeros; não chama IA de produção nem altera produção.
- `.github/workflows/ai-agent-orchestrator.yml` é um fluxo opcional, manual (`workflow_dispatch)), com uma chamada por agente em sequência, limite de uma execução por 24 horas e limites de entrada/saída do manifesto.
- O segredo `OPENAI_API_KEY` é opcional. Sem ele, o fluxo registra `SKIPPED` sem enviar qualquer requisição. Esta configuração não leu, criou ou alterou segredos; nenhuma inferência ao vivo foi executada aqui.
- O workflow fornece somente permissões GitHub `contents:read` e `actions:read`. O modelo não recebe ferramentas, credenciais Supabase/Vercel, conteúdo de usuário, PII ou dumps. Nenhuma saída do modelo é executada, gravada no repositório ou usada para aprovar produção.
- Chamadas de API podem gerar cobrança. A autorização de uso não representa custo zero: os limites rígidos estão em `manifest.json`. Não faça upgrade de planos nem repita chamadas para contornar quotas.
- O gerador de estudos também usa cache antes do provedor. O banco limita misses a 10 globais e 3 por usuário por dia UTC; sem `OPENAI_API_KEY`, cache hits continuam funcionando e os misses falham fechados.

## Conteúdo e doutrina

O runtime atual recupera apenas texto bíblico Almeida 1911 e valida referências na passagem recuperada. Sua orientação editorial é evangélica, pentecostal e arminiana. Só conecta leituras com chave textual/canônica demonstrável; sem ligação, mantém exegese e aplicação separadas.

Há seis estudos curados na Camada 1 para os dias 1–3. Camadas 2 (30 dias concluídos) e 3 (90 dias concluídos) ainda não têm sementes curadas; dependem do gerador depois do desbloqueio. A lista de teólogos de domínio público é uma direção de pesquisa, não um corpus indexado. O gerador não inventa ou atribui citações de autores humanos.

## Referências

- `manifest.json`: papéis, cotas e permissões do runtime.
- `WORKFLOW.md`: sequência, handoffs e gates de produção.
- `P0-CLOSURE-STATUS-2026-10-16.md`: status de produção e evidências registradas.
- `../docs/STUDY-GENERATION.md`: cache, fontes, limites e regra exegética.
- `../.github/workflows/lab-ci.yml`: validação, testes e relatório CI.
