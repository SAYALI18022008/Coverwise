# Coverwise — Policy-to-Patient prototype

A browser-based hackathon prototype for explaining policy wording with page citations and estimating a treatment cost range with visible assumptions.

## Run locally

Serve this folder over HTTP so the JavaScript module and PDF.js worker can load:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000>. PDF.js is loaded from jsDelivr, so PDF upload requires an internet connection. Plain text uploads work without PDF.js.

## Demo

- The preloaded **Care Supreme · Silver** policy is fictional and contains sample limits, a deductible, a co-payment, and waiting-period wording.
- Ask about a treatment, room rent, deductible, co-payment, waiting period, or exclusions. Answers quote extracted wording and open a source excerpt with its PDF page number.
- Upload a searchable PDF or `.txt` file. PDF text extraction runs in the browser; selectable text and source pages stay in the page session. Scanned PDFs are not OCRed.
- Choose a treatment, set policy and treatment dates, and optionally mark it as pre-existing. The calculator applies the sample procedure cap, deductible, and co-payment, then shows a range based on fictional sample treatment costs.
- Add a hospital name, network status, room rate, and optional quote. The quote replaces the sample range; network and over-cap room status are flagged without inventing extra payout rules.
- Compare the current estimate with an alternate hospital quote, review missing details, mark a pre-authorization checklist, and print that checklist.
- Review a patient financial summary with the bill range, potential cover, out-of-pocket estimate, assumptions, and citations.
- Q&A currently uses local keyword and phrase matching to retrieve source passages; it does not call a generative AI model yet.

## Prototype boundaries

Uploaded policies support text retrieval and citations only. The cost estimator continues to use fictional demo terms; it does not extract benefit rules from a real policy. The calculation is an illustrative scenario, not a claim decision or financial advice.
