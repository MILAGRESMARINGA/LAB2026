# LABGAME — Operações, continuidade e resposta a incidentes

**Owner:** platform-observability-engineer + security-engineer. **Status:** runbook aprovado como processo, exercícios de recuperação ainda NÃO realizados.

## Prioridades e tempos-alvo operacionais propostos
- **Sev-1:** vazamento de segredo, quebra de autenticação/RLS, perda de dados, fraude massiva de XP. Primeira ação: suspender tráfego/publicação insegura e revogar acesso afetado.
- **Sev-2:** cadastro/SMTP indisponível, rankings imprecisos, deploy com erro afetando usuários.
- **Sev-3:** mídia ou estudos opcionais fora do ar sem impacto na leitura.

Metas propostas a validar com equipe: sev-1 triagem ≤30 min; sev-2 ≤4h úteis; sev-3 próxima janela operacional. Não garantir SLA externo antes de plantão real.

## Resposta a incidentes
1. **Detectar e classificar:** registrar horário, ID do deploy, serviço, sintomas, escopo e reporter — sem tokens, e-mail completo ou outros dados sensíveis no incidente.
2. **Conter:** congelar promoções, bloquear endpoint, desativar IA/recursos opcionais se necessário; preservar logs sob acesso restrito.
3. **Revogar/rotacionar:** senha, API keys, JWT signing keys ou SMTP conforme comprometimento (avaliar impacto de sessões); nunca colocar valor do segredo no ticket.
4. **Investigar:** correlação de requests, logs Supabase/Vercel/GitHub/Resend, validação de RLS, escopo dos dados afetados e linha do tempo.
5. **Restaurar:** deploy anterior READY se compatível, mitigar SQL via migration segura, verificar integridade do banco e leitura, testes de smoke.
6. **Comunicar:** responsáveis, usuários afetados e assessoria LGPD/jurídica conforme natureza do incidente; documentar comunicação com acesso mínimo.
7. **Pós-mortem:** causa-raiz, controles faltantes, regressão automatizada, ADR e owner/prazo.

## Backup, restauração e dados
- Responsável confirma backup real no painel do projeto Supabase LABGAME, cobertura de dados e retenção definida. Não assumir que todo plano inclui PITR.
- Testar restauração em banco isolado com dados fictícios e medidas de anonimização, não restaurar em produção para teste.
- Migrações SQL somente de `lab-app/supabase/migrations/`; executar script aprovado após snapshot e revisar `SECURITY DEFINER`.
- Logar apenas IDs técnicos e métricas agregadas. Solicitações de acesso/exclusão seguem política LGPD e preservar logs somente pelo prazo devido.
- Manter registro de incidentes separado da base pública e sem senhas.

## Sinais de observabilidade a implementar
- Percentual de sucesso cadastro/confirm/recuperação (sem armazenar token/email bruto);
- Latência/erros de `lab_game_sync`/`lab_game_confirm_chapter`, duplicatas e tentativas negadas;
- Descompasso de XP (`balanced=false`), picos de vídeos confirmados e abuso;
- Erros de acesso GC, taxa de consentimento (somente agregada), latência da liga;
- Taxa de build CI e Vercel READY/ERROR, falha por quota;
- IA futura: latência/custos por modelo, recusas schema, fila de revisão, alucinação detectada.

**Bloqueadores atuais:** SMTP não homologado, backups e testes de restauração não verificados, alertas ativos não confirmados, staging Supabase ausente.
