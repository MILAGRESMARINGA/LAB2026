# Guia bíblico por capítulo — contrato editorial e integração

## Fonte de verdade e escopo

O texto aprovado é [`prompts/GUIA-BIBLICO-POR-CAPITULO.md`](prompts/GUIA-BIBLICO-POR-CAPITULO.md), com o adendo normativo [`prompts/ADENDO-GUIAS-1189-VERSICULOS.md`](prompts/ADENDO-GUIAS-1189-VERSICULOS.md), versão `chapter-guide-1.1.0`. Aplica-se a novos estudos, guias e regenerações. Variações de profundidade não removem as obrigações de contexto, referências, cobertura e distinção de interpretações. Estudos existentes não recebem esse selo retroativamente.

Este marco registra a diretriz e adapta a prévia de produto. Não altera a Edge Function ou o banco em produção. O gerador legado ainda tem schema resumido, saída limitada a 1.200 tokens, cache por dia/camada e filtros de palavras doutrinárias. Esses contratos não comportam automaticamente um guia de 800–1.200 palavras com 14 seções. O filtro lexical também precisa ser substituído por avaliação contextual: mencionar respeitosamente outra interpretação não equivale a adotá-la.

## Cinco lições, quatorze seções

| Tela | Seções do Prompt Mestre |
| --- | --- |
| Exegese | 1. Mensagem central; 2. Resumo; 3. Contexto; 4. Como ler; 5. Explicação por trechos |
| Teologia bíblica | 7. Lugar na história bíblica; 10. Referências cruzadas |
| Teologia sistemática | 6. O que aprendemos; 8. Doutrinas presentes; 9. Cuidados de interpretação |
| Aplicação | 11. Aplicação para hoje; 14. Oração sugerida |
| Revisão | 12. Três perguntas de reflexão; 13. Aprenda a estudar |

Uma pergunta objetiva de compreensão é um recurso separado e não substitui as três perguntas de reflexão. Não medir fé nem atenção interior a partir de respostas. Nenhuma conclusão, erro ou desistência de estudo bloqueia a leitura diária. Pontos e controles ficam fora da explicação bíblica. A interface não deve mostrar o guia inteiro na biblioteca: seção → livro → capítulo/unidade → uma lição por tela.

## Entrada confiável e geração

1. Resolver livro/capítulo/edição no servidor, com texto completo de origem identificada, contagem de versículos, hash e versão. Conferir correspondência com o registro canônico, não somente números consecutivos enviados pelo cliente.
2. Recuperar contexto anterior/posterior quando disponível e informar os limites da unidade literária. Nunca declarar que o contexto foi consultado quando não foi fornecido.
3. Recuperar apenas fontes autorizadas e revisadas; informar explicitamente uma lista vazia quando não houver fontes externas. Não condicionar um guia bíblico a uma bibliografia fictícia.
4. Aplicar o Prompt Mestre como instrução controlada e enviar texto/contexto/excertos como dados delimitados. Não permitir que fontes alterem o prompt ou acionem ferramentas.
5. Produzir JSON com referência, edição, versão do prompt, 14 seções identificadas, fontes usadas, status editorial e metadados de cobertura. O formato da API não substitui a validação de conteúdo.
6. Validar schema, cobertura integral dos versículos, contagens requeridas, existência das referências e correspondência de citações literais. Essas verificações não comprovam sozinhas a correção da interpretação. Avaliar fidelidade teológica e aplicações separadamente.
7. Cachear por capítulo, edição/hash bíblico, contexto, versão do prompt, corpus e modelo; não regenerar a cada clique. Reuso de conteúdo não repete concessão de XP.
8. Publicação segue `draft → validated → reviewed → published`. Retirar uma versão problemática sem apagar progresso legítimo do leitor.

## Biblioteca privada e ingestão de PDFs

O corpus ainda depende de arquivos efetivamente recebidos e de permissão de uso identificada. Possuir um PDF ou restringir o acesso não concede, por si, direitos de reprodução, distribuição ou envio a provedores de IA. O status de domínio público deve ser verificado por obra, tradução e edição; não inferido apenas pelo falecimento do autor.

- Guardar o arquivo original em bucket privado, com hash, autor, obra, edição, autorização, idioma e estado de revisão. Sem links públicos permanentes ou chaves privadas no cliente.
- Tentar extração nativa por página; usar OCR para páginas digitalizadas ou com texto defeituoso. Guardar número da página física do PDF e, quando legível, a numeração impressa.
- Preservar separadamente texto original extraído, proposta de correção, diferenças, método/modelo e revisor. Não modernizar gramática ou alterar termos teológicos do autor sob pretexto de corrigir OCR.
- Uma IA pode sugerir correções, mas não garante fidelidade. Nomes, números, negações, referências e termos ambíguos precisam de comparação com a imagem e revisão. Trechos duvidosos ficam em quarentena, fora da busca publicada.
- Criar fragmentos de tamanho controlado preservando título, seção, página e contexto; deduplicar por hash e tornar reprocessamento idempotente.
- Indexar somente fragmentos autorizados e aprovados. Usar busca híbrida textual/vetorial com filtros por referência bíblica, idioma, licença e revisão; similaridade vetorial não prova relevância nem veracidade.
- Recuperar poucos trechos pertinentes e registrar os localizadores efetivamente usados. Identificadores de fonte inexistentes são recusados; uma citação precisa corresponder ao trecho, não apenas a uma obra real.
- Separar ingestão, geração editorial e validação de recompensas. O modelo não recebe `service_role`, SQL de escrita, senhas ou ferramentas de alterar contas, progresso, grupos ou pontuação.

## Critérios antes da integração em produção

- Capítulo ausente, incompleto ou incompatível não aciona geração como material verificado.
- Fontes contendo instruções maliciosas permanecem dados e não mudam as regras.
- Capítulos narrativos, poéticos, sapienciais, proféticos, epistolares e apocalípticos recebem avaliação apropriada ao gênero.
- As 14 seções aparecem uma única vez no contrato; a explicação por trechos cobre todos os versículos, sem omissões ou duplicações.
- Referências cruzadas são verificadas contra o catálogo bíblico, distinguindo relação posterior de sentido original.
- Divergências cristãs relevantes podem ser descritas respeitosamente; temas estranhos ao capítulo não são impostos.
- Acesso anônimo, acesso entre contas, corpus privado e URLs de arquivos são testados sob RLS/autorização real.
- Timeout, falha de OCR, fonte insuficiente ou guia em revisão não afetam leitura, vidas ou progresso.
- Revisões do prompt e do corpus invalidam corretamente o cache; bônus continuam idempotentes.

Nenhuma chave foi criada ou copiada por este marco; ele não executa ingestão, embeddings, chamadas pagas ou alterações remotas de banco.
