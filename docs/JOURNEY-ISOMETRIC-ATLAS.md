# LAB — jornada geo-histórica 3D

Requisito LAB-UX-ATLAS-365. Implementação na branch agent/isometric-journey, PR 90, sobre lab-rebuild-2026.

## Referências fornecidas pelo responsável

| Arquivo | Conteúdo utilizado |
| --- | --- |
| 550708.jpg | Reinos de Israel e Judá: Samaria/Jerusalém, Jordão e regiões vizinhas |
| 550709.jpg | Mundo Antigo: África, Ásia, Europa e bacia mediterrânea |
| 550710.jpg | Divisão das tribos, regiões dos dois lados do Jordão |
| 550711.jpg | Egito, Nilo, Sinai, deserto e caminho até Moabe |
| 550712.jpg | Reinos de Saul, Davi e Salomão |

Os cinco mapas foram inspecionados pelos agentes de geografia e cena. Servem de referência factual regional; fotografias da edição não são publicadas como textura. Terreno e modelos são originais. As capturas do Duolingo enviadas anteriormente orientam hierarquia e legibilidade; o produto mantém a identidade LAB.

## Arquitetura e comportamento

Three.js 0.170.0, com câmera ortográfica e modelos WebGL2: costa com volume, montanhas, árvores, palmeiras, cidades, pirâmides, rios e estandartes. O módulo 3D é carregado sob demanda. Recursos GPU são liberados no descarte; densidade de pixels limitada e renderização por atualização reduzem trabalho contínuo. Falha de WebGL/contexto oferece controles acessíveis e informa explicitamente o modo simplificado.

O atlas contém entrada para todos os 1.189 capítulos e valida cobertura não sobreposta ao carregar. Referência, região, rota textual, natureza e incerteza acompanham os capítulos. Éden, Ararate, Uz, Sinai e rotas discutidas são enquadramentos regionais/hipóteses, sem inventar prova arqueológica. Poesia, visões e cartas não recebem supostos itinerários físicos. As coordenadas e limites do modelo são aproximações editoriais, não cartografia de levantamento.

O plano mantém 365/366 etapas. Só a semana atual produz até sete bandeiras; a semana final contém apenas os dias restantes. Passado é minimizado e futuro não ganha botões fora da semana. A paleta literária possui símbolos e textos redundantes; sua extensão não é exclusivamente a paleta original Okabe–Ito.

A região principal segue a leitura selecionada no dia. Isto permite AT, Salmos e NT em regiões diferentes sem alterar o plano intercalado. Bandeiras no mesmo local recebem pequeno afastamento visual, mantendo conector para o marco geográfico. Transições da câmera bloqueiam a interação enquanto movem; movimento reduzido suprime a espera.

Capítulo 1 na etapa atual abre portão modal sobre o mapa com contexto do livro e baú BibleProject. Continuar usa o fluxo de leitura V1/V2 existente. O player continua sujeito à validação existente para XP. Nenhuma recompensa ou liberação é concedida pela cena. O portão fecha antes de abrir o vídeo para evitar diálogos modais concorrentes.

## Trabalho e verificação

Agentes executados nesta tarefa: geografia bíblica, frontend 3D, UX/frontend e QA. Papéis e evidências reais serão discriminados no PR; presença de agente não equivale a release aprovado.

A prévia journey-preview.html permite alternar cenários e ciclos sem modificar dados da conta. Controles de demonstração são restritos à página de prévia, sem alterar a elegibilidade no aplicativo.

Checks, identificação do commit publicado, preview e inspeção visual serão registrados após a integração dos agentes. Testes com contas reais, métricas em hardware físico e publicação em produção não são presumidos.

Reversão: reverter o commit da cena 3D e suas dependências. Não há migrations nem alterações de banco nesta implementação.

## Evidência consolidada

- Execução independente de QA: 268 testes aprovados em 56 arquivos; 117 testes de scripts e engineering gate aprovados; build TypeScript/Vite aprovado.
- Renderizador WebGL2 usa GPU. O modo compatível projeta os mesmos modelos tridimensionais pela câmera Three.js via SVGRenderer; não é o antigo desenho SVG manual. Nesse modo o pan é instantâneo para poupar CPU e a interface informa compatibilidade.
- Inspeção em navegador remoto: prévia carregou, sete bandeiras, seletor regional e portão com BibleProject funcionaram. O navegador não disponibilizou WebGL2; foi necessário verificar a renderização por software. A inspeção encontrou e corrigiu sobreposição da malha do mar, causada pela ordenação por profundidade média do SVGRenderer.
- As inspeções de layout estreito são simulações em contêiner de 390 px, não benchmark em celular físico nem prova do caminho GPU.
- CI inicial aprovou testes/build e Auth/RLS descartável, mas PG16/PG17 detectaram fragilidade anterior do teste SQL na virada do mês. O cenário de uma vida e o de esgotamento reescreviam a ativação do mesmo incidente em meses diferentes. Somente a fixture isolada foi corrigida com transação/reversão entre cenários; nenhuma migration ou regra de produção foi alterada. A confirmação dos checks de banco depende do CI do commit final.
