import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({from:vi.fn(),single:vi.fn(),order:vi.fn(),eq:vi.fn(),select:vi.fn()}));
vi.mock("../src/lib/supabase",()=>({supabase:{from:mocks.from}}));
import {FALLBACK_BIBLE_EDITIONS,listBibleEditions,readBibleChapter,readBibleSpeechSpans} from "../src/features/bible";
beforeEach(()=>{
 vi.resetAllMocks();
 mocks.from.mockReturnValue({select:mocks.select});
 mocks.select.mockReturnValue({eq:mocks.eq,order:mocks.order});
 mocks.eq.mockReturnValue({eq:mocks.eq,single:mocks.single});
});
describe("Bible edition availability",()=>{
 it("keeps only the historical edition available when metadata cannot be loaded",async()=>{
  mocks.order.mockResolvedValue({data:null,error:{message:"table not yet deployed"}});
  expect((await listBibleEditions()).filter(v=>v.available).map(v=>v.code)).toEqual(["ALM1911"]);
  expect(FALLBACK_BIBLE_EDITIONS.map(v=>v.code)).toEqual(["ALM1911","NVI","NAA","ARA","NTLH"]);
 });
 it("uses the chosen edition and rejects noncanonical chapters before querying",async()=>{
  mocks.single.mockResolvedValue({data:{edition:"NAA",chapter_id:"43:1",book_name:"João",chapter_number:1,verses:[{number:1,text:"fixture"}]},error:null});
  expect((await readBibleChapter("43:1","NAA")).edition).toBe("NAA");
  expect(mocks.eq).toHaveBeenCalledWith("edition","NAA");
  mocks.from.mockClear();
  await expect(readBibleChapter("1:51")).rejects.toThrow("Referência inválida");
  await expect(readBibleChapter("43:1","../../secret")).rejects.toThrow("Versão bíblica inválida");
  expect(mocks.from).not.toHaveBeenCalled();
 });
 it("maps curated spans with their exact text snapshot",async()=>{
  mocks.eq.mockReturnValueOnce({eq:mocks.eq}).mockResolvedValueOnce({data:[{verse_number:1,start_utf16:7,end_utf16:11,source_text:"Disse: Paz!"}],error:null});
  expect(await readBibleSpeechSpans("40:1")).toEqual({1:[{start:7,end:11,sourceText:"Disse: Paz!"}]});
 });
});
