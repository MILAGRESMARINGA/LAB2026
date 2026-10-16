import {describe,it,expect} from "vitest";
import {auditPlan} from "../src/domain/plan-audit";
describe("integridade bíblica",()=>{
 for(const year of [2025,2026,2027,2028,2032]){
  it("audita o plano "+year,()=>{
   const a=auditPlan(year);
   expect(a.valid,a.issues.join("; ")).toBe(true);
   expect(a.books).toBe(66);
   expect(a.chapters).toBe(1189);
   expect(a.days).toBe(year%4===0?366:365);
  });
 }
});
