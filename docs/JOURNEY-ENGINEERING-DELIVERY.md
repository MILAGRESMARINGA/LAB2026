# Jornada geo-histórica — contrato de engenharia

## Responsabilidades

- Plano anual: fonte determinística existente, imutável pela navegação e por IA.
- Progresso: elegibilidade, relógio e XP continuam autoritativos no backend existente.
- Episódios: cobertura editorial dos 1.189 capítulos; ordem de leitura não implica ordem cronológica universal.
- Atlas: cenários e coordenadas regionais estilizados; incerteza cartográfica é explícita.
- Cena: malhas Three.js; enquadramentos Mundo, Região e Episódio; zoom e arraste. Sete dias no painel semanal; apenas marcos geograficamente próximos na cena local.
- Evidência: referências recuperadas por livro/capítulo; publicação remota separada do pacote local.

## Contrato remoto e reserva local

A interface usa `useJourneyEditorialContext`. Exibe imediatamente o catálogo incluído no aplicativo. A consulta remota exige `VITE_JOURNEY_EDITORIAL_REMOTE=true` e o cliente Supabase regular. O repositório valida publicação, revisão, correspondência de livro/capítulo e fonte HTTPS; falhas preservam o conteúdo local. Não utiliza chave privilegiada, dados pessoais ou geração de texto. Cache limitado à sessão, com prazo e tempo máximo de consulta.

A migração editorial é aditiva, sem mudanças no progresso: releases, episódios, âncoras, fontes e evidências com vínculo de versão. Leitura pública limitada às versões publicadas; escrita restrita ao serviço confiável. Uma versão de rascunho não constitui aprovação teológica. Não há sementes automaticamente classificadas como revisão humana concluída.

## Entrega e limites

Esta implementação fornece uma caminhada navegável e uma base editorial auditável, não uma cronologia arqueológica definitiva. Fine-tuning e novas chamadas pagas de LLM não foram executados. O uso de dados revisados, recuperação e revisão humana precede qualquer geração futura.

Publicação de prévia pode ocorrer pela branch `agent/isometric-journey`. A migração em produção depende dos gates já definidos no projeto: backup/restore, ensaio, reconciliação e revisão de segurança. A interface funciona com a base local enquanto o banco editorial não estiver ativado. Rollback da interface: reverter o commit; a camada editorial nova é isolada das tabelas de progresso.
