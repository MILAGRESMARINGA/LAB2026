# LABGAME 3.0 — protocolo oficial de execução

## Escopo

Repositório `MILAGRESMARINGA/LAB2026`, trabalho em `lab-rebuild-2026`; produto em `lab-app/`. CRMIMOBI está fora de escopo. Os doze `agent.md` definem os domínios e os handoffs.

## Roteamento e responsabilidades dos doze agentes

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

Esta tabela descreve responsabilidades, não uma execução em lote. O runtime encaminha cada tarefa para um agente principal e registra os agentes de apoio/revisão no BET. A presença de um revisor no BET não equivale a parecer aprovado; os checks de segurança, QA e revisão humana precisam de evidência.

## Runtime de IA com autonomia controlada e custo

O fluxo `.github/workflows/ai-agent-orchestrator.yml` só inicia na branch `lab-rebuild-2026`, com dispatch do dono confiável ou uma issue autenticada originada pelo console de voz. Antes da inferência, `task-briefing.mjs` compila o BET. O runtime tem três jobs: geração de JSON/artefato com permissões de leitura; aplicação e testes sem secrets; publicação com token GitHub de escrita apenas para branch `agent/*` e Draft PR. `agent-writer-core.mjs` valida allowlist global e `write_paths` do agente, tamanho, duplicatas, symlinks e padrões de segredo. Não é permitido ao modelo fornecer comandos shell.

Os comandos executados são uma allowlist fixa (`npm run verify:engineering`, `npm test`, `npm run build`) e rodam sem chave do provedor ou token de escrita. Checkout não persiste credenciais. Nenhum secret Supabase, Vercel, banco, e-mail, dump ou backup é passado ao runtime.

Inferência habilitada não significa autorização para cobrar sem teto aprovado. O console de voz envia o despacho com orçamento R$ 0, que bloqueia chamada ao modelo. Uma execução potencialmente paga requer dispatch manual pelo responsável com valor positivo em `approved_spend_brl`; limites de token ajudam, mas não são hard spend cap do provedor. A disponibilidade da chave OPENAI não foi inspecionada nem alterada.

`production_mutations_from_ai_workflow` exige aprovação presidencial. O executor não executa migrations/deploys, ações destrutivas, e-mails ou outras mutações de produção. Não há auto-merge: todo resultado é Draft PR, e integração depende de revisão humana e checks obrigatórios. O relatório de governança não se declara aprovado automaticamente nem afirma custo R$ 0 sem evidência.

O gerador `study-generate` é um endpoint separado: consulta o cache primeiro; miss exige `OPENAI_API_KEY`; o banco limita até 10 misses globais e 3 por usuário por dia UTC. Usa schema estrito, no máximo 1.200 tokens de saída, prompt de 64.000 bytes, timeout de 25 s e `store:false`. Cache hits não invocam o modelo. Cada chamada de API pode gerar cobrança; estes limites não afirmam custo R$ 0. Nenhum plano pago pode ser atualizado nem quota contornada.

## Autonomia e evidência

- Agentes podem propor código LABGAME no escopo allowlist, rodar os comandos de teste permitidos e publicar Draft PRs em branch isolada `agent/*`.
- Consultas de produção devem ser somente leitura até o gate de release terminar.
- Nunca colocar tokens, senhas, PII, dumps ou backups em prompts, commits, logs ou artefatos.
- LLMs podem preparar checklists e revisões textuais. Não lhes dê ferramentas de execução, acesso a dados de usuários ou credenciais. Nunca execute uma saída do modelo.
- Registrar apenas comandos, revisões, chamadas e evidências realmente obtidas; diferenciar CI local/efêmera, preview e produção.

## Briefing Executivo de Tarefa (BET)

Todo intake cria um BET de triagem com ID estável, agente principal roteado, papéis de apoio/revisão e custo R$ 0 (sem inferência). Antes de qualquer chamada paga, o dispatch manual precisa registrar aprovação presidencial positiva. O BET final inclui objetivo derivado do pedido, `write_paths` do especialista, fora de escopo, aceite, segurança, contrato de banco, QA obrigatório e contrato teológico se houver conteúdo bíblico. O mesmo BET acompanha o prompt, o artefato validado e o Draft PR. A autorização informada no workflow não é hard cap do provedor; não usar modelo cuja cobrança máxima não esteja controlada externamente.

O escopo por agente é vinculante: frontend/UX não altera migrations; database/security são os únicos papéis que podem propor migrations; QA escreve testes; agentes sem `write_paths` atuam somente como revisores e não publicam código. O runtime valida a atribuição novamente antes de gravar e antes de publicar.

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

Os doze contratos substituem a composição P0 de oito agentes. Relatórios P0 datados são histórico e não prova de aceite P1. Nenhum gate pendente é aprovado por esta mudança. A execução de código é controlada por aprovação explícita de custo, allowlist de escrita, testes sem credenciais e Draft PR; produção e merge permanecem sob revisão humana.

O teto de chamadas sobe de 8 para 12, tokens de saída de 1.024 para 1.536 e entrada acumulada de 65.536 para 98.304 bytes para incluir todos os papéis. Uma execução a cada 24h, 128 tokens/chamada e zero retries permanecem. São limites de uso, não garantia de preço; não foi disparada inferência nesta atualização.

## Limites de tentativas e aprovação em USD — 18/10/2026

O runner serializa tarefas, faz uma chamada por execução e permite no máximo três respostas do modelo (incluindo entregas incertas) por Issue e três globalmente em 24 horas. Reexecuções antigas usam a data de cada tentativa, não a criação do run. Histórico acima de 100 runs bloqueia até reconciliação explícita. Rejeições HTTP 4xx não consomem resposta; cinco execuções em 24 horas limitam falhas de infraestrutura e reexecuções. Cancelamentos/timeouts contam conservadoramente. O histórico inclui cada tentativa de um run, inclusive reruns. As tentativas 1 e 2 do run 39094300608 foram verificadas: parser vazio e HTTP 429, respectivamente; ambas anteriores à inferência.

O dispatch exige `approved_spend_usd`, até US$ 0.25 para a tarefa. Antes da chamada, o runner reserva custo de três respostas usando bytes de entrada como limite conservador de tokens, limite de saída e margem de 2x sobre o preço padrão gpt-6-luna verificado em 18/10/2026 (https://developers.openai.com/api/docs/pricing). O orçamento em BRL legado valida a estimativa declarada pelo modelo, não representa cobrança medida. Nenhuma recarga automática ou tentativa automática é feita. O limite do provedor continua necessário; preços precisam de revisão se mudarem.

O publisher dispara LAB CI explicitamente na branch gerada: PRs criados pelo GITHUB_TOKEN não acionam o evento pull_request automaticamente. O token de escrita permanece exclusivo do publisher; o job de testes continua sem segredos.
