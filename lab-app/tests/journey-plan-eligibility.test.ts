import {describe,it,expect} from "vitest";
import {brazilianLeapDayStartAvailable} from "../src/domain/journey-plan-eligibility";
const iso=(s:string)=>new Date(s);
describe("Plano de 366 etapas somente em 1º de janeiro de ano bissexto",()=>{
 it("habilita início de 2028 em São Paulo apesar de ser 2028-01-01 UTC",()=>{
  expect(brazilianLeapDayStartAvailable(iso("2028-01-01T03:00:00Z"))).toBe(true);
  expect(brazilianLeapDayStartAvailable(iso("2028-01-02T02:59:59Z"))).toBe(true);
 });
 it("não antecipa a virada UTC antes da meia-noite local",()=>{
  expect(brazilianLeapDayStartAvailable(iso("2028-01-01T02:59:59Z"))).toBe(false);
  expect(brazilianLeapDayStartAvailable(iso("2028-01-02T03:00:00Z"))).toBe(false);
 });
 it("não considera 2100 bissexto, mas considera 2000",()=>{
  expect(brazilianLeapDayStartAvailable(iso("2100-01-01T12:00:00Z"))).toBe(false);
  expect(brazilianLeapDayStartAvailable(iso("2000-01-01T12:00:00Z"))).toBe(true);
 });
 it("sempre admite 365 quando alternativa não está habilitada",()=>{
  expect(brazilianLeapDayStartAvailable(iso("2026-10-16T15:00:00Z"))).toBe(false);
  expect(brazilianLeapDayStartAvailable(new Date(NaN))).toBe(false);
 });
});
