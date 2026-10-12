# ADR 0002 — RAG curado antes de fine-tuning teológico

**Status:** ACEITO · **Data:** 2026-10-12

**Contexto:** exegese exige referências específicas, interpretações fundamentadas e rastreio de fontes. Um LLM sem corpus pode inventar páginas/citações. Obras contemporâneas possuem direitos autorais.

**Alternativas:** (A) prompting sem referências; (B) fine-tuning imediato; (C) RAG com corpus autorizado + validação e revisão.

**Decisão:** (C). Corpus com licenças, versão, autoria, obra e localizador; texto recuperado como dados não confiáveis. Saída JSON Schema, revisão pastoral/humana e cache por modelo/prompt/fonte. IA não acessa função que atribui XP.

**Consequência:** desenvolvimento inicial mais cuidadoso, maior auditabilidade e menor risco de distorção doutrinária. Fine-tuning só pode ser proposto após métricas RAG que justifiquem sua necessidade, dataset licenciado e benchmark editorial.

**Verificação:** `docs/AI-ARCHITECTURE-AND-GOVERNANCE.md`, avaliação e segurança antes do primeiro endpoint publicado.
