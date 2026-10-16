import {beforeEach,describe,expect,it,vi} from "vitest";

const {fakeSignOut}=vi.hoisted(()=>({fakeSignOut:vi.fn()}));
vi.mock("../src/lib/supabase",()=>({
 supabase:{auth:{signOut:fakeSignOut}}
}));
import {signOut} from "../src/features/auth";

describe("P0 — saída segura da sessão",()=>{
 beforeEach(()=>fakeSignOut.mockReset());

 it("encerra apenas a sessão deste dispositivo sem exigir logout global",async()=>{
  fakeSignOut.mockResolvedValue({error:null});
  await expect(signOut()).resolves.toBeUndefined();
  expect(fakeSignOut).toHaveBeenCalledTimes(1);
  expect(fakeSignOut).toHaveBeenCalledWith({scope:"local"});
 });

 it("não oculta erros: permite à interface apresentar falha de saída",async()=>{
  const e=new Error("network unavailable");
  fakeSignOut.mockResolvedValue({error:e});
  await expect(signOut()).rejects.toThrow("network unavailable");
  expect(fakeSignOut).toHaveBeenCalledTimes(1);
  expect(fakeSignOut).toHaveBeenCalledWith({scope:"local"});
 });
});
