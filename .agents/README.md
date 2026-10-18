# LABGAME 3.0 — arquitetura oficial de doze agentes

O manifesto oficial contém exatamente doze especialistas em `manifest.json` e `agents/<id>/agent.md`:

1. `principal-architect` — Architecture decisions, P1 dependencies, contracts and evidence-based delivery planning.
2. `ai-engineer` — Neural Master: routes each task to one primary specialist and compiles its Briefing Executivo de Tarefa (BET); theology owned by biblical-canon-engineer.
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

Arquitetura P1: cada pedido recebe um BET com ID, agente principal, apoio/revisão, alçada de custo, objetivo, escopo permitido/proibido, critérios de aceite, regras de segurança, QA e guardrails teológicos quando aplicáveis. O runtime despacha um agente principal por tarefa; apoio/revisão são declarados no BET, mas não são apresentados como pareceres independentes concluídos sem evidência.

## Execução e limites

- LAB CI valida os contratos e executa testes determinísticos em ambientes efêmeros; não chama IA de produção nem altera produção.
- `.github/workflows/ai-agent-orchestrator.yml` separa geração, validação/testes sem segredos e publicação de Draft PR. O artefato só pode alterar os caminhos globais e específicos do agente responsável; não pode editar workflow, manifesto, políticas, dependências ou produção.
- O intake de voz despacha com orçamento R$ 0,00. Nenhuma chamada de modelo ocorre nesse caminho sem despacho manual e orçamento positivo; produção e auto-merge permanecem bloqueados.
- `.agents/AUTONOMY-CONTROL.md` documenta limites, custo e gates de segurança.
- O segredo `OPENAI_API_KEY` é opcional. Sem ele, o fluxo registra `SKIPPED` sem enviar qualquer requisição. Esta configuração não leu, criou ou alterou segredos; nenhuma inferência ao vivo foi executada aqui.
- O job de geração recebe apenas permissões GitHub de leitura e a chave do provedor; não executa o patch. O job de verificação aplica o artefato e roda testes sem secrets ou token de escrita. O job de publicação recebe permissões `contents:write` e `pull-requests:write`, valida o relatório e cria somente branch isolada e Draft PR. Nenhuma saída do modelo é executada como shell nem usada para aprovar produção.
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
