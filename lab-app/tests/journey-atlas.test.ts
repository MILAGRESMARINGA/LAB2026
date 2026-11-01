import {describe,it,expect} from 'vitest';
import {atlasPlace,weekWindow} from '../src/domain/journey-atlas';
import {createNextGamePlan} from '../src/domain/game-plan-next';
describe('Atlas semanal',()=>{
 for(const length of [365,366] as const)it(`preserva ${length} dias e limita todas as janelas`,()=>{
  const plan=createNextGamePlan(length).stages;
  for(let current=1;current<=length;current++){
   const window=weekWindow(plan,current);
   expect(window.days.length).toBeLessThanOrEqual(7);
   expect(window.days.some(d=>d.day===current)).toBe(true);
   expect(window.start%7).toBe(0);
  }
  expect(weekWindow(plan,length).days.at(-1)?.day).toBe(length);
 });
 it('acompanha Egito, Sinai e a chegada de Atos a Roma',()=>{
  expect(atlasPlace({book:'Gênesis',chapter:39}).name).toContain('Egito');
  expect(atlasPlace({book:'Êxodo',chapter:19}).name).toBe('Sinai');
  expect(atlasPlace({book:'Atos',chapter:1}).name).toBe('Canaã');
  expect(atlasPlace({book:'Atos',chapter:14}).name).toBe('Ásia Menor');
  expect(atlasPlace({book:'Atos',chapter:28}).name).toBe('Roma');
 });
});
