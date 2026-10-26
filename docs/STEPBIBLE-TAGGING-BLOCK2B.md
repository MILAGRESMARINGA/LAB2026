# Bloco 2B — STEPBible TAHOT/TAGNT

## Estado da execução

Execução realizada em 26/10/2026 sobre o commit imutável
`be4191f0082aeedddb0eff0c02c966292b2bd641` do repositório oficial
`STEPBible/STEPBible-Data`. O importador verifica os hashes e o cabeçalho de
licença antes de qualquer escrita no banco.

| Artefato | SHA-256 do bundle | Release | Estado |
|---|---|---|---|
| TAHOT (AT) | `1ac5d58521521f62ada6528b953c42fb35875e5952af8d5dc494c6141b1f0620` | `f5504852-1985-4005-ad25-88183adf16d2` | approved / draft |
| TAGNT (NT) | `ebf7d752faf67dc62883e54b8e82038eef5b48f54453849f872be2450c90005f` | `7570012d-9f22-420d-8499-e2b08d71c29e` | approved / draft |

Os metadados registram a atribuição `STEPBible.org / Tyndale House CC BY 4.0`.
Os tokens preservam a ordem do artefato original e as coordenadas KJV; não são
um alinhamento palavra-a-palavra com uma tradução portuguesa.

## Quadro final do Supabase

| Métrica | Resultado |
|---|---:|
| `strong_tagging_releases` criados | 2 |
| `verse_strong_links` total | 392.330 |
| TAHOT | 251.135 |
| TAGNT | 141.195 |
| capítulos cobertos | 1.189 |
| coordenadas de versículo cobertas | 31.102 |
| órfãos de lexicon/referência | 0 |
| estados de revisão | 392.330 `pending` |

Distribuição: 246.410 hebraicos, 4.725 aramaicos e 141.195 gregos.

## Validação editorial da Etapa 1

| Referência | Código | Resultado |
|---|---|---|
| Gênesis 1.1 | H7225 | passou |
| Gênesis 1.1 | H1254 | bloqueado: chave base ausente no léxico carregado |
| Gênesis 1.1 | H430 / armazenado H0430 | passou |
| Salmos 1.1 | H835 | passou |
| Salmos 1.2 | H1897 | passou |
| João 1.1 | G746 | passou |
| João 1.1 | G3056 | passou |
| João 1.14 | G4637 | passou |
| João 1.29 | G286 | passou |

Resultado: 8/9 verificações passaram. A publicação permanece bloqueada até a
correção/auditoria do léxico hebraico (incluindo H1254) e a revisão editorial.
Não foram criados links órfãos para códigos ausentes: 538 bases normalizadas e
53.888 ocorrências AT foram descartadas pelo filtro referencial. Duas posições
NT com variante tradicional sem resolução permanecem documentadas pelo
importador para revisão.

## Segurança e reprodutibilidade

- Normalização: `H1254a` → `H1254` e `G3056A` → `G3056`, com resolução para a
  chave efetivamente existente no léxico.
- Inserção em lotes de 5.000, com `ON CONFLICT DO NOTHING`; reexecuções dos
  primeiros lotes AT/NT inseriram zero duplicatas.
- Nenhuma chave privada, segredo, workflow ou regra de proteção foi alterada.
- Os releases e todos os links permanecem `draft`/`pending`; não houve
  promoção para publicação.

## Verificações de engenharia

- `npm run verify:engineering`: aprovado, 134 testes.
- `npm test`: aprovado, 245 testes em 53 arquivos.
- `npm run build`: aprovado; apenas o aviso preexistente de chunk grande.

O acesso público autenticado às tabelas continua bloqueado por ACL/RLS no
estado atual; não foi alterado neste PR. A abertura de leitura deve ser uma
mudança separada, com política revisada.
