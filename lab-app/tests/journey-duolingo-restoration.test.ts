// @vitest-environment jsdom
import React,{act} from "react";
import {createRoot} from "react-dom/client";
import {describe,it,expect,vi} from "vitest";
import {ChallengeJourney} from "../src/components/ChallengeJourney";
import {createGamePlan} from "../src/domain/game-plan";
import {MAIN_TABS} from "../src/components/MainNavigation";

describe("Jornada original — trilha como tela principal",()=>{
 it("restaura desafios, progresso e recompensas antes do mapa opcional",async()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement("div");
  document.body.append(container);
  const root=createRoot(container);
  const start=vi.fn();
  try{
   await act(async()=>{root.render(React.createElement(ChallengeJourney,{
    plan:createGamePlan(),game:null,totalXP:0,preview:true,onStart:start
   }))});
   expect(container.querySelector(".lab-quest-progress")).not.toBeNull();
   expect(container.querySelector(".lab-quest-feature")?.textContent).toContain("Sua jornada começa aqui");
   expect(container.querySelector(".lab-quest-map")).not.toBeNull();
   expect(container.querySelectorAll(".lab-quest-step")).toHaveLength(7);
   expect(container.querySelector(".lab-quest-overview")).not.toBeNull();
   expect(container.querySelector(".lab-quest-personal-award")).not.toBeNull();
   expect(container.querySelector(".journey-world")).toBeNull();
   const read=container.querySelector(".lab-quest-start") as HTMLButtonElement;
   expect(read?.textContent).toContain("CRIAR CONTA E COMEÇAR");
   await act(async()=>{read.click()});
   expect(start).toHaveBeenCalledOnce();
   const atlas=container.querySelector(".lab-quest-atlas-trigger") as HTMLButtonElement;
   expect(atlas.getAttribute("aria-expanded")).toBe("false");
   await act(async()=>{atlas.click()});
   expect(container.querySelector(".journey-world")).not.toBeNull();
   expect(atlas.getAttribute("aria-expanded")).toBe("true");
   await act(async()=>{atlas.click()});
   expect(container.querySelector(".journey-world")).toBeNull();
  }finally{await act(async()=>root.unmount());container.remove()}
 });
 it("mantém menu mobile atualizado com Estudos em segundo lugar",()=>{
  expect(MAIN_TABS.map(tab=>tab.label)).toEqual(["Jornada","Estudos","Bíblia","GCs","Perfil","Ajuda"]);
 });
});
