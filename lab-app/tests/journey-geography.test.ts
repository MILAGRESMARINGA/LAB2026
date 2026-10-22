import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {createNextGamePlan} from '../src/domain/game-plan-next';
import {createGamePlan} from '../src/domain/game-plan';
import {chapterJourneyContext,stageJourneyContexts,journeyPoint,journeyCalendarLabel} from '../src/domain/journey-geography';
import {ChallengeJourney} from '../src/components/ChallengeJourney';
import type {JourneyV2State} from '../src/features/journey-v2';
import {JourneyRules} from '../src/components/JourneyRules';
describe('Mapa único, contexto e calendário',()=>{
 it.each([365,366] as const)('representa %i etapas sem perder ou repetir capítulo',length=>{
  const plan=createNextGamePlan(length).stages;
  const positions=plan.map((d,i)=>journeyPoint(d,i));
  expect(new Set(positions.map(p=>`${p.x},${p.y}`)).size).toBe(length);
  expect(plan.flatMap(d=>d.chapters)).toHaveLength(1189);
  expect(plan.every(d=>stageJourneyContexts(d).every(c=>Boolean(c.name&&c.detail&&c.reference)))).toBe(true);
  expect(journeyCalendarLabel(length,length)).toContain('31');
 });
 it('inclui fevereiro 29 só no calendário bissexto',()=>{
  expect(journeyCalendarLabel(60,366)).toMatch(/29.*fev/);
  expect(journeyCalendarLabel(60,365)).toMatch(/01.*mar/);
 });
 it('não inventa coordenadas do Éden nem confunde destinatários com composição',()=>{
  expect(chapterJourneyContext({book:'Gênesis',chapter:1}).kind).toBe('simbólico');
  expect(chapterJourneyContext({book:'Efésios',chapter:1})).toMatchObject({name:'Éfeso',kind:'destinatários'});
  expect(chapterJourneyContext({book:'Efésios',chapter:1}).detail).toContain('não indica necessariamente');
 });
 it('substitui a lista antiga em vez de duplicar a trilha',()=>{
  const html=renderToStaticMarkup(createElement(ChallengeJourney,{plan:createGamePlan(),game:null,totalXP:0,preview:true,onStart:()=>{}}));
  expect(html).toContain('Mapa das etapas da Jornada');
  expect(html).not.toContain('lab-quest-steps');
  expect(html).not.toContain('VER MAPA COMPLETO');
 });
 it('separa a regra anterior da nova e não apresenta um relógio inventado',()=>{
  const old=renderToStaticMarkup(createElement(JourneyRules,{mode:'legacy'}));
  expect(old).toContain('regulamento anterior');expect(old).not.toContain('role="timer"');
  const fresh=renderToStaticMarkup(createElement(JourneyRules,{mode:'v2'}));
  expect(fresh).toContain('Relógio ainda não iniciado');expect(fresh).toContain('3 / 3');
  expect(fresh).toContain('3 XP');expect(fresh).toContain('6 XP');
 });
 it('mostra o prazo e a carência sem liberar a próxima etapa cedo',()=>{
  const base={status:'active',activated_at:'2026-10-22T12:00:00Z',normal_deadline_at:'2026-10-23T12:00:00Z',grace_deadline_at:'2026-10-23T18:00:00Z',remaining_lives_this_month:2} as JourneyV2State;
  const normal=renderToStaticMarkup(createElement(JourneyRules,{mode:'v2',game:base,now:Date.parse('2026-10-22T13:00:00Z')}));
  expect(normal).toContain('23:00:00');expect(normal).toContain('2 / 3');
  const grace=renderToStaticMarkup(createElement(JourneyRules,{mode:'v2',game:base,now:Date.parse('2026-10-23T14:00:00Z')}));
  expect(grace).toContain('Carência restante');expect(grace).toContain('04:00:00');
  const wait=renderToStaticMarkup(createElement(JourneyRules,{mode:'v2',game:{...base,completed_at:'2026-10-22T13:00:00Z',next_eligible_at:'2026-10-23T12:00:00Z'},now:Date.parse('2026-10-22T14:00:00Z')}));
  expect(wait).toContain('Próxima etapa em');expect(wait).toContain('22:00:00');
 });

});
