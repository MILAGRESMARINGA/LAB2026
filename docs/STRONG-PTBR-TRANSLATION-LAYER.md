# Camada de tradução `pt-BR` do léxico Strong

## Objetivo

Oferecer ao primeiro lançamento brasileiro uma glosa curta em português para
cada entrada canônica Strong, sem alterar o hebraico, o grego, a transliteração
ou o conteúdo-fonte em inglês.

## Escopo entregue

- 18.085 entradas canônicas: 8.723 hebraicas e 9.362 gregas.
- Uma glosa curta em `pt-BR` por entrada.
- A definição longa original não é sobrescrita e não recebe tradução nesta fase.
- As linhas são identificadas como `machine` e `automatic-neural`.
- O lote é reproduzível por `scripts/translate-strong-ptbr.py`, usando Argos
  Translate `en→pt` e CTranslate2 localmente.

## Segurança editorial

A tradução é uma camada separada em `strong_lexicon_translations`, vinculada à
release e ao número Strong. A carga idempotente atualiza somente linhas ainda
marcadas como `machine`; uma revisão humana não é sobrescrita pelo gerador.

As políticas de leitura exigem que a release Strong associada esteja aprovada e
publicada. As releases desta carga continuam em `draft`, portanto nada desta
camada foi liberado ao público automaticamente.

## Regra de produto para a interface

A tela brasileira deve preferir `translated_gloss` quando `locale = 'pt-BR'`.
Caso a linha esteja marcada como `machine`, a interface deve exibir o aviso
discreto “Tradução automática em revisão”. O lema e a transliteração permanecem
sempre no idioma bíblico original.
