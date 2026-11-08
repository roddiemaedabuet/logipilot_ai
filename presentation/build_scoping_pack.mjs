import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "file:///C:/Users/roddi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const workspaceDir = "C:/LogiPilot_AI";
const skillDir = "C:/Users/roddi/.codex/plugins/cache/openai-primary-runtime/presentations/26.1105.12137/skills/presentations";
const buildDir = path.join(workspaceDir, ".pptx-build");
const finalDir = path.join(workspaceDir, "presentation");
const finalPath = path.join(finalDir, "LogiPilot_AI_Scoping_Pack.pptx");
const candidatePath = path.join(buildDir, "LogiPilot_AI_Scoping_Pack.candidate.pptx");
const finalizedPath = path.join(buildDir, "LogiPilot_AI_Scoping_Pack.lp013-finalized-v3.pptx");
const coveragePath = path.join(finalDir, "LogiPilot_AI_Requirement_Coverage.csv");

const C = {
  navy: "#0A1E35", ink: "#102A43", blue: "#1D70B8", teal: "#0F8B8D",
  mint: "#D9F3EE", sky: "#E8F2FA", paper: "#F7FAFC", white: "#FFFFFF",
  grey: "#5B7083", light: "#D9E2EC", amber: "#F6C85F", orange: "#E77D2E",
  red: "#BF3B45", green: "#237A57", lilac: "#EEEAF9"
};
const W = 1280, H = 720;
const FONT = "Arial";

function addBox(slide, left, top, width, height, fill = "none", lineFill = "none", radius = false, name = "") {
  return slide.shapes.add({
    geometry: radius ? "roundRect" : "rect", name,
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: lineFill, width: lineFill === "none" ? 0 : 1 },
    borderRadius: radius ? "rounded-xl" : undefined,
  });
}

function addText(slide, text, left, top, width, height, size = 20, color = C.ink, bold = false, opts = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox", position: { left, top, width, height }, fill: "none",
    line: { style: "solid", fill: "none", width: 0 }, name: opts.name || ""
  });
  shape.text = text;
  shape.text.style = {
    fontFace: FONT, fontSize: size, color, bold,
    ...(opts.italic ? { italic: true } : {}),
    ...(opts.align ? { align: opts.align } : {}),
    ...(opts.valign ? { valign: opts.valign } : {}),
  };
  return shape;
}

function rule(slide, left, top, width, color = C.light, h = 2) {
  addBox(slide, left, top, width, h, color, color);
}

function pill(slide, text, left, top, width, fill, color = C.navy) {
  addBox(slide, left, top, width, 27, fill, fill, true);
  addText(slide, text, left + 3, top + 5, width - 6, 17, 10, color, true, { align: "center" });
}

function title(slide, heading, subtitle = "") {
  addText(slide, heading, 64, 42, 970, 50, 32, C.navy, true);
  if (subtitle) addText(slide, subtitle, 64, 95, 1060, 30, 16, C.grey, false);
  rule(slide, 64, 132, 1152, C.light, 2);
}

function footer(slide, n) {
  rule(slide, 64, 674, 1152, C.light, 1);
  addText(slide, "LogiPilot AI  |  Final-interview case study  |  Synthetic POC", 64, 684, 900, 18, 10, C.grey);
  addText(slide, String(n).padStart(2, "0"), 1165, 684, 51, 18, 10, C.grey, true, { align: "right" });
}

function newSlide(p, n, heading, subtitle = "") {
  const slide = p.slides.add();
  slide.background.fill = C.paper;
  title(slide, heading, subtitle);
  footer(slide, n);
  return slide;
}

function stage(slide, num, heading, detail, left, top, width, accent) {
  addBox(slide, left, top, width, 132, C.white, C.light, true);
  addBox(slide, left, top, 10, 132, accent, accent, true);
  addText(slide, num, left + 24, top + 20, 50, 26, 15, accent, true);
  addText(slide, heading, left + 24, top + 52, width - 42, 26, 18, C.navy, true);
  addText(slide, detail, left + 24, top + 84, width - 38, 34, 13, C.grey);
}

