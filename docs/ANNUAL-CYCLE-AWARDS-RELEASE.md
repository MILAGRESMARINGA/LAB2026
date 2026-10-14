# LABGAME 3.0 — Liberação segura do bônus por Bíblia completa

**Situação:** fórmula de bônus **aprovada** em 14/10/2026; implementação SQL preparada no GitHub. **Nenhuma instrução desta página autoriza sua execução imediata em produção.**

## Escopo e regra

| Ciclo validado | XP apenas por capítulos | Bônus adicional | Ganho no ciclo, sem vídeos |
|---|---:|---:|---:|
| 1º | 11.890 | 10.000 | 21.890 |
| 2º | 11.890 | 12.500 | 24.390 |
| 3º | 11.890 | 15.000 | 26.890 |
| 4º | 11.890 | 17.500 | 29.390 |

- Fórmula: `bonus_xp = 10000 + (cycle_number-1)*2500`.
- Os 1.189 capítulos de cada ciclo precisam existir na versão 1 e terem sido confirmados na ordem e no dia permitido, sem reutilização de confirmações anteriores.
- As pontuações pessoais **não** alteram o placar/assiduidade do GC. Os XP de vídeo continuam 5 por panorama válido e único.
- A coroa identifica um ciclo concluído; não é promessa de galardão eterno nem avaliação de espiritualidade.

## Gate 0 — Estado anterior / dependências

1. Verificar que o backup LABGAME original está armazenado e seu hash e inventário são conhecidos.
2. Provar restauração **integral** e contagem de registros em ambiente isolado. Em 14/10/2026 houve teste de `auth.users` e restauração do esquema `public`; auditoria definitiva dos 15 módulos e dados ainda deve ser formalizada.
3. Revisar e aplicar **somente em staging** a migração anterior `202610120001_lab_privileges_hardening.sql` antes desta, confirmando sem regressões.
4. Fazer snapshot/backup independente de staging antes de qualquer aplicação. Nunca restaurar sobre o banco de produção.

## Gate 1 — Revisão de implementação

- Verificar funções `lab_game_confirm_chapter`, `lab_game_sync`, `lab_game_scorecard`, `lab_game_video_confirm` e `lab_game_restart_completed`.
- Validar `SECURITY DEFINER SET search_path=''`, `GRANT EXECUTE` somente para authenticated, e tabela `lab_game_cycle_awards` com RLS e SELECT próprio.
- Revisar o `CREATE TABLE` com FKs, índice, `UNIQUE(run_id)` e `UNIQUE(user_id,cycle_number)`. O trigger de RLS deve permanecer ativado.
- Aprovar que o ciclo é contado por `status='completed'` (e nunca apenas por `finished_on` ou XP).

## Gate 2 — Testes transacionais em banco isolado/staging

Usar contas de teste **autorizadas**, sem alterar dados reais. Simular cenários por transações com `ROLLBACK` após a comparação; não fingir que os testes foram executados só por existir script ou CI.

1. **Primeira conclusão:** preparar 364 etapas íntegras; confirmar o último capítulo da etapa 365. Esperado: novo evento único em ledger e +10.000 XP além dos +10 pela confirmação final.
2. **Repetição:** reenviar o último capítulo, recarregar, disparar duas requisições paralelas autenticadas do mesmo usuário; esperado: 1 evento e 1 bônus.
3. **Segundo e terceiro ciclos:** concluir outro ciclo no tempo permitido. Esperado: +12.500, depois +15.000, sem apagar XP anterior e sem avançar antes do dia permitido.
4. **Tentativa falhada:** interromper a sequência e reiniciar. Esperado: nenhuma coroa, nenhum bônus pela tentativa; recorde de dias preservado.
5. **Ciclo incompleto ou fraudado:** eliminar uma das 1.189 confirmações esperadas na simulação antes da conclusão. Esperado: erro e rollback da própria confirmação final.
6. **Dois usuários:** o primeiro não pode consultar, inserir, alterar ou excluir o ledger do segundo por role `authenticated`. `anon` não vê ou grava eventos.
7. **GC:** bônus de um membro não aumenta o score semanal do GC, não libera uma medalha coletiva e não modifica o XP de outro membro.
8. **Reconciliação:** `lab_game_scorecard().balanced=true`, com `total_xp=reading_xp+video_xp+cycle_bonus_xp`; mudança de perfil/refresh não concede XP.
9. **Compatibilidade de cliente:** aplicativo antigo continua lendo scorecard; novo Perfil só exibe coroas recebidas na resposta server-side.

## Gate 3 — Auditoria somente leitura após aplicar em staging

Rodar `lab-app/scripts/sql/annual-cycle-awards-post-migration-check.sql` com uma conexão de auditoria apropriada. **Resultado esperado: zero linhas.** Checar:

- prêmio vinculado somente a run completa de 365 etapas e mesmo usuário;
- fórmula do bônus e unicidade por ciclo;
- conta corrente igual a pontos de leitura + vídeo + ledger;
- zero privilégio de escrita para `anon`/`authenticated`;
- RLS ativada;
- inventário de `completed_without_award` vazio (não há backfill automático).

Se existirem ciclos concluídos antes da implantação, **não** aplicar correção automática. Registrar o número de ciclos, reconciliar valores e aprovar migração de backfill em operação separada.

## Gate 4 — Publicação

Só após os gates anteriores, testes de carga mínima, validação do backup e autorização operacional:

1. Aplicar migrações pendentes, em ordem, com ponto de retorno documentado e janela aprovada.
2. Executar auditoria SQL e smoke de login, GC, leitura diária, vídeo e perfil de coroas com duas contas.
3. Verificar GitHub CI, Vercel Preview, testes de navegador e visual mobile. A mera condição Vercel READY não é evidência de integridade do banco.
4. Só então promover a release para produção. Comunicar o histórico de bônus aos usuários sem classificar maturidade espiritual.

## Rollback e tratamento de incidentes

- **Antes do commit de uma migração que falhar:** usar o rollback transacional da execução; nunca remover manualmente eventos legítimos.
- **Após premiações reais:** não apagar a tabela ou decrementar XP às cegas. Congelar a chamada da função, preservar snapshots e executar procedimento de reconciliação auditado.
- Manter separados DB local, staging e Supabase LABGAME de produção; não reutilizar credenciais ou scripts do CRM.
