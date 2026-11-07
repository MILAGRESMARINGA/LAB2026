# Cliente editorial da jornada

`src/features/journey-editorial-repository.ts` é o adaptador de leitura da camada editorial. `useJourneyEditorialContext.ts` entrega fontes locais imediatamente e aceita uma edição remota publicada após validação. Nenhuma função escreve no banco ou altera elegibilidade, capítulos, XP ou progresso.

## Contrato

- Transporte injetado `(query: {book, chapter}, signal: AbortSignal) => Promise<{release, evidence, sources} | null>`.
- `createSupabaseJourneyEditorialTransport(client)` usa somente SELECT no cliente comum recebido; não cria cliente com privilégios elevados.
- Lê a edição publicada mais recente (`published_at`, desempate `id`), depois evidências cuja faixa inclui o capítulo e suas fontes da mesma edição. Não junta registros de edições diferentes.
- Metadados de revisão, livro/capítulo, tipo de evidência, confiança, referência e URL HTTPS são validados antes da apresentação. Um erro invalida a resposta inteira e preserva o conteúdo local; fonte ausente não é inventada.
- Resposta vazia válida significa ausência editorial explícita, sem misturar novamente conteúdo local de outra edição.
- Cache em memória da sessão: até 64 capítulos, cinco minutos para sucesso, 30 segundos para indisponibilidade. A expiração permite receber nova publicação/revogação. Não é cache persistente e não contém dados pessoais.
- Requisições simultâneas do mesmo capítulo são deduplicadas; limite de 3,5 segundos aborta a consulta e permite continuar com as fontes embarcadas.
- O hook descarta respostas tardias da leitura anterior e evita contexto incorreto enquanto a câmera troca de região.

## Ativação

A consulta remota fica DESLIGADA por padrão. Somente após aplicar e validar a migração editorial e publicar uma edição revisada, definir `VITE_JOURNEY_EDITORIAL_REMOTE=true` no ambiente apropriado e reconstruir o frontend. Sem a configuração ou sem cliente Supabase, a jornada continua usando `getJourneyEvidence` local e não faz requisições às novas tabelas. Uma falha de API após ativação também preserva a leitura local.

A migração não foi aplicada remotamente por este adaptador. O catálogo inicial não equivale a cobertura histórica completa. LLM e fine-tuning não são chamados pelo repositório; este código implementa recuperação de contexto curado, não geração ou treinamento.

## Verificação

Testes unitários exercitam revisão/publicação, rejeição de contexto cruzado e URL insegura, falta de fontes, limites de tempo, abort, cache, deduplicação, cópias independentes e ausência de evidência. Testes de hook cobrem troca de capítulo com resultado tardio e preservação local em falha. A verificação do Data API com as novas tabelas e RLS depende da aplicação da migração em um ambiente de homologação.
