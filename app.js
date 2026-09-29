const samplePages = [
  { page: 2, section: "Policy schedule", text: "The policy sum insured for this sample plan is ₹5,00,000 per policy year. Benefits are subject to the terms, exclusions, and limits stated in this policy." },
  { page: 6, section: "Waiting period", text: "A waiting period of 24 months applies to pre-existing diseases from the first policy inception date, subject to continuous renewal. Treatment for a condition during its applicable waiting period is not payable." },
  { page: 7, section: "Annual deductible", text: "An annual deductible of ₹10,000 applies to each insured person. The deductible is applied before calculation of the insurer's share of an eligible claim." },
  { page: 8, section: "Co-payment", text: "A 10% co-payment applies to each admissible claim after application of the deductible and applicable sub-limits. The insured person is responsible for the co-payment amount." },
  { page: 10, section: "Room rent limit", text: "Room rent is limited to ₹5,000 per day for a standard private room. Expenses may be adjusted in accordance with the room category and policy terms when a higher room category is selected." },
  { page: 11, section: "Specified procedure sub-limit", text: "Knee replacement is covered up to a maximum of ₹2,00,000 per claim, subject to medical necessity, applicable waiting periods, the deductible, co-payment, and the remaining sum insured." },
  { page: 12, section: "Cataract sub-limit", text: "Cataract surgery is covered up to ₹40,000 per eye, subject to medical necessity, applicable waiting periods, the deductible, co-payment, and the remaining sum insured." },
  { page: 13, section: "Hernia treatment", text: "Medically necessary hernia repair is covered up to the policy sum insured, subject to applicable waiting periods, the deductible, co-payment, and policy exclusions." },
  { page: 18, section: "General exclusions", text: "Cosmetic procedures without medical necessity and experimental or unproven treatments are excluded. The full policy wording describes additional exclusions and claim conditions." },
];

const costData = {
  knee: { name: "Knee replacement", low: 230000, high: 300000, cap: 200000, capLabel: "Knee replacement sub-limit", page: 11 },
  cataract: { name: "Cataract surgery", low: 45000, high: 85000, cap: 40000, capLabel: "Cataract sub-limit", page: 12 },
  hernia: { name: "Hernia repair", low: 80000, high: 150000, cap: 500000, capLabel: "Available sum insured", page: 13 },
};

const policyTerms = { deductible: 10000, copayRate: 0.1, sumInsured: 500000, waitingMonths: 24 };
const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const elements = {
  upload: document.querySelector("#policy-file"), uploadTrigger: document.querySelector("#upload-trigger"), replacePolicy: document.querySelector("#replace-policy"),
  policyName: document.querySelector("#policy-name"), policyStatus: document.querySelector("#policy-status"), pageCount: document.querySelector("#page-count"),
  policyKind: document.querySelector("#policy-kind"), sumInsured: document.querySelector("#sum-insured"), waitingPeriod: document.querySelector("#waiting-period"), roomLimit: document.querySelector("#room-limit"),
  messages: document.querySelector("#chat-messages"), chatForm: document.querySelector("#chat-form"), chatInput: document.querySelector("#chat-input"),
  treatment: document.querySelector("#treatment-select"), treatmentPurpose: document.querySelector("#treatment-purpose"), policyStart: document.querySelector("#policy-start"), treatmentDate: document.querySelector("#treatment-date"), preExisting: document.querySelector("#pre-existing"),
  hospitalName: document.querySelector("#hospital-name"), networkStatus: document.querySelector("#network-status"), hospitalQuote: document.querySelector("#hospital-quote"), roomRent: document.querySelector("#room-rent"), hospitalReviewNote: document.querySelector("#hospital-review-note"),
  missingList: document.querySelector("#missing-list"), missingSummary: document.querySelector("#missing-summary"), comparisonQuote: document.querySelector("#comparison-quote"), comparisonHospital: document.querySelector("#comparison-hospital"), comparisonNote: document.querySelector("#comparison-note"),
  preauthChecklist: document.querySelector("#preauth-checklist"), financialStatus: document.querySelector("#financial-status"), financialTotal: document.querySelector("#financial-total"), financialCover: document.querySelector("#financial-cover"), financialOop: document.querySelector("#financial-oop"), financialDetail: document.querySelector("#financial-detail"), financialSources: document.querySelector("#financial-sources"), financialSourceNote: document.querySelector("#financial-source-note"),
  totalRange: document.querySelector("#total-range"), coveredLegend: document.querySelector("#covered-legend"), oopLegend: document.querySelector("#oop-legend"), oopRange: document.querySelector("#oop-range"),
  coveredSegment: document.querySelector("#covered-segment"), patientSegment: document.querySelector("#patient-segment"), rangeMarker: document.querySelector("#range-marker"), eligibilityNote: document.querySelector("#eligibility-note"), eligibilityText: document.querySelector("#eligibility-text"), eligibilitySource: document.querySelector("#eligibility-source"),
  breakdownToggle: document.querySelector("#breakdown-toggle"), breakdown: document.querySelector("#breakdown-content"), dialog: document.querySelector("#source-dialog"), dialogTitle: document.querySelector("#dialog-title"), dialogMeta: document.querySelector("#dialog-meta"), dialogQuote: document.querySelector("#dialog-quote"),
  aboutDialog: document.querySelector("#about-dialog"),
};

