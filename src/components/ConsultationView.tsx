import { useState, FormEvent, useRef } from "react";
import { Patient, MedicalRecord } from "../types";
import AIDiagnosisPanel from "./AIDiagnosisPanel";
import { Stethoscope, Check, FileText, Calendar, Plus, UserCheck, Edit3, Paperclip, ShieldCheck, Printer } from "lucide-react";

interface ConsultationViewProps {
  patients: Patient[];
  records: MedicalRecord[];
  onAddRecord: (newRec: Omit<MedicalRecord, "id" | "date" | "createdAt" | "medecinSignature">) => void;
  accentColor: string;
}

export default function ConsultationView({
  patients,
  records,
  onAddRecord,
  accentColor
}: ConsultationViewProps) {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [motif, setMotif] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [codeCIM10, setCodeCIM10] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notesCliniques, setNotesCliniques] = useState("");
  const [certificatDuree, setCertificatDuree] = useState(0);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  
  // Custom Electronic Signature states
  const [signedDoc, setSignedDoc] = useState(false);
  const [medSignatureText, setMedSignatureText] = useState("Dr. Amadou Sangaré");

  // Certificate models trigger
  const [certificateModel, setCertificateModel] = useState<"aptitude" | "inaptitude" | "dispense">("aptitude");
  const [customCertText, setCustomCertText] = useState("");

  // Attachments simulation
  const [attachments, setAttachments] = useState<string[]>([
    "analyses_sang_precedent.pdf",
    "radiographie_thorax.jpg"
  ]);
  const [newAttachmentName, setNewAttachmentName] = useState("");

  const [message, setMessage] = useState<string | null>(null);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Apply diagnostic results suggested by the AI widget
  const handleApplyAI = (diag: string, code: string, treatments: string) => {
    setDiagnostic(diag);
    setCodeCIM10(code);
    setPrescription(prev => (prev ? `${prev}\n${treatments}` : treatments));
    onAddLogAudit("Utilisation de l'IA", `Diagnostic alternatif suggéré appliqué : ${diag}`);
  };

  const onAddLogAudit = (actionName: string, detailString: string) => {
    // simulated local callback triggers
    console.log(`[AUDIT] ${actionName} - ${detailString}`);
  };

  const handleToggleExam = (exam: string) => {
    if (selectedExams.includes(exam)) {
      setSelectedExams(prev => prev.filter(e => e !== exam));
    } else {
      setSelectedExams(prev => [...prev, exam]);
    }
  };

  const handleApplyCertificateModel = (model: typeof certificateModel) => {
    setCertificateModel(model);
    const patName = selectedPatient ? `${selectedPatient.nom.toUpperCase()} ${selectedPatient.prenom}` : "[Nom du patient]";
    
    if (model === "aptitude") {
      setCustomCertText(`CERTIFICAT D'APTITUDE APTE PHYSIQUE\nJe soussigné, Dr. Sangaré, certifie après examen clinique que le patient ${patName} présente les aptitudes physiques nécessaires aux épreuves sportives ou professionnelles.`);
    } else if (model === "inaptitude") {
      setCustomCertText(`CERTIFICAT D'INAPTITUDE TEMPORAIRE (REPOS MEDICAL)\nCertifie par la présente prescription que l'état de santé du patient ${patName} exige un repos médical strict de ${certificatDuree || 3} jour(s) pour convalescence.`);
    } else {
      setCustomCertText(`CERTIFICAT DE DISPENSE SCOLAIRE\nCertifie que l'état physiologique de ${patName} requiert une dispense des cours d'éducation physique pour la période courante.`);
    }
  };

  const handleAddAttachment = () => {
    if (!newAttachmentName) return;
    setAttachments([...attachments, newAttachmentName]);
    setNewAttachmentName("");
    alert("Pièce jointe scannée et liée au DME local.");
  };

  // Printable Medical Certificate
  const handlePrintCertificate = () => {
    if (!customCertText) {
      alert("Veuillez générer ou saisir un certificat médical au préalable.");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Certificat de santé officiel</title>
          <style>
            body { font-family: sans-serif; padding: 50px; color: #1e293b; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px double #0284c7; padding-bottom: 15px; }
            .content { margin-top: 40px; white-space: pre-line; font-size: 14px; }
            .signature { margin-top: 60px; text-align: right; }
            .seal-stamp { border: 2.5px solid green; color: green; display: inline-block; padding: 10px; font-weight: bold; border-radius: 6px; transform: rotate(-5deg); margin-top: 15px; font-size: 11px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <h2>MÉDISHAHEL CENTRAL BAMAKO (MALI)</h2>
            <h3>CERTIFICAT MÉDICAL ÉLECTRONIQUE</h3>
          </div>
          <div class="content">
            ${customCertText}
          </div>
          <div class="signature">
            Fait à Bamako, le ${new Date().toLocaleDateString("fr-FR")}<br/>
            <strong>${medSignatureText}</strong><br/>
            ${signedDoc ? `<div class="seal-stamp">MÉDISHAHEL SCELLÉ SIGNATAL UNIQUE AES-256</div>` : ""}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert("Veuillez sélectionner un patient.");
      return;
    }

    onAddRecord({
      patientId: selectedPatientId,
      motif,
      diagnostic,
      codeCIM10,
      prescription,
      notesCliniques,
      certificatDuree: certificatDuree > 0 ? certificatDuree : undefined,
      examensDemandes: selectedExams
    });

    // Reset Form
    setMotif("");
    setDiagnostic("");
    setCodeCIM10("");
    setPrescription("");
    setNotesCliniques("");
    setCertificatDuree(0);
    setSelectedExams([]);
    setSignedDoc(false);
    setCustomCertText("");

    setMessage("La consultation a été enregistrée avec succès. Prescription envoyée à la pharmacie et laboratoire.");
    setTimeout(() => setMessage(null), 3000);
  };

  const examinations = ["Goutte Épaisse (GE)", "NFS / Hémogramme", "Biochimie / Glycémie", "Échographie Obstétricale", "Radiographie Pulmonaire"];

  return (
    <div className="space-y-6" id="consultation-view-wrapper">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Stethoscope className="h-5 w-5" style={{ color: accentColor }} />
          <span>Consultations Cliniques & Dossier Médico-Sémantique (DME)</span>
        </h2>
        <p className="text-xs text-slate-500">Prise d'observations cliniques, aide au diagnostic assisté par IA, ordonnances sécurisées et impression de certificats d'aptitude légaux du Mali.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* Left column: Consultation entry form */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 font-semibold">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Stethoscope className="h-4 w-4 text-sky-600" /> acte de consultation courant
            </h3>

            {message && (
              <div className="bg-green-50 text-green-800 text-xs p-3 rounded-lg border border-green-250 flex items-center gap-2 font-bold">
                <Check className="h-4 w-4 text-green-600" />
                <span>{message}</span>
              </div>
            )}

            <div className="space-y-3.5">
              {/* Select patient */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Sélectionner un dossier patient actif <span className="text-red-500">*</span></label>
                <select
                  required
                  className="w-full text-xs rounded-lg border border-slate-350 px-3 py-2 outline-none font-semibold text-slate-700 focus:border-sky-500 bg-white"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  <option value="">-- Choisissez le dossier du patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nom.toUpperCase()} {p.prenom} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPatient && (
                <div className="p-3.5 bg-sky-50/50 border border-sky-100 rounded-lg text-xs space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold text-sky-909 border-b border-sky-100/40 pb-1.5">
                    <span>Fiche Médicale Rapide</span>
                    <span>Sexe: {selectedPatient.sexe} | Groupe: {selectedPatient.groupeSanguin}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] font-medium">
                    <div>Age: {new Date().getFullYear() - new Date(selectedPatient.dateNaissance).getFullYear()} ans</div>
                    <div>Tiers-Payant: {selectedPatient.assurance}</div>
                    <div className="col-span-2">Allergies critiques: <span className="text-red-650 font-bold">{selectedPatient.allergies || "Aucune allergie critique répertoriée"}</span></div>
                  </div>
                </div>
              )}

              {/* Consultation motif */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Motif principal de consultation</label>
                <input
                  type="text"
                  placeholder="ex: Céphalées aiguës, nausées sévères"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                />
              </div>

              {/* Notes cliniques */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Observations Physiques (Température, Constantes...)</label>
                <textarea
                  rows={2}
                  placeholder="Notes cliniques complétées (Temp, tension, auscultation pulmonaire)"
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-slate-50/50"
                  value={notesCliniques}
                  onChange={(e) => setNotesCliniques(e.target.value)}
                />
              </div>

              {/* Diagnostic fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-semibold">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Diagnostic principal de référence</label>
                  <input
                    type="text"
                    placeholder="ex: Paludisme simple"
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none"
                    value={diagnostic}
                    onChange={(e) => setDiagnostic(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Classification ICD-10 internationale</label>
                  <input
                    type="text"
                    placeholder="ex: B50.9 - Paludisme falciparum"
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none font-mono"
                    value={codeCIM10}
                    onChange={(e) => setCodeCIM10(e.target.value)}
                  />
                </div>
              </div>

              {/* Prescription ordonnance */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Ordonnance Électronique (Médicaments & Posologies)</label>
                <textarea
                  rows={4}
                  placeholder="ex: Lumefantrine Artemether (Coartem) : 1 cp à 8h d'intervalle, pendant 3 jours"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none font-mono text-slate-705 bg-slate-50/50"
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                />
              </div>

              {/* Paraclinical exams requests */}
              <div className="space-y-1.5">
                <span className="block text-[11px] font-bold text-slate-600">Prescriptions paracliniques (Lab / Imagerie)</span>
                <div className="flex flex-wrap gap-2">
                  {examinations.map(exam => {
                    const active = selectedExams.includes(exam);
                    return (
                      <button
                        key={exam}
                        type="button"
                        onClick={() => handleToggleExam(exam)}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition-all cursor-pointer font-bold ${
                          active 
                            ? "bg-sky-100 text-sky-800 border-sky-300 ring-2 ring-sky-500/10" 
                            : "bg-white text-slate-600 border-slate-205 hover:bg-slate-50"
                        }`}
                      >
                        {exam}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Embedded Electronic Signature component */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Edit3 className="h-3.5 w-3.5" /> Scellé de validation & Signature Électronique local
                </span>
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="w-full sm:max-w-xs">
                    <label className="block text-[10.5px] text-slate-450 mb-0.5">Identité du Praticien Signataire :</label>
                    <input
                      type="text"
                      className="w-full p-1.5 border border-slate-300 rounded font-bold text-slate-800"
                      value={medSignatureText}
                      onChange={(e) => setMedSignatureText(e.target.value)}
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-2 bg-white border border-slate-300 rounded p-2 px-3 self-end sm:self-center">
                    <input
                      type="checkbox"
                      className="rounded text-[#0284c7] focus:ring-sky-500 h-4 w-4 cursor-pointer"
                      checked={signedDoc}
                      onChange={(e) => setSignedDoc(e.target.checked)}
                    />
                    <span className="text-xs font-bold text-slate-800">Signer électroniquement le dossier clinique</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs text-white font-bold rounded-lg cursor-pointer hover:opacity-95 shadow-xs flex items-center gap-1.5"
                style={{ backgroundColor: accentColor }}
              >
                {signedDoc ? <ShieldCheck className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                <span>Signer & Valider le dossier (DME)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right column: Diagnostic tool and Document creator models */}
        <div className="space-y-6 font-semibold">
          {/* Smart AI helper widget */}
          <AIDiagnosisPanel
            patientAge={selectedPatient ? `${new Date().getFullYear() - new Date(selectedPatient.dateNaissance).getFullYear()} ans` : ""}
            patientSexe={selectedPatient?.sexe || "M"}
            patientHistory={selectedPatient?.allergies || "Aucun antécédent particulier"}
            onApplyDiagnostic={handleApplyAI}
          />

          {/* Certificates templates box */}
          <div className="bg-white p-5 rounded-xl border border-slate-205 shadow-xs space-y-3.5">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <FileText className="h-4 w-4 text-sky-650" /> Modèles de Certificats Santé Officiels
            </h3>

            <div>
              <label className="block text-[10.5px] text-slate-450 mb-1 uppercase tracking-widest font-black">Sélectionner un modèle :</label>
              <div className="grid grid-cols-3 gap-1 mb-2">
                <button
                  type="button"
                  onClick={() => handleApplyCertificateModel("aptitude")}
                  className={`p-1.5 text-[10px] font-bold border rounded transition-all truncate text-center cursor-pointer ${
                    certificateModel === "aptitude" ? "bg-slate-50 border-slate-705 text-slate-900" : "bg-white border-slate-205 text-slate-600"
                  }`}
                >
                  Aptitude
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyCertificateModel("inaptitude")}
                  className={`p-1.5 text-[10px] font-bold border rounded transition-all truncate text-center cursor-pointer ${
                    certificateModel === "inaptitude" ? "bg-slate-50 border-slate-705 text-slate-900" : "bg-white border-slate-205 text-slate-600"
                  }`}
                >
                  Repos Médical
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyCertificateModel("dispense")}
                  className={`p-1.5 text-[10px] font-bold border rounded transition-all truncate text-center cursor-pointer ${
                    certificateModel === "dispense" ? "bg-slate-50 border-slate-705 text-slate-900" : "bg-white border-slate-205 text-slate-600"
                  }`}
                >
                  Dispense
                </button>
              </div>

              <textarea
                rows={4}
                className="w-full p-2 text-[10px] leading-relaxed border border-slate-300 font-mono font-medium bg-slate-50 border-slate-250 resize-none rounded cursor-pointer"
                value={customCertText}
                onChange={(e) => setCustomCertText(e.target.value)}
                placeholder="Le texte certifié apparaîtra ici. Renseignez d'abord un patient..."
              />
            </div>

            <button
              type="button"
              onClick={handlePrintCertificate}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold p-1.5 rounded flex items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimer Certificat Médical</span>
            </button>
          </div>

          {/* Attachments panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-250 shadow-xs space-y-3">
            <h3 className="font-bold text-xs text-slate-805 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Paperclip className="h-4 w-4 text-sky-650" /> Pièces jointes & Comptes-rendus DME
            </h3>

            {/* list attachments */}
            <div className="space-y-1.5 max-h-[100px] overflow-y-auto bg-slate-50 p-2 rounded border border-slate-200">
              {attachments.map((at, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] font-semibold text-slate-600 bg-white p-1 px-2.5 rounded border">
                  <span>{at}</span>
                  <span className="text-[9px] text-[#0284c7] font-mono">LIÉ LOCALEMENT</span>
                </div>
              ))}
            </div>

            {/* add attachment trigger form */}
            <div className="flex gap-1.5 text-[11px] pt-1">
              <input
                type="text"
                placeholder="Renseigner nom document"
                className="flex-1 p-1 border border-slate-350 bg-white"
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="bg-slate-800 text-white font-bold p-1 px-3.5 rounded"
              >
                Scan Doc
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
