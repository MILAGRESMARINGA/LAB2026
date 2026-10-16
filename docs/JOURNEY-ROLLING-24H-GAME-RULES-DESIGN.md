# LABGAME — Especificação de jogo: ativação móvel, carência, vidas e proteção de XP
**Status:** REGRA DE RELÓGIO DE 24 HORAS APÓS ATIVAÇÃO escolhida pelo responsável (16/10/2026); decisões indicadas como **PROPOSTA** ainda requerem confirmação; **NÃO PROGRAMADO NEM MIGRADO**.
**Escopo:** somente `lab-app/`, branch `lab-rebuild-2026`. P0/SQL de produção inalterados.

## 1. Objetivo
- Ler cada capítulo do plano integral 66 livros / 1.189 capítulos, em etapas de **3 ou 4 capítulos**, sem reduzir nem antecipar a carga diária.
- A Jornada é permanente, mas cada ciclo integral tem 365 ou 366 etapas, conforme calendário canônico a definir.
- Vídeos e estudos são módulos adicionais (XP independente), **não** pré-requisitos para próxima etapa.
- XP reflete atividades registradas, nunca santidade ou obediência espiritual.
- Um atraso não é uma leitura; uma vida **nunca cria leituras fictícias**.

## 2. Relógio escolhido — ativação por usuário, 24 h exatas

Um servidor confiável guarda timestamps UTC (instantes reais). O fuso exibido pode ser `America/Sao_Paulo`; intervalos de 24 h devem durar exatamente 24 h, sem confiar no relógio do cliente.

Estados propostos:
`LOCKED → READY → ACTIVE → COMPLETED`; atraso `ACTIVE → GRACE → LIFE_RECOVERY → (COMPLETED ou FAILED)`; `READY → START_OVERDUE → LIFE_RECOVERY ou FAILED`.

Para etapa N, com `activated_at = A`:
- Tempo normal de leitura: de `A` a `A+24h`; vencimento exato `A+24h`.
- Carência de conclusão: `(A+24h, A+30h]`; penalidade progressiva, sem penalidade repetida sobre o mesmo capítulo.
- A próxima etapa N+1 é elegível **somente quando**: (1) etapa N está completa com exatamente os capítulos previstos, (2) o instante atual é `>= A+24h` e (3) não existe tentativa expirando sem resgate. Se N encerrou durante a carência, N+1 pode ser ativada imediatamente porque já decorreram mais de 24 h desde A. Se N encerrou em 1 hora, aguardar outras 23 h.
- A etapa N+1 recebe seu **próprio prazo** `activated_at(N+1)+24h` ao clicar no botão autorizado. Renovar página, reabrir app ou mudar dispositivo não altera `activated_at`.
- Não permitir duas etapas ativadas com intervalo menor que 24 h, nem mais de uma ativa, nem pular capítulo ou antecipar etapas. O vínculo para reativação usa eventos autenticados e validação atômica no servidor.

### Exemplo
Segunda 06:00 ativa etapa 1; segunda 08:00 conclui a leitura; terça 06:00 etapa 2 está READY; terça 08:00 ativa etapa 2; quarta 08:00 prazo normal da etapa 2 termina; quarta 14:00 encerra carência. A mudança voluntária do horário real de ativação altera os próximos prazos, dentro das regras anti-pausa abaixo.

## 3. Evitar congelamento do relógio entre etapas (**necessário, ainda a homologar**)

**Falha inevitável do modelo ingênuo:** se o aplicativo só contar horas depois do clique e não limitar a espera entre desbloqueio e clique, um jogador pode ficar semanas sem ativar N+1 mantendo a tentativa e o recorde. Isso contraria o princípio de disciplina.

**PROPOSTA de mitigação:**
- A etapa READY tem `eligible_at` independente do clique, derivado da ativação anterior `A+24h`.
- Sem perda de vida, permitir ativar a próxima etapa em `[eligible_at, eligible_at+6h]`; após esse limite, registrar `START_OVERDUE`, consumir uma vida segundo a regra de resgate e exigir início dentro da janela adicional.
- Cada vida de resgate compra uma **janela adicional de 24 h** para iniciar/concluir a etapa vencida; cada nova janela adicional consome outra vida. O timer nunca para; `READY` nunca fica disponível por tempo ilimitado.
- O clique inicia o prazo de leitura `+24h` daquela etapa, MAS atraso para clicar não restaura vidas/recordes nem elimina o evento `START_OVERDUE`.
- A sequência premiada como "perfeita" deve distinguir **sem atraso/sem vidas** versus "continuidade de tentativa salva". Caso contrário atrasos repetidos de até 6 horas deslocariam uma jornada de 365 etapas para um ciclo com mais de 365×24 h.
- Se o participante já excedeu o limite e está ausente, o servidor reconstrói expiracões ocorridas em ordem cronológica em cada sincronização. Não utiliza temporizadores ou localStorage do cliente como autoridade.
- **Requer aceite explícito:** tolerância de 6h para ativar após READY; poderia ser 12h ou 24h, mas o efeito na disciplina/ritmo seria diferente.

