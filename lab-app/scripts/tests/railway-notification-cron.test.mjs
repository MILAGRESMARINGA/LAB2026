import test from "node:test";
import assert from "node:assert/strict";
import {getConfig,run,NOTIFICATION_ENDPOINT} from "../../railway/notification-cron/run.mjs";

const secret="local-test-only-strong-token-0123456789abcdef";

test("Railway worker is disabled by default: no outgoing requests",async()=>{
 let requests=0;
 const output=await run({},async()=>{requests++;throw Error("Unexpected request")});
 assert.deepEqual(output,{state:"disabled",sent:0});
 assert.equal(requests,0);
});

test("No dispatch without sufficiently strong cron secret",async()=>{
 assert.throws(()=>getConfig({LAB_RAILWAY_WORKER_ENABLED:"true"}),/not configured/);
 assert.throws(()=>getConfig({
  LAB_RAILWAY_WORKER_ENABLED:"true",LAB_NOTIFICATION_CRON_SECRET:"short"
 }),/not configured/);
});

test("Only exact LABGAME Supabase endpoint and POST are permitted",async()=>{
 let target,options;
 const output=await run({
  LAB_RAILWAY_WORKER_ENABLED:"true",LAB_NOTIFICATION_CRON_SECRET:secret
 },async(url,init)=>{
  target=url;options=init;
  return {ok:true,json:async()=>({sent:2,suppressed:5,errors:0})};
 });
 assert.equal(NOTIFICATION_ENDPOINT,
  "https://azejfxvaamgkmfmwdzjn.supabase.co/functions/v1/notify-reading-email");
 assert.equal(target,NOTIFICATION_ENDPOINT);
 assert.equal(options.method,"POST");
 assert.equal(options.headers.authorization,"Bearer "+secret);
 assert.deepEqual(output,{state:"ok",sent:2,suppressed:5,errors:0});
});

test("Failures remain failures and never include response body",async()=>{
 await assert.rejects(
  run({LAB_RAILWAY_WORKER_ENABLED:"true",LAB_NOTIFICATION_CRON_SECRET:secret},
   async()=>({ok:false,status:503,json:async()=>({secret:"must-not-log"})})),
  error=>error.message==="Notification worker returned HTTP 503"
 );
});

test("Worker sanitizes malformed provider summary counters",async()=>{
 const output=await run(
  {LAB_RAILWAY_WORKER_ENABLED:"true",LAB_NOTIFICATION_CRON_SECRET:secret},
  async()=>({ok:true,json:async()=>({sent:"123",suppressed:-4,errors:NaN})})
 );
 assert.deepEqual(output,{state:"ok",sent:0,suppressed:0,errors:0});
});
