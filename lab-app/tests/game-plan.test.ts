import {describe,it,expect} from "vitest";
import {CHAPTERS} from "../src/domain/canon";
import {createGamePlan,verifyGamePlan,chaptersByStage,GAME_DAYS} from "../src/domain/game-plan";
describe("desafio LABGAME de 365 etapas",()=>{
 const days=createGamePlan();
 it("contém todos os 1189 capítulos exatamente uma vez",()=>{expect(verifyGamePlan(days)).toBe(true);expect(days.flatMap(d=>d.chapters)).toHaveLength(1189);expect(new Set(days.flatMap(d=>d.chapters.map(c=>c.id))).size).toBe(CHAPTERS.length)});
 it("não ultrapassa quatro capítulos, nem cria dias vazios",()=>{expect(days).toHaveLength(GAME_DAYS);expect(days.every(d=>d.chapters.length>0&&d.chapters.length<=4)).toBe(true)});
 it("inicia com Gênesis 1, Salmos 1 e João 1",()=>expect(days[0].chapters.map(c=>c.book+" "+c.chapter)).toEqual(["Gênesis 1","Salmos 1","João 1"]));
 it("mantém a ordem interna de cada livro",()=>{for(const book of new Set(CHAPTERS.map(c=>c.book))){const ns=days.flatMap(d=>d.chapters).filter(c=>c.book===book).map(c=>c.chapter);expect(ns).toEqual(Array.from({length:ns.length},(_,i)=>i+1))}});
 it("mantém Lucas e Atos consecutivos",()=>{const list=days.flatMap(d=>d.newTestament).map(c=>c.book);expect(list.indexOf("Atos")).toBe(list.lastIndexOf("Lucas")+1)});
 it("rejeita acesso fora do calendário",()=>{expect(()=>chaptersByStage(0)).toThrow();expect(()=>chaptersByStage(366)).toThrow()});
});
