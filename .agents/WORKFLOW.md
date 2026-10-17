# LABGAME 3.0 — protocolo oficial de execução

## Escopo

Repositório `MILAGRESMARINGA/LAB2026`, trabalho em `lab-rebuild-2026`; produto em `lab-app/`. CRMIMOBI está fora de escopo. Os doze `agent.md` definem os domínios e os handoffs.

## Ordem de trabalho dos doze agentes

| Ordem | Agente | Entrega |
|---|---|---|
| 1 | principal-architect | Architecture decisions, P1 dependencies, contracts and evidence-based delivery planning. |
| 2 | backend-engineer | Business logic, Deno/TypeScript Edge Functions, APIs, gamification, server clock and timezone. |
| 3 | database-engineer | PostgreSQL, Supabase migrations, Bible plan integrity and free pg_dump backup/restore evidence. |
| 4 | integration-engineer | Auth email, signup confirmation, recovery, redirects and webhooks under a reviewed cost ceiling. |
| 5 | security-engineer | RLS, app SECURITY DEFINER RPCs, search_path, server password validation and leaked-password protection. |
| 6 | qa-reliability-engineer | PG16/PG17, Auth/RLS, anti-CRM guard and end-to-end validation. |
| 7 | frontend-ux-engineer | React/TypeScript UI, profile, notifications, account deletion and timezone. |
| 8 | ux-designer | Usability, accessible flows, micro-interactions and design specifications. |
| 9 | gamification-engineer | Server-authoritative streaks, flame, XP, figurative rewards and fair group rankings. |
| 10 | biblical-canon-engineer | Protestant canon integrity, Pentecostal Arminian theology and contextual exegesis. |
| 11 | platform-observability-engineer | GitHub Actions, Vercel, secrets boundaries, logs and Free Tier monitoring. |
| 12 | ai-engineer | Coordinate eleven specialist reviews, bounded AI runtime and evidence-based P0/P1 handoffs; theology owned by biblical-canon-engineer. |

A tabela é a ordem consultiva do runtime. Na implementação, o principal-architect define dependências e o ai-engineer agenda handoffs: UX e gamificação especificam antes do frontend; cânon revisa antes da publicação editorial; segurança e QA revisam o resultado final antes do release.

Mudanças de autenticação, banco ou publicação exigem pareceres de segurança e QA. O orquestrador trabalha em sequência e identifica dependências antes de aceitar handoffs.

## Runtime de IA opcional e custo

O fluxo `.github/workflows/ai-agent-orchestrator.yml` só inicia por `workflow_dispatch` na branch `lab-rebuild-2026`. Se `OPENAI_API_KEY` estiver ausente, registra `SKIPPED` sem fazer chamadas. A disponibilidade desse segredo não foi inspecionada nem alterada nesta configuração.

Com segredo disponível, o fluxo envia os onze especialistas em sequência na ordem do manifesto e passa as notas limitadas ao ai-engineer para uma síntese final na décima segunda chamada. As notas são validadas, saneadas e tratadas como dados, nunca instruções. O workflow calcula o tamanho máximo da síntese antes da primeira chamada. Limites: uma execução por 24 horas, no máximo doze chamadas/execuções, 128 tokens de saída por chamada (1.536 por fluxo), 98.304 bytes de payload acumulado, 20 segundos por chamada e zero retries. O token GitHub é somente de leitura e é usado apenas para limitar execuções recentes. O workflow não tem acesso ao Supabase, Vercel, comandos, escrita no repositório, produção, PII, dumps ou segredos da aplicação. A saída JSON é escapada e publicada somente no resumo daquela execução; é sugestão, não evidência, comando ou aprovação.

O gerador `study-generate` é um endpoint separado: consulta o cache primeiro; miss exige `OPENAI_API_KEY`; o banco limita até 10 misses globais e 3 por usuário por dia UTC. Usa schema estrito, no máximo 1.200 tokens de saída, prompt de 64.000 bytes, timeout de 25 s e `store:false`. Cache hits não invocam o modelo. Cada chamada de API pode gerar cobrança; estes limites não afirmam custo R$ 0. Nenhum plano pago pode ser atualizado nem quota contornada.

## Autonomia e evidência

- Inspecionar, implementar, documentar e testar código LABGAME; criar commits na branch de trabalho; usar CI e bancos descartáveis.
- Consultas de produção devem ser somente leitura até o gate de release terminar.
- Nunca colocar tokens, senhas, PII, dumps ou backups em prompts, commits, logs ou artefatos.
- LLMs podem preparar checklists e revisões textuais. Não lhes dê ferramentas de execução, acesso a dados de usuários ou credenciais. Nunca execute uma saída do modelo.
- Registrar apenas comandos, revisões, chamadas e evidências realmente obtidas; diferenciar CI local/efêmera, preview e produção.

## Gates de produção

Antes de uma migration ou publicação de função, comprovar:

1. Projeto LABGAME correto e custo do provedor/serviço dentro da autorização e dos limites declarados.
2. Backup atual fora do GitHub, manifesto SHA-256 e restauração em PostgreSQL isolado.
3. Inventário/contagens comparados e migrations ensaiadas na cópia restaurada.
4. Migrations reconciliadas com `supabase_migrations.schema_migrations` do banco real.
5. Parecer de security e QA, smoke test e rollback praticável.
6. Segredos necessários configurados no cofre correto, sem leitura ou exposição em logs.
7. Gate de produção explícito concluído. CI normal e workflow de IA nunca executam migration, deploy, envio de e-mail ou exclusão.

O workflow `p0-backup-restore-gate.yml` precisa passar o backup e restore efêmero antes de aplicar migrations. A alteração de branch desta etapa não executa esse fluxo nem modifica produção. Nunca apague, resete ou sobrescreva dados sem backup/restore comprovado. Não publique `notify-reading-email` sem provedor/remetente gratuito confirmado, consentimento e segredo forte.

## Estudos e camadas

A chave exegética é aplicada depois de interpretar cada leitura no próprio contexto. Use estudo conectado somente com relação direta demonstrável (citação, alusão ou elo canônico claro). Quando o dia não tiver essa relação, rotule as leituras e mantenha exegese e aplicação separadas; `theological_connection = null`. Camada 1 atende novos convertidos e começa com zero dias; Camada 2 prepara liderança após 30 dias concluídos; Camada 3 cobre teologia completa e escatologia após 90. Há somente seis sementes da Camada 1 nos primeiros três dias. Não anuncie conteúdo curado nas camadas 2/3 sem novas sementes aprovadas. Não invente fontes ou citações de autores humanos ausentes do RAG.

## Relatório obrigatório

Registre requisito, agente, alvo, alterações, política de custo, riscos, comandos, links de CI, testes, backup/restore, estado de produção, rollback e revisões de segurança/QA. Marque cada gate como APROVADO, REPROVADO ou BLOQUEADO. Evidência ausente é BLOQUEADA.

## Transição P1 — 17/10/2026

Os doze contratos substituem a composição P0 de oito agentes. Relatórios P0 datados são histórico e não prova de aceite P1. Nenhum gate pendente é aprovado por esta mudança. O runtime continua manual e consultivo; não se torna um executor autônomo de código.

O teto de chamadas sobe de 8 para 12, tokens de saída de 1.024 para 1.536 e entrada acumulada de 65.536 para 98.304 bytes para incluir todos os papéis. Uma execução a cada 24h, 128 tokens/chamada e zero retries permanecem. São limites de uso, não garantia de preço; não foi disparada inferência nesta atualização.
