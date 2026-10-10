import {describe,it,expect} from "vitest";
import {readingStreak,completedDayCount} from "../src/domain/streaks";
const days=[{day:1,chapters:[{id:"1:1"}]},{day:2,chapters:[{id:"1:2"}]},{day:3,chapters:[{id:"1:3"}]}];
describe("daily streak",()=>{
 it("counts only consecutive completed days",()=>{expect(readingStreak(new Set(["1:1","1:2"]),days,2)).toBe(2);expect(readingStreak(new Set(["1:1","1:3"]),days,3)).toBe(1)});
 it("does not count partial days",()=>expect(completedDayCount(new Set(["1:1"]),days)).toBe(1));
});
