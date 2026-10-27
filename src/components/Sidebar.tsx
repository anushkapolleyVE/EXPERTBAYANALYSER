import React from 'react';
import { 
  LayoutDashboard, Database, Sliders, Users, 
  ClipboardList, CheckSquare, GitCompare, AlertOctagon, 
  BarChart3, Settings, ShieldAlert, Sparkles, BookOpen
} from 'lucide-react';

export type NavItem = 
  | 'overview'
  | 'test_material'
  | 'criteria'
  | 'reviewers'
  | 'assignments'
  | 'workspace'
  | 'disagreements'
  | 'failures'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  pendingDisagreementsCount: number;
  criticalFailuresCount: number;
  totalCasesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingDisagreementsCount,
  criticalFailuresCount,
  totalCasesCount
}) => {
  const navItems = [
    {
      id: 'overview' as NavItem,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
      flowchartStage: 'Pilot Overview'
    },
    {
      id: 'test_material' as NavItem,
      label: 'Test Material',
      icon: Database,
      badge: `${totalCasesCount} Cases`,
      badgeColor: 'bg-blue-100 text-blue-800',
      flowchartStage: 'Stage 1: Inputs'
    },
    {
      id: 'criteria' as NavItem,
      label: 'Evaluation Criteria',
      icon: Sliders,
      badge: '5 Dimensions',
      badgeColor: 'bg-slate-100 text-slate-700',
      flowchartStage: 'Stage 2: Criteria'
    },
    {
      id: 'reviewers' as NavItem,
      label: 'Reviewers',
      icon: Users,
      badge: '2 Types',
      badgeColor: 'bg-purple-100 text-purple-800',
      flowchartStage: 'Stage 3: Reviewers'
    },
    {
      id: 'assignments' as NavItem,
      label: 'Assignments',
      icon: ClipboardList,
      badge: '2x Review',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      flowchartStage: 'Stage 3: Allocation'
    },
    {
      id: 'workspace' as NavItem,
      label: 'Evaluation Workspace',
      icon: CheckSquare,
      badge: 'Core UI',
      badgeColor: 'bg-amber-100 text-amber-800',
      flowchartStage: 'Stage 4: Review'
    },
    {
      id: 'disagreements' as NavItem,
      label: 'Disagreements',
      icon: GitCompare,
      badge: pendingDisagreementsCount > 0 ? `${pendingDisagreementsCount} Pending` : null,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold',
      flowchartStage: 'Stage 4: Adjudicate'
    },
    {
      id: 'failures' as NavItem,
      label: 'Safety & Privacy Failures',
      icon: AlertOctagon,
      badge: criticalFailuresCount > 0 ? `${criticalFailuresCount} Critical` : null,
      badgeColor: 'bg-rose-100 text-rose-800 font-bold',
      flowchartStage: 'Stage 4: Failures'
    },
    {
      id: 'reports' as NavItem,
      label: 'Analytics & Reports',
      icon: BarChart3,
      badge: '4 Deliverables',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      flowchartStage: 'Stage 5 & 7'
    },
    {
      id: 'settings' as NavItem,
      label: 'Settings & Audit',
      icon: Settings,
      badge: null,
      flowchartStage: 'Compliance'
    }
  ];

  return (
    <aside className="w-72 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col justify-between border-r border-slate-800 select-none overflow-y-auto">
      
      {/* Top Navigation Links */}
      <div className="p-3 space-y-1">
        <div className="px-3 pt-3 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Pilot Navigation
          </p>
        </div>

        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 mr-2 text-left">
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                  <span className="whitespace-nowrap text-left">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${isActive ? 'bg-blue-700/80 text-blue-100 border border-blue-400/30' : item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Source Material Context Card */}
      <div className="p-4 m-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-slate-200">Database Inventory</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono">{totalCasesCount} Total</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
          Active test material loaded from PostgreSQL database under evaluation protocol.
        </p>
        <div className="space-y-1 text-[10px] text-slate-400">
          <div className="flex items-center justify-between">
            <span>• Active Test Cases:</span>
            <span className="font-semibold text-slate-300 font-mono">{totalCasesCount}</span>
          </div>
          <div className="flex items-center justify-between text-blue-400 font-medium pt-1.5 border-t border-slate-700/60">
            <span>• Multi-Reviewer Mandate:</span>
            <span className="font-semibold whitespace-nowrap">2+ Reviewers/Case</span>
          </div>
        </div>
      </div>

    </aside>
  );
};
