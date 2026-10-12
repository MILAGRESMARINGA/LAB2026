# ADR 0003 — Autoridade do banco para XP, tempo e ranking

**Status:** ACEITO (implementação existente) · **Data:** 2026-10-12

**Contexto:** navegador é manipulável; concorrência e relógio local não podem decidir XP/recorde. Modalidade de disciplina exige uma etapa por dia, 365 etapas, 1–4 capítulos/dia.

**Decisão:** capítulos/recorde/XP persistidos por funções PostgreSQL autenticadas, idempotentes, com dia do servidor em `America/Sao_Paulo`; planejamento bíblico versionado. Vídeos rendem XP único separado e nunca concluem etapa. Ranking de GCs sujeito a acesso e consentimento.

**Consequência:** contabilidade reproduzível e menor fraude; precisa de testes RLS e concorrência e revisão de `SECURITY DEFINER`.

**Verificação:** `lab-app/supabase/migrations/`, `tests/game-plan.test.ts`, `tests/scorecards.test.ts`; QA real ainda pendente.
