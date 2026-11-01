# LAB — atlas isométrico semanal

Requisito: LAB-UX-ATLAS-365. Responsabilidades: UX e engenharia frontend. Base: lab-rebuild-2026, 0d0d0443f2f96cc53ca36feeeb04101e88191827.

## Comportamento

A Jornada V1, V2 e a prévia reutilizam BiblicalWorldMap. O componente conserva o plano original (365/366 dias, 1.189 capítulos) e monta somente a semana atual, com até sete bandeiras; a última semana contém somente os dias restantes. A visão com todas as etapas interativas foi removida. Estado concluído, atual e bloqueado tem texto e símbolo além de cor. A paleta literária existente é reutilizada.

O terreno vetorial original projeta aproximadamente o Mediterrâneo, Europa meridional, norte da África e oeste da Ásia, com extrusão visual, montanhas, árvores, Nilo e rios mesopotâmicos. Não usa a ilustração de referência como asset. Não há biblioteca WebGL nem chamadas a serviços gráficos. Trata-se de desenho SVG com efeito de profundidade (2,5D), não de malha 3D navegável.

A câmera acompanha a região principal da leitura do dia e aguarda 850 ms antes de permitir a interação durante uma mudança regional. Movimento reduzido suprime a animação e a espera. A região principal usa a primeira leitura do AT quando presente. O plano intercalado pode combinar AT, Salmos e NT; o contexto lista separadamente os cenários de todos os capítulos. Os marcos são regionais: os sete deslocamentos da trilha são de apresentação, não coordenadas históricas de cada evento. A tabela de âncoras é editorial e aproximada; não é uma base GIS arqueológica completa. O Éden é explicitamente simbólico, associado ao enquadramento mesopotâmico de Gn 2.10–14, sem afirmar localização comprovada.

Etapa atual que contém capítulo 1 abre um dialog nativo sobre o mapa com os livros iniciados, introduções existentes, contexto e recurso oficial BibleProject. Continuar chama o callback original de leitura. O vídeo usa o callback existente V1/V2; o portão fecha antes de abrir o player para evitar dois diálogos modais simultâneos. Etapas futuras e já concluídas não abrem o leitor. Frontend não concede XP nem modifica prazos ou liberações do servidor.

## Evidência executada

- npm run verify:engineering: 117 testes de scripts aprovados e gate aprovado.
- npm test -- --run: 248 testes em 54 arquivos aprovados.
- npm run build: compilação TypeScript e Vite aprovadas; permanece aviso de tamanho de bundle.
- git diff --check: aprovado.
- Testes incluem integração do portão ao fluxo V2, teclado, bloqueio futuro e janelas até o último dia de 365/366.

## Pendências de homologação

O navegador remoto retornou ERR_CONNECTION_REFUSED para o servidor local; portanto não há evidência de inspeção visual em navegador desktop/celular, reprodução real de vídeo, ou teste com sessão autenticada. Os testes de interação usam jsdom, mocks de dialog e recursos locais. Conferir foco, contraste sobre os cenários, toque em 360/390 px, player e deslocamento de câmera em preview antes da integração. A representação vetorial é uma primeira implementação da skin e exige homologação visual frente à referência 3D solicitada.

Sem migrations, alterações de banco, upgrades de plano ou chamadas extras a APIs de IA no produto. Entrega em agent/* por Draft PR; sem merge ou deploy manual. Reversão: reverter o commit da skin. Revisão QA/UX e validação de produção permanecem pendentes, não presumidas.
