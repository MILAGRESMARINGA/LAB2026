# Gate gratuito de backup e restauração P0

## O que o workflow prova

`.github/workflows/p0-backup-restore-gate.yml` mantém o backup/restore isolado e só libera o job de migrations depois que o restore PG17 passa. O release exige `main` e uma destas confirmações explícitas: alteração do marcador `.github/p0-release.trigger` no próprio head commit com a mensagem exata `release: p0 backup-restore-deploy`, ou dispatch com a opção `APPLY_P0_TO_PRODUCTION`. Esta etapa não dispara nenhum dos gatilhos.

1. Exige `main`, o project ref literal `azejfxvaamgkmfmwdzjn`, a variável `SUPABASE_PROJECT_REF` igual a esse literal e o secret de backup presente. O caminho/commit marcador é validado novamente dentro do job.
2. Confere o project ref sem imprimir a URL de conexão ou credenciais; aceita o host direto do projeto ou o usuário de pooler que contenha o ref.
3. Faz `pg_dump` compactado do schema `public` e restaura em um container PostgreSQL 17 efêmero.
4. Copia apenas os UUIDs de `auth.users` para a tabela Auth temporária mínima, necessária para satisfazer FKs dos dados públicos. As credenciais e metadados privados do GoTrue não são exportados para o runner.
5. Compara a contagem de linhas de cada tabela pública e valida os agregados canônicos: 31.101 versículos, 1.189 capítulos e 365 dias.
6. Registra somente quantidades agregadas e o SHA-256 do dump. Não envia artefatos e remove os arquivos e o container em `always()` e no trap de saída.

A cópia cobre o schema e dados de `public` usados pelas migrations do LABGame, com UUIDs Auth para integridade referencial. Ela **não é backup completo dos schemas internos do Supabase nem dos bytes do Storage**. O gate atual não autoriza exclusão de contas nem substitui a rotina de backup específica de Auth/Storage.

## Configuração necessária no GitHub

Crie os environments `p0-backup-read-only` e `p0-production-migrations`, ambos restritos a `main`. No environment de backup, configure `SUPABASE_DB_URL` com uma connection string TLS de leitura, incluindo leitura de todas as tabelas públicas e de `auth.users(id)`. No environment de migrations, configure `SUPABASE_ACCESS_TOKEN` e `SUPABASE_DB_PASSWORD` com credenciais de escrita necessárias ao CLI. Em ambos, configure `SUPABASE_PROJECT_REF=azejfxvaamgkmfmwdzjn`. Secrets ausentes ou refs divergentes falham antes de conectar ou invocar o Supabase CLI. O job de escrita usa `supabase link --project-ref azejfxvaamgkmfmwdzjn`, faz `db push --dry-run` e só então executa `db push --linked --yes`; ele depende do output de restore verificado.

O dispatch manual deve selecionar `APPLY_P0_TO_PRODUCTION`; o gatilho por push requer o arquivo marcador `.github/p0-release.trigger` adicionado ou alterado no próprio head commit e a mensagem exata `release: p0 backup-restore-deploy`. Não crie esse marcador até a revisão e promoção autorizadas.

## Limites da prova de restore e retenção

O job cria um dump temporário de `public`, copia somente os UUIDs de `auth.users` para satisfazer as FKs, restaura em um PostgreSQL 17 descartável, compara contagens por tabela e os três agregados canônicos, registra o SHA-256 e apaga os arquivos e o container. O SHA identifica o dump daquele job; o dump **não é guardado** como backup externo. A comparação não é checksum linha a linha.

Esse drill não contém senhas, e-mails ou metadados internos do Auth e não inclui os bytes do Storage. Portanto, comprova somente a restauração do escopo descrito; não oferece recuperação completa de Auth/Storage nem retenção de backup. Não remover dados de produção com base apenas nesse drill.

## Deploy de Edge Functions após as migrations

Depois de restore verificado e migrations aplicadas, o job `deploy-approved-edge-functions` usa a mesma referência e environment protegido, exige `SUPABASE_ACCESS_TOKEN`, verifica a CLI Supabase fixada em `2.121.0` e publica em sequência somente `account-delete` e `study-generate`, ambas com verificação JWT. Não publica funções de e-mail, notificação ou cron.

O job não configura nem imprime secrets de runtime. `study-generate` permanece fail-closed e não gera conteúdo enquanto `OPENAI_API_KEY` não estiver configurada com segurança no Supabase. O job não altera flags da Vercel que liberam exclusão ou Jornada V2.

## Fórmula do ranking das células

A liga V2 calcula, na janela dos últimos sete dias-calendário de São Paulo:

`média_XP = (XP de leitura + XP de estudo + XP de vídeo concedidos pelo servidor aos membros com opt-in) / número de membros com opt-in`

`consistência = (dias-membro de leitura + dias-membro de estudo + dias-membro de vídeo) / (3 × oportunidades de dias-membro)`

`multiplicador = 1 + 0,20 × consistência` (faixa 1,00–1,20)

`score = média_XP × multiplicador`

Cada categoria conta no máximo um dia-membro por dia. Entram apenas atividades posteriores à entrada da pessoa na célula e pessoas com `leaderboard_opt_in=true`; quem não consentiu não compõe XP, cobertura ou detalhes individuais. A liga nacional exige ao menos três membros e três opt-ins. O scorecard privado da própria célula retorna somente agregados. A mudança não cria outro `GC O Caminho`.

## Estudos cacheados

A migration `202610160110` usa chave cache única `journey:dia:refs:camada:versão`, gravada explicitamente pelo writer confiável; a unicidade também é aplicada pela tupla jornada/dia/referências/camada/versão, sem coluna gerada baseada em funções não imutáveis. Uma nova versão cria uma nova linha de cache, mas a recompensa tem chave de unidade sem a versão e não pode emitir XP outra vez para as mesmas referências, jornada, dia e camada. O cache é append-only para o runtime. A Layer 1 contém estudos curados dos três primeiros dias, com conexões exegéticas somente entre Gênesis 1/João 1, Gênesis 2–3 e Gênesis 4–5; Salmos 1 e 2 e João 2 ficam separados. Layers 2 e 3 têm catálogo e desbloqueio progressivo aos 30 e 90 dias, sem conteúdo fictício pré-semeado. A migration e o scorecard são exercitados pelo job `v2-postgres` em PostgreSQL 16 e 17.
