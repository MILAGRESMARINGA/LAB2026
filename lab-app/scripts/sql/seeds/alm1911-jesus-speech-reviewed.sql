-- Five individually reviewed ALM1911 examples, not a complete red-letter corpus.
-- Narration and the response in Revelation 22:20 remain unmarked.
-- Exact snapshot matching makes this content seed fail closed on a different transcription.
INSERT INTO public.lab_bible_jesus_speech(edition,chapter_id,verse_number,start_utf16,end_utf16,source_text,editorial_source_url,review_status)
SELECT v.edition,v.chapter_id,v.verse_number,s.start_utf16,s.end_utf16,v.verse_text,
 'https://www.gutenberg.org/ebooks/62383','published'
FROM (VALUES
 ('40:4',4,33,124,'Elle, porém, respondendo, disse: Está escripto: Nem só de pão viverá o homem, mas de toda a palavra que sae da bocca de Deus'),
 ('40:4',7,17,70,'Disse-lhe Jesus: Tambem está escripto: Não tentarás o Senhor teu Deus.'),
 ('40:4',10,23,112,'Então disse-lhe Jesus: Vae-te, Satanaz, porque está escripto: Ao Senhor teu Deus adorarás, e só a elle servirás.'),
 ('44:9',4,49,83,'E, caindo em terra, ouviu uma voz que lhe dizia: Saulo, Saulo, porque me persegues?'),
 ('66:22',20,40,64,'Aquelle que testifica estas coisas diz: Certamente presto venho. Amen: ora vem, Senhor Jesus.')
) AS s(chapter_id,verse_number,start_utf16,end_utf16,source_text)
JOIN public.lab_bible_verses v ON v.edition='ALM1911' AND v.chapter_id=s.chapter_id AND v.verse_number=s.verse_number AND v.verse_text=s.source_text
ON CONFLICT DO NOTHING;
