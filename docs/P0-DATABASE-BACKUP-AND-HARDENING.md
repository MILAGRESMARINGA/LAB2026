# P0 — Backup e endurecimento de privilégios do banco LABGAME

**Status:** BACKUP PENDENTE; migração ACL PREPARADA NO GITHUB, NÃO APLICADA.
**Projeto EXCLUSIVO:** LABGAME, Supabase `azejfxvaamgkmfmwdzjn`, organização `LAB2026GAME` (`tier_free`). Não operar no projeto CRMIMOBI.
**Última inspeção:** 13/10/2026; ambiente Postgres 17.11, projeto HEALTHY.

## Por que precisamos de um backup manual?

A organização `LAB2026GAME` está no plano **Free**. O Supabase declara que somente Pro/Team/Enterprise têm backups diários automáticos. Em planos Free recomenda `supabase db dump` / exportação própria e guarda externa: [documentação oficial de backups](https://supabase.com/docs/guides/platform/backups).

**Consequência:** o fato de a tabela ter RLS e o CI estar verde não é respaldo para migrar sem cópia. O conector Supabase disponível ao ChatGPT não expõe operação de download de um backup de todos os schemas/usuários, nem prova de restauração. **Não afirmar que existe backup sem conferir arquivo restaurável.**

## Linha de base SQL reproduzível (somente leitura)

O arquivo `lab-app/scripts/sql/security-database-baseline.sql` foi **executado com sucesso** diretamente no Supabase LABGAME em 13/10/2026. Resultado: `plan_chapters=1189`, `unique_plan_chapters=1189`, `plan_days=365`, `max_daily_chapters=4`, `bible_chapters=1189`, `bible_verses=31101`, `video_resources=71`, `reading_groups=0`, `game_runs=0`, `public_tables=15`, `tables_with_rls=15`, **`excessive_table_grants=51` e `exposed_internal_trigger_grants=4`**.

Reexecutar a consulta após a migração: conteúdo/RLS não pode diminuir; `excessive_table_grants` e `exposed_internal_trigger_grants` devem ser zero. Indicadores diferentes tornam a liberação bloqueada até investigação. A baseline é metadado de engenharia e não substitui backup de dados.

## 1. Executar backup local no Windows (apenas leitura do banco)

**Pré-requisitos:**
- Instalar os utilitários PostgreSQL **17** no seu PC: `pg_dump` e `pg_restore`; [download PostgreSQL para Windows](https://www.postgresql.org/download/windows/).
- Executar no PowerShell, dentro da pasta `lab-app` do checkout da branch `lab-rebuild-2026`.
- Possuir senha de conexão PostgreSQL do projeto **LABGAME** (Supabase → Project Settings → Database / Connect). Não é a senha do login do app, nem a chave `anon`.
- Conferir se o host direto `db.azejfxvaamgkmfmwdzjn.supabase.co` funciona na sua conexão; caso não exista IPv6, use o **Session Pooler**, com host e usuário indicados no painel da Supabase para **este projeto**.

Execute:

```powershell
cd .\lab-app
pwsh -NoProfile -File .\scripts\backup-labgame.ps1
```

Se `pwsh` (PowerShell 7) não estiver instalado, pode utilizar o Windows PowerShell:

```powershell
powershell.exe -NoProfile -File .\scripts\backup-labgame.ps1
```

O script pede a senha de forma oculta e a usa somente no processo para `pg_dump`, sem colocá-la em GitHub, log ou prompt. O script trava quando o destino não é reconhecido como LABGAME.

Para usar o **Session Pooler**, o host real vem do painel, não de um exemplo:

```powershell
pwsh -NoProfile -File .\scripts\backup-labgame.ps1 -DbHost "HOST_DO_SESSION_POOLER" -DbUser "postgres.azejfxvaamgkmfmwdzjn" -DbPort 5432
```

**Saída:** pasta local fora do repositório, `$HOME\LABGAME-backups`; arquivo `.dump` PostgreSQL custom, `.manifest.json` com SHA-256, tamanho e objetos esperados; nunca enviar `.dump`, senha, tokens ou conteúdo de `auth.users` pelo chat. Mantenha a cópia criptografada em local acessível somente ao responsável (backup contém informações sensíveis).

**Aceite parcial:** arquivo >100 KB, `pg_restore --list` consegue ler e encontra `auth.users`, o plano, livros/versículos, GCs e pontuação; checksum SHA-256 registrado. Isto garante integridade do inventário, **não comprova a possibilidade de restauração**.

## 2. Validar restauração em banco ISOLADO

- Restaurar o arquivo exclusivamente em banco de desenvolvimento isolado compatível (preferencialmente Postgres 17) seguindo orientação própria para objetos gerenciados pelo Supabase (auth/storage/extensões); não restaurar em produção.
- Verificar pelo menos: 1.189 capítulos do plano, 1.189 capítulos da edição bíblica, 31.101 versículos, 71 recursos de vídeo, estrutura do auth, FKs e políticas RLS.
- Não importar dados pessoais de produção para ambientes de equipe sem justificativa, pseudonimização e controles LGPD.
- Registrar resultado do restore e data/horário. Caso não seja possível restaurar integralmente componentes gerenciados em Postgres genérico, revisar a estratégia com banco de staging Supabase real antes da aprovação da produção.

**Gate P0:** ter backup local legível + evidência suficiente de restauração/rollback e revisão de responsáveis. Nunca confundir `pg_restore --list` com simulação real de restore.

## 3. Migração pré-aprovada para executar APÓS o backup

Arquivo: `lab-app/supabase/migrations/202610120001_lab_privileges_hardening.sql`.

Operações efetuadas quando aplicada:
- `REVOKE TRUNCATE, TRIGGER, REFERENCES` para `PUBLIC`, `anon`, `authenticated` nas 15 tabelas de LABGAME.
- `REVOKE EXECUTE` público das funções internas `register_reading_group_owner()` e `rls_auto_enable()`.
- Reforço dos default privileges de tabelas futuras (owner postgres).
- Bloco `DO` de pós-condições; exceção aborta toda a transação quando executada atomicamente pelo mecanismo de migrações do Supabase.

**Não executa:** `DELETE`, `TRUNCATE`, `DROP`, alteração de RLS ou valores de XP; não atinge banco CRM. Trata-se de ajuste de privilégios, não de migração de dados.

### Gate de revisão

1. Confirmar ambiente Supabase LABGAME `azejfxvaamgkmfmwdzjn`, nenhuma operação no CRM.
2. Conferir backup e cópia sob controle do responsável; verificar estratégia de rollback.
3. Revisar compatibilidade de funções `SECURITY DEFINER`, papel `postgres`, gatilhos e acesso de leitores.
4. Executar **uma vez** via mecanismo de migração do Supabase; não colar em editor SQL descontextualizado.
5. Rodar `lab-app/scripts/sql/security-post-migration-check.sql`: **zero linhas** = nenhuma concessão proibida remanescente.
6. Reconsultar `get_advisors(security)` e testar leitura sem login, autenticação, marcação de capítulo, cadastro GC, convite, ranking, vídeos/XP e senha (em contas de teste).
7. Documentar timestamp, nova versão da migration, commit SHA, resultado/alertas e aprovação na [auditoria ao vivo](SECURITY-LIVE-AUDIT-2026-10-12.md).

## 4. Restauração e rollback operacional

A **primeira alternativa** para erro de permissão é corrigir o GRANT mínimo indispensável **somente** após identificar o endpoint afetado. Não restaurar `TRUNCATE`/ `TRIGGER` para usuários públicos simplesmente por incompatibilidade; isso reabriria o risco. Voltar ao backup/restore integral é medida para incidente de dados, jamais procedimento rotineiro de rollback de GRANT. Informar o time, congelar deploy e manter evidência das consultas.

## 5. Falta concluir
- [x] Levantamento ACL real, aviso sobre backups no plano Free.
- [x] Script local de backup com confirmação de projeto, SHA-256 e inventário de conteúdo.
- [x] Migração SQL e verificação pós-condições no repositório, CI de teste estático.
- [ ] **Backup real gerado e identificado pelo responsável**.
- [ ] **Teste de restauração comprovado no staging/banco isolado**.
- [ ] **Executar migração no Supabase LABGAME**.
- [ ] Consultar advisors e testar GCs/XP/auth com identidades de teste reais.
- [ ] Planejar backups automáticos off-site e monitoramento.

**Não marcar o P0 como resolvido antes das etapas pendentes.**
