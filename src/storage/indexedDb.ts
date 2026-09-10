import type { AnalysisResult, ReviewStatus } from "../types";

const DB_NAME = "ClauseIQ_DB";
const DB_VERSION = 1;

export interface SavedAuditItem {
  id: string;
  fileName: string;
  docType: string;
  processedAt: string;
  riskScore: number;
  statutoryViolationCount: number;
  result: AnalysisResult;
}

export interface LocalAppSettings {
  ollamaHost: string;
  enableLocalRag: boolean;
  preferredLanguage: string;
}

const DEFAULT_SETTINGS: LocalAppSettings = {
  ollamaHost: "http://127.0.0.1:11434",
  enableLocalRag: true,
  preferredLanguage: "en",
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("analyses")) {
        const analysisStore = db.createObjectStore("analyses", { keyPath: "id" });
        analysisStore.createIndex("processedAt", "processedAt", { unique: false });
        analysisStore.createIndex("fileName", "fileName", { unique: false });
      }

      if (!db.objectStoreNames.contains("reviewStates")) {
        db.createObjectStore("reviewStates", { keyPath: "docId" });
      }

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an analysis result in browser IndexedDB
 */
export async function saveAnalysisToDb(result: AnalysisResult): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("analyses", "readwrite");
      const store = tx.objectStore("analyses");

      const item: SavedAuditItem = {
        id: result.id,
        fileName: result.fileName,
        docType: result.docType,
        processedAt: result.processedAt instanceof Date ? result.processedAt.toISOString() : String(result.processedAt),
        riskScore: result.riskScore,
        statutoryViolationCount: result.statutoryViolations?.length || 0,
        result: {
          ...result,
          processedAt: result.processedAt instanceof Date ? result.processedAt : new Date(result.processedAt),
        },
      };

      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Failed to persist analysis to IndexedDB:", err);
  }
}

/**
 * Get all saved audit summaries from IndexedDB (ordered newest first)
 */
export async function getAllAuditsFromDb(): Promise<SavedAuditItem[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("analyses", "readonly");
      const store = tx.objectStore("analyses");
      const req = store.getAll();

      req.onsuccess = () => {
        const items = (req.result as SavedAuditItem[]) || [];
        items.sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Failed to read audits from IndexedDB:", err);
    return [];
  }
}

/**
 * Get a specific audit result by ID
 */
export async function getAuditByIdFromDb(id: string): Promise<AnalysisResult | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("analyses", "readonly");
      const store = tx.objectStore("analyses");
      const req = store.get(id);

      req.onsuccess = () => {
        const item = req.result as SavedAuditItem | undefined;
        if (!item) {
          resolve(null);
          return;
        }
        const res = item.result;
        if (res) {
          res.processedAt = new Date(res.processedAt);
        }
        resolve(res || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Failed to read audit from IndexedDB:", err);
    return null;
  }
}

/**
 * Delete an audit from IndexedDB
 */
export async function deleteAuditFromDb(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["analyses", "reviewStates"], "readwrite");
      tx.objectStore("analyses").delete(id);
      tx.objectStore("reviewStates").delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Failed to delete audit from IndexedDB:", err);
  }
}

/**
 * Clear all local audits from browser storage
 */
export async function clearAllAuditsFromDb(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["analyses", "reviewStates"], "readwrite");
      tx.objectStore("analyses").clear();
      tx.objectStore("reviewStates").clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Failed to clear IndexedDB:", err);
  }
}

/**
 * Save human review states for a document
 */
export async function saveReviewStateToDb(docId: string, reviewState: Record<string, ReviewStatus>): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("reviewStates", "readwrite");
      const store = tx.objectStore("reviewStates");
      const req = store.put({ docId, reviewState, updatedAt: new Date().toISOString() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Failed to save review state to IndexedDB:", err);
  }
}

/**
 * Get review states for a document
 */
export async function getReviewStateFromDb(docId: string): Promise<Record<string, ReviewStatus> | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("reviewStates", "readonly");
      const store = tx.objectStore("reviewStates");
      const req = store.get(docId);
      req.onsuccess = () => resolve(req.result?.reviewState || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return null;
  }
}

/**
 * Get local settings from IndexedDB (or fallback to localStorage / defaults)
 */
export async function getLocalSettings(): Promise<LocalAppSettings> {
  try {
    const raw = localStorage.getItem("clauseiq_settings");
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

/**
 * Save local settings to localStorage / IndexedDB
 */
export async function saveLocalSettings(settings: Partial<LocalAppSettings>): Promise<LocalAppSettings> {
  const current = await getLocalSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem("clauseiq_settings", JSON.stringify(updated));
  } catch {}
  return updated;
}
