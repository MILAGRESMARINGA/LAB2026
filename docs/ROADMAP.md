# LABGAME — Roadmap de desenvolvimento
Atualizado em 2026-10-10. Estados baseados em evidência de código, banco e deploy; "implementado" não significa homologado.

## P0 — Fundação e isolamento
- [x] Branch `lab-rebuild-2026` separada de main
- [x] Projeto Supabase exclusivo LABGAME (azejfxvaamgkmfmwdzjn)
- [x] Schema inicial: reading_completions, reading_groups, reading_group_members com RLS
- [x] Vercel `labgame-biblia` conectada ao repositório e variáveis públicas
- [x] Primeiro deploy READY (commit 6afe9c3)
- [ ] Inventário e remoção controlada do código legado CRMIMOBI

## P1 — Integridade bíblica
- [x] Cânon de 66 livros e 1.189 capítulos
- [x] Gerador anual de 365/366 dias
- [x] Três fluxos: AT, Salmos, NT começando em João
- [x] Testes unitários de cobertura, ano bissexto e primeiro dia (código)
- [ ] Executar CI e validar balanceamento diário e continuidade das sequências
- [ ] Definir versão oficial do plano com equipe bíblica (não modificar calendário após adesão)

## P2 — Frontend
- [x] Navegação Hoje, Calendário, Conquistas, Grupos e Perfil (commit 2728103)
- [x] Navegação entre dias, progresso anual, XP e dias consecutivos
- [x] CSS responsivo para celular
- [ ] Confirmar build e deploy desta versão (primeiro deploy READY é versão anterior)
- [ ] Testar fluxo mobile e acessibilidade WCAG

## P3 — Autenticação e dados
- [x] Funções de login, cadastro, logout e upsert de leituras
- [ ] Teste real de cadastro, confirmação de e-mail, login e recuperação de sessão
- [ ] Testes RLS com duas contas distintas e anônimo
- [ ] Política de recuperação de senha, exclusão de conta e LGPD

## P4 — Gamificação
- [x] Motor básico de XP e conquistas por capítulos únicos
- [x] Cálculo de dias completos e sequência de leitura
- [ ] Regras de leitura atrasada, reinício anual e recompensas
- [ ] Antiabuso e histórico auditável
- [ ] Ranking opcional com consentimento e privacidade

## P5 — Comunidade
- [x] Tabelas de grupos e membros
- [ ] Convites seguros e aceite de participação
- [ ] Papéis de líder, moderador e participante; revisão de RLS
- [ ] Painel do líder e acompanhamento agregado sem expor dados indevidos

## P6 — Operação e publicação
- [x] GitHub Actions configurado para teste/build
- [ ] Validar CI verde e Vercel READY na versão de cinco telas
- [ ] Monitoramento, backups e plano de rollback
- [ ] Testes E2E, desempenho, segurança e acessibilidade
- [ ] Aprovação de homologação e publicação de produção

## Agentes / responsabilidades
Principal Architect coordena: Backend, Database, Security, QA/Reliability, Frontend/UX, Integration, Platform/Observability e AI. Estes papéis orientam revisões; não implicam processos autônomos em execução.

## Critérios de conclusão
Não declarar fase concluída sem teste e evidência. Não modificar projetos Supabase externos ao LABGAME. Nunca expor chaves service_role ao frontend.
