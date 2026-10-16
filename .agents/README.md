# LABGAME 3.0 — arquitetura oficial de oito agentes

O manifesto oficial contém exatamente oito especialistas em manifest.json e agents/<id>/agent.md:

1. ai-engineer — orquestração técnica e política de custo.
2. backend-engineer — lógica do servidor, RPCs, Edge Functions e relógio.
3. database-engineer — PostgreSQL, migrations, integridade bíblica e backup.
4. security-engineer — RLS, privilégios, autenticação e auditoria de segurança.
5. frontend-ux-engineer — interface React/TypeScript e fluxos de conta.
6. qa-reliability-engineer — CI, PostgreSQL 16/17, Auth/RLS e E2E.
7. integration-engineer — e-mail, autenticação, webhooks e integrações.
8. platform-observability-engineer — GitHub Actions, Vercel, logs e Free Tier.

As especialidades anteriores de arquitetura principal, cânon, plano anual e gamificação foram incorporadas a esses oito papéis.

## Execução

Os arquivos agent.md são prompts e contratos; não executam modelos de IA por conta própria. LAB CI valida os contratos, executa os testes automatizados já existentes e monta um relatório de fechamento. Nenhum runtime de LLM ou serviço pago está configurado. Assim, o workflow não finge autonomia de IA e mantém o custo incremental em R$ 0.

## Referências

- manifest.json: papéis, dependências e limites.
- WORKFLOW.md: sequência, handoffs e gates de produção.
- P0-CLOSURE-STATUS-2026-10-16.md: estado público observado.
- ../docs/ENGINEERING-STANDARDS.md e ../docs/SECURITY-THREAT-MODEL.md.
- ../.github/workflows/lab-ci.yml: validação e relatório do orquestrador.
