import type { OcrResult } from "../types";

let tesseractWorker: import("tesseract.js").Worker | null = null;

async function getTesseractWorker() {
  if (tesseractWorker) return tesseractWorker;
  const { createWorker } = await import("tesseract.js");
  tesseractWorker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        window.dispatchEvent(new CustomEvent("ocr-progress", { detail: { progress: m.progress } }));
      }
    },
  });
  return tesseractWorker;
}

export async function extractText(file: File, onProgress?: (p: number) => void): Promise<OcrResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt" || ext === "md") {
    const text = await file.text();
    return { text, method: "paste", confidence: 100, pageCount: 1 };
  }

  if (ext === "pdf") {
    const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
    GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    let fullText = "";
    let usedTesseract = false;
    let totalConf = 0;
    let tessPages = 0;

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => (typeof item === "object" && item && "str" in item ? (item as any).str : ""))
        .join(" ");

      if (pageText.trim().length >= 50) {
        fullText += pageText + "\n";
      } else {
        usedTesseract = true;
        onProgress?.(((i - 1) / pageCount) * 0.5);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        const worker = await getTesseractWorker();
        const { data } = await worker.recognize(canvas);
        fullText += data.text + "\n";
        totalConf += data.confidence;
        tessPages++;
        onProgress?.((i / pageCount) * 0.9);
      }
    }

    onProgress?.(1);
    const avgConf = tessPages > 0 ? totalConf / tessPages : 100;
    return { text: fullText.trim(), method: usedTesseract ? "tesseract" : "pdfjs", confidence: avgConf, pageCount };
  }

  const text = await file.text();
  return { text, method: "paste", confidence: 100, pageCount: 1 };
}

export function extractFromPaste(text: string): OcrResult {
  return { text, method: "paste", confidence: 100, pageCount: 1 };
}
