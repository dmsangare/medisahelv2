import React, { useState, useEffect } from "react";
import { UserPlus, Search, Check, ShieldAlert, Key, UserCheck, Shield } from "lucide-react";
import { User } from "../types.ts";

interface UserCredentialsProps {
  token: string | null;
  currentUser: User;
}

export const UserCredentials: React.FC<UserCredentialsProps> = ({ token, currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "DOCTOR",
    password: "",
    mustChangePassword: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data);
    } catch {
      setError("Échec lors du chargement des comptes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("Le nom, l'email et un mot de passe provisoire sont requis.");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Échec d'enregistrement.");

      setSuccess(`Compte créé avec succès ! Le mot de passe de première connexion est : ${formData.password}`);
      setFormData({ name: "", email: "", role: "DOCTOR", password: "", mustChangePassword: true });
      setShowAddForm(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden" id="users-manager-card">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-xl text-gray-900 flex items-center">
            <Shield className="h-5 w-5 text-teal-600 mr-2" />
            Habilitation Clinique & Gestion des Comptes Utilisateurs
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Définition des rôles RBAC de la clinique, assignation d'accès provisoires de première connexion obligatoires.
          </p>
        </div>
        {currentUser.role === "ADMIN" && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm duration-150 cursor-pointer"
            id="add-user-btn"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Créer un Collaborateur
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="add-user-form">
          <div className="md:col-span-2 lg:col-span-3">
            <h3 className="font-semibold text-sm text-gray-750 uppercase tracking-wider mb-1">Attribuer un nouvel accès ERP rattaché</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom Complet <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Aminata DIOP"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adresse E-mail Hospitalière <span className="text-rose-500">*</span></label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. am.diop@medisahel.ml"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role Clinique d'Habilitation</label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
            >
              <option value="DOCTOR">Médecin Consultant (DOCTOR)</option>
              <option value="NURSE">Personnel Infirmier (NURSE)</option>
              <option value="PHARMACIST">Pharmacien Officine (PHARMACIST)</option>
              <option value="CASHIER">Guichetier Caisse (CASHIER)</option>
              <option value="LAB_TECH">Technicien Labo (LAB_TECH)</option>
              <option value="HR">Ressources Humaines (HR)</option>
              <option value="ADMIN">Administrateur Général (ADMIN)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mot de Passe Provisoire <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="ProvisionalPassword99"
            />
          </div>

          <div className="flex items-center pt-6">
            <input
              type="checkbox"
              id="must-change-password-checkbox"
              checked={formData.mustChangePassword}
              onChange={e => setFormData({ ...formData, mustChangePassword: e.target.checked })}
              className="h-4 w-4 text-teal-700 border-gray-300 rounded focus:ring-teal-700 focus:outline-none"
            />
            <label htmlFor="must-change-password-checkbox" className="ml-2 text-xs font-semibold text-gray-700">
              Changement de mot de passe obligatoire à la 1ère connexion
            </label>
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-white bg-teal-700 hover:bg-teal-800 text-sm font-medium rounded-xl shadow-sm cursor-pointer"
            >
              Créer le compte collaborateur
            </button>
          </div>
        </form>
      )}

      {/* Alerts */}
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

      {/* Roster list */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-10 font-mono text-sm text-gray-400">Loading user roles catalog...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Aucun compte configuré.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="users-roster-table">
              <thead>
                <tr className="border-b border-gray-150 text-gray-400 text-xs font-mono uppercase tracking-wider">
                  <th className="py-3 px-4 font-normal">Identité Collaborateur</th>
                  <th className="py-3 px-4 font-normal">Adresse Email</th>
                  <th className="py-3 px-4 font-normal">Role Assigné</th>
                  <th className="py-3 px-4 font-normal">Password Obligatoire ?</th>
                  <th className="py-3 px-4 font-normal">Statut Accès</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {users.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{item.email}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 y-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-bold uppercase border border-gray-200">
                        {item.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.mustChangePassword ? (
                        <span className="text-rose-600 font-mono text-xs font-bold uppercase tracking-wide">
                          Requis (Provisoire)
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-mono text-xs font-medium">Validé (Définitif)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
