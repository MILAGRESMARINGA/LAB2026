# AUDITORIA LABGAME 3.0 — Regras da Jornada, equidade e antifraude
**Data:** 16/10/2026 · **Natureza:** revisão documental + inspeção estática do código da branch `lab-rebuild-2026` + consultas SQL **somente leitura** ao Supabase LABGAME `azejfxvaamgkmfmwdzjn`.
**Escopo:** `lab-app/` e `docs/`; nenhum dado de produção, pontos, conta, CRM ou migração foi modificado.
**Resultado:** REGULAMENTO AINDA **NÃO HOMOLOGADO**. Há divergências verificadas e opções de produto por resolver antes de programação.

> Observação: auditoria de lógica e modelagem, não teste de invasão, validação formal completa das funções SQL, teste de carga nem homologação real com duas contas.

## 1. Regras confirmadas pelo responsável
1. Uma etapa contém **três ou quatro capítulos obrigatórios**; a Bíblia protestante integral contém 1.189 capítulos. Estudos e vídeos são opcionais para a liberação da próxima etapa, embora possam gerar XP verificável em suas próprias regras.
2. Relógio normal de leitura: **24 horas contadas da ativação efetiva da etapa**, registrada pelo servidor, não da meia-noite e não da última confirmação de capítulo.
3. Carência de conclusão: **6 horas** adicionais, com desconto de XP proporcional ao atraso. Atraso não permite marcar capítulo inexistente ou pular capítulos.
4. Próxima etapa somente quando a atual estiver integralmente concluída e o intervalo mínimo aplicável de 24 horas houver decorrido. Não antecipar desafios.
5. Consumir vidas quando o prazo + carência acabar, com **três vidas mensais como quantidade inicialmente solicitada** e a quarta necessidade sem vidas encerrando a tentativa. **Duração exata por vida e o critério Santa Ceia ainda não homologados.**
6. Renovação mensal **não acumulativa**: mês novo não congela relógio, cancela penalidades, recupera ocorrência anterior ou revive tentativa encerrada; incidente vinculado ao período de origem.
7. **Reinício automático** após tentativa perdida: próxima tentativa em Gênesis 1, 0 dias e **0 XP da nova sequência**; históricos, coroas, medalhas e melhores marcas preservados somente como barreiras e conquistas antigas, **sem serem carregados** para o novo placar.
8. **Zerar tudo** é opção separada e irreversível no aplicativo: apaga XP/recordes/histórico de conquistas, coroas, bônus de Bíblias completas e estudos; mantém conta e GCs. Excluir a conta é um terceiro fluxo, de identidade e privacidade.

## 2. Constatações técnicas comprovadas

### F-01 — P0: 51 etapas com somente 2 capítulos (COMPROVADO EM PRODUÇÃO)
`SELECT COUNT(*) FROM public.lab_game_plan_chapters GROUP BY day_number` agrupado: **365 etapas; 51 de 2 capítulos, 169 de 3 e 145 de 4**. A soma 51×2+169×3+145×4=1.189, mas **51 não respeitam o mínimo de três**. `verifyGamePlan` em `src/domain/game-plan.ts` aceita `1..4`, não `3..4`.
- Plano correto 365: 271 etapas × 3 + 94 etapas × 4 = 1.189.
- Plano correto 366: 275 etapas × 3 + 91 etapas × 4 = 1.189.
- **Remediação:** produzir novas versões canônicas imutáveis; validador exige `3<=count<=4`, 66 livros, 1.189 capítulos únicos, Gênesis até Apocalipse conforme plano aprovado. Fixar `plan_version` em cada `run_id` para não mudar o percurso de quem já começou.
- **Aceite:** zero dias de 1/2/5 capítulos, zero duplicação/omissão, conferir distribuição canônica e 365/366 por comparação automática.

### F-02 — P0: relógio atual continua em data civil (COMPROVADO EM PRODUÇÃO)
`lab_game_sync`, `lab_game_confirm_chapter` e `lab_game_restart_completed` usam `started_on date` + `now() at time zone 'America/Sao_Paulo'`; não há `activated_at` e não existem lives/incident ledger. Abrir 23h55 e ler pouco depois da meia-noite fica sujeito à lógica civil atual.
- **Remediação:** esquema de timestamps do servidor `activated_at, normal_deadline_at, grace_deadline_at, completed_at, eligible_at`; máquina de estados persistida e RPCs autenticadas. Definir aplicação a contas em progresso: **não migrar timer de partida à força**.

