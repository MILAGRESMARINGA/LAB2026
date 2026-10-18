import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { validateGeneratedStudy } from '../../supabase/functions/study-generate/core.mjs';
const rows = JSON.parse(readFileSync(new URL('../sql/seeds/p1-study-days-4-7.json', import.meta.url), 'utf8'));
const planSql = readFileSync(new URL('../../supabase/migrations/202610160101_lab_v2_plans_seed.sql', import.meta.url), 'utf8');
const plans = [365, 366].map(length => {
 const days = new Map();
 for (const m of planSql.matchAll(/\((365|366),(\d+),(\d+),'([^']+)'\)/g)) {
  if (Number(m[1]) !== length) continue;
  const day = Number(m[2]);
  if (!days.has(day)) days.set(day, []);
  days.get(day).push(m[4]);
 }
 return { length, days };
});
// Citation endpoints checked against known chapter lengths; this fixture checks
// references/shape, not the truth of doctrine or the wording of Bible sources.
const verseCounts = {'1:6':22,'1:7':24,'43:3':36,'1:8':22,'1:9':29,'19:3':8,'43:4':54,'1:10':32,'1:11':32,'1:12':20,'1:13':18,'1:14':24,'43:5':47};
test('days 4–7 cover the actual 365/366 plan with ordered, nonoverlapping units', () => {
 assert.equal(rows.length, 9);
 assert.equal(new Set(rows.map(x => x.study_key)).size, 9);
 for (const row of rows) {
  assert.ok(plans.some(p => JSON.stringify(p.days.get(row.journey_day).filter(r => row.chapter_refs.includes(r))) === JSON.stringify(row.chapter_refs)));
  const chapters = row.chapter_refs.map(chapter_id => ({chapter_id, verses:Array.from({length:verseCounts[chapter_id]}, (_, i) => ({verse_number:i+1}))}));
  assert.deepEqual(validateGeneratedStudy(row.content, chapters), {ok:true, value:row.content});
  assert.equal(row.content.theological_connection === null, row.chapter_refs.length === 1);
  assert.deepEqual([...new Set(row.content.references.map(r => r.chapter_id))].sort(), [...row.chapter_refs].sort());
 }
 for (const plan of plans) for (let day = 4; day <= 7; day++) {
  const expected = plan.days.get(day);
  const covered = rows.filter(r => r.journey_day === day && r.chapter_refs.every(ref => expected.includes(ref))).flatMap(r => r.chapter_refs);
  assert.deepEqual(covered.sort(), [...expected].sort(), `coverage for ${plan.length}/day ${day}`);
 }
});
test('generated SQL matches JSON and preserves draft publication and privileges', () => {
 execFileSync(process.execPath, [new URL('../build-p1-study-seed.mjs', import.meta.url).pathname, '--check']);
 const sql = readFileSync(new URL('../sql/seeds/p1-study-days-4-7.sql', import.meta.url), 'utf8');
 assert.match(sql, /'curated', 'draft'/);
 assert.doesNotMatch(sql, /\b(?:CREATE POLICY|ALTER TABLE|GRANT|REVOKE|DELETE FROM|TRUNCATE|SECURITY DEFINER)\b/i);
 assert.match(sql, /ON CONFLICT \(study_key\) DO NOTHING/);
});
