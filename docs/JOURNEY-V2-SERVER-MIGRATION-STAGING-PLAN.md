# LABGAME V2 — Desenho de migração segura (SOMENTE PROJETO)

**Situação:** projeto técnico para staging. **NÃO É SQL EXECUTÁVEL NEM AUTORIZAÇÃO PARA MIGRAR PRODUÇÃO.**
**Especificação aprovada:** `docs/JOURNEY-ROLLING-24H-GAME-RULES-DESIGN.md`. Testes puros em `lab-app/tests/game-plan-next.test.ts` e `lab-app/tests/journey-clock-next.test.ts`.

## A. Princípios de transição
1. **Preservar a versão 1 e seus dados.** Não alterar `lab_game_plan_chapters WHERE version=1` ou `lab_game_runs` antigos; cada nova run V2 deve fixar `plan_version=2`, `plan_length=365|366` e `activated_at`. Runs V1 ativas precisam manter regra V1 até optarem por iniciar uma V2 ou até existirem critérios transparentes e testados de migração.
2. A nova fonte de verdade é SQL com `auth.uid()` e relógio do PostgreSQL. O JS em `domain/journey-clock-next.ts` documenta e testa a semântica, mas não decide concessão de vida/XP.
3. A versão do plano é imutável após a primeira ativação da tentativa; sem mudar capítulos durante sequência.
4. O cálculo de vidas é por **mês do incidente** em timezone fixo da regra, `America/Sao_Paulo`; nunca usar o mês atual do login para refazer saldo antigo.
5. **XP da tentativa é não cumulativo**: histórico de runs guarda recorde e coroas, mas `run_xp` novo é zero. Usuário pode receber +10 novamente ao ler um capítulo em nova run, sem somá-lo ao placar de runs anteriores.

## B. Esquema candidato
Nomes indicativos a revisar antes de codificar:
- `lab_game_plan_versions(id, length, sha256, published_at)` + `lab_game_plan_chapters(version, day_number, slot, chapter_id)` com chave por versão/dia/slot; garantir 1189 únicos e de 3 a 4 por etapa em validação transacional ao publicar a versão.
- `lab_game_run_config(run_id PK, user_id FK, plan_version, plan_length, started_at, timezone, created_at)` para coexistência com `lab_game_runs` legadas e garantia de associação `run_id+user_id`.
- `lab_game_stage_instances(run_id, day_number PK composta, activated_at, normal_deadline_at, grace_deadline_at, completed_at, transition_finalized_at, perfect_on_time)`. Colunas derivadas e imutáveis; apenas uma etapa ativa.
- `lab_game_life_wallet(user_id, month_key PK composta, max_lives, used_lives, updated_at)`; wallet de outubro não pode consumir saldo de novembro para incidente de outubro. Mês de origem definido pelo instante em que a carência acabou.
- `lab_game_life_incidents(id, run_id, day_number, first_expiry_at, period_key, started_at, terminal_at, kind)`, chave única `(run_id,day_number,kind)` ou outra que garanta UMA passagem por etapa, sem cobrar pela leitura e ativação separadamente.
- `lab_game_life_spends(incident_id, ordinal PK composta, wallet_period, spent_at, rescue_deadline_at)`; vida N compra `grace_at + (24h*N)`, sem recomeçar intervalo por reinício do aplicativo.
- `lab_game_run_score_events(run_id, event_key PK composta, kind, source_id, xp_delta, created_at)`, com unicidade por capítulo de etapa, vídeo de run, estudo validado de run, `late_adjustment_stage_N` e `cycle_award`. `run_xp` deve ser um agregado verificado de eventos (base + ajustes) sem incorporar outras runs. Nenhum prêmio duplicado por duas sessões.
- Medalhas e coroas consultam eventos por `run_id` e resultados históricos; `best_streak` e `best_run_xp` são projeções de máximos, nunca saldos transferíveis para a nova run.
- Não transformar `lab_game_stats.total_xp` legado em `run_xp` sem inventário/migração; uma camada de compatibilidade deve expor V1 e V2 com rótulos corretos.

## C. RPCs necessárias (não implementadas ainda)
`lab_game_v2_start_run()` — autenticada; pode abrir primeira run, novo ciclo integral concluído ou próxima tentativa após falha; 0 XP; fixa versão e política de calendário.

`lab_game_v2_activate_stage(run_id,stage_number,request_id)` — autenticação atual, lock por usuário e run, reconciliação de eventos de vencimento primeiro; bloqueia etapas antes de `eligible_at`, bloqueia etapas sem todos os capítulos prévios, fecha incidente pendente ou usa vida se cabível, cria timestamp do servidor uma única vez. Retry idempotente devolve mesma ativação.

