# ⚖️ ClauseIQ — AI Document & Contract Intelligence for Indian MSMEs

> **100% Client-Side, Zero-Upload Legal Contract & Invoice Intelligence Platform Built for 63+ Million Indian Enterprises.**

[![Privacy Guarantee](https://img.shields.io/badge/Privacy-100%25%20Zero--Upload%20%7C%20On--Device-emerald?style=for-the-badge&logo=shield)](https://github.com)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-In--Browser%20WebLLM%20%7C%20WebGPU-purple?style=for-the-badge&logo=webassembly)](https://github.com)
[![Statutory Law](https://img.shields.io/badge/Statutory%20Law-MSMED%202006%20%7C%20ICA%201872%20%7C%20ACA%201996-amber?style=for-the-badge&logo=balance-scale)](https://github.com)
[![Architecture](https://img.shields.io/badge/Architecture-WebGPU%20%2B%20WASM%20%2B%20IndexedDB%20%2B%20Local--First-blue?style=for-the-badge&logo=react)](https://github.com)
[![Deployment](https://img.shields.io/badge/Deployment-Vercel%20Ready%20%7C%20Zero--Server-black?style=for-the-badge&logo=vercel)](https://github.com)

---

## 📌 The Problem

Over **63 million Micro, Small, and Medium Enterprises (MSMEs)** form the backbone of the Indian economy (contributing ~30% of GDP). Yet, **92% sign vendor agreements, supply contracts, and procurement invoices without legal review** because commercial legal counsel costs **₹2,000–₹8,000/hour**.

As a result, small business owners routinely fall into catastrophic contractual traps:
- 🚨 **Predatory Payment Terms (90–120 days)** that strangle working capital and violate statutory protection caps.
- 🚨 **Unenforceable Post-Termination Non-Competes** that unlawfully restrict future livelihoods.
- 🚨 **Unilateral Indemnity & Biased Sole Arbitrators** that strip MSMEs of their dispute resolution rights under *MSME Samadhaan*.
- 🚨 **The Cloud Privacy Dilemma**: Uploading confidential pricing, client lists, and financial deeds to third-party cloud AI servers breaches NDAs and confidentiality covenants.

---

## 💡 The Solution: ClauseIQ

**ClauseIQ** is a **Local-First, Zero-Upload Document Intelligence Platform** that automates the extraction, statutory classification, risk scoring, and multilingual simplification of contracts and invoices — **running 100% inside your web browser**.

No servers, no third-party API keys, and **no software/Ollama downloads required**.

---

## ✨ Key Features

### 1. 🧠 In-Browser AI via WebLLM (No Ollama / No Downloads Needed)
- Runs large language models directly inside the browser using **WebGPU** acceleration and `@mlc-ai/web-llm`.
- Models are downloaded and cached once in the browser's persistent cache for instant offline reuse.
- **Selectable Model Tiers**:
  - **`SmolLM2-360M`** (~350 MB) — Ultra-fast, ideal for low-spec laptops and quick summaries.
  - **`Llama-3.2-1B`** (~800 MB, Default) — Balanced precision and speed for contract risk detection.
  - **`Qwen2.5-1.5B`** (~1.1 GB) — High-accuracy clause reasoning and legal nuance analysis.
  - **`Llama-3.2-3B`** (~2.0 GB) — Comprehensive legal reasoning for complex multi-page agreements.

### 2. 🔍 Local Vector RAG (Retrieval-Augmented Generation)
- Instant semantic chunking and TF-IDF / cosine similarity indexing in browser memory.
- Ask contract questions in plain English or Indian business contexts; answers are strictly grounded with exact section citations.

### 3. ⚖️ Deterministic Indian Statutory Law Engine
ClauseIQ runs rule-based statutory compliance checks against landmark Indian legislation:
- **MSMED Act 2006 (Sections 15 & 16)**: Flags payment terms exceeding 45 days and calculates statutory penal interest (3× RBI Bank Rate compounded monthly).
- **Indian Contract Act 1872 (Section 27)**: Detects void post-employment/post-contract non-competes.
- **Indian Contract Act 1872 (Section 28)**: Flags clauses that extinguish legal recourse or restrict limitation periods.
- **Arbitration & Conciliation Act 1996 (Section 12(5))**: Identifies unilaterally appointed sole arbitrators.

### 4. 📄 On-Device OCR & Named Entity Recognition (NER)
- **Tesseract.js (WASM)**: In-browser optical character recognition for scanned invoices and PDF contracts.
- **Transformers.js (WASM)**: Local BERT-based NER extracting contracting parties, governing law, jurisdiction, and critical dates.

### 5. 🌐 Multilingual Summaries for Indian MSMEs
- Generates executive contract summaries in **English, Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, and Kannada**.

### 6. 🔒 Cryptographic Integrity & Offline Persistence
- Generates **SHA-256 document checksums** for tamper verification.
- Stores documents, clauses, and analysis history locally in **IndexedDB**.

---

## 🏗️ Technical Architecture

```
                                  BROWSER CLIENT (100% On-Device)
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                             │
│  ┌───────────────────────┐      ┌─────────────────────────┐      ┌───────────────────────┐  │
│  │   Document Uploader   │ ───► │  Tesseract.js / PDF.js  │ ───► │   Transformers.js     │  │
│  │    (PDF, DOCX, TXT)   │      │      (WASM OCR)         │      │     (Local NER)       │  │
│  └───────────────────────┘      └─────────────────────────┘      └───────────────────────┘  │
│                                              │                               │              │
│                                              ▼                               ▼              │
│                                 ┌─────────────────────────┐     ┌────────────────────────┐  │
│                                 │   Statutory Law Engine  │     │   Local Vector RAG     │  │
│                                 │  (MSMED / ICA / ACA)    │     │   (TF-IDF / Cosine)    │  │
│                                 └─────────────────────────┘     └────────────────────────┘  │
│                                              │                               │              │
│                                              ▼                               ▼              │
│                                 ┌────────────────────────────────────────────────────────┐  │
│                                 │           WebLLM Engine (@mlc-ai/web-llm)              │  │
│                                 │        Llama-3.2 / SmolLM2 / Qwen2.5 (WebGPU)          │  │
│                                 └────────────────────────────────────────────────────────┘  │
│                                              │                                              │
│                                              ▼                                              │
│                                 ┌─────────────────────────┐                                 │
│                                 │   IndexedDB Persistence │                                 │
│                                 │     & Audit Reports     │                                 │
│                                 └─────────────────────────┘                                 │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                  Zero data ever leaves the user's machine.
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A modern browser with **WebGPU** support (Chrome 113+, Edge 113+, Brave, or Firefox Nightly)

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/yourusername/clauseiq.git
cd clauseiq

# Install dependencies
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```

---

## 🚢 Deploying to Vercel (One-Click)

Because ClauseIQ runs 100% client-side with no backend infrastructure:

1. Push your repository to **GitHub**.
2. Go to [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
3. Import your `clauseiq` repository.
4. Framework Preset will auto-detect as **Vite**:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy**.

---

## 🛡️ Privacy & Compliance Guarantee

| Privacy Feature | Implementation | Guarantee |
| :--- | :--- | :--- |
| **Document Processing** | Local Web Worker + WASM | Zero bytes sent to cloud servers |
| **AI Inference** | WebGPU via `@mlc-ai/web-llm` | Runs completely on client GPU/VRAM |
| **Document Storage** | Browser `IndexedDB` | Persisted strictly in local browser sandbox |
| **Integrity Audit** | SHA-256 Hash Generation | Cryptographic proof of non-tampering |

---

## 📜 Legal Disclaimer

*ClauseIQ is an AI-powered legal intelligence and document analysis tool designed for informational and triage purposes. It does not constitute formal legal representation or legal advice. Users are advised to consult a qualified legal professional or advocate for binding disputes.*

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
