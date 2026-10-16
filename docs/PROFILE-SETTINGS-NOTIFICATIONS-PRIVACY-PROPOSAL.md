# LABGAME — Proposta de Perfil, Configurações, Notificações e Autogestão
**Status: EM AVALIAÇÃO — NÃO IMPLEMENTAR MIGRAÇÕES/EXCLUSÕES AUTOMÁTICAS**
**Projeto:** `MILAGRESMARINGA/LAB2026`, branch `lab-rebuild-2026`, escopo exclusivo `lab-app/`.

## Motivação
O Perfil concentra hoje nome público, participação opt-in nos rankings, pontos, marcos e logout. O usuário solicita preferências granulares de notificações (pop-up e email), dados opcionais pessoais e ministeriais, iniciar novo ciclo, zerar a Jornada e excluir a conta com confirmação deliberada.

**Regra arquitetural:** configurações de UX não podem conceder XP, fazer bypass de RLS, alterar GC de terceiros ou expor dados religiosos. P0 de Auth/GC/XP/backup precisa permanecer rastreável e independente desta proposta.

## Arquitetura de interface
- **Perfil:** resumo, avatar/iniciais (facultativo), nome público, nível, jornada, GC(s).
- **Configurações > Meus dados:** nome, contato, cidade/UF; campos complementares só com finalidade concreta.
- **Configurações > Comunidade e ministério:** igreja, vínculo com GC, pastor, função ministerial ou participante sem cargo (termo local "ovelha" opcional). Não mostrar nome da igreja ou pastor no ranking público.
- **Configurações > Notificações:** controle geral para notificações **opcionais**, matriz por canal/assunto, horário silencioso e frequência. Explicar diferença entre pop-up dentro do app e push quando navegador fechado.
- **Configurações > Privacidade:** aparecer no ranking (já existente), exportar dados pessoais, gerir consentimento por finalidade, senha/acesso.
- **Configurações > Segurança da conta:** botão "Sair da conta" de largura total e destaque moderado; ao lado "Alterar senha".
- **Configurações > Gerenciar jornada e conta:** "Novo ciclo após conclusão", "Zerar minha jornada" e "Excluir conta definitivamente" separados visualmente.

## Notificações: desenho aprovado conceitualmente, execução pendente
- Canais: `in_app` (pop-up/centro de avisos quando usuário está no app), `email`, e push do navegador/celular como **fase futura** após permissões e service worker seguros.
- Assuntos opt-in: `daily_reading`, `stage_available`, `talentos_medals`, `gc_updates`, `new_studies`. Preferências por assunto **e** canal.
- Definir inicialmente como **desligados** os lembretes opcionais; nunca iniciar email marketing ou push sem base legal apropriada.
- Botão global "Pausar todas as notificações opcionais", sem desativar alertas transacionais de segurança (login, confirmação de email, recuperação) e diálogos obrigatórios de confirmação.
- Preferência de horário (timezone identificada explicitamente, horário silencioso), dias e limite de frequência por categoria. Cancelar jobs e inscrições push quando desligados; validar opt-in **no momento do envio**, não apenas na criação do job.
- Sem infraestrutura SMTP/provider verificada, mostrar opção como indisponível, não fingir envio; manter templates com opt-out, auditoria e antifraude.
- Modelo proposto: `lab_notification_preferences(user_id PK, global_enabled, quiet_hours, tz, updated_at)`, `lab_notification_channels(user_id, category, channel, enabled)`, `lab_notifications(user_id, kind, created_at, read_at, payload_minimal)`; todas com RLS por `auth.uid()` e auditoria de change. Chaves/segredos de email/push somente no backend.
- Não transformar pop-ups de confirmação de exclusão/zerar em notificações desativáveis.

## Dados pessoais e ministeriais: minimização e LGPD
- Básico: nome exibido (já existe), email gerenciado no Auth, cidade/UF e telefone opcionais.
- Campos somente quando houver finalidade e base legal documentadas: nome civil, aniversário, profissão, estado civil, endereço completo; oferecer "prefiro não informar".
- **Não coletar CPF, RG, foto de documentos, endereço residencial completo como padrão.** Solicitar somente quando houver serviço legítimo que os exija e mecanismos específicos de proteção. Nunca usar documento como gamificação.
- Vínculo com igreja/organização religiosa, pastor e cargo podem revelar **convicção/filiação religiosa — dado pessoal sensível** (LGPD art. 5º, II), com transparência, finalidade específica e base adequada ao art. 11. Aderir voluntariamente ao LABGAME não deve obrigar campos religiosos.
- Grupos selecionados devem usar relações existentes `reading_group_members`; o nome do GC não pode ser campo livre que falsifique participação.
- Pastor/igreja, quando cadastrados, precisam referenciar entidades verificadas e só receber visibilidade depois de um controle explícito. Sugestão: `lab_profiles_private` e `lab_ministry_profiles_private` isoladas do placar `lab_game_stats`. Leitores de ranking não recebem essas colunas.
- Visibilidade padrão de perfil privado: somente titular, sem compartilhamento automático com líderes de GC. Liderança recebe nome público/ranking só se consentido.
- Campo de função: `participante_sem_cargo`, `voluntario`, `lider_gc`, `supervisor`, `pastor`, `outro`; status ministerial declarado pelo usuário não concede permissões administrativas nem validação espiritual.
- Definir prazo de retenção, exportação, correção e remoção, e permitir revogação de consentimentos sem afetar a leitura bíblica.

