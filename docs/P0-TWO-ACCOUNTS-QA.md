# LABGAME P0 — Homologação real com duas contas (Auth, RLS, GC e XP)

**Status: PREPARADO, NÃO EXECUTADO** · 14/10/2026.
Alvo: repositório `MILAGRESMARINGA/LAB2026`, branch `lab-rebuild-2026`, diretório `lab-app/`.
Produção: Supabase LABGAME `azejfxvaamgkmfmwdzjn` (somente leitura no teste automatizado).
**Não usar** credenciais, dados pessoais ou serviços do CRM.

## 1. Pré-requisitos operacionais

- Os 20 testes de restauração foram aprovados em PostgreSQL local isolado e o hardening ACL no LABGAME foi validado: 68→0 concessões e 4→0 EXECUTE de helpers.
- **O Supabase ainda tem apenas um usuário cadastrado; não há GC nem ciclos registrados.** Não classificar isolamento como homologado sem pelo menos **duas contas reais e independentes**.
- Usar preferencialmente **duas novas contas de teste** em projeto de **staging Supabase separado** para os cenários que concedem XP e alteram dados. Uma conta de produção verdadeira não deve ganhar XP por testes.
- Criar contas pelo formulário oficial do app, cada uma com endereço de e-mail de teste distinto e legítimo, confirmação por código/link, e senha forte exclusiva. Não compartilhar senha, sessão, token, link de convite nem dump em chat/GitHub. **Não usar contas de terceiros.**
- Testar no domínio canônico `https://labgame-biblia.vercel.app` (e não no preview protegido), após verificar qual commit está publicado.
- O Supabase Auth ainda apresenta aviso de **proteção contra senhas vazadas desativada**, e o SMTP, templates de email, URL Configuration e reset devem ser homologados em UI. Ver `docs/P0-AUTH-RECOVERY-RUNBOOK.md`.

## 2. Testes manuais — duas janelas independentes

Abra o aplicativo no Chrome normal com **Conta A** e em janela anônima ou outro perfil/navegador com **Conta B**. Não compartilhar cookies, senhas ou sessões.

| ID | Cenário | Esperado |
|---|---|---|
| A-01 | Novo cadastro A e B | Ambos recebem e-mail real e podem confirmar; IDs diferentes; sem login antes da confirmação exigida |
| A-02 | Login, logout, login novamente | Sessões independentes; B não recebe a sessão de A |
| A-03 | Recuperação de senha B via OTP/link | Email recebido, rota correta, senha trocada e login válido |
| A-04 | Abrir Jornada dos dois | Progressos separados, nenhuma leitura/XP registrada em outra conta |
| R-01 | A abrir B's dados privados por RPC/REST | Acesso negado/resultado vazio; não exibe dados de B |
| R-02 | B abrir A's convite de GC sem ser líder | Código invisível, mesmo após entrar no grupo |
| G-01 | A criar GC de teste, gerar convite | A vê GC e convite, trigger registra A como líder |
| G-02 | B entrar pelo convite | B vê o GC; A vê 2 participantes; B não pode administrar o GC |
| G-03 | A consultar resumo e liga | Somente GC permitido; nenhuma pontuação de B creditada em A |
| X-01 | A confirmar Gênesis 1 | A soma 10 XP; B continua com XP inalterado |
| X-02 | A confirmar Gênesis 1 novamente | Nenhuma segunda premiação (idempotência) |
| X-03 | A tentar capítulo fora da etapa | Operação negada; XP preservado |
| X-04 | B confirmar capítulo do dia | Apenas XP de B aumenta; grupo não recebe XP individual extra |
| V-01 | Vídeo elegível opcional | +5 XP uma vez após janela de 90 s; revisita sem segunda premiação |
| SEC-01 | Tabela de pontuação e grupos por REST | Sem INSERT/UPDATE/DELETE de XP por usuário; RLS impede espionagem |
| SEC-02 | Testes de funções SECURITY DEFINER | RPCs necessárias exigem auth.uid() e escopo por usuário/grupo |

**Atenção:** criar GC e confirmar capítulos são mutações reais. Executar preferencialmente em staging, não na conta pessoal de produção. Testes com três membros consentidos exigem terceira conta; 100% de GC e liga não devem ser considerados homologados com apenas duas.

## 3. Verificador automatizado — modo PADRÃO somente leitura

Arquivo: `lab-app/scripts/p0-two-accounts-smoke.mjs`.

O script recebe, **somente no computador do testador**, as variáveis:
`P0_SUPABASE_URL`, `P0_SUPABASE_PUBLISHABLE_KEY`,
`P0_ACCOUNT_A_EMAIL`, `P0_ACCOUNT_A_PASSWORD`,
`P0_ACCOUNT_B_EMAIL`, `P0_ACCOUNT_B_PASSWORD`.

Nunca registrar valores em GitHub nem enviar credenciais no chat. Use secret manager ou processo local que não escreva histórico.

Na pasta `lab-app`, com Node instalado e dependências presentes, execute:
```powershell
$env:P0_MODE = "readonly"
node .\scripts\p0-two-accounts-smoke.mjs
```

A ausência de variáveis retorna lista de nomes faltantes, sem exibir valores. Exige que ambas as contas sejam reais e confirmadas.

O modo `readonly` verifica Auth A/B, identidade distinta, RLS de `lab_game_runs`, `lab_game_stats` e `lab_game_video_rewards`, RPC anônima negada, isolamento de resumo GC desconhecido e reconciliação do XP. Não concede XP e não insere GC, mas **não é prova suficiente de isolamento positivo se as tabelas estiverem vazias**.

## 4. Verificador de fluxo com gravação — APENAS STAGING

É proibido direcionar mutações do script ao projeto `azejfxvaamgkmfmwdzjn` (produção); a proteção está no próprio código e tem testes CI.

Para executar no **Supabase staging separado**, com duas contas de teste NOVAS, definidas as variáveis de ambiente anteriores para a URL de staging:

```powershell
$env:P0_MODE = "staging"
$env:P0_WRITE_CONFIRMATION = "CONFIRMO_STAGING_ISOLADO"
node .\scripts\p0-two-accounts-smoke.mjs
```

Testa capítulo fora do plano, confirmação +10 XP, repetição sem bônus, XP da Conta B invariável, criação de GC, convite exclusivo de líder, participação de B e resumo de grupo. O GC criado é excluído ao final; registros de leitura de teste permanecem em staging para auditoria. **Não altera produção.**

Atenção: para validar senhas, e-mails e redirecionamento de maneira real, o Auth staging deve estar configurado adequadamente, com SMTP e Site URL próprios. Não copiar usuários reais indiscriminadamente.

## 5. Registro de evidências

- Somente anotar **aprovado / reprovado / pendente / não aplicável**, data, commit SHA, ambiente e URL de deploy sem tokens.
- Não incluir endereços, nomes, UUIDs pessoais, senhas, códigos OTP, tokens, dumps ou prints de e-mails com conteúdo sensível.
- Publicação só após confirmação de duas identidades diferentes, RLS com registros reais, GC/convites/XP, entrega SMTP, recuperação de senha, configuração de proteção contra senhas vazadas ou exceção documentada, e backup externo criptografado.
- Com testes em produção, registrar consentimento e organizar limpeza dos dados de QA.

**Gate:** até teste positivo com duas contas, autenticação/isolamento do GC e XP permanecem **P0 PENDENTE**. CI verde não substitui evidência funcional.
