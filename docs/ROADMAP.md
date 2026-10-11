# LABGAME 2.0 — Roadmap de execução

Atualização: 11/10/2026. Branch: `lab-rebuild-2026` do repositório `MILAGRESMARINGA/LAB2026`.

**Visão:** aplicativo de leitura bíblica integral em formato de jornada de aprendizagem, com disciplina diária, progressão visual, recorde pessoal, GCs e material de estudo bíblico. Identidade gráfica própria; as telas do Duolingo são inspiração de experiência, não de reprodução de marca ou personagem.

## 0 — Integridade bíblica e edição do plano
- [x] Fonte canônica: Bíblia protestante com 66 livros e 1.189 capítulos
- [x] Modalidade competitiva de **365 dias consecutivos**, iniciada na data do participante
- [x] Distribuição automática de **1 a 4 capítulos por etapa**
- [x] Dia inicial: **Gênesis 1, Salmos 1, João 1**
- [x] Sequências em AT, Salmos e NT, com ligação Lucas → Atos
- [x] Plano v1 congelado no PostgreSQL; 365 etapas e 1.189 referências únicas verificadas
- [x] Testes unitários de integridade e cobertura do plano
- [ ] Revisão formal por especialista em cânon, exegese e leitura pastoral
- [ ] Versão coletiva janeiro–dezembro separada da modalidade individual de 365 etapas

## 1 — Regras do jogo e segurança
- [x] Servidor determina o dia corrente em `America/Sao_Paulo`
- [x] Somente capítulos do **dia e da etapa atual** rendem XP
- [x] Bloqueio contra antecipar capítulos, reenvios duplicados e pontuação extra
- [x] Etapa avança apenas quando todos os capítulos do dia foram confirmados
- [x] Perdeu uma etapa? Encerra tentativa e volta ao dia 1 na próxima sessão
- [x] Melhor sequência histórica preservada, mesmo após reinícios
- [x] Conclusão dos 365 dias preservada até início voluntário de novo ciclo
- [x] Novo ciclo bloqueado no mesmo dia da conclusão
- [x] Banco com tabelas dedicadas e RPCs transacionais; acesso privado por RLS
- [x] Simulações transacionais de confirmação, idempotência, perda do dia, recorde, grupos e reinício concluído, revertidas após cada teste
- [ ] Homologar com pessoas reais em fusos e dispositivos diferentes
- [ ] Auditoria especializada de segurança e retenção de dados

## 2 — Frontend e gamificação
- [x] Interface móvel, temática escura, navegação em seis áreas (Hoje, Bíblia, Jornada, Estudos, GCs, Perfil)
- [x] Onboarding com proposta, regras, modo de participação e primeiro desafio
- [x] Etapas individuais com feedback após cada capítulo
- [x] XP, sequência atual, recorde, títulos e conquistas
- [x] Mapa com etapas concluídas, atual e futuras bloqueadas
- [x] Chama simbólica para a constância; sem equivalência com espiritualidade pessoal
- [x] Suporte a grupos e rankings privados opt-in
- [ ] Testes E2E com navegador e leitores reais
- [ ] Homologar acessibilidade WCAG, motion reduzido, contraste, rolagem de versículos e leitura em telas pequenas
- [x] Recuperação de senha: envio de link e troca segura após evento PASSWORD_RECOVERY
- [x] Tratamento de sessão Supabase sem getUser assíncrono dentro do callback de autenticação
- [x] Manifesto instalável, ícone próprio e service worker de shell público sem cache de credenciais/dados
- [x] Orientações de instalação Android/iOS e aviso de conexão na interface
- [ ] Adicionar ícones PNG e homologar instalação em dispositivos reais
- [ ] Configurar redirecionamento de recuperação no domínio definitivo do Supabase Auth
- [ ] Notificações opt-in para lembrete de leitura diária

## 3 — Grupos de crescimento (GC)
- [x] Criar grupo, convidar por token e entrar com autorização
- [x] Proteção contra acesso ao ranking por não membros
- [x] Ranking individual privado ordenado por melhor sequência
- [x] Consentimento individual para exibição do nome
- [x] Liga entre GCs: participação voluntária pelo líder e consentimento individual
- [x] Classificação semanal proporcional aos dias completos **dos membros que consentiram**; opt-out não penaliza o GC
- [x] Mínimo de três membros com consentimento para aparecer na liga
- [x] Restrição de leitura da liga aos integrantes de GCs inscritos (RPC security definer)
- [x] Teste SQL de cálculo semanal (4,8%), grupo elegível e bloqueio a não integrantes
- [ ] Dashboard para líderes, convites revogáveis e moderação
- [ ] Períodos de competição, histórico de temporadas e critérios contra abuso

