import type { WebLLMStatus, AvailableModel } from "../types";
import { chunkDocument, searchDocumentVectors, VectorChunk } from "./localVectorRag";
import { CreateMLCEngine, MLCEngine, InitProgressReport } from "@mlc-ai/web-llm";

// --- Model Catalog for Different Laptop Hardware Profiles ---
export const AVAILABLE_MODELS: AvailableModel[] = [
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B (Recommended)",
    size: "~700 MB",
    vramRequirement: "1.5 GB RAM/VRAM",
    recommendedFor: "All laptops & integrated GPUs (Intel UHD/Iris, AMD Radeon)",
    isDefault: true,
  },
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 0.5B (Ultra-Light)",
    size: "~350 MB",
    vramRequirement: "1 GB RAM/VRAM",
    recommendedFor: "Low-spec, budget laptops & older hardware",
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B (High Precision)",
    size: "~2.2 GB",
    vramRequirement: "4 GB+ VRAM",
    recommendedFor: "High-performance laptops with dedicated NVIDIA/AMD GPUs",
  },
];

const DEFAULT_MODEL_ID = AVAILABLE_MODELS[0].id;

// --- Singleton Engine State ---
let engine: MLCEngine | null = null;
let engineModelId: string = DEFAULT_MODEL_ID;
let isInitializing = false;
let initError: string | null = null;
let downloadProgress = 0;
let isModelLoaded = false;
let detectedGpuInfo: { hasFp16?: boolean; name?: string } | null = null;

/**
 * Check if WebGPU is supported and safely detect GPU capabilities
 */
async function checkWebGPUSupport(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.gpu) return false;
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return false;
    
    detectedGpuInfo = {
      hasFp16: adapter.features ? adapter.features.has("shader-f16") : false,
      name: (adapter as any).info?.description || (adapter as any).info?.architecture || "WebGPU Graphics Adapter",
    };
    return true;
  } catch {
    return false;
  }
}

/**
 * Change the selected AI model ID before initialization
 */
export function setWebLLMModelId(modelId: string): void {
  if (engineModelId !== modelId) {
    if (engine && isModelLoaded) {
      unloadWebLLM();
    }
    engineModelId = modelId;
  }
}

/**
 * Get current WebLLM engine status
 */
export async function getWebLLMStatus(): Promise<WebLLMStatus> {
  const webGPUSupported = await checkWebGPUSupport();
  return {
    isAvailable: webGPUSupported,
    isModelLoaded,
    isDownloading: isInitializing,
    downloadProgress,
    modelId: engineModelId,
    error: initError || undefined,
    hasFp16: detectedGpuInfo?.hasFp16,
    gpuAdapterName: detectedGpuInfo?.name,
  };
}

export const checkWebLLMStatus = getWebLLMStatus;

/**
 * Initialize the WebLLM engine. Downloads model weights on first run
 * (cached in browser Cache API for subsequent loads).
 */
export async function initializeWebLLM(
  onProgress?: (report: { text: string; progress: number }) => void,
  targetModelId?: string
): Promise<void> {
  if (targetModelId) {
    engineModelId = targetModelId;
  }

  if (engine && isModelLoaded) return;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return;
  }

  isInitializing = true;
  initError = null;
  downloadProgress = 0;

  try {
    const webGPUSupported = await checkWebGPUSupport();
    if (!webGPUSupported) {
      throw new Error(
        "WebGPU is not enabled or supported on this browser/GPU. ClauseIQ will automatically run in Universal CPU / WASM + Rule Engine mode (100% functional)."
      );
    }

    engine = await CreateMLCEngine(engineModelId, {
      initProgressCallback: (report: InitProgressReport) => {
        const pct = Math.round((report.progress ?? 0) * 100);
        downloadProgress = pct;
        onProgress?.({
          text: report.text,
          progress: pct,
        });
      },
    });

    isModelLoaded = true;
    downloadProgress = 100;
  } catch (err: any) {
    initError = err.message || String(err);
    engine = null;
    isModelLoaded = false;
    throw err;
  } finally {
    isInitializing = false;
  }
}

/**
 * Unload the WebLLM engine and free GPU memory
 */
export async function unloadWebLLM(): Promise<void> {
  if (engine) {
    try {
      await engine.unload();
    } catch {}
    engine = null;
  }
  isModelLoaded = false;
  downloadProgress = 0;
  initError = null;
}

// --- RAG Types ---

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
  groundingSource: "webllm-browser" | "wasm-vector-rag" | "statutory-rules";
  similarityScore?: number;
}

