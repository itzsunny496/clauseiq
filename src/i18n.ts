// ============================================================
// ClauseIQ - i18n: English + Regional Indian Languages
// ============================================================

export type Language = "en" | "hi" | "ta" | "te" | "mr" | "bn";

export const INDIAN_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
];

export const translations = {
  en: {
    HIGH_RISK: "High Risk",
    MEDIUM_RISK: "Medium Risk",
    LOW_RISK: "Low Risk",
    UNCLASSIFIED: "Unclassified / Needs Review",
    PENDING: "Awaiting Review",

    PAYMENT: "Payment Terms",
    TERMINATION: "Termination",
    AUTO_RENEWAL: "Auto-Renewal",
    LIABILITY: "Liability & Indemnity",
    CONFIDENTIALITY: "Confidentiality",
    DISPUTE: "Dispute Resolution",
    OTHER: "General",

    ACCEPT: "Accept",
    EDIT: "Edit",
    REJECT: "Reject",

    MSMED_VIOLATION: "MSMED Act Violation",
    MSMED_COMPLIANT: "MSMED Compliant",
    MSMED_EXCEEDS: "Exceeds 45-day MSMED Limit",

    CORRECTION_RATE: "Correction Rate",
    AWAITING_REVIEW: "Awaiting Review",
    AI_PROPOSED: "AI Proposed",
    HUMAN_CONFIRMED: "Human Confirmed",
    OCR_SCANNING: "Scanning document with OCR...",
    NER_LOADING: "Loading NER model (first run only)...",
    OLLAMA_OFFLINE: "Ollama Offline",
    OLLAMA_DETECTED: "Ollama Detected",
    OLLAMA_READY: "Model Ready",

    SUMMARY_TITLE: "Document Summary",
    COMPLIANCE_CALENDAR: "Compliance Calendar",
    EXPORT: "Export Memorandum",
    COPILOT: "Contract Copilot",

    OVERDUE: "Overdue",
    CRITICAL: "Critical (< 14 days)",
    UPCOMING: "Upcoming (14-60 days)",
    FUTURE: "Future",
  },
  hi: {
    HIGH_RISK: "उच्च जोखिम",
    MEDIUM_RISK: "मध्यम जोखिम",
    LOW_RISK: "कम जोखिम",
    UNCLASSIFIED: "अवर्गीकृत / समीक्षा आवश्यक",
    PENDING: "समीक्षा का इंतजार",

    PAYMENT: "भुगतान शर्तें",
    TERMINATION: "समाप्ति",
    AUTO_RENEWAL: "स्वतः नवीनीकरण",
    LIABILITY: "दायित्व एवं क्षतिपूर्ति",
    CONFIDENTIALITY: "गोपनीयता",
    DISPUTE: "विवाद समाधान",
    OTHER: "सामान्य",

    ACCEPT: "स्वीकार करें",
    EDIT: "संपादित करें",
    REJECT: "अस्वीकार करें",

    MSMED_VIOLATION: "MSMED कानून उल्लंघन",
    MSMED_COMPLIANT: "MSMED अनुपालन",
    MSMED_EXCEEDS: "45 दिन की MSMED सीमा से अधिक",

    CORRECTION_RATE: "सुधार दर",
    AWAITING_REVIEW: "समीक्षा का इंतजार",
    AI_PROPOSED: "AI द्वारा प्रस्तावित",
    HUMAN_CONFIRMED: "मानव द्वारा पुष्टि",
    OCR_SCANNING: "OCR के साथ दस्तावेज़ स्कैन हो रहा है...",
    NER_LOADING: "NER मॉडल लोड हो रहा है...",
    OLLAMA_OFFLINE: "Ollama ऑफ़लाइन",
    OLLAMA_DETECTED: "Ollama मिला",
    OLLAMA_READY: "मॉडल तैयार",

    SUMMARY_TITLE: "दस्तावेज़ सारांश",
    COMPLIANCE_CALENDAR: "अनुपालन कैलेंडर",
    EXPORT: "ज्ञापन निर्यात करें",
    COPILOT: "अनुबंध सह-पायलट",

    OVERDUE: "बकाया",
    CRITICAL: "गंभीर (< 14 दिन)",
    UPCOMING: "आगामी (14-60 दिन)",
    FUTURE: "भविष्य",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, lang: Language = "en"): string {
  const selectedDict = translations[lang as keyof typeof translations] || translations.en;
  return selectedDict[key as keyof typeof selectedDict] ?? translations.en[key as keyof typeof translations.en] ?? key;
}