`lab_game_v2_confirm_chapter(run_id,stage_number,chapter_id,request_id)` — aceita apenas capítulo atribuído ao plano imutável, etapa autenticada, janela autorizada; chave de evento de XP única, +10 apenas uma vez; confirma etapa somente após todos os capítulos, dentro da regra normal/carência/resgate, calculando multa de passagem uma única vez.

`lab_game_v2_sync(run_id)` — lê status autoritativo e reconcilia vencimentos por ordem cronológica; não altera estado com hora do cliente; só usa relógio PostgreSQL. Em falha sem vidas, encerra run com timestamp do real vencimento. Não tem botão "zerar o dia".

`lab_game_v2_scorecard(run_id)` — retorna `run_xp`, `run_days`, `best_run_xp`, `best_streak`, `completed_cycles_historical`, `video_xp_run`, `study_xp_run`, `lives_period`, `rescue_count`, `perfect_streak` e `remaining_deadline`. Coerência conferida no servidor e no staging.

`lab_game_v2_reset_all()` — **não nesta migração**: endpoint separado com reautenticação recente, confirmação `ZERAR`, exclusão transacional de ledger e resultados pessoais V1/V2, pontuação de grupos reavaliada sem prejudicar terceiros.

`lab_game_delete_account()` — **não nesta migração**: fluxo administrativo seguro e privacidade, com tratamento de líderes de GC, tokens e legal-retention.

## D. Operação concorrente e transições
- Primeiro lock por `auth.uid()` (wallet/run) dentro de toda operação que muda estado; sempre na mesma ordem, evitando deadlock. Isolamento transacional com checagem de resultado após `INSERT ... ON CONFLICT`.
- Uma falha após `grace_at` gera o primeiro resgate (se disponível); até `grace_at+24h` o mesmo resgate protege o incidente. Passou mais um milissegundo, precisa de segunda vida do **mesmo período**, mesmo que seja novo mês.
- Não pode haver duas carências de seis horas para a mesma passagem. Se a etapa termina em `A+28h`, restam somente duas horas até `A+30h` para ativar a seguinte gratuitamente.
- Confirmar um capítulo parcial na extensão não permite prêmio duplicado, antecipação de próxima etapa nem concluir automaticamente outros capítulos.
- Na ausência prolongada, calcular todas as janelas perdidas pelo horário real e falhar no primeiro instante em que faltou vida; **não** recuperar uma run falha com a wallet do mês posterior.
- A conclusão integral da run (365/366 etapas confirmadas, 1.189 capítulos) emite uma coroa idempotente, e opcionalmente insígnia adicional **constância perfeita** se todas as etapas e ativações foram pontuais, sem gastar vidas; bônus é evento da run concluída, sem saldo inicial da próxima.

## E. Matriz mínima de staging (NÃO rodar contra produção)
1. Validar plano V2 365 (271×3 + 94×4) e 366 (275×3+91×4), versão fixa por run, soma 1.189, 66 livros e ordens internas.
2. Ativar duas runs independentes para **duas contas teste**. Nem nomes, XP, tokens, GCs nem vidas podem vazar pela RLS.
3. Duas abas simultâneas confirmam mesmo capítulo, ativam mesma etapa, consomem mesma vida: **uma só recompensa/ativação/débito**.
4. Fronteiras exatas `A+24h`, `A+27h`, `A+30h`, `A+54h`, `A+78h`, `A+102h` e milissegundo posterior. Ao precisar da 4ª vida, run falha.
5. Virada outubro/novembro com 0, 1, 2 e 3 vidas remanescentes no incidente de outubro; novembro restaura cota para **eventos novos** sem resgatar incidentes de outubro.
6. Etapa concluída em `A+28h` não recebe mais seis horas de bônus de ativação, nem dupla penalidade de XP.
7. Jornada perdida com 265 etapas → run nova `0 dias / 0 XP`, recordes e prêmios antigos no histórico; após atingir 266 na nova run → novo recorde; capítulo repetido durante nova run rende XP nessa run, mas não acumula com antiga.
8. Vídeo e estudo são opcionais para leitura; sem token/heartbeat válido não emitir bônus novo; número de prêmios por recurso/run limitado e inequívoco.
9. GC/leaderboard computa contribuições a partir de `completed_at` confiável e consentimento, sem duplicar em duas runs do mesmo período ou contabilizar XP legado.
10. Somente após testes com recuperação do backup, validar migração de bônus anuais (ainda não aplicada), observabilidade, rollback e release plan.

## F. Gates não resolvidos
- Critério 365/366 para início móvel, e compatibilidade com runs V1 existentes.
- XP exato de etapa resgatada após gastar vida: recomenda-se desconto máximo de 6 XP de etapa, evento único, mais perda de selo perfeito; ainda não explicitamente homologado.
- Métrica de vídeo assistido além do simples transcurso de 90 s; estudo concluído e idempotência.
- Calendário operacional dos GCs no modelo móvel; regras de atribuição de evento a semana e de migração.
- SMTP, P0 de duas contas e backup externo.
