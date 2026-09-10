import { pipeline, env } from "@xenova/transformers";

// Configure @xenova/transformers for browser WASM execution
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface VectorChunk {
  id: string;
  text: string;
  embedding?: number[];
  metadata?: {
    type?: "clause" | "paragraph" | "statutory_rule" | "invoice_field";
    header?: string;
    section?: string;
    act?: string;
    riskScore?: number;
    ruleId?: string;
  };
}

export interface SearchResult {
  chunk: VectorChunk;
  score: number;
  similarity: number;
}

let embedderPipeline: any = null;
let isModelLoading = false;
let modelLoadError: string | null = null;

/**
 * Initialize the client-side embedding pipeline (WASM / WebGPU / CPU)
 */
export async function getEmbeddingPipeline(
  onProgress?: (progress: { status: string; progress?: number }) => void
) {
  if (embedderPipeline) return embedderPipeline;
  if (isModelLoading) {
    while (isModelLoading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (embedderPipeline) return embedderPipeline;
  }

  isModelLoading = true;
  try {
    embedderPipeline = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      progress_callback: (p: any) => {
        onProgress?.(p);
      },
    });
    isModelLoading = false;
    return embedderPipeline;
  } catch (err: any) {
    isModelLoading = false;
    modelLoadError = err.message || String(err);
    console.warn("Could not load Xenova WASM embeddings model; falling back to hybrid BM25 search:", err);
    return null;
  }
}

/**
 * Compute vector embedding for text using client-side WASM model
 */
export async function computeEmbedding(text: string): Promise<number[] | null> {
  try {
    const pipe = await getEmbeddingPipeline();
    if (!pipe) return null;

    const output = await pipe(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.warn("Embedding computation failed in browser:", err);
    return null;
  }
}

/**
 * Compute Cosine Similarity between two normalized vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Chunk a document text into semantic passages for vector indexing
 */
export function chunkDocument(documentText: string, context?: any): VectorChunk[] {
  const chunks: VectorChunk[] = [];
  let chunkIdx = 0;

  // 1. Add extracted clauses if available in context
  if (context?.clauses && Array.isArray(context.clauses)) {
    for (const c of context.clauses) {
      const text = `${c.header ? c.header + ": " : ""}${c.text || c.snippet || ""}`.trim();
      if (text.length > 20) {
        chunks.push({
          id: `clause-${c.id || chunkIdx++}`,
          text,
          metadata: {
            type: "clause",
            header: c.header,
            riskScore: c.risk?.score,
          },
        });
      }
    }
  }

  // 2. Add statutory violations
  if (context?.statutoryViolations && Array.isArray(context.statutoryViolations)) {
    for (const v of context.statutoryViolations) {
      const text = `Statutory Non-Compliance: ${v.act || ""} ${v.section || ""}. ${v.reasoning || ""}. Precedent / Legal citation: ${v.citation || ""}`.trim();
      chunks.push({
        id: `statutory-${v.ruleId || chunkIdx++}`,
        text,
        metadata: {
          type: "statutory_rule",
          section: v.section,
          act: v.act,
          ruleId: v.ruleId,
        },
      });
    }
  }

  // 3. Fallback / supplementary paragraph splitting
  const paragraphs = documentText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 30);

  for (const p of paragraphs) {
    if (!chunks.some((c) => c.text.includes(p.substring(0, 50)))) {
      chunks.push({
        id: `para-${chunkIdx++}`,
        text: p,
        metadata: { type: "paragraph" },
      });
    }
  }

  return chunks;
}

/**
 * Perform Hybrid Semantic + Keyword In-Browser Vector Search
 */
export async function searchDocumentVectors(
  query: string,
  chunks: VectorChunk[],
  topK: number = 3
): Promise<SearchResult[]> {
  if (chunks.length === 0) return [];

  const queryEmbedding = await computeEmbedding(query);
  const qTokens = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);

  const scored: SearchResult[] = [];

  for (const chunk of chunks) {
    let similarity = 0;
    if (queryEmbedding && chunk.embedding) {
      similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    }

    // Keyword relevance score (BM25-like boost)
    const lower = chunk.text.toLowerCase();
    let keywordScore = 0;
    for (const token of qTokens) {
      if (lower.includes(token)) {
        keywordScore += 0.2;
      }
    }

    // Combined hybrid score
    const finalScore = queryEmbedding ? similarity * 0.7 + Math.min(keywordScore, 0.3) : keywordScore;

    scored.push({
      chunk,
      score: finalScore,
      similarity,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
