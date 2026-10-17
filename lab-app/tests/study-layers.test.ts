import {describe,expect,it} from "vitest";
import {activeStudyLayer,studyLayerViews} from "../src/domain/study-layers";

describe("trilha das três camadas de estudo",()=>{
 it("começa no discipulado e mostra o próximo desbloqueio",()=>{
  const views=studyLayerViews(0);
  expect(views.map(view=>view.unlocked)).toEqual([true,false,false]);
  expect(views[1].remainingDays).toBe(30);
  expect(views[2].remainingDays).toBe(90);
  expect(activeStudyLayer(0)).toBe(1);
 });
 it("libera liderança aos 30 e teologia aos 90 dias confirmados",()=>{
  expect(studyLayerViews(30).map(view=>view.unlocked)).toEqual([true,true,false]);
  expect(activeStudyLayer(30)).toBe(2);
  expect(studyLayerViews(90).map(view=>view.unlocked)).toEqual([true,true,true]);
  expect(activeStudyLayer(365)).toBe(3);
 });
 it("não usa valores negativos, fracionados ou NaN para liberar conteúdo",()=>{
  expect(activeStudyLayer(-4)).toBe(1);
  expect(studyLayerViews(29.9)[1].unlocked).toBe(false);
  expect(studyLayerViews(Number.NaN)[1].progressPercent).toBe(0);
 });
});
