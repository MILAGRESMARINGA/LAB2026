import {describe,expect,it} from "vitest";
import {
 GROUP_XP_MILESTONE,groupMilestones,combinedMilestone,individualMilestone,
 nextIndividualMilestone,approvedAnnualCycleAward,projectedCycleBonuses,proposedAnnualCycleAward
} from "../src/domain/progression-v3";

describe("LABGAME 3.0 — independent achievements",()=>{
 it("awards individual display tiers only from confirmed personal XP",()=>{
  expect(individualMilestone(-1)).toBeNull();
  expect(individualMilestone(999)).toBeNull();
  expect(individualMilestone(1000)?.title).toBe("Alcance Supremo I");
  expect(individualMilestone(2499)?.title).toBe("Alcance Supremo I");
  expect(individualMilestone(2500)?.title).toBe("Alcance Supremo II");
  expect(individualMilestone(5000)?.title).toBe("Alcance Supremo III");
  expect(individualMilestone(10000)?.title).toBe("Alcance Supremo IV");
  expect(nextIndividualMilestone(1000)?.minimum).toBe(2500);
  expect(nextIndividualMilestone(10000)).toBeNull();
 });
 it("requires three consenting GC members and all expected reading days for perfect week",()=>{
  expect(groupMilestones({consentingMembers:3,completedMemberDays7:21,compliancePct:100}).perfectWeek).toBe(true);
  expect(groupMilestones({consentingMembers:2,completedMemberDays7:14,compliancePct:100}).perfectWeek).toBe(false);
  expect(groupMilestones({consentingMembers:3,completedMemberDays7:20,compliancePct:95.2}).perfectWeek).toBe(false);
  expect(groupMilestones({consentingMembers:5,completedMemberDays7:35,compliancePct:100}).perfectWeek).toBe(true);
  expect(groupMilestones({consentingMembers:5,completedMemberDays7:14,compliancePct:100}).perfectWeek).toBe(false);
 });
 it("does not invent GC XP when the backend has no group-XP field",()=>{
  expect(GROUP_XP_MILESTONE).toBe(1000);
  expect(groupMilestones({consentingMembers:3,completedMemberDays7:21,compliancePct:100}).thousandXp).toBe(false);
  expect(groupMilestones({consentingMembers:3,completedMemberDays7:0,compliancePct:0,groupXp:1000}).thousandXp).toBe(true);
  expect(groupMilestones({consentingMembers:2,completedMemberDays7:0,compliancePct:0,groupXp:1000}).thousandXp).toBe(false);
 });
 it("unlocks a dual-achievement badge only when independent personal and group goals both qualify",()=>{
  const fullWeek={consentingMembers:3,completedMemberDays7:21,compliancePct:100};
  expect(combinedMilestone(999,fullWeek)).toBeNull();
  expect(combinedMilestone(1000,{...fullWeek,completedMemberDays7:20,compliancePct:95.2})).toBeNull();
  expect(combinedMilestone(1000,{consentingMembers:2,completedMemberDays7:14,compliancePct:100})).toBeNull();
  expect(combinedMilestone(1000,fullWeek)).toEqual({
   code:"alcance-supremo-comunhao",title:"Alcance Supremo em Comunhão",achievedBy:"perfect-week"
  });
  expect(combinedMilestone(1100,{consentingMembers:3,completedMemberDays7:0,compliancePct:0,groupXp:1000})?.achievedBy).toBe("group-xp");
  expect(combinedMilestone(1200,{...fullWeek,groupXp:1000})?.achievedBy).toBe("both");
  expect(combinedMilestone(Number.NaN,fullWeek)).toBeNull();
 });
 it("proposes increasing annual bonuses without crediting them to user accounts",()=>{
  expect(proposedAnnualCycleAward(1)).toEqual({cycle:1,bonusXp:10000,medal:"Coroa da Jornada · Ciclo 1"});
  expect(proposedAnnualCycleAward(2).bonusXp).toBe(12500);
  expect(proposedAnnualCycleAward(3).bonusXp).toBe(15000);
  expect(approvedAnnualCycleAward(4).bonusXp).toBe(17500);
  expect(projectedCycleBonuses(0)).toBe(0);
  expect(projectedCycleBonuses(1)).toBe(10000);
  expect(projectedCycleBonuses(2)).toBe(22500);
  expect(projectedCycleBonuses(3)).toBe(37500);
  expect(projectedCycleBonuses(4)).toBe(55000);
  expect(()=>projectedCycleBonuses(-1)).toThrow("ciclos");
  expect(()=>proposedAnnualCycleAward(0)).toThrow("Ciclo");
  expect(()=>proposedAnnualCycleAward(Infinity)).toThrow("Ciclo");
 });
});
