import {describe,it,expect} from "vitest";
import {CANON} from "../src/domain/canon";
import {categoryOfBook,STUDY_BLOCKS,BIBLEPROJECT_VIDEO_LINKS} from "../src/domain/studies";
describe("conteúdo pedagógico sem alteração do cânon",()=>{
 it("classifica os 66 livros sem lacunas",()=>{for(const [book] of CANON)expect(()=>categoryOfBook(book)).not.toThrow()});
 it("não inclui livros desconhecidos",()=>expect(()=>categoryOfBook("Livro inventado")).toThrow());
 it("inclui Gênesis 1 e João 1 nas conexões",()=>{const creation=STUDY_BLOCKS.find(b=>b.id==="criacao");expect(creation?.references).toEqual(["Gênesis 1","João 1"])});
 it("não inventa URLs do BibleProject antes das playlists",()=>expect(Object.keys(BIBLEPROJECT_VIDEO_LINKS)).toHaveLength(0));
});