let activePages = samplePages;
let uploadedFileName = "";
let isSamplePolicy = true;
let isPolicyDocument = true;
let lastCalculation = null;

function formatCompact(amount) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}k`;
  return formatter.format(amount);
}

function formatRange(low, high) {
  return `${formatCompact(low)} – ${formatCompact(high)}`;
}

function formatEstimateRange(low, high) {
  return low === high ? formatCompact(low) : formatRange(low, high);
}

function dateValue(input) {
  if (!input) return null;
  const date = new Date(`${input}T00:00:00`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function monthsBetween(earlier, later) {
  let months = (later.getFullYear() - earlier.getFullYear()) * 12 + later.getMonth() - earlier.getMonth();
  if (later.getDate() < earlier.getDate()) months -= 1;
  return Math.max(0, months);
}

function calculateEstimate() {
  const treatment = costData[elements.treatment.value];
  const policyStart = dateValue(elements.policyStart.value);
  const treatmentDate = dateValue(elements.treatmentDate.value);
  const monthsCovered = policyStart && treatmentDate ? monthsBetween(policyStart, treatmentDate) : null;
  const waitApplies = elements.preExisting.checked;
  const datesComplete = Boolean(policyStart && treatmentDate);
  const waitingServed = !waitApplies || (monthsCovered !== null && monthsCovered >= policyTerms.waitingMonths);
  const policyPeriodValid = datesComplete && treatmentDate >= policyStart;
  const purpose = elements.treatmentPurpose.value;
  const exclusionApplies = purpose === "cosmetic" || purpose === "experimental";
  const eligible = waitingServed && policyPeriodValid && !exclusionApplies;
  const cap = Math.min(treatment.cap, policyTerms.sumInsured);
  const hospitalQuote = Number(elements.hospitalQuote.value);
  const hospitalQuoteProvided = Number.isFinite(hospitalQuote) && hospitalQuote > 0;
  const costLow = hospitalQuoteProvided ? hospitalQuote : treatment.low;
  const costHigh = hospitalQuoteProvided ? hospitalQuote : treatment.high;
  const deductible = eligible ? Math.min(policyTerms.deductible, cap) : 0;
  const coveredFor = (amount) => eligible ? Math.max(0, Math.min(amount, cap) - deductible) * (1 - policyTerms.copayRate) : 0;
  const coveredLow = coveredFor(costLow);
  const coveredHigh = coveredFor(costHigh);
  const outLow = Math.max(0, costLow - coveredLow);
  const outHigh = Math.max(0, costHigh - coveredHigh);
  const typicalCost = (costLow + costHigh) / 2;
  const typicalCovered = coveredFor(typicalCost);
  const ratio = Math.min(85, Math.max(15, (typicalCovered / typicalCost) * 100));
  const roomRentRate = Number(elements.roomRent.value);

  elements.totalRange.textContent = formatEstimateRange(costLow, costHigh);
  elements.coveredLegend.textContent = eligible ? formatCompact(typicalCovered) : formatter.format(0);
  elements.oopLegend.textContent = formatEstimateRange(outLow, outHigh);
  elements.oopRange.textContent = formatEstimateRange(outLow, outHigh);
  elements.coveredSegment.style.width = `${ratio}%`;
  elements.patientSegment.style.width = `${100 - ratio}%`;
  elements.rangeMarker.style.left = `${Math.min(88, Math.max(12, 100 - ratio))}%`;
  elements.eligibilityNote.classList.toggle("alert", !eligible || roomRentRate > 5000);
  const evidencePage = exclusionApplies ? 18 : !waitingServed && waitApplies ? 6 : roomRentRate > 5000 ? 10 : null;
  elements.eligibilitySource.hidden = evidencePage === null || !isSamplePolicy;
  if (evidencePage !== null) {
    elements.eligibilitySource.dataset.source = String(evidencePage);
    elements.eligibilitySource.textContent = "View policy evidence · p. " + evidencePage;
  }
  if (exclusionApplies) {
    elements.eligibilityText.textContent = "This scenario matches a sample policy exclusion. The estimate assumes no insurer payment; review the exclusion wording and confirm how it applies.";
  } else if (!datesComplete) {
    elements.eligibilityText.textContent = "Add both policy and treatment dates to check whether the policy is active and whether a waiting period applies.";
  } else if (!policyPeriodValid) {
    elements.eligibilityText.textContent = "The treatment date is before the policy start date, so this scenario assumes no cover. Update the dates to recalculate.";
  } else if (!waitingServed) {
    elements.eligibilityText.textContent = `The policy has been active for ${monthsCovered} month${monthsCovered === 1 ? "" : "s"}; the 24-month pre-existing condition wait is not yet served. This estimate assumes no cover.`;
  } else {
    elements.eligibilityText.textContent = waitApplies
      ? `The 24-month waiting period appears served (${monthsCovered} months). Eligibility and final payment still depend on the full policy and claim review.`
      : "Estimate assumes the treatment is eligible and the applicable waiting period is served. Check your policy evidence for exclusions.";
  }
  lastCalculation = { treatment, cap, deductible, eligible, exclusionApplies, purpose, coveredLow, coveredHigh, outLow, outHigh, typicalCovered, costLow, costHigh, hospitalQuoteProvided, roomRentRate, monthsCovered, waitingServed, policyPeriodValid, datesComplete };
  renderBreakdown();
  renderHospitalReview(lastCalculation);
  renderMissingInfo(lastCalculation);
  renderComparison(lastCalculation);
  renderFinancialSummary(lastCalculation);
}

function renderBreakdownLegacy() {
  if (!lastCalculation) return;
  const result = lastCalculation;
  const policyDate = elements.policyStart.value || "Not supplied";
  const careDate = elements.treatmentDate.value || "Not supplied";
  const rows = [
    ["Sample treatment cost range", formatRange(result.treatment.low, result.treatment.high)],
    [result.treatment.capLabel, formatter.format(result.cap)],
    ["Deductible", result.eligible ? `− ${formatter.format(result.deductible)}` : "Not applied; assumed ineligible"],
    ["Co-payment", result.eligible ? "10% of eligible amount after limits" : "Not applied; assumed ineligible"],
    ["Potential insurer share", result.eligible ? formatRange(result.coveredLow, result.coveredHigh) : formatter.format(0)],
    ["Out-of-pocket estimate", formatRange(result.outLow, result.outHigh)],
    ["Policy start / treatment", `${policyDate} / ${careDate}`],
  ];
  elements.breakdown.innerHTML = rows.map(([label, value], index) => `<div class="breakdown-line${index === rows.length - 2 ? " total" : ""}"><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function renderBreakdown() {
  if (!lastCalculation) return;
  const result = lastCalculation;
  const rows = [
    [result.hospitalQuoteProvided ? "Hospital quote" : "Synthetic treatment cost range", formatEstimateRange(result.costLow, result.costHigh)],
    [result.treatment.capLabel, formatter.format(result.cap)],
    ["Deductible", result.eligible ? formatter.format(result.deductible) + " applied first" : "Not applied; no cover assumed"],
    ["Co-payment", result.eligible ? "10% after limits and deductible" : "Not applied; no cover assumed"],
    ["Potential insurer share", formatEstimateRange(result.coveredLow, result.coveredHigh)],
    ["Out-of-pocket estimate", formatEstimateRange(result.outLow, result.outHigh)],
    ["Hospital / network", (elements.hospitalName.value.trim() || "Not named") + " · " + { unknown: "Not confirmed", network: "Marked in network", out: "Marked outside network" }[elements.networkStatus.value]],
    ["Room rent", formatter.format(result.roomRentRate) + " per day" + (result.roomRentRate > 5000 ? " · above sample cap" : "")],
    ["Policy start / treatment", (elements.policyStart.value || "Not supplied") + " / " + (elements.treatmentDate.value || "Not supplied")],
  ];
  elements.breakdown.replaceChildren();
  rows.forEach(([label, value], index) => {
    const row = document.createElement("div");
    row.className = "breakdown-line" + (index === rows.length - 1 ? " total" : "");
    const labelNode = document.createElement("span");
    const valueNode = document.createElement("strong");
    labelNode.textContent = label;
    valueNode.textContent = value;
    row.append(labelNode, valueNode);
    elements.breakdown.append(row);
  });
}

