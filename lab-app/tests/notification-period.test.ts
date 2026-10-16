import {describe,expect,it} from "vitest";
import {gcAggregateNoticeStorageKey,GC_AGGREGATE_NOTICE_COPY,saoPauloWeekStart,shouldShowGcAggregateNotice} from "../src/domain/notification-period";
describe("limite de frequência e privacidade do aviso coletivo",()=>{
 it("usa a segunda-feira da semana civil de São Paulo",()=>{
  expect(saoPauloWeekStart(Date.parse("2026-10-16T12:00:00Z"))).toBe("2026-10-12");
  expect(saoPauloWeekStart(Date.parse("2026-10-18T12:00:00Z"))).toBe("2026-10-12");
  expect(saoPauloWeekStart(Date.parse("2026-10-19T12:00:00Z"))).toBe("2026-10-19");
 });
 it("só permite o aviso quando o grupo participa e o usuário consentiu com o canal",()=>{
  expect(shouldShowGcAggregateNotice(true,true,true)).toBe(true);
  expect(shouldShowGcAggregateNotice(false,true,true)).toBe(false);
  expect(shouldShowGcAggregateNotice(true,false,true)).toBe(false);
  expect(shouldShowGcAggregateNotice(true,true,false)).toBe(false);
 });
 it("limita o aviso a uma vez por pessoa e semana e mostra só resultado agregado",()=>{
  const key=gcAggregateNoticeStorageKey("reader-1","2026-10-12");
  expect(key).toBe(gcAggregateNoticeStorageKey("reader-1","2026-10-12"));
  expect(key).not.toBe(gcAggregateNoticeStorageKey("reader-1","2026-10-19"));
  expect(GC_AGGREGATE_NOTICE_COPY.body).toMatch(/indicadores coletivos/);
  expect(GC_AGGREGATE_NOTICE_COPY.body).toMatch(/não exibe XP individual/);
  expect(GC_AGGREGATE_NOTICE_COPY.body).not.toMatch(/\b\d+\s*XP\b/);
 });
});
