import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(file)=>readFileSync(new URL(file,import.meta.url),"utf8");

test("signup and password recovery templates honor Supabase allowlisted RedirectTo",()=>{
 for(const [name,file,type] of [
  ["signup","../../supabase/email-templates/confirm-signup.html","email"],
  ["recovery","../../supabase/email-templates/reset-password.html","recovery"]
 ]){
  const html=read(file);
  assert.ok(html.includes('href="{{ .RedirectTo }}#token_hash={{ .TokenHash }}&amp;type='+type+'"'),
   name+" must honor the requested callback route");
  assert.ok(html.includes("{{ .Token }}"),name+" should include OTP for the PWA");
  assert.doesNotMatch(html,/https:\/\/labgame-biblia\.vercel\.app\/auth\//,
   name+" must not hardcode old production redirects");
 }
});
test("application still uses explicit route-specific Supabase redirectTo, not untrusted email input",()=>{
 const auth=read("../../src/features/auth.ts");
 assert.match(auth,/emailRedirectTo:confirmationRedirectUrl\(\)/);
 assert.match(auth,/redirectTo:recoveryRedirectUrl\(\)/);
 assert.match(auth,/emailRedirectTo:confirmationRedirectUrl\(\)/);
});