function renderHospitalReview(result) {
  const hospital = elements.hospitalName.value.trim() || "This hospital";
  const parts = [result.hospitalQuoteProvided
    ? "Using " + hospital + "'s supplied quote of " + formatEstimateRange(result.costLow, result.costHigh) + "."
    : "No hospital quote supplied; using the fictional " + result.treatment.name.toLowerCase() + " cost range."];
  if (elements.networkStatus.value === "network") parts.push("Marked in network; confirm cashless pre-authorization with the insurer.");
  else if (elements.networkStatus.value === "out") parts.push("Marked outside network; confirm payment and reimbursement steps. This estimate does not adjust the payout for network status.");
  else parts.push("Network status is not confirmed.");
  if (result.roomRentRate > 5000) parts.push("Selected room rent exceeds the sample policy's " + formatter.format(5000) + "/day cap; a possible adjustment is flagged but not calculated.");
  else parts.push("Selected room rent is within the sample policy's " + formatter.format(5000) + "/day cap.");
  elements.hospitalReviewNote.textContent = parts.join(" ");
  elements.hospitalReviewNote.classList.toggle("warning", result.roomRentRate > 5000 || elements.networkStatus.value === "out");
}

function renderMissingInfo(result) {
  const items = [];
  if (!result.datesComplete) items.push({ text: "Add the policy start date and planned treatment date to check active cover." });
  if (!result.hospitalQuoteProvided) items.push({ text: "Add the hospital's itemized quote for a tighter estimate." });
  if (elements.networkStatus.value === "unknown") items.push({ text: "Confirm whether the hospital is in the insurer's network." });
  if (elements.networkStatus.value === "out") items.push({ text: "Confirm out-of-network payment and reimbursement requirements with the insurer." });
  if (result.roomRentRate > 5000) items.push({ text: "Ask whether the higher room category causes a proportionate deduction in the full policy.", page: 10 });
  if (!elements.preExisting.checked) items.push({ text: "Confirm whether this treatment relates to a pre-existing condition; mark the checkbox if it does.", page: 6 });
  if (result.exclusionApplies) items.push({ text: "Confirm how the cosmetic or experimental exclusion applies to this treatment.", page: 18 });
  if (!result.waitingServed && elements.preExisting.checked) items.push({ text: "Confirm the condition's waiting-period start date and any continuous-renewal history.", page: 6 });
  if (!isSamplePolicy) items.push({ text: "Uploaded clauses are searchable, but this calculator still uses fictional demo policy terms." });
  elements.missingList.replaceChildren();
  if (items.length === 0) {
    const row = document.createElement("li");
    const text = document.createElement("span");
    text.className = "missing-item-text";
    text.textContent = "No extra scenario details flagged. Confirm eligibility and final amounts with the insurer and hospital.";
    row.append(text);
    elements.missingList.append(row);
    elements.missingSummary.textContent = "No missing scenario details detected.";
    return;
  }
  items.forEach((item) => {
    const row = document.createElement("li");
    const text = document.createElement("span");
    text.className = "missing-item-text";
    text.textContent = item.text;
    row.append(text);
    if (item.page) {
      const evidence = document.createElement("button");
      evidence.className = "missing-source";
      evidence.type = "button";
      evidence.dataset.source = String(item.page);
      evidence.textContent = "Policy p. " + item.page + " ↗";
      row.append(evidence);
    }
    elements.missingList.append(row);
  });
  elements.missingSummary.textContent = items.length + " detail" + (items.length === 1 ? "" : "s") + " to confirm before relying on this estimate.";
}

