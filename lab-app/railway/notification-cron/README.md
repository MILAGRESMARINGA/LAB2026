# LABGAME Railway | notificações agendadas (preparado, NÃO publicado)

Este worker não substitui o Vercel nem o Supabase e não contém banco de dados ou inteligência artificial. Ele realiza **uma chamada POST autenticada** à Edge Function `notify-reading-email` do Supabase **LABGAME** e encerra. A função Supabase valida horários, preferências individuais e entrega única por dia.

## Posição na arquitetura

- Vercel: navegador/PWA
- Supabase: usuários, XP, Bíblia, RLS, Edge Function de notificações e envio com consentimento
- Railway: somente agendamento (cron de curta duração)

Railway project: `LABGAME-3`, ambiente `production`. **Não utilizar projetos Railway de outros aplicativos.** Fonte prevista: `MILAGRESMARINGA/LAB2026`, diretório raiz do serviço: `/lab-app/railway/notification-cron`.

## Implantação segura: gates

1. Homologar backup/restauração do banco Supabase, depois migrações necessárias e a função `notify-reading-email`. O worker não pode corrigir uma função ausente.
2. Configurar no Supabase um segredo de pelo menos 32 caracteres (`LAB_NOTIFICATION_CRON_SECRET`), `RESEND_API_KEY`, `LAB_NOTIFICATION_FROM` de domínio remetente verificado e `LAB_NOTIFICATION_EMAIL_READY=true` **somente após o aceite**. As mesmas credenciais de cron devem ficar exclusivamente como variáveis privadas no Railway.
3. Configurar o Railway com Node.js 20+, comando `npm start`, agendamento `0 12 * * *` (12:00 UTC, 09:00 no horário atual de Brasília). Serviço deve executar e encerrar, nunca subir servidor HTTP contínuo.
4. Só após confirmação explícita do orçamento habilitar `LAB_RAILWAY_WORKER_ENABLED=true` no Railway. Por padrão, ausente ou diferente de `true`, o worker não faz chamada HTTP.
5. Testar duas identidades em staging, consentimento opt-in e opt-out, horários silenciosos, falhas do provedor e deduplicação antes de disponibilizar para participantes.

O endpoint Supabase está fixado em `azejfxvaamgkmfmwdzjn` no código, para impedir conexão acidental com CRM. Tokens **nunca** vão para o GitHub nem são impressos em logs. A execução falha de modo seguro quando uma dependência não está pronta.

## Custo

Criar arquivo GitHub, projeto vazio ou serviço *staged* não executa recursos. **Um serviço Railway ativo consome uso medido**, mesmo que esteja coberto pelo crédito incluído na assinatura. O Railway Agent e modelos de voz têm custos próprios por utilização. Não ativar sem conferir a franquia atual. Usar execução cron curta em vez de servidor permanente.

## Testes gratuitos locais

```sh
cd lab-app
node --test scripts/tests/railway-notification-cron.test.mjs
```

Os testes acima também integram `npm run verify:engineering` no CI do GitHub.
