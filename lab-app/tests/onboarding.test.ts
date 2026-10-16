import {describe,expect,it} from "vitest";
import {
  ONBOARDING_STORAGE_KEY,readOnboardingProgress,saveOnboardingProgress
} from "../src/domain/onboarding";

describe("Onboarding persistente",()=>{
  it("começa na primeira etapa sem preferências salvas",()=>{
    expect(readOnboardingProgress(null)).toEqual({step:0,mode:"individual",viewAuth:false});
  });
  it("mantém etapa, modo e apresentação do cadastro ao recarregar",()=>{
    const data=new Map<string,string>();
    const storage={
      getItem:(key:string)=>data.get(key)??null,
      setItem:(key:string,value:string)=>{data.set(key,value)}
    };
    expect(saveOnboardingProgress({step:3,mode:"grupo",viewAuth:true},storage)).toBe(true);
    expect(readOnboardingProgress(storage)).toEqual({step:3,mode:"grupo",viewAuth:true});
    expect(JSON.parse(data.get(ONBOARDING_STORAGE_KEY)??"{}")).toEqual({
      step:3,mode:"grupo",viewAuth:true
    });
  });
  it("descarta etapas inválidas e dados corrompidos",()=>{
    expect(readOnboardingProgress({getItem:()=>"{inválido"}).step).toBe(0);
    expect(readOnboardingProgress({getItem:()=>JSON.stringify({
      step:999,mode:"desconhecido",viewAuth:true
    })})).toEqual({step:0,mode:"individual",viewAuth:false});
  });
  it("não bloqueia navegação quando o armazenamento está desativado",()=>{
    const blocked={getItem:():string=>{throw Error("storage denied")}};
    const unwritable={setItem:():void=>{throw Error("storage denied")}};
    expect(readOnboardingProgress(blocked).step).toBe(0);
    expect(saveOnboardingProgress({step:1,mode:"grupo",viewAuth:false},unwritable)).toBe(false);
  });
});
