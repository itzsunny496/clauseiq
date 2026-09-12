import React, { useState } from "react";
import { WebLLMStatus } from "../types";
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Download,
  ShieldCheck,
  Loader2,
  Trash2,
} from "lucide-react";
import { initializeWebLLM, unloadWebLLM } from "../ai/webllmService";

interface WebLLMStatusBadgeProps {
  status: WebLLMStatus;
  onRefresh: () => void;
}

export const WebLLMStatusBadge: React.FC<WebLLMStatusBadgeProps> = ({ status, onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleLoadModel = async () => {
    setIsLoading(true);
    setLoadError(null);
    setLoadProgress(0);
    setProgressText("Initializing WebGPU...");
    try {
      await initializeWebLLM((report) => {
        setLoadProgress(report.progress);
        setProgressText(report.text);
      });
      onRefresh();
    } catch (err: any) {
      setLoadError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnloadModel = async () => {
    await unloadWebLLM();
    onRefresh();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            status.isModelLoaded
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10"
              : status.isAvailable
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          <Cpu className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-slate-100">In-Browser AI Engine (WebLLM)</h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <Zap className="w-3 h-3 mr-1" /> WebGPU Powered
            </span>

            {status.isModelLoaded ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Model Ready
              </span>
            ) : status.isAvailable ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <AlertTriangle className="w-3 h-3 mr-1" /> Model Not Loaded
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                <AlertTriangle className="w-3 h-3 mr-1" /> WebGPU Unavailable
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-0.5">
            {status.isModelLoaded
              ? `${status.modelId} loaded. 100% in-browser private inference via WebGPU \u2014 no server, no downloads.`
              : status.isAvailable
              ? "WebGPU is available. Load the AI model to enable full in-browser generative chat."
              : "WebGPU is not supported in this browser. Use Chrome 113+ or Edge 113+ for in-browser AI. Deterministic rule engine still works."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
          title="Refresh status"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {status.isModelLoaded ? (
          <button
            onClick={handleUnloadModel}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition border border-slate-700"
            title="Unload model and free GPU memory"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Unload Model</span>
          </button>
        ) : status.isAvailable ? (
          <button
            onClick={handleLoadModel}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading ({loadProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Load AI Model</span>
              </>
            )}
          </button>
        ) : null}
      </div>

      {/* Progress bar during download */}
      {isLoading && (
        <div className="w-full mt-2 space-y-1.5">
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            {progressText}
          </p>
        </div>
      )}

      {/* Error message */}
      {loadError && (
        <div className="w-full mt-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
          <strong>Error:</strong> {loadError}
        </div>
      )}

      {/* Privacy footer */}
      {status.isModelLoaded && (
        <div className="w-full mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>All inference runs inside your browser via WebGPU. Zero data leaves your device.</span>
        </div>
      )}
    </div>
  );
};
