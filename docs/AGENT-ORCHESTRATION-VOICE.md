# LABGame 3.0 — Central de Agentes e Voz (implementação P1, desativada)

## O que já está implementado

**Entrada por voz no navegador**, com botão de microfone, reconhecimento em português brasileiro quando suportado pelo navegador, confirmação verbal ("registrar"), cancelamento, consulta à fila ("status") e leitura em áudio das respostas por speech synthesis. Sempre há alternativa de teclado. O áudio bruto não é armazenado pelo LABGame; o serviço de reconhecimento pode ser processado pelo fornecedor do navegador. Evite ditar senhas, endereços pessoais e segredos.

**Gateway Railway**, pasta \`lab-app/railway/agent-orchestrator/\`:
- Autentica o JWT no Supabase **LABGame**, nunca no CRM.
- Exige **ambos**: \`app_metadata.labgame_orchestrator_admin===true\` (somente backend pode conceder) e UUID na allowlist privada \`LAB_AGENT_ADMIN_USER_IDS\`.
- Exige domínio de origem autorizado por allowlist explícita e limite de cinco requisições por minuto por conta/processo.
- Cria issues exclusivamente em \`MILAGRESMARINGA/LAB2026\` por token GitHub exclusivo do servidor.
- Não inclui API de execução de comandos, deploy, SQL, e-mail, pagamento ou exclusão.
- Normaliza tamanho do pedido e bloqueia por padrão se faltarem variáveis de configuração.
- \`GET /health\` indica \`disabled\` ou \`configured\`; não divulga segredos.
- \`GET /v1/tasks\` mostra fila de issues; \`POST /v1/tasks\` cria um pedido.

**GitHub Actions**, \`.github/workflows/lab-agent-intake.yml\`:
- Recebe issues cujo título começa com \`LAB AGENTE ·\` e cujo corpo inclui o marcador criado pelo gateway.
- Consulta permissão de colaborador da conta autora e aceita exclusivamente nível \`admin\`.
- Retém solicitações que mencionem áreas sensíveis/cobrança/produção para autorização.
- Para solicitações comuns, cria branch \`agent/intake-N\`, documento de requisição em \`.agents/intake/\`, e **draft PR**.
- Dispara a suite atual de testes LABGame na branch (CI); nenhuma instrução de issue é executada como programa.
- Repete sem criar um segundo PR na mesma branch. Se o token usado não possuir permissões de escrita em GitHub Actions, a execução falhará de forma visível, sem recorrer a produção.

### Importante: o que ainda NÃO faz

O **agente autônomo que escreve código** não está configurado. Nenhum modelo LLM, assinatura Copilot, Codex API, Ollama, GPU ou agente Railway foi ativado. A criação de um issue/PR de triagem não é uma alteração funcional. A aplicação não faz deploy direto de produção.

No futuro, um executor de código poderá ler o pedido, implementar em branch isolada, rodar CI, iterar em falhas e abrir PR de implementação. Essa etapa exige credenciais próprias, medição de custos, sandbox sem dados reais, orçamento máximo e revisão de segurança. Não implementar silenciosamente com chaves da conta pessoal.

## Como ativar posteriormente sem confundir sistemas

1. Primeiro manter o projeto Railway **LABGAME-3**, criar um serviço próprio **em staging** cujo root é \`/lab-app/railway/agent-orchestrator\`. Nunca usar \`voz-em-mapa\` ou \`disparowhats\`.
2. Configuração segura do Railway (variáveis privadas; nunca \`VITE_\`):
   - \`LAB_AGENT_ENABLED=false\` inicialmente. Ativar \`true\` somente após homologação.
   - \`LAB_AGENT_SUPABASE_ANON_KEY\`: chave publicável (não service-role) do projeto LABGame.
   - \`LAB_AGENT_GITHUB_TOKEN\`: token fine-grained limitado ao repositório LAB2026 com permissão Issues read/write. Não permitir acesso às demais contas.
   - \`LAB_AGENT_ADMIN_USER_IDS\`: UUIDs de administradores separados por vírgula. Não usar e-mails.
   - \`LAB_AGENT_ALLOWED_ORIGINS\`: origens HTTPS exatas e aprovadas, sem coringa, separadas por vírgula.
   - \`PORT\` fornecido pelo Railway; \`node server.mjs\` é o comando de início.
3. Promover usuário a administrador do console usando **Supabase Auth Admin API**, definindo \`app_metadata.labgame_orchestrator_admin=true\`, somente após comprovação de propriedade. Não usar \`raw_user_meta_data\`, pois o usuário comum consegue alterá-lo.
4. Na Vercel, configure \`VITE_AGENT_CONSOLE_ENABLED=true\` somente no ambiente de teste aprovado e \`VITE_LAB_AGENT_API_URL\` igual ao domínio HTTPS público dedicado do Railway; o URL não é segredo. Mantenha a produção da Vercel com o recurso desativado até homologação.
5. Auditar CSP, CORS, verificação de token, limites, custos e logs antes de expor o gateway. Não publicar a interface em contas de leitores comuns.
6. Um único projeto Railway não significa uso gratuito ilimitado: serviços ativos geram consumo conforme franquia. Não aceitar deploy de produção/serviço sem aceite do limite de gastos.

## Permissões e níveis de autonomia

| Etapa | Situação |
|---|---|
| Voz → texto → resposta falada no navegador | Código criado; depende de habilitar console e navegador |
| JWT e conta administradora → criação de tarefa | Código criado; requer credenciais Railway e homologação |
| Issue autorizada → PR de triagem → CI | Workflow criado; requer permissões GitHub e teste real |
| Agente IA produz commits/corrige falhas sem digitação | **Não implantado**; depende de executor e orçamento aprovados |
| Preview Vercel | GitHub/Vercel existentes; publicar preview após PR e validação |
| Merge e produção automáticos | **Bloqueados** para alterações sensíveis; exige backup e aprovação |
| Operações de banco, exclusão, pagamentos | **Bloqueadas**, mesmo com pedido por voz |

## Testes gratuitos

\`cd lab-app && npm run verify:engineering && npm test && npm run build\`

- \`scripts/tests/agent-orchestrator-gateway.test.mjs\` valida autenticação dupla, bloqueio de origem, limites, riscos e ausência de tokens nos issues.
- \`scripts/tests/agent-intake.test.mjs\` valida permissão admin, triagem de risco, markdown seguro e proposta PR de modo simulado.
- A suite CI atual cobre PostgreSQL 16/17 e Auth Supabase descartável.

## Princípios de UX

- Não ativar microfone sem gesto humano; botão dedicado inicia uma frase.
- Não gravar áudio, nem armazená-lo na fila do GitHub; somente o texto confirmado é registrado.
- Dizer "registrar" após ditar para registrar sem teclado. Dizer "status" para ouvir a quantidade de tarefas abertas.
- Comandos de voz não são aprovação de cobrança, exclusão de contas ou publicação em produção.
- Respeitar navegadores sem SpeechRecognition: campo de texto permanece disponível.

## Modelo de desenvolvimento autônomo posterior

Para obter programação realmente autônoma sem versionar etapa por etapa manualmente, executar um **coding agent instalado em sandbox** com competência para abrir branches e commits, revisão de código e iteração de CI, mas sem acesso a senhas, banco público nem tokens de produção. A autenticação desse coding agent terá custos ou limites de plataforma próprios que devem ser verificados antes da instalação.
