# LABGame — Restauração da Jornada gamificada (01/11/2026)

## Origem e motivo
- Versão fonte: commit `2aee1dc95` (antes da substituição por mapa semanal em 22–23/10).
- A trilha Duolingo-style com 7 etapas próximas, desafio atual, capítulos, XP, constância, talentos, medalhas, baús e o Galardão volta a ser a **tela principal da Jornada V1**.
- O mapa ilustrado moderno não foi perdido: fica em **Explorar mapa ilustrado**, fechado por padrão. O comando de leitura abre a experiência existente, sem intermediários.
- O menu continua: **Jornada · Estudos · Bíblia · GCs · Perfil · Ajuda**. Não foram revertidos os componentes `StudyLayerRoadmap`, `StudyGeneratorPanel`, `FormationLibrary`, `StudyReadingScreen`, `TypologyReferenceIndex`, ou os panoramas BibleProject.
- Recompensas na UI são **indicadores**; nenhum ponto, desbloqueio, status de conclusão, vida ou evento é fabricado no frontend.
- **Jornada V2** segue protegida por `VITE_LAB_V2_READY` e `lab_v2_release_controls.enabled`; este PR não promove V2. Para migrar a interface V2, conservar sua regra de 24h, vidas, RLS, idempotência e progresso por run.

## Critérios de aceite
1. App abre a tab Jornada por padrão e mostra a trilha gamificada, não o mapa.
2. Etapa 1 abre o fluxo de leitura/cadastro com toque único; as futuras permanecem bloqueadas.
3. A Jornada inteira e o mapa são opcionais; não substituem a trilha diária.
4. O menu e os módulos de Estudos continuam acessíveis.
5. Teste mobile e CI com pg16, pg17, Auth/RLS E2E e suite de UI devem ficar verdes.
6. Não aplicar migrações de banco, não mexer nos textos/versões bíblicas nem no Supabase Auth como parte desta restauração.
