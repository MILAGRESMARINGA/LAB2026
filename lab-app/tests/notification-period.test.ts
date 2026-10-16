import {describe,expect,it} from "vitest";
import {saoPauloWeekStart} from "../src/domain/notification-period";
describe("limite de frequência de aviso coletivo",()=>{
 it("usa a segunda-feira da semana civil de São Paulo",()=>{
  expect(saoPauloWeekStart(Date.parse("2026-10-16T12:00:00Z"))).toBe("2026-10-12");
  expect(saoPauloWeekStart(Date.parse("2026-10-18T12:00:00Z"))).toBe("2026-10-12");
  expect(saoPauloWeekStart(Date.parse("2026-10-19T12:00:00Z"))).toBe("2026-10-19");
 });
});
