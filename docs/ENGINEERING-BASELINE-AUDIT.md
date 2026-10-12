# LABGAME — Auditoria de maturidade nos 12 pilares

**Data:** 2026-10-12 · **Evidência:** branch `lab-rebuild-2026`, commit inicial da auditoria `ca5766b296ef4a571ac4039fdd3f978ae6761dc6`.
**Escopo:** somente `lab-app/`, `docs/`, `.agents/` e `.github/workflows/lab-ci.yml`. A pasta legada `project/` é de outro sistema e NÃO deve ser misturada, executada ou migrada para LABGAME.

**Critério de estados:** IMPLEMENTADO = evidência em código, PARCIAL = existe base, AUSENTE = não há implementação verificada, CONTEXTUAL = treinamento interno, não é recurso do app. Documento não equivale a recurso operacional.

| # | Pilar das imagens | Evidência atual | Diagnóstico | Próxima entrega verificável |
|---|---|---|---|---|
| 1 | Fundamentos de IA e LLMs | Estudos editoriais determinísticos em `src/domain/studies.ts` | PARCIAL: não existe chamada LLM em produção | Política de modelos, avaliação factual, custos, injeção de prompts e limites |
| 2 | APIs de IA generativa / prompts | Supabase RPC para leitura; ausência de API de geração | AUSENTE | Backend autenticado `generate-study`, versionamento de prompt e saída com JSON Schema |
| 3 | MCP | Conectores de desenvolvimento usados externamente, sem servidor MCP próprio do LABGAME | AUSENTE no produto (opcional) | Avaliar se MCP agrega valor para ferramentas autorizadas, sem expor dados/segredos |
| 4 | Agentes autônomos | 12 arquivos `.agents/agents/*/agent.md` | PARCIAL: papéis escritos, **não são agentes executando** | Contrato de delegação, evidências, escopo, aprovação e veto de segurança |
| 5 | UX/UI com IA | React SPA, leitor, jornada, GCs, vídeos e autenticação | PARCIAL: telas existentes; sem avaliação WCAG/E2E | Design system, WCAG 2.2 AA, fluxo mobile, testes visuais e com usuários |
| 6 | IA/automação em DevOps | GitHub Actions testa + compila; Vercel deploy | PARCIAL: falta controle de permissões e security gates | CI com gates, inventário de dependências, scans e trilha de release |
| 7 | Gestão de projetos com IA | `docs/ROADMAP.md` com pendências e etapas | PARCIAL: sem ADRs e traceabilidade formal | Template PR, RFC, ADR, DoD, risco, dono e aceite reproduzível |
| 8 | Arquitetura de sistemas com IA | `docs/ARCHITECTURE.md` v0.1 desatualizado | PARCIAL | Contexto C4, confiança, eventos, dados, ambientes e ADRs |
| 9 | Processamento de dados e fine-tuning | 66 livros / 1.189 capítulos, Almeida 1911 no Supabase | PARCIAL: curadoria presente, **sem corpus RAG/fine-tuning** | RAG com fontes licenciadas, proveniência e avaliação antes de fine-tuning |
| 10 | Segurança e governança de IA | RLS, auth, SQL RPCs e limitações de cliente; script PWA | PARCIAL: falta threat model/testes contínuos | STRIDE, LGPD, secret scanning, política de resposta, proteção de API |
| 11 | Capstone / projeto integrador | LABGAME combina login, Bíblia, jogo, grupos e vídeos | PARCIAL | Jornada end-to-end homologada: cadastro→leitura→XP→GC→estudo IA |
| 12 | Carreira / entrevistas de engenharia de IA | Não é funcionalidade do aplicativo | CONTEXTUAL | Guia de competências e evidências de entrega para equipe, não inserir features de carreira no LABGAME |

## Principais riscos encontrados

- **R01 CRÍTICO operacional:** repositório mistura código `project/` de CRM com LABGAME; nunca executar migrações ou deploys daquele diretório no Supabase LABGAME. Existe pasta `supabase/.temp/` versionada no legado; auditar e remover rastros de configuração após preservar backup e histórico, sem divulgar conteúdo.
- **R02 ALTO:** autenticação SMTP ainda não homologada com uma conta real. URLs foram visualmente confirmadas; modelos/credenciais e envio demandam ativação no painel.
- **R03 ALTO:** RLS / `SECURITY DEFINER` protegidos no SQL, mas falta pipeline de testes de autorização com usuários reais em projeto isolado e revisão externa.
- **R04 ALTO:** GitHub Actions sem gates automatizados de segredos, permissões explícitas, vulnerabilidades ou revisão de infraestrutura.
- **R05 ALTO:** arquitetura v0.1 contradiz o aplicativo real (afirma que estado ainda é exclusivamente em memória e autenticação futura).
- **R06 MÉDIO:** vídeo e cronograma de XP são alvos de fraude; evidência de vídeo ainda depende de declaração e tempo mínimo; sem prova de reprodução integral.
- **R07 MÉDIO:** faltam E2E web/mobile, WCAG e política LGPD detalhada de comunidade, crianças e ranking.
- **R08 MÉDIO:** inexistência de pipeline RAG controlado; LLM poderá inventar citações e interpretações se integrado sem política e revisão editorial.
- **R09 MÉDIO:** `lab-app` não contém `package-lock.json` e CI usa `npm install`, prejudicando reprodutibilidade da cadeia de suprimentos.

## Aceite de maturidade

Cada requisito tem: ID, owner humano, modelo de ameaça quando pertinente, documentação, commit, teste executado, observabilidade e status. **Sem evidência, não declarar entregue.** Separar testes unitários simulados de homologação real de SMTP, GC, permissões SQL, dispositivo e IA. Mudanças passam pelo contrato `docs/ENGINEERING-STANDARDS.md`; decisões passam por ADR em `docs/adr/`.

Próxima auditoria formal: após a primeira integração de IA e antes de abrir cadastro em produção.
