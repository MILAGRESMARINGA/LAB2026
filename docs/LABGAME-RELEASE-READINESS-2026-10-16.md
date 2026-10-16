# LABGAME — Prontidão de entrega e condições para lançamento
**Data:** 16/10/2026 · Branch `lab-rebuild-2026` · Status: **CÓDIGO E TESTES INTEGRADOS APROVADOS; PUBLICAÇÃO V2 E ALTERAÇÕES DE PRODUÇÃO BLOQUEADAS ATÉ HOMOLOGAÇÃO EM SUPABASE REAL**.

## Implementado e verificado por CI

- **Jornada V2:** cronômetro móvel de 24h após ativação, tolerância única de 6h, descontos de 3/6 XP, três vidas por mês civil no timezone fixo de São Paulo, extensão de 24h por vida, impossibilidade de prolongar incidentes anteriores na virada do mês, 0 XP por nova tentativa e recordes históricos separados.
- **Planos:** 1.189 capítulos, distribuídos em 365 dias (271×3+94×4) e 366 dias (275×3+91×4); duas versões imutáveis do calendário V2 são semeadas em migração própria. O plano V1 permanece preservado.
- **Integridade:** migrações V2 de corrida, conclusão e prêmios, reset V1+V2, GC, vídeo e estudos; idempotência por recurso/run. Configuração V2 tem dupla trava padrão desligada no app e no SQL.
- **Interface:** painel de Jornada V2 preparado e ligado à flag de desenvolvimento. Central de Configurações com cadastro e vínculos ministeriais opcionais e privados, conta e exportação de dados, logout destacado, confirmação rigorosa de reset/exclusão; opção de notificações por categoria **e por canal** (pop-up/e-mail).
- **Privacidade:** campos de documentos não coletados por padrão; dados religiosos protegidos e dependentes de consentimento; exportação inclui livros, histórico, estudos, sessões de vídeo e prêmios V2. A seleção geral `enabled=false` zera os canais opcionais ao salvar.
- **RLS no teste isolado:** PostgreSQL 16 executa as migrações V2, confirmações com duas identidades simuladas, perdas, XP e GC; teste ampliado executa também a migração de Perfil e a matriz de notificações, validando RLS, permissões e backfill.
- **CI comprovado:** GitHub Actions #382 `https://github.com/MILAGRESMARINGA/LAB2026/actions/runs/38923291741` com os dois jobs em `success`.

## Dependências bloqueantes que impedem alegar conclusão total

1. **Staging Supabase Auth real inexistente:** o projeto LABGAME não possui development branches conectadas. Criar uma pode gerar cobrança; consultar preço/autorizar antes. Sem ela, os dois usuários usados em GitHub Actions são **simulados**, não há autenticação GoTrue e políticas RLS testadas com tokens reais.
2. **Migrações ainda não aplicadas ao Supabase de produção:** `202610160001`, `202610160100..106` precisam de execução homologada, rollback, backup e testes com duas contas reais. A V2 continua desativada por padrão.
3. **Notificações por e-mail:** as preferências são persistidas e existe a matriz; **não há trabalhador de e-mail/SMTP ou domínio remetente validado**. Não prometer notificações por e-mail até credenciais e configuração de envio, opt-out, revalidação por mensagem e monitoramento.
4. **Exclusão de conta:** código da Edge Function `account-delete` existe na branch com confirmação de identidade e verificação de liderança GC, mas **não está implantado no Supabase do usuário**. O botão de exclusão tem flag `VITE_ACCOUNT_DELETION_READY` e deve continuar desativado até testes reais.
5. **Monitoração e produção:** testes com duas contas reais e concorrência, migração transparente de run V1 ativa para V2, backup off-site/restauração, envio transacional de recuperação Auth, observabilidade, avaliação legal de privacidade, mobile E2E e release parcial.
6. **Vercel:** não promover o domínio `labgame-biblia.vercel.app` nem ligar `VITE_LAB_V2_READY` sem passar por esses gates.

## Sequência de execução sem perda de dados
A. Obter/autorizar um ambiente Supabase de staging, com limite de custo e sem cópia de PII real; levantar a versão PG/Auth e aplicar migrações na ordem validada.
B. Criar duas contas **somente no staging**, verificar auth OTP/SMTP, signup, login, refresh token, identidade, RLS, GM/GC, mudança de prazo, corrida entre dispositivos, lives, reset, exclusão e exportação.
C. Verificar SMTP e worker de notificação: manter envio desligado até consentimento completo e teste de revogação.
D. Homologar rollback/backup off-site. Definir o anúncio e a confirmação explícita de migração de usuários V1 para V2 antes de alterar jornadas em curso.
E. Ativar primeiro o painel num ambiente de visualização restrito; liberar progressivamente. Só após passagem em staging promover Vercel e criar migrações de produção com chaves controladas.

**Declaração honesta:** o código e os testes isolados são entregas reais; o produto completo em produção ainda **não** foi homologado nem publicado, e não deve ser descrito como concluído.


## Progresso adicional — envio opcional de leitura por e-mail (desativado)

- `202610160107_notification_delivery_audit.sql`: registro de entrega por usuário/categoria/canal/dia, chave única para não disparar duas vezes, RLS somente leitura própria, escrita exclusiva do servidor.
- `supabase/functions/notify-reading-email/index.ts`: trabalhador de e-mail por API Resend, com segredo de cron separado de JWT, flag `LAB_NOTIFICATION_EMAIL_READY=true` obrigatória, remetente e domínio verificados, preferência `reading_email` e `enabled` verificadas **duas vezes**, leitura V2 em andamento, horário silencioso 20h–08h Brasil e reserva idempotente antes de enviar.
- O trabalhador **NÃO FOI IMPLANTADO NEM AGENDADO**. Sem `RESEND_API_KEY`, `LAB_NOTIFICATION_FROM` verificado e `LAB_NOTIFICATION_CRON_SECRET` de alta entropia ele falha fechado sem e-mail. Precisará de agendamento seguro no staging/produção e monitoramento de erros, rejeições e opt-out.
- `account-export.ts` inclui histórico de envio opcional do usuário; testes SQL + Vitest verificam matriz, seleção privada e restrição de escrita; sem envio durante testes.
- Esta primeira rotina é somente para **lembrete de leitura diária**; atividades GC, novas etapas, conquistas e estudos ainda precisam de produtores específicos e regras de frequência antes de ativar essas categorias no canal de e-mail.
