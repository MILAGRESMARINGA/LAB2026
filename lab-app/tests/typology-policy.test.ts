import {describe,it,expect} from "vitest";
import {CHAPTERS} from "../src/domain/canon";
import {TYPOLOGY_AXES,REVIEWED_TYPOLOGY_CONNECTIONS,selectTypologyConnections,PENTECOSTAL_TOPIC_INDEX} from "../src/domain/typology-policy";

describe("chaveamento exegético conservador",()=>{
 it("conecta apenas o par aprovado e mantém o capítulo sem vínculo separado",()=>{
  const result=selectTypologyConnections(["1:1","19:1","43:1"]);
  expect(result.connections.map(c=>c.id)).toEqual(["creation-word"]);
  expect(result.separateChapterIds).toEqual(["19:1"]);
 });
 it("não força Lucas 24 e Salmos 91 em um mesmo estudo",()=>{
  expect(selectTypologyConnections(["42:24","19:91"])).toEqual({connections:[],separateChapterIds:["42:24","19:91"]});
 });
 it("não conecta pela presença de apenas um capítulo nem multiplica entradas repetidas",()=>{
  expect(selectTypologyConnections(["2:12","2:12"]).connections).toEqual([]);
  expect(selectTypologyConnections(["2:12","2:12","46:5"]).connections).toHaveLength(1);
 });
 it("todas as conexões apontam para capítulos canônicos distintos",()=>{
  const canonical=new Set(CHAPTERS.map(c=>c.id));
  for(const connection of REVIEWED_TYPOLOGY_CONNECTIONS){
   expect(connection.chapters[0]).not.toBe(connection.chapters[1]);
   for(const chapter of connection.chapters)expect(canonical.has(chapter),chapter).toBe(true);
   expect(connection.references.length).toBeGreaterThanOrEqual(2);
  }
 });
 it("mantém 16 eixos classificados e 12 temas identificáveis sem depender do emoji",()=>{
  expect(TYPOLOGY_AXES.map(a=>a.id)).toEqual(Array.from({length:16},(_,i)=>i+1));
  expect(TYPOLOGY_AXES.every(a=>a.caution.length>30&&a.references.length>0)).toBe(true);
  expect(TYPOLOGY_AXES.find(a=>a.id===10)?.evidence).toBe("traditional_analogy");
  expect(PENTECOSTAL_TOPIC_INDEX).toHaveLength(12);
  expect(new Set(PENTECOSTAL_TOPIC_INDEX.map(t=>t.id)).size).toBe(12);
  expect(PENTECOSTAL_TOPIC_INDEX.every(t=>t.title&&t.references.length)).toBe(true);
 });
});
