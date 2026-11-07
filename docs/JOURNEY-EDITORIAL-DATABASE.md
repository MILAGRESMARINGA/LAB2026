# Banco editorial da jornada

Migração: `lab-app/supabase/migrations/20261102151833_journey_editorial_atlas.sql`.

A arquitetura é aditiva e não altera planos anuais, progresso, relógio, vidas, XP ou usuários. A versão editorial é identificada por `release_id`; todo vínculo entre fontes, episódios e marcos pertence à mesma versão. Datas debatidas e coordenadas aproximadas pertencem ao conteúdo e devem conservar suas ressalvas.

| Tabela | Papel |
| --- | --- |
| `lab_journey_releases` | Versão, estado de publicação e atestado de revisão editorial |
| `lab_journey_sources` | Fonte, URL HTTPS, data de consulta, escopo e nota de direitos |
| `lab_journey_episodes` | Episódio por livro/faixa de capítulos, contexto e natureza literária |
| `lab_journey_chapter_anchors` | Marco regional único por capítulo, coordenadas, bioma, certeza e episódio |
| `lab_journey_evidence` | Afirmação delimitada, referências, fonte, certeza e cautela |

Leitores `anon` e `authenticated` têm apenas SELECT, condicionado por RLS à versão publicada. Rascunhos e versões arquivadas ficam invisíveis. O papel `service_role`, exclusivo do servidor, mantém a curadoria. Não há privilégio de publicação no navegador nem confiança em `user_metadata`. A chave de serviço nunca deve ir para o frontend.

Publicação exige `reviewed_by`, `reviewed_at` e `published_at` coerentes. Esses campos atestam revisão humana; não são prova arqueológica nem indicam treinamento de modelo. O autor editorial deve inserir novas versões para revisão, evitando modificar conteúdo já publicado. O aplicativo pode manter fallback curado local enquanto uma versão remota não estiver publicada e validada.

As faixas respeitam as quantidades de capítulos dos 66 livros. Marcos devem apontar ao mesmo livro/versão do episódio e estar dentro da sua faixa. Evidências exigem fonte da mesma versão. Os índices atendem consultas por versão/livro/faixa, episódio e fonte.

## Verificação

- Três contratos Vitest aprovados em `tests/journey-editorial-database.test.ts`.
- Migração executada com PostgreSQL embutido PGlite temporário, sem dependência adicionada ao projeto.
- `scripts/tests/journey-editorial-smoke.sql` passou: publicação sem revisão recusada; capítulo não canônico recusado; marco fora do episódio recusado; fonte ausente recusada; rascunhos ocultos; conteúdo publicado visível; escrita anônima/autenticada recusada; curadoria pelo serviço permitida. Os dados QA usam transação com rollback.
- A migração não foi aplicada ao Supabase remoto. O smoke também pode rodar por `psql -v ON_ERROR_STOP=1 -f scripts/tests/journey-editorial-smoke.sql` em banco PostgreSQL descartável já migrado e com os papéis Supabase.
- Changelog Supabase consultado em 2026-11-02; nenhuma mudança relevante de RLS identificada na listagem atual. Diretriz: https://supabase.com/docs/guides/database/postgres/row-level-security .

O catálogo de recuperação é base para RAG. A migração não cria chamadas de LLM, embeddings ou fine-tuning e não representa treinamento executado.
