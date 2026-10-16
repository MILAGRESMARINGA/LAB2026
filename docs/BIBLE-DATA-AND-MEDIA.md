# Bíblia incorporada — LABGAME

## Edição selecionada

**Almeida 1911**, João Ferreira de Almeida, edição histórica em português (grafia antiga). Texto de domínio público, disponível no [Projeto Gutenberg (eBook 62383)](https://www.gutenberg.org/ebooks/62383), digitalizado também em JSON estruturado pelo projeto [damarals/biblias](https://github.com/damarals/biblias/tree/main/data/canonical/ALM1911).

A versão 1911 NÃO é a Almeida Revista e Corrigida atual da Sociedade Bíblica do Brasil, nem NAA, ARA, ARC moderna ou NVI. Não usar essas edições sem licença expressa. A ortografia histórica é preservada: palavras como «creou», «fórma», «elle», etc. O aplicativo deve informar claramente o leitor.

## Armazenamento

Supabase LABGAME, isolado do projeto CRM:
- `public.lab_bible_editions`: licença e atribuição
- `public.lab_bible_chapters`: uma linha para cada `chapter_id` canônico, texto em `verses jsonb` com números de versículos
- Leitura pública por SELECT com RLS, sem escrita autorizada ao usuário.
- Importação concluída em 11/10/2026: 66 livros, 1.189 capítulos e 31.101 registros de versículos, sem capítulo ausente.
- Script reprodutível: `lab-app/scripts/import-almeida1911.mjs`, executado apenas em ambiente administrativo protegido.

## Regras de leitura

Os capítulos mostrados por etapa vêm do plano LABGAME e do armazenamento textual. O conteúdo em si não confere XP. A pessoa só obtém os 10 XP do capítulo após rolar e confirmar sua leitura; a conclusão é validada no servidor segundo as regras de dia e etapa.

## BibleProject

- Reprodução por incorporação autorizada de streams oficiais ou playlists YouTube; **não** armazenar vídeo no Supabase.
- Atribuição visível e link para BibleProject em cada player.
- `lab_game_video_resources` contém 71 panoramas oficiais únicos, inclusive recursos compartilhados entre livros.
- A bonificação é de 5 XP por recurso concluído e confirmado, uma única vez por participante, separada da trilha de leitura.
- Há uma espera mínima de 90 segundos registrada no servidor. Esse requisito e o botão de confirmação não comprovam automaticamente visualização integral do filme; o leitor declara ter assistido.
- Playback Mux direto identificado para Gênesis 1–11, Gênesis 12–50, João 1–12, João 13–21, Salmos e Apocalipse 1–11. Outros recursos atualmente utilizam o player embutido da playlist do respectivo testamento e exigem seleção do título na playlist. A vinculação de vídeos exatos restantes está na fila de curadoria.

## Pendências

- Revisão de precisão do texto 1911 diante da edição impressa.
- Opção de tradução moderna somente depois de autorização formal.
- Vídeos de cada livro com identificadores precisos para reprodução individual incorporada.
- Auditoria E2E em aparelhos reais, tela cheia iOS e Android, economia de dados, acessibilidade e privacidade.
