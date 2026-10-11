import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {describe,expect,it} from "vitest";
const read=(relative:string)=>readFileSync(fileURLToPath(new URL(relative,import.meta.url)),"utf8");
describe("LABGAME instalado como app",()=>{
 const manifest=JSON.parse(read("../public/manifest.webmanifest"));
 const serviceWorker=read("../public/sw.js");
 const html=read("../index.html");
 it("configura PWA em português e modo aplicativo",()=>{
  expect(manifest.lang).toBe("pt-BR");
  expect(manifest.name).toContain("LABGAME");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.length).toBeGreaterThan(0);
  expect(html).toContain('rel="manifest"');
 });
 it("mantém o escopo da aplicação na própria origem",()=>{
  expect(manifest.start_url).toBe("/");
  expect(manifest.scope).toBe("/");
  expect(serviceWorker).toContain("url.origin!==self.location.origin");
 });
 it("não guarda APIs, XP ou tokens no armazenamento de páginas offline",()=>{
  expect(serviceWorker).toContain('request.method!=="GET"');
  expect(serviceWorker).toContain('url.pathname.startsWith("/assets/")');
  expect(serviceWorker).not.toContain("supabase.co");
  expect(serviceWorker).not.toContain("localStorage");
 });
 it("disponibiliza ícone vetorial com identidade LABGAME",()=>{
  const icon=read("../public/icons/labgame.svg");
  expect(icon).toContain("<svg");
  expect(icon).toContain("Bíblia e chama");
 });
});