### F-03 — P0: dupla carência e congelamento por não clicar (INCONSISTÊNCIA DE PROJETO)
`READY` pode ficar indefinidamente sem ativação se só houver prazo após clique; porém cobrar outra carência gratuita após concluir tardiamente possibilita empurrar o ciclo. O documento atual propõe 6h desde `eligible_at` mas ainda requer aceite.
- **Solução recomendada, pendente de aprovação:** **uma tolerância de 6h por passagem de etapa**. Prazo da etapa corrente `A+24h`; deadline de tolerância `A+30h`. Se concluiu cedo, etapa seguinte fica READY em `A+24h`; iniciar até `A+30h` sem vida (desconto conforme atraso). Se concluiu durante a tolerância, a mesma janela continua até `A+30h`; não ganhar mais 6h adicionais por ter concluído tarde. Novo cronômetro de 24h começa no clique de ativação seguinte; atraso para ativar não é apagado.
- **Aceite:** no máximo um ajuste por passagem, sem antecipação, ausência não congela progressão, vida para exceder limite.

### F-04 — P0: incidentes atravessando meses (REGRA APROVADA, MODELO PENDENTE)
A transição 31/10→01/11 pode conceder vidas indevidas se o backend recalcular pelo mês atual na hora do login.
- **Solução:** ledger imutável `incident_id, run_id, stage, event_at, origin_period, rescue_deadline_at, lives_consumed` + saldo mensal por participante/periodo. Qualquer incidente de outubro permanece no orçamento de outubro até resolução/falha; incidentes iniciados em novembro usam novembro. Processamento cronológico quando app está fechado.
- **Aceite:** virar o mês não salva incidente, não aplica penalidade a prazo ainda válido, não duplica debitamento, não resgata run encerrada.

### F-05 — P0: contabilidade XP soma tentativas (COMPROVADO)
`lab_game_stats.total_xp` recebe +10 a cada confirmação por `run_id`, mas é **um único saldo do usuário**. `lab_game_scorecard()` soma `lab_game_chapter_checks` de todas as runs + recompensas de vídeo de usuário. Contra a regra atual de **XP da nova sequência = 0**.
- **Solução:** `run_xp` e ledger por `run_id` como fonte competitiva; `best_run_xp` como recorde arquivado; placar histórico apenas exibição; medalhas da nova tentativa dependem SOMENTE de `run_xp`. Um novo `run_id` pode pontuar sua leitura de capítulos de Gênesis, mas não acumular com XP de outras tentativas.
- **Aceite:** após reinício, `run_xp=0, run_days=0`; histórico continua visível sem liberar medalha, sem transferência para ranking.

### F-06 — P0: vídeos não estão associados à tentativa e 90s não provam consumo (COMPROVADO)
Tabelas `lab_game_video_rewards` e `lab_game_video_sessions` são por `(user_id,video_key)`, sem `run_id`. `lab_game_video_begin` registra início, e `lab_game_video_confirm` aceita recompensa após 90s decorridos; não demonstra reprodução contínua.
- **Solução:** decidir separação `run_video_xp` versus arquivo global de vídeo e sua política de repetição entre tentativas. Registrar requisitos mínimos honestos de conclusão, retomar vídeo e visibilidade/heartbeat quando tecnicamente possível; não anunciar "assistiu 90s" apenas por transcorrer tempo em background.
- **Aceite:** idempotência por recurso e tentativa/curso conforme regra, não acumular XP antigo no novo run; 90s de relógio ocioso não ser alegado como verificação de execução audiovisual.

### F-07 — P0: GC e rankings usam datas civis (COMPROVADO)
A `lab_game_gc_league` consulta `read_on date` e `started_on + day_number - 1 = read_on`, filtrando semana civil. Isso diverge de 24h desde ativação e de extensões por vida.
- **Solução:** usar `completed_at` por etapa e períodos de 7×24 horas com limite de contribuição e elegibilidade claramente definidos; conservar opt-in e privacidade; não somar XP de outras tentativas.
- **Aceite:** leitura válida em horário variável conta corretamente, sem poder duplicar o mesmo marco e sem sumir por conversão de timezone.

