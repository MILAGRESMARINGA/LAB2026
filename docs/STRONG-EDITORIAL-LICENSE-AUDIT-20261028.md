# LABGame — Decisão de licenças e auditoria editorial do Strong

**Data da verificação:** 2026-10-28  
**Escopo:** STEPBible TBESH/TBESG, TAHOT/TAGNT, glosas pt-BR e StrongLexiconDrawer.

## 1. Direitos de uso: fonte verificada, publicação condicionada

A página oficial `https://github.com/STEPBible/STEPBible-Data` identifica seu conjunto de dados como **CC BY 4.0**, permite incorporar dados e modificar sem autorização adicional e exige crédito a STEP Bible, link para a fonte e registro das modificações. O texto jurídico da Creative Commons `https://creativecommons.org/licenses/by/4.0/` permite usos comerciais e adaptações mediante atribuição e indicação das alterações.

**Releases de origem efetivamente registradas:**

| Origem | Código-fonte / referência | SHA-256 do artefato |
| --- | --- | --- |
| TBESH (léxico hebraico) | Git commit 48b7cfbda441adb6445ea565b4ed23dd98dfdf2e | 464dccadd95fd8620dd05fa0d7a4caba58ec3c4d5db3ebf38e43d046ca25b591 |
| TBESG (léxico grego) | Git commit 805360e477f2668119806241fb2eea07544b765e | 312f723d7b8ef263bbdfb0451c9b8057125804dfff390b6f8544cff2a84b57f4 |
| TAHOT (tags hebraicas) | Git commit be4191f0082aeedddb0eff0c02c966292b2bd641 | 1ac5d58521521f62ada6528b953c42fb35875e5952af8d5dc494c6141b1f0620 |
| TAGNT (tags gregas) | Git commit be4191f0082aeedddb0eff0c02c966292b2bd641 | ebf7d752faf67dc62883e54b8e82038eef5b48f54453849f872be2450c90005f |

Todos estão documentados no Supabase com `rights_status='approved'`, `publication_status='draft'`. **Decisão:** a documentação pública da licença é compatível com uso mediante atribuição; NÃO criar uma autorização jurídica que não foi concedida e NÃO alterar o status de publicação por causa desta auditoria.

Há **uma advertência de interpretação**: página histórica oficial de STEP Bible sobre copyrights/licenças convida projetos com fins lucrativos a solicitar licença individual. A documentação atual do próprio repositório declara CC BY 4.0. Para um produto com monetização futura, registrar consulta de esclarecimento à STEPBible antes de afirmar aprovação comercial sem ressalvas. O uso da CC BY 4.0 deve observar o instrumento jurídico específico; esta nota não constitui aconselhamento jurídico.

**Atribuição obrigatória no produto:** “Dados lexicais e vinculação de versículos: STEP Bible / Tyndale House, Cambridge. Fonte: https://github.com/STEPBible/STEPBible-Data. Licença: https://creativecommons.org/licenses/by/4.0/. Modificações: normalização dos números Strong, coordenadas alinhadas à referência KJV e criação de glosas automáticas pt-BR para revisão. Não há endosso do titular.” A implementação a inclui no drawer.

**Separação de direitos:** não foram analisadas nesta aprovação as licenças NVI/NAA/ARA/NTLH nem direitos de obras teológicas ou de PDFs. Ter texto no banco ou `rights_status=licensed` não é prova documental de autorização contratual para distribuição em aplicativo público.

## 2. Inventário verificado por SQL de leitura

- 446.231 registros `verse_strong_links` para 31.102 coordenadas de versículos e 1.189 capítulos; **todos** `review_status='pending'`.
- 446.231 têm `source_locator` e `token_text`; nenhum token tem posição inválida.
- 446.231 registros possuem `confidence=null`. Isto **não** significa que estejam errados; também não significa que tenham sido auditados semanticamente.
- Léxico canônico v2: 8.723 entradas hebraicas e 9.362 gregas (18.085), com releases em `draft`.
- Traduções `pt-BR`: 18.085, todas automáticas (`machine`) e nenhuma marcada como `human-reviewed`.
- Exemplo de falha substantiva: G5485 `χάρις` ainda constava como *grace*; G1722 como `em/em/em/em`; G3056 acrescentava “o Verbo” indiscriminadamente a uma glosa lexical geral; H853 reproduzia `[Obj.]` em inglês; H776 tinha equivalência pouco natural.

## 3. Princípios exegéticos obrigatórios