function renderComparison(result) {
  const currentLabel = elements.hospitalName.value.trim() || (result.hospitalQuoteProvided ? "Hospital quote" : "Sample cost range");
  document.querySelector("#current-scenario-cost").textContent = formatEstimateRange(result.costLow, result.costHigh);
  document.querySelector("#current-scenario-hospital").textContent = currentLabel;
  document.querySelector("#current-scenario-oop").textContent = formatEstimateRange(result.outLow, result.outHigh);

  const alternateQuote = Number(elements.comparisonQuote.value);
  const alternateCovered = result.eligible && Number.isFinite(alternateQuote) && alternateQuote > 0
    ? Math.max(0, Math.min(alternateQuote, result.cap) - result.deductible) * (1 - policyTerms.copayRate)
    : 0;
  const alternateOutOfPocket = Math.max(0, alternateQuote - alternateCovered);
  const comparisonOutput = document.querySelector("#comparison-oop");
  const deltaOutput = document.querySelector("#comparison-delta");
  const alternateName = elements.comparisonHospital.value.trim() || "Alternate hospital";
  document.querySelector("#comparison-hospital-name").textContent = alternateName;
  if (!Number.isFinite(alternateQuote) || alternateQuote <= 0) {
    comparisonOutput.textContent = "Enter a quote";
    deltaOutput.textContent = "Add an alternate quote to compare.";
    elements.comparisonNote.textContent = "The comparison will use the same treatment, dates, eligibility checks, and sample policy terms for the alternate bill.";
    return;
  }
  comparisonOutput.textContent = formatCompact(alternateOutOfPocket);
  const currentTypicalOutOfPocket = (result.costLow + result.costHigh) / 2 - result.typicalCovered;
  const difference = alternateOutOfPocket - currentTypicalOutOfPocket;
  deltaOutput.textContent = formatCompact(Math.abs(difference)) + (difference >= 0 ? " more" : " less") + " than the current estimate midpoint";
  deltaOutput.classList.toggle("higher", difference > 0);
  deltaOutput.classList.toggle("lower", difference < 0);
  elements.comparisonNote.textContent = "At " + alternateName + ", the same policy assumptions produce an estimated patient share of " + formatCompact(alternateOutOfPocket) + ". The comparison changes the bill only; it does not model different hospital/network rules.";
}

