# P1 — estudos dos dias 4–7 e homologação do GC O Caminho

## BET e limites da entrega

- Tarefa: P1-CACHE-GC-004; responsáveis: biblical-canon-engineer e database-engineer.
- Revisão editorial/técnica realizada nesta sessão pelo Neural Master; conteúdo autoral assistido por IA, sem alegação de revisão humana ou de corpus de autores ingerido.
- Entrega: nove unidades autorais de camada 1, SQL aditivo idempotente e testes. Sem chamada adicional à API paga. O uso futuro de infraestrutura continua sujeito a cotas.
- Fonte do plano: `lab-app/supabase/migrations/202610160101_lab_v2_plans_seed.sql` (365 e 366 dias). Não foi alterada a distribuição canônica.
- O seed está separado de migrations e gera **drafts**. Não ativa V2, não publica conteúdo, não concede XP, não cria usuários/grupos e não altera RLS, grants ou RPCs.
- Release 18/10/2026: os nove registros foram inseridos como draft e publicados em transação separada após os testes do seed e revisão. Consulta posterior confirmou 15 publicados, dias 1–7, com V2 ainda desabilitada. Nenhum registro anterior, esquema, política RLS ou XP foi alterado. O GC O Caminho tem um membro; isto não equivale a homologação com grupo real.

## Conteúdo e chave exegética

| Dia | Capítulos | Organização | Justificativa |
|---|---|---|---|
| 4 | Gn 6–7 | Conectado | Instrução da arca e sua execução na mesma narrativa |
| 4 | Jo 3 | Separado | Novo nascimento; sem forçar ligação temática com o dilúvio |
| 5 | Gn 8–9 | Conectado | Saída da arca, bênção e aliança |
| 5 (365) / 6 (366) | Sl 3 | Separado, duas chaves diárias | O plano bissexto desloca este salmo; preservar a referência real do dia |
| 5 | Jo 4 | Separado | Água viva, adoração e testemunho |
| 6 | Gn 10–12 | Conectado | Povos, genealogia até Abrão e bênção às famílias da terra; Gn 11:4/12:2 |
| 7 | Gn 13–14 | Conectado | Separação de Ló e resgate após sua captura em Sodoma |
| 7 | Jo 5 | Separado | Sinal, autoridade do Filho e resposta à sua palavra |

Textos em linguagem de discipulado, sem transcrição de tradução protegida ou atribuições a autores não consultados. Não representam corpus de Armínio/Wesley ou RAG desses autores. A lente Pentecostal Arminiana explicita iniciativa da graça, resposta humana, santificação e atuação do Espírito, sem impor escatologia a capítulos que não a desenvolvem. A revisão humana precisa confrontar referências e contexto com a edição ALM1911 adotada; testes estruturais não certificam interpretação.

## Preparação e release do seed

1. Editar `lab-app/scripts/sql/seeds/p1-study-days-4-7.json` e gerar SQL com `node scripts/build-p1-study-seed.mjs` a partir de `lab-app/`.
2. Rodar `node --test scripts/tests/p1-study-seed.test.mjs`. Ele valida cobertura de ambos os planos, referências, formato do endpoint e sincronismo JSON/SQL.
3. Rodar o smoke PostgreSQL 16/17 existente. Ao final, ele aplica o seed duas vezes, verifica preservação dos registros anteriores, idempotência inclusive dos timestamps, RLS/grants e invisibilidade dos drafts ao leitor autenticado.
4. Revisar o texto, aprovar a versão em PR e registrar o SHA do SQL. O seed falha se encontrar a mesma chave com conteúdo diferente; correções publicadas devem receber nova versão. Reexecução nunca rebaixa conteúdo já publicado para draft.
5. Aplicar inicialmente em banco isolado/preview com responsável de release. Publicação no Supabase de produção é uma operação separada e explicitamente aprovada, após backup verificável e testes. Este documento não autoriza executar SQL em produção.
6. O frontend agora consulta as unidades curadas publicadas via RLS antes da geração. Preserva estudos conectados e separados, seleciona a revisão mais recente e exige cobertura sem sobreposição do plano real. Falha de consulta ou cobertura parcial não dispara chamada paga. Testes provam Gn 1 + Jo 1 conectados e Sl 1 separado sem invocar o endpoint. Ausência completa de curadoria mantém a geração existente com validação server-side. Confirmar este fluxo com sessão autenticada no preview antes de ativar V2.
7. Após publicação aprovada, verificar 9 registros publicados desta versão, cobertura 4–7 para cada plano, ordem de referências, `provider_model IS NULL` e idempotência de recompensa. Não afirmar cache populado em produção enquanto só houver o arquivo ou drafts.

## Homologação GC O Caminho — critérios executáveis

