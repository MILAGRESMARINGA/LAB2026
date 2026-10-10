import {it,expect} from "vitest";
import {readingDate,formatReadingDate} from "../src/domain/calendar";
it("handles leap-year last day",()=>{expect(readingDate(2028,366).toISOString().slice(0,10)).toBe("2028-12-31");expect(()=>readingDate(2027,366)).toThrow()});
it("formats Brazilian calendar",()=>expect(formatReadingDate(2026,1)).toContain("janeiro"));