## 4 — Bíblia, estudos e contextualização
- [x] Livros categorizados em Pentateuco, históricos, poéticos, profetas, Evangelhos, Atos, cartas e Apocalipse
- [x] Blocos introdutórios: Gênesis 1 × João 1, promessa, Lucas → Atos, profetas, Espírito Santo e salvação
- [x] Estudos dissociados da pontuação da leitura para evitar atalhos
- [x] Banco bíblico em PostgreSQL: Almeida 1911 (domínio público), 66 livros, 1.189 capítulos e 31.101 versículos
- [x] Interface de leitura capítulo a capítulo dentro do LABGAME, com versículos, fonte ajustável e confirmação após rolar até o final
- [x] Leitura pública protegida por RLS; escrita do texto bíblico bloqueada para usuários comuns
- [x] Script de importação reprodutível e documentação de fonte, licença e proveniência
- [x] Playlists do BibleProject enviadas pelo usuário: Antigo e Novo Testamento
- [x] Catálogo de panoramas/guia oficial em português mapeado para os 66 livros
- [x] Vídeo associado ao capítulo correspondente na tela de leitura, com divisão por faixas quando aplicável
- [x] Biblioteca com escolha de livro, links diretos ao conteúdo oficial e acesso às playlists completas
- [x] Build Vercel READY após integração BibleProject (commit feb41cc; 8 arquivos e 43 testes aprovados)
- [x] Convite para panorama do livro após confirmar seu último capítulo
- [x] Player BibleProject incorporado em modal, com opção de tela cheia e créditos visíveis
- [x] 25 panoramas com identificador Mux obtido da página oficial; demais títulos acessíveis via playlist oficial incorporada
- [x] XP extra por panorama: 5 pontos uma única vez por vídeo, sem substituir capítulo nem permitir avanço
- [x] Guarda de tempo mínimo de 90 s e confirmação explícita; sem fingir comprovação automática de visualização integral
- [x] Teste SQL de XP, reenvio duplicado, bloqueio antes do prazo, avanço da etapa inalterado
- [ ] Curadoria dos identificadores específicos dos demais panoramas ainda ligados à playlist (25 diretos até aqui)
- [ ] Conferência manual em Android e iOS do player e da tela cheia
- [ ] Exegese por capítulo e blocos temáticos revisados por especialistas
- [x] Aba **Bíblia** com seleção dos 66 livros e capítulos, navegação anterior/próximo e leitor sem depender de login
- [x] Busca de livros sem acentos, capítulo favorito privado e retorno rápido aos capítulos salvos
- [x] RLS e FK para favoritos por conta individual, sem efeito na sequência nem no XP
- [x] Testes de navegação canônica e transição entre livros (51 testes no último build)
- [x] Busca textual nos 31.101 versículos Almeida 1911, com índice PostgreSQL de texto completo em português
- [x] Navegação de resultados até o capítulo e destaque do versículo encontrado
- [x] Acesso público de somente leitura aos resultados e testes de consultas ao servidor
- [x] Testes da API de busca, validação dos termos e limite de resultados
- [ ] Referências cruzadas semânticas, notas privadas e filtros avançados por livro

## 5 — Qualidade, operação e lançamento
- [x] Projeto LABGAME isolado de demais bancos de dados do usuário
- [x] Repositório GitHub e Vercel conectados para deploy
- [x] Pipeline exige `npm test && npm run build`
- [x] Build da primeira versão gamificada aprovado (32 testes em sete arquivos)
- [x] Release de jornada por capítulo aprovado no deploy dpl_2mrMg7dYCz8gykjuD9FUz9ZKeaXW (36 testes em 8 arquivos, Vercel READY)
- [x] Testes de categorias bíblicas e fluxo de capítulos aprovados (36/36 no Vercel)
- [x] Deploy Vercel READY do leitor e vídeos: 9 arquivos e 47 testes aprovados; commit ffed67f
- [x] Dados textuais e permissões verificados no Supabase após importação
- [x] Deploy READY com biblioteca e GC versus GC: 51 testes em 10 arquivos, compilação aprovada (Vercel `dpl_DgEYmJiiy8JrZqhaPLAHCTeqa7AN`)
- [ ] Validar transições e responsividade com navegador real e duas contas autenticadas
- [ ] Testes de RLS com credenciais autenticadas por HTTP e duas sessões distintas
- [ ] Observabilidade de falhas, plano de backup/rollback, desempenho mobile
- [ ] Publicação homologada e abertura gradual por GC

