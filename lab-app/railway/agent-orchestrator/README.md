# LABGame — Orquestrador privado de tarefas

Consulte [documentação técnica](../../../docs/AGENT-ORCHESTRATION-VOICE.md). 

Serviço publicado no Railway. Requer Supabase Auth por JWT + administrador no app_metadata + UUID permitido. Sem credenciais o gateway retorna 503 e não cria tarefas.

Comando de execução: `node server.mjs`. Endpoint de saúde: `/health`.

Nunca habilitar com `LAB_AGENT_ENABLED=true` antes de configurar origin allowlist, PAT GitHub fine-grained restrito a Issues e RBAC independente.

## Gerente operacional privado

`GET /v1/manager` recupera as últimas 40 conversas e prioridades da conta autorizada. `POST /v1/manager` recebe `message` e `request_id` UUID; repetir o mesmo identificador e mensagem recupera a resposta original. Não alterar o identificador após erro de rede. Mensagens nunca são publicadas no GitHub.

Comandos: `status`, `lembrar: decisão` e `prioridade alta para tarefa 47` (também normal/baixa). Pelo microfone: `gerente, status`. Prioridades organizam a consulta; não reordenam runners já iniciados. Pedidos de código continuam no fluxo separado de registro de tarefas.

A migration `20261019003218_agent_manager_private_memory.sql` cria tabelas com RLS em schema privado, sem grants a leitores ou usuários autenticados. A RPC verifica identidade e a metadata administrativa atual em auth.users a cada chamada; não usa user_metadata nem depende de claims administrativos desatualizados no JWT. O gateway mantém a segunda allowlist independente. Dados são isolados por conta e removidos por cascade ao excluir o usuário.

Reutiliza a chave pública e a sessão do usuário, sem service_role, nova chave de IA ou armazenamento no navegador. O modo operacional usa comandos explícitos e evidências do GitHub, não um modelo conversacional; interpretação livre e decomposição por IA continuam no roadmap. Não inserir senhas ou dados pessoais. Padrões comuns de credenciais são rejeitados antes de salvar ou registrar tarefas públicas; a detecção não é um detector universal de segredos.
