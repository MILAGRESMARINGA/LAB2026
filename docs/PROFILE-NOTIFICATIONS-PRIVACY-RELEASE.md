# LABGAME — Configurações privadas, notificações e controle da conta

**Estado:** IMPLEMENTADO EM CÓDIGO na branch `lab-rebuild-2026`. **Banco de produção NÃO ALTERADO; funções de exclusão NÃO IMPLANTADAS.**
Prioridade: PRIVACIDADE E P0; não publicar formulários como plenamente funcionais antes de homologar migrações e fluxos.

## Funcionalidades implementadas em código
- **Perfil pessoal opcional:** nome completo, telefone, nascimento, estado civil, profissão, CEP, estado, cidade, bairro, logradouro, número e complemento.
- **Dados comunitários sensíveis:** igreja, pastor(a), GC informado e função/participação (`Membro / ovelha` ou ministérios). Checkbox específico de consentimento. Sem consentimento, a função de escrita apaga esses campos do registro.
- **Documentos:** CPF/RG NÃO solicitados e NÃO armazenados neste release. A interface explica a indisponibilidade. Abrir etapa posterior com criptografia de campo, verificação de finalidade, retenção, segurança de menores e análise LGPD.
- **GC informado no cadastro não atribui filiação nem autoridade:** adesão oficial continua por convite no módulo GCs.
- **Notificações:** opt-in geral desativado por padrão, canal pop-up do app e preferência por e-mail, temas leitura/GC/conquistas. Pop-up real de lembrete diário somente dentro da Jornada com app aberto, se todas as preferências relevantes estiverem ativas. Pode ser dispensado por sessão/dia.
- **E-mail:** grava a preferência, mas NÃO ENVIA mensagens programadas até SMTP, templates, worker, tratamento de opt-out, retenção e monitoramento estarem prontos. Segurança e recuperação de conta são notificações transacionais distintas.
- **Zerar jornada:** confirmação visível com caixa de aceite, frase exata **ZERAR JORNADA** e senha recente; no servidor exige autenticação renovada em até 5 minutos, deleta progresso/XP/medalhas/vídeos/leituras registradas e reinicia etapa 1. Preserva cadastro, favoritos e vínculos com GCs. Não deve ser usado como atalho da regra canônica de reinício anual.
- **Excluir conta:** modal separado com frase exata **EXCLUIR CONTA**, e-mail, senha e aceite explícito. Endpoint do Supabase usa Auth do titular + service_role EXCLUSIVAMENTE dentro de Edge Function, valida recente autenticação, e **bloqueia exclusão se o usuário for líder de GC com outros membros** (para não apagar o GC alheio). O frontend só habilita confirmação após habilitação explícita da flag `VITE_ACCOUNT_DELETION_READY=true` E migração homologada.
- **Sair da conta:** mantém botão dedicado de largura total, claramente destacado e não destrutivo.

## Componentes / arquivos
- `lab-app/src/components/ProfileSettings.tsx`, `DailyInAppPopup.tsx`.
- `lab-app/src/features/profile-settings.ts`: validação, leitura/escrita em linha com RLS, reautenticação.
- `lab-app/supabase/migrations/202610160001_profile_notification_preferences.sql`.
- `lab-app/supabase/functions/account-delete/index.ts` (somente staging até QA).
- `lab-app/scripts/tests/profile-settings-safety.test.mjs` e `lab-app/tests/profile-settings.test.ts`.

## Requisitos de proteção de dados e aceite
1. Validação de backup em staging; nenhuma operação irreversível em contas reais antes de QA.
2. Aplicar migração SOMENTE em Supabase staging isolado; confirmar RLS own-user com 2 contas (B não pode ler, editar, inferir dados pessoais/religiosos de A).
3. Assinatura e respeito ao consentimento: campos de igreja/ministério só são persistidos quando autorização específica está presente; retirada de consentimento limpa os campos.
4. Testar XP/ciclo: reset com senha errada, sessão antiga, frase errada ou usuário anônimo falha SEM alterar dados; com 365 dias verificados e coroas, apagar apenas dados do próprio usuário. Conferir que GC e membros de outros usuários não mudaram.
5. Excluir conta com e sem GC; com outros membros deve bloquear; com GC unipessoal pode prosseguir; comparar contagens em Auth, RLS, perfis, favoritos e progresso em staging. Avaliar Storage/outros registros e obrigações legais de retenção.
6. Requisitar confirmação adicional para ações destrutivas; registrar auditoria sem senhas/tokens, não incluir CPF/RG em logs. Nenhum dado de saúde/crença em analytics ou rankings.
7. Modal com foco inicial, Escape cancelar, acessibilidade por teclado, mensagens explícitas sobre consequências e falhas; testar celular.
8. E-mail: implementar worker autenticado e fila idempotente, anti-spam, limite de frequência, descadastro e SMTP. **Não afirmar que envio existe enquanto não estiver em produção e comprovado.**
9. Avaliar requisitos de dados de menores e autorização de responsáveis antes de habilitar cadastro de data de nascimento.
10. Depois de QA, aplicar migração em produção com autorização de release; só então habilitar preferências. A Edge Function de exclusão deve ser implantada separadamente, auditada e identificada por versão. Manter flag de exclusão OFF até aprovação.
11. Testar restauração de conta não excluída, backup externo protegido e processo de solicitação do titular (LGPD). Documentar retenção legal após exclusão, se aplicável.

## Conformidade do escopo
- P0 de Auth/SMTP, testes E2E com duas contas e backup externo continuam pendentes; CI aprovado não é homologação de produção.
- Bônus anual de 10.000 XP segue migração separada e NÃO aplicada à produção.
- Nenhuma informação ministerial autoriza liderança em GCs nem determina maturidade espiritual.
