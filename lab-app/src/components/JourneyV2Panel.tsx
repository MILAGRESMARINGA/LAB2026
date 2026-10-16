import {useCallback,useEffect,useMemo,useState} from "react";
import {BookOpen,CheckCircle2,Clock3,Crown,Flame,RotateCcw,ShieldCheck,Trophy} from "lucide-react";
import {CHAPTERS} from "../domain/canon";
import {BibleReader} from "./BibleReader";
import {DailyInAppPopup} from "./DailyInAppPopup";
import {
 activateJourneyV2,confirmJourneyV2Chapter,getJourneyV2Chapters,
 getJourneyV2Checks,loadLatestJourneyV2,startJourneyV2,
 type JourneyV2Chapter,type JourneyV2State
} from "../features/journey-v2";

type Props={userId:string;onState?:(state:JourneyV2State|null)=>void};
const dateBR=(iso:string)=>{
 const dt=new Date(iso);
 return new Intl.DateTimeFormat("pt-BR",{
  timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",
  hour:"2-digit",minute:"2-digit"
 }).format(dt);
};
function duration(ms:number){
 if(ms<=0)return "00:00:00";
 const sec=Math.floor(ms/1000),hours=Math.floor(sec/3600);
 return [hours,Math.floor(sec%3600/60),sec%60].map(n=>String(n).padStart(2,"0")).join(":");
}
const chapterName=(id:string)=>{
 const c=CHAPTERS.find(c=>c.id===id);
 return c?c.book+" "+c.chapter:id;
};
export function JourneyV2Panel({userId,onState}:Props){
 const [game,setGame]=useState<JourneyV2State|null>(null);
 const [chapters,setChapters]=useState<JourneyV2Chapter[]>([]);
 const [checked,setChecked]=useState<string[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[accept,setAccept]=useState(false);
 const [clock,setClock]=useState(Date.now()),[serverOffset,setServerOffset]=useState(0);
 const update=useCallback((next:JourneyV2State|null)=>{
  setGame(next);onState?.(next);
  if(next?.server_at)setServerOffset(Date.parse(next.server_at)-Date.now());
 },[onState]);
 const refresh=useCallback(async()=>{
  setError("");
  try{
   const next=await loadLatestJourneyV2();
   update(next);
   if(next&&next.stage!==null){
    const [stageChapters,confirmed]=await Promise.all([
     getJourneyV2Chapters(next.plan_length,next.stage),
     getJourneyV2Checks(next.run_id,next.stage)
    ]);
    setChapters(stageChapters);setChecked(confirmed);
    setSelected(prev=>stageChapters.some(c=>c.chapter_id===prev&&!confirmed.includes(c.chapter_id))
     ?prev:stageChapters.find(c=>!confirmed.includes(c.chapter_id))?.chapter_id??null);
   }else{setChapters([]);setChecked([]);setSelected(null)}
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível consultar a Jornada V2.")}
  finally{setLoading(false)}
 },[update]);
 useEffect(()=>{setGame(null);setChapters([]);setChecked([]);setAccept(false);setLoading(true);void refresh()},[userId,refresh]);
 useEffect(()=>{
  const timer=window.setInterval(()=>setClock(Date.now()),1000);
  return()=>window.clearInterval(timer);
 },[]);
 const checkedSet=useMemo(()=>new Set(checked),[checked]);
 const currentTotal=chapters.length;
 const confirmedCount=chapters.filter(c=>checkedSet.has(c.chapter_id)).length;
 const stageFinished=game?.completed_at!==null&&game?.completed_at!==undefined;
 const now=clock+serverOffset;
 const deadline=game?.normal_deadline_at?Date.parse(game.normal_deadline_at):null;
 const grace=game?.grace_deadline_at?Date.parse(game.grace_deadline_at):null;
 const eligible=game?.next_eligible_at?Date.parse(game.next_eligible_at):null;
 const canNext=Boolean(game?.status==="active"&&stageFinished&&eligible!==null&&now>=eligible&&
  (game.stage??0)<(game.plan_length??0));
 const newStage=game?.status==="active"&&game.stage===null;
 const process=async(fn:()=>Promise<JourneyV2State>)=>{
  setBusy(true);setError("");
  try{update(await fn());await refresh()}
  catch(e){setError(e instanceof Error?e.message:"Não foi possível confirmar no servidor.")}
  finally{setBusy(false)}
 };
 const begin=()=>{if(!accept||busy)return;void process(()=>startJourneyV2(365))};
 const next=()=>{
  if(!game||busy)return;
  void process(()=>activateJourneyV2(game.run_id,(game.stage??0)+1));
 };
 const read=()=>{
  if(!game||!selected||busy)return;
  void process(()=>confirmJourneyV2Chapter(game.run_id,game.stage??0,selected));
 };
 if(loading)return <section className="game-panel" aria-live="polite"><p className="muted">Carregando Jornada V2 protegida...</p></section>;
 return <><DailyInAppPopup userId={userId} day={game?.stage??null}
  today={new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(clock))}
  readingComplete={Boolean(stageFinished||game?.status!=="active")}
  visibleOnJourney={Boolean(game?.status==="active"&&game.stage!==null)}
  onRead={()=>document.querySelector(".v2-reading")?.scrollIntoView({behavior:"smooth",block:"start"})}/>
 <section className="game-panel journey-v2" aria-label="Jornada Bíblica V2">
  <span className="eyebrow">LEITURA ANUAL · NOVO REGULAMENTO</span>
  <h1>Sua Jornada. <em>Um capítulo de cada vez.</em></h1>
  <p className="muted">3 ou 4 capítulos por etapa · 24 horas a partir da ativação · 6 horas de tolerância · 3 vidas mensais.</p>
  {error&&<p role="alert" className="feedback-message">{error}</p>}
  {!game&&<div className="v2-start" aria-label="Iniciar Jornada V2">
   <h2><BookOpen size={23}/> Começar em Gênesis</h2>
   <p>O plano contém 365 etapas e os 1.189 capítulos da Bíblia. A primeira etapa só começa quando você clicar em ativar.</p>
   <p className="muted">Se você possui uma tentativa anterior em andamento, ela será encerrada e arquivada. Seu recorde e suas conquistas permanecem no histórico, sem transferir XP à nova sequência.</p>
   <label className="v2-consent"><input type="checkbox" checked={accept} onChange={e=>setAccept(e.target.checked)}/> Entendo que a Jornada V2 começa em zero XP e substitui minha tentativa em andamento.</label>
   <button className="primary-cta" disabled={!accept||busy} type="button" onClick={begin}>COMEÇAR NOVA JORNADA</button>
  </div>}
  {game&&<><div className="v2-scorecards">
   <div><Flame size={22}/><strong>{game.completed_stages??0}</strong><span>Etapas nesta tentativa</span></div>
   <div><Trophy size={22}/><strong>{game.best_completed_stages}</strong><span>Recorde a superar</span></div>
   <div><ShieldCheck size={22}/><strong>{game.remaining_lives_this_month}</strong><span>Vidas deste mês</span></div>
   <div><Crown size={22}/><strong>{game.completed_bibles_historical??0}</strong><span>Bíblias concluídas</span></div>
  </div><p className="v2-run-xp"><strong>{game.run_xp.toLocaleString("pt-BR")} XP</strong> nesta tentativa · os pontos antigos não são somados.</p></>}
  {game?.status==="failed"&&<div className="v2-start" role="status">
   <h2>Essa tentativa terminou.</h2>
   <p>O relógio e as vidas se esgotaram. O seu recorde continua guardado como uma marca a superar.</p>
   <button type="button" className="primary-cta" disabled={busy} onClick={()=>void process(()=>startJourneyV2(365))}><RotateCcw size={18}/> RECOMEÇAR EM GÊNESIS 1</button>
  </div>}
  {game?.status==="completed"&&<div className="v2-start" role="status">
   <h2><Crown size={27}/> Bíblia completa!</h2>
   <p>Você concluiu todas as etapas e leu os 1.189 capítulos. O próximo ciclo começará com zero XP, sem apagar esta conquista.</p>
   {game.cycle_award&&<p><strong>Coroa {game.cycle_award.cycle_number}</strong> · bônus +{game.cycle_award.bonus_xp.toLocaleString("pt-BR")} XP{game.cycle_award.perfect_constancy?" · Constância perfeita":""}</p>}
   <button type="button" className="primary-cta" disabled={busy} onClick={()=>void process(()=>startJourneyV2(365))}><RotateCcw size={18}/> INICIAR PRÓXIMA BÍBLIA</button>
  </div>}
  {game?.status==="active"&&<div className="v2-current">
   {newStage?<div className="v2-start">
    <h2>Etapa 1 pronta</h2>
    <p>Seu prazo de 24 horas começará quando você ativar a etapa. Não será possível pular capítulos.</p>
    <button className="primary-cta" type="button" disabled={busy} onClick={()=>void process(()=>activateJourneyV2(game.run_id,1))}>ATIVAR LEITURA DE HOJE</button>
   </div>:<>
    <div className="v2-stage-head"><h2>Etapa {game.stage} de {game.plan_length}</h2><span>{confirmedCount}/{currentTotal} capítulos</span></div>
    <div className="v2-progress" role="progressbar" aria-label="Capítulos confirmados" aria-valuemin={0} aria-valuemax={currentTotal||4} aria-valuenow={confirmedCount}>
     <div style={{width:(currentTotal?confirmedCount/currentTotal*100:0)+"%"}}/>
    </div>
    {deadline&&grace&&<div className="v2-clock" role="status">
     <Clock3 size={21}/>
     <div><strong>{now<=deadline?"Prazo normal":now<=grace?"Carência com desconto de XP":"Recuperação com vidas"}</strong>
      <span>{now<=deadline?duration(deadline-now):now<=grace?duration(grace-now):"Consulte o saldo de vidas e o servidor"}</span>
      <small>Prazo normal: {dateBR(game.normal_deadline_at!)} · Carência: {dateBR(game.grace_deadline_at!)}</small>
     </div>
    </div>}
    <div className="v2-chapters" aria-label="Capítulos obrigatórios desta etapa">
     {chapters.map(ch=><button key={ch.chapter_id} type="button"
      className={checkedSet.has(ch.chapter_id)?"v2-read":selected===ch.chapter_id?"v2-selected":""}
      disabled={busy||checkedSet.has(ch.chapter_id)}
      onClick={()=>setSelected(ch.chapter_id)}>
      {checkedSet.has(ch.chapter_id)?<CheckCircle2 size={18}/>:<BookOpen size={18}/>}
      {chapterName(ch.chapter_id)}
     </button>)}
    </div>
    {!stageFinished&&selected&&!checkedSet.has(selected)&&
     <div className="v2-reading" key={selected}>
      <BibleReader chapterId={selected} busy={busy} onConfirm={read}/>
     </div>}
    {stageFinished&&<div className="v2-start" role="status">
     <h3><CheckCircle2 size={23}/> Etapa completa!</h3>
     <p>Os capítulos foram confirmados. Vídeos e estudos são opcionais e não bloqueiam sua próxima etapa.</p>
     {canNext?<button type="button" className="primary-cta" disabled={busy} onClick={next}>INICIAR PRÓXIMA ETAPA</button>:
      <p className="muted">Próxima etapa disponível {game.next_eligible_at?dateBR(game.next_eligible_at):"após a janela de 24 horas"}{eligible&&now<eligible?" · faltam "+duration(eligible-now):""}.</p>}
    </div>}
   </>}
  </div>}
 </section></>;
}
