# LABGAME 3.0 — Jornada contínua, reconhecimento e formação cristã

**Data:** 14/10/2026 · **Status:** bônus adicional de +10.000 XP no primeiro ciclo e acréscimos de +2.500 XP por ciclo seguinte **APROVADOS pelo responsável**; migração e creditamento ainda **NÃO APLICADOS ao banco real**, dependentes de homologação em staging, aceite de segurança e restauração.
**Escopo:** projeto LABGAME exclusivamente, branch `lab-rebuild-2026`, aplicativo `lab-app/`. Nenhuma alteração deste documento autoriza execução de SQL no Supabase de produção.

## Missão
**Palavra → disciplina → constância → estilo de vida → cultura de vida bíblica.**
A Bíblia é o mapa e a bússola da aprendizagem; a comunidade oferece apoio mútuo; a gamificação cria passos claros, revisões e encorajamento. Pontos representam atividades verificadas, **não** santidade, mérito perante Deus, fé ou concessão de dons.

## Trilhas de produto
1. **Jornada** (home principal): desafio diário da Bíblia completa, progresso 365 etapas, mapa interativo, baús Talentos e marcos, coroa simbólica ao concluir. Novos ciclos anuais poderão ser iniciados voluntariamente no dia posterior à conclusão, sem apagar o histórico.
2. **Estudos**: formação bíblica contínua por módulos, com leituras, mapas históricos, perguntas, revisões espaçadas, aplicação prática e testes de compreensão. Conteúdo preparado e revisado editorialmente.
3. **Bíblia**: leitura livre, busca de versículos, capítulos, favoritos e referências; sem XP de desafio.
4. **GCs**: discipulado, convites, liderança, constância coletiva e missões de grupo.
5. **Perfil**: inventário de XP pessoal verificado, medalhas, recordes, ciclos completos, consentimento e preferências.
Navegação final: **Jornada → Estudos → Bíblia → GCs → Perfil**. A rota de leitura diária sai da Jornada, sem aba separada Hoje.

## Placar pessoal — atual vs expansão
**Atual e obrigatório:** +10 XP por capítulo validado pelo servidor (apenas capítulo da etapa e data atuais), +5 XP por panorama elegível com idempotência. Nenhum clique isolado ou conteúdo livre autoriza novos XP de leitura.
**Nova apresentação, implementada sem SQL:** medalhas a partir do **XP pessoal confirmado**, nunca a partir do GC:
- 1.000 XP: **Alcance Supremo I** — bronze, chama brasa;
- 2.500 XP: **Alcance Supremo II** — prata, chama acesa;
- 5.000 XP: **Alcance Supremo III** — ouro, chama constante;
- 10.000 XP: **Alcance Supremo IV** — diamante, chama radiante.
Esses títulos refletem somente consistência no uso do app; não são títulos espirituais. Chama é **elemento visual de constância**.

## Placar do GC — independente
- A classificação semanal atual calcula dias completos dos integrantes que consentiram ÷ (7 × integrantes que consentiram); participação em liga é voluntária e GC elegível tem pelo menos três integrantes que consentiram.
- **100% de constância semanal** => insígnia visual coletiva, calculada do resumo validado no servidor; já pode ser exibida **sem** crédito de XP.
- **1.000 XP coletivos** => medalha/efeito visual do GC (**PENDENTE**). O banco atual não expõe um saldo confiável `group_xp`. Não somar `user.total_xp` vitalício de participantes novos nem conceder pontuação pessoal extra.
- O GC necessita de **livro-caixa separado** para XP atribuídos exclusivamente a eventos elegíveis durante a participação no grupo, e sem duplicação. Definir regras de entrada/saída, consentimento, múltiplos GCs e temporadas antes de implantar. Pontuação coletiva não deve inflar XP individual; quando possível, o progresso de cada pessoa contribui para o GC sem transferir/debitar créditos da conta pessoal.
- Medalha de 100% e medalha de 1.000 XP não são intercambiáveis: uma mede proporção de constância, outra mede volume de atividade verificada.

