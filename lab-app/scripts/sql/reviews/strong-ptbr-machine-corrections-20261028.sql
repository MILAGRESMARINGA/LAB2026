-- LABGame: proposed corrections to AUTOMATED pt-BR glosses only.
-- Do NOT label as "human-reviewed": these are AI-assisted editorial suggestions.
-- Apply only after restore-tested backup + independent editorial sign-off.
-- This script does not publish releases, approve links or modify source text.
begin;
with proposals(strong_number,previous,proposed) as (
 values
 ('G5485','grace','graça, favor'),
 ('G1722','em/em/em/em','em, sobre, entre (conforme o contexto)'),
 ('G3056','palavra, discurso; o Verbo','palavra, discurso, mensagem'),
 ('G3588','o/isto/quem','artigo definido; o, a, os, as'),
 ('H776','Terras: país/planeta','terra, território, país'),
 ('H853','[Obj.]','partícula que marca objeto direto definido')
)
update public.strong_lexicon_translations t
 set translated_gloss=p.proposed
 from proposals p
 where t.strong_number=p.strong_number
   and t.locale='pt-BR'
   and t.translated_gloss=p.previous
   and t.translation_status='machine'
   and t.translation_method='automatic-neural';
-- Preserve source_gloss_sha256, provider, source_language and current machine status.
commit;
