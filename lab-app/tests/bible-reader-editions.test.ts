// @vitest-environment jsdom
import React,{act} from "react";
import {createRoot,type Root} from "react-dom/client";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
const mock=vi.hoisted(()=>({read:vi.fn(),editions:vi.fn(),speech:vi.fn()}));
vi.mock("../src/features/bible",async()=>{const actual=await vi.importActual<typeof import('../src/features/bible')>("../src/features/bible");return {...actual,readBibleChapter:mock.read,listBibleEditions:mock.editions,readBibleSpeechSpans:mock.speech}});
import {BibleReader} from "../src/components/BibleReader";
let host:HTMLDivElement,root:Root;
const chapter=(text:string,chapterId="1:1",edition="ALM1911")=>({edition,chapter_id:chapterId,book_name:"Gênesis",chapter_number:Number(chapterId.split(":")[1]),verses:[{number:1,text}]});
const flush=()=>act(async()=>{await new Promise(resolve=>setTimeout(resolve,0))});
const draw=(chapterId="1:1",onVideo=vi.fn())=>act(async()=>{root.render(React.createElement(BibleReader,{chapterId,onVideo}));await new Promise(resolve=>setTimeout(resolve,0))});
beforeEach(()=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
 mock.read.mockReset();mock.editions.mockReset();mock.speech.mockReset();
 mock.speech.mockResolvedValue({});mock.read.mockResolvedValue(chapter("Texto principal"));
 mock.editions.mockResolvedValue([{code:"ALM1911",title:"Almeida 1911",available:true},{code:"TEST",title:"Edição teste",available:true},{code:"NVI",title:"NVI",available:false}]);
 host=document.createElement("div");document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove()});
describe("Reader optional introductions and edition isolation",()=>{
 it("keeps chapter text available without video and opens the existing internal callback",async()=>{
  const open=vi.fn();await draw("1:1",open);
  expect(host.textContent).toContain("Texto principal");
  const video=[...host.querySelectorAll('button')].find(item=>item.textContent?.includes("Assistir &"))!;
  await act(async()=>video.click());expect(open).toHaveBeenCalledWith(expect.objectContaining({title:"Gênesis 1–11"}),"Gênesis");
  expect(host.querySelector('a[href="#bible-chapter-text"]')).not.toBeNull();
 });
 it("does not display a stale chapter after navigation",async()=>{
  let oldResolve!:(value:unknown)=>void;
  mock.read.mockImplementation((id:string)=>id==="1:1"?new Promise(resolve=>{oldResolve=resolve}):Promise.resolve(chapter("Capítulo novo",id)));
  await draw();await draw("1:2");await act(async()=>oldResolve(chapter("Capítulo antigo")));await flush();
  expect(host.textContent).toContain("Capítulo novo");expect(host.textContent).not.toContain("Capítulo antigo");
  expect(host.textContent).not.toContain("Conheça Gênesis antes");
 });
 it("clears comparison on navigation and ignores stale translation responses",async()=>{
  let oldResolve!:(value:unknown)=>void;
  mock.read.mockImplementation((id:string,edition:string)=>edition==="TEST"&&id==="1:1"?new Promise(resolve=>{oldResolve=resolve}):Promise.resolve(chapter(edition==="TEST"?"Tradução nova":"Texto principal",id,edition)));
  await draw();const toggle=[...host.querySelectorAll('button')].find(item=>item.textContent?.includes("Comparar 2"))!;
  await act(async()=>toggle.click());await draw("1:2");
  await act(async()=>oldResolve(chapter("Tradução obsoleta","1:1","TEST")));await flush();
  expect(host.textContent).toContain("Tradução nova");expect(host.textContent).not.toContain("Tradução obsoleta");
  expect(host.querySelector('option[value="NVI"]')?.hasAttribute('disabled')).toBe(true);
 });
});
