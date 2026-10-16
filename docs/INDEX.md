# LABGAME — Índice de documentação de engenharia

**Política:** documentação versionada junto ao código. Atualizar documentos afetados em todo PR; apontar testes executados e não declarar produção pronta sem QA real.

## Começar por aqui
- [Arquitetura de referência](./ARCHITECTURE.md): C4, limites entre React, Supabase LABGAME, vídeos, SMTP e motor IA futuro.
- [Dicionário de dados e ERD](./DATA-DICTIONARY.md): 15 tabelas, colunas, FKs, ownership e RLS levantadas no banco real.
- [Contratos de API e RPC](./API-CONTRACTS.md): funções SQL, parâmetros, papéis e invariantes de XP, autorização e GCs.
- [Normas obrigatórias de engenharia](./ENGINEERING-STANDARDS.md): DoR, DoD, PR, contrato, gates e responsabilidades.
- [Auditoria dos 12 pilares](./ENGINEERING-BASELINE-AUDIT.md): status implementado/parcial/ausente/contextual e riscos.
- [Modelo de ameaças e segurança](./SECURITY-THREAT-MODEL.md): STRIDE, LGPD, RLS, segredos, cadeia de dependências.
- [Auditoria de segurança ao vivo de 12/10](./SECURITY-LIVE-AUDIT-2026-10-12.md): findings confirmados, migração preparada e status NÃO APLICADO.
- [Arquitetura e governança da IA](./AI-ARCHITECTURE-AND-GOVERNANCE.md): RAG, origens, exegese, JSON, revisão teológica, fine-tuning.
- [Plano de testes e releases](./TEST-AND-RELEASE-PLAN.md): CI, smoke, E2E, SQL, dependências, rollback.
- [Operações e incidentes](./OPERATIONS-INCIDENTS.md): resposta, continuidade e backup.
- [Roadmap](./ROADMAP.md): entregas reais e pendências.
- [Regras da leitura competitiva](./LABGAME-2.0-RULES.md): 365 etapas, capítulo, XP, ranking e consentimento.
- [Bíblia e mídias](./BIBLE-DATA-AND-MEDIA.md): licença Almeida 1911 e BibleProject.
- [Autenticação e e-mails P0](./P0-AUTH-RECOVERY-RUNBOOK.md): DNS, Supabase e SMTP.
- [Backup e endurecimento do banco P0](./P0-DATABASE-BACKUP-AND-HARDENING.md): Supabase Free sem backup automático, script Windows, inventário, restauração e gate SQL.
- [Gate de backup, restore PG17 e ranking justo](./P0-CI-BACKUP-RESTORE-GATE.md): gatilho de release, restore efêmero, migrations condicionadas e fórmula/testes de score e cache.

## Registros de decisão (ADR)
- [ADR 0001 — Isolamento de LABGAME vs CRM](./adr/0001-boundaries.md)
- [ADR 0002 — RAG antes de fine-tuning](./adr/0002-rag-first.md)
- [ADR 0003 — Pontuação autoritativa no banco](./adr/0003-server-game.md)
- [ADR 0004 — Gates de qualidade e segurança](./adr/0004-quality-and-security-gates.md)

## Agentes, contratos e validação
- [Handoff e política de veto](../.agents/WORKFLOW.md), [manifesto dos oito agentes](../.agents/manifest.json) e [descrições](../.agents/README.md). A CI valida contratos e testes; não há runtime de LLM conectado.
- `cd lab-app && npm run verify:engineering && npm test && npm run build`.
- Workflow do GitHub: [LAB CI](../.github/workflows/lab-ci.yml).
- Ferramentas do produto: código em `lab-app/`. O diretório `project/` é um CRM legado, **fora de escopo** e não deve ser aplicado ao banco LABGAME.

## Segurança e credenciais
Nenhuma chave administrativa, SMTP, Resend ou OpenAI em `VITE_*`, nos commits ou nas capturas. Nunca publicar dumps de produção em issues/PRs. Consultar threat model para reporte reservado.

## Mudanças pendentes de aprovação operacional
SMTP real e templates, staging Supabase, lockfile/revisão de dependências, RLS multiusuário, revisões de menores/LGPD, CSP enforce após telemetria, motor RAG e publicação nativa.
