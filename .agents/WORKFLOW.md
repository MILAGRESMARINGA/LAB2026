# LABGAME — Protocolo de agentes, handoffs e autorização

**Owner:** principal-architect. **Status:** agentes são **contratos documentados**, não estão executando autonomamente nem têm autorização implícita para modificar a produção.

## Despacho por papel

| Papel | Quando acionar | Entrega obrigatória |
|---|---|---|
| principal-architect | Mudança de escopo, arquitetura, integração, release | ADR/RFC, fronteiras, aceite e status |
| biblical-canon-engineer | Alterar Bíblia/cânon/tradução | integridade 66/1.189, edição/licença/versificação |
| reading-plan-engineer | Plano anual, calendários, fuso | 365/366, máximo 4/dia, compatibilidade v1 |
| gamification-engineer | XP, recordes, chama, rankings | fórmulas SQL, idempotência, casos de fraude |
| backend-engineer | API, RPC, edge function, autorização | contrato typed, validações, rate limits, testes |
| database-engineer | Migration, RLS, schema, rollback | diff SQL, GRANT/REVOKE, backup/staging, testes multi-user |
| frontend-ux-engineer | Tela mobile, onboarding, leitor, vídeos | acessibilidade, fluxos de erro e validação real |
| ai-engineer | Exegese RAG, JSON Schema, flashcards | prompt/corpus/modelo versionados, fontes, benchmark, safety |
| integration-engineer | Supabase Auth, SMTP, Vercel, BibleProject | teste end-to-end real, DNS/redirects, segredos server-side |
| security-engineer | Mudança de auth, RLS, dados, links, IA, deploy | threat model, risco/severidade, testes e veto de release |
| qa-reliability-engineer | Qualquer alteração de comportamento | casos positivos/negativos, testes e evidências |
| platform-observability-engineer | CI/CD, logs, backups, incidentes, releases | gate, smoke/rollback, métricas, rastreabilidade |

## Handoff padronizado

```
REQUISITO: LAB-<n>
OBJETIVO / IMPACTO:
SISTEMA E FRONTEIRA: Supabase LABGAME / lab-app / Vercel (não CRM)
ARQUIVOS E MIGRAÇÕES ALTERADOS:
DECISÃO / ADR:
RISCOS: segredos, LGPD, RLS, XP, IA, direitos autorais, acessibilidade
TESTES EXECUTADOS: comandos, CI run, SQL testes, screenshots sem PII
RESULTADO: verde, amarelo (bloqueado), vermelho (falha)
ROLLBACK:
PENDÊNCIAS E APROVAÇÃO HUMANA:
```

## Política de veto e separação de poderes
1. Security pode bloquear alteração de auth, RLS, dados, deploy e chaves mesmo com build verde; decisão escrita em relatório.
2. QA pode bloquear entrega sem evidência de comportamento real exigido.
3. database-engineer não executa migration destrutiva nem troca de projeto Supabase sem aprovação e backup.
4. ai-engineer não publica conteúdo exegético sem fonte e revisão e não possui RPC de pontuação.
5. Nenhum papel pode alegar revisão autônoma ou testes que não realizou. O arquiteto integra evidências, não substitui auditoria especializada independente.
6. `main` não deve ser alterada automaticamente. Branch de reconstrução preserva o legado até plano de retirada aprovado.

## Graus de autonomia
- **Nível 0 agora:** especificações/checklists e assistência supervisionada.
- **Nível 1 futuro:** agentes sugerem patches em branch sem credenciais, com logs e revisão humana.
- **Nível 2 futuro:** agentes podem executar testes em ambientes isolados, jamais enviar e-mail de produção ou alterar dados sem autorização explícita.
- **Autonomia em produção:** proibida até governança, credenciais escopadas, logs, rollback, aprovação e mitigação de prompt injection.

## Ordem mínima por mudança
Requisito → principal-architect → especialistas afetados → segurança/QA → GitHub CI → deploy preview → validação humana → release e atualização documental.
