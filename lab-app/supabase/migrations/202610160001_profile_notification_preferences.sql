-- LABGAME P0/P1 staging migration: optional profile and notification choices.
-- NOT applied to production; first test with two accounts, inspect RLS and backups.
-- No CPF/RG/document numbers are stored: require field encryption and separate review.
-- Optional religious affiliation/ministry information is private and requires consent.

CREATE TABLE public.lab_member_profiles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 full_name text CHECK (full_name IS NULL OR length(full_name) BETWEEN 2 AND 120),
 phone text CHECK (phone IS NULL OR length(phone)<=30),
 date_of_birth date,
 marital_status text CHECK (marital_status IS NULL OR marital_status IN
    ('nao_informar','solteiro','casado','divorciado','viuvo','uniao_estavel','outro')),
 profession text CHECK (profession IS NULL OR length(profession)<=100),
 postal_code text CHECK (postal_code IS NULL OR length(postal_code)<=12),
 state_code text CHECK (state_code IS NULL OR state_code ~ '^[A-Z]{2}$'),
 city text CHECK (city IS NULL OR length(city)<=100),
 district text CHECK (district IS NULL OR length(district)<=100),
 street_address text CHECK (street_address IS NULL OR length(street_address)<=160),
 address_number text CHECK (address_number IS NULL OR length(address_number)<=20),
 address_extra text CHECK (address_extra IS NULL OR length(address_extra)<=100),
 church_name text CHECK (church_name IS NULL OR length(church_name)<=130),
 pastor_name text CHECK (pastor_name IS NULL OR length(pastor_name)<=120),
 ministry_role text CHECK (ministry_role IS NULL OR length(ministry_role)<=100),
 gc_name text CHECK (gc_name IS NULL OR length(gc_name)<=130),
 religious_data_consent_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT ministry_consent_required CHECK (
   religious_data_consent_at IS NOT NULL OR
   (church_name IS NULL AND pastor_name IS NULL AND ministry_role IS NULL AND gc_name IS NULL)
 )
);

CREATE TABLE public.lab_notification_preferences (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 enabled boolean NOT NULL DEFAULT false,
 in_app_popup boolean NOT NULL DEFAULT false,
 email boolean NOT NULL DEFAULT false,
 reading_reminders boolean NOT NULL DEFAULT false,
 gc_activity boolean NOT NULL DEFAULT false,
 milestones boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_notification_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lab_member_profiles,public.lab_notification_preferences
 FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE public.lab_member_profiles,public.lab_notification_preferences TO authenticated;
REVOKE TRUNCATE,TRIGGER,REFERENCES,MAINTAIN ON TABLE public.lab_member_profiles,public.lab_notification_preferences
 FROM PUBLIC,anon,authenticated;

CREATE POLICY "Profile read private" ON public.lab_member_profiles
 FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY "Profile insert private" ON public.lab_member_profiles
 FOR INSERT TO authenticated WITH CHECK (user_id=(SELECT auth.uid()));
CREATE POLICY "Profile update private" ON public.lab_member_profiles
 FOR UPDATE TO authenticated USING (user_id=(SELECT auth.uid()))
 WITH CHECK (user_id=(SELECT auth.uid()));
CREATE POLICY "Preferences read private" ON public.lab_notification_preferences
 FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY "Preferences insert private" ON public.lab_notification_preferences
 FOR INSERT TO authenticated WITH CHECK (user_id=(SELECT auth.uid()));
CREATE POLICY "Preferences update private" ON public.lab_notification_preferences
 FOR UPDATE TO authenticated USING (user_id=(SELECT auth.uid()))
 WITH CHECK (user_id=(SELECT auth.uid()));

-- Strong non-destructive defaults for future public tables.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon,authenticated;

-- Clearing the JOURNEY is distinct from starting another annual cycle:
-- account, private profile, Bible favorites and GC membership remain.
-- Chapter/video checks and annual awards are erased through ON DELETE CASCADE.
CREATE OR REPLACE FUNCTION public.lab_game_full_reset(p_confirmation text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();
 v_last_sign_in timestamptz;
 v_today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
 IF p_confirmation IS DISTINCT FROM 'ZERAR JORNADA' THEN
  RAISE EXCEPTION 'A confirmação da exclusão do progresso é obrigatória';
 END IF;
 -- User must have signed in with their credentials again recently.
 SELECT last_sign_in_at INTO v_last_sign_in FROM auth.users WHERE id=v_user;
 IF v_last_sign_in IS NULL OR v_last_sign_in < now()-interval '5 minutes' THEN
  RAISE EXCEPTION 'Entre novamente na sua conta para confirmar esta operação';
 END IF;
 PERFORM public.lab_game_sync();
 PERFORM 1 FROM public.lab_game_stats WHERE user_id=v_user FOR UPDATE;
 DELETE FROM public.lab_game_runs WHERE user_id=v_user;
 DELETE FROM public.lab_game_video_sessions WHERE user_id=v_user;
 DELETE FROM public.lab_game_video_rewards WHERE user_id=v_user;
 DELETE FROM public.reading_completions WHERE user_id=v_user;
 UPDATE public.lab_game_stats
 SET best_days=0,total_xp=0,total_completed_days=0,updated_at=now()
 WHERE user_id=v_user;
 INSERT INTO public.lab_game_runs(user_id,started_on)
 VALUES(v_user,v_today);
 RETURN public.lab_game_sync();
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_game_full_reset(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_full_reset(text) TO authenticated;

-- No automatic email dispatch is introduced in this migration.
-- Email preferences are saved only; outbound delivery requires approved
-- SMTP/notification worker, consent tests, unsubscribe and audit trail.
