import {useCallback,useEffect,useState} from "react";
import {Award,BookOpen,Flame,Medal,RefreshCw,ShieldCheck,Trophy,Users,UserRound} from "lucide-react";
import {groupMilestones} from "../domain/progression-v3";
import {getGameRanking,loadGroupSummary,type GCGroupSummary,type LabRankingEntry} from "../features/lab-game";
import type {ReadingGroup} from "../features/groups";
type Props={group:ReadingGroup;userId:string;onPersonalProfile:()=>void};
const errorText=(e:unknown)=>e instanceof Error?e.message:"Não foi possível abrir o perfil do GC";
export function GCProfile({group,userId,onPersonalProfile}:Props){
 const [summary,setSummary]=useState<GCGroupSummary|null>(null);
 const [ranking,setRanking]=useState<LabRankingEntry[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const refresh=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const [info,people]=await Promise.all([
    loadGroupSummary(group.id),getGameRanking(group.id)
   ]);
   setSummary(info);setRanking(people);
  }catch(e){setSummary(null);setRanking([]);setError(errorText(e))}
  finally{setLoading(false)}
 },[group.id]);
 useEffect(()=>{void refresh()},[refresh]);
 const percent=Number(summary?.compliance_pct??0);
 const perfectWeek=summary?groupMilestones({consentingMembers:summary.consenting_members,completedMemberDays7:summary.completed_member_days_7,compliancePct:percent}).perfectWeek:false;
 return <article className="gc-profile" aria-label={"Perfil do grupo "+group.name}>
  <div className="gc-profile-top">
   <div className="gc-profile-symbol"><Users size={29}/></div>
   <div className="gc-profile-identity">
    <span className="eyebrow">PERFIL DO GRUPO DE CRESCIMENTO</span>
    <h2>{group.name}</h2>
    <p>{group.owner_id===userId?"Você é líder deste GC.":"Você participa deste GC."} {group.competition_opt_in?"Grupo inscrito na Liga de Constância.":"Grupo fora da Liga de Constância."}</p>
   </div>
  </div>
  <div className="gc-profile-actions">
   <button type="button" className="secondary-cta" disabled={loading} onClick={()=>void refresh()}><RefreshCw size={16}/> {loading?"CARREGANDO...":"ATUALIZAR PERFIL"}</button>
   <button type="button" className="secondary-cta" onClick={onPersonalProfile}><UserRound size={16}/> MEU PERFIL</button>
  </div>
  {error&&<p role="alert" className="feedback-message">{error}</p>}
  {summary&&<>
   <div className="gc-profile-stats">
    <div><Users size={21}/><strong>{summary.members}</strong><span>Integrantes</span></div>
    <div><ShieldCheck size={21}/><strong>{summary.consenting_members}</strong><span>No ranking</span></div>
    <div><BookOpen size={21}/><strong>{summary.completed_member_days_7}</strong><span>Dias completos/7d</span></div>
    <div><Trophy size={21}/><strong>{percent.toLocaleString("pt-BR",{maximumFractionDigits:1})}%</strong><span>Assiduidade</span></div>
   </div>
   {perfectWeek&&<div className="gc-achievement" role="status"><Medal size={22} aria-hidden="true"/><div><strong>Constância coletiva · 100%</strong><p>Seu GC alcançou 100% de leituras completas na janela semanal entre os integrantes participantes do ranking. Esta insígnia coletiva não altera o XP individual.</p></div></div>}
   <div className="gc-profile-formula">
    <h3>Como a classificação do GC é calculada?</h3>
    <p><strong>{summary.completed_member_days_7}</strong> dias completos ÷ (7 × <strong>{summary.consenting_members}</strong> participantes que consentiram) × 100 = <strong>{percent.toLocaleString("pt-BR",{maximumFractionDigits:1})}%</strong>.</p>
    <small>Janela: {new Date(summary.window_start+"T12:00:00").toLocaleDateString("pt-BR")} a {new Date(summary.window_end+"T12:00:00").toLocaleDateString("pt-BR")}. Apenas dias com todos os capítulos confirmados entram na conta; vídeos não alteram esse percentual.</small>
   </div>
  </>}
  <div className="gc-profile-ranking">
   <span className="eyebrow">CLASSIFICAÇÃO INDIVIDUAL NO GC</span>
   <h3>Ranking dos leitores</h3>
   <p className="muted">Ordem: melhor sequência → total de dias concluídos → XP acumulado. Só aparecem participantes que ativaram a participação no ranking.</p>
   {loading?<p className="muted">Carregando as classificações...</p>:ranking.length===0?<p className="muted">Ainda não há participantes que autorizaram aparecer neste ranking. Ative essa opção no seu perfil pessoal.</p>:
    <div className="gc-profile-people">{ranking.map((entry,index)=><div className="gc-profile-person" key={index}>
     <strong className="gc-profile-rank">#{index+1}</strong>
     <span className="gc-profile-reader">{entry.participant}</span>
     <div className="gc-profile-person-stats">
      <span><Flame size={14}/>{entry.best_days} dias</span>
      <span><BookOpen size={14}/>{entry.completed_days} dias totais</span>
      <span><Award size={14}/>{entry.total_xp} XP</span>
     </div>
    </div>)}</div>}
  </div>
 </article>;
}
