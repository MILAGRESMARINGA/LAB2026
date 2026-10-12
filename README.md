# LABGAME — Leitura Anual da Bíblia Gamificada

Jornada bíblica individual e em GCs (grupos de crescimento), com disciplina diária, histórico pessoal, XP no servidor, leitura integrada e vídeos BibleProject.

**Branch de desenvolvimento:** `lab-rebuild-2026`. Aplicação: `lab-app/`.

## Documentação e engenharia
- [Índice e documentos arquiteturais](docs/INDEX.md)
- [Padrões de engenharia e critérios de entrega](docs/ENGINEERING-STANDARDS.md)
- [Auditoria dos 12 pilares](docs/ENGINEERING-BASELINE-AUDIT.md)
- [Modelo de ameaças](docs/SECURITY-THREAT-MODEL.md)
- [Agentes especialistas e contrato de validação](.agents/WORKFLOW.md)
- [Roadmap do produto](docs/ROADMAP.md)

## Testes e build

```sh
cd lab-app
npm install --no-audit --no-fund
npm run verify:engineering
npm test
npm run build
```

A automação GitHub Actions executa os mesmos controles. A geração de estudos bíblicos por IA/RAG permanece planejada, com governança e revisão editorial antes da publicação.

## Isolamento de sistemas

Os diretórios `project/` e `supabase/` da raiz pertencem ao código legado de CRM, fora do escopo desta aplicação. Não usar suas migrações, arquivos de ambiente ou banco de dados para LABGAME.

**Ainda pendente para operação pública:** entrega real de e-mail SMTP, verificações RLS multiusuário, lockfile npm, auditoria de dependências, staging isolado, acessibilidade e validação em dispositivos reais.
