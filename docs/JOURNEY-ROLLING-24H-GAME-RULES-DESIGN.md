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

## 5. Regra de vidas (**parte de negócio ainda em avaliação**)
- Padrão solicitado: três vidas mensais; ao consumir a terceira, o **próximo** vencimento sem vida encerra tentativa, retornando ao Gênesis/etapa 1; recordes e XP histórico preservados. Cada vencimento distinto consome no máximo uma vida em transação.
- **PROPOSTA:** a vida permite UMA extensão de 24h para concluir a etapa atual ou iniciá-la se ainda READY. Se não cumprir, outra janela cobra outra vida. Não existe resgate automático de capítulo não lido.
- Para impedir abuso na virada do mês, eventos de vencimento são processados em ordem cronológica, sem recomputar vidas retroativamente por alterar data/fuso, reabrir app ou redefinir sessão.
- **Cuidado com a Santa Ceia:** a mecânica de +3 vidas por declaração de participação e +1 vida por não participação ainda **NÃO ESTÁ APROVADA**. É autodeclaração não verificável, pode incentivar falsidade e inferir dado religioso sensível. Recomenda-se **3 vidas a todos** por mês e estudo devocional sobre Santa Ceia completamente opcional e separado de XP/vidas; confirmar com responsável antes de implementar.
- Ao entrar em um mês novo, o saldo é restaurado à cota mensal sem acumular 6, 9 ou 12 vidas; não há transferência de sobra. A cota do mês e o período devem ser calculados no servidor.
- A melhor marca exibida só sobe quando etapas reais são concluídas. Recomendar exibir separadamente "sequência sem atrasos" e "etapas preservadas com vidas".

## 6. Antifraude crítico: recompensar capítulos repetidos após reinício automático

**Fragilidade concreta do esquema atual:** `lab_game_chapter_checks` tem unicidade **(run_id,day_number,chapter_id)**. O servidor credita +10 a cada nova confirmação na run; ao falhar após a etapa 1 e iniciar uma run nova, poderia conceder +10 outra vez por Gênesis 1, mesmo sem concluir a Bíblia. O sistema atual não garante unicidade de XP por capítulo ao longo de tentativas interrompidas.

**REGRA RECOMENDADA para corrigir, sujeita a decisão de economia:**
- Uma `progress_generation` ou `cycle_generation` identifica a fase entre duas Bíblias integralmente concluídas.
- Cada capítulo é exigido novamente em uma tentativa interrompida, mas **só rende XP uma vez por geração/ciclo válido**: `UNIQUE(user_id, progress_generation, chapter_id, reward_kind)`.
- O usuário que perder no dia 265 recomeça lendo Gênesis, mas não ganha novamente XP pelos capítulos já recompensados nessa geração até ultrapassar o marco anterior; seu histórico e recorde permanecem. Isso impede fazenda de XP repetindo dia 1.
- Depois de completar os 1.189 capítulos, pode iniciar novo ciclo: nova geração elegível para pontuar capítulos de novo e conquistar nova coroa/bonus com crédito único.
- "Zerar tudo" autorizado apaga todas as gerações, XP, coroas e recordes, reinicia em 0. Não usar reset para criar XP fictício. Ao excluir conta, conta nova não herda XP anterior.
- Leituras do mesmo capítulo dentro de uma run atual permanecem idempotentes; recompensas anuais precisam também `UNIQUE(user_id,run_id)` e transação atômica, como especificado em migração pendente.
- Revisar cuidadosamente o cálculo de XP de vídeos: preservar unicidade por recurso dentro da geração e não liberar infinitos XP ao reiniciar tentativas.
- Criar testes de concorrência, 2 contas, falha/vida, reset voluntário e reconciliação do scorecard em PostgreSQL isolado.

## 7. Integralidade e ano bissexto

- 1.189 capítulos em 365 dias: 271 etapas de 3 e 94 etapas de 4.
- 1.189 capítulos em 366 dias: 275 etapas de 3 e 91 etapas de 4.
- O código atual fixa `GAME_DAYS=365`; `verifyGamePlan()` permite etapas de 1 a 4 e ainda NÃO exige 3–4. Validar plano bíblico canônico e distribuição antes de modificar cronograma.
- Com ativações móveis de 24h, "ciclo de 365 etapas" não necessariamente termina em 365 dias civis se houver atraso tolerado ou vidas consumidas. Não anunciar "Bíblia inteira exatamente em 365 dias de calendário" quando o relógio rolante puder estender o ciclo.
- Para 366, definir versão canônica separada e critério de elegibilidade (por ano civil de início? pelo calendário que inclui 29/02? escolha manual antes de começar?). Não inventar um 366º dia no plano atual.
- O aplicativo usa São Paulo como referência em código para vários cálculos; tempos rolantes devem ser guardados em instantes UTC para evitar relógios diferentes e horário de verão, com timezone estável para renovação mensal de vidas.

## 8. Questões que exigem decisão ANTES de implementar
1. **Antecipação versus congelamento:** aprovar janela de ativação de até **6 horas depois de READY**, seguida de consumo de vidas? A carência de leitura e a carência de ativação são conceitos diferentes.
2. **Vidas:** três mensais para todos, sem Santa Ceia como requisito? Qual XP para leitura concluída na janela de vida?
3. **Recordes:** ter dois contadores (sequência perfeita e progresso salvo com vidas), mantendo XP e quantidade histórica de Bíblias?
4. **Antifraude:** aprovar XP único por capítulo por geração/ciclo integral, evitando repetições remuneradas após tentativas falhadas?
5. **Ano bissexto:** qual regra de adesão para 366 etapas em jornada iniciada em datas móveis?

## 9. Gate técnico
- Estado atual do backend: `lab_game_sync()` calcula dia por **DATA CIVIL** (`started_on` e `now() at time zone 'America/Sao_Paulo'`) e reinicia quando há quebra. Não implementa 24h a partir da ativação, carência de 6h nem vidas. Essas regras são **proposta de alteração incompatível com a lógica atual** e exigem migração versionada, estratégia de dados existentes e testes transacionais.
- **Nenhuma alteração em SQL, RPC, XP ou cronômetro de produção está autorizada por este documento.** Revisar backups, staging, testes de 2 contas e gates P0 antes de qualquer migração.