## 4. XP e carência (**PROPOSTA de faixas, ainda não aprovada**)

- Capítulo confirmado pela primeira vez no **ciclo elegível**: +10 XP (fonte de verdade servidor). Não conceder XP por exibir, fechar aba ou duplicar confirmação.
- Até `A+24h`: sem penalidade.
- `A+24h < conclusão <= A+27h`: desconto de **3 XP**, no fechamento da etapa, uma única vez (resumo de XP da etapa, sem debitar premiação histórica de outros ciclos).
- `A+27h < conclusão <= A+30h`: desconto de **6 XP**, uma vez.
- Acima de 30h: proteção com vidas; a etapa deve ser concluída de verdade antes de avançar; XP tardio necessita faixa específica a confirmar, mas jamais deve gerar créditos infinitos.
- Vídeos confirmados validamente são +5 XP uma vez por recurso; estudos futuros terão ledger e pontuação próprios. Não obrigam o avanço da leitura.
- Se o capítulo gera +10 antes de fechar a etapa, penalidade de fechamento deve entrar no ledger como evento **único de ajuste**; `scorecard` reconcilia tudo de forma determinística, inclusive futuros bônus por Bíblia completa.
- Não permitir saldo negativo por etapa. Saldos globais são resultados de fontes verificadas; não editar XP diretamente no cliente.

## 5. Regra de vidas (**renovação mensal aprovada; cota e gatilho espiritual ainda em avaliação**)
- Padrão solicitado: três vidas mensais; ao consumir a terceira, o **próximo** vencimento sem vida encerra tentativa, retornando ao Gênesis/etapa 1; recordes e XP histórico preservados. Cada vencimento distinto consome no máximo uma vida em transação.
- **PROPOSTA:** a vida permite UMA extensão de 24h para concluir a etapa atual ou iniciá-la se ainda READY. Se não cumprir, outra janela cobra outra vida. Não existe resgate automático de capítulo não lido.
- Para impedir abuso na virada do mês, eventos de vencimento são processados em ordem cronológica, sem recomputar vidas retroativamente por alterar data/fuso, reabrir app ou redefinir sessão.
- **Cuidado com a Santa Ceia:** a mecânica de +3 vidas por declaração de participação e +1 vida por não participação ainda **NÃO ESTÁ APROVADA**. É autodeclaração não verificável, pode incentivar falsidade e inferir dado religioso sensível. Recomenda-se **3 vidas a todos** por mês e estudo devocional sobre Santa Ceia completamente opcional e separado de XP/vidas; confirmar com responsável antes de implementar.
- **REGRA APROVADA:** a virada do mês apenas **renova o saldo mensal de vidas disponíveis** (até a cota aprovada, sem acumulá-las). Ela **não reinicia o relógio de 24h**, **não zera a carência de 6h**, **não cancela penalidades**, **não perdoa eventos de vencimento anteriores** e **não reabre tentativas encerradas**. Saldo e mês calculados pelo servidor com fuso fixo da Jornada.
- Para cada **incidente de atraso**, registrar `occurred_at`, `period_key` (YYYY-MM no fuso fixo), `stage_id`, `incident_id`, consumo(s) de vida e vencimento(s) da(s) extensão(ões) em um ledger próprio. **Vidas do mês seguinte não podem financiar nem prolongar um incidente iniciado no mês anterior.** Um incidente em andamento mantém seu prazo e o orçamento de resgate do mês de origem, mesmo após a virada, enquanto estiver recuperável.
- **Precisão na virada:** se a etapa foi ativada em 31/10 às 22h, seu prazo normal termina em 01/11 às 22h e a carência em 02/11 às 04h. Não há falha automática às 00h de 01/11; caso venha a ocorrer um atraso pela primeira vez em novembro, ele pertence a novembro, não outubro.
- Se um incidente ocorreu em 31/10 às 23h, vidas de novembro **não** podem resgatá-lo nem renovar suas extensões. Mesmo sem o jogador abrir o app, a sincronização posterior deve processar eventos **na ordem de seus timestamps reais** e encerrar a tentativa quando faltarem vidas no período devido; nunca reagendar falhas para depois da virada.
- **Encerramento definitivo da tentativa:** se o quarto incidente exigir uma vida sem saldo no mês aplicável, a tentativa falha naquele instante, e permanece falha após 01/11. A nova tentativa inicia etapa 1 com 0 XP ativo, enquanto recordes e conquistas da tentativa encerrada ficam apenas na vitrine histórica, sem transferência para a nova sequência.
- **Nunca usar o mês de abertura do aplicativo** para determinar o saldo aplicável a um atraso antigo. Regra antifraude válida para offline, diferença de fuso, alteração do relógio local, sessões paralelas e reabertura após semanas.
- A melhor marca exibida só sobe quando etapas reais são concluídas. Recomendar exibir separadamente "sequência sem atrasos" e "etapas preservadas com vidas".

