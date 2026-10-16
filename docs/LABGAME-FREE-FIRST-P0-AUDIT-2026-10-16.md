# LABGAME 3.0 — Entrega P0, política custo zero e homologação verificável
**Data:** 16/10/2026. Branch `lab-rebuild-2026`. Responsável autorizou concluir o desenvolvimento sem contratar nenhum recurso adicional pago.
**Escopo:** `lab-app/`, `docs/`, workflow LAB CI. O projeto CRM é EXPRESSAMENTE FORA DO ESCOPO.

## Política financeira vinculante
1. **Custo adicional autorizado: R$ 0 / US$ 0.** Usar GitHub Actions, Supabase CLI/Docker local, o Supabase Free já disponível e infraestrutura gratuita pré-existente. NÃO solicitar branches faturadas, upgrade, plugin pago, Heroku adicional nem pagar por Resend/Vercel.
2. **Novo projeto Supabase Free:** cotação oficial para a organização `LAB2026GAME` = USD 0/mês. Tentativa de criar `LABGAME-HOMOLOGACAO-FREE` foi **bloqueada** porque um administrador da organização já atingiu o limite global de 2 projetos Free entre organizações. **Nenhum projeto foi criado, cobrado, pausado ou apagado**. CRM e outros projetos intactos.
3. **Branch Supabase de desenvolvimento:** cotação anterior de USD 0,01344/hora REJEITADA como escolha padrão, não será criada.
4. **Heroku/render/serviços de e-mail:** não acrescentar custo nem alegar que um provedor está conectado sem credenciais verificadas. Testes locais são suficientes para validar código; envio real depende de integração com serviço existente/gratuito.

## P0: entregas funcionais e prova automatizada
| Área | Implementação/controle | Evidência | Status |
|---|---|---|---|
| Canon | 1189 capítulos, 365 etapas 271×3+94×4; 366 etapas 275×3+91×4 | `game-plan-next.test.ts` + contrato integral de seed SQL | Testado |
| Regra 24+6 | Ativação individual 24h, carência única 6h, −3/−6 XP, 3 vidas/mês e +24h por vida | `journey-clock-next.test.ts` + PostgreSQL 16/17 | Testado |
| Virada do mês | Incidente usa vidas somente do mês de origem, sem resgatar run encerrada | SQL smoke com timestamps 31/10→04/11 | Testado |
| XP não cumulativo | `run_xp=0` após reinício, recordes históricos separados | SQL + dois JWTs locais | Testado |
| Antifraude | Confirmação de capítulos única por run/etapa e bloqueio 24h, concorrência com 8 requests | GoTrue+PostgREST e SQL CI | Testado |
| Auth e e-mail | Dois usuários reais de teste, confirmação obrigatória de e-mail via Mailpit e login posterior | `local-supabase-auth.mjs` | Testado |
| Recuperação | Link de recuperação por SMTP local, nova senha e login | `local-supabase-auth.mjs` | Testado |
| Perfil pessoal | RLS separada, sem CPF/RG como requisito; religião facultativa e consentida | Migrações e dois usuários locais | Testado |
| Notificações | Preferências por assunto e canal, opt-in geral padrão off; leitura pop-up V1/V2; email dedupe worker desativado | PostgreSQL, Vitest e `notification-worker-contract.test.ts` | Implementado/validado localmente |
| Reset total | Apaga tentativas V1/V2 e pontuação pessoal, mantém identidade; reautenticação recente | SQL + JWT local `local-v2-smoke.mjs` | Testado |
| Exclusão de conta | Edge Function com JWT recente, frase/e-mail, bloqueio de liderança GC, cascata e proteção terceiros | Deno+GoTrue local `local-account-delete.mjs` | Testado sem implantação |
| V1 coexistência | Não direcionar automaticamente participante V1 para V2 após habilitar feature | `journey-version.ts` e unit tests | Codificado e em CI |
| Privacidade | Exportação de dados inclui perfil, leituras, estudos, vídeos e registros de entrega | `account-export.test.ts` | Testado |
| JavaScript/segurança | TS strict build, Vitest, auditoria de engenharia, PostgreSQL16+17, GoTrue, Deno | `.github/workflows/lab-ci.yml` | CI obrigatório |

## Distinção de prontidão
- **Testado localmente não equivale a publicado.** O Supabase Free LABGAME em produção continua com a versão anterior das RPCs. A V2 mantém dois kill switches desligados por padrão: `lab_v2_release_controls.enabled=false` no banco e `VITE_LAB_V2_READY` ausente no cliente.
- A V2 não pode ser promovida ao domínio público antes de se confirmar a estratégia de migração dos usuários V1, termos de consentimento, backup independente/recoverability, verificações na hospedagem e flags corretas.
- **E-mail opcional de leitura:** worker Resend criado, mas nenhuma API key/remetente certificado/agendamento foi configurado. Não prometer envio real; testes do Mailpit só comprovam autenticação/recovery no ambiente local. As categorias GC, conquista, etapa e estudo têm preferências persistentes, não campanhas outbound em produção.
- **Exclusão de conta:** o endpoint Edge já passou teste real local, mas não foi implantado no Supabase de produção. O botão `VITE_ACCOUNT_DELETION_READY` permanece desativado por segurança.
- **Conformidade de arquivos:** nenhuma migration V2/Perfil aplicada ao banco real, nenhuma mudança no CRM e nenhuma contratação.
- **Rollback:** antes de quaisquer migrações de produção, exigir cópia restaurável do estado atual, manter URLs e versões conhecidas, habilitar rollout gradual e verificação de dados existentes sem reset de usuário.

## Caminho gratuito para liberação controlada
1. CI completo verde incluindo GoTrue/Mailpit e PostgreSQL 16/17. Testes representam duas contas fictícias reais no protocolo, não produção.
2. Exportar/restaurar backup na infraestrutura já disponível (sem banco de teste faturado), comparar contagens e integridade. Não acessar nem remover dados pessoais sem backup.
3. Validar regressões de V1 coexistência e web/PWA; publicação de interface gratuita Vercel *somente* após o servidor estar compatível.
4. Aplicar migrações versionadas no Supabase Free de produção por etapas **após** backup e ensaio de rollback, com `enabled=false`; verificar RLS e Auth com contas de teste sem acessar dados de terceiros.
5. Habilitar V2 gradualmente para novos participantes; antigos permanecem no ciclo V1, sem migrar automaticamente.
6. Implantar Edge de exclusão e notificações opcionais somente após política de privacidade, monitoramento e provedor gratuito verificado.
7. Registrar evidências de liberação e monitorar erros, tentativas concorrentes e prazos reais nas primeiras etapas.

**Não declarar P0 de produção concluído enquanto os requisitos externos/operacionais acima estiverem abertos.** CI verde significa `P0 code + free local security QA`, não disponibilidade pública.
