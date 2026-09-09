# SIH26034 — Packaged Product Compliance Verification Prototype
> **Smart India Hackathon (SIH) Prototype**  
> Based on the **Legal Metrology (Packaged Commodities) Rules, 2011 (Rule 6)**

---

## 📌 Executive Summary
This project is a minimal, working MVP prototype for **SIH26034**:
> **Scan / Upload a packaged product image → Extract information via OCR → Verify mandatory declarations against Legal Metrology Rules → Display structured compliance results.**

Designed with the **"Simple > Complex, Working > Perfect, Demonstrable > Overengineered"** principle:
- **Zero unnecessary fluff**: No complex logins, bloated dashboards, or distracting animations.
- **Instant Hackathon Demonstration**: Includes 1-click sample packages (Fully Compliant & Non-Compliant with violations) to guarantee zero presentation glitches in front of evaluators.
- **Robust Real OCR**: Supports image upload & camera capture with Tesseract OCR extraction and rule engine evaluation.
- **Graceful Persistence**: Automatically stores records in MongoDB if running; seamlessly defaults to fast in-memory history if MongoDB is offline.

---

## 🏛️ Legal Metrology Compliance Engine (Rule 6)

The prototype verifies the 7 mandatory declarations specified in **Rule 6(1)** of the **Legal Metrology (Packaged Commodities) Rules, 2011**:

| Rule # | Mandatory Declaration | Citation | Prototype Status |
| :--- | :--- | :--- | :---: |
| **Rule 1** | Generic / Product Name | Rule 6(1)(b) | Verified |
| **Rule 2** | Manufacturer / Packer Name | Rule 6(1)(a) | Verified |
| **Rule 3** | Manufacturer / Packer Complete Address | Rule 6(1)(a) | Verified |
| **Rule 4** | Net Quantity Declaration (g, kg, ml, L, N) | Rule 6(1)(c) | Verified |
| **Rule 5** | Maximum Retail Price (MRP incl. of all taxes) | Rule 6(1)(e) | Verified |
| **Rule 6** | Date / Month of Manufacture / Packing | Rule 6(1)(d) | Verified |
| **Rule 7** | Consumer Care / Helpline / Email Details | Rule 6(1)(n) | Verified |

---

## 🛠️ Architecture & Tech Stack

```
mark3/
├── backend/
│   ├── controllers/
│   │   └── verificationController.js    # API controller for verification & history
│   ├── models/
│   │   └── Verification.js              # Mongoose schema for verification history
│   ├── rules/
│   │   └── complianceRules.js           # Modular Legal Metrology rule engine
│   ├── services/
│   │   ├── ocrService.js                # Tesseract OCR & regex pattern extractor
│   │   └── verificationService.js       # Pipeline coordinator & DB persistence
│   ├── routes/
│   │   └── verificationRoutes.js        # Express routes + Multer file uploads
│   ├── uploads/                         # Temporary store for uploaded package images
│   ├── server.js                        # Express server entry point (port 5000)
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageUploader.jsx        # Dropzone, camera capture & 1-click demo presets
│   │   │   ├── Loading.jsx              # Step-by-step verification progress
│   │   │   └── VerificationResult.jsx   # Results card, score, checks, violations list
│   │   ├── pages/
│   │   │   └── Home.jsx                 # Main screen coordinator with past history
│   │   ├── services/
│   │   │   └── api.js                   # Axios client
│   │   ├── App.jsx & App.css            # Minimal, clean responsive styling
│   │   └── main.jsx
│   ├── vite.config.js                   # Vite config with backend proxy
│   └── package.json
│
├── info.md                              # Master hackathon requirements
└── README.md                            # Documentation & setup guide
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18 or higher (tested on Node v22)
- **npm**: v9 or higher

---

### 1. Start the Backend Server

```bash
cd backend
npm install
npm run dev     # Starts on http://localhost:5000
```

- Health check: `http://localhost:5000/api/health`
- Demo samples: `http://localhost:5000/api/demo-samples`

---

### 2. Start the Frontend Application

```bash
cd frontend
npm install
npm run dev     # Starts on http://localhost:5173 (or 5174)
```

Open your browser to the local URL (e.g. `http://localhost:5173/` or `http://localhost:5174/`).

---

## 🧪 Hackathon Demonstration Workflow

The entire user flow takes **3 steps**:

1. **Select or Upload Package**:
   - **Real Image**: Drag & drop or browse a package label image, or use camera capture.
   - **Instant Demo**: Click one of the 3 preloaded samples:
     1. *Britannia Marie Gold* (100% Compliant)
     2. *Sunrise Spices Garam Masala* (85% Non-Compliant — Missing Address)
     3. *Pure Mountain Wild Honey* (75% Non-Compliant — Missing MRP & Date)
2. **Click `[ Verify Product ]`**:
   - Displays real-time 3-step progress: Preprocessing → OCR extraction → Rule evaluation.
3. **View Detailed Results**:
   - Overall Status (`✓ COMPLIANT` or `✗ NON-COMPLIANT`)
   - Compliance Score percentage
   - Mandatory Declarations checklist (Pass / Fail badges with exact Legal Metrology citations)
   - Specific Detected Issues list
   - Expandable Raw OCR & extracted fields drawer for evaluation transparency
   - `[ Scan Another Product ]` button for continuous testing.

---

## ⚖️ Legal Disclaimer
> **Notice:** This system is an internal prototype decision-support tool for preliminary package compliance checking under the *Legal Metrology (Packaged Commodities) Rules, 2011*. It does not constitute legally binding or authoritative enforcement determination.
