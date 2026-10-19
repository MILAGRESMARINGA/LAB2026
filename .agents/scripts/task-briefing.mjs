const SUPPORT = {
  "principal-architect": ["security-engineer", "qa-reliability-engineer"],
  "ai-engineer": ["principal-architect", "security-engineer", "qa-reliability-engineer"],
  "backend-engineer": ["database-engineer", "security-engineer", "qa-reliability-engineer"],
  "database-engineer": ["security-engineer", "qa-reliability-engineer"],
  "integration-engineer": ["security-engineer", "backend-engineer", "qa-reliability-engineer"],
  "security-engineer": ["database-engineer", "qa-reliability-engineer"],
  "qa-reliability-engineer": ["principal-architect", "security-engineer"],
  "frontend-ux-engineer": ["ux-designer", "qa-reliability-engineer"],
  "ux-designer": ["frontend-ux-engineer", "qa-reliability-engineer"],
  "gamification-engineer": ["backend-engineer", "database-engineer", "ux-designer", "qa-reliability-engineer"],
  "biblical-canon-engineer": ["backend-engineer", "security-engineer", "qa-reliability-engineer"],
  "platform-observability-engineer": ["security-engineer", "qa-reliability-engineer"],
};
const THEOLOGY = "Quando a tarefa tocar em conteúdo bíblico: exegese contextual; linha evangélica Pentecostal Arminiana (graça preveniente, responsabilidade e livre-arbítrio, santificação prática, atualidade dos dons e escatologia pré-milenista); não ensinar determinismo/calvinismo como posição do produto; não atribuir ao texto ideias que ele não afirma nem fabricar citações. Registrar leituras conectadas somente quando houver vínculo textual/teológico direto; manter leituras sem vínculo em estudos separados.";
const SECURITY = "Sem acesso ou escrita em produção, secrets, dados pessoais ou dumps. Server-authoritative para XP, progresso, tempo e timezone; chamadas idempotentes; RLS por usuário; sem confiar no relógio do cliente. SECURITY DEFINER: preferir SET search_path = ''; qualificar todos os objetos. Só admitir public, pg_temp quando revisão demonstrar que public não permite CREATE por papéis não confiáveis e pg_temp está em último lugar. Nenhuma migração é aplicada em produção por este fluxo.";
const QA = ["npm run verify:engineering", "npm test", "npm run build"];
const UX = "Interface sem poluição visual, legível para leitura prolongada, acessível por teclado/leitor de tela quando aplicável, com alvos de toque adequados e validação em viewport móvel e desktop.";
const GAMIFICATION = "Não somar XP bruto pelo volume de membros. Ranking de grupo usa média de XP por membro ativo e fator explícito de constância coletiva. Intensidade da Chama é apresentação do progresso validado pelo servidor; nunca aceitar relógio ou conclusão enviados como autoridade pelo cliente.";

export function routeSpecialist(task, manifest) {
  const objective = String(task).split(/[.!?\n]/)[0];
  if(/\b(clic[aá]ve(?:l|is)|navega[cç][aã]o|interface|menu|contraste|espa[cç]amento|acessibilidade|aria-expanded|aria-label)\b/i.test(objective)){
    return manifest.agents.find(agent=>agent.id==="ux-designer")??null;
  }
  const routes = [
    [/\b(rls|security|seguran[cç]a|senha|anti[- ]?cheat|definer|policy|permiss[aã]o)\b/i, "security-engineer"],
    [/\b(migration|migrations|postgres|database|banco|sql|backup|restaura[cç][aã]o)\b/i, "database-engineer"],
    [/\b(exegese|teologi|b[ií]blia|cap[ií]tulo|estudo|pentecostal|arminian)\b/i, "biblical-canon-engineer"],
    [/\b(flame|chama|xp|streak|ranking|gamifica|recompensa|c[eé]lula|grupo)\b/i, "gamification-engineer"],
    [/\b(interface|design|ux|acessibilidade|microintera[cç][aã]o|layout|menu|contraste|espa[cç]amento|responsiv\w*|mobile|tela pequena)\b/i, "ux-designer"],
    [/\b(email|e-mail|webhook|notifica[cç][aã]o|integra[cç][aã]o)\b/i, "integration-engineer"],
    [/\b(ci|workflow|vercel|deploy|observabilidade|monitoramento|log)\b/i, "platform-observability-engineer"],
    [/\b(teste|qa|e2e|confiabilidade|smoke)\b/i, "qa-reliability-engineer"],
    [/\b(edge function|api|backend|rpc|deno)\b/i, "backend-engineer"],
  ];
  const id = (routes.find(([pattern]) => pattern.test(objective)) ?? routes.find(([pattern]) => pattern.test(task)))?.[1] ?? "principal-architect";
  return manifest.agents.find(agent => agent.id === id) ?? null;
}