## 6. Pontuação por tentativa: marcas antigas são obstáculos, não saldo herdado (REGRA CONFIRMADA)

**Correção explícita do responsável em 16/10/2026:** em qualquer recomeço automático a tentativa nova entra na etapa 1 com **0 dias e 0 XP ativos**. Valores anteriores não são somados ou transferidos como saldo, medalha desbloqueada, sequência, vidas ou recompensa da nova tentativa; são preservados **somente no histórico e como recordes a superar**. A mesma regra vale para novas sequências após a conclusão normal de um ciclo: a nova sequência tem seu próprio progresso.

### Placar separado por escopo
- **Tentativa ativa:** `run_id`, `day`, `run_xp`, `run_streak`, marcos e medalhas **conquistados nesta tentativa**. Começa em 0 a cada tentativa nova.
- **Melhores marcas históricas:** `best_streak`, `best_run_xp` e vitrine de medalhas/coroas antigas como resultados arquivados. Não liberam recompensas na tentativa atual e não determinam a pontuação da nova sequência.
- **Histórico de estudos / Bíblias completas:** contadores verificáveis ao longo da conta (quantas Bíblias concluídas, quantos estudos concluídos) preservados ao recomeçar, porém **não convertidos em XP da nova tentativa**. A progressão de estudos pode ter seu próprio escopo, independente do desafio de leitura.
- **Reset total por solicitação:** zera tanto tentativa ativa quanto histórico de melhores marcas, XP arquivado, Bíblias, estudos, coroas e medalhas; única ação que efetivamente elimina essas barreiras históricas.
- **Exibir:** "XP nesta tentativa" e "Seu recorde de XP" em contextos diferentes; nunca mostrar a soma vitalícia como se fossem XP ganhados **na sequência atual**.

### Antifraude e economia de XP
- Cada capítulo obrigatório pode render +10 XP **uma vez por tentativa, dentro da etapa e horário autorizados**, inclusive se o participante precisar relê-lo depois de uma tentativa interrompida. Assim há incentivo real na nova sequência.
- A unicidade é `(run_id,day_number,chapter_id)` para confirmação + um ledger de recompensa vinculado à mesma `run_id`. Repetição da mesma confirmação, corrida entre dois aparelhos e troca de relógio nunca premiam outra vez **na mesma tentativa**.
- **Nunca somar XP de tentativas interrompidas para classificar o participante, elevar níveis/medalhas atuais ou disparar bônus de nova sequência.** Em lugar de `SUM(all runs)`, os indicadores competitivos são `current_run_xp` e `best_run_xp` como recorde; cada tentativa arquivada guarda os próprios eventos de XP por auditoria.
- Um jogador que reinicia Gênesis 1 cem vezes não poderá elevar sua **melhor marca** além dos +10 por capítulo de sua tentativa com mais pontos, nem desbloquear medalhas do novo desafio por XP de tentativas arquivadas. A nova tentativa ainda terá XP legítimo pelas leituras que efetivamente realizou.
- Os bônus progressivos por Bíblia concluída (+10.000/+12.500/...) ficam **associados ao ciclo integral efetivamente concluído**, jamais são herdados como saldo inicial da próxima sequência. São preservados como conquistas no histórico com o contador vitalício de Bíblias.
- Os +5 XP de vídeo e eventuais XP de estudo devem ter **escopo explícito** (tentativa ativa, curso, ou ciclo) e unicidade por evento; vídeo reassistido dentro da mesma tentativa não gera pontos repetidos. Não considerar XP de estudo permanente como XP de leitura para desbloquear dias.
- **A implementação atual NÃO cumpre esta separação:** `lab_game_stats.total_xp` é soma vitalícia de capítulos/vídeos. O código de bônus anual preparado também usa saldo acumulado. Antes de ativar essas regras, precisamos refatorar scorecard, migração de prêmios, rankings individuais/coletivos e interface para expor ambos os escopos sem quebrar eventos existentes.
- Não alterar schema/SQL de produção até migração versionada, inventário do legado e ensaios com duas contas em staging.

