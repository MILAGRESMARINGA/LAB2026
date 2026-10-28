import {describe,expect,it,vi} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {LaunchHome} from "../src/components/LaunchHome";

describe("Tela inicial de lançamento",()=>{
 it("explica a proposta brasileira antes do cadastro",()=>{
  const html=renderToStaticMarkup(createElement(LaunchHome,{onStart:vi.fn(),onExploreBible:vi.fn()}));
  expect(html).toContain("A Bíblia toda.");
  expect(html).toContain("Bíblia em português");
  expect(html).toContain("Plano completo de 365 dias");
  expect(html).toContain("Grupos privados");
  expect(html).toContain("COMEÇAR MINHA JORNADA");
  expect(html).toContain("Quero explorar a Bíblia primeiro");
 });
});
