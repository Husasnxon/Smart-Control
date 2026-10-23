'use client';

import React, { useState } from 'react';
import { Employee } from '../types';
import { ShieldAlert, KeyRound, Lock, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminEmployee: Employee) => void;
  title?: string;
  description?: string;
  actionDetails?: string;
  employees: Employee[];
  currentUser?: Employee | null;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Administrator Tasdig'i Talab Qilinadi",
  description = "Ushbu amaliyot (o'chirish yoki tahrirlash) moliyaviy hisobot va ombor balansiga to'g'ridan-to'g'ri ta'sir qilgani uchun faqat Administrator ruxsati bilan bajariladi.",
  actionDetails,
  employees,
  currentUser
}) => {
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [passwordOrPin, setPasswordOrPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Find all admin employees
  const adminEmployees = employees.filter(
    (e) => !e.isBlocked && (e.systemRole === 'admin' || e.role?.toLowerCase().includes('admin'))
  );

  // Default to first admin if not selected
  const activeAdmin =
    adminEmployees.find((e) => e.id === selectedAdminId) ||
    adminEmployees[0] ||
    ({
      id: 'emp-admin',
      fullName: 'Bosh Administrator',
      role: 'Bosh Administrator',
      systemRole: 'admin',
      password: '123',
      pin: '0000'
    } as Employee);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = passwordOrPin.trim();
    if (!trimmed) {
      setErrorMsg("Iltimos, Administrator paroli yoki PIN-kodini kiriting!");
      return;
    }

    // Check credentials against activeAdmin or any admin
    const isMatching = adminEmployees.some((adm) => {
      const matchPin = adm.pin && adm.pin === trimmed;
      const matchPass = adm.password && adm.password === trimmed;
      const defaultPass = trimmed === '123' || trimmed === 'admin' || trimmed === '0000';
      return matchPin || matchPass || defaultPass;
    }) || trimmed === '123' || trimmed === '0000' || trimmed === 'admin';

    if (isMatching) {
      const verifiedAdmin =
        adminEmployees.find(
          (adm) => adm.pin === trimmed || adm.password === trimmed
        ) || activeAdmin;

      setPasswordOrPin('');
      setErrorMsg('');
      onSuccess(verifiedAdmin);
      onClose();
    } else {
      setErrorMsg("Xato PIN-kod yoki parol! Administrator ruxsati tasdiqlanmadi.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-white/80 mt-0.5">
                Xavfsizlik va Moliya nazorati
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleVerify} className="p-6 space-y-4">
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3.5 rounded-2xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span>{description}</span>
              {actionDetails && (
                <div className="mt-2 font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/40 p-1.5 rounded-lg text-[11px]">
                  {actionDetails}
                </div>
              )}
            </div>
          </div>

          {/* Admin selection if multiple admins exist */}
          {adminEmployees.length > 1 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tasdiqlovchi Administrator:
              </label>
              <select
                value={selectedAdminId || activeAdmin.id}
                onChange={(e) => setSelectedAdminId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-rose-500/40"
              >
                {adminEmployees.map((adm) => (
                  <option key={adm.id} value={adm.id}>
                    👑 {adm.fullName} ({adm.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* PIN or Password input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Admin PIN-kodi yoki Paroli:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                autoFocus
                placeholder="Admin PIN (0000) yoki parol (123)..."
                value={passwordOrPin}
                onChange={(e) => {
                  setPasswordOrPin(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/40"
              />
            </div>
            {errorMsg && (
              <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1 animate-shake">
                <span>✕</span> {errorMsg}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">
              Birlamchi admin PIN-kodi: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">0000</span> yoki parol: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">123</span>
            </p>
          </div>

          {/* Current requester note */}
          {currentUser && (
            <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2.5">
              <span>Talab qiluvchi xodim:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {currentUser.fullName} ({currentUser.role || currentUser.systemRole})
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-xs font-black text-white shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Tasdiqlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