## 3 ações distintas: NOVO CICLO ≠ ZERAR ≠ EXCLUIR
1. **Iniciar novo ciclo:** RPC já disponível `lab_game_restart_completed()`; exige 365 dias completos e novo dia. Mantém conta, pontuação acumulada, conquistas, GC e coroas. Não é "zerar jornada".
2. **Zerar jornada por opção do titular:** **NÃO EXISTE NO BACKEND ATUAL**. Requer RPC transacional com autenticação recente, rechecagem de titularidade, lock por usuário e idempotência. Apaga histórico de jornadas, confirmações, vídeos, XP e insígnias relacionados; não exclui a identidade Auth ou dados cadastrais; manter associações a GC se o titular escolher essa opção. Bloquear uso se houver pendências de premiação/reconciliação ou ledger anual sem plano de reversão. Recria ciclo 1 apenas após reset confirmado. Impacto no ranking de grupo deve ser mostrado antes de confirmar.
3. **Excluir conta:** **NÃO EXISTE ENDPOINT AUTENTICADO DE AUTODELEÇÃO**. Criar fluxo server-side de solicitação/verificação de posse/autenticação recente, análise de GC de que é líder, transferência de propriedade ou encerramento do grupo, remoção/anônimos de dados conforme lei e política de retenção, exclusão do usuário Auth via API administrativa de ambiente seguro. Nunca expor `service_role` no frontend nem usar diretamente `auth.users` por RPC não revisada. Informar políticas para backups e logs (art. 16 da LGPD) sem prometer eliminação tecnicamente impossível e permitir exportação antes de pedir a deleção.

## Confirmar ações irreversíveis
- **Novo ciclo:** confirmação simples com explicação "Seu XP e suas coroas permanecem".
- **Zerar jornada:** modal de alto contraste e linguagem inequívoca:
  - "Você perderá as leituras registradas, XP, sequência, medalhas e histórico dos ciclos do LABGAME. Sua conta e seus GCs permanecem. A operação não poderá ser desfeita."
  - Checkbox "Li e compreendi"; segundo passo digitar `ZERAR`; botão de confirmação só liberado após validação; exigir autenticação recente.
  - Jamais disparar só por clique em link. Durante envio, botão com loading, bloqueio de duplicação. Exibir recibo e novo ciclo se servidor confirmar.
- **Excluir conta:** modal diferente:
  - "Você perderá o acesso e seus dados serão eliminados ou mantidos somente nos casos legalmente permitidos. Revise seus GCs e exporte seus dados antes de continuar."
  - Checkbox, digitar `EXCLUIR`, autenticação recente/reauth, confirmação final independente e recibo de solicitação. Sem solicitação automática por abertura de modal.
- **Sair:** botão visível em "Segurança da conta", sem exigir modal duplo; a ação já foi codificada para logout local com tratamento de erro. Colocar acima do card "Instalar LABGAME".

## Testes bloqueantes / aceites
- Não receber notificações opcionais significa **zero jobs enviados** após revogação; desligar email não interfere em Auth/reset; push requer permissão do browser.
- Apenas o titular pode ler/editar dados privados; nem dono de GC nem outro participante pode consultar endereço, profissão, estado civil, igreja ou pastor fora de consentimento explícito.
- Uma vez acionado "Zerar", só zerar dados desse usuário, sem alterar cadastro de terceiros. Testar concorrência, reenvio, restore e reconciliar XP (incluindo eventuais bônus anuais).
- Excluir conta não deixa tokens ativos, memberships órfãos ou GC sem dono; tratar dados de backup e retenção de modo transparente.
- Gatilhos de confirmação não são desativáveis via "não receber notificações".
- Abertura de modal, cancelar, ESC, teclado, leitor de telas, mobile 360 px, foco correto, motion reduzido.
- Não executar ações destrutivas em banco de produção como parte dos testes. Criar testes automatizados e homologar no staging.
- **Gate P0** de autenticação com duas contas, proteção de senhas e testes RLS ainda pendente. Novas tabelas sensíveis exigem Privacy Impact Assessment, RLS e review antes de migração.

## Ordem recomendada
- **Fase 1 (UI sem migração):** estruturar Configurações, realçar logout, criar protótipos de modais (SEM ligar operações de exclusão), textos de privacidade. Liberar controles apenas quando o backend existir, nunca botões enganosos.
- **Fase 2 (preferências):** tabela RLS de notificações, controles de usuário e centro de avisos; SMTP/push depois de infraestrutura homologada.
- **Fase 3 (cadastro opcional):** perfil mínimo e módulo de comunidade isolado por dados sensíveis, política de dados e consentimentos.
- **Fase 4 (operações críticas):** reset transacional e processo de autodeleção no backend, exportação e cobertura E2E+RLS, ambientes isolados.

**Fontes oficiais:** ANPD (LGPD dados sensíveis, base legal art. 11): https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes ; Direitos e exclusão dos titulares: https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares .
