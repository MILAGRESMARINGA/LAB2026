import {useEffect,useState} from "react";
import {Bell,CheckCircle2,Flame,ShieldCheck,Trophy,Users,RefreshCw,X} from "lucide-react";
import {getGCLeague,setGCCompetition,type GCLeagueEntry} from "../features/lab-game";
import {getV2GCLeague} from "../features/journey-v2";
import type {ReadingGroup} from "../features/groups";
import {loadNoticePreferencesOnly} from "../features/profile-settings";
import {gcAggregateNoticeStorageKey,GC_AGGREGATE_NOTICE_COPY,saoPauloWeekStart,shouldShowGcAggregateNotice} from "../domain/notification-period";

type Props={userId:string;groups:ReadingGroup[];onGroupsChange:()=>Promise<void>};
const leagueRequest=()=>import.meta.env.VITE_LAB_V2_READY==="true"?getV2GCLeague():getGCLeague();
const errorText=(e:unknown)=>e instanceof Error?e.message:"Erro ao carregar a liga";
export function GCLeague({userId,groups,onGroupsChange}:Props){
 const [rows,setRows]=useState<GCLeagueEntry[]>([]);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [aggregateNotice,setAggregateNotice]=useState(false);
 const participating=groups.some(g=>g.competition_opt_in);
 const aggregateKey=userId?gcAggregateNoticeStorageKey(userId,saoPauloWeekStart(Date.now())):null;
 useEffect(()=>{
  let active=true;
  setAggregateNotice(false);
  if(!participating||!aggregateKey)return()=>{active=false};
  try{if(window.localStorage.getItem(aggregateKey))return()=>{active=false}}catch{/* private browsing */}
  void loadNoticePreferencesOnly().then(preferences=>{
   if(!active||!shouldShowGcAggregateNotice(participating,preferences.enabled,preferences.gc_popup))return;
   try{window.localStorage.setItem(aggregateKey,"shown")}catch{/* private browsing */}
   setAggregateNotice(true);
  }).catch(()=>undefined);
  return()=>{active=false};
 },[aggregateKey,participating]);
 const load=async()=>{
  if(!participating){setRows([]);return}
  setBusy(true);setMessage("");
  try{setRows(await leagueRequest())}
  catch(e){setRows([]);setMessage(errorText(e))}
  finally{setBusy(false)}
 };
 useEffect(()=>{
  if(!participating){setRows([]);return}
  let active=true;
  void leagueRequest().then(data=>{if(active)setRows(data)}).catch(e=>{if(active)setMessage(errorText(e))});
  return()=>{active=false};
 },[participating,groups.map(g=>g.id+":"+g.competition_opt_in).join("|")]);
 const toggle=async(id:string,opt:boolean)=>{
  setBusy(true);setMessage("");
  try{
   await setGCCompetition(id,opt);
   await onGroupsChange();
   setMessage(opt?"GC inscrito na liga de constância.":"GC retirado da liga.");
  }catch(e){setMessage(errorText(e))}
  finally{setBusy(false)}
 };
 return <section className="gc-league" aria-label="Competição entre grupos de crescimento">
  <div className="gc-league-heading"><div className="gc-league-icon"><Trophy size={25}/></div>
   <div><span className="eyebrow">GC CONTRA GC</span><h2>Liga de constância</h2><p>Resultados coletivos dos últimos sete dias. Grupos maiores não ganham vantagem somente pelo tamanho.</p></div>
  </div>
  {aggregateNotice&&<aside className="gc-aggregate-notice" role="status">
   <Bell size={20} aria-hidden="true"/><div><strong>{GC_AGGREGATE_NOTICE_COPY.title}</strong>
    <p>{GC_AGGREGATE_NOTICE_COPY.body}</p></div>
   <button type="button" aria-label="Dispensar aviso coletivo" onClick={()=>setAggregateNotice(false)}><X size={17}/></button>
  </aside>}
  <div className="gc-league-consent">
   <h3><ShieldCheck size={19}/> Participação voluntária dos GCs</h3>
   <p>Somente o líder pode inscrever o GC. Para aparecer na classificação, o grupo precisa ter ao menos três integrantes que permitiram participar de rankings no perfil.</p>
   {groups.map(group=><div className="gc-league-toggle" key={group.id}>
    <div><strong>{group.name}</strong><small>{group.competition_opt_in?"Participação habilitada":"Fora da liga"}</small></div>
    {group.owner_id===userId?<button type="button" disabled={busy} className={group.competition_opt_in?"leave":""} onClick={()=>void toggle(group.id,!group.competition_opt_in)}>
     {group.competition_opt_in?"Sair da liga":"Inscrever GC"}
    </button>:<span className="gc-league-status">{group.competition_opt_in?"Inscrito":"Não inscrito"}</span>}
   </div>)}
  </div>
  {participating&&<><div className="gc-league-toolbar"><h3>Classificação semanal</h3><button type="button" disabled={busy} onClick={()=>void load()}><RefreshCw size={16}/> Atualizar</button></div>
   {rows.length===0?<p className="muted">Ainda não há GCs elegíveis nesta semana. São necessários ao menos três participantes com consentimento em cada GC.</p>:
    <div className="gc-league-table">{rows.map(row=><div className="gc-league-row" key={row.group_id}>
     <strong className="gc-league-position">{row.rank_position}º</strong>
     <div className="gc-league-name"><strong>{row.group_name}</strong><span><Users size={13}/>{row.consenting_members} inscritos de {row.members} integrantes</span><span>Média: {Number(row.average_xp_per_member??0).toLocaleString("pt-BR",{maximumFractionDigits:1})} XP por membro</span></div>
     <div className="gc-league-score"><strong>{Number(row.score??row.consistency_pct??row.compliance_pct??0).toLocaleString("pt-BR",{maximumFractionDigits:1})}</strong><span><Flame size={13}/>{Number(row.consistency_pct??row.compliance_pct??0).toLocaleString("pt-BR",{maximumFractionDigits:1})}% constância</span><small>{row.consistency_multiplier?"×"+Number(row.consistency_multiplier).toLocaleString("pt-BR",{maximumFractionDigits:2}):""}</small></div>
    </div>)}</div>}
   {rows.length>0&&<p className="gc-league-period"><CheckCircle2 size={16}/> Período: {new Date(rows[0].window_start+"T12:00:00").toLocaleDateString("pt-BR")} a {new Date(rows[0].window_end+"T12:00:00").toLocaleDateString("pt-BR")}</p>}
  </>}
  <p className="gc-league-footnote">Critério justo: média de XP por membro elegível × multiplicador de constância e disciplina coletiva. O tamanho do GC não gera vantagem por volume bruto; quem não consente fica fora do denominador. O servidor calcula leitura, estudo e vídeo com idempotência.</p>
  {message&&<p className="feedback-message" role="status">{message}</p>}
 </section>;
}
