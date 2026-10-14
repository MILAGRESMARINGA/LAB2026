import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// Static security contract; NOT a PostgreSQL integration test.
const migration=readFileSync(new URL("../../supabase/migrations/202610140001_annual_cycle_completion_awards.sql",import.meta.url),"utf8");

test("ledger is unique per completed run, enforces escalating bonus, and has owner-only RLS",()=>{
 assert.match(migration,/CREATE TABLE public\.lab_game_cycle_awards\s*\(/i);
 assert.match(migration,/run_id uuid PRIMARY KEY REFERENCES public\.lab_game_runs/i);
 assert.match(migration,/UNIQUE\s*\(user_id, cycle_number\)/i);
 assert.match(migration,/bonus_xp::bigint\s*=\s*10000::bigint\s*\+\s*\(cycle_number::bigint - 1\) \* 2500/i);
 assert.match(migration,/ALTER TABLE public\.lab_game_cycle_awards ENABLE ROW LEVEL SECURITY/i);
 assert.match(migration,/FOR SELECT TO authenticated\s+USING\s*\(user_id = \(SELECT auth\.uid\(\)\)\)/i);
 assert.match(migration,/REVOKE ALL ON public\.lab_game_cycle_awards FROM PUBLIC, anon, authenticated/i);
 assert.match(migration,/GRANT SELECT ON public\.lab_game_cycle_awards TO authenticated/i);
 assert.doesNotMatch(migration,/GRANT\s+(?:INSERT|UPDATE|DELETE|ALL)\s+ON\s+public\.lab_game_cycle_awards\s+TO\s+authenticated/i);
});
test("only a 365-day canonical completion can credit a locked, idempotent cycle bonus",()=>{
 assert.match(migration,/PERFORM public\.lab_game_sync\(\)/);
 assert.match(migration,/WHERE user_id=v_user AND status='active' FOR UPDATE/i);
 assert.match(migration,/IF v_day=365 THEN\s*SELECT COUNT\(\*\) INTO v_all/i);
 assert.match(migration,/v_all<>1189 OR v_plan_count<>1189/i);
 assert.match(migration,/WHERE user_id=v_user AND status='completed'/i);
 assert.match(migration,/ON CONFLICT \(run_id\) DO NOTHING/i);
 assert.match(migration,/GET DIAGNOSTICS v_added=ROW_COUNT/i);
 assert.match(migration,/IF v_added=1 THEN\s*UPDATE public\.lab_game_stats/i);
 assert.match(migration,/SET total_xp=total_xp\+v_bonus/i);
 assert.match(migration,/CREATE OR REPLACE FUNCTION public\.lab_game_confirm_chapter\(p_chapter_id text\)/i);
 assert.match(migration,/SECURITY DEFINER SET search_path=''/i);
});
test("the scorecard reconciles reading, video and annual bonuses without transferring GC XP",()=>{
 assert.match(migration,/v_chapter_xp\+v_video_xp\+v_completion_xp/g);
 assert.match(migration,/'cycle_bonus_xp',v_completion_xp,'completed_cycles',v_completed_cycles/i);
 assert.match(migration,/'cycle_awards',v_awards/i);
 assert.doesNotMatch(migration,/UPDATE\s+public\.reading_groups\b|UPDATE\s+public\.reading_group_members\b|UPDATE\s+public\.lab_game_gc_league\b/i);
 assert.match(migration,/NOT applied to production/i);
});
