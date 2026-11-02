import {describe,it,expect} from 'vitest';
import {CHAPTERS} from '../src/domain/canon';
import {createNextGamePlan} from '../src/domain/game-plan-next';
import {JOURNEY_STORIES,CHAPTER_STORIES,storyForChapter,STORY_CONTEXT_NOTICES} from '../src/domain/journey-stories';

describe('Episódios narrativos da jornada',()=>{
 it('cobre exatamente os 1189 capítulos com limites não sobrepostos',()=>{
  expect(CHAPTER_STORIES).toHaveLength(1189);
  for(const chapter of CHAPTERS){
   const matches=JOURNEY_STORIES.filter(story=>story.book===chapter.book&&chapter.chapter>=story.fromChapter&&chapter.chapter<=story.toChapter);
   expect(matches,chapter.id).toHaveLength(1);
   expect(storyForChapter(chapter.book,chapter.chapter)).toBe(matches[0]);
   expect(matches[0].title).toBeTruthy();expect(matches[0].reference).toBeTruthy();
  }
 });
 it('mantém claras as transições das origens e das famílias patriarcais',()=>{
  expect(storyForChapter('Gênesis',2).id).toBe('origins');
  expect(storyForChapter('Gênesis',6).id).toBe('noah');
  expect(storyForChapter('Gênesis',10).id).toBe('peoples-babel');
  expect(storyForChapter('Gênesis',12).person).toContain('Abraão');
  expect(storyForChapter('Gênesis',25).id).toBe('generation-transition');
  expect(storyForChapter('Gênesis',26).id).toBe('isaac');
  expect(storyForChapter('Gênesis',27).id).toBe('jacob-journey');
  expect(storyForChapter('Gênesis',38).person).toBe('Judá e Tamar');
  expect(storyForChapter('Gênesis',39).id).toBe('joseph-egypt');
 });
 it('distingue a saída, o Sinai e instruções que não são deslocamentos',()=>{
  expect(storyForChapter('Êxodo',12).id).toBe('passover');
  expect(storyForChapter('Êxodo',13).id).toBe('exodus-route');
  expect(storyForChapter('Êxodo',19).id).toBe('sinai-covenant');
  expect(storyForChapter('Êxodo',25).kind).toBe('literary');
  expect(storyForChapter('Deuteronômio',1).summary).toContain('Lugares lembrados');
 });
 it('identifica paralelos históricos e contextos literários sem viagens inventadas',()=>{
  expect(storyForChapter('Rute',1).period).toBe('Tempo dos juízes');
  expect(storyForChapter('1 Crônicas',11).period).toContain('paralelo');
  expect(storyForChapter('2 Crônicas',2).summary).toContain('paralela a Reis');
  expect(storyForChapter('Salmos',1).kind).toBe('literary');
  expect(storyForChapter('Joel',1).period).toContain('discutida');
  expect(storyForChapter('Daniel',7).kind).toBe('vision');
  expect(storyForChapter('Romanos',1).kind).toBe('letter');
  expect(storyForChapter('Apocalipse',22).kind).toBe('vision');
  expect(STORY_CONTEXT_NOTICES.intercalated).toContain('sem embaralhar');
 });
 for(const length of [365,366] as const)it(`não modifica o plano intercalado de ${length} etapas`,()=>{
  const plan=createNextGamePlan(length).stages,before=JSON.stringify(plan);
  plan.forEach(day=>day.chapters.forEach(chapter=>storyForChapter(chapter.book,chapter.chapter)));
  expect(JSON.stringify(plan)).toBe(before);
  expect(new Set(plan.flatMap(day=>day.chapters.map(chapter=>chapter.id))).size).toBe(1189);
 });
 it('rejeita entradas inválidas em vez de inventar contexto',()=>{
  expect(()=>storyForChapter('Gênesis',0)).toThrow();expect(()=>storyForChapter('Gênesis',51)).toThrow();expect(()=>storyForChapter('Outro livro',1)).toThrow();
 });
});
