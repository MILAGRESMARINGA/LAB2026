BEGIN;
CREATE SCHEMA IF NOT EXISTS lab_agent_private;
REVOKE ALL ON SCHEMA lab_agent_private FROM PUBLIC, anon, authenticated;
CREATE TABLE lab_agent_private.manager_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 request_id uuid NOT NULL,
 message text NOT NULL CHECK (char_length(message) BETWEEN 2 AND 3000),
 reply text NOT NULL CHECK (char_length(reply) BETWEEN 1 AND 6000),
 kind text NOT NULL CHECK (kind IN ('conversation','decision','priority','status')),
 issue_number integer,
 priority text CHECK (priority IN ('high','normal','low')),
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 UNIQUE(owner_id,request_id),
 CHECK ((kind='priority' AND issue_number IS NOT NULL AND issue_number>0 AND priority IS NOT NULL) OR
        (kind<>'priority' AND issue_number IS NULL AND priority IS NULL))
);
CREATE INDEX manager_events_owner_time ON lab_agent_private.manager_events(owner_id,created_at DESC,id DESC);
CREATE TABLE lab_agent_private.manager_priorities (
 owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 issue_number integer NOT NULL CHECK (issue_number>0),
 priority text NOT NULL CHECK (priority IN ('high','normal','low')),
 updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 PRIMARY KEY(owner_id,issue_number)
);
ALTER TABLE lab_agent_private.manager_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_agent_private.manager_priorities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA lab_agent_private FROM PUBLIC,anon,authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA lab_agent_private FROM PUBLIC,anon,authenticated;

-- The only exposed entry point. Definer is necessary to keep private tables
-- inaccessible through REST; identity and current server-managed admin status
-- are checked on EVERY call, including reads and duplicate requests.
CREATE FUNCTION public.lab_agent_manager_state(
 p_request_id uuid DEFAULT NULL,p_message text DEFAULT NULL,p_reply text DEFAULT NULL,
 p_kind text DEFAULT 'conversation',p_issue integer DEFAULT NULL,p_priority text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 v_owner uuid := auth.uid();
 v_event lab_agent_private.manager_events%ROWTYPE;
 v_events jsonb;
 v_priorities jsonb;
 v_partial boolean;
BEGIN
 IF v_owner IS NULL OR NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id=v_owner
   AND u.raw_app_meta_data->'labgame_orchestrator_admin'='true'::jsonb
 ) THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NOT NULL THEN
  IF p_message IS NULL OR p_reply IS NULL OR p_kind IS NULL THEN
   RAISE EXCEPTION 'Invalid manager message' USING ERRCODE='22023';
  END IF;
  INSERT INTO lab_agent_private.manager_events(owner_id,request_id,message,reply,kind,issue_number,priority)
   VALUES(v_owner,p_request_id,p_message,p_reply,p_kind,p_issue,p_priority)
   ON CONFLICT(owner_id,request_id) DO NOTHING RETURNING * INTO v_event;
  IF v_event.id IS NULL THEN
   SELECT * INTO v_event FROM lab_agent_private.manager_events WHERE owner_id=v_owner AND request_id=p_request_id;
   IF v_event.message IS DISTINCT FROM p_message OR v_event.kind IS DISTINCT FROM p_kind
    OR v_event.issue_number IS DISTINCT FROM p_issue OR v_event.priority IS DISTINCT FROM p_priority THEN
    RAISE EXCEPTION 'Request identifier already used' USING ERRCODE='22023';
   END IF;
  ELSIF p_kind='priority' THEN
   INSERT INTO lab_agent_private.manager_priorities(owner_id,issue_number,priority) VALUES(v_owner,p_issue,p_priority)
    ON CONFLICT(owner_id,issue_number) DO UPDATE SET priority=EXCLUDED.priority,updated_at=statement_timestamp();
  END IF;
 END IF;
 SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.created_at,e.id),'[]'::jsonb) INTO v_events
 FROM (SELECT id,request_id,message,reply,kind,issue_number,priority,created_at
       FROM lab_agent_private.manager_events WHERE owner_id=v_owner ORDER BY created_at DESC,id DESC LIMIT 40) e;
 SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.issue_number),'[]'::jsonb) INTO v_priorities
 FROM (SELECT issue_number,priority,updated_at FROM lab_agent_private.manager_priorities WHERE owner_id=v_owner) p;
 SELECT EXISTS(SELECT 1 FROM lab_agent_private.manager_events WHERE owner_id=v_owner OFFSET 40 LIMIT 1) INTO v_partial;
 RETURN jsonb_build_object('events',v_events,'priorities',v_priorities,'history_partial',v_partial,
  'receipt',CASE WHEN v_event.id IS NOT NULL THEN jsonb_build_object('request_id',v_event.request_id,'reply',v_event.reply) ELSE NULL END);
END $$;
REVOKE ALL ON FUNCTION public.lab_agent_manager_state(uuid,text,text,text,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lab_agent_manager_state(uuid,text,text,text,integer,text) TO authenticated;
COMMIT;
