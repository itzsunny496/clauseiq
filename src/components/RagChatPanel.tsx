import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  RotateCcw,
  Zap,
  Cpu,
  ShieldCheck,
} from "lucide-react";
import { queryRAG, RagQueryResult } from "../ai/webllmService";
import { AnalysisResult } from "../types";

interface RagChatPanelProps {
  documentText: string;
  analysisResult?: AnalysisResult | null;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  citations?: string[];
  groundingSource?: string;
  similarityScore?: number;
  timestamp: string;
}

export const RagChatPanel: React.FC<RagChatPanelProps> = ({ documentText, analysisResult }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showSnapshotDetails, setShowSnapshotDetails] = useState(false);

  // Initialize or update conversation whenever a new document snapshot is loaded
  useEffect(() => {
    const docName = analysisResult?.fileName || "Active Legal Document";
    const docType = analysisResult?.docType?.toUpperCase() || "DOCUMENT";
    const riskScore = analysisResult?.riskScore ?? 0;
    const violationCount = analysisResult?.statutoryViolations?.length ?? 0;

    let welcomeText = `Namaste! I have ingested the live snapshot for **${docName}** (${docType}, Risk Score: ${riskScore}/100).\n\nAll vector embeddings and statutory compliance checks are running 100% inside your browser WebAssembly.`;
    if (violationCount > 0) {
      welcomeText += `\n\n⚠ **${violationCount} statutory risk items** were detected in this snapshot (e.g. MSMED Act §15 payment caps, ICA §27 restrictive covenants, arbitrator bias). Ask me any question, request a legal audit breakdown, or ask me to draft protective counter-clauses!`;
    } else {
      welcomeText += `\n\nAsk me any question about clauses, compliance timelines, liabilities, or legal enforceability under Indian law.`;
    }

    setMessages([
      {
        sender: "ai",
        text: welcomeText,
        groundingSource: "wasm-vector-rag",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [analysisResult?.fileName, analysisResult?.id]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isThinking) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: ChatMessage = { sender: "user", text: textToSend, timestamp: now };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput("");
    setIsThinking(true);

    try {
      const ragResponse: RagQueryResult = await queryRAG(textToSend, documentText, {
        fileName: analysisResult?.fileName,
        docType: analysisResult?.docType,
        riskScore: analysisResult?.riskScore,
        statutoryViolations: analysisResult?.statutoryViolations,
        clauses: analysisResult?.clauses,
        invoice: analysisResult?.invoice,
      });

      const aiMsg: ChatMessage = {
        sender: "ai",
        text: ragResponse.answer,
        citations: ragResponse.citations,
        groundingSource: ragResponse.groundingSource,
        similarityScore: ragResponse.similarityScore,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const aiMsg: ChatMessage = {
        sender: "ai",
        text: "Error running local Q&A query: " + (err.message || String(err)),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleResetChat = () => {
    const docName = analysisResult?.fileName || "Active Legal Document";
    setMessages([
      {
        sender: "ai",
        text: `Chat reset. I am ready to answer new questions grounded in the snapshot for **${docName}**.`,
        groundingSource: "wasm-vector-rag",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Generate dynamic contextual question chips based on snapshot
  const suggestedQuestions: string[] = [];
  if (analysisResult?.statutoryViolations && analysisResult.statutoryViolations.length > 0) {
    if (analysisResult.statutoryViolations.some((v) => v.ruleId.includes("PAYMENT") || v.ruleId.includes("15"))) {
      suggestedQuestions.push("Explain the 45-day payment violation under MSMED Act §15");
      suggestedQuestions.push("Draft a protective counter-clause for payment terms");
    }
    if (analysisResult.statutoryViolations.some((v) => v.ruleId.includes("NONCOMPETE") || v.ruleId.includes("27"))) {
      suggestedQuestions.push("Is the post-termination non-compete clause void in India?");
    }
    if (analysisResult.statutoryViolations.some((v) => v.ruleId.includes("ARBITRAT") || v.ruleId.includes("12"))) {
      suggestedQuestions.push("Is unilateral arbitrator appointment valid under Perkins Eastman?");
    }
    if (analysisResult.statutoryViolations.some((v) => v.ruleId.includes("INDEMNITY"))) {
      suggestedQuestions.push("How does the one-sided indemnity clause harm an MSME?");
    }
  }

  if (suggestedQuestions.length < 3) {
    suggestedQuestions.push("Summarize the key financial obligations in this document");
    suggestedQuestions.push("What are the termination notice period requirements?");
    suggestedQuestions.push("Draft an amendment notice for the high-risk clauses");
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[650px] shadow-2xl overflow-hidden">
      {/* Header & Active Snapshot Bar */}
      <div className="bg-slate-800/90 px-6 py-3.5 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">Interactive Legal Document RAG Chat</h3>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> In-Browser WASM RAG
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Grounded on-device in active document embeddings &amp; Indian statutory rules. Zero network egress.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs flex items-center gap-1.5 transition"
          title="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">Reset Chat</span>
        </button>
      </div>

      {/* Snapshot Context Banner */}
      {analysisResult && (
        <div className="bg-slate-950/90 border-b border-slate-800 px-6 py-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Snapshot Attached
              </span>
              <span className="font-semibold text-slate-200 truncate max-w-xs">{analysisResult.fileName}</span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-slate-400 font-mono uppercase">{analysisResult.docType}</span>
              <span className="text-slate-500">&bull;</span>
              <span
                className={`font-bold font-mono ${
                  analysisResult.riskScore >= 70
                    ? "text-rose-400"
                    : analysisResult.riskScore >= 40
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                Risk: {analysisResult.riskScore}/100
              </span>
              {analysisResult.statutoryViolations?.length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> {analysisResult.statutoryViolations.length} Violations Detected
                </span>
              )}
            </div>

            <button
              onClick={() => setShowSnapshotDetails(!showSnapshotDetails)}
              className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition"
            >
              <span>{showSnapshotDetails ? "Hide Details" : "View Ingested Snapshot"}</span>
              {showSnapshotDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Collapsible Snapshot Details */}
          {showSnapshotDetails && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-lg">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Executive Summary
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {analysisResult.multilingualSummary?.executiveSummary || "Document text loaded into vector store."}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400 block mb-1">
                  Identified Statutory Risk Points ({analysisResult.statutoryViolations.length})
                </span>
                <ul className="space-y-1">
                  {analysisResult.statutoryViolations.slice(0, 3).map((v, i) => (
                    <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                      <span className="text-rose-400">&bull;</span>
                      <span>
                        <strong className="text-slate-200">{v.section}:</strong> {v.citation || v.reasoning}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "ai" && (
              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-xl p-4 shadow-md text-sm ${
                msg.sender === "user"
                  ? "bg-amber-500 text-slate-950 font-medium rounded-tr-none"
                  : "bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-none"
              }`}
            >
              <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>

              {/* Citations / Grounding list */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700/60 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-amber-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Grounded In Contract Snippets &amp; Statutory Precedents:
                    </span>
                    {msg.groundingSource && (
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-700">
                        {msg.groundingSource === "webllm-browser"
                          ? "WebLLM (In-Browser WebGPU)"
                          : msg.groundingSource === "wasm-vector-rag"
                          ? "WASM MiniLM-L6"
                          : "Deterministic Rule Engine"}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {msg.citations.map((cite, cIdx) => (
                      <li key={cIdx} className="text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px] leading-relaxed">
                        "{cite}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <span
                className={`text-[10px] mt-2 block text-right ${
                  msg.sender === "user" ? "text-slate-900/70" : "text-slate-500"
                }`}
              >
                {msg.timestamp}
              </span>
            </div>

            {msg.sender === "user" && (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 text-xs text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Searching in-browser vector embeddings &amp; cross-referencing Indian Law...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Questions Bar */}
      {suggestedQuestions.length > 0 && (
        <div className="px-6 py-2.5 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Quick Questions:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {suggestedQuestions.slice(0, 3).map((q, qIdx) => (
              <button
                key={qIdx}
                onClick={() => handleSend(q)}
                disabled={isThinking}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 transition whitespace-nowrap disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="p-4 bg-slate-800/40 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask anything about ${analysisResult?.fileName || "this document"} (e.g. 'Draft counter-clause for payment terms')...`}
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            className="bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm transition"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