function renderFinancialSummary(result) {
  elements.financialTotal.textContent = formatEstimateRange(result.costLow, result.costHigh);
  elements.financialCover.textContent = formatEstimateRange(result.coveredLow, result.coveredHigh);
  elements.financialOop.textContent = formatEstimateRange(result.outLow, result.outHigh);
  if (result.exclusionApplies) elements.financialStatus.textContent = "Sample policy exclusion flagged · no cover assumed";
  else if (!result.datesComplete) elements.financialStatus.textContent = "Dates needed to confirm active cover";
  else if (!result.policyPeriodValid) elements.financialStatus.textContent = "Treatment date is before policy start";
  else if (!result.waitingServed) elements.financialStatus.textContent = "Waiting period not served · no cover assumed";
  else elements.financialStatus.textContent = isSamplePolicy ? "Conditional estimate using fictional sample terms" : "Uploaded policy text · demo factors still used";

  const details = [result.hospitalQuoteProvided ? "Uses the hospital quote you entered." : "Uses fictional regional treatment-cost data."];
  details.push("Applies a " + formatter.format(result.cap) + " procedure limit, " + formatter.format(policyTerms.deductible) + " deductible, and " + Math.round(policyTerms.copayRate * 100) + "% co-payment.");
  details.push("Assumes the full sum insured is available and excludes any unlisted charges.");
  if (!elements.preExisting.checked) details.push("Assumes no pre-existing-condition waiting period applies; confirm the patient's condition history.");
  if (result.roomRentRate > 5000) details.push("Any higher-room proportionate deduction is not included.");
  if (elements.networkStatus.value !== "unknown") details.push("Network status is shown for review but does not change this calculation.");
  if (!isSamplePolicy) details.push("Uploaded policy wording is not yet used to calculate benefits.");
  elements.financialDetail.textContent = details.join(" ");
  elements.financialSources.hidden = !isSamplePolicy;
  elements.financialSourceNote.hidden = isSamplePolicy;
  if (!elements.financialSources.querySelector("[data-deductible-evidence]")) {
    const deductibleEvidence = document.createElement("button");
    deductibleEvidence.type = "button";
    deductibleEvidence.dataset.source = "7";
    deductibleEvidence.dataset.deductibleEvidence = "true";
    deductibleEvidence.textContent = "Deductible · p. 7";
    elements.financialSources.append(deductibleEvidence);
  }
  document.querySelector(".factors-section").hidden = !isSamplePolicy;
  const procedureCard = document.querySelector(".factor-card");
  procedureCard.dataset.source = String(result.treatment.page);
  procedureCard.querySelector("strong").textContent = formatter.format(result.treatment.cap);
  procedureCard.querySelector("em").textContent = result.treatment.name + " · p. " + result.treatment.page;
  const financialProcedureSource = elements.financialSources.querySelector("button");
  financialProcedureSource.dataset.source = String(result.treatment.page);
  financialProcedureSource.textContent = "Procedure limit · p. " + result.treatment.page;
}

function updatePreauthProgress() {
  const items = [...elements.preauthChecklist.querySelectorAll("[data-preauth-item]")];
  const checked = items.filter((item) => item.checked).length;
  document.querySelector("#checklist-progress").textContent = checked + " of " + items.length + " items ready";
}

function normalize(text) {
  return text.toLocaleLowerCase().replace(/[^\p{L}\p{N}₹%]+/gu, " ").trim();
}

function classifyPolicyDocument(pages) {
  const corpus = normalize(pages.map((page) => page.text).join(" "));
  const directHealthIdentity = /\bhealth insurance\b|\bmedical insurance\b|\bmediclaim\b|\bhealth policy\b/.test(corpus);
  const healthBenefitMarkers = [
    /\bsum insured\b/,
    /\binsured person\b/,
    /\bwaiting period\b/,
    /\bdeductible\b/,
    /\bco payment\b|\bcopay\b/,
    /\broom rent\b/,
    /\bpre existing (?:disease|condition)\b/,
    /\bnetwork hospital\b/,
    /\bhospitali[sz]ation\b/,
    /\bsub limit\b/,
  ];
  const healthBenefitCount = healthBenefitMarkers.filter((marker) => marker.test(corpus)).length;
  const contractMarker = /\bpolicy schedule\b|\bpolicy wording\b|\binsurance policy\b|\bcertificate of insurance\b|\bpolicy number\b|\bpolicyholder\b/.test(corpus);
  const healthContext = directHealthIdentity || /\bmedical expenses\b|\bhospital treatment\b|\bpre existing disease\b|\broom rent\b/.test(corpus);
  return healthContext && contractMarker && healthBenefitCount >= 2;
}

function updatePolicyAvailability() {
  const policyUnavailable = !isSamplePolicy && !isPolicyDocument;
  document.querySelector(".summary-strip").hidden = !isSamplePolicy;
  ["#estimate-panel", ".workflow-section", ".what-if-panel", ".follow-through-grid"].forEach((selector) => {
    document.querySelector(selector).hidden = policyUnavailable;
  });
  elements.chatInput.disabled = policyUnavailable;
  elements.chatForm.querySelector("button[type='submit']").disabled = policyUnavailable;
  document.querySelectorAll("#suggested-questions button").forEach((button) => { button.disabled = policyUnavailable; });
}

