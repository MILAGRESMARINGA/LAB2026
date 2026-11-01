import {describe,it,expect} from 'vitest';
import {atlasPlace,weekWindow,atlasChapter} from '../src/domain/journey-atlas';
import {CHAPTERS} from '../src/domain/canon';
import {createNextGamePlan} from '../src/domain/game-plan-next';
describe('Atlas semanal e cobertura do cânon',()=>{
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
 it('não cria etapas para um plano vazio e limita estágios inválidos',()=>{
  expect(weekWindow([],1).days).toEqual([]);
  expect(weekWindow([1,2,3],-10).days).toEqual([1,2,3]);
  expect(weekWindow(Array.from({length:365},(_,i)=>i+1),900).days.at(-1)).toBe(365);
 });
 it('fornece contexto geográfico explícito para todos os 1189 capítulos',()=>{
  expect(CHAPTERS).toHaveLength(1189);
  for(const chapter of CHAPTERS){
   const context=atlasChapter(chapter);
   expect(context,chapter.id).toBeDefined();
   expect(context.reference,chapter.id).toBeTruthy();
   expect(context.note,chapter.id).toBeTruthy();
   expect(['narrative','recipient','literary','vision','symbolic']).toContain(context.kind);
   expect(['regional','approximate','uncertain']).toContain(context.confidence);
   expect(context.route.length,chapter.id).toBeGreaterThan(0);
   for(const place of [context.place,...context.route]){
    expect(Number.isFinite(place.lon),chapter.id).toBe(true);expect(Number.isFinite(place.lat),chapter.id).toBe(true);
    expect(place.lon).toBeGreaterThanOrEqual(-180);expect(place.lon).toBeLessThanOrEqual(180);
    expect(place.lat).toBeGreaterThanOrEqual(-90);expect(place.lat).toBeLessThanOrEqual(90);
    expect(place.name,chapter.id).toBeTruthy();expect(place.biome,chapter.id).toBeTruthy();
   }
  }
 });
 it('trata Éden e poemas como contextos incertos ou literários, não sítios comprovados',()=>{
  const eden=atlasChapter({book:'Gênesis',chapter:2});
  expect(eden.kind).toBe('symbolic');expect(eden.confidence).toBe('uncertain');
  expect(atlasChapter({book:'Salmos',chapter:1}).kind).toBe('literary');
  expect(atlasChapter({book:'Provérbios',chapter:10}).kind).toBe('literary');
 });
 it('distingue a região dos destinatários da localização da escrita das cartas',()=>{
  expect(atlasChapter({book:'Romanos',chapter:1}).kind).toBe('recipient');
  expect(atlasChapter({book:'Romanos',chapter:1}).place.name).toMatch(/Roma/);
  expect(atlasChapter({book:'Efésios',chapter:1}).kind).toBe('recipient');
 });
 it('acompanha José no Egito, o Sinai e o destino final de Atos',()=>{
  expect(atlasPlace({book:'Gênesis',chapter:39}).name).toMatch(/Egito|Nilo/);
  expect(atlasPlace({book:'Êxodo',chapter:19}).name).toMatch(/Sinai/);
  expect(atlasPlace({book:'Atos',chapter:28}).name).toMatch(/Roma/);
  expect(atlasPlace({book:'Atos',chapter:1}).lon).toBeGreaterThan(atlasPlace({book:'Atos',chapter:28}).lon);
 });
 it('distingue Edom e Amom de Moabe conforme os mapas fornecidos',()=>{
  const edom=atlasPlace({book:'Gênesis',chapter:36}),moab=atlasPlace({book:'Deuteronômio',chapter:1}),rabbah=atlasChapter({book:'2 Samuel',chapter:11}).route.find(place=>/Rabá|Amom/.test(place.name))!;
  expect(edom.name).toMatch(/Edom/);expect(edom.lat).toBeLessThan(moab.lat);
  expect(rabbah).toBeDefined();expect(rabbah.name).toMatch(/Rabá|Amom/);expect(rabbah.name).not.toBe(moab.name);
 });
 it('acompanha a distribuição das tribos e a mudança de centro do reino',()=>{
  expect(atlasPlace({book:'Josué',chapter:13}).name).toMatch(/Gileade/);
  expect(atlasPlace({book:'Josué',chapter:14}).name).toMatch(/Hebrom/);
  expect(atlasPlace({book:'Josué',chapter:18}).name).toMatch(/Siló/);
  expect(atlasPlace({book:'Josué',chapter:22}).name).toMatch(/Jordão/);
  expect(atlasPlace({book:'2 Samuel',chapter:2}).name).toMatch(/Hebrom/);
  expect(atlasPlace({book:'2 Samuel',chapter:5}).name).toMatch(/Jerusalém/);
  expect(atlasPlace({book:'1 Reis',chapter:12}).name).not.toBe('Samaria');
 });

});
