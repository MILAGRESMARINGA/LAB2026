# LABGame 3.0 — P0 (ambiente gratuito)

Status: implementação isolada em branch; **não homologada**.

## Decisões vinculantes
- Custo incremental autorizado: R$ 0. Nunca ativar plano, upgrade, add-on, branch de banco tarifada ou recurso que possa cobrar sem autorização explícita.
- Solução gratuita tem preferência. Se inviável: documentar alternativa gratuita, alternativa paga com custo e solicitar aprovação antes de comprar.
- Não modificar o CRM atualmente em `project/` nem executar migrações destrutivas.
- Isolar P0 do LABGame e usar banco LABGAME Supabase existente somente após auditoria de políticas, dependências e backup.

## P0 — critérios de aceite
- [ ] Cadastro com confirmação de e-mail, prevenção de duplicidade, mensagens neutras contra enumeração
- [ ] Login, logout, persistência, recuperação de senha, callback autenticado e expiração de sessão
- [ ] Perfil: edição pelo titular, nome público, fuso, preferências; validação com Zod e servidor
- [ ] Configurações: privacidade, preferências, opt-in de ranking, acessibilidade
- [ ] Notificações: inbox, lida/não lida, preferência por tipo, isolamento de usuário
- [ ] Exclusão de conta: confirmação reforçada, descarte dos dados pessoais em política definida e retenções legais documentadas
- [ ] Relógio: data do servidor como referência; UI em America/Sao_Paulo e tratamento de DST/fusos
- [ ] Testes de TypeScript, ESLint, build, rotas, autorização, RLS, e2e e acessibilidade
- [ ] Monitoramento mínimo, erro de rede, estados vazios, feedback de formulário
- [ ] Revisão de scripts JS, dependências e variáveis de ambiente; nunca expor service_role
- [ ] Plano anual: conferência dos 66 livros, 1.189 capítulos e distribuição dia 1–365/366 sem omissões
- [ ] GitHub CI automatizado, deploy de preview gratuito e publicação após homologação

## Diagnóstico inicial, 2026-10-16
Repositório: MILAGRESMARINGA/LAB2026. A pasta `project/` contém CRM com dashboard, contatos, Kanban, agenda, imóveis, mensagens e rotas `/app` e `/admin`. **Não é a interface do LABGame**; não a substituir inadvertidamente.

Supabase LABGAME: projeto `azejfxvaamgkmfmwdzjn`, ativo, 16 tabelas no schema public (Bíblia, leitura, grupos e game). RLS ativada nas 16 tabelas; `lab_game_plan_chapters` com zero políticas, requer conferir modo de acesso. A checagem de RLS não equivale a teste de autorização.

## Sequência
1. Inspecionar a versão exata da aplicação LABGame 3.0 e seu vínculo com implantação atual.
2. Consolidar baseline de dados, políticas RLS e migrações de P0.
3. Implementar componentes e fluxos de conta no código da aplicação LABGame, sem interferir no CRM.
4. Rodar testes automatizados e cenários adversariais de usuário.
5. Criar preview gratuito, validar variáveis e concluir aceite de P0.

Nada aqui constitui atestado de P0 concluída.