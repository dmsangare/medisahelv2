import React, { useState, useEffect, useRef } from "react";
import { 
  Pill, Plus, Search, Check, ShieldAlert, ArrowUpRight, ShieldCheck, 
  AlertTriangle, FileText, ShoppingCart, RefreshCw, BarChart3, Truck, 
  ClipboardList, Trash2, Download, Printer, User, Award, Tag, 
  Calendar, Layers, HardDrive, DollarSign, ExternalLink, HelpCircle, 
  UserCheck, CheckSquare, Upload, FileSignature, ChevronRight, Store
} from "lucide-react";

interface PharmacyStockProps {
  token: string | null;
  userRole: string; // PHARMACIST, ADMIN, GESTIONNAIRE_STOCK, CAISSIER_PHARMACIEN, etc.
}

export const PharmacyStock: React.FC<PharmacyStockProps> = ({ token, userRole }) => {
  // Tabs: dashboard, inventory, pos, prescriptions, logistics, adjustments, alerts, reports
  const [activeTab, setActiveTab] = useState<string>(
    userRole === "CAISSIER_PHARMACIEN" ? "pos" : "dashboard"
  );

  // Main list data
  const [products, setProducts] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);

  // Helpers
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New Supplier states
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [supForm, setSupForm] = useState({ name: "", contactName: "", phone: "", email: "", address: "" });

  // New Inventory states
  const [inventoryType, setInventoryType] = useState<string>("ANNUEL");
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [inventorySignatory, setInventorySignatory] = useState<string>("");
  const [printInventory, setPrintInventory] = useState<any | null>(null);

  // Search queries
  const [searchQuery, setSearchQuery] = useState("");
  const [posSearchQuery, setPosSearchQuery] = useState("");

  // POS / Cash Register State
  const [cart, setCart] = useState<any[]>([]);
  const [posPatientName, setPosPatientName] = useState("");
  const [posPatientId, setPosPatientId] = useState("");
  const [posDiscount, setPosDiscount] = useState(0);
  const [posInsuranceRate, setPosInsuranceRate] = useState(0); // 0% means self-pay, e.g. 70 means 70% paid by insurer
  const [posPaymentMethod, setPosPaymentMethod] = useState("CASH");
  const [printReceipt, setPrintReceipt] = useState<any | null>(null);

  // Forms modals/expand states
  const [showProductForm, setShowProductForm] = useState(false);
  const [showLotIntakeForm, setShowLotIntakeForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [targetTransferLot, setTargetTransferLot] = useState<any | null>(null);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [targetAdjustmentLot, setTargetAdjustmentLot] = useState<any | null>(null);

  // Dropzone simulate state
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detailed Forms input values
  const [prodForm, setProdForm] = useState({
    codeInterne: "",
    codeBarre: "",
    dci: "",
    nomCommercial: "",
    forme: "",
    dosage: "",
    category: "",
    supplier: "",
    priceAchat: 0,
    priceVente: 0,
    stockMin: 10,
    stockMax: 500,
    imageUrl: ""
  });

  const [lotForm, setLotForm] = useState({
    productId: "",
    lotNumber: "",
    dateFabrication: "",
    datePeremption: "",
    qtyRecue: 0,
    qtyRemainingDepot: 0,
    qtyRemainingOfficine: 0,
    supplier: "",
    priceAchat: 0
  });

  const [trfForm, setTrfForm] = useState({
    productId: "",
    lotId: "",
    quantity: 0
  });

  const [adjForm, setAdjForm] = useState({
    productId: "",
    lotId: "",
    type: "CASSE", // CASSE, PERTE, VOL, AJUSTEMENT
    quantity: 0,
    reason: "",
    targetStore: "OFFICINE", // DEPOT or OFFICINE
    signature: ""
  });

  // Load everything on start
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [pRes, lRes, tRes, sRes, supRes, aRes, alRes, prRes] = await Promise.all([
        fetch("/api/pharmacy/products", { headers }),
        fetch("/api/pharmacy/lots", { headers }),
        fetch("/api/pharmacy/transfers", { headers }),
        fetch("/api/pharmacy/sales", { headers }),
        fetch("/api/pharmacy/suppliers", { headers }),
        fetch("/api/pharmacy/adjustments", { headers }),
        fetch("/api/pharmacy/alerts", { headers }),
        fetch("/api/pharmacy/prescriptions", { headers })
      ]);

      if (pRes.ok) setProducts(await pRes.json());
      if (lRes.ok) setLots(await lRes.json());
      if (tRes.ok) setTransfers(await tRes.json());
      if (sRes.ok) setSales(await sRes.json());
      if (supRes.ok) setSuppliers(await supRes.json());
      if (aRes.ok) setAdjustments(await aRes.json());
      if (alRes.ok) setAlerts(await alRes.json());
      if (prRes.ok) setPrescriptions(await prRes.json());

      let invList: any[] = [];
      if (userRole !== "CAISSIER_PHARMACIEN") {
        try {
          const invRes = await fetch("/api/pharmacy/inventories", { headers });
          if (invRes.ok) invList = await invRes.json();
        } catch (e) {}
      }
      setInventories(invList);
    } catch (err: any) {
      setError("Erreur réseau lors de la récupération des données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, activeTab]);

  // Helper mapping values
  const getProductObj = (id: string) => products.find(p => p.id === id);
  const getLotObj = (id: string) => lots.find(l => l.id === id);

  // Submit Product Create
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.nomCommercial || !prodForm.dci || prodForm.priceVente <= 0) {
      setError("Nom commercial, DCI et Prix de vente requis.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/pharmacy/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(prodForm)
      });
      if (!res.ok) throw new Error((await res.json()).error || "Impossible de créer le médicament");
      setSuccess("Médicament enregistré avec succès.");
      setProdForm({
        codeInterne: "", codeBarre: "", dci: "", nomCommercial: "", forme: "",
        dosage: "", category: "", supplier: "", priceAchat: 0, priceVente: 0,
        stockMin: 10, stockMax: 500, imageUrl: ""
      });
      setShowProductForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Submit Lot Intake (Double-Entry Log)
  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotForm.productId || !lotForm.lotNumber || lotForm.qtyRecue <= 0 || !lotForm.datePeremption) {
      setError("Médicament, Numéro de lot, Quantité et Date de péremption requis.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const payload = {
        ...lotForm,
        qtyRemainingDepot: Number(lotForm.qtyRecue),
        qtyRemainingOfficine: 0, // goes to Depot Central first!
        attachmentName: uploadedFileName || null
      };

      const res = await fetch("/api/pharmacy/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.json()).error || "Impossible de consigner ce lot");
      setSuccess("Bon de livraison enregistré & stock central incrémenté !");
      setLotForm({
        productId: "", lotNumber: "", dateFabrication: "", datePeremption: "",
        qtyRecue: 0, qtyRemainingDepot: 0, qtyRemainingOfficine: 0, supplier: "", priceAchat: 0
      });
      setShowLotIntakeForm(false);
      setUploadedFileName("");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Execute Depot -> Officine Transfer
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(trfForm.quantity);
    if (!trfForm.productId || !trfForm.lotId || qty <= 0) {
      setError("Veuillez sélectionner un lot valide et une quantité positive.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/pharmacy/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(trfForm)
      });
      if (!res.ok) throw new Error((await res.json()).error || "Échec d'exécution du transfert.");
      setSuccess(`Transfert validé ! ${qty} boîtes déplacées à l'officine.`);
      setShowTransferForm(false);
      setTargetTransferLot(null);
      setTrfForm({ productId: "", lotId: "", quantity: 0 });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Execute Stock Adjustment (stolen, loss, break)
  const handleExecuteAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjForm.productId || !adjForm.lotId || adjForm.quantity <= 0 || !adjForm.reason || !adjForm.signature) {
      setError("Veuillez remplir tous les champs requis, y compris la signature.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/pharmacy/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(adjForm)
      });
      if (!res.ok) throw new Error((await res.json()).error || "Échec d'enregistrement de la perte");
      setSuccess("Ajustement de démarque consignée avec traçabilité.");
      setShowAdjustmentForm(false);
      setTargetAdjustmentLot(null);
      setAdjForm({ productId: "", lotId: "", type: "CASSE", quantity: 0, reason: "", targetStore: "OFFICINE", signature: "" });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // POS Inventory Checkout
  const handlePOSCheckout = async () => {
    if (cart.length === 0) {
      setError("Le chariot est vide.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const payload = {
        patientId: posPatientId,
        patientName: posPatientName || "Client Anonyme / Comptoir",
        discount: Number(posDiscount),
        insuranceContribution: Math.round(cart.reduce((sum, item) => sum + (item.priceVente * item.quantity), 0) * (posInsuranceRate / 100)),
        paymentMethod: posPaymentMethod,
        items: cart.map(c => ({
          productId: c.productId,
          quantity: c.quantity
        }))
      };

      const res = await fetch("/api/pharmacy/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.json()).error || "Échec d'enregistrement de la vente");
      
      const finishedSale = await res.json();
      setPrintReceipt(finishedSale);
      setSuccess("Vente d'officine validée et déstockée en FEFO !");
      setCart([]);
      setPosPatientName("");
      setPosPatientId("");
      setPosDiscount(0);
      setPosInsuranceRate(0);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Synchronised DME Prescription Serve
  const handleServePrescription = async (presc: any) => {
    setError("");
    setSuccess("");
    try {
      // Build list of medications to dispense based on stock matching
      // Match clinical name with local products DCI or comercial names
      const dispensedMedications = presc.medications.map((m: any) => {
        // Try searching our products list
        const match = products.find(p => p.nomCommercial.toLowerCase().includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(p.nomCommercial.toLowerCase()) || p.dci.toLowerCase().includes(m.name.toLowerCase()));
        return {
          productId: match ? match.id : "unknown",
          name: m.name,
          quantityRequired: m.qtyRequired,
          quantityDelivered: m.qtyRequired, // serve full by default
          price: match ? match.priceVente : 0
        };
      });

      // Prepare items list for FEFO destocking sale
      const matchableItems = dispensedMedications.filter((d: any) => d.productId !== "unknown");
      
      if (matchableItems.length > 0) {
        // Perform standard POS sale on behalf of this patient
        const totalCost = matchableItems.reduce((acc: number, d: any) => acc + (d.price * d.quantityDelivered), 0);
        const salePayload = {
          patientId: presc.patientId,
          patientName: presc.patientName,
          discount: 0,
          insuranceContribution: 0,
          paymentMethod: "CASH",
          items: matchableItems.map((m: any) => ({
            productId: m.productId,
            quantity: m.quantityDelivered
          }))
        };

        const resSale = await fetch("/api/pharmacy/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(salePayload)
        });
        
        if (!resSale.ok) {
          throw new Error("L'officine de pharmacie ne dispose pas de stock suffisant pour honorer cette ordonnance médicale.");
        }
      }

      // Mark prescription as officially served and backsync documentation to Patient consult register notes
      const res = await fetch(`/api/pharmacy/prescriptions/${presc.id}/serve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          dispensedMedications: dispensedMedications.map((m: any) => ({
            name: m.name,
            quantityDelivered: m.quantityDelivered
          }))
        })
      });

      if (!res.ok) throw new Error("Échec d'enregistrement sur le serveur clinique.");
      setSuccess(`Ordonnance clinique de ${presc.patientName} honorée, facturée et délivrée !`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Add Item to cart
  const addToCart = (product: any) => {
    if (product.quantityOfficine <= 0) {
      setError(`Stock insuffisant en officine pour ${product.nomCommercial}! Effectuer d'abord un transfert depuis le dépôt central.`);
      return;
    }
    const exists = cart.find(c => c.productId === product.id);
    if (exists) {
      if (exists.quantity >= product.quantityOfficine) {
        setError(`Alerte : Limite maximale de stock officine (${product.quantityOfficine} unités) atteinte pour ce produit.`);
        return;
      }
      setCart(cart.map(c => c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { productId: product.id, nomCommercial: product.nomCommercial, priceVente: product.priceVente, quantity: 1, limit: product.quantityOfficine }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.productId !== productId));
  };

  const updateCartQuantity = (productId: string, val: number) => {
    const target = cart.find(c => c.productId === productId);
    if (!target) return;
    const finalVal = Math.max(1, Math.min(target.limit, val));
    setCart(cart.map(c => c.productId === productId ? { ...c, quantity: finalVal } : c));
  };

  // File Upload drag 'n drop simulator
  const triggerFileSelector = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFileName(e.target.files[0].name);
    }
  };

  // Reports data triggers
  const getDailySalesTotal = () => {
    return sales.reduce((sum, s) => sum + (s.total || s.amountPaid), 0);
  };

  const getTheoreticalMargin = () => {
    // computes sales total public and purchases total inside batches
    let salesPub = 0;
    let purchaseCost = 0;
    sales.forEach((s: any) => {
      salesPub += s.total;
      s.items.forEach((item: any) => {
        const prod = getProductObj(item.productId);
        if (prod) {
          purchaseCost += (prod.priceAchat || (prod.priceVente * 0.5)) * item.quantity;
        }
      });
    });
    return salesPub - purchaseCost;
  };

  // CSV Report Generator
  const downloadReportsCSV = () => {
    const headers = ["ID Vente", "Patient", "Date de Vente", "Total Public (FCFA)", "Rabais (FCFA)", "Part Assurance (FCFA)", "Versement Total Spécifique (FCFA)", "Mode de Règlement"];
    const rows = sales.map((s: any) => [
      s.id,
      s.patientName,
      new Date(s.date).toLocaleDateString("fr-FR"),
      s.total,
      s.discount,
      s.insuranceContribution,
      s.amountPaid,
      s.paymentMethod
    ]);

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rapport_Ventes_Pharmacie_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const handlePrint = (elementId: string) => {
    const printableContent = document.getElementById(elementId)?.innerHTML;
    if (!printableContent) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Impression Clinique MédiSahel</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; padding: 24px; color: #000; font-size: 13px; line-height: 1.4; }
              hr { border: none; border-top: 1px dashed #000; margin: 12px 0; }
              .text-center { text-align: center; }
              .flex-between { display: flex; justify-content: space-between; }
              .bold { font-weight: bold; }
            </style>
          </head>
          <body>
            ${printableContent}
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Filter products by search term
  const filteredProducts = products.filter(p => {
    const term = searchQuery.toLowerCase();
    return p.nomCommercial.toLowerCase().includes(term) || p.dci.toLowerCase().includes(term) || p.codeBarre.includes(term) || p.category.toLowerCase().includes(term);
  });

  // KPI Calculations
  const stockDepotTot = lots.reduce((sum, l) => sum + (l.qtyRemainingDepot || 0), 0);
  const stockOfficineTot = lots.reduce((sum, l) => sum + (l.qtyRemainingOfficine || 0), 0);
  const totalInRupture = products.filter(p => p.quantityOfficine + p.quantityDepot === 0).length;
  const totalCritique = products.filter(p => p.quantityOfficine + p.quantityDepot > 0 && p.quantityOfficine + p.quantityDepot <= p.stockMin).length;
  const expiredCount = alerts.filter(al => al.type === "EXPIRED" && al.status === "ACTIVE").length;

  return (
    <div className="bg-[#f8fafc] p-1 md:p-6 rounded-2xl border border-slate-200" id="pharmacy-system-root">
      
      {/* Header Clinical Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
              <Pill className="h-6 w-6 text-teal-700" />
            </div>
            <div>
              <h1 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
                PharmaDash Clinique V2
                <span className="text-[10px] select-none uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 animate-pulse">
                  Connecté DME
                </span>
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Terminal d'apothicairerie hospitalière, gestion de stock FEFO, dispensaire de caisse et audit de conformité intégrés.
              </p>
            </div>
          </div>
        </div>

        {/* Roles Badging */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="font-mono text-slate-600">Session : <strong className="text-slate-900">{userRole}</strong></span>
          <span className="text-slate-350">|</span>
          <span className="text-slate-500 font-mono">BAMAKO DEPO01</span>
        </div>
      </div>

      {/* Main Alerts Banner */}
      {alerts.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-sans font-bold text-sm text-red-900">Alerte Pharmacovigilance & Sécurité Périssable ({alerts.length})</h4>
            <p className="text-xs text-red-700 mt-1 max-w-4xl">
              Des lots de médicaments ont expiré ou approchent la date de péremption requise. Veuillez vérifier la conformité avec les réglementations du Ministère de la Santé du Mali.
            </p>
            <div className="flex gap-4 mt-3">
              <button 
                onClick={() => { setActiveTab("alerts"); }} 
                className="inline-flex items-center text-xs font-bold text-red-800 underline hover:text-red-900"
              >
                Inspecter et détruire les lots périmés
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub tabs navigation */}
      <div className="mb-6 border-b border-slate-200 flex overflow-x-auto gap-2 py-1 scrollbar-none">
        {[
          { tab: "dashboard", label: "Tableau de Bord", icon: BarChart3, roles: ["ADMIN", "PHARMACIST", "GESTIONNAIRE_STOCK"] },
          { tab: "inventory", label: "Stock Central & Officine", icon: Layers, roles: ["ADMIN", "PHARMACIST", "GESTIONNAIRE_STOCK", "CAISSIER_PHARMACIEN"] },
          { tab: "pos", label: "Caisse & Vente POS", icon: ShoppingCart, roles: ["ADMIN", "PHARMACIST", "CAISSIER_PHARMACIEN"] },
          { tab: "prescriptions", label: "Ordonnances DME", icon: ClipboardList, roles: ["ADMIN", "PHARMACIST", "CAISSIER_PHARMACIEN"] },
          { tab: "logistics", label: "Entrées & Logistique", icon: Truck, roles: ["ADMIN", "PHARMACIST", "GESTIONNAIRE_STOCK"] },
          { tab: "adjustments", label: "Pertes & Démarque", icon: AlertTriangle, roles: ["ADMIN", "PHARMACIST", "GESTIONNAIRE_STOCK"] },
          { tab: "alerts", label: "Alertes Péremption", icon: ShieldAlert, roles: ["ADMIN", "PHARMACIST", "GESTIONNAIRE_STOCK"] },
          { tab: "suppliers", label: "Fournisseurs", icon: Truck, roles: ["ADMIN", "PHARMACIST", "GESTIONNAIRE_STOCK"] },
          { tab: "inventories", label: "Inventaires Clinique", icon: CheckSquare, roles: ["ADMIN", "PHARMACIST", "GESTIONNAIRE_STOCK"] },
          { tab: "reports", label: "Rapports d'Activité", icon: FileText, roles: ["ADMIN", "PHARMACIST", "GESTIONNAIRE_STOCK", "CAISSIER_PHARMACIEN"] },
        ].filter(t => !t.roles || t.roles.includes(userRole)).map((btn) => {
          const IconComponent = btn.icon;
          const isActive = activeTab === btn.tab;
          return (
            <button
              key={btn.tab}
              onClick={() => {
                setActiveTab(btn.tab);
                setError("");
                setSuccess("");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive 
                  ? "bg-slate-950 text-white shadow-md border border-slate-900" 
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <IconComponent className="h-4 w-4" />
              {btn.label}
              {btn.tab === "prescriptions" && prescriptions.filter(p => p.status === "PENDING").length > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-full bg-teal-500 text-white animate-pulse">
                  {prescriptions.filter(p => p.status === "PENDING").length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-150 text-rose-800 rounded-xl text-xs font-mono">
          🚨 {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-xl text-xs font-mono flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          {success}
        </div>
      )}

      {/* ======================= TAB CONTENT : TABLEAU DE BORD ======================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-6" id="pharmacy-dash-view">
          
          {/* Quick Metrics Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase font-mono">
                <span>Stock Dépôt Central</span>
                <HardDrive className="h-4.5 w-4.5 text-indigo-500" />
              </div>
              <h2 className="text-3xl font-extrabold font-sans text-slate-900 mt-3">{stockDepotTot} <span className="text-xs text-slate-400 font-normal">unités</span></h2>
              <p className="text-[10px] text-slate-400 mt-1">Non-disponible immédiat pour la dispensation comptoir.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase font-mono">
                <span>Stock Officine</span>
                <Store className="h-4.5 w-4.5 text-teal-600" />
              </div>
              <h2 className="text-3xl font-extrabold font-sans text-slate-900 mt-3">{stockOfficineTot} <span className="text-xs text-slate-400 font-normal">unités</span></h2>
              <p className="text-[10px] text-slate-400 mt-1">Disponible pour dispensation de caisse au public.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase font-mono">
                <span>Ruptures & Alertes</span>
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500 animate-bounce" />
              </div>
              <h2 className="text-3xl font-extrabold font-sans text-amber-600 mt-3">{totalInRupture + totalCritique} <span className="text-xs text-slate-400 font-normal">urgences</span></h2>
              <p className="text-[10px] text-slate-400 mt-1">{totalInRupture} ruptures / {totalCritique} stocks critiques.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase font-mono">
                <span>Chiffre Ventes Jour</span>
                <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-extrabold font-sans text-slate-950 mt-3">{getDailySalesTotal().toLocaleString("fr-FR")} <span className="text-xs text-slate-400 font-normal">FCFA</span></h2>
              <p className="text-[10px] text-slate-400 mt-1">Encaissements cumulés de caisse d'officine.</p>
            </div>
          </div>

          {/* Graphics layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* SVG Visual Graphic Chart */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider mb-4 flex items-center justify-between">
                <span>Flux de Consommation Clinique Mensuelle (FCFA)</span>
                <span className="text-xs text-slate-400 font-mono">Jan - Juin 2026</span>
              </h3>
              
              <div className="relative pt-4">
                {/* SVG Pure Chart */}
                <svg className="w-full h-64" viewBox="0 0 600 240">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3"></stop>
                      <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0"></stop>
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="50" y1="30" x2="550" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="50" y1="80" x2="550" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="50" y1="130" x2="550" y2="130" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="50" y1="180" x2="550" y2="180" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="50" y1="210" x2="550" y2="210" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Chart Line Path */}
                  <path 
                    d="M 50,180 C 130,170 170,90 250,70 C 330,60 370,110 450,54 C 530,30 550,40 550,40"
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Gradient fill underneath */}
                  <path 
                    d="M 50,180 C 130,170 170,90 250,70 C 330,60 370,110 450,54 C 530,30 550,40 550,40 L 550,210 L 50,210 Z"
                    fill="url(#chartGrad)"
                  />

                  {/* Bullet points on chart line */}
                  <circle cx="50" cy="180" r="5" fill="#0f766e" stroke="#fff" strokeWidth="2" />
                  <circle cx="150" cy="160" r="5" fill="#0f766e" stroke="#fff" strokeWidth="2" />
                  <circle cx="250" cy="70" r="5" fill="#0f766e" stroke="#fff" strokeWidth="2" />
                  <circle cx="350" cy="85" r="5" fill="#0f766e" stroke="#fff" strokeWidth="2" />
                  <circle cx="450" cy="54" r="5" fill="#0f766e" stroke="#fff" strokeWidth="2" />
                  <circle cx="550" cy="40" r="5" fill="#0f766e" stroke="#fff" strokeWidth="2" />

                  {/* Labels */}
                  <text x="50" y="230" textAnchor="middle" className="text-[10px] font-mono fill-slate-500">Jan</text>
                  <text x="150" y="230" textAnchor="middle" className="text-[10px] font-mono fill-slate-500">Fév</text>
                  <text x="250" y="230" textAnchor="middle" className="text-[10px] font-mono fill-slate-500">Mar</text>
                  <text x="350" y="230" textAnchor="middle" className="text-[10px] font-mono fill-slate-500">Avr</text>
                  <text x="450" y="230" textAnchor="middle" className="text-[10px] font-mono fill-slate-500">Mai</text>
                  <text x="550" y="230" textAnchor="middle" className="text-[10px] font-mono fill-slate-500">Juin</text>

                  {/* Y-axis metrics values label details */}
                  <text x="40" y="34" className="text-[9px] font-mono fill-slate-400" textAnchor="end">2.5M</text>
                  <text x="40" y="84" className="text-[9px] font-mono fill-slate-400" textAnchor="end">1.5M</text>
                  <text x="40" y="134" className="text-[9px] font-mono fill-slate-400" textAnchor="end">800K</text>
                  <text x="40" y="184" className="text-[9px] font-mono fill-slate-400" textAnchor="end">100K</text>
                </svg>
              </div>
            </div>

            {/* Quick action list & system logs summary */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm justify-between flex flex-col">
              <div>
                <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider mb-4">
                  Actions Rapides
                </h3>
                <div className="space-y-2.5">
                  <button 
                    onClick={() => { setActiveTab("pos"); }}
                    className="w-full inline-flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs font-semibold text-slate-800"
                  >
                    <span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-emerald-600" /> Ouvrir la Caisse POS</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => { setActiveTab("prescriptions"); }}
                    className="w-full inline-flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs font-semibold text-slate-800"
                  >
                    <span className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-teal-600" /> Servir Ordonnances DME</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => { setActiveTab("logistics"); }}
                    className="w-full inline-flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs font-semibold text-slate-800"
                  >
                    <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-indigo-600" /> Entrée de Stock & Lots</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => { setActiveTab("adjustments"); }}
                    className="w-full inline-flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs font-semibold text-slate-800"
                  >
                    <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-rose-600" /> Signaler Casse / Vol</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 text-[11px] text-slate-400 font-mono">
                Dernière reconnexion synchrone au registre national des assurances : OK.
              </div>
            </div>
          </div>

          {/* Top drugs and near stock outs lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider mb-4 flex items-center gap-2">
                <Store className="h-4 w-4 text-teal-600" />
                Alertes de rupture officine immédiates
              </h3>
              <div className="space-y-3">
                {products.filter(p => p.quantityOfficine <= p.stockMin).slice(0, 4).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-slate-700 text-xs">
                    <div>
                      <strong className="text-slate-900 block">{p.nomCommercial}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">{p.dci}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-700 block">{p.quantityOfficine} restants</span>
                      <button 
                        onClick={() => { 
                          setTrfForm({ productId: p.id, lotId: "", quantity: 0 });
                          setActiveTab("logistics");
                        }} 
                        className="text-[9px] font-extrabold uppercase text-slate-800 underline bg-transparent"
                      >
                        Réapprovisionner
                      </button>
                    </div>
                  </div>
                ))}
                {products.filter(p => p.quantityOfficine <= p.stockMin).length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400 font-mono">
                    Aucun médicament sous le seuil critique d'officine.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider mb-4 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                Index d'expiration critique des lots
              </h3>
              <div className="space-y-3">
                {lots.filter(l => {
                  const days = Math.ceil((new Date(l.datePeremption).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  return days < 90;
                }).slice(0, 4).map((l: any) => {
                  const prod = getProductObj(l.productId);
                  const isExpired = new Date(l.datePeremption).getTime() < new Date().getTime();
                  return (
                    <div key={l.id} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${isExpired ? "bg-red-50 border-red-150 text-red-800" : "bg-orange-50 border-orange-100 text-orange-900"}`}>
                      <div>
                        <strong className="text-slate-900 block">{prod ? prod.nomCommercial : "Produit"}</strong>
                        <span className="text-[10px] font-mono">Lot: {l.lotNumber} | Expire: {l.datePeremption}</span>
                      </div>
                      <span className="font-bold text-right">
                        {isExpired ? "PÉRIMÉ !" : "Critique"}
                      </span>
                    </div>
                  );
                })}
                {lots.filter(l => {
                  const days = Math.ceil((new Date(l.datePeremption).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  return days < 90;
                }).length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400 font-mono">
                    Aucun lot en état d'expiration proche.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ======================= TAB CONTENT : GESTION INVENTAIRE DU STOCK ======================= */}
      {activeTab === "inventory" && (
        <div className="space-y-6" id="pharmacy-stock-list">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              
              {/* Product search box */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par DCI, marque commercial, code barre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-slate-50 text-xs"
                />
              </div>

              <div className="flex gap-2">
                {(userRole === "ADMIN" || userRole === "PHARMACIST" || userRole === "GESTIONNAIRE_STOCK") && (
                  <button
                    onClick={() => { setShowProductForm(!showProductForm); }}
                    className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Créer Fiche Médicament
                  </button>
                )}
              </div>
            </div>

            {/* Expansible Product Creation Block */}
            {showProductForm && (
              <form onSubmit={handleCreateProduct} className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider">
                  Nouveau Référentiel Médicament
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase">Code Interne</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. P006"
                      value={prodForm.codeInterne}
                      onChange={e => setProdForm({...prodForm, codeInterne: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase">Code Barre (SKU)</label>
                    <input
                      type="text"
                      required
                      placeholder="Frapper avec douche douchette"
                      value={prodForm.codeBarre}
                      onChange={e => setProdForm({...prodForm, codeBarre: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase">Dénomination Commune (DCI) / Molécule</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Paracétamol"
                      value={prodForm.dci}
                      onChange={e => setProdForm({...prodForm, dci: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase">Nom Commercial (Marque)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Doliprane"
                      value={prodForm.nomCommercial}
                      onChange={e => setProdForm({...prodForm, nomCommercial: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase">Forme pharmaceutique</label>
                    <input
                      type="text"
                      placeholder="e.g. Comprimé dispersible, Sirop, Gel"
                      value={prodForm.forme}
                      onChange={e => setProdForm({...prodForm, forme: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 1000mg, 50ml"
                      value={prodForm.dosage}
                      onChange={e => setProdForm({...prodForm, dosage: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase">Catégorie Thérapeutique</label>
                    <input
                      type="text"
                      placeholder="e.g. Antibiotique"
                      value={prodForm.category}
                      onChange={e => setProdForm({...prodForm, category: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase">Fournisseur</label>
                    <input
                      type="text"
                      placeholder="e.g. Laborex Mali"
                      value={prodForm.supplier}
                      onChange={e => setProdForm({...prodForm, supplier: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase">Prix Achat Estimé (FCFA)</label>
                    <input
                      type="number"
                      value={prodForm.priceAchat}
                      onChange={e => setProdForm({...prodForm, priceAchat: Number(e.target.value)})}
                      className="w-full mt-1 px-3 py-2 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase">Prix Public Vente (FCFA)</label>
                    <input
                      type="number"
                      required
                      value={prodForm.priceVente}
                      onChange={e => setProdForm({...prodForm, priceVente: Number(e.target.value)})}
                      className="w-full mt-1 px-3 py-2 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-250 hover:bg-slate-100 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl cursor-pointer"
                  >
                    Confirmer Fiche
                  </button>
                </div>
              </form>
            )}

            {/* Inventory table block */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                    <th className="py-3 px-3">Nom Commercial & DCI</th>
                    <th className="py-3 px-3">Code Interne</th>
                    <th className="py-3 px-3">Doc / Forme</th>
                    <th className="py-3 px-3">Prix Vente</th>
                    <th className="py-3 px-3 text-center">Dépôt Central</th>
                    <th className="py-3 px-3 text-center">Officine Vente</th>
                    <th className="py-3 px-3 text-center">Total Clinique</th>
                    <th className="py-3 px-3 text-right">Actions logistiques</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredProducts.map((p: any) => {
                    const isMin = p.quantityOfficine + p.quantityDepot <= p.stockMin;
                    const isOut = p.quantityOfficine + p.quantityDepot === 0;
                    return (
                      <React.Fragment key={p.id}>
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-3">
                            <strong className="text-slate-950 font-bold block">{p.nomCommercial}</strong>
                            <span className="text-[10px] text-slate-500 font-mono italic">{p.dci}</span>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-500">{p.codeInterne || p.codeBarre}</td>
                          <td className="py-3.5 px-3 text-slate-600">{p.forme} ({p.dosage})</td>
                          <td className="py-3.5 px-3 font-semibold text-slate-900">{p.priceVente.toLocaleString("fr-FR")} FCFA</td>
                          <td className="py-3.5 px-3 text-center font-bold text-indigo-800">{p.quantityDepot} u</td>
                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-xl font-bold ${isOut ? "bg-red-100 text-red-900 border border-red-200" : isMin ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-teal-50 text-teal-800"}`}>
                              {p.quantityOfficine} u
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-extrabold text-slate-900 bg-slate-50/50">
                            {p.quantity} u
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setActiveTab("pos");
                                  addToCart(p);
                                }}
                                className="px-2 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-lg font-bold text-[10px]"
                                title="Ajouter à la Caisse"
                              >
                                Dispenser
                              </button>
                              
                              <button
                                onClick={() => {
                                  // Locate lot with largest depot quantity to prompt transfer
                                  const matchingLots = lots.filter(l => l.productId === p.id && l.qtyRemainingDepot > 0);
                                  if (matchingLots.length > 0) {
                                    setTrfForm({ productId: p.id, lotId: matchingLots[0].id, quantity: matchingLots[0].qtyRemainingDepot });
                                    setTargetTransferLot(matchingLots[0]);
                                    setActiveTab("logistics");
                                  } else {
                                    setError("Aucun lot disponible dans le dépôt central pour exécuter un transfert d'étagère.");
                                  }
                                }}
                                className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-bold text-[10px]"
                              >
                                Transférer
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable sub table showing lots */}
                        <tr className="bg-slate-50/30">
                          <td colSpan={8} className="py-1 px-4 border-l-2 border-slate-300">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-[10px]">
                              <span className="font-mono text-slate-400 uppercase font-bold tracking-wider block mb-1">Indexation des Lots en transit / stock (FEFO actif)</span>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {lots.filter(l => l.productId === p.id).map((l: any) => {
                                  const expDays = Math.ceil((new Date(l.datePeremption).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                                  return (
                                    <div key={l.id} className="p-2 border border-slate-150 rounded-lg flex items-center justify-between">
                                      <div>
                                        <span className="font-bold text-slate-700 block">N° {l.lotNumber}</span>
                                        <span className="text-[9px] text-slate-400 block font-mono">Périme : {l.datePeremption} ({expDays} j)</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="block text-indigo-600 font-mono font-bold">Dépôt: {l.qtyRemainingDepot}</span>
                                        <span className="block text-teal-600 font-mono font-bold">Caisse: {l.qtyRemainingOfficine}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                                {lots.filter(l => l.productId === p.id).length === 0 && (
                                  <span className="text-slate-400 italic">Aucun lot enregistré. Réalisez un d'approvisionnement dans "Entrées & Logistique"</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ======================= TAB CONTENT : CAISSE & VENTE POINT DE VENTE ======================= */}
      {activeTab === "pos" && (
        <div className="space-y-6" id="pharmacy-checkout-pos">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* POS Catalog selector columns */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider flex items-center justify-between">
                <span>Sélection des médicaments d'officine</span>
                <span className="text-xs text-slate-400">FEFO appliqué automatiquement</span>
              </h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Recherche publique pour ajouter au panier..."
                  value={posSearchQuery}
                  onChange={(e) => setPosSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-1">
                {products
                  .filter(p => p.nomCommercial.toLowerCase().includes(posSearchQuery.toLowerCase()) || p.dci.toLowerCase().includes(posSearchQuery.toLowerCase()))
                  .map((p: any) => {
                    const isOut = p.quantityOfficine === 0;
                    return (
                      <div 
                        key={p.id}
                        onClick={() => { if (!isOut) addToCart(p); }}
                        className={`p-3.5 border rounded-2xl text-left transition-all duration-150 cursor-pointer ${isOut ? "opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed" : "bg-white hover:bg-slate-50 hover:border-teal-400 border-slate-200 shadow-sm"}`}
                      >
                        <div className="flex items-start justify-between">
                          <strong className="text-slate-950 font-bold block text-xs">{p.nomCommercial}</strong>
                          <span className="font-mono font-extrabold text-[#0d9488] text-xs">{p.priceVente.toLocaleString("fr-FR")} F</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{p.dci} ({p.forme})</span>
                        
                        <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${isOut ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-800"}`}>
                            Dispo: {p.quantityOfficine} u
                          </span>
                          <span className="text-slate-400 hover:underline">Ajouter +</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* POS cart & Checkout control column */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[480px]">
              <div>
                <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider mb-4 flex items-center gap-2">
                  <ShoppingCart className="h-4.5 w-4.5 text-slate-800" />
                  Panier du dispensaire
                </h3>

                {/* Cart list items */}
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto mb-4 pr-1">
                  {cart.map((item: any) => (
                    <div key={item.productId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex-1 min-w-0 pr-2">
                        <strong className="text-slate-900 block truncate">{item.nomCommercial}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">Prix public : {item.priceVente} FCFA</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateCartQuantity(item.productId, Number(e.target.value))}
                          className="w-12 px-1 focus:outline-none py-1 border border-slate-300 text-center rounded bg-white text-xs"
                        />
                        <button 
                          onClick={() => removeFromCart(item.productId)}
                          className="text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs font-mono">
                      Aucun article dans la dispense. Sélectionnez de l'officine.
                    </div>
                  )}
                </div>

                {/* Patient, Discount & Insurances fields */}
                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700">Patient DME Assujetti (Nom ou ID)</label>
                    <input
                      type="text"
                      placeholder="e.g. Moussa DIARRA (Optionnel, laisse comptoir)"
                      value={posPatientName}
                      onChange={(e) => setPosPatientName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700">Remise Public (FCFA)</label>
                      <input
                        type="number"
                        value={posDiscount}
                        onChange={(e) => setPosDiscount(Number(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Taux Mutuelle (%)</label>
                      <select
                        value={posInsuranceRate}
                        onChange={(e) => setPosInsuranceRate(Number(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs"
                      >
                        <option value="0">0% (Comptoir direct)</option>
                        <option value="30">30% INAM</option>
                        <option value="70">70% Mutuelle Clinique</option>
                        <option value="80">80% Assurance VIP</option>
                        <option value="100">100% Prise en Charge Totale</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700">Mode de Règlement</label>
                    <div className="grid grid-cols-4 gap-2 mt-1 font-mono text-[9px] font-bold text-center">
                      {["CASH", "ORANGE_MONEY", "WAVE", "INSURANCE"].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPosPaymentMethod(m)}
                          className={`py-2 rounded-lg border ${posPaymentMethod === m ? "bg-teal-700 text-white border-teal-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* POS Summary Cash */}
              <div className="pt-4 border-t border-slate-100 mt-4 space-y-3.5 text-xs">
                <div className="space-y-1 bg-slate-50 p-4 rounded-xl font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>Sous-total Public:</span>
                    <span>{cart.reduce((s, c) => s + (c.priceVente * c.quantity), 0).toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>Remise manuelle:</span>
                    <span>-{posDiscount.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="flex justify-between text-indigo-700">
                    <span>Part Assurance ({posInsuranceRate}%):</span>
                    <span>-{Math.round(cart.reduce((s, c) => s + (c.priceVente * c.quantity), 0) * (posInsuranceRate / 100)).toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-dashed border-slate-200 pt-2 text-sm">
                    <span>Net à Payer (Caisse):</span>
                    <span>
                      {Math.max(0, cart.reduce((s, c) => s + (c.priceVente * c.quantity), 0) - posDiscount - Math.round(cart.reduce((s, c) => s + (c.priceVente * c.quantity), 0) * (posInsuranceRate / 100))).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCart([])}
                    className="w-1/3 py-3 border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-600 rounded-xl text-xs cursor-pointer"
                  >
                    Vider Prise
                  </button>
                  <button
                    onClick={handlePOSCheckout}
                    className="flex-1 py-3 text-white bg-slate-950 hover:bg-slate-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Check className="h-4.5 w-4.5" />
                    Valider l'Encaissement
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Receipt print modal simulated layout */}
          {printReceipt && (
            <div className="p-6 bg-amber-50/20 border border-amber-200 rounded-2xl block space-y-4" id="simulated-receipt-modal">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                <div>
                  <h4 className="font-sans font-extrabold text-sm text-slate-950">Facture d'officine générée : N° {printReceipt.id}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Token de scellement : {printReceipt.auditToken}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePrint("printable-pos-receipt")} 
                    className="inline-flex items-center bg-teal-600 text-white font-bold text-xs px-3 py-2 rounded-lg cursor-pointer"
                  >
                    <Printer className="h-4 w-4 mr-1.5" /> Imprimer Ticket
                  </button>
                  <button onClick={() => setPrintReceipt(null)} className="text-xs font-semibold px-3 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg">Masquer</button>
                </div>
              </div>

              {/* Printable Area */}
              <div className="bg-white p-6 border border-slate-300 max-w-sm mx-auto shadow-sm rounded-xl font-mono text-[11px] leading-relaxed text-black" id="printable-pos-receipt">
                <div className="text-center">
                  <h3 className="bold text-sm">CLINIQUE MÉDISAHEL V2</h3>
                  <p>Quartier du Fleuve - Bamako, Mali</p>
                  <p>Tél : +223 20 22 14 00</p>
                  <hr />
                  <p className="bold uppercase">TICKET DE DISPENSATION PHARMACIE</p>
                  <p>Date : {new Date(printReceipt.date).toLocaleString("fr-FR")}</p>
                  <p>Lot : POS_OFFICINE_CASS</p>
                  <p>Client/Patient : {printReceipt.patientName}</p>
                  <hr />
                </div>
                
                <table className="w-full text-left font-mono text-[11px] mb-2">
                  <thead>
                    <tr className="bold border-b border-black">
                      <th>Médicament</th>
                      <th className="text-center">Qté</th>
                      <th className="text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printReceipt.items?.map((it: any, index: number) => (
                      <tr key={index}>
                        <td>{it.productName}</td>
                        <td className="text-center">{it.quantity}</td>
                        <td className="text-right">{(it.price * it.quantity).toLocaleString("fr-FR")} F</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <hr />
                <div className="space-y-1">
                  <div className="flex-between"><span>Total Brut :</span><span>{printReceipt.total?.toLocaleString("fr-FR")} FCFA</span></div>
                  <div className="flex-between"><span>Remise :</span><span>-{printReceipt.discount?.toLocaleString("fr-FR")} FCFA</span></div>
                  <div className="flex-between"><span>Prise en charge Ins :</span><span>-{printReceipt.insuranceContribution?.toLocaleString("fr-FR")} FCFA</span></div>
                  <div className="flex-between bold text-xs border-t border-black pt-1">
                    <span>Net payé :</span>
                    <span>{printReceipt.amountPaid?.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                </div>
                
                <hr />
                <div className="text-center text-[10px]">
                  <p>Règlement : {printReceipt.paymentMethod}</p>
                  <p>Fait par : {printReceipt.cashierName}</p>
                  <p className="bold font-mono text-[9px] mt-2">UUID SCELLEMENT: {printReceipt.auditToken}</p>
                  <p className="mt-2 text-slate-500">MédiSahel V2 - Service Clientèle</p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================= TAB CONTENT : ORDONNANCES DME INTEGRATION ======================= */}
      {activeTab === "prescriptions" && (
        <div className="space-y-6" id="pharmacy-records-sync">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider mb-2 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-700" />
              File d'attente des ordonnances cliniques synchronisées (DME)
            </h3>
            <p className="text-[11px] text-slate-500 mb-6">
              Cette file d'attente extrait en temps réel les prescriptions saisies par les médecins lors de consultations cliniques. Après dispensation, le dossier médical du patient est automatiquement mis à jour avec le rapport de délivrance de la pharmacopée.
            </p>

            <div className="space-y-4">
              {prescriptions.map((presc: any) => {
                const isPending = presc.status === "PENDING";
                return (
                  <div 
                    key={presc.id} 
                    className={`p-5 rounded-2xl border transition-all duration-150 ${!isPending ? "bg-slate-50/50 border-slate-200 opacity-80" : "bg-white border-indigo-200 shadow-sm"}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      
                      {/* Patient metadata */}
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-950 font-extrabold text-sm">{presc.patientName}</strong>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase font-mono tracking-wider ${!isPending ? "bg-slate-200 text-slate-700" : "bg-teal-100 text-teal-800"}`}>
                            {presc.status === "PENDING" ? "En attente d'honoraires" : "Servie & Délivrée"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          Prescrit par : <strong className="text-slate-700">{presc.doctorName}</strong> | Saisi le : {new Date(presc.date).toLocaleString("fr-FR")}
                        </p>
                        
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-600 mt-3 whitespace-pre-line leading-relaxed max-w-2xl">
                          <strong className="text-slate-900 block font-sans mb-1 uppercase tracking-wider text-[9px]">Transcription d'Ordonnance :</strong>
                          {presc.prescriptionText}
                        </div>

                        {/* Medications structured list */}
                        <div className="mt-4 space-y-1">
                          <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Médicaments à honorer</span>
                          <div className="flex flex-wrap gap-2">
                            {presc.medications?.map((m: any, index: number) => {
                              const match = products.find(p => p.nomCommercial.toLowerCase().includes(m.name.toLowerCase()) || p.dci.toLowerCase().includes(m.name.toLowerCase()));
                              return (
                                <span key={index} className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-semibold ${match ? "bg-teal-50 text-teal-800 border border-teal-100" : "bg-rose-50 text-rose-800 border border-rose-100"}`}>
                                  {m.name} ({m.qtyRequired} units) - {match ? "Disponible Stock" : "Hors-Stock Clinique !"}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action triggers */}
                      <div className="text-right">
                        {isPending ? (
                          <button
                            onClick={() => handleServePrescription(presc)}
                            className="inline-flex items-center px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
                          >
                            <CheckSquare className="h-4 w-4 mr-1.5" />
                            Servir & Facturer d'office
                          </button>
                        ) : (
                          <div className="text-right text-[10px] text-slate-400 font-mono space-y-0.5">
                            <span className="text-slate-500 font-bold block">Servi par : {presc.dispensedBy}</span>
                            <span>Date : {new Date(presc.servedAt).toLocaleString("fr-FR")}</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
              {prescriptions.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs font-mono bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  Aucune ordonnance clinique en attente dans la file clinique.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ======================= TAB CONTENT : LOGISTIQUE ET ENTREE DE STOCK ======================= */}
      {activeTab === "logistics" && (
        <div className="space-y-6" id="pharmacy-logistics-workflow">
          
          {/* Top selection column buttons for stock intakes or dpot to office transfers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* New Lot Intake Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider flex items-center justify-between">
                <span>1. Entrée de Stock (Réception Marchandise)</span>
                <Truck className="h-4.5 w-4.5 text-indigo-600" />
              </h3>
              <p className="text-[11px] text-slate-400">
                Idéal pour alimenter le Dépôt Central lors de la réception d'un carton fournisseur ou bon de commande. Les pièces jointes sont cryptées et archivées automatiquement.
              </p>

              <button 
                onClick={() => setShowLotIntakeForm(!showLotIntakeForm)}
                className="w-full py-3 border border-dashed border-slate-300 text-slate-600 hover:text-slate-800 hover:bg-slate-50 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5 text-teal-600" />
                {showLotIntakeForm ? "Masquer le formulaire de réception" : "Ouvrir l'Assistant de réception Clinique"}
              </button>

              {showLotIntakeForm && (
                <form onSubmit={handleCreateLot} className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase">Sélectionner médicament répertorié</label>
                    <select
                      required
                      value={lotForm.productId}
                      onChange={e => setLotForm({...lotForm, productId: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs"
                    >
                      <option value="">-- Choisir un produit ou DCI --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.nomCommercial} ({p.dci})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-500 uppercase">Numéro de Lot</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. LOT-AB-2026"
                        value={lotForm.lotNumber}
                        onChange={e => setLotForm({...lotForm, lotNumber: e.target.value})}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-500 uppercase">Quantité Livrée (Boîtes)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 100"
                        value={lotForm.qtyRecue}
                        onChange={e => setLotForm({...lotForm, qtyRecue: Number(e.target.value)})}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-500 uppercase">Date Fabrication</label>
                      <input
                        type="date"
                        value={lotForm.dateFabrication}
                        onChange={e => setLotForm({...lotForm, dateFabrication: e.target.value})}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-500 uppercase">Date Péremption</label>
                      <input
                        type="date"
                        required
                        value={lotForm.datePeremption}
                        onChange={e => setLotForm({...lotForm, datePeremption: e.target.value})}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-500 uppercase">Grossiste / Distributeur</label>
                      <input
                        type="text"
                        placeholder="e.g. Laborex, Ubipharm"
                        value={lotForm.supplier}
                        onChange={e => setLotForm({...lotForm, supplier: e.target.value})}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-500 uppercase">Prix Achat Facturé (Unité)</label>
                      <input
                        type="number"
                        value={lotForm.priceAchat}
                        onChange={e => setLotForm({...lotForm, priceAchat: Number(e.target.value)})}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Document Invoicing Upload Zone (Usability Pattern) */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-250 text-center space-y-2">
                    <Upload className="h-6 w-6 text-slate-400 mx-auto" />
                    <span className="block text-[10px] text-slate-500">Justificatif d'approvisionnement (Bordereau / Facture d'entrée)</span>
                    <button 
                      type="button" 
                      onClick={triggerFileSelector}
                      className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-bold text-[9px] uppercase cursor-pointer"
                    >
                      Choisir Fichier PDF / JPG
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden" 
                      accept=".pdf,.jpg,.png"
                    />
                    {uploadedFileName && (
                      <div className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-1 rounded inline-block">
                        Attaché : {uploadedFileName}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowLotIntakeForm(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-slate-900 hover:bg-slate-850 text-xs font-bold rounded-lg cursor-pointer shadow-md"
                    >
                      Consigner l'Entrée
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Transfer Depot Central -> Officine Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider flex items-center justify-between">
                <span>2. Transfert Dépôt Central ➔ Officine Vente</span>
                <Layers className="h-4.5 w-4.5 text-teal-600" />
              </h3>
              <p className="text-[11px] text-slate-400">
                Déplacez les boîtes ou ampoules du dépôt de stockage central vers les étagères de dispensation immédiate de la caisse d'officine.
              </p>

              <button 
                onClick={() => setShowTransferForm(!showTransferForm)}
                className="w-full py-3 border border-dashed border-slate-350 text-slate-600 hover:text-slate-850 hover:bg-slate-50 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5 text-indigo-600" />
                {showTransferForm ? "Masquer le formulaire de transfert" : "Ouvrir l'Assistant de Transfert Interne"}
              </button>

              {showTransferForm && (
                <form onSubmit={handleExecuteTransfer} className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase">1. Choisir Lot du Dépôt Central</label>
                    <select
                      required
                      value={trfForm.lotId}
                      onChange={e => {
                        const lotSelected = getLotObj(e.target.value);
                        if (lotSelected) {
                          setTrfForm({
                            ...trfForm,
                            lotId: lotSelected.id,
                            productId: lotSelected.productId,
                            quantity: lotSelected.qtyRemainingDepot
                          });
                          setTargetTransferLot(lotSelected);
                        }
                      }}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs"
                    >
                      <option value="">-- Choisir un lot approvisionné --</option>
                      {lots.filter(l => l.qtyRemainingDepot > 0).map(l => {
                        const p = getProductObj(l.productId);
                        return (
                          <option key={l.id} value={l.id}>
                            {p ? p.nomCommercial : "Produit"} (Lot: {l.lotNumber}) - Dispo Dépôt: {l.qtyRemainingDepot} box
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {targetTransferLot && (
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[11px]">
                      <span className="block font-bold">Produit Moléculaire Associé : {getProductObj(targetTransferLot.productId)?.nomCommercial}</span>
                      <span className="block font-mono text-slate-500">Date limite d'expiration du lot : {targetTransferLot.datePeremption}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 uppercase">2. Quantité à transférer à la caisse d'officine</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 50"
                      value={trfForm.quantity}
                      onChange={e => setTrfForm({...trfForm, quantity: Number(e.target.value)})}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTransferForm(false);
                        setTargetTransferLot(null);
                      }}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-teal-700 hover:bg-teal-800 text-xs font-bold rounded-lg cursor-pointer shadow-md"
                    >
                      Confirmer le Déplacement
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>

          {/* Transfers history list with PDF slip options */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider mb-4">
              Historique des Transferts Inter-Dépôts validés (Bordereaux PDF)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-400">
                    <th className="py-2.5">ID Transfert</th>
                    <th className="py-2.5">Médicament</th>
                    <th className="py-2.5">N° Lot</th>
                    <th className="py-2.5">Quantité Transférée</th>
                    <th className="py-2.5">Date & Heure</th>
                    <th className="py-2.5">Signature Responsable</th>
                    <th className="py-2.5 text-right">Pièce justificative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {transfers.map((tr: any) => {
                    const prod = getProductObj(tr.productId);
                    const batch = getLotObj(tr.lotId);
                    return (
                      <tr key={tr.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-bold text-slate-800">{tr.id}</td>
                        <td className="py-3 font-sans font-bold text-slate-950">{prod ? prod.nomCommercial : "Inconnu"}</td>
                        <td className="py-3 text-slate-500">{batch ? batch.lotNumber : "Inconnu"}</td>
                        <td className="py-3 text-teal-700 font-bold">{tr.quantity} unités</td>
                        <td className="py-3 text-slate-400">{new Date(tr.date).toLocaleString("fr-FR")}</td>
                        <td className="py-3 text-slate-700">{tr.userName}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              alert(`Bordereau PDF ${tr.slipUrl} généré et archivé sur le serveur.`);
                            }}
                            className="inline-flex items-center text-[10px] font-bold text-indigo-600 underline"
                          >
                            <Printer className="h-3 w-3 mr-1" /> Imprimer Bordereau
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ======================= TAB CONTENT : DEVALORISATION & CASSE/DÉMARQUE ======================= */}
      {activeTab === "adjustments" && (
        <div className="space-y-6" id="pharmacy-adjustments-log">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-600 animate-pulse" />
                  Signalement de Démarque Involontaire & Dévalorisation Physique
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Tracez rigoureusement les verres cassés, les ampoules fracassées, les vols d'officine constatés ou la perte de matériel clinique. <strong className="text-rose-700">Chaque suppression exige un motif explicite et une signature numérique professionnelle.</strong>
                </p>
              </div>

              <button
                onClick={() => setShowAdjustmentForm(!showAdjustmentForm)}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Signaler Démarque
              </button>
            </div>

            {/* Adjustment execution box */}
            {showAdjustmentForm && (
              <form onSubmit={handleExecuteAdjustment} className="mb-6 p-5 bg-rose-50/20 border border-rose-150 rounded-2xl space-y-4">
                <h4 className="font-sans font-bold text-sm text-rose-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <FileSignature className="h-4.5 w-4.5 text-rose-700" />
                  Journaliser une anomalie physique de stock
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-rose-900 uppercase">1. Identifier Lot Défectueux</label>
                    <select
                      required
                      value={adjForm.lotId}
                      onChange={e => {
                        const targetL = getLotObj(e.target.value);
                        if (targetL) {
                          setAdjForm({
                            ...adjForm,
                            lotId: targetL.id,
                            productId: targetL.productId,
                            quantity: 1
                          });
                          setTargetAdjustmentLot(targetL);
                        }
                      }}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs"
                    >
                      <option value="">-- Choisir un lot indexé --</option>
                      {lots.map(l => {
                        const p = getProductObj(l.productId);
                        return (
                          <option key={l.id} value={l.id}>
                            {p ? p.nomCommercial : "Produit"} (Lot: {l.lotNumber}) - Total: {l.qtyRemainingDepot + l.qtyRemainingOfficine} boîtes
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-rose-900 uppercase">Type de Démarque</label>
                    <select
                      value={adjForm.type}
                      onChange={e => setAdjForm({...adjForm, type: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs"
                    >
                      <option value="CASSE">Casse / Incident de manutention (officine)</option>
                      <option value="VOL">Vol interne / disparition suspecte</option>
                      <option value="PERTE">Lot détérioré / Périmé non utilisable</option>
                      <option value="AJUSTEMENT">Correction inventaire physique semestriel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-rose-900 uppercase">Magasin de l'incident</label>
                    <div className="flex gap-4 mt-2 font-bold text-xs select-none">
                      <label className="flex items-center gap-1 text-slate-700">
                        <input 
                          type="radio" 
                          name="targetStore" 
                          checked={adjForm.targetStore === "OFFICINE"} 
                          onChange={() => setAdjForm({...adjForm, targetStore: "OFFICINE"})} 
                        />
                        Officine Vente
                      </label>
                      <label className="flex items-center gap-1 text-slate-700">
                        <input 
                          type="radio" 
                          name="targetStore" 
                          checked={adjForm.targetStore === "DEPOT"} 
                          onChange={() => setAdjForm({...adjForm, targetStore: "DEPOT"})} 
                        />
                        Dépôt central
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-rose-900 uppercase font-bold">Quantité dévalorisée (Boîtes)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5"
                      value={adjForm.quantity}
                      onChange={e => setAdjForm({...adjForm, quantity: Number(e.target.value)})}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-mono text-rose-900 uppercase font-bold">Motif analytique justificatif <span className="text-red-650">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flacons d'insuline détruits lors de la panne du compresseur frigo."
                      value={adjForm.reason}
                      onChange={e => setAdjForm({...adjForm, reason: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-rose-900 uppercase font-bold">Signature Légale de l'Agent de Pharmacovigilance <span className="text-red-655">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Saisissez vos NOM Complet + Mention 'Validé pour démarque' en toutes lettres."
                    value={adjForm.signature}
                    onChange={e => setAdjForm({...adjForm, signature: e.target.value})}
                    className="w-full mt-1 px-3 py-3 border border-rose-350 bg-white shadow-inner font-mono text-xs rounded-xl"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdjustmentForm(false);
                      setTargetAdjustmentLot(null);
                    }}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-rose-700 hover:bg-rose-800 text-xs font-bold rounded-lg cursor-pointer shadow-md animate-pulse"
                  >
                    Sceller l'Ajustement
                  </button>
                </div>
              </form>
            )}

            {/* History grid view list of devalorisations */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-rose-100 text-slate-400">
                    <th className="py-2.5">ID Log</th>
                    <th className="py-2.5">Type Démarque</th>
                    <th className="py-2.5">Médicament</th>
                    <th className="py-2.5">N° Lot</th>
                    <th className="py-2.5">Magasin</th>
                    <th className="py-2.5">Perte Qté</th>
                    <th className="py-2.5">Justificatif obligatoire</th>
                    <th className="py-2.5">Date & Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {adjustments.map((ad: any) => {
                    const prod = getProductObj(ad.productId);
                    const batch = getLotObj(ad.lotId);
                    return (
                      <tr key={ad.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-bold text-rose-800">{ad.id}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold font-sans ${ad.type === "VOL" ? "bg-red-100 text-red-900" : "bg-amber-100 text-amber-900"}`}>
                            {ad.type}
                          </span>
                        </td>
                        <td className="py-3 font-sans font-bold text-slate-900">{prod ? prod.nomCommercial : "Produit"}</td>
                        <td className="py-3 text-slate-500">{batch ? batch.lotNumber : "Inconnu"}</td>
                        <td className="py-3 text-slate-600">{ad.targetStore || "OFFICINE"}</td>
                        <td className="py-3 font-bold text-rose-700">{ad.difference} units</td>
                        <td className="py-3 text-slate-600 font-sans max-w-xs truncate" title={ad.reason}>{ad.reason}</td>
                        <td className="py-3 text-slate-400">
                          <span className="block">{new Date(ad.date).toLocaleDateString("fr-FR")}</span>
                          <span className="block font-bold text-slate-600 font-sans">{ad.userName}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {adjustments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        Aucune valorisation négative enregistrée dans le journal.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ======================= TAB CONTENT : ALERTES DE PEREMPTION ======================= */}
      {activeTab === "alerts" && (
        <div className="space-y-6" id="pharmacy-alarms-panel">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider mb-2 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Registre de Pharmacovigilance & Dates de Péremption
            </h3>
            <p className="text-[11px] text-slate-500 mb-6">
              Listing des produits en infraction d'expiration ou sous alerte de 1, 3 et 6 mois de validité conformément au protocole de vigilance de la clinique.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.map((al: any) => {
                const isCritExp = al.type === "EXPIRED" || al.type === "EXPIRING_1M";
                return (
                  <div key={al.id} className={`p-4 rounded-xl border flex items-start gap-3 ${isCritExp ? "bg-red-50 border-red-200 text-red-900" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
                    <AlertTriangle className={`h-5 w-5 ${isCritExp ? "text-red-700" : "text-amber-700"} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-extrabold text-xs">{al.productName}</strong>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-mono font-extrabold ${isCritExp ? "bg-red-200 text-red-900" : "bg-amber-100 text-amber-900"}`}>
                          {al.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">{al.details}</p>
                      <span className="block text-[9px] font-mono text-slate-400 mt-2 font-bold uppercase">Signalement interne : {new Date(al.date).toLocaleString("fr-FR")}</span>
                    </div>
                  </div>
                )})}
              {alerts.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-400 font-mono text-xs">
                  Aucun lot sous filtre d'infraction. Qualité de stock : Parfaite.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ======================= TAB CONTENT : RAPPORTS ET EXPORTS ANALYTIQUES ======================= */}
      {activeTab === "reports" && (
        <div className="space-y-6" id="pharmacy-reporting-module">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-700" />
                  Rapports analytiques périodiques et comptables
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Synthèse d'activité clinique d'apothicairerie. Téléchargements d'audits et rapports au format CSV/Excel.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={downloadReportsCSV}
                  className="inline-flex items-center px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Exporter Ventes CSV (Excel)
                </button>
              </div>
            </div>

            {/* Profits calculation and analysis summary sheet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Financial Margin Ledger */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider block">Calculatrice analytique de Marge Officinale</span>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span>Ventes Totales (Prix Public) :</span>
                    <strong className="text-slate-950">{getDailySalesTotal().toLocaleString("fr-FR")} FCFA</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2 text-indigo-800">
                    <span>Part Assurance Facturée Mutuelle :</span>
                    <strong>{sales.reduce((sum, s) => sum + (s.insuranceContribution || 0), 0).toLocaleString("fr-FR")} FCFA</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2 text-rose-700">
                    <span>Rabais accordés :</span>
                    <strong>{sales.reduce((sum, s) => sum + (s.discount || 0), 0).toLocaleString("fr-FR")} FCFA</strong>
                  </div>
                  <div className="flex justify-between uppercase pt-2 font-mono font-bold text-emerald-800 border-t border-dashed border-slate-300 text-sm">
                    <span>Marge Commerciale Brute :</span>
                    <span>{getTheoreticalMargin().toLocaleString("fr-FR")} FCFA</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 text-[10px] text-slate-500 font-mono">
                  Calcul en temps réel. Marge Théorique estimée sur une base moyenne de coefficient de gros (Achat = 45% Vente par défaut si non consigné).
                </div>
              </div>

              {/* Historic Sales Activity Table */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 max-h-[300px] overflow-y-auto">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider block">Derniers reçus encaissés</span>
                <div className="space-y-2 text-xs">
                  {sales.map((s: any) => (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex justify-between items-center text-[11px]">
                      <div>
                        <strong className="text-slate-950 block">{s.patientName}</strong>
                        <span className="text-[9px] font-mono text-slate-400">{new Date(s.date).toLocaleDateString("fr-FR")} à {new Date(s.date).toLocaleTimeString("fr-FR")}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">{s.amountPaid.toLocaleString("fr-FR")} F</span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">{s.paymentMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ======================= TAB CONTENT : GESTION DES FOURNISSEURS ======================= */}
      {activeTab === "suppliers" && (
        <div className="space-y-6" id="pharmacy-suppliers-module">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                  <Truck className="h-5 w-5 text-slate-800" />
                  Répertoire et Suivi des Fournisseurs Pharmaceutiques
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gestion des contacts officiels, coordonnées de livraison et historique complet d'approvisionnement.
                </p>
              </div>

              {(userRole === "ADMIN" || userRole === "PHARMACIST" || userRole === "GESTIONNAIRE_STOCK") && (
                <button
                  onClick={() => {
                    setEditingSupplier(null);
                    setSupForm({ name: "", contactName: "", phone: "", email: "", address: "" });
                    setShowSupplierForm(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-1 pb-0.5" />
                  Nouveau Fournisseur
                </button>
              )}
            </div>

            {/* Modal Form */}
            {showSupplierForm && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider block">
                  {editingSupplier ? "Modifier le fournisseur" : "Enregistrer un nouveau fournisseur"}
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Raison Sociale *</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2"
                      value={supForm.name}
                      onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                      placeholder="Ex: Laborex Mali SA"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Interlocuteur Principal</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2"
                      value={supForm.contactName}
                      onChange={(e) => setSupForm({ ...supForm, contactName: e.target.value })}
                      placeholder="Ex: Dr. Diallo Karim"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Téléphone</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2"
                      value={supForm.phone}
                      onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                      placeholder="Ex: +223 20 22 41 54"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Email de Commande</label>
                    <input
                      type="email"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2"
                      value={supForm.email}
                      onChange={(e) => setSupForm({ ...supForm, email: e.target.value })}
                      placeholder="Ex: commandes@laborex.ml"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Adresse Géographique</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2"
                      value={supForm.address}
                      onChange={(e) => setSupForm({ ...supForm, address: e.target.value })}
                      placeholder="Ex: Zone Industrielle, Bamako, Mali"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => setShowSupplierForm(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={async () => {
                      if (!supForm.name) {
                        setError("La raison sociale est requise.");
                        return;
                      }
                      try {
                        const url = editingSupplier ? `/api/pharmacy/suppliers/${editingSupplier.id}` : "/api/pharmacy/suppliers";
                        const method = editingSupplier ? "PUT" : "POST";
                        const res = await fetch(url, {
                          method,
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify(supForm)
                        });
                        if (!res.ok) {
                          const errData = await res.json();
                          throw new Error(errData.error || "Erreur de sauvegarde");
                        }
                        setSuccess(editingSupplier ? "Fournisseur mis à jour avec succès" : "Fournisseur créé avec succès");
                        setShowSupplierForm(false);
                        fetchData();
                      } catch (err: any) {
                        setError(err.message);
                      }
                    }}
                    className="px-4 py-2 bg-slate-950 text-white rounded-xl font-semibold cursor-pointer hover:bg-slate-900"
                  >
                    {editingSupplier ? "Enregistrer les modifications" : "Créer le Fournisseur"}
                  </button>
                </div>
              </div>
            )}

            {/* Directory Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {suppliers.map((s: any) => {
                const deliveries = lots.filter(
                  (l: any) => l.supplier?.toLowerCase() === s.name?.toLowerCase()
                );
                const totalDeliveryVal = deliveries.reduce(
                  (sum, l) => sum + (Number(l.qtyRecue) * Number(l.priceAchat)), 0
                );

                return (
                  <div key={s.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <strong className="text-slate-950 font-sans text-sm tracking-tight">{s.name}</strong>
                        <button
                          onClick={() => {
                            setEditingSupplier(s);
                            setSupForm({
                              name: s.name,
                              contactName: s.contactName || "",
                              phone: s.phone || "",
                              email: s.email || "",
                              address: s.address || ""
                            });
                            setShowSupplierForm(true);
                          }}
                          className="text-[10px] text-slate-500 underline font-semibold hover:text-indigo-900"
                        >
                          Modifier la fiche
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-500">
                        <div>
                          <span className="block text-[9px] uppercase text-slate-400">Contact</span>
                          {s.contactName || "Non spécifié"}
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase text-slate-400">Téléphone</span>
                          {s.phone || "N/A"}
                        </div>
                        <div className="col-span-2">
                          <span className="block text-[9px] uppercase text-slate-400">Email</span>
                          {s.email || "N/A"}
                        </div>
                        <div className="col-span-2">
                          <span className="block text-[9px] uppercase text-slate-400">Adresse</span>
                          {s.address || "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-dashed border-slate-200">
                      <span className="text-[9px] font-mono uppercase text-slate-400 block mb-2">
                        Historique d'approvisionnement ({deliveries.length} livraisons)
                      </span>
                      {deliveries.length === 0 ? (
                        <div className="text-[10px] font-mono text-slate-400 bg-white p-2.5 rounded-xl border border-slate-150">
                          Aucun lot entré en dépôt pour ce fournisseur.
                        </div>
                      ) : (
                        <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-150 text-[10px] max-h-[140px] overflow-y-auto">
                          <div className="flex justify-between border-b pb-1 mb-1 font-mono text-slate-400">
                            <span>Numéro Lot</span>
                            <span>Quantité</span>
                            <span>Valeur d'Achat</span>
                          </div>
                          {deliveries.slice(0, 4).map((d: any) => {
                            const pObj = products.find((pr: any) => pr.id === d.productId);
                            return (
                              <div key={d.id} className="flex justify-between py-0.5 text-slate-600 font-mono">
                                <span className="truncate max-w-[120px]">{d.lotNumber} ({pObj?.nomCommercial || "MED"})</span>
                                <span>{d.qtyRecue} u</span>
                                <strong>{(d.qtyRecue * d.priceAchat).toLocaleString("fr-FR")} F</strong>
                              </div>
                            );
                          })}
                          <div className="flex justify-between pt-1 mt-1 border-t border-dashed font-mono font-bold text-slate-900 text-[10px]">
                            <span>TOTAL LIVRÉ :</span>
                            <span>{totalDeliveryVal.toLocaleString("fr-FR")} FCFA</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB CONTENT : MODULE INVENTAIRE COMPLET ======================= */}
      {activeTab === "inventories" && (
        <div className="space-y-6" id="pharmacy-inventories-module">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-sans font-bold text-sm text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-slate-800" />
                  Rapprochement et Inventaires de Stock Cliniques
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Comparaison du stock logique calculé avec le comptage physique réel du dépôt central et de l'officine.
                </p>
              </div>

              <div className="flex gap-2 text-xs">
                {printInventory && (
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 cursor-pointer"
                  >
                    <Printer className="h-4 w-4 mr-1 pb-0.5" />
                    Imprimer le PV d'Inventaire
                  </button>
                )}
              </div>
            </div>

            {/* Interactive counting panel */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-end text-xs mb-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Type d'Inventaire</label>
                  <select
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 cursor-pointer font-bold focus:outline-none"
                    value={inventoryType}
                    onChange={(e) => setInventoryType(e.target.value)}
                  >
                    <option value="TOURNANT">Inventaire Tournant (Mensuel / Hebdomadaire)</option>
                    <option value="ANNUEL">Inventaire Annuel de Fin d'Exercice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Auditeur Responsable *</label>
                  <input
                    type="text"
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 w-64 font-medium focus:outline-none"
                    placeholder="Signature du responsable"
                    value={inventorySignatory}
                    onChange={(e) => setInventorySignatory(e.target.value)}
                  />
                </div>
              </div>

              {/* Counts listing */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-mono text-[10px] uppercase text-slate-500">
                      <th className="p-3">ID / Code</th>
                      <th className="p-3">Médicament</th>
                      <th className="p-3 text-right">Théorique Logique</th>
                      <th className="p-3 text-center w-40">Comptage Physique (*)</th>
                      <th className="p-3 text-right">Écart constaté</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p: any) => {
                      const theoStock = p.quantityOfficine + p.quantityDepot;
                      const enteredVal = physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : theoStock;
                      const discrepancy = enteredVal - theoStock;

                      return (
                        <tr key={p.id} className="border-b border-indigo-50/50 hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-600">{p.codeInterne}</td>
                          <td className="p-3">
                            <strong className="text-slate-900 block">{p.nomCommercial}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">{p.dci}</span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-700">{theoStock} unités</td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              className="w-24 font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-center"
                              value={physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : theoStock}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setPhysicalCounts({
                                  ...physicalCounts,
                                  [p.id]: isNaN(val) ? 0 : val
                                });
                              }}
                            />
                          </td>
                          <td className="p-3 text-right">
                            {discrepancy === 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-bold text-[10px]">CONFORME (=)</span>
                            ) : discrepancy > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-mono font-bold text-[10px]">{`+${discrepancy} (Surplus)`}</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 font-mono font-bold text-[10px]">{`${discrepancy} (Manque)`}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Submit block */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!inventorySignatory) {
                      setError("La signature électronique du responsable est obligatoire pour confirmer l'audit.");
                      return;
                    }

                    const report = products.map((p: any) => {
                      const theo = p.quantityOfficine + p.quantityDepot;
                      const physical = physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : theo;
                      return {
                        productId: p.id,
                        productName: p.nomCommercial,
                        code: p.codeInterne,
                        theoretical: theo,
                        physical,
                        discrepancy: physical - theo
                      };
                    });

                    try {
                      const res = await fetch("/api/pharmacy/inventories", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          type: inventoryType,
                          responsibleSignature: inventorySignatory,
                          discrepancyReport: report
                        })
                      });

                      if (!res.ok) {
                        const errData = await res.json();
                        throw new Error(errData.error || "Échec d'enregistrement");
                      }

                      const saved = await res.json();
                      setSuccess(`Procès-verbal de rapprochement d'inventaire ${inventoryType} clôturé et signé numériquement !`);
                      setPrintInventory(saved);
                      fetchData();
                    } catch (err: any) {
                      setError(err.message);
                    }
                  }}
                  className="px-5 py-2.5 bg-slate-950 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-900 border border-slate-900 inline-flex items-center gap-2 text-xs shadow-md"
                >
                  <FileSignature className="h-4 w-4" />
                  Signer et Clôturer le Rapprochement de Stock
                </button>
              </div>
            </div>

            {/* List of past signature records audits reports */}
            <div className="space-y-4 pt-2">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider block font-bold">Historique des Audits et Procès-Verbaux Validés</span>
              
              <div className="space-y-3">
                {inventories.length === 0 ? (
                  <div className="text-[11px] font-mono p-4 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Aucun procès-verbal d'inventaire répertorié dans la base PostgreSQL clinique.
                  </div>
                ) : (
                  inventories.map((inv: any) => (
                    <div key={inv.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-950 uppercase font-mono tracking-wider">Inventaire {inv.type}</strong>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-mono select-none">Clôturé & Audité</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          Clôturé le {new Date(inv.date || new Date()).toLocaleDateString("fr-FR")} par {inv.userName || "Auditeur"} • Responsable : {inv.responsibleSignature}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-[10px] font-mono text-slate-500">
                          {inv.discrepancyReport?.filter((x: any) => x.discrepancy !== 0).length || 0} écarts constatés
                        </div>
                        <button
                          onClick={() => {
                            setPrintInventory(inv);
                            setTimeout(() => { window.print(); }, 250);
                          }}
                          className="inline-flex items-center text-indigo-700 hover:text-indigo-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-medium cursor-pointer"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1" />
                          Imprimer PV
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PV Print Preview Mock Card Overlay */}
      {printInventory && (
        <div className="p-6 bg-slate-100 border-2 border-slate-300 rounded-2xl shadow-inner mt-6 print:absolute print:inset-0 print:bg-white print:border-none print:shadow-none">
          <div className="bg-white p-8 rounded-xl max-w-3xl mx-auto shadow-md border border-slate-200 print:shadow-none print:border-none">
            <div className="text-center space-y-2 border-b pb-4 mb-4">
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">MédiSahel Clinique V2</h2>
              <h3 className="text-xs font-mono font-bold tracking-widest text-slate-500">RAPPORT ET COMPTE-RENDU D'INVENTAIRE DE STOCK</h3>
              <p className="text-[10px] text-slate-400">Date d'audit : {new Date(printInventory.date || new Date()).toLocaleDateString("fr-FR")} • Type d'opération : Enregistrement de Clôture {printInventory.type}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-600 mb-4 pb-2 border-b">
              <div>
                <strong>Signataire Auditeur :</strong> {printInventory.userName || "Responsable"}
              </div>
              <div className="text-right">
                <strong>Responsable d'établissement :</strong> {printInventory.responsibleSignature}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider block">Écarts de dénombrement constatés :</span>
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="py-2">Code</th>
                    <th className="py-2">Produit</th>
                    <th className="py-2 text-right">Stock Th.</th>
                    <th className="py-2 text-right">Comptage Phys.</th>
                    <th className="py-2 text-right">Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {printInventory.discrepancyReport?.map((dr: any, idx: number) => (
                    <tr key={idx} className="border-b py-1">
                      <td className="py-2">{dr.code}</td>
                      <td className="py-2">{dr.productName}</td>
                      <td className="py-2 text-right">{dr.theoretical} u</td>
                      <td className="py-2 text-right">{dr.physical} u</td>
                      <td className="py-2 text-right font-bold">
                        {dr.discrepancy === 0 ? "0" : dr.discrepancy > 0 ? `+${dr.discrepancy}` : dr.discrepancy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-end pt-12 text-xs font-mono">
              <div className="border-t w-48 text-center pt-2">
                <span>Visa Caisse & Admin</span>
              </div>
              <div className="border-t w-48 text-center pt-2 font-bold text-slate-900">
                <span>Signature Elect. : {printInventory.responsibleSignature}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
