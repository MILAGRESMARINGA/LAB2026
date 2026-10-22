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
 it("oferece um controle com estado inicial fechado e identifica conteúdo e referências",()=>{
  const html=renderToStaticMarkup(createElement(GeneratedStudyCard,{study}));
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain("Abrir conteúdo e referências bíblicas");
  expect(html).toContain('aria-controls=');
  expect(html).toContain("Gênesis 12");
  expect(html).toContain("Gálatas 3");
  expect(html).not.toContain("Resumo fictício.");
  expect(html).not.toContain('<dialog');
 });
});
