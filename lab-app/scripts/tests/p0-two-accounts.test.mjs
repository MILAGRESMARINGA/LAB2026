import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {checkModeSafety,expectedConfig} from "../p0-two-accounts-smoke.mjs";

const prod="https://azejfxvaamgkmfmwdzjn.supabase.co";
const fakeStage="https://other-ref-123.supabase.co";

test("two-account test requires no secret/service-role key",()=>{
 assert.equal(expectedConfig.length,6);
 assert.ok(expectedConfig.every(name=>name.startsWith("P0_")));
 assert.ok(!expectedConfig.some(name=>/SERVICE_ROLE|SECRET_KEY|ADMIN/i.test(name)));
});
test("read-only mode permits the real LABGAME project for authentication and RLS reads",()=>{
 assert.equal(checkModeSafety({url:prod,mode:"readonly"}).hostname,"azejfxvaamgkmfmwdzjn.supabase.co");
});
test("staging mutation is always blocked for production regardless of confirmation",()=>{
 assert.throws(()=>checkModeSafety({
  url:prod,mode:"staging",writeConfirmation:"CONFIRMO_STAGING_ISOLADO"
 }),/nunca o LABGAME de produção/);
});
test("staging mutations require explicit confirmation and https database origin",()=>{
 assert.throws(()=>checkModeSafety({url:fakeStage,mode:"staging"}),/staging isolado/);
 assert.equal(checkModeSafety({url:fakeStage,mode:"staging",
  writeConfirmation:"CONFIRMO_STAGING_ISOLADO"}).hostname,"other-ref-123.supabase.co");
 assert.throws(()=>checkModeSafety({url:"http://other-ref-123.supabase.co",mode:"readonly"}),/HTTPS/);
 assert.throws(()=>checkModeSafety({url:"https://localhost:3000",mode:"readonly"}),/supabase.co/);
});
test("the integration script does not print identifiers, emails, passwords or access tokens",()=>{
 const s=readFileSync(new URL("../p0-two-accounts-smoke.mjs",import.meta.url),"utf8");
 assert.match(s,/auth\.signInWithPassword/);
 assert.match(s,/auth\.getUser/);
 assert.match(s,/lab_game_confirm_chapter/);
 assert.match(s,/reading_group_invites/);
 assert.match(s,/assert\(first\.total_xp===startingXpA\+10/);
 assert.match(s,/mode==="readonly"/);
 assert.doesNotMatch(s,/(?:console\.log|process\.stdout\.write)\s*\(\s*.*(?:\.email|\.password|\.access_token)/);
});
