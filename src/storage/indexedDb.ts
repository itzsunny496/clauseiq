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
  enableLocalRag: boolean;
  preferredLanguage: string;
}

export interface DeviceStorageEstimate {
  usageBytes: number;
  quotaBytes: number;
  usageFormatted: string;
  documentCount: number;
}

const DEFAULT_SETTINGS: LocalAppSettings = {
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
 * Save an analysis result in browser IndexedDB on device
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
 * Get all saved audit summaries from IndexedDB on device (ordered newest first)
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
 * Delete an audit from IndexedDB on device
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
 * Clear all local audits from device storage
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
 * Get device storage estimate for on-device data
 */
export async function getDeviceStorageEstimate(): Promise<DeviceStorageEstimate> {
  let usage = 0;
  let quota = 0;
  let count = 0;

  try {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      usage = est.usage || 0;
      quota = est.quota || 0;
    }
  } catch {}

  try {
    const audits = await getAllAuditsFromDb();
    count = audits.length;
  } catch {}

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return {
    usageBytes: usage,
    quotaBytes: quota,
    usageFormatted: formatBytes(usage),
    documentCount: count,
  };
}

/**
 * Export all on-device audit data as a JSON backup file to user's computer
 */
export async function exportAllDataToDeviceFile(): Promise<void> {
  const audits = await getAllAuditsFromDb();
  const exportPayload = {
    app: "ClauseIQ",
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    totalDocuments: audits.length,
    documents: audits,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `clauseiq_device_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export a single analysis result as a JSON file to user's computer
 */
export function exportSingleAuditToJsonFile(audit: AnalysisResult): void {
  const jsonString = JSON.stringify(audit, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = (audit.fileName || "analysis").replace(/[^a-zA-Z0-9_-]/g, "_");
  a.href = url;
  a.download = `clauseiq_${safeName}_report.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import and restore backup JSON file into device IndexedDB
 */
export async function importDataFromDeviceFile(file: File): Promise<{ success: boolean; importedCount: number; message: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    let itemsToImport: SavedAuditItem[] = [];
    if (data.documents && Array.isArray(data.documents)) {
      itemsToImport = data.documents;
    } else if (Array.isArray(data)) {
      itemsToImport = data;
    } else if (data.id && data.fileName && data.docType) {
      // Single item
      itemsToImport = [data];
    }

    if (itemsToImport.length === 0) {
      return { success: false, importedCount: 0, message: "No valid document audits found in the selected file." };
    }

    let count = 0;
    for (const item of itemsToImport) {
      if (item.result) {
        await saveAnalysisToDb(item.result);
        count++;
      }
    }

    return { success: true, importedCount: count, message: `Successfully restored ${count} document audits to device storage.` };
  } catch (err: any) {
    return { success: false, importedCount: 0, message: "Failed to parse backup file: " + (err.message || String(err)) };
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
