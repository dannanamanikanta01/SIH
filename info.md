# MASTER PROMPT

## SIH26034 — Minimal Legal Metrology Product Compliance Verification Prototype

You are an expert full-stack MERN developer and AI application architect.

We are participating in **Smart India Hackathon (SIH)** under problem statement **SIH26034**.

We need to build a **minimal working prototype** of a packaged-product compliance verification system based on the **Legal Metrology (Packaged Commodities) Rules, 2011**.

The goal is NOT to build a production-scale application.

The goal is to demonstrate the core SIH concept:

> **Scan/Upload a packaged product image → Extract information → Verify mandatory declarations → Show the compliance result.**

---

# 1. VERY IMPORTANT — KEEP THE PROJECT MINIMAL

Do NOT over-engineer the application.

Do NOT add unnecessary features.

The prototype should have only the functionality required to demonstrate:

1. Upload or capture a product/package image
2. Analyze the image
3. Extract relevant text using OCR
4. Check the extracted information against predefined compliance rules
5. Display the verification result clearly

The frontend should be extremely simple.

The user should be able to understand the application immediately.

---

# 2. TECHNOLOGY STACK

Use the MERN stack:

### Frontend

* React.js
* Vite
* Plain CSS or minimal Tailwind CSS
* Axios

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

### AI / Image Processing

Use Python only where necessary for AI/image processing.

Recommended:

* Python
* OpenCV
* Tesseract OCR

The Node.js backend should communicate with the Python processing service.

If integrating a separate Python service makes the prototype unnecessarily complicated, structure the code so the OCR module can initially be mocked/replaced easily.

---

# 3. CORE APPLICATION FLOW

The complete application flow must be:

```text
                 START
                   ↓
          Upload / Capture Image
                   ↓
             Image Preview
                   ↓
             Verify Product
                   ↓
          Image Preprocessing
                   ↓
                 OCR
                   ↓
        Extract Required Details
                   ↓
          Compliance Rule Engine
                   ↓
          Verification Result
                   ↓
        PASS / FAIL + Violations
```

There should be no complicated workflow.

---

# 4. FRONTEND REQUIREMENTS

Create only the minimum number of screens.

## Screen 1 — Home / Scan

This should be the main screen.

Display:

```text
----------------------------------------
       PRODUCT COMPLIANCE CHECKER
----------------------------------------

Verify packaged products using AI

        [ Upload Product Image ]

              OR

        [ Capture Image ]

----------------------------------------
```

After selecting an image:

```text
Image Preview

[ Verify Product ]
```

That's it.

Do NOT add:

* Complex navbar
* User profile
* Login/signup
* Notifications
* Chat
* Settings
* Multiple dashboards
* Analytics
* Maps
* Inspector management
* Product marketplace
* Payment system
* Social features

---

# 5. VERIFICATION PROCESS

When the user clicks:

```text
Verify Product
```

send the image to the backend.

Show a simple processing state:

```text
Analyzing Product...

✓ Image received
✓ Extracting text
✓ Checking compliance
```

Do not create complicated animations.

---

# 6. RESULTS SCREEN

The result screen is the most important part of the prototype.

Display:

```text
----------------------------------------
          VERIFICATION RESULT
----------------------------------------

Product: XYZ Biscuit

Overall Status:

        ✓ COMPLIANT

Compliance Score:
        85%

----------------------------------------

MANDATORY DECLARATIONS

✓ Manufacturer / Packer Details

✓ Net Quantity

✓ MRP

✓ Date / Month of Manufacture

✓ Consumer Care Details

✗ Address Details

----------------------------------------

Detected Issues:

1. Address declaration could not be
   identified on the package.

----------------------------------------

        [ Scan Another Product ]

----------------------------------------
```

If the package fails:

```text
Overall Status:

        ✗ NON-COMPLIANT
```

Clearly highlight the failed declarations.

---

# 7. OCR EXTRACTION

OCR should attempt to extract relevant package information such as:

* Product name
* Manufacturer / Packer name
* Manufacturer / Packer address
* Net quantity
* MRP
* Date / month of manufacture
* Consumer care information

Example OCR output:

```json
{
  "productName": "ABC Biscuits",
  "manufacturer": "ABC Foods Pvt Ltd",
  "address": "Hyderabad, Telangana",
  "netQuantity": "500 g",
  "mrp": "₹120",
  "manufacturingDate": "08/2026",
  "consumerCare": "1800-123-456"
}
```

