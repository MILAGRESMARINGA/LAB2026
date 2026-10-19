import {BookOpen,CheckCircle2,ChevronDown,Clock3,Loader2,MessageCircleHeart,Sparkles} from "lucide-react";
import {useEffect,useId,useRef,useState} from "react";
import {loadDayStudies,type GeneratedStudy} from "../features/study-generate";

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
  {studies.map(study=><GeneratedStudyCard key={study.study_key} study={study}/>)}
 </section>;
}

export function GeneratedStudyCard({study}:{study:GeneratedStudy}){
 const [open,setOpen]=useState(false);
 const contentId=useId();
 return <article className="generated-study">
  <div className="generated-study-meta"><span className="eyebrow">CAMADA {study.layer} · {study.cache?"CACHE PUBLICADO":"NOVO CACHE"}</span></div>
  <h3><button type="button" className="generated-study-toggle" aria-label={`${open?"Recolher estudo":"Abrir estudo"}: ${study.title}`} aria-expanded={open} aria-controls={contentId} onClick={()=>setOpen(value=>!value)}>
   <span>{study.title}</span><span className="generated-study-toggle-action"><BookOpen size={18} aria-hidden="true"/><span>{open?"Recolher estudo":"Abrir estudo"}</span><ChevronDown className="generated-study-toggle-chevron" size={18} aria-hidden="true"/></span>
  </button></h3>
  <div id={contentId} className="generated-study-content" hidden={!open}>
   <section className="generated-study-references" aria-label="Referências bíblicas">
    <h4>Referências bíblicas</h4><ul>{study.chapter_refs.map(reference=><li key={reference}>{reference}</li>)}</ul>
   </section>
   <StudySection title="Panorama" text={study.content.summary}/>
   <StudySection title="Contexto" text={study.content.context}/>
   <StudySection title="Exegese" text={study.content.exegesis}/>
   <div className="generated-study-connection"><strong>{study.content.theological_connection?"Chave bíblica conectada":"Leituras preservadas separadamente"}</strong><p>{study.content.theological_connection??"Não foi identificada uma conexão textual ou canônica direta. Cada referência permanece com sua própria exegese e aplicação."}</p></div>
   <StudySection title="Lente Pentecostal Arminiana" text={study.content.pentecostal_arminian_lens}/>
   <StudySection title="Prática de hoje" text={study.content.application}/>
   <div className="generated-study-questions"><strong><MessageCircleHeart size={17}/> Perguntas para reflexão</strong><ol>{study.content.reflection_questions.map((question,index)=><li key={`${index}-${question}`}>{question}</li>)}</ol></div>
   <div className="generated-study-prayer"><strong><CheckCircle2 size={17}/> Oração sugerida</strong><p>{study.content.prayer}</p></div>
  </div>
 </article>;
}

function StudySection({title,text}:{title:string;text:string}){return <section className="generated-study-section"><h4>{title}</h4><p>{text}</p></section>}
