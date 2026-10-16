# LABGAME 3.0 — protocolo oficial de execução

## Escopo

Repositório MILAGRESMARINGA/LAB2026, branch lab-rebuild-2026; código em lab-app/. CRMIMOBI é independente e está fora de escopo.

Os prompts em agents/*/agent.md definem os papéis. GitHub Actions executa validações determinísticas e a suíte de CI; não há runtime de LLM conectado. O ai-engineer coordena o plano e evidencia resultados, sem tratar arquivos Markdown como agentes de IA ativos.

## Orquestração

| Ordem | Agente | Entrega |
|---|---|---|
| 1 | ai-engineer | Plano, dependências, custo zero e estado por gate |
| 2 | backend-engineer | APIs, RPCs e Edge Functions testáveis |
| 3 | database-engineer | migrations incrementais, backup/restore e integridade |
| 4 | integration-engineer | Auth, e-mail e webhooks gratuitos comprovados |
| 5 | frontend-ux-engineer | fluxos acessíveis compatíveis com os contratos |
| 6 | security-engineer | revisão independente de privilégios, RLS e privacidade |
| 7 | qa-reliability-engineer | PG16/PG17, Auth/RLS e testes E2E |
| 8 | platform-observability-engineer | CI, limites Free Tier, logs e rollback |
| 9 | ai-engineer | integra evidências; encerra APROVADO, REPROVADO ou BLOQUEADO |

Só paralelize tarefas independentes. Security e QA revisam após as mudanças. Mudanças de autenticação, banco ou publicação exigem ambos os pareceres.

## Autonomia permitida

- Inspecionar, implementar e testar código/documentação LABGAME; criar commits em lab-rebuild-2026; rodar GitHub Actions gratuito.
- Consultar o Supabase LABGAME azejfxvaamgkmfmwdzjn em modo somente leitura.
- Corrigir falhas de CI e repetir os testes necessários.
- Não fazer push em main, não alterar CRM e não publicar automaticamente.

## Gates de produção

Antes de migration ou publicação de função, comprovar todos os itens:

1. Custo incremental zero e projeto alvo confirmado como LABGAME.
2. Backup atual fora do GitHub, manifesto SHA-256 e restauração em PostgreSQL isolado.
3. Contagens/inventário comparados e migrations ensaiadas na cópia restaurada.
4. Migrations reconciliadas com supabase_migrations.schema_migrations do banco real; divergências entre fontes bloqueiam.
5. Parecer de segurança e QA, smoke tests e rollback praticável.
6. Segredos confirmados no cofre do serviço, nunca em commit ou log.
7. Ação de produção despachada explicitamente por pessoa autorizada. CI normal jamais executa migration, deploy, envio de e-mail ou exclusão.

Dump e banco restaurado ficam no computador do responsável. Não envie backup para GitHub, artefatos, issues, ChatGPT ou serviços externos.

## Sequência de fechamento P0

Backup e restore → ensaio gratuito das migrations → auditoria das funções SECURITY DEFINER e proteção de senha vazada → migrations compatíveis em produção com V2 desligada → publicação de account-delete após validação de dependências e consentimento → e-mail opcional somente com provedor/remetente gratuitos verificados, consentimento e segredo cron forte → smoke, advisors, contagens e documentação.

notify-reading-email não pode ser publicada/ativada sem provedor gratuito comprovado e segredo cron forte. Não presuma que Resend, SMTP ou domínio esteja configurado.

## Relatório obrigatório

Registre requisito, agente, alvo, alterações, custo, riscos, comandos, links de CI, testes reais, rollback, revisão de segurança/QA e pendências. Evidência ausente é BLOQUEADA.

## Limite do orquestrador

ai-engineer coordena sete especialistas e integra evidências. O workflow desta entrega valida contratos e testes do repositório; não possui credenciais, não chama LLM e não faz mutações de produção.
