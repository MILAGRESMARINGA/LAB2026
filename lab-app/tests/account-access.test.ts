import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
const {signUpMock,signInMock,resendMock}=vi.hoisted(()=>({
 signUpMock:vi.fn(),signInMock:vi.fn(),resendMock:vi.fn()
}));
vi.mock("../src/lib/supabase",()=>({
 supabase:{auth:{signUp:signUpMock,signInWithPassword:signInMock,resend:resendMock}}
}));
import {
 authErrorMessage,signIn,signUp,resendSignUpConfirmation,validateRegistration
} from "../src/features/auth";
import {AccountAccess} from "../src/components/AccountAccess";

describe("Cadastro e login reais do LABGAME",()=>{
 beforeEach(()=>{
  signUpMock.mockReset();signInMock.mockReset();resendMock.mockReset();
  vi.stubGlobal("window",{location:{origin:"https://labgame-biblia.vercel.app"}});
 });
 afterEach(()=>vi.unstubAllGlobals());
 it("obriga nome, e-mail válido e senhas iguais",()=>{
  expect(validateRegistration("A","leitor@example.com","Senha12345","Senha12345")).toContain("2 a 60");
  expect(validateRegistration("Leitor","invalido","Senha12345","Senha12345")).toContain("e-mail");
  expect(validateRegistration("Leitor","leitor@example.com","curta","curta")).toContain("8 caracteres");
  expect(validateRegistration("Leitor","leitor@example.com","abcdefgh","abcdefgh")).toContain("letra e um número");
  expect(validateRegistration("Leitor","leitor@example.com","Senha12345","OutraSenha123")).toContain("não corresponde");
  expect(validateRegistration("Leitor","leitor@example.com","Senha12345","Senha12345")).toBeNull();
 });
 it("cadastra com perfil e informa quando a confirmação por e-mail é obrigatória",async()=>{
  signUpMock.mockResolvedValue({data:{user:{id:"test-user"},session:null},error:null});
  const result=await signUp("  Pessoa@Example.com ","MinhaSenha123","  Leitor de Teste  ","grupo");
  expect(result.emailConfirmationRequired).toBe(true);
  expect(signUpMock).toHaveBeenCalledWith({
   email:"pessoa@example.com",password:"MinhaSenha123",
   options:{
    emailRedirectTo:"https://labgame-biblia.vercel.app",
    data:{display_name:"Leitor de Teste",preferred_mode:"grupo"}
   }
  });
 });
 it("permite login somente quando existe sessão válida",async()=>{
  signInMock.mockResolvedValue({data:{session:null},error:null});
  await expect(signIn("x@example.com","Senha123")).rejects.toThrow("sessão");
  signInMock.mockResolvedValue({data:{session:{access_token:"test"}},error:null});
  await expect(signIn(" x@example.com ","Senha123")).resolves.toBeUndefined();
  expect(signInMock).toHaveBeenLastCalledWith({email:"x@example.com",password:"Senha123"});
 });
 it("permite reenviar ativação e traduz erros de autenticação",async()=>{
  resendMock.mockResolvedValue({error:null});
  await resendSignUpConfirmation("Leitor@EXAMPLE.com");
  expect(resendMock).toHaveBeenCalledWith({
   type:"signup",email:"leitor@example.com",
   options:{emailRedirectTo:"https://labgame-biblia.vercel.app"}
  });
  expect(authErrorMessage(new Error("Invalid login credentials"))).toContain("incorretos");
  expect(authErrorMessage(new Error("Email not confirmed"))).toContain("Confirme");
  expect(authErrorMessage(new Error("rate limit exceeded"))).toContain("Aguarde");
 });
 it("mostra cadastro e login como ações claras, também nas abas Perfil e GC",()=>{
  const signup=renderToStaticMarkup(createElement(AccountAccess,{initialMode:"signup",title:"Seu perfil"}));
  expect(signup).toContain("CRIAR MINHA CONTA");
  expect(signup).toContain("Confirme a senha");
  expect(signup).toContain("Nome que aparecerá no perfil");
  const login=renderToStaticMarkup(createElement(AccountAccess,{initialMode:"login",title:"GC"}));
  expect(login).toContain("ENTRAR NO LABGAME");
  expect(login).toContain("Esqueci minha senha");
  expect(login).toContain("CRIAR CONTA");
 });
});
