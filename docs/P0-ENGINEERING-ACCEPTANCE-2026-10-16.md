# LABGAME 3.0 — P0 | Aceite técnico de engenharia e liberação gratuita
**Data:** 16/10/2026 · Branch: `lab-rebuild-2026` · Organização: `MILAGRESMARINGA/LAB2026`
**Política financeira:** custo adicional ZERO. Não contratar novas branches, projetos ou provedor pago.

## 1. Resultado verificado
**P0 de implementação e homologação local: APROVADO.**
**P0 de publicação no Supabase/Vercel públicos: NÃO LIBERADO; ainda há gates operacionais.**

CI **#428**, quatro verificações `success`:
https://github.com/MILAGRESMARINGA/LAB2026/actions/runs/38936664134
- Compilação TypeScript/Vite, Vitest, auditorias de arquitetura e segurança
- PostgreSQL 16 descartável, transações, RLS e gamificação
- PostgreSQL 17 descartável, mesmas invariantes da instância real
- Supabase Auth real em contêiner local gratuito: duas identidades fictícias com sessões JWT, cadastro confirmado por e-mail Mailpit, recuperação de senha, permissões privadas, função Deno de exclusão de conta, browser Chromium em desktop e celular

## 2. Regras de jogo e integridade demonstradas
- **Leitura integral:** os 1.189 capítulos, sem repetição, nas versões 365 (271×3 + 94×4) e 366 (275×3 + 91×4). Plano inicial GN1/SL1/JO1. Plano 366 só inicia em 1º/janeiro bissexto no timezone fixo de São Paulo.
- **Ativação/relógio:** começa pela confirmação da ativação no banco; 24h normais, carência única de 6h, faixas de desconto de XP −3/−6, sem antecipação de etapa.
- **Vidas:** três por mês, não acumulativas; cada uma estende 24h; incidentes continuam debitados no mês original mesmo quando atravessam virada de mês; quarta vida impossível encerra tentativa. Uma função RPC com status de falha deve registrar a falha mesmo quando acionada por confirmação ou ativação tardia, não apenas por leitura de estado.
- **XP, estudos, vídeos:** contabilidade por `run_id`, idempotência/antirrepasse, histórico arquivado sem contaminar a nova tentativa. Corrida de oito confirmações concorrentes gera só um crédito para o mesmo capítulo. Vídeos com sessão de heartbeats não são prova absoluta de visualização, mas melhoram o critério de elegibilidade; estudos opcionais não bloqueiam avanço.
- **Coroas:** testes SQL simulam 365 etapas e 1.189 confirmações, distinguem Bíblia concluída e **constância perfeita**; capítulos faltando não geram coroa; confirmação repetida não duplica prêmios. Reset elimina histórico, XP, bônus e coroas; mantém conta e GC.
- **V1 coexistência:** usuários com run antiga continuam na V1; novos podem entrar na V2 após habilitação explícita do servidor e frontend. Nunca migração oculta nem sobreposição de XP legado.

## 3. Configurações, proteção de dados e acessibilidade
- Perfil pessoal facultativo, dados religiosos/ministeriais sujeitos a escolha/consentimento privado, vínculos GC, e-mail e profissão. Documentos pessoais e endereço residencial completo não são coletados por padrão sem finalidade.
- Notificações por **cinco assuntos × canais independentes pop-up/e-mail**, com chave geral "não receber avisos" que prevalece. Pop-up de leitura funcionando na V1 e no código da V2. Demais eventos e entrega externa de e-mail só entram em produção quando houver produtores, consentimento e remetente gratuitos homologados.
- Botão "Sair da conta" visível e largo, desktop/mobile testados em Chromium. Fluxos de sessão autenticada e logout.
- Reset total distinto de exclusão: modal, frase, senha/reautenticação, critérios de segurança e operação no servidor; teste de reset e recomeço sem dados anteriores.
- Edge Function `account-delete`: nega origem/JWT inválidos, exige confirmação da identidade, impede remoção de GC com terceiros e valida deleção legítima (somente teste local). **Não instalada no Supabase público.**
- Exportação de dados em JSON inclui progresso, estudos, vídeos, preferências e auditoria de envio opcional. RLS por usuário testada com dois JWTs reais.