## Papéis de agentes
- **principal-architect:** invariantes, modelo versionado e arquitetura
- **backend-engineer:** RPCs transacionais e limites de etapas
- **database-engineer:** PostgreSQL, migrações e índices
- **security-engineer:** RLS, autorização por GC e proteção de dados
- **qa-reliability-engineer:** testes de regressão, fluxo anual e cenários de falha
- **frontend-ux-engineer:** onboarding, jornada e acessibilidade
- **integration-engineer:** links BibleProject, traduções licenciadas e autenticação
- **platform-observability-engineer:** logs, releases, backups e monitoramento
- **ai-engineer:** estudos e conteúdos pedagógicos sob revisão humana

Esses nomes são responsabilidades de revisão e desenvolvimento, **não** processos de agentes autônomos em execução.

## Acordos e critérios
Regras completas: `docs/LABGAME-2.0-RULES.md`. Nenhum livro ou capítulo pode ser removido, repetido artificialmente ou alterado para caber na gamificação. Não tratar o estado espiritual das pessoas como métrica do jogo. Não publicar exegese automatizada sem revisão nem links de vídeos ainda não fornecidos.

## Resultado técnico desta entrega

- Deploy Vercel: `dpl_5ugBTBZjyuwQRkUrRVVNbhqnQHbK` — READY; `npm test && npm run build`: **47 testes aprovados em 9 arquivos**.
- Banco LABGAME: 66 livros, 1.189 capítulos, 31.101 versículos; zero capítulo faltante; 71 recursos BibleProject e controles de XP.
- Direitos: [docs/BIBLE-DATA-AND-MEDIA.md](BIBLE-DATA-AND-MEDIA.md). Próximas traduções exigem origem e licença explicitamente comprovadas.
- Segurança: o endpoint de conclusão de vídeos pontua no máximo uma vez por recurso; não permite gravação direta por usuários nem substitui capítulos.

## Marco de desenvolvimento — Biblioteca + Liga GC
- Migração `202610110007_bible_favorites.sql`: capítulos favoritos privados por usuário.
- Migração `202610110008_gc_league.sql`: inscrição pela liderança e ranking coletivo móvel de 7 dias.
- Banco testado com contas temporárias em transação revertida. Resultado coletivo de 4,8% para 1 leitura válida em 7 dias × 3 integrantes. Não expõe nomes individuais.
- Release prévia na Vercel: `labgame-biblia-932nkfcu8-antonios-projects-0bf892e8.vercel.app` (READY, 51 testes).
- Não homologado ainda: execução manual no navegador, sincronização de favoritos entre aparelhos, vídeo em tela cheia no Android/iOS.

## Marco de entrega — Busca integral
- Migração `202610110009_bible_verse_search.sql`: 31.101 versículos, índice GIN, consulta limitada a 50 resultados por requisição.
- Componente `BibleLibrary.tsx`: pesquisa em português, seleção de um resultado e destaque do versículo no leitor interno.
- Endpoint `lab_bible_search(text,integer)`: acesso autenticado e anônimo somente leitura, sem conceder XP.
- A nova suíte acrescenta 4 testes de RPC e validação, totalizando 55 testes em 11 arquivos.
- Permanecem pendentes: teste manual no Android/iOS, busca por frases antigas com grafia histórica, acessibilidade de leitores de tela e autenticação com contas reais.

## Marco — instalação e autenticação, 11/10/2026

- PWA com `manifest.webmanifest`, `sw.js` e ícone SVG. Cache exclusivo de shell HTML/CSS/JS e ícone; sem armazenamento offline de Bíblia, tokens, leituras ou XP.
- Nova recuperação de senha por e-mail e criação de senha com pelo menos 8 caracteres. Configuração de URLs permitidas no Supabase ainda necessária.
- Correção de justiça na Liga GC: denominador da taxa é o número de participantes com consentimento, não a população total do grupo.
- Curadoria adicional de 19 IDs oficiais de panoramas BibleProject: agora 25 reproduções individuais conhecidas. A seleção de vídeos restantes continua via playlist integrada.
- 63 testes da primeira tentativa passaram, mas o `tsc` apontou ausência de tipos de Node no teste de PWA; foram adicionados `@types/node` e o tipo `node` no `tsconfig`.
- **Bloqueio externo de publicação:** Vercel recusou novo deploy com `402 api-deployments-free-per-day`. A versão desta rodada está no GitHub, **ainda sem build completo aprovado nem publicação nova**.
- Instruções e dependências: `docs/MOBILE-INSTALL-AND-RECOVERY.md`.

