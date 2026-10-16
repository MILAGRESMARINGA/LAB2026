# P0 — Autenticação e entregabilidade do LABGAME

**Projeto Supabase exclusivo:** `LABGAME` — ref `azejfxvaamgkmfmwdzjn`.
**Repositório/branch:** `MILAGRESMARINGA/LAB2026` / `lab-rebuild-2026`.
**Domínio de produção (inalterado):** `https://labgame-biblia.vercel.app`.
**Domínio estável de homologação LABGAME 3.0:** `https://labgame-biblia-git-lab-rebuild-2026-antonios-projects-0bf892e8.vercel.app`.

## Diagnóstico com evidências

- A aplicação antiga usava `window.location.origin` como destinatário dos links de cadastro e recuperação. Isso gerava URLs de preview/localhost conforme o navegador.
- Logs de autenticação registraram solicitações ao `/token` com credenciais inválidas, uma tentativa com e-mail não confirmado, confirmações `/verify` e ocorrências de token não encontrado. Esses registros **não provam** que o provedor SMTP esteja funcionando de ponta a ponta.
- O Supabase informa que quando `redirectTo` não consta das URLs permitidas o usuário pode voltar à *Site URL* padrão (frequentemente localhost).

## Código implementado

1. `src/lib/auth-urls.ts`: host HTTPS canônico (`VITE_PUBLIC_APP_URL` com fallback oficial), rotas e tratamento seguro de links expirados.
2. `src/features/auth.ts`: confirmação para `/auth/callback`; redefinição para `/auth/reset-password`; reenvio de ativação; `verifyEmailCode` para código de seis dígitos.
3. `src/components/AuthFlow.tsx`: confirmação com sessão validada pelo Supabase, redefinição protegida e mensagens de link inválido; suporte a fragmentos `#access_token`, códigos PKCE tratados pelo SDK e `#token_hash` nos e-mails customizados. Os tokens são removidos da URL após a validação.
4. `src/components/AccountAccess.tsx`: campo OTP para cadastro e recuperação, com possibilidade de permanecer na PWA, mais reenvio quando a conta está pendente.
5. `vercel.json`: rewrite SPA já configurado para entregar o React nas duas rotas. `VITE_PUBLIC_APP_URL` cadastrado na Vercel para preview e produção.
6. `supabase/email-templates/`: HTML pronto para **Confirm signup** e **Reset Password** com link de token hash no fragmento (evita token nos logs HTTP) e código `{{ .Token }}`.

## Atualização 15/10/2026 — retorno correto à mesma versão do LABGAME

**Falha identificada:** as versões anteriores de `lab-app/supabase/email-templates/confirm-signup.html` e `reset-password.html` continham literalmente `https://labgame-biblia.vercel.app/auth/...`. Além disso, `VITE_PUBLIC_APP_URL` estava compartilhado entre produção e preview, fazendo o app de testes voltar ao domínio antigo.

**Correção já implementada:**
1. O arquivo `src/lib/auth-urls.ts` mapeia explicitamente o domínio de preview da branch e URLs efêmeras de deploy do projeto para o **alias estável da branch**. Não confia em `redirectTo` recebido por parâmetros de URL, nem permite que sites arbitrários se façam passar pela branch.
2. Vercel: variável `VITE_PUBLIC_APP_URL` de `preview` restrita à branch `lab-rebuild-2026`, com o alias estável. O valor existente de produção não foi alterado.
3. Os dois templates agora usam `href="{{ .RedirectTo }}#token_hash={{ .TokenHash }}&amp;type=email"` e a equivalente para `type=recovery`. A variável `{{ .RedirectTo }}` é fornecida pelo Supabase a partir da URL enviada por `signUp`, `resend` ou `resetPasswordForEmail`, **somente se permitida na allowlist**. Os códigos `{{ .Token }}` permanecem disponíveis para confirmação diretamente no app.
4. `AuthFlow.tsx` já utiliza `PUBLIC_APP_ORIGIN` para links de sucesso, erro e retorno. O código OTP para recuperação usa rota relativa `/auth/reset-password` para manter a sessão na origem da PWA.

**Ação no painel ainda obrigatória (não executada pelo conector de banco):**

