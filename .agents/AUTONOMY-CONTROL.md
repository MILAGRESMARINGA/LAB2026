# LABGame — Autonomia controlada dos agentes

## Capacidade e limites

Os 12 contratos em `agents/*/agent.md` definem especialidades; `ai-engineer` coordena. O workflow `.github/workflows/ai-agent-orchestrator.yml` permite receber uma tarefa direta do responsável ou uma issue criada pelo console de voz. A issue é apenas entrada de dados, não comando executável.

O executor pode propor e gravar até oito arquivos de código em caminhos explicitamente permitidos pelo `.agents/scripts/agent-writer-core.mjs`. São proibidas mudanças aos workflows, contratos, manifestos, dependências, credenciais, arquivos de configuração de deploy e fontes externas ao LABGame. Escritas vão para `agent/*` e só saem como Draft PR para `lab-rebuild-2026`; `main` e `lab-rebuild-2026` não são alvos de push. Nenhum auto-merge está configurado.

Comandos não são escolhidos pelo modelo. Apenas `npm run verify:engineering`, `npm test` e `npm run build` rodam em processo filho com ambiente sem tokens/segredos. Checkout não persiste credenciais; o token GitHub é usado pelo processo controlador para criar um commit e um Draft PR. O runtime não recebe segredos Supabase, Vercel, banco de produção ou e-mail.

## FinOps e aprovação presidencial

Inferência é uma capacidade habilitada, não autorização ilimitada. O intake de voz despacha com `approved_spend_brl=0`, que bloqueia a chamada de modelo. Para uma execução paga, o responsável deve despachar manualmente o workflow como `MILAGRESMARINGA` e informar um teto positivo. Limites de tokens reduzem exposição, mas não substituem um hard spend cap do provedor; a política de custo do projeto deve manter alertas/limites próprios. Nenhuma alteração de configuração do provedor é feita pelo agente.

O campo `production_mutations_from_ai_workflow` é `president_approval_required`. Este workflow nunca executa `supabase db push`, `supabase functions deploy`, exclusão/reset, envio de e-mail ou outro efeito de produção. Um Draft PR não é aprovação presidencial nem prova de custo zero. Migrations, secrets, compras e deploys exigem workflow separado, gate e aprovação humana explícita.

## Evidência e status

O runner deve validar estrutura, limite de custo informado, paths, conteúdo sensível, agente e comandos antes de agir. CI e revisão Security/QA são obrigatórios no PR. `AUTO-MERGEABLE` é apenas uma classificação de revisão, nunca um auto-merge: somente checks verdes, custo R$ 0 comprovado e ausência de mudanças de produção podem receber a classificação, após revisão humana.

O recurso está implementado no repositório, mas ativação real depende de `OPENAI_API_KEY` configurada, permissões de workflow/PR do repositório e aprovação explícita para qualquer inferência potencialmente cobrada. Não alegar execução, custo R$ 0, PR ou aprovação que não tenha evidência em Actions/GitHub.
