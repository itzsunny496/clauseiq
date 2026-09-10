import type { OllamaStatus } from "../types";
import { getLocalSettings } from "../storage/indexedDb";
import { chunkDocument, searchDocumentVectors, VectorChunk } from "./localVectorRag";

const DEFAULT_HOST = "http://127.0.0.1:11434";
const CHAT_MODEL = "llama3.2:3b";
const FALLBACK_MODELS = ["llama3.2:3b", "llama3.1:8b", "llama3:latest", "mistral", "qwen2.5:3b"];

export async function getActiveOllamaHost(): Promise<string> {
  const settings = await getLocalSettings();
  return settings.ollamaHost || DEFAULT_HOST;
}

/**
 * Check connectivity directly to the user's on-device Ollama instance.
 * Probes http://127.0.0.1:11434/api/tags directly from browser.
 */
export async function getOllamaStatus(): Promise<OllamaStatus> {
  const host = await getActiveOllamaHost();
  let models: string[] = [];
  let reachable = false;
  let corsBlocked = false;

  try {
    const res = await fetch(`${host}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(2500),
    });

    if (res.ok) {
      const data = await res.json();
      models = (data.models ?? []).map((m: { name: string }) => m.name);
      reachable = true;
    } else {
      reachable = false;
    }
  } catch (err: any) {
    // Check if error is due to CORS origin blocking
    if (err.name === "TypeError" && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"))) {
      corsBlocked = true;
    }
    reachable = false;
  }

  const targetModelReady = models.some((m) =>
    FALLBACK_MODELS.some((fb) => m.toLowerCase().startsWith(fb.split(":")[0]))
  );

  return {
    isAvailable: reachable,
    reachable,
    corsBlocked,
    customHost: host,
    version: reachable ? "Local v0.3+" : undefined,
    models,
    targetModelReady,
    embedModelReady: models.some((m) => m.includes("embed") || m.includes("nomic")),
  };
}

export const checkOllamaStatus = getOllamaStatus;

/**
 * Pull a model directly from local Ollama instance
 */
export async function pullModel(
  model: string,
  onProgress: (pct: number, speed?: string) => void
): Promise<void> {
  const host = await getActiveOllamaHost();
  const res = await fetch(`${host}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: model, stream: true }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Failed to initiate pull from local Ollama (${res.status} ${res.statusText})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split("\n").filter(Boolean)) {
      try {
        const obj = JSON.parse(line);
        if (obj.total && obj.completed) {
          const pct = Math.round((obj.completed / obj.total) * 100);
          onProgress(pct);
        }
      } catch {
        /* ignore parse ticks */
      }
    }
  }
}

export interface RagContext {
  fileName?: string;
  docType?: string;
  riskScore?: number;
  statutoryViolations?: Array<{
    ruleId: string;
    section?: string;
    act?: string;
    reasoning: string;
    citation?: string;
    counterClause?: string;
  }>;
  clauses?: Array<{
    id?: string;
    header: string;
    text: string;
    snippet?: string;
    risk?: { value: string; score?: number };
  }>;
  invoice?: any;
}

export interface RagQueryResult {
  answer: string;
  citations: string[];
  groundingSource: "ollama-local" | "wasm-vector-rag" | "statutory-rules";
  similarityScore?: number;
}

/**
 * In-Browser Grounded RAG Query Engine
 * 1. Executes in-browser semantic vector retrieval via WASM (@xenova/transformers).
 * 2. If local Ollama companion is connected, generates generative response.
 * 3. If local Ollama is offline, generates comprehensive deterministic legal audit response.
 */