[Supabase LABGAME → Authentication → URL Configuration](https://supabase.com/dashboard/project/azejfxvaamgkmfmwdzjn/auth/url-configuration)

Manter `Site URL = https://labgame-biblia.vercel.app` para o ambiente de produção; adicionar estas duas URLs **exatas**, SEM curingas `*.vercel.app`:

- `https://labgame-biblia-git-lab-rebuild-2026-antonios-projects-0bf892e8.vercel.app/auth/callback`
- `https://labgame-biblia-git-lab-rebuild-2026-antonios-projects-0bf892e8.vercel.app/auth/reset-password`

Manter também as duas rotas análogas do domínio de produção para não interromper usuários da versão pública.

[Supabase LABGAME → Authentication → Email Templates](https://supabase.com/dashboard/project/azejfxvaamgkmfmwdzjn/auth/templates)

Copiar e **salvar** o HTML atual de `lab-app/supabase/email-templates/confirm-signup.html` em **Confirm signup**, e de `reset-password.html` em **Reset Password**. Conferir a variável literal `{{ .RedirectTo }}`, `{{ .TokenHash }}` e `{{ .Token }}`. Alteração do arquivo versionado no GitHub **não publica template no Supabase**.

**Testar em e-mail real:** abrir a branch estável e solicitar recuperação com uma conta de teste. O link de e-mail deve abrir **a mesma branch**, finalizar a recuperação e oferecer retorno nela. Validar também o formulário de confirmação com uma conta nova. Endereço de preview protegido pela Vercel pode exigir sessão/autorização nesse ambiente; nesse caso não desabilitar proteção cegamente.

**Atenção:** a entrega de e-mail/SMTP ainda não foi homologada. É possível o Supabase registrar HTTP 200 sem comprovar que o provedor enviou a mensagem. Não classificar P0 de Auth como resolvido até receber e utilizar o e-mail real.

**Referências Supabase:** [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates), [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

---

## Ação administrativa obrigatória no Supabase

A conexão atual com o Supabase dá acesso a SQL, migrações e logs, **não à edição de Site URL, SMTP, provedores Auth nem modelos de e-mail**. Essas mudanças são operacionais e precisam ser feitas no painel por quem administra o projeto. Não colocar senha de SMTP, API key ou token de administrador em GitHub/ChatGPT.

1. Acessar [Authentication → URL Configuration](https://supabase.com/dashboard/project/azejfxvaamgkmfmwdzjn/auth/url-configuration).
2. **Manter** Site URL de produção como `https://labgame-biblia.vercel.app`; para testes, não substituir a Site URL pelo preview. Adicionar à allowlist as duas rotas exatas do preview listadas na atualização de 15/10.
3. Incluir exatamente estas **Redirect URLs**:
   - `https://labgame-biblia.vercel.app`
   - `https://labgame-biblia.vercel.app/auth/callback`
   - `https://labgame-biblia.vercel.app/auth/reset-password`
4. Em **Authentication → Providers → Email**, verificar que cadastro por e-mail está habilitado e definir explicitamente a política de confirmação obrigatória.
5. Em **Authentication → Email Templates → Confirm signup**, substituir o HTML pelo arquivo `lab-app/supabase/email-templates/confirm-signup.html` deste repositório. Em **Reset Password**, usar `lab-app/supabase/email-templates/reset-password.html`. **Manter literalmente** `{{ .TokenHash }}` e `{{ .Token }}` nos modelos.
6. Configurar um **SMTP próprio verificado** (por exemplo Resend/Postmark/SES), remetente em domínio sob controle do projeto e DNS SPF, DKIM e DMARC. Validar cotas e política de rate limiting.
7. Realizar teste com e-mail controlado: confirmar presença do link/código, entrega na caixa de entrada e spam, abertura de `/auth/callback`, login em Perfil e GC, solicitação de troca de senha, troca bem-sucedida e login com nova senha.
8. Se falhar: consultar `auth_logs` (evento/path/status/erro sem expor tokens) e eventos do provedor SMTP (aceito, bounce, suppression), além de analisar cabeçalhos de SPF/DKIM na mensagem recebida.

**Observação:** o HTML colocado no GitHub **não altera automaticamente** o conteúdo efetivo dos e-mails enviados pelo Supabase. Até ativar os modelos, o fluxo de links legado continuará sujeito à configuração anterior. O campo de código depende de um template que inclua o código.

## Cenários mínimos de homologação

| Caso | Resultado esperado |
|---|---|
| Cadastro novo | E-mail de confirmação entregue com link e OTP; login ainda bloqueado até validar |
| Link de confirmação | Abre `/auth/callback`, estabelece sessão e encaminha para Perfil |
| Código de confirmação | Pode ser digitado na PWA para ativar conta sem trocar de navegador |
| Recuperação por link | Abre `/auth/reset-password` e permite definir nova senha |
| Recuperação por código | Valida `verifyOtp({type:'recovery'})` e abre a tela de nova senha |
| Link expirado ou reutilizado | Mostra erro legível e disponibiliza nova solicitação |
| Reenvio de confirmação | Disponível após tentativa de login em conta não confirmada |
| Perfil e GC | Mantém sessão e permite acesso autorizado após autenticação |
| Redirecionamento | Nunca mostra `localhost:3000` nem URL provisória |
| Segurança | Nenhum token mostrado na interface/logs; senha atualizada apenas com sessão válida |

## Limites da primeira entrega

- O fluxo **PWA/web** fica resolvido no domínio HTTPS e via código OTP. Para um futuro aplicativo **nativo**, Android App Links e iOS Universal Links exigirão configuração de associação com o domínio e assinatura do aplicativo.
- O código compilado e os testes automatizados **não comprovam** entregabilidade SMTP nem sucesso de login humano até os testes acima.
- Se o link for aberto por um navegador distinto do da PWA, o login criado por esse link poderá ficar no armazenamento do navegador. A alternativa é digitar o OTP dentro da própria PWA.
- Os códigos expirados não são reativados: solicitar outro e-mail.

Fontes:
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail

## Compilação e publicação (conferência final)

- GitHub Actions `LAB CI #147`: https://github.com/MILAGRESMARINGA/LAB2026/actions/runs/38139538766
- Testes automatizados: **84 aprovados em 17 arquivos**; `npm run build` aprovado (TypeScript + Vite).
- A Vercel bloqueou os builds recentes por **`build-rate-limit`**. O alias `labgame-biblia.vercel.app` foi atualizado para `dpl_C686YQ1s1aFGPnHNNRgXU1biXoa1` (READY, commit intermediário `97f0623054c697dcc1e6ba5a9cb7898c5734d7d0`) e ambas as rotas de autenticação responderam HTTP 200. Os últimos ajustes de mensagens e CSS ainda estão só na branch devido ao limite de builds. **As novas rotas e formulários de código já estão publicados na versão intermediária**, mas a entrega SMTP/ativação dos templates ainda não foi homologada.
- Os modelos HTML do repositório foram criados, **mas não estão ativos** até serem colados e salvos em Authentication → Email Templates do Supabase.
