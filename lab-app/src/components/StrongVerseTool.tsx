import {useState} from "react";
import {BookOpen} from "lucide-react";
import {bibleReferenceById} from "../domain/bible-navigation";
import {StrongLexiconDrawer} from "./StrongLexiconDrawer";
type Props={chapterRefs:readonly string[]};
export function StrongVerseTool({chapterRefs}:Props){
 const refs=chapterRefs.filter(ref=>{
  try{bibleReferenceById(ref);return true}catch{return false}
 });
 const [current,setCurrent]=useState(refs[0]??"");
 const [verse,setVerse]=useState(1);
 const [open,setOpen]=useState(false);
 if(!refs.length)return null;
 const chosen=refs.includes(current)?current:refs[0];
 return <section className="strong-study-tool" aria-label="Consultar termos Strong do estudo">
  <h4><BookOpen size={18}/> Léxico Strong · Referências do estudo</h4>
  <p className="muted">Escolha um versículo do capítulo. A busca consulta somente anotações liberadas. O alinhamento disponível é da referência KJV; não é marcação palavra por palavra na tradução portuguesa.</p>
  <div className="strong-study-controls">
   <label>Capítulo
    <select value={chosen} onChange={e=>{setCurrent(e.target.value);setOpen(false)}}>
     {refs.map(ref=>{const book=bibleReferenceById(ref);return <option value={ref} key={ref}>{book.book} {book.chapter}</option>})}
    </select>
   </label>
   <label>Versículo
    <input type="number" min="1" max="176" value={verse}
     onChange={e=>setVerse(Number(e.target.value))}/>
   </label>
   <button type="button" disabled={!Number.isInteger(verse)||verse<1||verse>176}
    onClick={()=>setOpen(true)}>Consultar Strong</button>
  </div>
  {open&&<StrongLexiconDrawer key={chosen+":"+verse} chapterId={chosen} verse={verse} onClose={()=>setOpen(false)}/>}
 </section>;
}
