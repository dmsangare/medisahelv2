import React, { useState, useEffect } from "react";
import { Users, Clock, Check, ShieldAlert, AlertCircle, FileText } from "lucide-react";
import { User, Attendance } from "../types.ts";

interface PresencesManagerProps {
  token: string | null;
  currentUser: User;
  clinicThemeColor: string;
}

export const PresencesManager: React.FC<PresencesManagerProps> = ({ token, currentUser, clinicThemeColor }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pointage form state
  const [pointageUser, setPointageUser] = useState(currentUser.id);
  const [pointageStatus, setPointageStatus] = useState<"PRESENT" | "LATE" | "ABSENT">("PRESENT");
  const [pointageReason, setPointageReason] = useState("");

  const fetchHRData = async () => {
    setLoading(true);
    try {
      // Fetch users list
      const rUsers = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
      if (rUsers.ok) {
        const dUsers = await rUsers.json();
        setUsers(dUsers);
      }

      // Fetch attendances registry
      const rAtt = await fetch("/api/attendances", { headers: { Authorization: `Bearer ${token}` } });
      if (rAtt.ok) {
        const dAtt = await rAtt.json();
        setAttendances(dAtt);
      }
    } catch (err) {
      setError("Indisponibilité temporaire du serveur de pointage.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, [token]);

  const handlePointage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const targetUser = pointageUser || currentUser.id;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    try {
      const response = await fetch("/api/attendances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: targetUser,
          date: now.toISOString().split("T")[0],
          checkIn: timeStr,
          status: pointageStatus,
          reason: pointageReason
        })
      });

      if (!response.ok) throw new Error("Échec d'enregistrement du pointage.");

      // Write to audit log
      const targetUserObj = users.find(u => u.id === targetUser) || currentUser;
      await fetch("/api/auditlogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "RH_POINTAGE",
          details: `Enregistrement du pointage pour ${targetUserObj.name}: statut ${pointageStatus} (${pointageReason || "Aucun motif spécifié"})`
        })
      });

      setSuccess(`Pointage enregistré avec succès pour ${targetUserObj.name}.`);
      setPointageReason("");
      fetchHRData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getUserName = (id: string) => {
    const found = users.find(u => u.id === id);
    return found ? found.name : "Administrateur / Agent";
  };

  const getUserRole = (id: string) => {
    const found = users.find(u => u.id === id);
    return found ? found.role : "";
  };

  return (
    <div className="space-y-6" id="presences-module-view">
      {/* Visual Header */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 flex items-start space-x-4 shadow-sm">
        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700">
          <Clock className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-sans font-bold text-xl text-gray-900 leading-none">Gestion des Présences & Horaires</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enregistrement des fiches de pointage, gestion des retards, des absences injustifiées et registre de garde du personnel de la clinique.
          </p>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider border-b pb-2 flex items-center">
            <Clock className="h-4.5 w-4.5 text-indigo-600 mr-2" />
            Nouveau Pointage
          </h3>

          <form onSubmit={handlePointage} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Employé :</label>
              <select
                value={pointageUser}
                onChange={e => setPointageUser(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs"
              >
                <option value={currentUser.id}>Moi-même ({currentUser.name})</option>
                {users.filter(u => u.id !== currentUser.id).map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Statut de Présence :</label>
              <select
                value={pointageStatus}
                onChange={e => setPointageStatus(e.target.value as any)}
                className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs"
              >
                <option value="PRESENT">Heure ponctuelle (Présent)</option>
                <option value="LATE">Retard (Arrivée décalée)</option>
                <option value="ABSENT">Absence injustifiée / Signalée</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Motif / Justification clinique :</label>
              <input
                type="text"
                value={pointageReason}
                onChange={e => setPointageReason(e.target.value)}
                placeholder="Raison du retard ou de l'absence..."
                className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 text-center text-white bg-indigo-700 hover:bg-indigo-850 rounded-xl text-xs font-bold leading-none cursor-pointer shadow-sm transition-all"
            >
              Valider le Pointage
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider border-b pb-2 flex items-center">
            <Users className="h-4.5 w-4.5 text-indigo-600 mr-2" />
            Registre des Présences
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-150 text-gray-400 font-mono uppercase tracking-wider bg-slate-50">
                  <th className="py-2.5 px-4 font-normal">Collaborateur</th>
                  <th className="py-2.5 px-4 font-normal">Date & Heure</th>
                  <th className="py-2.5 px-4 font-normal">Statut</th>
                  <th className="py-2.5 px-4 font-normal">Motif de Retard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {attendances.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">Aucun pointage enregistré aujourd'hui.</td>
                  </tr>
                ) : (
                  [...attendances].reverse().map(att => (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-950">{getUserName(att.userId)}</div>
                        <div className="text-[10px] text-gray-400">{getUserRole(att.userId)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-800">{att.date}</div>
                        <div className="text-[10px] text-gray-400">Arrivée: {att.checkIn || "--:--"}</div>
                      </td>
                      <td className="py-3 px-4">
                        {att.status === "PRESENT" ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800">Présent</span>
                        ) : att.status === "LATE" ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800">Retard</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-800">Absent</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-medium italic">
                        {att.reason || "Néant / Justifié"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
