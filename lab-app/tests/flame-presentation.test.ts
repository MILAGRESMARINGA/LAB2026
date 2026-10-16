import {describe,it,expect} from "vitest";
import {flamePresentation} from "../src/domain/flame-presentation";

describe("visual da Chama Viva",()=>{
 it("altera tamanho e intensidade pelos dias confirmados",()=>{
  expect(flamePresentation(0,"inactive").tone).toBe("quiet");
  expect(flamePresentation(1).tone).toBe("growing");
  expect(flamePresentation(7).tone).toBe("steady");
  expect(flamePresentation(30).tone).toBe("intense");
  expect(flamePresentation(1).iconSize).toBeLessThan(flamePresentation(7).iconSize);
  expect(flamePresentation(7).iconSize).toBeLessThan(flamePresentation(30).iconSize);
 });
 it("mostra brasa quando a tentativa foi encerrada sem apagar a contagem registrada",()=>{
  const view=flamePresentation(8,"failed");
  expect(view.tone).toBe("ember");
  expect(view.completedDays).toBe(8);
  expect(view.description).toContain("recorde");
 });
 it("sanitiza valores ausentes ou inválidos e não cria recompensas",()=>{
  expect(flamePresentation(Number.NaN).completedDays).toBe(0);
  expect(flamePresentation(-3).completedDays).toBe(0);
  expect(flamePresentation(31,"completed").title).toBe("Jornada concluída");
 });
});
