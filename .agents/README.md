# LABGAME 3.0 — arquitetura oficial de doze agentes

O manifesto oficial contém exatamente doze especialistas em `manifest.json` e `agents/<id>/agent.md`:

1. `principal-architect` — Architecture decisions, P1 dependencies, contracts and evidence-based delivery planning.
2. `ai-engineer` — Coordinate eleven specialist reviews, bounded AI runtime and evidence-based P0/P1 handoffs; theology owned by biblical-canon-engineer.
3. `backend-engineer` — Business logic, Deno/TypeScript Edge Functions, APIs, gamification, server clock and timezone.
4. `database-engineer` — PostgreSQL, Supabase migrations, Bible plan integrity and free pg_dump backup/restore evidence.
5. `integration-engineer` — Auth email, signup confirmation, recovery, redirects and webhooks under a reviewed cost ceiling.
6. `security-engineer` — RLS, app SECURITY DEFINER RPCs, search_path, server password validation and leaked-password protection.
7. `qa-reliability-engineer` — PG16/PG17, Auth/RLS, anti-CRM guard and end-to-end validation.
8. `frontend-ux-engineer` — React/TypeScript UI, profile, notifications, account deletion and timezone.
9. `ux-designer` — Usability, accessible flows, micro-interactions and design specifications.
10. `gamification-engineer` — Server-authoritative streaks, flame, XP, figurative rewards and fair group rankings.
11. `biblical-canon-engineer` — Protestant canon integrity, Pentecostal Arminian theology and contextual exegesis.
12. `platform-observability-engineer` — GitHub Actions, Vercel, secrets boundaries, logs and Free Tier monitoring.

Arquitetura P1: principal-architect define contratos; ai-engineer coordena onze especialistas e sintetiza revisões. Cada contrato contém responsabilidades, guardrails e handoff.

## Execução e limites

- LAB CI valida os contratos e executa testes determinísticos em ambientes efêmeros; não chama IA de produção nem altera produção.
- `.github/workflows/ai-agent-orchestrator.yml` é um fluxo opcional e manual (`workflow_dispatch`): chama os onze especialistas em sequência e passa suas notas validadas ao `ai-engineer` para síntese final, dentro de uma execução por 24 horas e dos limites de entrada/saída do manifesto.
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
