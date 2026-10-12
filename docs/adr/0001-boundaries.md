# ADR 0001 — Isolamento do LABGAME e fronteiras de dados

**Status:** ACEITO · **Data:** 2026-10-12

**Contexto:** o repositório `MILAGRESMARINGA/LAB2026` contém simultaneamente `lab-app/`, `project/` (CRM legado) e arquivos `supabase/` do legado. Risco de aplicar SQL/credenciais no sistema errado.

**Decisão:** o produto LABGAME utiliza **somente** `lab-app/`, `docs/`, `.agents/` e o CI `.github/workflows/lab-ci.yml`. Aplicar migrações apenas de `lab-app/supabase/migrations/` ao projeto Supabase **azejfxvaamgkmfmwdzjn**; branch de reconstrução `lab-rebuild-2026` até revisão formal. Não alterar nem apagar `project/` sem inventário/backup/autorização.

**Consequência:** menos risco de contaminação. Dívida técnica legada fica no backlog com isolamento, auditoria de segredos e plano de limpeza controlada.

**Verificação:** CI e scripts de engenharia recusam mudanças que violam fronteiras; release checklist confirma referência do banco.