/**
 * In-Browser Grounded RAG Query Engine
 * 1. Executes in-browser semantic vector retrieval via WASM (@xenova/transformers).
 * 2. If WebLLM engine is loaded, generates generative response via WebGPU.
 * 3. If WebLLM is not loaded or on low-spec hardware without WebGPU, generates comprehensive deterministic legal audit response.
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
        citations.push(`${flag.act || "MSMED Act 2006"} ${flag.section || "§15"}: ${flag.citation || "45-day statutory cap"}`);
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
        citations.push("Indian Contract Act 1872 §124/125: Unilateral indemnity asymmetry");
      }
    }
  }

  const uniqueCitations = Array.from(new Set(citations));

  // Step 3: Try WebLLM in-browser inference via WebGPU if initialized
  if (engine && isModelLoaded) {
    try {
      const violationSummary =
        context?.statutoryViolations?.map((v) => `- ${v.section}: ${v.reasoning}`).join("\n") || "None detected";

      const systemPrompt = `You are ClauseIQ, an expert Indian MSME Legal AI assistant running 100% in-browser via WebGPU.
DOCUMENT CONTEXT:
File: ${context?.fileName || "Active Document"} (${context?.docType || "contract"}, Risk Score: ${context?.riskScore || 0}/100)
Detected Statutory Violations:
${violationSummary}

RELEVANT RETRIEVED SNIPPET (In-Browser Vector RAG):
${bestSnippet}

Provide a concise, practical, legally grounded answer for an Indian MSME owner. Highlight any statutory protections under MSMED Act 2006 (e.g. 45-day payment terms, 3x RBI rate compound interest) or Indian Contract Act 1872 Section 27 (void post-termination non-compete) where applicable.`;

      const reply = await engine.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.3,
        max_tokens: 512,
      });

      const responseText = reply.choices?.[0]?.message?.content;
      if (responseText) {
        return {
          answer: responseText,
          citations: uniqueCitations,
          groundingSource: "webllm-browser",
          similarityScore: topSimilarity,
        };
      }
    } catch (webllmErr) {
      console.warn("WebLLM in-browser inference fallback to statutory engine:", webllmErr);
    }
  }

  // Step 4: Universal CPU/WASM + Statutory Legal Engine (Works seamlessly on every laptop!)
  if (qLower.includes("payment") || qLower.includes("45") || qLower.includes("90") || qLower.includes("120") || qLower.includes("credit") || qLower.includes("overdue") || qLower.includes("delay")) {
    return {
      answer:
        "Under Section 15 of the MSMED Act 2006, payment terms agreed in writing with registered MSME suppliers CANNOT legally exceed 45 days from the date of acceptance of goods or services. Any contract clause stipulating 60, 90, or 120 days is statutorily void and superseded by Indian law.\n\nFurthermore, Section 16 mandates that overdue payments incur compound monthly interest at 3× the RBI bank rate, and buyers cannot deduct this interest under Section 23 of the Income Tax Act.",
      citations: uniqueCitations,
      groundingSource: "statutory-rules",
      similarityScore: topSimilarity,
    };
  }

  if (qLower.includes("non-compete") || qLower.includes("post-termination") || qLower.includes("restrict") || qLower.includes("compete") || qLower.includes("restraint")) {
    return {
      answer:
        "Post-termination non-compete covenants are completely void and unenforceable in India under Section 27 of the Indian Contract Act 1872. The Supreme Court of India in Percept D'Mark (India) (P) Ltd. v. Zaheer Khan (2006) 4 SCC 227 established that restraints of trade operating after contract termination cannot be enforced against vendors, consultants, or contractors.",
      citations: uniqueCitations,
      groundingSource: "statutory-rules",
      similarityScore: topSimilarity,
    };
  }

  if (qLower.includes("arbitrat") || qLower.includes("dispute") || qLower.includes("court") || qLower.includes("perkins") || qLower.includes("tribunal")) {
    return {
      answer:
        "Under Section 12(5) of the Arbitration and Conciliation Act 1996 and the landmark Supreme Court ruling in Perkins Eastman Architects DPC v. HSCC (India) Ltd. (2020), unilateral appointment of a sole arbitrator by one contracting party is illegal and invalid.\n\nFor MSMEs, delayed payment disputes can also be submitted directly to MSME Samadhaan (Micro and Small Enterprise Facilitation Council - MSEFC), which statutorily overrides private arbitration clauses under Section 18(4) of the MSMED Act 2006.",
      citations: uniqueCitations,
      groundingSource: "statutory-rules",
      similarityScore: topSimilarity,
    };
  }

  if (qLower.includes("indemn") || qLower.includes("liab") || qLower.includes("damage") || qLower.includes("uncapped") || qLower.includes("loss")) {
    return {
      answer:
        "Under Indian Contract Act 1872 (§§ 73 & 124), unilateral, uncapped indemnity clauses disproportionately expose MSME vendors to consequential and indirect damages.\n\nRecommended Protective Counter-Position: Cap total aggregate liability to 100% of fees paid under the contract in the preceding 12 months, and expressly exclude indirect, punitive, or consequential losses.",
      citations: uniqueCitations,
      groundingSource: "statutory-rules",
      similarityScore: topSimilarity,
    };
  }

  if (qLower.includes("counter") || qLower.includes("draft") || qLower.includes("amend") || qLower.includes("protect") || qLower.includes("clause") || qLower.includes("rewrite")) {
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

  if (qLower.includes("summary") || qLower.includes("overview") || qLower.includes("risk") || qLower.includes("audit") || qLower.includes("review")) {
    return {
      answer: `Document Snapshot Analysis for "${context?.fileName || "Active Document"}":\n- Document Type: ${context?.docType?.toUpperCase() || "CONTRACT"}\n- Calculated Risk Score: ${context?.riskScore || 0}/100\n- Identified Statutory Risk Flags: ${context?.statutoryViolations?.length || 0}\n\nKey compliance checks verified against MSMED Act 2006 (Sec 15/16), ICA 1872 (Sec 27), and ACA 1996 (Sec 12(5)). All processing executed 100% in-browser on CPU/WebGPU.`,
      citations: uniqueCitations,
      groundingSource: "wasm-vector-rag",
      similarityScore: topSimilarity,
    };
  }

  return {
    answer: `Relevant Grounded Passage from "${context?.fileName || "this document"}":\n\n"${bestSnippet.length > 250 ? bestSnippet.substring(0, 250) + "..." : bestSnippet}"\n\nYou can ask about statutory validity checks, payment term legal limits, arbitrator neutrality, or redrafted counter-clauses.`,
    citations: uniqueCitations,
    groundingSource: "wasm-vector-rag",
    similarityScore: topSimilarity,
  };
}
