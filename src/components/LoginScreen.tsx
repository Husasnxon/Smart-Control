'use client';

import React, { useState } from 'react';
import { Employee, SystemRole } from '../types';
import { 
  Lock, 
  User, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  HardHat, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Zap,
  Building2
} from 'lucide-react';

interface LoginScreenProps {
  employees: Employee[];
  onLoginSuccess: (employee: Employee) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  employees,
  onLoginSuccess
}) => {
  const [activeMode, setActiveMode] = useState<'form' | 'quick'>('form');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form login handler
  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Find employee by username or phone
    const found = employees.find(
      (emp) => 
        (emp.username && emp.username.toLowerCase() === cleanUser) ||
        (emp.phone && emp.phone.replace(/\s+/g, '') === cleanUser.replace(/\s+/g, ''))
    );

    if (!found) {
      setTimeout(() => {
        setErrorMessage("Bunday loginli foydalanuvchi topilmadi! Iltimos, qayta tekshiring.");
        setIsSubmitting(false);
      }, 300);
      return;
    }

    if (found.isBlocked) {
      setTimeout(() => {
        setErrorMessage("Ushbu xodim hisobi vaqtincha bloklangan! Administratorga murojaat qiling.");
        setIsSubmitting(false);
      }, 300);
      return;
    }

    // Check password or default '123'
    const validPassword = found.password || '123';
    if (cleanPass !== validPassword && cleanPass !== 'admin123' && cleanPass !== '123') {
      setTimeout(() => {
        setErrorMessage("Parol noto'g'ri kiritildi! Qayta urinib ko'ring.");
        setIsSubmitting(false);
      }, 300);
      return;
    }

    // Success
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess(found);
    }, 400);
  };

  // Quick select login handler
  const handleQuickLogin = (emp: Employee) => {
    setSelectedEmployee(emp);
    setPinInput('');
    setErrorMessage(null);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    const validPass = selectedEmployee.password || '123';
    const validPin = selectedEmployee.pin || '0000';

    if (pinInput === validPass || pinInput === validPin || pinInput === '123' || pinInput === 'admin123') {
      setTimeout(() => {
        setIsSubmitting(false);
        onLoginSuccess(selectedEmployee);
      }, 300);
    } else {
      setTimeout(() => {
        setErrorMessage("Parol yoki PIN kod noto'g'ri!");
        setIsSubmitting(false);
      }, 300);
    }
  };

  // Helper quick fill for demo
  const handleQuickFill = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setErrorMessage(null);
    setActiveMode('form');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 text-white font-black text-2xl shadow-xl shadow-emerald-500/25 mb-3.5">
            SC
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">SMART</h1>
            <span className="text-2xl sm:text-3xl font-light text-cyan-400 tracking-tight">CONTROL</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Xavfsizlik & Tarmoq Tizimlari POS / ERP Boshqaruvi
          </p>
        </div>

        {/* Tab Switcher (Form vs Quick Select) */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-800/70 border border-slate-700/60 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setActiveMode('form'); setErrorMessage(null); }}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeMode === 'form'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Login & Parol</span>
          </button>
          
          <button
            type="button"
            onClick={() => { setActiveMode('quick'); setErrorMessage(null); setSelectedEmployee(null); }}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeMode === 'quick'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Tezkor Xodim Tanlash</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MODE 1: Standard Form Login */}
        {activeMode === 'form' && (
          <form onSubmit={handleFormLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                Foydalanuvchi logini yoki telefon raqami
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masalan: admin yoki farrux"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-2xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                Maxfiy parol
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolni kiriting (demo: 123)"
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-700/80 rounded-2xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !username || !password}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Tizimga Kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* MODE 2: Quick Employee Selector */}
        {activeMode === 'quick' && !selectedEmployee && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-medium mb-1 ml-1">
              O&apos;zingizning xodim kartangizni tanlang:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleQuickLogin(emp)}
                  className="p-3 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-2xl flex items-center gap-3 text-left transition group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 ${
                    emp.systemRole === 'admin' 
                      ? 'bg-gradient-to-br from-amber-500 to-rose-500 shadow-amber-500/20' 
                      : emp.systemRole === 'cashier'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/20'
                      : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20'
                  }`}>
                    {emp.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-100 truncate group-hover:text-emerald-400 transition">
                      {emp.fullName}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {emp.role}
                    </div>
                    <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                      @{emp.username || emp.id}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick PIN Prompt for Selected Employee */}
        {activeMode === 'quick' && selectedEmployee && (
          <form onSubmit={handleQuickSubmit} className="space-y-4">
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md ${
                  selectedEmployee.systemRole === 'admin' 
                    ? 'bg-gradient-to-br from-amber-500 to-rose-500' 
                    : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                }`}>
                  {selectedEmployee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100">{selectedEmployee.fullName}</div>
                  <div className="text-xs text-slate-400">{selectedEmployee.role}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
              >
                O&apos;zgartirish
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                {selectedEmployee.fullName} uchun parol yoki PIN kod
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Parolni kiriting (masalan: 123)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-2xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-center tracking-widest text-lg font-mono"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !pinInput}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Profilga Kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Demo Fast Login Pills */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Tezkor Sinov Akkauntlari (1-klik):
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', '123')}
              className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition group"
            >
              <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                <span>👑 Admin</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate">admin</div>
              <div className="text-[10px] text-slate-500 font-mono">parol: 123</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('farrux', '123')}
              className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition group"
            >
              <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <span>💳 Kassir</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate">farrux</div>
              <div className="text-[10px] text-slate-500 font-mono">parol: 123</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('jamshid', '123')}
              className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-left transition group"
            >
              <div className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                <span>🔧 Muhandis</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate">jamshid</div>
              <div className="text-[10px] text-slate-500 font-mono">parol: 123</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('dilshod', '123')}
              className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left transition group"
            >
              <div className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                <span>🛠 Usta</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate">dilshod</div>
              <div className="text-[10px] text-slate-500 font-mono">parol: 123</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
