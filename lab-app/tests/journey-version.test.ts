import {describe,expect,it} from "vitest";
import {chooseJourneyVersion} from "../src/domain/journey-version";

describe("Rollout seguro: não migrar automaticamente participantes antigos",()=>{
 it("mantém V1 enquanto a feature estiver desligada",()=>{
  expect(chooseJourneyVersion({featureEnabled:false,hasLegacyRun:false,hasV2Run:false})).toBe("v1");
 });
 it("preserva leitura antiga em qualquer tentativa V1",()=>{
  expect(chooseJourneyVersion({featureEnabled:true,hasLegacyRun:true,hasV2Run:false})).toBe("v1");
 });
 it("conta sem histórico V1 pode iniciar V2",()=>{
  expect(chooseJourneyVersion({featureEnabled:true,hasLegacyRun:false,hasV2Run:false})).toBe("v2");
 });
 it("continua V2 para quem já possui uma tentativa V2",()=>{
  expect(chooseJourneyVersion({featureEnabled:true,hasLegacyRun:true,hasV2Run:true})).toBe("v2");
 });
 it("em erro de consulta recua para V1 e evita migração cega",()=>{
  expect(chooseJourneyVersion({featureEnabled:true,hasLegacyRun:false,hasV2Run:false,lookupFailed:true})).toBe("v1");
 });
});
