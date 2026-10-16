# LABGAME no celular — instalação, rede e recuperação

Atualização: 11/10/2026. Código implementado na branch `lab-rebuild-2026`; a última publicação dessa rodada ainda precisa ser concluída por limite de deploy da Vercel.

## Instalação como aplicativo

O LABGAME agora possui:
- manifesto em `public/manifest.webmanifest`, escopo `/`, idioma pt-BR e apresentação independente (`display: standalone`);
- ícone original `public/icons/labgame.svg`, um livro com chama;
- service worker `public/sw.js`, registrado apenas na produção;
- opção de instalação na aba Perfil e orientações para Android/iOS.

**Android (Chrome):** menu ⋮ → Instalar aplicativo/Adicionar à tela inicial.

**iOS (Safari):** botão Compartilhar → Adicionar à Tela de Início.

O suporte ao ícone vetorial e à instalação depende do navegador. Ícones PNG de 192 e 512 px ainda devem ser adicionados para ampliar a compatibilidade; não declarar instalação homologada no iOS até teste real.

### Limites do uso sem internet

O service worker armazena somente o HTML público do aplicativo, ícone e arquivos JS/CSS locais versionados. Ele **não armazena** respostas do Supabase, autenticação, texto da Bíblia, progresso ou vídeos. Sem conexão o leitor não consegue baixar capítulos nem registrar leitura válida. A interface avisa explicitamente sobre isso. Nunca prometer leitura offline ou XP offline sem implementar sincronização verificada e antifraude.

## Recuperação de senha

- A tela de login possui a opção **Esqueci minha senha**.
- O Supabase Auth envia e-mail para recuperar a conta com redirecionamento à origem do aplicativo.
- Quando a sessão de recuperação é reconhecida, uma tela permite configurar a nova senha, exigindo ao menos 8 caracteres.
- A aplicação evita chamadas assíncronas de `getUser()` dentro do callback síncrono de `onAuthStateChange`.

**Configuração pendente**: adicionar a origem pública definitiva da instalação em *Supabase → Authentication → URL Configuration → Redirect URLs*. Previews Vercel são URLs variáveis; preferir domínio estável. Sem essa configuração, links de recuperação podem não retornar corretamente.

## Privacidade da Liga entre GCs

A proporção semanal usa `dias completos dos participantes com consentimento / (7 × participantes com consentimento)`. Integrantes que não participam do ranking não diminuem o resultado. Continua exigido mínimo de três participantes com consentimento para um GC aparecer na classificação.

## BibleProject dentro do aplicativo

- Mapeados **25 panoramas com reprodução individual por IDs de streams encontrados nas páginas oficiais**, vinculados aos recursos correspondentes do BibleProject.
- Demais vídeos utilizam temporariamente a playlist incorporada e devem passar por curadoria individual.
- Os direitos dos vídeos pertencem ao BibleProject; a experiência usa player incorporado, com créditos e link da fonte. Não copiar os vídeos para o banco.
- O XP extra continua separado da leitura. A espera mínima e a confirmação são autorrelato; não garantem monitoramento de visualização integral.

## Situação de validação

- Builds anteriores: 55 testes aprovados antes desta rodada.
- Primeira tentativa desta rodada: **63 testes passaram**, mas a compilação TypeScript detectou ausência de `@types/node` nos testes de PWA.
- Correção aplicada: dependência `@types/node` e configuração do `tsconfig.json`.
- Publicação posterior recusada pela API Vercel: `402 api-deployments-free-per-day` (limite diário). Por isso, **o novo build e a nova experiência ainda não podem ser considerados homologados ou publicados**.
- Próximos passos: repetir `npm install && npm test && npm run build` em CI, liberar o limite da Vercel e validar a instalação, recuperação por e-mail e player em dispositivos reais.
