import {useEffect,useRef,useState} from "react";
import {BookOpen,Info,X} from "lucide-react";
import {getStrongTerms,type StrongTerm} from "../features/strong-lexicon";
import {bibleReferenceById} from "../domain/bible-navigation";

type Props={chapterId:string;verse:number;onClose:()=>void};
function readableLanguage(value:StrongTerm["language"]){
 return value==="greek"?"Grego":value==="aramaic"?"Aramaico":"Hebraico";
}
export function StrongLexiconDrawer({chapterId,verse,onClose}:Props){
 const [items,setItems]=useState<StrongTerm[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const dialog=useRef<HTMLDialogElement>(null);
 const ref=bibleReferenceById(chapterId);
 useEffect(()=>{
  const el=dialog.current;
  if(!el)return;
  const prev=document.activeElement instanceof HTMLElement?document.activeElement:null;
  el.showModal();
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  return()=>{el.close();document.body.style.overflow=previousOverflow;prev?.focus()};
 },[]);
 useEffect(()=>{
  let active=true;setLoading(true);setError("");setItems([]);
  void getStrongTerms(chapterId,verse).then(data=>{if(active)setItems(data)})
   .catch(()=>{if(active)setError("Não foi possível carregar os termos. Tente novamente.")})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[chapterId,verse]);
 return <dialog ref={dialog} className="strong-drawer" onCancel={event=>{event.preventDefault();onClose()}}
  aria-label={"Léxico Strong de "+ref.book+" "+ref.chapter+":"+verse}>
  <header className="strong-drawer-header">
   <div><span className="eyebrow">FERRAMENTA DE ESTUDO · STRONG</span>
    <h2>{ref.book} {ref.chapter}:{verse}</h2></div>
   <button type="button" onClick={onClose} aria-label="Fechar léxico Strong"><X size={22}/></button>
  </header>
  <div className="strong-drawer-body">
   <p className="strong-drawer-disclaimer"><Info size={18} aria-hidden="true"/>
    As palavras originais são vinculadas ao texto de referência KJV. A associação não representa uma tradução palavra por palavra do versículo em português.
   </p>
   {loading&&<p role="status">Consultando os termos disponíveis…</p>}
   {error&&<p role="alert">{error} <button type="button" onClick={()=>{setError("");setLoading(true);void getStrongTerms(chapterId,verse).then(setItems).catch(()=>setError("Consulta indisponível.")).finally(()=>setLoading(false))}}>Tentar novamente</button></p>}
   {!loading&&!error&&items.length===0&&<p role="status">Nenhum termo liberado para consulta neste versículo. A revisão editorial pode estar pendente.</p>}
   {!loading&&!error&&items.length>0&&<ol className="strong-term-list">
    {items.map((term,i)=><li key={term.strong_number+"-"+term.token_ordinal+"-"+i}>
     <div className="strong-term-title">
      <span className="strong-number">{term.strong_number}</span>
      <span className="strong-original" lang={term.language==="greek"?"el":"he"} dir={term.language==="greek"?"ltr":"rtl"}>{term.lemma}</span>
     </div>
     <dl>
      <dt>Idioma original</dt><dd>{readableLanguage(term.language)}</dd>
      {term.transliteration&&<><dt>Transliteração</dt><dd>{term.transliteration}</dd></>}
      <dt>Significado em português</dt><dd>{term.translated_gloss?.trim()||"Tradução portuguesa ainda não liberada."}</dd>
      {term.translated_definition&&<><dt>Definição revisada</dt><dd>{term.translated_definition}</dd></>}
      {term.token_text&&<><dt>Forma na referência KJV</dt><dd lang="en">{term.token_text}</dd></>}
     </dl>
     {term.translation_status==="machine"&&<p className="strong-auto-note">Tradução automática em revisão. Não utilize a glosa isoladamente como interpretação definitiva.</p>}
    </li>)}
   </ol>}
   <p className="strong-drawer-footnote"><BookOpen size={16}/> O sentido de uma palavra é determinado pelo contexto do versículo, pela gramática e pelo conjunto das Escrituras. O número Strong não é uma interpretação teológica automática.</p>
  </div>
 </dialog>;
}
