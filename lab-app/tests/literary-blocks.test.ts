import {describe,it,expect} from "vitest";
import {CANON} from "../src/domain/canon";
import {createGamePlan} from "../src/domain/game-plan";
import {LITERARY_BLOCKS,literaryBlockFor,literaryOverview} from "../src/domain/literary-blocks";

describe("Mapa dos blocos literários",()=>{
 it("atribui os 66 livros exatamente uma vez aos nove blocos",()=>{
  expect(LITERARY_BLOCKS).toHaveLength(9);
  for(const [name] of CANON) expect(LITERARY_BLOCKS.filter(block=>{
   const index=CANON.findIndex(([book])=>book===name);
   return index>=block.start&&index<block.end;
  })).toHaveLength(1);
  expect(literaryBlockFor("Lamentações")?.id).toBe("major-prophets");
  expect(literaryBlockFor("Hebreus")?.id).toBe("letters");
  expect(literaryBlockFor("desconhecido")).toBeUndefined();
 });
 it("conta capítulos únicos no plano híbrido sem tratar blocos como etapas contíguas",()=>{
  const plan=createGamePlan();
  const overview=literaryOverview(plan,1,["1:1","1:2","999:1"]);
  expect(overview.reduce((sum,block)=>sum+block.total,0)).toBe(1189);
  expect(overview.reduce((sum,block)=>sum+block.completed,0)).toBe(4);
  expect(overview.find(block=>block.id==="pentateuch")?.completed).toBe(2);
  expect(overview.find(block=>block.id==="poetry")?.completed).toBe(1);
  expect(overview.find(block=>block.id==="gospels")?.completed).toBe(1);
  expect(literaryOverview(plan,365,[]).every(block=>block.completed===block.total)).toBe(true);
 });
});
