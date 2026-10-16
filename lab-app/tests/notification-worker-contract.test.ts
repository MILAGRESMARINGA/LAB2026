import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const worker=readFileSync(new URL("../supabase/functions/notify-reading-email/index.ts",import.meta.url),"utf8");
const migration=readFileSync(new URL("../supabase/migrations/202610160107_notification_delivery_audit.sql",import.meta.url),"utf8");

describe("Trabalhador de e-mails opcionais — contrato de segurança",()=>{
 it("rejeita métodos incorretos, exige segredo separado e permanece inativo sem configuração",()=>{
  expect(worker).toContain('req.method!=="POST"');
  expect(worker).toContain("LAB_NOTIFICATION_CRON_SECRET");
  expect(worker).toContain("cronSecret.length<32");
  expect(worker).toContain('ready!=="true"');
  expect(worker).toContain("LAB_NOTIFICATION_FROM");
  expect(worker).toContain("RESEND_API_KEY");
 });
 it("consulta consentimento antes de reservar e novamente antes de enviar",()=>{
  expect(worker).toContain('.eq("enabled",true).eq("reading_email",true)');
  expect(worker).toContain('select("enabled,reading_email")');
  expect(worker).toContain('!lastConsent?.enabled||!lastConsent.reading_email');
  expect(worker).toContain("from(\"lab_notification_deliveries\")");
  expect(worker).toContain('reserveError?.code==="23505"');
 });
 it("não envia lembretes sem uma etapa ativa e respeita horário silencioso",()=>{
  expect(worker).toContain('.eq("status","active")');
  expect(worker).toContain("stage.completed_at");
  expect(worker).toContain("hour<8||hour>=20");
  expect(worker).toContain("elapsed<12*3600000||elapsed>30*3600000");
 });
 it("só o servidor escreve no registro, o titular pode consultar suas entregas",()=>{
  expect(migration).toContain("PRIMARY KEY(user_id,category,channel,local_day)");
  expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
  expect(migration).toContain("GRANT SELECT ON public.lab_notification_deliveries TO authenticated");
  expect(migration).toContain("user_id=(SELECT auth.uid())");
  expect(migration).not.toMatch(/GRANT\s+(?:INSERT|UPDATE|DELETE|ALL)\s+ON\s+public\.lab_notification_deliveries\s+TO\s+authenticated/i);
 });
});
