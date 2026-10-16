# LABGAME — Contratos de APIs e RPCs

**Versão:** 1.0 · **Data:** 2026-10-12 · **Fonte:** introspecção read-only de funções em `public` no Supabase LABGAME e implementações `lab-app/src/features/`. **Documenta serviços existentes; geração IA é futura.**

## Transporte e autenticação
- Frontend React usa `@supabase/supabase-js`; `VITE_SUPABASE_URL` e publishable `VITE_SUPABASE_ANON_KEY` são públicos. Nunca usar `service_role` no browser.
- Sessão de usuário via Supabase Auth e JWT; servidor decide identidade com `auth.uid()` nas funções que operam em dados privados.
- RPCs no PostgREST usam `supabase.rpc("nome",{p_param: valor})`; sem fornecimento de `user_id` pelo frontend para definir autorização.
- Erros de autorização ou validação SQL são propagados ao cliente com apresentação segura. **Não registrar JWT, tokens OTP, e-mails privados ou payloads sensíveis em logs.**
- `SECURITY DEFINER` é usado nas transações. Execução autenticada é necessária, mas requer teste de dois usuários e revisão de RLS, GRANT e `search_path` — não assumir segurança apenas pelo tipo de função.

## Catálogo confirmado em ambiente LABGAME

| RPC | Parâmetros SQL | Resposta | Role cliente permitida | Uso e invariantes |
|---|---|---|---|---|
| `lab_game_sync` | nenhum | `jsonb` (run/day/XP/checked) | authenticated | Inicializa/recupera tentativa, identifica perda de dia usando hora do banco |
| `lab_game_confirm_chapter` | `p_chapter_id text` | `jsonb` | authenticated | Valida etapa e capítulo; marca idempotente, soma 10 XP apenas uma vez |
| `lab_game_restart_completed` | nenhum | `jsonb` | authenticated | Novo ciclo após 365 etapas, bloqueia reinício no dia da conclusão |
| `lab_game_scorecard` | nenhum | `jsonb` | authenticated | Resumo/contabilidade de XP, `balanced` e sequências |
| `lab_game_update_profile` | `p_name text, p_opt_in boolean` | `void` | authenticated | Nome e consentimento em ranking |
| `lab_game_group_ranking` | `p_group_id uuid` | `TABLE(participant,completed_days,best_days,total_xp)` | authenticated | Ranking individual com consentimento; acesso restrito ao grupo |
| `lab_game_group_summary` | `p_group_id uuid` | `jsonb` | authenticated | Métricas agregadas 7 dias, owner/membros/consentimentos |
| `lab_game_gc_league` | nenhum | `TABLE(rank_position,group_id,group_name,members,consenting_members,days_completed,compliance_pct,window_start,window_end)` | authenticated | Liga opcional de GCs, com elegibilidade e privacidade |
| `lab_game_set_gc_competition` | `p_group_id uuid,p_enabled boolean` | `void` | authenticated | Apenas líder habilita/desabilita participação do grupo |
| `lab_game_video_begin` | `p_video_key text` | `jsonb` | authenticated | Inicia janela de tempo declarativa da sessão de vídeo |
| `lab_game_video_confirm` | `p_video_key text` | `jsonb` | authenticated | 5 XP uma única vez; nunca substitui capítulo diário |
| `join_reading_group` | `p_invite_token uuid` | `uuid` | authenticated | Valida convite de GC e associa usuário sem expor token em ranking |
| `is_reading_group_member` | `p_group_id uuid` | `boolean` | authenticated | Verificação auxiliar de autorização de membership |
| `lab_bible_search` | `p_query text,p_limit integer` | `TABLE(book_name,chapter_id,chapter_number,verse_number,verse_text)` | anon / authenticated | Consulta texto público da Almeida 1911, sem XP |

## Funções internas — PROIBIDAS como APIs públicas

- `register_reading_group_owner()` retorna `trigger`: invocada pelo trigger `on_reading_group_created`.
- `rls_auto_enable()` retorna `event_trigger`: mecanismo interno de habilitação de RLS.
- **Problema atual:** ambas têm EXECUTE público herdado no banco real, apesar de não serem endpoints de usuário. A migração `202610120001_lab_privileges_hardening.sql` prepara REVOKE. **Ainda não aplicada.**

## Contratos de fronteira do frontend

| Módulo | Cliente / endpoint |
|---|---|
| `src/features/auth.ts` | Supabase `signUp`, `signInWithPassword`, `resend`, `resetPasswordForEmail`, `verifyOtp`, `updateUser` |
| `src/features/lab-game.ts` | `lab_game_*` RPCs; `LabGameState`, `LabScorecard`, `GCGroupSummary`, ranking |
| `src/features/groups.ts` | `reading_groups`, `reading_group_invites`, RPC `join_reading_group` |
| `src/features/bible.ts` | `lab_bible_chapters`, `lab_bible_search`, texto/versos públicos |
| `src/features/bible-favorites.ts` | `lab_bible_favorites` com RLS por usuário |

## Idempotência / relógio / antifraude

1. Dados de pontuação e progresso **autoritativos no servidor**, nunca a partir de números enviados no frontend.
2. Relógio `America/Sao_Paulo` na transação PostgreSQL, não calendário de celular.
3. Cada confirmação de capítulo e vídeo deve ser idempotente; reenvio por rede não duplica XP.
4. GC com membership e opt-in de ranking, mínimo para publicação da liga; líder não pode ler outros grupos sem autorização.
5. Bíblia livre, vídeos e exegese futura não avançam etapa diária.
6. Erros de API devem oferecer retry seguro e autenticação necessária, sem vazar informação sobre outros usuários.

## Fluxos ainda não implementados / não homologados

- Não existem RPCs de IA/exegese/flashcards nem Edge Functions criadas. A integração do motor exige contratos separados, JWT, rate limits, orçamento e validação de JSON Schema.
- E-mails SMTP, confirmações, deep linking de app nativo e RLS multiusuário ainda carecem de E2E real.
- API do Supabase em preview usa o projeto LABGAME atual; ambiente staging separado está pendente.
- Query de aceitação para permissões: `lab-app/scripts/sql/security-post-migration-check.sql`.

## Mudanças contratuais

Nova função RPC, schema ou alteração de resposta exige: TypeScript, migration/GRANT/RLS, teste de cliente + servidor + duas identidades, ADR quando houver breaking change, CI aprovado e procedimento de rollback. Nunca usar migrações do CRM legado em `project/`.
