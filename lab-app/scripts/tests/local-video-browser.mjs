/** Actual Chromium + React/Mux playback. HLS and RPC TRANSPORT ARE SIMULATED.
 * This verifies browser integration, not server authorization or SQL anti-cheat.
 * Real database contracts are exercised separately by video-comprehension-smoke.sql.
 * Fixture: original synthetic green 160x90 H264 clip, four seconds, generated with ffmpeg.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const fixture=JSON.parse(readFileSync(new URL('./video-browser-fixture.json',import.meta.url),'utf8'));
const browser=await chromium.launch({headless:true,executablePath:process.env.LAB_BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const calls=[];
 let covered=0,lastPosition=null,lastAt=0,awarded=false;
 const questions=[{id:1,prompt:'Pergunta sintética um',options:['Correta','Outra']},{id:2,prompt:'Pergunta sintética dois',options:['Correta','Outra']}];
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.pathname.endsWith('/rpc/lab_video_watch')){
   if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'*'}});
   const body=request.postDataJSON();calls.push(body);
   const now=Date.now(),position=Number(body.p_position??0);
   if(body.p_action==='state'){covered=0;lastPosition=null;awarded=false;}
   else if(['tick','pause','ended'].includes(body.p_action)){
    if(lastPosition!==null){
     const delta=position-lastPosition,wall=(now-lastAt)/1000;
     if(delta>=0&&delta<=wall+0.3&&delta<=2.8&&lastPosition<=covered+0.3)covered=Math.min(4,Math.max(covered,position));
    }
    lastPosition=body.p_action==='pause'?null:position;lastAt=now;
   }
   const complete=covered>=3.85;
   if(body.p_action==='quiz'&&complete&&body.p_answers?.['1']===0&&body.p_answers?.['2']===0)awarded=true;
   return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({session_id:'00000000-0000-4000-8000-000000000002',ready:true,duration_seconds:4,covered_seconds:covered,next_position:covered,playback_complete:complete,already_awarded:awarded,awarded,total_xp:awarded?5:0,questions:complete?questions:[]})});
  }
  if(url.hostname==='stream.mux.com'){
   const name=url.pathname.endsWith('.m3u8')?'index.m3u8':url.pathname.split('/').pop();
   if(fixture[name])return route.fulfill({status:200,contentType:name.endsWith('.ts')?'video/mp2t':'application/vnd.apple.mpegurl',headers:{'access-control-allow-origin':'*'},body:Buffer.from(fixture[name],'base64')});
  }
  // No real video/provider traffic or telemetry leaves CI.
  if(!['127.0.0.1','localhost'].includes(url.hostname))return route.abort();
  return route.continue();
 });
 await page.goto('http://127.0.0.1:5173/scripts/tests/video-browser.html');
 await page.waitForFunction(()=>document.querySelector('mux-player')?.readyState>=1);
 assert.ok(Math.abs(await page.locator('mux-player').evaluate(p=>p.duration)-4)<0.1,'Real Mux metadata must report four seconds');
 await page.getByRole('progressbar',{name:'Progresso validado do panorama'}).waitFor();
 assert.equal(await page.getByRole('form',{name:'Compreensão do panorama'}).count(),0);
 // Programmatic seek invokes actual media events, never a synthetic dispatched event.
 await page.locator('mux-player').evaluate(p=>{p.currentTime=3.8});
 await page.waitForTimeout(350);
 assert.equal(await page.getByRole('form',{name:'Compreensão do panorama'}).count(),0,'Seek cannot expose questions');
 assert.equal(await page.getByLabel('XP recebido').textContent(),'0');
 assert.ok(calls.some(c=>c.p_action==='pause'),'Actual seeking event must reach pause RPC');
 // Fresh session tests normal playback, a real pause and preserved progress.
 await page.reload();
 await page.waitForFunction(()=>document.querySelector('mux-player')?.readyState>=2);
 await page.getByRole('progressbar',{name:'Progresso validado do panorama'}).waitFor();
 await page.locator('mux-player').evaluate(async p=>{p.muted=true;await p.play()});
 await page.waitForTimeout(1100);
 await page.locator('mux-player').evaluate(p=>p.pause());
 await page.waitForTimeout(300);
 const pausedPosition=await page.locator('mux-player').evaluate(p=>p.currentTime);
 await page.waitForTimeout(500);
 assert.ok(Math.abs(await page.locator('mux-player').evaluate(p=>p.currentTime)-pausedPosition)<0.05);
 assert.equal(await page.getByRole('form',{name:'Compreensão do panorama'}).count(),0);
 await page.locator('mux-player').evaluate(p=>p.play());
 await page.getByRole('form',{name:'Compreensão do panorama'}).waitFor({timeout:15000});
 assert.ok(covered>=3.85,'Questions follow simulated server coverage receipt');
 const quiz=page.getByRole('form',{name:'Compreensão do panorama'});
 await quiz.getByLabel('Correta',{exact:true}).nth(0).check();
 await quiz.getByLabel('Correta',{exact:true}).nth(1).check();
 await quiz.getByRole('button',{name:/CONFIRMAR COMPREENSÃO/}).click();
 await page.waitForFunction(()=>document.querySelector('output')?.textContent==='5');
 await page.getByRole('button',{name:'Fechar vídeo'}).focus();
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Reabrir panorama'}).waitFor();
 console.log('PASS: Chromium actual Mux metadata/play/pause/resume/seek, mobile quiz and Escape; synthetic HLS and mocked RPC only');
}finally{await browser.close()}
