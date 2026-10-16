/**
 * UI-only plan discovery. The PostgreSQL RPC is authoritative and independently
 * rejects a 366-step cycle outside Jan 1 of a leap year in São Paulo.
 * Never trust the local clock for a security-sensitive transition.
 */
export function brazilianLeapDayStartAvailable(at:Date):boolean{
 if(!Number.isFinite(at.getTime()))return false;
 const parts=new Intl.DateTimeFormat("en-US",{
  timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"
 }).formatToParts(at);
 const year=Number(parts.find(x=>x.type==="year")?.value);
 const month=Number(parts.find(x=>x.type==="month")?.value);
 const day=Number(parts.find(x=>x.type==="day")?.value);
 return month===1&&day===1&&year%4===0&&(year%100!==0||year%400===0);
}
