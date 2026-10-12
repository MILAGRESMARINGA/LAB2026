# LABGAME — Índice de documentação de engenharia

**Política:** documentação versionada junto ao código. Atualizar documentos afetados em todo PR; apontar testes executados e não declarar produção pronta sem QA real.

## Começar por aqui
- [Arquitetura de referência](./ARCHITECTURE.md): C4, limites entre React, Supabase LABGAME, vídeos, SMTP e motor IA futuro.
- [Normas obrigatórias de engenharia](./ENGINEERING-STANDARDS.md): DoR, DoD, PR, contrato, gates e responsabilidades.
- [Auditoria dos 12 pilares](./ENGINEERING-BASELINE-AUDIT.md): status implementado/parcial/ausente/contextual e riscos.
- [Modelo de ameaças e segurança](./SECURITY-THREAT-MODEL.md): STRIDE, LGPD, RLS, segredos, cadeia de dependências.
- [Arquitetura e governança da IA](./AI-ARCHITECTURE-AND-GOVERNANCE.md): RAG, origens, exegese, JSON, revisão teológica, fine-tuning.
- [Plano de testes e releases](./TEST-AND-RELEASE-PLAN.md): CI, smoke, E2E, SQL, dependências, rollback.
- [Operações e incidentes](./OPERATIONS-INCIDENTS.md): resposta, continuidade e backup.
- [Roadmap](./ROADMAP.md): entregas reais e pendências.
- [Regras da leitura competitiva](./LABGAME-2.0-RULES.md): 365 etapas, capítulo, XP, ranking e consentimento.
- [Bíblia e mídias](./BIBLE-DATA-AND-MEDIA.md): licença Almeida 1911 e BibleProject.
- [Autenticação e e-mails P0](./P0-AUTH-RECOVERY-RUNBOOK.md): DNS, Supabase e SMTP.

## Registros de decisão (ADR)
- [ADR 0001 — Isolamento de LABGAME vs CRM](./adr/0001-boundaries.md)
- [ADR 0002 — RAG antes de fine-tuning](./adr/0002-rag-first.md)
- [ADR 0003 — Pontuação autoritativa no banco](./adr/0003-server-game.md)
- [ADR 0004 — Gates de qualidade e segurança](./adr/0004-quality-and-security-gates.md)

## Agentes, contratos e validação
- [Handoff e política de veto](../.agents/WORKFLOW.md), [12 especialistas](../.agents/README.md). Os agentes não executam automaticamente.
- `cd lab-app && npm run verify:engineering && npm test && npm run build`.
- Workflow do GitHub: [LAB CI](../.github/workflows/lab-ci.yml).
- Ferramentas do produto: código em `lab-app/`. O diretório `project/` é um CRM legado, **fora de escopo** e não deve ser aplicado ao banco LABGAME.

## Segurança e credenciais
Nenhuma chave administrativa, SMTP, Resend ou OpenAI em `VITE_*`, nos commits ou nas capturas. Nunca publicar dumps de produção em issues/PRs. Consultar threat model para reporte reservado.

## Mudanças pendentes de aprovação operacional
SMTP real e templates, staging Supabase, lockfile/revisão de dependências, RLS multiusuário, revisões de menores/LGPD, CSP enforce após telemetria, motor RAG e publicação nativa.
