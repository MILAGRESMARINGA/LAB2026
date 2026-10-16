## Identificação da mudança
- Requisito: `LAB-`
- Responsável / revisor:
- Escopo: `lab-app/` | `docs/` | `.agents/` | `CI`
- Objetivo / risco / alternativa:
- ADR (se decisão arquitetural):

## Checklist de engenharia
- [ ] Alterações restritas ao LABGAME; **sem mudanças em `project/` ou Supabase CRM legado**
- [ ] Regras de 66 livros / 1.189 capítulos e 365 etapas preservadas
- [ ] Nenhum ganho de XP ou avanço proveniente apenas do frontend/vídeo/IA
- [ ] RLS/GRANT/SECURITY DEFINER testados para mudanças no banco
- [ ] Sem segredos, credenciais SMTP, tokens ou PII em commit/logs/capturas
- [ ] Ameaças e LGPD reavaliadas quando auth/GC/dados/IA são alterados
- [ ] Contratos de API/JSON Schema versionados; direitos autorais revisados
- [ ] Testes negativos, concorrência e acessibilidade incluídos quando pertinentes
- [ ] Documentação/roadmap/ADR atualizados

## Evidência
- `npm run verify:engineering`:
- `npm test`:
- `npm run build`:
- CI URL e SHA:
- Teste E2E/SQL/SMTP real (se aplicável):
- Deploy PREVIEW ID, commit e status READY:

## Riscos e reversão
- Migrações / backup / idempotência:
- Observabilidade / logs sem PII:
- Passos de rollback:
- Pendências e requisitos NÃO TESTADOS:

**Declaração:** Não classificar recurso como disponível em produção apenas porque há código compilando.
