# LABGAME — Modelo de ameaças e cibersegurança (STRIDE)

**Versão:** 1.0 · **Data:** 2026-10-12 · **Owner:** security-engineer. Auditoria preliminar estática, **não é teste de intrusão ou certificado de conformidade**.

## Ativos e fronteiras

Ativos protegidos: credenciais e sessões; e-mails e nomes; associação/consentimento/ranking de GC; pontuação e recorde; textos/estudos e direitos autorais; configurações do Supabase/Vercel/GitHub/Resend e futuras chaves de IA.

Fronteiras: **browser→Supabase Auth/RPC** (browser não confiável); **RPC SECURITY DEFINER→tabelas** (elevado privilégio); **frontend→iframe de terceiros**; **backend IA→modelos/RAG** (futuro); **GitHub Actions→deploy/banco** (supply chain).

| Ameaça | Exemplo LABGAME | Controle existente | Controle faltante e gate | Risco |
|---|---|---|---|---|
| Spoofing | Conta falsa, credential stuffing, link expirado | Supabase Auth, OTP, redirect fixo | SMTP com domínio autenticado, anti-bot e teste de duas contas | ALTO |
| Tampering | Usuário envia XP ou adianta capítulo | RPC server-side, idempotência, relógio do banco | Testes SQL concorrentes e verificação de integridade | ALTO |
| Repudiation | Apagar rastros de alteração de recordes | Registros de capítulos e vídeo | Auditoria de ações privilegiadas sem PII e restore testado | ALTO |
| Information disclosure | Listar GC alheio, ranking sem consentimento | RLS, rankings opt-in, autorizações RPC | Pentest de RLS/GRANTS, exportação e exclusão LGPD | ALTO |
| Denial of service | Flood SMTP, cadastro ou IA | Rate limit Supabase básico | Limites explícitos de IP/usuário, orçamento e alarmes | ALTO |
| Elevation of privilege | Função SECURITY DEFINER permissiva | `auth.uid()`, `SET search_path`, grants | Teste de invocação direta sob roles diferentes | CRÍTICO |
| Supply chain | Pacote/npm workflow comprometido | CI unit+build | Scanner, lockfile, auditoria de dependências, 2FA | ALTO |
| Prompt injection | Fonte teológica tenta dar instrução ao LLM | Motor IA ainda não lançado | Isolar RAG como dados, validar fontes, schema e revisão | ALTO |
| XSS / clickjacking | Texto do estudo ou iframe malicioso | React por padrão escapa texto | Headers, CSP Report-Only→Enforce, teste de links | ALTO |
| Violação de privacidade | Expor religião/dados de menores | Ranking com consentimento | Política/registro LGPD, necessidade, retenção, exclusão | ALTO |
| Contaminação legado | Migração de CRM aplicada ao projeto LAB | diretório `lab-app/` segregado | Quarentena do `project/` e `supabase/.temp/`, revisão histórica | ALTO |

## Política de segurança

1. **Credenciais**: `service_role`, SMTP, RESEND_API_KEY, OPENAI_API_KEY, chaves privadas e tokens GitHub/Vercel são SOMENTE servidor; jamais `VITE_*`, frontend, commit, mensagem ou captura. Chave Supabase publicável é diferente de service_role.
2. **Acesso**: mínimo privilégio no CI (somente `contents:read`); main protegida, PR revisado, 2FA, contas distintas por ambiente e credenciais rotativas (depende de configuração administrativa externa).
3. **RLS / SQL**: toda tabela pessoal RLS; RPC de privilégio elevado obrigatoriamente valida `auth.uid()`, grupo, consentimento, objetos qualificados, `search_path` fixado e `GRANT/REVOKE` mínimos. Não confiar em `user_id` do cliente.
4. **Autenticação**: SMTP + SPF/DKIM/DMARC e testes reais; rota de callback explícita; tokens de uso único nunca em logs de aplicação; solicitar novo token expirado.
5. **HTTP**: HTTPS, CSP inicialmente Report-Only sem quebrar Mux/YouTube, X-Content-Type-Options, Referrer-Policy, X-Frame-Options e Permissions-Policy. Mover CSP para modo estrito após telemetria/QA.
6. **Dependências**: pin por `package-lock.json` ainda PENDENTE; `npm audit --omit=dev --audit-level=high` e SBOM em gate de produção; nunca esconder vulnerabilidades com `|| true`.
7. **Privacidade**: consentimento individual, opt-out sem punição no GC, não publicar e-mails; avaliar LGPD e dados religiosos sensíveis/menores antes de operar amplamente.
8. **IA**: não enviar PII para modelos; não aceitar instruções contidas em PDFs/HTML/RAG; ter revisão editorial, atribuição de fonte, monitoramento de custo, cotas, bloqueio de abuso.
9. **Operação**: logs mínimos por correlação, retenção e acesso; restore de backups ensaiado; resposta a incidentes com revogação/rotação e divulgação apropriada.

## Checklist para abertura pública
- [ ] Email de ativação e recuperação entregue e testado em Android/iOS reais.
- [ ] SQL RLS/GRANT/SECURITY DEFINER revisado com duas identidades e chamada direta de RPC.
- [ ] CI de engenharia, scanner e dependências sem alerta crítico/alto pendente.
- [ ] CSP verificada, cookies/tokens/logs adequadamente protegidos.
- [ ] Autorização de GC, pontuação e concorrência testadas.
- [ ] Procedimento LGPD e menores com base legal e responsável designado.
- [ ] Backup + restauração, plano de incidente e rollback demonstrados.
- [ ] Código legado e metadados `.temp` inventariados e isolados.

Fontes de evidência: `lab-app/supabase/migrations/`, `lab-app/src/features/`, `docs/ENGINEERING-BASELINE-AUDIT.md`. Controles marcados como existentes refletem presença em código; não comprovam eficácia contra todas as ameaças.
