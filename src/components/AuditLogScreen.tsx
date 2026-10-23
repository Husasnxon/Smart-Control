'use client';

import React, { useState, useMemo } from 'react';
import { AuditLog, AuditEntityType, AuditAction, Employee, Currency } from '../types';
import { 
  ShieldAlert, 
  ShieldCheck, 
  History, 
  Search, 
  Download, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  RotateCcw, 
  DollarSign, 
  FileText, 
  UserCheck, 
  Filter, 
  Calendar, 
  Layers,
  ArrowRight,
  User,
  Clock,
  Sparkles,
  Building2
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface AuditLogScreenProps {
  logs: AuditLog[];
  employees: Employee[];
  currentUser?: Employee | null;
  baseCurrency?: Currency;
  exchangeRate?: number;
  onClearLogs?: () => void;
}

export const AuditLogScreen: React.FC<AuditLogScreenProps> = ({
  logs = [],
  employees = [],
  currentUser,
  baseCurrency = 'UZS',
  exchangeRate = 12850,
  onClearLogs
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Entity filter
      if (selectedEntity !== 'all' && log.entityType !== selectedEntity) return false;

      // Action filter
      if (selectedAction !== 'all' && log.action !== selectedAction) return false;

      // Employee filter
      if (selectedEmployeeId !== 'all' && log.performedBy.id !== selectedEmployeeId) return false;

      // Period filter
      if (periodFilter !== 'all') {
        const todayStr = new Date().toLocaleDateString('uz-UZ');
        if (periodFilter === 'today') {
          if (!log.timestamp.startsWith(todayStr) && !log.timestamp.includes(todayStr)) {
            // Also test standard date format
            const d = new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const isoToday = `${y}-${m}-${day}`;
            if (!log.timestamp.includes(isoToday)) return false;
          }
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = log.entityTitle?.toLowerCase().includes(q);
        const matchDetails = log.details?.toLowerCase().includes(q);
        const matchUser = log.performedBy?.name?.toLowerCase().includes(q);
        const matchAdmin = log.adminName?.toLowerCase().includes(q);
        if (!matchTitle && !matchDetails && !matchUser && !matchAdmin) return false;
      }

      return true;
    });
  }, [logs, selectedEntity, selectedAction, selectedEmployeeId, periodFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const deletes = logs.filter((l) => l.action === 'delete').length;
    const updates = logs.filter((l) => l.action === 'update' || l.action === 'return').length;
    const adminApproved = logs.filter((l) => l.adminApproved).length;
    const payrolls = logs.filter((l) => l.entityType === 'payroll' || l.entityType === 'advance').length;
    return { total, deletes, updates, adminApproved, payrolls };
  }, [logs]);

  // Excel Export
  const handleExportToExcel = () => {
    const rows = filteredLogs.map((l, idx) => ({
      "№": idx + 1,
      "Sana va Vaqt": l.timestamp,
      "Bo'lim / Hujjat Turi": getEntityLabel(l.entityType),
      "Hujjat / Mavzu": l.entityTitle,
      "Amal Turi": getActionLabel(l.action),
      "Bajaruvchi Xodim": l.performedBy.name,
      "Xodim Lavozimi": l.performedBy.role,
      "Admin Huquqi": l.adminApproved ? "✓ Ha (Admin ruxsati bilan)" : "Yo'q",
      "Tasdiqlagan Admin": l.adminName || (l.adminApproved ? l.performedBy.name : "—"),
      "O'zgarish Tafsiloti": l.details,
      "Eski Qiymat": l.oldValue || "—",
      "Yangi Qiymat": l.newValue || "—"
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit_Jurnali");
    XLSX.writeFile(wb, `SmartControl_Xavfsizlik_Audit_Tarixi_${Date.now()}.xlsx`);
  };

  // Helper Labels & Colors
  function getEntityLabel(type: AuditEntityType) {
    switch (type) {
      case 'receipt':
        return '🧾 Sotuv Cheki';
      case 'expense':
        return '💸 Chiqim / Rasxod';
      case 'purchase':
        return '📦 Prixod (Kirim Tovar)';
      case 'payroll':
        return '👥 Oylik Maosh';
      case 'advance':
        return '💵 Avans';
      case 'order':
        return '📋 Smeta / Zakaz';
      case 'cashflow':
        return '🏦 Kassa / Pul Oqimi';
      default:
        return type;
    }
  }

  function getActionBadge(action: AuditAction) {
    switch (action) {
      case 'delete':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <Trash2 className="w-3 h-3" />
            <span>O&apos;chirildi</span>
          </span>
        );
      case 'update':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Edit3 className="w-3 h-3" />
            <span>Tahrirlandi</span>
          </span>
        );
      case 'return':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" />
            <span>Vozvrat Qaytarildi</span>
          </span>
        );
      case 'payout':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            <span>To&apos;landi</span>
          </span>
        );
      case 'create':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <PlusCircle className="w-3 h-3" />
            <span>Yangi Kiritildi</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            {action}
          </span>
        );
    }
  }

  function getActionLabel(action: AuditAction) {
    switch (action) {
      case 'delete': return "O'chirildi";
      case 'update': return "Tahrirlandi";
      case 'return': return "Vozvrat";
      case 'payout': return "To'lov qilindi";
      case 'create': return "Yangi kiritildi";
      default: return action;
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black tracking-tight">
                Xavfsizlik & Audit Jurnali
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 border border-rose-500/40 text-rose-300">
                Admin Nazorati
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Tizimdagi barcha sotuvlar, kirim-chiqimlar, prixod-rasxodlar, oylik to&apos;lovlari va ularning o&apos;zgartirilishi yoki o&apos;chirilishi qachon, qaysi xodim va qaysi Administrator ruxsati bilan bajarilganligi qat&apos;iy qayd etib boriladi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportToExcel}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
              title="Audit tarixini Excel formatda yuklab olish"
            >
              <Download className="w-4 h-4" />
              <span>Excel Eksport</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Jami Amaliyotlar</span>
            <History className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {stats.total} ta
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Ro&apos;yxatga olingan barcha amallar</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-rose-500 font-bold">
            <span>O&apos;chirish Amallari</span>
            <Trash2 className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
            {stats.deletes} ta
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">O&apos;chirilgan hujjat va cheklar</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-500 font-bold">
            <span>Tahrirlash & Vozvrat</span>
            <Edit3 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
            {stats.updates} ta
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">O&apos;zgartirilgan yoki qaytarilgan</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-purple-500 font-bold">
            <span>Admin Ruxsati Bilan</span>
            <ShieldAlert className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1">
            {stats.adminApproved} ta
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">👑 Administrator tasdiqlagan</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Chek №, xodim ismi, tavsif yoki admin ismi bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Quick Period Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0 text-xs">
            <button
              onClick={() => setPeriodFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                periodFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Hammasi
            </button>
            <button
              onClick={() => setPeriodFilter('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                periodFilter === 'today'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Bugun
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Bo&apos;lim / Hujjat:</label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="all">Barcha bo&apos;limlar</option>
              <option value="receipt">🧾 Sotuv Cheklari & Vozvrat</option>
              <option value="expense">💸 Kirim & Chiqimlar (Rasxod)</option>
              <option value="purchase">📦 Prixod (Kirim Nakladnoylar)</option>
              <option value="payroll">👥 Oylik Maoshlar</option>
              <option value="advance">💵 Avanslar</option>
              <option value="cashflow">🏦 Kassa & Pul Oqimi</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Amal Turi:</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="all">Barcha amallar</option>
              <option value="delete">🗑️ O&apos;chirish amallari</option>
              <option value="update">✏️ Tahrirlash amallari</option>
              <option value="return">↩️ Vozvrat (Tovar qaytarish)</option>
              <option value="payout">💰 To&apos;lov & Oylik berish</option>
              <option value="create">➕ Yangi yaratish</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Bajaruvchi Xodim:</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="all">Barcha xodimlar</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Sana & Vaqt</th>
                <th className="py-3.5 px-4">Bo&apos;lim & Hujjat</th>
                <th className="py-3.5 px-4">Amal</th>
                <th className="py-3.5 px-4">Mas&apos;ul Xodim</th>
                <th className="py-3.5 px-4">Admin Tasdig&apos;i</th>
                <th className="py-3.5 px-4">O&apos;zgarish Tafsiloti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2 opacity-60" />
                    <p className="font-bold text-slate-600 dark:text-slate-300">
                      Audit yozuvlari topilmadi
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sotuvlar, prixod-rasxodlar yoki oylik o&apos;zgartirilganda bu yerda avtomatik to&apos;liq tarix shakllanadi.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>

                    {/* Entity */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {log.entityTitle}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {getEntityLabel(log.entityType)}
                      </span>
                    </td>

                    {/* Action Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Performed by */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {log.performedBy?.name || 'Noma\'lum xodim'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block ml-4.5">
                        {log.performedBy?.role || log.performedBy?.systemRole || 'Xodim'}
                        {log.performedBy?.branchName && ` &bull; ${log.performedBy.branchName}`}
                      </span>
                    </td>

                    {/* Admin Approval */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.adminApproved ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                          <span>👑</span>
                          <span>Admin: {log.adminName || log.performedBy?.name || 'Administrator'}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Standart ruxsat
                        </span>
                      )}
                    </td>

                    {/* Details */}
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="text-slate-700 dark:text-slate-300 leading-snug">
                        {log.details}
                      </p>
                      {(log.oldValue || log.newValue) && (
                        <div className="mt-1 flex items-center gap-2 text-[10px] font-mono">
                          {log.oldValue && (
                            <span className="text-rose-500 line-through">
                              Eski: {log.oldValue}
                            </span>
                          )}
                          {log.oldValue && log.newValue && <span>&rarr;</span>}
                          {log.newValue && (
                            <span className="text-emerald-600 font-bold">
                              Yangi: {log.newValue}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
