const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    text: "HealthGuard Uganda",
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    text: "Systemic Health Misinformation Screening & Offline-First Community Health Platform",
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    text: "A proposal for a resilient offline-first mobile/web health information, triage, and infodemic-management platform serving rural and semi-urban Uganda",
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    text: "Executive Summary",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    text: "HealthGuard Uganda proposes a resilient offline-first digital health platform to counter health misinformation, streamline household-level triage, and strengthen central coordination across Uganda's rural and semi-urban health system. The solution fuses:",
                }),
                new Paragraph({
                    text: "1. An offline-first Expo React Native client with on-device edge AI for rumor classification.",
                    bullet: { level: 0 }
                }),
                new Paragraph({
                    text: "2. A central Express/Prisma coordination backend that synchronizes data when connectivity returns.",
                    bullet: { level: 0 }
                }),
                new Paragraph({
                    text: "3. A hospital landing portal for regional public-facing information and scheduling.",
                    bullet: { level: 0 }
                }),
                new Paragraph({
                    text: "Rationale and evidence: offline-first architectures maintain data collection and care processes in low-connectivity settings; edge AI enables real-time misinformation screening without network access; centralized dashboards and RBAC support outbreak and rumor surveillance at district/national scales. The platform targets measurable outcomes including reductions in non-critical hospital visits, improved household maternal tracking, and enhanced district visibility into rumor trends and service utilization.",
                }),
                new Paragraph({
                    text: "Problem Statement",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    text: "Uganda's community health system faces four interlocking bottlenecks that HealthGuard is designed to alleviate:",
                }),
                new Paragraph({
                    text: "1) Proliferation of health misinformation and infodemics",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "The infodemic undermines timely care and vaccine uptake; locally contextualized counter-messaging is essential. Integrated, on-device screening plus a central repository of verified responses aligns with best-practice infodemic management in low-resource settings.",
                }),
                new Paragraph({
                    text: "2) Intermittent connectivity",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "Rural CHWs operate with limited data connectivity, diminishing cloud-centric tools. Offline-first architectures with local data stores and deferred synchronization have demonstrated viability for continuous data collection and care delivery.",
                }),
                new Paragraph({
                    text: "3) Strained healthcare infrastructure",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "Primary centers manage high patient volumes; standardized community-level triage and maternal health tracking can reduce unnecessary ER visits and improve ANC adherence.",
                }),
                new Paragraph({
                    text: "4) Lack of central coordination",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "District and national health offices require real-time visibility into rumor trends and local service utilization to mount timely responses; dashboards and geo-mapped data are central to this capability.",
                }),
                new Paragraph({
                    text: "Solution Overview",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    text: "HealthGuard Uganda deploys a tri-layer architecture designed for resilience, speed, and scale:",
                }),
                new Paragraph({
                    text: "Offline-First Edge Client: An Expo React Native application using expo-sqlite to enable complete offline operation for case screening, patient detail logging, maternal ANC tracking, and access to a verified knowledge base.",
                }),
                new Paragraph({
                    text: "Edge AI Misinformation Classifier: A lightweight on-device logistic regression model that screens incoming claims and stories for misinformation likelihood, enabling immediate triage and counseling without network access.",
                }),
                new Paragraph({
                    text: "National Backend Coordination Server: Express.js API with Prisma ORM, backed by PostgreSQL/SQLite. Services include central sync, real-time dashboards, and RBAC.",
                }),
                new Paragraph({
                    text: "Hospital Public Portal: A responsive static site with hospital departments, referral pathways, and emergency contacts.",
                }),
                new Paragraph({
                    text: "Development Phase & Implementation Timeline",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    text: "Phase 1: Foundation & Baseline (Months 1–2)",
                    bullet: { level: 0 }
                }),
                new Paragraph({
                    text: "Phase 2: Local Intelligence & Offline Core (Months 3–4)",
                    bullet: { level: 0 }
                }),
                new Paragraph({
                    text: "Phase 3: Backend & Sync Synchronization (Months 5–6)",
                    bullet: { level: 0 }
                }),
                new Paragraph({
                    text: "Phase 4: Pilot & Field Deployment (Month 7+)",
                    bullet: { level: 0 }
                }),
                new Paragraph({
                    text: "Metrics, Evaluation, and Impact",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    text: "Public Health Advocacy: Proportion of locally verified claims matched at point of care; rate and speed of rumor flagging.",
                }),
                new Paragraph({
                    text: "Operational Efficiency: Reduction in client check-in times; ANC adherence rates; completion rate of offline triage workflows.",
                }),
                new Paragraph({
                    text: "National Coordination: Lead-time to address district outbreaks; dashboard completeness.",
                }),
                new Paragraph({
                    text: "Safety & Privacy: Maturity of RBAC implementation; encryption; data retention policies.",
                }),
                new Paragraph({
                    text: "Equity & Access: Reach via planned USSD/SMS fallback; multilingual content coverage.",
                }),
                new Paragraph({
                    text: "Sustainability: Modular, open-source-friendly architecture; local capacity-building.",
                }),
                new Paragraph({
                    text: "Future Scalability & Next Steps",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    text: "Regional Language Localization: Luganda, Runyankole, Acholi, etc., to broaden accessibility.",
                }),
                new Paragraph({
                    text: "USSD/SMS Fallback: Extend core capabilities to feature phones via USSD gateways.",
                }),
                new Paragraph({
                    text: "Advanced ML & LLM Integration: Introduce deeper local models as hardware allows.",
                }),
                new Paragraph({
                    text: "National Rollout Strategy: Phased expansion with MoH partnerships.",
                }),
                new Paragraph({
                    text: "Annexes",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    text: "Annex A: Data Model (High-Level)",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "Entities: User, Role, Household, Patient, Case, TriageLog, MaternalRecord, KnowledgeAsset, Claim, VerificationRecord, SyncPacket, AuditLog, HospitalSitePage, Appointment, District, HealthEvent.",
                }),
                new Paragraph({
                    text: "Relationships: Users assign Roles; Households contain Patients; Patients have Cases, etc.",
                }),
                new Paragraph({
                    text: "Annex B: Risk Register",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "Connectivity Variability: Mitigation – robust offline storage, scheduled sync.",
                }),
                new Paragraph({
                    text: "Data Privacy/Regulatory Compliance: Mitigation – RBAC, encryption, data minimization.",
                }),
                new Paragraph({
                    text: "Model Drift/Edge AI Performance: Mitigation – versioned models, monitoring.",
                }),
                new Paragraph({
                    text: "Annex C: Budget Outline",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "Personnel: Product manager, software engineers, UX designer.",
                }),
                new Paragraph({
                    text: "Hardware: Mobile devices for pilots, offline storage, server infrastructure.",
                }),
                new Paragraph({
                    text: "Training & capacity-building: CHW training sessions.",
                }),
                new Paragraph({
                    text: "Contingency: 10–15%.",
                }),
                new Paragraph({
                    text: "Annex D: Glossary",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "Offline-First: Application functions fully without network access.",
                }),
                new Paragraph({
                    text: "Edge AI: On-device machine learning inference.",
                }),
                new Paragraph({
                    text: "RBAC: Role-Based Access Control.",
                }),
                new Paragraph({
                    text: "Bi-Directional Sync: Two-way data synchronization between local and central stores.",
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("HealthGuard_Uganda_Proposal.docx", buffer);
    console.log("Document created successfully at HealthGuard_Uganda_Proposal.docx");
});