OCR should be treated as imperfect.

Do not assume OCR will always correctly identify every field.

---

# 8. COMPLIANCE RULE ENGINE

Create a simple rule-engine module.

The rule engine should check whether required declarations are present in the extracted OCR information.

For the prototype, keep the rules modular.

Example:

```text
RULE 1
Manufacturer/Packer declaration present?
PASS / FAIL

RULE 2
Address present?
PASS / FAIL

RULE 3
Net quantity present?
PASS / FAIL

RULE 4
MRP present?
PASS / FAIL

RULE 5
Manufacturing date/month present?
PASS / FAIL

RULE 6
Consumer care information present?
PASS / FAIL
```

Do NOT hard-code compliance logic directly inside React components.

Keep the rules in a separate backend module:

```text
backend/
   rules/
      complianceRules.js
```

The rule engine should return structured results.

Example:

```json
{
  "score": 83,
  "status": "NON_COMPLIANT",
  "checks": [
    {
      "name": "Manufacturer declaration",
      "status": "PASS"
    },
    {
      "name": "Address",
      "status": "FAIL",
      "reason": "Address not detected"
    },
    {
      "name": "Net Quantity",
      "status": "PASS"
    }
  ]
}
```

---

# 9. IMPORTANT LEGAL REQUIREMENT

Do NOT claim that this prototype provides a legally authoritative determination.

The system is a:

> **Prototype decision-support tool for preliminary package compliance checking.**

The actual legal applicability of individual declarations can depend on the product category, package type, exemptions, applicable amendments, and the current Legal Metrology requirements.

Therefore, design the system so that rules can be updated later.

---

# 10. MONGODB

Use MongoDB only for storing verification history.

Do NOT build a complicated database.

Create one primary collection:

```text
verifications
```

Example document:

```json
{
  "imagePath": "...",
  "productName": "ABC Biscuits",
  "extractedData": {
    "mrp": "₹120",
    "netQuantity": "500g",
    "manufacturer": "ABC Foods"
  },
  "complianceScore": 85,
  "status": "COMPLIANT",
  "checks": [],
  "createdAt": "..."
}
```

Do not create unnecessary collections.

---

# 11. BACKEND API

Keep the API minimal.

Create approximately these endpoints:

### Verify Product

```http
POST /api/verify
```

Input:

```text
multipart/form-data
image
```

Output:

```json
{
  "success": true,
  "result": {
    "productName": "ABC Biscuits",
    "score": 85,
    "status": "COMPLIANT",
    "checks": []
  }
}
```

### Optional History

```http
GET /api/verifications
```

Only implement this if it is useful for the prototype.

Do not create dozens of APIs.

---

# 12. PROJECT STRUCTURE

Use a clean but simple structure:

```text
compliance-checker/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageUploader.jsx
│   │   │   ├── VerificationResult.jsx
│   │   │   └── Loading.jsx
│   │   │
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── server/
│   ├── controllers/
│   │   └── verificationController.js
│   │
│   ├── routes/
│   │   └── verificationRoutes.js
│   │
│   ├── models/
│   │   └── Verification.js
│   │
│   ├── rules/
│   │   └── complianceRules.js
│   │
│   ├── services/
│   │   ├── ocrService.js
│   │   └── verificationService.js
│   │
│   ├── uploads/
│   │
│   ├── server.js
│   └── package.json
│
└── README.md
```

If Python OCR is used:

```text
├── ai-service/
│   ├── ocr.py
│   ├── preprocessing.py
│   ├── requirements.txt
│   └── app.py
```

Keep the Python service extremely small.

---

# 13. UI DESIGN

The UI should look like a modern SIH prototype.

Design principles:

* Clean
* Minimal
* Professional
* Responsive
* Large upload area
* Large Verify button
* Clear result status
* Easy-to-read compliance checks

Use cards where useful.

Avoid:

* Excessive gradients
* Excessive animations
* Huge dashboards
* Complex navigation
* Too many buttons
* Unnecessary decorative elements

The user should be able to perform verification in approximately:

```text
3 steps:

1. Upload
2. Verify
3. View Result
```

---

# 14. ERROR HANDLING

Handle basic errors:

### No image

```text
Please upload a product image.
```

### Invalid file

```text
Please upload a valid image.
```

