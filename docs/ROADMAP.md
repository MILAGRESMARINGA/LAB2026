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
- [x] Validação no GitHub Actions #147: **84 testes passaram em 17 arquivos** e `npm run build` concluiu com sucesso; commit de código `0772a65d4ff522c74bf0056aaf5ba5e66c2b4f04`.
- [ ] **Painel Supabase:** Site URL e Redirect URLs; ativar os dois templates; configurar SMTP próprio e autenticação de domínio SPF/DKIM/DMARC.
- [ ] **QA real:** enviar e receber os dois e-mails, validar links e OTP, trocar senha, acessar Perfil e GCs em Android/iOS.
- [x] **CI de código validado**: https://github.com/MILAGRESMARINGA/LAB2026/actions/runs/38139538766 (84/84 + build).
- [ ] **Publicação P0**: Vercel com `build-rate-limit`; o domínio fixo foi atualizado para o deploy intermediário READY `dpl_C686YQ1s1aFGPnHNNRgXU1biXoa1` (commit `97f0623054c697dcc1e6ba5a9cb7898c5734d7d0`); restam por publicar os últimos ajustes já aprovados por CI. Liberar quota e implantar a HEAD depois de READY.

**Instruções operacionais:** `docs/P0-AUTH-RECOVERY-RUNBOOK.md`. Não classificar P0 como concluído integralmente até validar SMTP e uma conta real. A última versão comprovadamente READY anterior não contém necessariamente todas as mudanças P0.

### Publicação parcial de P0
- [x] Alias `labgame-biblia.vercel.app` atualizado para Vercel READY `dpl_C686YQ1s1aFGPnHNNRgXU1biXoa1`.
- [x] `GET /auth/callback` e `GET /auth/reset-password` respondem HTTP 200 com o shell SPA.
- [ ] Sincronizar a versão final da HEAD: últimos ajustes e testes estão no GitHub, mas a Vercel bloqueia builds adicionais por cota.


## Auditoria de engenharia e segurança — 12/10/2026

**Fonte de verdade:** [Auditoria ao vivo do PostgreSQL/Supabase](SECURITY-LIVE-AUDIT-2026-10-12.md), [matriz dos 12 pilares](ENGINEERING-BASELINE-AUDIT.md) e [padrão de engenharia](ENGINEERING-STANDARDS.md). Alterações desta etapa limitadas à `lab-rebuild-2026`, sem migração para a produção.

### Infraestrutura e CI
- [x] Inspeção ao vivo do banco LABGAME `azejfxvaamgkmfmwdzjn`: 15 tabelas com RLS, 12 migrações, 1.189 capítulos de plano únicos em 365 dias, limites 2–4 capítulos/dia, Almeida 1911 com 31.101 versículos e 71 panoramas.
- [x] CI #171 aprovou gates estáticos, testes Vitest e compilação; SHA `5af7bc7e83f670ea9857772d82c0188519dcb48c`; preview do mesmo SHA READY. Alterações seguintes exigem **novo** build/deploy.
- [x] Matriz de maturidade 12 pilares, C4, DoR/DoD, ADRs, threat model STRIDE, runbook de incidentes, política de IA/RAG, plano de QA e workflow de agentes.
- [x] CI executa `verify:engineering`; PHP/nativo/iOS/Android ainda não são ambiente de build e **não** devem ser anunciados como prontos.
- [x] Nova verificação de regressão: código OTP recupera senha sem mudar a origem do browser (a sessão da PWA/preview é preservada).
- [ ] Configurar branch protection formal no GitHub, lockfile/`npm ci`, auditoria automatizada de dependências, SAST, SBOM, staging Supabase, backup/restore e E2E cross-user.

