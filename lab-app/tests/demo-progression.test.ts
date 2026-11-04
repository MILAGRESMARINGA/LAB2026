import {describe,it,expect} from 'vitest';
import {CHAPTERS} from '../src/domain/canon';
import {createNextGamePlan} from '../src/domain/game-plan-next';
import {emptyDemoGame} from '../src/domain/demo-game';
import {journeyRewards,settleJourney,rewardStudy} from '../src/domain/demo-progression';
const plan=createNextGamePlan(365).stages;
describe('baús e bônus da demo',()=>{
 it('não confunde ir ao dia109 com conclusão, exige todos capítulos de livro',()=>{
  expect(journeyRewards([])).toEqual({days:[],weeks:[],months:[],books:[]});
  const genesis=CHAPTERS.filter(c=>c.book==='Gênesis').map(c=>c.id);
  expect(journeyRewards(genesis.slice(1)).books).not.toContain('Gênesis');
  expect(journeyRewards(genesis).books).toContain('Gênesis');
 });
 it('premia um bloco de sete dias somente completo e sem duplicar bônus',()=>{
  const chapters=plan.slice(0,7).flatMap(s=>s.chapters.map(c=>c.id));
  expect(journeyRewards(chapters.slice(1)).weeks).toEqual([]);
  const game=settleJourney({...emptyDemoGame,chapters});
  expect(game.bonuses).toContain('week:1');expect(game.xp).toBe(120);
  expect(settleJourney(game)).toBe(game);
 });
 it('libera estudos mensais só após todas leituras do período e Pentateuco completo',()=>{
  expect(rewardStudy(emptyDemoGame,'month-1')).toBe(emptyDemoGame);
  const start=rewardStudy(emptyDemoGame,'how');expect(start.xp).toBe(20);expect(rewardStudy(start,'how')).toBe(start);
  const chapters=plan.slice(0,30).flatMap(s=>s.chapters.map(c=>c.id));
  expect(journeyRewards(chapters).months).toContain(1);
  expect(rewardStudy({...emptyDemoGame,chapters},'month-1').xp).toBe(20);
  expect(rewardStudy({...emptyDemoGame,chapters},'pentateuch').xp).toBe(0);
  const pent=CHAPTERS.filter(c=>Number(c.id.split(':')[0])<=5).map(c=>c.id);
  expect(rewardStudy({...emptyDemoGame,chapters:pent},'pentateuch').xp).toBe(20);
 });
});