function processHeader(slide, code, titleText, accent, left, top, width) {
  pill(slide, code, left, top, 52, accent, C.white);
  addText(slide, titleText, left + 66, top + 1, width - 66, 30, 20, C.navy, true);
}

function node(slide, label, sub, left, top, width, fill, accent) {
  addBox(slide, left, top, width, 96, fill, accent, true);
  addText(slide, label, left + 12, top + 13, width - 24, 36, 15, C.navy, true, { align: "center" });
  addText(slide, sub, left + 12, top + 57, width - 24, 28, 10.5, C.grey, false, { align: "center" });
}

function labelBlock(slide, heading, body, left, top, width, accent) {
  addBox(slide, left, top, width, 84, C.white, C.light, true);
  addBox(slide, left, top, width, 7, accent, accent, true);
  addText(slide, heading, left + 16, top + 19, width - 32, 20, 15, C.navy, true);
  addText(slide, body, left + 16, top + 45, width - 32, 26, 12.5, C.grey);
}

function note(slide, text, left = 64, top = 627, width = 1152) {
  addBox(slide, left, top, width, 31, C.lilac, C.lilac, true);
  addText(slide, text, left + 13, top + 7, width - 26, 16, 11.5, C.ink, false);
}

function cover(p) {
  const s = p.slides.add(); s.background.fill = C.navy;
  addBox(s, 0, 0, 1280, 16, C.teal, C.teal);
  addText(s, "LOGIPILOT AI", 72, 90, 360, 35, 17, C.mint, true);
  addText(s, "AI-first logistics\nscoping pack", 72, 150, 650, 155, 48, C.white, true);
  addText(s, "A final-interview POC for a large multinational integrated ocean-freight and logistics operator", 72, 334, 610, 65, 21, "#D9E2EC");
  rule(s, 72, 455, 560, C.teal, 3);
  addText(s, "Three connected processes", 72, 485, 290, 22, 15, C.mint, true);
  addText(s, "P1  Shipment request intake\nP2  Intelligent container allocation\nP3  Receiving and handoff management", 72, 522, 465, 96, 19, C.white);
  addBox(s, 800, 125, 360, 410, "#0E314F", "#0E314F", true);
  addText(s, "POC boundary", 842, 174, 275, 32, 20, C.mint, true);
  addText(s, "Synthetic records\nSimulated AI behavior\nHuman approvals retained\nNo live enterprise integrations", 842, 232, 270, 165, 21, C.white);
  addText(s, "Product and engineering scoping", 72, 670, 490, 20, 11, "#A9C6DA");
  addText(s, "01", 1130, 670, 78, 20, 11, "#A9C6DA", true, { align: "right" });
}

function slide2(p) {
  const s = newSlide(p, 2, "Business problem", "The connected journey is slowed when information, equipment decisions, and delivery evidence remain fragmented");
  const problems = [
    ["Incomplete shipment information", "Email, phone, and document records can omit or contradict mandatory shipment details.", C.blue],
    ["Manual customer clarification", "Support must identify gaps, preserve evidence, and obtain a traceable response before submission.", C.blue],
    ["Container availability and allocation", "Confirmed demand competes for available and expected-ready equipment under operational constraints.", C.teal],
    ["Shipment visibility", "Teams need one shared booking journey rather than disconnected progress updates.", C.orange],
    ["Receiving discrepancies and documentation", "Physical validation, custody evidence, and proof of delivery require accountable human review.", C.red],
  ];
  problems.forEach((pbl, i) => labelBlock(s, pbl[0], pbl[1], 64 + (i % 2) * 576, 168 + Math.floor(i / 2) * 112, 544, pbl[2]));
  labelBlock(s, "POC focus", "Provide explainable assistance across the three connected processes while preserving evidence, deterministic controls, and human decisions.", 64, 510, 1120, C.navy);
}

