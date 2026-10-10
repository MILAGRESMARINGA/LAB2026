import {describe,it,expect} from "vitest";
import {CANON,OLD_TESTAMENT,NEW_TESTAMENT,CHAPTERS} from "../src/domain/canon";
import {createAnnualPlan,verifyAnnualPlan} from "../src/domain/plan";
describe("Biblical integrity",()=>{
 it("has 39 OT, 27 NT, 66 books",()=>{expect(OLD_TESTAMENT).toHaveLength(39);expect(NEW_TESTAMENT).toHaveLength(27);expect(CANON).toHaveLength(66)});
 it("has exactly 1189 chapters",()=>expect(CHAPTERS).toHaveLength(1189));
 it.each([2025,2026,2028,2100,2400])("covers canon in year %i",year=>{
  const plan=createAnnualPlan(year);
  expect(plan).toHaveLength(year===2028||year===2400?366:365);
  expect(verifyAnnualPlan(plan)).toBe(true);
  expect(plan.flatMap(x=>x.chapters.map(c=>c.id))).toEqual(CHAPTERS.map(c=>c.id));
 });
});