### Aceite pendente de lançamento
1. Executar `npm install && npm test && npm run build` após a liberação do deploy ou em uma execução CI acessível.
2. Verificar `/manifest.webmanifest`, `/icons/labgame.svg` e `/sw.js` pela URL final.
3. Homologar recuperação de senha e instalação em Chrome Android e Safari iOS.
4. Homologar reprodução em tela cheia dos vídeos novos.

## Correção de acesso — cadastro, XP e perfis (11/10/2026)

- [x] Conferido Supabase LABGAME da Vercel: URL correta e chave publishable ativa.
- [x] Cadastro dividido do login; valida nome, e-mail, senha forte e confirmação, com reenvio de ativação e mensagens legíveis.
- [x] Login direto das abas **Perfil** e **GCs**, inclusive sem conta anterior; restauração de sessão sem exibir formulário durante carregamento.
- [x] Perfil pessoal inicializado com nome de cadastro via metadata validada na primeira sincronização.
- [x] Perfil pessoal com fórmula detalhada: 10 XP/capítulo + 5 XP/panorama único; comparação contábil `balanced` entre histórico e pontuação armazenada.
- [x] Perfil GC privado com total de integrantes, consentimentos, dias de leitura nos últimos sete dias, assiduidade e ranking de leitores.
- [x] Critérios de classificação individual documentados; ranking GC semanal ponderado por participantes que consentiram.
- [x] Funções SQL `lab_game_scorecard()` e `lab_game_group_summary(uuid)` aplicadas no Supabase.
- [x] Testes unitários adicionais de cadastro, login e fórmulas de ranking.
- [x] Build Vercel `dpl_CWvVxqJc3WkHKfKqKpoQven46P6i`: **73 testes / 15 arquivos, READY**, commit `0fa39967ccaefa20f73b0c0502a98612b2b7ec99`.
- [x] Endereço fixo **https://labgame-biblia.vercel.app** vinculado ao último build aprovado.
- [ ] **Configurar Site URL e Redirect URLs em Supabase Authentication** para `https://labgame-biblia.vercel.app`, sem depender de links preview.
- [ ] Homologar envio de confirmação de e-mail, recuperação de conta e login reais em Android e iOS.
- [ ] Testar com duas contas legítimas: criação de GC, convite, perfil privado, autorização de ranking, XP de leitura e vídeo.
- [ ] Fazer auditoria final de segurança, consentimento e recuperação de dados antes de distribuição ampla.

Documentação e testes: `docs/AUTH-PROFILES-AND-SCORING.md`; `lab-app/tests/account-access.test.ts`; `lab-app/tests/scorecards.test.ts`.

**Observação:** os 73 testes aprovados cobrem regras de código e mocks de autenticação, não comprovam a entrega real de e-mails. O novo cadastro precisa de homologação com usuários reais após a configuração dos redirecionamentos do Supabase.

## P0 — Recuperação e cadastro por e-mail (11/10/2026)

- [x] Destinos de confirmação e redefinição fixados no domínio público canônico, sem depender do preview ou de `window.location.origin`.
- [x] Rotas `/auth/callback` e `/auth/reset-password` com verificação de sessão, alteração de senha e instruções para links expirados.
- [x] Suporte a links padrão com tokens de fragmento, códigos PKCE tratados pelo SDK e modelos customizados com `token_hash`.
- [x] Alternativa com OTP de seis dígitos para ativação e recuperação dentro da PWA, evitando troca de contexto do navegador.
- [x] Templates de e-mail HTML preparados com link HTTPS, `TokenHash` e `Token`: `lab-app/supabase/email-templates/`.
- [x] `VITE_PUBLIC_APP_URL=https://labgame-biblia.vercel.app` cadastrado na Vercel para Preview e Production.
- [x] Testes adicionados para URLs, links expirados, ativação e recuperação por OTP; corrigidos problemas iniciais de sintaxe e regras de erro.
- [ ] **Painel Supabase:** Site URL e Redirect URLs; ativar os dois templates; configurar SMTP próprio e autenticação de domínio SPF/DKIM/DMARC.
- [ ] **QA real:** enviar e receber os dois e-mails, validar links e OTP, trocar senha, acessar Perfil e GCs em Android/iOS.
- [ ] **CI e deploy mais recentes:** limite de build Vercel `build-rate-limit` detectado; aguardando liberação para compilação homologatória e promoção ao endereço fixo.

**Instruções operacionais:** `docs/P0-AUTH-RECOVERY-RUNBOOK.md`. Não classificar P0 como concluído integralmente até validar SMTP e uma conta real. A última versão comprovadamente READY anterior não contém necessariamente todas as mudanças P0.