function slide3(p) {
  const s = newSlide(p, 3, "Business opportunity", "An integrated POC can demonstrate where targeted assistance supports operational teams without replacing their authority");
  const opportunities = [
    ["Faster request processing", "Guide evidence-led intake and targeted clarification before Support validates.", C.blue],
    ["Improved data quality", "Make missing, partial, conflicting, and implausible details visible with source provenance.", C.teal],
    ["Better allocation decisions", "Present comparable, explainable options against confirmed booking demand and deterministic constraints.", C.orange],
    ["Reduced manual coordination", "Carry approved booking information, decisions, and audit history through one shared journey.", C.green],
    ["Tracking and accountability", "Maintain booking-level evidence, handoffs, discrepancy resolution, POD, and delivery confirmation.", C.blue],
  ];
  opportunities.forEach((o, i) => labelBlock(s, o[0], o[1], 64 + (i % 2) * 576, 168 + Math.floor(i / 2) * 112, 544, o[2]));
  note(s, "Opportunity statements are qualitative. The POC makes no quantified benefit, performance, cost, or feasibility claim.");
}

function slide4(p) {
  const s = newSlide(p, 4, "Product vision", "An AI-first integrated logistics application that connects customer requests, container allocation, and shipment delivery");
  addText(s, "LogiPilot AI gives operational teams one evidence-led record from first customer request through delivery.", 64, 174, 704, 64, 27, C.ink, true);
  const users = [
    ["Support", "Reviews intake, clarification, and validation", C.blue],
    ["Equipment Manager", "Approves allocation recommendations", C.teal],
    ["Receiver", "Validates receiving evidence and delivery", C.orange],
    ["Administrator", "Manages accounts and module permissions", C.green],
  ];
  users.forEach((u, i) => { const x = 64 + i * 282; addBox(s, x, 300, 252, 128, C.white, C.light, true); addBox(s, x, 300, 252, 8, u[2], u[2], true); addText(s, u[0], x+16, 329, 220, 24, 17, C.navy, true); addText(s, u[1], x+16, 366, 220, 34, 13, C.grey); });
  labelBlock(s, "Value proposition", "Explain what the POC found, what deterministic rules allow, and where a person must decide—without claiming live integrations or autonomous operations.", 64, 490, 1120, C.navy);
}

function slide5(p) {
  const s = newSlide(p, 5, "Top three agentic functions", "Multi-step assistance is separated from deterministic rules and mandatory human approvals");
  const cols = [64, 449, 834];
  const specs = [
    ["P1", "Shipment Requests", C.blue, "Simulated AI extracts and compares email, phone, and document evidence; flags gaps and drafts clarifications.", "Support validates and submits."],
    ["P2", "Container Allocation", C.teal, "Simulated AI produces explainable, ranked options from confirmed booking demand and sample inventory.", "Equipment Manager approves, rejects, or modifies."],
    ["P3", "Receiving & Handoff", C.orange, "Simulated AI prepares evidence checks and identifies recorded discrepancies across the booking journey.", "Receiver resolves discrepancies and confirms delivery."],
  ];
  specs.forEach((sp, i) => { const [code, h, accent, agent, human] = sp; const x = cols[i]; addBox(s, x, 177, 322, 365, C.white, C.light, true); pill(s, code, x+22, 201, 48, accent, C.white); addText(s, h, x+22, 248, 276, 45, 20, C.navy, true); addText(s, "SIMULATED AI", x+22, 320, 160, 17, 11, accent, true); addText(s, agent, x+22, 348, 276, 91, 13.5, C.grey); addText(s, "HUMAN APPROVAL", x+22, 462, 170, 17, 11, C.orange, true); addText(s, human, x+22, 488, 276, 34, 13.5, C.ink, true); });
  note(s, "Deterministic rules govern required fields, IDs, compatibility, capacity, cost threshold, reservation, journey status, evidence gates, and completion.");
}

