# StrongLexiconDrawer — entrega condicionada à liberação editorial

## Evidências 28/10/2026

Supabase LABGame contém 446.231 vínculos em `verse_strong_links`, todos `review_status=pending`, e 18.085 registros de tradução `pt-BR` (`machine`). As quatro releases do léxico consultadas estão `approved/draft`. A base `lab_strong_lexicon` antiga está vazia; o repositório atual usa `strong_hebrew`, `strong_greek` e `strong_lexicon_translations`. O vínculo por versículo foi importado com **edition=KJV**, não com as quatro traduções brasileiras.

**Conclusão:** a carga de dados existe, mas consulta pública não deve ser liberada sem revisão editorial.

## Implementação nesta branch

- Migração `202610280001_strong_reader_rpc.sql`: função read-only `lab_strong_verse_lookup` com `SECURITY INVOKER`, grant exclusivo ao papel autenticado, RLS nativo das tabelas, `rights_status='approved'`, `publication_status='published'`, `review_status='approved'` e limite de 48 termos.
- `StrongLexiconDrawer.tsx`: lema original, número Strong, idioma, transliteração e glosa portuguesa. Informações originais são preservadas; tradução longa só é exibida se revisada.
- Botão **Strong · v.X** junto do versículo na leitura e seletor de capítulo/versículo dentro dos estudos.
- Se não houver conteúdo liberado, mostrar mensagem de revisão, nunca inventar definição nem fazer fallback a dados em draft.
- Feature flag `VITE_LAB_STRONG_READY=true` **somente depois da homologação da migração, conteúdo e UI**. Por padrão, desabilitada.
- Não atribui XP nem marca capítulos como lidos.

## Homologação antes da produção

1. Executar a suite PostgreSQL isolada, testes do componente e verificação de contraste/acessibilidade e regressão de leitura.
2. Fazer backup verificável e aplicar a migração sob controle de mudança; revisar as políticas e grants no Supabase.
3. Aprovar editorialmente releases, fontes, atribuições e mapeamentos tokenizados, verificando direitos de publicação; a migração **não aprova nenhum registro**.
4. Revisar a tradução automática para pt-BR por amostragem sistemática e priorizar termos com ambiguidade teológica. O status `machine` deve continuar visível.
5. Habilitar a flag somente após conteúdo aprovado estar retornando, com testes em Gênesis 1:1 e João 1:1 usando usuário real de homologação.
6. Não prometer alinhamento palavra-por-palavra com NVI/NAA/ARA/NTLH. O dataset segue a referência KJV.

O Léxico Strong oferece subsídios lexicais e **não substitui a exegese contextual**.
