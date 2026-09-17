/**
 * localRag.ts — Browser-side chatbot with local RAG over approval-knowledge-base.txt
 *
 * Routing:
 *  1. Greetings / small-talk / general questions  → built-in conversational responses
 *  2. Approval / Oracle / procurement questions   → TF-IDF keyword search over KB chunks
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface Chunk {
  id:      number;
  heading: string;
  text:    string;
  tokens:  string[];
}

// ─── Module-level cache ───────────────────────────────────────────────────────

let cachedChunks: Chunk[] | null = null;
let loadPromise:  Promise<Chunk[]> | null = null;

// ─── Tokeniser ───────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a","an","the","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","shall","can",
  "to","of","in","on","at","by","for","with","about","from","into","through",
  "and","or","but","if","when","where","who","what","which","how","why","that",
  "this","these","those","it","its","i","you","we","they","he","she","my","your",
  "our","their","me","him","her","us","them","not","no","as","up","out","so",
  "just","get","got","let","yes","ok","okay","sure","please","thanks","thank",
  "hi","hello","hey","help","tell","know","want","need","give","show","like",
]);

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9$,.%/-]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

// ─── Intent detection ────────────────────────────────────────────────────────

// Patterns that indicate general/social intent rather than a KB lookup
const GREETING_RE    = /^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening)|greetings|yo|sup)\b/i;
const FAREWELL_RE    = /\b(bye|goodbye|see you|take care|later|ciao|ttyl)\b/i;
const THANKS_RE      = /\b(thanks|thank you|thx|ty|appreciated|cheers)\b/i;
const WHO_ARE_YOU_RE = /\b(who are you|what are you|what('s| is) your name|introduce yourself|tell me about yourself)\b/i;
const WHAT_CAN_RE    = /\b(what can you (do|help|answer)|help me with|capabilities|what do you know|topics)\b/i;
const HOW_ARE_YOU_RE = /\b(how are you|how('?s| is) it going|how do you do|you doing)\b/i;
const JOKE_RE        = /\b(tell me a joke|joke|funny|make me laugh|humor)\b/i;
const GENERAL_QA_RE  = /^(what is|what are|who is|who are|can you explain|explain|define|tell me about|describe|give me an overview of)\s+(?!.*(approval|requisition|oracle|procurement|workflow|bpm|fsm|cpo|cfo|gatekeeper|threshold|delegation|sla|po |purchase order|contract|ica|grant|budget|vendor|supplier|kdd|sled|lcps|swbno|mcps|bcpss|cod\b|doa\b))/i;

// Keywords that strongly signal an approval/KB topic
const KB_KEYWORDS = [
  "approval","approve","approver","requisition","oracle","procurement","workflow",
  "bpm","fsm","cpo","cfo","legal","gatekeeper","threshold","delegation","escalation",
  "sla","purchase order","contract","ica","interagency","grant","budget","vendor",
  "supplier","kdd","sled","lcps","swbno","mcps","bcpss","doa","self-approval",
  "po ","punchout","touchless","sole-source","emergency","reapproval","category",
  "serial","parallel","consensus","fyi","routing","hierarchy","cost center",
  "department head","finance controller","board","ratification","supervisor",
  "buyer","project manager","fixed asset","property management","fund","account",
];

function detectIntent(question: string): "greeting" | "farewell" | "thanks" | "who" | "capabilities" | "howAreYou" | "joke" | "general" | "kb" {
  const q = question.toLowerCase();
  if (GREETING_RE.test(q))    return "greeting";
  if (FAREWELL_RE.test(q))    return "farewell";
  if (THANKS_RE.test(q))      return "thanks";
  if (WHO_ARE_YOU_RE.test(q)) return "who";
  if (WHAT_CAN_RE.test(q))    return "capabilities";
  if (HOW_ARE_YOU_RE.test(q)) return "howAreYou";
  if (JOKE_RE.test(q))        return "joke";
  // If any KB keyword is present, route to knowledge base
  if (KB_KEYWORDS.some((kw) => q.includes(kw))) return "kb";
  // Pure general question with no KB hint
  if (GENERAL_QA_RE.test(q))  return "general";
  // Default: try KB first, fall back to general
  return "kb";
}

// ─── Conversational responses ─────────────────────────────────────────────────

function conversationalReply(intent: string, question: string): string {
  switch (intent) {
    case "greeting":
      return (
        "Hello! 👋 I'm the **Approvals Intelligence Agent**.\n\n" +
        "I can answer questions about Oracle Fusion procurement approval workflows, " +
        "routing rules, thresholds, client-specific configurations, and general Oracle BPM/FSM guidance.\n\n" +
        "What would you like to know?"
      );
    case "farewell":
      return "Goodbye! Come back anytime you have questions about approval workflows. 👋";
    case "thanks":
      return "You're welcome! Let me know if you have any other questions about approvals or procurement workflows.";
    case "who":
      return (
        "I'm the **Approvals Intelligence Agent** — a built-in assistant for this Oracle Fusion " +
        "Approval Intelligence Dashboard.\n\n" +
        "I'm trained on internal KDD documents, client workflow configurations, and Oracle procurement " +
        "best practices. I run entirely in the browser — no external AI service needed.\n\n" +
        "Ask me anything about requisition approvals, routing rules, thresholds, or client-specific workflows."
      );
    case "capabilities":
      return (
        "Here's what I can help with:\n\n" +
        "**Approval Workflows**\n" +
        "- Requisition, PO, contract, and ICA approval routing\n" +
        "- Dollar thresholds and Delegation of Authority (DOA) matrices\n" +
        "- Serial, parallel, consensus, and FYI approval types\n\n" +
        "**Approver Roles**\n" +
        "- Gatekeeper, Supervisor, Department Head, CPO, CFO, Legal, Board\n" +
        "- Cost Center Manager, Project Manager, Grant Approver, Category Manager\n\n" +
        "**Client Configurations**\n" +
        "- LCPS, SWBNO, MCPS, BCPSS, City of Detroit (COD)\n\n" +
        "**Oracle Configuration**\n" +
        "- BPM vs FSM, delegation, escalation, budget validation, self-approval rules\n" +
        "- Touchless procurement, supplier registration, reapproval triggers\n\n" +
        "Just ask a question in plain English!"
      );
    case "howAreYou":
      return "I'm running perfectly! Ready to help you navigate approval workflows and procurement configurations. What's your question?";
    case "joke":
      return (
        "Why did the requisition get rejected?\n\n" +
        "It forgot to get the Gatekeeper's approval first. 😄\n\n" +
        "(In all seriousness — the Gatekeeper is the first reviewer who validates that all requisition fields " +
        "are complete before it enters the approval chain. Never skip the Gatekeeper!)"
      );
    case "general": {
      // Extract the subject and give a helpful pivot
      const subject = question.replace(/^(what is|what are|who is|who are|can you explain|explain|define|tell me about|describe|give me an overview of)\s+/i, "").replace(/\?$/, "").trim();
      return (
        `I'm specialised in Oracle Fusion procurement approvals, so I may not have detailed information about "${subject}".\n\n` +
        "However, if your question relates to:\n" +
        "- **Approval workflows** — routing, thresholds, roles, SLAs\n" +
        "- **Oracle BPM/FSM** — configuration, escalation, delegation\n" +
        "- **Client setups** — LCPS, SWBNO, MCPS, BCPSS, or City of Detroit\n" +
        "- **Procurement types** — requisitions, POs, contracts, ICA, sole-source\n\n" +
        "…I can answer those in detail. Try rephrasing with one of those topics!"
      );
    }
    default:
      return "";
  }
}

// ─── KB Loader ───────────────────────────────────────────────────────────────

async function loadChunks(): Promise<Chunk[]> {
  if (cachedChunks) return cachedChunks;
  if (loadPromise)  return loadPromise;

  loadPromise = (async () => {
    const res = await fetch("/approval-knowledge-base.txt");
    if (!res.ok) throw new Error(`Could not load knowledge base (${res.status})`);
    const raw = await res.text();

    const rawBlocks = raw.split(/\n{2,}/);
    const chunks: Chunk[] = [];
    let heading = "Overview";
    let id = 0;

    for (const block of rawBlocks) {
      const trimmed = block.trim();
      if (!trimmed || trimmed.startsWith("---") || trimmed.startsWith("===")) continue;

      const headingMatch = trimmed.match(/^(SECTION\s+\d+[:\s].+|[A-Z][A-Z0-9 ()&/:-]{8,})$/m);
      if (headingMatch && trimmed.split("\n").length <= 2) {
        heading = headingMatch[0].trim();
        continue;
      }

      if (trimmed.length < 30) continue;

      chunks.push({ id: id++, heading, text: trimmed, tokens: tokenise(trimmed) });
    }

    cachedChunks = chunks;
    return chunks;
  })();

  return loadPromise;
}

// ─── Scorer ──────────────────────────────────────────────────────────────────

function scoreChunk(chunk: Chunk, queryTokens: string[]): number {
  const chunkSet = new Set(chunk.tokens);
  let score = 0;

  for (const qt of queryTokens) {
    if (chunkSet.has(qt)) {
      score += 2;
      if (chunk.heading.toLowerCase().includes(qt)) score += 1;
    }
    for (const ct of chunk.tokens) {
      if (ct !== qt && (ct.startsWith(qt) || qt.startsWith(ct))) {
        score += 0.5;
      }
    }
  }

  return score / Math.log(chunk.tokens.length + 2);
}

// ─── Answer formatter ─────────────────────────────────────────────────────────

function formatAnswer(question: string, topChunks: Chunk[]): string {
  if (topChunks.length === 0) {
    return (
      "I couldn't find a specific match in the knowledge base for that question.\n\n" +
      "Try asking about: approval thresholds, approver roles, client workflows (LCPS, SWBNO, MCPS, BCPSS, COD), " +
      "Oracle BPM vs FSM, delegation, escalation, budget validation, grant approvals, or self-approval rules.\n\n" +
      "Or ask **what can you do** to see a full topic list."
    );
  }

  const lines: string[] = [];
  const q = question.trim();
  lines.push(`Here's what I found about "${q.endsWith("?") ? q.slice(0, -1) : q}":`);
  lines.push("");

  for (let i = 0; i < topChunks.length; i++) {
    const chunk = topChunks[i];
    lines.push(`**${chunk.heading}**`);
    const passage = chunk.text.length > 600
      ? chunk.text.slice(0, 597).replace(/\s+\S*$/, "") + "…"
      : chunk.text;
    lines.push(passage);
    if (i < topChunks.length - 1) lines.push("");
  }

  lines.push("");
  lines.push("*Source: Approvals Intelligence Knowledge Base*");

  return lines.join("\n");
}

// ─── KB search ───────────────────────────────────────────────────────────────

async function kbSearch(question: string): Promise<string> {
  let chunks: Chunk[];
  try {
    chunks = await loadChunks();
  } catch (err) {
    return `Failed to load knowledge base: ${err instanceof Error ? err.message : String(err)}`;
  }

  if (chunks.length === 0) {
    return "Knowledge base is empty. Please check that /approval-knowledge-base.txt is accessible.";
  }

  const queryTokens = tokenise(question);
  if (queryTokens.length === 0) return conversationalReply("capabilities", question);

  const scored = chunks
    .map((c) => ({ chunk: c, score: scoreChunk(c, queryTokens) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const topChunks: Chunk[] = [];
  for (const { chunk } of scored) {
    if (topChunks.length >= 3) break;
    if (!seen.has(chunk.heading)) {
      seen.add(chunk.heading);
      topChunks.push(chunk);
    }
  }

  // If the top score is very low, the question likely isn't in the KB
  const topScore = scored[0]?.score ?? 0;
  if (topScore < 1.0) {
    return conversationalReply("general", question);
  }

  return formatAnswer(question, topChunks);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function localRagQuery(question: string): Promise<string> {
  const q = question.trim();
  if (!q) return conversationalReply("capabilities", q);

  const intent = detectIntent(q);

  // Conversational intents — answer directly, no KB needed
  if (intent !== "kb") {
    const reply = conversationalReply(intent, q);
    if (reply) return reply;
  }

  // KB lookup (with general fallback built in)
  return kbSearch(q);
}