function slide6(p) {
  const s = newSlide(p, 6, "Unified end-to-end workflow", "One shared journey links the Request ID, Booking ID, allocation decision, delivery evidence, and final confirmation");
  const items = [
    ["Customer request", "Request ID created", C.sky, C.blue],
    ["Review & clarify", "Evidence and validation", C.sky, C.blue],
    ["Ready to submit", "Support validated", C.mint, C.teal],
    ["Support submits", "Booking ID automatically created", C.mint, C.teal],
    ["Equipment allocation", "Approved plan and reservation", "#FFF3E2", C.orange],
    ["Shipment movement", "One booking journey status", "#FFF3E2", C.orange],
    ["Receiver validation", "POD and confirmation", "#E7F4EC", C.green],
  ];
  const xs = [64, 226, 388, 550, 712, 874, 1036];
  items.forEach((it, i) => { node(s, it[0], it[1], xs[i], 190, 146, it[2], it[3]); if (i < items.length-1) rule(s, xs[i]+146, 237, 16, C.grey, 2); });
  addText(s, "Request lifecycle", 64, 334, 250, 25, 18, C.blue, true);
  addText(s, "Pending  →  Picked Up  ↔  For Clarification  →  Ready for Submission  →  Submitted", 64, 371, 1070, 26, 17, C.ink);
  addText(s, "Booking journey after Support submission", 64, 440, 420, 25, 18, C.teal, true);
  addText(s, "Equipment Allocation  →  Ready for Pickup  →  Cargo Collected  →  At Origin Port  →  Ocean Transit  →  Landed at Destination Port  →  Inland Transit (if applicable)  →  Arrived at Receiving Location  →  Under Validation  →  Handed Off  →  Partially Delivered (if applicable)  →  Delivered / Completed", 64, 479, 1122, 72, 14.2, C.ink);
  note(s, "Request ID is created at first customer contact. Booking ID is automatically created only when Support submits a fully validated request. No Handoff ID.");
}

function slide7(p) {
  const s = newSlide(p, 7, "Shipment Requests", "Evidence-led intake and clarification before Support validates and submits a request");
  processHeader(s, "P1", "Shipment Requests workflow", C.blue, 64, 162, 500);
  const steps = [["Customer email or phone", "Request ID at first contact"],["Simulated AI extraction", "Field provenance and assessment"],["Support clarification", "Targeted questions and new evidence"],["Support validation", "All requirements checked"],["Support submits", "Booking ID automatically created"]];
  steps.forEach((st, i) => node(s, st[0], st[1], 64+i*215, 212, 190, i<2 ? C.sky : i<4 ? C.mint : "#FFF3E2", i<2 ? C.blue : i<4 ? C.teal : C.orange));
  addText(s, "Ten mandatory intake categories", 64, 334, 360, 27, 20, C.navy, true);
  addText(s, "Shipper and consignee  •  Pickup  •  Delivery  •  Cargo description  •  Quantity\nWeight and dimensions  •  Ocean service  •  Cargo readiness  •  Delivery window  •  Special handling", 64, 372, 865, 60, 16.5, C.ink);
  labelBlock(s, "Simulated AI", "Extracts, compares, exposes provenance, identifies missing / partial / conflicting / implausible data, and suggests clarification.", 64, 474, 540, C.blue);
  labelBlock(s, "Support control", "Reviews evidence, rejects invalid requests with audit reason, validates all required fields, and submits only when complete.", 646, 474, 540, C.orange);
  note(s, "Clarification never overwrites original evidence. Support remains responsible for customer communication and final validation.");
}

