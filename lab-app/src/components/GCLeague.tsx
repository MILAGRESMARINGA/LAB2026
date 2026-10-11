import {useEffect,useState} from "react";
import {CheckCircle2,Flame,ShieldCheck,Trophy,Users,RefreshCw} from "lucide-react";
import {getGCLeague,setGCCompetition,type GCLeagueEntry} from "../features/lab-game";
import type {ReadingGroup} from "../features/groups";

type Props={userId:string;groups:ReadingGroup[];onGroupsChange:()=>Promise<void>};
const errorText=(e:unknown)=>e instanceof Error?e.message:"Erro ao carregar a liga";
export function GCLeague({userId,groups,onGroupsChange}:Props){
 const [rows,setRows]=useState<GCLeagueEntry[]>([]);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const participating=groups.some(g=>g.competition_opt_in);
 const load=async()=>{
  if(!participating){setRows([]);return}
  setBusy(true);setMessage("");
  try{setRows(await getGCLeague())}
  catch(e){setRows([]);setMessage(errorText(e))}
  finally{setBusy(false)}
 };
 useEffect(()=>{
  if(!participating){setRows([]);return}
  let active=true;
  void getGCLeague().then(data=>{if(active)setRows(data)}).catch(e=>{if(active)setMessage(errorText(e))});
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
     <div className="gc-league-name"><strong>{row.group_name}</strong><span><Users size={13}/>{row.consenting_members} inscritos de {row.members} integrantes</span></div>
     <div className="gc-league-score"><strong>{Number(row.compliance_pct).toLocaleString("pt-BR",{maximumFractionDigits:1})}%</strong><span><Flame size={13}/>{row.days_completed} dias completos</span></div>
    </div>)}</div>}
   {rows.length>0&&<p className="gc-league-period"><CheckCircle2 size={16}/> Período: {new Date(rows[0].window_start+"T12:00:00").toLocaleDateString("pt-BR")} a {new Date(rows[0].window_end+"T12:00:00").toLocaleDateString("pt-BR")}</p>}
  </>}
  <p className="gc-league-footnote">Critério: dias completos confirmados pelos participantes que consentiram ÷ (7 × número de participantes com consentimento). Quem não participa do ranking não reduz a nota do GC. Vídeos e XP extra não influenciam essa classificação.</p>
  {message&&<p className="feedback-message" role="status">{message}</p>}
 </section>;
}