1. **Texto antes do léxico:** verificar gramática, sintaxe, gênero literário, autor, audiência e contexto de cada passagem.
2. **Sem falácia da raiz:** etimologia ou soma de significados não determina o sentido de uma ocorrência.
3. **Sem polissemia acumulada:** as acepções são possibilidades, não todos os significados simultâneos em um versículo.
4. **Diferença entre léxico e teologia:** `G3056` não é automaticamente título cristológico em toda ocorrência; o uso de João 1 depende do contexto textual. `H430` no plural morfológico não prova, isoladamente, uma doutrina da Trindade.
5. **Fidelidade a variantes:** TAHOT/TAGNT têm tradições e variantes; correspondência KJV é índice técnico para busca, não equivalência textual exata com NAA/NVI/ARA/NTLH.
6. **Distinguir exegese de aplicação:** interpretação de base deve declarar passagens, evidências e limites, separada da aplicação pastoral Pentecostal Arminiana.
7. **Fonte neutra:** a escolha de leitura doutrinária não altera as formas hebraicas e gregas nem apaga interpretações acadêmicas divergentes.
8. **Direitos e atribuição sempre visíveis:** não exibir glosas revisadas sem trilha de autoria e fonte verificável.

## 4. Status e gates

| Objeto | Decisão | Motivo |
| --- | --- | --- |
| STEPBible TBESH/TBESG/TAHOT/TAGNT | **Fonte/licença verificadas; com atribuição** | CC BY 4.0 é declarada no repositório oficial, artefatos rastreados no banco |
| 446.231 associações de versículo | **Revisão editorial pendente** | QA estrutural aprovada, mas não foi executada exegese independente de cada ocorrência |
| 18.085 glosas pt-BR | **Revisão editorial pendente** | Produzidas por tradução automática; inconsistências identificadas |
| Proposta de correções prioritárias | **Pronta, não publicada** | Revisar e depois aplicar; permanece com status machine até conferência humana |
| Publicar todos os termos | **Bloqueado** | Nenhum `review_status='approved'`; os metadados de release permanecem em draft |
| RPC e interface | **Código preparado com controles adicionais** | `SECURITY INVOKER`, RLS, tradução somente quando `reviewed`, crédito CC BY 4.0, flag desligada |

## 5. Próximos controles de auditoria

- Homologar revisão amostral estratificada por AT/NT, livro, capítulo e homógrafos, com registro de revisores/ocorrências e dúvidas.
- Para cada lote aprovado: validação dupla entre palavra original, número Strong e referência KJV; conferência do conteúdo jurídico e logs de publicação.
- Exigir status `human-reviewed` **somente após revisão real por pessoa**; revisão gerada por IA deve continuar marcada como máquina.
- Comprovar backup restaurável de produção e ensaio de rollback antes das migrações ou de alterar releases globais.
- **Nunca** publicar a totalidade de um conjunto apenas porque todos os registros têm proveniência técnica.

## 6. Alerta crítico sobre traduções modernas (issue #83)

A auditoria do Supabase encontrou `rights_status=licensed` e `available=true` para NVI, NAA, ARA e NTLH, mas `rights_evidence_url` aponta exclusivamente a `https://github.com/damarals/biblias/releases/tag/v1.0.0`. Esta é a **proveniência técnica** da importação, não uma autorização emitida pelos titulares.

O próprio `damarals/biblias/src/catalog.py` declara NVI/NAA/ARA/NTLH como `copyright`. As regras da Biblica para NVI exigem permissão escrita para texto integral em apps: https://www.biblica.com/permissions/. A licença MIT que cobre o código-fonte do repositório de terceiros não confere automaticamente direitos sobre a tradução protegida. A autorização de app e a licença de dados STEPBible CC BY 4.0 são assuntos distintos.

**Decisão de risco:** NÃO aprovar o lançamento público dessas quatro edições sem documento de autorização do titular para a modalidade do LABGame (uso digital, IA, cache/offline e eventual monetização). Registrar prova privada de direitos e manter a alternativa de domínio público. Evitar qualquer migração destrutiva ou troca de `available` durante esta revisão, até confirmação de backup e aprovação de mudança operacional.

Registro: https://github.com/MILAGRESMARINGA/LAB2026/issues/83

## 7. Limite de delegação editorial

Este trabalho fez a verificação de licença de dados **STEPBible**, a auditoria estrutural e a proposta editorial de traduções, mas **não fez uma revisão filológica humana de 446.231 ocorrências**. Como o banco exige `human-reviewed` para `translation_status='reviewed'`, nenhuma IA deve declarar esse estado. A publicação global permanece **não aprovada**, enquanto partes previamente verificadas podem ser submetidas a revisão efetiva com rastreabilidade.
