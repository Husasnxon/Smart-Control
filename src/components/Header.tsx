'use client';

import React from 'react';
import { Currency, Employee } from '../types';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  DollarSign, 
  Coins, 
  Lock, 
  Building2, 
  User, 
  Menu,
  Bell,
  BellRing,
  ChevronDown,
  Check
} from 'lucide-react';
import { formatDualMoney, formatNumberWithSpaces, formatUSDNumber } from '../utils/formatters';
import { Branch } from '../types';

interface HeaderProps {
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  offlineCount: number;
  onSync: () => void;
  todaySalesTotal: number;
  exchangeRate?: number;
  onUpdateExchangeRate?: (rate: number) => void;
  baseCurrency?: Currency;
  onUpdateBaseCurrency?: (curr: Currency) => void;
  onOpenZReport?: () => void;
  currentUser?: Employee | null;
  onSwitchUser?: () => void;
  onToggleMobileMenu?: () => void;
  pendingEstimatesCount?: number;
  onOpenEstimatesApproval?: () => void;
  onForceRefresh?: () => Promise<void> | void;
  currentBranch?: Branch | null;
  branches?: Branch[];
  onSelectBranch?: (branch: Branch) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOffline,
  setIsOffline,
  offlineCount,
  onSync,
  todaySalesTotal,
  exchangeRate = 12850,
  onUpdateExchangeRate,
  baseCurrency = 'UZS',
  onUpdateBaseCurrency,
  onOpenZReport,
  currentUser,
  onSwitchUser,
  onToggleMobileMenu,
  pendingEstimatesCount = 0,
  onOpenEstimatesApproval,
  onForceRefresh,
  currentBranch = null,
  branches = [],
  onSelectBranch
}) => {
  const [isManualSyncing, setIsManualSyncing] = React.useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = React.useState(false);
  const dualSales = formatDualMoney(todaySalesTotal, baseCurrency, exchangeRate);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#branch-selector-dropdown')) {
        setIsBranchDropdownOpen(false);
      }
    };
    if (isBranchDropdownOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isBranchDropdownOpen]);

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 gap-2 sm:gap-3">
      {/* Left: Mobile Menu Button + Brand / Store Info / Branch Selector */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Menyuni ochish"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-black text-xs shadow-md shadow-emerald-500/20 shrink-0">
            SC
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white tracking-wide">
                SMART CONTROL
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Tizim onlayn" />
            </div>

            {/* Interactive Branch Switcher Dropdown */}
            {(() => {
              const canSwitchBranch = currentUser?.systemRole === 'admin' || !!currentUser?.permissions?.canAccessAllBranches;
              return (
                <div className="relative" id="branch-selector-dropdown">
                  <button
                    type="button"
                    disabled={!canSwitchBranch}
                    onClick={() => canSwitchBranch && setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                    className={`flex items-center gap-1 text-[11px] font-bold transition group ${
                      canSwitchBranch
                        ? 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer'
                        : 'text-slate-500 dark:text-slate-400 cursor-default opacity-90'
                    }`}
                    title={canSwitchBranch ? "Filialni almashtirish" : "Siz faqat o'z filialingizga biriktirilgansiz"}
                  >
                    <Building2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate max-w-[120px] sm:max-w-[170px]">
                      {currentBranch ? currentBranch.name : 'Barcha Filiallar'}
                    </span>
                    {canSwitchBranch ? (
                      <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-emerald-500 transition-transform ${isBranchDropdownOpen ? 'rotate-180' : ''}`} />
                    ) : (
                      <span className="text-[10px] ml-0.5 text-slate-400" title="Filial qulflangan">🔒</span>
                    )}
                  </button>

                  {/* Branch Selector Dropdown Menu */}
                  {isBranchDropdownOpen && canSwitchBranch && (
                    <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>Filialni Tanlang:</span>
                        <span className="font-mono text-emerald-600">{branches.length} ta filial</span>
                      </div>

                      <div className="max-h-56 overflow-y-auto py-1 space-y-1">
                        {/* Option to view all branches combined */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectBranch) onSelectBranch(null as any);
                            setIsBranchDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl transition flex items-start gap-2.5 ${
                            currentBranch === null
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-200 dark:border-emerald-800/80'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Building2 className={`w-4 h-4 shrink-0 mt-0.5 ${currentBranch === null ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs truncate flex items-center gap-1.5">
                              <span>🌐 Barcha Filiallar (Jami)</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              Konsolidatsiyalangan umumiy ko&apos;rinish
                            </div>
                          </div>
                          {currentBranch === null && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                        </button>

                        {branches.map((b) => {
                          const isSelected = currentBranch?.id === b.id;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => {
                                if (onSelectBranch) onSelectBranch(b);
                                setIsBranchDropdownOpen(false);
                              }}
                              className={`w-full text-left p-2 rounded-xl transition flex items-start gap-2.5 ${
                                isSelected
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-200 dark:border-emerald-800/80'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <Building2 className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs truncate flex items-center gap-1.5">
                                  <span>{b.name}</span>
                                  {b.isMain && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                                      Bosh
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">
                                  Kod: {b.code} {b.address ? `• ${b.address}` : ''}
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        
        {/* ======================================================== */}
        {/* NOTIFICATION BELL: USTA SMETALARI (TECHNICIAN ESTIMATES) */}
        {/* ======================================================== */}
        {onOpenEstimatesApproval && currentUser?.systemRole !== 'technician' && (
          <button
            type="button"
            onClick={onOpenEstimatesApproval}
            className={`relative p-2 sm:px-3 sm:py-1.5 rounded-xl transition flex items-center gap-1.5 font-bold text-xs ${
              pendingEstimatesCount > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80'
            }`}
            title={`Ustalardan kelgan hisob-kitoblar (Smetalar)${pendingEstimatesCount > 0 ? `: ${pendingEstimatesCount} ta tasdiqlash kutilmoqda` : ''}`}
          >
            {pendingEstimatesCount > 0 ? (
              <BellRing className="w-4 h-4 text-slate-950 fill-slate-950 shrink-0 animate-bounce" />
            ) : (
              <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            )}
            
            <span className="hidden md:inline">
              {pendingEstimatesCount > 0 ? `Usta Smetasi (${pendingEstimatesCount})` : 'Smetalar'}
            </span>

            {pendingEstimatesCount > 0 && (
              <span className="md:hidden absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow-lg">
                {pendingEstimatesCount}
              </span>
            )}
          </button>
        )}

        {/* ASOSIY VALYUTANI TANLASH SWITCHERI (Global Currency Switcher) */}
        {onUpdateBaseCurrency && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
            <button
              type="button"
              onClick={() => onUpdateBaseCurrency('UZS')}
              className={`px-1.5 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                baseCurrency === 'UZS'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Asosiy valyuta: O'zbek so'mi"
            >
              <Coins className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="hidden xs:inline">So&apos;m</span>
              <span className="xs:hidden">UZS</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateBaseCurrency('USD')}
              className={`px-1.5 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                baseCurrency === 'USD'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Asosiy valyuta: AQSH Dollari ($)"
            >
              <DollarSign className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span className="hidden xs:inline">Dollar</span>
              <span className="xs:hidden">$</span>
            </button>
          </div>
        )}

        {/* Exchange Rate Pill (Dollar Kursi - Faqat ko'rinib turadi, ixcham va modal ochilmaydi) */}
        <div 
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200/80 dark:border-cyan-800/60 select-none text-xs font-bold text-cyan-700 dark:text-cyan-300"
          title={`Joriy kurs: 1$ = ${formatNumberWithSpaces(exchangeRate)} so'm`}
        >
          <span className="w-5 h-5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">$</span>
          <span className="text-[10px] text-slate-400 font-medium hidden lg:inline">Kurs:</span>
          <span className="font-mono font-extrabold">{formatNumberWithSpaces(exchangeRate)}</span>
        </div>

        {/* Bugungi Kassa (Ixcham, to'g'ri hisoblangan va kam joy egallaydi) */}
        <div 
          onClick={onOpenZReport}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 cursor-pointer hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition text-xs font-bold select-none"
          title="Bugungi jami kassa tushumi (Z-hisobotni ko'rish uchun bosing)"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Kassa:</span>
          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black">
            {baseCurrency === 'USD' ? `$${formatUSDNumber(todaySalesTotal / exchangeRate)}` : `${formatNumberWithSpaces(todaySalesTotal)} so'm`}
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
            ({baseCurrency === 'USD' ? `${formatNumberWithSpaces(todaySalesTotal)} so'm` : `$${formatUSDNumber(todaySalesTotal / exchangeRate)}`})
          </span>
        </div>

        {/* Z-Report / Smena Yopish Button (Only for admin or cashier) */}
        {onOpenZReport && currentUser?.systemRole !== 'technician' && (
          <button
            type="button"
            onClick={onOpenZReport}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition shadow-sm"
            title="Smenani yopish va Z-Hisobot chiqarish"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Z-Hisobot (Smena)</span>
            <span className="md:hidden">Z-Hisobot</span>
          </button>
        )}

        {/* Current User Pill / Switcher */}
        {currentUser && (
          <div 
            onClick={onSwitchUser}
            className="flex items-center gap-2 pl-2 pr-2 sm:pr-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Foydalanuvchini almashtirish"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0 ${
              currentUser.systemRole === 'admin'
                ? 'bg-gradient-to-br from-amber-500 to-rose-500'
                : currentUser.systemRole === 'cashier'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                : 'bg-gradient-to-br from-cyan-500 to-blue-600'
            }`}>
              {currentUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-[11px] font-bold text-slate-800 dark:text-white leading-tight">
                {currentUser.fullName.split(' ')[0]}
              </div>
              <div className="text-[9px] text-slate-400 font-medium leading-none">
                {currentUser.role}
              </div>
            </div>
          </div>
        )}

        {/* Quick Force Cloud Refresh Button */}
        {onForceRefresh && (
          <button
            type="button"
            onClick={async () => {
              setIsManualSyncing(true);
              if (onForceRefresh) await onForceRefresh();
              setTimeout(() => setIsManualSyncing(false), 500);
            }}
            title="Bulut bilan darhol yangilash"
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition active:scale-95 border border-slate-200 dark:border-slate-700/80 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isManualSyncing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        )}

        {/* Offline Simulation Toggle Button */}
        <button
          onClick={() => setIsOffline(!isOffline)}
          title="Internet ulanishini simulyatsiya qilish"
          className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isOffline
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
          }`}
        >
          {isOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Oflayn</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Onlayn</span>
            </>
          )}
        </button>

        {/* Sync Button if offline items exist */}
        {offlineCount > 0 && (
          <button
            onClick={onSync}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition animate-pulse"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sinxron ({offlineCount})</span>
            <span className="sm:hidden">{offlineCount}</span>
          </button>
        )}
      </div>
    </header>
  );
};
