/**
 * One canonical public origin for all Supabase email links.
 * Never derive links from a Vercel preview, localhost, or a WebView origin.
 */
export const PUBLIC_APP_ORIGIN=(()=>{
 const configured=(import.meta.env.VITE_PUBLIC_APP_URL||"https://labgame-biblia.vercel.app").trim();
 try{
  const url=new URL(configured);
  if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash)
   throw new Error("Public URL must be HTTPS");
  return url.origin;
 }catch{
  return "https://labgame-biblia.vercel.app";
 }
})();
export const confirmationRedirectUrl=()=>PUBLIC_APP_ORIGIN+"/auth/callback";
export const recoveryRedirectUrl=()=>PUBLIC_APP_ORIGIN+"/auth/reset-password";
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