## 7. Integralidade e ano bissexto

- 1.189 capítulos em 365 dias: 271 etapas de 3 e 94 etapas de 4.
- 1.189 capítulos em 366 dias: 275 etapas de 3 e 91 etapas de 4.
- O código atual fixa `GAME_DAYS=365`; `verifyGamePlan()` permite etapas de 1 a 4 e ainda NÃO exige 3–4. Validar plano bíblico canônico e distribuição antes de modificar cronograma.
- Com ativações móveis de 24h, "ciclo de 365 etapas" não necessariamente termina em 365 dias civis se houver atraso tolerado ou vidas consumidas. Não anunciar "Bíblia inteira exatamente em 365 dias de calendário" quando o relógio rolante puder estender o ciclo.
- Para 366, definir versão canônica separada e critério de elegibilidade (por ano civil de início? pelo calendário que inclui 29/02? escolha manual antes de começar?). Não inventar um 366º dia no plano atual.
- O aplicativo usa São Paulo como referência em código para vários cálculos; tempos rolantes devem ser guardados em instantes UTC para evitar relógios diferentes e horário de verão, com timezone estável para renovação mensal de vidas.

## 7A. Testes obrigatórios — virada do mês (aprovado)

1. **Saldo não acumulativo:** 2 vidas restantes em outubro, cota de novembro restaurada ao valor mensal; saldo de outubro não soma ao de novembro para novos incidentes.
2. **Prazo ativo atravessando o dia 1º:** etapa 31/10 22h → vence 01/11 22h → carência acaba 02/11 04h; não cobrar vida na virada.
3. **Falha de outubro ainda aberta em novembro:** débito e extensões usam o saldo de outubro; não consumir vidas novas de novembro para o mesmo incidente.
4. **Falha de outubro já fatal:** tentativa encerrada em outubro continua encerrada no dia 1º, com `run_xp=0` ao iniciar outra; histórico é só referência.
5. **Ausência prolongada/offline:** o backend reconstrói prazos cronologicamente e aplica consequências retroativamente à hora **real** do vencimento, sem lançar etapas fictícias nem alterar períodos.
6. **Duas sessões simultâneas:** ledger e lock garantem um único débito por evento e impedem despesas duplicadas/reabertura por corrida.
7. **Desconto de XP:** um vencimento de prazo e carência existente não perde nem recupera penalidade no primeiro dia do mês.

## 8. Questões que exigem decisão ANTES de implementar
1. **Antecipação versus congelamento:** aprovar janela de ativação de até **6 horas depois de READY**, seguida de consumo de vidas? A carência de leitura e a carência de ativação são conceitos diferentes.
2. **Vidas:** três mensais para todos, sem Santa Ceia como requisito? Qual XP para leitura concluída na janela de vida?
3. **Recordes:** ter dois contadores (sequência perfeita e progresso salvo com vidas), mantendo XP e quantidade histórica de Bíblias?
4. **Antifraude / ranking:** a regra agora é XP por tentativa sem soma entre tentativas; detalhar scorecard, XP de estudos/vídeos e tratamento de recompensas de Bíblias concluídas em histórico antes de migrar.
5. **Ano bissexto:** qual regra de adesão para 366 etapas em jornada iniciada em datas móveis?

## 9. Gate técnico
- Estado atual do backend: `lab_game_sync()` calcula dia por **DATA CIVIL** (`started_on` e `now() at time zone 'America/Sao_Paulo'`) e reinicia quando há quebra. Não implementa 24h a partir da ativação, carência de 6h nem vidas. Essas regras são **proposta de alteração incompatível com a lógica atual** e exigem migração versionada, estratégia de dados existentes e testes transacionais.
- **Nenhuma alteração em SQL, RPC, XP ou cronômetro de produção está autorizada por este documento.** Revisar backups, staging, testes de 2 contas e gates P0 antes de qualquer migração.