### Riscos bloqueantes identificados
- [x] Inventário de ACL PostgreSQL comprovou `TRUNCATE/TRIGGER/REFERENCES/MAINTAIN` excessivos para `anon`/`authenticated`, inclusive em tabelas de GC e Bíblia.
- [x] Migração corretiva **PREPARADA NO GITHUB**: `lab-app/supabase/migrations/202610120001_lab_privileges_hardening.sql` com `REVOKE` não destrutivo, default-grants mais restritos e pós-condições transacionais; script de aceite SQL separado.
- [x] **P0 ACL resolvido em produção (14/10):** backup local validado 20/20, migração `20261014195640 lab_privileges_hardening_p0` aplicada ao LABGAME, script pós-condições com zero linhas, 68→0 permissões excessivas e 4→0 grants nos helpers. [ ] Smoke real de auth/GC/leitura/XP com duas contas ainda pendente.
- [x] Confirmados dois helper triggers `SECURITY DEFINER` com `EXECUTE` herdado por papéis públicos; correção de `REVOKE` incluída na migração.
- [ ] Ativar proteção de senhas vazadas (Supabase Auth Advisor), se disponibilizada no plano; testar entrega SMTP, redirects, reset e OTP em aparelho real.
- [ ] Auditoria com duas identidades legitimamente autenticadas para funções de GC, leitura, leaderboard e consentimento; nenhum teste E2E em produção foi realizado nesta auditoria.
- [ ] Performance: seis FKs sem índice de cobertura identificadas no advisor; examinar índices após linha de base e antes de crescimento de membros.
- [ ] Corrigir pendências de legislação/LGPD, incluindo dados de menores, consentimento, exclusão e retenção. Alerta geral de lançamento permanece aberto.

### Política de veracidade operacional
O fato de GitHub CI e Vercel READY estarem verdes **não prova** que a migração esteja aplicada ou que SMTP, ACLs, permissões cross-user e autenticação em Android/iOS estejam homologadas. Somente marcar caixas como concluídas mediante evidências de execução reais.

## P0 — Pré-requisitos para endurecimento do banco (13/10/2026)

**Decisão operacional:** usuário autorizou prosseguir para a etapa seguinte; a aplicação no banco real permanece bloqueada até prova de backup/restauração.

- [x] Confirmado por consulta ao Supabase que a organização LAB2026GAME está no plano `tier_free`. A documentação oficial do provedor não garante backups diários automáticos no Free.
- [x] Revalidada a migração de segurança preparada `202610120001_lab_privileges_hardening.sql` e a lista de 12 migrações já aplicadas. A migração de ACL ainda não consta do Supabase.
- [x] Criado o script **Windows PowerShell** `lab-app/scripts/backup-labgame.ps1`: somente leitura (pg_dump), destino travado para o projeto LABGAME, sem credenciais no Git, backup custom, inventário de `auth.users`, plano, Bíblia, GCs, scorecard e SHA-256.
- [x] Atualizados `.gitignore` e proteção em CI com parser PowerShell + testes estáticos para evitar publicação acidental de arquivos de backup ou script não revisado.
- [x] Criado o [runbook P0 de backup/restauração](P0-DATABASE-BACKUP-AND-HARDENING.md); atualizado [runbook de incidentes](OPERATIONS-INCIDENTS.md) para refletir o plano Free e limites reais do provedor.
- [ ] **Gate 1: ainda falta executar `pg_dump` com o acesso do responsável no Windows** e confirmar arquivo legível, SHA-256, cópia privada.
- [x] **Gate 2: recuperação em banco isolado validada estruturalmente e por contagem** (`labgame_restore_test`, 20/20 testes aprovados pelo usuário em 14/10). Restam teste de Auth/Storage gerenciados e backup off-site.
- [x] **Gate 3: migração ACL aplicada no Supabase LABGAME em 14/10** (`20261014195640`), advisors reconsultados, `security-post-migration-check.sql` retornou zero violações. Persistem recomendações não corrigidas de senhas vazadas e validação das RPCs autenticadas.
- [ ] **Gate 4: executar smoke de RLS, GCs, ranking, leitor/XP e autenticação** com contas de teste e aprovar promoção do deployment.

**Importante:** não foi executada operação de DDL/DML no Supabase durante esta rodada, e nenhuma alteração foi feita no CRM. O CI é evidência de qualidade de código, não de restauração de banco. Reconsultar status do CI após os últimos commits.


## Novo marco — LABGAME 3.0, 14/10/2026

Visão e regras detalhadas: [LABGAME-3-PRODUCT-AND-PROGRESSION.md](LABGAME-3-PRODUCT-AND-PROGRESSION.md). O roadmap anterior segue válido; este marco **não** libera alterações de dados nem pontuações de produção.

### Progresso executado
- [x] Definido modelo de conquistas pessoais independente de conquistas coletivas.
- [x] Medalhas pessoais visuais de 1.000 / 2.500 / 5.000 / 10.000 XP confirmados, exibidas na Jornada.
- [x] Insígnia visual para GC que alcançou 100% de assiduidade semanal, com no mínimo 3 participantes consentidos, sem bônus pessoal.
- [x] Código de domínio puro e testes para validar metas e proteção contra XP coletivo inexistente.
- [x] Documentada a proposta de ciclos de 365 etapas e premiações progressivas; os bônus anuais não foram creditados nem aplicados ao Supabase.
- [x] Estruturada a visão de discipulado e teologia sistemática como trilhas permanentes e revisadas editorialmente.