### F-08 — P1: modalidade 365/366 não determinada para início em qualquer data
O produto permite começar em qualquer dia, mas `GAME_DAYS=365`. Se o jogador começa em outubro e passa por 29/02, não está definido se a run vira 366 etapas.
- **Solução recomendada:** a escolha de plano e seu número de etapas fica **imutável na ativação do ciclo**. **Definir com o responsável** se 366 é reservado ao plano anual do calendário bissexto (por exemplo, ciclo iniciado em 1º de janeiro de ano bissexto), ou se sempre se usa 365 etapas para a modalidade livre de data. **Nunca acrescentar ou retirar etapa no meio de uma run**.

### F-09 — P1: falta distinguir sequência perfeita de jornada salva com vidas
Uma tentativa pode sobreviver e completar a Bíblia com 2 ou 3 resgates. Dar a ela a medalha de **365 dias ininterruptos pontuais** seria injusto para quem nunca atrasou.
- **Solução:** indicadores independentes `completed_stages`, `perfect_on_time_streak`, `rescues_used`, `best_completed_stages`; coroa de **Bíblia completa** para todos os que leram os 1.189 capítulos, conquista especial de **constância perfeita** exclusiva de quem não usou resgates e não atrasou. Definir se atraso só na ativação quebra sequência perfeita (recomendação: sim).
- **Aceite:** recorde de 265 dias só muda após 266 etapas efetivamente concluídas no critério de recorde especificado, sem somar run anterior.

### F-10 — P1: descontos -3/-6 exigem política inequívoca
Documentos propõem faixas >24h até 27h (-3) e >27h até 30h (-6), mas não há especificação do XP quando usa vida, nem se atraso de conclusão e ativação somam descontos.
- **Solução recomendada:** utilizar o **maior atraso relevante da transição**, aplicar o desconto **uma vez** quando a etapa fecha, como evento compensatório no livro-caixa do próprio run. Nunca penalizar outros runs nem gerar XP negativo da etapa. Extensão de vida não gera bônus e desqualifica de constância perfeita.
- **Pendência de aprovação:** valor exato (0, -6, outro) ao concluir durante extensão comprada com vida e em que etapa recai o desconto de ativação.

### F-11 — P1: duração de uma vida e renovação na Santa Ceia não homologadas
Proposta de uma vida = 24h de recuperação ainda não aprovada. A solicitação inicial relacionou 3 vidas à Santa Ceia autodeclarada, ou 1 vida se não participou.
- **Solução recomendada:** 3 vidas mensais iguais para todos; reflexão opcional sobre Santa Ceia sem recompensa nem coleta do status devocional, devido à privacidade, à autodeclaração impossível de validar e à desigualdade para pessoas sem acesso à celebração. Necessita **decisão explícita** do responsável.
- **Aceite:** nenhuma vida permite pular capítulo, nenhuma vida retroage à falha encerrada, saldo nunca acumula no mês seguinte; quarto resgate sem vida encerra run.

### F-12 — P1: prazo inicial, fronteiras e horário UTC
É necessário definir primeira ativação voluntária (registro não inicia relógio), `A+24h`, `A+27h`, `A+30h` e transição exatamente nesses instantes. Mudança de timezone poderá antecipar renovação mensal indevida.
- **Solução:** timestamps UTC com `clock_timestamp()` ou transação consistente, `eligible_at` e deadlines fixos, timezone de contagem mensal registrado e estável pela temporada; usar `now()` do servidor coerentemente. `now<=A+24h` normal; `A+24h<now<=A+27h` -3; `A+27h<now<=A+30h` -6; `now>A+30h` incidente.
- **Aceite:** testes nos limites exatos, simultaneidade, atraso por rede, modo offline, troca de fuso, mês, horário de verão.

### F-13 — P1: auditoria e fraude por clique
Confirmar capítulo não prova leitura real. Hoje o servidor verifica capítulo esperado, identidade e unicidade na run, mas não que leu o conteúdo.
- **Solução:** não alegar prova de leitura humana; proteção por frequência anômala, confirmações voluntárias, UX de responsabilidade, e verificação opcional de compreensão, sem impor tempo mínimo uniforme que discrimine leitores rápidos, leitores com deficiência ou usuários de áudio.

### F-14 — P1: resgates automáticos e concorrência entre dispositivos
Se cada dispositivo calcular faltas localmente, duas sessões podem consumir vidas duas vezes ou deixar o usuário escapar pela reinstalação/offline.
- **Solução:** transações serializadas por `auth.uid()`, chaves de idempotência por incidente, RPC do servidor como autoridade, reprocessar prazos cronologicamente quando voltar online. Client só desenha contagem baseada em timestamps, não decide saldo.
- **Aceite:** competição de duas abas e requests simultâneos deixa no máximo um consumo por janela; rollback sem crédito parcial.

