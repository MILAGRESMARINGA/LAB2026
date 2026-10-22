import {useState} from "react";
import {JourneyRules} from "./JourneyRules";
import {BiblicalWorldMap} from "./BiblicalWorldMap";
import {
 ArrowRight,Award,BookOpen,Crown,Flame,
 Gift,Leaf,Medal,Sparkles,Star
} from "lucide-react";
import type {GameDay} from "../domain/game-plan";
import {ConsistencyFlame} from "./ConsistencyFlame";
import {GAME_DAYS} from "../domain/game-plan";
import type {LabGameState} from "../features/lab-game";
import {individualMilestone,nextIndividualMilestone} from "../domain/progression-v3";
import {
 earnedTalentMilestones,FRUIT_OF_THE_SPIRIT,
 nextTalentMilestone,SPIRITUAL_GIFTS_EXAMPLES
} from "../domain/journey-rewards";

type Props={
 plan:ReadonlyArray<GameDay>;
 game:LabGameState|null;
 totalXP:number;
 preview?:boolean;
 onStart:()=>void;
 onUpgrade?:()=>void;
 onRestart?:()=>void;
 onExploreBible?:()=>void;
};
type Detail={kind:"talentos";day:number}|{kind:"dons"}|{kind:"galardao"}|null;
export function ChallengeJourney({plan,game,totalXP,preview=false,onStart,onUpgrade,onRestart,onExploreBible}:Props){
 const [detail,setDetail]=useState<Detail>(null);
 const activeDay=Math.max(1,Math.min(GAME_DAYS,game?.day??1));
 const stage=plan[activeDay-1];
 const completedDays=Math.max(0,game?.completed_days??0);
 const bestDays=Math.max(0,game?.best_days??0);
 const milestones=earnedTalentMilestones(bestDays);
 const personalBadge=individualMilestone(totalXP);
 const nextBadge=nextIndividualMilestone(totalXP);
 const upcoming=nextTalentMilestone(bestDays);
 const checked=game?.checked??[];
 const done=game!==null&&(game.finished===true||completedDays>=activeDay||stage.chapters.every(ch=>checked.includes(ch.id)));
 const finished=Boolean(game?.finished);
 const chaptersDone=stage.chapters.filter(ch=>checked.includes(ch.id)).length;
 const currentPct=Math.round(chaptersDone/stage.chapters.length*100);
 const showDetail=(next:Detail)=>{
  setDetail(prev=>JSON.stringify(prev)===JSON.stringify(next)?null:next);
 };
 return <section className="lab-quest" aria-label="Trilha gamificada de leitura anual">
  <div className="lab-quest-progress" aria-label={completedDays+" de "+GAME_DAYS+" etapas concluídas na tentativa atual"}>
   <div className="lab-quest-progress-copy"><span>CAMINHO DE LEITURA</span><strong>{completedDays} <span>/ {GAME_DAYS} dias</span></strong></div>
   <div className="lab-quest-progress-track" role="progressbar" aria-valuenow={completedDays} aria-valuemin={0} aria-valuemax={GAME_DAYS} aria-label="Progresso da jornada atual"><div style={{width:(completedDays/GAME_DAYS*100)+"%"}}/></div>
   <Crown size={21} aria-hidden="true"/>
  </div>
  <ConsistencyFlame completedDays={completedDays} status={finished?"completed":game?"active":"inactive"}/>
  <div className="lab-quest-feature">
   <span className="lab-quest-eyebrow">ETAPA {activeDay} · {finished?"PLANO CONCLUÍDO":done?"LEITURA REGISTRADA":"DESAFIO DE HOJE"}</span>
   <h1>{finished?"Toda a Bíblia. Uma jornada concluída.":done?"Seu desafio de hoje está completo.":activeDay===1?"Sua jornada começa aqui.":"Continue sua jornada."}</h1>
   <p>{finished?"Os 1.189 capítulos foram concluídos nesta jornada.":"Leia os capítulos do dia no seu ritmo e registre a leitura ao final."}</p>
   <div className="lab-quest-pills" aria-label="Capítulos da etapa">{stage.chapters.map(ch=><span key={ch.id}><BookOpen size={14} aria-hidden="true"/>{ch.book} {ch.chapter}</span>)}</div>
   <div className="lab-quest-feature-progress"><span>Capítulos confirmados</span><strong>{chaptersDone}/{stage.chapters.length}</strong></div>
   <div className="lab-quest-feature-line" aria-hidden="true"><span style={{width:currentPct+"%"}}/></div>
  </div>
  <div className="lab-quest-overview" aria-label="Seu progresso e suas recompensas de estudo">
   <div><Flame size={17}/><strong>{completedDays}</strong><span>constância atual</span></div>
   <div><Award size={17}/><strong>{totalXP}</strong><span>XP validado</span></div>
   <div><Gift size={17}/><strong>{milestones}</strong><span>Talentos</span></div>
  </div>
  <div className={"lab-quest-personal-award "+(personalBadge?"unlocked tier-"+personalBadge.metal.toLowerCase():"pending")} aria-label="Conquista por pontuação individual">
   <span className="lab-quest-award-icon"><Medal size={26} aria-hidden="true"/></span>
   <div>
    <span className="lab-quest-eyebrow">MÉRITO DE CONSTÂNCIA INDIVIDUAL</span>
    <strong>{personalBadge?personalBadge.title:"Conquista futura"}</strong>
    <p>{personalBadge?"Medalha "+personalBadge.metal+" por XP pessoal confirmado. Seu desempenho não depende do GC.":"Uma conquista será revelada ao atingir 1.000 XP pessoais."}</p>
    {nextBadge&&<small>Próximo nível: {nextBadge.minimum.toLocaleString("pt-BR")} XP</small>}
   </div>
  </div>
  <div className="lab-quest-map-heading">
   <div><span className="lab-quest-eyebrow">A TRILHA</span><h2>Um dia de cada vez</h2></div>
   <span className="lab-quest-map-hint">365 etapas</span>
  </div>
  <JourneyRules mode={preview?"demo":"legacy"} onUpgrade={onUpgrade}/>
  <BiblicalWorldMap readLabel={preview?"CRIAR CONTA E COMEÇAR":"INICIAR LEITURA"} completedMessage="Concluído. Próxima etapa amanhã." readingAvailable={!done} stage={activeDay} completedStages={completedDays} chapters={stage.chapters.map(ch=>({chapter_id:ch.id}))} plan={plan} onRead={onStart}/>
  <button type="button" className="secondary-cta" onClick={()=>showDetail({kind:"dons"})}>Dons e fruto do Espírito · estudo opcional</button>
  {detail&&<div className="lab-quest-detail" id="lab-quest-reward-detail" aria-live="polite">
   {detail.kind==="talentos"?<>
    <span className="lab-quest-eyebrow"><Sparkles size={14}/> TALENTOS · {detail.day} DIAS</span>
    <h3>{bestDays>=detail.day?"Marco conquistado: cuide do que recebeu":"Próximo marco de leitura"}</h3>
    <p>{bestDays>=detail.day?"Reflita: como posso administrar meu tempo e meus dons com fidelidade e servir ao próximo?":"Este baú registra sua constância quando a sequência de "+detail.day+" dias for alcançada. Não concede XP adicional."}</p>
    <small>Para meditar: Mateus 25:14–30. O símbolo não representa mérito espiritual.</small>
   </>:detail.kind==="dons"?<>
    <span className="lab-quest-eyebrow"><Leaf size={14}/> FORMAÇÃO BÍBLICA · SEM XP</span>
    <h3>Dons espirituais e fruto do Espírito</h3>
    <p>Os dons são concedidos pelo Espírito conforme a vontade de Deus; não são desbloqueados por pontuação. O fruto diz respeito ao caráter formado na vida cristã.</p>
    <strong>Dons espirituais — exemplos (1 Coríntios 12:8–10)</strong>
    <div className="lab-quest-tags">{SPIRITUAL_GIFTS_EXAMPLES.map(value=><span key={value}>{value}</span>)}</div>
    <strong>Fruto do Espírito (Gálatas 5:22–23)</strong>
    <div className="lab-quest-tags">{FRUIT_OF_THE_SPIRIT.map(value=><span key={value}>{value}</span>)}</div>
    {onExploreBible&&<button type="button" className="lab-quest-detail-action" onClick={onExploreBible}>ABRIR A BÍBLIA <ArrowRight size={15}/></button>}
   </>:<>
    <span className="lab-quest-eyebrow"><Crown size={14}/> GALARDÃO DA JORNADA</span>
    <h3>{finished?"365 etapas concluídas!":"Uma meta para seguir com constância"}</h3>
    <p>A coroa celebra simbolicamente a conclusão da leitura integral. O jogo não mede santidade nem promete galardões eternos.</p>
    <small>Referência para reflexão: 2 Timóteo 4:7–8.</small>
   </>}
  </div>}
  <div className="lab-quest-finale">
   <div className="lab-quest-crown"><Crown size={26} aria-hidden="true"/></div>
   <div><span className="lab-quest-eyebrow">META FINAL</span><strong>O Galardão</strong>
    <p>{finished?"Veste do Peregrino · insígnia simbólica de conclusão alcançada.":"Uma insígnia será revelada ao concluir as 365 etapas."}</p></div>
   <button type="button" aria-label="Entenda o Galardão" aria-controls="lab-quest-reward-detail" aria-expanded={detail?.kind==="galardao"} onClick={()=>showDetail({kind:"galardao"})}><ArrowRight size={19}/></button>
  </div>
  <p className="lab-quest-footnote"><Star size={13}/> Os marcos registram apenas leitura. Dons espirituais não são distribuídos pelo aplicativo. {upcoming?"Próximo baú: "+upcoming+" dias de constância.":"Todos os marcos semanais registrados."}</p>
  {finished&&onRestart&&<button type="button" className="secondary-cta lab-quest-restart" onClick={onRestart}>INICIAR NOVO CICLO <ArrowRight size={16}/></button>}
 </section>;
}