O smoke PG16/PG17 inclui fixtures de 3, 20 e 100 consentidos com média/score iguais e um caso em que novo membro consentido com zero XP reduz a média de 30 para 22,5. Executar fixtures somente em ambiente descartável. Não inflar o grupo real com contas sintéticas. Usar o ID verificado do grupo; nome semelhante não autoriza duplicação.

| Caso | Procedimento | Aceite |
|---|---|---|
| Privacidade | Usuários A (dono), B (membro) e C (externo); autenticar separadamente | Cada RPC limita dados ao papel e consentimento; C não acessa dados privados nem altera membros |
| Adesão | Dono habilita competição; B aceita consentimento de ranking | Consentimento deve ser explícito, revogável e não presumido pela filiação |
| Tamanho justo | Fixtures de 3, 20 e 100 participantes consentidos, mesma atividade individual | Mesma média e multiplicador; volume bruto não aumenta score |
| Inatividade | Deixar um consentido elegível sem eventos | Permanece no denominador; não remover quem tem zero XP para inflar média |
| Entrada recente | Adicionar membro a meio da janela | Eventos anteriores à entrada não somam; dias disponíveis respeitam entrada e janela |
| XP e disciplina | Registrar leituras, estudo e vídeo elegíveis pelas RPCs | Score usa eventos de servidor; confirmações repetidas não duplicam XP ou dias de atividade |
| Limites | Testar início/fim da janela de sete datas de São Paulo e eventos futuros | Eventos fora da janela, anteriores à entrada ou futuros não pontuam |
| Interface | Abrir placar no celular com nomes longos e grupo pequeno | Média, janela e bônus são explicáveis; nenhuma exposição humilhante de inativos |
| Consentimento retirado | Revogar B e consultar placar | Denominador e XP seguem regra vigente; histórico privado não vaza; impacto registrado |

**Fórmula vigente no código:** média do XP elegível dos membros consentidos, incluindo os de zero XP, multiplicada por `1 + 0,20 × constância`. A constância é a cobertura de membro-dia de leitura, estudo e vídeo nos últimos sete dias de calendário de São Paulo. O multiplicador vai de 1,00 a 1,20. “Membro ativo” não deve ser redefinido no frontend como “apenas quem pontuou”. Eventos de leitura medem presença de leitura no dia, não necessariamente fechamento de todos os capítulos; decidir mudança exige contrato explícito e migração revisada.

A fórmula atual usa janela de sete dias de calendário, enquanto a jornada tem janelas de 24h desde ativação. O teste de fronteira precisa cobrir essa diferença. Nenhum campo de relógio do cliente deve determinar eventos elegíveis.

## Comando de voz e condição de entrada no piloto

Acompanhar separadamente a configuração do gateway `VITE_LAB_AGENT_API_URL`. Capturar ordem, revisar transcrição e BET, confirmar identidade do dono, despachar tarefa delimitada e verificar Draft PR é uma prova distinta de homologar ranking. Não solicitar chaves por voz. Produção e custo seguem autorização do presidente.

Entrar no piloto só com: V2 homologada em preview, permissões/RLS aprovadas, grupo correto com consentimento, estudos publicados e consumidos por cache, e evidência de XP idempotente. Troféus semanais e acesso nacional não devem ser declarados ativos sem evidência do respectivo fluxo.

## Evidência da execução autônoma da Issue #21

- PRs #25/#26 e correção do runner #27 integrados em `lab-rebuild-2026`; #27: `44a2e4536e40c29197e00a17616ccf0dcb53bd14`.
- Run de inferência: https://github.com/MILAGRESMARINGA/LAB2026/actions/runs/39100638663 — geração, verificação sem segredos e publicação aprovadas.
- Draft PR criado automaticamente: https://github.com/MILAGRESMARINGA/LAB2026/pull/29 ; branch `agent/task-21-run-39100638663`, commit `f5c4453ff58b8a09cca586ebf95a0b299bf5b14d`.
- CI completo: https://github.com/MILAGRESMARINGA/LAB2026/actions/runs/39100711028 — seis jobs aprovados. O primeiro CI do bot exigiu aprovação de maintainer no GitHub, processada nesta sessão; não se desativaram proteções.
- Artefato do provedor: 6.111 tokens de entrada, 2.245 de saída, reserva conservadora US$0.011588 por chamada, teto autorizado US$0.25 para a tarefa. R$0.01 é estimativa do modelo, não fatura. Nenhuma repetição automática foi usada.
- Preview Vercel do PR29 READY; verificados menu em 390px (cinco alvos de aproximadamente 73×53px) e iframes internos distintos para Mateus, Lucas e Romanos. Não equivale a provar reprodução de todos os 66 livros nem o piloto autenticado V2.
- PR29 permanece Draft para revisão. Nenhuma promoção para main foi executada.
