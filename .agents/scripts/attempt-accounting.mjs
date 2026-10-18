// Trusted historical evidence: both attempts failed before any model response.
// https://github.com/MILAGRESMARINGA/LAB2026/actions/runs/39094300608
const verifiedLegacyFailures = new Map([["39094300608:1", "preflight"], ["39094300608:2", "HTTP 429"]]);
export const MODEL_MARKER = "Account consumed model attempt";
export const NO_MODEL_MARKER = "Account rejected or unsent request";
export function countModelAttempt(runId, attempt, jobs) {
  const generation = jobs.find(job => job.name === "generate");
  if (!generation) throw Error("Generation job history unavailable");
  const steps = generation.steps ?? [];
  if (steps.some(step => step.name === MODEL_MARKER && step.conclusion === "success")) return 1;
  if (steps.some(step => step.name === NO_MODEL_MARKER && step.conclusion === "success")) return 0;
  if (verifiedLegacyFailures.has(String(runId) + ":" + attempt) && generation.conclusion === "failure") return 0;
  // Cancellation, timeout or incomplete accounting may have incurred cost.
  return 1;
}
export function classifyProviderResponse(status, payload) {
  const allowed = new Set(["insufficient_quota", "rate_limit_exceeded", "invalid_api_key", "model_not_found"]);
  const code = payload?.error?.code;
  return { consumesAttempt: ![400, 401, 403, 404, 429].includes(status),
    code: allowed.has(code) ? code : "unclassified_provider_error" };
}
export function upperBoundUsd(body, model) {
  if (model !== "gpt-6-luna") throw Error("Unpriced model blocked");
  // 2026-10-18 official standard text rates: $0.10/$0.50 per million.
  // Reserve twice those rates; serialized UTF-8 bytes + framing overbound input tokens.
  // No tools, audio or images. Pricing must be reviewed before changing the model.
  const inputBound = Buffer.byteLength(JSON.stringify(body), "utf8") + 4096;
  return (inputBound * 0.20 + body.max_output_tokens * 1.00) / 1_000_000;
}
