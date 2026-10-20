import {describe,it,expect} from "vitest";
import {CANON} from "../src/domain/canon";
import {BOOK_INTRODUCTIONS,getBookIntroduction} from "../src/domain/book-introductions";
describe("Book introductions",()=>{
 it("covers exactly the 66 canonical books in order with complete original summaries",()=>{
  expect(BOOK_INTRODUCTIONS.map(x=>x.book)).toEqual(CANON.map(([name])=>name));
  for(const item of BOOK_INTRODUCTIONS){for(const [key,value] of Object.entries(item))expect(value.length).toBeGreaterThan(key==="book"?1:10)}
 });
 it("does not pretend anonymous books have certain authorship or direct NT citations",()=>{
  expect(getBookIntroduction("Hebreus")?.author).toContain("não identificado");
  expect(getBookIntroduction("Ester")?.newTestament).toContain("não cita");
  expect(getBookIntroduction("inexistente")).toBeUndefined();
 });
});
