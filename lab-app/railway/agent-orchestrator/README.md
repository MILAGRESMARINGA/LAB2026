# LABGame — Orquestrador privado de tarefas

Consulte [documentação técnica](../../../docs/AGENT-ORCHESTRATION-VOICE.md). 

**Status:** configurado em código, não implantado. Serviço requer autenticação Supabase Auth por JWT + administrador no app_metadata + UUID permitido. Sem credenciais o gateway retorna 503 e não cria tarefas.

Comando de execução: `node server.mjs`. Endpoint de saúde: `/health`.

Nunca habilitar com `LAB_AGENT_ENABLED=true` antes de configurar origin allowlist, PAT GitHub fine-grained restrito a Issues e RBAC independente.
