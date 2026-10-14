/**
 * LABGAME 3.0 — pure projections of already verified server scores.
 * NO function in this file awards XP, writes database records, or assigns spiritual gifts.
 * Cycle bonuses are a PROPOSAL, pending an idempotent server-side ledger and approval.
 */

export const INDIVIDUAL_XP_MILESTONES = [
 {minimum:1000,metal:"Bronze",flame:"brasa",title:"Alcance Supremo I"},
 {minimum:2500,metal:"Prata",flame:"acesa",title:"Alcance Supremo II"},
 {minimum:5000,metal:"Ouro",flame:"constante",title:"Alcance Supremo III"},
 {minimum:10000,metal:"Diamante",flame:"radiante",title:"Alcance Supremo IV"}
] as const;

export const GROUP_XP_MILESTONE=1000;
export const GROUP_CONSENT_MINIMUM=3;
export const GROUP_WEEK_DAYS=7;

/** Always derived from the user's own confirmed XP; group results cannot change it. */
export function individualMilestone(xp:number){
 if(!Number.isFinite(xp)||xp<0)return null;
 return [...INDIVIDUAL_XP_MILESTONES].reverse().find(m=>xp>=m.minimum)??null;
}
export function nextIndividualMilestone(xp:number){
 const safe=Number.isFinite(xp)?Math.max(0,xp):0;
 return INDIVIDUAL_XP_MILESTONES.find(m=>safe<m.minimum)??null;
}

export type GroupAchievementInput={
 consentingMembers:number;
 completedMemberDays7:number;
 compliancePct:number;
 /** Optional: server-authoritative aggregate XP earned during membership; NOT user XP. */
 groupXp?:number|null;
};
export type GroupMilestones={perfectWeek:boolean;thousandXp:boolean};

/** Current weekly group badge can be computed from the verified GC summary. */
export function groupMilestones(data:GroupAchievementInput):GroupMilestones {
 const consenting=Number.isFinite(data.consentingMembers)?Math.floor(data.consentingMembers):0;
 const complete=Number.isFinite(data.completedMemberDays7)?Math.floor(data.completedMemberDays7):0;
 const percent=Number.isFinite(data.compliancePct)?data.compliancePct:0;
 const eligible=consenting>=GROUP_CONSENT_MINIMUM;
 const perfectWeek=eligible&&complete>=consenting*GROUP_WEEK_DAYS&&percent>=99.999;
 const thousandXp=eligible&&data.groupXp!=null&&Number.isFinite(data.groupXp)&&data.groupXp>=GROUP_XP_MILESTONE;
 return {perfectWeek,thousandXp};
}

export type AnnualCycleAwardProposal={cycle:number;bonusXp:number;medal:string};
/**
 * NOT YET AN AWARD: illustrates an increasing completion reward.
 * Implement only after the owner approves the proposed formula.
 * The server must grant once per completed run ID, never from local state.
 */
export function proposedAnnualCycleAward(cycle:number):AnnualCycleAwardProposal{
 if(!Number.isSafeInteger(cycle)||cycle<1||cycle>100000)throw Error("Ciclo inválido");
 return {cycle,bonusXp:10000+(cycle-1)*2500,medal:"Coroa da Jornada · Ciclo "+cycle};
}
