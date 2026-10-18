import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {countModelAttempt, classifyProviderResponse, upperBoundUsd, MODEL_MARKER, NO_MODEL_MARKER} from '../../../.agents/scripts/attempt-accounting.mjs';
import {materializeEdits} from '../../../.agents/scripts/exact-edits.mjs';
import {routeSpecialist} from '../../../.agents/scripts/task-briefing.mjs';
const job = (name,conclusion='success') => [{name:'generate',conclusion:'failure',steps:[{name,conclusion}]}];
test('quota rejection does not consume model response; malformed/failed patches do', () => {
 assert.equal(classifyProviderResponse(429,{error:{code:'insufficient_quota'}}).consumesAttempt,false);
 assert.equal(classifyProviderResponse(500,{}).consumesAttempt,true);
 assert.equal(classifyProviderResponse(200,{}).consumesAttempt,true);
 assert.equal(countModelAttempt(10,1,job(NO_MODEL_MARKER)),0);
 assert.equal(countModelAttempt(10,2,job(MODEL_MARKER)),1);
 assert.equal(countModelAttempt(10,3,job(MODEL_MARKER,'skipped')),1);
 assert.equal(countModelAttempt(39094300608,1,job('old parser')),0);
 assert.equal(countModelAttempt(39094300608,2,job('old 429')),0);
 assert.equal(countModelAttempt(39094300608,3,job('unknown')),1);
 assert.throws(()=>countModelAttempt(10,1,[]), /unavailable/);
});
test('provider error reporting never prints arbitrary error messages or codes', () => {
 assert.deepEqual(classifyProviderResponse(429,{error:{code:'SECRET',message:'SECRET'}}),{consumesAttempt:false,code:'unclassified_provider_error'});
});
test('request reserve includes all bytes and output, rejects unpriced models', () => {
 const body={input:'x'.repeat(98304),max_output_tokens:6000};
 assert.ok(upperBoundUsd(body,'gpt-6-luna')*3<0.25);
 assert.throws(()=>upperBoundUsd(body,'unknown'));
});
test('existing large sources keep all unmatched content; ambiguous edits fail closed', () => {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'lab-exact-edit-'));
 try {
  fs.mkdirSync(path.join(root,'lab-app/src'),{recursive:true});
  fs.writeFileSync(path.join(root,'lab-app/src/style.css'),'before\n.menu{color:red}\nafter\n');
  const edit={path:'lab-app/src/style.css',find:'.menu{color:red}',content:'.menu{color:white}'};
  assert.equal(materializeEdits(root,[edit],'ux-designer')[0].content,'before\n.menu{color:white}\nafter\n');
  for(const find of ['', 'missing','e']) assert.throws(()=>materializeEdits(root,[{...edit,find}],'ux-designer'));
  assert.throws(()=>materializeEdits(root,[edit],'database-engineer'));
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('Issue21 objective routes to UX even when constraints mention the database', () => {
 const manifest={agents:[{id:'ux-designer'},{id:'database-engineer'}]};
 assert.equal(routeSpecialist('Ajustar contraste e espaçamento do menu. Não alterar banco, workflows ou produção.',manifest).id,'ux-designer');
});