### F-15 — P1: reset total e exclusão da conta podem causar inconsistência de GC/ledger
`ZERAR` limpa XP e histórico de uma pessoa, mas a Liga GC não pode manter contribuição invalidada nem apagar mérito legítimo de outros membros. `EXCLUIR` precisa resolver GCs liderados e Auth.
- **Solução:** reset atômico, autenticação recente e confirmação por texto, reconciliação da Liga e recompensas anuais, manter cadastro/membership; exclusão separada via backend seguro sem expor service role, reatribuição de GC e política LGPD. Nenhuma dessas rotas existe hoje.

### F-16 — P1: recompensas de Bíblia completa exigem revisão antes da migração
SQL de +10.000 XP (1º ciclo), +12.500 (2º), incremento +2.500/ciclo, está **somente no repositório** e ainda soma `lab_game_stats.total_xp` vitalício. Isso entraria em choque com saldo ativo zero no reinício.
- **Solução:** bônus pertencem à run/ciclo concluído e são exibidos na coleção histórica depois, nunca creditados no `run_xp` inicial da run seguinte. Fazer ensaio isolado antes de aplicar a migration pendente.

### F-17 — P2: desafio rigoroso versus justiça de vida real
Ativação móvel e extensões podem tornar uma run de 365 etapas mais longa que 365 dias corridos. Um jogador que usa vidas pode merecer coroa por conclusão integral, mas não o mesmo selo de pontualidade perfeita. Redefinir `365 etapas` como contagem de etapas, não duração civil exata.
- **Solução:** apresentação clara do tempo real gasto, estágios realizados, vidas usadas e título de conquista. Não tratar atraso por doença, família, conexão ou necessidade de acessibilidade como falha moral.

## 3. Modelo proposto de transições para aprovação (NÃO PROGRAMAR AINDA)
Estado: `LOCKED`, `READY`, `ACTIVE`, `GRACE`, `RESCUE`, `COMPLETED`, `FAILED`.

1. Ativa a primeira etapa explicitamente (`A`); início normal `A` e vencimento `A+24h`.
2. Cada capítulo correto confirmado é registrado uma vez para a run. Etapa só conclui após 3 ou 4 capítulos obrigatórios.
3. Se concluiu até `A+24h`, aguarda `A+24h` para N+1 READY.
4. Entre `A+24h` e `A+30h`, há apenas **uma** janela de 6h para terminar N ou ativar N+1 (se já terminou), com desconto por atraso; **não** duplicar carências.
5. Acima de `A+30h`, cria incidente uma vez; usar vida disponível do mês de origem para abrir extensão cujo tamanho ainda precisa ser aprovado. Se não houver vida: FAIL; após extensão vencida, cobrar outra vida do mesmo incidente/período.
6. A próxima etapa só pode ser ativada depois de completar N, do relógio permitir e da pendência estar resolvida. O clique autorizado marca o próprio `activated_at` novo.
7. Se N falhar por falta de vidas: registrar run FAILED com `final_run_xp`, `best_streak` etc; nova run abre Gênesis com `run_xp=0`; medalhas e pontuação da run antiga permanecem só como vitrine histórica.
8. Na virada mensal, orçamento de lives de novos incidentes troca, mas **nenhum incidente velho pode herdar orçamento novo**.
9. Após completar a Bíblia, conceder coroa e prêmio idempotentes naquela run; nova run só após intervalo permitido, começando em 0.
10. Se jogador usar reset total autenticado: apagar ledger pessoal, records e marcos antigos e recalcular GC sem deixar bônus fantasmas.

**Exemplos de fronteira para testes:**
- `A=2026-10-31 22:00 America/Sao_Paulo`: normal até **01/11 22h**; carência até **02/11 04h**. Não cobrar vida só porque começou novembro.
- `A=2026-10-30 17:00`: normal até 31/10 17h e carência até 31/10 23h; incidente em outubro. Uma extensão pode atravessar novembro sem consumir vidas de novembro para esse incidente.
- No dia 265 de uma tentativa, faltar sem vida => nova run `0 XP / etapa 1`; melhor recorde 265 arquivado. Quando concluir etapa 266 em outra run, melhor marca vira 266.

