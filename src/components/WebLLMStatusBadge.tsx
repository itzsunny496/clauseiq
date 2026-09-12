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
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { initializeWebLLM, unloadWebLLM, AVAILABLE_MODELS, setWebLLMModelId } from "../ai/webllmService";

interface WebLLMStatusBadgeProps {
  status: WebLLMStatus;
  onRefresh: () => void;
}

export const WebLLMStatusBadge: React.FC<WebLLMStatusBadgeProps> = ({ status, onRefresh }) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(status.modelId || AVAILABLE_MODELS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleModelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedModelId(newId);
    setWebLLMModelId(newId);
    onRefresh();
  };

  const handleLoadModel = async () => {
    setIsLoading(true);
    setLoadError(null);
    setLoadProgress(0);
    setProgressText("Initializing WebGPU shader pipeline...");
    try {
      await initializeWebLLM((report) => {
        setLoadProgress(report.progress);
        setProgressText(report.text);
      }, selectedModelId);
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

  const currentModelMeta = AVAILABLE_MODELS.find((m) => m.id === (status.modelId || selectedModelId)) || AVAILABLE_MODELS[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              status.isModelLoaded
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10"
                : status.isAvailable
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
            }`}
          >
            <Cpu className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-100">In-Browser AI Engine</h4>

              {status.isAvailable ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <Zap className="w-3 h-3 mr-1" /> WebGPU Supported
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  <Layers className="w-3 h-3 mr-1" /> Universal CPU / WASM Mode
                </span>
              )}

              {status.isModelLoaded ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Model Ready
                </span>
              ) : status.isAvailable ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  <Sparkles className="w-3 h-3 mr-1" /> Ready to Load
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> 100% Functional (No GPU Required)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1">
              {status.isModelLoaded
                ? `${currentModelMeta.name} is active in VRAM. 100% private in-browser generation with zero server calls.`
                : status.isAvailable
                ? `WebGPU is ready on this device. Select a model size suitable for your laptop RAM/GPU.`
                : "Universal CPU/WASM mode active. Semantic vector search and statutory audit engine work seamlessly on all laptops."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {status.isAvailable && !status.isModelLoaded && (
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Profile:</span>
              <select
                value={selectedModelId}
                onChange={handleModelSelect}
                disabled={isLoading}
                className="bg-transparent text-xs font-semibold text-amber-300 focus:outline-none cursor-pointer"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                    {m.name} ({m.size})
                  </option>
                ))}
              </select>
            </div>
          )}

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
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 shadow-md shadow-emerald-900/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading ({loadProgress}%)...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Load Model ({currentModelMeta.size})</span>
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* Hardware Recommendation Note for Laptops */}
      {status.isAvailable && !status.isModelLoaded && (
        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong className="text-slate-300">Laptop Tip:</strong> {currentModelMeta.recommendedFor}.
            Requires {currentModelMeta.vramRequirement}. Weights are cached in browser storage after first load.
          </span>
        </div>
      )}

      {/* Progress bar during download */}
      {isLoading && (
        <div className="w-full mt-1 space-y-1.5">
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
        <div className="w-full mt-1 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="space-y-1">
            <strong>Engine Initialization Notice:</strong>
            <p className="text-[11px] text-slate-300">{loadError}</p>
            <p className="text-[11px] text-amber-300">
              Tip: If your laptop has lower RAM/VRAM, select <strong>"Qwen 2.5 0.5B (Ultra-Light)"</strong> from the profile dropdown, or continue with Universal CPU/WASM mode.
            </p>
          </div>
        </div>
      )}

      {/* Privacy footer */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>All AI processing runs 100% locally in your browser. Zero document data leaves this laptop.</span>
        </div>
        {status.gpuAdapterName && (
          <span className="text-slate-500 font-mono hidden md:inline truncate max-w-xs">
            {status.gpuAdapterName}
          </span>
        )}
      </div>
    </div>
  );
};
