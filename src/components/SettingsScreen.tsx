'use client';

import React, { useState, useEffect } from 'react';
import { 
  Product, 
  SaleReceipt, 
  Expense, 
  Employee, 
  Customer, 
  CustomerDebtPayment, 
  ServiceTicket,
  PurchaseInvoice,
  Currency,
  EmployeePermissions,
  SystemRole,
  DEFAULT_ROLE_PERMISSIONS
} from '../types';
import { 
  getTelegramSettings, 
  saveTelegramSettings, 
  sendTelegramMessage, 
  testTelegramConnection,
  generateDailySalesReport,
  generateLowStockReport,
  generateTechniciansReport,
  generateDebtSummaryReport,
  generateServiceWarrantyReport,
  TelegramSettings
} from '../utils/telegram';
import { formatNumberWithSpaces, formatUSDNumber, isTodayDate } from '../utils/formatters';
import { 
  Send, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Smartphone, 
  HelpCircle, 
  Download, 
  Upload, 
  Save, 
  Check, 
  Copy, 
  Building2, 
  DollarSign, 
  Coins, 
  Package, 
  Wrench, 
  BookOpen, 
  ShieldCheck, 
  TrendingDown, 
  Trash2, 
  HardDrive,
  Info,
  Users,
  Lock,
  Shield,
  Sliders,
  CheckSquare,
  XCircle,
  Sparkles,
  UserCheck,
  Key,
  Layers,
  Table,
  ToggleLeft,
  ToggleRight,
  User
} from 'lucide-react';

