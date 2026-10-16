import test from "node:test";
import assert from "node:assert/strict";
import {scanSource,scanMigrations,scanTrackedPrivateFiles} from "../engineering-gate.mjs";

test("no false positive for Supabase publishable credentials",()=>{
 assert.deepEqual(scanSource("const key=import.meta.env.VITE_SUPABASE_ANON_KEY;"),[]);
 assert.deepEqual(scanSource('const x="https://player.mux.com/embed";'),[]);
});
test("rejects privileged secrets in frontend and dangerous HTML",()=>{
 assert.equal(scanSource("const x=import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;").length,1);
 assert.equal(scanSource("const x=import.meta.env.VITE_OPENAI_API_KEY;").length,1);
 assert.equal(scanSource('const el={dangerouslySetInnerHTML: html};').length,0);
 assert.equal(scanSource('<div dangerouslySetInnerHTML={{__html:value}}/>').length,1);
 assert.equal(scanSource('eval(userInput)').length,1);
 assert.equal(scanSource('const x="sb_secret_1234567890123456";').length,1);
});
test("SQL RLS: CREATE TABLE must be protected even across migration files",()=>{
 const sql=`CREATE TABLE public.sample_data(id uuid);
 -- later revision
 ALTER TABLE public.sample_data ENABLE ROW LEVEL SECURITY;`;
 assert.deepEqual(scanMigrations(sql),[]);
 assert.match(scanMigrations("CREATE TABLE public.sample_data(id uuid);")[0],/RLS/);
});
test("SECURITY DEFINER requires restricted search_path",()=>{
 const insecure=`CREATE FUNCTION public.unsafe_fn() RETURNS integer LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$;`;
 assert.ok(scanMigrations(insecure).some(x=>x.includes("search_path")));
 const safe=`CREATE FUNCTION public.safe_fn() RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$ SELECT 1 $$;`;
 assert.deepEqual(scanMigrations(safe),[]);
});
test("rejects GRANT ALL to anonymous/public",()=>{
 assert.ok(scanMigrations("GRANT ALL ON public.leaderboards TO anon;").some(x=>x.includes("GRANT ALL")));
});
test("rejects tracked credentials but permits templates",()=>{
 assert.deepEqual(scanTrackedPrivateFiles([
  "lab-app/.env.example","lab-app/.gitignore","docs/.env.example"
 ]),[]);
 assert.ok(scanTrackedPrivateFiles(["lab-app/.env.local","lab-app/secret.pem"]).length===2);
});
