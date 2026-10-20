import {useEffect,useMemo,useState} from "react";
import {ArrowLeft,ArrowRight,Bookmark,BookOpen,ChevronRight,Library,Search,Video} from "lucide-react";
import {NEW_TESTAMENT,OLD_TESTAMENT} from "../domain/canon";
import {adjacentBibleReference,bibleChapterReference,bibleReferenceById,searchCanonicalBooks} from "../domain/bible-navigation";
import {getBibleProjectVideoForChapter,type BibleProjectResource} from "../domain/bibleproject";
import {listBibleFavorites,saveBibleFavorite} from "../features/bible-favorites";
import {searchBibleVerses,type BibleSearchHit} from "../features/bible";
import {BibleReader} from "./BibleReader";

type Props={
 signedIn:boolean;
 onVideo:(resource:BibleProjectResource,book:string)=>void;
};
const readableError=(e:unknown)=>e instanceof Error?e.message:"Falha ao acessar os favoritos.";
export function BibleLibrary({signedIn,onVideo}:Props){
 const [book,setBook]=useState("Gênesis");
 const [chapter,setChapter]=useState(1);
 const [search,setSearch]=useState("");
 const [favorites,setFavorites]=useState<string[]>([]);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [showBooks,setShowBooks]=useState(false);
 const [verseQuery,setVerseQuery]=useState("");
 const [verseResults,setVerseResults]=useState<BibleSearchHit[]>([]);
 const [searchingVerses,setSearchingVerses]=useState(false);
 const [searchedVerses,setSearchedVerses]=useState(false);
 const [focusedVerse,setFocusedVerse]=useState<number|null>(null);
 const reference=useMemo(()=>bibleChapterReference(book,chapter),[book,chapter]);
 const previous=adjacentBibleReference(book,chapter,-1);
 const next=adjacentBibleReference(book,chapter,1);
 const panorama=getBibleProjectVideoForChapter(book,chapter);
 const filtered=useMemo(()=>searchCanonicalBooks(search),[search]);
 const isFavorite=favorites.includes(reference.chapterId);
 useEffect(()=>{
  if(!signedIn){setFavorites([]);return}
  let active=true;
  void listBibleFavorites().then(data=>{if(active)setFavorites(data)}).catch(e=>{if(active)setMessage(readableError(e))});
  return()=>{active=false};
 },[signedIn]);
 const open=(newBook:string,newChapter:number)=>{
  setBook(newBook);setChapter(newChapter);setFocusedVerse(null);setMessage("");setShowBooks(false);
 };
 const step=(offset:-1|1)=>{
  const nextRef=adjacentBibleReference(book,chapter,offset);
  if(nextRef)open(nextRef.book,nextRef.chapter);
 };
 const toggle=async()=>{
  if(!signedIn){setMessage("Entre na sua conta para salvar capítulos.");return}
  if(busy)return;
  setBusy(true);setMessage("");
  try{
   await saveBibleFavorite(reference.chapterId,!isFavorite);
   setFavorites(old=>isFavorite?old.filter(x=>x!==reference.chapterId):[reference.chapterId,...old]);
  }catch(e){setMessage(readableError(e))}
  finally{setBusy(false)}
 };
 const runVerseSearch=async()=>{
  setSearchingVerses(true);setSearchedVerses(false);setMessage("");
  try{setVerseResults(await searchBibleVerses(verseQuery));setSearchedVerses(true)}
  catch(e){setVerseResults([]);setMessage(readableError(e))}
  finally{setSearchingVerses(false)}
 };
 const openSearchHit=(hit:BibleSearchHit)=>{
  open(hit.book_name,hit.chapter_number);
  setFocusedVerse(hit.verse_number);
 };
 const favoriteReferences=favorites.map(id=>{try{return bibleReferenceById(id)}catch{return null}}).filter(x=>x!==null);
 return <section className="game-panel bible-library">
  <div className="bible-library-heading">
   <span className="eyebrow">BÍBLIA COMPLETA · LEITURA LIVRE</span>
   <h1>Leia a <em>Palavra.</em></h1>
   <p className="muted">Escolha qualquer livro e capítulo para estudar no LABGAME, sem precisar sair do aplicativo. A leitura livre não altera seu desafio de 365 dias e não concede XP.</p>
  </div>
  <div className="bible-edition-tag"><BookOpen size={17}/><span>Almeida 1911 · 66 livros · ortografia histórica</span></div>
  <div className="bible-selector">
   <div className="bible-selector-top">
    <label htmlFor="bible-book-select">Livro</label>
    <label htmlFor="bible-chapter-select">Capítulo</label>
   </div>
   <div className="bible-selector-controls">
    <select id="bible-book-select" value={book} onChange={e=>open(e.target.value,1)}>
     <optgroup label="Antigo Testamento">{OLD_TESTAMENT.map(([name])=><option key={name} value={name}>{name}</option>)}</optgroup>
     <optgroup label="Novo Testamento">{NEW_TESTAMENT.map(([name])=><option key={name} value={name}>{name}</option>)}</optgroup>
    </select>
    <select id="bible-chapter-select" value={chapter} onChange={e=>open(book,Number(e.target.value))}>
     {Array.from({length:reference.chapterCount},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
    </select>
   </div>
   <button type="button" className="bible-search-toggle" onClick={()=>setShowBooks(v=>!v)} aria-expanded={showBooks}>
    <Search size={16}/>{showBooks?"Ocultar busca":"Buscar um livro ou escolher um capítulo"}<ChevronRight size={15}/>
   </button>
  </div>
  {showBooks&&<div className="bible-book-browser">
   <label htmlFor="bible-search">Encontrar um livro</label>
   <input id="bible-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ex.: Gênesis, João, Romanos" type="search"/>
   <div className="bible-books-list" aria-label="Livros da Bíblia">
    {filtered.map(name=><button key={name} type="button" className={book===name?"selected":""} onClick={()=>open(name,1)}>{name}</button>)}
    {filtered.length===0&&<p>Nenhum livro encontrado.</p>}
   </div>
   <span className="bible-browser-label">Capítulos de {book}</span>
   <div className="bible-chapters-grid">{Array.from({length:reference.chapterCount},(_,i)=><button type="button" key={i+1} className={chapter===i+1?"selected":""} onClick={()=>open(book,i+1)}>{i+1}</button>)}</div>
  </div>}
  <form className="bible-verse-search" onSubmit={e=>{e.preventDefault();void runVerseSearch()}}>
   <label htmlFor="bible-verse-query"><Search size={18}/> Pesquisar no texto de toda a Bíblia</label>
   <div className="bible-verse-search-controls">
    <input id="bible-verse-query" type="search" minLength={2} maxLength={100} value={verseQuery} placeholder="Ex.: amor, Jesus, princípio, salvação" onChange={e=>{setVerseQuery(e.target.value);setVerseResults([]);setSearchedVerses(false)}} required/>
    <button type="submit" className="secondary-cta" disabled={searchingVerses||verseQuery.trim().length<2}>{searchingVerses?"BUSCANDO...":"BUSCAR"}</button>
   </div>
   {searchedVerses&&<div className="bible-verse-results" aria-live="polite">
    <h3>{verseResults.length===0?"Nenhum versículo encontrado":verseResults.length+" resultado(s) de busca"}</h3>
    {verseResults.map(hit=><button type="button" key={hit.chapter_id+":"+hit.verse_number} onClick={()=>openSearchHit(hit)}>
     <strong>{hit.book_name} {hit.chapter_number}:{hit.verse_number}</strong>
     <span>{hit.verse_text}</span>
     <ChevronRight size={17}/>
    </button>)}
    {verseResults.length>=40&&<p className="small-caption">Mostrando os 40 primeiros resultados. Refine a pesquisa para encontrar outras passagens.</p>}
   </div>}
  </form>
  <div className="bible-library-actions">
   <button className="secondary-cta" type="button" disabled={!previous} onClick={()=>step(-1)}><ArrowLeft size={16}/> Anterior</button>
   <strong>{book} {chapter}</strong>
   <button className="secondary-cta" type="button" disabled={!next} onClick={()=>step(1)}>Próximo <ArrowRight size={16}/></button>
  </div>
  <div className="bible-library-reader"><BibleReader key={reference.chapterId} chapterId={reference.chapterId} onVideo={onVideo} highlightVerse={focusedVerse}/></div>
  <div className="bible-library-actions bible-library-actions-bottom">
   <button type="button" disabled={busy} className={"bible-save-button "+(isFavorite?"active":"")} onClick={()=>void toggle()} aria-pressed={isFavorite}>
    <Bookmark size={19} fill={isFavorite?"currentColor":"none"}/>{isFavorite?"Salvo nos favoritos":"Salvar capítulo"}
   </button>
   {panorama&&<button type="button" className="bible-save-button" onClick={()=>onVideo(panorama,book)}><Video size={19}/> Ver panorama</button>}
  </div>
  {message&&<p role="status" className="feedback-message">{message}</p>}
  {signedIn&&<div className="bible-favorites">
   <h2><Bookmark size={21}/> Meus capítulos salvos</h2>
   {favoriteReferences.length===0?<p className="muted">Seus capítulos favoritos aparecerão aqui.</p>:
    <div className="bible-favorite-items">{favoriteReferences.map(ref=><button type="button" key={ref!.chapterId} onClick={()=>open(ref!.book,ref!.chapter)}><Library size={15}/>{ref!.book} {ref!.chapter}<ChevronRight size={15}/></button>)}</div>}
  </div>}
  <div className="bible-study-note"><BookOpen size={18}/><span>Leitura livre para estudo e consulta. Para pontuar na jornada, use a aba <strong>Hoje</strong>.</span></div>
  <p className="small-caption">A Bíblia Almeida de 1911 é de domínio público. Mantenha o texto original na leitura; comparações com traduções modernas serão oferecidas quando houver licença apropriada.</p>
 </section>;
}
