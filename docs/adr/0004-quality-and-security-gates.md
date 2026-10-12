# ADR 0004 — Gates de qualidade e segurança como parte do CI

**Status:** ACEITO · **Data:** 2026-10-12

**Contexto:** testes de código e build não cobrem engenharia/documentação, segredos, exposição do SQL nem vulnerabilidades de dependências.

**Decisão:** ampliar workflow LAB CI com privilégio GitHub somente leitura, isolamento de diretórios, verificação de engenharia estática, testes unitários e compilação; cabeçalhos HTTP de proteção e CSP inicialmente Report-Only. Adoção posterior de `package-lock.json` + `npm ci` e auditoria de alta severidade bloqueante depois de baseline de dependências.

**Consequência:** alterações quebrando contratos comuns serão detectadas; scanners não substituem revisão/pentest. Não alegar CSP em modo de bloqueio nem dependency audit quando ainda pendentes.

**Verificação:** `lab-app/scripts/engineering-gate.mjs`, `.github/workflows/lab-ci.yml`, `lab-app/vercel.json`.
