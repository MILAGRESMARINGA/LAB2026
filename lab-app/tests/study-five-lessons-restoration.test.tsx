// @vitest-environment jsdom
import React,{act} from "react";
import {createRoot} from "react-dom/client";
import {describe,it,expect,vi} from "vitest";
import {GeneratedStudyCard,STUDY_GUIDE_UNITS} from "../src/components/StudyGeneratorPanel";
import type {GeneratedStudy} from "../src/features/study-generate";

const fixture:GeneratedStudy={
 study_key:"test-genesis-1",title:"Estudo de Gênesis 1",chapter_refs:["1:1"],
 layer:1,cache:true,
 content:{
  title:"Gênesis 1",summary:"Mensagem central do capítulo",
  context:"Contexto histórico literário",exegesis:"Exegese contextual",theological_connection:"Conexão bíblica contextualizada",
  pentecostal_arminian_lens:"Perspectiva teológica identificada",application:"Prática de hoje",
  reflection_questions:["O que aprendemos?"],prayer:"Oração do estudo"
 }
};

describe("Guia de estudo em cinco unidades",()=>{
 it("restaura a sequência de exegese a revisão, mantendo conteúdo na unidade correta",async()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const show=vi.fn(function(this:HTMLDialogElement){this.setAttribute("open","")});
  const close=vi.fn(function(this:HTMLDialogElement){this.removeAttribute("open")});
  Object.defineProperty(HTMLDialogElement.prototype,"showModal",{configurable:true,value:show});
  Object.defineProperty(HTMLDialogElement.prototype,"close",{configurable:true,value:close});
  const host=document.createElement("div");document.body.append(host);
  const root=createRoot(host);
  try{
   await act(async()=>root.render(React.createElement(GeneratedStudyCard,{study:fixture})));
   await act(async()=>{(host.querySelector(".generated-study-point-button") as HTMLButtonElement).click()});
   expect(show).toHaveBeenCalledOnce();
   expect(STUDY_GUIDE_UNITS).toEqual(["Exegese","Teologia Bíblica","Teologia Sistemática","Aplicação","Revisão"]);
   const nav=host.querySelector(".study-five-unit-navigation")!;
   expect(nav.querySelectorAll("button")).toHaveLength(5);
   expect(host.querySelector(".study-guide-breadcrumb")?.textContent).toContain("Seção 1 · Gênesis · Capítulo 1 · Unidade 1");
   expect(host.querySelector(".study-five-unit-content")?.textContent).toContain("Exegese contextual");
   expect(host.querySelector(".study-five-unit-content")?.textContent).not.toContain("Perspectiva teológica identificada");
   await act(async()=>{(nav.querySelectorAll("button")[1] as HTMLButtonElement).click()});
   expect(host.querySelector(".study-five-unit-content")?.textContent).toContain("Conexão bíblica contextualizada");
   await act(async()=>{(nav.querySelectorAll("button")[2] as HTMLButtonElement).click()});
   expect(host.querySelector(".study-five-unit-content")?.textContent).toContain("Perspectiva teológica identificada");
   await act(async()=>{(nav.querySelectorAll("button")[3] as HTMLButtonElement).click()});
   expect(host.querySelector(".study-five-unit-content")?.textContent).toContain("Prática de hoje");
   await act(async()=>{(nav.querySelectorAll("button")[4] as HTMLButtonElement).click()});
   expect(host.querySelector(".study-five-unit-content")?.textContent).toContain("O que aprendemos?");
   expect(host.querySelector(".study-five-unit-content")?.textContent).toContain("não concede XP");
   expect(nav.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
  }finally{await act(async()=>root.unmount());host.remove()}
 });
});
