# Auditoria de segurança em ambiente LABGAME — 12 de outubro de 2026

**Escopo real verificado:** Supabase LABGAME `azejfxvaamgkmfmwdzjn`, branch `lab-rebuild-2026`, GitHub Actions e Vercel `labgame-biblia`.
**Método:** inspeção **somente leitura** de `pg_class`, `pg_proc`, `pg_policies`, ACLs, migrações, advisors da Supabase, estado do CI e do deployment. NÃO houve exploração, pentest, alteração SQL de produção ou disparo de emails.

## Indicadores confirmados
- Projeto LABGAME `ACTIVE_HEALTHY`; Postgres 17.11.
- 15 tabelas públicas, todas com RLS habilitada.
- Plano v1: 1.189 capítulos únicos, 365 etapas, 2–4 capítulos por dia, nenhum dia excede 4; primeira etapa IDs 1:1 (Gênesis), 19:1 (Salmos), 43:1 (João).
- Bíblia de domínio público Almeida 1911: 1.189 capítulos, 31.101 versículos; 71 recursos BibleProject.
- 12 migrações da aplicação reconhecidas na história Supabase; nenhuma Edge Function criada; sem branch de banco/staging.
- Funções `lab_game_*` privilegiam `authenticated`, não `anon`, e usam `search_path` fixo. Isto é boa prática, NÃO substitui testes de autorização de seus corpos.
- CI LAB #171 passou testes, controles estáticos e build no SHA `5af7bc7e83f670ea9857772d82c0188519dcb48c`; o preview do mesmo SHA estava READY. Alterações posteriores exigem novo CI/READY.

## Finding S-01 — Privilégios de tabela além do necessário
**Severidade: ALTA (capacidade de dano caso esses papéis tenham uma via SQL); estado: CORREÇÃO PREPARADA, NÃO APLICADA.**

O catálogo confirma privilégios `TRUNCATE`, `TRIGGER` e `REFERENCES` concedidos diretamente a `anon` e/ou `authenticated`, inclusive para `reading_groups`, `reading_group_members`, `reading_group_invites`, `reading_completions`, `lab_bible_*` e `lab_game_video_resources`.

**Cuidado técnico:** PostgREST não disponibiliza necessariamente operações `TRUNCATE` como um endpoint normal; a detecção de permissões excessivas não é prova de exploração. Contudo, `TRUNCATE` ignora RLS e concessões desnecessárias violam o mínimo privilégio. Não permitir abertura pública do serviço com ACLs não revisadas.

**Correção:** `lab-app/supabase/migrations/202610120001_lab_privileges_hardening.sql` remove somente `TRUNCATE/TRIGGER/REFERENCES` dos papéis de cliente, preserva DML necessário e não altera dados. Inclui teste pós-condição e defaults do owner `postgres`.

**Verificação:** rodar SQL de `lab-app/scripts/sql/security-post-migration-check.sql` após aplicar, conferir zero violações; fazer smoke de GCs e leitor com contas teste.

## Finding S-02 — Funções de gatilho com EXECUTE herdado de PUBLIC
**Severidade: MÉDIA/ALTA por endurecimento de privilégio; estado: CORREÇÃO PREPARADA, NÃO APLICADA.**

O Supabase Security Advisor sinaliza `public.register_reading_group_owner()` e `public.rls_auto_enable()` como `SECURITY DEFINER` executáveis por papéis de cliente. A inspeção do PostgreSQL confirmou `EXECUTE` por `anon` e `authenticated`, e ambas retornam tipos internos `trigger/event_trigger`, não APIs de usuário. A primeira é invocada por gatilho `on_reading_group_created`.

**Correção:** REVOKE EXECUTE dessas duas funções para PUBLIC/anon/authenticated; mantém ownership `postgres` e gatilhos criados. Smoke de criação de GC obrigatório após aplicação.

## Finding S-03 — Proteção de senhas vazadas desabilitada
**Severidade: MÉDIA; estado: PENDENTE DE CONFIGURAÇÃO ADMINISTRATIVA.**

Supabase Auth Leaked Password Protection desligada (Security Advisor). Habilitar se disponível no plano e testar cadastro/reset; adicionar CAPTCHA, limites de tentativa, MFA opcional para líderes/admin conforme risco. [Documentação oficial](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Finding S-04 — SECURITY DEFINER autorizadas para autenticados
**Severidade: revisão OBRIGATÓRIA, não necessariamente vulnerabilidade.**

O Security Advisor lista funções `lab_game_confirm_chapter`, `lab_game_sync`, `lab_game_gc_league`, `lab_game_group_ranking`, `lab_game_update_profile`, vídeo, etc. Suas permissões para autenticados são **necessárias** para o aplicativo, desde que `auth.uid()`, RLS interna, consentimento e grupo sejam respeitados. Não revogar essas RPCs cegamente. É obrigatório teste de dois usuários e chamadas diretas. [Advisor de functions](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Finding S-05 — Plano interno com RLS sem política
**Severidade: INFORMATIVA.** `lab_game_plan_chapters` não possui policy; ACL não permite SELECT de cliente. Isso é intencional: RPC no servidor lê plano congelado, sem expor escrita nem permitir browser mutar dia. Não criar policy permissiva apenas para silenciar o advisory. [Explicação do advisor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Finding P-01 — Índices de chaves estrangeiras ausentes
**Severidade: PERFORMANCE; estado: PENDENTE.** O advisor apontou seis FKs não cobertas: favoritas (duas), vídeos (sessões/recompensas), associação de GC por `user_id` e owner de GC. Planejar índices depois de confirmar uso e cardinalidade; não excluir índices antigos só por serem classificados como "unused" em base quase vazia. [Advisor](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).

## Finding O-01 — E-mail, release e banco de homologação
**Severidade: ALTA operacional; estado: PENDENTE.**
- Supabase possui conta de autenticação previamente confirmada e com login registrado (contagem agregada), mas isso **não** comprova entrega SMTP nova.
- Não há branch Supabase/staging e não há Edge Function IA ativa.
- Vercel preview atual tem SSO Protection; testar rota pública real conforme política de promoção. Alias canônico é distinto de URLs efêmeras; `VITE_PUBLIC_APP_URL` deve corresponder ao domínio principal.
- Código OTP previamente navegava para origem canônica e perdia sessão em preview; corrigido no GitHub com teste na branch, **ainda necessita deploy**.

## Plano de execução, com bloqueadores
1. Revisar migration `202610120001` por `security-engineer` e `database-engineer`, checar backups e executar em staging isolado.
2. Aplicar ao LABGAME somente após aprovação operacional; executar verificação pós-migração, reconsultar advisors, smoke de GC/autenticação/Bíblia.
3. Configurar Leak Password Protection, SMTP Resend verificado e antifraude; e-mail real testado.
4. Criar staging Supabase, QA cross-user + RLS + concorrência + dispositivos; repetir CI e Vercel READY com SHA.
5. Revisar performance, criar lockfile e adotar `npm ci`/auditoria de dependências; documentação de retenção LGPD, incidentes e backup testado.

**Estado global:** Auditoria estática e inventário EFETUADOS; riscos de produção NÃO CORRIGIDOS até aplicação e teste real. Não alegar "seguro" somente por build/CI positivo.
