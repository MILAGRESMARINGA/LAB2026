import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const sql=readFileSync(new URL("../../supabase/migrations/202610160001_profile_notification_preferences.sql",import.meta.url),"utf8");
const sqlCode=sql.split("\n").filter(line=>!line.trimStart().startsWith("--")).join("\n");
const edge=readFileSync(new URL("../../supabase/functions/account-delete/index.ts",import.meta.url),"utf8");
const frontend=readFileSync(new URL("../../src/components/ProfileSettings.tsx",import.meta.url),"utf8");
test("personal and religious data tables are private and self-owned",()=>{
 for(const name of ["lab_member_profiles","lab_notification_preferences"]){
  assert.match(sql,new RegExp("CREATE TABLE public\\."+name+" \\("));
  assert.match(sql,new RegExp("ALTER TABLE public\\."+name+" ENABLE ROW LEVEL SECURITY"));
  assert.match(sql,new RegExp("user_id uuid PRIMARY KEY REFERENCES auth\\.users\\(id\\) ON DELETE CASCADE"));
 }
 assert.match(sql,/GRANT SELECT,INSERT,UPDATE.*TO authenticated/);
 assert.match(sql,/user_id=\(SELECT auth\.uid\(\)\)/);
 assert.match(sql,/religious_data_consent_at/);
 assert.match(sql,/ministry_consent_required/);
 assert.doesNotMatch(sqlCode,/\b(?:cpf|rg_number|passport_number)\b/i);
});
test("full reset requires a recently reauthenticated user and explicit typed phrase",()=>{
 assert.match(sql,/FUNCTION public\.lab_game_full_reset\(p_confirmation text\)/);
 assert.match(sql,/p_confirmation IS DISTINCT FROM 'ZERAR JORNADA'/);
 assert.match(sql,/v_session_id text:=auth\.jwt\(\)->>'session_id'/);
 assert.match(sql,/FROM auth\.sessions s/);
 assert.match(sql,/s\.user_id=v_user/);
 assert.doesNotMatch(sql,/last_sign_in_at INTO v_last_sign_in/);
 assert.match(sql,/WHERE user_id=v_user FOR UPDATE/);
 assert.match(sql,/DELETE FROM public\.lab_game_runs WHERE user_id=v_user/);
 assert.match(sql,/DELETE FROM public\.lab_game_video_rewards WHERE user_id=v_user/);
 assert.match(sql,/total_xp=0,total_completed_days=0/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.lab_game_full_reset\(text\) FROM PUBLIC,anon/);
 assert.doesNotMatch(sql,/DELETE FROM auth\.users|DELETE FROM public\.reading_groups/);
});
test("account deletion is server-only and blocks GCs that have other members",()=>{
 assert.match(edge,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(edge,/auth\.getUser\(jwt\)/);
 assert.match(edge,/auth\.admin\.getUserById\(user\.id\)/);
 assert.match(edge,/auth\.signInWithPassword\(/);
 assert.match(edge,/reauthenticated\.user\?\.id!==user\.id/);
 assert.match(edge,/auth\.admin\.deleteUser\(user\.id\)/);
 assert.match(edge,/confirmation!=="EXCLUIR CONTA"/);
 assert.match(edge,/\.neq\("user_id",user\.id\)/);
 assert.match(edge,/Date\.now\(\)-signedIn>5\*60\*1000/);
 assert.doesNotMatch(frontend,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(frontend,/VITE_ACCOUNT_DELETION_READY/);
 assert.match(frontend,/role="alertdialog" aria-modal="true"/);
 assert.match(frontend,/EXCLUIR CONTA/);
});
test("does not auto-send email or enable browser notifications without opt-in",()=>{
 assert.doesNotMatch(sqlCode,/pg_net|http_post|smtp|email_send/i);
 assert.match(sql,/enabled boolean NOT NULL DEFAULT false/);
 assert.match(sql,/email boolean NOT NULL DEFAULT false/);
 assert.match(sql,/in_app_popup boolean NOT NULL DEFAULT false/);
});
