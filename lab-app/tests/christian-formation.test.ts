import {describe,expect,it} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {CANON} from "../src/domain/canon";
import {CHRISTIAN_FORMATION} from "../src/domain/christian-formation";
import {FormationLibrary} from "../src/components/FormationLibrary";

describe("Trilhas de formação e discipulado",()=>{
 it("traz disciplinas para iniciantes, teologia sistemática e caráter cristão",()=>{
  expect(CHRISTIAN_FORMATION.map(x=>x.id)).toEqual(["discipulado","teologia","vida"]);
  expect(CHRISTIAN_FORMATION.find(x=>x.id==="discipulado")?.lessons.length).toBeGreaterThanOrEqual(6);
  expect(CHRISTIAN_FORMATION.find(x=>x.id==="teologia")?.lessons.length).toBeGreaterThanOrEqual(8);
  expect(CHRISTIAN_FORMATION.find(x=>x.id==="vida")?.lessons.length).toBeGreaterThanOrEqual(5);
 });
 it("usa somente livros canônicos e referências sem extrapolar capítulos existentes",()=>{
  for(const track of CHRISTIAN_FORMATION){
   for(const lesson of track.lessons){
    expect(lesson.references.length).toBeGreaterThan(0);
    for(const ref of lesson.references){
     const m=ref.match(/^(.*) (\d+)$/);
     expect(m,ref).not.toBeNull();
     const [book,chapters]=CANON.find(([name])=>name===m![1])??[];
     expect(book,ref).toBeDefined();
     expect(Number(m![2])).toBeGreaterThanOrEqual(1);
     expect(Number(m![2])).toBeLessThanOrEqual(Number(chapters));
    }
   }
  }
 });
 it("não confunde estudos de doutrina ou dons com pontuação da jornada",()=>{
  const html=renderToStaticMarkup(createElement(FormationLibrary));
  expect(html).toContain("Primeiros passos na fé");
  expect(html).toContain("Teologia Sistemática");
  expect(html).toContain("Vida e Caráter Cristão");
  expect(html).toContain("não alteram a pontuação");
  expect(html).toContain("Salvação pela graça");
 });
});