## Conquista dupla — Alcance Supremo em Comunhão
- **Implementação atual em interface:** quando o usuário atinge **1.000 XP pessoais confirmados** e seu GC obtém **100% de assiduidade na janela móvel dos últimos sete dias**, com pelo menos **3 participantes consentidos**, a tela do GC exibe a medalha visual **Alcance Supremo em Comunhão**.
- A medalha combina **dois feitos independentes**, sem soma, débito, transferência ou premiação extra de XP entre pessoal e grupo.
- O cálculo utiliza `lab_game_scorecard` (ou XP pessoal retornado por `lab_game_sync`) e `lab_game_group_summary`. A condição do GC é **semanal e dinâmica**; até termos eventos persistidos, não anunciamos uma medalha histórica permanente por uma semana antiga.
- A variante alternativa com **1.000 XP coletivos** já está especificada na regra pura, mas o backend atual não disponibiliza uma contagem coletiva confiável: essa via **não aparecerá na UI** até existir um ledger autenticado e auditável.
- A chama especial e a medalha são símbolos de empenho registrado no aplicativo, nunca classificação de maturidade espiritual.
- A conquista dupla é acessível no **Perfil do GC** do participante, não nos perfis privados de terceiros sem autorização.

## Jornada sem fim — conclusão anual
A integridade do ciclo permanece: **66 livros / 1.189 capítulos / 365 etapas**. O tempo de leitura anual é apenas um ciclo de uma jornada vitalícia.
- Concluir: coroação **simbólica**, medalha com número do ciclo e histórico pessoal preservado.
- No dia seguinte, permitir novo ciclo voluntário; não liberar etapas futuras ou duplicar XP no dia da conclusão.
- **XP da nova sequência é sempre 0 no início:** leituras e recompensas da sequência anterior **não são somadas à próxima**. Pontos, medalhas e coroas das sequências encerradas são preservados **no histórico pessoal como recordes e marcos a superar**, não como créditos ativos do próximo desafio.
- **Regra aprovada em 14/10/2026:** bônus individual **adicional** de +10.000 XP ao terminar o 1º ciclo, +12.500 no 2º, +15.000 no 3º, e +2.500 de incremento a cada novo ciclo. A leitura integral já rende 11.890 XP por capítulos (fora vídeos), portanto ao final do primeiro ciclo o saldo será **21.890 XP + XP de vídeos**, sem considerar pontuação histórica de tentativas anteriores. A migração SQL está **preparada, não aplicada ao Supabase**, e só pode ser promovida após homologação e gate de segurança.
- Um `cycle_completion` terá chave de idempotência (`user_id`, `run_id`, `award_code`) e validação server-side de conclusão. O servidor deve aplicar bônus uma única vez em transação e reconciliar placar, evitando que reenvio, reload, múltiplas abas, dispositivo duplicado, erro ou reinício concedam bônus em dobro.
- Não tentar lançar bônus pelo cliente. Histórico imutável, auditoria e migração versionada com ensaio em staging antes de tocar produção. Resolver fórmula e controle de abuso antes da implementação.

## Regra irrevogável de progresso: ausência ≠ reset voluntário

**Confirmado pelo responsável em outubro de 2026.** Existem **três situações distintas**, e nenhuma opção de zerar apenas o dia:

1. **Falta de leitura (automática):** o participante perdeu o prazo exigido. Ao voltar, a tentativa corrente é arquivada e o próximo desafio passa à etapa 1 **com 0 XP e 0 dias na nova sequência**, sem recuperar o período perdido. Melhores marcas, pontos e prêmios históricos da tentativa anterior **permanecem como registros a superar**, não entram no saldo da nova sequência. Bíblias completas e estudos concluídos permanecem contabilizados no histórico da conta.
2. **Superar o próprio recorde:** exemplo: sequência máxima antiga 265 dias. Na nova tentativa, após completar 266 dias, o único número mostrado como **melhor recorde** passa de 265 para 266. Histórico auditável das tentativas permanece, mas 265 deixa de ser o melhor recorde vigente. Se não houver leitura por três dias após concluir apenas um, a contagem de dias lidos nunca se torna três; a nova tentativa abre no dia 1 e o recorde máximo continua sendo um.
3. **Zerar absolutamente tudo (decisão expressa):** qualquer participante autenticado pode solicitar operação excepcional, irreversível e **protegida no servidor** para apagar TODOS os seus registros de progresso e pontuação (inclusive tentativas anteriores, XP de leitura/vídeos/estudos, recordes, Talentos, medalhas, Bíblias completas, coroas, bônus anuais de 10 mil XP e incrementos posteriores). O app reinicia com **dia 1, 0 XP, recorde 0, Bíblias concluídas 0 e estudos concluídos 0**. Nome, login, consentimentos, notificações, dados cadastrais e filiação a GC permanecem. Itens pessoais de leitura livre que não representam progresso (ex.: favoritos) podem ser mantidos, com aviso prévio transparente.
4. **Excluir conta** é um fluxo diferente do reset: após processamento real, uma nova conta não herda progresso, conquistas ou pontos da antiga. Tratar administradores de GC e retenção legal antes da exclusão.

