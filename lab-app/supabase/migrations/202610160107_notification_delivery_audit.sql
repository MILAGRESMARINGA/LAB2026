-- LABGAME: server-only delivery audit. An email job cannot silently opt users in.
-- No jobs, emails or subscriptions are enabled by this migration.
CREATE TABLE public.lab_notification_deliveries (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 category text NOT NULL CHECK(category IN('reading','stage','gc','achievement','study')),
 channel text NOT NULL CHECK(channel='email'),
 local_day date NOT NULL,
 status text NOT NULL DEFAULT 'reserved' CHECK(status IN('reserved','sent','failed','suppressed')),
 provider_message_id text,
 sent_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,category,channel,local_day),
 CHECK(status<>'sent' OR sent_at IS NOT NULL)
);
ALTER TABLE public.lab_notification_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_notification_deliveries FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_notification_deliveries TO authenticated;
CREATE POLICY "Own optional notification delivery history"
 ON public.lab_notification_deliveries FOR SELECT TO authenticated
 USING(user_id=(SELECT auth.uid()));
CREATE INDEX lab_notification_deliveries_created ON public.lab_notification_deliveries(created_at DESC);
