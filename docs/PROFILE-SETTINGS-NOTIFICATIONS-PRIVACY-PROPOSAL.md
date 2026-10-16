# LABGAME — Proposta de Perfil, Configurações, Notificações e Autogestão
**Status: REGRAS DE REINÍCIO E RESET TOTAL APROVADAS PELO RESPONSÁVEL; BACKEND DE RESET/EXCLUSÃO AINDA NÃO IMPLEMENTADO NEM APLICADO**
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
1. **Iniciar novo ciclo:** RPC já disponível `lab_game_restart_completed()`; exige concluir a Bíblia e respeitar o intervalo permitido. Mantém conta, histórico de pontos e conquistas, GC e coroas, **mas o XP da nova sequência começa em 0** e os pontos antigos não entram no novo placar. A RPC atual ainda não implementa essa separação de XP por tentativa; é requisito de migração futura. Não é "zerar jornada".
2. **Zerar completamente meus resultados (APROVADO pelo responsável):** **NÃO EXISTE NO BACKEND ATUAL**. Operação excepcional, voluntária e irreversível na UI, **não** um reinício de dia, perdão por falta ou forma de burlar a regra da sequência. Requer RPC transacional com autenticação recente, rechecagem de titularidade, lock de usuário e idempotência. Apaga para a conta escolhida **TODOS os dados de pontuação e progresso**: XP de capítulos, XP de vídeos, XP e ledger de bônus anuais (+10.000/+12.500/...), melhor recorde, sequência corrente, histórico de tentativas, medalhas/insígnias de usuário, Talentos, coroas, total de Bíblias completas, progresso e conquistas dos estudos/discipulados e métricas derivadas. **Após confirmação real do backend:** total XP=0, melhor recorde=0, Bíblias completas=0, estudos concluídos=0, dia 1 disponível. Recomeço acontece com a mesma conta, nome, configurações de notificações e vínculo aos GCs preservados; favoritos/anotações pessoais não-gamificados devem ser claramente identificados como preservados, a menos que o usuário escolha excluir a conta. Recompor a classificação do GC e qualquer ledger coletivo sem manter contribuição apagada, mas **não** zerar placar de outros integrantes ou os dados coletivos legítimos; definir a reconciliação antes de habilitar. Bloquear reset se houver pendências de premiação, ledger anual ou eventos de grupo sem plano de reversão.
3. **Excluir conta:** **NÃO EXISTE ENDPOINT AUTENTICADO DE AUTODELEÇÃO**. Criar fluxo server-side de solicitação/verificação de posse/autenticação recente, análise de GC de que é líder, transferência de propriedade ou encerramento do grupo, remoção/anônimos de dados conforme lei e política de retenção, exclusão do usuário Auth via API administrativa de ambiente seguro. Nunca expor `service_role` no frontend nem usar diretamente `auth.users` por RPC não revisada. Informar políticas para backups e logs (art. 16 da LGPD) sem prometer eliminação tecnicamente impossível e permitir exportação antes de pedir a deleção.

## Regra oficial — recomeço automático versus zerar tudo

**A Jornada não tem botão "pular dia", "zerar somente o dia", "repetir para ganhar XP" nem "perdoar falta".**

