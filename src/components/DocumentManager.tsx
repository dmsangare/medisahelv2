import React, { useState, useEffect, useRef } from "react";
import { 
  FolderGit, 
  UploadCloud, 
  Search, 
  Check, 
  ShieldAlert, 
  FileText, 
  Trash2, 
  ArrowDownToLine,
  LayoutDashboard,
  Inbox,
  Send,
  Plus,
  FolderOpen,
  Calendar,
  Clock,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  FileSpreadsheet,
  FileDown,
  Printer,
  ChevronRight,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  User,
  History as HistoryIcon,
  Edit3,
  Link2,
  CheckCircle,
  CheckSquare,
  Activity
} from "lucide-react";
import { Document } from "../types.ts";

interface DocumentManagerProps {
  token: string | null;
  userRole: string; // The logged-in user's role from DB
  clinic?: any;
  currentUser?: any;
}

interface GecdAnnotation {
  timestamp: string;
  userName: string;
  role: string;
  type: "comment" | "observation" | "recommendation" | "report";
  text: string;
}

// Struct for metadata serialized in the "description" field
interface GecdMetadata {
  gecd: boolean;
  gecdType: "entrant" | "sortant" | "administratif";
  numCourrier: string;
  dateCourrier: string;
  reference: string;
  sender: string;
  recipient: string;
  serviceDestinataire: string;
  serviceEmetteur: string;
  priority: "BASSE" | "MOYENNE" | "HAUTE";
  status: "RECU" | "EN_ATTENTE_IMPUTATION" | "AFFECTE" | "IMPUTE" | "PRIS_EN_CHARGE" | "EN_COURS" | "REPONSE_PREPAREE" | "EN_ATTENTE_VALIDATION" | "VALIDE" | "EN_ATTENTE_EXPEDITION" | "EXPEDIE" | "REPONDU" | "TRAITE" | "CLOTURE" | "ARCHIVE";
  assignedToUserId?: string;
  assignedToUserName?: string;
  assignedResponsable?: string;
  imputedBy?: string;
  imputationInstruction?: string;
  deadline?: string;
  actions: {
    timestamp: string;
    userName: string;
    role: string;
    action: string;
    details: string;
  }[];
  annotations?: GecdAnnotation[];
  linkedResponseCode?: string;
  linkedIncomingCode?: string;
  progressPercentage?: number;
  signee?: string;
  realDescription: string;
  
