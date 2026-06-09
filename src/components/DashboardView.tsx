import { Patient } from "../types.ts";
import { 
  Users, 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  Bed, 
  AlertTriangle, 
  DollarSign, 
  Thermometer 
} from "lucide-react";

interface BedAllocation {
  id: string;
  chambre: string;
  service: string;
  statut: string;
  patientNom?: string;
  temperature?: string;
}

interface StockItem {
  id: string;
  nom: string;
  quantite: number;
  seuilAlerte: number;
  datePeremption: string;
}

interface Invoice {
  id: string;
  statut: string;
  montantPatiente: number;
  montantAssurance: number;
}

interface TriageRecord {
  id: string;
  patientNom: string;
  couleur: string;
  plaintePrincipale: string;
}

interface DashboardViewProps {
  patientsList: Patient[];
  bedList: BedAllocation[];
  stockList: StockItem[];
  invoiceList: Invoice[];
  triageList: TriageRecord[];
  onOpenConsultation: () => void;
  clinicName: string;
  clinicSlogan: string;
  accentColor: string;
}

export default function DashboardView({
  patientsList,
  bedList,
  stockList,
  invoiceList,
  triageList,
  onOpenConsultation,
  clinicName,
  clinicSlogan,
  accentColor
}: DashboardViewProps) {
  // Stats calculations
  const totalPatientsCount = patientsList.length;
  
  const occupiedBeds = bedList.filter(b => b.statut === "Occupé");
  const occupancyPercentage = bedList.length > 0 ? Math.round((occupiedBeds.length / bedList.length) * 100) : 0;

  const totalRevenue = invoiceList
    .filter(i => i.statut === "Payé")
    .reduce((sum, current) => sum + current.montantPatiente + current.montantAssurance, 0);

  const lowStockItems = stockList.filter(s => s.quantite <= s.seuilAlerte);
  const expiringSoonCount = stockList.filter(s => {
    const monthsLeft = (new Date(s.datePeremption).getTime() - Date.now()) / (1000 * 3600 * 24 * 30.4);
    return monthsLeft <= 2; // under 60 days
  }).length;

  // Custom SVG path computations for professional visual reports
  const mockDailyTrend = [12, 18, 15, 23, 30, 24, 28]; // admissions across past week
  const maxVal = Math.max(...mockDailyTrend);
  const chartHeight = 100;
  const chartWidth = 500;
  const points = mockDailyTrend.map((val, idx) => {
    const x = (idx / (mockDailyTrend.length - 1)) * chartWidth;
    const y = chartHeight - (val / maxVal) * 80 - 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="space-y-6" id="dashboard-view-wrapper">
      {/* Clinic branding welcome unit */}
      <div 
        className="rounded-xl p-6 text-white bg-gradient-to-r relative overflow-hidden shadow-sm"
        style={{ backgroundImage: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
      >
        <div className="relative z-10 max-w-xl">
          <span className="text-[10px] bg-white/20 text-white font-extrabold tracking-wider px-2 py-0.5 rounded-full uppercase">
            Système Centralisé Établissement
          </span>
          <h2 className="text-xl font-bold mt-2 font-display">{clinicName}</h2>
          <p className="text-xs text-slate-100 italic mt-1 font-medium">{clinicSlogan}</p>
          <div className="flex gap-2.5 mt-4">
            <button 
              onClick={onOpenConsultation}
              className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs py-1.5 px-3.5 rounded-lg cursor-pointer transition-all shadow-md"
            >
              Nouvelle Consultation
            </button>
            <div className="bg-black/15 text-white border border-white/20 font-mono text-[11px] px-2.5 py-1.5 rounded-lg flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Serveur Local Synchrone</span>
            </div>
          </div>
        </div>
        {/* Abstract background vector glyphs */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center">
          <Activity className="h-32 w-32" />
        </div>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Patients */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Patients Enregistrés</span>
            <span className="text-2xl font-bold text-slate-800">{String(totalPatientsCount).padStart(2, "0")}</span>
            <span className="text-[10px] text-slate-400 block">+2 aujourd'hui</span>
          </div>
          <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 2: Bed state */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Occupation Lits</span>
            <span className="text-2xl font-bold text-slate-800">{occupancyPercentage}%</span>
            <span className="text-[10px] text-slate-400 block">{occupiedBeds.length} lit(s) occupé(s) / {bedList.length}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <Bed className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 3: Monétaire caisse */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Chiffre d'Affaires</span>
            <span className="text-2xl font-bold text-slate-800 font-mono">{totalRevenue.toLocaleString("fr-FR")} FCFA</span>
            <span className="text-[10px] text-emerald-600 font-medium block">Liquidités collectées 100%</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 4: Rupture Alertes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Alerte Pharmacie</span>
            <span className="text-2xl font-bold text-red-600">
              {lowStockItems.length + expiringSoonCount}
            </span>
            <span className="text-[10px] text-red-500 font-medium block">
              {lowStockItems.length} ruptures | {expiringSoonCount} périmés bientôt
            </span>
          </div>
          <div className={`p-3 rounded-lg ${lowStockItems.length > 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Middle Grid - Activity Analytics and Priority Bed Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Custom SVG Graphical Admissions Curve (Free from hydration issues) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Flux des Admissions Récentes</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Visites reçues sur les 7 derniers jours par le médecin</p>
            </div>
            <span className="text-[11px] text-sky-600 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> +22.4% vs semaine passée
            </span>
          </div>

          <div className="py-2" id="canvas-reports-graph">
            <div className="relative">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-24 overflow-visible">
                {/* Horizontal reference grids */}
                <line x1="0" y1="10" x2={chartWidth} y2="10" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="50" x2={chartWidth} y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="90" x2={chartWidth} y2="90" stroke="#f5f5f7" strokeWidth="1" />

                {/* Spline area */}
                <polyline
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="2.5"
                  points={points}
                />

                {/* Data points */}
                {mockDailyTrend.map((val, idx) => {
                  const x = (idx / (mockDailyTrend.length - 1)) * chartWidth;
                  const y = chartHeight - (val / maxVal) * 80 - 10;
                  return (
                    <g key={idx} className="group cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="white"
                        stroke={accentColor}
                        strokeWidth="2"
                      />
                      <text
                        x={x}
                        y={y - 8}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#64748b"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-400 font-mono mt-3">
              <span>Mardi</span>
              <span>Mercredi</span>
              <span>Jeudi</span>
              <span>Vendredi</span>
              <span>Samedi</span>
              <span>Dimanche</span>
              <span>Aujourd'hui</span>
            </div>
          </div>
        </div>

        {/* Triage & Urgent Patients List queue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-orange-500" /> Triage des Urgences Actif
          </h3>
          
          {triageList.length === 0 ? (
            <p className="text-[11px] text-slate-400 text-center py-6">Aucun patient aux urgences.</p>
          ) : (
            <div className="space-y-2 max-h-[140px] overflow-y-auto">
              {triageList.map((trg) => {
                const badgeStyle = 
                  trg.couleur === "Rouge" 
                    ? "bg-red-50 text-red-700 border-red-200" 
                    : trg.couleur === "Orange"
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : trg.couleur === "Jaune"
                    ? "bg-yellow-50 text-yellow-800 border-yellow-250"
                    : "bg-green-50 text-green-700 border-green-200";

                return (
                  <div key={trg.id} className="p-2.5 rounded-lg border border-slate-150 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900">{trg.patientNom}</h4>
                      <p className="text-[11px] text-slate-500 italic max-w-[150px] truncate">{trg.plaintePrincipale}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${badgeStyle}`}>
                      {trg.couleur}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bed Layout view list */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Bed className="h-4 w-4 text-sky-600" /> Plan d'occupation des lits et chambres
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Visualisez en temps réel la disponibilité par service (Salles d'hospitalisation de la clinique)</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {bedList.map((bed) => {
            const isOcc = bed.statut === "Occupé";
            const isMaint = bed.statut === "Maintenance";
            
            return (
              <div
                key={bed.id}
                className={`p-3.5 rounded-lg border text-center relative pointer transition-all duration-200 ${
                  isOcc
                    ? "bg-red-50/40 border-red-200 text-red-950 shadow-xs"
                    : isMaint
                    ? "bg-slate-100 border-slate-250 text-slate-500"
                    : "bg-emerald-50/40 border-emerald-200 text-emerald-950 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-center mb-1">
                  <Bed className={`h-4 w-4 ${isOcc ? "text-red-600" : isMaint ? "text-slate-400" : "text-emerald-600"}`} />
                </div>
                <h5 className="font-bold text-xs">{bed.id}</h5>
                <p className="text-[9px] text-slate-400 font-semibold truncate mt-0.5">{bed.chambre}</p>
                <span className="text-[9px] text-slate-400 font-mono italic block truncate">{bed.service}</span>

                {isOcc && bed.patientNom && (
                  <div className="mt-1.5 pt-1.5 border-t border-red-150/40 text-[9px]">
                    <span className="font-bold text-slate-800 block truncate">{bed.patientNom}</span>
                    <span className="text-red-700 font-semibold flex items-center justify-center gap-0.5">
                      <Thermometer className="h-3 w-3 inline text-red-500" /> {bed.temperature || "37.5"}°C
                    </span>
                  </div>
                )}

                <span className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ${
                  isOcc ? "bg-red-600" : isMaint ? "bg-slate-600" : "bg-emerald-600"
                }`}></span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