Para evitar perda acidental, só o **reset total** exige modal de consequências + aceite + digitar `ZERAR` + confirmação recente de identidade; **exclusão de conta** tem confirmação separada com `EXCLUIR`. Nenhuma dessas operações ocorre pela simples abertura de um menu. Sempre recalcular rankings coletivos sem apagar méritos de outros integrantes.

**Status técnico:** regra documentada, porém **reset total e autodeleção ainda NÃO implementados como RPC/endpoint no backend e NÃO ativados em produção**. Só implementar após revisão transacional em staging, gestão dos vínculos GC, ledger anual, vídeo/estudo e P0.

## Regra de pontuação aprovada: XP atual ≠ recorde histórico

**Esclarecimento do responsável (16/10/2026):** nenhum XP, medalha, vida ou progresso de uma tentativa encerrada pode ser **carregado ou acumulado na tentativa seguinte**. No recomeço, a Jornada exibe `Etapa 1 | XP atual: 0 | Melhor recorde: 265 dias` (exemplo). Depois de 266 etapas reais, passa a exibir `Melhor recorde: 266 dias`. Os valores e prêmios da antiga tentativa ficam na coleção de conquistas, como metas a superar. O histórico de Bíblias completas e estudos permanece no perfil, sem ser convertido em pontos do novo desafio.

- **XP da tentativa:** ganho por capítulos válidos naquela `run_id`; zerado ao iniciar nova tentativa. Medalhas atuais são conquistadas novamente conforme pontos desta tentativa.
- **Recordes:** `best_days` e `best_run_xp` representam máximos históricos do participante, não saldos transferíveis.
- **Histórico de conquistas:** medalhas, Talentos, coroas, bônus e contagem de estudos/ciclos registrados por tentativa/ciclo, consultáveis mas não reutilizáveis no desbloqueio da nova Jornada.
- **Antifraude:** não somar XP de dez tentativas falhadas no ranking, nem usar `lab_game_stats.total_xp` como XP de tentativa. Ganho de +10 por capítulo precisa ser único dentro da tentativa, mesmo que o capítulo já tenha sido lido numa tentativa antiga. O recorde de XP só sobe por desempenho superior **numa tentativa individual real**.
- **Reset total:** além de zerar a tentativa, remove todo esse histórico de recordes, pontos e conquistas.
- **Status da implementação:** `lab_game_stats.total_xp` atual soma XP entre tentativas; também há SQL de bônus anual preparado com scorecard acumulado. Ambos requerem nova modelagem e migração auditada antes desta regra entrar em vigor. **Não ativar os novos bônus sem resolver a separação de saldos.**

## Formação espiritual — conteúdo, não julgamento de fé
- **Fundamentos para novos convertidos:** quem é Jesus; salvação pela graça; Bíblia; oração; arrependimento e fé; batismo; comunidade e igreja; vida de discípulo; missão, generosidade e serviço.
- **Teologia sistemática, módulo por módulo:** bibliologia; teologia própria; cristologia; pneumatologia; antropologia; hamartiologia; soteriologia; eclesiologia; escatologia. Distinguir interpretações doutrinárias quando houver diferenças cristãs significativas, com revisão pastoral e citações bíblicas.
- **Vida e caráter cristão:** bem-aventuranças, Sermão do Monte, fruto do Espírito (Gl 5:22–23), ética nas relações, família, trabalho, mordomia, oração, discipulado e aplicação cotidiana. Perguntas práticas são convite à reflexão, não fiscalização de intimidade.
- **Dons espirituais (1Co 12–14):** material educacional sobre serviço e edificação do corpo; o app nunca atribui dons, unção ou autoridade espiritual por desbloqueio, medalhas ou quizzes.
- Quizzes formativos podem dar feedback e reforçar compreensão; eventual XP de estudo exige modalidade distinta, limites e validação server-side. Não equiparar pontuação de estudos à leitura anual nem premiar simplesmente assistir vídeos sem confirmação robusta.
- Estudos automáticos de IA, se usados, precisam fontes identificadas, revisão editorial e consentimento. Revisar direitos de conteúdos externos — inclusive condições **não comerciais** do BibleProject — antes de comercializar o LABGAME.