### OCR failure

```text
Unable to extract sufficient text.
Please upload a clearer image.
```

### Backend failure

```text
Verification service is temporarily unavailable.
```

Do not expose stack traces to the user.

---

# 15. DEMO DATA / FALLBACK MODE

Because this is an SIH prototype, the application should still be demonstrable if OCR fails.

Implement a simple development/demo fallback.

For example:

```text
DEMO_MODE=true
```

When enabled, the system can use predefined OCR output for a sample package image.

However, clearly label this as:

```text
Demo / Prototype Mode
```

Do not fake real-world verification without indicating that it is demo data.

---

# 16. DO NOT IMPLEMENT THESE FEATURES

Explicitly DO NOT build:

* Authentication
* JWT
* Admin dashboard
* Inspector dashboard
* User accounts
* Inspector assignment
* Notifications
* Email
* SMS
* Cloudinary
* AWS
* Payment
* Mobile application
* Chatbot
* Advanced analytics
* Complex reporting
* PDF generation
* Social login
* Role-based access control
* Product marketplace
* Recommendation system

These can be added later.

The current objective is ONLY:

```text
SCAN
  ↓
EXTRACT
  ↓
VERIFY
  ↓
RESULT
```

---

# 17. OPTIONAL CAMERA SUPPORT

If easy to implement, allow:

```text
[ Upload Image ]

[ Capture Image ]
```

Use the browser camera/file input.

Do not build a custom camera application.

If camera implementation introduces complexity, prioritize image upload.

---

# 18. FINAL DEMO EXPERIENCE

The final SIH demonstration should look like this:

```text
             PRODUCT COMPLIANCE CHECKER

                    ↓

             Upload Package Image

                    ↓

                [Preview]

                    ↓

             [ VERIFY PRODUCT ]

                    ↓

                ANALYZING...

                    ↓

              OCR EXTRACTION

                    ↓

             RULE VALIDATION

                    ↓

          ┌─────────────────────┐
          │  COMPLIANCE: 85%    │
          │                     │
          │  ✓ MRP              │
          │  ✓ Net Quantity     │
          │  ✓ Manufacturer     │
          │  ✓ Consumer Care    │
          │  ✗ Address          │
          └─────────────────────┘

                    ↓

             Verification Result
```

---

# 19. DEVELOPMENT PRIORITY

Follow this exact priority:

### Priority 1

Make image upload work.

### Priority 2

Make backend receive the image.

### Priority 3

Make OCR work.

### Priority 4

Extract important package fields.

### Priority 5

Implement compliance rules.

### Priority 6

Display the result beautifully.

### Priority 7

Save verification results to MongoDB.

### Priority 8

Improve UI only after the core pipeline works.

Do NOT spend significant development time on UI before the verification pipeline works.

---

# 20. ACCEPTANCE CRITERIA

The prototype is considered successful when:

```text
✓ User can upload a package image

✓ Backend receives the image

✓ OCR extracts package information

✓ System identifies required declarations

✓ Rule engine evaluates compliance

✓ Compliance score is calculated

✓ PASS/FAIL status is generated

✓ Violations are clearly displayed

✓ Result is shown in React

✓ Verification can be repeated with another image

✓ Verification result can optionally be stored in MongoDB
```

---

# 21. DEVELOPMENT INSTRUCTIONS FOR THE AI CODING AGENT

Before writing code:

1. Analyze the complete requirements.
2. Create the minimal architecture.
3. Do not introduce unnecessary libraries.
4. Do not add features that are not explicitly requested.
5. Build the project incrementally.
6. Make each module runnable before moving to the next.
7. Provide clear setup instructions.
8. Create `.env.example`.
9. Handle errors properly.
10. Keep the code understandable for a student development team.

When making architectural decisions, always prefer:

```text
SIMPLE > COMPLEX
WORKING > PERFECT
DEMONSTRABLE > OVERENGINEERED
CORE FEATURE > EXTRA FEATURE
```

---

# 22. FINAL OBJECTIVE

Build a working SIH26034 prototype that demonstrates:

> **A packaged product can be scanned/uploaded, its label information can be extracted using OCR, the extracted information can be checked against predefined Legal Metrology compliance rules, and the system can immediately show the inspector/user which declarations are compliant and which are missing.**

Keep the entire application focused on this single workflow.

# END OF MASTER PROMPT
