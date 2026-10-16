import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const root=new URL("../../",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
const migration=read("supabase/migrations/202610160109_server_side_reading_speed_guard.sql");
const v1=read("src/features/lab-game.ts");
const v2=read("src/features/journey-v2.ts");
const reader=read("src/components/BibleReader.tsx");
const app=read("src/App.tsx");
const v2Panel=read("src/components/JourneyV2Panel.tsx");
const pgSmoke=read("scripts/tests/v2-postgres-smoke.sql");
const localV2=read("scripts/tests/local-v2-smoke.mjs");

test("both chapter RPCs use server timing and idempotent server records",()=>{
 for(const name of ["lab_game_begin_chapter","lab_game_confirm_chapter",
                    "lab_v2_begin_chapter","lab_v2_confirm"]){
  const start=migration.indexOf("CREATE OR REPLACE FUNCTION public."+name+"(");
  assert.notEqual(start,-1,name+" must be defined");
  const end=migration.indexOf("$fn$;",start);
  assert.notEqual(end,-1,name+" body must close");
  const body=migration.slice(start,end);
  assert.match(body,/SECURITY DEFINER/);
  assert.match(body,/SET search_path\s*=\s*''/);
  assert.match(body,/auth\.uid\(\)/);
  assert.match(body,/clock_timestamp\(\)/);
 }
 assert.match(migration,/lab_chapter_minimum_read_seconds/);
 assert.match(migration,/array_length\(regexp_split_to_array\(btrim\(v\.verse_text\), '\\s\+'\), 1\)/);
 assert.match(migration,/v_at < v_started \+ v_minimum_seconds \* interval '1 second'/);
 assert.match(migration,/ON CONFLICT DO NOTHING/);
 assert.match(migration,/REVOKE ALL ON FUNCTION public\.lab_game_confirm_chapter\(text\)[\s\S]*?GRANT EXECUTE ON FUNCTION public\.lab_game_confirm_chapter\(text\) TO authenticated/);
 assert.match(migration,/REVOKE ALL ON FUNCTION public\.lab_v2_confirm\(uuid, integer, text\)[\s\S]*?GRANT EXECUTE ON FUNCTION public\.lab_v2_confirm\(uuid, integer, text\) TO authenticated/);
});

test("the chapter plan stays private and timer rows are inaccessible to API roles",()=>{
 assert.match(migration,/ALTER TABLE public\.lab_game_chapter_read_sessions ENABLE ROW LEVEL SECURITY/);
 assert.match(migration,/ALTER TABLE public\.lab_v2_chapter_read_sessions ENABLE ROW LEVEL SECURITY/);
 assert.match(migration,/REVOKE ALL ON public\.lab_game_chapter_read_sessions FROM PUBLIC, anon, authenticated/);
 assert.match(migration,/REVOKE ALL ON public\.lab_v2_chapter_read_sessions FROM PUBLIC, anon, authenticated/);
 assert.doesNotMatch(migration,/CREATE POLICY[\s\S]{0,160}lab_game_plan_chapters/i);
 assert.match(pgSmoke,/chapter plan RLS was disabled/);
 assert.match(pgSmoke,/API roles can read the internal chapter plan directly/);
});

test("the reader starts its server timer before displaying either journey chapter",()=>{
 assert.match(v1,/rpc\("lab_game_begin_chapter",\{p_chapter_id:chapterId\}\)/);
 assert.match(v2,/rpc\("lab_v2_begin_chapter",\{/);
 assert.doesNotMatch(v1+v2,/p_(?:started_at|elapsed_seconds|client_timestamp)/i);
 assert.match(app,/onOpen=\{beginGameChapter\}/);
 assert.match(v2Panel,/onOpen=\{beginSelectedChapter\}/);
 assert.match(reader,/await onOpenRef\.current\?\.\(chapterId\);\s*const data=await readBibleChapter\(chapterId\)/);
});

test("CI proves immediate rejection, delayed success, XP idempotence and local-only backdating",()=>{
 assert.match(pgSmoke,/FAIL: V1 accepted an immediate chapter confirmation/);
 assert.match(pgSmoke,/FAIL: V2 accepted an immediate chapter confirmation/);
 assert.match(pgSmoke,/V1 confirmation did not award exactly once/);
 assert.match(pgSmoke,/V2 confirmation did not award exactly once/);
 assert.match(pgSmoke,/a public SECURITY DEFINER function lacks fixed search_path/);
 assert.match(localV2,/Backdate only a local isolated fixture/);
 assert.match(localV2,/lab_v2_begin_chapter/);
});
