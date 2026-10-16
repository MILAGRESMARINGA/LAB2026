# LABGAME 3.0 — Leitura Anual da Bíblia Gamificada

Repositório **exclusivo** do LABGame: jornada bíblica individual e em GCs, leitura anual, progresso diário, autenticação, XP e vídeos BibleProject.

## Código do aplicativo

- Aplicação web/PWA: [lab-app/](lab-app/)
- Banco, migrações e funções Supabase do LABGame: [lab-app/supabase/](lab-app/supabase/)
- Testes do aplicativo: [lab-app/tests/](lab-app/tests/) e [lab-app/scripts/tests/](lab-app/scripts/tests/)
- Documentação técnica: [docs/](docs/)
- Agentes e regras de desenvolvimento: [.agents/](.agents/)

`main` é a ramificação principal; `lab-rebuild-2026` mantém a implementação P0 em evolução.

## Testar localmente (sem contratar serviços)

```sh
cd lab-app
npm install --no-audit --no-fund
npm run verify:engineering
npm test
npm run build
```

O GitHub Actions também testa a aplicação, inclusive com banco PostgreSQL e autenticação Supabase **descartáveis**, sem usar usuários reais da produção.

## Isolamento definitivo do CRM

Este repositório **não contém mais a aplicação CRMIMOBI**, seu backend de WhatsApp nem suas migrações. Os antigos diretórios `project/` e `supabase/` da raiz foram removidos; o histórico de commits do GitHub permanece acessível conforme a política de retenção do Git. O CRM Brokers fica em seu repositório separado e **não é dependência do LABGame**.

**Segurança:** não publicar migrações ou funções que apagam dados reais antes do backup restaurável, ensaio e homologação. Usar custo adicional zero, salvo autorização expressa.
