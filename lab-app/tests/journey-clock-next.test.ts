import {describe,expect,it} from "vitest";
import {
 CLOCK_RULES,deadlines,incidentMonth,quotePassage,
 singleTransitionPenalty,nextEligibleAt,monthlyLifeBalance,
 stageXp,activeRunXp,recordToBeat
} from "../src/domain/journey-clock-next";

const activated="2026-10-29T11:00:00.000Z"; // 29/10, 08:00 in São Paulo
const date=(hours:number,milliseconds=0)=>
 new Date(Date.parse(activated)+hours*3600000+milliseconds).toISOString();

describe("jornada V2 — relógio 24h corridas, nunca dia civil",()=>{
 it("abre, vence e entra em carência nos limites exatos",()=>{
  expect(deadlines(activated)).toEqual({
   normalAt:date(24),graceAt:date(30)
  });
  expect(quotePassage(activated,date(24)).phase).toBe("normal");
  expect(quotePassage(activated,date(24,1)).phase).toBe("grace");
  expect(quotePassage(activated,date(30)).phase).toBe("grace");
  expect(quotePassage(activated,date(30,1)).phase).toBe("rescue");
 });
 it("não libera próxima etapa sem todos os capítulos",()=>{
  expect(nextEligibleAt(activated,null)).toBeNull();
  expect(nextEligibleAt(activated,date(2))).toBe(date(24));
  expect(nextEligibleAt(activated,date(27))).toBe(date(27));
  expect(()=>nextEligibleAt(activated,date(-1))).toThrow();
 });
 it("impede antecipação e usa carência ÚNICA para concluir e iniciar",()=>{
  expect(()=>singleTransitionPenalty(activated,date(2),date(23))).toThrow();
  expect(singleTransitionPenalty(activated,date(2),date(24))).toMatchObject({
   penaltyXp:0,needsRescue:false
  });
  expect(singleTransitionPenalty(activated,date(27),date(27))).toMatchObject({
   penaltyXp:3,needsRescue:false
  });
  expect(singleTransitionPenalty(activated,date(28),date(29))).toMatchObject({
   penaltyXp:6,needsRescue:false
  });
  expect(singleTransitionPenalty(activated,date(28),date(30))).toMatchObject({
   penaltyXp:6,needsRescue:false
  });
  expect(singleTransitionPenalty(activated,date(28),date(30,1))).toMatchObject({
   penaltyXp:6,needsRescue:true
  });
  expect(()=>singleTransitionPenalty(activated,date(28),date(27))).toThrow();
 });
 it("corta os descontos estritamente após 24h e 27h",()=>{
  expect(singleTransitionPenalty(activated,date(1),date(24)).penaltyXp).toBe(0);
  expect(singleTransitionPenalty(activated,date(1),date(24,1)).penaltyXp).toBe(3);
  expect(singleTransitionPenalty(activated,date(1),date(27)).penaltyXp).toBe(3);
  expect(singleTransitionPenalty(activated,date(1),date(27,1)).penaltyXp).toBe(6);
 });
 it("não permite strings locais sem timezone",()=>{
  expect(()=>deadlines("2026-10-29T08:00:00")).toThrow(/fuso/);
  expect(()=>quotePassage(activated,date(-1))).toThrow();
 });
});

describe("jornada V2 — vidas vinculadas ao incidente, não ao mês do login",()=>{
 it("três vidas e nenhuma acumulação entre meses",()=>{
  expect(CLOCK_RULES.monthlyLives).toBe(3);
  expect(monthlyLifeBalance(0)).toBe(3);
  expect(monthlyLifeBalance(2)).toBe(1);
  expect(monthlyLifeBalance(3)).toBe(0);
  expect(monthlyLifeBalance(6)).toBe(0);
  expect(()=>monthlyLifeBalance(-1)).toThrow();
 });
 it("consome exatamente uma vida a cada janela de 24h",()=>{
  expect(quotePassage(activated,date(30,1)).requiredLives).toBe(1);
  expect(quotePassage(activated,date(54)).requiredLives).toBe(1);
  expect(quotePassage(activated,date(54,1)).requiredLives).toBe(2);
  expect(quotePassage(activated,date(78)).requiredLives).toBe(2);
  expect(quotePassage(activated,date(78,1)).requiredLives).toBe(3);
  expect(quotePassage(activated,date(102)).phase).toBe("rescue");
  const afterThird=quotePassage(activated,date(102,1));
  expect(afterThird.phase).toBe("failed");
  expect(afterThird.requiredLives).toBe(4);
  expect(afterThird.rescueLimitAt).toBe(date(102));
 });
 it("uma tentativa sem vidas falha imediatamente após a carência",()=>{
  expect(quotePassage(activated,date(30,1),0).phase).toBe("failed");
  expect(quotePassage(activated,date(30),0).phase).toBe("grace");
  expect(quotePassage(activated,date(54,1),1).phase).toBe("failed");
 });
 it("falha iniciada em outubro mantém outubro apesar da virada do mês",()=>{
  const before=quotePassage(activated,date(30,1),2);
  const november=quotePassage(activated,date(78,1),2);
  expect(before.incidentPeriod).toBe("2026-10");
  expect(november.incidentPeriod).toBe("2026-10");
  expect(november.phase).toBe("failed");
  expect(november.rescueLimitAt).toBe(date(78));
  // Supplying newly restored lives for an old incident would be a bug in the SQL caller.
  expect(before.availableAtIncident).toBe(2);
 });
 it("uma etapa que ainda está no prazo em 1º de novembro não perde vida",()=>{
  const lateOctober="2026-11-01T01:00:00.000Z"; // Oct 31 22:00 BR
  const grace=new Date(Date.parse(lateOctober)+30*3600000).toISOString();
  expect(quotePassage(lateOctober,"2026-11-01T03:00:00.000Z").phase).toBe("normal");
  expect(incidentMonth(grace)).toBe("2026-11");
  expect(quotePassage(lateOctober,new Date(Date.parse(grace)+1).toISOString()).incidentPeriod)
   .toBe("2026-11");
 });
});

describe("jornada V2 — prêmio por tentativa e barreiras históricas",()=>{
 it("faz XP por capítulo apenas uma vez dentro da mesma etapa",()=>{
  expect(stageXp({chapterIds:["1:1","19:1","43:1"],penaltyXp:0})).toBe(30);
  expect(stageXp({chapterIds:["1:1","19:1","43:1"],penaltyXp:3})).toBe(27);
  expect(stageXp({chapterIds:["1:1","19:1","43:1"],penaltyXp:6})).toBe(24);
  expect(()=>stageXp({chapterIds:["1:1","1:1"],penaltyXp:0})).toThrow();
 });
 it("não herda XP de runs anteriores",()=>{
  const archived={xp:10000,days:265};
  const fresh=activeRunXp([],0,0);
  expect(fresh).toBe(0);
  expect(activeRunXp([30,40],5,0)).toBe(75);
  expect(archived.xp+fresh).not.toBe(fresh);
  expect(recordToBeat(archived.days,1)).toBe(265);
  expect(recordToBeat(archived.days,266)).toBe(266);
 });
 it("rejeita placar negativo, sem misturar recompensa histórica",()=>{
  expect(()=>activeRunXp([10,-4])).toThrow();
  expect(()=>recordToBeat(265,-1)).toThrow();
 });
});
