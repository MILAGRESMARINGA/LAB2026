import {describe,it,expect} from "vitest";
import {formatVideoTime} from "../src/domain/video-watch";
describe("Panorama duration display",()=>{
 it("shows the actual full duration, never a fixed 90 seconds",()=>{
  expect(formatVideoTime(480)).toBe("8:00");
  expect(formatVideoTime(240)).toBe("4:00");
  expect(formatVideoTime(491.1)).toBe("8:11");
 });
 it("handles invalid receipts safely",()=>{
  expect(formatVideoTime(NaN)).toBe("0:00");expect(formatVideoTime(-1)).toBe("0:00");
 });
});
