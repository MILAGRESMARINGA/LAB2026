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
- Rankings são acessíveis só a membros autenticados do GC. Não há divulgação pública de e-mails.

## Estudos e recursos
- Categorias: Pentateuco; históricos; poéticos; profetas maiores/menores; Evangelhos; Atos; cartas paulinas/gerais; literatura apocalíptica.
- Blocos: criação (Gênesis 1 × João 1), promessa, Lucas → Atos, profetas e história, Espírito Santo, salvação e nova vida.
- Estudos **não rendem os mesmos pontos de capítulos** e não autorizam avanço antecipado.
- Exegese por capítulo exige revisão teológica, literária, histórica e canônica; não publicar interpretações geradas automaticamente sem revisão.
- Playlist BibleProject de cada livro: **pendente de links enviados e verificados**.
- Texto integral no aplicativo: **depende de licença/edição apropriada**. A versão atual oferece confirmação da leitura em Bíblia impressa ou aplicativo externo.

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
- Gamificação: disputa **entre GCs** com métricas justas por tamanho, empates, consentimento e antiguidade de participação.
- Conteúdo: curadoria de exegese; textos bíblicos licenciados; vídeos BibleProject por livro; resumos teológicos verificados.
- Operação: monitoramento, backup, recuperação de senha, controle de dados pessoais, WCAG e notificações opt-in.
