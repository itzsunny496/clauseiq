import React, { useState } from "react";
import { OllamaStatus } from "../types";
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Download,
  Settings2,
  Copy,
  Check,
  ShieldCheck,
  X,
} from "lucide-react";
import { pullModel } from "../ai/ollamaService";
import { saveLocalSettings } from "../storage/indexedDb";

interface OllamaStatusBadgeProps {
  status: OllamaStatus;
  onRefresh: () => void;
}

export const OllamaStatusBadge: React.FC<OllamaStatusBadgeProps> = ({ status, onRefresh }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [customHost, setCustomHost] = useState(status.customHost || "http://127.0.0.1:11434");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handlePull = async () => {
    setIsPulling(true);
    setPullProgress(5);
    try {
      await pullModel("llama3.2:3b", (percent) => setPullProgress(percent));
      onRefresh();
    } catch (err: any) {
      alert("Error pulling local Ollama model: " + err.message);
    } finally {
      setIsPulling(false);
    }
  };

  const handleSaveHost = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveLocalSettings({ ollamaHost: customHost.trim() });
    setShowSettings(false);
    onRefresh();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              status.isAvailable
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10"
                : status.corsBlocked
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            <Cpu className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-100">Primary Local AI Engine (Ollama)</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <Zap className="w-3 h-3 mr-1" /> Primary AI Layer
              </span>

              {status.isAvailable ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> On-Device LLM Connected ({status.models.length} Models)
                </span>
              ) : status.corsBlocked ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <AlertTriangle className="w-3 h-3 mr-1" /> CORS Origin Configuration Required
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Engine Offline — Start Ollama
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              {status.isAvailable
                ? `Direct browser connection to ${status.customHost || "localhost:11434"}. 100% on-device private inference.`
                : status.corsBlocked
                ? "Ollama running on localhost but blocking cross-origin web requests. Click 'Setup Ollama' to allow origins."
                : "Ollama is the primary local LLM engine. Start Ollama with 'ollama serve' to enable full on-device AI inference."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
            title="Refresh connection status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition border border-slate-700"
            title="Configure local Ollama engine settings"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Setup Ollama</span>
          </button>

          {status.isAvailable && !status.models.some((m) => m.includes("llama3") || m.includes("mistral")) && (
            <button
              onClick={handlePull}
              disabled={isPulling}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isPulling ? `Pulling Model (${pullProgress}%)...` : "Pull Llama 3.2"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Ollama Setup & CORS Instructions Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Local Ollama AI Engine Setup</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <p className="leading-relaxed">
                ClauseIQ utilizes <strong>Ollama as its primary on-device LLM engine</strong> to perform deep statutory reasoning, interactive contract RAG, and automated counter-clause generation with 100% privacy.
              </p>

              {/* CORS Instruction Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Start Ollama with Web Origin Access
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Run in terminal</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Windows (PowerShell):</span>
                    <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300">
                      <code>$env:OLLAMA_ORIGINS="*" ; ollama serve</code>
                      <button
                        onClick={() => copyToClipboard('$env:OLLAMA_ORIGINS="*" ; ollama serve', "win")}
                        className="text-slate-400 hover:text-white ml-2 transition"
                        title="Copy command"
                      >
                        {copiedCmd === "win" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">macOS / Linux:</span>
                    <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300">
                      <code>OLLAMA_ORIGINS="*" ollama serve</code>
                      <button
                        onClick={() => copyToClipboard('OLLAMA_ORIGINS="*" ollama serve', "mac")}
                        className="text-slate-400 hover:text-white ml-2 transition"
                        title="Copy command"
                      >
                        {copiedCmd === "mac" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Host URL Form */}
              <form onSubmit={handleSaveHost} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Local Ollama Endpoint (Default: http://127.0.0.1:11434)
                  </label>
                  <input
                    type="text"
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                    placeholder="http://127.0.0.1:11434"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Direct on-device inference (127.0.0.1)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSettings(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                    >
                      Save &amp; Reconnect
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
