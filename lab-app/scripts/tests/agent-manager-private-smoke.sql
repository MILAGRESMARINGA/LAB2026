-- Synthetic accounts in the ephemeral PostgreSQL CI database only.
INSERT INTO auth.users(id,raw_app_meta_data) VALUES
 ('f1000000-0000-4000-8000-000000000001','{"labgame_orchestrator_admin":true}'),
 ('f1000000-0000-4000-8000-000000000002','{"labgame_orchestrator_admin":true}'),
 ('f1000000-0000-4000-8000-000000000003','{}');
SET ROLE authenticated;
SELECT set_config('app.test_user','f1000000-0000-4000-8000-000000000003',false);
DO $$ BEGIN
 BEGIN PERFORM public.lab_agent_manager_state(); RAISE EXCEPTION 'Non-admin admitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('app.test_user','f1000000-0000-4000-8000-000000000001',false);
DO $$ DECLARE r jsonb; BEGIN
 SELECT public.lab_agent_manager_state('a1000000-0000-4000-8000-000000000001','lembrar: testar interface','Decisão salva','decision') INTO r;
 IF jsonb_array_length(r->'events')<>1 THEN RAISE EXCEPTION 'Memory not saved'; END IF;
 SELECT public.lab_agent_manager_state('a1000000-0000-4000-8000-000000000001','lembrar: testar interface','Outra resposta','decision') INTO r;
 IF jsonb_array_length(r->'events')<>1 OR r->'receipt'->>'reply'<>'Decisão salva' THEN RAISE EXCEPTION 'Idempotency failed'; END IF;
 BEGIN
  PERFORM public.lab_agent_manager_state('a1000000-0000-4000-8000-000000000001','Mensagem diferente','Resposta','decision');
  RAISE EXCEPTION 'Conflicting request admitted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 PERFORM public.lab_agent_manager_state('a1000000-0000-4000-8000-000000000002','prioridade alta para tarefa 47','Prioridade alta','priority',47,'high');
 PERFORM public.lab_agent_manager_state('a1000000-0000-4000-8000-000000000003','prioridade baixa para tarefa 47','Prioridade baixa','priority',47,'low');
 SELECT public.lab_agent_manager_state('a1000000-0000-4000-8000-000000000002','prioridade alta para tarefa 47','Prioridade alta','priority',47,'high') INTO r;
 IF r->'priorities'->0->>'priority'<>'low' THEN RAISE EXCEPTION 'Replay overwrote newer priority'; END IF;
 BEGIN PERFORM 1 FROM lab_agent_private.manager_events; RAISE EXCEPTION 'Private table exposed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('app.test_user','f1000000-0000-4000-8000-000000000002',false);
DO $$ DECLARE r jsonb; BEGIN
 SELECT public.lab_agent_manager_state() INTO r;
 IF jsonb_array_length(r->'events')<>0 OR jsonb_array_length(r->'priorities')<>0 THEN RAISE EXCEPTION 'Cross-account memory exposure'; END IF;
END $$;
RESET ROLE;
UPDATE auth.users SET raw_app_meta_data='{}' WHERE id='f1000000-0000-4000-8000-000000000001';
SET ROLE authenticated;
SELECT set_config('app.test_user','f1000000-0000-4000-8000-000000000001',false);
DO $$ BEGIN
 BEGIN PERFORM public.lab_agent_manager_state(); RAISE EXCEPTION 'Revoked administrator admitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM public.lab_agent_manager_state(); RAISE EXCEPTION 'Anonymous memory access';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT 'LAB MANAGER PRIVATE MEMORY, OWNERSHIP, REVOCATION AND IDEMPOTENCY PASSED' AS result;