## 4. Decisões que faltam (GATE DE PRODUTO)
**Não interpretar sugestões como decisões aprovadas.** O responsável já aprovou relógio de 24h por ativação e renovação de vidas sem retroatividade.

| Tema | Recomendação do auditor | Estado |
|---|---|---|
| Pausa entre READY e ativar | Tolerância única 6h, sem janela adicional | PENDENTE ACEITE |
| Vidas mensais | 3 para todos, sem vincular à Santa Ceia | PENDENTE ACEITE |
| Duração de resgate | 24h por vida, teto e cronologia por incidente | PENDENTE ACEITE |
| Penalidade de XP pós-vida | Definir fórmula, idempotente, sem negar capítulo lido | PENDENTE ACEITE |
| Recordes | Recorde de etapas concluídas + selo distinto de pontualidade perfeita | PENDENTE ACEITE |
| Plano bissexto | Fixar versão 365/366 na ativação, critério calendárico explícito | PENDENTE ACEITE |
| Vídeo e estudo XP | Separar XP da run de histórico permanente; política de elegibilidade por recurso | PENDENTE ACEITE |

## 5. Barreiras de publicação
**Gate A — regulamento único:** sem contradições entre `docs/JOURNEY...`, `docs/LABGAME-3-PRODUCT...`, `docs/PROFILE-SETTINGS...` e interface. Distinguir regras APROVADAS, propostas e técnica existente.
**Gate B — plano canônico:** gerador/testes 3–4 capítulos, 365/366 conforme definição, 1.189 únicos, plano versionado.
**Gate C — economia e servidor:** alterações versionadas de funções atômicas com relógio, lives, incidentes, XP por run, vídeo/estudos e bônus anual em banco isolado.
**Gate D — segurança:** RLS, EXECUTE mínimo, testes 2 contas, replay, concorrência, offline, fronteira de prazo/mês, double spend, GC.
**Gate E — preservação:** backup recuperável e migration/rollback ensaiados; não migrar as runs existentes para prazo mais severo sem consentimento e regra de transição.
**Gate F — UX:** contagem explícita de prazo normal/carência/vidas, telas de confirmação, datas no timezone do participante, notificações opcionais e erros honestos. Nenhum alerta opcional habilitado sem consentimento.

## 6. Sequência para o Perfil e Central de Configurações (após gate de regras)
1. Organizar navegação: Perfil (resumo) + Configurações (meus dados, minha igreja/GC, notificações, privacidade/segurança, gerenciar jornada), com **botão Sair** claro e de largura total.
2. Notificações opt-in por assunto e canal (`in_app` e email). Manter avisos de segurança e diálogos de confirmação obrigatórios; push offline exige consentimento do dispositivo e backend.
3. Cadastro privado opcional: nome, cidade/UF, telefone e profissão com finalidade clara; vínculo de igreja, pastor e ministério são **dados de religião potencialmente sensíveis**, RLS/consentimento apropriados. CPF/RG/endereço residencial completo **não coletar por padrão**.
4. Separar três ações: **iniciar novo ciclo concluído** (histórico preservado mas 0 XP inicial); **zerar tudo** (apaga conquistas pessoais, mantém conta/GC); **excluir conta** (também identidade e vínculos, nos limites legais).
5. Modais em duas etapas, reautenticação recente, exportação e confirmação `ZERAR`/`EXCLUIR`; nunca disponibilizar botão que finja concluir operação não implementada no backend.

## 7. Evidência e limites
- Inspeção de `lab-app/src/domain/game-plan.ts`: valida `chapters.length<1 || >4`, não mínimo 3.
- Leitura SQL Supabase LABGAME: agrupamento efetivo 51/169/145; funções `lab_game_sync`, `lab_game_confirm_chapter`, `lab_game_scorecard`, `lab_game_video_begin`, `lab_game_video_confirm`, `lab_game_gc_league`; RLS das tabelas individuais só SELECT do titular.
- Migrações do Supabase listadas até `20261014195640 lab_privileges_hardening_p0`; migração de prêmios anuais não consta aplicada.
- Banco com somente uma conta de usuário na data da consulta. Não foi realizado E2E real com duas contas; RLS lido não prova ausência de outras falhas.
- Não foi executado ataque, teste de escrita, alteração de produção ou exclusão de contas.