## Critérios de aceite
1. XP pessoal não altera placar de GC diretamente e pontuação de GC não credita XP individual.
2. Evento de leitura/estudo idempotente, com fonte de verdade no servidor e política anti-fraude.
3. GC com 2 consentimentos nunca recebe insígnia de 100%, mesmo matematicamente perfeito.
4. GC com 3 integrantes e 21/21 dias registrados na semana recebe insígnia visual; nenhum XP extra é lançado.
5. A interface não exibe 1.000 XP de grupo sem valor confirmado por API do servidor.
6. 1.000 XP pessoais exibem Alcance Supremo I. Recarregar a tela não gera nova premiação.
7. Cada ciclo anual confirmado tem no máximo um bônus creditado, após aprovação da fórmula e testes de concorrência.
8. Medidas de constância não representam salvação, frutos reais da vida cristã ou presença/ação do Espírito Santo.
9. Não enviar dados pessoais de participantes/menores a placares públicos sem consentimento e políticas LGPD.
10. Homologar visual mobile, contraste, acessibilidade e contas reais antes do lançamento.

## Próximas entregas
- P1: transformar a aba Jornada na home principal e mover Bíblia depois de Estudos; manter leitura do dia como subfluxo.
- P1: corrigir mapeamento e ordem dos vídeos do Novo Testamento, sem repetição genérica indevida de Mateus; respeitar as licenças.
- P1: consolidar medalhas pessoais e marco 100% do GC no frontend **sem SQL de produção**; testes e CI.
- P2: especificar e validar livro-caixa de XP coletivo; temporadas, participação múltipla e histórico.
- P2: bônus de conclusão já aprovado e migração SQL preparada em `202610140001_annual_cycle_completion_awards.sql`; pendente validar em PostgreSQL isolado/staging, repetição/concorrência, idempotência, RLS, ledger e reconciliação antes de implantação.
- P3: criar currículo editorial de discipulado e teologia sistemática, estudo com respostas comentadas e revisões espaçadas.
- P3: artefatos de medalhas e temas originais com design tokens, progressão de acessibilidade e revisão UX com dispositivos reais.

## Implementação do bônus anual — estado em 14/10/2026
- **Regra formal aprovada:** `bonus_xp(ciclo) = 10000 + (ciclo-1)*2500` (somente ciclos concluídos).
- **Código preparado:** migração `lab-app/supabase/migrations/202610140001_annual_cycle_completion_awards.sql` cria livro-caixa próprio com unicidade por `run_id`, RLS e função `lab_game_confirm_chapter` transacional. Exige conferência integral dos 1.189 capítulos da versão 1.
- **Proteção contra duplicação:** trava `lab_game_stats` por usuário através de `lab_game_sync`, valida status do ciclo no servidor, conta somente ciclos concluídos, insere uma única vez por `run_id` e credita o bônus na mesma transação.
- **Contabilidade:** `lab_game_scorecard` somará leitura (10/capítulo) + vídeos (5/panorama elegível) + bônus de conclusão registrados. Exporá `cycle_bonus_xp`, `completed_cycles` e `cycle_awards` com histórico individual; o Perfil só exibe recompensas confirmadas pelo servidor.
- **Histórico anterior:** nenhuma premiação retroativa automática. Ciclos completos anteriores à migração, se houver, requerem inventário, verificação e decisão explícita de backfill em migração separada.
- **GC:** bônus individual não altera XP coletivo, assiduidade da liga nem insígnias coletivas.
- **Restrição atual:** teste de SQL contra banco isolado/staging e revisão do security engineer **ainda não executados**. Projeto de produção permanece inalterado.
- **Aceite:** seguir `docs/ANNUAL-CYCLE-AWARDS-RELEASE.md` e validar `lab-app/scripts/sql/annual-cycle-awards-post-migration-check.sql`, além do gate P0 anterior.
