# Adendo normativo — 1.189 capítulos, comentário por versículo e contexto

Versão editorial: `chapter-guide-1.1.0` · Aprovação do responsável pelo projeto em 23/10/2026.

Este adendo complementa e, nos pontos indicados, substitui a versão 1.0.0 de `GUIA-BIBLICO-POR-CAPITULO.md`. Não descarta seus princípios de fidelidade, contexto, responsabilidade editorial, fontes verificáveis e separação de conteúdo bíblico e recompensas.

## 1. Abrangência e identidade do guia

- Um guia específico para cada um dos 1.189 capítulos do cânon protestante: 929 capítulos em 39 livros do AT e 260 em 27 livros do NT.
- Chave obrigatória: `book_id + chapter + edition + biblical_text_hash + prompt_version`. A interface deve comparar a referência solicitada com a referência do conteúdo recebido.
- Uma referência sem conteúdo tem estado explícito de preparação/revisão. Nunca usar Gênesis 1 ou outro capítulo como fallback editorial.
- Os totais de versículos dependem da edição e da convenção de numeração. O catálogo de texto da edição selecionada define a cobertura; não impor 31.102 a todas as traduções ou tradições textuais.
- Catálogo e navegação completos não equivalem a 1.189 estudos redigidos, revisados e publicados. Registrar separadamente esses estados e informar o progresso real.

## 2. O que são as quatorze seções

São quatorze tópicos dentro do mesmo guia, não quatorze guias diferentes. A unidade é o guia de um capítulo; as cinco áreas agrupam esses tópicos para facilitar a leitura:

| Área | Tópicos |
| --- | --- |
| Entender o texto — Exegese | Mensagem, resumo, contexto, gênero e comentário por versículo |
| Conectar à Bíblia — Teologia bíblica | Lugar na história bíblica e referências cruzadas |
| Entender os ensinos — Teologia sistemática | Observações sobre Deus e humanidade, doutrinas e cuidados |
| Aplicar à vida | Aplicações e oração sugerida |
| Rever e aprender | Perguntas de reflexão e ferramenta de estudo |

História, cultura, geografia, medidas, línguas e manuscritos são aprofundamentos relacionados ao versículo ou contexto. Não obrigar o iniciante a abrir todos para compreender a mensagem central.

## 3. Seção 5 substituída: comentário versículo por versículo

Cobrir cada versículo individualmente, preservando também a explicação da unidade de sentido. Para cada item:

1. Referência exata e vínculo com a edição selecionada.
2. Texto bíblico exato, quando autorizado, sem modernização silenciosa de uma citação.
3. Explicação acessível do que o versículo comunica e de sua relação com os versículos vizinhos.
4. Observação, interpretação e limites claramente distinguidos.
5. Notas linguísticas, históricas, culturais ou textuais somente quando pertinentes e fundamentadas.
6. Fontes e localizadores das notas, com estado de revisão.

O agrupamento de versículos em uma perícope não substitui seus comentários individuais. Validar cobertura e ausência de repetição contra a lista efetiva de versículos da edição. A orientação de 800–1.200 palavras continua como referência para o guia resumido, não como teto para o comentário integral e seus aprofundamentos. Não truncar um capítulo longo para cumprir esse tamanho.

## 4. Hebraico, aramaico e grego

- Identificar o idioma da passagem, não apenas do livro. O AT é predominantemente hebraico, com passagens em aramaico; o NT é grego, podendo preservar expressões de outra língua. Uma tradução grega antiga do AT deve ser identificada como tradução/testemunho, não confundida com o hebraico da passagem.
- Informar forma original, lema, transliteração, referência, sentido contextual, fonte lexical e localizador. Acrescentar morfologia e sintaxe apenas quando forem verificadas e ajudarem a interpretação.
- Tratar etimologia histórica como informação relevante quando documentada; distingui-la do uso e do significado da palavra na época e na frase. Não somar todos os sentidos de um dicionário nem derivar doutrina automaticamente de uma raiz.
- Explicar palavras polissêmicas conforme o contexto e apresentar divergências relevantes com proporção. Números Strong facilitam identificação; não são, sozinhos, uma explicação exegética.
- Não inventar origens, raízes, pronúncias exatas, formas verbais, equivalências entre línguas ou significados ocultos. Sem fonte suficiente, omitir a nota ou marcá-la para revisão.
- Uma análise lexical pode apoiar uma interpretação, mas não garante ausência de erro doutrinário. Confrontar também gramática, argumento, gênero e contexto canônico.

## 5. História, cultura, mapas, pesos e medidas

- Contextualizar costumes, agricultura, economia, reinos, impérios, interlocutores, deslocamentos e condições sociais quando ajudarem a compreender o texto.
- Mapear apenas lugares sustentados pela passagem e por fontes identificadas. Distinguir local do acontecimento, remetente, destinatário e local de composição; não transformar uma metáfora ou local desconhecido em coordenada exata.
- Quando houver diferentes hipóteses geográficas, apresentar seu grau de certeza e não afirmar localização como fato.
- Pesos, moedas, comprimentos, capacidades e horas antigas devem preservar a unidade da tradução e registrar intervalos, época, região e fonte. Não impor uma única equivalência a todos os períodos; não converter automaticamente prata antiga em valor financeiro contemporâneo.
- Se a passagem não contiver medida ou local verificável, não inventar nota para preencher a interface.

## 6. Papiros, códices e variantes

- Papiro/pergaminho indicam material; rolo/códice indicam formato. Um códice pode ser de papiro. Não usar os termos como categorias mutuamente exclusivas.
- Para testemunho específico, registrar sigla/sistema de identificação, instituição custodiante, idioma, material/formato, intervalo de data com fundamento e incerteza, extensão preservada, referência, fólio/página quando disponível e link de catálogo/fac-símile.
- Conferir se o manuscrito efetivamente preserva os versículos. Um testemunho do mesmo livro não comprova automaticamente o capítulo ou a leitura alegada.
- Se houver somente um catálogo geral, rotular como acervo de referência; não apresentá-lo como verificação de um fólio não consultado.
- Distinguir idade do manuscrito e data de composição da obra. Manuscritos são testemunhos/copistas, não automaticamente os autógrafos dos autores bíblicos.
- Tratar variantes pertinentes com apoio em edição crítica/aparato ou pesquisa identificada, explicando a evidência e o impacto da variação sem sensacionalismo. Não inventar variantes nem classificá-las como irrelevantes ou decisivas sem análise.
- Respeitar direitos de imagens, transcrições e edições críticas. Linkar catálogos não autoriza copiar suas imagens para o aplicativo.

## 7. Validação e publicação

Separar estados de catálogo, texto bíblico, comentário por versículo, notas linguísticas, contexto e manuscritos. Aprovação de schema não equivale a revisão exegética. O teste de aceitação inclui trocar Gênesis 1 → Salmos 1 → João 1 → capítulo ainda em preparação e confirmar referência, conteúdo, progresso e fontes próprios em cada caso.

Geração e revisão devem acontecer em lote, com cache por versão e rastreabilidade; não apresentar 1.189 guias como concluídos por apenas criar 1.189 registros. Falhas ou indisponibilidade do guia nunca impedem a leitura diária.
