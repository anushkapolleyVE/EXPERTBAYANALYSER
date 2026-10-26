import React, { useState } from 'react';
import { 
  Shield, CheckCircle2, AlertTriangle, UserCheck, 
  ChevronDown, Bell, GitBranch, Sparkles, ExternalLink,
  Lock, RefreshCw
} from 'lucide-react';
import { UserProfile, Finding } from '../types';

interface NavbarProps {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onOpenFlowchart: () => void;
  criticalFindingsCount: number;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  availableUsers,
  onSelectUser,
  onOpenFlowchart,
  criticalFindingsCount,
  onRefreshData
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand & Pilot Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 flex items-center justify-center text-white shadow-md shadow-blue-900/20">
              <Shield className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-base tracking-tight">ExpertBay</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  AI Quality &amp; Privacy Pilot
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Independent Review Platform • India Market Scope</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-200">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Stage: Review &amp; Adjudication
            </span>
            <span className="text-xs text-slate-400 font-mono">Q1-2026-PILOT</span>
          </div>
        </div>

        {/* Right: Actions, Notifications, Role Switcher */}
        <div className="flex items-center space-x-3">
          
          {/* Flowchart Modal Button */}
          <button
            onClick={onOpenFlowchart}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-sm"
            title="Inspect 7-Stage Pilot Flowchart Specification"
          >
            <GitBranch className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Flowchart Architecture</span>
          </button>

          {/* Critical Issue Indicator */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-lg border transition-colors relative ${
                criticalFindingsCount > 0 
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title={`${criticalFindingsCount} Critical Safety/Privacy Findings`}
            >
              <AlertTriangle className="w-4 h-4" />
              {criticalFindingsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce shadow">
                  {criticalFindingsCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-slate-800">Critical Findings Gate</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
                    {criticalFindingsCount} Blocking Sign-Off
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                    <p className="font-semibold text-rose-800">FND-SAFE-001 (Critical)</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">R32 flammable refrigerant purge instructed without 500-micron vacuuming.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                    <p className="font-semibold text-rose-800">FND-PRIV-001 (Critical)</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">Customer phone numbers &amp; Pune residential address returned unmasked.</p>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">
                    * Policy requires all Critical findings to be dispositioned before pilot sign-off.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Active Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {currentUser.name.split(' (')[0]}
                </div>
                <div className="text-[10px] font-medium text-blue-600">
                  {currentUser.roleLabel}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown for role simulation */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Switch Reviewer Persona</p>
                  <p className="text-xs text-slate-500">Test independent review perspectives</p>
                </div>
                <div className="py-1">
                  {availableUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSelectUser(user);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        user.id === currentUser.id ? 'bg-blue-50/70 text-blue-800 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="text-xs">{user.name}</p>
                        <p className="text-[10px] text-slate-500">{user.roleLabel}</p>
                      </div>
                      {user.id === currentUser.id && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="px-3 pt-2 pb-1 border-t border-slate-100 text-[10px] text-slate-400">
                  Independence Gate: Reviewers see only their own assigned cases without unsubmitted peer leakage.
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
