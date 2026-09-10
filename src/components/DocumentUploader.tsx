import React, { useState } from "react";
import { Upload, FileText, Clipboard, Sparkles, ShieldCheck, ArrowRight, Zap, HardDrive, CheckCircle2 } from "lucide-react";
import { SAMPLE_DOCUMENTS, SampleDocument } from "../data/sampleDocuments";

interface DocumentUploaderProps {
  onAnalyzeText: (text: string, fileName?: string) => void;
  onSelectSample: (sample: SampleDocument) => void;
  isProcessing: boolean;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onAnalyzeText,
  onSelectSample,
  isProcessing,
}) => {
  const [activeTab, setActiveTab] = useState<"samples" | "file" | "paste">("file");
  const [pastedText, setPastedText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);

    if (file.name.endsWith(".pdf")) {
      // PDF handled by pdfjs-dist directly from ArrayBuffer in browser memory
      const { extractText } = await import("../ai/ocrService");
      const result = await extractText(file);
      onAnalyzeText(result.text, file.name);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        onAnalyzeText(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);

    if (file.name.endsWith(".pdf")) {
      const { extractText } = await import("../ai/ocrService");
      const result = await extractText(file);
      onAnalyzeText(result.text, file.name);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        onAnalyzeText(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;
    onAnalyzeText(pastedText, "Pasted_Legal_Document.txt");
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Tab Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-100">Document Intelligence Workspace</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a curated Indian legal sample or load your agreement for a 100% local on-device statutory audit.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("samples")}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === "samples"
                ? "bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Hackathon Benchmark Suite
          </button>

          <button
            onClick={() => setActiveTab("file")}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === "file"
                ? "bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Open File (PDF/TXT)
          </button>

          <button
            onClick={() => setActiveTab("paste")}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === "paste"
                ? "bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" /> Paste Plain Text
          </button>
        </div>
      </div>

      {/* Tab 1: Pre-loaded Demo Benchmark Set */}
      {activeTab === "samples" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Curated MSME Legal Dataset (Contracts &amp; Invoices)
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              6 Test Cases Ready
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAMPLE_DOCUMENTS.map((doc) => (
              <div
                key={doc.id}
                onClick={() => !isProcessing && onSelectSample(doc)}
                className="glass-card rounded-xl p-4 cursor-pointer transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        doc.type === "contract"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          : doc.type === "invoice"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {doc.type}
                    </span>
                    <span
                      className={`text-xs font-bold font-mono ${
                        doc.riskScore >= 75
                          ? "text-rose-400"
                          : doc.riskScore >= 40
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      Risk: {doc.riskScore}/100
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-100 text-sm group-hover:text-amber-400 transition-colors">
                    {doc.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {doc.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[10px]">{doc.filename}</span>
                  <span className="font-semibold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 text-[11px]">
                    1-Click Audit <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: File Upload (100% In-Browser Memory) */}
      {activeTab === "file" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
            dragActive
              ? "border-amber-400 bg-amber-500/10 shadow-2xl shadow-amber-500/10"
              : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
          }`}
        >
          <Upload className="w-10 h-10 mx-auto text-amber-400 mb-3 animate-bounce" />
          <h3 className="text-base font-bold text-slate-200">Drag &amp; Drop Contract or Invoice File</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            Read directly into browser memory via WebAssembly (<code className="text-amber-300 font-mono">FileReader</code> &amp; <code className="text-amber-300 font-mono">pdfjs-dist</code>).
          </p>

          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
              <CheckCircle2 className="w-3 h-3" /> 0 Bytes Sent to Server
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
              <HardDrive className="w-3 h-3" /> IndexedDB Local Storage
            </span>
          </div>

          <label className="mt-5 inline-block">
            <input
              type="file"
              accept=".txt,.md,.json,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-105 transition-all">
              <FileText className="w-4 h-4" /> Select Local File
            </span>
          </label>
        </div>
      )}

      {/* Tab 3: Paste Text */}
      {activeTab === "paste" && (
        <form onSubmit={handlePasteSubmit} className="space-y-4">
          <textarea
            rows={8}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste contract agreement text, vendor agreement, rent deed, or invoice plain text here..."
            className="w-full bg-slate-950/90 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl p-4 text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Length: {pastedText.length} characters (Kept in browser memory)</span>
            <button
              type="submit"
              disabled={isProcessing || !pastedText.trim()}
              className="bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Run Local Statutory Audit
            </button>
          </div>
        </form>
      )}

      {/* Privacy Guarantee Footer */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-2 text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4" /> Zero Network Egress • 100% In-Browser Device Execution
        </span>
        <span className="text-slate-500 font-mono hidden sm:inline">
          MSMED Act 2006 • ICA 1872 • ACA 1996
        </span>
      </div>
    </div>
  );
};
