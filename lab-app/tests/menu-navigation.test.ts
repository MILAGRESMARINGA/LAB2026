import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const styles=readFileSync(new URL("../src/style.css",import.meta.url),"utf8");

describe("menu inferior responsivo",()=>{
 it("preserva a largura desktop e oferece alvos e ícones legíveis no mobile",()=>{
  expect(styles).toContain("width:min(160px,16.666%)");
  const mobileNav=styles.match(/@media\(max-width:650px\)\{\s*\.game-bottom-nav\{[^}]*\}\s*\.game-bottom-nav button\{[^}]*\}\s*\.game-bottom-nav button svg\{[^}]*\}/);
  expect(mobileNav).not.toBeNull();
  expect(mobileNav?.[0]).toContain("min-height:48px");
  expect(mobileNav?.[0]).toContain("min-width:44px");
  expect(mobileNav?.[0]).toContain("font-size:10px");
  expect(mobileNav?.[0]).toContain("color:#b7c7cb");
  expect(mobileNav?.[0]).toContain("width:20px;height:20px");
 });

 it("mantém foco de teclado claramente visível no menu móvel",()=>{
  expect(styles).toContain(".game-bottom-nav button:focus-visible{outline:3px solid #83cef0;outline-offset:3px;z-index:1}");
 });
});
