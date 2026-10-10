'use client';

import React from 'react';
import { ActiveTab, Employee, DEFAULT_ROLE_TABS } from '../types';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Sparkles, 
  History, 
  Settings, 
  TrendingDown,
  Cpu,
  HardHat,
  FileSpreadsheet,
  ShieldCheck,
  Bot,
  LogOut,
  UserCheck,
  X,
  BarChart3,
  Kanban,
  ArrowLeftRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  technicianSubTab?: string;
  onSelectTechnicianSubTab?: (subTab: string) => void;
  offlineCount: number;
  isOffline: boolean;
  activeServiceCount?: number;
  debtorsCount?: number;
  currentUser?: Employee | null;
  onLogout?: () => void;
  onSwitchUser?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const ALL_DEFAULT_TABS: ActiveTab[] = ['dashboard', 'financial_reports', 'crm', 'pos', 'orders', 'inventory', 'warranty', 'customers', 'employees', 'settings'];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  technicianSubTab = 'active_jobs',
  onSelectTechnicianSubTab,
  offlineCount,
  isOffline,
  activeServiceCount,
  debtorsCount,
  currentUser,
  onLogout,
  onSwitchUser,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const isTechUser = currentUser?.systemRole === 'technician' || 
    (currentUser?.role.toLowerCase().includes('usta') && currentUser?.systemRole !== 'admin' && currentUser?.systemRole !== 'manager');

  const techNavItems = [
    { id: 'technician_portal' as ActiveTab, subTab: 'active_jobs', label: 'Usta Kabineti (Obyektlar)', icon: HardHat, badge: 'Obyektlar', color: 'text-purple-400' },
    { id: 'technician_portal' as ActiveTab, subTab: 'estimates', label: 'Smeta & Hisob-kitob', icon: FileSpreadsheet, badge: 'Smeta', color: 'text-sky-400' },
    { id: 'technician_portal' as ActiveTab, subTab: 'completed_handovers', label: 'Topshirilgan Ish Aktlari', icon: ShieldCheck, badge: 'Aktlar', color: 'text-emerald-400' },
    { id: 'technician_portal' as ActiveTab, subTab: 'service_tasks', label: 'Kafolat & Servis', icon: Cpu, badge: 'Servis', color: 'text-teal-400' },
  ];

  const allNavItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard (Tahlil)', icon: LayoutDashboard, badge: 'Tahlil', color: 'text-emerald-400' },
    { id: 'financial_reports' as ActiveTab, label: 'Hisobotlar & P&L', icon: BarChart3, badge: 'P&L', color: 'text-emerald-400' },
    { id: 'crm' as ActiveTab, label: 'CRM & 2D Obyektlar', icon: Kanban, badge: '2D & QR', color: 'text-indigo-400' },
    { id: 'pos' as ActiveTab, label: 'POS Kassa', icon: ShoppingCart, badge: isOffline ? 'Oflayn' : undefined, color: 'text-emerald-500' },
    { id: 'orders' as ActiveTab, label: 'Hisob-kitob & Otgruzka', icon: FileSpreadsheet, badge: 'Smeta', color: 'text-sky-400' },
    { id: 'inventory' as ActiveTab, label: 'Ombor & Mahsulotlar', icon: Package, color: 'text-cyan-500' },
    { id: 'warranty' as ActiveTab, label: 'Kafolat & Servis', icon: ShieldCheck, badge: activeServiceCount ? `${activeServiceCount}` : 'S/N', color: 'text-teal-400' },
    { id: 'customers' as ActiveTab, label: 'Mijozlar & Nasiyalar', icon: Users, badge: debtorsCount && debtorsCount > 0 ? `${debtorsCount} qarz` : undefined, color: 'text-amber-500' },
    { id: 'expenses' as ActiveTab, label: 'Moliya & Pul Oqimi', icon: ArrowLeftRight, badge: 'Prixod/Rasxod', color: 'text-rose-400' },
    { id: 'ai_advisor' as ActiveTab, label: 'AI Tahlilchi & Zakaz', icon: Sparkles, badge: 'Smart', color: 'text-indigo-500' },
    { id: 'technician_portal' as ActiveTab, label: 'Usta Kabineti (Mobil)', icon: HardHat, badge: 'Obyektlar', color: 'text-purple-400' },
    { id: 'settings' as ActiveTab, label: 'Telegram & Sozlamalar', icon: Bot, badge: 'Bot', color: 'text-sky-400' },
  ];

  // Determine allowed tabs for current user
  const allowedTabs = React.useMemo(() => {
    if (!currentUser) return [...ALL_DEFAULT_TABS];

    if (isTechUser) {
      return ['technician_portal'] as ActiveTab[];
    }

    let tabs: ActiveTab[] = [];
    if (currentUser.allowedTabs && currentUser.allowedTabs.length > 0) {
      tabs = [...currentUser.allowedTabs];
    } else if (currentUser.systemRole && DEFAULT_ROLE_TABS[currentUser.systemRole]) {
      tabs = [...DEFAULT_ROLE_TABS[currentUser.systemRole]];
    } else {
      tabs = [...ALL_DEFAULT_TABS];
    }

    if (currentUser.systemRole === 'admin' || currentUser.systemRole === 'manager' || !currentUser.systemRole || currentUser.permissions?.canViewFinancialReports) {
      if (!tabs.includes('financial_reports')) {
        tabs.splice(1, 0, 'financial_reports');
      }
      if (!tabs.includes('crm')) {
        tabs.splice(2, 0, 'crm');
      }
      if (!tabs.includes('technician_portal')) {
        tabs.push('technician_portal');
      }
    } else if (currentUser.systemRole === 'cashier') {
      if (!tabs.includes('crm')) {
        tabs.unshift('crm');
      }
    }
    return tabs;
  }, [currentUser, isTechUser]);

  // Filter visible tabs
  const navItems = allNavItems.filter((item) => allowedTabs.includes(item.id));

  const handleSelectTab = (tabId: ActiveTab, subTab?: string) => {
    setActiveTab(tabId);
    if (subTab && onSelectTechnicianSubTab) {
      onSelectTechnicianSubTab(subTab);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full select-none">
      {/* Brand Header */}
      <div className="overflow-y-auto flex-1">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl tracking-tight">
              SC
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-base tracking-wide">SMART</span>
                <span className="font-light text-cyan-400 text-base">CONTROL</span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">Xavfsizlik & Tarmoq ERP</p>
            </div>
          </div>

          {/* Close button for mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Menyuni yopish"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Sync / Offline Mini Status Badge */}
        <div className="px-4 py-2.5 mx-3 my-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="font-medium text-slate-200 text-[11px]">
              {isOffline ? 'Oflayn Rejim' : 'Onlayn (Bulut)'}
            </span>
          </div>
          {offlineCount > 0 && (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              {offlineCount} navbatda
            </span>
          )}
          {!isOffline && offlineCount === 0 && (
            <span className="text-[10px] text-slate-400">Sinxron</span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {isTechUser ? (
            techNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === 'technician_portal' && (technicianSubTab === item.subTab || (!technicianSubTab && item.subTab === 'active_jobs'));
              return (
                <button
                  key={item.subTab}
                  onClick={() => handleSelectTab(item.id, item.subTab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white shadow-md shadow-emerald-600/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white shadow-md shadow-emerald-600/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </nav>
      </div>

      {/* Footer Profile & Logout Area */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        {currentUser ? (
          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md ${
                  currentUser.systemRole === 'admin'
                    ? 'bg-gradient-to-br from-amber-500 to-rose-500 shadow-amber-500/20'
                    : currentUser.systemRole === 'cashier'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/20'
                    : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20'
                }`}>
                  {currentUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-100 truncate flex items-center gap-1">
                    <span>{currentUser.fullName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                    <span className="text-cyan-400 font-medium">@{currentUser.username || 'user'}</span>
                    <span>•</span>
                    <span>{currentUser.role}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Switch & Logout Buttons */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
              {onSwitchUser && (
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                    onSwitchUser();
                  }}
                  className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center gap-1"
                  title="Boshqa profilga almashtirish"
                >
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Almashtirish</span>
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                    onLogout();
                  }}
                  className="py-1.5 px-2.5 rounded-xl text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition flex items-center justify-center gap-1"
                  title="Tizimdan chiqish"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Chiqish</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Chilonzor Filiali
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Static Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-col shrink-0 h-screen sticky top-0">
        {renderSidebarContent()}
      </aside>

      {/* 2. Mobile Drawer Sidebar (Slide-over with blur backdrop) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
            onClick={onCloseMobile}
          />
          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 text-slate-300 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderSidebarContent()}
          </div>
        </div>
      )}
    </>
  );
};
