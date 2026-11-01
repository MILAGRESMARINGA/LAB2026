# LABGame — Estudos aprimorados em cinco unidades (01/11/2026)

A Jornada restaurada é a tela principal. O menu de seis abas — Jornada, Estudos, Bíblia, GCs, Perfil e Ajuda — permanece intacto.

A estrutura das unidades de estudos publicados foi restaurada: **Seção → Livro → Capítulo → Unidade → Lição**, com cinco passos interativos:
1. Exegese (mensagem central, contexto e interpretação textual);
2. Teologia Bíblica (conexões canônicas somente quando fundamentadas);
3. Teologia Sistemática (lente Pentecostal Arminiana declarada separadamente);
4. Aplicação (prática e oração);
5. Revisão (perguntas, sem XP concedido ao apenas abrir).

O portal exibe apenas conteúdo autorizado pelo backend: `StudyGeneratorPanel` respeita `VITE_LAB_V2_READY`, a política RLS do cache publicado e os direitos editoriais. O front não declara que há 1.189 estudos publicados, não cria conteúdo teológico fictício e não aciona IA ao navegar entre as cinco unidades. A leitura e seus pontos permanecem independentes.

A organização de estudos por camadas, módulos de formação cristã, guia de tipologias, BíbliaProject em pt-BR e ferramenta Strong (quando habilitada) estão preservados. As funções de geração e cache já existentes continuam sem alterações.
