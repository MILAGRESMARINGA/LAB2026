import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,expect,it} from "vitest";
import {GeneratedStudyCard} from "../src/components/StudyGeneratorPanel";
import type {GeneratedStudy} from "../src/features/study-generate";

const study:GeneratedStudy={
 study_key:"study-example",title:"A promessa e a fé",chapter_refs:["Gênesis 12","Gálatas 3"],layer:1,cache:true,
 content:{title:"A promessa e a fé",summary:"Resumo fictício.",context:"Contexto fictício.",exegesis:"Exegese fictícia.",theological_connection:null,pentecostal_arminian_lens:"Leitura fictícia.",application:"Aplicação fictícia.",reflection_questions:["O que o texto destaca?"],prayer:"Oração fictícia."}
};

describe("cartão acessível de estudo bíblico",()=>{
 it("oferece um controle com nome de ação e título, estado inicial fechado e conteúdo identificado",()=>{
  const html=renderToStaticMarkup(createElement(GeneratedStudyCard,{study}));
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain('aria-label="Abrir estudo: A promessa e a fé"');
  expect(html).toContain("Abrir estudo");
  expect(html).toContain('aria-controls=');
  expect(html).toContain('aria-label="Referências bíblicas"');
  expect(html).toContain("Gênesis 12");
  expect(html).toContain("Gálatas 3");
  expect(html).toContain("Resumo fictício.");
  expect(html).toContain("hidden=");
 });

 it("dá nomes acessíveis distintos a estudos com títulos diferentes",()=>{
  const otherStudy:GeneratedStudy={...study,study_key:"other-study",title:"O chamado de Abraão"};
  const html=[study,otherStudy]
   .map(item=>renderToStaticMarkup(createElement(GeneratedStudyCard,{study:item})))
   .join("");
  expect(html).toContain('aria-label="Abrir estudo: A promessa e a fé"');
  expect(html).toContain('aria-label="Abrir estudo: O chamado de Abraão"');
 });
});
