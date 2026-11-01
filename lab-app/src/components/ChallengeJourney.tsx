import type {BibleProjectResource} from "../domain/bibleproject";
import type {GameDay} from "../domain/game-plan";
import type {LabGameState} from "../features/lab-game";
import {BiblicalWorldMap} from "./BiblicalWorldMap";
import {ConsistencyFlame} from "./ConsistencyFlame";
type Props={plan:ReadonlyArray<GameDay>;game:LabGameState|null;totalXP:number;preview?:boolean;onVideo?:(resource:BibleProjectResource,book:string)=>void;onStart:()=>void;onUpgrade?:()=>void;onRestart?:()=>void;onExploreBible?:()=>void};
export function ChallengeJourney({plan,game,preview=false,onStart,onUpgrade,onRestart,onVideo}:Props){
 const current=Math.max(1,Math.min(plan.length,game?.day??1)),day=plan[current-1];
 if(!day)return <section className="journey-clean"><p role="status">O plano de leitura ainda não está disponível.</p></section>;
 const done=Boolean(game&&(game.finished||(game.completed_days??0)>=current||day.chapters.every(ch=>game.checked.includes(ch.id))));
 return <section className="journey-clean" aria-label="Jornada de leitura">
  <header className="journey-clean-hud"><div className="journey-clean-title"><h1>Etapa {current}</h1><ConsistencyFlame compact completedDays={game?.completed_days??0} status={game?.finished?"completed":game?"active":"inactive"}/></div><p>{day.chapters.map(ch=>`${ch.book} ${ch.chapter}`).join(' · ')}</p><div><span>{day.chapters.filter(ch=>game?.checked.includes(ch.id)).length}/{day.chapters.length} capítulos</span><span>Próxima etapa: {done?'amanhã':'após a leitura de hoje'}</span><span>Vidas: —</span></div></header>
  <BiblicalWorldMap onVideo={onVideo} stage={current} completedStages={game?.completed_days??0} chapters={[]} plan={plan} onRead={onStart} readingAvailable={!done} completedMessage="Concluído. Próxima etapa amanhã."/>
  <a className="journey-help-link" href="/?tab=help">Preciso de ajuda</a>
  {game?.finished&&onRestart&&<button className="secondary-cta" onClick={onRestart}>INICIAR NOVO CICLO</button>}
 </section>;
}