  // Real-world administrative validation & security tracking
  confidentiality?: "PUBLIC" | "INTERNE" | "CONFIDENTIEL" | "TRES_CONFIDENTIEL";
  consultedBy?: string[];
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  expeditionMethod?: string;
  expeditionRecipient?: string;
  expeditionDate?: string;
  expeditionBordereau?: string;
  expeditionNeedAck?: boolean;
  expeditionAckReceivedAt?: string;
  expeditionAckReceivedBy?: string;
  validatorName?: string;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ token, userRole, clinic, currentUser }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [clinicInfo, setClinicInfo] = useState<any>(null);
  const [meProfile, setMeProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Simulated Roles for IT trainer walkthrough
  const [simulatedRole, setSimulatedRole] = useState<string>("REAL"); // "REAL", "ADMIN", "DG", "SECRETARIAT", "CHEF_SERVICE", "USER"
  
  // Tabs: "dashboard" | "entrant" | "sortant" | "admin_doc" | "rediger"
  const [activeTab, setActiveTab] = useState<"dashboard" | "entrant" | "sortant" | "admin_doc" | "rediger">("dashboard");

  // Filter and searches states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchNum, setSearchNum] = useState("");
  const [searchRef, setSearchRef] = useState("");
  const [searchSender, setSearchSender] = useState("");
  const [searchRecipient, setSearchRecipient] = useState("");
  const [searchService, setSearchService] = useState("");
  const [searchStatus, setSearchStatus] = useState("ALL");
  const [searchPriority, setSearchPriority] = useState("ALL");

  // Selection/workflow detail state
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Forms states
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileAttachment, setUploadedFileAttachment] = useState<File | null>(null);

  // 1. Incoming form state
  const [entrantRef, setEntrantRef] = useState("");
  const [entrantSender, setEntrantSender] = useState("");
  const [entrantObject, setEntrantObject] = useState("");
  const [entrantService, setEntrantService] = useState("Administration");
  const [entrantPriority, setEntrantPriority] = useState<"BASSE" | "MOYENNE" | "HAUTE">("MOYENNE");
  const [entrantDeadline, setEntrantDeadline] = useState("");
  const [entrantDesc, setEntrantDesc] = useState("");
  const [entrantConfidentiality, setEntrantConfidentiality] = useState<"PUBLIC" | "INTERNE" | "CONFIDENTIEL" | "TRES_CONFIDENTIEL">("INTERNE");

  // 2. Outgoing form state
  const [sortantRecipient, setSortantRecipient] = useState("");
  const [sortantObject, setSortantObject] = useState("");
  const [sortantEmetteur, setSortantEmetteur] = useState("Direction Générale");
  const [sortantSignee, setSortantSignee] = useState("");
  const [sortantDesc, setSortantDesc] = useState("");

  // 3. Administrative document model creator state
  const [adminDocType, setAdminDocType] = useState<"note" | "decision" | "contrat" | "pv">("note");
  const [adminDocTitle, setAdminDocTitle] = useState("");
  const [adminDocRef, setAdminDocRef] = useState("");
  const [adminDocBody, setAdminDocBody] = useState("");

  // Workflow workflow interaction fields (when assigning/updating an opened doc)
  const [workflowComment, setWorkflowComment] = useState("");
  const [workflowAssignUser, setWorkflowAssignUser] = useState("");
  const [workflowAssignService, setWorkflowAssignService] = useState("");
  const [workflowPriority, setWorkflowPriority] = useState<"BASSE" | "MOYENNE" | "HAUTE">("MOYENNE");
  const [workflowDeadline, setWorkflowDeadline] = useState("");

  // Imputation Form States
  const [imputService, setImputService] = useState("Administration");
  const [imputResponsable, setImputResponsable] = useState("");
  const [imputToUser, setImputToUser] = useState("");
  const [imputInstruction, setImputInstruction] = useState("");
  const [imputDeadline, setImputDeadline] = useState("");

  // Annotations Form States
  const [annotText, setAnnotText] = useState("");
  const [annotType, setAnnotType] = useState<"comment" | "observation" | "recommendation" | "report">("comment");
  const [annotProgress, setAnnotProgress] = useState(50);

  // Expedition Form States (Requirement 11)
  const [expeditionMethod, setExpeditionMethod] = useState("Courrier recommandé");
  const [expeditionRecipient, setExpeditionRecipient] = useState("");
  const [expeditionBordereau, setExpeditionBordereau] = useState("");
  const [expeditionNeedAck, setExpeditionNeedAck] = useState(false);

  // Response Association State
  const [selectedSortantResponseCode, setSelectedSortantResponseCode] = useState("");

  // Fetch initial collections
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/documents", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "GECD non initialisé");
      setDocuments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsersList(data);
      }
    } catch (err) {
      console.warn("Failed to retrieve system user lists:", err);
    }
  };

  const fetchClinicInfo = async () => {
    try {
      if (clinic) {
        setClinicInfo(clinic);
        if (clinic.logoUrl) {
          setSortantSignee(clinic.logoUrl);
        }
        return;
      }
      const response = await fetch("/api/clinics/clinic-1");
      const data = await response.json();
      if (response.ok) {
        setClinicInfo(data);
        // By default, set the outgoing signee and admin doc signee to clinical signature
        if (data.logoUrl) {
          setSortantSignee(data.logoUrl);
        }
      }
    } catch (err) {
      console.warn("Clinic config not available:", err);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMeProfile(data);
      }
    } catch (err) {
      console.warn("Profile retrieval failed:", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchUsers();
    fetchClinicInfo();
    fetchProfile();
  }, [token, clinic]);

  // Compute Active Role based on simulation or true login role
  const getActiveRole = () => {
    if (simulatedRole !== "REAL") return simulatedRole;
    return userRole;
  };

  const getActiveUserInfo = () => {
    const role = getActiveRole();
    if (simulatedRole === "REAL" && meProfile) {
      return { id: meProfile.id, name: meProfile.name || "Dr. Adama Sangaré", role: meProfile.role };
    }
    
    // Fallbacks corresponding to roles to make demo look incredibly professional and realistic
    switch (role) {
      case "DG":
        return { id: "sim-dg", name: "Dr. Adama Sangaré (DG)", role: "DG" };
      case "DOCTOR":
        return { id: "sim-doc", name: "Dr. Adama Sangaré (Directeur Médical)", role: "DOCTOR" };
      case "ADMIN":
        return { id: "sim-admin", name: "Mme Diallo (Admin)", role: "ADMIN" };
      case "SECRETARIAT":
        return { id: "sim-sec", name: "Fatoumata Barry (Secrétaire)", role: "SECRETARIAT" };
      case "CHEF_SERVICE":
        return { id: "sim-chef", name: "Moussa Traoré (Chef de Service)", role: "CHEF_SERVICE" };
      default:
        return { id: "sim-user", name: meProfile?.name || "Adama Diarra (Agent)", role: role };
    }
  };

  const getDaysOverdue = (deadlineStr?: string) => {
    if (!deadlineStr) return 0;
    const todayStr = "2026-06-01"; // current context date
    const dDate = new Date(deadlineStr);
    const today = new Date(todayStr);
    if (dDate >= today) return 0;
    const diffTime = Math.abs(today.getTime() - dDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper: map string to GECD meta objects
  const deserializeGecd = (doc: Document): GecdMetadata & { id: string; title: string; createdAt: string; ownerName: string } => {
    try {
      if (doc.description && doc.description.trim().startsWith('{"gecd":true')) {
        const parsed = JSON.parse(doc.description);
        return {
          id: doc.id,
          title: doc.title,
          createdAt: doc.createdAt || new Date().toISOString(),
          ownerName: doc.ownerName,
          ...parsed
        };
      }
    } catch (err) {
      // JSON parse error
    }

    // Default fallback mapping for simple historical uploaded files
    const isIncoming = doc.category === "INCOMING" || doc.title.toLowerCase().includes("entrant") || doc.title.toLowerCase().includes("reçu");
    const isOutgoing = doc.category === "OUTGOING" || doc.title.toLowerCase().includes("sortant") || doc.title.toLowerCase().includes("lettre");
    const typeGecd = isIncoming ? "entrant" : isOutgoing ? "sortant" : "administratif";
    
    return {
      id: doc.id,
      title: doc.title,
      gecd: true,
      gecdType: typeGecd,
      numCourrier: isIncoming ? `E-LEG-${doc.id.substring(0, 5).toUpperCase()}` : isOutgoing ? `S-LEG-${doc.id.substring(0, 5).toUpperCase()}` : `ADM-LEG-${doc.id.substring(0, 5).toUpperCase()}`,
      dateCourrier: doc.createdAt ? doc.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10),
      reference: doc.fileUrl && doc.fileUrl.startsWith("gecd_vault_") ? doc.fileUrl.replace("gecd_vault_", "").substring(0, 15).toUpperCase() : "HISTORIQUE",
      sender: isIncoming ? "Usager Externe" : "Clinique MédiSahel",
      recipient: isOutgoing ? "Direction Administrative" : "Direction Générale",
      serviceDestinataire: "Administration",
      serviceEmetteur: "Secrétariat",
      priority: "MOYENNE",
      status: "ARCHIVE",
      actions: [
        {
          timestamp: doc.createdAt || new Date().toISOString(),
          userName: doc.ownerName || "Archiviste Systémique",
          role: "ADMIN",
          action: "CREATION",
          details: "Document numérique historique importé et classé dans les registres GECD."
        }
      ],
      realDescription: doc.description || "Aucun commentaire fourni."
    } as any;
  };

  // Deserialize list
  const gecdDocs = documents.map(doc => deserializeGecd(doc));

  // Determine permissions based on computed role
  const currentComputedRole = getActiveRole();
  const activeUser = getActiveUserInfo();
  const isGecdAllowed = currentUser?.allowedModules?.includes("documents") || false;
  const isDir = currentComputedRole === "DG" || currentComputedRole === "ADMIN";
  const isAdm = currentComputedRole === "ADMIN";
  const isSec = currentComputedRole === "SECRETARIAT" || currentComputedRole === "ADMIN" || currentComputedRole === "HR" || currentComputedRole === "CASHIER" || isGecdAllowed;
  const isChef = currentComputedRole === "CHEF_SERVICE" || currentComputedRole === "DOCTOR" || currentComputedRole === "ADMIN" || currentComputedRole === "CASHIER" || isGecdAllowed;

  // Dashboard calculations
  const todayStr = new Date().toISOString().substring(0, 10);
  const entrantsTotal = gecdDocs.filter(d => d.gecdType === "entrant");
  const entrantTodayCount = entrantsTotal.filter(d => d.dateCourrier === todayStr).length;

  const sortantsTotal = gecdDocs.filter(d => d.gecdType === "sortant");
  const sortantTodayCount = sortantsTotal.filter(d => d.dateCourrier === todayStr).length;

  // High fidelity follow-up aggregates for GECD V2
  const nonTraitesCount = gecdDocs.filter(d => d.status === "RECU").length;
  const enCoursCount = gecdDocs.filter(d => 
    d.status === "IMPUTE" || 
    d.status === "AFFECTE" || 
    d.status === "EN_COURS" || 
    d.status === "REPONSE_PREPAREE"
  ).length;
  const traitesCount = gecdDocs.filter(d => d.status === "TRAITE" || d.status === "REPONDU").length;
  const cloturesCount = gecdDocs.filter(d => d.status === "CLOTURE").length;
  const archivesCount = gecdDocs.filter(d => d.status === "ARCHIVE").length;

  // Overdue count algorithm (If today > deadline and status not in completed states)
  const overdueCount = gecdDocs.filter(d => {
    if (["EXPEDIE", "REPONDU", "TRAITE", "CLOTURE", "ARCHIVE"].includes(d.status)) return false;
    if (!d.deadline) return false;
    const deadlineDate = new Date(d.deadline);
    const today = new Date(todayStr);
    return deadlineDate < today;
  }).length;

  const overdueDocs = gecdDocs.filter(d => {
    if (["EXPEDIE", "REPONDU", "TRAITE", "CLOTURE", "ARCHIVE"].includes(d.status)) return false;
    if (!d.deadline) return false;
    const deadlineDate = new Date(d.deadline);
    const today = new Date(todayStr);
    return deadlineDate < today;
  });

  // Filter documents in registers
  const filteredGecdDocs = gecdDocs.filter(doc => {
    // Role-based Access Control on Confidentiality level (Requirement 7)
    if (doc.confidentiality === "TRES_CONFIDENTIEL") {
      if (!isDir) return false;
    } else if (doc.confidentiality === "CONFIDENTIEL") {
      const isAssigned = doc.assignedToUserId === activeUser.id;
      if (!isDir && !isChef && !isAssigned) return false;
    }

    // Basic text match
    const textTerm = searchQuery.toLowerCase();
    const matchText = searchQuery === "" || 
      doc.title.toLowerCase().includes(textTerm) || 
      doc.realDescription.toLowerCase().includes(textTerm) ||
      doc.sender.toLowerCase().includes(textTerm) ||
      doc.recipient.toLowerCase().includes(textTerm);

    const matchNum = searchNum === "" || doc.numCourrier.toLowerCase().includes(searchNum.toLowerCase());
    const matchRef = searchRef === "" || doc.reference.toLowerCase().includes(searchRef.toLowerCase());
    const matchSender = searchSender === "" || doc.sender.toLowerCase().includes(searchSender.toLowerCase());
    const matchRecipient = searchRecipient === "" || doc.recipient.toLowerCase().includes(searchRecipient.toLowerCase());
    const matchService = searchService === "" || doc.serviceDestinataire.toLowerCase().includes(searchService.toLowerCase()) || doc.serviceEmetteur.toLowerCase().includes(searchService.toLowerCase());
    const matchStatus = searchStatus === "ALL" || doc.status === searchStatus;
    const matchPriority = searchPriority === "ALL" || doc.priority === searchPriority;

    return matchText && matchNum && matchRef && matchSender && matchRecipient && matchService && matchStatus && matchPriority;
  });

  // Safe file drag handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFileAttachment(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFileAttachment(e.target.files[0]);
    }
  };

  const triggerSearchReset = () => {
    setSearchQuery("");
    setSearchNum("");
    setSearchRef("");
    setSearchSender("");
    setSearchRecipient("");
    setSearchService("");
    setSearchStatus("ALL");
    setSearchPriority("ALL");
  };

  // POST Create Incoming Courrier
  const submitIncomingCourrier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entrantSender || !entrantObject) {
      setError("Le nom de l'expéditeur et l'objet sont formellement obligatoires.");
      return;
    }

    setError("");
    setSuccess("");

    // Automatically generate next sequential courrier number
    const sequence = entrantsTotal.length + 1;
    const padding = String(sequence).padStart(4, "0");
    const numCourrier = `EN-${new Date().getFullYear()}-${padding}`;
    const dateToday = new Date().toISOString().substring(0, 10);

    const meta: GecdMetadata = {
      gecd: true,
      gecdType: "entrant",
      numCourrier,
      dateCourrier: dateToday,
      reference: entrantRef || "SANS-REF",
      sender: entrantSender,
      recipient: "Clinique MédiSahel",
      serviceDestinataire: "Secrétariat / GECD", // Route through Centralized incoming desk initially
      serviceEmetteur: "Externe",
      priority: entrantPriority,
      status: "EN_ATTENTE_IMPUTATION", // Requirement 1: En attente d'imputation auto
      deadline: entrantDeadline || undefined,
      realDescription: entrantDesc,
      confidentiality: entrantConfidentiality, // Requirement 7: Niveau de confidentialité
      progressPercentage: 5, // 5% starting progress
      actions: [
        {
          timestamp: new Date().toISOString(),
          userName: "Secrétariat Clinique",
          role: currentComputedRole,
          action: "RECEPTION",
          details: `Enregistrement du courrier entrant ${numCourrier}. Classifié [${entrantConfidentiality}]. Réf: ${entrantRef || 'SANS-REF'}. Transmis à la direction générale pour imputation.`
        }
      ]
    };

    const fileName = uploadedFileAttachment ? uploadedFileAttachment.name : `courrier_${numCourrier}.pdf`;
    const payload = {
      title: `${numCourrier} - ${entrantObject}`,
      description: JSON.stringify(meta),
      fileType: "PDF_IN",
      category: "INCOMING",
      size: uploadedFileAttachment ? `${(uploadedFileAttachment.size / 1024).toFixed(1)} KB` : "450 KB",
      fileUrl: `gecd_vault_${fileName}`
    };

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Échec d'intégration GECD");

      setSuccess(`Le courrier entrant ${numCourrier} a été enregistré avec succès et transmis pour imputation au DG !`);
      
      // Reset form
      setEntrantRef("");
      setEntrantSender("");
      setEntrantObject("");
      setEntrantService("Administration");
      setEntrantPriority("MOYENNE");
      setEntrantDeadline("");
      setEntrantDesc("");
      setEntrantConfidentiality("INTERNE");
      setUploadedFileAttachment(null);
      
      fetchDocuments();
      setActiveTab("entrant");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // POST Create Outgoing Correspondence
  const submitOutgoingCorrespondence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sortantRecipient || !sortantObject) {
      setError("Le destinataire externe et l'objet sont formellement obligatoires.");
      return;
    }

    setError("");
    setSuccess("");

    const sequence = sortantsTotal.length + 1;
    const padding = String(sequence).padStart(4, "0");
    const numCourrier = `SO-${new Date().getFullYear()}-${padding}`;
    const dateToday = new Date().toISOString().substring(0, 10);

    const meta: GecdMetadata = {
      gecd: true,
      gecdType: "sortant",
      numCourrier,
      dateCourrier: dateToday,
      reference: `REF-SO-${numCourrier}`,
      sender: "Clinique MédiSahel Bamako V2",
      recipient: sortantRecipient,
      serviceDestinataire: "Externe",
      serviceEmetteur: sortantEmetteur,
      priority: "MOYENNE",
      status: "TRAITE", // Outgoing is transmitted directly
      signee: sortantSignee || clinicInfo?.logoUrl || "Directeur Général MédiSahel",
      realDescription: sortantDesc,
      actions: [
        {
          timestamp: new Date().toISOString(),
          userName: "Service Expéditions",
          role: currentComputedRole,
          action: "EMISSION",
          details: `Émission, compostage et scellage électronique de la correspondance sortante ${numCourrier}.`
        }
      ]
    };

    const fileName = uploadedFileAttachment ? uploadedFileAttachment.name : `courrier_sortant_${numCourrier}.pdf`;
    const payload = {
      title: `${numCourrier} - ${sortantObject}`,
      description: JSON.stringify(meta),
      fileType: "PDF_OUT",
      category: "OUTGOING",
      size: uploadedFileAttachment ? `${(uploadedFileAttachment.size / 1024).toFixed(1)} KB` : "620 KB",
      fileUrl: `gecd_vault_${fileName}`
    };

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Échec d'intégration GECD");

      setSuccess(`Le courrier sortant ${numCourrier} a été enregistré avec compostage institutionnel valide !`);
      
      // Reset form
      setSortantRecipient("");
      setSortantObject("");
      setSortantEmetteur("Direction Générale");
      setSortantDesc("");
      setUploadedFileAttachment(null);
      
      fetchDocuments();
      setActiveTab("sortant");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // POST Create Administrative institutional act template
  const submitAdministrativeDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminDocTitle || !adminDocBody) {
      setError("Le titre de l'acte et le corps textuel du document sont requis.");
      return;
    }

    setError("");
    setSuccess("");

    const sequence = gecdDocs.filter(d => d.gecdType === "administratif").length + 1;
    const padding = String(sequence).padStart(4, "0");
    
    let typePrefix = "DEC";
    let documentCategoryName = "Décision Administrative";
    if (adminDocType === "note") {
      typePrefix = "NTS";
      documentCategoryName = "Note de Service";
    } else if (adminDocType === "contrat") {
      typePrefix = "CTR";
      documentCategoryName = "Contrat Administratif";
    } else if (adminDocType === "pv") {
      typePrefix = "PV";
      documentCategoryName = "Procès-Verbal";
    }

    const numCourrier = `ADM-${new Date().getFullYear()}-${typePrefix}-${padding}`;
    const finalRef = adminDocRef || `REF-${typePrefix}-${padding}`;
    const dateToday = new Date().toISOString().substring(0, 10);

    const meta: GecdMetadata = {
      gecd: true,
      gecdType: "administratif",
      numCourrier,
      dateCourrier: dateToday,
      reference: finalRef,
      sender: "Clinique MédiSahel Bamako V2",
      recipient: "Tous services cliniques et administratifs",
      serviceDestinataire: "Générale",
      serviceEmetteur: "Direction Clinique",
      priority: "MOYENNE",
      status: "ARCHIVE",
      signee: clinicInfo?.logoUrl || "Directeur Général MédiSahel",
      realDescription: `[ACTE ADMINISTRATIF - TYPE: ${documentCategoryName}]\n\nRef: ${finalRef}\n\n${adminDocBody}`,
      actions: [
        {
          timestamp: new Date().toISOString(),
          userName: "Direction Générale",
          role: "ADMIN",
          action: "SIGNATURE",
          details: `Signature institutionnelle et versement aux archives cliniques GECD de la note de service/décision: ${finalRef}`
        }
      ]
    };

    const payload = {
      title: `${numCourrier} - ${adminDocTitle}`,
      description: JSON.stringify(meta),
      fileType: "DOC_ADM",
      category: "ADMINISTRATIVE",
      size: "95 KB",
      fileUrl: `gecd_vault_acte_${finalRef.toLowerCase()}.pdf`
    };

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Échec de versement GECD");

      setSuccess(`L'acte administratif ${numCourrier} (${documentCategoryName}) a été signé, scellé et archivé !`);
      
      // Reset form
      setAdminDocTitle("");
      setAdminDocRef("");
      setAdminDocBody("");
      
      fetchDocuments();
      setActiveTab("admin_doc");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // PUT Update GECD workflow states (Affecter, Réaffecter, Valider, Archiver, Annoter)
  const handleWorkflowAction = async (docId: string, actionType: "AFFECTER" | "REASSIGNER" | "TRAITER" | "ARCHIVER" | "COMMENTER") => {
    setError("");
    setSuccess("");

    const targetDoc = gecdDocs.find(d => d.id === docId);
    if (!targetDoc) return;

    let updatedStatus = targetDoc.status;
    let detailsText = "";
    
    // Check assignees
    let assignedId = targetDoc.assignedToUserId;
    let assignedName = targetDoc.assignedToUserName;
    let computedService = targetDoc.serviceDestinataire;

    if (actionType === "AFFECTER" || actionType === "REASSIGNER") {
      if (!workflowAssignUser && !workflowAssignService) {
        setError("Veuillez sélectionner un service ou un collaborateur hospitalier.");
        return;
      }
      
      updatedStatus = "AFFECTE";
      computedService = workflowAssignService || targetDoc.serviceDestinataire;
      
      if (workflowAssignUser) {
        const u = usersList.find(usr => usr.id === workflowAssignUser);
        assignedId = u?.id;
        assignedName = u?.name;
        detailsText = `Courrier affecté à ${u?.name} du service [${computedService}] pour traitement.`;
      } else {
        detailsText = `Courrier affecté globalement au service clinical [${computedService}].`;
      }
    } else if (actionType === "TRAITER") {
      updatedStatus = "TRAITE";
      detailsText = "Courrier traité avec succès et validé.";
    } else if (actionType === "ARCHIVER") {
      updatedStatus = "ARCHIVE";
      detailsText = "Courrier formellement clos et archivé dans le coffre GECD.";
    } else if (actionType === "COMMENTER") {
      if (!workflowComment) {
        setError("Veuillez inscrire une annotation ou un commentaire clinique.");
        return;
      }
      detailsText = `Ajout d'annotation: "${workflowComment}"`;
    }

    // Clone & update actions timeline array
    const updatedActions = [
      ...targetDoc.actions,
      {
        timestamp: new Date().toISOString(),
        userName: clinicInfo?.logoUrl || "Collaborateur MédiSahel",
        role: currentComputedRole,
        action: actionType,
        details: `${detailsText} ${workflowComment ? `- Observation: ${workflowComment}` : ""}`
      }
    ];

    const updatedMeta: GecdMetadata = {
      gecd: true,
      gecdType: targetDoc.gecdType,
      numCourrier: targetDoc.numCourrier,
      dateCourrier: targetDoc.dateCourrier,
      reference: targetDoc.reference,
      sender: targetDoc.sender,
      recipient: targetDoc.recipient,
      serviceDestinataire: computedService,
      serviceEmetteur: targetDoc.serviceEmetteur,
      priority: workflowPriority || targetDoc.priority,
      status: updatedStatus,
      assignedToUserId: assignedId,
      assignedToUserName: assignedName,
      deadline: workflowDeadline || targetDoc.deadline,
      actions: updatedActions,
      signee: targetDoc.signee,
      realDescription: targetDoc.realDescription
    };

    // Prepare express database update payload
    const payload = {
      title: targetDoc.title,
      description: JSON.stringify(updatedMeta),
      fileType: targetDoc.gecdType === "entrant" ? "PDF_IN" : targetDoc.gecdType === "sortant" ? "PDF_OUT" : "DOC_ADM",
      category: targetDoc.gecdType === "entrant" ? "INCOMING" : targetDoc.gecdType === "sortant" ? "OUTGOING" : "ADMINISTRATIVE",
      fileUrl: `gecd_vault_${targetDoc.numCourrier.toLowerCase()}.pdf`,
      size: "1.2 MB"
    };

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const bodyErr = await response.json();
        throw new Error(bodyErr.error || "Échec de routage GECD");
      }

      setSuccess("Action enregistrée dans AuditLog ! Circuit mis à jour en temps réel.");
      fetchDocuments();
      setWorkflowComment("");
      setWorkflowAssignUser("");
      setWorkflowAssignService("");
      setWorkflowDeadline("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // DELETE document from GECD vault
  const handleDelete = async (id: string, num: string) => {
    if (currentComputedRole !== "ADMIN") {
      setError("Seuls les administrateurs généraux possèdent les droits d'audit pour extraire/supprimer un acte scellé.");
      return;
    }

    if (!window.confirm(`Voulez-vous formellement détruire le courrier/acte GECD [${num}] ? Cette opération historique entraîne l'enregistrement d'une trace d'audit d'annulation immédiate.`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Échec d'extraction du GECD.");
      setSuccess(`Courrier/acte ${num} détruit avec archivage de la traçabilité.`);
      setSelectedDocId(null);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Simulated export methods
  const triggerSimulationExport = (format: "PDF" | "EXCEL" | "WORD", num: string) => {
    setSuccess(`[GECD Export] Génération et scellage électronique de ${num}.${format.toLowerCase()} en cours. Le fichier téléchargera instantanément après compilation des certificats.`);
    setTimeout(() => {
      alert(`[Bordereau GECD MédiSahel] Le fichier ${num}.${format.toLowerCase()} est maintenant stocké localement.`);
    }, 1200);
  };

  // NEW: 1. Imputation Handler (Director or Admin or Doctor)
  const handleImputation = async (docId: string) => {
    setError("");
    setSuccess("");

    const targetDoc = gecdDocs.find(d => d.id === docId);
    if (!targetDoc) return;

    if (!imputService) {
      setError("Le service d'affectation est obligatoire.");
      return;
    }

    const activeUser = getActiveUserInfo();
    
    // Find precise user details if selected
    let assignedUserId = undefined;
    let assignedUserName = undefined;
    if (imputToUser) {
      const u = usersList.find(usr => usr.id === imputToUser);
      if (u) {
        assignedUserId = u.id;
        assignedUserName = u.name;
      }
    }

    const imputationText = `Imputé par ${activeUser.name} au service [${imputService}] sous la responsabilité de [${imputResponsable || 'Non défini'}]. Date limite: ${imputDeadline || 'Non renseignée'}.`;
    
    const updatedActions = [
      ...targetDoc.actions,
      {
        timestamp: new Date().toISOString(),
        userName: activeUser.name,
        role: activeUser.role,
        action: "IMPUTATION",
        details: `${imputationText} Instruction: "${imputInstruction || 'Suivre le protocole standard'}"`
      }
    ];

    const updatedMeta: GecdMetadata = {
      gecd: true,
      gecdType: targetDoc.gecdType,
      numCourrier: targetDoc.numCourrier,
      dateCourrier: targetDoc.dateCourrier,
      reference: targetDoc.reference,
      sender: targetDoc.sender,
      recipient: targetDoc.recipient,
      serviceDestinataire: imputService,
      serviceEmetteur: targetDoc.serviceEmetteur,
      priority: targetDoc.priority,
      status: "IMPUTE", // Status changed to "IMPUTE"
      assignedToUserId: assignedUserId || targetDoc.assignedToUserId,
      assignedToUserName: assignedUserName || targetDoc.assignedToUserName,
      assignedResponsable: imputResponsable || targetDoc.assignedResponsable,
      imputedBy: activeUser.name,
      imputationInstruction: imputInstruction,
      deadline: imputDeadline || targetDoc.deadline,
      actions: updatedActions,
      annotations: targetDoc.annotations || [],
      linkedResponseCode: targetDoc.linkedResponseCode,
      linkedIncomingCode: targetDoc.linkedIncomingCode,
      progressPercentage: 20, // 20% progress started on imputation
      signee: targetDoc.signee,
      realDescription: targetDoc.realDescription
    };

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: targetDoc.title,
          description: JSON.stringify(updatedMeta),
          fileType: "PDF_IN",
          category: "INCOMING",
          fileUrl: `gecd_vault_${targetDoc.numCourrier.toLowerCase()}.pdf`,
          size: "1.2 MB"
        })
      });

      if (!response.ok) throw new Error("Échec de l'imputation du pli");

      setSuccess(`Le courrier ${targetDoc.numCourrier} a été officiellement imputé avec instructions au service ${imputService} !`);
      fetchDocuments();
      // Clear forms
      setImputResponsable("");
      setImputInstruction("");
      setImputToUser("");
      setImputDeadline("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // NEW: 2. Annotation & Observations Handler
  const handleAddAnnotation = async (docId: string) => {
    setError("");
    setSuccess("");

    if (!annotText.trim()) {
      setError("Veuillez inscrire le texte de l'observation ou de l'annotation.");
      return;
    }

    const targetDoc = gecdDocs.find(d => d.id === docId);
    if (!targetDoc) return;

    const activeUser = getActiveUserInfo();
    
    // Create new annotation
    const newAnnot: GecdAnnotation = {
      timestamp: new Date().toISOString(),
      userName: activeUser.name,
      role: activeUser.role,
      type: annotType,
      text: annotText
    };

    const updatedAnnots = [...(targetDoc.annotations || []), newAnnot];
    
    // Automatically set status to "EN_COURS" on any new comment/obs if status was just "RECU" or "IMPUTE".
    // If progress is set to 100%, we mark status as "TRAITE" or "REPONSE_PREPAREE".
    let nextStatus = targetDoc.status;
    if (targetDoc.status === "RECU" || targetDoc.status === "IMPUTE" || targetDoc.status === "AFFECTE") {
      nextStatus = "EN_COURS";
    }
    if (annotProgress === 100 && targetDoc.status !== "ARCHIVE" && targetDoc.status !== "CLOTURE") {
      nextStatus = "TRAITE";
    }

    const detailsText = `Annotation [${annotType}] ajoutée. Avancement réglé à ${annotProgress}%. Texte : "${annotText}"`;

    const updatedActions = [
      ...targetDoc.actions,
      {
        timestamp: new Date().toISOString(),
        userName: activeUser.name,
        role: activeUser.role,
        action: "ANNOTATION",
        details: detailsText
      }
    ];

    const updatedMeta: GecdMetadata = {
      gecd: true,
      gecdType: targetDoc.gecdType,
      numCourrier: targetDoc.numCourrier,
      dateCourrier: targetDoc.dateCourrier,
      reference: targetDoc.reference,
      sender: targetDoc.sender,
      recipient: targetDoc.recipient,
      serviceDestinataire: targetDoc.serviceDestinataire,
      serviceEmetteur: targetDoc.serviceEmetteur,
      priority: targetDoc.priority,
      status: nextStatus,
      assignedToUserId: targetDoc.assignedToUserId,
      assignedToUserName: targetDoc.assignedToUserName,
      assignedResponsable: targetDoc.assignedResponsable,
      imputedBy: targetDoc.imputedBy,
      imputationInstruction: targetDoc.imputationInstruction,
      deadline: targetDoc.deadline,
      actions: updatedActions,
      annotations: updatedAnnots,
      linkedResponseCode: targetDoc.linkedResponseCode,
      linkedIncomingCode: targetDoc.linkedIncomingCode,
      progressPercentage: annotProgress,
      signee: targetDoc.signee,
      realDescription: targetDoc.realDescription
    };

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: targetDoc.title,
          description: JSON.stringify(updatedMeta),
          fileType: targetDoc.gecdType === "entrant" ? "PDF_IN" : targetDoc.gecdType === "sortant" ? "PDF_OUT" : "DOC_ADM",
          category: targetDoc.gecdType === "entrant" ? "INCOMING" : targetDoc.gecdType === "sortant" ? "OUTGOING" : "ADMINISTRATIVE",
          fileUrl: `gecd_vault_${targetDoc.numCourrier.toLowerCase()}.pdf`,
          size: "1.2 MB"
        })
      });

      if (!response.ok) throw new Error("Échec d'enregistrement de l'annotation");

      setSuccess("Annotation horodatée et signée automatiquement dans l'historique !");
      fetchDocuments();
      setAnnotText("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // NEW: 3. Associate Response Handler
  const handleAssociateResponse = async (incomingId: string) => {
    setError("");
    setSuccess("");

    if (!selectedSortantResponseCode) {
      setError("Veuillez choisir une correspondance de réponse sortante.");
      return;
    }

    const incomingDoc = gecdDocs.find(d => d.id === incomingId);
    const outgoingDoc = gecdDocs.find(d => d.numCourrier === selectedSortantResponseCode);
    
    if (!incomingDoc) return;

    const activeUser = getActiveUserInfo();

    // 1. Update Incoming Document
    const incomingActions = [
      ...incomingDoc.actions,
      {
        timestamp: new Date().toISOString(),
        userName: activeUser.name,
        role: activeUser.role,
        action: "REPONSE_ENVOYEE",
        details: `Rattachement du courrier de réponse officiel : [${selectedSortantResponseCode}]. Statut basculé en RÉPONDU.`
      }
    ];

    const updatedIncomingMeta: GecdMetadata = {
      gecd: true,
      gecdType: incomingDoc.gecdType,
      numCourrier: incomingDoc.numCourrier,
      dateCourrier: incomingDoc.dateCourrier,
      reference: incomingDoc.reference,
      sender: incomingDoc.sender,
      recipient: incomingDoc.recipient,
      serviceDestinataire: incomingDoc.serviceDestinataire,
      serviceEmetteur: incomingDoc.serviceEmetteur,
      priority: incomingDoc.priority,
      status: "REPONDU", // Status becomes REPONDU
      assignedToUserId: incomingDoc.assignedToUserId,
      assignedToUserName: incomingDoc.assignedToUserName,
      assignedResponsable: incomingDoc.assignedResponsable,
      imputedBy: incomingDoc.imputedBy,
      imputationInstruction: incomingDoc.imputationInstruction,
      deadline: incomingDoc.deadline,
      actions: incomingActions,
      annotations: incomingDoc.annotations || [],
      linkedResponseCode: selectedSortantResponseCode, // Reference code
      linkedIncomingCode: incomingDoc.linkedIncomingCode,
      progressPercentage: 100, // Response sent means 100% complete
      signee: incomingDoc.signee,
      realDescription: incomingDoc.realDescription
    };

    try {
      // Save Incoming
      const resIncoming = await fetch(`/api/documents/${incomingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: incomingDoc.title,
          description: JSON.stringify(updatedIncomingMeta),
          fileType: "PDF_IN",
          category: "INCOMING",
          fileUrl: `gecd_vault_${incomingDoc.numCourrier.toLowerCase()}.pdf`,
          size: "1.2 MB"
        })
      });

      if (!resIncoming.ok) throw new Error("Échec d'association sur le courrier entrant.");

      // 2. Cross-link Outgoing if exists
      if (outgoingDoc) {
        const outgoingActions = [
          ...outgoingDoc.actions,
          {
            timestamp: new Date().toISOString(),
            userName: activeUser.name,
            role: activeUser.role,
            action: "LIAISON_DOSSIER",
            details: `Ce courrier sortant a été lié en tant que réponse officielle au courrier entrant [${incomingDoc.numCourrier}].`
          }
        ];

        const updatedOutgoingMeta: GecdMetadata = {
          gecd: true,
          gecdType: "sortant",
          numCourrier: outgoingDoc.numCourrier,
          dateCourrier: outgoingDoc.dateCourrier,
          reference: outgoingDoc.reference,
          sender: outgoingDoc.sender,
          recipient: outgoingDoc.recipient,
          serviceDestinataire: outgoingDoc.serviceDestinataire,
          serviceEmetteur: outgoingDoc.serviceEmetteur,
          priority: outgoingDoc.priority,
          status: "ARCHIVE",
          actions: outgoingActions,
          annotations: outgoingDoc.annotations || [],
          linkedIncomingCode: incomingDoc.numCourrier, // Link backward
          signee: outgoingDoc.signee,
          realDescription: outgoingDoc.realDescription
        };

        await fetch(`/api/documents/${outgoingDoc.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: outgoingDoc.title,
            description: JSON.stringify(updatedOutgoingMeta),
            fileType: "PDF_OUT",
            category: "OUTGOING",
            fileUrl: `gecd_vault_${outgoingDoc.numCourrier.toLowerCase()}.pdf`,
            size: "1.2 MB"
          })
        });
      }

      setSuccess(`Liaison établie avec succès ! ${incomingDoc.numCourrier} est maintenant lié à ${selectedSortantResponseCode}.`);
      setSelectedSortantResponseCode("");
      fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // NEW: 4. Acknowledge Receipt Handler (Requirement 4)
  const handleAcknowledgeReceipt = async (docId: string) => {
    setError("");
    setSuccess("");

    const targetDoc = gecdDocs.find(d => d.id === docId);
    if (!targetDoc) return;

    const activeUser = getActiveUserInfo();
    const nowISO = new Date().toISOString();

    const updatedActions = [
      ...targetDoc.actions,
      {
        timestamp: nowISO,
        userName: activeUser.name,
        role: activeUser.role,
        action: "ACCUSE_RECEPTION",
        details: `Accusé de réception formel signé par l'agent ${activeUser.name} (${activeUser.role}). Pris en charge.`
      }
    ];

    const updatedMeta: GecdMetadata = {
      ...targetDoc,
      status: "PRIS_EN_CHARGE",
      acknowledgedAt: nowISO,
      acknowledgedBy: activeUser.name,
      progressPercentage: 40, // 40% when receipt acknowledged
      actions: updatedActions
    };

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: targetDoc.title,
          description: JSON.stringify(updatedMeta),
          fileType: "PDF_IN",
          category: "INCOMING",
          fileUrl: `gecd_vault_${targetDoc.numCourrier.toLowerCase()}.pdf`,
          size: "1.2 MB"
        })
      });

      if (!response.ok) throw new Error("Échec de signature de l'accusé de réception");
      setSuccess(`L'accusé de réception pour ${targetDoc.numCourrier} a été enregistré et certifié !`);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // NEW: 5. Request Validation Handler (Requirement 11)
  const handleRequestValidation = async (docId: string, commentText: string) => {
    setError("");
    setSuccess("");

    const targetDoc = gecdDocs.find(d => d.id === docId);
    if (!targetDoc) return;

    const activeUser = getActiveUserInfo();
    const nowISO = new Date().toISOString();

    const updatedActions = [
      ...targetDoc.actions,
      {
        timestamp: nowISO,
        userName: activeUser.name,
        role: activeUser.role,
        action: "DEMANDE_VALIDATION",
        details: `Traitement terminé. Dossier transmis pour validation hiérarchique au DG / Médecin Chef. Note: "${commentText || 'Réponse prête pour examen'}"`
      }
    ];

    const updatedMeta: GecdMetadata = {
      ...targetDoc,
      status: "EN_ATTENTE_VALIDATION",
      progressPercentage: 75, // Ready for check
      actions: updatedActions
    };

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: targetDoc.title,
          description: JSON.stringify(updatedMeta),
          fileType: "PDF_IN",
          category: "INCOMING",
          fileUrl: `gecd_vault_${targetDoc.numCourrier.toLowerCase()}.pdf`,
          size: "1.2 MB"
        })
      });

      if (!response.ok) throw new Error("Échec d'envoi pour validation");
      setSuccess(`Le pli ${targetDoc.numCourrier} a été transmis pour validation hiérarchique !`);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // NEW: 6. Validate Document Handler (Requirement 11)
  const handleValidateDocument = async (docId: string) => {
    setError("");
    setSuccess("");

    const targetDoc = gecdDocs.find(d => d.id === docId);
    if (!targetDoc) return;

    const activeUser = getActiveUserInfo();
    const nowISO = new Date().toISOString();

    const updatedActions = [
      ...targetDoc.actions,
      {
        timestamp: nowISO,
        userName: activeUser.name,
        role: activeUser.role,
        action: "VALIDATION_HIERARCHIQUE",
        details: `Validation hiérarchique officielle signée électroniquement par ${activeUser.name}. Dossier retourné au Service Courrier pour expédition administrative.`
      }
    ];

    const updatedMeta: GecdMetadata = {
      ...targetDoc,
      status: "EN_ATTENTE_EXPEDITION", // or VALIDE, putting it in wait list for courrier room
      progressPercentage: 90, // Validated, ready to send
      validatorName: activeUser.name,
      actions: updatedActions
    };

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: targetDoc.title,
          description: JSON.stringify(updatedMeta),
          fileType: "PDF_IN",
          category: "INCOMING",
          fileUrl: `gecd_vault_${targetDoc.numCourrier.toLowerCase()}.pdf`,
          size: "1.2 MB"
        })
      });

      if (!response.ok) throw new Error("Échec de validation de l'acte");
      setSuccess(`L'acte administratif ${targetDoc.numCourrier} a été validé ! Transmis au service courrier pour expédition.`);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // NEW: 7. Expedition / Ship Handler (Requirement 11)
  const handleExpediteDocument = async (docId: string, method: string, recipient: string, bordereauNum: string, needAck: boolean) => {
    setError("");
    setSuccess("");

    if (!method || !recipient || !bordereauNum) {
      setError("Le mode d'envoi, le destinataire final, et le numéro de bordereau sont obligatoires.");
      return;
    }

    const targetDoc = gecdDocs.find(d => d.id === docId);
    if (!targetDoc) return;

    const activeUser = getActiveUserInfo();
    const nowISO = new Date().toISOString();

    const updatedActions = [
      ...targetDoc.actions,
      {
        timestamp: nowISO,
        userName: activeUser.name,
        role: activeUser.role,
        action: "EXPEDITION",
        details: `Expédition officielle enregistrée. Mode : [${method}]. Destinataire : [${recipient}]. Bordereau d'envoi GECD N° ${bordereauNum}.`
      }
    ];

    const updatedMeta: GecdMetadata = {
      ...targetDoc,
      status: "EXPEDIE",
      progressPercentage: 100, // Expedition is 100% complete
      expeditionMethod: method,
      expeditionRecipient: recipient,
      expeditionBordereau: bordereauNum,
      expeditionNeedAck: needAck,
      expeditionDate: nowISO,
      actions: updatedActions
    };

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: targetDoc.title,
          description: JSON.stringify(updatedMeta),
          fileType: "PDF_IN",
          category: "INCOMING",
          fileUrl: `gecd_vault_${targetDoc.numCourrier.toLowerCase()}.pdf`,
          size: "1.2 MB"
        })
      });

      if (!response.ok) throw new Error("Échec d'enregistrement de l'expédition");
      setSuccess(`L'expédition du pli ${targetDoc.numCourrier} a été officiellement enregistrée avec bordereau !`);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const selectedGecdDoc = gecdDocs.find(d => d.id === selectedDocId);

  return (
    <div className="space-y-6 animate-fade-in" id="gecd-workspace-container">
      {/* ⚠️ GECD ROLE SIMULATION FILTER BAR FOR walkthrough IT formateur Adama S. */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl border border-teal-800 p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-800 rounded-lg text-teal-300 animate-pulse">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight">Panneau d'Homologation & Simulation GECD V2 (Formations & Traces Audit)</h4>
            <p className="text-xs text-teal-200 mt-0.5">
              Simulez la vue du système selon différents point de vue du cadre médical et de la direction générale.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-teal-300">Rôle Actif :</span>
          <select 
            value={simulatedRole}
            onChange={(e) => {
              setSimulatedRole(e.target.value);
              setSelectedDocId(null); // Clear selected item to avoid RBAC conflict
            }}
            className="bg-teal-950 border border-teal-700 rounded-lg text-xs font-bold text-teal-200 px-3 py-1.5 cursor-pointer focus:outline-none"
            id="simulation-role-select"
          >
            <option value="REAL">Réel de session ({userRole})</option>
            <option value="ADMIN">ADMINISTRATEUR (Droit Plein)</option>
            <option value="DG">DIRECTEUR GÉNÉRAL (Lectures & Validations)</option>
            <option value="SECRETARIAT">SECRÉTARIAT GÉNÉRAL (Saisies et Expéditions)</option>
            <option value="CHEF_SERVICE">CHEF DE SERVICE CLINIQUE (Affectations, Traitements)</option>
            <option value="USER">UTILISATEUR CLINIC STANDARD (Reçus et Tâches de Soin)</option>
          </select>
        </div>
      </div>

      {/* Main GECD layout */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden" id="gecd-card">
        {/* Page Head */}
        <div className="p-6 border-b border-gray-100 bg-slate-50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-sans font-bold text-xl text-gray-900 flex items-center">
              <FolderGit className="h-6 w-6 text-teal-700 mr-2" />
              GECD - Gestion Électronique des Courriers & Documents Administratifs
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-4xl">
              Plateforme certifiée de conformité hospitalière pour MédiSahel Clinique Bamako V2. Registres chaînés des courriers entrants, sortants, notes administratives, routages et compostage de signatures.
            </p>
          </div>

          <div className="flex items-center space-x-1 border p-1 bg-white rounded-xl text-xs font-semibold shrink-0">
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedDocId(null); }}
              className={`px-3 py-1.5 rounded-lg flex items-center ${activeTab === "dashboard" ? "bg-teal-700 text-white" : "text-gray-600 hover:text-black hover:bg-slate-50"}`}
            >
              <LayoutDashboard className="h-3.5 w-3.5 mr-1" />
              Tableau de bord
            </button>
            <button
              onClick={() => { setActiveTab("entrant"); setSelectedDocId(null); }}
              className={`px-3 py-1.5 rounded-lg flex items-center ${activeTab === "entrant" ? "bg-teal-700 text-white" : "text-gray-600 hover:text-black hover:bg-slate-50"}`}
            >
              <Inbox className="h-3.5 w-3.5 mr-1" />
              Entrants {entrantsTotal.length > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-sky-100 text-sky-800 rounded-full font-bold">{entrantsTotal.length}</span>}
            </button>
            <button
              onClick={() => { setActiveTab("sortant"); setSelectedDocId(null); }}
              className={`px-3 py-1.5 rounded-lg flex items-center ${activeTab === "sortant" ? "bg-teal-700 text-white" : "text-gray-600 hover:text-black hover:bg-slate-50"}`}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Sortants {sortantsTotal.length > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-800 rounded-full font-bold">{sortantsTotal.length}</span>}
            </button>
            <button
              onClick={() => { setActiveTab("admin_doc"); setSelectedDocId(null); }}
              className={`px-3 py-1.5 rounded-lg flex items-center ${activeTab === "admin_doc" ? "bg-teal-700 text-white" : "text-gray-600 hover:text-black hover:bg-slate-50"}`}
            >
              <FolderOpen className="h-3.5 w-3.5 mr-1" />
              Actes administratifs
            </button>
            {isSec && (
              <button
                onClick={() => { setActiveTab("rediger"); setSelectedDocId(null); }}
                className={`px-3 py-1.5 rounded-lg flex items-center ${activeTab === "rediger" ? "bg-teal-700 text-white" : "text-gray-600 hover:text-black hover:bg-slate-50"}`}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Rédiger un acte
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Alert Messages */}
        {error && (
          <div className="p-4 mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center shadow-xs">
            <ShieldAlert className="h-5 w-5 mr-3 shrink-0" />
            <div>
              <span className="font-bold">Alerte Sécuritaire :</span> {error}
            </div>
          </div>
        )}
        {success && (
          <div className="p-4 mx-6 mt-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center shadow-xs">
            <Check className="h-5 w-5 mr-3 shrink-0" />
            <div>
              <span className="font-bold">Succès GECD :</span> {success}
            </div>
          </div>
        )}

        {/* AUTOMATIC GECD METRICS & SYSTEMIC RELANCES ALERTS (Requirement 3 & 4 & 6) */}
        <div className="mx-6 mt-6 space-y-3" id="gecd-automatic-notifications-panel">
          {/* A. User Direct Imputations: Connection Alert Window (Requirement 3 & 4) */}
          {gecdDocs.filter(d => d.assignedToUserId === activeUser.id && d.status === "IMPUTE").map(d => {
            const cleanTitle = d.title.includes(" - ") ? d.title.split(" - ").slice(1).join(" - ") : d.title;
            return (
              <div 
                key={d.id} 
                className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 p-5 rounded-2xl shadow-sm text-xs font-semibold space-y-3 animate-fade-in"
                id={`user-imputed-alert-${d.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-800">
                    <span className="animate-ping rounded-full inline-block w-2.5 h-2.5 bg-amber-500 shrink-0"></span>
                    <span className="font-extrabold uppercase tracking-wide">🔔 Alerte GECD : Nouveau Courrier Imputé d'Urgence</span>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-black">
                    N° {d.numCourrier}
                  </span>
                </div>

                <div className="bg-white border border-amber-200 p-3 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <span className="text-[9px] text-amber-900 uppercase font-bold block">Objet du courrier</span>
                    <span className="text-gray-800 font-extrabold text-[12px]">{cleanTitle}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-amber-900 uppercase font-bold block">Imputé par</span>
                    <span className="text-teal-950 font-bold">{d.imputedBy || "Direction Générale"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-amber-900 uppercase font-bold block">Date Limite (Alerte)</span>
                    <span className={`font-black ${d.deadline ? "text-rose-600" : "text-gray-500"}`}>
                      {d.deadline ? new Date(d.deadline).toLocaleDateString("fr-FR") : "Aucune limite"}
                    </span>
                  </div>
                </div>

                {d.imputationInstruction && (
                  <div className="bg-amber-100/50 border border-amber-200 p-3 rounded-xl">
                    <span className="text-[9px] text-amber-900 uppercase font-black block mb-0.5">Instruction Administrative Formelle :</span>
                    <p className="text-[11px] text-amber-950 font-medium italic">&ldquo; {d.imputationInstruction} &rdquo;</p>
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-center gap-2 pt-1">
                  <p className="text-[10px] text-amber-800 leading-normal max-w-xl">
                    Conformément aux instructions GECD de la Clinique MédiSahel, vous devez impérativement <strong>accuser réception</strong> de cette instruction avant d'accéder au dossier technique.
                  </p>
                  <button 
                    onClick={() => handleAcknowledgeReceipt(d.id)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-black text-xs hover:from-amber-700 hover:to-orange-700 shadow-md transition-all flex items-center space-x-1 whitespace-nowrap cursor-pointer"
                  >
                    <CheckSquare className="h-4 w-4 mr-1" />
                    <span>Accuser Réception (S'affecter le pli)</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* B. Overdue relance alert system (Requirement 6) */}
          {/* 1. Standard user overdue alerts */}
          {overdueDocs.filter(d => d.assignedToUserId === activeUser.id).length > 0 && (
            <div className="bg-rose-50 border border-rose-350 text-rose-900 p-4 rounded-xl flex items-start space-x-3 shadow-xs" id="personal-overdue-alert-banner">
              <ShieldAlert className="h-5 w-5 mt-0.5 text-rose-600 shrink-0" />
              <div>
                <p className="font-extrabold text-[12px] uppercase tracking-wide text-rose-800">
                  ⚠️ Relance Automatique : Retard de traitement critique !
                </p>
                <p className="text-[11px] font-medium leading-normal mt-0.5 text-rose-700">
                  Vous avez {overdueDocs.filter(d => d.assignedToUserId === activeUser.id).length} courrier(s) affecté(s) dont la date limite d'instruction administrative est dépassée. Une relance automatique a été notifiée à votre Chef de service ainsi qu'à la Direction Générale. Veuillez régulariser d'urgence.
                </p>
              </div>
            </div>
          )}

          {/* 2. Chef de service notifications (Requirement 6) */}
          {isChef && overdueDocs.length > 0 && (
            <div className="bg-red-50 border border-red-300 text-red-950 p-4 rounded-xl flex items-start space-x-3 shadow-xs" id="chef-overdue-alert-banner">
              <Activity className="h-5 w-5 mt-0.5 text-red-700 shrink-0" />
              <div>
                <p className="font-black text-[12px] uppercase tracking-wide text-red-900">
                  📢 Rapports d'Écarts Chef de Service : Relance hiérarchique active
                </p>
                <p className="text-[11px] font-medium leading-normal mt-0.5 text-red-800">
                  Attention : En tant que responsable ou médecin-chef, vous êtes alerté(e) que <strong>{overdueDocs.length} pli(s)</strong> en cours de traitement clinique ou d'affectation ont dépassé le délai formel imparti. Veuillez contrôler le rendement de votre équipe ou réaffecter les dossiers d'urgence.
                </p>
              </div>
            </div>
          )}

          {/* 3. DG Alerte Relance (Requirement 6) */}
          {currentComputedRole === "DG" && overdueDocs.length > 0 && (
            <div className="bg-gradient-to-r from-red-950 to-slate-900 text-red-100 p-4 rounded-xl border border-red-850 flex items-start space-x-3 shadow-md" id="dg-overdue-alert-banner">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-sans font-extrabold text-[12px] uppercase text-red-400">
                  🚨 Cabinet DG - Tableau de bord de crise : Alertes de relances automatiques
                </p>
                <p className="text-[11px] font-normal leading-normal mt-0.5 text-red-250">
                  {overdueDocs.length} courriers sont restés sans suite au-delà de leur échéance absolue de traitement. L'orchestrateur GECD a émis des relances systémiques de niveau 1 & 2 aux services concernés. Ces dérives de calendrier sont suivies d'effet sur la conformité de service.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* TAB 1: DASHBOARD DE TRAITEMENT DES COURRIERS */}
        {activeTab === "dashboard" && (
          <div className="p-6 space-y-6" id="gecd-tab-dashboard">
            {/* Bento Grid Analytics */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-white transition-all shadow-xs animate-fade-in">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Non Traités</span>
                <div className="flex items-baseline space-x-1.5 mt-2">
                  <span className="text-3xl font-black text-blue-900">{nonTraitesCount}</span>
                  <span className="text-xs font-semibold text-blue-600">reçus</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 hover:bg-white transition-all shadow-xs">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">En Cours</span>
                <div className="flex items-baseline space-x-1.5 mt-2">
                  <span className="text-3xl font-black text-amber-900">{enCoursCount}</span>
                  <span className="text-xs font-semibold text-amber-600 font-sans">en cours</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border transition-all shadow-xs ${overdueCount > 0 ? "border-red-350 bg-red-50/50 animate-pulse" : "border-gray-200 bg-slate-50"}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block flex items-center ${overdueCount > 0 ? "text-red-755 font-bold" : "text-gray-500"}`}>
                  <AlertTriangle className="h-3 w-3 mr-1 text-red-656" /> En Retard
                </span>
                <div className="flex items-baseline space-x-1.5 mt-2">
                  <span className={`text-3xl font-black ${overdueCount > 0 ? "text-red-800" : "text-gray-700"}`}>{overdueCount}</span>
                  <span className={`text-xs font-semibold ${overdueCount > 0 ? "text-red-600" : "text-gray-500"}`}>en retard</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 hover:bg-white transition-all shadow-xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Traités</span>
                <div className="flex items-baseline space-x-1.5 mt-2">
                  <span className="text-xl lg:text-3xl font-black text-emerald-900">{traitesCount}</span>
                  <span className="text-xs font-semibold text-emerald-700">répondus</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-205 bg-slate-50 hover:bg-white transition-all shadow-xs">
                <span className="text-[10px] font-bold text-slate-705 uppercase tracking-wider block">Clôturés</span>
                <div className="flex items-baseline space-x-1.5 mt-2">
                  <span className="text-3xl font-black text-slate-800">{cloturesCount}</span>
                  <span className="text-xs font-semibold text-slate-550">clos</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-gray-150 bg-slate-50 hover:bg-white transition-all shadow-xs">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block font-sans">Archivés</span>
                <div className="flex items-baseline space-x-1.5 mt-2">
                  <span className="text-3xl font-black text-slate-800">{archivesCount}</span>
                  <span className="text-xs font-semibold text-gray-500">sauvegardés</span>
                </div>
              </div>
            </div>

            {/* 🚨 CONSOLE DE SUIVI DES RETARDS POUR LA DIRECTION GÉNÉRALE (Adama S.) */}
            {overdueCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3" id="gecd-overdue-console">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-605 animate-bounce" />
                  <h3 className="font-sans font-bold text-sm text-red-900">
                    Alerte Direction Générale : {overdueCount} {overdueCount > 1 ? "courriers administratifs sont actuellement en retard" : "courrier administratif est actuellement en retard"}
                  </h3>
                </div>
                <p className="text-xs text-red-700 leading-relaxed">
                  En vertu du règlement intérieur de la Clinique MédiSahel, ces dossiers ont dépassé leur date d'échéance d'affectation et requièrent une intervention corrective prioritaire.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-white rounded-xl overflow-hidden border border-red-100 shadow-xs">
                    <thead>
                      <tr className="bg-red-100 text-red-900 font-bold uppercase tracking-wider text-[10px] border-b">
                        <th className="p-3">N° Courrier</th>
                        <th className="p-3">Objet</th>
                        <th className="p-3">Service & Responsable Concerné</th>
                        <th className="p-3">Date Limite Réception</th>
                        <th className="p-3 text-right">Nombre Jours Retard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50">
                      {gecdDocs.filter(d => {
                        if (d.status === "TRAITE" || d.status === "CLOTURE" || d.status === "ARCHIVE" || d.status === "REPONDU") return false;
                        if (!d.deadline) return false;
                        return new Date(d.deadline) < new Date(todayStr);
                      }).map(d => {
                        const days = getDaysOverdue(d.deadline);
                        return (
                          <tr key={d.id} className="hover:bg-red-50/50 text-red-950 font-medium">
                            <td className="p-3 font-mono font-bold text-red-800">{d.numCourrier}</td>
                            <td className="p-3 text-slate-800 font-sans">{d.title}</td>
                            <td className="p-3 font-mono text-slate-600 text-[11px]">
                              <span className="font-bold text-slate-800 block">Service : {d.serviceDestinataire || "Administration"}</span>
                              <span className="block text-teal-700 font-semibold text-[10px]">Responsable : {d.assignedResponsable || d.assignedToUserName || "Non affecté"}</span>
                            </td>
                            <td className="p-3 font-sans font-semibold text-slate-700">{d.deadline}</td>
                            <td className="p-3 text-right text-xs font-black text-rose-700 font-mono">
                              ⚠️ {days} {days > 1 ? "jours" : "jour"} de retard
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 📊 TABLEAU DE SUPERVISION ET SUIVI DG (AVANCEMENT CLINIQUE V2) */}
            <div className="border border-slate-200 bg-white rounded-2xl p-6 space-y-4 animate-fade-in" id="gecd-dg-supervision-panel">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-3">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 flex items-center">
                    <ShieldCheck className="h-4.5 w-4.5 text-teal-700 mr-2" />
                    Tableau de Supervision de l'Établissement (Supervision Directeur Général)
                  </h3>
                  <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                    Routage d'actes scellés, taux d'avancement automatique, imputations cliniques en cascade et audit logs rattachés.
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0 animate-pulse">
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-red-100 text-red-900 rounded-lg uppercase border border-red-200 font-mono flex items-center">
                    <span className="h-2 w-2 bg-red-650 rounded-full mr-1.5 inline-block animate-ping"></span>
                    MONITORING DIRECTEUR GÉNÉRAL (DG)
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800 border-collapse" id="gecd-dg-supervision-table">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b">
                      <th className="p-3">Numéro</th>
                      <th className="p-3">Objet du courrier</th>
                      <th className="p-3">Date Réception</th>
                      <th className="p-3">Responsable</th>
                      <th className="p-3">Date Limite de Traitement</th>
                      <th className="p-3">Statut Actuel</th>
                      <th className="p-3 text-right">Taux d'Avancement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {gecdDocs.filter(d => d.gecdType === "entrant").length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400">Aucun pli entrant enregistré dans le régistre GECD.</td>
                      </tr>
                    ) : (
                      gecdDocs.filter(d => d.gecdType === "entrant").map((doc) => {
                        const isOver = doc.deadline && (new Date(doc.deadline) < new Date(todayStr)) && doc.status !== "TRAITE" && doc.status !== "ARCHIVE" && doc.status !== "REPONDU" && doc.status !== "CLOTURE";
                        const progress = doc.progressPercentage || (doc.status === "RECU" ? 10 : doc.status === "IMPUTE" ? 25 : doc.status === "AFFECTE" ? 40 : doc.status === "EN_COURS" ? 60 : doc.status === "REPONSE_PREPAREE" ? 85 : 100);
                        return (
                          <tr 
                            key={doc.id} 
                            onClick={() => { setSelectedDocId(doc.id); setActiveTab("entrant"); }}
                            className={`hover:bg-slate-50/50 transition-colors pointer cursor-pointer ${isOver ? "bg-rose-50/10 border-l-2 border-l-rose-500" : ""}`}
                          >
                            <td className="p-3 font-mono font-bold text-teal-900 text-xs whitespace-nowrap">
                              {doc.numCourrier}
                            </td>
                            <td className="p-3">
                              <div>
                                <span className="font-bold text-slate-900 block">{doc.title}</span>
                                {doc.reference && <span className="text-[9px] text-gray-400 font-mono block">Réf : {doc.reference}</span>}
                              </div>
                            </td>
                            <td className="p-3 text-gray-500 font-mono whitespace-nowrap">
                              {doc.dateCourrier}
                            </td>
                            <td className="p-3">
                              <div className="leading-tight">
                                <span className="font-semibold block text-slate-800">{doc.assignedResponsable || doc.assignedToUserName || "Non imputé"}</span>
                                <span className="text-[10px] text-gray-400 block font-mono uppercase">{doc.serviceDestinataire || "Aucun service"}</span>
                              </div>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`font-semibold ${isOver ? "text-red-650 font-bold" : "text-slate-700"}`}>
                                {doc.deadline || "Aucun délai"}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider select-none ${
                                isOver ? "bg-red-100 text-red-800 border border-red-200" :
                                doc.status === "EN_ATTENTE_IMPUTATION" ? "bg-sky-50 text-sky-800 border border-sky-100 font-bold" :
                                doc.status === "RECU" ? "bg-sky-50 text-sky-700 border border-sky-100" :
                                doc.status === "IMPUTE" ? "bg-indigo-50 text-indigo-700 border border-indigo-150 font-bold" :
                                doc.status === "PRIS_EN_CHARGE" ? "bg-purple-50 text-purple-800 border border-purple-200 font-bold animate-pulse" :
                                doc.status === "AFFECTE" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                                doc.status === "EN_COURS" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                doc.status === "REPONSE_PREPAREE" ? "bg-pink-50 text-pink-700 border border-pink-100" :
                                doc.status === "EN_ATTENTE_VALIDATION" ? "bg-rose-50 text-rose-700 border border-rose-200 font-bold animate-pulse" :
                                doc.status === "VALIDE" || doc.status === "EN_ATTENTE_EXPEDITION" ? "bg-teal-50 text-teal-800 border border-teal-200 font-bold" :
                                doc.status === "EXPEDIE" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                                doc.status === "REPONDU" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                doc.status === "TRAITE" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
                                doc.status === "CLOTURE" ? "bg-slate-100 text-slate-800 border border-slate-300" :
                                "bg-slate-100 text-slate-700 border"
                              }`}>
                                {isOver ? "En retard (Délai dépassé)" : (
                                  doc.status === "EN_ATTENTE_IMPUTATION" ? "En attente d'imputation" :
                                  doc.status === "RECU" ? "Reçu / Registre" :
                                  doc.status === "IMPUTE" ? "Imputé" :
                                  doc.status === "PRIS_EN_CHARGE" ? "Pris en charge" :
                                  doc.status === "AFFECTE" ? "Affecté" :
                                  doc.status === "EN_COURS" ? "En cours de traitement" :
                                  doc.status === "REPONSE_PREPAREE" ? "Réponse préparée" :
                                  doc.status === "EN_ATTENTE_VALIDATION" ? "En attente de validation" :
                                  doc.status === "VALIDE" || doc.status === "EN_ATTENTE_EXPEDITION" ? "Validé / Attente expéd." :
                                  doc.status === "EXPEDIE" ? "Expédié" :
                                  doc.status === "REPONDU" ? "Répondu" :
                                  doc.status === "TRAITE" ? "Traité" :
                                  doc.status === "CLOTURE" ? "Clôturé" : "Archivé"
                                )}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <span className="font-mono font-bold text-teal-800">{progress}%</span>
                                <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${isOver ? "bg-rose-500 animate-pulse" : progress === 100 ? "bg-emerald-500" : "bg-teal-600"}`} 
                                    style={{ width: `${progress}%` }} 
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Double column recent feeds */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Entrants feed list */}
              <div className="border border-gray-150 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-sm text-gray-800 flex items-center">
                    <Inbox className="h-4 w-4 text-sky-600 mr-2" />
                    Flux Réception Clinique (Récentes Entrées)
                  </h3>
                  <button 
                    onClick={() => setActiveTab("entrant")}
                    className="text-xs text-teal-700 hover:underline font-bold flex items-center"
                  >
                    Voir tout <ChevronRight className="h-3 w-3 ml-0.5" />
                  </button>
                </div>

                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {entrantsTotal.length === 0 ? (
                    <div className="text-center py-10 text-xs text-gray-400">Aucun courrier entrant disponible.</div>
                  ) : (
                    entrantsTotal.slice(0, 5).map(doc => (
                      <div 
                        key={doc.id} 
                        onClick={() => { setSelectedDocId(doc.id); setActiveTab("entrant"); }}
                        className="py-3 hover:bg-slate-50/50 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-teal-950 font-mono">{doc.numCourrier}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-black font-mono uppercase ${
                              doc.priority === "HAUTE" ? "bg-rose-100 text-rose-800" : doc.priority === "MOYENNE" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                            }`}>
                              {doc.priority}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-gray-800 line-clamp-1">{doc.title}</p>
                          <p className="text-[10px] text-gray-400">Expéditeur: <span className="text-gray-600 font-medium">{doc.sender}</span></p>
                        </div>
                        <div className="text-right space-y-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider block ${
                            doc.status === "RECU" ? "bg-sky-50 text-sky-700 border border-sky-100" :
                            doc.status === "AFFECTE" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                            doc.status === "EN_COURS" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                            doc.status === "TRAITE" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                            "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {doc.status}
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono block">{doc.dateCourrier}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sortants feed list */}
              <div className="border border-gray-150 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-sm text-gray-800 flex items-center">
                    <Send className="h-4 w-4 text-purple-600 mr-2" />
                    Correspondances Émises & Registre Sortants
                  </h3>
                  <button 
                    onClick={() => setActiveTab("sortant")}
                    className="text-xs text-teal-700 hover:underline font-bold flex items-center"
                  >
                    Voir tout <ChevronRight className="h-3 w-3 ml-0.5" />
                  </button>
                </div>

                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {sortantsTotal.length === 0 ? (
                    <div className="text-center py-10 text-xs text-gray-400">Aucune correspondance sortante émise.</div>
                  ) : (
                    sortantsTotal.slice(0, 5).map(doc => (
                      <div 
                        key={doc.id} 
                        onClick={() => { setSelectedDocId(doc.id); setActiveTab("sortant"); }}
                        className="py-3 hover:bg-slate-50/50 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-purple-950 font-mono">{doc.numCourrier}</span>
                            <span className="text-[10px] text-gray-400 font-mono">Réf: {doc.reference}</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-800 line-clamp-1">{doc.title}</p>
                          <p className="text-[10px] text-gray-400">Destinataire: <span className="text-gray-600 font-medium">{doc.recipient}</span></p>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold block">
                            TRANSMIS & ARCHIVÉ
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono block">{doc.dateCourrier}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 & 3: INCOMING & OUTGOING MAIL REGISTERS */}
        {(activeTab === "entrant" || activeTab === "sortant" || activeTab === "admin_doc") && (
          <div className="p-6 space-y-6">
            {/* Registers header & stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-gray-800">
                  {activeTab === "entrant" ? "Registre Général des Courriers Entrants" : 
                   activeTab === "sortant" ? "Registre des Courriers Sortants & Transmissions" :
                   "Registre des Actes Administratifs de l'Établissement"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Visualisez, filtrez, affectez et tracez l'intégralité du cycle de traitement administratif.
                </p>
              </div>

              {/* Create new buttons in respective register tabs */}
              {isSec && activeTab === "entrant" && (
                <button
                  onClick={() => {
                    alert("Pour numériser un nouveau courrier entrant, veuillez remplir le formulaire de saisie au bas de la page.");
                    const element = document.getElementById("entrant-create-form-section");
                    if (element) element.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-semibold hover:bg-teal-800 transition-colors flex items-center shrink-0 shadow-xs"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nouveau Courrier Entrant
                </button>
              )}
              {isSec && activeTab === "sortant" && (
                <button
                  onClick={() => {
                    alert("Pour rédiger une correspondance officielle, veuillez remplir le formulaire au bas de la page.");
                    const element = document.getElementById("sortant-create-form-section");
                    if (element) element.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-semibold hover:bg-teal-800 transition-colors flex items-center shrink-0 shadow-xs"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nouveau Courrier Sortant
                </button>
              )}
            </div>

            {/* SEARCH & ADVANCED MULTI-CRITERIA FILTER ACTIONS */}
            <div className="bg-slate-50 border rounded-2xl p-4 space-y-4" id="gecd-advanced-filters">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-gray-700 flex items-center">
                  <Search className="h-3.5 w-3.5 mr-1.5 text-teal-700" />
                  Moteur de Recherche Avancée GECD
                </span>
                <button
                  onClick={triggerSearchReset}
                  className="text-[10px] text-teal-800 font-bold hover:underline"
                >
                  Réinitialiser tous les filtres
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1">Mots-clés / Titre</label>
                  <input
                    type="text"
                    placeholder="Mots-clés ou objet..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200.5 rounded-lg text-xs px-2.5 h-8.5 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1">N° Courrier / Acte</label>
                  <input
                    type="text"
                    placeholder="e.g. EN-2026..."
                    value={searchNum}
                    onChange={e => setSearchNum(e.target.value)}
                    className="w-full bg-white border border-gray-200.5 rounded-lg text-xs px-2.5 h-8.5 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1">Référence d'origine</label>
                  <input
                    type="text"
                    placeholder="e.g. REF-ABC..."
                    value={searchRef}
                    onChange={e => setSearchRef(e.target.value)}
                    className="w-full bg-white border border-gray-200.5 rounded-lg text-xs px-2.5 h-8.5 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1">
                    {activeTab === "entrant" ? "Expéditeur" : "Destinataire"}
                  </label>
                  <input
                    type="text"
                    placeholder={activeTab === "entrant" ? "e.g. INPS, Ministre..." : "e.g. Usager, Cabinet..."}
                    value={activeTab === "entrant" ? searchSender : searchRecipient}
                    onChange={e => activeTab === "entrant" ? setSearchSender(e.target.value) : setSearchRecipient(e.target.value)}
                    className="w-full bg-white border border-gray-200.5 rounded-lg text-xs px-2.5 h-8.5 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1">Service hospitalier impliqué</label>
                  <input
                    type="text"
                    placeholder="e.g. Administration, Laboratoire..."
                    value={searchService}
                    onChange={e => setSearchService(e.target.value)}
                    className="w-full bg-white border border-gray-200.5 rounded-lg text-xs px-2.5 h-8.5 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1">Priorité administrative</label>
                  <select
                    value={searchPriority}
                    onChange={e => setSearchPriority(e.target.value)}
                    className="w-full bg-white border border-gray-200.5 rounded-lg text-xs px-2 h-8.5 focus:ring-1 focus:ring-teal-700 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Toutes les priorités</option>
                    <option value="HAUTE">HAUTE (Urgent)</option>
                    <option value="MOYENNE">MOYENNE</option>
                    <option value="BASSE">BASSE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1">Statut du circuit de traitement</label>
                  <select
                    value={searchStatus}
                    onChange={e => setSearchStatus(e.target.value)}
                    className="w-full bg-white border border-gray-200.5 rounded-lg text-xs px-2 h-8.5 focus:ring-1 focus:ring-teal-700 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Tous les statuts de traitement</option>
                    <option value="RECU">REÇU (Non Traité)</option>
                    <option value="AFFECTE">AFFECTÉ (Service/Agent)</option>
                    <option value="EN_COURS">EN COURS DE TRAITEMENT</option>
                    <option value="TRAITE">TRAITÉ & CLÔTURÉ</option>
                    <option value="ARCHIVE">ARCHIVÉ DÉFINITIF</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SPLIT TABLE / WORKFLOW SIDE PANEL CONTAINER */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Register Table List (Takes 2/3 of space when item selected) */}
              <div className={`${selectedDocId ? "xl:col-span-2" : "xl:col-span-3"} transition-all space-y-4`}>
                <div className="bg-white rounded-xl border border-gray-150 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" id="gecd-registers-table">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-gray-150">
                          <th className="p-3">Numéro</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Objet du courrier</th>
                          <th className="p-3">{activeTab === "entrant" ? "Expéditeur" : "Destinataire / Type"}</th>
                          <th className="p-3">Priorité</th>
                          <th className="p-3">Circuit / Dest.</th>
                          <th className="p-3 text-center">Statut</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs text-slate-800">
                        {filteredGecdDocs.filter(d => activeTab === "admin_doc" ? d.gecdType === "administratif" : d.gecdType === activeTab).length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-gray-500 text-xs">
                              Aucun pli ou acte de ce type ne correspond aux critères de recherche active ou au rôle de simulation actuel.
                            </td>
                          </tr>
                        ) : (
                          filteredGecdDocs.filter(d => activeTab === "admin_doc" ? d.gecdType === "administratif" : d.gecdType === activeTab).map(doc => {
                            const isOverdue = doc.deadline && (new Date(doc.deadline) < new Date(todayStr)) && doc.status !== "TRAITE" && doc.status !== "ARCHIVE";
                            return (
                              <tr 
                                key={doc.id}
                                className={`hover:bg-slate-50/70 transition-colors pointer cursor-pointer ${selectedDocId === doc.id ? "bg-slate-100/50 border-l-4 border-l-teal-700" : ""}`}
                                onClick={() => {
                                  setSelectedDocId(doc.id);
                                  // Pre-fill workflow forms with target doc attributes
                                  setWorkflowPriority(doc.priority);
                                  setWorkflowDeadline(doc.deadline || "");
                                  if (doc.assignedToUserId) {
                                    setWorkflowAssignUser(doc.assignedToUserId);
                                  }
                                  setWorkflowAssignService(doc.serviceDestinataire || "");
                                }}
                              >
                                <td className="p-3 font-mono font-bold text-teal-950 whitespace-nowrap">
                                  {doc.numCourrier}
                                </td>
                                <td className="p-3 text-gray-500 font-mono whitespace-nowrap">
                                  {doc.dateCourrier}
                                </td>
                                <td className="p-3 font-medium text-slate-900">
                                  <div>
                                    <p className="line-clamp-1">{doc.title}</p>
                                    <p className="text-[10px] text-gray-400 font-mono">Réf: {doc.reference || "AUCUNE"}</p>
                                  </div>
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  {activeTab === "entrant" ? (
                                    <span className="font-semibold text-gray-800">{doc.sender}</span>
                                  ) : activeTab === "sortant" ? (
                                    <span className="font-semibold text-gray-800">{doc.recipient}</span>
                                  ) : (
                                    <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 border uppercase">
                                      {doc.numCourrier.includes("-NTS-") ? "Note de Service" : doc.numCourrier.includes("-DEC-") ? "Décision" : doc.numCourrier.includes("-CTR-") ? "Contrat" : "Procès-Verbal"}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                    doc.priority === "HAUTE" ? "bg-red-100 text-red-800" : doc.priority === "MOYENNE" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                                  }`}>
                                    {doc.priority}
                                  </span>
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <div className="text-[11px] leading-tight text-gray-600">
                                    <span className="block font-medium">Service: {doc.serviceDestinataire || doc.serviceEmetteur}</span>
                                    {doc.assignedToUserName && (
                                      <span className="text-[10px] text-teal-700 flex items-center mt-0.5 font-sans font-semibold">
                                        <UserCheck className="h-2.5 w-2.5 mr-0.5" />
                                        {doc.assignedToUserName}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-center whitespace-nowrap">
                                  <div className="space-y-1">
                                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider select-none ${
                                      doc.status === "RECU" ? "bg-sky-100 text-sky-800 border" :
                                      doc.status === "AFFECTE" ? "bg-purple-100 text-purple-800 border" :
                                      doc.status === "EN_COURS" ? "bg-amber-100 text-amber-800 border" :
                                      doc.status === "TRAITE" ? "bg-emerald-100 text-emerald-800 border" :
                                      "bg-slate-200 text-slate-700 border"
                                    }`}>
                                      {doc.status}
                                    </span>
                                    {isOverdue && (
                                      <span className="block text-[8px] font-black text-rose-700 animate-pulse bg-rose-100/50 rounded py-0.5 border border-rose-200 uppercase tracking-tight">
                                        ⚠️ RETARD ({doc.deadline})
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end space-x-1">
                                    <button
                                      onClick={() => triggerSimulationExport("PDF", doc.numCourrier)}
                                      className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded text-slate-600"
                                      title="Composter & Exporter en PDF"
                                    >
                                      <FileDown className="h-3.5 w-3.5" />
                                    </button>
                                    {isAdm && (
                                      <button
                                        onClick={() => handleDelete(doc.id, doc.numCourrier)}
                                        className="p-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded"
                                        title="Déchiqueter du registre"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Side Workflow Timeline & Assigned Circuit Board (1/3 space when open) */}
              {selectedGecdDoc && (
                <div className="bg-white rounded-2xl border border-teal-700 p-5 space-y-5 shadow-lg animate-fade-in text-xs h-fit xl:col-span-1 border-t-8" id="workflow-side-panel">
                  <div className="flex items-start justify-between border-b pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wide font-sans">{selectedGecdDoc.gecdType === "entrant" ? "COURRIER ENTRANT" : selectedGecdDoc.gecdType === "sortant" ? "COURRIER SORTANT" : "ANNALS ADMINISTRATIFS"}</span>
                      <h4 className="text-sm font-bold text-gray-900 mt-1 font-mono">{selectedGecdDoc.numCourrier}</h4>
                    </div>
                    <button
                      onClick={() => setSelectedDocId(null)}
                      className="text-xs text-gray-400 hover:text-black font-black bg-slate-100 rounded px-1.5 py-0.5"
                    >
                      Masquer
                    </button>
                  </div>

                  {/* Mail Brief card */}
                  <div className="bg-slate-50 border p-3 rounded-xl space-y-2">
                    <h5 className="font-bold text-xs text-gray-900 leading-tight">{selectedGecdDoc.title}</h5>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 mt-2 font-mono">
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-gray-400">Date Initiale</span>
                        <span className="text-slate-800 font-semibold">{selectedGecdDoc.dateCourrier}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-gray-400">Référence Acte</span>
                        <span className="text-slate-800 font-semibold">{selectedGecdDoc.reference}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-gray-400">Expéditeur d'origine</span>
                        <span className="text-slate-800 font-semibold truncate block">{selectedGecdDoc.sender}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-gray-400">Date Limite de Trém.</span>
                        <span className="text-slate-800 font-semibold block">{selectedGecdDoc.deadline || "Aucune"}</span>
                      </div>
                    </div>

                    {selectedGecdDoc.realDescription && (
                      <div className="mt-3 border-t pt-2 text-[11px] text-gray-600 bg-white p-2 rounded border leading-relaxed overflow-y-auto max-h-[140px] whitespace-pre-wrap font-sans">
                        {selectedGecdDoc.realDescription}
                      </div>
                    )}
                  </div>

                  {/* Attachment vault simulated file rendering */}
                  <div className="border border-sky-100 bg-sky-50/40 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-7 w-7 text-sky-600" />
                      <div>
                        <span className="block font-bold text-gray-800 truncate text-[11px] max-w-[150px]">
                          {selectedGecdDoc.numCourrier.toLowerCase()}.pdf
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono uppercase">CONFORMITÉ CHIFfré GECD VAULT</span>
                      </div>
                    </div>
                    <button
                      onClick={() => triggerSimulationExport("PDF", selectedGecdDoc.numCourrier)}
                      className="p-1 bg-white border rounded text-sky-700 hover:bg-sky-50"
                      title="Lire l'archive"
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* ⚡ ENHANCED GECD WORKFLOW BOARD */}
                  <div className="space-y-4">
                    {/* SECTION 1: IMPUTATION HIÉRARCHIQUE (Only for DG, DOCTOR, ADMIN) */}
                    {selectedGecdDoc.gecdType === "entrant" && (isDir || currentComputedRole === "DOCTOR") && (
                      <div className="border border-teal-200 bg-teal-50/50 p-4 rounded-xl space-y-3" id="gecd-imputation-section">
                        <div className="flex items-center space-x-1.5 border-b pb-1.5 border-teal-100">
                          <ShieldCheck className="h-4 w-4 text-teal-800" />
                          <h4 className="font-bold text-xs text-teal-900 uppercase">
                            Système d'Imputation Hiérarchique
                          </h4>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-teal-850 mb-0.5">Service clinique destiné</label>
                              <select
                                value={imputService}
                                onChange={e => setImputService(e.target.value)}
                                className="w-full bg-white border border-teal-200 text-[11px] h-8 px-2 rounded-lg"
                              >
                                <option value="Administration">Administration</option>
                                <option value="Soin / Hospitalisation">Soin / Hospitalisation</option>
                                <option value="Pharmacie / Stocks">Pharmacie / Stocks</option>
                                <option value="Laboratoire / Examens">Laboratoire / Examens</option>
                                <option value="Caisse / Comptabilité">Caisse / Comptabilité</option>
                                <option value="Ressources Humaines">Ressources Humaines</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-teal-850 mb-0.5">Responsable Désigné</label>
                              <input
                                type="text"
                                placeholder="Nom du Chef e.g. Moussa Traoré"
                                value={imputResponsable}
                                onChange={e => setImputResponsable(e.target.value)}
                                className="w-full bg-white border border-teal-200 text-[11px] h-8 px-2 rounded-lg font-sans"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-teal-850 mb-0.5">Agent Titulaire</label>
                              <select
                                value={imputToUser}
                                onChange={e => setImputToUser(e.target.value)}
                                className="w-full bg-white border border-teal-200 text-[11px] h-8 px-2 rounded-lg"
                              >
                                <option value="">Sélectionner un agent...</option>
                                {usersList.map(usr => (
                                  <option key={usr.id} value={usr.id}>{usr.name} ({usr.role})</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-teal-850 mb-0.5">Date Échéance (Délai)</label>
                              <input
                                type="date"
                                value={imputDeadline}
                                onChange={e => setImputDeadline(e.target.value)}
                                className="w-full bg-white border border-teal-200 text-[11px] h-8 px-2 rounded-lg"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-teal-850 mb-0.5">Instruction Spécifique (Cahier des charges)</label>
                            <textarea
                              placeholder='e.g. "Préparer une réponse et transmettre le dossier d&apos;ici le 15/06/2026"'
                              value={imputInstruction}
                              onChange={e => setImputInstruction(e.target.value)}
                              className="w-full bg-white border border-teal-200 rounded-lg p-2 text-[11px] font-sans"
                              rows={2}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleImputation(selectedGecdDoc.id)}
                            className="w-full px-3 py-1.5 bg-teal-800 text-white rounded-lg font-bold hover:bg-teal-900 transition-colors flex items-center justify-center space-x-1"
                          >
                            <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                            <span>Signer & Imputer le pli (Code DG)</span>
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedGecdDoc.imputedBy && (
                      <div className="bg-teal-50 border border-teal-150 p-3 rounded-xl space-y-1">
                        <span className="text-[9px] font-bold uppercase text-teal-850 block">IMPUTATION ACTIVE</span>
                        <p className="text-[11px] text-gray-700">
                          Imputé par : <strong>{selectedGecdDoc.imputedBy}</strong> au service <strong>{selectedGecdDoc.serviceDestinataire}</strong>
                        </p>
                        {selectedGecdDoc.assignedResponsable && (
                          <p className="text-[11px] text-gray-750">
                            Responsable Clinique : <strong className="text-teal-900">{selectedGecdDoc.assignedResponsable}</strong>
                          </p>
                        )}
                        {selectedGecdDoc.imputationInstruction && (
                          <div className="bg-white border rounded p-1.5 mt-1 border-teal-100 text-[10px] text-slate-650 italic leading-normal">
                            &ldquo; {selectedGecdDoc.imputationInstruction} &rdquo;
                          </div>
                        )}
                      </div>
                    )}

                    {/* CIRCUIT & LIFECYCLE OPERATIONS WORKFLOW WORK (Requirement 3 & 4 & 11) */}
                    <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-xl space-y-4" id="gecd-circuit-actions-board">
                      <div className="flex items-center space-x-1.5 border-b pb-1.5 border-slate-200">
                        <Activity className="h-3.5 w-3.5 text-teal-900" />
                        <h4 className="font-bold text-xs text-gray-800 uppercase">
                          Cycle de Vie & Actions de Traitement GECD
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {/* A. ACCUSER RÉCEPTION (PRIS EN CHARGE - STATUS: IMPUTE -> PRIS_EN_CHARGE) */}
                        {selectedGecdDoc.status === "IMPUTE" && (
                          <div className="border border-orange-200 bg-orange-50/70 p-3 rounded-xl space-y-2" id="workflow-ack-block">
                            <span className="text-[9px] font-bold uppercase text-orange-850 block">⚡ Saisie Obligatoire de Réception</span>
                            <p className="text-[10px] text-gray-600 leading-normal">
                              Vous devez accuser réception formellement de cette instruction d'imputation clinique avant de pouvoir archiver les travaux.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleAcknowledgeReceipt(selectedGecdDoc.id)}
                              className="w-full py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg font-bold text-[11px] hover:from-orange-750 hover:to-amber-750 flex items-center justify-center space-x-1 cursor-pointer"
                            >
                              <CheckSquare className="h-4 w-4 mr-1" />
                              <span>Confirmer Accusé de Réception (Tracé)</span>
                            </button>
                          </div>
                        )}

                        {/* B. DEMANDER VALIDATION HIÉRARCHIQUE (STATUS: PRIS_EN_CHARGE/EN_COURS -> EN_ATTENTE_VALIDATION) */}
                        {(selectedGecdDoc.status === "PRIS_EN_CHARGE" || selectedGecdDoc.status === "EN_COURS") && (
                          <div className="border border-indigo-200 bg-indigo-50/50 p-3 rounded-xl space-y-2" id="workflow-validation-request-block">
                            <span className="text-[9px] font-bold uppercase text-indigo-850 block">🚀 Validation & Signature du Cabinet</span>
                            <p className="text-[10px] text-gray-600 leading-normal">
                              Le traitement de ce pli de correspondance est finalisé ou le projet de réponse rédigé ? Soumettez-le pour validation légale au DG:
                            </p>
                            <textarea
                              placeholder="Notes et justifications à l'attention de la Direction..."
                              value={workflowComment}
                              onChange={e => setWorkflowComment(e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded p-1.5 text-[11px] font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              rows={2}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                handleRequestValidation(selectedGecdDoc.id, workflowComment);
                                setWorkflowComment("");
                              }}
                              className="w-full py-2 bg-indigo-700 text-white rounded-lg font-bold text-[11px] hover:bg-indigo-850 flex items-center justify-center space-x-1 cursor-pointer"
                            >
                              <Send className="h-3.5 w-3.5 mr-1" />
                              <span>Transmettre pour Validation Clinique</span>
                            </button>
                          </div>
                        )}

                        {/* C. SIGNER & VALIDER L'ACTE (STATUS: EN_ATTENTE_VALIDATION -> VALIDE) */}
                        {selectedGecdDoc.status === "EN_ATTENTE_VALIDATION" && (isDir || currentComputedRole === "DG") && (
                          <div className="border border-emerald-200 bg-emerald-50/70 p-3 rounded-xl space-y-2" id="workflow-sign-validate-block">
                            <span className="text-[9px] font-black uppercase text-emerald-800 block">✅ Validation Hiérarchique Recommandée</span>
                            <p className="text-[10px] text-emerald-950 font-medium leading-normal">
                              Dossier en attente de visa réglementaire. Cliquez ci-dessous pour certifier de votre seing et autoriser l'expédition formelle.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleValidateDocument(selectedGecdDoc.id)}
                              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-extrabold text-[11px] flex items-center justify-center space-x-1 cursor-pointer"
                            >
                              <ShieldCheck className="h-4.5 w-4.5 mr-1" />
                              <span>Prêter Visa & Autoriser l'Expédition</span>
                            </button>
                          </div>
                        )}

                        {/* D. ENVOI & EXPÉDITION (STATUS: VALIDE/EN_ATTENTE_EXPEDITION -> EXPEDIE pour Secrétariat) */}
                        {(selectedGecdDoc.status === "VALIDE" || selectedGecdDoc.status === "EN_ATTENTE_EXPEDITION") && isSec && (
                          <div className="border border-sky-200 bg-sky-50/70 p-3 rounded-xl space-y-3" id="workflow-expedition-form-block">
                            <span className="text-[9px] font-black uppercase text-sky-850 block">📤 Registre physique d'expédition courrier</span>
                            <p className="text-[10px] text-slate-750 leading-normal mb-1">
                              Ce pli a reçu le visa du DG. Renseignez le journal logistique légal d'expédition :
                            </p>
                            <div className="space-y-2 text-[10px]">
                              <div>
                                <label className="block text-[8px] uppercase font-bold text-slate-500 mb-0.5">Mode d'expédition physique</label>
                                <select
                                  value={expeditionMethod}
                                  onChange={e => setExpeditionMethod(e.target.value)}
                                  className="w-full bg-white border border-gray-200 select-none h-7 px-2 rounded-lg"
                                >
                                  <option value="Porteur spécial Clinique">Porteur spécial Clinique</option>
                                  <option value="Courrier ordinaire postal">Courrier ordinaire postal</option>
                                  <option value="Courrier recommandé avec AR">Courrier recommandé avec AR</option>
                                  <option value="Transmission Numérique Signée (Email/GECD)">Transmission Numérique Signée</option>
                                  <option value="DHL / Express International">DHL / Express International</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[8px] uppercase font-bold text-slate-500 mb-0.5">Destinataire Physique Final</label>
                                <input
                                  type="text"
                                  value={expeditionRecipient}
                                  onChange={e => setExpeditionRecipient(e.target.value)}
                                  placeholder="e.g. Mutuelle des Fonctionnaires du Mali"
                                  className="w-full bg-white border border-gray-200 rounded px-2 h-7"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] uppercase font-bold text-slate-500 mb-0.5">N° de Bordereau GECD de Sortie</label>
                                <input
                                  type="text"
                                  value={expeditionBordereau}
                                  onChange={e => setExpeditionBordereau(e.target.value)}
                                  placeholder="e.g. BEX-2026-0041"
                                  className="w-full bg-white border border-gray-200 rounded px-2 h-7 font-mono text-[10px]"
                                />
                              </div>
                              <div className="flex items-center space-x-2 py-1">
                                <input
                                  type="checkbox"
                                  id="detail-need-ack"
                                  checked={expeditionNeedAck}
                                  onChange={e => setExpeditionNeedAck(e.target.checked)}
                                  className="cursor-pointer accent-teal-800"
                                />
                                <label htmlFor="detail-need-ack" className="font-extrabold text-slate-800 cursor-pointer select-none">
                                  Exiger retour de signature d'Accusé Réception
                                </label>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!expeditionRecipient || !expeditionBordereau) {
                                    alert("Attention: Veuillez compléter l'ensemble des informations de destination physique.");
                                    return;
                                  }
                                  handleExpediteDocument(
                                    selectedGecdDoc.id,
                                    expeditionMethod,
                                    expeditionRecipient,
                                    expeditionBordereau,
                                    expeditionNeedAck
                                  );
                                  setExpeditionRecipient("");
                                  setExpeditionBordereau("");
                                  setExpeditionNeedAck(false);
                                }}
                                className="w-full py-2 bg-sky-700 hover:bg-sky-850 text-white rounded-lg font-black text-[11px] flex items-center justify-center space-x-1 cursor-pointer"
                              >
                                <Send className="h-3.5 w-3.5 mr-1" />
                                <span>Expédier officiellement le pli</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* E. EXPEDITION COMPLETED DETAILS LOG (If status is EXPEDIE) */}
                        {selectedGecdDoc.status === "EXPEDIE" && (
                          <div className="border border-slate-300 bg-slate-100 p-3 rounded-xl space-y-1.5" id="workflow-expedie-details-summary">
                            <span className="text-[9px] font-black uppercase text-slate-850 block flex items-center">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-700 mr-1 shrink-0" />
                              Pli officiellement expédié
                            </span>
                            <div className="text-[10px] text-gray-750 font-sans space-y-1 mt-1 leading-normal">
                              <p>Mode logistique : <strong className="text-gray-900">{selectedGecdDoc.expeditionMethod || "Non-spécifié"}</strong></p>
                              <p>Destinataire final : <strong className="text-gray-900">{selectedGecdDoc.expeditionRecipient || "Tiers"}</strong></p>
                              <p>N° Bordereau GECD : <strong className="text-gray-900 font-mono">{selectedGecdDoc.expeditionBordereau || "N/A"}</strong></p>
                              {selectedGecdDoc.expeditionDate && (
                                <p>Date de départ : <strong className="text-gray-900">{new Date(selectedGecdDoc.expeditionDate).toLocaleDateString("fr-FR")}</strong></p>
                              )}
                              <p>Exigence Récépissé : <strong>{selectedGecdDoc.expeditionNeedAck ? "Oui (En attente de retour)" : "Non requis"}</strong></p>
                            </div>
                          </div>
                        )}

                        {/* Default notice if no active action is available based on simple state rule */}
                        {!isSec && !isDir && selectedGecdDoc.status !== "IMPUTE" && selectedGecdDoc.status !== "PRIS_EN_CHARGE" && selectedGecdDoc.status !== "EN_COURS" && selectedGecdDoc.status !== "EXPEDIE" && (
                          <p className="text-[10px] text-gray-400 italic text-center">
                            Aucune action supplémentaire requise de votre rôle actif sur ce pli administratif.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* SECTION 2: ANNOTATIONS & OBSERVATIONS (All users - Chef / DG / Doc / Sec) */}
                    <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl space-y-3" id="gecd-annotations-section">
                      <div className="flex items-center space-x-1.5 border-b pb-1.5">
                        <FileText className="h-3.5 w-3.5 text-gray-700 font-bold" />
                        <h4 className="font-bold text-xs text-gray-800 uppercase">
                          Zone d'Annotations & Observations
                        </h4>
                      </div>

                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Type de Note</label>
                            <select
                              value={annotType}
                              onChange={e => setAnnotType(e.target.value as any)}
                              className="w-full bg-white border text-[11px] h-8 px-2 rounded-lg"
                            >
                              <option value="comment">Commentaire simple</option>
                              <option value="observation">Observation administrative</option>
                              <option value="recommendation">Recommandation clinique</option>
                              <option value="report">Rapport de traitement</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Avancement : {annotProgress}%</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={annotProgress}
                              onChange={e => setAnnotProgress(parseInt(e.target.value))}
                              className="w-full h-8 cursor-pointer accent-teal-700"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Saisir l'observation ou l'instruction</label>
                          <textarea
                            placeholder="Observations chronologiques avec signature automatique..."
                            value={annotText}
                            onChange={e => setAnnotText(e.target.value)}
                            className="w-full bg-white border rounded-lg p-2 text-[11px] font-sans"
                            rows={2}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddAnnotation(selectedGecdDoc.id)}
                          className="w-full py-1.5 bg-slate-800 hover:bg-black text-white rounded-lg font-bold transition-colors text-center text-[11px] block flex items-center justify-center space-x-1"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          <span>Soumettre l'annotation certifiée</span>
                        </button>
                      </div>
                    </div>

                    {/* List chronological annotations under Requirement 2 */}
                    {selectedGecdDoc.annotations && selectedGecdDoc.annotations.length > 0 && (
                      <div className="bg-gray-50/55 p-3 rounded-xl border border-gray-150 space-y-2">
                        <h5 className="font-bold text-[10px] text-gray-750 uppercase tracking-wider pb-1 border-b border-gray-155">
                          Annotations Clinique Chronologiques ({selectedGecdDoc.annotations.length})
                        </h5>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto">
                          {selectedGecdDoc.annotations.map((ann, index) => (
                            <div key={index} className="bg-white p-2.5 rounded border border-gray-150 relative text-[10.5px] leading-tight shadow-2xs font-sans">
                              <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono">
                                <span>{ann.timestamp.replace("T", " ").substring(0, 16)}</span>
                                <span className={`uppercase font-bold px-1 py-0.5 rounded text-[8px] ${
                                  ann.type === "report" ? "bg-purple-100 text-purple-800" :
                                  ann.type === "recommendation" ? "bg-amber-100 text-amber-800" :
                                  ann.type === "observation" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                                }`}>
                                  {ann.type}
                                </span>
                              </div>
                              <p className="text-gray-800 mt-1 font-medium italic leading-relaxed font-sans">
                                &ldquo; {ann.text} &rdquo;
                              </p>
                              <div className="text-[9px] text-teal-800 font-bold mt-1.5 text-right font-mono">
                                Par : {ann.userName} ({ann.role})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SECTION 3: LIAISON / RÉPONSES AUX COURRIERS (Requirement 8) */}
                    {selectedGecdDoc.gecdType === "entrant" && (
                      <div className="border border-indigo-200 bg-indigo-50/20 p-4 rounded-xl space-y-3" id="gecd-liaison-section">
                        <div className="flex items-center space-x-1.5 border-b pb-1.5 border-indigo-100">
                          <Link2 className="h-3.5 w-3.5 text-indigo-700" />
                          <h4 className="font-bold text-xs text-indigo-900 uppercase">
                            Traçabilité & Liens de Réponses Sortantes
                          </h4>
                        </div>

                        {selectedGecdDoc.linkedResponseCode ? (
                          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-[11px] text-emerald-950 font-sans">
                            <span className="font-black text-emerald-950 block">✅ RÉPONSE OFFICIELLE ENVOYÉE</span>
                            Ce courrier entrant a fait l'objet d'une réponse formelle enregistrée sous : {" "}
                            <strong className="underline underline-offset-2 font-mono text-emerald-950">{selectedGecdDoc.linkedResponseCode}</strong>.
                            <br/>
                            <em className="text-[10px] text-emerald-700 block mt-1">Dossier clôturé à 100%</em>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Rattacher une correspondance sortante déjà scellée</label>
                            
                            <select
                              value={selectedSortantResponseCode}
                              onChange={e => setSelectedSortantResponseCode(e.target.value)}
                              className="w-full bg-white border border-indigo-150 text-[11px] h-8 px-2 rounded-lg"
                            >
                              <option value="">-- Choisir un pli sortant scellé --</option>
                              {gecdDocs.filter(d => d.gecdType === "sortant").map(ret => (
                                <option key={ret.id} value={ret.numCourrier}>
                                  {ret.numCourrier} - {ret.title.substring(0, 30)}...
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleAssociateResponse(selectedGecdDoc.id)}
                              className="w-full py-1.5 bg-indigo-700 hover:bg-indigo-805 text-white rounded-lg font-bold transition-colors text-center text-[11px] block flex items-center justify-center space-x-1"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              <span>Etablir la liaison de traçabilité</span>
                            </button>
                          </div>
                        )}
                        
                        {/* Display inbound source linkage in sortant files if any */}
                        {selectedGecdDoc.linkedIncomingCode && (
                          <div className="bg-indigo-100/50 p-2.5 rounded-lg text-[10px] text-indigo-950 font-mono">
                            📂 Lié en tant que réponse au pli entrant : <strong>{selectedGecdDoc.linkedIncomingCode}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions History Timeline */}
                  <div className="space-y-3">
                    <h5 className="font-bold text-xs text-gray-800 flex items-center pb-1 border-b">
                      <HistoryIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                      Historique du Circuit de routage (Traces AuditLog)
                    </h5>
                    
                    <div className="relative border-l-2 border-slate-150 pl-3.5 space-y-3 font-sans">
                      {selectedGecdDoc.actions?.map((act, idx) => (
                        <div key={idx} className="relative text-[11px] leading-tight" id={`timeline-trace-${idx}`}>
                          <span className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full bg-teal-50 border-2 border-teal-600 flex items-center justify-center text-[8px] font-bold text-teal-800">
                            {idx + 1}
                          </span>
                          <div className="text-gray-400 text-[10px] font-mono leading-none">
                            {act.timestamp ? act.timestamp.replace("T", " ").substring(0, 16) : todayStr}
                          </div>
                          <div className="font-bold text-gray-800 mt-0.5">
                            {act.userName} <span className="font-normal text-xs text-gray-500">({act.role})</span>
                          </div>
                          <p className="text-gray-600 font-mono text-[10px] bg-slate-50 p-1.5 rounded border mt-1 leading-snug">
                            {act.details}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual PDF Preview Stamp simulation */}
                  <div className="border border-teal-550 border-dashed rounded-xl p-3 bg-teal-50/25 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] tracking-widest text-teal-800 font-bold uppercase block">Composteur Digital Certifié</span>
                    <div className="border-4 border-teal-800 text-teal-800 text-[9px] font-bold uppercase px-3 py-1.5 rounded-lg mt-2 tracking-wide transform -rotate-2 select-none">
                      MÉDISAHEL GECD<br/>
                      {selectedGecdDoc.numCourrier}<br/>
                      {clinicInfo?.logoUrl || "Sceau Non Défini"}
                    </div>
                    <span className="text-[8px] text-gray-400 mt-1 font-mono">VALIDE EN PERSISTANCE POSTGRESQL</span>
                  </div>
                </div>
              )}
            </div>

            {/* CREATION FORMS: Renders at the bottom of register tabs to make workflow intuitive */}
            {activeTab === "entrant" && isSec && (
              <div className="bg-slate-100 rounded-2xl border border-gray-200.5 p-6 space-y-6 animate-fade-in" id="entrant-create-form-section">
                <div className="flex items-center space-x-2 border-b pb-3">
                  <Inbox className="h-5 w-5 text-teal-800" />
                  <h4 className="font-black text-sm text-gray-800">Saisie et Numérisation d'un Nouveau Courrier Entrant</h4>
                </div>

                <form onSubmit={submitIncomingCourrier} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] text-gray-700 mb-1">Nom / Sigle de l'Expéditeur Extérieur <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. INPS de Bamako, Ministère, Usager..."
                        value={entrantSender}
                        onChange={e => setEntrantSender(e.target.value)}
                        required
                        className="w-full h-10 px-3 bg-white border border-gray-250 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-700 mb-1">Réf. Courrier Externes (sur enveloppe) <span className="text-gray-400 font-normal">(Optionnel)</span></label>
                      <input
                        type="text"
                        placeholder="e.g. REF/INPS-2026/02"
                        value={entrantRef}
                        onChange={e => setEntrantRef(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-gray-250 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-700 mb-1">Date d'Enregistrement GECD</label>
                      <input
                        type="text"
                        disabled
                        value={new Date().toLocaleDateString("fr-FR")}
                        className="w-full h-10 px-3 bg-slate-50 border border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] text-gray-700 mb-1">Objet d'inscription au registre <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. Réclamation cotisations, Proposition contrats, Plainte usagers..."
                        value={entrantObject}
                        onChange={e => setEntrantObject(e.target.value)}
                        required
                        className="w-full h-10 px-3 bg-white border border-gray-250 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-700 mb-1">Service clinique d'affectation présumé</label>
                      <select
                        value={entrantService}
                        onChange={e => setEntrantService(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-gray-250 rounded-lg"
                      >
                        <option value="Administration">Direction / Administration</option>
                        <option value="Soin / Hospitalisation">Soins / Médecins Hospitaliers</option>
                        <option value="Pharmacie / Stocks">Pharmacie & Produits</option>
                        <option value="Laboratoire / Examens">Laboratoire Médical</option>
                        <option value="Caisse / Mutuelles">Factures, Caisse & Mutuelles</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-700 mb-1">Priorité administrative / Urgence</label>
                      <select
                        value={entrantPriority}
                        onChange={e => setEntrantPriority(e.target.value as any)}
                        className="w-full h-10 px-3 bg-white border border-gray-250 rounded-lg"
                      >
                        <option value="MOYENNE">Priorité Moyenne</option>
                        <option value="HAUTE">Urgence Haute</option>
                        <option value="BASSE">Basse Priorité</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] text-gray-700 mb-1">Description résumé / Notes d'accompagnement</label>
                      <textarea
                        rows={3}
                        placeholder="Brève description analytique du pli pour archivages immédiats..."
                        value={entrantDesc}
                        onChange={e => setEntrantDesc(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-250 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-700 mb-1">Date limite de traitement (Delai d'alerte)</label>
                      <input
                        type="date"
                        value={entrantDeadline}
                        onChange={e => setEntrantDeadline(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-gray-250 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-teal-800 font-bold mb-1">Niveau de Confidentialité Requis <span className="text-teal-700">*</span></label>
                      <select
                        value={entrantConfidentiality}
                        onChange={e => setEntrantConfidentiality(e.target.value as any)}
                        className="w-full h-10 px-3 bg-white border border-teal-300 rounded-lg text-teal-950 font-bold"
                      >
                        <option value="PUBLIC">🌍 Public - Tout le personnel</option>
                        <option value="INTERNE">🏢 Interne - Personnel habilité</option>
                        <option value="CONFIDENTIEL">🔒 Confidentiel - Chefs de services / Médecins</option>
                        <option value="TRES_CONFIDENTIEL">🚫 Très Confidentiel - Direction Générale uniquement</option>
                      </select>
                    </div>
                  </div>

                  {/* File attach drag zone */}
                  <div>
                    <label className="block text-[11px] text-gray-700 mb-2">Pièce Jointe Associée (Numérisation en direct)</label>
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-150 ${
                        dragActive ? "border-teal-700 bg-teal-50/50" : "border-gray-300 bg-white hover:bg-slate-50"
                      }`}
                      id="entrant-file-dropzone"
                    >
                      <UploadCloud className="h-8 w-8 text-teal-600 mx-auto mb-1" />
                      <p className="text-xs font-bold text-gray-700">
                        {uploadedFileAttachment ? `Fichier prêt: ${uploadedFileAttachment.name} (${(uploadedFileAttachment.size / 1024).toFixed(1)} KB)` : "Glisser-déposer le document PDF numérisé ou cliquer pour importer"}
                      </p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex items-center space-x-1 shadow-md shrink-0 cursor-pointer"
                      id="entrant-submit-btn"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Inscrire & Archiver le Courrier Entrant</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "sortant" && isSec && (
              <div className="bg-slate-100 rounded-2xl border border-gray-200.5 p-6 space-y-6 animate-fade-in" id="sortant-create-form-section">
                <div className="flex items-center space-x-2 border-b pb-3">
                  <Send className="h-5 w-5 text-teal-800" />
                  <h4 className="font-black text-sm text-gray-800">Expédition et Tracé d'un Nouveau Courrier Sortant</h4>
                </div>

                <form onSubmit={submitOutgoingCorrespondence} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] text-gray-700 mb-1">Destinataire Externe (Établissement ou Personne) <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. Ministère, Dr. Sissoko, Directeur BDM..."
                        value={sortantRecipient}
                        onChange={e => setSortantRecipient(e.target.value)}
                        required
                        className="w-full h-10 px-3 bg-white border border-gray-250 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-700 mb-1">Service Émetteur de la Correspondance</label>
                      <select
                        value={sortantEmetteur}
                        onChange={e => setSortantEmetteur(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-gray-250 rounded-lg"
                      >
                        <option value="Direction Générale">Direction Générale</option>
                        <option value="Ressources Humaines">RH et Paie</option>
                        <option value="Secrétariat Médical">Secrétariat Médical</option>
                        <option value="Comptabilité">Comptabilité & Caisse</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-700 mb-1">Date d'Émission du Sceau</label>
                      <input
                        type="text"
                        disabled
                        value={new Date().toLocaleDateString("fr-FR")}
                        className="w-full h-10 px-3 bg-slate-50 border border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-gray-700 mb-1">Objet de l'envoi externe <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. Notification rupture stock vaccin, Lettre de transmission rapports..."
                        value={sortantObject}
                        onChange={e => setSortantObject(e.target.value)}
                        required
                        className="w-full h-10 px-3 bg-white border border-gray-250 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-700 mb-1">Signataire Institutionnel (Sceau automatique requis) <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="Renseignez le nom (Sceau par défaut récupéré des paramètres)"
                        value={sortantSignee}
                        onChange={e => setSortantSignee(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-gray-250 rounded-lg text-teal-950 font-bold"
                        required
                      />
                      <p className="text-[10px] text-gray-500 mt-1 font-normal">Lit en direct le paramètre: <span className="font-bold text-teal-850">{clinicInfo?.logoUrl || "Directeur Général MédiSahel"}</span>.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-700 mb-1 font-bold">Corps textuel de la correspondance</label>
                    <textarea
                      rows={4}
                      placeholder="Transcrivez fidèlement le texte de la lettre pour archivage et génération..."
                      value={sortantDesc}
                      onChange={e => setSortantDesc(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-250 rounded-lg"
                    />
                  </div>

                  <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer bg-white">
                    <UploadCloud className="h-6 w-6 text-teal-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Joindre une copie numérisée scannée avec signature manuscrite (Facultatif - PDF, JPG)</p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold flex items-center space-x-1 shadow-md shrink-0 cursor-pointer"
                      id="sortant-submit-btn"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Poster, composter & Archiver l'Envoi</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REDIGER UN ACTE ADMINISTRATIF (SERVICE MEMOS, Directives, PV...) */}
        {activeTab === "rediger" && isSec && (
          <div className="p-6 space-y-6 animate-fade-in" id="gecd-tab-rediger">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="border-b pb-3.5">
                <h3 className="font-bold text-base text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 text-teal-700 mr-2" />
                  Générateur Clinique d'Actes & Décisions Administratives
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Créez des notes de service de la clinique, décisions d'établissement, circulaires cliniques et procès-verbaux de réunions à en tête institutionnel MédiSahel.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Editor */}
                <form onSubmit={submitAdministrativeDocument} className="lg:col-span-5 space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[11px] text-gray-700 mb-1">Sélectionner le Modèle GECD d'Acte</label>
                    <select
                      value={adminDocType}
                      onChange={e => {
                        const t = e.target.value as any;
                        setAdminDocType(t);
                        // Generate mock body template
                        if (t === "note") {
                          setAdminDocTitle("Changement de Garde et Réorganisation des astreintes");
                          setAdminDocBody(`NOTE DE SERVICE N° ${new Date().getFullYear()}/0014\n\nDestinataire: Ensemble des équipes médicales et infirmières\nObjet: Horaires de Gardes d'Urgence du mois en cours\n\nIl est porté à la connaissance de l'ensemble du personnel clinique de la Clinique MédiSahel de Bamako que, pour des raisons opérationnelles de réorganisation des astreintes, les relèves de gardes s'effectueront désormais formellement à 07h30 au lieu de 08h00.\n\nTout retard devra être motivé et inscrit dans le registre de présence de l'ERP.\n\nRappel : les sanctions en cas de violation graves du règlement intérieur s'appliquent immédiatement.\n\nComptant sur la rigueur de chacun.`);
                        } else if (t === "decision") {
                          setAdminDocTitle("Nomination du Responsable des Gardes de Nuit");
                          setAdminDocBody(`DÉCISION DU DIRECTEUR GÉNÉRAL N° ${new Date().getFullYear()}/DEC-008\n\nObjet: Nomination administrative\n\nVu le règlement intérieur de l'ERP.\nVu l'impératif de service de nuit de la clinique de Bamako.\n\nDÉCIDE :\n\nArticle 1 : Monsieur le Docteur Ibrahim TOURÉ est nommé coordinateur clinique en chef des protocoles de triage d'urgences de nuit.\n\nArticle 2 : La présente décision prend effet à compter de sa date de signature sous compostage numérique GECD.`);
                        } else if (t === "contrat") {
                          setAdminDocTitle("Contrat de Collaboration Médicale Clinique");
                          setAdminDocBody(`CONTRAT DE PRESTATION CLINIQUE V2\n\nEntre:\nLa Clinique MédiSahel Bamako d'une part, représentée par la direction générale.\nEt:\nLe Collaborateur médical d'autre part.\n\nIl a été convenu ce qui suit:\nLe collaborateur s'engage à assurer les consultations ambulatoires sur la base d'une redevance fixée par facture de caisse sur l'ERP.`);
                        } else {
                          setAdminDocTitle("Procès-Verbal du Conseil d'Administration de Triage");
                          setAdminDocBody(`PROCES-VERBAL DE CONSEIL DE TRIAGE CLINIQUE\n\nDate: ${todayStr}\nPrésents: L'équipe chirurgicale de MédiSahel.\n\nSujet abordé: Mise à niveau et refonte intégrale de la GED vers un GECD orienté circuit de mails légaux.\n\nRésolutions: L'ensemble des membres valide les travaux d'homologation de la version V2.`);
                        }
                      }}
                      className="w-full h-10 px-3 bg-white border border-gray-250 rounded-lg text-xs"
                    >
                      <option value="note">Note de Service (Interne)</option>
                      <option value="decision">Décision Administrative (Générale)</option>
                      <option value="contrat">Contrat de Prestation / Accord</option>
                      <option value="pv">Procès-Verbal de Réunion (Minutes)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-700 mb-1">Titre de l'Acte Administratif <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Note de Service relative aux astreintes..."
                      value={adminDocTitle}
                      onChange={e => setAdminDocTitle(e.target.value)}
                      required
                      className="w-full h-10 px-3 bg-white border border-gray-250 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-700 mb-1">Référence du document (Sceau légal)</label>
                    <input
                      type="text"
                      placeholder="e.g. MS-BKO-2026-NTS-015"
                      value={adminDocRef}
                      onChange={e => setAdminDocRef(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-gray-250 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-700 mb-1">Texte intégral de l'acte à diffuser <span className="text-rose-500">*</span></label>
                    <textarea
                      rows={12}
                      value={adminDocBody}
                      onChange={e => setAdminDocBody(e.target.value)}
                      required
                      className="w-full p-3 bg-white border border-gray-250 rounded-lg font-mono text-xs uppercase-line"
                      placeholder="Rédigez ici le corps de l'acte..."
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-teal-800 text-white font-bold rounded-xl flex items-center hover:bg-teal-900 transition-colors shadow-xs"
                    >
                      <FileCheck className="h-4 w-4 mr-1.5" />
                      Signer et Diffuser l'Acte
                    </button>
                  </div>
                </form>

                {/* Live Headed Letterhead Preview */}
                <div className="lg:col-span-7 border border-teal-700 rounded-2xl bg-slate-50 p-6 flex flex-col justify-between space-y-6">
                  <div>
                    <div className="text-center font-bold text-[10px] text-gray-400 font-mono tracking-widest border-b pb-2 mb-4 uppercase">
                      Aperçu Institutionnel (Lettre à En-tête GECD)
                    </div>

                    <div className="bg-white border rounded shadow-md p-8 relative flex flex-col justify-between font-sans text-slate-800 min-h-[500px]" id="administrative-headed-letter-preview">
                      <div>
                        {/* Letter Header */}
                        <div className="grid grid-cols-12 gap-2 border-b-2 border-slate-900 pb-3 mb-4">
                          <div className="col-span-8 space-y-0.5">
                            <span className="block font-black text-xs text-teal-900 font-sans tracking-wide">
                              {clinicInfo?.name ? clinicInfo.name.toUpperCase() : "MÉDISAHEL CLINIQUE BAMAKO V2"}
                            </span>
                            <span className="block text-[8px] text-gray-500 leading-tight">
                              {clinicInfo?.address || "Hamdallaye ACI 2000, Bamako, Mali"}
                            </span>
                            <span className="block text-[8px] text-gray-500 leading-tight">
                              Tél: (+223) 20 22 45 45 | E-mail: direction@medisahel.ml
                            </span>
                          </div>
                          
                          <div className="col-span-4 text-right space-y-0.5 text-slate-700">
                            <span className="block font-black text-[8px] uppercase tracking-wider">RÉPUBLIQUE DU MALI</span>
                            <span className="block text-[7px] italic">Un Peuple - Un But - Une Foi</span>
                            <span className="block text-[8px] font-mono font-semibold pt-1">
                              Bamako, le {new Date().toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        </div>

                        {/* Document Number and Reference */}
                        <div className="mb-6">
                          <span className="block text-[9px] font-mono font-bold text-teal-800">
                            RÉFÉRENCE : {adminDocRef || "GECD-MOCK-REF"}
                          </span>
                        </div>

                        {/* Letter Subject title */}
                        <div className="text-center my-4">
                          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 underline decoration-2">
                            {adminDocTitle || "OBJET DE L'ACTE ADMINISTRATIF"}
                          </h4>
                        </div>

                        {/* Letter main text */}
                        <div className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-gray-700 pt-3">
                          {adminDocBody || "Le texte intégral de la circulaire ou décision apparaîtra ici au fur et à mesure de votre saisie."}
                        </div>
                      </div>

                      {/* Official Signature Blocks */}
                      <div className="border-t pt-4 mt-8 flex justify-between items-end">
                        <div className="text-center px-4 self-center">
                          <span className="block text-[7px] text-gray-400 uppercase tracking-widest font-mono">Visa GECD</span>
                          <div className="border-2 border-emerald-700 text-emerald-700 text-[8px] font-mono px-2 py-1 rounded font-black tracking-tighter mt-1 uppercase select-none transform -rotate-1">
                            Sceau Originel<br/>
                            Vip-V2-OK
                          </div>
                        </div>

                        <div className="text-center max-w-[200px]" id="institutionnel-stamp-signature-block">
                          <span className="block text-[8px] italic text-slate-500 underline mb-6">
                            Pour extrait et ordonnance de diffusion administrative
                          </span>
                          <span className="block text-xs font-black text-teal-950 font-sans tracking-wide">
                            {clinicInfo?.logoUrl || "Directeur Général MédiSahel"}
                          </span>
                          <span className="block text-[8.5px] font-bold text-gray-400 font-sans tracking-wide uppercase mt-0.5">
                            Seing Numérisé Scellé
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-teal-50 rounded-xl p-4 border border-teal-200 text-teal-900 text-xs">
                    <span className="font-bold flex items-center mb-1 text-teal-950">
                      <ShieldCheck className="h-4 w-4 mr-1 text-teal-700" />
                      Signatures Institutionnelles Automatisées
                    </span>
                    <p className="leading-snug text-gray-600">
                      Ce module associe automatiquement à chaque acte officiel le signataire par défaut paramétré sous "Paramètres de la clinique". Vous n'avez pas besoin d'une signature externe papier pour notifier les équipes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