## 4. Últimas correções P0 — rastreabilidade
- `202610160108_lab_v2_terminal_state.sql`: resposta de estado terminal em `lab_v2_activate` e `lab_v2_confirm` preserva os débitos e a falha em transações, sem conceder XP depois de expirar. Regressão `scripts/tests/v2-terminal-state-smoke.sql`.
- `scripts/tests/v2-annual-awards-smoke.sql`: simula Bíblia integral, coroa, distinção de perfect-constancy, idempotência de recompensa e reset.
- `scripts/tests/v2-postgres-smoke.sql`: reproduz **a ordem verdadeira das migrações** de Perfil antes de V2; evita testar a implementação anterior de reset por engano.
- CI #428 aprovado em PostgreSQL 16/17 e Auth/browser local, sem segredos ou dados reais.

## 5. Gates de implantação no Supabase Free já existente
Verificado pelo conector em 16/10/2026:
- Supabase público `azejfxvaamgkmfmwdzjn` tem migrations aplicadas somente até `20261014195640 lab_privileges_hardening_p0`.
- **NENHUMA** das novas migrations P0 de Perfil, notificações e V2 aplicada em produção; **nenhuma Edge Function publicada**.
- GitHub Actions executa testes gratuitos em repositório público; Vercel gera previews na branch, mas o domínio principal não deve apontar para uma interface que dependa de RPCs ausentes.
- Novo projeto Free não foi criado porque a conta já usa a cota; branch Supabase cobrada por hora não será contratada.

Para liberar publicamente, sem pagar:
1. **Backup atual e restaurado em local seguro:** usar `lab-app/scripts/backup-labgame.ps1` com senha PostgreSQL digitada localmente, manter o `.dump` fora do GitHub e do chat, testar restauração em banco Docker separado. O backup não pode ser inferido apenas por checklist ou por testes de migrations em banco vazio.
2. **Ensaio de migração sobre cópia restaurada** dos dados legados, preservando usuários, leituras e GCs; conferir contagens e hashes essenciais antes/depois e rollback. Não executar scripts destrutivos no banco público como substituto.
3. **Migração incremental no projeto Supabase Free existente**, *após gates de backup*, com `lab_v2_release_controls.enabled=false` e `VITE_LAB_V2_READY` desligada, validar RLS, Auth e UX em modo sombra.
4. Publicar `account-delete` somente após reconfirmar proteção de líderes de GC, privacidade/retenção e conta real autorizada; destruição deve ser responsabilidade do próprio usuário autenticado.
5. E-mail transacional de autenticação e recuperação: configurar e testar uma integração permitida pelo plano Free. Para e-mails de notificações opcionais, remetente/provedor gratuito e consentimento verificável são pré-requisitos; não declarar envios operacionais antes disso.
6. **Rollout gradual da V2:** primeiro usuários novos/teste, depois migração expressa de V1 com interface; acompanhar logs, relógio real, XP e GCs; promover domínio canônico somente após regressões e retorno seguro.

**Conclusão responsável:** código P0 e validação automatizada local estão concluídos nesta rodada. O lançamento público completo ainda NÃO está concluído; não é seguro ligar recursos que dependem de migrations ausentes ou operar resets/exclusões reais sem backup restaurável recente. Esses bloqueios não exigem cobrança: exigem procedimento de implantação seguro, acesso apropriado e provas finais.

## 6. CI final de estabilidade gratuita
**CI #433: 4/4 jobs aprovados** — https://github.com/MILAGRESMARINGA/LAB2026/actions/runs/38937995363
- Após instabilidade temporária de Docker Hub e conflito de porta do Mailpit, a execução gratuita passou novamente em Vite/TypeScript/JavaScript, PostgreSQL 16, PostgreSQL 17, GoTrue real com dois usuários, confirmação e recuperação por e-mail local, Edge Function de exclusão e Chromium desktop/mobile.
- Workflow agora evita iniciar contêineres só por alterações de documentação, limpa contêineres de teste LABGAME anteriores, permite retentativas de inicialização e usa porta de SMTP local isolada. Não conecta a qualquer serviço pago.
- O P0 de engenharia segue aprovado; o gate de backup **atual** e a aplicação em produção são os únicos responsáveis por determinar disponibilidade pública. Custo de infraestrutura adicional nesta rodada: ZERO.
