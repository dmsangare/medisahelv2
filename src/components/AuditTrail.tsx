import React, { useState, useEffect } from "react";
import { ShieldCheck, Search, Database, Clock, Download, FileText } from "lucide-react";
import { AuditLog } from "../types.ts";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";

interface AuditTrailProps {
  token: string | null;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ token }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auditlogs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setLogs(data);
    } catch {
      setError("Impossible d'auditer les logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter(log => {
    const term = searchQuery.toLowerCase();
    return (
      log.userName.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden" id="audit-trail-card">
      <div className="p-6 border-b border-gray-100">
        <h2 className="font-sans font-bold text-xl text-gray-900 flex items-center">
          <ShieldCheck className="h-5 w-5 text-teal-600 mr-2" />
          Journal d'Audit & Traçabilité Réglementaire
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Registre d'audit continu recensant l'intégralité des transactions cliniques, réinitialisations de credentials et accès ERP.
        </p>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6" id="audit-export-controls">
          <div className="flex bg-slate-100 items-center px-3.5 py-2.5 rounded-xl border border-gray-200 w-full md:max-w-md">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Filtrer l'audit par acteur, action ou mot clé..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm w-full focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportToExcel(filteredLogs, "journal_audit_medisahel", {
                id: "ID",
                timestamp: "Date Heure",
                userName: "Acteur",
                role: "Rôle",
                action: "Action",
                details: "Détails"
              })}
              className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-850 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Download className="h-3.5 w-3.5" /> Exporter Excel
            </button>
            <button
              onClick={() => exportToPDF("audit-logs-output", "Registre d'Audit et Traçabilité")}
              className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-850 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <FileText className="h-3.5 w-3.5" /> Exporter PDF / Imprimer
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 font-mono text-sm text-gray-400">Loading audit trail registry...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Aucun log d'audit n'est présent sous cette désignation de filtrage.
          </div>
        ) : (
          <div className="space-y-3 font-mono" id="audit-logs-output">
            {filteredLogs.map(log => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-slate-100 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-teal-100 text-teal-800 border border-teal-150 uppercase tracking-wider">
                      {log.action}
                    </span>
                    <span className="text-gray-900 font-sans font-semibold">
                      {log.userName}
                    </span>
                    <span className="text-gray-400 font-normal">
                      ({log.role})
                    </span>
                  </div>
                  <p className="text-gray-600 font-sans text-xs mt-0.5">{log.details}</p>
                </div>
                <div className="text-gray-400 text-[10px] self-start md:self-center flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(log.timestamp).toLocaleDateString("fr-FR")} {new Date(log.timestamp).toLocaleTimeString("fr-FR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
