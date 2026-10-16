# LABGAME P0 — estado de fechamento e gates de produção

## Evidência CI mais recente antes desta atualização

- LAB CI [#506](https://github.com/MILAGRESMARINGA/LAB2026/actions/runs/38978180204), commit `578e7bf43b6d2412d7f776e34b48d35e1947594d`: SUCCESS, 6/6 jobs.
- Os jobs passaram em build/unit/engineering/Deno, PostgreSQL 16, PostgreSQL 17, Auth/RLS e V2 em Supabase local descartável, teste local de exclusão de conta, fluxo mobile, contrato dos oito agentes e montagem do relatório.
- Esse workflow usou ambientes efêmeros e não comprovou nem executou backup de produção, migration de produção ou deploy de Edge Function.


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

## Atualização da autorização de IA e do gate de backup

- O responsável autorizou uso de API de IA limitado; chamadas podem gerar cobrança. Nenhum limite R$ 0 é afirmado.
- O runtime opcional de orquestração em GitHub Actions é manual e restrito; esta alteração não consultou, criou ou alterou o segredo `OPENAI_API_KEY`. Não houve inferência ao vivo. Sem esse segredo, o fluxo escreve `SKIPPED` e não chama o provedor.
- O gerador de estudos consulta cache antes do provedor e a migration fixa misses a 10 globais e 3 por usuário por dia UTC. Continua fail-closed sem a chave.
- A existência do workflow automatizado de backup/restore não equivale a backup executado. O gate de release continua bloqueado até haver run verde que registre pg_dump, restore efêmero e comparação de integridade; migrations e funções de produção continuam pendentes.
- O conteúdo da Camada 1 tem seis estudos curados dos dias 1–3; Camadas 2/3 não têm seeds curadas. O runtime não recupera obras dos autores listados, portanto não atribui citações humanas.
