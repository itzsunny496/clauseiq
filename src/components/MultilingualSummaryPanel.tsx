import React from "react";
import { MultilingualSummary } from "../types";
import { Globe, Sparkles, CheckCircle2, Shield, AlertTriangle, Printer } from "lucide-react";
import { INDIAN_LANGUAGES } from "../i18n";
import { REGIONAL_UI_LABELS } from "../ai/regionalSummarizer";

interface MultilingualSummaryPanelProps {
  summary: MultilingualSummary;
  onLanguageChange: (langCode: string) => void;
  isLoading?: boolean;
}

export const MultilingualSummaryPanel: React.FC<MultilingualSummaryPanelProps> = ({
  summary,
  onLanguageChange,
  isLoading = false,
}) => {
  const currentLang = summary.language || "en";
  const labels = REGIONAL_UI_LABELS[currentLang] || REGIONAL_UI_LABELS.en;

  const handleSelectLang = (code: string) => {
    onLanguageChange(code);
  };

  const handlePrint = () => {
    const currentLangObj =
      INDIAN_LANGUAGES.find((l) => l.code === currentLang) || { name: "English", nativeName: "English" };

    const printWindow = window.open("", "_blank", "width=850,height=1100");
    if (!printWindow) {
      window.print();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${labels.docTitle} - ${currentLangObj.name}</title>
        <meta charset="UTF-8">
        <style>
          @page { size: A4 portrait; margin: 14mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            padding: 20px;
            line-height: 1.45;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
            margin-bottom: 16px;
          }
          .brand { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
          .brand span { color: #d97706; }
          .tagline { font-size: 9.5px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; }
          .meta { text-align: right; font-size: 10.5px; color: #475569; }
          .meta strong { color: #0f172a; }
          .section-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 14px;
          }
          .box.alert {
            background: #fffbeb;
            border-color: #fde68a;
          }
          .box.danger {
            background: #fef2f2;
            border-color: #fecaca;
          }
          .summary-text { font-size: 11.5px; color: #334155; line-height: 1.5; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
          ul { list-style-type: none; }
          li { font-size: 10.5px; color: #334155; margin-bottom: 5px; display: flex; align-items: flex-start; gap: 6px; line-height: 1.35; }
          li::before { content: "•"; color: #d97706; font-weight: bold; font-size: 13px; line-height: 1; }
          .danger li::before { content: "⚠"; color: #dc2626; font-size: 10px; margin-top: 1px; }
          .action-text { font-size: 11px; font-weight: 600; color: #92400e; line-height: 1.45; }
          .footer {
            margin-top: 18px;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 8.5px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Clause<span>IQ</span></div>
            <div class="tagline">${labels.subTitleHeader}</div>
          </div>
          <div class="meta">
            <div>${labels.reportLangLabel}: <strong>${currentLangObj.nativeName} (${currentLangObj.name})</strong></div>
            <div>${labels.dateLabel}: <strong>${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong></div>
            <div>${labels.statuteLabel}</div>
          </div>
        </div>

        <div class="section-title">${labels.sec1Title}</div>
        <div class="box">
          <p class="summary-text">${summary.executiveSummary}</p>
        </div>

        <div class="grid">
          <div class="box" style="margin-bottom:0;">
            <div class="section-title" style="color:#059669;">${labels.keyObligationsHeader}</div>
            <ul>
              ${summary.keyObligations.map((o) => `<li>${o}</li>`).join("")}
            </ul>
          </div>

          <div class="box danger" style="margin-bottom:0;">
            <div class="section-title" style="color:#dc2626;">${labels.highRiskHeader}</div>
            <ul>
              ${summary.criticalRisks.map((r) => `<li>${r}</li>`).join("")}
            </ul>
          </div>
        </div>

        <div class="section-title" style="color:#b45309; margin-top: 12px;">${labels.sec2Title}</div>
        <div class="box alert">
          <p class="action-text">${summary.actionableAdvice}</p>
        </div>

        <div class="footer">
          <div>${labels.footerNotice1}</div>
          <div>${labels.footerNotice2}</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header, Language Selector and Print Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" /> {labels.panelTitle}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {labels.panelSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Language selector chips */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
            {INDIAN_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelectLang(lang.code)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  currentLang === lang.code
                    ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                    : "text-slate-300 hover:text-slate-100 hover:bg-slate-700"
                }`}
              >
                {lang.nativeName} <span className="text-[10px] opacity-70">({lang.name})</span>
              </button>
            ))}
          </div>

          {/* 1-Page Print / Export Button */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition active:scale-95"
            title="Print or Save 1-Page Legal Memorandum as PDF in selected language"
          >
            <Printer className="w-4 h-4" /> {labels.printBtn}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Translating & Summarizing in Regional Language...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive Overview Box */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> {labels.corePurposeHeader}
            </h4>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">{summary.executiveSummary}</p>
          </div>

          {/* Key Obligations & Risks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Essential Rights & Obligations */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-lg p-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {labels.keyObligationsHeader}
              </h4>
              <ul className="space-y-2">
                {summary.keyObligations.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Critical Financial & Legal Risks */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-lg p-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-rose-400 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> {labels.highRiskHeader}
              </h4>
              <ul className="space-y-2">
                {summary.criticalRisks.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Plain English/Regional Action Plan */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
            <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400 mb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> {labels.recommendedActionHeader}
            </h4>
            <p className="text-xs text-amber-200/90 leading-relaxed font-medium">{summary.actionableAdvice}</p>
          </div>
        </div>
      )}
    </div>
  );
};
