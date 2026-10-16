/**
 * Browser P0 regression: free ephemeral Chrome + local Supabase.
 * No production data, no external authentication, no destructive action.
 */
import assert from "node:assert/strict";
import {readFileSync,mkdirSync} from "node:fs";
import {chromium} from "playwright";
import {createClient} from "@supabase/supabase-js";
const env=Object.fromEntries(readFileSync("/tmp/labgame-supabase-ci.env","utf8")
 .split(/\r?\n/).filter(x=>/^[A-Z_]+=/.test(x.trim())).map(s=>{
  const i=s.indexOf("=");return [s.slice(0,i),s.slice(i+1).replace(/^["']|["']$/g,"")];
 }));
assert.match(env.API_URL,/^http:\/\/(?:127\.0\.0\.1|localhost):54321$/);
const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY||env.SECRET_KEY,
 {auth:{autoRefreshToken:false,persistSession:false}});
const email=`lab-browser-${Date.now()}-${process.pid}@example.test`;
const password="Browser-P0-LABGAME-strong-2026!";
let userId,browser;
try{
 const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});
 assert.ifError(error);userId=data.user?.id;assert.ok(userId);
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1380,height:900}});
 page.setDefaultTimeout(20000);
 await page.goto("http://127.0.0.1:5173/",{waitUntil:"domcontentloaded"});
 await page.getByRole("navigation",{name:"Menu LABGAME"})
  .getByRole("button",{name:"Perfil"}).click();
 await page.getByLabel("E-mail",{exact:true}).fill(email);
 await page.getByLabel("Senha",{exact:true}).fill(password);
 await page.getByRole("button",{name:"ENTRAR NO LABGAME"}).click();
 await page.getByText(email,{exact:true}).waitFor();
 const logout=page.getByRole("button",{name:/SAIR DA CONTA/});
 await logout.waitFor({state:"visible"});
 const bounds=await logout.boundingBox();
 assert.ok(bounds&&bounds.width>200&&bounds.height>=40,
  "Logout must be a prominent, touch-friendly button");
 await page.getByText("Seu perfil, suas escolhas").waitFor();
 const preferences=page.locator("details.ps-section").filter({
  has:page.locator("summary", {hasText:"Notificações"})
 });
 await preferences.locator("summary").click();
 const enabled=preferences.getByRole("checkbox",{name:/Quero receber notificações/});
 await enabled.check();
 await preferences.getByRole("checkbox",{name:"Pop-up"}).first().check();
 await preferences.getByRole("button",{name:"SALVAR NOTIFICAÇÕES"}).click();
 await page.getByText(/Preferências de notificações salvas/).waitFor();

 // Cancelling an irreversible action must never erase progress.
 await page.getByRole("button",{name:"ZERAR JORNADA",exact:true}).click();
 await page.getByRole("alertdialog").waitFor();
 await page.getByRole("button",{name:"CANCELAR"}).click();
 assert.equal(await page.getByRole("alertdialog").count(),0);

 mkdirSync("/tmp/labgame-ux",{recursive:true});
 await page.screenshot({path:"/tmp/labgame-ux/profile-desktop.png",fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:"/tmp/labgame-ux/profile-mobile.png",fullPage:true});
 const mobileBounds=await logout.boundingBox();
 assert.ok(mobileBounds&&mobileBounds.width>=280&&mobileBounds.height>=40,
  "Logout must remain touch-friendly on a narrow mobile screen");
 await logout.click();
 await page.getByRole("button",{name:"ENTRAR NO LABGAME"}).waitFor();
 console.log("PASS: Real browser login, visible logout, consent persistence, reset cancellation and mobile layout");
}finally{
 await browser?.close().catch(()=>undefined);
 if(userId)await admin.auth.admin.deleteUser(userId).catch(()=>undefined);
}
