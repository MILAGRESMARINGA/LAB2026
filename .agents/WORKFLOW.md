# LABGAME 3.0 — protocolo oficial de execução

## Escopo

Repositório `MILAGRESMARINGA/LAB2026`, trabalho em `lab-rebuild-2026`; produto em `lab-app/`. CRMIMOBI está fora de escopo. Os oito `agent.md` definem os domínios e os handoffs.

## Ordem de trabalho dos oito agentes

| Ordem | Agente | Entrega e revisão |
|---|---|---|
| 1 | ai-engineer | Plano, dependências, política de estudo e estado por gate |
| 2 | backend-engineer | APIs, RPCs e Edge Functions testáveis |
| 3 | database-engineer | Migrations incrementais, backup/restore e integridade |
| 4 | integration-engineer | Auth, e-mail e webhooks com custo e consentimento verificados |
| 5 | frontend-ux-engineer | Fluxos acessíveis compatíveis com os contratos |
| 6 | security-engineer | Revisão independente de privilégios, RLS e privacidade |
| 7 | qa-reliability-engineer | PG16/PG17, Auth/RLS e testes E2E |
| 8 | platform-observability-engineer | CI, limites, logs, readiness e rollback |
| síntese | ai-engineer | Reúne evidências; não substitui revisões nem muda o estado de um gate |

Mudanças de autenticação, banco ou publicação exigem pareceres de segurança e QA. O orquestrador trabalha em sequência e identifica dependências antes de aceitar handoffs.

## Runtime de IA opcional e custo

O fluxo `.github/workflows/ai-agent-orchestrator.yml` só inicia por `workflow_dispatch` na branch `lab-rebuild-2026`. Se `OPENAI_API_KEY` estiver ausente, registra `SKIPPED` sem fazer chamadas. A disponibilidade desse segredo não foi inspecionada nem alterada nesta configuração.

Com segredo disponível, o fluxo envia uma requisição por papel em sequência ao modelo fixo do manifesto. Limites: uma execução por 24 horas, no máximo oito chamadas/execuções, 128 tokens de saída por chamada (1.024 por fluxo), 65.536 bytes de payload acumulado, 20 segundos por chamada e zero retries. O token GitHub é somente de leitura e é usado apenas para limitar execuções recentes. O workflow não tem acesso ao Supabase, Vercel, comandos, escrita no repositório, produção, PII, dumps ou segredos da aplicação. A saída JSON é escapada e publicada somente no resumo daquela execução; é sugestão, não evidência, comando ou aprovação.

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
