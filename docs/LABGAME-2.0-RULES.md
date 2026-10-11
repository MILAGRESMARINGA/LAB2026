# LABGAME 2.0 — Regras, arquitetura e critérios de aceite

## Identidade
Aplicativo de leitura bíblica integral gamificada, individual e em grupo de crescimento (GC).
**Integridade bíblica**: 66 livros, 1.189 capítulos, sem omissão e sem duplicação no plano.
A apresentação usa mecânicas de progressão de jogos educativos, sem copiar mascotes, marcas, arte ou interfaces proprietárias.

## Modalidade competitiva
- **365 etapas consecutivas** contadas da data de início individual, inclusive em anos bissextos.
- **Máximo de 4 capítulos por dia**, sem antecipações, sem acúmulo e sem compensação retroativa.
- Etapa 1: **Gênesis 1 / Salmos 1 / João 1**.
- Cada capítulo rende **10 XP por confirmação válida**. Reenvio idempotente não pontua novamente.
- A etapa só termina depois de **todos os capítulos daquele dia** estarem confirmados, em qualquer ordem dentro do próprio dia.
- O calendário competitivo adota, na versão 1, a janela 00:00–23:59:59 de **America/Sao_Paulo**, calculada pelo **servidor**, não pelo relógio do aparelho.
- No dia seguinte à última etapa completa, desbloqueia-se a etapa seguinte. O usuário nunca pode registrar capítulos do futuro.
- Se uma etapa não for concluída até a virada do dia, a tentativa termina, e a próxima tentativa começa na **etapa 1** ao retornar.
- A melhor sequência de etapas completas (**recorde pessoal**) permanece após a falha, bem como histórico e XP acumulados. Os capítulos de uma tentativa perdida **não geram atalhos** para a próxima.
- Ao concluir as 365 etapas, a jornada fica concluída até que o usuário decida iniciar um novo ciclo. Novo ciclo só pode ser aberto **a partir do dia seguinte**, para impedir etapas extras no mesmo dia.
- **Acesso individual ou por GC**: a mesma leitura e o mesmo mecanismo de disciplina servem aos dois; entrar/sair de GC não altera a tentativa individual.

## Distribuição do plano imutável v1
- Capítulos do Antigo Testamento distribuídos em sequência, exceto Salmos.
- Salmos em uma trilha poética paralela, sem repetição artificial.
- Trilha do Novo Testamento começa por João, depois Mateus, Marcos, Lucas, Atos, cartas e Apocalipse. Lucas e Atos ficam juntos.
- Os livros seguem internamente sua sequência integral, e o motor garante no máximo 4 capítulos diários.
- O plano de leitura é congelado por versão e replicado no banco em `lab_game_plan_chapters`. Nenhuma revisão posterior pode reordenar a leitura de quem estiver em um ciclo antigo sem migração/versionamento.

## Chama e recompensas
- Chama apagada/baixa/crescente/forte representa somente **constância registrada**, nunca presença do Espírito Santo, grau de espiritualidade ou aceitação de Deus.
- Marcos iniciais: 1, 7, 30, 100, 180 e 365 dias. Comparações sociais têm caráter voluntário.
- A classificação atual do GC usa **melhor sequência**, seguida de dias acumulados e XP; somente participantes com `leaderboard_opt_in=true` aparecem.
- Rankings individuais são acessíveis apenas a membros autenticados do respectivo GC. Não há divulgação pública de e-mails.
- **Liga entre GCs**: somente líderes podem inscrever seus grupos. A liga exibe apenas estatísticas agregadas e admite GCs com pelo menos 3 membros que consentiram em aparecer nos rankings.
- **Pontuação coletiva semanal**: dias completos confirmados nos últimos 7 dias por participantes que consentiram, divididos por `7 × total de integrantes do GC` (porcentagem). Não há vantagem automática por número absoluto de integrantes.
- Apenas integrantes de algum GC inscrito podem consultar a liga. A participação é reversível pelo líder; a exibição individual depende das preferências de cada pessoa.
- XP de vídeos não influencia a pontuação da liga. GCs que ingressarem no meio da semana entram na mesma janela móvel, sem compensação retroativa.

## Estudos e recursos
- Categorias: Pentateuco; históricos; poéticos; profetas maiores/menores; Evangelhos; Atos; cartas paulinas/gerais; literatura apocalíptica.
- Blocos: criação (Gênesis 1 × João 1), promessa, Lucas → Atos, profetas e história, Espírito Santo, salvação e nova vida.
- Estudos e leitura livre de capítulos **não concedem os 10 XP diários** e não autorizam avanço antecipado.
- A aba Bíblia permite consultar qualquer capítulo da Almeida 1911 e guardar favoritos privados; essas ações não pontuam.
- Vídeos de panorama do BibleProject concedem **5 XP extra por vídeo único**, com confirmação pessoal após uma sessão mínima de 90 segundos. Não substituem capítulos nem avançam etapas. A confirmação de visualização não constitui prova automática de reprodução integral.
- Exegese por capítulo exige revisão teológica, literária, histórica e canônica; não publicar interpretações geradas automaticamente sem revisão.
- Playlists BibleProject do AT e do NT já integradas, com recursos oficiais associados aos 66 livros. Parte dos panoramas possui vídeo individual embutido; os demais usam a playlist oficial dentro do player.
- Texto integral disponível no Supabase e no leitor do aplicativo: **Almeida de 1911** (domínio público, grafia histórica), com 66 livros e 1.189 capítulos. Outras traduções dependem de licença expressa.

## Critérios técnicos de aceite
1. Testes garantem 365 dias, 1.189 capítulos distintos, máximo de 4 por etapa, primeiro dia correto e ordem interna dos livros.
2. A função PostgreSQL `lab_game_confirm_chapter` não permite capítulos adiantados, retroativos ou estranhos à etapa, mesmo por chamadas diretas à API.
3. Pontuação não duplica após reenvio; conclusão de etapas e recorde são atualizados transacionalmente.
4. Falta total ou parcial provoca reinício no dia 1; recorde não cai.
5. Dois usuários distintos não conseguem ler/escrever dados privados um do outro (RLS + GRANT), e convite de GC não expõe credenciais.
6. Usuário que concluiu 365 dias não começa outro ciclo por recarregar a página nem no mesmo dia da conclusão.
7. Fluxo móvel deve ser testado em navegadores reais e em pelo menos dois usuários autenticados.

## Próximos ciclos
- QA: testes PostgreSQL simulando datas e perfis de duas contas; E2E em navegador.
- Produto: opção de entrar em desafio individual ou GC, perfil, onboarding persistido, calendário com possibilidade de escolher GC.
- Gamificação: liga de GCs implementada por resultados semanais agregados; pendentes temporadas fechadas, antiguidade de participação, períodos parciais e desempates editoriais.
- Conteúdo: curadoria de exegese; futuras traduções licenciadas; vinculação de vídeos individualizados restantes; resumos teológicos verificados.
- Operação: monitoramento, backup, recuperação de senha, controle de dados pessoais, WCAG e notificações opt-in.

## Biblioteca, favoritos e atribuição
- A leitura livre é acessível sem cadastro; para salvar favoritos é necessário login.
- Os favoritos têm RLS por usuário em `lab_bible_favorites`, sem escrita anônima.
- A Bíblia de 1911 mantém ortografia histórica, sem modernização automática.
- Incorporar conteúdos BibleProject somente conforme condições não comerciais, preservando os créditos e o acesso à fonte original. Veja `docs/BIBLE-DATA-AND-MEDIA.md`.
