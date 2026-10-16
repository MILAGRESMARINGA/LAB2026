import {describe,it,expect} from "vitest";
import {readFileSync,readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
import {createNextGamePlan,type NextPlanLength} from "../src/domain/game-plan-next";

const migrations=fileURLToPath(new URL("../supabase/migrations/",import.meta.url));
const schema=readFileSync(join(migrations,"202610160100_lab_v2_shadow_game.sql"),"utf8");
const seed=readFileSync(join(migrations,"202610160101_lab_v2_plans_seed.sql"),"utf8");
const seedRows=[...seed.matchAll(/\((365|366),(\d+),(\d+),'(\d+:\d+)'\)/g)]
 .map(m=>({days:Number(m[1]),stage:Number(m[2]),slot:Number(m[3]),chapter:m[4]}));

describe("Contrato da migração V2 — planilha canônica e implantação segura",()=>{
 it("não reutiliza o identificador de outra migração",()=>{
  const names=readdirSync(migrations).filter(name=>name.endsWith(".sql"));
  const versions=names.map(name=>name.split("_",1)[0]);
  expect(new Set(versions).size).toBe(versions.length);
 });
 it("tem exatamente 1189 referências por calendário, idênticas ao gerador",()=>{
  expect(seedRows).toHaveLength(2378);
  for(const days of [365,366] as NextPlanLength[]){
   const values=seedRows.filter(x=>x.days===days);
   const expected=createNextGamePlan(days).stages.flatMap((stage,i)=>
    stage.chapters.map((chapter,slot)=>({
     days,stage:i+1,slot:slot+1,chapter:chapter.id
    }))
   );
   expect(values).toEqual(expected);
   expect(values.filter(x=>x.stage===1)).toHaveLength(3);
   expect(values.filter(x=>x.stage===days)).toHaveLength(4);
  }
 });
 it("deixa V2 desligado mesmo que um DBA aplique as tabelas no staging",()=>{
  expect(schema).toContain("enabled boolean NOT NULL DEFAULT false");
  expect(schema).toContain("VALUES(true,false)");
  expect(schema).toContain("Jornada V2 não liberada neste ambiente");
  expect(schema).toContain("Conclua ou migre a Jornada anterior");
 });
 it("exige RLS em todas as tabelas e não libera escrita direta ao navegador",()=>{
  const tableNames=[...schema.matchAll(/CREATE TABLE public\.(lab_v2_[a-z_]+) \(/g)]
   .map(m=>m[1]);
  expect(tableNames.length).toBeGreaterThanOrEqual(7);
  for(const name of tableNames){
   expect(schema).toContain("ALTER TABLE public."+name+" ENABLE ROW LEVEL SECURITY");
   expect(schema).toContain("REVOKE ALL ON public."+name);
  }
  expect(schema).not.toMatch(/GRANT\s+(INSERT|UPDATE|DELETE|ALL)\s+ON\s+public\.lab_v2_/i);
  expect(schema).toContain("SELECT auth.uid()");
  expect(schema).toContain("pg_advisory_xact_lock");
 });
 it("RPCs operam no servidor, sem substituir V1 nem publicar bônus legados",()=>{
  expect(schema).toContain("SECURITY DEFINER SET search_path=''");
  for(const op of ["lab_v2_resolve","lab_v2_sync","lab_v2_start","lab_v2_activate","lab_v2_confirm"]){
   expect(schema).toContain("CREATE OR REPLACE FUNCTION public."+op+"(");
   expect(schema).toMatch(new RegExp("REVOKE ALL ON FUNCTION public\\."+op+"\\("));
  }
  expect(schema).not.toMatch(/CREATE OR REPLACE FUNCTION public\.lab_game_/);
  expect(schema).not.toMatch(/UPDATE public\.lab_game_(?:stats|runs|chapter_checks)/);
  expect(schema).toContain("v_month:=date_trunc('month',v_grace AT TIME ZONE 'America/Sao_Paulo')");
  expect(schema).toContain("v_required:=CEIL(EXTRACT(EPOCH FROM(p_at-v_grace))/86400.0)::integer");
  expect(schema).toContain("v_at<v_last.activated_at+interval '24 hours'");
  expect(schema).toContain("late_penalty=v_penalty");
 });
});
