-- LABGAME: optional notification categories each have independent
-- in-app popup and e-mail opt-ins. No automatic delivery is enabled here.
-- Migration is additive, retains the old settings and does not create emails.
ALTER TABLE public.lab_notification_preferences
 ADD COLUMN reading_popup boolean NOT NULL DEFAULT false,
 ADD COLUMN reading_email boolean NOT NULL DEFAULT false,
 ADD COLUMN stage_popup boolean NOT NULL DEFAULT false,
 ADD COLUMN stage_email boolean NOT NULL DEFAULT false,
 ADD COLUMN gc_popup boolean NOT NULL DEFAULT false,
 ADD COLUMN gc_email boolean NOT NULL DEFAULT false,
 ADD COLUMN achievement_popup boolean NOT NULL DEFAULT false,
 ADD COLUMN achievement_email boolean NOT NULL DEFAULT false,
 ADD COLUMN study_popup boolean NOT NULL DEFAULT false,
 ADD COLUMN study_email boolean NOT NULL DEFAULT false;

-- Restore the exact effective settings of earlier versions, do not
-- silently opt anybody into a channel they did not previously choose.
UPDATE public.lab_notification_preferences SET
 reading_popup=enabled AND in_app_popup AND reading_reminders,
 reading_email=enabled AND email AND reading_reminders,
 gc_popup=enabled AND in_app_popup AND gc_activity,
 gc_email=enabled AND email AND gc_activity,
 achievement_popup=enabled AND in_app_popup AND milestones,
 achievement_email=enabled AND email AND milestones;

-- Existing column names are retained for the prior frontend.
-- Producers MUST check enabled and the specific *_popup/*_email column
-- again at delivery time. No SMTP worker or push subscription is created.
