# LABGAME V2 — Implementação segura em andamento (16/10/2026)
**Branch:** `lab-rebuild-2026`; escopo exclusivo `lab-app/` / `docs/` / workflow `lab-ci.yml`. Produção Supabase LABGAME não alterada por este pacote.

## Implementado nesta rodada
1. **Migração sombra versionada e controlada:** `lab-app/supabase/migrations/202610160100_lab_v2_shadow_game.sql`, com novas tabelas para planos, runs, etapas, confirmações, saldo de vidas por mês, incidentes e RPCs `lab_v2_start`, `lab_v2_activate`, `lab_v2_confirm`, `lab_v2_sync`, helper `lab_v2_resolve`. As tabelas V1 de leitura/XP não são atualizadas.
2. **Chave de liberação dupla:** `lab_v2_release_controls.enabled=false` no SQL + `VITE_LAB_V2_READY` (desligada quando ausente). Não habilitar em nenhum ambiente sem a bateria E2E.
3. **Dois planos versionados por duração:** `202610160101_lab_v2_plans_seed.sql` com **2378** associações (`1189×2`) de capítulos. Comprimentos 365 (271×3+94×4) e 366 (275×3+91×4), todos os capítulos presentes uma única vez, conforme `game-plan-next.ts`.
4. **Relógio e vidas no servidor:** início explícito da etapa, 24h exatas + uma tolerância de 6h, aplicação de multa -3/-6 no momento da transição de etapa, extensões de 24h em incidentes, saldo máximo 3 vidas por mês de origem da ocorrência; consulta após longo período não recupera tentativas encerradas.
5. **XP por run:** confirmações +10 apenas uma vez para cada capítulo/etapa de uma run. Novo run começa com 0 XP, enquanto `best_completed_stages` é calculado das runs passadas. O backend V2 **não** soma `lab_game_stats.total_xp` da V1 ao novo placar. Vídeos/estudos ainda **não** integram esse placar.
6. **RLS/segurança:** `REVOKE` de escrita para roles browser nas novas tabelas, SELECT privado por `auth.uid()`, RPCs com `SECURITY DEFINER SET search_path=''`, lock transacional único por participante. `lab_v2_resolve` não tem permissão de chamada direta para browser.
7. **CI real, banco descartável:** novo job `v2-postgres` de `.github/workflows/lab-ci.yml`, PostgreSQL 16 de serviço isolado. `scripts/tests/v2-postgres-smoke.sql` cria apenas dois IDs de usuário **simulados** e valida liberação desligada, RLS, confirmação idempotente, avanço só após 24h, atraso -3, vida 1 uma vez, consumo de vidas até falha, nova run com 0 XP + melhor recorde intacto e identidade B isolada. CI nº 335 aprovado: https://github.com/MILAGRESMARINGA/LAB2026/actions/runs/38904343989
8. **Contrato de seed e de versão:** `tests/v2-database-contract.test.ts` compara TODOS os 2378 pares de capítulos/etapas com o gerador TypeScript, além de fiscalizar prefixos de migração únicos, RLS e travas (CI nº 332 aprovado).
9. **Adapter não ativado:** `src/features/journey-v2.ts` com tipagem e chamadas específicas V2, sem importar no aplicativo atual; `tests/journey-v2-client.test.ts` verifica segurança e isolamento de chamadas.

## Observação sobre Perfil e Configurações
A branch já contém a tela `src/components/ProfileSettings.tsx`, a camada `features/profile-settings.ts` e a migração separada `202610160001_profile_notification_preferences.sql`, com campos privados, consentimento para dados religiosos, preferências opt-in, botão sair visível, reset total V1 e fluxo de exclusão guardado por configuração. A migração de Perfil não foi aplicada por esta rodada e não é uma entrega de backend V2. A exclusão de conta depende de Edge Function administrativa homologada.

## CRÍTICO — gates antes de ativar a V2
- **Reset total:** a RPC `lab_game_full_reset` da migração de Perfil apaga apenas o escopo V1. Deve ser adaptada para apagar/arquivar corretamente **todas as runs V2, wallets, incidentes e medalhas de V2**, sem comprometer GC ou criar duas jornadas ativas. V2 NÃO pode ser liberada junto de um reset incompleto.
- **Plano e migração do usuário V1:** V1 `lab_game_sync()` abre automaticamente run legada; `lab_v2_start()` bloqueia usuários com run V1 ativa. Necessária migração explícita sem perdas nem antecipação, somente com regra de negócio/homologação.
- **Validação do calendário 365/366:** os dois planos existem, mas a elegibilidade de um plano de 366 etapas para um jogador que começa fora de 1º de janeiro ainda precisa regra final.
- **Bônus e coroas:** a migration `202610140001_annual_cycle_completion_awards.sql` ainda NÃO está aplicada, refere-se ao ledger V1 e conta XP vitalício. Não usar em V2 sem revisão de bônus por run, coroas e constância perfeita.
- **Vídeos/estudos:** ledger V2 para +5 XP de vídeo efetivamente elegível e eventual XP de estudo; 90 segundos decorridos desde abrir player não comprovam reprodução.
- **GC:** rankings e ligas usam datas civis da V1 e precisam recalcular contribuição por conclusão de etapa e consentimento em V2.
- **Duração e limites:** penalidade depois de utilizar uma vida usa teto provisório de -6 XP na implementação sombra; exige aceite explícito. Verificar acesso entre jornadas nos limites de prazo, inclusive idempotência quando offline.
- **Prod vs testes:** o PostgreSQL 16 do CI contém auth.users simulado, **não é** validação do Supabase Auth real. Ainda necessários usuários teste independentes, RLS real, reversão/migração num ambiente de staging, backup verificado, SMTP e testes mobile.
- **Segurança do relógio:** validar `statement_timestamp()` em corrida e simulador de mês/ano/fuso; primeira leitura voluntária não deve ficar presa em um calendário civil. Precisa ainda observabilidade e política de prevenção de abusos.
- **Planos V2 imutáveis:** após liberar uma versão de plano para participantes, alteração de linhas de `lab_v2_plan_chapters` deve ser impedida por procedimento administrativo/release; versões adicionais em caso de necessidade.
- **Ações irreversíveis:** exclusão de conta requer backend server-side e verificação de vínculo de liderança GC. Não ligar botões de exclusão sem teste da Edge Function real.

## Ordem dos próximos passos
1. Ligar as migrações **somente em PostgreSQL isolado/staging**, exercitar o pacote transacional completo e duas contas reais (não alterar produção).
2. Resolver reset V1+V2, coexistência/migração de contas, medalhas/coroas, classificação GC e vídeos/estudos.
3. Homologar o frontend V2 com componente de leitura/timers, progresso e as preferências de notificações já preparadas na Central.
4. Executar gates P0 e publicar com rollout versionado; só então cogitar promover alias/canonical domain.
