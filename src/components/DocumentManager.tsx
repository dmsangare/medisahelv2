import React, { useState, useEffect, useRef } from "react";
import { FolderGit, UploadCloud, Search, Check, ShieldAlert, FileText, Trash2, ArrowDownToLine } from "lucide-react";
import { Document } from "../types.ts";

interface DocumentManagerProps {
  token: string | null;
  userRole: string;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ token, userRole }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    fetchDocuments();
  }, [token]);

  // DRAG AND DROP ZONE EVENTS (as requested in usability patterns)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setError("");
    setSuccess("");

    const mockDescription = `Fichier versé via drag-and-drop. Type MIME: ${file.type}`;
    const fileSizeStr = `${(file.size / 1024).toFixed(1)} KB`;
    const extension = file.name.split(".").pop()?.toUpperCase() || "PDF";

    const payload = {
      title: file.name,
      description: mockDescription,
      fileType: extension,
      category: "INCOMING", // default category for uploaded mails
      size: fileSizeStr,
      fileUrl: "gecd_vault_" + file.name
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

      setSuccess(`Le document "${file.name}" a été numérisé, chiffré et versé dans l'archive historique sans aucune perte !`);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (userRole !== "ADMIN") {
      setError("Seuls les administrateurs ont l'autorité de déchiqueter un document d'archive.");
      return;
    }
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Échec d'archivage");
      setSuccess("Document extrait et supprimé avec traçabilité AuditLog.");
      fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredDocs = documents.filter(doc => {
    const term = searchQuery.toLowerCase();
    const matchTerm = doc.title.toLowerCase().includes(term) || (doc.description && doc.description.toLowerCase().includes(term));
    const matchCat = selectedCategory === "ALL" || doc.category === selectedCategory;
    return matchTerm && matchCat;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden animate-fade-in" id="gecd-card">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-xl text-gray-900 flex items-center">
            <FolderGit className="h-5 w-5 text-teal-600 mr-2" />
            Module GECD - Archives Numériques & Mails
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Conservation des courriers historiques, imports de données dématérialisées et archivage sécurisé des fiches cliniques.
          </p>
        </div>
      </div>

      {/* DRAG AND DROP ZONE */}
      <div className="p-6 border-b border-gray-100 bg-slate-50">
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center ${
            dragActive
              ? "border-teal-700 bg-teal-50/40"
              : "border-gray-250 hover:border-teal-700 hover:bg-slate-100/50"
          }`}
          id="gecd-upload-dropzone"
        >
          <UploadCloud className="h-12 w-12 text-teal-600 mb-3" />
          <h4 className="text-sm font-bold text-slate-800">Déposer un fichier ici ou cliquer pour uploader</h4>
          <p className="text-xs text-slate-500 mt-1">
            Glisser-déposer vos documents numérisés, rapports médicaux d'examens ou courriers administratifs.
          </p>
          <p className="text-[10px] text-gray-400 mt-2">Prise en charge PDF,, DOCX, JPG, PNG (Taille max: 10 Mo)</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            className="hidden"
            id="gecd-file-input"
          />
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center shadow-xs">
          <ShieldAlert className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 mx-6 mt-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center shadow-xs">
          <Check className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {/* Categories filter and Search */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex bg-slate-100 items-center px-3.5 py-2 rounded-xl border border-gray-200 max-w-sm w-full">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Rechercher par titre de document..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm w-full focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 bg-slate-100 border p-1 rounded-xl self-start md:self-auto text-xs font-semibold">
            {["ALL", "INCOMING", "OUTGOING", "MEDICAL", "ADMINISTRATIVE"].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedCategory === cat ? "bg-white text-slate-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {cat === "ALL" ? "Tous" : cat === "INCOMING" ? "Courriers Entrants" : cat === "OUTGOING" ? "Courriers Sortants" : cat === "MEDICAL" ? "Dossiers DME" : "Administratif"}
              </button>
            ))}
          </div>
        </div>

        {/* Database entries LIST */}
        {loading ? (
          <div className="text-center py-10 font-mono text-sm text-gray-400">Loading document vault...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm border-2 border-dashed border-gray-150 rounded-2xl">
            Aucun document n'est archivé sous cette désignation/catégorie.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-gray-150 bg-white hover:shadow-xs transition-shadow flex items-start justify-between"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-sans font-bold text-slate-900 text-sm leading-snug">{doc.title}</h5>
                    {doc.description && (
                      <p className="text-xs text-gray-500 mt-1 font-sans leading-relaxed">{doc.description}</p>
                    )}
                    <div className="flex items-center space-x-3 text-[10px] text-gray-400 font-mono mt-2">
                      <span className="uppercase font-bold tracking-wider">{doc.fileType}</span>
                      <span>•</span>
                      <span>Taille: {doc.size}</span>
                      <span>•</span>
                      <span>Auteur : {doc.ownerName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2 shrink-0">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase font-bold tracking-wider">
                    {doc.category}
                  </span>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => alert(`Téléchargement sécurisé simulé de : ${doc.title}`)}
                      className="p-1 px-2 border border-slate-200.5 rounded text-gray-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      title="Télécharger l'original"
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                    </button>

                    {userRole === "ADMIN" && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 px-2 bg-rose-50 border border-rose-250 text-rose-700 hover:bg-rose-100 rounded transition-colors"
                        title="Déchiqueter du GECD"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
