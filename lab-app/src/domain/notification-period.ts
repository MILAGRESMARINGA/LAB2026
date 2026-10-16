/** Monday date for the current Sao Paulo calendar week, used only to rate-limit UI hints. */
export function saoPauloWeekStart(now:number):string{
 const parts=new Intl.DateTimeFormat("en-US",{
  timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"
 }).formatToParts(new Date(now));
 const value=(kind:string)=>parts.find(part=>part.type===kind)?.value??"";
 const date=new Date(Date.UTC(Number(value("year")),Number(value("month"))-1,Number(value("day")),12));
 const daysSinceMonday=(date.getUTCDay()+6)%7;
 date.setUTCDate(date.getUTCDate()-daysSinceMonday);
 return date.toISOString().slice(0,10);
}
