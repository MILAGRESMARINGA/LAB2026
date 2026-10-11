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
- [x] Interface móvel, temática escura, navegação em cinco áreas
- [x] Onboarding com proposta, regras, modo de participação e primeiro desafio
- [x] Etapas individuais com feedback após cada capítulo
- [x] XP, sequência atual, recorde, títulos e conquistas
- [x] Mapa com etapas concluídas, atual e futuras bloqueadas
- [x] Chama simbólica para a constância; sem equivalência com espiritualidade pessoal
- [x] Suporte a grupos e rankings privados opt-in
- [ ] Testes E2E com navegador e leitores reais
- [ ] Acessibilidade WCAG, motion reduzido, contraste e leitura em telas pequenas
- [ ] Notificações com consentimento e recuperação de conta

## 3 — Grupos de crescimento (GC)
- [x] Criar grupo, convidar por token e entrar com autorização
- [x] Proteção contra acesso ao ranking por não membros
- [x] Ranking individual privado ordenado por melhor sequência
- [x] Consentimento individual para exibição do nome
- [ ] Competição **entre GCs** com classificação justa por participação/assiduidade
- [ ] Dashboard para líderes, convites revogáveis e moderação
- [ ] Períodos de competição, histórico de temporadas e critérios contra abuso

## 4 — Bíblia, estudos e contextualização
- [x] Livros categorizados em Pentateuco, históricos, poéticos, profetas, Evangelhos, Atos, cartas e Apocalipse
- [x] Blocos introdutórios: Gênesis 1 × João 1, promessa, Lucas → Atos, profetas, Espírito Santo e salvação
- [x] Estudos dissociados da pontuação da leitura para evitar atalhos
- [ ] Texto bíblico completo no aplicativo com edição/licença apropriadas
- [ ] Panoramas oficiais BibleProject para cada livro (aguardando playlists do usuário)
- [ ] Exegese por capítulo e blocos temáticos revisados por especialistas
- [ ] Busca bíblica, referências cruzadas e recursos de leitura acessível

## 5 — Qualidade, operação e lançamento
- [x] Projeto LABGAME isolado de demais bancos de dados do usuário
- [x] Repositório GitHub e Vercel conectados para deploy
- [x] Pipeline exige `npm test && npm run build`
- [x] Build da primeira versão gamificada aprovado (32 testes em sete arquivos)\n- [x] Release de jornada por capítulo aprovado no deploy dpl_2mrMg7dYCz8gykjuD9FUz9ZKeaXW (36 testes em 8 arquivos, Vercel READY)
- [x] Testes de categorias bíblicas e fluxo de capítulos aprovados (36/36 no Vercel)\n- [ ] Validar transições e responsividade com navegador real e duas contas autenticadas
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
