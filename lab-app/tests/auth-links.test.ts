import {describe,expect,it} from "vitest";
import {
 PUBLIC_APP_ORIGIN,confirmationRedirectUrl,recoveryRedirectUrl,
 authRouteFromPath,authRedirectError
} from "../src/lib/auth-urls";
import {isAuthPage} from "../src/components/AuthFlow";
describe("P0: links de confirmação e recuperação",()=>{
 it("nunca reutiliza localhost nem URLs temporárias da Vercel",()=>{
  expect(PUBLIC_APP_ORIGIN).toBe("https://labgame-biblia.vercel.app");
  expect(confirmationRedirectUrl()).toBe("https://labgame-biblia.vercel.app/auth/callback");
  expect(recoveryRedirectUrl()).toBe("https://labgame-biblia.vercel.app/auth/reset-password");
 });
 it("reconhece as páginas de autenticação, inclusive com barra final",()=>{
  expect(authRouteFromPath("/auth/callback")).toBe("callback");
  expect(authRouteFromPath("/auth/callback/")).toBe("callback");
  expect(authRouteFromPath("/auth/reset-password")).toBe("reset");
  expect(authRouteFromPath("/auth/reset-password/")).toBe("reset");
  expect(authRouteFromPath("/")).toBe("none");
  expect(isAuthPage("/auth/reset-password")).toBe(true);
  expect(isAuthPage("/bible")).toBe(false);
 });
 it("informa que o link expirou usando erros vindos do Supabase",()=>{
  const text=authRedirectError("?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid",""); 
  expect(text).toMatch(/expirou/);
 });
 it("reconhece erros enviados no fragmento de URL",()=>{
  expect(authRedirectError("","#error=access_denied&error_description=Email+link+is+invalid")).toMatch(/inválido/);
 });
 it("não interpreta token de sessão como falha",()=>{
  expect(authRedirectError("","#access_token=abc.def&refresh_token=secret&type=recovery")).toBeNull();
  expect(authRedirectError("?token_hash=somehash&type=email","")).toBeNull();
  expect(authRedirectError("?code=example","")).toBeNull();
 });
 it("não devolve strings arbitrárias ou detalhes de token ao usuário",()=>{
  const msg=authRedirectError("?error_description=secret12345%3A%20something%20wrong","");
  expect(msg).not.toContain("secret12345");
  expect(msg).toContain("link");
 });
});
