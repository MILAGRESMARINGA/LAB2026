import {BookOpen,CheckCircle2,Clock3,Loader2,MessageCircleHeart,Sparkles} from "lucide-react";
import {useEffect,useId,useRef,useState} from "react";
import {loadDayStudies,type GeneratedStudy} from "../features/study-generate";
import {StudyReadingScreen} from "./StudyReadingScreen";

type Props={enabled:boolean;journeyDay:number|null;layer:1|2|3;resolveChapterRefs:()=>Promise<string[]>};

export function StudyGeneratorPanel({enabled,journeyDay,layer,resolveChapterRefs}:Props){
 const [studies,setStudies]=useState<GeneratedStudy[]>([]);
 const request=useRef(0);
 useEffect(()=>{request.current++;setStudies([]);setError("");setBusy(false);return()=>{request.current++}},[enabled,journeyDay,layer]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const load=async()=>{
  if(!enabled||journeyDay===null||busy)return;
  const current=++request.current;
  setBusy(true);setError("");
  try{const refs=await resolveChapterRefs();const result=await loadDayStudies({journeyDay,layer,chapterRefs:refs});if(current===request.current)setStudies(result)}
  catch(e){if(current===request.current)setError(e instanceof Error?e.message:"Não foi possível carregar o estudo da etapa.")}
  finally{if(current===request.current)setBusy(false)}
 };
 return <section className="study-generator" aria-label="Estudo exegético da etapa atual">
  <div className="study-generator-heading"><div><span className="eyebrow">ESTUDO DA ETAPA ATUAL</span><h2>Leia com contexto</h2></div><Sparkles size={22} aria-hidden="true"/></div>
  {!enabled?<p className="study-generator-locked"><Clock3 size={17}/> O gerador será liberado junto com a Jornada V2, após a homologação do conteúdo e da segurança.</p>:journeyDay===null?<p className="muted">Ative uma etapa para gerar o estudo correspondente.</p>:<>
   <p className="study-generator-intro">O servidor consulta o cache primeiro. Quando não houver conteúdo publicado, a geração só acontece dentro dos limites de custo e da camada liberada para sua jornada.</p>
   <button type="button" className="secondary-cta" disabled={busy} onClick={()=>void load()}>{busy?<><Loader2 size={17} className="spin"/> PREPARANDO ESTUDO...</>:<><BookOpen size={17}/> ABRIR ESTUDO DO DIA {journeyDay}</>}</button>
   {error&&<p className="feedback-message" role="alert">{error}</p>}
  </>}
  {studies.length>0&&<div className="generated-study-map" aria-label="Pontos de estudo disponíveis">
   <span className="eyebrow">PONTOS DE ESTUDO DA ETAPA</span>
   <p className="study-generator-intro">Escolha um ponto da jornada para abrir o estudo em uma tela própria.</p>
   <div className="generated-study-points">{studies.map((study,index)=><GeneratedStudyCard key={study.study_key} study={study} index={index}/>)}</div>
  </div>}
 </section>;
}

export function GeneratedStudyCard({study,index=0}:{study:GeneratedStudy;index?:number}){
 const [open,setOpen]=useState(false);
 const contentId=useId();
 return <>
  <article className="generated-study-point">
   <button type="button" className="generated-study-point-button" aria-expanded={open} aria-controls={contentId} onClick={()=>setOpen(true)}>
    <span className="generated-study-point-number">{index+1}</span>
    <span><strong>{study.title}</strong><small>Camada {study.layer} · {study.chapter_refs.join(" · ")}</small></span>
    <BookOpen size={19} aria-hidden="true"/><span className="sr-only">{open?"Recolher estudo":"Abrir conteúdo e referências bíblicas"}</span>
   </button>
  </article>
  <StudyReadingScreen id={contentId} title={study.title} open={open} onClose={()=>setOpen(false)}>
    <div className="study-screen-content">
     <section className="generated-study-references" aria-label="Referências bíblicas"><h4>Referências bíblicas</h4><ul>{study.chapter_refs.map(reference=><li key={reference}>{reference}</li>)}</ul></section>
     <StudySection title="Panorama" text={study.content.summary}/><StudySection title="Contexto" text={study.content.context}/><StudySection title="Exegese" text={study.content.exegesis}/>
     <div className="generated-study-connection"><strong>{study.content.theological_connection?"Chave bíblica conectada":"Leituras preservadas separadamente"}</strong><p>{study.content.theological_connection??"Não foi identificada uma conexão textual ou canônica direta. Cada referência permanece com sua própria exegese e aplicação."}</p></div>
     <StudySection title="Lente Pentecostal Arminiana" text={study.content.pentecostal_arminian_lens}/><StudySection title="Prática de hoje" text={study.content.application}/>
     <div className="generated-study-questions"><strong><MessageCircleHeart size={17}/> Perguntas para reflexão</strong><ol>{study.content.reflection_questions.map((question,questionIndex)=><li key={`${questionIndex}-${question}`}>{question}</li>)}</ol></div>
     <div className="generated-study-prayer"><strong><CheckCircle2 size={17}/> Oração sugerida</strong><p>{study.content.prayer}</p></div>
    </div>
  </StudyReadingScreen>
 </>;
}

function StudySection({title,text}:{title:string;text:string}){return <section className="generated-study-section"><h4>{title}</h4><p>{text}</p></section>}