function slide8(p) {
  const s = newSlide(p, 8, "Container Allocation", "Recommendations support Equipment Managers; they never auto-approve, reserve, or execute a plan");
  processHeader(s, "P2", "Allocation workflow", C.teal, 64, 162, 500);
  const items = [["Confirmed booking demand", "Booking-linked requirements only", C.sky, C.blue],["Sample inventory", "Ready and expected-ready containers", C.sky, C.blue],["Deterministic constraints", "Type, compatibility, capacity, date, cost, priority", C.mint, C.teal],["Simulated AI options", "Ranked and explained single-origin plans", C.mint, C.teal],["Equipment Manager", "Approve, reject, modify, or manual allocation", "#FFF3E2", C.orange]];
  items.forEach((it,i) => node(s, it[0], it[1], 64+i*227, 212, i===4 ? 214 : 190, it[2], it[3]));
  addText(s, "Recommendation content", 64, 336, 310, 26, 20, C.navy, true);
  addText(s, "Quantity/type, source and destination, schedule, cost and transit, affected Booking IDs, priority rationale, risks, shortage or delay, and comparable alternatives.", 64, 374, 1110, 46, 16.5, C.ink);
  labelBlock(s, "Approval and reservation", "Equipment Manager rechecks feasibility before approval. Approved containers are reserved; reservation prevents double allocation. A draft Operations instruction follows approval.", 64, 464, 540, C.teal);
  labelBlock(s, "Execution tracking", "Track Pending, In Progress, Completed, or Failed. Cancellation before execution requires a reason. Recalculate supports pre-approval reassessment only.", 646, 464, 540, C.orange);
  note(s, "POC parameters and feeds are sample data. Full port, terminal, customs, and cutoff validation and external leasing are future scope.");
}

function slide9(p) {
  const s = newSlide(p, 9, "Receiving & Handoff", "Booking-level evidence and Receiver controls carry the journey through documented delivery");
  processHeader(s, "P3", "Receiving and handoff workflow", C.orange, 64, 162, 500);
  const items = [["Arrived booking", "One current journey status", C.sky, C.blue],["Receiver physical validation", "Count, condition, seal, container checks", "#FFF3E2", C.orange],["Simulated AI comparison", "Booking, documents, recorded evidence", "#FFF3E2", C.orange],["Manual resolution", "Discrepancy evidence and history", C.mint, C.teal],["Handoff and POD", "Receiver confirmation gates completion", "#E7F4EC", C.green]];
  items.forEach((it,i) => node(s, it[0], it[1], 64+i*226, 214, i===4 ? 218 : 190, it[2], it[3]));
  addText(s, "Receiving and custody record", 64, 339, 350, 27, 20, C.navy, true);
  addText(s, "Sending and receiving parties, Receiver, timestamps, documents, physical checks, validation outcome, discrepancies, resolutions, handoff history, proof of delivery, and final delivery summary.", 64, 378, 1115, 50, 16.5, C.ink);
  labelBlock(s, "Discrepancy and partial delivery", "A discrepancy blocks completion until manually resolved. Receiver can record delivered and outstanding quantity; the booking remains Partially Delivered while quantity remains.", 64, 474, 540, C.red);
  labelBlock(s, "Completion gate", "AI assesses recorded evidence only. Delivery requires proof of delivery and Receiver confirmation; the system does not autonomously complete a shipment.", 646, 474, 540, C.green);
  note(s, "Multiple handoff events remain under the Booking ID. No Handoff ID is created. Receiver terminology is used throughout the POC.");
}

