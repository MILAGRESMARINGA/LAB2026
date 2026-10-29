-- AI-assisted QA suggestions for the first reading path and lexical terms.
-- These are NOT human reviews. All rows retain translation_status='machine'.
-- Exact before-values required; other 18,085 machine rows stay hidden until QA.
begin;
with proposals(strong_number,old_gloss,new_gloss) as (
 values
 ('G5485','grace','graça, favor'),
 ('G1722','em/em/em/em','em, entre, sobre (conforme o contexto)'),
 ('G3056','palavra, discurso; o Verbo','palavra, discurso, mensagem'),
 ('G3588','o/isto/quem','artigo definido; o, a, os, as'),
 ('H776','Terras: país/planeta','terra, território, país'),
 ('H853','[Obj.]','partícula que indica objeto direto definido'),
 ('G746','princípio, começo','princípio, início'),
 ('G286','cordeiro','cordeiro'),
 ('G4637','habitar, armar tenda, tabernacular','habitar, estabelecer morada'),
 ('H7225','princípio, começo, primeiro','princípio, começo'),
 ('H1254','criar, formar','criar, formar'),
 ('H430','Deus, deuses','Deus, deuses (conforme o contexto)'),
 ('H835','feliz, bem-aventurado','feliz, bem-aventurado'),
 ('H1897','meditar, murmurar, refletir','meditar, murmurar, refletir'),
 ('G2532','e','e'),
 ('G1510','ser','ser, estar'),
 ('G2316','Deus.','Deus')
)
update public.strong_lexicon_translations tr
set translated_gloss=p.new_gloss,auto_qa_passed=true
from proposals p
where tr.strong_number=p.strong_number and tr.locale='pt-BR'
  and tr.translated_gloss=p.old_gloss
  and tr.translation_status='machine'
  and tr.translation_method='automatic-neural';
-- A rejected QA sample is NOT promoted; no artificial reviewed_at.
-- Future jobs must log actual source mismatch and revisit these proposals.
commit;
