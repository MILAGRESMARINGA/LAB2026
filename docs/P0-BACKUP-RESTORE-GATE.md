# LABGAME P0 — backup e restauração verificáveis, sem custo extra

> O workflow [P0-CI-BACKUP-RESTORE-GATE.md](P0-CI-BACKUP-RESTORE-GATE.md) descreve o drill automatizado do GitHub Actions. Ele restaura em banco efêmero e apaga o dump no fim; é uma prova de restauração limitada, não uma cópia retida ou um backup completo de Auth/Storage. Preserve o procedimento local abaixo para criar e conservar uma cópia controlada, e não trate o drill do CI como cobertura contra perda de dados.

A publicação web pode ter status **READY** enquanto novas tabelas/funções ainda não existem no Supabase público. O release P0 que inclui dados pessoais, notificações e exclusão só pode prosseguir depois de prova de restauração do banco atual.

1. Execute localmente `pwsh -File ./scripts/backup-labgame.ps1` a partir da pasta `lab-app/`. Ele pede a senha **Supabase** diretamente no PC, cria um `.dump` privado e um manifesto com SHA256 (sem enviar credenciais para o GitHub/ChatGPT).
2. Execute `pwsh -File ./scripts/verify-labgame-restore.ps1 -ArchivePath "<CAMINHO_DO_DUMP>"`. O segundo script pergunta apenas a senha do **PostgreSQL LOCAL**, cria um banco novo com prefixo `labgame_restore_verify_`, restaura e confere conta, 1.189 capítulos, 31.101 versículos, 365 dias, GC e Jornada. Ele não apaga bancos existentes e preserva a cópia local para análise.
3. Preserve `.dump`, manifesto e banco restaurado somente em local seguro. Envie ao time apenas a indicação de `RESTORE_DRILL_VERIFIED` e as contagens não pessoais; **nunca** envie dump, senha, URL com credenciais ou hashes de senhas.
4. Se o restore falhar por extensão, papel `anon`/`authenticated` ou outro objeto exclusivo do Supabase, o teste **não está aprovado**. Resolva a compatibilidade do ambiente isolado e refaça a restauração. Um `pg_restore --list` sozinho não satisfaz o requisito.
5. Só após restauração verificável e avaliação dos dados legados, executar o dry-run das migrações P0 sobre cópia isolada; manter release V2 e exclusão desligados na Vercel enquanto esse aceite não existir.

## Status operacional — 16/10/2026

- O Supabase LABGAME pertence à organização **Free**, sem backup automático diário gerenciado.
- Projeto Vercel único: `labgame-biblia`. A produção web foi publicada a partir de `main` em `fd24fb9`, com `VITE_LAB_V2_READY=false` e `VITE_ACCOUNT_DELETION_READY=false`.
- Perfis, notificações e Jornada V2 ainda não têm migrações no Supabase público.
- **Falta** executar backup/restauração local real (a senha não pode ser obtida pelo conector). Nenhum atalho via SQL de produção substitui a prova de restauração.

## Atualização operacional — 17/10/2026

Esta seção substitui o status operacional datado de 16/10/2026 acima.

- Foi criado um dump completo antes das migrations, preservado localmente fora do repositório. O responsável restaurou esse dump em um Supabase local isolado. Foi necessário usar `pg_restore --no-owner` por incompatibilidade de ownership entre o ambiente Supabase e o container local.
- A restauração passou nas contagens: 1 usuário Auth, 1.189 capítulos, 31.101 versículos, 365 dias e 1.189 itens no plano. A cópia local não deve ser confundida com backup remoto retido.
- Após o restore, o responsável executou o alinhamento do histórico e `supabase db push`. A leitura direta do Supabase confirma 28 migrations aplicadas, incluindo as migrations de perfil, V2, anti-speedrun, cache de estudos, ranking e limites de geração.
- `study-generate` está publicada e ativa, versão 1, com verificação JWT habilitada.
- O commit `dfe34a2` na `main` passou no LAB CI (6/6). O status Vercel atual reporta limite de builds, então o deploy web dessa revisão não está confirmado.
- A auditoria confirmou RLS em 37/37 tabelas públicas. As sete tabelas sem policy não concedem acesso direto a `anon` ou `authenticated`; manter esse acesso fechado.
- Permanecem pendentes a ativação da proteção contra senhas vazadas, a revisão manual completa das 29 RPCs expostas a `authenticated` e um smoke test web após deploy Vercel bem-sucedido.
- A jornada V2 continua desligada por controle de release no banco. Não habilitar como consequência automática da aplicação das migrations.