function slide10(p) {
  const s = newSlide(p, 10, "POC scope and out of scope", "A basic interview POC demonstrates the connected journey while keeping integrations and future product capability outside the delivered scope");
  addText(s, "IN THE CURRENT POC", 64, 169, 360, 24, 16, C.green, true);
  const inside = [["Connected workflows", "Shipment Requests, Container Allocation, and Receiving & Handoff with shared Booking ID journey", C.blue],["Controlled decisions", "Support, Equipment Manager, and Receiver approval gates; audit history and deterministic controls", C.teal],["Access and data", "Desktop/tablet browser POC, sample data, mocked AI and enterprise feeds; no live systems", C.orange]];
  inside.forEach((it,i) => labelBlock(s, it[0], it[1], 64, 208+i*100, 520, it[2]));
  addText(s, "OUT OF SCOPE / FUTURE", 646, 169, 420, 24, 16, C.red, true);
  const outside = [["Platform & channels", "PWA, native mobile apps, enterprise SSO / expanded RBAC, and AI QA & coaching", C.blue],["Allocation extensions", "Demand forecasting, external leasing, full feasibility verification, KPI dashboard, multi-source plans, auto-replanning, alerts, amendment response, confidence scoring", C.teal],["Receiving & ecosystem", "Vessel Disruption Recovery, AI escalation, formal advanced exception handling, and direct partner / terminal integrations", C.orange]];
  outside.forEach((it,i) => labelBlock(s, it[0], it[1], 646, 208+i*100, 540, it[2]));
  note(s, "No live enterprise integrations, automated customer sending, shipment-network control, guaranteed rates or dates, customs approval, dispatch, or unsupervised handoff completion.");
}

function slide11(p) {
  const s = newSlide(p, 11, "Solution architecture and simulation boundary", "The POC explicitly separates sample sources, simulated AI, deterministic business rules, and human decisions");
  const layers = [["Experience", "Permission-controlled React + Vite modules for Shipment Requests, Container Allocation, and Receiving & Handoff; shared records and audit history", C.sky, C.blue],["Human approval", "Support validates and submits. Equipment Manager approves allocations. Receiver validates evidence, resolves discrepancies, and confirms delivery.", "#FFF3E2", C.orange],["Decision services", "SIMULATED AI: extraction, comparison, clarification, recommendations, evidence review. DETERMINISTIC: IDs, required fields, constraints, reservation, status and completion gates.", C.mint, C.teal],["Sample sources", "Mock email and phone records, documents, bookings, inventory, schedule/cost changes, receiving evidence, handoffs, and POD; no live enterprise feeds.", C.lilac, C.blue]];
  layers.forEach((l,i) => { const y=168+i*105; addBox(s,150,y,980,79,l[2],l[3],true); addText(s,l[0],177,y+13,240,23,17,C.navy,true); addText(s,l[1],440,y+12,660,50,13.5,C.ink); });
  note(s, "POC disclosure: sample data and simulated AI capabilities power the prototype. Any future integration requires feasibility, security, and authorization work.");
}

function slide12(p) {
  const s = newSlide(p, 12, "PROPOSED product roadmap — 2027", "Planning view only: these are not approved delivery commitments, budgets, or production-release dates");
  const x0=300, qW=210, y0=203, rowH=76;
  ["Q1 2027","Q2 2027","Q3 2027","Q4 2027"].forEach((q,i) => { addBox(s,x0+i*qW,158,qW-8,37,C.navy,C.navy,true); addText(s,q,x0+i*qW,168,qW-8,17,14,C.white,true,{align:"center"}); });
  const rows=[
    ["Validate the POC", "POC validation, requirements finalization, desktop/tablet browser testing and UAT", 0, 1, C.blue],
    ["Prepare the pilot", "Data integration feasibility, security, operational rules and pilot preparation", 1, 1, C.teal],
    ["Run controlled pilot", "Controlled operational pilot for all three processes and performance evaluation", 2, 1, C.orange],
    ["Decide next scope", "Conditional expansion, optimization, operational readiness and future prioritization", 3, 1, C.green],
  ];
  rows.forEach((r,i) => { const y=y0+i*rowH; addBox(s,64,y,218,rowH-10,C.white,C.light,true); addText(s,r[0],80,y+13,186,19,16,C.navy,true); addText(s,r[1],80,y+37,186,29,9.5,C.grey); for(let q=0;q<4;q++) addBox(s,x0+q*qW,y,qW-8,rowH-10,q===r[2]?"#F1F5F8":C.white,C.light,true); addBox(s,x0+r[2]*qW+12,y+15,qW-32,rowH-40,r[4],r[4],true); });
  addText(s,"Editable Gantt: each milestone is a native shape. Dependencies, data agreements, security approval, policy configuration, and ownership are TBD.",64,540,1122,32,15,C.ink,true,{align:"center"});
  note(s,"Conditional expansion may consider only approved future enhancements after POC evidence, feasibility work, and operational readiness review.");
}

