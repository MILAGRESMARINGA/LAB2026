-- LABGAME public Bible library: private user bookmarks, independent of game XP.
CREATE TABLE IF NOT EXISTS public.lab_bible_favorites (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 edition text NOT NULL DEFAULT 'ALM1911' REFERENCES public.lab_bible_editions(code),
 chapter_id text NOT NULL CHECK(chapter_id ~ '^[0-9]{1,2}:[0-9]{1,3}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id,edition,chapter_id),
 FOREIGN KEY (edition,chapter_id) REFERENCES public.lab_bible_chapters(edition,chapter_id)
);
ALTER TABLE public.lab_bible_favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_bible_favorites FROM PUBLIC,anon;
GRANT SELECT,INSERT,DELETE ON public.lab_bible_favorites TO authenticated;
CREATE POLICY "Read own favorite Bible chapters"
 ON public.lab_bible_favorites FOR SELECT TO authenticated
 USING (user_id=(SELECT auth.uid()));
CREATE POLICY "Add own favorite Bible chapters"
 ON public.lab_bible_favorites FOR INSERT TO authenticated
 WITH CHECK (user_id=(SELECT auth.uid()));
CREATE POLICY "Remove own favorite Bible chapters"
 ON public.lab_bible_favorites FOR DELETE TO authenticated
 USING (user_id=(SELECT auth.uid()));
