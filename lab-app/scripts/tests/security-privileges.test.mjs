import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const migration=readFileSync(new URL("../../supabase/migrations/202610120001_lab_privileges_hardening.sql",import.meta.url),"utf8");
const preflight=readFileSync(new URL("../sql/security-post-migration-check.sql",import.meta.url),"utf8");
const expectedTables=[
 "reading_completions","reading_groups","reading_group_members","reading_group_invites",
 "lab_game_plan_chapters","lab_game_runs","lab_game_chapter_checks","lab_game_stats",
 "lab_game_video_resources","lab_game_video_sessions","lab_game_video_rewards",
 "lab_bible_editions","lab_bible_chapters","lab_bible_favorites","lab_bible_verses"
];

test("hardening only revokes non-DML privileges and never alters or deletes application data",()=>{
 assert.match(migration,/REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE/i);
 assert.match(migration,/FROM PUBLIC, anon, authenticated;/i);
 assert.doesNotMatch(migration,/\b(?:DROP\s+TABLE|DELETE\s+FROM|TRUNCATE\s+TABLE|UPDATE\s+public\.)\b/i);
 assert.doesNotMatch(migration,/\bREVOKE\s+SELECT\b/i);
});
test("all LABGAME public tables are covered and remain in read-only follow-up test",()=>{
 for(const table of expectedTables){
  assert.ok(migration.includes("public."+table),table+" missing in migration");
  assert.ok(preflight.includes("'public."+table+"'"),table+" missing in acceptance query");
 }
});
test("trigger helpers lose PUBLIC EXECUTE without removing trigger ownership",()=>{
 for(const helper of ["register_reading_group_owner()","rls_auto_enable()"]){
  assert.ok(migration.includes("public."+helper),helper+" is not hardened");
  assert.ok(preflight.includes("'public."+helper+"'"),helper+" is not checked");
 }
 assert.match(migration,/REVOKE EXECUTE ON FUNCTION/i);
 assert.doesNotMatch(migration,/DROP\s+(?:EVENT\s+)?TRIGGER\b/i);
});
test("migration contains atomic privilege assertions",()=>{
 assert.match(migration,/DO \$verify\$/);
 assert.match(migration,/has_table_privilege/);
 assert.match(migration,/has_function_privilege/);
 assert.match(migration,/RAISE EXCEPTION/);
});
