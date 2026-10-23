import type {GameDay} from "../domain/game-plan";
import type {LabGameState} from "../features/lab-game";
import {BiblicalWorldMap} from "./BiblicalWorldMap";
import {JourneyRules} from "./JourneyRules";
type Props={plan:ReadonlyArray<GameDay>;game:LabGameState|null;totalXP:number;preview?:boolean;onStart:()=>void;onUpgrade?:()=>void;onRestart?:()=>void;onExploreBible?:()=>void};
export function ChallengeJourney({plan,game,preview=false,onStart,onUpgrade,onRestart}:Props){
 const current=Math.max(1,Math.min(plan.length,game?.day??1)),day=plan[current-1];
 const done=Boolean(game&&(game.finished||(game.completed_days??0)>=current||day.chapters.every(ch=>game.checked.includes(ch.id))));
 return <section className="journey-clean" aria-label="Jornada de leitura">
  <header className="journey-clean-hud"><h1>Etapa {current}</h1><p>{day.chapters.map(ch=>`${ch.book} ${ch.chapter}`).join(' · ')}</p><div><span>{day.chapters.filter(ch=>game?.checked.includes(ch.id)).length}/{day.chapters.length} capítulos</span><span>Próxima etapa: {done?'amanhã':'após a leitura de hoje'}</span><span>Vidas: —</span></div></header>
  <BiblicalWorldMap stage={current} completedStages={game?.completed_days??0} chapters={[]} plan={plan} onRead={onStart} readingAvailable={!done} completedMessage="Concluído. Próxima etapa amanhã."/>
  <details className="journey-clean-help"><summary>Como jogar</summary><JourneyRules mode={preview?'demo':'legacy'} onUpgrade={onUpgrade}/></details>
  {game?.finished&&onRestart&&<button className="secondary-cta" onClick={onRestart}>INICIAR NOVO CICLO</button>}
 </section>;
}
