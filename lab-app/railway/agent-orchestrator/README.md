# LABGame — Orquestrador privado de tarefas

Consulte [documentação técnica](../../../docs/AGENT-ORCHESTRATION-VOICE.md). 

Serviço publicado no Railway. Requer Supabase Auth por JWT + administrador no app_metadata + UUID permitido. Sem credenciais o gateway retorna 503 e não cria tarefas.

Comando de execução: `node server.mjs`. Endpoint de saúde: `/health`.

Nunca habilitar com `LAB_AGENT_ENABLED=true` antes de configurar origin allowlist, PAT GitHub fine-grained restrito a Issues e RBAC independente.

## Gerente operacional privado

`GET /v1/manager` recupera as últimas 40 conversas e prioridades da conta autorizada. `POST /v1/manager` recebe `message` e `request_id` UUID; repetir o mesmo identificador e mensagem recupera a resposta original. Não alterar o identificador após erro de rede. Mensagens nunca são publicadas no GitHub.

Comandos: `status`, `lembrar: decisão` e `prioridade alta para tarefa 47` (também normal/baixa). Pelo microfone: `gerente, status`. Prioridades organizam a consulta; não reordenam runners já iniciados. Pedidos de código continuam no fluxo separado de registro de tarefas.

A migration `20261019004712_agent_manager_private_memory.sql` cria tabelas com RLS em schema privado, sem grants a leitores ou usuários autenticados. A RPC verifica identidade e a metadata administrativa atual em auth.users a cada chamada; não usa user_metadata nem depende de claims administrativos desatualizados no JWT. O gateway mantém a segunda allowlist independente. Dados são isolados por conta e removidos por cascade ao excluir o usuário.

Reutiliza a chave pública e a sessão do usuário, sem service_role ou armazenamento no navegador. O modo operacional funciona sem IA. Não inserir senhas ou dados pessoais. Padrões comuns de credenciais são rejeitados antes de salvar ou registrar tarefas públicas; a detecção não é um detector universal de segredos.

## Conversa e planejamento por IA

Uma variável privada `OPENAI_API_KEY` no serviço Railway ativa a conversa livre e propostas de etapas para os 12 especialistas. Reutilizar a chave já autorizada, sem expor no chat, no frontend ou no repositório; o Secret do GitHub não é compartilhado com o Railway. Sem a variável, a memória e os comandos operacionais continuam disponíveis.

Usa Responses API / gpt-6-luna, uma chamada por mensagem livre, sem retentativas automáticas, ferramentas ou execução de código. Comandos explícitos não fazem inferência. O contexto inclui somente a mensagem, até seis conversas recentes filtradas e oito estados de tarefas sem títulos ou credenciais. Respostas são propostas, não decisões aprovadas. Elas são salvas na memória privada após validação. Repetições simultâneas do mesmo pedido compartilham a resposta dentro da instância atual; mensagens já salvas são recuperadas por request_id após reiniciar o serviço. Nenhum mecanismo transforma um plano em comandos executáveis.

A interface informa quando o contexto será enviado ao provedor de IA. A integração foi testada com respostas simuladas; o ensaio real exige a variável privada no Railway. Cadastros e logs da aplicação não devem conter o valor da chave.
