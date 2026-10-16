import {expect,it} from "vitest";
import {uniqueCompletions,chapterPoints,achievements} from "../src/domain/gamification";
it("does not reward duplicate confirmations",()=>{
 const events=[{chapterId:"1:1",completedAt:"2026-01-01"},{chapterId:"1:1",completedAt:"2026-01-02"}];
 expect(uniqueCompletions(events)).toHaveLength(1);
 expect(chapterPoints(events)).toBe(10);
 expect(achievements(events)[0].earned).toBe(true);
});
