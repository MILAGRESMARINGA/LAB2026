# Jornada básica e demonstração pública

A experiência básica abre uma trilha de sete pontos, com um único livro iluminado, seta animada e indicação curta Toque aqui. Ajuda e exploração do mapa são opcionais. A leitura principal mantém a integridade do plano intercalado e a confirmação do servidor; não modifica regras, banco ou XP.

Demonstração pública: https://labgame-demo.vercel.app/ . Projeto isolado `labgame-demo` (`prj_sDEgjIbYRmID9AALYMhSGmPTb0xj`), sem proteção SSO, variáveis de ambiente, conexão de banco, conta ou dados pessoais. A proteção do projeto principal não foi alterada. O build estático inclui somente HTML/JS/CSS; não usa Supabase. O teste permite todas as365etapas, com navegação semanal e escolha direta do dia. Todos os pontos exibidos ficam disponíveis exclusivamente no modo de demonstração. Ao concluir um dia, é possível seguir para o próximo, sem registrar pontos ou progresso. O panorama abre a página oficial e é opcional; o texto explica que XP no aplicativo depende de validação.

Texto: Almeida1911, domínio público; capítulos completos extraídos em2026-11-03 de `https://raw.githubusercontent.com/damarals/biblias/main/data/canonical/ALM1911/GEN.json`, `PSA.json`, `JHN.json`, mesma fonte do importador existente. Origem editorial da edição: Projeto Gutenberg62383. A ortografia histórica foi preservada. São31,6,51versículos respectivamente. O JSON local conserva a primeira leitura. As demais leituras são carregadas sob demanda da mesma fonte pública ALM1911, validadas por referência e mantidas em cache de memória; exigem internet. Falhas mostram opção de tentar novamente, sem substituir ou inventar texto.

Build: `npx vite build --config vite.demo.config.ts`; publicar `dist-demo/basic-demo.html` como `index.html` e seus assets. `dist-demo` não deve entrar no Git. Não copiar configurações ou credenciais de produção.

Validação:300testes de aplicação e build passaram. Acesso HTTP público retornou200 sem cookies e sem redirecionar para Vercel Auth. Navegador verificou entrada direta, botão de confirmação após rolar, transição Gênesis→Salmos e retorno à trilha. Em viewport390x844, largura/altura do documento permaneceram390x844 e a rolagem da leitura foi interna. Não é validação em dispositivo físico.

Intermediário/avançado são direção de produto para futuras skins e profundidade dos estudos; não há bloqueio pago, conteúdo novo publicado ou níveis artificialmente concluídos nesta entrega. Estudos permanecem na área própria.

## Liberação completa para teste
Em2026-11-03, navegação livre1–365 adicionada ao projeto público. Aplicativo real preserva trava e validação do servidor.301testes de aplicação e TypeScript aprovados. Navegador verificou salto direto ao dia365, pontos disponíveis e carregamento real de Malaquias3.

## Menu, cor, panorama interno e ranking simulado

A demonstração recupera o menu lateral desktop e inferior mobile, a paleta escura com trilha colorida e um ponto principal iluminado. Jornada, Ranking, Estudos, Bíblia, GCs, Perfil e Ajuda possuem destinos internos. Estudos sinaliza conteúdo em preparação, sem inventar biblioteca concluída.

Panoramas oficiais abrem em diálogo interno com player Mux incorporado. Os IDs públicos previamente curados foram extraídos para módulo compartilhado, preservando os recursos do player real. O jogador escolhe Agora, No final ou Agora não; dispensar o panorama continua a leitura. O botão Simular conclusão concede somente5XP de demonstração, uma vez por URL; leitura concluída concede10XP de demonstração, uma vez por capítulo. Ranking global e individual do GC usam participantes fictícios e selo permanente de simulação. Pontos são estado apenas da sessão, sem banco, conta ou envio de recompensas reais.

O leitor valida o capítulo em foco antes de renderizar, descarta respostas antigas e acompanha sua área com ResizeObserver para reavaliar a confirmação. Consultas de texto têm timeout15s e opção de tentar novamente. Não foi demonstrada ausência de texto em Juízes20: a fonte contém48versículos.

Verificação desta revisão:303testes de aplicação,119testes de engenharia e build aprovados. Navegador percorreu o dia109 inteiro: Juízes20 → panorama no final → Juízes21 → Salmos45 → dia110. XP simulado35 refletiu três leituras e um vídeo. Rankings global/individual exibiram a posição correspondente. Viewport390x844 manteve documento390x844 e mostrou o panorama sobre o leitor, com miniatura carregada no player, sem sair da página. Não é teste de celular físico nem comprovação de reprodução integral de todos os vídeos.

