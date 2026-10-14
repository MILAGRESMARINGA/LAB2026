import {describe,expect,it} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {createGamePlan} from "../src/domain/game-plan";
import {
 earnedTalentMilestones,FRUIT_OF_THE_SPIRIT,isWeeklyMilestone,
 journeyWindow,nextTalentMilestone,SPIRITUAL_GIFTS_EXAMPLES
} from "../src/domain/journey-rewards";
import {ChallengeJourney} from "../src/components/ChallengeJourney";
import type {LabGameState} from "../src/features/lab-game";
const plan=createGamePlan();
const game:LabGameState={
 run_id:"testing",day:1,completed_days:0,best_days:0,total_xp:0,
 total_completed_days:0,checked:[],today:"2026-10-14"
};

describe("Trilha de desafios e Talentos",()=>{
 it("exibe capítulos autênticos do plano sem substituir a sequência",()=>{
  const html=renderToStaticMarkup(createElement(ChallengeJourney,{
   plan,game,totalXP:0,onStart:()=>{}
  }));
  expect(html).toContain("Gênesis 1");
  expect(html).toContain("Salmos 1");
  expect(html).toContain("João 1");
  expect(html).toContain("INICIAR LEITURA");
  expect(html).toContain("Baú de Talentos · 7 dias");
  expect(html).toContain("Dons e fruto do Espírito");
  expect(html).not.toContain("Presente devocional");
 });
 it("mostra tela de demonstração com acesso ao cadastro, sem inventar XP",()=>{
  const html=renderToStaticMarkup(createElement(ChallengeJourney,{
   plan,game:null,totalXP:0,preview:true,onStart:()=>{}
  }));
  expect(html).toContain("CRIAR CONTA E COMEÇAR");
  expect(html).toContain("0 <span>/ 365 dias");
 });
 it("indica conclusão confirmada e não permite antecipar a etapa",()=>{
  const completedGame={...game,checked:plan[0].chapters.map(ch=>ch.id),completed_days:1,best_days:1,total_xp:30};
  const html=renderToStaticMarkup(createElement(ChallengeJourney,{
   plan,game:completedGame,totalXP:30,onStart:()=>{}
  }));
  expect(html).toContain("Seu desafio de hoje está completo");
  expect(html).toContain("Próxima etapa amanhã");
  expect(html).not.toContain("INICIAR LEITURA");
 });
 it("converte somente sequência confirmada em marcos visuais, sem XP extra",()=>{
  expect(earnedTalentMilestones(0)).toBe(0);
  expect(earnedTalentMilestones(6)).toBe(0);
  expect(earnedTalentMilestones(7)).toBe(1);
  expect(earnedTalentMilestones(13)).toBe(1);
  expect(earnedTalentMilestones(14)).toBe(2);
  expect(earnedTalentMilestones(365)).toBe(52);
  expect(earnedTalentMilestones(-100)).toBe(0);
  expect(earnedTalentMilestones(NaN)).toBe(0);
  expect(nextTalentMilestone(6)).toBe(7);
  expect(nextTalentMilestone(364)).toBeNull();
  expect(isWeeklyMilestone(7)).toBe(true);
  expect(isWeeklyMilestone(8)).toBe(false);
  expect(isWeeklyMilestone(0)).toBe(false);
 });
 it("nunca retorna etapas fora dos 365 dias",()=>{
  expect(journeyWindow(1)).toEqual([1,2,3,4,5,6,7]);
  expect(journeyWindow(365)).toEqual([359,360,361,362,363,364,365]);
  expect(journeyWindow(300).includes(300)).toBe(true);
  expect(journeyWindow(-400)[0]).toBe(1);
  expect(journeyWindow(2000).at(-1)).toBe(365);
 });
 it("diferencia dons espirituais e fruto do Espírito, sem atribuir dons ao jogador",()=>{
  expect(FRUIT_OF_THE_SPIRIT).toHaveLength(9);
  expect(SPIRITUAL_GIFTS_EXAMPLES).toHaveLength(9);
  expect(FRUIT_OF_THE_SPIRIT).toContain("Domínio próprio");
  expect(SPIRITUAL_GIFTS_EXAMPLES).toContain("Profecia");
 });
});