function slide13(p) {
  const s = newSlide(p, 13, "Risks, assumptions, dependencies, and mitigations", "The POC presents uncertainties directly rather than implying production readiness");
  const headers=["Risk, assumption, or dependency","POC treatment / mitigation","Unresolved detail"];
  const xs=[64,493,887], ws=[403,368,299];
  headers.forEach((h,i)=>{ addBox(s,xs[i],170,ws[i],42,C.navy,C.navy,true); addText(s,h,xs[i]+14,181,ws[i]-28,18,14,C.white,true); });
  const rows=[
    ["Operational data accuracy", "Show source provenance, freshness, deterministic validation, and review before approval.", "Data owner and quality threshold: TBD"],
    ["Integration dependency", "Use sample data and manual/simulated records; defer live integration feasibility.", "Access, endpoints, and agreements: TBD"],
    ["AI limitations", "Label simulated AI; retain deterministic controls and human decisions.", "Production approach and evaluation: TBD"],
    ["Security and permissions", "Use admin-created accounts, module permissions, temporary credentials, and first-login change in POC.", "Production security design: TBD"],
    ["Evidence and delivery validation", "Record human physical checks; block completion on discrepancy, missing POD, or missing Receiver confirmation.", "Evidence standards and retention: TBD"],
  ];
  rows.forEach((r,j)=>{ const y=212+j*81; [0,1,2].forEach(i=>{ addBox(s,xs[i],y,ws[i],80,j%2?C.white:"#EEF4F8",C.light); addText(s,r[i],xs[i]+14,y+13,ws[i]-28,55,12.5,i===0?C.ink:C.grey,i===0); }); });
}

function slide14(p) {
  const s = newSlide(p, 14, "Demo journey and acceptance evidence", "The connected demonstration distinguishes implemented capability, automated evidence, manual observation, and remaining verification");
  const journey=[["Shipment Requests", "Request ID → clarification → Support validation → submission → Booking ID", C.blue],["Container Allocation", "Confirmed demand → options → Equipment Manager approval → reservation → execution", C.teal],["Receiving & Handoff", "Arrival → physical checks → discrepancy resolution → handoff → POD → completion", C.orange]];
  journey.forEach((j,i)=>{ const y=174+i*73; pill(s,String(i+1),64,y,42,j[2],C.white); addText(s,j[0],124,y+1,250,22,17,C.navy,true); addText(s,j[1],390,y+3,756,33,14.2,C.grey); });
  const evidence=[["Implemented functionality", "Interactive workflow, role-aware controls, shared booking journey, simulated AI labels, sample records, and audit history", C.blue],["Automated test results", "Use the current test report and build output as evidence; do not present a passing result that was not executed", C.teal],["Manual testing performed", "Record only observed browser steps and state changes; distinguish login-screen observation from authenticated cross-role testing", C.orange],["Not independently verified", "Authenticated end-to-end UAT, real integrations, operational feasibility, and production security remain TBD / outside POC", C.red]];
  evidence.forEach((e,i)=> labelBlock(s,e[0],e[1],64+(i%2)*576,418+Math.floor(i/2)*95,544,e[2]));
  note(s,"Coverage: 86 core requirements (P1 25, P2 40, P3 21) are traced in the companion coverage file. The 11 CSV enhancements remain out of scope.");
}

function csvEscape(value) { const s = String(value ?? ""); return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s; }