## Blocos semanais, baús e reprodução integral — revisão de 04/11

BET: JOURNEY-DEMO-REWARDS-20261104. Responsável: frontend/UX; apoios: weekly_skin e video_integral. Escopo: demonstração pública isolada, BasicJourney compartilhado e testes de domínio. Sem migração, chamadas pagas de IA ou alteração de XP real.

- Cinco variações de paisagem por bloco de sete dias, transição com movimento reduzido respeitado, semana/livro/bloco e etapas numeradas. Menu preservado.
- Cronômetro de leitura ativa visível na demo. Não afirma validação de leitura real pelo relógio local.
- Livro exige todos os seus capítulos lidos para liberar baú e seus panoramas. Novo baú gera aviso visual. Saltar no seletor de dias não conclui capítulos.
- MuxPlayer nativo substitui iframe: bônus automático apenas após `ended` e cobertura contígua de toda a duração em1×, visível. Pausa/seek/ocultação não rendem tempo. Botão manual de XP removido. Ao fechar, cobertura parcial é descartada. Guarda local não é antifraude de servidor.
- Regras locais de teste: capítulo10, dia completo10, bloco completo de7dias50, livro30, ciclo mensal100, estudo20, vídeo5XP. Cada bônus possui chave idempotente. Blocos semanais são posições consecutivas do plano, não sequência de datas reais; ciclos mensais dividem365etapas em12partes. Valores não alteram economia real.
- Estudos: introdução Como ler a Bíblia livre; Pentateuco exige os cinco livros;12baús mensais liberam roteiro devocional. Roteiros mensais são modelo introdutório repetível, não biblioteca completa de estudos revisados. Textos vinculam referências bíblicas; não houve geração RAG/fine-tuning nem alegação de parecer teológico humano.
- QA local:119testes de engenharia,309testes da aplicação e build passaram. Testes novos cobrem bloqueios de livro/mês/Pentateuco, idempotência e cobertura de vídeo sem crédito por salto.
- QA navegador: semana1→2, biblioteca e estudo livre+20, etapa346 Amós8→Amós9→Obadias1→Apocalipse8; baú Obadias liberado com60XP(3capítulos+livro), outros livros não liberados. Player interno carregou duração4:59. Reprodução integral de todos os vídeos e aparelho físico não foram certificados.
- Produção principal e revisão humana: BLOQUEADAS para integração; mudanças propostas na DraftPR90. Publicação autorizada apenas no projeto separado labgame-demo. Rollback da demo: promover a implantação anterior `dpl_E1zGGF7EGFWnQb1TFhwUJAvbda4G`.

## Retorno ao mapa moderno — 04/11

BET JOURNEY-MODERN-ATLAS-20261104. Pedido: restaurar a apresentação isométrica moderna, com bandeiras acessíveis, preservando vídeos integrais e estudos. O aplicativo volta a abrir AtlasJourney por padrão. Na demo, DemoAtlasJourney usa o mesmo terreno Three.js, carregado sob demanda, e uma trilha semanal ordenada sobre o cenário regional. Esta trilha é diagrama de progressão do jogo, não reconstrução de rota histórica.

Sete bandeiras maiores, indicação de dia/semana/livro, destaque da etapa atual, ação Ler agora, baús no cabeçalho, zoom, centralização e alternância Mundo/Etapa. Rótulos geográficos ampliados na vista macro; contexto detalhado fica no guia do aplicativo. Eden mantém localização incerta. Menu,365dias de teste, fluxo de leitura, cronômetros, player integral, bônus, ranking e estudos permanecem presentes. A demo continua sem backend e sem XP real.

QA:311testes de aplicação,119de engenharia e build aprovados. Testes adicionais verificam navegação Mundo/Etapa sem iniciar leitura, ação Ler agora, acesso a Baús e última semana parcial. Navegador público confirmou Mundo→Etapa→Gênesis1, abertura de Baús e viewport390×844 sem rolagem externa. Não houve nova execução de vídeo integral nesta revisão; preservados componente e testes de cobertura anteriores. Produção principal não publicada nem banco alterado. Branch e DraftPR90 mantidas; publicação isolada autorizada no projeto labgame-demo. Rollback: deployment dpl_J3tNrHXtvvGAdwVVqsj99vhAMdNs.