export function createTaskBriefing({ task, issueNumber, runId, agent, manifest, approvedBudget }) {
  const role = manifest.agents.find(item => item.id === agent);
  if (!role || !Number.isFinite(approvedBudget) || approvedBudget < 0) throw new Error("A valid specialist and non-negative run budget are required to create a task briefing.");
  const taskId = issueNumber ? "P1-ISSUE-" + String(issueNumber).padStart(3, "0") : "P1-RUN-" + String(runId ?? "manual");
  const paths = role.write_paths ?? [];
  const supports = SUPPORT[agent] ?? ["security-engineer", "qa-reliability-engineer"];
  const biblical = agent === "biblical-canon-engineer" || /\b(b[ií]blia|exegese|teologi|estudo|vers[ií]culo|cap[ií]tulo)\b/i.test(task);
  return {
    task_id: taskId,
    compiled_by: "ai-engineer / Neural Master trusted briefing compiler",
    issue_number: issueNumber ? Number(issueNumber) : null,
    principal_agent: agent,
    support_and_review_agents: supports,
    cost_authorization: {
      zero_cost_tier: approvedBudget === 0,
      presidential_approval_required: true,
      approved_for_this_run: approvedBudget > 0,
      approved_budget_brl: Number(approvedBudget.toFixed(2)),
      note: "Inference can incur provider charges. The runner's estimate is not a provider-enforced billing cap; configure a provider hard limit separately.",
    },
    task_request: task,
    objective: "Implement only this requested outcome: " + task.replace(/[\r\n]+/g, " ").slice(0, 500),
    strict_scope: {
      agent_manifest_scope: role.scope,
      permitted_repository_paths: paths,
      prohibited: ["main and lab-rebuild-2026 branch writes", "workflows, manifests, prompts and permission policy", "production mutations", "unrequested modules", "CRMIMOBI or unrelated repository content"],
    },
    acceptance_criteria: [
      "The change directly satisfies the task and is limited to the permitted paths for the assigned specialist.",
      "The application remains understandable and usable on mobile and desktop; no unrelated visual or functional changes.",
      "The security and product invariants below remain true; add or update a focused regression test for the behavior changed.",
      ...QA.map(command => "Pass: " + command + "."),
      "Do not mark the task complete unless a Draft PR contains the verified patch and the governance report.",
    ],
    security_and_data_invariants: SECURITY,
    database_contract: "Database changes are owned only by database-engineer or security-engineer and must be additive, tested on supported PostgreSQL versions, RLS-reviewed, and not applied to production by the agent runtime.",
    theology_contract: biblical ? THEOLOGY : "No theological content changes are in scope unless the task explicitly requests them; preserve canonical references and do not invent Scripture quotations.",
    product_contract: /gamification-engineer/.test(agent) || /\b(chama|xp|ranking|gamifica|c[eé]lula|grupo)\b/i.test(task) ? GAMIFICATION : UX,
    required_qa_commands: QA,
    output_contract: "Return complete contents for changed files only, one-line summary, allowed QA command names, estimated incremental cost, production_mutation_required=false, and blocked_reason empty. No executable shell or arbitrary tool calls.",
  };
}

export function renderTaskBriefing(briefing) {
  const cost = briefing.cost_authorization;
  return [
    "## Briefing Executivo de Tarefa (BET)",
    "- ID da tarefa / Issue: `" + briefing.task_id + (briefing.issue_number ? " / #" + briefing.issue_number : "") + "`",
    "- Agente principal: `" + briefing.principal_agent + "`",
    "- Apoio / revisão: " + briefing.support_and_review_agents.map(id => "`" + id + "`").join(", "),
    "- Alçada de custo: [" + (cost.zero_cost_tier ? "X" : " ") + "] Custo Zero (triagem sem inferência)  [" + (cost.zero_cost_tier ? " " : "X") + "] Requer aprovação presidencial (> R$ 0,00). " + (cost.approved_for_this_run ? "Aprovado para esta execução até R$ " + cost.approved_budget_brl.toFixed(2) + "." : "Nenhuma execução paga autorizada; nenhuma chamada de modelo pode ocorrer."),
    "- Objetivo: " + briefing.objective,
    "- Pedido: " + briefing.task_request.replace(/[\r\n]+/g, " "),
    "- Escopo permitido: " + (briefing.strict_scope.permitted_repository_paths.length ? briefing.strict_scope.permitted_repository_paths.map(p => "`" + p + "`").join(", ") : "sem escrita direta; encaminhar como análise"),
    "- Fora de escopo: " + briefing.strict_scope.prohibited.join("; ") + ".",
    "- Critérios de aceite:\n" + briefing.acceptance_criteria.map(item => "  - [ ] " + item).join("\n"),
    "- Segurança: " + briefing.security_and_data_invariants,
    "- Banco: " + briefing.database_contract,
    "- Teologia: " + briefing.theology_contract,
    "- Produto e experiência: " + briefing.product_contract,
    "- Compilado por: `" + briefing.compiled_by + "`.",
    "- QA obrigatório: " + briefing.required_qa_commands.map(x => "`" + x + "`").join(", ") + ".",
    "- Limite financeiro: o orçamento de execução não é um hard cap da plataforma do provedor.",
  ].join("\n");
}
