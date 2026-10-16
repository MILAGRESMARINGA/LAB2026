import {describe,expect,it} from "vitest";
import {dailyNoticeStorageKey,selectJourneyNotice} from "../src/domain/journey-notice";

const base={
 visibleOnJourney:true,readingComplete:false,now:Date.parse("2026-10-16T10:00:00Z"),
 normalDeadlineAt:"2026-10-16T11:30:00Z",graceDeadlineAt:"2026-10-16T17:30:00Z",
 readingPopup:true,stagePopup:true
};
describe("Avisos gratuitos da jornada",()=>{
 it("avisa quando faltam até duas horas para o prazo normal",()=>{
  expect(selectJourneyNotice(base)).toBe("closing");
  expect(selectJourneyNotice({...base,now:Date.parse("2026-10-16T09:29:59Z")})).toBe("reading");
 });
 it("comunica a janela de carência e a recuperação após ela",()=>{
  expect(selectJourneyNotice({...base,now:Date.parse("2026-10-16T12:00:00Z")})).toBe("grace");
  expect(selectJourneyNotice({...base,now:Date.parse("2026-10-16T17:30:01Z")})).toBe("late");
 });
 it("respeita consentimento de canal, etapa concluída e tela atual",()=>{
  expect(selectJourneyNotice({...base,stagePopup:false,readingPopup:false})).toBeNull();
  expect(selectJourneyNotice({...base,readingComplete:true})).toBeNull();
  expect(selectJourneyNotice({...base,visibleOnJourney:false})).toBeNull();
  expect(selectJourneyNotice({...base,stagePopup:false})).toBe("reading");
 });
 it("limita a um aviso persistente por pessoa e etapa do dia",()=>{
  const first=dailyNoticeStorageKey("reader-1","run-1:7");
  expect(first).toBe(dailyNoticeStorageKey("reader-1","run-1:7"));
  expect(first).not.toBe(dailyNoticeStorageKey("reader-1","run-1:8"));
  expect(first).not.toBe(dailyNoticeStorageKey("reader-2","run-1:7"));
 });
 it("ignora prazos ausentes ou malformados e mantém só o lembrete autorizado",()=>{
  expect(selectJourneyNotice({...base,normalDeadlineAt:null})).toBe("reading");
  expect(selectJourneyNotice({...base,normalDeadlineAt:"bad"})).toBe("reading");
 });
});
