import {useEffect,useRef,useState} from "react";
import {BookOpen,CheckCircle2,ChevronDown,Minus,Plus,RefreshCw} from "lucide-react";
import {readBibleChapter,listBibleEditions,readBibleSpeechSpans,splitVerseSpeech,DEFAULT_EDITION,FALLBACK_BIBLE_EDITIONS,type BibleEdition,type JesusSpeechSpan,type BibleChapter} from "../features/bible";
import {BookIntroduction} from "./BookIntroduction";
import {BiblicalContextPanel} from "./BiblicalContextPanel";
import {StrongLexiconDrawer} from "./StrongLexiconDrawer";
import {STRONG_READER_READY} from "../features/strong-lexicon";
import {type BibleProjectResource} from "../domain/bibleproject";
export function BibleReader({chapterId,onConfirm,onOpen,busy=false,highlightVerse,onVideo}:{chapterId:string;onConfirm?:()=>void;onOpen?:(chapterId:string)=>Promise<unknown>;busy?:boolean;highlightVerse?:number|null;onVideo?:(resource:BibleProjectResource,book:string)=>void}){
 const [editions,setEditions]=useState<readonly BibleEdition[]>(FALLBACK_BIBLE_EDITIONS);
 const [edition,setEdition]=useState(DEFAULT_EDITION);
 const [compare,setCompare]=useState(false);
 const [compareEdition,setCompareEdition]=useState("");
 const [compared,setCompared]=useState<BibleChapter|null>(null);
 const [compareError,setCompareError]=useState("");
 const [strongVerse,setStrongVerse]=useState<number|null>(null);
 useEffect(()=>{setStrongVerse(null)},[chapterId]);
 const [speech,setSpeech]=useState<Record<number,JesusSpeechSpan[]>>({});
 const [compareSpeech,setCompareSpeech]=useState<Record<number,JesusSpeechSpan[]>>({});
 useEffect(()=>{let live=true;void listBibleEditions().then(data=>{if(live)setEditions(data)}).catch(()=>{});return()=>{live=false}},[]);
 useEffect(()=>{
  let live=true;setCompared(null);setCompareError("");setCompareSpeech({});
  if(compare&&compareEdition){
   void readBibleChapter(chapterId,compareEdition).then(data=>{if(live)setCompared(data)}).catch(()=>{if(live)setCompareError("A segunda tradução não está disponível para este capítulo.")});
   void readBibleSpeechSpans(chapterId,compareEdition).then(data=>{if(live)setCompareSpeech(data)}).catch(()=>{});
  }
  return()=>{live=false};
 },[chapterId,compare,compareEdition]);
 useEffect(()=>{let live=true;setSpeech({});void readBibleSpeechSpans(chapterId,edition).then(data=>{if(live)setSpeech(data)}).catch(()=>{});return()=>{live=false}},[chapterId,edition]);
 const renderSpeech=(text:string,spans?:JesusSpeechSpan[])=>splitVerseSpeech(text,spans).map((part,index)=>part.isWordsOfJesus?<span key={index} className="bible-jesus-words">{part.text}</span>:<span key={index}>{part.text}</span>);
 const editionTitle=editions.find(item=>item.code===edition)?.title??edition;
 const alternatives=editions.filter(item=>item.available&&item.code!==edition);
 const [chapter,setChapter]=useState<BibleChapter|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [fontSize,setFontSize]=useState(19);
 const [readToEnd,setReadToEnd]=useState(false);
 const [reload,setReload]=useState(0);
 const scrollRef=useRef<HTMLDivElement>(null);
 const onOpenRef=useRef(onOpen);
 onOpenRef.current=onOpen;
 useEffect(()=>{
  let current=true;
  setLoading(true);setChapter(null);setError("");setReadToEnd(false);
  void (async()=>{
   try{
    // The server records the start before the chapter becomes visible; no client clock is submitted.
    await onOpenRef.current?.(chapterId);
    const data=await readBibleChapter(chapterId,edition);
    if(current){setChapter(data);setLoading(false)}
   }catch(e){
    if(current){setError(e instanceof Error?e.message:"Erro ao carregar Bíblia");setLoading(false)}
   }
  })();
  return()=>{current=false};
 },[chapterId,reload,edition]);
 useEffect(()=>{
  const el=scrollRef.current;
  if(chapter&&el) setReadToEnd(el.scrollHeight<=el.clientHeight+32);
 },[chapter]);
 useEffect(()=>{
  if(!chapter||!highlightVerse)return;
  const container=scrollRef.current;
  const target=container?.querySelector(`[data-verse-number="${highlightVerse}"]`);
  if(target instanceof HTMLElement)target.scrollIntoView({behavior:"smooth",block:"center"});
 },[chapter,highlightVerse]);
 const observe=()=>{
  const el=scrollRef.current;
  if(el&&(el.scrollTop+el.clientHeight>=el.scrollHeight-65))setReadToEnd(true);
 };
 return <section className="bible-reader" aria-label="Texto bíblico completo">
  <div className="bible-reader-header"><div><span className="eyebrow">LEIA NA PRÓPRIA PLATAFORMA</span><strong><BookOpen size={17}/> {editionTitle}</strong></div><div className="reader-font-controls"><button type="button" aria-label="Diminuir fonte" disabled={fontSize<=16} onClick={()=>setFontSize(x=>x-1)}><Minus size={17}/></button><span aria-hidden="true">Aa</span><button type="button" aria-label="Aumentar fonte" disabled={fontSize>=27} onClick={()=>setFontSize(x=>x+1)}><Plus size={17}/></button></div></div>
  <div className="reader-editions"><label>Versão principal<select aria-label="Versão principal" value={edition} onChange={event=>{setEdition(event.target.value);setCompare(false)}}>{editions.map(item=><option key={item.code} value={item.code} disabled={!item.available}>{item.title}{!item.available?" · aguardando licença":""}</option>)}</select></label>
   <button type="button" className="secondary-cta" disabled={!alternatives.length} onClick={()=>{setCompare(value=>!value);if(!compareEdition||compareEdition===edition)setCompareEdition(alternatives[0]?.code??"")}}>{compare?"Fechar comparação":"Comparar 2 versões"}</button>
   {compare&&<label>Segunda versão<select aria-label="Segunda versão" value={compareEdition} onChange={event=>setCompareEdition(event.target.value)}>{alternatives.map(item=><option key={item.code} value={item.code}>{item.title}</option>)}</select></label>}
  </div>
  {!alternatives.length&&<p className="reader-attribution">Comparação disponível quando houver duas traduções autorizadas. NVI, NAA, ARA e NTLH aguardam licença e importação.</p>}
  {compareError&&<p role="status">{compareError}</p>}
  {loading&&<div className="bible-reader-status">Carregando capítulo...</div>}
  {error&&<div className="bible-reader-status" role="alert"><p>{error}</p><button type="button" className="secondary-cta" onClick={()=>setReload(x=>x+1)}><RefreshCw size={16}/> Tentar novamente</button></div>}
  {chapter&&<>{chapter.chapter_number===1&&<BookIntroduction book={chapter.book_name} onVideo={onVideo}/>}<div id="bible-chapter-text" className="bible-verse-scroll" tabIndex={0} ref={scrollRef} onScroll={observe} style={{fontSize:fontSize+"px"}} aria-label={"Texto de "+chapter.book_name+" capítulo "+chapter.chapter_number}>
   <h2>{chapter.book_name} {chapter.chapter_number}</h2>
   {chapter.verses.map((verse,index)=>{const second=compared?.verses.find(item=>item.number===verse.number);return <div key={verse.number+"-"+index} data-verse-number={verse.number} className={compare?"bible-comparison-row":""}><div>{compare&&<small>{editionTitle}</small>}<p className={"bible-verse "+(verse.number===highlightVerse?"bible-verse-highlight":"")}><sup>{verse.number}</sup> {renderSpeech(verse.text,speech[verse.number])}</p>{STRONG_READER_READY&&<button type="button" className="strong-open-button" aria-label={`Consultar Strong de ${chapter.book_name} ${chapter.chapter_number} versículo ${verse.number}`} onClick={()=>setStrongVerse(verse.number)}>Strong · v.{verse.number}</button>}</div>{compare&&<div><small>{editions.find(item=>item.code===compareEdition)?.title??compareEdition}</small><p className="bible-verse">{second?<><sup>{second.number}</sup> {renderSpeech(second.text,compareSpeech[second.number])}</>:compared?"Sem versículo correspondente nesta edição.":"Carregando comparação…"}</p></div>}</div>})}
   <p className="chapter-finish"><CheckCircle2 size={20}/> Fim do capítulo</p>
  </div>
  {onConfirm&&!readToEnd&&<p className="reader-scroll-hint"><ChevronDown size={16}/> Role a leitura até o final para liberar a confirmação.</p>}
  {onConfirm&&<button className="primary-cta reader-confirm" type="button" onClick={onConfirm} disabled={busy||!readToEnd}><CheckCircle2 size={20}/>{busy?"REGISTRANDO...":"CONCLUÍ A LEITURA"} </button>}
  <BiblicalContextPanel chapterId={chapterId}/>
  {STRONG_READER_READY&&strongVerse!==null&&<StrongLexiconDrawer key={`${chapterId}:${strongVerse}`} chapterId={chapterId} verse={strongVerse} onClose={()=>setStrongVerse(null)}/>}
  <p className="reader-attribution">{edition===DEFAULT_EDITION?"Almeida 1911 · Ortografia histórica · Texto de domínio público. Fonte: Projeto Gutenberg nº 62383; transcrição estruturada do projeto biblias.":editions.find(item=>item.code===edition)?.license_label}</p>
  <p className="reader-attribution">Falas de Jesus em vermelho conforme revisão editorial de cada tradução. A ausência de destaque não indica ausência de fala.</p>
  </>}
 </section>;
}
