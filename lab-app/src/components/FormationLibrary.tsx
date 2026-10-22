import {useState} from "react";
import {BookOpen,GraduationCap,HeartHandshake,Layers} from "lucide-react";
import {CHRISTIAN_FORMATION} from "../domain/christian-formation";
import {StudyReadingScreen} from "./StudyReadingScreen";

export function FormationLibrary(){
 const [trackId,setTrackId]=useState<string>(CHRISTIAN_FORMATION[0].id);
 const [lessonId,setLessonId]=useState<string|null>(null);
 const selected=CHRISTIAN_FORMATION.find(t=>t.id===trackId)??CHRISTIAN_FORMATION[0];
 const icons={discipulado:HeartHandshake,teologia:GraduationCap,vida:Layers} as const;
 return <section className="lab-formation" aria-label="Formação cristã contínua">
  <div className="lab-formation-intro"><span className="eyebrow">APRENDER · PRATICAR · CONTINUAR</span>
   <h2>Trilhas de formação cristã</h2>
   <p>Discipulado, fundamentos teológicos e aplicações da Palavra para o cotidiano. Os estudos são livres e não alteram a pontuação da leitura anual.</p>
  </div>
  <div className="lab-formation-tracks" role="group" aria-label="Escolha a trilha de formação">
   {CHRISTIAN_FORMATION.map(track=>{
    const Icon=icons[track.id];
    return <button type="button" key={track.id} aria-pressed={track.id===selected.id} className={track.id===selected.id?"active":""} onClick={()=>setTrackId(track.id)}>
      <Icon size={23} aria-hidden="true"/><strong>{track.title}</strong><small>{track.lessons.length} encontros</small>
    </button>;
   })}
  </div>
  <div className="lab-formation-detail" aria-live="polite">
   <span className="eyebrow">{selected.audience}</span>
   <h3>{selected.title}</h3>
   <p>{selected.intro}</p>
   <ol>{selected.lessons.map((lesson,index)=><li key={lesson.id}>
    <span className="lab-formation-number" aria-hidden="true">{String(index+1).padStart(2,"0")}</span>
    <div><button className="secondary-cta" type="button" onClick={()=>setLessonId(lesson.id)}>{lesson.title} · Abrir estudo</button><StudyReadingScreen title={lesson.title} open={lessonId===lesson.id} onClose={()=>setLessonId(null)}><p>{lesson.summary}</p>
     <div className="lab-formation-refs">{lesson.references.map(ref=><span key={ref}><BookOpen size={12} aria-hidden="true"/>{ref}</span>)}</div><p>Leia as referências, observe o contexto e reflita sobre como aplicar o ensino à sua vida.</p></StudyReadingScreen>
    </div>
   </li>)}</ol>
  </div>
  <p className="lab-formation-footnote">Roteiro inicial de estudo, não uma exegese concluída. Cada lição aprofundada será publicada após revisão teológica e pastoral; nenhum dom espiritual é concedido por pontos ou etapas.</p>
 </section>;
}
