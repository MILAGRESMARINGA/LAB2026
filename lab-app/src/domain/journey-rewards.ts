import {GAME_DAYS} from "./game-plan";

/** Visual, read-only milestones. Never used for awarding XP or authorizing progress. */
export const WEEKLY_MILESTONE_DAYS = 7;
export const FRUIT_OF_THE_SPIRIT = [
 "Amor","Alegria","Paz","Paciência","Benignidade",
 "Bondade","Fidelidade","Mansidão","Domínio próprio"
] as const;
export const SPIRITUAL_GIFTS_EXAMPLES = [
 "Palavra de sabedoria","Palavra de conhecimento","Fé",
 "Dons de curar","Operação de milagres","Profecia",
 "Discernimento de espíritos","Variedade de línguas","Interpretação de línguas"
] as const;

const safeDays=(days:number):number=>
 Number.isFinite(days)?Math.min(GAME_DAYS,Math.max(0,Math.floor(days))):0;

export function earnedTalentMilestones(bestDays:number):number {
 return Math.floor(safeDays(bestDays)/WEEKLY_MILESTONE_DAYS);
}

/** Show nearby reading stages; never invent chapters or overwrite the canonical plan. */
export function journeyWindow(currentDay:number,windowSize=7):number[] {
 const size=Math.max(1,Math.min(GAME_DAYS,Math.floor(windowSize)||7));
 const safeDay=Math.max(1,Math.min(GAME_DAYS,Number.isFinite(currentDay)?Math.floor(currentDay):1));
 const start=Math.min(GAME_DAYS-size,Math.max(1,safeDay-2));
 return Array.from({length:size},(_,i)=>start+i);
}

export function isWeeklyMilestone(day:number):boolean {
 return Number.isInteger(day)&&day>0&&day<=GAME_DAYS&&day%WEEKLY_MILESTONE_DAYS===0;
}

export function nextTalentMilestone(bestDays:number):number|null {
 const next=(earnedTalentMilestones(bestDays)+1)*WEEKLY_MILESTONE_DAYS;
 return next<=GAME_DAYS?next:null;
}
