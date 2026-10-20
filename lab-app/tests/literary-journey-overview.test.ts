import {describe,it,expect} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {LiteraryJourneyOverview} from "../src/components/LiteraryJourneyOverview";
import {createNextGamePlan} from "../src/domain/game-plan-next";

describe("Visão macro das jornadas",()=>{
 it.each([365,366] as const)("respeita o comprimento real de %i etapas sem liberar leitura",days=>{
  const html=renderToStaticMarkup(createElement(LiteraryJourneyOverview,{
   plan:createNextGamePlan(days).stages,activeDay:1,completedDays:0,checked:[]
  }));
  expect(html).toContain(`VER MAPA COMPLETO · ${days} ETAPAS`);
  expect(html).not.toContain("Primeiros passos");
  expect(html).not.toContain("INICIAR LEITURA");
 });
 it("revela vestes apenas por etapas já confirmadas e sem pontos adicionais",()=>{
  const html=renderToStaticMarkup(createElement(LiteraryJourneyOverview,{
   plan:createNextGamePlan(365).stages,activeDay:8,completedDays:7,checked:[]
  }));
  expect(html).toContain("Primeiros passos");
  expect(html).toContain("Não concede XP adicional");
  expect(html).not.toContain("Caminhada perseverante");
 });
});
