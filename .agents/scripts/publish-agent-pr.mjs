import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { validateAgentPatch, taskBranchName } from "./agent-writer-core.mjs";
import { renderTaskBriefing } from "./task-briefing.mjs";

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const baseBranch = "lab-rebuild-2026";
async function request(pathname, method = "GET", data) {
  const response = await fetch("https://api.github.com/repos/" + repo + pathname, {
    method,
    headers: { authorization: "Bearer " + token, accept: "application/vnd.github+json", "content-type": "application/json", "x-github-api-version": "2022-11-28" },
    ...(data ? { body: JSON.stringify(data) } : {}),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  if (!response.ok) throw Error("GitHub publisher API returned HTTP " + response.status + " for " + method + " " + pathname);
  return text ? JSON.parse(text) : {};
}
async function main() {
  if (repo !== "MILAGRESMARINGA/LAB2026" || !token || process.env.GITHUB_REF !== "refs/heads/lab-rebuild-2026") throw Error("Publisher context is not the trusted LABGame branch.");
  const patchFile = process.env.AGENT_PATCH_FILE;
  const reportFile = patchFile && path.join(path.dirname(patchFile), "verified-patch.json");
  if (!patchFile || !reportFile || !fs.existsSync(patchFile) || !fs.existsSync(reportFile)) throw Error("Verified artifact is missing.");
  const patch = JSON.parse(fs.readFileSync(patchFile, "utf8"));
  const report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
  if (patch.base_sha !== process.env.GITHUB_SHA || report.base_sha !== process.env.GITHUB_SHA || report.agent !== patch.agent) throw Error("Verified artifact does not match this workflow commit.");
  const valid = validateAgentPatch(patch.files, patch.agent);
  if (!valid.ok || !Array.isArray(report.checks) || report.checks.length < 3 || !patch.briefing ||
      patch.briefing.cost_authorization?.approved_for_this_run !== true || !(patch.briefing.cost_authorization.approved_budget_brl > 0)) throw Error("Patch or verification report is invalid.");
  if (JSON.stringify(report.files) !== JSON.stringify(valid.files) || report.estimated_incremental_cost_brl !== patch.estimated_incremental_cost_brl ||
      JSON.stringify(report.briefing) !== JSON.stringify(patch.briefing) ||
      !["npm run verify:engineering", "npm test", "npm run build"].every(command => report.checks.includes(command))) {
    throw Error("Verification report does not attest to this exact patch and required check set.");
  }
  const baseRef = await request("/git/ref/heads/" + encodeURIComponent(baseBranch));
  if (baseRef.object.sha !== patch.base_sha) throw Error("Working branch advanced since generation; refusing to publish against a changed base.");
  const parent = await request("/git/commits/" + patch.base_sha);
  const blobs = await Promise.all(valid.files.map(async file => {
    const blob = await request("/git/blobs", "POST", { content: file.content, encoding: "utf-8" });
    return { path: file.path, mode: "100644", type: "blob", sha: blob.sha };
  }));
  const tree = await request("/git/trees", "POST", { base_tree: parent.tree.sha, tree: blobs });
  const commit = await request("/git/commits", "POST", { message: "feat(agent): " + String(patch.summary).slice(0, 60), tree: tree.sha, parents: [patch.base_sha] });
  const taskKey = process.env.AGENT_ISSUE_NUMBER || process.env.GITHUB_RUN_ID || "task";
  const branch = taskBranchName("task-" + taskKey + "-run-" + process.env.GITHUB_RUN_ID);
  await request("/git/refs", "POST", { ref: "refs/heads/" + branch, sha: commit.sha });
  const taskText = String(patch.task ?? "").replace(/[\r\n]+/g, " ").slice(0, 1000);
  const body = [
    "## Relatório de governança e validação",
    "- Agente: `" + patch.agent + "`.",
    "- Escopo: " + valid.files.length + " arquivo(s) na allowlist do LABGame.",
    "- Segurança: código gerado foi validado e testado em job separado, sem chave do provedor, token GitHub ou credenciais de produção.",
    "- QA executado: " + report.checks.map(check => "`" + check + "`").join(", ") + ".",
    "- FinOps: estimativa informada pelo gerador R$ " + Number(patch.estimated_incremental_cost_brl).toFixed(2) + "; a cobrança efetiva deve ser confirmada no painel do provedor.",
    "- Produção: nenhuma migration ou função foi publicada; nenhum auto-merge foi habilitado.",
    "- Base: `" + patch.base_sha + "`.",
    "\n" + renderTaskBriefing(patch.briefing),
    "\n### Solicitação recebida\n> " + taskText,
    "\nEste PR permanece em rascunho e exige revisão humana e checks de CI antes de merge.",
  ].join("\n");
  const pr = await request("/pulls", "POST", { title: "[LAB AGENT] " + String(patch.summary).slice(0, 100), head: branch, base: baseBranch, body, draft: true });
  const message = "## LABGame agent — Draft PR aberto\n\n" + pr.html_url + "\n\nBranch: `" + branch + "`. Nenhuma alteração em produção ou auto-merge foi realizada.\n";
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, message);
  console.log(JSON.stringify({ status: "draft_pr_created", number: pr.number, url: pr.html_url, branch }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error("LABGame PR publication failed: " + error.message); process.exitCode = 1; });
