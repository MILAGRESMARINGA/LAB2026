import {describe,it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
const dir=new URL('../supabase/migrations/',import.meta.url);
const names=readdirSync(dir).filter(name=>name.endsWith('_journey_editorial_atlas.sql'));
const sql=readFileSync(new URL(names[0],dir),'utf8');
describe('Curated journey database contract',()=>{
 it('isolates editorial data from user progress and annual plans',()=>{
  expect(names).toHaveLength(1);
  expect(sql).not.toMatch(/(?:ALTER|UPDATE|DELETE FROM)\s+(?:TABLE\s+)?public\.lab_(?:v2|game)_/i);
  expect(sql).not.toMatch(/SECURITY DEFINER/);
 });
 it('enables RLS on every new table and only grants browser SELECT',()=>{
  const tables=[...sql.matchAll(/CREATE TABLE public\.(lab_journey_\w+)/g)].map(m=>m[1]);
  expect(tables).toHaveLength(5);
  for(const name of tables)expect(sql).toContain(`ALTER TABLE public.${name} ENABLE ROW LEVEL SECURITY`);
  expect(sql).toContain('FROM PUBLIC,anon,authenticated');
  expect(sql).toContain('TO anon,authenticated;');
  expect(sql).not.toMatch(/GRANT (?:INSERT|UPDATE|DELETE|ALL)[^;]+TO (?:anon|authenticated)/);
  expect(sql.match(/CREATE POLICY/g)).toHaveLength(5);
 });
 it('requires reviewed publication, same-release source references and canonical chapter limits',()=>{
  expect(sql).toContain("publication_status <> 'published'");
  expect(sql).toContain('published_at >= reviewed_at');
  expect(sql).toContain('FOREIGN KEY (release_id,source_id)');
  expect(sql).toContain('COALESCE(public.lab_journey_chapter_count(book),0)');
  expect(sql).toContain('Anchor chapter must belong to its episode');
 });
});
