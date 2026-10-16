# LABGAME P0 — estado de fechamento e gates de produção

**Data:** 16/10/2026  
**Projeto:** Supabase LABGAME, ref azejfxvaamgkmfmwdzjn.

## Evidências somente de leitura

- Projeto ACTIVE_HEALTHY, PostgreSQL 17.11.0.003.
- Consulta direta a supabase_migrations.schema_migrations retornou 13 migrations, até 20261014195640 / lab_privileges_hardening_p0. A listagem de migrations do conector omitiu a última; a consulta SQL é a evidência principal.
- Contagens: lab_game_plan_chapters = 1.189; lab_bible_chapters = 1.189; lab_bible_verses = 31.101.
- Edge Functions publicadas: nenhuma.
- As 13 RPCs SECURITY DEFINER expostas a authenticated têm search_path vazio/fixo, não são executáveis por anon e referenciam auth.uid(). O advisor ainda sinaliza que authenticated pode executá-las; revisar cada autorização, sem revogação em lote.
- Duas funções SECURITY DEFINER internas, register_reading_group_owner e rls_auto_enable, não são executáveis por anon/authenticated; rls_auto_enable usa search_path=pg_catalog.
- Advisor registra leaked-password protection desabilitada e RLS sem policy em lab_game_plan_chapters. Ambos pedem revisão de segurança.
- Migrations do repositório posteriores a 20261014195640 não aparecem no registro direto consultado.
- O runbook informa que falta backup/restore drill atual. Nenhum backup ou restore foi executado nesta sessão.

## Status dos gates

| Gate | Situação |
|---|---|
| Arquitetura de oito agentes | APROVADA — CI [#473](https://github.com/MILAGRESMARINGA/LAB2026/actions/runs/38963615936) verde (6/6 jobs), commit `cfca831` |
| Testes anteriores documentados (#428/#433) | Histórico aprovado; não substitui CI atual |
| Integridade canônica em produção | Contagens confirmadas somente por leitura |
| Backup atual e restore isolado | BLOQUEADO — sem evidência nesta sessão |
| Ensaio de migrations sobre cópia restaurada | BLOQUEADO — depende do backup |
| Revisão final das RPCs e proteção de senha vazada | PENDENTE |
| Migrations P0 restantes | NÃO APLICADAS |
| Edge Functions | NENHUMA |
| Homologação P0 pública | BLOQUEADA pelos gates anteriores |

## Próximos passos sem custo

1. Rodar os scripts em docs/P0-BACKUP-RESTORE-GATE.md no computador do responsável; manter dump e banco restaurado fora do GitHub.
2. Ensaiar as migrations pendentes na cópia e comparar estrutura/contagens.
3. Revisar RPCs, RLS e leaked-password protection; manter EXECUTE das RPCs necessárias somente após teste de autorização.
4. Aplicar migrations em produção apenas com backup/restauração aprovados e recursos V2 desligados.
5. Publicar account-delete depois de validar dependências e consentimento. Publicar notify-reading-email só com remetente gratuito verificado e segredo cron forte.
6. Executar smoke tests autorizados, consultar advisors/contagens e registrar SHA, resultado e rollback.

## Ações de produção nesta sessão

Nenhuma. Consultas de projeto, migrations, advisors, funções e contagens foram somente leitura. A CI não tem credenciais de produção e não publica funções.
