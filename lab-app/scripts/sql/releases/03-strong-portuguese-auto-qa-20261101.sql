-- Optional automated lexicon QA, NOT human editorial approval.
-- Execute only after restored backup and verified provenance.
begin;
with proposed(strong_number,before_gloss,after_gloss) as (
 values
 ('G5485','grace','graça, favor'),
 ('G1722','em/em/em/em','em, entre, sobre (conforme o contexto)'),
 ('G3056','palavra, discurso; o Verbo','palavra, discurso, mensagem'),
 ('G3588','o/isto/quem','artigo definido; o, a, os, as'),
 ('H776','Terras: país/planeta','terra, território, país'),
 ('H853','[Obj.]','partícula que indica objeto direto definido'),
 ('G746','princípio, começo','princípio, início'),
 ('H7225','princípio, começo, primeiro','princípio, começo'),
 ('H430','Deus, deuses','Deus, deuses (conforme o contexto)'),
 ('H835','feliz, bem-aventurado','feliz, bem-aventurado'),
 ('H1897','meditar, murmurar, refletir','meditar, murmurar, refletir'),
 ('G2532','e','e'),
 ('G1510','ser','ser, estar'),
 ('G2316','Deus.','Deus')
)
update public.strong_lexicon_translations t
set translated_gloss=p.after_gloss,auto_qa_passed=true
from proposed p
where t.strong_number=p.strong_number
 and t.locale='pt-BR'
 and t.translated_gloss=p.before_gloss
 and t.translation_status='machine'
 and t.translation_method='automatic-neural';
-- No artificial reviewed_at or human-reviewed fields.
commit;
