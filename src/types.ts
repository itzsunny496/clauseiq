// ============================================================
// ClauseIQ - Shared TypeScript Interfaces (v3.3)
// ============================================================

export type ReviewStatus = "pending" | "accepted" | "edited" | "rejected" | "verified";
export type DocType = "contract" | "invoice" | "general";
export type EntityType = "ORG" | "DATE" | "AMOUNT" | "GST_NUMBER" | "CLAUSE_TYPE" | "PERSON" | "MISC";
export type RiskLevel = "High" | "Medium" | "Low" | "Unclassified";
export type ConfidenceLevel = "high" | "medium" | "low";
export type OcrMethod = "pdfjs" | "tesseract" | "paste";
export type NerSource = "regex" | "ml";
export type ReviewSource = "rule-engine" | "llm" | "invoice-extractor" | "ner" | "ocr";
export type Language = "en" | "hi" | "ta" | "te" | "mr" | "bn";
export type ComplianceUrgency = "overdue" | "critical" | "warning" | "upcoming" | "future";
export type ComplianceEventType = "RENEWAL" | "NOTICE_DEADLINE" | "EXPIRY" | "PAYMENT_DUE";

export type ClauseCategory =
  | "PAYMENT"
  | "TERMINATION"
  | "AUTO_RENEWAL"
  | "LIABILITY"
  | "CONFIDENTIALITY"
  | "DISPUTE"
  | "OTHER";

export interface SessionStats {
  total: number;
  accepted: number;
  edited: number;
  rejected: number;
  pending: number;
  correctionRate: number;
}

export interface ReviewableItem<T> {
  id: string;
  value: T;
  aiConfidence: number;
  status: ReviewStatus;
  correctedValue?: T;
  source: ReviewSource;
  reviewedAt?: Date;
}

export interface NerEntity {
  text: string;
  type: EntityType;
  start: number;
  end: number;
  confidence: number;
  source: NerSource;
}

export interface StatutoryFlag {
  ruleId: string;
  act: string;
  section: string;
  citation: string;
  risk: RiskLevel;
  reasoning: string;
  counterClause?: string;
}

export interface ComplianceDate {
  date: string;
  type: string;
  urgency: "critical" | "warning" | "standard";
  label: string;
  snippet: string;
  actionableAdvice?: string;
}

export interface ComplianceEvent {
  id: string;
  clauseId: string;
  clauseCategory: ClauseCategory;
  eventType: ComplianceEventType;
  date: Date;
  daysFromToday: number;
  rawText: string;
  urgency: ComplianceUrgency;
}

export interface ClauseResult {
  id: string;
  header: string;
  text: string;
  snippet?: string;
  lineStart: number;
  lineEnd: number;
  categories: ClauseCategory[];
  risk: ReviewableItem<RiskLevel>;
  flags: StatutoryFlag[];
  entities: NerEntity[];
  complianceEvents?: ComplianceEvent[];
  reviewStatus?: ReviewStatus;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber?: string;
  vendorName?: string;
  totalAmount?: number;
  taxAmount?: number;
  invoiceDate?: string;
  dueDate?: string;
  gstin?: string;
  isMsmeVendor?: boolean;
  lineItems?: InvoiceLineItem[];
}

export interface InvoiceField {
  key: string;
  label: string;
  value: ReviewableItem<string>;
  confidence: ConfidenceLevel;
  snippet: string;
  entities: NerEntity[];
}

export interface GeneralDocResult {
  entities: NerEntity[];
  summary: string;
  wordCount: number;
}

export interface OcrResult {
  text: string;
  method: OcrMethod;
  confidence: number;
  pageCount: number;
}

export interface MultilingualSummary {
  language: string;
  executiveSummary: string;
  keyObligations: string[];
  criticalRisks: string[];
  actionableAdvice: string;
}

export interface AnalysisResult {
  id: string;
  docType: DocType;
  fileName: string;
  processedAt: Date;
  ocr: OcrResult;
  extractedText: string;
  processingTimeMs: number;
  riskScore: number;
  statutoryViolations: StatutoryFlag[];
  nerEntities: NerEntity[];
  clauses: ClauseResult[];
  invoice?: InvoiceData;
  invoiceFields?: InvoiceField[];
  generalDoc?: GeneralDocResult;
  complianceEvents?: ComplianceEvent[];
  complianceDates: ComplianceDate[];
  multilingualSummary: MultilingualSummary;
  deterministicSummary: string;
  hindiSummary?: string;
  llmSummary?: string;
  llmHindiSummary?: string;
  sessionStats: SessionStats;
}

export interface AvailableModel {
  id: string;
  name: string;
  size: string;
  vramRequirement: string;
  recommendedFor: string;
  isDefault?: boolean;
}

export interface WebLLMStatus {
  isAvailable: boolean;
  isModelLoaded: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  modelId: string;
  error?: string;
  hasFp16?: boolean;
  gpuAdapterName?: string;
}

/** @deprecated Use WebLLMStatus instead */
export type OllamaStatus = WebLLMStatus;

export const EMPTY_SESSION_STATS: SessionStats = {
  total: 0,
  accepted: 0,
  edited: 0,
  rejected: 0,
  pending: 0,
  correctionRate: 0,
};