### Próximas implementações
- [x] Tornar Jornada a home principal; ordem Jornada, Estudos, Bíblia, GCs, Perfil; leitura diária acessada pela Jornada (code/CI; QA manual pendente).
- [x] Corrigir associação exata dos vídeos do NT e ordem canônica, retirando fallback para playlist genérica que começava por Mateus; na ausência de player específico, oferecer fonte original. Testes CI aprovados; homologação visual pendente.
- [ ] Definir e homologar fonte de verdade para 1.000 XP coletivos sem misturar XP pessoal com somatório de integrantes fora do período.
- [x] **Decisão aprovada (14/10/2026):** bônus adicional de +10.000 XP no 1º ciclo concluído, +12.500 no 2º, +15.000 no 3º e incrementos de +2.500 por ciclo; regra independente de XP de capítulos/vídeos.
- [x] Implementação SQL **preparada no GitHub**, ainda não aplicada: ledger `lab_game_cycle_awards`, idempotência por run, validação de 1.189 capítulos, scorecard com bônus, RLS e histórico de coroas.
- [ ] **Gate obrigatório:** executar a migração em ambiente isolado/staging, testar concorrência/reenvios e duas contas, auditar RLS/permissões e reconciliar XP antes de qualquer execução em produção. Veja `docs/ANNUAL-CYCLE-AWARDS-RELEASE.md`.
- [ ] Projetar conteúdos de novos convertidos, teologia sistemática e caráter cristão com revisão pastoral, direitos de uso e acessibilidade.
- [ ] Testes de integração Supabase multiusuário, GC, RLS, concorrência, backup/restauração e homologação mobile antes de publicar produção.


### Primeiro pacote de formação (implementado em código)
- [x] Trilhas interativas na aba Estudos: **Primeiros passos na fé** (6 encontros), **Teologia Sistemática** (8 temas), **Vida e Caráter Cristão** (6 encontros), com referências bíblicas e introduções curtas.
- [x] Estudos livres e sem atribuição de XP; revisão editorial completa e quizzes interativos permanecem pendentes.
- [ ] Validar no celular a navegação, abertura do link original do vídeo, formação responsiva e legibilidade das medalhas.


## Atualização — bônus por conclusão integral aprovado (14/10/2026)
- [x] Migração versionada `lab-app/supabase/migrations/202610140001_annual_cycle_completion_awards.sql` escrita. Não executada no banco real.
- [x] Ledger único por ciclo, fórmulas progressivas, leitura 1.189/365 validada dentro do servidor, extensão de `lab_game_scorecard`.
- [x] Perfil mostra bônus/coroas **somente quando o servidor retorna eventos reais**; feedback da leitura final idem.
- [x] Testes unitários + verificações estáticas de SQL e auditoria de staging somente leitura adicionados.
- [ ] Integração real PostgreSQL/RLS em staging, rollback e auditoria de crédito único.
- [ ] Revisar histórico pré-migração para eventuais ciclos completos sem bônus; backfill exige autorização separada.
- [ ] Validar gates P0 de backup, segurança e QA antes da promoção à produção.


## Atualização P0 — 14/10/2026
- [x] Restore local isolado: 20/20 testes aprovados, incluindo contagens, 15 tabelas RLS, 15 PK e 17 FK.
- [x] ACL hardening aplicado **somente ao Supabase LABGAME**; migração `20261014195640 lab_privileges_hardening_p0` em histórico de produção.
- [x] SQL de pós-condições executado, sem linhas de violação; 68 permissões excessivas e 4 EXECUTE públicos indevidos passaram a zero.
- [x] Conteúdo bíblico preservado em produção: 1.189 capítulos do plano, 365 dias, 31.101 versículos, 71 recursos de vídeo.
- [ ] P0 geral ainda aberto: teste com duas contas reais em login/OTP/reset, XP, GCs e RLS; proteção de senha vazada (se disponível) e cópia externa criptografada/backup recorrente.
- [ ] A migração do bônus anual **não foi aplicada**; testes transacionais em staging permanecem exigidos.
