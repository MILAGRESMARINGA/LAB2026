# LABGAME — Plano de qualidade, CI/CD e publicação

**Versão:** 1.0 · **Owners:** qa-reliability-engineer, platform-observability-engineer, security-engineer.

## Pirâmide de testes e aceites

| Camada | Evidência atual | Gate obrigatório | Proibido afirmar |
|---|---|---|---|
| Unidade do domínio | `lab-app/tests/*`: cânon, plano, XP, datas, persistência simulada | `npm test`; 66 livros/1.189 capítulos/365 dias/1–4 capítulos | “Bíblia validada editorialmente” só por testes de contagem |
| Build/TS | `npm run build` no GitHub Actions/Vercel | TypeScript sem erro, Vite conclui build | “Produção pronta” só pelo build READY |
| Engenharia estática | `scripts/engineering-gate.mjs` | Estrutura/docs/agentes + vazamento de segredos + SQL RLS | “Pen test aprovado” |
| Integração SQL | Migrações e algumas simulações anteriores | Projeto **staging** separado; GRANT/RLS, RPCs, concorrência, GC cross-user | “RLS segura” sem teste com duas contas |
| E2E web/mobile | NÃO IMPLEMENTADO | cadastro, confirmação, OTP, recuperação, leitura, vídeo e ranking em Android/iOS | “SMTP funciona” com mock |
| Acessibilidade | SPA responsiva | WCAG 2.2 AA, navegação por teclado, leitor de tela, contraste, reduced-motion | “Acessível” sem auditoria |
| IA | APENAS PLANEJADA | schema estrito, benchmark exegético, citações, prompt injection, custo/quota | “Exegese confiável” apenas por output LLM |
| Segurança | RLS parcial, threat model | DAST/SAST/dependências, escopo de funções e cabeçalhos | “LGPD compliant” por documentação |

## Pipeline proposto
- Push/PR que alterar `lab-app/`, `docs/`, `.agents/` ou workflow: job `verify` com permissões GitHub de leitura, timeout e concorrência.
- Etapas: instalar dependências → testes do gate de engenharia → varredura estática → Vitest → TypeScript/Vite build.
- Dependency scanning: atualmente sem lockfile; gerar `package-lock.json` auditado, adotar `npm ci`, ativar `npm audit --omit=dev --audit-level=high` bloqueante e SBOM. Até então registrar risco, sem alegar que a auditoria já existe.
- Secrets scanning: gatilho de padrões fortes no código LABGAME; varredura de histórico Git e repositório legado por serviço especializado (pendente).
- Deploy para Vercel: CI positivo não implica publicação automática e publicação não implica QA funcional. Identificar deploy ID, commit, READY, URL, smoke test e rollback.

## Fluxo de release
1. Consolidar changelog/ADR/testes e revisão de segurança, propriedade do projeto Supabase confirmada.
2. Executar `npm run verify:engineering && npm test && npm run build`.
3. Verificar migrações sem destruição inadvertida e backup de banco. Não aplicar `project/supabase/migrations`.
4. Deploy preview → READY, verificar HTML 200 de `/auth/callback` e `/auth/reset-password` e login real; testar regras server-side.
5. Aprovar manualmente mudança de alias em Vercel; documentar deploy ID/commit/testador.
6. Smoke pós-release e monitorar erros. Se regressão: reatribuir alias para último READY e verificar compatibilidade de migrações; não fazer downgrade de SQL sem avaliação.

## Release blockers de segurança
- Auth SMTP não homologada para novos usuários;
- RLS ou privilégio de funções quebrados;
- XPath/chapters ou XP duplicando sob concorrência;
- Segredo real no frontend/git/log;
- Vulnerabilidade crítica/alta sem mitigação/aprovação com prazo;
- Falha de integridade do cânon ou plano;
- IA publicada automaticamente sem revisão ou documentação de fonte.

## Evidências por mudança
PR deve conter: requisito ID, risco, arquivos, migração e reversão, critérios de aceite, comando executado, resultado CI, ID do deploy, capturas sem PII, links de ADR e pendências. Se não executou, marcar **NÃO TESTADO**.

## Capstone final
Cenário real: criar conta → receber confirmação SMTP → login → completar Gênesis/Salmos/João do dia 1 → reconciliação XP → GC com segundo participante e consentimento → vídeo extra sem avanço → gerar exegese auditável + mapa/flashcards (quando motor de IA existir) → restaurar conta → liberar/retirar estudo. Critério: testes reproduzíveis + revisão editorial/security.
