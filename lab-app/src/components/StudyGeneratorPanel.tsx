import {BookOpen,CheckCircle2,Clock3,Loader2,MessageCircleHeart,Sparkles} from "lucide-react";
import {useEffect,useId,useRef,useState} from "react";
import {loadDayStudies,type GeneratedStudy} from "../features/study-generate";
import {StudyReadingScreen} from "./StudyReadingScreen";
import {StrongVerseTool} from "./StrongVerseTool";
import {STRONG_READER_READY} from "../features/strong-lexicon";
import {CHAPTERS} from "../domain/canon";
import {LITERARY_BLOCKS,literaryBlockFor} from "../domain/literary-blocks";
import "./study-five-lessons.css";

export const STUDY_GUIDE_UNITS=["Exegese","Teologia Bíblica","Teologia Sistemática","Aplicação","Revisão"] as const;

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
  <p className="study-guide-structure"><strong>Seção → Livro → Capítulo → Unidade → Lição.</strong> Os estudos publicados são organizados em cinco unidades interativas. O estudo é opcional e não possui cronômetro próprio.</p>
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
 const [unit,setUnit]=useState(0);
 const contentId=useId(),unitContentId=useId();
 const reference=CHAPTERS.find(chapter=>chapter.id===study.chapter_refs[0]);
 const block=reference?literaryBlockFor(reference.book):undefined;
 const sectionIndex=Math.max(1,LITERARY_BLOCKS.findIndex(section=>section.id===block?.id)+1);
 return <>
  <article className="generated-study-point">
   <button type="button" className="generated-study-point-button" aria-expanded={open} aria-controls={contentId}
    onClick={()=>{setUnit(0);setOpen(true)}}>
    <span className="generated-study-point-number">{index+1}</span>
    <span><strong>{study.title}</strong><small>Camada {study.layer} · {study.chapter_refs.map(id=>{const ch=CHAPTERS.find(c=>c.id===id);return ch?ch.book+" "+ch.chapter:id}).join(" · ")}</small></span>
    <BookOpen size={19} aria-hidden="true"/><span className="sr-only">Abrir guia em cinco unidades</span>
   </button>
  </article>
  <StudyReadingScreen id={contentId} title={study.title} open={open} onClose={()=>setOpen(false)}>
   <div className="study-screen-content">
    <p className="study-guide-breadcrumb">Seção {sectionIndex} · {reference?.book??"Bíblia"} · Capítulo {reference?.chapter??"referenciado"} · Unidade {unit+1}</p>
    <section className="generated-study-references" aria-label="Referências bíblicas"><h4>Referências bíblicas</h4>
     <ul>{study.chapter_refs.map(id=>{const chapter=CHAPTERS.find(c=>c.id===id);return <li key={id}>{chapter?chapter.book+" "+chapter.chapter:id}</li>})}</ul>
    </section>
    <nav className="study-five-unit-navigation" aria-label="Cinco unidades do guia de estudo">
     {STUDY_GUIDE_UNITS.map((name,i)=><button type="button" key={name} aria-pressed={unit===i}
      className={unit===i?"selected":""} onClick={()=>setUnit(i)}>
      <span className="study-five-unit-step">{i+1}</span><span>{name}</span>
     </button>)}
    </nav>
    <section id={unitContentId} className="study-five-unit-content" aria-live="polite" aria-label={STUDY_GUIDE_UNITS[unit]}>
     <span className="eyebrow">UNIDADE {unit+1} DE 5 · BÔNUS OPCIONAL</span>
     <h3>{STUDY_GUIDE_UNITS[unit]}</h3>
     {unit===0&&<>
      {STRONG_READER_READY&&<StrongVerseTool chapterRefs={study.chapter_refs}/>}
      <StudySection title="Mensagem central" text={study.content.summary}/>
      <StudySection title="Contexto literário e histórico" text={study.content.context}/>
      <StudySection title="Exegese: entenda o texto" text={study.content.exegesis}/>
     </>}
     {unit===1&&<div className="generated-study-connection">
      <strong>{study.content.theological_connection?"Conexão bíblica fundamentada":"Referências preservadas em seus contextos"}</strong>
      <p>{study.content.theological_connection??"O conteúdo publicado não estabelece uma conexão canônica direta. Cada passagem deve ser interpretada em seu próprio contexto, sem harmonização forçada."}</p>
     </div>}
     {unit===2&&<>
      <StudySection title="Lente Pentecostal Arminiana" text={study.content.pentecostal_arminian_lens}/>
      <p className="study-guide-limits">A reflexão sistemática é distinta da exegese. A lente doutrinária não modifica o texto bíblico nem substitui a análise de seu contexto.</p>
     </>}
     {unit===3&&<>
      <StudySection title="Aplicação para hoje" text={study.content.application}/>
      <div className="generated-study-prayer"><strong><CheckCircle2 size={17}/> Oração sugerida</strong><p>{study.content.prayer}</p></div>
     </>}
     {unit===4&&<div className="generated-study-questions"><strong><MessageCircleHeart size={17}/> Questões de revisão</strong>
      <ol>{study.content.reflection_questions.map((question,i)=><li key={i}>{question}</li>)}</ol>
      <p className="study-guide-limits">A revisão é opcional. Navegar pelas unidades não confirma leitura, não concede XP e não altera sua Jornada.</p>
     </div>}
     <div className="study-five-unit-actions">
      {unit>0&&<button type="button" className="secondary-cta" onClick={()=>setUnit(n=>n-1)}>UNIDADE ANTERIOR</button>}
      {unit<4&&<button type="button" className="secondary-cta" onClick={()=>setUnit(n=>n+1)}>PRÓXIMA UNIDADE</button>}
     </div>
    </section>
   </div>
  </StudyReadingScreen>
 </>;
}

function StudySection({title,text}:{title:string;text:string}){return <section className="generated-study-section"><h4>{title}</h4><p>{text}</p></section>}
