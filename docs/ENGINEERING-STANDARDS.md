# LABGAME — Padrão obrigatório de engenharia de software

**Versão:** 1.0 · **Owner de processo:** principal-architect · **Segurança com veto:** security-engineer.

## Fluxo de engenharia: do requisito ao release

1. **Especificar**: problema, contexto, regra bíblica, casos positivos/negativos, invariante de pontuação, privacidade e risco; ID rastreável `LAB-xxx`.
2. **Projetar**: contrato TypeScript/SQL/JSON Schema, fluxo de dados, fronteiras de confiança e custo. Toda decisão não trivial gera ADR com opções e riscos. Preferir mudança mínima compatível.
3. **Revisar**: principal-architect arbitra impacto; backend/database/security/QA/AI/UX são convocados conforme componentes alterados. Agentes são **checklists de papéis**, não tarefas automáticas.
4. **Implementar**: branch `lab-rebuild-2026` até liberação formal; `main` preservada. Mudanças pequenas, comentários sobre *por quê*, sem credenciais. Nunca alterar `project/` nem Supabase CRM.
5. **Validar**: `npm run verify:engineering`, `npm test`, `npm run build` em `lab-app/`; testes SQL de autorização, E2E e entregabilidade conforme mudança; capturar evidências de commits e CI.
6. **Revisão de segurança**: autenticação, RLS, logs, dependências, dados, upload, HTML, SSRF, CSRF, injeção de prompt, custo IA. Bloquear release quando há vulnerabilidade crítica não mitigada.
7. **Publicar**: verificar CI verde, URL de preview READY, versões de migração, ambientes, smoke-test, plano de rollback; só então atualizar domínio público mediante aprovação.
8. **Operar**: métricas sem PII, incidentes, atualizações de dependência e backlog de dívidas; retroalimentar testes e ADR.

## Definition of Ready (DoR)
- Regra de produto + condição de aceite observável definida; limites da gamificação e licenças bíblicas conhecidos.
- Serviços/projetos alvo identificados por ID explícito; backup para migrações destrutivas; responsável e aprovação.

## Definition of Done (DoD)
- Requisitos e contratos atendidos; testes unitários/regras e integração relevantes aprovados.
- `SECURITY.md` + threat model revistos quando há mudança de confiança; RLS e `SECURITY DEFINER` verificados; segredos fora do repositório.
- Documentação, ADR se houver decisão, e changelog do roadmap atualizados com links.
- Deploy verificado por ID, status READY e link; teste funcional real documentado. Caso contrário estado **PARCIAL/BLOQUEADO**.

## Invariantes inegociáveis do LABGAME
- Bíblia protestante: 66 livros, 1.189 capítulos completos e sem duplicação; plano v1 imutável/versionado, até quatro capítulos por etapa.
- Não antecipar leituras. XP de capítulo somente em transação autorizada do servidor. Vídeo/estudo/IA **não completam leitura**.
- Recorde de sequência não se perde; acesso a GC/leaderboard mediante autorização e consentimento; opt-out respeitado.
- Texto bíblico/teológico com licença, proveniência, método exegético e revisão editorial; não transformar resultado probabilístico em dogma.
- Nunca confundir automações de desenvolvimento, contas externas e agentes com permissões operacionais do LABGAME.

## Política de alterações
- Breaking change: versionar planos/SQL/API; migrar com rollback; manter compatibilidade com app antigo por janela definida.
- Migração SQL: verificar RLS `ENABLE`, `GRANT/REVOKE`, `SECURITY DEFINER SET search_path=''`, idempotência e concorrência; executar somente no projeto LAB.
- IA: prompt versionado, dataset com licença, JSON Schema, evidências recuperadas, revisão; registrar modelo e versão, jamais credenciais ou dados pessoais no prompt.
- UX: evitar coerção espiritual; chama mede regularidade, nunca espiritualidade; acessibilidade WCAG 2.2 AA e controle de animação.
- Código legado `project/`: protegido/quarentenado; não modificar sem iniciativa independente de limpeza e inventário aprovado.

## Artefatos e responsabilidades
- `docs/ARCHITECTURE.md`: visão arquitetural atual.
- `docs/adr/`: decisões permanentes.
- `docs/SECURITY-THREAT-MODEL.md`: riscos, controles e evidências.
- `docs/AI-ARCHITECTURE-AND-GOVERNANCE.md`: política de conteúdos IA.
- `docs/TEST-AND-RELEASE-PLAN.md`: testes, pipeline, rollback, releases.
- `docs/ENGINEERING-BASELINE-AUDIT.md`: matriz dos 12 pilares.
- `.agents/WORKFLOW.md`: contrato de handoff entre papéis.
- `docs/ROADMAP.md`: execução e pendências sem inflar status.

## Qualidade de dependências
- `lab-app/package-lock.json` ainda não versionado: gerar de forma reproduzível e substituir `npm install` do CI por `npm ci`, após revisão de dependências e licenças.
- É proibido diminuir a severidade de alertas para conseguir deploy. Correções/aceite de exceção precisam de prazo, dono e compensações.
