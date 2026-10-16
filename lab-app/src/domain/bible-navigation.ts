import {CANON} from "./canon";
export type BibleReference={book:string;chapter:number;chapterId:string;bookIndex:number;chapterCount:number};
export function bibleChapterReference(book:string,chapter:number):BibleReference{
 const bookIndex=CANON.findIndex(([name])=>name===book);
 if(bookIndex<0)throw Error("Livro bíblico desconhecido");
 const chapterCount=CANON[bookIndex][1];
 if(!Number.isInteger(chapter)||chapter<1||chapter>chapterCount)throw Error("Capítulo bíblico inválido");
 return {book,chapter,chapterId:`${bookIndex+1}:${chapter}`,bookIndex,chapterCount};
}
export function bibleReferenceById(chapterId:string):BibleReference{
 const match=/^([1-9]|[1-5][0-9]|6[0-6]):([1-9][0-9]{0,2})$/.exec(chapterId);
 if(!match)throw Error("Referência bíblica inválida");
 const book=CANON[Number(match[1])-1][0];
 return bibleChapterReference(book,Number(match[2]));
}
export function adjacentBibleReference(book:string,chapter:number,offset:-1|1):BibleReference|null{
 const ref=bibleChapterReference(book,chapter);
 if(offset===1){
  if(chapter<ref.chapterCount)return bibleChapterReference(book,chapter+1);
  if(ref.bookIndex+1>=CANON.length)return null;
  return bibleChapterReference(CANON[ref.bookIndex+1][0],1);
 }
 if(chapter>1)return bibleChapterReference(book,chapter-1);
 if(ref.bookIndex===0)return null;
 const [prevBook,prevChapters]=CANON[ref.bookIndex-1];
 return bibleChapterReference(prevBook,prevChapters);
}
export function searchCanonicalBooks(query:string):string[]{
 const normalized=query.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 return CANON.map(([name])=>name).filter(name=>name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(normalized));
}