interface SettingsScreenProps {
  products: Product[];
  receipts: SaleReceipt[];
  expenses: Expense[];
  employees: Employee[];
  customers: Customer[];
  debtPayments: CustomerDebtPayment[];
  serviceTickets: ServiceTicket[];
  purchases?: PurchaseInvoice[];
  exchangeRate: number;
  onUpdateExchangeRate: (rate: number) => void;
  baseCurrency: Currency;
  onUpdateBaseCurrency: (currency: Currency) => void;
  onRestoreAllData?: (data: any) => void;
  currentUser?: Employee | null;
  onUpdateEmployee?: (employee: Employee) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  products,
  receipts,
  expenses,
  employees,
  customers,
  debtPayments,
  serviceTickets,
  purchases = [],
  exchangeRate,
  onUpdateExchangeRate,
  baseCurrency,
  onUpdateBaseCurrency,
  onRestoreAllData,
  currentUser,
  onUpdateEmployee
}) => {
  const [activeTab, setActiveTab] = useState<'telegram' | 'reports' | 'store' | 'backup' | 'permissions'>('permissions');

  // Telegram settings state
  const [settings, setSettings] = useState<TelegramSettings>(() => getTelegramSettings());
  const [showToken, setShowToken] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Live action status
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Dispatch status
  const [dispatchingType, setDispatchingType] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<{ type: string; success: boolean; message: string } | null>(null);

  // Preview modal state
  const [previewContent, setPreviewContent] = useState<{ title: string; html: string; rawText: string } | null>(null);

  // Exchange rate input state
  const [tempRate, setTempRate] = useState(exchangeRate.toString());

  // Permissions state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(() => {
    return employees[0]?.id || '';
  });
  const [permissionsViewMode, setPermissionsViewMode] = useState<'cards' | 'matrix'>('cards');
  const [permissionsSavedToast, setPermissionsSavedToast] = useState(false);

  useEffect(() => {
    if (!employees.some(e => e.id === selectedEmployeeId) && employees.length > 0) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employees, selectedEmployeeId]);

  const activeEmployee = employees.find(e => e.id === selectedEmployeeId) || employees[0];

  const handleTogglePermission = (empId: string, key: keyof EmployeePermissions) => {
    const targetEmp = employees.find(e => e.id === empId);
    if (!targetEmp || !onUpdateEmployee) return;

    const empRole = (targetEmp.systemRole || (targetEmp.role === 'admin' || targetEmp.role === 'manager' || targetEmp.role === 'cashier' || targetEmp.role === 'technician' || targetEmp.role === 'warehouse' ? targetEmp.role : 'cashier')) as SystemRole;
    const currentPerms: EmployeePermissions = targetEmp.permissions || DEFAULT_ROLE_PERMISSIONS[empRole] || DEFAULT_ROLE_PERMISSIONS.cashier;
    const updatedPerms: EmployeePermissions = {
      ...currentPerms,
      [key]: !currentPerms[key]
    };

    onUpdateEmployee({
      ...targetEmp,
      permissions: updatedPerms
    });

    setPermissionsSavedToast(true);
    setTimeout(() => setPermissionsSavedToast(false), 2000);
  };

  const handleApplyPresetRole = (empId: string, role: SystemRole) => {
    const targetEmp = employees.find(e => e.id === empId);
    if (!targetEmp || !onUpdateEmployee) return;

    const presetPerms = DEFAULT_ROLE_PERMISSIONS[role];
    onUpdateEmployee({
      ...targetEmp,
      systemRole: role,
      permissions: { ...presetPerms }
    });

    setPermissionsSavedToast(true);
    setTimeout(() => setPermissionsSavedToast(false), 2000);
  };

  useEffect(() => {
    setTempRate(exchangeRate.toString());
  }, [exchangeRate]);

  // Save Telegram Settings
  const handleSaveSettings = () => {
    saveTelegramSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Test Telegram Connection
  const handleTestConnection = async () => {
    if (!settings.botToken || !settings.chatId) {
      setTestResult({
        success: false,
        message: 'Iltimos, avval Bot Token va Chat ID maydonlarini to\'ldiring!'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    // Save first
    saveTelegramSettings(settings);

    const res = await testTelegramConnection(
      settings.botToken,
      settings.chatId,
      settings.storeName
    );

    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      setSettings(prev => ({ ...prev, enabled: true, lastSentAt: new Date().toISOString().replace('T', ' ').slice(0, 19) }));
    }
  };

  // Dispatch specific report
  const handleSendReport = async (type: 'daily' | 'low_stock' | 'techs' | 'debts' | 'service') => {
    if (!settings.botToken || !settings.chatId) {
      setDispatchResult({
        type,
        success: false,
        message: 'Telegram sozlamalari kiritilmagan. Avval Bot Token va Chat ID ni saqlang!'
      });
      return;
    }

    setDispatchingType(type);
    setDispatchResult(null);

    let messageText = '';
    switch (type) {
      case 'daily':
        messageText = generateDailySalesReport(receipts, expenses, exchangeRate, settings.storeName, settings.branchName);
        break;
      case 'low_stock':
        messageText = generateLowStockReport(products, settings.storeName, settings.branchName);
        break;
      case 'techs':
        messageText = generateTechniciansReport(receipts, employees, settings.storeName);
        break;
      case 'debts':
        messageText = generateDebtSummaryReport(customers, debtPayments, exchangeRate, settings.storeName);
        break;
      case 'service':
        messageText = generateServiceWarrantyReport(serviceTickets, settings.storeName);
        break;
    }

    const res = await sendTelegramMessage(settings.botToken, settings.chatId, messageText);
    setDispatchingType(null);
    setDispatchResult({
      type,
      success: res.success,
      message: res.message
    });

    if (res.success) {
      setSettings(prev => ({
        ...prev,
        lastSentAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
      }));
    }
  };

  // Open Preview Modal
  const handlePreviewReport = (type: 'daily' | 'low_stock' | 'techs' | 'debts' | 'service') => {
    let title = '';
    let text = '';
    switch (type) {
      case 'daily':
        title = 'Bugungi Kunlik Kassa Hisoboti (Z-Report)';
        text = generateDailySalesReport(receipts, expenses, exchangeRate, settings.storeName, settings.branchName);
        break;
      case 'low_stock':
        title = 'Kam Qolgan Tovarlar Signali';
        text = generateLowStockReport(products, settings.storeName, settings.branchName);
        break;
      case 'techs':
        title = 'O\'rnatishlar & Ustalar Ish Haqqi';
        text = generateTechniciansReport(receipts, employees, settings.storeName);
        break;
      case 'debts':
        title = 'Nasiyalar (Qarzlar) Daftari Xulosasi';
        text = generateDebtSummaryReport(customers, debtPayments, exchangeRate, settings.storeName);
        break;
      case 'service':
        title = 'Kafolat & Servis Markazi Holati';
        text = generateServiceWarrantyReport(serviceTickets, settings.storeName);
        break;
    }

    setPreviewContent({
      title,
      html: text,
      rawText: text.replace(/<[^>]*>/g, '')
    });
  };

  // Full System Data Backup Download
  const handleExportFullBackup = () => {
    const backupData = {
      system: 'SMART CONTROL ERP',
      exportedAt: new Date().toISOString(),
      exchangeRate,
      baseCurrency,
      storeSettings: {
        name: settings.storeName,
        branch: settings.branchName
      },
      products,
      receipts,
      expenses,
      employees,
      customers,
      debtPayments,
      serviceTickets,
      purchases
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `smart_control_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Restore data from JSON
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.products && !json.receipts) {
          alert('Noto\'g\'ri zaxira fayli formati!');
          return;
        }

        const confirmRestore = window.confirm(
          `Ushbu zaxira faylida ${json.products?.length || 0} ta tovar va ${json.receipts?.length || 0} ta chek mavjud.\n\nBarcha ma'lumotlarni tiklashni tasdiqlaysizmi?`
        );

        if (confirmRestore) {
          if (json.products) localStorage.setItem('sc_products', JSON.stringify(json.products));
          if (json.receipts) localStorage.setItem('sc_receipts', JSON.stringify(json.receipts));
          if (json.expenses) localStorage.setItem('sc_expenses', JSON.stringify(json.expenses));
          if (json.employees) localStorage.setItem('sc_employees', JSON.stringify(json.employees));
          if (json.customers) localStorage.setItem('sc_customers', JSON.stringify(json.customers));
          if (json.debtPayments) localStorage.setItem('sc_customer_debt_payments', JSON.stringify(json.debtPayments));
          if (json.serviceTickets) localStorage.setItem('sc_service_tickets', JSON.stringify(json.serviceTickets));
          if (json.purchases) localStorage.setItem('sc_purchases', JSON.stringify(json.purchases));
          if (json.exchangeRate) localStorage.setItem('sc_exchange_rate', String(json.exchangeRate));

          alert('Ma\'lumotlar muvaffaqiyatli tiklandi! Tizim qayta yuklanmoqda...');
          window.location.reload();
        }
      } catch (err: any) {
        alert('Faylni o\'qishda xatolik: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Metrics for reports preview
  const todayReceipts = receipts.filter(r => isTodayDate(r.createdAt));
  const todaySalesTotal = todayReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
  const lowStockCount = products.filter(p => !p.isService && p.stockQuantity <= (p.minStockAlert || 5)).length;
  const activeDebtorsCount = customers.filter(c => (c.debtBalance || 0) > 0 || (c.debtBalanceUSD || 0) > 0).length;
  const activeServiceCount = serviceTickets.filter(t => t.status === 'received' || t.status === 'in_diagnosis' || t.status === 'in_repair').length;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Telegram Boti & Tizim Sozlamalari
              </h2>
              {settings.enabled ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Bot Faol
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                  Ulanmagan
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kunlik kassa xulosalari, ombor monitoringi, avtomat Telegram xabarnomalar va zaxira nusxalash
            </p>
          </div>
        </div>

        {/* Action / Last Sent Badge */}
        <div className="flex items-center gap-3">
          {settings.lastSentAt && (
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-400">Oxirgi xabar:</div>
              <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {settings.lastSentAt}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span>Tezkor Hisobot Yuborish</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('telegram')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'telegram'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Telegram Bot Sozlamalari</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Jonli Hisobot Yuborish Markazi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'store'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Do&apos;kon & Valyuta Rekvizitlari</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Zaxira Nusxa (Backup)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'permissions'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Xodimlar Huquqlari & Ruxsatlar</span>
          </button>
        </div>

        {/* ============================================================= */}
        {/* TAB 1: TELEGRAM BOT SOZLAMALARI */}
        {/* ============================================================= */}
        {activeTab === 'telegram' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column (2 spans) */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Bot className="w-4 h-4 text-sky-500" />
                      <span>Telegram Bot Ulanish Parametrlari</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Do&apos;kon egasining shaxsiy Telegrami yoki guruhiga hisobot yuborish uchun bot ma&apos;lumotlari
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                    >
                      {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{isSaved ? 'Saqlandi!' : 'Saqlash'}</span>
                    </button>
                  </div>
                </div>

                {/* Bot Token Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bot API Token <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={settings.botToken}
                      onChange={(e) => setSettings({ ...settings, botToken: e.target.value })}
                      placeholder="Masalan: 7123456789:AAFlmO4_X3qB..."
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/40 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Telegramdagi <span className="font-bold text-sky-500">@BotFather</span> orqali yangi bot ochilganda beriladigan maxfiy token.
                  </p>
                </div>

                {/* Chat ID Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telegram Chat ID yoki Guruh ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.chatId}
                    onChange={(e) => setSettings({ ...settings, chatId: e.target.value })}
                    placeholder="Masalan: 123456789 (shaxsiy) yoki -1001234567890 (guruh/kanal)"
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hisobotlar kimga borishi kerak bo&apos;lsa, o&apos;sha odam yoki ishchi guruhning raqamli ID si.
                  </p>
                </div>

                {/* Store Display Name & Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Do&apos;kon Nomi (Hisobot sarlavhasi)
                    </label>
                    <input
                      type="text"
                      value={settings.storeName}
                      onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                      placeholder="SMART CONTROL"
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Filial / Ombor Nomi
                    </label>
                    <input
                      type="text"
                      value={settings.branchName}
                      onChange={(e) => setSettings({ ...settings, branchName: e.target.value })}
                      placeholder="Chilonzor-1 Filiali"
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                  </div>
                </div>

                {/* Test Connection Button & Status */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                    ) : (
                      <Send className="w-4 h-4 text-sky-400" />
                    )}
                    <span>{isTesting ? 'Ulanish tekshirilmoqda...' : 'Ulanishni Tekshirish & Test Xabari'}</span>
                  </button>

                  <span className="text-[11px] text-slate-400">
                    Botga test xabar yuborib tekshiradi
                  </span>
                </div>

                {/* Test Result Alert */}
                {testResult && (
                  <div className={`p-3 rounded-xl text-xs font-medium border flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">{testResult.success ? 'Aloqa Muvaffaqiyatli!' : 'Ulanishda Xatolik!'}</div>
                      <div>{testResult.message}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Automatic Notifications Settings */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Avtomatik Bildirishnomalar Parametrlari
                </h4>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={settings.autoSendDaily}
                      onChange={(e) => setSettings({ ...settings, autoSendDaily: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Kunlik Kassa Yopilishi (Z-Hisobot)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Kassir smenani yopganda yoki bir tugma bosilganda Telegramga to&apos;liq tushum hisoboti borishi
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={settings.notifyLowStock}
                      onChange={(e) => setSettings({ ...settings, notifyLowStock: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Kam Qolgan & Tugagan Tovarlar Signali
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Ombordagi tovar qoldig&apos;i minimal miqdordan (5 dona) kam qolganda eslatish
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={settings.notifyNewDebts}
                      onChange={(e) => setSettings({ ...settings, notifyNewDebts: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Nasiyalar (Qarzlar) Daftari Eslatmalari
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Yirik qarzlar va undirilgan to&apos;lovlar bo&apos;yicha kunlik xulosa
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={settings.notifyServiceTickets}
                      onChange={(e) => setSettings({ ...settings, notifyServiceTickets: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Kafolat & Zamen Xizmati Xabarlari
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Servisga topshirilgan yoki ombordan yangisiga almashtirilgan (zamen) kameralar holati
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Instruction Column (1 span) */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-850 p-5 rounded-2xl text-white border border-slate-800 shadow-md">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-400 mb-3">
                  <Smartphone className="w-4 h-4" />
                  <span>Qanday qilib ulash mumkin?</span>
                </div>

                <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <div>
                      Telegramda <strong className="text-white">@BotFather</strong> botiga kiring va <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300 font-mono">/newbot</code> yuboring.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <div>
                      Botingiz nomini yozing (masalan: <i>SmartControlHisobotBot</i>). BotFather bergan <strong className="text-white">HTTP API Token</strong>ni nusxalab, yuqoridagi <i>Bot API Token</i> maydoniga qo&apos;ying.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <div>
                      Botingizga <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300 font-mono">/start</code> bosing yoki uni do&apos;koningiz ishchi guruhiga qo&apos;shing.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      4
                    </span>
                    <div>
                      O&apos;z ID ingizni bilish uchun Telegramda <strong className="text-white">@userinfobot</strong> ga yozing. Chiqqan <strong className="text-white">Id</strong> raqamini yuqoridagi <i>Telegram Chat ID</i> maydoniga yozing.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      5
                    </span>
                    <div>
                      <strong>«Ulanishni Tekshirish»</strong> tugmasini bosing. Telegramingizga test xabar keladi!
                    </div>
                  </div>
                </div>
              </div>

              {/* Advantage card */}
              <div className="bg-sky-50 dark:bg-sky-950/40 p-4 rounded-2xl border border-sky-200 dark:border-sky-800/60 text-xs text-sky-900 dark:text-sky-200 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-600" />
                  <span>Xavfsiz va to&apos;g&apos;ridan-to&apos;g&apos;ri!</span>
                </div>
                <p className="text-[11px] leading-relaxed text-sky-800/80 dark:text-sky-300/80">
                  Hisobotlar to&apos;g&apos;ridan-to&apos;g&apos;ri sizning brauzeringizdan Telegram serverlariga xavfsiz HTTPS protokoli orqali yuboriladi. Hech qanday begona vositachi serverlar qatnashmaydi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: JONLI HISOBOT YUBORISH MARKAZI */}
        {/* ============================================================= */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Global Dispatch Status Alert */}
            {dispatchResult && (
              <div className={`p-4 rounded-2xl text-xs font-semibold border flex items-center justify-between gap-3 shadow-sm ${
                dispatchResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  {dispatchResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span>{dispatchResult.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDispatchResult(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Daily Z-Report */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                      📊
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Asosiy
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Kunlik Kassa Hisoboti (Z-Report)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Bugungi jami savdo, naqd so&apos;m, karta, $ naqd, xarajatlar va kassadagi sof qoldiq
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bugungi savdo:</span>
                      <strong className="text-emerald-600 font-mono">{formatNumberWithSpaces(todaySalesTotal)} so&apos;m</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cheklar soni:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{todayReceipts.length} ta</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handlePreviewReport('daily')}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-bold text-xs transition"
                    title="Xabarni ko'rish"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendReport('daily')}
                    disabled={dispatchingType === 'daily'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {dispatchingType === 'daily' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Telegramga Yuborish</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Low Stock Alert */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
                      📦
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      Ombor
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Kam Qolgan Tovarlar Signali
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Qoldig&apos;i tugagan (0 dona) yoki minimal chegaradan oz qolgan tovarlar ro&apos;yxati
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kam qolgan tovarlar:</span>
                      <strong className={`font-mono ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {lowStockCount} ta
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Holat:</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {lowStockCount > 0 ? 'Zakaz berish kerak' : 'Ombor me\'yorda'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handlePreviewReport('low_stock')}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-bold text-xs transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendReport('low_stock')}
                    disabled={dispatchingType === 'low_stock'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {dispatchingType === 'low_stock' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Telegramga Yuborish</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Technicians & Jobs */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                      👷
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Montaj
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Ustalar & Montaj Ish Haqqi
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Bugun obyektlarga chiqqan ustalar, o&apos;rnatishlar soni va ularga hisoblangan xizmat haqlari
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jami xodimlar:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{employees.length} ta usta</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Xizmat turlari:</span>
                      <span className="text-amber-600 font-bold">4 ta tarif</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handlePreviewReport('techs')}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-bold text-xs transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendReport('techs')}
                    disabled={dispatchingType === 'techs'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {dispatchingType === 'techs' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Telegramga Yuborish</span>
                  </button>
                </div>
              </div>

              {/* Card 4: Customer Debts Summary */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
                      📝
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      Nasiyalar
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Nasiyalar & Qarz Daftari
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Jami kutilayotgan qarzlar miqdori, eng yirik qarzdorlar va bugun undirilgan to&apos;lovlar
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Faol qarzdorlar:</span>
                      <strong className="text-purple-600 font-mono">{activeDebtorsCount} ta mijoz</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Qarz to&apos;lovlari:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{debtPayments.length} ta yozuv</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handlePreviewReport('debts')}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-bold text-xs transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendReport('debts')}
                    disabled={dispatchingType === 'debts'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {dispatchingType === 'debts' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Telegramga Yuborish</span>
                  </button>
                </div>
              </div>

              {/* Card 5: Service & Warranty */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center font-bold">
                      🛠
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                      Servis
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Kafolat & Servis Jurnali
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ta&apos;mirlanayotgan qurilmalar, tayyor bo&apos;lgan chiptalar va almashtirilgan (zamen) kameralar
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Faol ta&apos;mirda:</span>
                      <strong className="text-teal-600 font-mono">{activeServiceCount} ta qurilma</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jami servislar:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{serviceTickets.length} ta</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handlePreviewReport('service')}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-bold text-xs transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendReport('service')}
                    disabled={dispatchingType === 'service'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {dispatchingType === 'service' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Telegramga Yuborish</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: DO'KON & VALYUTA REKVIZITLARI */}
        {/* ============================================================= */}
        {activeTab === 'store' && (
          <div className="max-w-3xl space-y-5">
            {/* Currency settings */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-500" />
                <span>Valyuta va Kurs Sozlamalari</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Asosiy Tizim Valyutasi
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => onUpdateBaseCurrency('UZS')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        baseCurrency === 'UZS'
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      <span>So&apos;m (UZS)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateBaseCurrency('USD')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        baseCurrency === 'USD'
                          ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>AQSH Dollari ($)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    1 AQSH Dollari ($) Kursi (so&apos;mda)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tempRate}
                      onChange={(e) => setTempRate(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const n = Number(tempRate);
                        if (n > 0) {
                          onUpdateExchangeRate(n);
                          alert('Valyuta kursi saqlandi: 1$ = ' + n.toLocaleString() + ' so\'m');
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition whitespace-nowrap"
                    >
                      Yangilash
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Information */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-500" />
                <span>Do&apos;kon va Kassa Rekvizitlari</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Do&apos;kon / Tashkilot Nomi
                  </label>
                  <input
                    type="text"
                    value={settings.storeName}
                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Filial Nomi
                  </label>
                  <input
                    type="text"
                    value={settings.branchName}
                    onChange={(e) => setSettings({ ...settings, branchName: e.target.value })}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition active:scale-[0.98]"
                >
                  Rekvizitlarni Saqlash
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: ZAXIRA NUSXA (BACKUP & RESTORE) */}
        {/* ============================================================= */}
        {activeTab === 'backup' && (
          <div className="max-w-3xl space-y-5">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    To&apos;liq Baza Zaxira Nusxasini Yuklab Olish (Backup)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Barcha tovarlar, seriya raqamlari (S/N), sotuv cheklari, qarz daftari, xodimlar va servis yozuvlarini kompyuterga xavfsiz saqlab qo&apos;ying.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  <div className="font-bold text-slate-400 text-[10px] uppercase">Tovarlar</div>
                  <div className="text-base font-black text-slate-800 dark:text-white font-mono">{products.length} ta</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  <div className="font-bold text-slate-400 text-[10px] uppercase">Cheklar</div>
                  <div className="text-base font-black text-slate-800 dark:text-white font-mono">{receipts.length} ta</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  <div className="font-bold text-slate-400 text-[10px] uppercase">Mijozlar</div>
                  <div className="text-base font-black text-slate-800 dark:text-white font-mono">{customers.length} ta</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  <div className="font-bold text-slate-400 text-[10px] uppercase">Servis</div>
                  <div className="text-base font-black text-slate-800 dark:text-white font-mono">{serviceTickets.length} ta</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportFullBackup}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Barcha Ma&apos;lumotlarni Zaxiralash (.JSON)</span>
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Zaxira Faylidan Qayta Tiklash (Restore)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Avval saqlab olingan `.json` zaxira faylini tanlang. Tizim avtomat barcha tovarlar va cheklarni qayta tiklaydi.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-[0.98]">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <span>Zaxira Faylini Tanlash (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 5: XODIMLAR HUQUQLARI & RUXSATLAR (MOYSKLAD USLUBIDA) */}
        {/* ============================================================= */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            {/* Top Banner Card */}
            <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/80 to-slate-900 p-6 rounded-3xl border border-purple-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                  <ShieldCheck className="w-7 h-7 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black tracking-tight">
                      Xodimlar Huquqlari va Kirish Matritsasi
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      MoySklad uslubida
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/80 mt-1 max-w-2xl">
                    Har bir xodimga o&apos;z lavozimi bo&apos;yicha alohida huquqlar bering. Masalan: ustalarga faqat o&apos;zi qatnashgan smeta va otgruzkalarni ko&apos;rsatish, kassirlarga chekni tahrirlashni yoqish/o&apos;chirish yoki tannarxni yashirish.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="bg-purple-950/60 p-1 rounded-2xl border border-purple-500/30 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPermissionsViewMode('cards')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      permissionsViewMode === 'cards'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Kategoriyalar bo&apos;yicha</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPermissionsViewMode('matrix')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      permissionsViewMode === 'matrix'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Jadval Matritsasi</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Notification if changes were made */}
            {permissionsSavedToast && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Xodim huquqlari muvaffaqiyatli yangilandi va tizimda saqlandi!</span>
              </div>
            )}

            {/* VIEW MODE 1: CARDS BY CATEGORY */}
            {permissionsViewMode === 'cards' && (
              <div className="space-y-6">
                {/* Employee Selector & Preset Templates Bar */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Huquqlari sozlanayotgan xodim:
                      </span>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-purple-500/20">
                          {activeEmployee?.fullName?.slice(0, 2).toUpperCase() || 'XD'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                              {activeEmployee?.fullName}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {activeEmployee?.role === 'admin' && '👑 Tizim Rahbari (Admin)'}
                              {activeEmployee?.role === 'manager' && '💼 Menejer'}
                              {activeEmployee?.role === 'cashier' && '💳 Kassir / Sotuvchi'}
                              {activeEmployee?.role === 'technician' && '🛠️ Usta / Montajchi'}
                              {activeEmployee?.role === 'warehouse' && '📦 Omborchi'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Tel: {activeEmployee?.phone || '—'} • Login: <span className="font-mono text-purple-600 font-bold">{activeEmployee?.login || 'kiritilmagan'}</span> • PIN: <span className="font-mono">{activeEmployee?.pin || '—'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Employee selector dropdown */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <select
                          value={activeEmployee?.id}
                          onChange={(e) => setSelectedEmployeeId(e.target.value)}
                          aria-label="Xodimni tanlash"
                          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                        >
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.fullName} ({emp.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Preset Templates */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        <span>Tezkor standart qoliplar (Preset shablonlar):</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <button
                        type="button"
                        onClick={() => activeEmployee && handleApplyPresetRole(activeEmployee.id, 'admin')}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition text-center group"
                      >
                        <span className="text-base mb-1">👑</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600">
                          Admin Qolipi
                        </span>
                        <span className="text-[9px] text-slate-400">To&apos;liq huquqlar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => activeEmployee && handleApplyPresetRole(activeEmployee.id, 'manager')}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition text-center group"
                      >
                        <span className="text-base mb-1">💼</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600">
                          Menejer Qolipi
                        </span>
                        <span className="text-[9px] text-slate-400">Savdo & Zakazlar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => activeEmployee && handleApplyPresetRole(activeEmployee.id, 'cashier')}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition text-center group"
                      >
                        <span className="text-base mb-1">💳</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600">
                          Kassir Qolipi
                        </span>
                        <span className="text-[9px] text-slate-400">Kassa & Chek urish</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => activeEmployee && handleApplyPresetRole(activeEmployee.id, 'technician')}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-purple-300 dark:border-purple-700 hover:border-purple-500 dark:hover:border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 transition text-center group"
                      >
                        <span className="text-base mb-1">🛠️</span>
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300 group-hover:text-purple-600">
                          Usta Qolipi
                        </span>
                        <span className="text-[9px] text-purple-500 font-bold">Faqat o&apos;z zakazlari</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => activeEmployee && handleApplyPresetRole(activeEmployee.id, 'warehouse')}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition text-center group"
                      >
                        <span className="text-base mb-1">📦</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600">
                          Omborchi Qolipi
                        </span>
                        <span className="text-[9px] text-slate-400">Qoldiq & Prihod</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 6 Category Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* GROUP 1: SMETA & OTGRUZKALAR */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                          📋
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            1. Smeta & Otgruzkalar (Zakazlar)
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Ustalar va hisob-kitob buyurtmalari boshqaruvi
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        Zakazlar
                      </span>
                    </div>

                    <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800 flex-1 space-y-3">
                      {/* ONLY ASSIGNED ORDERS (KEY FEATURE) */}
                      <div className="pt-2 flex items-start justify-between gap-3 bg-purple-50/60 dark:bg-purple-950/30 p-3 rounded-xl border border-purple-200 dark:border-purple-800/60">
                        <div className="pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-purple-900 dark:text-purple-200">
                              Faqat o&apos;zi biriktirilgan smeta va otgruzkalarni ko&apos;rish
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-purple-600 text-white">
                              USTALAR
                            </span>
                          </div>
                          <p className="text-[11px] text-purple-700 dark:text-purple-300/80 mt-0.5 leading-relaxed">
                            Yoqilsa, xodim &quot;Smeta va Otgruzkalar&quot; bo&apos;limida faqat o&apos;zi usta sifatida biriktirilgan buyurtmalarni ko&apos;radi. Begona smetalar yashiriladi.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'onlyAssignedOrders')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.onlyAssignedOrders ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.onlyAssignedOrders ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN CREATE ORDERS */}
                      <div className="pt-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Yangi smeta va hisob-kitob (zakaz) yaratish
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Mijozlar uchun hisob-kitob kiritish va smeta saqlash huquqi
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canCreateOrders')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canCreateOrders !== false ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canCreateOrders !== false ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN CREATE SHIPMENTS */}
                      <div className="pt-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Tovarlarni chiqarish (Otgruzka) qilish
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Ombordan mahsulotlarni chiqarib berish va chekini rasmiylashtirish
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canCreateShipments')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canCreateShipments !== false ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canCreateShipments !== false ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN DELETE ORDERS */}
                      <div className="pt-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span>Smeta yoki otgruzkalarni o&apos;chirish</span>
                            <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.2 rounded">
                              Xavfli
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Mavjud buyurtmalarni bazadan butunlay o&apos;chirib tashlash
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canDeleteOrders')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canDeleteOrders ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canDeleteOrders ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* GROUP 2: KASSA & SAVDO (MOYSKLAD TALABI) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          🛒
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            2. Kassa & Savdo (Chek Huquqlari)
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Kassir chek urish, tahrirlash va skidka imkoniyatlari
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        Kassa
                      </span>
                    </div>

                    <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800 flex-1 space-y-3">
                      {/* CAN MAKE SALES */}
                      <div className="pt-2 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Kassada tovar sotish va chek urish
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Kassa oynasidan foydalanish va mijozlardan to&apos;lov qabul qilish
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canMakeSales')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canMakeSales !== false ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canMakeSales !== false ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN EDIT RECEIPTS (KEY MOYSKLAD REQUIREMENT) */}
                      <div className="pt-3 flex items-start justify-between gap-3 bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60">
                        <div className="pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                              Sotilgan chek/tovarni redakt qilish (Tahrirlash)
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-600 text-white">
                              MOYSKLAD
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                            O&apos;chirilganda kassir/xodim avvalgi sotilgan chekka tovar qo&apos;sha olmaydi va uning ma&apos;lumotlarini o&apos;zgartira olmaydi.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canEditReceipts')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canEditReceipts ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canEditReceipts ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN RETURN RECEIPTS */}
                      <div className="pt-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Tovarni qaytarish (Vozvrat qilish)
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Xaridor qaytargan tovarlarni qabul qilish va pulini qaytarish
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canReturnReceipts')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canReturnReceipts !== false ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canReturnReceipts !== false ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN GIVE DISCOUNT */}
                      <div className="pt-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Chegirma (skidka) berish
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Kassada mijozga chegirma foizini qo&apos;llash
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canGiveDiscount')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canGiveDiscount !== false ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canGiveDiscount !== false ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN EDIT PRICE */}
                      <div className="pt-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span>Sotuv narxini qo&apos;lda o&apos;zgartirish</span>
                            <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.2 rounded">
                              Nazorat
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Tovar narxini o&apos;zboshimchalik bilan kiritish
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canEditPrice')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canEditPrice ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canEditPrice ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN CLOSE Z REPORT */}
                      <div className="pt-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Smenani yopish va Z-Hisobot chiqarish
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Kassa kunini yakunlab, hisobotni tasdiqlash
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canCloseZReport')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canCloseZReport !== false ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canCloseZReport !== false ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* GROUP 3: OMBOR & TOVARLAR */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-sky-500/10 border-b border-sky-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                          📦
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            3. Ombor & Mahsulotlar Boshqaruvi
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Qoldiqlar, kirim nakladnoy va tannarx maxfiyligi
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-sky-500/20 text-sky-700 dark:text-sky-300">
                        Ombor
                      </span>
                    </div>

                    <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800 flex-1 space-y-3">
                      {/* CAN VIEW STOCK */}
                      <div className="pt-2 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Ombor qoldiqlarini ko&apos;rish
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Ombordagi tovarlar soni va S/N seriya raqamlari
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canViewStock')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canViewStock !== false ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canViewStock !== false ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN VIEW COST PRICE (CONFIDENTIAL) */}
                      <div className="pt-3 flex items-start justify-between gap-3 bg-rose-50/60 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-800/60">
                        <div className="pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-rose-900 dark:text-rose-200">
                              Tannarx (kirim narxi) va sof foydani ko&apos;rish
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-rose-600 text-white">
                              MAXFIY
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-700 dark:text-rose-300/80 mt-0.5 leading-relaxed">
                            O&apos;chirilganda xodim tovarlarning kirim (tannarxi) va savdodan qolgan sof foydani ko&apos;ra olmaydi.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canViewCostPrice')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canViewCostPrice ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canViewCostPrice ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN MANAGE PRODUCTS */}
                      <div className="pt-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Tovar qo&apos;shish va narxlarni tahrirlash
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Yangi tovar yaratish, nomini va sotuv narxini belgilash
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canManageProducts')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canManageProducts ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canManageProducts ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN CREATE PURCHASES */}
                      <div className="pt-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Kirim nakladnoy (Приход) qilish
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Postavshiklardan tovar qabul qilib, ombor zaxirasini oshirish
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canCreatePurchases')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canCreatePurchases ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canCreatePurchases ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN ADJUST STOCK */}
                      <div className="pt-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span>Ombor inventarizatsiyasi va spisaniye</span>
                            <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.2 rounded">
                              Xavfli
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Qoldiqlarni to&apos;g&apos;rilash yoki yaroqsiz tovarlarni hisobdan chiqarish
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canAdjustStock')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canAdjustStock ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canAdjustStock ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* GROUP 4: SERVIS & KAFOLAT */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-purple-500/10 border-b border-purple-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                          🔧
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            4. Servis & Kafolat (Ustaxona)
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Kafolat arizalari va nosoz qurilmalarni almashtirish
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300">
                        Servis
                      </span>
                    </div>

                    <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800 flex-1 space-y-3">
                      {/* CAN MANAGE SERVICE */}
                      <div className="pt-2 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Servis zayavkalarini boshqarish
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Kafolatli ta&apos;mir arizalarini qabul qilish va xulosa yozish
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canManageService')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canManageService !== false ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canManageService !== false ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN REPLACE DEVICES */}
                      <div className="pt-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Ombordan yangi qurilmaga almashtirish (Zamen)
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Nosoz qurilma o&apos;rniga ombordagi yangi S/N qurilmani berish
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canReplaceDevices')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canReplaceDevices ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canReplaceDevices ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* GROUP 5: MOLIYA & ISH HAQQI */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                          💰
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            5. Moliya, Xarajatlar & Ish Haqqi
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Kassa chiqimlari va xodimlar oylik maoshlari
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300">
                        Moliya
                      </span>
                    </div>

                    <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800 flex-1 space-y-3">
                      {/* CAN VIEW EXPENSES */}
                      <div className="pt-2 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Xarajatlar va kassa chiqimlarini ko&apos;rish
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Do&apos;konning barcha chiqimlari va kassa mablag&apos;lari harakati
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canViewExpenses')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canViewExpenses ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canViewExpenses ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN CREATE EXPENSES */}
                      <div className="pt-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Kassadan xarajat (chiqim) kiritish
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Kassadan yangi chiqim orderi yozish
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canCreateExpenses')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canCreateExpenses ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canCreateExpenses ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN VIEW PAYROLL */}
                      <div className="pt-3 flex items-start justify-between gap-3 bg-rose-50/60 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-800/60">
                        <div className="pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-rose-900 dark:text-rose-200">
                              Xodimlar oylik maoshi va avanslarni ko&apos;rish
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-rose-600 text-white">
                              MAXFIY
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-700 dark:text-rose-300/80 mt-0.5 leading-relaxed">
                            Barcha xodimlarning oyliklari, montajdan tushgan foizlari va avans hisobotlari.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canViewPayroll')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canViewPayroll ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canViewPayroll ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* GROUP 6: TIZIM & BOSHQARUV */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          ⚙️
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            6. Tizim, Bot & Ruxsatlar Boshqaruvi
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Asosiy sozlamalar va xodimlar huquqlarini boshqarish
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                        Admin
                      </span>
                    </div>

                    <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800 flex-1 space-y-3">
                      {/* CAN MANAGE SETTINGS */}
                      <div className="pt-2 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Tizim sozlamalari va Telegram botni boshqarish
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Valyuta kursi, Telegram bot tokeni va do&apos;kon rekvizitlarini o&apos;zgartirish
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canManageSettings')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canManageSettings ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canManageSettings ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* CAN MANAGE PERMISSIONS */}
                      <div className="pt-3 flex items-start justify-between gap-3 bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/60">
                        <div className="pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                              Boshqa xodimlar huquqlarini o&apos;zgartirish (Matritsa)
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-indigo-600 text-white">
                              ADMIN
                            </span>
                          </div>
                          <p className="text-[11px] text-indigo-700 dark:text-indigo-300/80 mt-0.5 leading-relaxed">
                            Boshqa xodimlarning kirish huquqlarini yoqish/o&apos;chirish vakolati.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => activeEmployee && handleTogglePermission(activeEmployee.id, 'canManagePermissions')}
                          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            activeEmployee?.permissions?.canManagePermissions ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                              activeEmployee?.permissions?.canManagePermissions ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW MODE 2: FULL MATRIX TABLE (MOYSKLAD COMPARISON) */}
            {permissionsViewMode === 'matrix' && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Table className="w-4 h-4 text-purple-600" />
                      <span>Barcha Xodimlar Bo&apos;yicha To&apos;liq Huquqlar Jadvali</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Har bir ustunning katakchasini bosish orqali xodim huquqini to&apos;g&apos;ridan-to&apos;g&apos;ri yoqish yoki o&apos;chirish mumkin
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold">
                        <th className="py-3.5 px-4 min-w-[260px]">Huquq / Imkoniyat Nomi</th>
                        <th className="py-3.5 px-3 min-w-[120px]">Kategoriya</th>
                        {employees.map((emp) => (
                          <th key={emp.id} className="py-3.5 px-3 text-center min-w-[140px]">
                            <div className="flex flex-col items-center">
                              <span className="font-extrabold text-slate-900 dark:text-white line-clamp-1">
                                {emp.fullName}
                              </span>
                              <span className="text-[9px] font-medium text-purple-600 dark:text-purple-400">
                                {emp.role}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {[
                        { key: 'onlyAssignedOrders', label: "Faqat o'z smetalarini ko'rish", category: 'Zakazlar', highlight: true },
                        { key: 'canCreateOrders', label: 'Yangi smeta/zakaz yaratish', category: 'Zakazlar' },
                        { key: 'canCreateShipments', label: 'Tovarni chiqarish (Otgruzka)', category: 'Zakazlar' },
                        { key: 'canDeleteOrders', label: "Smeta/otgruzkani o'chirish", category: 'Zakazlar' },
                        { key: 'canMakeSales', label: 'Kassada tovar sotish', category: 'Kassa' },
                        { key: 'canEditReceipts', label: 'Sotilgan chekni tahrirlash (Redakt)', category: 'Kassa', highlight: true },
                        { key: 'canReturnReceipts', label: 'Tovarni qaytarish (Vozvrat)', category: 'Kassa' },
                        { key: 'canGiveDiscount', label: 'Chegirma (skidka) berish', category: 'Kassa' },
                        { key: 'canEditPrice', label: "Narxni qo'lda o'zgartirish", category: 'Kassa' },
                        { key: 'canCloseZReport', label: 'Smenani yopish (Z-Hisobot)', category: 'Kassa' },
                        { key: 'canViewStock', label: "Ombor qoldiqlarini ko'rish", category: 'Ombor' },
                        { key: 'canViewCostPrice', label: "Tannarx va sof foydani ko'rish", category: 'Ombor', highlight: true },
                        { key: 'canManageProducts', label: "Tovar qo'shish & tahrirlash", category: 'Ombor' },
                        { key: 'canCreatePurchases', label: 'Kirim nakladnoy (Приход)', category: 'Ombor' },
                        { key: 'canAdjustStock', label: 'Ombor inventarizatsiyasi', category: 'Ombor' },
                        { key: 'canManageService', label: 'Servis zayavkalari', category: 'Servis' },
                        { key: 'canReplaceDevices', label: 'Qurilmani almashtirish (Zamen)', category: 'Servis' },
                        { key: 'canViewExpenses', label: "Xarajatlar ro'yxatini ko'rish", category: 'Moliya' },
                        { key: 'canCreateExpenses', label: 'Kassadan chiqim kiritish', category: 'Moliya' },
                        { key: 'canViewPayroll', label: "Oylik maosh va avanslarni ko'rish", category: 'Moliya' },
                        { key: 'canManageSettings', label: 'Tizim sozlamalari & Bot', category: 'Admin' },
                        { key: 'canManagePermissions', label: 'Huquqlar matritsasi', category: 'Admin' }
                      ].map((item) => (
                        <tr
                          key={item.key}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition ${
                            item.highlight ? 'bg-purple-50/30 dark:bg-purple-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            <div className="flex items-center gap-1.5">
                              {item.highlight && (
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                              )}
                              <span>{item.label}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.category}
                            </span>
                          </td>
                          {employees.map((emp) => {
                            const empRole = (emp.systemRole || (emp.role === 'admin' || emp.role === 'manager' || emp.role === 'cashier' || emp.role === 'technician' || emp.role === 'warehouse' ? emp.role : 'cashier')) as SystemRole;
                            const hasPerm = emp.permissions ? emp.permissions[item.key as keyof EmployeePermissions] : DEFAULT_ROLE_PERMISSIONS[empRole]?.[item.key as keyof EmployeePermissions];
                            return (
                              <td key={emp.id} className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePermission(emp.id, item.key as keyof EmployeePermissions)}
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition active:scale-95 ${
                                    hasPerm
                                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'
                                  }`}
                                  title={`${emp.fullName}: ${item.label} (${hasPerm ? 'Yoqilgan' : "O'chirilgan"})`}
                                >
                                  {hasPerm ? <Check className="w-4 h-4 font-bold" /> : <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">—</span>}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {previewContent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-500" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {previewContent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewContent(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-slate-950 text-slate-200 font-mono text-xs whitespace-pre-wrap select-all leading-relaxed">
              {previewContent.rawText}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(previewContent.rawText);
                  alert('Hisobot matni nusxalandi!');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white text-xs font-bold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Nusxalash</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewContent(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
