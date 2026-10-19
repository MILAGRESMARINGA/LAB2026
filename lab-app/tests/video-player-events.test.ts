// @vitest-environment jsdom
import React,{act} from "react";
import {createRoot,type Root} from "react-dom/client";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {BibleProjectPlayer} from "../src/components/BibleProjectPlayer";
import {getBibleProjectVideoForChapter} from "../src/domain/bibleproject";
const mock=vi.hoisted(()=>({rpc:vi.fn(),props:{} as Record<string,any>,player:{currentTime:0,duration:4,paused:true,ended:false,readyState:4,playbackRate:1,pause:vi.fn()}}));
vi.mock("../src/lib/supabase",()=>({supabase:{rpc:mock.rpc}}));
vi.mock("@mux/mux-player-react",async()=>{
 const R=await import("react");
 return {default:R.forwardRef((_props:any,ref)=>{mock.props=_props;R.useImperativeHandle(ref,()=>mock.player);return R.createElement("div",{"data-testid":"player"})})};
});
const receipt={session_id:"token-1",ready:true,duration_seconds:4,covered_seconds:0,next_position:0,playback_complete:false,already_awarded:false};
let root:Root,host:HTMLDivElement;
const genesis=getBibleProjectVideoForChapter("Gênesis",1)!;
const render=(resource=genesis,book="Gênesis")=>act(async()=>{root.render(React.createElement(BibleProjectPlayer,{resource,book,signedIn:true,onClose:vi.fn(),onBonus:vi.fn()}));await new Promise(resolve=>setTimeout(resolve,0))});
beforeEach(()=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
 (globalThis as any).IntersectionObserver=class{observe(){}disconnect(){}};
 Object.defineProperty(document,"visibilityState",{configurable:true,value:"visible"});
 mock.rpc.mockReset();mock.rpc.mockResolvedValue({data:{...receipt},error:null});mock.player.currentTime=0;mock.player.paused=true;mock.player.ended=false;mock.player.duration=4;mock.player.playbackRate=1;mock.player.pause.mockReset();
 host=document.createElement("div");document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove()});
describe("Panorama player event integration",()=>{
 it("uses the server duration and never exposes a premature reward button",async()=>{
  await render();expect(host.textContent).toContain("0:04");expect(host.textContent).not.toContain("CONFIRMAR COMPREENSÃO");
  expect(mock.rpc.mock.calls[0][0]).toBe("lab_video_watch");
 });
 it("pauses validation and media when the document is hidden",async()=>{
  await render();Object.defineProperty(document,"visibilityState",{configurable:true,value:"hidden"});
  await act(async()=>{document.dispatchEvent(new Event("visibilitychange"))});
  expect(mock.player.pause).toHaveBeenCalled();expect(mock.rpc.mock.calls.some(([,args])=>args.p_action==="pause")).toBe(true);
 });
 it("resumes at the saved frontier after a pause rather than leaving a gap",async()=>{
  mock.rpc.mockResolvedValue({data:{...receipt,covered_seconds:1,next_position:1},error:null});await render();
  mock.player.currentTime=2.4;mock.player.paused=false;
  await act(async()=>mock.props.onPlaying());
  expect(mock.player.currentTime).toBeCloseTo(0.9);expect(mock.rpc.mock.calls.at(-1)?.[1].p_action).toBe("tick");
 });
 it("stops reward tracking when speed changes",async()=>{
  await render();mock.player.playbackRate=2;
  await act(async()=>mock.props.onRateChange());
  expect(mock.player.pause).toHaveBeenCalled();expect(host.textContent).toContain("velocidade normal");
 });
 it("renders two server questions only after full playback",async()=>{
  mock.rpc.mockResolvedValue({data:{...receipt,playback_complete:true,covered_seconds:4,questions:[{id:1,prompt:"Primeira pergunta",options:["A","B"]},{id:2,prompt:"Segunda pergunta",options:["C","D"]}]},error:null});
  await render();expect(host.querySelectorAll("fieldset")).toHaveLength(2);expect(host.querySelectorAll('input[type="radio"]')).toHaveLength(4);
  expect(host.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
 });
 it("ignores a previous video's delayed state receipt",async()=>{
  let resolveOld!:(value:any)=>void;mock.rpc.mockImplementationOnce(()=>new Promise(resolve=>{resolveOld=resolve}));
  await render();mock.rpc.mockResolvedValue({data:{...receipt,session_id:"new-token",duration_seconds:10},error:null});
  await render(getBibleProjectVideoForChapter("Êxodo",1)!,"Êxodo");
  await act(async()=>resolveOld({data:{...receipt,duration_seconds:999},error:null}));
  expect(host.textContent).toContain("0:10");expect(host.textContent).not.toContain("16:39");
 });
});

describe("Panorama network ordering",()=>{
 it("does not grow an unlimited heartbeat queue while a request is pending",async()=>{
  await render();let release!:(value:any)=>void;
  mock.rpc.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve}));
  mock.player.paused=false;
  await act(async()=>{mock.props.onPlaying();mock.props.onPlaying();mock.props.onPlaying()});
  expect(mock.rpc.mock.calls.filter(([,args])=>args.p_action==="tick")).toHaveLength(1);
  await act(async()=>release({data:{...receipt},error:null}));
 });
 it("does not clear the final playback baseline on the browser's terminal pause event",async()=>{
  await render();mock.player.ended=true;
  await act(async()=>{mock.props.onPause();mock.props.onEnded()});
  expect(mock.rpc.mock.calls.filter(([,args])=>args.p_action==="pause")).toHaveLength(0);
  expect(mock.rpc.mock.calls.at(-1)?.[1].p_action).toBe("ended");
 });
});
