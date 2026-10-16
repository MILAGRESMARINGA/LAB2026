import {describe,expect,it,vi} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
vi.mock("../src/lib/supabase",()=>({supabase:{}}));
import {AccountAccess} from "../src/components/AccountAccess";

describe("P0 — cadastro existente não promete e-mail novo",()=>{
 it("mantém entrada e recuperação visíveis no formulário",()=>{
  const html=renderToStaticMarkup(createElement(AccountAccess,{initialMode:"login"}));
  expect(html).toContain("ENTRAR NO LABGAME");
  expect(html).toContain("Esqueci minha senha");
 });
 it("evita declarar envio garantido na abertura de cadastro",()=>{
  const html=renderToStaticMarkup(createElement(AccountAccess,{initialMode:"signup"}));
  expect(html).toContain("CRIAR MINHA CONTA");
  expect(html).not.toContain("E-mail enviado!");
 });
});
