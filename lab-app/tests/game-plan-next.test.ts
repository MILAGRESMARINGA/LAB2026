import {describe,it,expect} from "vitest";
import {CHAPTERS} from "../src/domain/canon";
import {createNextGamePlan,validateNextGamePlan,type NextPlanLength} from "../src/domain/game-plan-next";
import {createGamePlan,GAME_PLAN_VERSION} from "../src/domain/game-plan";

describe.each([365,366] as NextPlanLength[])("LABGAME V2 — %i etapas",days=>{
 const plan=createNextGamePlan(days);
 const stageCounts=plan.stages.map(day=>day.chapters.length);
 it("distribui 1189 capítulos em somente dias de 3 ou 4",()=>{
  expect(validateNextGamePlan(plan)).toBe(true);
  expect(stageCounts.every(n=>n===3||n===4)).toBe(true);
  expect(stageCounts.filter(n=>n===3)).toHaveLength(days===365?271:275);
  expect(stageCounts.filter(n=>n===4)).toHaveLength(days===365?94:91);
  const ids=plan.stages.flatMap(day=>day.chapters.map(c=>c.id));
  expect(ids).toHaveLength(1189);
  expect(new Set(ids).size).toBe(CHAPTERS.length);
 });
 it("preserva os três fluxos literários e o início do plano",()=>{
  expect(plan.stages[0].chapters.map(c=>c.book+" "+c.chapter))
   .toEqual(["Gênesis 1","Salmos 1","João 1"]);
  for(const book of new Set(CHAPTERS.map(c=>c.book))){
   const sequence=plan.stages.flatMap(day=>day.chapters).filter(c=>c.book===book).map(c=>c.chapter);
   expect(sequence).toEqual(Array.from({length:sequence.length},(_,n)=>n+1));
  }
 });
 it("não aceita mutação de dia, duplicação ou capítulo fora da etapa",()=>{
  const malformed={...plan,stages:[...plan.stages]};
  const missing={...plan.stages[2],chapters:plan.stages[2].chapters.slice(1)};
  malformed.stages[2]=missing;
  expect(validateNextGamePlan(malformed)).toBe(false);
 });
});
it("a versão 1 em produção não é alterada pela proposta",()=>{
 expect(GAME_PLAN_VERSION).toBe(1);
 const original=createGamePlan();
 expect(original).toHaveLength(365);
 expect(original.some(day=>day.chapters.length===2)).toBe(true);
});
