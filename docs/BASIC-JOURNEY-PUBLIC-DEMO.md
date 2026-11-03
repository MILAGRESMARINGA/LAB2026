# Jornada básica e demonstração pública

A experiência básica abre uma trilha de sete pontos, com um único livro iluminado, seta animada e indicação curta Toque aqui. Ajuda e exploração do mapa são opcionais. A leitura principal mantém a integridade do plano intercalado e a confirmação do servidor; não modifica regras, banco ou XP.

Demonstração pública: https://labgame-demo.vercel.app/ . Projeto isolado `labgame-demo` (`prj_sDEgjIbYRmID9AALYMhSGmPTb0xj`), sem proteção SSO, variáveis de ambiente, conexão de banco, conta ou dados pessoais. A proteção do projeto principal não foi alterada. O build estático inclui somente HTML/JS/CSS; não usa Supabase. O teste permite todas as365etapas, com navegação semanal e escolha direta do dia. Todos os pontos exibidos ficam disponíveis exclusivamente no modo de demonstração. Ao concluir um dia, é possível seguir para o próximo, sem registrar pontos ou progresso. O panorama abre a página oficial e é opcional; o texto explica que XP no aplicativo depende de validação.

Texto: Almeida1911, domínio público; capítulos completos extraídos em2026-11-03 de `https://raw.githubusercontent.com/damarals/biblias/main/data/canonical/ALM1911/GEN.json`, `PSA.json`, `JHN.json`, mesma fonte do importador existente. Origem editorial da edição: Projeto Gutenberg62383. A ortografia histórica foi preservada. São31,6,51versículos respectivamente. O JSON local conserva a primeira leitura. As demais leituras são carregadas sob demanda da mesma fonte pública ALM1911, validadas por referência e mantidas em cache de memória; exigem internet. Falhas mostram opção de tentar novamente, sem substituir ou inventar texto.

Build: `npx vite build --config vite.demo.config.ts`; publicar `dist-demo/basic-demo.html` como `index.html` e seus assets. `dist-demo` não deve entrar no Git. Não copiar configurações ou credenciais de produção.

Validação:300testes de aplicação e build passaram. Acesso HTTP público retornou200 sem cookies e sem redirecionar para Vercel Auth. Navegador verificou entrada direta, botão de confirmação após rolar, transição Gênesis→Salmos e retorno à trilha. Em viewport390x844, largura/altura do documento permaneceram390x844 e a rolagem da leitura foi interna. Não é validação em dispositivo físico.

Intermediário/avançado são direção de produto para futuras skins e profundidade dos estudos; não há bloqueio pago, conteúdo novo publicado ou níveis artificialmente concluídos nesta entrega. Estudos permanecem na área própria.

## Liberação completa para teste
Em2026-11-03, navegação livre1–365 adicionada ao projeto público. Aplicativo real preserva trava e validação do servidor.301testes de aplicação e TypeScript aprovados. Navegador verificou salto direto ao dia365, pontos disponíveis e carregamento real de Malaquias3.
