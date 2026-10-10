import {describe,it,expect} from "vitest";
import {createParallelPlan,verifyParallelPlan} from "../src/domain/parallel-plan";
describe("LAB parallel annual plan",()=>{
 it.each([2025,2026,2028,2100,2400])("covers all chapters in %i",year=>{
 const plan=createParallelPlan(year);
 expect(plan).toHaveLength([2028,2400].includes(year)?366:365);
 expect(verifyParallelPlan(plan)).toBe(true);
 expect(plan[0].old[0].book).toBe("Gênesis");
 expect(plan[0].newTestament[0].book).toBe("João");
 expect(plan[0].psalms[0].book).toBe("Salmos");
 expect(plan[0].old[0].chapter).toBe(1);
 expect(plan[0].newTestament[0].chapter).toBe(1);
 });
});
