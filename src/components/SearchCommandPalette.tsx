import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  X, 
  History, 
  Star, 
  Clock, 
  ArrowRight, 
  Sparkles,
  FileText,
  User,
  Activity,
  Calendar,
  DollarSign,
  Package,
  Mail,
  Shield,
  Trash2,
  ChevronRight
} from "lucide-react";

interface SearchResult {
  id: string;
  type: string;
  label: string;
  details: string;
  tabTarget: string;
  isStarred?: boolean;
}

interface SearchCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  authToken: string | null;
  isOffline: boolean;
  isAuthorized: (tab: string) => boolean;
  onSelectItemRedirect?: (item: SearchResult) => void;
}

export const SearchCommandPalette: React.FC<SearchCommandPaletteProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  authToken,
  isOffline,
  isAuthorized,
  onSelectItemRedirect
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Local persistence states
  const [history, setHistory] = useState<string[]>([]);
  const [recentVisits, setRecentVisits] = useState<SearchResult[]>([]);
  const [favorites, setFavorites] = useState<SearchResult[]>([]);

  // RBAC Filtered variables for strict data isolation
  const filteredFavorites = favorites.filter(fav => isAuthorized(fav.tabTarget));
  const filteredRecentVisits = recentVisits.filter(visit => isAuthorized(visit.tabTarget));
  const filteredResults = results.filter(res => isAuthorized(res.tabTarget));

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load and recover history/favorites/recent visits from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("medishahel_search_history");
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedVisits = localStorage.getItem("medishahel_search_recent_visits");
      if (savedVisits) setRecentVisits(JSON.parse(savedVisits));

      const savedFavs = localStorage.getItem("medishahel_search_favorites");
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch (e) {
      console.error("Local storage recovery failed for search palette:", e);
    }
  }, []);

  // Sync helpers
  const saveHistoryList = (newHistory: string[]) => {
    setHistory(newHistory);
    localStorage.setItem("medishahel_search_history", JSON.stringify(newHistory));
  };

  const saveRecentVisitsList = (newVisits: SearchResult[]) => {
    setRecentVisits(newVisits);
    localStorage.setItem("medishahel_search_recent_visits", JSON.stringify(newVisits));
  };

  const saveFavoritesList = (newFavs: SearchResult[]) => {
    setFavorites(newFavs);
    localStorage.setItem("medishahel_search_favorites", JSON.stringify(newFavs));
  };

  // Keyboard shortcut Ctrl+K / Cmd+K behavior and ESC closure
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    
    // Auto-focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Debounced real-time Search querying (300 ms timeline)
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayTimer = setTimeout(async () => {
      try {
        const token = authToken || localStorage.getItem("medishahel_token");
        const response = await fetch(`/api/search/global?q=${encodeURIComponent(query.trim())}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const list: SearchResult[] = await response.json();
          // Merge star indicators with verified favorites
          const starredIds = new Set(favorites.map(f => f.id));
          const updatedList = list.map(item => ({
            ...item,
            isStarred: starredIds.has(item.id)
          }));
          setResults(updatedList);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.warn("Real-time global search query error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayTimer);
  }, [query, authToken, favorites]);

  // Keyboard Navigation: Up, Down, Enter keys
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = getDisplayedItems().length;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (totalItems || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % (totalItems || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const items = getDisplayedItems();
      if (items[selectedIndex]) {
        handleSelectItem(items[selectedIndex]);
      }
    }
  };

  // Select Result action
  const handleSelectItem = (item: SearchResult) => {
    // 1. Add query string to history if query is significant
    if (query.trim()) {
      const filtered = history.filter(h => h.toLowerCase() !== query.trim().toLowerCase());
      const updatedHistory = [query.trim(), ...filtered].slice(0, 8);
      saveHistoryList(updatedHistory);
    }

    // 2. Add to recent visits
    const filteredVisits = recentVisits.filter(r => r.id !== item.id);
    const updatedVisits = [item, ...filteredVisits].slice(0, 5);
    saveRecentVisitsList(updatedVisits);

    // 3. Navigate UI tab or fire redirect router
    if (onSelectItemRedirect) {
      onSelectItemRedirect(item);
    } else {
      setActiveTab(item.tabTarget);
    }
    onClose();
  };

  // Toggle favorite / starred status
  const handleToggleFavorite = (e: React.MouseEvent, item: SearchResult) => {
    e.stopPropagation();
    const isStarred = favorites.some(f => f.id === item.id);
    let updated;
    if (isStarred) {
      updated = favorites.filter(f => f.id !== item.id);
    } else {
      updated = [{ ...item, isStarred: true }, ...favorites].slice(0, 15);
    }
    saveFavoritesList(updated);

    // Update current results starred indicator
    setResults(prev => prev.map(r => r.id === item.id ? { ...r, isStarred: !isStarred } : r));
  };

  // Clear query history helper
  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveHistoryList([]);
  };

  // Clear single recent visit
  const handleRemoveRecentVisit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    saveRecentVisitsList(recentVisits.filter(v => v.id !== id));
  };

  // Helper to determine active list to display
  const getDisplayedItems = (): SearchResult[] => {
    if (query.trim().length >= 2) {
      return filteredResults;
    }
    return [...filteredFavorites, ...filteredRecentVisits].slice(0, 10);
  };

  const getBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      PATIENT: "bg-sky-50 text-sky-700 border-sky-100",
      FACTURE: "bg-emerald-50 text-emerald-700 border-emerald-100",
      LABO: "bg-purple-50 text-purple-700 border-purple-100",
      DME: "bg-rose-50 text-rose-700 border-rose-100",
      STOCK: "bg-amber-50 text-amber-700 border-amber-100",
      RDV: "bg-indigo-50 text-indigo-700 border-indigo-100",
      HOSPITALISATION: "bg-cyan-50 text-cyan-700 border-cyan-100",
      COURRIER: "bg-teal-50 text-teal-700 border-teal-100",
      UTILISATEUR: "bg-violet-50 text-violet-700 border-violet-100",
      AUDIT: "bg-slate-100 text-slate-700 border-slate-200"
    };
    return colors[type] || "bg-slate-50 text-slate-700 border-slate-100";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PATIENT": return <User className="h-4 w-4" />;
      case "DME": return <FileText className="h-4 w-4" />;
      case "LABO": return <Activity className="h-4 w-4" />;
      case "STOCK": return <Package className="h-4 w-4" />;
      case "FACTURE": return <DollarSign className="h-4 w-4" />;
      case "RDV": return <Calendar className="h-4 w-4" />;
      case "HOSPITALISATION": return <Activity className="h-4 w-4" />;
      case "COURRIER": return <Mail className="h-4 w-4" />;
      case "UTILISATEUR": return <User className="h-4 w-4" />;
      case "AUDIT": return <Shield className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  const activeDisplayItems = getDisplayedItems();

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-center pt-[12vh] animate-fade-in px-4">
      <div 
        ref={containerRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 overflow-hidden h-fit flex flex-col max-h-[75vh]"
        id="medishahel-command-palette-container"
      >
        {/* Search header box */}
        <div className="p-4 border-b border-slate-150 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5 flex-1 select-none">
            <Search className={`h-4.5 w-4.5 ${loading ? "text-sky-500 animate-pulse" : "text-slate-400"}`} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher patient, ordonnance, pharmacie, facture..."
              className="w-full text-xs outline-none bg-transparent placeholder-slate-400 font-medium text-slate-800"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isOffline && (
              <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-extrabold tracking-wider uppercase">
                Offline
              </span>
            )}
            <kbd className="hidden sm:inline-block bg-white px-1.5 py-0.5 border border-slate-200 rounded text-[9.5px] font-mono leading-none text-slate-400 shadow-xs">
              ESC
            </kbd>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content results/layouts panel */}
        <div className="flex-1 overflow-y-auto min-h-0 select-none">
          {query.trim().length === 0 ? (
            /* DEFAULT HOME PALETTE AREA: Recent histories and favorites */
            <div className="p-4 space-y-4">
              {/* History Search Tags */}
              {history.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <History className="h-3 w-3" />
                      <span>Historique de recherche</span>
                    </span>
                    <button 
                      onClick={handleClearHistory}
                      className="text-[10px] text-rose-500 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                      Effacer tout
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {history.map((hist, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(hist)}
                        className="bg-slate-50 hover:bg-slate-100 text-[10.5px] text-slate-600 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200/60 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Search className="h-2.5 w-2.5 text-slate-400" />
                        <span>{hist}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Favorites & Recent Fiches Lists */}
              {filteredFavorites.length > 0 || filteredRecentVisits.length > 0 ? (
                <div className="space-y-4">
                  {filteredFavorites.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                        <span>Fiches favorites</span>
                      </span>
                      <div className="space-y-1">
                        {filteredFavorites.map((fav, index) => {
                          const isSel = activeDisplayItems[index]?.id === fav.id && selectedIndex === index;
                          return (
                            <div
                              key={fav.id}
                              onClick={() => handleSelectItem(fav)}
                              className={`w-full text-left p-2.5 rounded-xl font-semibold flex items-center justify-between cursor-pointer transition-all border ${
                                isSel 
                                  ? "bg-sky-50/50 border-sky-100 shadow-xs" 
                                  : "bg-white hover:bg-slate-50/65 border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${getBadgeColor(fav.type)}`}>
                                  {getTypeIcon(fav.type)}
                                </span>
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider font-mono ${getBadgeColor(fav.type)}`}>
                                      {fav.type}
                                    </span>
                                    <span className="text-slate-800 text-xs font-bold leading-tight">{fav.label}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium">{fav.details}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => handleToggleFavorite(e, fav)}
                                  className="text-amber-500 hover:text-amber-600 p-1 hover:bg-amber-50 rounded-md transition-all cursor-pointer"
                                >
                                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                                </button>
                                <ChevronRight className="h-3.5 w-3.5 text-slate-350 shrink-0" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {filteredRecentVisits.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <Clock className="h-3 w-3" />
                        <span>Dernières fiches ouvertes</span>
                      </span>
                      <div className="space-y-1">
                        {filteredRecentVisits.map((visit, index) => {
                          // offset starting index by favorites count
                          const displayIdx = filteredFavorites.length + index;
                          const isSel = selectedIndex === displayIdx;
                          return (
                            <div
                              key={visit.id}
                              onClick={() => handleSelectItem(visit)}
                              className={`w-full text-left p-2.5 rounded-xl font-semibold flex items-center justify-between cursor-pointer transition-all border ${
                                isSel 
                                  ? "bg-sky-50/50 border-sky-100 shadow-xs" 
                                  : "bg-white hover:bg-slate-50/65 border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${getBadgeColor(visit.type)}`}>
                                  {getTypeIcon(visit.type)}
                                </span>
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider font-mono ${getBadgeColor(visit.type)}`}>
                                      {visit.type}
                                    </span>
                                    <span className="text-slate-800 text-xs font-bold leading-tight">{visit.label}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium">{visit.details}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => handleToggleFavorite(e, visit)}
                                  className="text-slate-300 hover:text-amber-500 p-1 hover:bg-amber-50 rounded-md transition-all cursor-pointer"
                                >
                                  <Star className={`h-3.5 w-3.5 ${visit.isStarred ? "text-amber-500 fill-amber-400" : ""}`} />
                                </button>
                                <button
                                  onClick={(e) => handleRemoveRecentVisit(e, visit.id)}
                                  className="text-slate-300 hover:text-rose-500 p-1 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                                  title="Retirer de l'historique"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                                <ChevronRight className="h-3.5 w-3.5 text-slate-350 shrink-0" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50/45 rounded-xl border border-dashed border-slate-200">
                  <Sparkles className="h-7 w-7 text-sky-400 mx-auto mb-2 animate-bounce" />
                  <p className="text-xs text-slate-500 font-bold">Moteur de Recherche Globale MédiSahel</p>
                  <p className="text-[10.5px] text-slate-400 mt-1">Saisissez au moins 2 caractères pour inspecter le dossier clinique global ou l'annuaire.</p>
                </div>
              )}
            </div>
          ) : (
            /* ACTIVE RESULTS LOOKUP PANEL */
            <div className="p-2 space-y-1">
              {loading && filteredResults.length === 0 ? (
                /* Loading State screen */
                <div className="p-12 text-center">
                  <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-[11px] text-slate-400 font-semibold">Exécution de l'analyse multi-table Postgres...</p>
                </div>
              ) : filteredResults.length > 0 ? (
                /* Matches Results List */
                <div>
                  <div className="px-3 py-1.5 flex items-center justify-between">
                    <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">
                      Résultats correspondants ({filteredResults.length})
                    </span>
                    <span className="text-[9px] text-sky-600 font-semibold bg-sky-50 border border-sky-100 px-1.5 py-0.2 rounded">
                      Clavier ↑ ↓ Entrée
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {filteredResults.map((res, index) => {
                      const isSel = selectedIndex === index;
                      return (
                        <div
                          key={res.id}
                          onClick={() => handleSelectItem(res)}
                          className={`w-full text-left p-2.5 rounded-xl font-semibold flex items-center justify-between cursor-pointer transition-all border ${
                            isSel 
                              ? "bg-slate-50 shadow-xs border-slate-200/80" 
                              : "bg-white hover:bg-slate-50/30 border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${getBadgeColor(res.type)}`}>
                              {getTypeIcon(res.type)}
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider font-mono ${getBadgeColor(res.type)}`}>
                                  {res.type}
                                </span>
                                <span className="text-slate-800 text-xs font-bold leading-tight">{res.label}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium line-clamp-1">{res.details}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={(e) => handleToggleFavorite(e, res)}
                              className="text-slate-300 hover:text-amber-500 p-1 hover:bg-amber-50 rounded-md transition-all cursor-pointer"
                              title={res.isStarred ? "Enlever des favoris" : "Ajouter aux favoris"}
                            >
                              <Star className={`h-3.5 w-3.5 ${res.isStarred ? "text-amber-500 fill-amber-400" : ""}`} />
                            </button>
                            <span className="text-[9.5px] text-sky-600 font-bold shrink-0 hidden sm:inline-block">Accéder →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Empty query state */
                <div className="p-12 text-center bg-slate-50/45 rounded-xl m-2 border border-dashed border-slate-200">
                  <X className="h-6 w-6 text-rose-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-bold">Aucun dossier trouvé pour "{query}"</p>
                  <p className="text-[10px] text-slate-400 mt-1">Veuillez vérifier les fautes de frappe ou modifier vos filtres.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper box */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-150 flex items-center justify-between text-[10px] text-slate-400 font-semibold select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-white px-1 border rounded text-[9px] shadow-2xs">↑↓</kbd> Naviguer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-white px-1 border rounded text-[9px] shadow-2xs">Entrée</kbd> Sélectionner
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-white px-1 border rounded text-[9px] shadow-2xs">ESC</kbd> Quitter
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-sky-600" />
            <span>Sécurité HIPAA et Gouvernance active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
