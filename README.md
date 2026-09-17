# GeM AI Bid Compliance Verification System

An end-to-end AI-powered software platform for auditing **Government e-Marketplace (GeM)** Tender & RFP specifications against multi-document Bidder Submission Packages (Technical proposals, CA turnover certificates, OEM authorizations, Make-in-India declarations, GFR 2017 land border sharing affidavits, and ISO quality certs).

---

## Technical Architecture & Working Protocol

```
+------------------------+      +-------------------------------+
|  GeM Tender PDF / RFP  |      | Bidder Document Package (PDFs)|
+-----------+------------+      +---------------+---------------+
            |                                   |
            v                                   v
+---------------------------------------------------------------+
|           OCR & PDF Parsing Engine (PyMuPDF / pdfplumber)      |
+-------------------------------+-------------------------------+
                                |
                                v
+---------------------------------------------------------------+
|        Text Chunker & Vector DB Indexer (Semantic RAG)        |
+-------------------------------+-------------------------------+
                                |
                                v
+---------------------------------------------------------------+
|       AI/NLP Compliance Engine & Rule Verification Matrix      |
|  - Gemini 2.5 LLM Reasoning (API key configurable)            |
|  - Rule 144(xi) GFR Land Border & Make-in-India Heuristics     |
+-------------------------------+-------------------------------+
                                |
                                v
+---------------------------------------------------------------+
|           PostgreSQL Database (SQLAlchemy Engine)              |
+-------------------------------+-------------------------------+
                                |
                                v
+-------------------------------+-------------------------------+
|    React.js Dashboard UI      |   Exportable PDF Audit Report |
|  - Clause-by-Clause Matrix    |   - Executive Summary         |
|  - Evidence Snippet Viewer    |   - Category Scores           |
|  - Manual Committee Override  |   - Discrepancy Risk Alerts   |
+-------------------------------+-------------------------------+
```

---

## Tech Stack

- **Frontend**: React.js, HTML5, CSS3 / Tailwind CSS, Lucide Icons, Recharts, Axios
- **Backend**: Python 3.11, FastAPI, Uvicorn, Pydantic
- **Database**: PostgreSQL (via SQLAlchemy) with automatic SQLite fallback
- **Vector Database**: Semantic vector embedding & similarity store with page-level RAG citations
- **OCR & Document Extraction**: PyMuPDF (`fitz`), `pdfplumber`, `pytesseract`
- **AI & NLP Engine**: Vector RAG + Google Gemini API SDK / NLP heuristic engine

---

## How to Run the System

### Quick Start (One-Click Launcher)
Double-click `start_system.bat` in the project root directory.

### Manual Launch

#### 1. Launch Backend API (Port 8000)
```bash
cd backend
.\venv\Scripts\activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive API Swagger Documentation: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/health`

#### 2. Launch React Frontend (Port 5173)
```bash
cd frontend
npm run dev
```
- Open in Browser: `http://localhost:5173`

---

## Features & Verification Protocol

1. **Instant Demo Execution**: Click **"Load Sample Demo"** in the top navigation bar to generate a complete sample GeM Tender bid evaluation with pre-populated clause decisions, vector match scores, evidence snippets, and executive risk breakdown.
2. **New Audit Processing**: Upload a Tender RFP document and Bidder Package PDFs to execute full text extraction, vector indexing, and AI verification.
3. **Evidence Snippet & Citation**: Click **"View Proof"** on any compliance matrix row to inspect the exact text quote, page number, and document source.
4. **Manual Override**: Committee members can override AI decisions with justification notes.
5. **PDF Audit Export**: Click **"Export PDF Audit Report"** to download an official printable summary report.
