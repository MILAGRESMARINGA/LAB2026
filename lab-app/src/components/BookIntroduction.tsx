import "./book-introduction.css";
import {BookOpen,Video} from "lucide-react";
import {getBookIntroduction} from "../domain/book-introductions";
import {getBibleProjectVideoForChapter,type BibleProjectResource} from "../domain/bibleproject";
type Props={book:string;onVideo?:(resource:BibleProjectResource,book:string)=>void};
export function BookIntroduction({book,onVideo}:Props){
 const intro=getBookIntroduction(book),video=getBibleProjectVideoForChapter(book,1);
 if(!intro)return null;
 return <aside className="book-introduction" aria-label={`Portão de ${book}`}>
  <details><summary><BookOpen size={18}/> Conheça {book} antes de começar</summary>
   <p><strong>{intro.theme}</strong></p>
   <dl>{[["Autoria",intro.author],["Data aproximada",intro.date],["Contexto",intro.context],["Propósito",intro.purpose],["Esboço por capítulos",intro.outline],["Características de leitura",intro.features],["Relações com o Novo Testamento",intro.newTestament]].map(([label,value])=><div key={label}><dt><strong>{label}</strong></dt><dd>{value}</dd></div>)}</dl>
   <p className="reader-attribution">Síntese editorial original do LABGAME. Atribuições e datas incertas são indicadas; relações temáticas não significam cumprimento profético direto.</p>
  </details>
  <div className="book-video-chest"><p><strong>Baú do Vídeo · bônus opcional</strong></p><p>O panorama ajuda a compreender o livro. Conclua o vídeo e a verificação de compreensão para ganhar +5 XP. A leitura continua disponível sem assistir.</p>
   {onVideo&&video&&<button type="button" className="secondary-cta" onClick={()=>onVideo(video,book)}><Video size={18}/> Assistir &amp; ganhar +XP</button>}
   <a className="secondary-cta" href="#bible-chapter-text">Declinar e ir direto para a leitura</a>
  </div>
 </aside>;
}
