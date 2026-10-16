import {beforeEach,describe,expect,it,vi} from "vitest";
const {signUp,resend}=vi.hoisted(()=>({signUp:vi.fn(),resend:vi.fn()}));
vi.mock("../src/lib/supabase",()=>({supabase:{auth:{signUp,resend}}}));
import {authErrorMessage,resendSignUpConfirmation,signUp as register} from "../src/features/auth";
import {confirmationRedirectUrl} from "../src/lib/auth-urls";
describe("Confirmação de cadastro Supabase",()=>{
 beforeEach(()=>{signUp.mockReset();resend.mockReset()});
 it("normaliza o endereço e usa a rota canônica de confirmação",async()=>{
  signUp.mockResolvedValue({data:{user:{id:"account"},session:null},error:null});
  await expect(register(" Leitor@Example.Com ","abc12345","Leitor","grupo"))
   .resolves.toEqual({emailConfirmationRequired:true});
  expect(signUp).toHaveBeenCalledWith({
   email:"leitor@example.com",password:"abc12345",
   options:{emailRedirectTo:confirmationRedirectUrl(),data:{display_name:"Leitor",preferred_mode:"grupo"}}
  });
 });
 it("permite reenviar confirmação pela API Auth existente",async()=>{
  resend.mockResolvedValue({error:null});
  await expect(resendSignUpConfirmation(" LEITOR@example.com ")).resolves.toBeUndefined();
  expect(resend).toHaveBeenCalledWith("signup","leitor@example.com",{emailRedirectTo:confirmationRedirectUrl()});
 });
 it("trata colisão de cadastro sem afirmar se o endereço tem conta",()=>{
  expect(authErrorMessage(new Error("User already registered"))).toBe(
   "Não foi possível concluir a solicitação. Se este e-mail já estiver cadastrado, entre ou recupere a senha."
  );
 });
});