function findRelevantPages(question) {
  const normalizedQuestion = normalize(question);
  const terms = normalizedQuestion.split(/\s+/).filter((term) => term.length > 2);
  const aliases = [
    { page: 11, terms: ["knee", "replacement", "joint", "arthroplasty"] },
    { page: 12, terms: ["cataract", "eye", "lens"] },
    { page: 13, terms: ["hernia", "repair"] },
    { page: 6, terms: ["waiting", "period", "pre", "existing", "condition"] },
    { page: 7, terms: ["deductible", "deduct"] },
    { page: 8, terms: ["copay", "co", "payment", "percentage"] },
    { page: 10, terms: ["room", "rent", "bed", "category"] },
    { page: 18, terms: ["exclusion", "excluded", "cosmetic", "experimental"] },
    { page: 2, terms: ["sum", "insured", "coverage", "policy", "limit", "maximum"] },
  ];
  const aliasMatches = aliases.filter((entry) => entry.terms.some((term) => normalizedQuestion.includes(term)));
  const candidatePages = aliasMatches.map((entry) => entry.page);
  const ranked = activePages.map((page) => {
    const content = normalize(`${page.section} ${page.text}`);
    const score = terms.reduce((total, term) => total + (content.includes(term) ? 1 : 0), 0);
    return { page, score };
  }).filter((entry) => entry.score > 0 || candidatePages.includes(entry.page.page)).sort((first, second) => {
    const firstBonus = candidatePages.includes(first.page.page) ? 2 : 0;
    const secondBonus = candidatePages.includes(second.page.page) ? 2 : 0;
    return (second.score + secondBonus) - (first.score + firstBonus);
  });
  return ranked.slice(0, 3).map((entry) => entry.page);
}

function answerIntro(question, sources) {
  const normalized = normalize(question);
  const snippets = sources.map((source) => `“${source.text}”`).join(" ");
  if (!sources.length) return "I couldn’t find a matching passage in the extracted text. Try a policy term such as room rent, co-payment, waiting period, deductible, exclusions, or the treatment name. Scanned pages may need OCR.";
  const labels = sources.map((source) => source.section.toLowerCase());
  const first = sources[0];
  let intro = `I found this in your policy under ${labels.join(" and ")}:`;
  if (normalized.includes("wait") || normalized.includes("pre existing")) intro = `The relevant waiting-period wording says: ${snippets}`;
  else if (normalized.includes("room") || normalized.includes("rent")) intro = `The room limit stated in the document is: ${snippets}`;
  else if (normalized.includes("exclude") || normalized.includes("cosmetic") || normalized.includes("experimental")) intro = `The exclusions section says: ${snippets}`;
  else if (normalized.includes("deduct")) intro = `The deductible wording says: ${snippets}`;
  else if (normalized.includes("copay") || normalized.includes("co payment")) intro = `The co-payment wording says: ${snippets}`;
  else if (normalized.includes("knee") || normalized.includes("replacement")) intro = `The treatment limit wording says: ${snippets}`;
  else if (normalized.includes("cataract")) intro = `The treatment limit wording says: ${snippets}`;
  else if (normalized.includes("hernia")) intro = `The treatment wording says: ${snippets}`;
  else intro = `Here is the closest matching wording I found in “${first.section}”: ${snippets}`;
  return intro;
}

function addUserMessage(question) {
  const message = document.createElement("article");
  message.className = "message user-message";
  message.innerHTML = `<div class="message-avatar user-avatar">You</div><div class="message-body"><div class="message-meta"><strong>You</strong><time>Just now</time></div><div class="message-bubble user-bubble"></div></div>`;
  message.querySelector(".user-bubble").textContent = question;
  elements.messages.append(message);
}

function addAssistantMessage(question) {
  const sources = findRelevantPages(question);
  const article = document.createElement("article");
  article.className = "message assistant-message";
  const avatar = document.createElement("div");
  avatar.className = "message-avatar assistant-avatar";
  avatar.textContent = "✳";
  const body = document.createElement("div");
  body.className = "message-body";
  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.innerHTML = `<strong>Coverwise assistant</strong><span class="verified-label"><i></i> ${sources.length ? "Evidence found" : "No evidence found"}</span>`;
  const answer = document.createElement("div");
  answer.className = "answer-text";
  const paragraph = document.createElement("p");
  paragraph.textContent = answerIntro(question, sources);
  answer.append(paragraph);
  if (sources.length) {
    const note = document.createElement("p");
    note.className = "answer-note";
    note.textContent = isSamplePolicy
      ? "Fictional hackathon example. The final benefit depends on all applicable terms and claim review."
      : "This prototype finds relevant text but does not interpret every policy condition. Check the full wording before relying on it.";
    answer.append(note);
  }
  const citationList = document.createElement("div");
  citationList.className = "citation-list";
  sources.forEach((source) => {
    const button = document.createElement("button");
    button.className = "citation-chip";
    button.type = "button";
    button.dataset.source = String(source.page);
    button.innerHTML = `<span class="citation-page"></span><span class="citation-section"></span><span class="citation-arrow">↗</span>`;
    button.querySelector(".citation-page").textContent = String(source.page);
    button.querySelector(".citation-section").textContent = source.section;
    citationList.append(button);
  });
  body.append(meta, answer, citationList);
  article.append(avatar, body);
  elements.messages.append(article);
  elements.messages.scrollTop = elements.messages.scrollHeight;
}

function openSource(pageNumber) {
  const source = activePages.find((page) => page.page === Number(pageNumber));
  if (!source) {
    elements.dialogTitle.textContent = `PDF page ${pageNumber}`;
    elements.dialogMeta.textContent = uploadedFileName || "Uploaded document";
    elements.dialogQuote.textContent = "No searchable text was extracted from this page. This may be a scanned page; OCR is not included in this prototype.";
  } else {
    elements.dialogTitle.textContent = source.section;
    elements.dialogMeta.textContent = `${isSamplePolicy ? "Fictional sample policy" : uploadedFileName} · PDF page ${source.page}`;
    elements.dialogQuote.textContent = source.text;
  }
  elements.dialog.showModal();
}