async function writeCoverage() {
  const raw = await fs.readFile(path.join(workspaceDir, "docs", "REQUIREMENTS_TRACEABILITY.csv"), "utf8");
  const lines = raw.trim().split(/\r?\n/);
  const records = lines.slice(1).map(line => {
    const m = line.match(/^([^,]+),([^,]+),([^,]+),(Core|Enhancement),("(?:[^"]|"")*"|[^,]*),("(?:[^"]|"")*"|[^,]*),(.*)$/);
    if (!m) throw new Error(`Could not parse traceability row: ${line}`);
    return { id: m[1], process: m[2], requirement: m[3], status: m[4], acceptance: m[5].replace(/^"|"$/g, '').replaceAll('""', '"'), evidence: m[6].replace(/^"|"$/g, '').replaceAll('""', '"'), source: m[7] };
  });
  const output = [["Requirement ID", "Process", "Requirement", "Status", "Slide references", "Planned prototype or roadmap evidence", "Acceptance criterion"]];
  for (const r of records) {
    let slides, evidence;
    if (r.status === "Enhancement") {
      slides = "10, 12"; evidence = "Future enhancement. Explicitly outside the current POC scope and retained on the proposed roadmap.";
    } else if (r.id.startsWith("P1")) {
      slides = "5, 6, 7, 10, 11, 14"; evidence = "Prototype and demo: sample email/phone intake, evidence-led ten-field checklist, clarification, Support validation, Request ID, submission, Booking ID, and audit history.";
    } else if (r.id.startsWith("P2")) {
      slides = "5, 6, 8, 10, 11, 14"; evidence = "Prototype and demo: confirmed Booking ID demand, sample inventory, explained recommendations, comparison, manager action, reservation, draft instruction, and execution tracking.";
    } else {
      slides = "5, 6, 9, 10, 11, 14"; evidence = "Prototype and demo: shared Booking ID journey, evidence comparison, discrepancy block and manual resolution, handoff history, partial delivery where applicable, POD, and completion gates.";
    }
    output.push([r.id, r.process, r.requirement, r.status, slides, evidence, r.acceptance]);
  }
  await fs.writeFile(coveragePath, output.map(row => row.map(csvEscape).join(",")).join("\r\n") + "\r\n", "utf8");
  return records.length;
}

async function main() {
  await fs.mkdir(buildDir, { recursive: true });
  await fs.mkdir(finalDir, { recursive: true });
  const p = Presentation.create({ slideSize: { width: W, height: H } });
  cover(p); slide2(p); slide3(p); slide4(p); slide5(p); slide6(p); slide7(p); slide8(p); slide9(p); slide10(p); slide11(p); slide12(p); slide13(p); slide14(p);
  const pptx = await PresentationFile.exportPptx(p);
  await pptx.save(candidatePath);
  const { finalizePresentation } = await import(pathToFileURL(path.join(skillDir, "container_tools", "artifact_tool_utils.mjs")).href);
  const result = await finalizePresentation({
    explicitTotalSlideCount: 14,
    requiredNativeTableOwnerSlides: [],
    requiredNativeChartOwnerSlides: [],
    workspaceDir,
    candidatePath,
    finalPath: finalizedPath,
    pythonExecutable: "C:/Users/roddi/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe",
    integrityValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_package_integrity.py"),
    layoutValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_layout_geometry.py"),
    layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-bullet-geometry", "--validate-heading-fit"],
    fontPolicy: { basis: "design", families: [FONT] },
    verifyArtifactToolImport: true,
    receiptPath: path.join(workspaceDir, ".codex-finalizer", "LogiPilot_AI_Scoping_Pack.lp013.validation-final-v3.json"),
  });
  await fs.copyFile(finalizedPath, finalPath);
  const count = await writeCoverage();
  console.log(JSON.stringify({ slides: p.slides.items.length, requirementsMapped: count, finalPath, coveragePath, finalizer: result }, null, 2));
}

main().catch(err => { console.error(err); process.exitCode = 1; });
