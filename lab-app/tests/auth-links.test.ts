import {describe,expect,it} from "vitest";
import {
 PUBLIC_APP_ORIGIN,LAB_REBUILD_APP_ORIGIN,resolvePublicAppOrigin,confirmationRedirectUrl,recoveryRedirectUrl,recoveryAfterOtpPath,
 authRouteFromPath,authRedirectError
} from "../src/lib/auth-urls";
import {isAuthPage} from "../src/components/AuthFlow";
describe("P0: links de confirmação e recuperação",()=>{
 it("usa a origem canônica do ambiente nos links de confirmação e recuperação",()=>{
  expect([ "https://labgame-biblia.vercel.app",LAB_REBUILD_APP_ORIGIN]).toContain(PUBLIC_APP_ORIGIN);
  expect(confirmationRedirectUrl()).toBe(PUBLIC_APP_ORIGIN+"/auth/callback");
  expect(recoveryRedirectUrl()).toBe(PUBLIC_APP_ORIGIN+"/auth/reset-password");
  expect(PUBLIC_APP_ORIGIN).not.toContain("localhost");
 });
 it("usa sempre o alias estável da branch de desenvolvimento e nunca o site antigo",()=>{
  const previous="https://labgame-biblia.vercel.app";
  const branchHost=new URL(LAB_REBUILD_APP_ORIGIN).hostname;
  expect(resolvePublicAppOrigin(previous,branchHost)).toBe(LAB_REBUILD_APP_ORIGIN);
  expect(resolvePublicAppOrigin(previous,"labgame-biblia-clucu9isf-antonios-projects-0bf892e8.vercel.app"))
   .toBe(LAB_REBUILD_APP_ORIGIN);
  expect(resolvePublicAppOrigin(previous,"labgame-biblia.vercel.app")).toBe(previous);
  expect(resolvePublicAppOrigin(previous,"localhost")).toBe(previous);
  expect(resolvePublicAppOrigin(previous,"attacker.example")).toBe(previous);
  expect(resolvePublicAppOrigin("http://unsafe.example","attacker.example")).toBe(previous);
  expect(resolvePublicAppOrigin("https://unsafe.example/path","attacker.example")).toBe(previous);
 });
 it("preserva a mesma origem após código OTP, inclusive em preview/PWA",()=>{
  const path=recoveryAfterOtpPath();
  expect(path).toBe("/auth/reset-password");
  expect(new URL(path,"https://preview.example").origin).toBe("https://preview.example");
  expect(new URL(path,"https://labgame-biblia.vercel.app").pathname).toBe("/auth/reset-password");
  expect(path).not.toContain("https://");
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
