# LABGAME — Trilha e recompensas educativas (v2)

Implementação de interface na branch `lab-rebuild-2026` em 14/10/2026. Referência: `lab-app/src/components/ChallengeJourney.tsx` e `lab-app/src/domain/journey-rewards.ts`.

## Regras preservadas
- A única fonte de verdade do progresso/XP é o Supabase por RPC transacional; o frontend jamais grava XP, dia, moeda, prêmio ou bens espirituais.
- Confirmação válida do capítulo atual: **10 XP**, sem repetição. Vídeo elegível confirmado: **5 XP**, uma vez por recurso; assistir não substitui a leitura.
- 365 etapas com até quatro capítulos, sem pular dias e sem desbloquear etapas futuras por interação na UI.
- A pomba é símbolo bíblico de presença e direção do Espírito Santo, não um agente que mede espiritualidade ou dá revelações.

## Marcos visuais e termos
| Nome | Critério visual | Entrega |
|---|---|---|
| Etapa do dia | Retorno `lab_game_sync` | Leitura diária, confirmação validada pelo servidor |
| Talentos (baús) | Cada 7 dias de **melhor sequência** confirmada no servidor (7, 14, 21...) | Reconhecimento visual + reflexão fixa sobre responsabilidade (Mt 25:14–30), **sem XP adicional** |
| Dons / fruto do Espírito | **Conteúdo educativo aberto**, mesmo para iniciantes | Estudo com referências a 1Co 12:8–10 e Gl 5:22–23; nenhum dom espiritual é concedido ou declarado pelo jogo |
| Galardão (coroa) | `finished` confirmado no servidor após 365 etapas | Insígnia simbólica da leitura concluída, não promessa de salvação ou recompensa eterna |

- Total máximo de baús históricos exibidos por melhor sequência em uma jornada de 365 etapas: **52**. Não são dinheiro, saldo, moeda resgatável ou pontuação.
- Reiniciar uma tentativa preserva o melhor histórico e os marcos previamente registrados visualmente. A tela da etapa usa o progresso atual retornado pelo servidor.
- O baú abre um texto de reflexão; não cria pendências de recompensa a receber. O estudo sobre Dons não bloqueia capítulos nem exige conquista de pontos.
- Nenhum devocional personalizado gerado por IA é exibido nesta entrega; textos futuros devem ter curadoria e revisão humana antes de publicação.

## Critérios de UX
- Diferenciar claramente os estados **atual**, **concluída** e **bloqueada**.
- Botão principal somente na etapa atual e não concluída. Pré-visualização sem login conduz à criação de conta.
- O mapa exibe uma janela móvel de sete etapas próximas à atual; os 365 capítulos permanecem no plano canônico integral.
- Botões de baú, Dons e Galardão abrem painéis de leitura e não geram alterações de dados.
- Interface responsiva e navegação por teclado; respeito a `prefers-reduced-motion`.
- Revisão em Chrome Android e Safari iOS, contraste, leitores de tela e testes E2E ainda pendentes.

## Próxima fase (não implementada)
- Recompensas individuais persistidas por `user_id` e evento único de marco, com prevenção contra duplicação e RLS, se forem realmente necessárias.
- Biblioteca de devocionais revisados e versões/idiomas; consentimento para recomendações.
- Painel de gestão editorial para estudos de dons e fruto do Espírito.
- Homologação real com duas contas e publicação controlada; não confundir CI verde com deploy e QA aprovados.
