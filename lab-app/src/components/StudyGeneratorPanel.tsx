import {BookOpen,CheckCircle2,Clock3,Loader2,MessageCircleHeart,Sparkles} from "lucide-react";
import {useState} from "react";
import {generateStudy,type GeneratedStudy} from "../features/study-generate";

type Props={enabled:boolean;journeyDay:number|null;layer:1|2|3;resolveChapterRefs:()=>Promise<string[]>};

export function StudyGeneratorPanel({enabled,journeyDay,layer,resolveChapterRefs}:Props){
 const [study,setStudy]=useState<GeneratedStudy|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const load=async()=>{
  if(!enabled||journeyDay===null||busy)return;
  setBusy(true);setError("");
  try{const refs=await resolveChapterRefs();setStudy(await generateStudy({journeyDay,layer,chapterRefs:refs}))}
  catch(e){setError(e instanceof Error?e.message:"Não foi possível carregar o estudo da etapa.")}
  finally{setBusy(false)}
 };
 return <section className="study-generator" aria-label="Estudo exegético da etapa atual">
  <div className="study-generator-heading"><div><span className="eyebrow">ESTUDO DA ETAPA ATUAL</span><h2>Leia com contexto</h2></div><Sparkles size={22} aria-hidden="true"/></div>
  {!enabled?<p className="study-generator-locked"><Clock3 size={17}/> O gerador será liberado junto com a Jornada V2, após a homologação do conteúdo e da segurança.</p>:journeyDay===null?<p className="muted">Ative uma etapa para gerar o estudo correspondente.</p>:<>
   <p className="study-generator-intro">O servidor consulta o cache primeiro. Quando não houver conteúdo publicado, a geração só acontece dentro dos limites de custo e da camada liberada para sua jornada.</p>
   <button type="button" className="secondary-cta" disabled={busy} onClick={()=>void load()}>{busy?<><Loader2 size={17} className="spin"/> PREPARANDO ESTUDO...</>:<><BookOpen size={17}/> ABRIR ESTUDO DO DIA {journeyDay}</>}</button>
   {error&&<p className="feedback-message" role="alert">{error}</p>}
  </>}
  {study&&<article className="generated-study" aria-live="polite">
   <div className="generated-study-meta"><span className="eyebrow">CAMADA {study.layer} · {study.cache?"CACHE PUBLICADO":"NOVO CACHE"}</span><span>{study.chapter_refs.join(" · ")}</span></div>
   <h3>{study.title}</h3>
   <StudySection title="Panorama" text={study.content.summary}/>
   <StudySection title="Contexto" text={study.content.context}/>
   <StudySection title="Exegese" text={study.content.exegesis}/>
   <div className="generated-study-connection"><strong>{study.content.theological_connection?"Chave bíblica conectada":"Leituras preservadas separadamente"}</strong><p>{study.content.theological_connection??"Não foi identificada uma conexão textual ou canônica direta. Cada referência permanece com sua própria exegese e aplicação."}</p></div>
   <StudySection title="Lente Pentecostal Arminiana" text={study.content.pentecostal_arminian_lens}/>
   <StudySection title="Prática de hoje" text={study.content.application}/>
   <div className="generated-study-questions"><strong><MessageCircleHeart size={17}/> Perguntas para reflexão</strong><ol>{study.content.reflection_questions.map(question=><li key={question}>{question}</li>)}</ol></div>
   <div className="generated-study-prayer"><strong><CheckCircle2 size={17}/> Oração sugerida</strong><p>{study.content.prayer}</p></div>
  </article>}
 </section>;
}

function StudySection({title,text}:{title:string;text:string}){return <section className="generated-study-section"><h4>{title}</h4><p>{text}</p></section>}
