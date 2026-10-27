# Auditoria do léxico Strong — correção do Bloco 1

A auditoria encontrou um defeito no importador anterior: ele procurava o
primeiro código Strong em qualquer posição da linha e usava `fields[1]` como
lema. No formato TBESH/TBESG, o campo canônico é o primeiro campo para o
código, o quarto para o lema original e o quinto para a transliteração.

Isso fazia com que registros como `H1254a` fossem ignorados pela fronteira de
palavra, enquanto referências técnicas (`H0430G`, por exemplo) contaminavam o
lema. O parser corrigido:

- lê somente o código do primeiro campo;
- normaliza zeros e sufixos (`H1254a` → `H1254`, `H0430` → `H430`);
- usa os campos lexicais corretos;
- escolhe deterministicamente o registro sem sufixo, depois o sufixo `a`, sem
  alterar o release antigo;
- mantém a linha original em `definition` para auditoria.

## Dry-run verificado

| Fonte | Entradas corrigidas | SHA-256 |
|---|---:|---|
| TBESH | 8.723 | `464dccadd95fd8620dd05fa0d7a4caba58ec3c4d5db3ebf38e43d046ca25b591` |
| TBESG | 9.362 | `312f723d7b8ef263bbdfb0451c9b8057125804dfff390b6f8544cff2a84b57f4` |

O dry-run não escreveu no Supabase. A carga real deverá criar dois novos
releases `draft`, comparar os dados com os releases antigos e só então
reprocessar os vínculos TAHOT afetados. Nenhum registro antigo é sobrescrito.

## Gates

- Testes de contrato e parser: aprovados.
- `npm run verify:engineering`: 136 testes aprovados.
- `npm test`: 245 testes em 53 arquivos aprovados.
- `npm run build`: aprovado; permanece apenas o aviso preexistente de chunk
  grande.

O novo release ainda não foi promovido nem carregado no banco. A promoção exige
comparação editorial, validação de `H1254`, `H430` e dos registros derivados.
