import {describe,it,expect} from 'vitest';
import {demoRanking,demoReward,emptyDemoGame} from '../src/domain/demo-game';
describe('Ranking explicitamente simulado',()=>{
 it('pontua leitura e vídeo uma única vez e atualiza classificação',()=>{
  let game=demoReward(emptyDemoGame,'chapter','7:20');expect(game.xp).toBe(10);expect(demoReward(game,'chapter','7:20')).toBe(game);
  game=demoReward(game,'video','juizes');expect(game.xp).toBe(15);expect(demoReward(game,'video','juizes')).toBe(game);
  expect(demoRanking(200)[0].self).toBe(true);expect(demoRanking(0).at(-1)?.self).toBe(true);
  expect(emptyDemoGame.xp).toBe(0);
 });
 it('mantém simulação de concorrentes e do GC separada dos pontos do jogador',()=>{
  expect(demoRanking(15,2).find(r=>r.self)?.xp).toBe(15);expect(demoRanking(15,2)[0].xp).toBeGreaterThan(demoRanking(15,0)[0].xp);
  expect(demoRanking(15,0,'individual')).toHaveLength(3);
 });
});