function setSamplePolicy() {
  activePages = samplePages;
  uploadedFileName = "";
  isSamplePolicy = true;
  isPolicyDocument = true;
  updatePolicyAvailability();
  elements.policyName.textContent = "Care Supreme · Silver";
  elements.policyStatus.textContent = "Sample policy · ready to explore";
  elements.pageCount.textContent = "18 pages";
  elements.policyKind.textContent = "Using a fictional sample policy";
  elements.sumInsured.textContent = formatter.format(policyTerms.sumInsured);
  elements.waitingPeriod.textContent = `${policyTerms.waitingMonths} months`;
  elements.roomLimit.textContent = "₹5,000 / day";
  elements.treatment.value = "knee";
  elements.preExisting.checked = false;
  elements.policyStart.value = "2024-01-01";
  calculateEstimate();
}

function textPagesToChunks(pageTexts) {
  return pageTexts.map((text, index) => ({ page: index + 1, section: "Extracted policy text", text: text.trim() })).filter((page) => page.text);
}

function showDocumentNotice(message, rejected = false) {
  elements.messages.replaceChildren();
  const notice = document.createElement("div");
  notice.className = rejected ? "upload-notice rejection" : "upload-notice";
  notice.textContent = message;
  elements.messages.append(notice);
}

async function extractPdf(file) {
  const pdfjsLib = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(" ").replace(/\s+/g, " ").trim();
    pages.push(text);
  }
  return { pageCount: pdf.numPages, pages: textPagesToChunks(pages) };
}

async function handlePolicyUpload(file) {
  if (!file) return;
  activePages = [];
  uploadedFileName = file.name;
  isSamplePolicy = false;
  isPolicyDocument = false;
  updatePolicyAvailability();
  elements.replacePolicy.textContent = "Reload demo";
  elements.policyName.textContent = file.name.replace(/\.[^.]+$/, "").slice(0, 26) || "Uploaded document";
  elements.policyStatus.textContent = "Reading document…";
  showDocumentNotice("Checking whether this document contains health insurance policy wording…");
  try {
    let result;
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) result = await extractPdf(file);
    else {
      const text = await file.text();
      result = { pageCount: 1, pages: textPagesToChunks(text.split(/\f|\n\s*---\s*page\s*---\s*\n/i)) };
    }
    if (!result.pages.length) {
      activePages = [];
      isPolicyDocument = false;
      uploadedFileName = file.name;
      elements.policyName.textContent = file.name.replace(/\.[^.]+$/, "").slice(0, 26) || "Uploaded policy";
      elements.policyStatus.textContent = "No selectable text found";
      elements.pageCount.textContent = `${result.pageCount} ${result.pageCount === 1 ? "page" : "pages"}`;
      elements.policyKind.textContent = "No text extracted — scanned pages need OCR";
      elements.eligibilityNote.classList.add("alert");
      elements.eligibilityText.textContent = "The file has no selectable text, so we cannot confirm that it is a health insurance policy. Upload a text-based policy PDF, or reload the fictional demo.";
      updatePolicyAvailability();
      showDocumentNotice("We could not read selectable text from this file, so we cannot confirm that it is a health insurance policy. Scanned PDFs need OCR, which is not included in this prototype.", true);
      return;
    }
    if (!classifyPolicyDocument(result.pages)) {
      activePages = [];
      isPolicyDocument = false;
      elements.policyName.textContent = file.name.replace(/\.[^.]+$/, "").slice(0, 26) || "Uploaded document";
      elements.policyStatus.textContent = "Not recognized as a health policy";
      elements.pageCount.textContent = `${result.pageCount} ${result.pageCount === 1 ? "page" : "pages"}`;
      elements.policyKind.textContent = "Upload health insurance policy wording or schedule";
      elements.eligibilityNote.classList.add("alert");
      elements.eligibilityText.textContent = "No policy answers or treatment estimates are available for this document.";
      updatePolicyAvailability();
      showDocumentNotice("This document does not look like a health insurance policy. Upload a health policy wording or schedule with coverage details such as sum insured, waiting periods, hospital benefits, deductibles, or exclusions. No policy answers or estimates were generated.", true);
      return;
    }
    activePages = result.pages;
    uploadedFileName = file.name;
    isSamplePolicy = false;
    isPolicyDocument = true;
    updatePolicyAvailability();
    elements.policyName.textContent = file.name.replace(/\.[^.]+$/, "").slice(0, 26) || "Uploaded policy";
    elements.policyStatus.textContent = "Uploaded · text extracted in browser";
    elements.pageCount.textContent = `${result.pageCount} ${result.pageCount === 1 ? "page" : "pages"}`;
    elements.policyKind.textContent = "Using your uploaded text · verify each passage";
    elements.eligibilityNote.classList.add("alert");
    elements.eligibilityText.textContent = "The cost estimate still uses fictional sample policy terms. Use policy Q&A to search your uploaded text; uploaded-policy benefit calculation is not enabled.";
    elements.messages.innerHTML = `<div class="date-divider"><span>DOCUMENT READY</span></div>`;
    const notice = document.createElement("div");
    notice.className = "upload-notice";
    notice.textContent = `“${file.name}” is ready. Ask about a clause, or choose a suggested question below.`;
    elements.messages.append(notice);
    calculateEstimate();
    elements.chatInput.focus();
  } catch (error) {
    console.error(error);
    activePages = [];
    uploadedFileName = file.name;
    isSamplePolicy = false;
    isPolicyDocument = false;
    elements.policyName.textContent = file.name.replace(/\.[^.]+$/, "").slice(0, 26) || "Uploaded policy";
    elements.policyStatus.textContent = "Could not read document";
    elements.pageCount.textContent = "Not available";
    elements.policyKind.textContent = "Try a searchable PDF or a plain text file";
    elements.eligibilityNote.classList.add("alert");
    elements.eligibilityText.textContent = "The document could not be read, so policy Q&A and treatment estimates are unavailable.";
    updatePolicyAvailability();
    showDocumentNotice("The file could not be read, so we cannot confirm that it is a health insurance policy. Try a text-based policy PDF or reload the fictional demo.", true);
  }
}

