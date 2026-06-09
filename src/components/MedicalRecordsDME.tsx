import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Check, ShieldAlert, FileText, ClipboardList, PenTool, Clipboard, HeartCrack, Printer, RefreshCw, Send, Smartphone, MessageCircle, History, FileSpreadsheet } from "lucide-react";
import { Patient, MedicalRecord } from "../types.ts";

interface MedicalRecordsDMEProps {
  token: string | null;
  patient: Patient;
  onBack: () => void;
  userRole: string;
  clinic?: any;
}

export const MedicalRecordsDME: React.FC<MedicalRecordsDMEProps> = ({ token, patient, onBack, userRole, clinic }) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [receiptDispatches, setReceiptDispatches] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    symptoms: "",
    diagnosis: "",
    prescription: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [printingConsolidated, setPrintingConsolidated] = useState(false);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);

  // Medico-legal tracking states
  const [selectedRecordForHistory, setSelectedRecordForHistory] = useState<any>(null);
  const [recordHistoryList, setRecordHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [revisionsCount, setRevisionsCount] = useState<Record<string, number>>({});

  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<any>(null);
  const [correctionForm, setCorrectionForm] = useState({
    diagnosis: "",
    symptoms: "",
    prescription: "",
    notes: "",
    reason: ""
  });

  // States for clinical delegation and smart autocompletion (Module DMG)
  const [dmgStaff, setDmgStaff] = useState<any[]>([]);
  const [prescribeDelegatedCare, setPrescribeDelegatedCare] = useState(false);
  const [careForm, setCareForm] = useState({
    careType: "Surveillance Constantes (TA, T°, Pouls)",
    productUsed: "",
    quantityUsed: "1 ampoule",
    scheduledTime: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    observations: "",
    agentId: "",
  });

  // Clinical Autocomplete definitions
  const [clinicalAutocompleteItems, setClinicalAutocompleteItems] = useState<any[]>([
    { trigger: "@para", label: "💊 Paracétamol 500mg", text: "Paracétamol 500mg : 1 cp toutes les 6h en cas de fievre ou douleurs (Max 4 cp/jour)." },
    { trigger: "@amox", label: "💊 Amoxicilline 1g", text: "Amoxicilline 1g : 1 cp matin, midi et soir pendant 6 jours au milieu des repas." },
    { trigger: "@artem", label: "💊 Arteméther Coartem", text: "Artéméther/Luméfantrine (Coartem) : 1 cp à H0, H8, puis 1 cp matin et soir pendant 3 jours." },
    { trigger: "@spas", label: "💊 Spasfon 80mg", text: "Spasfon (Phloroglucinol) : 1 cp à renouveler en cas de contractures douloureuses." },
    { trigger: "@dolo", label: "💊 Dolusrène Inj IM", text: "Dolusrène : 1 ampoule injectable IM si douleur rebelle." },
    { trigger: "@nfs", label: "🧪 NFS / Hémogramme", text: "Numération Formule Sanguine (NFS / Hémogramme)" },
    { trigger: "@gly", label: "🧪 Glycémie à jeun", text: "Glycémie à jeun" },
    { trigger: "@ecbu", label: "🧪 ECBU (Urine)", text: "Examen Cytobactériologique des Urines (ECBU)" },
    { trigger: "@ge", label: "🧪 Goutte Épaisse (GE)", text: "Goutte Épaisse (GE) & TDR Paludisme" },
    { trigger: "@perf", label: "🩹 Perfusion G5%", text: "Perfusion intraveineuse lente de sérum glucosé 5% avec ampoules d'électrolytes." },
    { trigger: "@pans", label: "🩹 Pansement stérile", text: "Refaire pansement chirurgical stérile, nettoyage bétadine et surveillance locale." },
    { trigger: "@inj", label: "🩹 Injection SC Lovenox", text: "Injection sous-cutanée de Lovenox 0.4ml, surveillance locale." },
    { trigger: "@surv", label: "🩹 Surveillance TA/T°", text: "Surveillance horaire des constantes (Température, TA, Pouls) toutes les 4h." },
    { trigger: "@patient", label: "👤 Données Patients", text: `Patient: ${patient.lastName.toUpperCase()} ${patient.firstName}, Sexe: ${patient.gender}, DDN: ${patient.dateOfBirth}, Allergies: ${patient.allergies || "Aucune connue"}, Sang: ${patient.bloodType || "N/A"}` }
  ]);

  useEffect(() => {
    const loadDynamicLibrary = async () => {
      try {
        const res = await fetch("/api/medical-library", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const list = await res.json();
          if (list && list.length > 0) {
            const extended = [
              ...list,
              { trigger: "@patient", label: "👤 Données Patients", text: `Patient: ${patient.lastName.toUpperCase()} ${patient.firstName}, Sexe: ${patient.gender}, DDN: ${patient.dateOfBirth}, Allergies: ${patient.allergies || "Aucune connue"}, Sang: ${patient.bloodType || "N/A"}` }
            ];
            setClinicalAutocompleteItems(extended);
          }
        }
      } catch (err) {
        console.warn("Medical library database seeds fallback used.", err);
      }
    };
    loadDynamicLibrary();
  }, [token, patient]);

  const handleTextareaChange = (field: "symptoms" | "diagnosis" | "prescription" | "notes", val: string) => {
    let updated = val;
    clinicalAutocompleteItems.forEach(item => {
      if (updated.includes(item.trigger)) {
        updated = updated.replace(item.trigger, item.text);
      }
    });
    setFormData(prev => ({ ...prev, [field]: updated }));
  };

  // Modern Document Generator matching entete logo (Requirement 3)
  const handlePrintDocument = (type: "ordonnance" | "analyse" | "soins" | "cr", rec: MedicalRecord) => {
    const printWindow = window.open("", "", "width=850,height=800");
    if (!printWindow) return;

    const currentYear = new Date().getFullYear();
    const dobObj = new Date(patient.dateOfBirth);
    const patAge = currentYear - dobObj.getFullYear();

    let titleStr = "";
    let contentHtml = "";

    if (type === "ordonnance") {
      titleStr = "ORDONNANCE DE PRECRIPTION MÉDICALE";
      contentHtml = `
        <div style="margin-top: 30px; border: 1px solid #cbd5e1; border-radius: 12px; padding: 25px; background: #fafafa;">
          <h3 style="font-size: 13px; text-transform: uppercase; color: #0d9488; margin-bottom: 15px; border-bottom: 2px solid #0d9488; padding-bottom: 5px; font-weight: bold;">TRAITEMENT, MÉDICAMENTS ET POSOLOGIES</h3>
          <div style="font-family: inherit; font-size: 14px; line-height: 1.6; white-space: pre-wrap; font-weight: bold; color: #0f172a;">
            ${rec.prescription}
          </div>
        </div>
        <div style="margin-top: 25px; font-size: 11px; color: #64748b; line-height: 1.5; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
          <strong>Consignes de dispensation :</strong> Sauf mention contraire expresse, la substitution par des génériques agréés est autorisée par le médecin traitant.
        </div>
      `;
    } else if (type === "analyse") {
      titleStr = "DEMANDE D'ANALYSES ET EXAMENS BIOLOGIQUES";
      contentHtml = `
        <div style="margin-top: 30px; border: 1px solid #cbd5e1; border-radius: 12px; padding: 25px;">
          <h3 style="font-size: 13px; text-transform: uppercase; color: #0f766e; margin-bottom: 15px; border-bottom: 2px solid #0f766e; padding-bottom: 5px; font-weight: bold;">CATALOGUE D'EXAMENS REQUIS</h3>
          <p style="font-size: 12px; color: #334155; margin-bottom: 15px;">Le service d'analyses de la clinique ou du laboratoire partenaire est prié de réaliser les actes biologiques cochés ci-dessous :</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            ${[
              { code: "NFS", name: "Numération Formule Sanguine (NFS / Hémogramme)" },
              { code: "GS", name: "Groupe Sanguin & Facteur Rhésus" },
              { code: "GLY", name: "Glycémie à jeun" },
              { code: "CREA", name: "Créatininémie / Fonction rénale" },
              { code: "GE", name: "Goutte Épaisse (GE) & TDR Paludisme" },
              { code: "ECBU", name: "Examen Cytobactériologique des Urines (ECBU)" }
            ].map(test => {
              const isMatched = rec.notes?.toLowerCase().includes(test.code.toLowerCase()) || 
                                rec.prescription?.toLowerCase().includes(test.code.toLowerCase()) ||
                                rec.symptoms?.toLowerCase().includes(test.code.toLowerCase()) ||
                                rec.diagnosis?.toLowerCase().includes(test.code.toLowerCase());
              return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; width: 40px; text-align: center;">
                    <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid #0f766e; border-radius: 3px; font-weight: bold; background: ${isMatched ? '#0f766e' : 'transparent'}; line-height: 10px; color: white; font-size: 11px;">
                      ${isMatched ? '✓' : ''}
                    </span>
                  </td>
                  <td style="padding: 10px 0; font-size: 12px; font-weight: ${isMatched ? 'bold' : 'normal'};">
                    <strong>${test.code}</strong> - ${test.name}
                  </td>
                  <td style="padding: 10px 0; text-align: right; color: #64748b; font-size: 11px;">
                    ${isMatched ? '<span style="color: #0d9488; font-weight: bold;">[PREVALENT]</span>' : '[A PRELEVER]'}
                  </td>
                </tr>
              `;
            }).join("")}
          </table>
          
          <div style="margin-top: 25px; padding: 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; font-size: 11px; color: #0369a1; line-height: 1.45;">
            <strong>Consignes générales :</strong> Prélèvement à jeun requis pour les examens biochimiques. Délivrer les résultats via le DME sécurisé MédiSahel d'origine.
          </div>
        </div>
      `;
    } else if (type === "soins") {
      titleStr = "PRESCRIPTION DE SOINS ET PROTOCOLE DE GARDE";
      contentHtml = `
        <div style="margin-top: 30px; border: 1px solid #cbd5e1; border-radius: 12px; padding: 25px; background: #fafafa;">
          <h3 style="font-size: 13px; text-transform: uppercase; color: #b45309; margin-bottom: 15px; border-bottom: 2px solid #b45309; padding-bottom: 5px; font-weight: bold;">PRESCRIPTION DE SOINS DÉLÉGUÉS</h3>
          <p style="font-size: 12px; color: #334155; margin-bottom: 15px;">Le personnel soignant du département de médecine générale (DMG) est habilité à dispenser et signer les soins suivants :</p>
          
          <div style="font-size: 13px; font-family: sans-serif; line-height: 1.6; color: #0f172a; border-left: 4px solid #b45309; padding-left: 15px; margin: 15px 0;">
            <strong>Consignes de garde du praticien clinicien :</strong><br/>
            <div style="white-space: pre-wrap; font-family: monospace; font-size: 13px; margin-top: 8px; color: #78350f; font-weight: bold;">
              ${rec.notes || "Surveillance simple des observations physiologiques."}
            </div>
          </div>
          <div style="margin-top: 25px; font-size: 11px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 15px;">
            <strong>Traçabilité légale :</strong> Chaque geste de soin ou d'administration de posologie doit faire l'objet d'un scellé numérique dans le cahier de garde clinique.
          </div>
        </div>
      `;
    } else {
      titleStr = "COMPTE-RENDU DE CONSULTATION CLINIQUE";
      contentHtml = `
        <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr; gap: 20px;">
          
          <div style="border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 20px; background: #f8fafc;">
            <h4 style="font-size: 11px; text-transform: uppercase; color: #1e293b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; font-weight: bold;">1. DOSSIER MEDICAL : MOTIFS & OBSERVATIONS PHYSIQUES</h4>
            <p style="font-size: 13px; line-height: 1.5; color: #334155; white-space: pre-wrap;">${rec.symptoms}</p>
          </div>

          <div style="border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 20px; background: #fff;">
            <h4 style="font-size: 11px; text-transform: uppercase; color: #1e293b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; font-weight: bold;">2. EVALUATION DU CLINICIEN - DIAGNOSTIC PRINCIPAL</h4>
            <p style="font-size: 13px; line-height: 1.5; color: #0f172a; font-weight: bold; white-space: pre-wrap;">${rec.diagnosis}</p>
          </div>

          ${rec.notes ? `
            <div style="border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 20px; background: #fefef2;">
              <h4 style="font-size: 11px; text-transform: uppercase; color: #854d0e; margin-bottom: 8px; border-bottom: 1px solid #fef08a; padding-bottom: 4px; font-weight: bold;">3. DISCUSSIONS & RECOMMANDATIONS PARTICULIERES</h4>
              <p style="font-size: 13px; line-height: 1.5; color: #713f12; white-space: pre-wrap;">${rec.notes}</p>
            </div>
          ` : ''}

          <div style="border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 20px; background: #f0fdf4;">
            <h4 style="font-size: 11px; text-transform: uppercase; color: #166534; margin-bottom: 8px; border-bottom: 1px solid #bbf7d0; padding-bottom: 4px; font-weight: bold;">4. SYNTHÈSE DES PRESCRIPTIONS ET DISPENSATION</h4>
            <p style="font-size: 13px; line-height: 1.5; color: #14532d; font-family: monospace; white-space: pre-wrap; font-weight: bold;">${rec.prescription}</p>
          </div>

        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${titleStr} - ${patient.lastName.toUpperCase()} ${patient.firstName}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 45px; line-height: 1.5; font-size: 12px; }
            .hospital-header { display: flex; justify-content: space-between; border-bottom: 3px double #0d9488; padding-bottom: 15px; margin-bottom: 25px; }
            .hospital-title { font-size: 18px; font-weight: 850; color: #0d9488; text-transform: uppercase; margin: 0; }
            .hospital-contact { font-size: 10px; color: #64748b; line-height: 1.4; margin-top: 4px; }
            .doc-type { font-size: 12px; color: #ffffff; background-color: #0d9488; padding: 5px 12px; border-radius: 6px; font-weight: 800; text-transform: uppercase; display: inline-block; float: right; }
            .mali-header { text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px; font-weight: bold; font-size: 9px; letter-spacing: 0.5px; text-transform: uppercase; color: #64748b; }
            
            .patient-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 15px; margin-top: 15px; display: grid; grid-template-columns: 2fr 1fr; gap: 15px; }
            .patient-label { font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase; display: block; }
            .patient-value { font-size: 13px; font-weight: bold; color: #0f172a; }

            .footer-section { text-align: center; margin-top: 50px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            .signature-box { margin-top: 45px; display: flex; justify-content: space-between; align-items: flex-end; }
            .stamp { border: 2.5px solid #0d9488; color: #0d9488; padding: 10px; display: inline-block; font-weight: 800; font-size: 10px; border-radius: 8px; transform: rotate(-3deg); text-transform: uppercase; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="mali-header">
            RÉPUBLIQUE DU MALI • UN PEUPLE - UN BUT - UNE FOI • MINISTÈRE DE LA SANTÉ ET DE L'HYGIÈNE PUBLIQUE
          </div>
          
          <div class="hospital-header" style="clear: both; display: block; overflow: hidden;">
            <div style="float: left; width: 62%;">
              <h2 class="hospital-title">${clinic?.name || "MédiSahel Clinique Bamako V2"}</h2>
              <div class="hospital-contact">
                ${clinic?.address || "Hamdallaye ACI 2000"}, ${clinic?.city || "Bamako"}, ${clinic?.country || "Mali"}<br/>
                Tél: ${clinic?.phone || "+223 20 22 14 67"} | Email: ${clinic?.email || "contact@medishahel.com"}<br/>
                Directeur Médical Habilité - Hamed Sangaré
              </div>
            </div>
            <div style="float: right; width: 35%; text-align: right;">
              <div class="doc-type">${type === 'analyse' ? 'ANALYSE' : type === 'soins' ? 'SOINS' : type === 'cr' ? 'COMPTE-RENDU' : 'ORDONNANCE'}</div>
              <div style="font-size: 9px; font-family: monospace; color: #94a3b8; margin-top: 8px;">ID DOC: ${rec.id.slice(0, 8).toUpperCase()}</div>
            </div>
          </div>

          <div style="clear: both;"></div>

          <div class="patient-box">
            <div>
              <span class="patient-label">Dossier DME Patient</span>
              <span class="patient-value">${patient.lastName.toUpperCase()} ${patient.firstName}</span>
              <div style="font-size: 11px; color: #475569; margin-top: 4px;">
                Identifiant Permanent : <span style="font-family: monospace; font-weight: bold;">${patient.id}</span>
              </div>
            </div>
            <div>
              <span class="patient-label">Date d'édition</span>
              <span class="patient-value">${new Date(rec.date).toLocaleDateString("fr-FR")}</span>
              <div style="font-size: 11px; color: #475569; margin-top: 4px;">
                Âge: ${patAge} ans | Sexe: ${patient.gender === "M" ? "Masculin (M)" : "Féminin (F)"}
              </div>
            </div>
          </div>

          ${contentHtml}

          <div class="signature-box">
            <div>
              <div class="stamp">SCELLÉ CLINIQUE MÉDISAHEL</div>
            </div>
            <div style="text-align: right; width: 320px;">
              <p style="font-size: 11px; margin-bottom: 40px; color: #334155;">Fait à ${clinic?.city || "Bamako"}, le ${new Date(rec.date).toLocaleDateString("fr-FR")}</p>
              <p style="font-size: 13px; font-weight: bold; text-decoration: underline; color: #030712;">${rec.doctorName}</p>
              <p style="font-size: 9px; color: #64748b; font-style: italic;">Médecin Traitant Clinique Enregistré au CNOM</p>
            </div>
          </div>

          <div class="footer-section">
            Ce document est juridiquement opposable et certifié conforme par la direction de ${clinic?.name || "MédiSahel"}.<br/>
            Hamdallaye ACI 2000, Bamako, Mali - Document confidentiel d'admission générale.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintConsolidatedDme = async () => {
    setPrintingConsolidated(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/full-dme`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement");

      const printWindow = window.open("", "", "width=900,height=800");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Dossier Médical Unique - ${data.patient.lastName.toUpperCase()} ${data.patient.firstName}</title>
              <style>
                body { font-family: sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; font-size: 13px; }
                .hospital-header { display: flex; justify-content: space-between; border-bottom: 3px double #0d9488; padding-bottom: 15px; margin-bottom: 30px; }
                .hospital-title { font-size: 20px; font-weight: 800; color: #0f761e; text-transform: uppercase; letter-spacing: 0.5px; }
                .hospital-contact { font-size: 11px; color: #64748b; line-height: 1.4; margin-top: 4px; }
                .dossier-signature { font-size: 10px; color: #64748b; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; font-weight: bold; background-color: #f8fafc; text-transform: uppercase; }
                
                .section-header { font-size: 14px; font-weight: bold; color: #0f761e; text-transform: uppercase; border-left: 4px solid #0f766e; padding-left: 10px; margin-top: 30px; margin-bottom: 15px; }
                
                .patient-card { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 25px; }
                .patient-item { margin-bottom: 8px; }
                .patient-label { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; display: block; }
                .patient-value { font-size: 13px; font-weight: 700; color: #0f172a; }
                
                .record-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; background-color: #ffffff; }
                .record-meta { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 10px; font-size: 11px; color: #64748b; }
                .prescription { background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; line-height: 1.4; margin-top: 8px; white-space: pre-line; }
                
                table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
                th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
                th { background-color: #f8fafc; color: #475569; font-weight: bold; }
                
                .footer { text-align: center; margin-top: 60px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
                
                @media print {
                  body { padding: 20px; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="hospital-header">
                <div>
                  <div class="hospital-title">\${clinic?.name || "MédiSahel Clinique Bamako V2"}</div>
                  <div class="hospital-contact">
                    \${clinic?.address || "Hamdallaye ACI 2000"}, \${clinic?.city || "Bamako"}, \${clinic?.country || "Mali"} | Tél: \${clinic?.phone || "+223 20 22 14 67"}<br/>
                    Email: \${clinic?.email || "contact@medishahel.com"} | Web: \${clinic?.website || "www.medishahel.com"}
                  </div>
                </div>
                <div>
                  <div class="dossier-signature">DOSSIER MÉDICAL UNIQUE DE VIE</div>
                </div>
              </div>

              <div class="section-header">SIGNALÉTIQUE ET IDENTITÉ DU PATIENT</div>
              <div class="patient-card">
                <div class="patient-item">
                  <span class="patient-label">Identifiant Permanent DME</span>
                  <span class="patient-value" style="color: #0f761e; font-family: monospace;">${data.patient.id}</span>
                </div>
                <div class="patient-item">
                  <span class="patient-label">Identité Civile</span>
                  <span class="patient-value">${data.patient.lastName.toUpperCase()} ${data.patient.firstName}</span>
                </div>
                <div class="patient-item">
                  <span class="patient-label">Nationalité</span>
                  <span class="patient-value">${data.patient.nationalite || "Non renseignée"}</span>
                </div>
                <div class="patient-item">
                  <span class="patient-label">Ethnie</span>
                  <span class="patient-value">${data.patient.ethnie || "Non renseignée"}</span>
                </div>
                <div class="patient-item">
                  <span class="patient-label">Date de Naissance</span>
                  <span class="patient-value">${data.patient.dateOfBirth}</span>
                </div>
                <div class="patient-item">
                  <span class="patient-label">Sexe Biologique</span>
                  <span class="patient-value">${data.patient.gender === "M" ? "Masculin (M)" : "Féminin (F)"}</span>
                </div>
                <div class="patient-item">
                  <span class="patient-label">Groupe Sanguin</span>
                  <span class="patient-value" style="color: #e11d48;">${data.patient.bloodType || "N/A"}</span>
                </div>
                <div class="patient-item">
                  <span class="patient-label">Allergies Cliniques</span>
                  <span class="patient-value" style="color: #b91c1c;">${data.patient.allergies || "Aucune connue"}</span>
                </div>
                <div class="patient-item">
                  <span class="patient-label">Coordonnées Téléphoniques</span>
                  <span class="patient-value">${data.patient.phone || "Non spécifié"}</span>
                </div>
                <div class="patient-item">
                  <span class="patient-label">Adresse Domicile</span>
                  <span class="patient-value">${data.patient.address || "Non spécifié"}</span>
                </div>
              </div>

              <div class="section-header">SECTION I : HISTORIQUE DES CONSULTATIONS & PRESCRIPTIONS (${data.records.length})</div>
              \${data.records.length > 0 ? data.records.map((r: any) => \`
                <div class="record-card">
                  <div class="record-meta">
                    <div><strong>Médecin traitant :</strong> \${r.doctorName}</div>
                    <div><strong>Saisie le :</strong> \${new Date(r.date).toLocaleString("fr-FR")}</div>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <strong>Symptômes présentés et motif :</strong>
                    <div style="color: #475569; margin-top: 4px;">\${r.symptoms}</div>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <strong>Diagnostic clinique arrêté :</strong>
                    <div style="color: #0f172a; font-weight: bold; margin-top: 4px;">\${r.diagnosis}</div>
                  </div>
                  <div>
                    <strong>Ordonnance posologique prescrite :</strong>
                    <div class="prescription">\${r.prescription}</div>
                  </div>
                </div>
              \`).join("") : \`<p style="color: #64748b; font-style: italic;">Aucun antécédent clinique enregistré pour ce patient.</p>\`}

              <div class="section-header">SECTION II : HISTORIQUE DES ADMISSIONS HOSPITALIÈRES (\${data.hospitalizations.length})</div>
              \${data.hospitalizations.length > 0 ? \`
                <table>
                  <thead>
                    <tr>
                      <th>Identifiant Admission</th>
                      <th>Chambre - Lit</th>
                      <th>Date Admission</th>
                      <th>Date Sortie</th>
                      <th>Motif & Raison</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${data.hospitalizations.map((h: any) => \`
                      <tr>
                        <td style="font-family: monospace; font-weight: bold;">\${h.id}</td>
                        <td>Chambre \${h.roomNumber} - Lit \${h.bedNumber}</td>
                        <td>\${new Date(h.admissionDate).toLocaleDateString("fr-FR")}</td>
                        <td>\${h.dischargeDate ? new Date(h.dischargeDate).toLocaleDateString("fr-FR") : "-"}</td>
                        <td>\${h.reason}</td>
                        <td><strong>\${h.status}</strong></td>
                      </tr>
                    \`).join("")}
                  </tbody>
                </table>
              \` : \`<p style="color: #64748b; font-style: italic; margin-bottom: 25px;">Aucune hospitalisation enregistrée pour ce patient.</p>\`}

              <div class="section-header">SECTION III : ANOMALIES BIOLOGIQUES & EXAMENS DU LABORATOIRE (\${data.labTests.length})</div>
              \${data.labTests.length > 0 ? \`
                <table>
                  <thead>
                    <tr>
                      <th>Examen prescrit</th>
                      <th>Catégorie</th>
                      <th>Prescrit par</th>
                      <th>Date de l'acte</th>
                      <th>Résultats / Constatations</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${data.labTests.map((l: any) => {
                      let resOutput = "";
                      if (l.status !== "VALIDATED") {
                        resOutput = "<span style='color: #64748b; font-style: italic;'>[Validation technique du labo en cours]</span>";
                      } else {
                        let parsedRes: any = {};
                        try {
                          parsedRes = l.results ? JSON.parse(l.results) : {};
                        } catch (e) {
                          parsedRes = { raw: l.results };
                        }
                        
                        if (parsedRes.parameters && parsedRes.parameters.length > 0) {
                          resOutput = "<div style='font-family: monospace; font-size: 11px; line-height: 1.35;'>";
                          parsedRes.parameters.forEach((p: any) => {
                            const isAbnormal = p.interpretation && p.interpretation !== "Normal";
                            resOutput += "• <strong>" + p.name + "</strong> : <span style=\'" + (isAbnormal ? "color: #b91c1c; font-weight: bold;" : "color: #0f172a;") + "\'>" + (p.value || "-") + "</span> " + (p.unit || "") + " (" + (p.reference || "") + ") [" + (p.interpretation || "Normal") + "]<br/>";
                          });
                          if (parsedRes.interpretation) {
                            resOutput += "<div style=\'margin-top: 5px; padding-top: 5px; border-top: 1px dashed #cbd5e1;\'><strong>Synthèse :</strong> " + parsedRes.interpretation + "</div>";
                          }
                          resOutput += "</div>";
                        } else {
                          resOutput = l.results || "Pas de constantes biologiquement mesurées";
                        }
                      }
                      
                      return "<tr>" +
                        "<td><strong>" + l.testName + "</strong></td>" +
                        "<td>" + l.category + "</td>" +
                        "<td>Dr. " + l.requestedBy + "</td>" +
                        "<td>" + new Date(l.date).toLocaleDateString("fr-FR") + "</td>" +
                        "<td>" + resOutput + "</td>" +
                        "<td><span style=\'font-weight: bold; color: " + (l.status === 'VALIDATED' ? '#15803d' : '#854d0e') + "\'>" + l.status + "</span></td>" +
                      "</tr>";
                    }).join("")}
                  </tbody>
                </table>
              \` : \`<p style="color: #64748b; font-style: italic; margin-bottom: 25px;">Aucun examen de biologie ou imagerie enregistré pour ce patient.</p>\`}

              <div class="section-header">SECTION IV : LEDGER COMPTABLE ET SOLDE ADMINISTRATIF (\${data.transactions.length})</div>
              \${data.transactions.length > 0 ? \`
                <table>
                  <thead>
                    <tr>
                      <th>ID Facture</th>
                      <th>Prestation facturée</th>
                      <th>Méthode</th>
                      <th>Date</th>
                      <th>État</th>
                      <th style="text-align: right;">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${data.transactions.map((t: any) => \`
                      <tr>
                        <td style="font-family: monospace;">\${t.id}</td>
                        <td>\${t.description}</td>
                        <td>\${t.paymentMethod}</td>
                        <td>\${new Date(t.date).toLocaleDateString("fr-FR")}</td>
                        <td><span style="font-weight: bold; color: \${t.status === "PAID" ? "#15803d" : "#b91c1c"}">\${t.status}</span></td>
                        <td style="text-align: right; font-weight: bold;">\${t.amount.toLocaleString("fr-FR")} FCFA</td>
                      </tr>
                    \`).join("")}
                    <tr style="background-color: #f8fafc; font-weight: bold;">
                      <td colSpan="5" style="text-align: right;">SOLDE DISPENSATEUR RESTÉ DU</td>
                      <td style="text-align: right; color: #b91c1c; font-size: 13px;">
                        \${data.transactions.filter((t: any) => t.status === "UNPAID" || t.status === "PARTIAL").reduce((sum: number, t: any) => sum + t.amount, 0).toLocaleString("fr-FR")} FCFA
                      </td>
                    </tr>
                  </tbody>
                </table>
              \` : \`<p style="color: #64748b; font-style: italic;">Aucun flux de trésorerie lié à ce patient.</p>\`}

              <div class="footer">
                Ce Dossier Médical Unique est certifié conforme par la Direction Médicale de \${clinic?.name || "MédiSahel"}.<br/>
                \${clinic?.city || "Bamako"}, \${clinic?.country || "Mali"} - le \${new Date().toLocaleDateString("fr-FR")} - Document confidentiel soumis au secret médical.
              </div>
              <script>
                window.onload = function() { window.print(); window.close(); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (err: any) {
      alert("Erreur de génération du DME: " + err.message);
    } finally {
      setPrintingConsolidated(false);
    }
  };

  const handlePrintIndividualLabTest = (test: any) => {
    let details: any = {};
    try {
      details = test.results ? JSON.parse(test.results) : {};
    } catch (e) {
      details = { raw: test.results };
    }

    const printWindow = window.open("", "", "width=850,height=800");
    if (printWindow) {
      const formattedParams = (details.parameters || []).map((p: any) => {
        const isAbnormal = p.interpretation && p.interpretation !== "Normal";
        return `
          <tr style="border-bottom: 1px solid #e2e8f0; ${isAbnormal ? 'background-color: #fef2f2;' : ''}">
            <td style="padding: 10px; font-weight: 600; color: #1e293b;">${p.name}</td>
            <td style="padding: 10px; font-weight: bold; font-family: monospace; font-size: 13px; color: ${isAbnormal ? '#b91c1c' : '#0f172a'};">${p.value || "N/A"}</td>
            <td style="padding: 10px; font-family: monospace; color: #64748b;">${p.unit || ""}</td>
            <td style="padding: 10px; font-family: monospace; color: #64748b;">${p.reference || "N/A"}</td>
            <td style="padding: 10px;">
              <span style="font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px; ${
                p.interpretation === "Normal" 
                  ? 'background-color: #dcfce7; color: #15803d;' 
                  : 'background-color: #fee2e2; color: #991b1b;'
              }">${p.interpretation || "Normal"}</span>
            </td>
          </tr>
        `;
      }).join("");

      printWindow.document.write(`
        <html>
          <head>
            <title>Bulletin de Biologie Clinicienne - ${patient.lastName.toUpperCase()} ${patient.firstName} - ${test.testName}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; font-size: 13px; }
              .header { display: flex; justify-content: space-between; border-bottom: 3px double #0d9488; padding-bottom: 15px; margin-bottom: 30px; }
              .logo-title { font-size: 22px; font-weight: 900; color: #0d9488; text-transform: uppercase; letter-spacing: 0.5px; }
              .logo-sub { font-size: 11px; color: #64748b; line-height: 1.4; margin-top: 4px; }
              .seal-right { border: 2px solid #0d9488; padding: 8px 15px; border-radius: 8px; text-align: center; color: #0d9488; background-color: #f0fdfa; font-weight: bold; font-family: monospace; font-size: 10px; }
              
              .title-doc { text-align: center; font-size: 16px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 1px; margin: 25px 0; border: 1.5px solid #e2e8f0; padding: 10px; border-radius: 8px; background-color: #fafafa; }
              
              .grid-identity { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
              .id-item { margin-bottom: 6px; }
              .id-label { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; display: block; }
              .id-val { font-size: 13px; font-weight: 700; color: #0f172a; }
              
              table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
              th { padding: 12px 10px; background-color: #f1f5f9; color: #475569; font-weight: bold; border-bottom: 2px solid #cbd5e1; text-align: left; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
              
              .section-details { margin-top: 25px; padding: 15px; background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 10px; }
              .section-title { font-size: 11px; font-weight: bold; color: #0d9488; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; margin-top: 0; }
              .section-val { font-size: 12px; color: #334155; line-height: 1.5; white-space: pre-line; }
              
              .signature-holder { display: flex; justify-content: space-between; margin-top: 50px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
              .footer { text-align: center; margin-top: 60px; font-size: 10.5px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
              
              @media print {
                body { padding: 15px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="logo-title">\${clinic?.name || "MédiSahel Clinique Bamako V2"}</div>
                <div class="logo-sub">
                  \${clinic?.address || "Hamdallaye ACI 2000"}, \${clinic?.city || "Bamako"}, \${clinic?.country || "Mali"}<br/>
                  Tél: \${clinic?.phone || "+223 20 22 14 67"} | Email: \${clinic?.email || "contact@medishahel.com"}
                </div>
              </div>
              <div>
                <div class="seal-right">
                  LABORATOIRE DE BIOLOGIE CLINIQUE<br/>
                  <span style="font-weight: 500; font-size: 8px; color: #475569;">SÉCURITÉ AES-256</span><br/>
                  RAPPORT OFFICIEL DE SYNTHÈSE
                </div>
              </div>
            </div>

            <div class="title-doc">Compte-rendu d'Examen de Biologie Médicale</div>

            <div class="grid-identity">
              <div class="id-item">
                <span class="id-label">Patient d'analyse</span>
                <span class="id-val">${patient.lastName.toUpperCase()} ${patient.firstName}</span>
              </div>
              <div class="id-item">
                <span class="id-label">Identifiant Unique DME</span>
                <span class="id-val" style="font-family: monospace; color: #0d9488;">${patient.id}</span>
              </div>
              <div class="id-item">
                <span class="id-label">Sexe biologique / DDN</span>
                <span class="id-val">${patient.gender === "M" ? "Masculin (M)" : "Féminin (F)"} | ${patient.dateOfBirth}</span>
              </div>
              <div class="id-item">
                <span class="id-label">Nationalité / Ethnie</span>
                <span class="id-val">${patient.nationalite || "Non renseignée"} / ${patient.ethnie || "Non renseignée"}</span>
              </div>
            </div>

            <div style="margin-bottom: 8px; font-size: 11.5px; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
              <div><strong>EXAMEN DEMANDÉ :</strong> ${test.testName}</div>
              <div><strong>Nº BIO-TUBE :</strong> <span style="font-family: monospace;">TUBE-${test.id.slice(0, 8).toUpperCase()}</span></div>
            </div>
            <div style="font-size: 11px; color: #475569; display: flex; justify-content: space-between; padding-top: 4px; margin-bottom: 25px;">
              <div>Prescrit le : ${new Date(test.date).toLocaleDateString("fr-FR")} par Dr. ${test.requestedBy}</div>
              <div style="text-align: right;">Règlement caisse: Reçu validé / ${details.paymentMethod || "CASH"}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 30%;">Désignation Paramètre</th>
                  <th style="width: 15%;">Résultat</th>
                  <th style="width: 15%;">Unité</th>
                  <th style="width: 20%;">Valeurs de Référence</th>
                  <th style="width: 20%;">Interprétation</th>
                </tr>
              </thead>
              <tbody>
                \${formattedParams || '<tr><td colSpan="5" style="text-align: center; color: #64748b; padding: 20px;">Pas de constantes mesurées</td></tr>'}
              </tbody>
            </table>

            \${details.interpretation ? \`
              <div class="section-details">
                <h4 class="section-title">Synthèse Clinique & Conclusion</h4>
                <div class="section-val">\${details.interpretation}</div>
              </div>
            \` : ''}

            \${details.observations ? \`
              <div class="section-details">
                <h4 class="section-title">Observations Techniques de Paillasse</h4>
                <div class="section-val" style="font-style: italic; color: #475569;">\${details.observations}</div>
              </div>
            \` : ''}

            <div class="signature-holder">
              <div>
                <strong>Opérateur Technique :</strong><br/>
                ${userRole === "LAB_TECH" ? "Laborantin de service" : "Professeur Biologiste d'astreinte"}
              </div>
              <div style="text-align: right;">
                <strong>Certification Biologique :</strong><br/>
                Dr. \${details.validatorName || "Biologiste Clinicien"}<br/>
                <span style="font-family: monospace; font-size: 9px; color: #0d9488;">[Scellé SSL Électronique Apposé]</span>
              </div>
            </div>

            <div class="footer">
              Ce compte-rendu imprimé est certifié conforme par le Service de Biologie Médicale de MédiSahel.<br/>
              Toute modification après validation génère d'office une version d'amendement auditée.
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const fetchAllRevisionsCount = async (recordsList: any[]) => {
    const counts: Record<string, number> = {};
    for (const r of recordsList) {
      try {
        const res = await fetch(`/api/clinical-versions/${r.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const list = await res.json();
          counts[r.id] = list.length;
        }
      } catch (err) {
        console.warn("Failed count fetch:", err);
      }
    }
    setRevisionsCount(counts);
  };

  const fetchSelectedRecordHistory = async (record: any) => {
    setLoadingHistory(true);
    setSelectedRecordForHistory(record);
    try {
      const res = await fetch(`/api/clinical-versions/${record.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setRecordHistoryList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleInitCorrection = (record: any) => {
    setSelectedRecordForCorrection(record);
    setCorrectionForm({
      diagnosis: record.diagnosis || "",
      symptoms: record.symptoms || "",
      prescription: record.prescription || "",
      notes: record.notes || "",
      reason: ""
    });
  };

  const submitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.reason.trim()) {
      alert("Le motif de correction est obligatoire pour assurer l'historique médico-légal.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/patients/${patient.id}/records/${selectedRecordForCorrection.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(correctionForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de correction de la consultation");
      setSuccess("Consultation mise à jour avec succès (historique médico-légal tracé) !");
      setSelectedRecordForCorrection(null);
      fetchRecords();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patients/${patient.id}/records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger le dossier");
      setRecords(data);
      fetchAllRevisionsCount(data);

      const dmeRes = await fetch(`/api/patients/${patient.id}/full-dme`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (dmeRes.ok) {
        const dmeData = await dmeRes.json();
        setReceiptDispatches(dmeData.receiptDispatches || []);
      }

      // Automatically fetch patient's laboratory tests
      const labResponse = await fetch("/api/labtests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (labResponse.ok) {
        const labData = await labResponse.json();
        setLabTests(labData.filter((t: any) => t.patientId === patient.id));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDmgStaff = async () => {
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((u: any) => ["NURSE", "STAGIAIRE", "AIDE_SOIGNANT"].includes(u.role));
        setDmgStaff(filtered);
        if (filtered.length > 0 && !careForm.agentId) {
          setCareForm(prev => ({ ...prev, agentId: filtered[0].id }));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch staff:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchDmgStaff();
  }, [token, patient.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.symptoms || !formData.diagnosis || !formData.prescription) {
      setError("Les symptômes, le diagnostic et l'ordonnance de prescription sont obligatoires.");
      return;
    }

    try {
      const response = await fetch(`/api/patients/${patient.id}/records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d'insérer l'ordonnance");

      setSuccess("Consultation sauvegarder avec succès dans le DME !");
      
      // Prescribe selected lab tests automatically
      if (selectedLabTests.length > 0) {
        await Promise.all(selectedLabTests.map(testName => 
          fetch("/api/labtests", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              patientId: patient.id,
              testName: testName,
              urgent: false,
              notes: `Prescrit lors de la consultation clinique du ${new Date().toLocaleDateString("fr-FR")}`
            })
          })
        ));
        setSelectedLabTests([]);
      }

      // Prescribe delegated nursing care automatically (Module DMG)
      if (prescribeDelegatedCare) {
        let assignedAgentName = "";
        const matchedAgent = dmgStaff.find(s => s.id === careForm.agentId);
        if (matchedAgent) {
          assignedAgentName = matchedAgent.name;
        }

        let roomVal = "N/A";
        let bedVal = "N/A";
        try {
          const hospRes = await fetch("/api/hospitalizations", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (hospRes.ok) {
            const hospData = await hospRes.json();
            const activeHosp = hospData.find((h: any) => h.patientId === patient.id && h.status === "ADMITTED");
            if (activeHosp) {
              roomVal = activeHosp.roomNumber || "CH-101";
              bedVal = activeHosp.bedNumber || "LIT-A";
            }
          }
        } catch (e) {
          console.warn("Could not load hospitalizations room status:", e);
        }

        const compositeObs = `Soin prescrit: ${careForm.careType} | Produit: ${careForm.productUsed || "Aucun"} | Dose: ${careForm.quantityUsed || "1"} | Heure: ${careForm.scheduledTime}. ${careForm.observations ? "Notes: " + careForm.observations : ""}`;

        await fetch("/api/dmg/cares", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            patientId: patient.id,
            patientName: `${patient.lastName.toUpperCase()} ${patient.firstName}`,
            roomNumber: roomVal,
            bedNumber: bedVal,
            careType: careForm.careType,
            description: careForm.observations || `Prescription de soin délégué: ${careForm.careType}`,
            priority: "MEDIUM",
            scheduledTime: careForm.scheduledTime || new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            date: new Date().toISOString().split("T")[0],
            observations: compositeObs,
            status: careForm.agentId ? "ASSIGNED" : "PENDING",
            agentId: careForm.agentId || null,
            agentName: careForm.agentId ? assignedAgentName : null
          })
        });

        setPrescribeDelegatedCare(false);
        setCareForm({
          careType: "Surveillance Constantes (TA, T°, Pouls)",
          productUsed: "",
          quantityUsed: "1 ampoule",
          scheduledTime: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          observations: "",
          agentId: dmgStaff[0]?.id || "",
        });
      }

      setFormData({ symptoms: "", diagnosis: "", prescription: "", notes: "" });
      setShowAddForm(false);
      fetchRecords();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getAge = (dob: string) => {
    try {
      const birthDate = new Date(dob);
      const diff = Date.now() - birthDate.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return "N/A";
    }
  };

  if (userRole === "STAGIAIRE" || userRole === "AIDE_SOIGNANT") {
    return (
      <div className="space-y-6" id="dme-locked">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 border border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-slate-50 transition-colors shadow-sm focus:outline-none cursor-pointer"
            id="dme-back-btn"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-gray-400">Retour</span>
            <h2 className="font-sans font-bold text-xl text-gray-900 leading-none mt-0.5 animate-fade-in">Dossier Médical Sécurisé</h2>
          </div>
        </div>

        <div className="bg-white border-2 border-red-200 rounded-2xl p-8 flex flex-col items-center text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="p-4 bg-red-50 text-red-700 rounded-full">
            <ShieldAlert className="h-10 w-10 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Accès Refusé (Secret Médical)</h3>
          <p className="text-xs text-gray-500 leading-relaxed font-semibold">
            Votre profil actuel (<strong>{userRole === "STAGIAIRE" ? "Stagiaire" : "Aide-Soignant"}</strong>) ne dispose pas des privilèges déontologiques nécessaires pour accéder aux diagnostics cliniques, antécédents, ordonnances et prescriptions médicales de ce dossier.
          </p>
          <p className="text-[11px] text-slate-450 italic">
            Conformément aux directives de {clinic?.name || "MédiSahel Clinique"}, l'accès à ces informations est strictement réservé aux Médecins, Médecins Chefs, Pharmaciens et Infirmiers superviseurs.
          </p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold leading-none cursor-pointer"
          >
            Retourner à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="dme-patient-dashboard">
      {/* Return Navigation bar */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="p-2 border border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-slate-50 transition-colors shadow-sm focus:outline-none cursor-pointer"
          id="dme-back-btn"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-gray-500">Retour au registre civil</span>
          <h2 className="font-sans font-bold text-xl text-gray-900 leading-none mt-0.5">
            Dossier Médical Électronique (DME)
          </h2>
        </div>
      </div>

      {/* Patient Signaletic ID Card Banner */}
      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6 grid grid-cols-1 md:grid-cols-4 gap-6" id="patient-identity-banner">
        <div>
          <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">PATIENT</span>
          <h3 className="text-lg font-bold text-gray-900 mt-1 uppercase">
            {patient.lastName} {patient.firstName}
          </h3>
          <p className="text-sm font-sans text-gray-500 mt-0.5">
            NID: <span className="font-mono text-xs font-semibold">{patient.nationalId}</span>
          </p>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-gray-100 md:pl-6">
          <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Informations Générales</span>
          <dl className="mt-2 space-y-1 text-sm font-sans text-gray-700">
            <div className="flex justify-between md:justify-start md:space-x-4">
              <dt className="text-gray-400">Âge :</dt>
              <dd className="font-semibold">{getAge(patient.dateOfBirth)} ans ({patient.dateOfBirth})</dd>
            </div>
            <div className="flex justify-between md:justify-start md:space-x-4">
              <dt className="text-gray-400">Sexe :</dt>
              <dd className="font-semibold">{patient.gender === "M" ? "Masculin (M)" : "Féminin (F)"}</dd>
            </div>
            <div className="flex justify-between md:justify-start md:space-x-4">
              <dt className="text-gray-400">Nationalité :</dt>
              <dd className="font-semibold">{patient.nationalite || "Non renseignée"}</dd>
            </div>
            <div className="flex justify-between md:justify-start md:space-x-4">
              <dt className="text-gray-400">Ethnie :</dt>
              <dd className="font-semibold">{patient.ethnie || "Non renseignée"}</dd>
            </div>
          </dl>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-gray-100 md:pl-6">
          <span className="font-mono text-[10px] text-teal-600 uppercase tracking-widest font-bold">Groupe Sanguin</span>
          <div className="mt-2 text-2xl font-black text-rose-600">
            {patient.bloodType || "Non spécifié"}
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-red-100 bg-red-50/20 rounded-xl md:pl-6 p-3">
          <span className="font-mono text-[10px] text-red-600 uppercase tracking-widest font-bold flex items-center">
            <HeartCrack className="h-3.5 w-3.5 mr-1" />
            Allergies connues
          </span>
          <p className="text-sm font-semibold text-red-700 mt-1.5 leading-snug">
            {patient.allergies || "Aucune allergie connue à ce jour."}
          </p>
        </div>
      </div>

      {/* DME Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-transparent border-t border-b border-gray-100 py-3 gap-2">
        <h4 className="font-sans font-semibold text-gray-900 text-sm uppercase tracking-wider">
          Historique Clinique & Consultations ({records.length})
        </h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrintConsolidatedDme}
            disabled={printingConsolidated}
            className="inline-flex items-center px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-gray-700 rounded-xl transition cursor-pointer select-none shadow-xs disabled:opacity-50"
          >
            {printingConsolidated ? (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Printer className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
            )}
            Dossier Complet DME (PDF/Imprimer)
          </button>
          {(userRole === "DOCTOR" || userRole === "ADMIN" || userRole === "MEDECIN_GENERAL_CHIEF") && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm duration-150 cursor-pointer"
              id="write-consultation-btn"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvelle Consultation
            </button>
          )}
        </div>
      </div>

      {/* Add New Consultation DME Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-teal-600 rounded-2xl shadow-md p-6 space-y-4" id="dme-add-record-form">
          <h3 className="text-base font-bold text-teal-800 flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Saisie d'un Rapport d'Examen Médical & Ordonnance (Avec Copilote Intelligent)
          </h3>

          {/* Two Column Layout: Left Form, Right Smart Copilote (Requirement 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Symptômes décrits & Motif de consultation <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={formData.symptoms}
                    onChange={e => handleTextareaChange("symptoms", e.target.value)}
                    rows={3}
                    placeholder="Fièvre intense, toux chronique, céphalées (Tapez @ pour l'autocomplétion)..."
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-sans font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Diagnostic clinique établi <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={formData.diagnosis}
                    onChange={e => handleTextareaChange("diagnosis", e.target.value)}
                    rows={3}
                    placeholder="Suspicion de paludisme grave, bronchite... (Tapez @ pour les aides...)"
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-sans font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Prescription Thérapeutique & Ordonnance Posologique <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={formData.prescription}
                  onChange={e => handleTextareaChange("prescription", e.target.value)}
                  rows={4}
                  placeholder="Ordonnance détaillée. Ex: Paracétamol, Amoxicilline (Typez @para ou @amox pour insérer automatiquement)..."
                  className="w-full px-3 py-2 border border-teal-200 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-sans font-medium bg-teal-50/10"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 font-semibold">Conseils cliniques additionnels & Notes d'Analyses</label>
                <textarea
                  value={formData.notes}
                  onChange={e => handleTextareaChange("notes", e.target.value)}
                  rows={2}
                  placeholder="Conseils hygiéno-diététiques, examens biologiques de contrôle... (Typez @perf ou @surv)"
                  className="w-full px-3 py-2 border border-gray-350 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-sans"
                />
              </div>

              {(userRole === "DOCTOR" || userRole === "ADMIN" || userRole === "MEDECIN_GENERAL_CHIEF") && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <label className="block text-xs font-bold text-teal-800 uppercase tracking-widest">
                    Prescriptions d'Examens Biologiques (Laboratoire Clinique)
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Sélectionnez les analyses biologiques requises. Elles alimenteront le DME du patient et commanderont le bulletin d'examen.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { code: "NFS", name: "Numération Formule Sanguine (NFS / Hémogramme)" },
                      { code: "GS", name: "Groupe Sanguin & Facteur Rhésus" },
                      { code: "GLY", name: "Glycémie à jeun" },
                      { code: "CREA", name: "Créatininémie" },
                      { code: "UREE", name: "Urée sanguine" },
                      { code: "GE", name: "Goutte Épaisse (GE) & TDR Paludisme" },
                      { code: "ECBU", name: "Examen Cytobactériologique des Urines (ECBU)" }
                    ].map((test) => {
                      const isSelected = selectedLabTests.includes(test.name);
                      return (
                        <button
                          type="button"
                          key={test.code}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLabTests(selectedLabTests.filter(t => t !== test.name));
                            } else {
                              setSelectedLabTests([...selectedLabTests, test.name]);
                            }
                          }}
                          className={`px-3 py-2 text-xs text-left rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-teal-50 border-teal-300 ring-2 ring-teal-700/15 text-teal-900"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="font-bold font-mono text-[9px] uppercase tracking-wider text-teal-700">{test.code}</div>
                          <div className="truncate text-[10.5px] mt-0.5" title={test.name}>{test.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NEW: Soins Délégués DMG Direct Prescription (Requirement 1 & 4) */}
              {(userRole === "DOCTOR" || userRole === "ADMIN" || userRole === "MEDECIN_GENERAL_CHIEF") && (
                <div className="p-4 bg-amber-50/40 border border-amber-250 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 text-xs font-bold text-amber-900 uppercase tracking-widest cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prescribeDelegatedCare}
                        onChange={e => setPrescribeDelegatedCare(e.target.checked)}
                        className="h-4 w-4 text-amber-700 border-gray-350 rounded focus:ring-amber-500 cursor-pointer"
                      />
                      <span>Prescrire également un acte de soin délégué (Département DMG)</span>
                    </label>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wide">Module DMG</span>
                  </div>
                  
                  <p className="text-[11px] text-amber-805">
                    Cochez cette case pour commander instantanément une tâche de garde clinique. Elle sera automatiquement transmise à l'interface de l'infirmier, l'aide-soignant ou le stagiaire sélectionné ci-dessous.
                  </p>

                  {prescribeDelegatedCare && (
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/70 p-3.5 rounded-xl border border-amber-200/60 shadow-2xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">Type de soin délégué requis</label>
                        <select
                          value={careForm.careType}
                          onChange={e => setCareForm({ ...careForm, careType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white focus:outline-none font-medium"
                        >
                          <option value="Surveillance Constantes (TA, T°, Pouls)">Surveillance Constantes (TA, T°, Pouls)</option>
                          <option value="Pansement & Réfection de plaie stérile">Pansement & Réfection de plaie stérile</option>
                          <option value="Perfusion Intraveineuse lente G5% 500ml">Perfusion Intraveineuse lente G5% 500ml</option>
                          <option value="Injection IM ou Sous-cutanée">Injection IM ou Sous-cutanée</option>
                          <option value="Administration de Médicaments prescrits">Administration de Médicaments prescrits</option>
                          <option value="Glycémie capillaire horaire">Glycémie capillaire horaire</option>
                          <option value="Prélèvement Biologique / Sanguin">Prélèvement Biologique / Sanguin</option>
                          <option value="Pose de Sonde d'Aspiration/Urinaire">Pose de Sonde d'Aspiration/Urinaire</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">Collaborateur soignant assigné</label>
                        <select
                          value={careForm.agentId}
                          onChange={e => setCareForm({ ...careForm, agentId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-350 rounded-xl bg-white focus:outline-none font-medium"
                        >
                          <option value="">-- Placer en file générale DMG --</option>
                          {dmgStaff.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.role === 'NURSE' ? 'Infirmier' : s.role === 'STAGIAIRE' ? 'Stagiaire de garde' : 'Aide-Soignant'})</option>
                          ))}
                         </select>
                       </div>

                       <div>
                         <label className="block text-[11px] font-semibold text-gray-700 mb-1">Produit clinique requis (Stock)</label>
                         <input
                           type="text"
                           value={careForm.productUsed}
                           onChange={e => setCareForm({ ...careForm, productUsed: e.target.value })}
                           placeholder="Ex: Sérum Physiologique, Lovenox, Bétadine..."
                           className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                         />
                       </div>

                       <div className="grid grid-cols-2 gap-2">
                         <div>
                           <label className="block text-[11px] font-semibold text-gray-700 mb-1">Dose / Quantité</label>
                           <input
                             type="text"
                             value={careForm.quantityUsed}
                             onChange={e => setCareForm({ ...careForm, quantityUsed: e.target.value })}
                             placeholder="Ex: 1 unité, 500ml..."
                             className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                           />
                         </div>
                         <div>
                           <label className="block text-[11px] font-semibold text-gray-700 mb-1">Heure de début</label>
                           <input
                             type="time"
                             value={careForm.scheduledTime}
                             onChange={e => setCareForm({ ...careForm, scheduledTime: e.target.value })}
                             className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none font-mono"
                           />
                         </div>
                       </div>

                       <div className="sm:col-span-2">
                         <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Instructions cliniques précises pour l'exécution</label>
                         <textarea
                           value={careForm.observations}
                           onChange={e => setCareForm({ ...careForm, observations: e.target.value })}
                           rows={1.5}
                           placeholder="Faire un premier relevé de constantes physiologiques à la pose. Surveiller le débit de la perfusion..."
                           className="w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:outline-none"
                         />
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </div>

             {/* Right Column: Smart Cheat Sheets & Direct insertion triggers (Requirement 2) */}
             <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4 shadow-2xs h-fit">
               <div className="border-b border-gray-200 pb-2.5">
                 <h4 className="font-sans font-bold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                   <PenTool className="h-4 w-4 text-teal-600" />
                   Copilote Médical Intelligent
                 </h4>
                 <p className="text-[10.5px] text-gray-500 mt-0.5">
                   En cours de saisie, vous pouvez taper le raccourci clavier dans les zones de texte pour insérer la posologie ou cliquer pour l'ajouter directement.
                 </p>
               </div>

               <div className="space-y-4">
                 <div>
                   <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2">💊 Médicaments & Ordonnances</h5>
                   <div className="space-y-1.5">
                     {clinicalAutocompleteItems.filter(item => ["@para", "@amox", "@artem", "@spas", "@dolo"].includes(item.trigger)).map(item => (
                       <button
                         type="button"
                         key={item.trigger}
                         onClick={() => {
                           // Insert at the end of prescription field
                           const currentVal = formData.prescription ? formData.prescription + "\n" : "";
                           setFormData({ ...formData, prescription: currentVal + item.text });
                         }}
                         className="w-full text-left p-2.5 bg-white hover:bg-teal-50 border border-gray-150 rounded-xl transition flex items-start gap-1 cursor-pointer shadow-3xs"
                       >
                         <div className="text-left shrink-0">
                           <span className="font-mono text-[10px] font-black block text-teal-800 bg-teal-50 px-1 rounded border border-teal-150">{item.trigger}</span>
                         </div>
                         <div className="text-[11px] truncate ml-1.5">
                           <strong className="block text-gray-900 truncate font-semibold">{item.label}</strong>
                           <span className="text-[10px] text-gray-400 truncate block mt-0.5">{item.text}</span>
                         </div>
                       </button>
                     ))}
                   </div>
                 </div>

                 <div>
                   <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2">🩹 Actes cliniques DMG & Biologie</h5>
                   <div className="space-y-1.5">
                     {clinicalAutocompleteItems.filter(item => ["@nfs", "@gly", "@perf", "@pans", "@surv"].includes(item.trigger)).map(item => (
                       <button
                         type="button"
                         key={item.trigger}
                         onClick={() => {
                           const currentVal = formData.notes ? formData.notes + "\n" : "";
                           setFormData({ ...formData, notes: currentVal + item.text });
                         }}
                         className="w-full text-left p-2 bg-white hover:bg-indigo-50 border border-gray-150 rounded-xl transition flex items-start gap-1 cursor-pointer shadow-3xs"
                       >
                         <div className="text-left shrink-0">
                           <span className="font-mono text-[10px] font-black block text-indigo-800 bg-indigo-50 px-1 rounded border border-indigo-150">{item.trigger}</span>
                         </div>
                         <div className="text-[11px] truncate ml-1.5">
                           <strong className="block text-gray-900 truncate font-semibold">{item.label}</strong>
                           <span className="text-[10px] text-gray-400 truncate block mt-0.5">{item.text}</span>
                         </div>
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="pt-2 border-t border-slate-200">
                   <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2">👤 Infos administratives patient</h5>
                   <button
                     type="button"
                     onClick={() => {
                       const selected = clinicalAutocompleteItems.find(item => item.trigger === "@patient");
                       if (selected) {
                         const currentVal = formData.symptoms ? formData.symptoms + "\n" : "";
                         setFormData({ ...formData, symptoms: currentVal + selected.text });
                       }
                     }}
                     className="w-full text-left p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs transition font-semibold text-slate-800 flex items-center justify-between shadow-3xs cursor-pointer border border-slate-250"
                   >
                     <span>Injecter fiche @patient</span>
                     <span className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border">@patient</span>
                   </button>
                 </div>
               </div>
             </div>
           </div>

           <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
             <button
               type="button"
               onClick={() => setShowAddForm(false)}
               className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 cursor-pointer"
             >
               Annuler
             </button>

             <button
               type="submit"
               className="px-5 py-2 text-white bg-teal-700 hover:bg-teal-800 text-sm font-semibold rounded-xl shadow-sm cursor-pointer border border-teal-800"
             >
               Ajouter au Dossier (Signer la consultation)
             </button>
           </div>
         </form>
       )}

      {/* Feedback alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center">
          <ShieldAlert className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center">
          <Check className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {/* Consultation Timeline List */}
      {loading ? (
        <div className="text-center py-10 font-mono text-sm text-gray-400">Loading prescription logs...</div>
      ) : records.length === 0 ? (
        <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-8 text-center" id="dme-empty-state">
          <Clipboard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h5 className="font-sans font-semibold text-gray-900 text-base">Historique médical vierge</h5>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            Aucune consultation ou ordonnance n'a encore été versée au Dossier Médical Électronique de ce patient.
          </p>
        </div>
      ) : (
        <div className="space-y-6" id="dme-records-timeline">
          {records.map((record, index) => (
            <div
              key={record.id}
              className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6 relative overflow-hidden group"
            >
              {/* Header card indicator with date and doctor */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                    <PenTool className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="font-sans font-semibold text-gray-900 text-sm">Consultation Clinique</h5>
                    <p className="text-xs text-gray-400 mt-0.5">Rédigé par: <span className="font-medium text-gray-600">{record.doctorName}</span></p>
                  </div>
                </div>
                <div className="font-mono text-xs text-gray-500 bg-slate-100 px-3 py-1 rounded-full self-start md:self-center">
                  {new Date(record.date).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>
              </div>

              {/* Consultation Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h6 className="font-semibold text-gray-800 uppercase tracking-widest text-[10px] mb-1">Motif & Symptômes décrits</h6>
                  <p className="text-gray-700 font-sans leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-gray-100 font-medium">{record.symptoms}</p>
                </div>
                <div>
                  <h6 className="font-semibold text-gray-800 uppercase tracking-widest text-[10px] mb-1">Diagnostic du médecin</h6>
                  <p className="text-gray-700 font-sans leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-gray-100 font-semibold text-teal-900">{record.diagnosis}</p>
                </div>
              </div>

              {/* Prescription block */}
              <div className="mt-6 border-t border-dashed border-gray-150 pt-5">
                <h6 className="font-semibold text-gray-800 uppercase tracking-widest text-[10px] mb-2 flex items-center">
                  <FileText className="h-4 w-4 text-emerald-600 mr-1.5" />
                  Prescriptions ordonnées
                </h6>
                <div className="space-y-2">
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-gray-800 font-sans leading-relaxed whitespace-pre-line font-medium text-sm">
                    {record.prescription}
                  </div>
                </div>
              </div>

              {/* Special doctor recommendation notes */}
              {record.notes && (
                <div className="mt-4 bg-amber-50/40 border border-amber-100 p-3.5 rounded-xl text-amber-900 text-xs">
                  <span className="font-mono font-semibold uppercase tracking-wider text-[9px] text-amber-700 block mb-0.5">Recommandations cliniques:</span>
                  <p className="leading-snug">{record.notes}</p>
                </div>
              )}

              {/* Medico-legal tracking & correction controls */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fetchSelectedRecordHistory(record)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition cursor-pointer select-none"
                >
                  <History className="h-3.5 w-3.5 text-slate-400" />
                  Historique Clinique <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-700 text-[10px] ml-1">{revisionsCount[record.id] || 0}</span>
                </button>

                {["DOCTOR", "ADMIN", "MEDECIN_GENERAL_CHIEF"].includes(userRole) && (
                  <button
                    type="button"
                    onClick={() => handleInitCorrection(record)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition cursor-pointer select-none"
                  >
                    <PenTool className="h-3.5 w-3.5 mr-1" />
                    Corriger la consultation
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historique des Examens de Laboratoire du Patient */}
      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6 mt-6" id="dme-lab-tests-history-card">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
          <div>
            <h4 className="font-sans font-bold text-gray-900 text-sm">Examens de Biologie Clinique & Laboratoire ({labTests.length})</h4>
            <p className="text-xs text-gray-450 mt-0.5">Suivi en temps réel des analyses paracliniques prescrites, de leur règlement en caisse, et du statut des prélèvements biologiques.</p>
          </div>
          <span className="text-[10px] bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wide">Dossier Biologique</span>
        </div>

        {labTests.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-4">Aucun examen de laboratoire prescrit ou enregistré pour ce patient.</p>
        ) : (
          <div className="divide-y divide-gray-150/70 space-y-4">
            {labTests.map((test: any) => {
              let details: any = {};
              try {
                details = test.results ? JSON.parse(test.results) : {};
              } catch (e) {
                details = { raw: test.results };
              }

              return (
                <div key={test.id} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold font-sans text-teal-950">{test.testName}</span>
                        {details.urgent && (
                          <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100 font-bold animate-pulse">URGENT</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Prescrit par <span className="font-semibold text-gray-600">Dr. {test.requestedBy}</span> le {new Date(test.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-center">
                      {test.status === "VALIDATED" && (
                        <button
                          type="button"
                          onClick={() => handlePrintIndividualLabTest(test)}
                          className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg shrink-0 cursor-pointer transition mr-1 shadow-2xs"
                        >
                          <Printer className="h-3 w-3 mr-1 text-teal-700" /> Imprimer Bulletin
                        </button>
                      )}
                      {test.status === "PENDING_PAYMENT" && (
                        <span className="inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase font-semibold">En attente de paiement (Caisse)</span>
                      )}
                      {test.status === "PAID" && (
                        <span className="inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase font-semibold">Réglé (En attente d'analyse)</span>
                      )}
                      {test.status === "PROCESSING" && (
                        <span className="inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase font-semibold">Prélèvement effectué / Centrifugation</span>
                      )}
                      {test.status === "VALIDATED" && (
                        <span className="inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase font-semibold">Analyse validée cliniquement</span>
                      )}
                      {test.status === "CANCELLED" && (
                        <span className="inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 uppercase font-semibold">Annulé</span>
                      )}
                    </div>
                  </div>

                  {test.status === "VALIDATED" ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-3">
                      {details.parameters && details.parameters.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px]">
                            <thead>
                              <tr className="border-b border-gray-200 text-gray-400 font-mono tracking-wider uppercase">
                                <th className="pb-1.5 font-normal">Paramètre mesuré</th>
                                <th className="pb-1.5 font-normal">Valeur</th>
                                <th className="pb-1.5 font-normal">Unité</th>
                                <th className="pb-1.5 font-normal">Normes de ref</th>
                                <th className="pb-1.5 font-normal">Interprétation</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {details.parameters.map((p: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-100/50">
                                  <td className="py-1.5 font-medium text-gray-800">{p.name}</td>
                                  <td className={`py-1.5 font-bold font-mono ${p.interpretation && p.interpretation !== "Normal" ? "text-rose-600" : "text-gray-950"}`}>{p.value || "N/A"}</td>
                                  <td className="py-1.5 text-gray-400 font-mono">{p.unit}</td>
                                  <td className="py-1.5 text-gray-400 font-mono">{p.reference || "N/A"}</td>
                                  <td className="py-1.5">
                                    {p.interpretation === "Normal" ? (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">Normal</span>
                                    ) : p.interpretation ? (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-100">{p.interpretation}</span>
                                    ) : (
                                      <span className="text-gray-450 font-mono">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {details.interpretation && (
                        <div className="text-xs pt-1.5 border-t border-gray-200/50 mt-1">
                          <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-teal-800">Interprétation biologique:</span>
                          <p className="text-gray-700 leading-relaxed mt-0.5 font-medium">{details.interpretation}</p>
                        </div>
                      )}

                      {details.observations && (
                        <div className="text-xs">
                          <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-teal-800">Observations / Technique:</span>
                          <p className="text-gray-600 leading-relaxed mt-0.5 italic">{details.observations}</p>
                        </div>
                      )}

                      <div className="text-[10px] font-mono text-gray-400 border-t border-gray-200/50 pt-2 flex flex-wrap justify-between gap-1">
                        <div>Saisie Automate : <span className="font-semibold text-gray-600">{details.machineUsed || "Microscope / Manuel"}</span></div>
                        <div>Validateur Biol : <span className="font-semibold text-teal-800">{details.validatorName}</span> (Scellé électronique actif)</div>
                      </div>

                      {/* Raw Machine file attachment display */}
                      {details.machineAttachedFile && (
                        <div className="mt-3 flex items-center justify-between p-2.5 bg-indigo-50/50 border border-indigo-150 rounded-xl text-xs">
                          <div className="flex items-center space-x-2 truncate">
                            <FileSpreadsheet className="h-4 w-4 text-indigo-600 shrink-0" />
                            <div className="truncate text-[11px]">
                              <div className="font-black text-indigo-950 truncate">{details.machineAttachedFile.fileName}</div>
                              <div className="text-[9px] text-gray-450 uppercase font-mono">{details.machineAttachedFile.fileType} | {details.machineAttachedFile.fileSize}</div>
                            </div>
                          </div>
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider flex items-center shrink-0 border border-indigo-200">
                            📂 Fichier Machine Brut
                          </span>
                        </div>
                      )}

                      {/* Corrected version listings for Doctors DME view */}
                      {details.versions && details.versions.length > 0 && (
                        <div className="mt-3.5 bg-amber-50/45 border border-amber-200 p-3.5 rounded-xl space-y-2.5">
                          <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-amber-900 flex items-center">
                            <History className="h-3.5 w-3.5 text-amber-700 mr-1.5" />
                            Correctifs Cliniques de Saisie ({details.versions.length})
                          </span>
                          <span className="text-[10px] text-gray-450 block">Conformément aux normes d'auditabilité, les états biologiques antérieurs sont conservés ci-dessous :</span>
                          <div className="space-y-3.5 divide-y divide-amber-200/50">
                            {details.versions.map((ver: any, index: number) => {
                              let verPayload: any = {};
                              try {
                                verPayload = ver.results ? JSON.parse(ver.results) : {};
                              } catch(e) {}
                              return (
                                <div key={index} className="pt-3 first:pt-0 text-[10.5px]">
                                  <div className="flex justify-between items-center text-[9.5px] font-mono text-amber-800">
                                    <span className="font-bold">VERSION #{ver.version}</span>
                                    <span>Modifié le {new Date(ver.modifiedAt).toLocaleString("fr-FR")} par {ver.modifiedBy}</span>
                                  </div>
                                  <p className="mt-1 text-gray-600 font-medium font-sans">Raison médicale : <span className="text-gray-900 italic font-normal">"{ver.reason}"</span></p>
                                  {verPayload.parameters && (
                                    <div className="mt-1.5 text-gray-500 font-mono space-y-0.5 pl-3 border-l border-amber-200">
                                      {verPayload.parameters.map((p: any, idx: number) => (
                                        <div key={idx}>• {p.name} : {p.value} {p.unit} ({p.interpretation})</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2.5 bg-slate-50/50 border border-dashed border-gray-200 rounded-xl text-[11px] text-gray-400 italic">
                      Les résultats biologiques ne sont pas visibles tant que l'évaluation technique n'est pas finalisée par le laboratoire clinique (Statut: VALIDÉ).
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial des envois et impressions de reçus */}
      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6 mt-6" id="receipts-dispatch-history-card">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
          <div>
            <h4 className="font-sans font-bold text-gray-900 text-sm">Historial des Envois & Impressions de Reçus</h4>
            <p className="text-xs text-gray-400 mt-0.5">Registre de transmission d'actes de caisse : impressions locales, alertes SMS et notifications WhatsApp.</p>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold">{receiptDispatches.length} transmission(s)</span>
        </div>

        {receiptDispatches.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-4">Aucune transmission de reçu de caisse enregistrée pour ce patient.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-150 text-gray-400 uppercase font-mono tracking-wider">
                  <th className="pb-2.5 font-normal">Date & Heure d'envoi</th>
                  <th className="pb-2.5 font-normal">Canal Utilisé</th>
                  <th className="pb-2.5 font-normal">Contenu du Message transmis</th>
                  <th className="pb-2.5 font-normal">Utilisateur (Émetteur)</th>
                  <th className="pb-2.5 font-normal text-center">Statut de Livraison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receiptDispatches.map((disp: any) => (
                  <tr key={disp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 font-mono text-gray-600">
                      {new Date(disp.date).toLocaleString("fr-FR")}
                    </td>
                    <td className="py-2.5 font-semibold">
                      {disp.channel === "IMPRESSION" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-150 font-mono text-[10px]">
                          <Printer className="h-3 w-3 mr-1" /> Impression PDF
                        </span>
                      )}
                      {disp.channel === "SMS" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-150 font-mono text-[10px]">
                          <Smartphone className="h-3 w-3 mr-1" /> SMS Patient
                        </span>
                      )}
                      {disp.channel === "WHATSAPP" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-150 font-mono text-[10px]">
                          <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp Patient
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 font-mono">
                      <div className="max-w-xs md:max-w-md truncate text-[11px] text-gray-500" title={disp.message || "Génération du Reçu PDF"}>
                        {disp.message || "Génération du Reçu PDF"}
                      </div>
                    </td>
                    <td className="py-2.5 font-semibold text-gray-800">
                      {disp.username} <span className="text-[10px] font-mono text-gray-400">({disp.userRole})</span>
                    </td>
                    <td className="py-2.5 text-center">
                      {disp.status === "Délivré" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold uppercase text-[9px] tracking-wider">
                          ● Délivré
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-bold uppercase text-[9px] tracking-wider">
                          ● Transmis
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. Modal: Clinical Version History */}
      {selectedRecordForHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border text-left" id="medical-revisions-history-modal">
            <div className="p-5 border-b flex items-center justify-between bg-teal-800 text-white">
              <div>
                <h3 className="font-sans font-bold text-base flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Piste d’Audit Clinique &amp; Versioning Médico-Légal
                </h3>
                <p className="text-teal-100 text-[11px] mt-0.5">
                  Consultation du patient enregistrée le {new Date(selectedRecordForHistory.date).toLocaleDateString("fr-FR")} Gérée par {selectedRecordForHistory.doctorName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedRecordForHistory(null); setRecordHistoryList([]); }}
                className="text-white hover:text-teal-205 font-bold font-mono text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {loadingHistory ? (
                <div className="text-center py-10 font-mono text-gray-500">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-650" />
                  Patientement, chargement des versions sécurisées...
                </div>
              ) : recordHistoryList.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {recordHistoryList.map((rev, rIdx) => {
                    let prev: any = {};
                    let next: any = {};
                    try { prev = JSON.parse(rev.previousContent); } catch(ex) { prev = { text: rev.previousContent }; }
                    try { next = JSON.parse(rev.newContent); } catch(ex) { next = { text: rev.newContent }; }
                    
                    return (
                      <div key={rev.id} className="relative pl-8 space-y-2">
                        <div className="absolute left-1.5 top-1 h-4.5 w-4.5 rounded-full bg-teal-800 text-white flex items-center justify-center font-mono font-bold text-[9px]">
                          {recordHistoryList.length - rIdx}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-1.5">
                          <div>
                            <span className="font-bold text-gray-800 text-xs">Modifié par : {rev.authorName}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded ml-2 font-mono uppercase font-bold">{rev.authorRole}</span>
                          </div>
                          <span className="text-gray-400 font-mono text-[10px]">
                            {new Date(rev.createdAt).toLocaleString("fr-FR")}
                          </span>
                        </div>
                        <div className="bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-100 font-medium">
                          <span className="font-mono text-[10px] text-amber-700 font-bold block uppercase tracking-wide">Motif obligatoire de la modification :</span>
                          <p className="mt-0.5">{rev.reason}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-1 pt-1">
                          <div className="bg-slate-50 p-2 rounded border border-gray-100 text-gray-500 space-y-1">
                            <span className="font-mono text-[9px] font-bold block mb-1 text-slate-400 uppercase">État Précédent</span>
                            {prev.diagnosis && <div><strong>Diag:</strong> {prev.diagnosis}</div>}
                            {prev.symptoms && <div><strong>Symptômes:</strong> {prev.symptoms}</div>}
                            {prev.prescription && <div className="mt-1"><strong>Ord:</strong> {prev.prescription}</div>}
                            {prev.notes && <div className="mt-1"><strong>Notes:</strong> {prev.notes}</div>}
                          </div>
                          <div className="bg-teal-50/50 p-2 rounded border border-teal-100 text-slate-800 space-y-1">
                            <span className="font-mono text-[9px] font-bold block mb-1 text-teal-600 uppercase">État Modifié</span>
                            {next.diagnosis && <div><strong>Diag:</strong> {next.diagnosis}</div>}
                            {next.symptoms && <div><strong>Symptômes:</strong> {next.symptoms}</div>}
                            {next.prescription && <div className="mt-1"><strong>Ord:</strong> {next.prescription}</div>}
                            {next.notes && <div className="mt-1"><strong>Notes:</strong> {next.notes}</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 font-mono text-gray-400">
                  Cette fiche d'origine est intacte. Aucune modification médico-légale ultérieure n'a été répertoriée dans le registre.
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => { setSelectedRecordForHistory(null); setRecordHistoryList([]); }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Fermer le Registre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Clinico-Medical Correction */}
      {selectedRecordForCorrection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left">
          <form
            onSubmit={submitCorrection}
            className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border"
            id="clinical-correction-form-modal"
          >
            <div className="p-5 border-b flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="font-sans font-bold text-base flex items-center gap-1.5">
                  <PenTool className="h-5 w-5 text-teal-400" />
                  Correction de Diagnostic / Prescription
                </h3>
                <p className="text-gray-400 text-[11px] mt-0.5 mt-0.5">
                  Les corrections engendrent un audit systématique non-réversible.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordForCorrection(null)}
                className="text-white hover:text-gray-300 font-bold font-mono text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs font-semibold">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px] font-medium leading-normal flex gap-2">
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" />
                <p>
                  <strong>Rappel Déontologique :</strong> Conformément aux règles de traçabilité, les données médicales antérieures ne sont pas supprimées de la base mais versées dans le journal d'audit versions cliniques. Un motif explicite est requis pour valider cette rectification.
                </p>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-mono tracking-wider mb-1">Motif Clinique Obligatoire du Changement <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Erreur de saisie posologique, correction après examen complémentaire..."
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-medium text-xs focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-mono tracking-wider mb-1">Motif de Consultation / Symptômes décrits</label>
                <textarea
                  value={correctionForm.symptoms}
                  onChange={(e) => {
                    let val = e.target.value;
                    clinicalAutocompleteItems.forEach(item => {
                      if (val.includes(item.trigger)) { val = val.replace(item.trigger, item.text); }
                    });
                    setCorrectionForm({ ...correctionForm, symptoms: val });
                  }}
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-medium text-xs focus:ring-1 focus:ring-teal-750"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-mono tracking-wider mb-1">Diagnostic Clinique Final</label>
                <textarea
                  value={correctionForm.diagnosis}
                  onChange={(e) => {
                    let val = e.target.value;
                    clinicalAutocompleteItems.forEach(item => {
                      if (val.includes(item.trigger)) { val = val.replace(item.trigger, item.text); }
                    });
                    setCorrectionForm({ ...correctionForm, diagnosis: val });
                  }}
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-medium text-xs focus:ring-1 focus:ring-teal-750 font-bold text-teal-900"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-mono tracking-wider mb-1">Prescriptions et Traitement Ordonnés (Autocomplétion OK)</label>
                <textarea
                  value={correctionForm.prescription}
                  onChange={(e) => {
                    let val = e.target.value;
                    clinicalAutocompleteItems.forEach(item => {
                      if (val.includes(item.trigger)) { val = val.replace(item.trigger, item.text); }
                    });
                    setCorrectionForm({ ...correctionForm, prescription: val });
                  }}
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-medium text-xs focus:ring-1 focus:ring-teal-750 h-24"
                />
                <span className="text-[9px] text-slate-400 mt-1 block font-medium">Tapez vos raccourcis DCI (ex: @para, @amox) pour les déployer automatiquement.</span>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-mono tracking-wider mb-1">Recommandations &amp; Notes d'observation</label>
                <textarea
                  value={correctionForm.notes}
                  onChange={(e) => {
                    let val = e.target.value;
                    clinicalAutocompleteItems.forEach(item => {
                      if (val.includes(item.trigger)) { val = val.replace(item.trigger, item.text); }
                    });
                    setCorrectionForm({ ...correctionForm, notes: val });
                  }}
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-medium text-xs focus:ring-1 focus:ring-teal-750"
                  rows={2}
                />
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRecordForCorrection(null)}
                className="px-4 py-2 border border-slate-200 bg-white text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md"
              >
                Enregistrer la correction auditable
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