- **Recomeço automático obrigatório:** perdeu o prazo de leitura (após a futura regra de 24h + carência/vidas)? A tentativa incompleta termina e o desafio volta à **etapa 1 com 0 XP da sequência**, sem transferir XP nem medalhas conquistadas na tentativa anterior. As marcas passadas são preservadas somente para comparação. A versão atual de `lab_game_sync()` já reinicia tentativas por data civil, mas **a separação da pontuação ainda não existe**.
- **Recorde pessoal intocado:** se a melhor sequência foi 265 dias, na tentativa nova o participante vê, por exemplo, "dia atual: 1 | melhor recorde: 265". Se superar e concluir o **266º dia** na nova tentativa, o recorde exibido passa a 266; o número 265 deixa de ser **o recorde máximo mostrado**, sem necessidade de apagar o histórico auditável da tentativa anterior. O novo recorde só é registrado após as confirmações da etapa 266.
- **Pontuação de tentativa nunca cumulativa:** cada recomeço abre etapa 1 com **0 XP atual e 0 dias na nova sequência**. A tentativa passada é arquivada com seu XP e medalhas como **metas históricas a superar**, não como pontos que compõem a pontuação ativa. Estudos concluídos e Bíblias completas continuam no histórico do perfil, sem desbloquear marcos da tentativa nova. A implementação de saldo vitalício atual precisará ser refatorada para separar os escopos.
- **Exemplo de ausência:** confirmou o dia 1 e passou 3 dias sem ler: a tentativa corrente não permanece em "dia 3" para recuperar atrasados. Na próxima sincronização do jogo ela reinicia a etapa 1; "melhor recorde" anterior permanece em 1, não em 3 (dias de ausência não são dias lidos). Pode optar pelo RESET TOTAL se quiser apagar **também** esse recorde e todo XP histórico.
- **RESET TOTAL opcional:** mesmo se já concluiu 265 dias ou várias Bíblias, o titular pode escolher deliberadamente apagar **todos** os resultados e começar uma primeira jornada completamente nova sem pontuação anterior. Uma medalha de 10 mil XP ou prêmio de Bíblia completa anteriormente recebido também desaparece. Na próxima Bíblia integral após reset, o prêmio inicial será o de **primeiro ciclo** porque o contador de ciclos foi zerado com segurança no servidor.
- **Exclusão de conta:** diferente do reset, encerra identidade/cadastro, preferências e associações; se uma nova conta puder ser criada após o processamento da exclusão, ela não herda XP/recordes/estudos da antiga, exceto dados mínimos retidos apenas por obrigação legal e **não utilizados na gamificação**.
- Nenhuma dessas opções altera o cânon, modifica o plano de 365 dias ou concede a leitura retroativa. A queda de constância não pode ser "apagada" seletivamente, e o usuário não escolhe manter apenas recordes convenientes.

### Condições de integridade para o reset total
- **Uma única transação atômica e auditável:** bloquear o `user_id`, invalidar tentativas e checks próprios, apagar/compensar prêmios de vídeo e de ciclos, zerar `lab_game_stats` (XP, melhor marca, total de etapas concluídas), remover futuras premiações de estudos e recontabilizar dados derivados sem transferir pontos a terceiros.
- **Idempotência/concor­rência:** uma requisição repetida ou concorrente jamais concede crédito, recria medalhas antigas ou deixa o scorecard em desacordo com o ledger. As novas leituras são processadas **somente depois** do reset concluir.
- **Marcação de época de progresso:** para futura pontuação GC, cada evento de estudo/leitura deve ter um vínculo a época/geração de progresso; após reset não se pode reaproveitar XP individual anterior em ranking, premiação dupla ou ledger coletivo. Grupo não perde XP próprio legítimo de outros membros.
- **Contador verificado:** conferir `lab_game_scorecard` e `lab_game_sync` após reset: nenhuma leitura antiga, nenhum bônus anual, nenhum estudo antigo e saldo 0. A UI só mostra estado zerado após resposta server-side; falhas apresentam mensagem e mantêm tela anterior.
- **Escopo de exclusão:** não apagar perfil, email Auth, senha, consentimentos, configuração de notificações ou vínculo GC no reset voluntário; exclusão de conta tem fluxo distinto, com tratamento de propriedade dos GCs.
- **Dados de auditoria e backup:** podem ser conservados separadamente pelo prazo estritamente necessário por obrigações legais e segurança; não reconstruir progresso de dados arquivados em um novo ciclo. Tornar retenção transparente, sem prometer apagar instantaneamente backups históricos.
- **Bloqueio em produção:** sem backend transacional testado em staging, botão de zerar resultados não deve executar nada; nunca conectar um botão visual a limpeza parcial feita no navegador.

## Confirmar ações irreversíveis
- **Novo ciclo:** confirmação simples com explicação "Seu XP e suas coroas permanecem".
- **Zerar jornada:** modal de alto contraste e linguagem inequívoca:
  - "Você apagará todo o progresso de leitura e estudos, XP de capítulos e vídeos, bônus anuais, seus recordes, Talentos, medalhas, coroas e o total de Bíblias concluídas. Sua conta e participação nos GCs permanecem. Você começará novamente na etapa 1, com 0 XP e sem histórico de conquistas. Esta decisão não pode ser desfeita."
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