function setupEvents() {
  elements.uploadTrigger.addEventListener("click", () => elements.upload.click());
  elements.replacePolicy.addEventListener("click", () => {
    if (isSamplePolicy) elements.upload.click();
    else window.location.reload();
  });
  elements.upload.addEventListener("change", (event) => {
    handlePolicyUpload(event.target.files?.[0]);
    event.target.value = "";
  });
  elements.chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!isSamplePolicy && !isPolicyDocument) return;
    const question = elements.chatInput.value.trim();
    if (!question) return;
    addUserMessage(question);
    addAssistantMessage(question);
    elements.chatInput.value = "";
  });
  document.querySelectorAll("[data-question]").forEach((button) => button.addEventListener("click", () => {
    elements.chatInput.value = button.dataset.question;
    elements.chatForm.requestSubmit();
  }));
  document.addEventListener("click", (event) => {
    const citation = event.target.closest("[data-source]");
    if (citation) openSource(citation.dataset.source);
  });
  elements.treatment.addEventListener("change", calculateEstimate);
  elements.treatmentPurpose.addEventListener("change", calculateEstimate);
  elements.policyStart.addEventListener("change", calculateEstimate);
  elements.treatmentDate.addEventListener("change", calculateEstimate);
  elements.preExisting.addEventListener("change", calculateEstimate);
  elements.hospitalName.addEventListener("input", calculateEstimate);
  elements.networkStatus.addEventListener("change", calculateEstimate);
  elements.hospitalQuote.addEventListener("input", calculateEstimate);
  elements.roomRent.addEventListener("change", calculateEstimate);
  elements.comparisonQuote.addEventListener("input", () => renderComparison(lastCalculation));
  elements.comparisonHospital.addEventListener("input", () => renderComparison(lastCalculation));
  elements.preauthChecklist.addEventListener("change", updatePreauthProgress);
  document.querySelector("#print-preauth").addEventListener("click", () => window.print());
  elements.breakdownToggle.addEventListener("click", () => {
    const expanded = elements.breakdownToggle.getAttribute("aria-expanded") === "true";
    elements.breakdownToggle.setAttribute("aria-expanded", String(!expanded));
    elements.breakdown.hidden = expanded;
    elements.breakdownToggle.innerHTML = expanded ? "View breakdown <span>⌄</span>" : "Hide breakdown <span>⌃</span>";
  });
  document.querySelector("#view-all-policy").addEventListener("click", () => openSource(activePages[0]?.page ?? 1));
  document.querySelector("#change-info").addEventListener("click", () => elements.policyStart.focus());
  document.querySelector("#help-button").addEventListener("click", () => elements.aboutDialog.showModal());
  document.querySelector("#footer-about").addEventListener("click", () => elements.aboutDialog.showModal());
  document.querySelector("#about-close").addEventListener("click", () => elements.aboutDialog.close());
  document.querySelector("#about-done").addEventListener("click", () => elements.aboutDialog.close());
  document.querySelector("#dialog-close").addEventListener("click", () => elements.dialog.close());
  document.querySelector("#dialog-action").addEventListener("click", () => elements.dialog.close());
  elements.dialog.addEventListener("click", (event) => { if (event.target === elements.dialog) elements.dialog.close(); });
  elements.aboutDialog.addEventListener("click", (event) => { if (event.target === elements.aboutDialog) elements.aboutDialog.close(); });
  updatePreauthProgress();
}

const defaultTreatmentDate = new Date();
defaultTreatmentDate.setDate(defaultTreatmentDate.getDate() + 7);
elements.treatmentDate.value = [defaultTreatmentDate.getFullYear(), String(defaultTreatmentDate.getMonth() + 1).padStart(2, "0"), String(defaultTreatmentDate.getDate()).padStart(2, "0")].join("-");
setSamplePolicy();
setupEvents();