export async function queryRAG(
  question: string,
  documentText: string,
  context?: RagContext
): Promise<RagQueryResult> {
  const citations: string[] = [];

  // Step 1: Chunk the document and perform in-browser vector search
  const chunks: VectorChunk[] = chunkDocument(documentText, context);
  const searchResults = await searchDocumentVectors(question, chunks, 3);

  let bestSnippet = "";
  let topSimilarity = 0;

  if (searchResults.length > 0 && searchResults[0].chunk.text) {
    bestSnippet = searchResults[0].chunk.text;
    topSimilarity = searchResults[0].similarity || searchResults[0].score;
    citations.push(bestSnippet.length > 250 ? bestSnippet.substring(0, 250) + "..." : bestSnippet);

    if (searchResults[1]?.chunk?.text) {
      citations.push(
        searchResults[1].chunk.text.length > 200
          ? searchResults[1].chunk.text.substring(0, 200) + "..."
          : searchResults[1].chunk.text
      );
    }
  } else {
    bestSnippet = documentText.substring(0, 300);
    citations.push(bestSnippet + "...");
  }

  // Step 2: Extract relevant statutory grounding citations
  const qLower = question.toLowerCase();
  if (context?.statutoryViolations && context.statutoryViolations.length > 0) {
    for (const flag of context.statutoryViolations) {
      if (
        (qLower.includes("payment") || qLower.includes("45") || qLower.includes("interest") || qLower.includes("msme")) &&
        flag.ruleId.startsWith("MSMED")
      ) {
        citations.push(`${flag.act || "MSMED Act 2006"} ${flag.section || "§15"}: ${flag.citation || ""}`);
      } else if (
        (qLower.includes("non-compete") || qLower.includes("compete") || qLower.includes("trade") || qLower.includes("restraint")) &&
        flag.ruleId.includes("NONCOMPETE")
      ) {
        citations.push(`ICA 1872 §27: ${flag.citation || "Percept D'Mark v. Zaheer Khan (2006) 4 SCC 227"}`);
      } else if (
        (qLower.includes("arbitrat") || qLower.includes("dispute") || qLower.includes("tribunal")) &&
        flag.ruleId.includes("ACA")
      ) {
        citations.push(`${flag.act || "Arbitration Act 1996"} ${flag.section || "§12(5)"}: ${flag.citation || "Perkins Eastman Precedent"}`);
      } else if (
        (qLower.includes("indemn") || qLower.includes("liab")) &&
        flag.ruleId.includes("INDEMNITY")
      ) {
        citations.push("Indian Contract Law: Unilateral indemnity asymmetry");
      }
    }
  }

  const uniqueCitations = Array.from(new Set(citations));

  // Step 3: Check if Local Ollama Companion is reachable
  const host = await getActiveOllamaHost();
  const st = await getOllamaStatus();

  if (st.isAvailable) {
    try {
      const violationSummary =
        context?.statutoryViolations?.map((v) => `- ${v.section}: ${v.reasoning}`).join("\n") || "None detected";

      const selectedModel =
        st.models.find((m) => m.startsWith("llama3.2") || m.startsWith("llama3.1") || m.startsWith("llama3") || m.startsWith("mistral") || m.startsWith("qwen")) ||
        st.models[0] ||
        CHAT_MODEL;

      const prompt = `You are ClauseIQ, an expert Indian MSME Legal AI assistant running 100% on-device.
DOCUMENT CONTEXT:
File: ${context?.fileName || "Active Document"} (${context?.docType || "contract"}, Risk Score: ${context?.riskScore || 0}/100)
Detected Statutory Violations:
${violationSummary}

RELEVANT RETRIEVED SNIPPET (In-Browser Vector RAG):
${bestSnippet}

USER INQUIRY: ${question}

Provide a concise, practical, legally grounded answer for an Indian MSME owner. Highlight any statutory protections under MSMED Act 2006 (e.g. 45-day payment terms, 3x RBI rate compound interest) or Indian Contract Act 1872 Section 27 (void post-termination non-compete) where applicable.`;

      const res = await fetch(`${host}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          prompt,
          stream: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          answer: data.response || "No response generated by local model.",
          citations: uniqueCitations,
          groundingSource: "ollama-local",
          similarityScore: topSimilarity,
        };
      }
    } catch (ollamaErr) {
      console.warn("Local Ollama inference failed; seamlessly falling back to in-browser statutory engine:", ollamaErr);
    }
  }

  // Step 4: Deterministic In-Browser Legal RAG Engine (Zero network calls required!)
  if (qLower.includes("payment") || qLower.includes("45") || qLower.includes("90") || qLower.includes("120") || qLower.includes("credit")) {
    return {
      answer:
        "Under Section 15 of the MSMED Act 2006, payment terms agreed in writing with registered MSME suppliers CANNOT legally exceed 45 days from delivery/acceptance. Any contract clause stipulating 90 or 120 days is statutorily void and superseded by law.\n\nFurthermore, Section 16 mandates that overdue payments incur compound monthly interest at 3× the RBI bank rate, and buyers cannot deduct this interest under Section 23 of the Income Tax Act.",
      citations: uniqueCitations,
      groundingSource: "statutory-rules",
      similarityScore: topSimilarity,
    };
  }

  if (qLower.includes("non-compete") || qLower.includes("post-termination") || qLower.includes("restrict") || qLower.includes("compete")) {
    return {
      answer:
        "Post-termination non-compete covenants are completely void and unenforceable in India under Section 27 of the Indian Contract Act 1872. The Supreme Court of India in Percept D'Mark (India) (P) Ltd. v. Zaheer Khan (2006) 4 SCC 227 established that restraints of trade operating after contract termination cannot be enforced against vendors or contractors.",
      citations: uniqueCitations,
      groundingSource: "statutory-rules",
      similarityScore: topSimilarity,
    };
  }

  if (qLower.includes("arbitrat") || qLower.includes("dispute") || qLower.includes("court") || qLower.includes("perkins")) {
    return {
      answer:
        "Under Section 12(5) of the Arbitration and Conciliation Act 1996 and the Supreme Court precedent in Perkins Eastman Architects DPC v. HSCC (India) Ltd. (2020), unilateral appointment of a sole arbitrator by one party is legally invalid.\n\nFor MSMEs, disputes regarding delayed payments can also be submitted directly to MSME Samadhaan (Micro and Small Enterprise Facilitation Council - MSEFC), which overrides private arbitration clauses under Section 18 of the MSMED Act 2006.",
      citations: uniqueCitations,
      groundingSource: "statutory-rules",
      similarityScore: topSimilarity,
    };
  }

  if (qLower.includes("counter") || qLower.includes("draft") || qLower.includes("amend") || qLower.includes("protect") || qLower.includes("clause")) {
    const counterClauses = context?.statutoryViolations?.map((v) => v.counterClause).filter(Boolean);
    if (counterClauses && counterClauses.length > 0) {
      return {
        answer: `Recommended Protective Counter-Clause Amendment:\n\n"${counterClauses[0]}"\n\nIssue this formally to the counterparty before contract execution to guarantee statutory protection under MSMED Act 2006 & Indian Contract Act 1872.`,
        citations: uniqueCitations,
        groundingSource: "statutory-rules",
        similarityScore: topSimilarity,
      };
    }
  }

  if (qLower.includes("summary") || qLower.includes("overview") || qLower.includes("risk") || qLower.includes("audit")) {
    return {
      answer: `Document Snapshot Analysis for "${context?.fileName || "Active Document"}":\n- Document Type: ${context?.docType?.toUpperCase() || "CONTRACT"}\n- Calculated Risk Score: ${context?.riskScore || 0}/100\n- Identified Statutory Risk Flags: ${context?.statutoryViolations?.length || 0}\n\nKey compliance checks verified against MSMED Act 2006 (Sec 15/16), ICA 1872 (Sec 27), and ACA 1996 (Sec 12(5)). All processing executed 100% on-device.`,
      citations: uniqueCitations,
      groundingSource: "wasm-vector-rag",
      similarityScore: topSimilarity,
    };
  }

  return {
    answer: `Relevant Grounded Passage from "${context?.fileName || "this document"}":\n\n"${bestSnippet.length > 250 ? bestSnippet.substring(0, 250) + "..." : bestSnippet}"\n\nYou can ask for statutory validity checks, payment term legal limits, or redrafted counter-clauses.`,
    citations: uniqueCitations,
    groundingSource: "wasm-vector-rag",
    similarityScore: topSimilarity,
  };
}
