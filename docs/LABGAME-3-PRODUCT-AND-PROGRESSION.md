# LABGAME 3.0 — Jornada contínua, reconhecimento e formação cristã

**Data:** 14/10/2026 · **Status:** visão de produto aprovada conceitualmente pelo pedido; regras quantitativas de bônus de conclusão ainda **PROPOSTAS**, dependentes de confirmação e migração revisada.
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
- XP vitalício não é apagado quando um novo ciclo começa.
- **Proposta para aprovação:** bônus individual **adicional** de +10.000 XP ao terminar o 1º ciclo, +12.500 no 2º, +15.000 no 3º, +2.500 por ciclo subsequente. Esses números estão implementados **somente como cálculo ilustrativo puro**, não creditados. Atenção: o 1º ciclo já gera 11.890 XP por capítulos (fora os vídeos). Se 10.000 significar **total final** em vez de **bônus**, revisar esta regra antes de qualquer migração.
- Um `cycle_completion` terá chave de idempotência (`user_id`, `run_id`, `award_code`) e validação server-side de conclusão. O servidor deve aplicar bônus uma única vez em transação e reconciliar placar, evitando que reenvio, reload, múltiplas abas, dispositivo duplicado, erro ou reinício concedam bônus em dobro.
- Não tentar lançar bônus pelo cliente. Histórico imutável, auditoria e migração versionada com ensaio em staging antes de tocar produção. Resolver fórmula e controle de abuso antes da implementação.

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
- P2: confirmar semântica do bônus de 10.000 XP; projetar migração, idempotência e reconciliação antes de implantação.
- P3: criar currículo editorial de discipulado e teologia sistemática, estudo com respostas comentadas e revisões espaçadas.
- P3: artefatos de medalhas e temas originais com design tokens, progressão de acessibilidade e revisão UX com dispositivos reais.
