import {beforeEach,afterEach,describe,expect,it,vi} from "vitest";
const {resetPasswordForEmail,updateUser}=vi.hoisted(()=>({
 resetPasswordForEmail:vi.fn(),updateUser:vi.fn()
}));
vi.mock("../src/lib/supabase",()=>({supabase:{auth:{resetPasswordForEmail,updateUser}}}));
import {requestPasswordReset,updateAccountPassword} from "../src/features/auth";
import {PUBLIC_APP_ORIGIN} from "../src/lib/auth-urls";
describe("Recuperação de acesso LABGAME",()=>{
 beforeEach(()=>{
  resetPasswordForEmail.mockReset();
  updateUser.mockReset();
  vi.stubGlobal("window",{location:{origin:"https://labgame-biblia.vercel.app"}});
 });
 afterEach(()=>vi.unstubAllGlobals());
 it("rejeita endereços de e-mail inválidos sem acionar o serviço",async()=>{
  await expect(requestPasswordReset("não é email")).rejects.toThrow();
  expect(resetPasswordForEmail).not.toHaveBeenCalled();
 });
 it("envia recuperação à rota fixa do LABGAME",async()=>{
  resetPasswordForEmail.mockResolvedValue({error:null});
  await requestPasswordReset("Leitor@EXAMPLE.COM");
  expect(resetPasswordForEmail).toHaveBeenCalledWith("leitor@example.com",{redirectTo:PUBLIC_APP_ORIGIN+"/auth/reset-password"});
 });
 it("exige senha de pelo menos oito caracteres",async()=>{
  await expect(updateAccountPassword("1234567")).rejects.toThrow("8 caracteres");
  expect(updateUser).not.toHaveBeenCalled();
 });
 it("atualiza senha pelo Supabase Auth após link válido",async()=>{
  updateUser.mockResolvedValue({error:null});
  await updateAccountPassword("NovaSenhaSegura2026!");
  expect(updateUser).toHaveBeenCalledWith({password:"NovaSenhaSegura2026!"});
 });
});
