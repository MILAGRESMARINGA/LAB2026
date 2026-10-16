import {beforeEach,describe,expect,it,vi} from "vitest";
const {verifyOtp}=vi.hoisted(()=>({verifyOtp:vi.fn()}));
vi.mock("../src/lib/supabase",()=>({supabase:{auth:{verifyOtp}}}));
import {verifyEmailCode} from "../src/features/auth";
describe("P0: código de e-mail no próprio LABGAME",()=>{
 beforeEach(()=>verifyOtp.mockReset());
 it("valida exatamente seis algarismos e não consulta servidor com token incorreto",async()=>{
  await expect(verifyEmailCode("leitor@example.com","123","email")).rejects.toThrow("seis dígitos");
  await expect(verifyEmailCode("leitor@example.com","ABCDEF","email")).rejects.toThrow("seis dígitos");
  await expect(verifyEmailCode("endereço inválido","123456","email")).rejects.toThrow("e-mail válido");
  expect(verifyOtp).not.toHaveBeenCalled();
 });
 it("confirma novo cadastro sem precisar sair do aplicativo",async()=>{
  verifyOtp.mockResolvedValue({data:{session:{user:{id:"ok"}}},error:null});
  await verifyEmailCode("  Leitor@Example.Com ","123 456","email");
  expect(verifyOtp).toHaveBeenCalledWith({email:"leitor@example.com",token:"123456",type:"email"});
 });
 it("recupera senha com código de seis dígitos",async()=>{
  verifyOtp.mockResolvedValue({data:{session:{user:{id:"ok"}}},error:null});
  await verifyEmailCode("leitor@example.com","654321","recovery");
  expect(verifyOtp).toHaveBeenCalledWith({email:"leitor@example.com",token:"654321",type:"recovery"});
 });
 it("não considera autenticado um código aceito sem sessão",async()=>{
  verifyOtp.mockResolvedValue({data:{session:null},error:null});
  await expect(verifyEmailCode("leitor@example.com","123456","email")).rejects.toThrow("sessão válida");
 });
 it("propaga erro de código expirado da autenticação",async()=>{
  verifyOtp.mockResolvedValue({data:{session:null},error:new Error("Token has expired")});
  await expect(verifyEmailCode("leitor@example.com","123456","email")).rejects.toThrow("expired");
 });
});
