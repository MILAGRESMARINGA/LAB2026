import {useEffect,useRef,useState} from "react";
import {BookOpen,CheckCircle2,ChevronDown,Minus,Plus,RefreshCw} from "lucide-react";
import {readBibleChapter,type BibleChapter} from "../features/bible";
export function BibleReader({chapterId,onConfirm,busy=false}:{chapterId:string;onConfirm?:()=>void;busy?:boolean}){
 const [chapter,setChapter]=useState<BibleChapter|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [fontSize,setFontSize]=useState(19);
 const [readToEnd,setReadToEnd]=useState(false);
 const [reload,setReload]=useState(0);
 const scrollRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  let current=true;
  setLoading(true);setChapter(null);setError("");setReadToEnd(false);
  void readBibleChapter(chapterId).then(data=>{if(current){setChapter(data);setLoading(false)}}).catch(e=>{if(current){setError(e instanceof Error?e.message:"Erro ao carregar Bíblia");setLoading(false)}});
  return()=>{current=false};
 },[chapterId,reload]);
 useEffect(()=>{
  const el=scrollRef.current;
  if(chapter&&el) setReadToEnd(el.scrollHeight<=el.clientHeight+32);
 },[chapter]);
 const observe=()=>{
  const el=scrollRef.current;
  if(el&&(el.scrollTop+el.clientHeight>=el.scrollHeight-65))setReadToEnd(true);
 };
 return <section className="bible-reader" aria-label="Texto bíblico completo">
  <div className="bible-reader-header"><div><span className="eyebrow">LEIA NA PRÓPRIA PLATAFORMA</span><strong><BookOpen size={17}/> Almeida 1911</strong></div><div className="reader-font-controls"><button type="button" aria-label="Diminuir fonte" disabled={fontSize<=16} onClick={()=>setFontSize(x=>x-1)}><Minus size={17}/></button><span aria-hidden="true">Aa</span><button type="button" aria-label="Aumentar fonte" disabled={fontSize>=27} onClick={()=>setFontSize(x=>x+1)}><Plus size={17}/></button></div></div>
  {loading&&<div className="bible-reader-status">Carregando capítulo...</div>}
  {error&&<div className="bible-reader-status" role="alert"><p>{error}</p><button type="button" className="secondary-cta" onClick={()=>setReload(x=>x+1)}><RefreshCw size={16}/> Tentar novamente</button></div>}
  {chapter&&<><div className="bible-verse-scroll" tabIndex={0} ref={scrollRef} onScroll={observe} style={{fontSize:fontSize+"px"}} aria-label={"Texto de "+chapter.book_name+" capítulo "+chapter.chapter_number}>
   <h2>{chapter.book_name} {chapter.chapter_number}</h2>
   {chapter.verses.map((verse,index)=><p key={verse.number+"-"+index} className="bible-verse"><sup>{verse.number}</sup> {verse.text}</p>)}
   <p className="chapter-finish"><CheckCircle2 size={20}/> Fim do capítulo</p>
  </div>
  {onConfirm&&!readToEnd&&<p className="reader-scroll-hint"><ChevronDown size={16}/> Role a leitura até o final para liberar a confirmação.</p>}
  {onConfirm&&<button className="primary-cta reader-confirm" type="button" onClick={onConfirm} disabled={busy||!readToEnd}><CheckCircle2 size={20}/>{busy?"REGISTRANDO...":"CONCLUÍ A LEITURA"} </button>}
  <p className="reader-attribution">Almeida 1911 · Ortografia histórica · Texto de domínio público. Fonte: Projeto Gutenberg nº 62383; transcrição estruturada do projeto biblias.</p>
  </>}
 </section>;
}
