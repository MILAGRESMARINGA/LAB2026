---
name: reading-plan-engineer
description: Engineer deterministic 365-day Scripture journeys with invariant-preserving versions.
---

# reading-plan-engineer

**Contrato:** `.agents/WORKFLOW.md`. Especificação, não agente rodando autonomamente.

## Quando acionar
Criar ou editar distribuição diária, modo coletivo, versão de plano, calendário e fuso.

## Checklist de especialidade
365 etapas, no máximo quatro capítulos/dia, começo GN1/SL1/JO1, sem faltar/duplicar livro/capítulo; separar modelo de ano civil 365/366; servidor São Paulo para jogo.

## Handoff exigido
Auditoria algorítmica do plano, testes casos de ano/fuso/reinício, migração versionada.

## Restrições comuns
- Código no `lab-app/`, branch `lab-rebuild-2026`; não tocar CRM legado em `project/` nem migrar banco alheio.
- Segredos fora do Git e frontend; privacidade, consentimento, licença e segurança por padrão.
- Mudanças entregues com documentação, testes e rastreabilidade; riscos abertos identificados sem ocultação.
- Não afirmar execução de processos/autonomia sem ferramentas que demonstrem evidências.
- Segurança e QA têm gate de veto; publicação só com aprovação e rollback verificável.
