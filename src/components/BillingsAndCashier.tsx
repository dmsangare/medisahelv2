import React, { useState, useEffect } from "react";
import { HandCoins, ChevronRight, Search, Plus, Check, ShieldAlert, BadgeDollarSign, Wallet, Percent, CircleEllipsis, Printer, Smartphone, MessageCircle, FileText, X, Send } from "lucide-react";
import { Transaction, Patient } from "../types.ts";

interface BillingsAndCashierProps {
  token: string | null;
  patients: Patient[];
  userRole: string;
  clinic?: any;
}

export const BillingsAndCashier: React.FC<BillingsAndCashierProps> = ({ token, patients, userRole, clinic }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [payingLabTestId, setPayingLabTestId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    type: "INVOICE",
    amount: 0,
    paymentMethod: "CASH",
    description: "",
    status: "UNPAID"
  });
  const [items, setItems] = useState<{ name: string; quantity: number; price: number }[]>([
    { name: "Consultation Médecin Généraliste", quantity: 1, price: 5000 }
  ]);
  const [category, setCategory] = useState<"CONSULTATION" | "LAB" | "IMAGING" | "HOSPITALIZATION" | "PHARMACY" | "OTHER">("CONSULTATION");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [printFormat, setPrintFormat] = useState<'A4' | 'A5' | 'THERMAL'>('A4');
  const [smsDraft, setSmsDraft] = useState("");
  const [whatsappDraft, setWhatsappDraft] = useState("");
  const [smsStatus, setSmsStatus] = useState<'IDLE' | 'SENDING' | 'SENT'>('IDLE');
  const [whatsappStatus, setWhatsappStatus] = useState<'IDLE' | 'SENDING' | 'SENT'>('IDLE');
  const [apiLogging, setApiLogging] = useState(false);

  useEffect(() => {
    if (completedTransaction) {
      const p = patients.find(pat => pat.id === completedTransaction.patientId);
      const prf = p ? p.firstName : "Patient";
      const rxNo = completedTransaction.receiptNumber || `REC-2026-${completedTransaction.id.toUpperCase().slice(3, 9)}`;
      const dateStr = new Date(completedTransaction.date).toLocaleDateString("fr-FR");
      const currencyLabel = clinic?.currency || "FCFA";
      const clinicName = clinic?.name || "MédiSahel Clinique";

      const category = completedTransaction.category || "OTHER";
      const items = completedTransaction.items || [];
      const totalAmount = completedTransaction.amount;
      
      let generatedSms = "";
      let generatedWa = "";

      if (category === "CONSULTATION") {
        generatedSms = `Bonjour ${prf},

Votre paiement concernant votre consultation médicale a été enregistré avec succès.

Consultation : 5 000 FCFA
Reçu : ${rxNo}

Merci de votre confiance.`;
      } else if (category === "LAB") {
        const itemNames = items.map(it => `* ${it.name}`).join("\n");
        generatedSms = `Bonjour ${prf},

Votre paiement pour les examens biologiques suivants a été enregistré :

${itemNames}

Montant total :
${totalAmount.toLocaleString("fr-FR")} FCFA

Reçu :
${rxNo}`;
      } else if (category === "IMAGING") {
        const firstItem = items[0]?.name || "une échographie abdominale";
        generatedSms = `Votre paiement de ${totalAmount.toLocaleString("fr-FR")} FCFA pour une échographie abdominale a été enregistré.`;
      } else if (category === "HOSPITALIZATION") {
        generatedSms = `Votre règlement concernant votre hospitalisation a été enregistré.

Montant :
${totalAmount.toLocaleString("fr-FR")} FCFA`;
      } else if (category === "PHARMACY") {
        const itemNames = items.map(it => `* ${it.name}`).join("\n");
        generatedSms = `Bonjour ${prf},

Votre achat de médicaments a été enregistré.

Produits :

${itemNames}

Montant :
${totalAmount.toLocaleString("fr-FR")} FCFA`;
      } else {
        const itemLines = items.map(it => `* ${it.name} (x${it.quantity})`).join("\n");
        generatedSms = `Bonjour ${prf},

Votre paiement de ${totalAmount.toLocaleString("fr-FR")} ${currencyLabel} a été enregistré avec succès.

Prestations :
${itemLines}

Reçu : ${rxNo}
Merci de votre confiance.`;
      }

      // WhatsApp format template:
      let motifText = "Prestation Médicale";
      if (category === "CONSULTATION") motifText = "Consultation Médecine Générale";
      else if (category === "LAB") motifText = "Examens Biologiques";
      else if (category === "IMAGING") motifText = "Imagerie Médicale";
      else if (category === "HOSPITALIZATION") motifText = "Hospitalisation";
      else if (category === "PHARMACY") motifText = "Achat de Médicaments";
      else motifText = completedTransaction.description || "Prestation de service";

      const prestationLines = items.map(it => `* ${it.name} : ${(it.quantity * it.price).toLocaleString("fr-FR")} ${currencyLabel}`).join("\n");

      generatedWa = `Bonjour ${prf},

Veuillez trouver ci-joint votre reçu de paiement.

Motif :
${motifText}

Prestations :

${prestationLines}

Montant total :
${totalAmount.toLocaleString("fr-FR")} ${currencyLabel}

Reçu :
${rxNo}

Merci de votre confiance.

${clinicName.toUpperCase()}`;

      setSmsDraft(generatedSms);
      setWhatsappDraft(generatedWa);
      setSmsStatus('IDLE');
      setWhatsappStatus('IDLE');
    }
  }, [completedTransaction, patients, clinic]);

  const getPatientPhone = (id: string) => {
    const p = patients.find(pat => pat.id === id);
    return p ? p.phone || "Non spécifié" : "Non spécifié";
  };

  const getPatientName = (id: string) => {
    const p = patients.find(pat => pat.id === id);
    return p ? `${p.lastName.toUpperCase()} ${p.firstName}` : "Patient Externe";
  };

  const logDispatchAction = async (txId: string, patientId: string, channel: 'IMPRESSION' | 'SMS' | 'WHATSAPP', message?: string, status?: string) => {
    try {
      await fetch(`/api/patients/${patientId}/receipt-dispatches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          transactionId: txId, 
          channel,
          message: message || (channel === "IMPRESSION" ? "Génération et Téléchargement du Reçu PDF" : ""),
          status: status || "Transmis"
        })
      });
    } catch (err) {
      console.error("Erreur de dispatching log", err);
    }
  };

  const generatePrintableReceipt = (tx: Transaction, format: 'A4' | 'A5' | 'THERMAL') => {
    logDispatchAction(tx.id, tx.patientId, 'IMPRESSION');
    
    // Receipt sequence matching REC-2026-XXXXXX where XXXXXX is padded. 
    // Fallback to dynamic if no predefined receiptNumber is assigned to the model.
    const rxNo = tx.receiptNumber || `REC-2026-${tx.id.toUpperCase().slice(3, 9)}`;
    const dossierNo = `PAT-2026-${tx.patientId.toUpperCase().slice(3, 9)}`;
    
    const patientName = getPatientName(tx.patientId);
    const dateStr = new Date(tx.date).toLocaleString("fr-FR");
    const paymentMode = tx.paymentMethod === "CASH" ? "Espèces (CASH)" : tx.paymentMethod === "MOBILE_MONEY" ? "Mobile Money (Orange/Moov)" : tx.paymentMethod === "CARD" ? "Carte Bancaire" : "Assurance / TP";
    const restToPay = tx.status === "PARTIAL" ? (tx.amount * 0.5) : 0;

    const currencyLabel = clinic?.currency || "FCFA";
    const clinicName = clinic?.name || "MédiSahel Clinique";
    const clinicAddress = clinic?.address || "Hamdallaye ACI 2000";
    const clinicCity = clinic?.city || "Bamako";
    const clinicCountry = clinic?.country || "Mali";
    const clinicPhone = clinic?.phone || "+223 20 22 14 67";
    const clinicWhatsapp = clinic?.whatsapp || "+223 73 65 14 67";
    const clinicEmail = clinic?.email || "contact@medisahel.ml";
    const clinicWebsite = clinic?.website || "www.medisahel.ml";
    const clinicSlogan = clinic?.slogan || "Votre santé, notre engagement quotidien";
    const clinicLicense = clinic?.licenseNumber || "AGR-2024-MS08-BKO";
    const clinicRccm = clinic?.rccm || "MA-BKO-2024-B-1240";
    const clinicIfu = clinic?.ifuNif || "NIF-084210457-H";
    const clinicStamp = clinic?.digitalStamp || "[CACHET NUMÉRIQUE MÉDISAHEL CLINIQUE - CAISSE - SÉCURISÉ]";
    const clinicSignature = clinic?.instSignature || "La Direction Médicale / Caissier Principal";

    const verifyUrl = `${window.location.origin}/api/transactions/${tx.id}`;

    // Map Category to localized Motif Detailed label
    let motifLabel = "Autre Acte Clinique";
    if (tx.category === "CONSULTATION") motifLabel = "Consultation Médecine Générale";
    else if (tx.category === "LAB") motifLabel = "Examens Biologiques";
    else if (tx.category === "IMAGING") motifLabel = "Imagerie Médicale";
    else if (tx.category === "HOSPITALIZATION") motifLabel = "Hospitalisation";
    else if (tx.category === "PHARMACY") motifLabel = "Achat de Médicaments";
    else motifLabel = tx.description || "Prestation de service clinique";

    const printWindow = window.open("", "", "width=850,height=800");
    if (!printWindow) return;

    let style = "";
    if (format === 'THERMAL') {
      style = `
        body { font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; width: 76mm; padding: 2px; line-height: 1.3; }
        .center { text-align: center; }
        .double-divider { border-bottom: 2px dashed #000; margin: 8px 0; }
        .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
        .bold { font-weight: bold; }
        .right { text-align: right; }
        .flex { display: flex; justify-content: space-between; }
        .footer { margin-top: 15px; font-size: 9px; text-align: center; }
        .qr-block { display: flex; justify-content: center; margin: 8px 0; }
      `;
    } else if (format === 'A5') {
      style = `
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; color: #1e293b; padding: 15px; font-size: 11.5px; line-height: 1.4; max-width: 148mm; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${clinic?.themeColor || '#0f766e'}; padding-bottom: 8px; margin-bottom: 12px; align-items: center; }
        .clinic-name { font-size: 15px; font-weight: 850; color: ${clinic?.themeColor || '#0f766e'}; text-transform: uppercase; }
        .receipt-title { font-size: 12px; font-weight: bold; color: #475569; margin-top: 2px; }
        .receipt-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #f1f5f9; }
        .act-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .act-table th, .act-table td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
        .act-table th { background: #f1f5f9; font-weight: bold; color: #475569; font-size: 10.5px; }
        .totals-grid { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; border-top: 1px dashed #e2e8f0; padding-top: 12px; text-align: center; font-size: 10px; color: #64748b; }
      `;
    } else { // A4 format
      style = `
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; color: #1e293b; padding: 35px; font-size: 12.5px; line-height: 1.5; max-width: 210mm; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px double ${clinic?.themeColor || '#0f766e'}; padding-bottom: 15px; margin-bottom: 25px; align-items: center; }
        .clinic-name { font-size: 20px; font-weight: 900; color: ${clinic?.themeColor || '#0f766e'}; text-transform: uppercase; letter-spacing: 0.5px; }
        .clinic-details { font-size: 11px; color: #64748b; line-height: 1.4; margin-top: 4px; }
        .receipt-badge-box { text-align: right; }
        .receipt-badge { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 5px 14px; border-radius: 6px; font-weight: bold; text-transform: uppercase; font-size: 11px; display: inline-block; }
        .receipt-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; padding: 20px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
        .info-block div { margin-bottom: 5px; }
        .act-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .act-table th, .act-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
        .act-table th { background: #f8fafc; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 10.5px; }
        .totals-layout { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px; }
        .total-card { width: 280px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
        .flex { display: flex; justify-content: space-between; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 50px; text-align: center; font-size: 11px; color: #475569; }
        .signature-line { border-top: 1px solid #e2e8f0; margin-top: 45px; padding-top: 8px; font-weight: bold; }
        .footer { text-align: center; margin-top: 70px; font-size: 9.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; line-height: 1.4; }
      `;
    }

    // Build the dynamic items table rows
    let itemsHTML = "";
    if (tx.items && tx.items.length > 0) {
      itemsHTML = tx.items.map((it: any) => `
        <tr>
          <td style="font-weight: 500; color: #0f172a;">${it.name}</td>
          <td style="text-align: center;">${it.quantity}</td>
          <td style="text-align: right;">${it.price.toLocaleString("fr-FR")} ${currencyLabel}</td>
          <td style="text-align: right; font-weight: bold; color: #0f172a;">${(it.quantity * it.price).toLocaleString("fr-FR")} ${currencyLabel}</td>
        </tr>
      `).join("");
    } else {
      itemsHTML = `
        <tr>
          <td style="font-weight: 500; color: #0f172a;">${tx.description}</td>
          <td style="text-align: center;">1</td>
          <td style="text-align: right;">${tx.amount.toLocaleString("fr-FR")} ${currencyLabel}</td>
          <td style="text-align: right; font-weight: bold; color: #0f172a;">${tx.amount.toLocaleString("fr-FR")} ${currencyLabel}</td>
        </tr>
      `;
    }

    let bodyHTML = "";
    if (format === 'THERMAL') {
      bodyHTML = `
        <div class="center bold" style="font-size: 13px; text-transform: uppercase;">${clinicName}</div>
        <div class="center" style="font-size: 9px;">${clinicAddress}, ${clinicCity}</div>
        <div class="center" style="font-size: 9px;">Tél: ${clinicPhone}</div>
        <div class="double-divider"></div>
        <div class="center bold" style="font-size: 11px;">REÇU DE PAIEMENT CLINIQUE</div>
        <div class="center" style="font-size: 9px; font-family: monospace;">N° ${rxNo}</div>
        <div class="divider"></div>
        <div class="flex"><span>Date:</span> <span class="bold">${dateStr}</span></div>
        <div class="flex"><span>Dossier:</span> <span class="bold">${dossierNo}</span></div>
        <div class="flex"><span>Patient:</span> <span class="bold">${patientName}</span></div>
        <div class="flex"><span>Caissier:</span> <span>${tx.cashierName}</span></div>
        <div class="double-divider"></div>
        <div class="bold" style="text-transform: uppercase; font-size: 10px;">Motif : ${motifLabel}</div>
        <div class="divider"></div>
        <div class="bold" style="font-size: 9px; margin-bottom: 4px;">DÉTAIL DES SERVICES :</div>
        ${tx.items && tx.items.length > 0 ? tx.items.map((it: any) => `
          <div class="flex" style="padding-left: 4px; font-size: 10px;">
            <span>${it.name} (x${it.quantity})</span>
            <span>${(it.quantity * it.price).toLocaleString("fr-FR")}</span>
          </div>
        `).join("") : `
          <div class="flex" style="padding-left: 4px; font-size: 10px;">
            <span>${tx.description}</span>
            <span>${tx.amount.toLocaleString("fr-FR")}</span>
          </div>
        `}
        <div class="double-divider"></div>
        <div class="flex bold" style="font-size: 11.5px;"><span>TOTAL DU :</span> <span>${tx.amount.toLocaleString("fr-FR")} ${currencyLabel}</span></div>
        <div class="flex bold" style="font-size: 11.5px; color: #15803d;"><span>MONTANT PAYÉ :</span> <span>${tx.amount.toLocaleString("fr-FR")} ${currencyLabel}</span></div>
        ${restToPay > 0 ? `<div class="flex bold" style="color: #b91c1c;"><span>RESTE À PAYER :</span> <span>${restToPay.toLocaleString("fr-FR")} ${currencyLabel}</span></div>` : ''}
        <div class="flex" style="font-size: 9.5px;"><span>Réglement:</span> <span class="bold">${paymentMode}</span></div>
        <div class="double-divider"></div>
        
        <div class="center bold" style="font-size: 9px; margin-top: 5px;">SIGNATURE ÉLECTRONIQUE</div>
        <div class="center" style="font-size: 7.5px; font-family: monospace; color: #475569; word-break: break-all;">${clinicStamp}</div>
        
        <div class="qr-block">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verifyUrl)}" style="border: 1px solid #e2e8f0; padding: 2px; border-radius: 4px; width: 75px; height: 75px;" alt="QR Code" referrerPolicy="no-referrer" />
        </div>
        <div class="center" style="font-size: 7.5px; color: #64748b; margin-top: 2px;">Scanner pour authentification</div>
        <div class="footer">${clinicName} - Merci de votre confiance!</div>
      `;
    } else if (format === 'A5') {
      bodyHTML = `
        <div class="header">
          <div style="display: flex; align-items: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${clinic?.themeColor || '#0f766e'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <div>
              <div class="clinic-name">${clinicName}</div>
              <div style="font-size: 9px; color: #64748b;">${clinicAddress}, ${clinicCity}, ${clinicCountry}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="receipt-title" style="color: ${clinic?.themeColor || '#0f766e'}; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">REÇU DE CAISSE DÉTAILLÉ</div>
            <div style="font-family: monospace; font-size: 10px; font-weight: bold; color: #0f172a;">N° ${rxNo}</div>
          </div>
        </div>

        <div style="font-size: 9.5px; color: #475569; font-style: italic; margin-bottom: 8px; text-align: center;">« ${clinicSlogan} »</div>

        <div class="receipt-info">
          <div>
            <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px;">IDENTIFICATION DU PATIENT</div>
            <div style="font-size: 11px; font-weight: bold; margin-top: 1.5px; color: #0f172a;">${patientName}</div>
            <div style="font-size: 9.5px; color: #475569; margin-top: 1px;">Dossier Clinique : <strong>${dossierNo}</strong></div>
            <div style="font-size: 9.5px; color: #475569;">Téléphone : ${getPatientPhone(tx.patientId)}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px;">DÉTAILS FINANCIERS</div>
            <div style="font-size: 10px; margin-top: 1.5px;">Date & Heure : <strong>${dateStr}</strong></div>
            <div style="font-size: 10px;">Caissier : <strong>${tx.cashierName}</strong></div>
            <div style="font-size: 10px; color: ${clinic?.themeColor || '#0f766e'}; font-weight: bold;">Motif : ${motifLabel}</div>
          </div>
        </div>

        <table class="act-table">
          <thead>
            <tr>
              <th>Désignation de la Prestation / Acte</th>
              <th style="text-align: center; width: 40px;">Qté</th>
              <th style="text-align: right; width: 90px;">P.U.</th>
              <th style="text-align: right; width: 100px;">Total net</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="totals-grid">
          <div style="display: flex; gap: 10px; align-items: center;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=60&data=${encodeURIComponent(verifyUrl)}" style="border: 1px solid #e2e8f0; padding: 2px; border-radius: 4px; width: 55px; height: 55px;" alt="QR" referrerPolicy="no-referrer" />
            <div style="font-size: 8px; color: #64748b; line-height: 1.2;">
              <strong>Vérification Digitale</strong><br/>
              Scannez le QR Code pour valider<br/>
              l'authenticité de la quittance.<br/>
              ID: ${tx.id.toUpperCase().slice(0, 8)}
            </div>
          </div>
          <div style="text-align: right; display: flex; flex-direction: column; gap: 3px;">
            <div style="font-size: 10px; color: #475569;">Montant Brut : <strong>${tx.amount.toLocaleString("fr-FR")} ${currencyLabel}</strong></div>
            <div style="font-size: 11px; color: #15803d; font-weight: bold;">Montant Encaissé : ${tx.amount.toLocaleString("fr-FR")} ${currencyLabel}</div>
            ${restToPay > 0 ? `<div style="font-size: 10px; color: #b91c1c; font-weight: bold;">Solde Restant : ${restToPay.toLocaleString("fr-FR")} ${currencyLabel}</div>` : `<div style="font-size: 9px; color: #166534; font-weight: bold;">[SOLDE INTÉGRALEMENT RÉGLÉ]</div>`}
            <div style="font-size: 10px; margin-top: 2px;">Mode réglement : <strong>${paymentMode}</strong></div>
          </div>
        </div>

        <div style="font-size: 8.5px; line-height: 1.2; border-top: 1px dotted #e2e8f0; margin-top: 10px; padding-top: 4px; color: #64748b; text-align: center;">
          Agrément N° : ${clinicLicense} | RCCM : ${clinicRccm} | NIF-IFU : ${clinicIfu}
        </div>

        <div class="signatures">
          <div>
            <div>SIGNATURE & EMISSIONS DU PATIENT</div>
            <div style="height: 25px;"></div>
            <div style="font-weight: bold; border-top: 1px solid #f1f5f9; padding-top: 4px; font-size: 9px;">Bon pour acquiescement</div>
          </div>
          <div>
            <div>SIGNATURE ÉLECTRONIQUE DE LA CAISSE</div>
            <div style="font-size: 7px; color: #94a3b8; font-family: monospace;">${clinicStamp}</div>
            <div style="height: 5px;"></div>
            <div style="font-weight: bold; border-top: 1px solid #f1f5f9; padding-top: 4px; font-size: 9px; color: ${clinic?.themeColor || '#0f766e'};">${clinicSignature}</div>
          </div>
        </div>
      `;
    } else { // A4 format
      bodyHTML = `
        <div class="header">
          <div style="display: flex; align-items: center;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${clinic?.themeColor || '#0f766e'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px;"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <div>
              <div class="clinic-name">${clinicName}</div>
              <div class="clinic-details">
                ${clinicAddress}, ${clinicCity}, ${clinicCountry} | Tél: ${clinicPhone} ${clinicWhatsapp ? ` / WhatsApp: ` + clinicWhatsapp : ``}<br/>
                Email: ${clinicEmail} | Site Web: ${clinicWebsite}
              </div>
            </div>
          </div>
          <div class="receipt-badge-box">
            <div class="receipt-badge">REÇU DE SÉCURITÉ CAISSE</div>
            <div style="font-family: monospace; font-size: 13.5px; font-weight: bold; color: ${clinic?.themeColor || '#0f766e'}; margin-top: 6px;">N° ${rxNo}</div>
          </div>
        </div>

        <div style="font-size: 11px; color: #475569; font-style: italic; margin-top: -15px; margin-bottom: 20px; text-align: left;">« ${clinicSlogan} »</div>

        <div class="receipt-info">
          <div class="info-block">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">DOSSIER DU PATIENT ADHÉRENT</div>
            <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px;">${patientName}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 3px;">Dossier Médical : <strong>${dossierNo}</strong></div>
            <div style="font-size: 12px; color: #475569;">Téléphone portable : <strong>${getPatientPhone(tx.patientId)}</strong></div>
            <div style="font-size: 11px; color: #64748b;">Identifiant Unique : <span style="font-family: monospace;">${tx.patientId}</span></div>
          </div>
          <div class="info-block" style="border-left: 1px solid #e2e8f0; padding-left: 20px;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">JUSTIFICATIF DE PAIEMENT CAISSE</div>
            <div>Identifiant Transaction : <strong style="font-family: monospace;">TX-${tx.id.toUpperCase().slice(0, 8)}</strong></div>
            <div>Date Enregistrement : <strong>${dateStr}</strong></div>
            <div>Agent de Caisse ayant encaissé : <strong>${tx.cashierName}</strong></div>
            <div style="margin-top: 4px;">Motif d'Encaissement : <strong style="color: ${clinic?.themeColor || '#0f766e'}; font-size: 13px;">${motifLabel}</strong></div>
          </div>
        </div>

        <table class="act-table">
          <thead>
            <tr>
              <th>Description & Libellé des Prestations Médicales / Actes Cliniques</th>
              <th style="text-align: center; width: 70px;">Quantité</th>
              <th style="text-align: right; width: 140px;">Prix Unitaire</th>
              <th style="text-align: right; width: 140px;">Total Net HT</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="totals-layout">
          <div style="display: flex; gap: 15px; align-items: center; max-width: 400px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fafafa;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=90&data=${encodeURIComponent(verifyUrl)}" style="border: 1px solid #e2e8f0; padding: 3px; border-radius: 6px; width: 75px; height: 75px;" alt="QR Code Signature" referrerPolicy="no-referrer" />
            <div style="font-size: 10.5px; color: #475569; line-height: 1.3;">
              <strong style="color: #0f172a;">Vérification Cloud MédiSahel</strong><br/>
              Cette quittance est signée électroniquement et certifiée par notre passerelle comptable sécurisée.
              Scannez ce code pour vérifier sa conformité institutionnelle.
            </div>
          </div>
          
          <div class="total-card">
            <div class="flex">
              <span style="color: #64748b; font-weight: bold; text-transform: uppercase; font-size: 10px;">Montant Brut Global :</span>
              <span style="font-weight: bold; font-family: monospace;">${tx.amount.toLocaleString("fr-FR")} ${currencyLabel}</span>
            </div>
            <div class="flex" style="padding-top: 6px; border-top: 1px solid #f1f5f9; color: #15803d;">
              <span style="font-weight: bold; text-transform: uppercase; font-size: 10px;">MONTANT ENCAISSÉ :</span>
              <span style="font-weight: 900; font-size: 15px; font-family: monospace;">${tx.amount.toLocaleString("fr-FR")} ${currencyLabel}</span>
            </div>
            ${restToPay > 0 ? `
              <div class="flex" style="color: #b91c1c; font-weight: bold; font-size: 11px;">
                <span style="text-transform: uppercase; font-size: 10px;">SOLDE RESTANT DU :</span>
                <span style="font-family: monospace;">${restToPay.toLocaleString("fr-FR")} ${currencyLabel}</span>
              </div>
            ` : `
              <div class="flex" style="color: #15803d; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                <span>Solde Reste à Payer :</span>
                <span>0 ${currencyLabel} (RÈGLEMENT TOTAL)</span>
              </div>
            `}
            <div class="flex" style="padding-top: 4px; border-top: 1px dashed #e2e8f0; font-size: 11px;">
              <span>Mode de Réglement :</span>
              <span style="font-weight: bold; color: #475569;">${paymentMode}</span>
            </div>
          </div>
        </div>

        <div class="signatures">
          <div>
            <div class="signature-line">Griffe de l'Adhérent / Patient</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">« Lu, approuvé et quittance reçue »</div>
          </div>
          <div>
            <div class="signature-line">Signature Électronique & Sceau Officiel</div>
            <div style="font-size: 8.5px; color: #94a3b8; font-family: monospace; line-height: 1.2; padding: 4px; border: 1px dotted #cbd5e1; margin-top: 15px; background: #f8fafc; border-radius: 4px;">${clinicStamp}</div>
            <div style="font-weight: bold; color: ${clinic?.themeColor || '#0f766e'}; font-size: 11.5px; margin-top: 8px;">${clinicSignature}</div>
          </div>
        </div>

        <div class="footer">
          Ce reçu comptable officiel est généré automatiquement par le Système d'Information Médecine de la ${clinicName}.<br/>
          Agrément Sanitaire : ${clinicLicense} | RCCM : ${clinicRccm} | NIF : ${clinicIfu}<br/>
          Siège social : ${clinicAddress}, ${clinicCity}, ${clinicCountry} | Tél: ${clinicPhone} | Email: ${clinicEmail}
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Quittance de Caisse ${rxNo} - ${patientName}</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">
          <style>${style}</style>
        </head>
        <body>
          ${bodyHTML}
          <script>
            window.onload = function() { 
              setTimeout(function() {
                window.print(); 
                window.close();
              }, 400);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger les transactions");
      setTransactions(data);

      const labRes = await fetch("/api/labtests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (labRes.ok) {
        const labData = await labRes.json();
        setLabTests(labData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.patientId) {
      setError("Le patient est obligatoire.");
      return;
    }

    // Validate and clean up items
    const activeItems = items.filter(it => it.name.trim() !== "");
    if (activeItems.length === 0) {
      setError("Veuillez saisir au moins une prestation / acte médical.");
      return;
    }

    const computedAmount = activeItems.reduce((acc, it) => acc + (it.quantity * it.price), 0);
    if (computedAmount <= 0) {
      setError("Le montant total des prestations doit être supérieur à 0.");
      return;
    }

    // Create description from item names
    const computedDescription = activeItems.map(it => `${it.name} (x${it.quantity})`).join(", ");

    // Generate stable unique receipt number
    const computedReceiptNumber = `REC-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const submissionPayload = {
      ...formData,
      amount: computedAmount,
      description: computedDescription,
      category: category,
      items: activeItems,
      receiptNumber: computedReceiptNumber
    };

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submissionPayload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Echec de l'enregistrement de la facture");

      setSuccess("Facture enregistrée avec succès !");

      // Mark the selected lab test as PAID if applicable
      if (payingLabTestId) {
        await fetch(`/api/labtests/${payingLabTestId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: "PAID",
            paymentMethod: formData.paymentMethod,
            amount: computedAmount
          })
        });
        setPayingLabTestId(null);
      }

      setFormData({ patientId: "", type: "INVOICE", amount: 0, paymentMethod: "CASH", description: "", status: "UNPAID" });
      setItems([{ name: "Consultation Médecin Généraliste", quantity: 1, price: 5000 }]);
      setCategory("CONSULTATION");
      setShowAddForm(false);
      
      if (data.status === "PAID" || data.status === "PARTIAL") {
        setCompletedTransaction(data);
      }

      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "PAID" | "UNPAID" | "PARTIAL") => {
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (!response.ok) throw new Error("Échec d'encaissement");
      setSuccess("Statut de la facture mis à jour avec archivage immédiat.");
      
      if (newStatus === "PAID" || newStatus === "PARTIAL") {
        setCompletedTransaction(data);
      }

      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Compute stats
  const totalRevenue = transactions
    .filter(t => t.status === "PAID")
    .reduce((sum, curr) => sum + curr.amount, 0);

  const pendingRevenue = transactions
    .filter(t => t.status === "UNPAID")
    .reduce((sum, curr) => sum + curr.amount, 0);

  const totalInvoiced = transactions.reduce((sum, curr) => sum + curr.amount, 0);

  if (completedTransaction) {
    const rxNo = `REC-2026-${completedTransaction.id.toUpperCase().slice(3, 8)}`;
    const patientName = getPatientName(completedTransaction.patientId);
    const patPhone = getPatientPhone(completedTransaction.patientId);
    
    return (
      <div className="max-w-4xl mx-auto space-y-6" id="post-payment-receipt-screen">
        <div className="bg-gradient-to-r from-teal-800 to-teal-900 border border-teal-950 p-6 rounded-2xl shadow-md text-white">
          <div className="flex justify-between items-start">
            <div>
              <span className="inline-flex items-center gap-1 bg-teal-700/60 border border-teal-600 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider font-mono">
                <Check className="h-3 w-3" /> Paiement Validé & Sécurisé
              </span>
              <h2 className="text-xl font-black font-sans mt-3">Facture Encaissée avec Succès</h2>
              <p className="text-xs text-teal-150/80 mt-1 font-sans">
                La transaction financière est scellée et enregistrée au Grand Registre Audit du District Clinique.
              </p>
            </div>
            <button 
              onClick={() => setCompletedTransaction(null)}
              className="p-1 px-3 bg-teal-700/40 hover:bg-teal-750 border border-teal-600/30 rounded-lg text-xs"
            >
              Fermer l'Atelier
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-teal-750 grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs text-teal-150">
            <div>
              <span className="text-teal-300 block text-[10px] uppercase">Reçu de Caisse</span>
              <strong className="text-white text-sm font-semibold">{rxNo}</strong>
            </div>
            <div>
              <span className="text-teal-300 block text-[10px] uppercase">Bénéficiaire</span>
              <strong className="text-white text-sm font-semibold truncate block">{patientName}</strong>
            </div>
            <div>
              <span className="text-teal-300 block text-[10px] uppercase">Montant Encaissé</span>
              <strong className="text-emerald-400 text-sm font-black">{completedTransaction.amount.toLocaleString("fr-FR")} FCFA</strong>
            </div>
            <div>
              <span className="text-teal-300 block text-[10px] uppercase">Caisse Mode</span>
              <strong className="text-white text-sm font-semibold">{completedTransaction.paymentMethod === "CASH" ? "Espèces (CASH)" : "Électronique / Autre"}</strong>
            </div>
          </div>
        </div>

        {/* Action Panel: One screen, Side-by-Side modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Module 1: IMPRESSION */}
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="h-10 w-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Printer className="h-5 w-5" />
              </div>
              <h3 className="font-sans font-bold text-gray-900 text-sm mt-3">Option 1 : Impression Reçu</h3>
              <p className="text-xs text-gray-400 mt-1">Générez instantanément des copies papiers conformes pour le patient ou l'archivage local.</p>
              
              <div className="mt-4 space-y-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Sélectionnez le Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['A4', 'A5', 'THERMAL'] as const).map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setPrintFormat(fmt)}
                      className={`text-xs py-1.5 px-2 rounded-xl border text-center transition-all font-mono font-bold ${
                        printFormat === fmt 
                          ? 'bg-blue-50 text-blue-700 border-blue-400' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => generatePrintableReceipt(completedTransaction, printFormat)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 font-sans font-bold text-white text-xs rounded-xl shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Printer className="h-4 w-4" /> Lancer l'Impression ({printFormat})
            </button>
          </div>

          {/* Module 2: SMS */}
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="font-sans font-bold text-gray-900 text-sm mt-3">Option 2 : Envoi Alerte SMS</h3>
              <p className="text-xs text-gray-400 mt-1">Expédiez un message de confirmation formaté directement sur le téléphone mobile.</p>

              <div className="mt-3 bg-gray-50 border border-gray-150 p-2.5 rounded-xl">
                <div className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Aperçu du SMS (Prefilled)</div>
                <textarea
                  value={smsDraft}
                  onChange={(e) => setSmsDraft(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 text-xs text-gray-600 font-mono focus:ring-0 leading-relaxed resize-none h-[110px]"
                />
              </div>
              <div className="text-[10px] text-gray-400 mt-1 text-right font-mono font-bold">Destinataire: {patPhone}</div>
            </div>

            <div>
              {smsStatus === 'SENT' ? (
                <div className="w-full py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-xs rounded-xl text-center flex items-center justify-center gap-1">
                  <Check className="h-4 w-4" /> SMS Enregistré & Transmis !
                </div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setSmsStatus('SENDING');
                    await logDispatchAction(completedTransaction.id, completedTransaction.patientId, 'SMS', smsDraft, 'Délivré');
                    setSmsStatus('SENT');
                    setSuccess("Notification SMS émise avec succès.");
                  }}
                  disabled={smsStatus === 'SENDING'}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 font-sans font-bold text-white text-xs rounded-xl shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="h-4 w-4" /> {smsStatus === 'SENDING' ? 'Transmission...' : 'Envoyer par SMS'}
                </button>
              )}
            </div>
          </div>

          {/* Module 3: WHATSAPP */}
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="h-10 w-10 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center text-green-600">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="font-sans font-bold text-gray-900 text-sm mt-3">Option 3 : Envoi WhatsApp</h3>
              <p className="text-xs text-gray-400 mt-1">Ouvrez une discussion pré-remplie sous WhatsApp Web pour l'envoi du justificatif PDF.</p>

              <div className="mt-3 bg-gray-50 border border-gray-150 p-2.5 rounded-xl">
                <div className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Message Préparé</div>
                <textarea
                  value={whatsappDraft}
                  onChange={(e) => setWhatsappDraft(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 text-xs text-gray-600 font-mono focus:ring-0 leading-relaxed resize-none h-[110px]"
                />
              </div>
              <div className="text-[10px] text-gray-400 mt-1 text-right font-mono font-bold">Destinataire: {patPhone}</div>
            </div>

            <div>
              <button
                type="button"
                onClick={async () => {
                  setWhatsappStatus('SENDING');
                  await logDispatchAction(completedTransaction.id, completedTransaction.patientId, 'WHATSAPP', whatsappDraft, 'Délivré');
                  setWhatsappStatus('SENT');
                  
                  // Construct WhatsApp dispatch URL
                  const formattedPhone = patPhone.replace(/\s+/g, "").replace(/\+/g, "");
                  const textEncoded = encodeURIComponent(whatsappDraft);
                  const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${textEncoded}`;
                  window.open(waUrl, "_blank");
                }}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 font-sans font-bold text-white text-xs rounded-xl shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="h-4 w-4" /> Envoyer par WhatsApp
              </button>
            </div>
          </div>

        </div>

        {/* Back / Next actions */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center text-xs text-gray-600">
          <div>
            Souhaitez-vous fermer cet espace de quittance et retourner au registre des facturations ?
          </div>
          <button
            type="button"
            onClick={() => setCompletedTransaction(null)}
            className="px-5 py-2 hover:bg-slate-200 border border-slate-300 text-gray-750 font-bold rounded-xl"
          >
            Nouveau paiement / Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="billing-caise-dashboard">
      {/* Overview Stat Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-medium text-gray-400 uppercase tracking-widest">Encaissé Réel</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {totalRevenue.toLocaleString("fr-FR")} FCFA
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Fonds validés en caisse</p>
          </div>
          <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <BadgeDollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-medium text-gray-400 uppercase tracking-widest">Recettes En Attente</span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {pendingRevenue.toLocaleString("fr-FR")} FCFA
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Factures émises non payées</p>
          </div>
          <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-medium text-gray-400 uppercase tracking-widest">Total Facturé</span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {totalInvoiced.toLocaleString("fr-FR")} FCFA
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Volume global d'actes</p>
          </div>
          <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-gray-600">
            <Percent className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Module Prescriptions de Laboratoire en Attente de Caisse */}
      {labTests.filter(t => t.status === "PENDING_PAYMENT").length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-6 overflow-hidden animate-fade-in" id="cashier-lab-prescriptions-alert-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3.5 border-b border-gray-100 gap-4">
            <div>
              <h3 className="font-sans font-bold text-amber-950 text-sm flex items-center">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping mr-2" />
                🔬 Analyses de Laboratoire en Attente de Règlement ({labTests.filter(t => t.status === "PENDING_PAYMENT").length})
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Le médecin a requis ces examens biologiques. Veuillez enregistrer le règlement en caisse pour engager les analyses.</p>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-100">
              Analyses non-réglées
            </span>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-150 text-gray-400 font-mono uppercase tracking-wider">
                  <th className="pb-2 font-normal">Patient</th>
                  <th className="pb-2 font-normal">Examen prescrit</th>
                  <th className="pb-2 font-normal">Prescripteur</th>
                  <th className="pb-2 font-normal text-right">Tarif Public</th>
                  <th className="pb-2 font-normal text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {labTests.filter(t => t.status === "PENDING_PAYMENT").map((test: any) => {
                  const pat = patients.find(p => p.id === test.patientId);
                  
                  // Parse test price
                  let testPrice = 5000;
                  try {
                    const r = test.results ? JSON.parse(test.results) : {};
                    testPrice = r.price || 5000;
                  } catch (e) {}

                  return (
                    <tr key={test.id} className="hover:bg-amber-50/10 transition-colors">
                      <td className="py-3 font-semibold text-gray-900">
                        {pat ? `${pat.lastName.toUpperCase()} ${pat.firstName}` : "Patient de passage"}
                      </td>
                      <td className="py-3 font-medium text-gray-800">
                        {test.testName} <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-1.5 py-0.2 rounded font-mono uppercase font-bold ml-1.5">{test.category}</span>
                      </td>
                      <td className="py-3 text-gray-500 font-mono">Dr. {test.requestedBy}</td>
                      <td className="py-3 text-right font-black font-sans text-gray-950">
                        {testPrice.toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPayingLabTestId(test.id);
                            setFormData({
                              patientId: test.patientId,
                              type: "INVOICE",
                              amount: testPrice,
                              paymentMethod: "CASH",
                              description: `Règlement Analyse Biologique: ${test.testName} (Prescrit par Dr. ${test.requestedBy})`,
                              status: "PAID"
                            });
                            setShowAddForm(true);
                            // Scroll to form smoothly
                            document.getElementById("billing-caise-dashboard")?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 font-bold text-white text-[11px] rounded-xl transition-colors cursor-pointer shadow-sm"
                        >
                          Générer encaissement
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Billing Table card */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-sans font-bold text-xl text-gray-900 flex items-center">
              <HandCoins className="h-5 w-5 text-teal-600 mr-2" />
              Facturation & Caisse Établissement
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Émission de factures cliniques, encaissement de mobiles-money, assurances et guichet de pharmacie.
            </p>
          </div>
          {(userRole === "CASHIER" || userRole === "ADMIN") && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm duration-150 cursor-pointer"
              id="new-invoice-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Émettre une Facture / Reçu
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="p-6 bg-slate-50 border-b border-gray-100 animate-fade-in" id="billing-form">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-teal-600" /> Établir une Facture Multi-Lignes & Prestations Detayées
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Associer à un Patient */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                    1. Patient Bénéficiaire <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.patientId}
                    onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 ring-teal-700/50 rounded-xl text-xs focus:ring-2 focus:outline-none transition-all font-medium text-gray-800"
                  >
                    <option value="">-- Sélectionner le patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.lastName.toUpperCase()} {p.firstName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Catégorie / Motif de consultation */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                    2. Type de Motif principal <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => {
                      const cat = e.target.value as any;
                      setCategory(cat);
                      if (cat === "CONSULTATION") {
                        setItems([{ name: "Consultation Médecin Généraliste", quantity: 1, price: 5000 }]);
                      } else if (cat === "LAB") {
                        setItems([{ name: "Analyse NFS (Numération Formule Sanguine)", quantity: 1, price: 6000 }]);
                      } else if (cat === "IMAGING") {
                        setItems([{ name: "Échographie Abdomino-pelvienne", quantity: 1, price: 15000 }]);
                      } else if (cat === "HOSPITALIZATION") {
                        setItems([{ name: "Frais de Séjour / Nuitée d'Hospitalisation", quantity: 1, price: 15000 }]);
                      } else if (cat === "PHARMACY") {
                        setItems([{ name: "Amoxicilline 500mg Gélules (Boîte)", quantity: 2, price: 1500 }]);
                      } else {
                        setItems([{ name: "Ouverture & Création de Dossier Clinique", quantity: 1, price: 1000 }]);
                      }
                    }}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 ring-teal-700/50 rounded-xl text-xs focus:ring-2 focus:outline-none transition-all font-medium text-gray-800"
                  >
                    <option value="CONSULTATION">Consultation Médicale (Générale/Spécialisée)</option>
                    <option value="LAB">Analyses Cliniques (Laboratoire)</option>
                    <option value="IMAGING">Imagerie Médicale (Radio/Écho/Scanner)</option>
                    <option value="HOSPITALIZATION">Hospitalisation & Séjours</option>
                    <option value="PHARMACY">Pharmacie & Médicaments</option>
                    <option value="OTHER">Autre Prestation Clinique administrative</option>
                  </select>
                </div>

                {/* 3. Mode de Paiement */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                    3. Mode de Règlement
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 ring-teal-700/50 rounded-xl text-xs focus:ring-2 focus:outline-none transition-all font-medium text-gray-800"
                  >
                    <option value="CASH">Espèces (CASH)</option>
                    <option value="MOBILE_MONEY">Orange Money / Moov Money (Sank)</option>
                    <option value="CARD">Carte Bancaire Visa/Mastercard</option>
                    <option value="INSURANCE">Assurance maladie (Prise en charge active)</option>
                  </select>
                </div>
              </div>

              {/* Editable Prestations / Items Table */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                    Détail des Prestations d'actes médicaux :
                  </span>
                  <button
                    type="button"
                    onClick={() => setItems([...items, { name: "", quantity: 1, price: 0 }])}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Ajouter une ligne
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => {
                            const updated = [...items];
                            updated[index].name = e.target.value;
                            setItems(updated);
                          }}
                          placeholder="Libellé de l'acte, consultation, médicament, ou soin ..."
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none font-medium text-gray-800"
                          required
                        />
                      </div>
                      <div className="w-full md:w-24">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => {
                            const updated = [...items];
                            updated[index].quantity = parseInt(e.target.value) || 1;
                            setItems(updated);
                          }}
                          placeholder="Qté"
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs text-center font-bold focus:ring-1 focus:ring-teal-700 focus:outline-none text-gray-800"
                        />
                      </div>
                      <div className="w-full md:w-40 flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={e => {
                            const updated = [...items];
                            updated[index].price = parseFloat(e.target.value) || 0;
                            setItems(updated);
                          }}
                          placeholder="Montant U. (FCFA)"
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs text-right font-black focus:ring-1 focus:ring-teal-700 focus:outline-none text-gray-800"
                        />
                        <span className="text-[10px] text-gray-400 font-bold font-mono">FCFA</span>
                      </div>
                      <div className="w-full md:w-36 text-right px-2 hidden md:block">
                        <span className="text-[10px] text-gray-400 block pr-1">Total ligne</span>
                        <span className="text-xs font-extrabold text-slate-800 font-mono">
                          {(item.quantity * item.price).toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (items.length > 1) {
                            setItems(items.filter((_, i) => i !== index));
                          } else {
                            setItems([{ name: "", quantity: 1, price: 0 }]);
                          }
                        }}
                        className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-100 self-center"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom section: grand total card & control buttons */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200">
                <div className="bg-teal-900 border border-teal-950 p-3.5 px-6 rounded-2xl text-white flex items-center gap-4 w-full md:w-auto">
                  <div className="h-10 w-10 bg-teal-850 border border-teal-750 rounded-xl flex items-center justify-center text-teal-300">
                    <BadgeDollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-teal-200/80 tracking-widest block font-sans">Montant Total Global</span>
                    <strong className="text-xl font-black font-sans text-emerald-300 font-mono">
                      {items.reduce((acc, it) => acc + (it.quantity * it.price), 0).toLocaleString("fr-FR")} {clinic?.currency || "FCFA"}
                    </strong>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="h-11 px-3 bg-white border border-gray-250 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none font-bold text-gray-700"
                  >
                    <option value="PAID">Payé d'avance (Encaissement complet)</option>
                    <option value="UNPAID">Non Payé (Dette / Prise en charge)</option>
                    <option value="PARTIAL">Paiement Partiel (Accompte requis)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2.5 border border-gray-300 text-gray-750 text-xs font-semibold rounded-xl hover:bg-white cursor-pointer transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-white bg-teal-700 hover:bg-teal-800 text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    Enregistrer la Facture & Valider
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Feedback indicators */}
        {error && (
          <div className="p-4 mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center">
            <ShieldAlert className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 mx-6 mt-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center">
            <Check className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        {/* Transactions Table */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-10 font-mono text-sm text-gray-400">Loading ledger transaction list...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Aucune facture ou reçu n'a encore été émis aujourd'hui.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="billing-ledger-table">
                <thead>
                  <tr className="border-b border-gray-150 text-gray-400 text-xs font-mono uppercase tracking-wider">
                    <th className="py-3 px-4 font-normal"> Patient</th>
                    <th className="py-3 px-4 font-normal">Désignation</th>
                    <th className="py-3 px-4 font-normal">Montant</th>
                    <th className="py-3 px-4 font-normal font-mono">Paiement</th>
                    <th className="py-3 px-4 font-normal">État Facture</th>
                    <th className="py-3 px-4 font-normal">Encaissé Par</th>
                    <th className="py-3 px-4 text-right">Actions caisse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {transactions.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {getPatientName(item.patientId)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-medium">
                        {item.description}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-950">
                        {item.amount.toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 rounded bg-slate-100 border border-gray-200 text-xs text-gray-600 font-mono font-semibold uppercase">
                          {item.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.status === "PAID" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Encaissé
                          </span>
                        ) : item.status === "UNPAID" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Impayé
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Partiel
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 font-medium">
                        {item.cashierName}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.status !== "PAID" && (userRole === "CASHIER" || userRole === "ADMIN") ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateStatus(item.id, "PAID")}
                              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Valider Caisse (Reçu)
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(item.id, "PARTIAL")}
                              className="px-2 py-1 border border-amber-300 text-amber-800 hover:bg-amber-50 rounded-lg text-xs font-medium cursor-pointer"
                            >
                              Partiel
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono font-medium">Archivé</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
