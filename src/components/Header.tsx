import React from "react";
import { LogOut, Shield, User as UserIcon, Calendar, Activity } from "lucide-react";
import { User, Clinic } from "../types.ts";

interface HeaderProps {
  user: User;
  clinic: Clinic;
  onLogout: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ user, clinic, onLogout, activeTab }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Clinic Branding */}
          <div className="flex items-center space-x-3">
            <div 
              className="p-2.5 rounded-xl text-white flex items-center justify-center shadow-sm"
              style={{ backgroundColor: clinic.themeColor }}
              id="clinic-logo-container"
            >
              <Activity className="h-6 w-6" id="clinic-logo-icon" />
            </div>
            <div>
              <h1 className="font-sans font-bold tracking-tight text-gray-900 text-lg md:text-xl leading-none">
                {clinic.name}
              </h1>
              <p className="font-mono text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                {clinic.address || "Centre de Soins de Référence - Sahel"}
              </p>
            </div>
          </div>

          {/* User Session Indicators */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="font-sans font-medium text-sm text-gray-900 flex items-center justify-end">
                {user.name}
              </span>
              <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest flex items-center justify-end">
                <Shield className="h-3 w-3 mr-1 text-teal-600" />
                {user.role}
              </span>
            </div>

            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

            <button
              onClick={onLogout}
              className="p-2 ml-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-150 inline-flex items-center space-x-1 text-sm font-medium focus:outline-none"
              title="Se déconnecter"
              id="logout-btn"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
