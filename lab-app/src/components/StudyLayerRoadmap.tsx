import {CheckCircle2,GraduationCap,HeartHandshake,Layers,LockKeyhole,Sparkles} from "lucide-react";
import {studyLayerViews,type StudyLayerNumber} from "../domain/study-layers";

type Props={completedDays:number;selectedLayer?:StudyLayerNumber};
const icons={1:HeartHandshake,2:GraduationCap,3:Layers} as const;

export function StudyLayerRoadmap({completedDays,selectedLayer}:Props){
 const views=studyLayerViews(completedDays);
 return <section className="study-roadmap" aria-label="Progressão das três camadas de estudo">
  <div className="study-roadmap-heading">
   <div><span className="eyebrow">CAMINHO DE FORMAÇÃO</span><h2>Aprenda no seu ritmo</h2></div>
   <Sparkles size={22} aria-hidden="true"/>
  </div>
  <p className="study-roadmap-intro">Cada camada aprofunda a jornada. O cadeado mostra o próximo passo; o acesso real é confirmado pelo servidor quando os dias são concluídos.</p>
  <div className="study-layer-list">
   {views.map(view=>{
    const Icon=icons[view.layer];
    const active=selectedLayer===view.layer;
    return <article key={view.layer} className={"study-layer-card "+(view.unlocked?"unlocked":"locked")+(active?" selected":"")} aria-label={`Camada ${view.layer}: ${view.title}`}>
     <div className="study-layer-icon" aria-hidden="true">{view.unlocked?<Icon size={24}/>:<LockKeyhole size={22}/>}</div>
     <div className="study-layer-copy">
      <span className="study-layer-kicker">CAMADA {view.layer} · {view.unlocked?"DISPONÍVEL":"BLOQUEADA"}</span>
      <h3>{view.title}</h3>
      <strong>{view.audience}</strong>
      <p>{view.description}</p>
      {!view.unlocked?<><span className="study-layer-unlock">Conclua mais {view.remainingDays} {view.remainingDays===1?"dia":"dias"} de constância para abrir</span><div className="study-layer-progress" role="progressbar" aria-label={`Progresso até a camada ${view.layer}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={view.progressPercent}><span style={{width:view.progressPercent+"%"}}/></div></>:<span className="study-layer-ready"><CheckCircle2 size={15}/> Acesso liberado pela jornada</span>}
     </div>
    </article>;
   })}
  </div>
  <small className="study-roadmap-note">O estudo fortalece a prática da Palavra. Nenhuma camada, medalha ou ponto substitui comunhão, discipulado e acompanhamento pastoral.</small>
 </section>;
}
