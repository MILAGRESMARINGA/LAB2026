/**
 * Auth links have one stable origin per release channel:
 * production stays on the published domain; LABGAME 3.0 preview stays on the
 * branch alias, even when opened from a short-lived Vercel deployment URL.
 * Never trust an arbitrary query parameter, Referer or unrecognized host.
 */
export const PRODUCTION_APP_ORIGIN="https://labgame-biblia.vercel.app";
export const LAB_REBUILD_APP_ORIGIN="https://labgame-biblia-git-lab-rebuild-2026-antonios-projects-0bf892e8.vercel.app";

export function resolvePublicAppOrigin(configured:string|undefined,hostname:string|undefined):string{
 const current=(hostname||"").toLowerCase();
 const branchHost=new URL(LAB_REBUILD_APP_ORIGIN).hostname;
 const isBranch=current===branchHost;
 const isKnownPreview=/^labgame-biblia-[a-z0-9]+-antonios-projects-0bf892e8\.vercel\.app$/.test(current);
 if(isBranch||isKnownPreview)return LAB_REBUILD_APP_ORIGIN;
 try{
  const origin=new URL((configured||PRODUCTION_APP_ORIGIN).trim());
  if(origin.protocol!=="https:"||origin.username||origin.password||
    origin.search||origin.hash||origin.pathname!=="/")
   throw Error("Invalid auth origin");
  return origin.origin;
 }catch{
  return PRODUCTION_APP_ORIGIN;
 }
}

export const PUBLIC_APP_ORIGIN=resolvePublicAppOrigin(
 import.meta.env.VITE_PUBLIC_APP_URL,
 typeof window==="undefined"?undefined:window.location.hostname
);
export const confirmationRedirectUrl=()=>PUBLIC_APP_ORIGIN+"/auth/callback";
export const recoveryRedirectUrl=()=>PUBLIC_APP_ORIGIN+"/auth/reset-password";
/**
 * After a user verifies the 6-digit OTP inside the already-open app, the
 * Supabase session is stored at THAT browser origin. Navigate by relative
 * path to preserve the session (unlike emailed links which must be canonical).
 */
export const recoveryAfterOtpPath=()=>"/auth/reset-password";
export type AuthRoute="callback"|"reset"|"none";
export function authRouteFromPath(pathname:string):AuthRoute{
 if(pathname==="/auth/callback"||pathname==="/auth/callback/")return "callback";
 if(pathname==="/auth/reset-password"||pathname==="/auth/reset-password/")return "reset";
 return "none";
}
/** Supabase may return a description through either query or fragment. */
export function authRedirectError(search:string,hash:string):string|null{
 const query=new URLSearchParams(search.startsWith("?")?search.slice(1):search);
 const fragment=new URLSearchParams(hash.startsWith("#")?hash.slice(1):hash);
 const code=query.get("error_code")||fragment.get("error_code");
 const raw=query.get("error_description")||fragment.get("error_description")||
  query.get("error")||fragment.get("error");
 if(!raw&&!code)return null;
 const detail=[code,raw].filter(Boolean).join(" ").toLowerCase();
 if(/expired|otp_expired|invalid|token.*invalid|access.denied/i.test(detail))
  return "O link expirou, já foi utilizado ou é inválido. Solicite um novo e-mail de confirmação ou recuperação.";
 if(/rate.limit|too.many/i.test(detail))
  return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e solicite outro link.";
 return "Não foi possível validar o link enviado por e-mail. Solicite um novo link.";
}
