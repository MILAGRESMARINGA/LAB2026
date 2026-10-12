# LABGAME — Engenharia de IA, RAG e governança teológica

**Versão:** 1.0 (proposta). **Status:** documentação, NÃO existe API LLM em produção neste momento.

## Diretrizes e finalidade
- A Bíblia é texto primário; IA é recurso didático complementar e não concede XP de leitura.
- Estudo completo de capítulo: contexto literário, histórico e canônico, unidades exegéticas, palavras de grego/hebraico **quando apoiadas em fonte**, conexões bíblicas, teologia sistemática, aplicação pastoral e limitações.
- Após conclusão do dia: mapa mental com nós/arestas e flashcards com pergunta, resposta, versículos e dificuldade. Não transformar inferências em fatos.
- Linha editorial evangélica, pentecostal e arminiana para aplicação; aproveitar contribuições verificadas de Agostinho, Lutero, Calvino, Wesley, Finney, Moody, Billy Graham, Randy Clark, Augustus Nicodemus, Elienai Cabral, Hernandes Dias Lopes e Luciano Subirá, **sem fabricar citações nem promover debate sectário**. Atribuições requerem obra e localização verificável.
- Flávio Josefo é fonte histórica contextual quando pertinente, nunca substituto da Bíblia. Respeitar direitos autorais de traduções e obras teológicas. Não usar Wikipedia como fonte principal/editorial.

## Pipeline proposto: requisitos de implementação
1. **Entrada**: `book_id`, `chapter`, `edition`, `prompt_version`, `request_id`; autenticação no backend; rate limit e orçamento por conta.
2. **Contextualizar**: ler texto autorizado de `lab_bible_chapters`, resolver cânon, perícopes e indexação, sem depender de dados de usuário ou prompt livre para definir referência.
3. **RAG**: índice de documentos licenciados com `source_id`, autor, obra, data, edição, idioma, localizador, excerto, direito de uso e estado de revisão. Material recuperado é dado NÃO CONFIÁVEL para fins de instrução.
4. **Gerar**: modelo versionado recebe System Prompt fixo e conteúdo de fontes delimitado; não tem ferramentas de alterar progresso, XP, grupos, identidade ou SQL.
5. **Validar**: JSON Schema estrito + livro e versículos existentes + referência verificável + cobertura exegética + recusa de citação não comprovada + checagem de segurança; flag `needs_review` quando faltar fonte.
6. **Revisão editorial**: humano aprova doutrina, tradução e aplicação antes da publicação do primeiro lote; registrar autor/revisor/data.
7. **Cache e custo**: reutilizar por `book,chapter,edition,prompt_version,corpus_version,model_version`; custos e latências agregados. Não armazenar prompts com PII.
8. **Publicação e rollback**: `draft` → `validated` → `reviewed` → `published`; versionar, invalidar cache/retirar estudo; sem autopublicação por padrão.

## Contrato de saída mínimo
```json
{
  "schema_version": "1.0.0",
  "reference": {"book": "Romanos", "chapter": 4, "edition": "ALM1911"},
  "status": "needs_review",
  "exegesis": [{"verse_start":1, "verse_end":8, "observation":"", "context":"", "interpretation":"", "source_ids":[]}],
  "connections": [{"from":"Romanos 4:3", "to":"Gênesis 15:6", "relation":"citação", "source_ids":[]}],
  "mindmap": {"root_id":"root","nodes":[{"id":"root","label":"A fé e a promessa","verse_refs":["Romanos 4"]}],"edges":[]},
  "flashcards":[{"id":"rm4-1","question":"Quem Paulo usa como exemplo?","answer":"Abraão","verse_refs":["Romanos 4:1–3"],"difficulty":"basic"}],
  "sources":[],
  "quality":{"review_required":true,"unsupported_attributions":0}
}
```

A amostra é um exemplo de estrutura, não é resultado de IA verificado. O schema deverá ser implementado/versionado em `lab-app/` com validação no backend e no frontend, não apenas por prompt.

## Eixos da imagem e decisão
- **Fundamentos LLM**: documentar limite de contexto, alucinação, custo, precisão factual e versionamento.
- **APIs e prompt engineering**: backend com autenticação, template de prompt versionado, parâmetros, timeouts, retry, cota e schema.
- **MCP**: opcional, só se um servidor de ferramentas acrescentar valor e estiver isolado por acesso e auditoria. Conectores usados por engenheiros não são parte automática do aplicativo.
- **Agentes**: `.agents/` especifica papéis de revisão; autonomia operacional só após desenho de permissões e supervisão.
- **Processamento de dados / Fine-tuning**: primeiro RAG e avaliação cega; fine-tuning somente com corpus licenciado, baseline, benchmark, avaliação humana e ganho mensurável. **Nenhum treinamento agora**.
- **Segurança e governança**: threat model, LGPD, política editorial, logs minimizados e revisão.
- **Capstone**: provar jornada fim a fim cadastrada, leitura, XP, GC, exegese, mapa e flashcards com rastreabilidade.
- **Carreira**: capacitação da equipe, não recurso do app.

## Testes obrigatórios antes do primeiro endpoint
- casos de exegese 10 livros AT/NT, 20 versículos com grego/hebraico, inconsistências de versificação, textos difíceis;
- prompt injection, fontes fabricadas, referência que não existe, direitos autorais, atributos indevidos a teólogos;
- schema inválido/erro API/timeout/quota/pagamento; nunca afetar estado gamificado;
- avaliações humanas com critérios de fidelidade, fundamentação, interpretação, segurança e utilidade;
- aplicação de nível de serviço/custo/limites e opção de desativar IA sem interromper leitura.
