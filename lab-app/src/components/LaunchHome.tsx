import {ArrowRight,BookOpen,Check,Flame,UsersRound} from "lucide-react";

type LaunchHomeProps={
 onStart:()=>void;
 onExploreBible:()=>void;
};

/** First public screen: communicates the focused Brazilian launch promise. */
export function LaunchHome({onStart,onExploreBible}:LaunchHomeProps){
 return <section className="launch-home" aria-labelledby="launch-home-title">
  <div className="launch-home-copy">
   <p className="eyebrow">LEITURA BÍBLICA PARA A VIDA REAL</p>
   <h1 id="launch-home-title">A Bíblia toda.<br/><em>Um ritmo que cabe no seu dia.</em></h1>
   <p className="launch-home-lede">Construa constância lendo capítulo a capítulo, acompanhe a sua jornada e, quando quiser, caminhe com o seu GC.</p>
   <div className="launch-proof" aria-label="O que está incluído">
    <span><Check size={16}/> Bíblia em português</span>
    <span><Check size={16}/> Plano completo de 365 dias</span>
    <span><Check size={16}/> Grupos privados</span>
   </div>
   <button type="button" className="primary-cta launch-primary" onClick={onStart}>COMEÇAR MINHA JORNADA <ArrowRight size={19}/></button>
   <button type="button" className="launch-text-action" onClick={onExploreBible}>Quero explorar a Bíblia primeiro <BookOpen size={16}/></button>
  </div>
  <aside className="launch-preview" aria-label="Prévia da jornada diária">
   <div className="launch-preview-top"><span>HOJE</span><span className="launch-day-pill">DIA 1</span></div>
   <div className="launch-preview-flame"><Flame size={28}/><div><strong>Comece com clareza</strong><small>Um capítulo de cada vez</small></div></div>
   <div className="launch-reading-card"><span>PRÓXIMA LEITURA</span><strong>Gênesis 1</strong><small>Criação e propósito</small><div><i/><i/><i/></div></div>
   <div className="launch-preview-footer"><span><BookOpen size={16}/> 66 livros</span><span><UsersRound size={16}/> com seu GC</span></div>
  </aside>
 </section>;
}
