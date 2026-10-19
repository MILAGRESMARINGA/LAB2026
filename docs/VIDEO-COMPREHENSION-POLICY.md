# Panorama: reprodução e compreensão

## Estado

Implementação da regra aprovada: 71 durações verificadas por manifest oficial e 142 perguntas com revisão textual editorial por IA. O relatório público registra escopo e fontes; os gabaritos reais são provisionados somente no banco privado. Publicação e testes em produção devem ser registrados separadamente, sem confundir build aprovado com reprodução real homologada.

## O que podemos verificar

Eventos do player, tempo validado pelo servidor e respostas a perguntas fornecem evidências de reprodução e compreensão básica. Nenhum deles comprova atenção humana contínua. Não usar câmera, reconhecimento facial, rastreamento ocular ou afirmações de “atenção comprovada”. A interface deve dizer “Panorama concluído”.

## Regra de reprodução solicitada

- Usar a duração real do recurso individual, nunca um prazo fixo de 90 segundos ou a duração de outro panorama.
- Contar apenas reprodução a 1×, com player visível e documento em primeiro plano. Pausa e carregamento suspendem a contagem.
- Sair da tela ou fechar o panorama pausa a contagem e preserva o progresso validado. Avançar deixa os trechos pulados pendentes: o usuário precisa voltar e reproduzi-los normalmente. Mudar a velocidade suspende a contagem enquanto estiver diferente de 1×, preservando os trechos já validados.
- Rolar normalmente a página não implica avanço no vídeo; ocultar efetivamente o player pausa a contagem sem apagar progresso. Tela cheia do player permanece válida.
- Não conceder XP por cronômetro visual isolado. O servidor verifica sessão, recurso, duração e conclusão, com concessão idempotente. Telemetria de navegador ainda pode ser falsificada por um cliente modificado: não prometer inviolabilidade.

## Camada de compreensão proposta

Após completar a cobertura de reprodução exigida, apresentar duas perguntas simples sobre o conteúdo daquele recurso. Exigir duas respostas corretas, mostrar explicação e referência bíblica após cada resposta e permitir nova tentativa sem retirar XP já adquirido ou punir a jornada. Durante a revisão, verificar se cada pergunta realmente corresponde ao panorama específico; referência bíblica correta sozinha não garante essa correspondência.

O seed contém somente duas perguntas por recurso e, portanto, ainda não permite sorteio diverso nem oferece resistência relevante à memorização. Nesta primeira entrega, usar duas perguntas fixas revisadas por recurso; uma expansão futura pode permitir sorteio. Não importar este JSON no bundle público como validação de segurança. Enviar ao cliente apenas perguntas e alternativas; manter correção e concessão no servidor. Não gerar perguntas por IA a cada acesso.

As perguntas medem compreensão do texto e do panorama; não exigem adesão a interpretações particulares do produtor do vídeo. Explicações próprias do LABGame seguem a matriz evangélica Pentecostal Arminiana, sem determinismo fatalista.

## Acessibilidade e piloto

Garantir legendas quando disponíveis, teclado, leitor de tela e ausência de desafios temporizados durante o vídeo. A imposição de 1× pode prejudicar pessoas que precisam de outros ritmos; a revisão do piloto deve avaliar esse impacto. Interrupções legítimas preservam os trechos já validados. Propor uma alternativa com resumo próprio revisado ou transcrição autorizada e a mesma avaliação, antes de torná-la uma forma equivalente de ganhar XP. Não copiar transcrições integrais sem autorização.

Medir abandono, interrupções por motivo, erros por pergunta e acessibilidade com dados mínimos, sem salvar áudio ou registrar conteúdo sensível. Não converter baixa pontuação em julgamento espiritual. Vídeo e perguntas são complementares e nunca substituem a leitura bíblica diária.

## Critérios de homologação

1. Duração e identificação corretas para cada parte de cada livro.
2. Pausa/carregamento não contam; saída preserva progresso, avanço mantém trechos pendentes e velocidade diferente de 1× não conta; tela cheia funciona.
3. Nenhum cliente consegue conceder XP diretamente; repetição de confirmação não duplica bônus.
4. Perguntas permanecem indisponíveis para pontuação enquanto marcadas como rascunho; revisão editorial registrada antes da ativação.
5. Explicações e referências correspondem ao recurso, alternativas não são ambíguas e tentativas não geram punição adicional.

## Evidência editorial de Gênesis

Em 19/10/2026 foram consultadas as páginas oficiais de [Gênesis 1–11](https://bibleproject.com/pt-br/videos/genesis-1-11/) e [Gênesis 12–50](https://bibleproject.com/pt-br/videos/genesis-12-50/). A primeira informa 7:50 e descreve criação boa e rebelião humana; a segunda informa 8:11 e descreve a bênção às nações por meio de Abraão e a preservação de vidas na história de José (Gênesis 50:20). As quatro perguntas do recorte foram alinhadas a esses temas e às referências bíblicas. Isso é conferência de resumo oficial, **não assistência ao vídeo nem revisão de legendas integrais**. Os temas foram conferidos editorialmente por IA e revisados pelo agente coordenador. Durações exibidas nas páginas são arredondadas; o catálogo usa a soma fracionária dos segmentos HLS oficiais.

## Revisão textual editorial dos 71 recursos

O relatório público `VIDEO-EDITORIAL-REVIEW.json` registra a recuperação das 71 páginas oficiais e a revisão editorial por IA de 142 perguntas. A revisão usa os resumos/guias oficiais e referências bíblicas dentro do livro ou parte; não é revisão humana nem assistência aos vídeos. Quando a página traz resumo repetido do livro completo, a delimitação depende da referência bíblica da parte. Para Romanos 5–16 foi necessário o guia oficial de Romanos, pois a página isolada tem resumo genérico. Nenhuma pergunta deve ser descrita como fala literalmente verificada no áudio.

Gabaritos, alternativas reais e explicações devem ser inseridos exclusivamente no schema privado do banco. Os arquivos locais de seed em `docs/seeds/` não devem ser publicados no repositório público nem importados no bundle. Versionar apenas relatório de cobertura sem perguntas/respostas e testes sintéticos. A aprovação editorial por IA não liga `enabledForXp` nem aplica mudanças de banco por si só.


## Segurança e limite técnico

O cliente envia evidências, nunca concede XP nem escolhe duração ou gabarito. As RPCs antigas de confirmação também exigem cobertura e aprovação, evitando o bypass de 90 segundos. Uma sessão por usuário, sequência monotônica e relógio do servidor reduzem repetição e concorrência; nenhum deles impede falsificação completa de telemetria por um cliente modificado. O encerramento admite até 200 ms de arredondamento e pode aguardar o recibo final do relógio do servidor para compensar latência.

A contagem preserva uma fronteira contígua: trechos depois de um salto só passam a valer quando o usuário retorna ao primeiro trecho pendente. A interface oferece retomada e corrige lacunas curtas de pausa/buffering. O componente Mux é carregado sob demanda, sem cookies nem telemetria de tracking habilitados pela aplicação.
