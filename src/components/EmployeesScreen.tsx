'use client';

import React, { useState, useMemo } from 'react';
import { Employee, PayrollRecord, EmployeeAdvance, SalaryType, SaleReceipt, Expense, SystemRole, ActiveTab, DEFAULT_ROLE_TABS } from '../types';
import {
  Users,
  UserCheck,
  Wrench,
  Phone,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  MapPin,
  DollarSign,
  Award,
  HardHat,
  Briefcase,
  CreditCard,
  Banknote,
  ChevronRight,
  Clock,
  CalendarDays,
  TrendingUp,
  Gift,
  MinusCircle,
  History,
  Wallet,
  BarChart3,
  ArrowDownLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BadgePercent,
  Percent,
  Calculator,
  Sparkles,
  KeyRound,
  Lock,
  Shield,
  User,
  ShieldAlert
} from 'lucide-react';
import { getNormalizedDateKey } from '../utils/formatters';

interface EmployeesScreenProps {
  employees: Employee[];
  payrolls: PayrollRecord[];
  advances: EmployeeAdvance[];
  receipts?: SaleReceipt[];
  expenses?: Expense[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (empId: string) => void;
  onAddPayroll: (record: PayrollRecord) => void;
  onAddAdvance: (advance: EmployeeAdvance) => void;
}

type ScreenTab = 'employees' | 'payroll' | 'advances';

const ALL_MODULES: { id: ActiveTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard (Tahlil)' },
  { id: 'pos', label: 'POS Kassa' },
  { id: 'orders', label: 'Hisob-kitob & Otgruzka' },
  { id: 'inventory', label: 'Ombor & Mahsulotlar' },
  { id: 'warranty', label: 'Kafolat & Servis' },
  { id: 'employees', label: 'Xodimlar & Ish Haqi' },
  { id: 'customers', label: 'Mijozlar & Nasiyalar' },
  { id: 'expenses', label: 'Moliya & Xarajatlar' },
  { id: 'ai_advisor', label: 'AI Tahlilchi' },
  { id: 'sales_history', label: 'Sotuvlar Tarixi' },
  { id: 'settings', label: 'Telegram & Sozlamalar' },
];

const MONTH_NAMES_UZ = [
  'Yanvar','Fevral','Mart','Aprel','May','Iyun',
  'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'
];

function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function periodLabel(period: string) {
  const [y, m] = period.split('-');
  return `${MONTH_NAMES_UZ[parseInt(m) - 1]} ${y}`;
}

function fmt(n: number) {
  return n.toLocaleString('uz-UZ');
}

export const EmployeesScreen: React.FC<EmployeesScreenProps> = ({
  employees,
  payrolls,
  advances,
  receipts = [],
  expenses = [],
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onAddPayroll,
  onAddAdvance
}) => {
  const [screenTab, setScreenTab] = useState<ScreenTab>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('Barchasi');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [payrollEmployee, setPayrollEmployee] = useState<Employee | null>(null);
  const [advanceEmployee, setAdvanceEmployee] = useState<Employee | null>(null);
  const [expandedPayroll, setExpandedPayroll] = useState<string | null>(null);

  // Period filter for payroll tab
  const [payrollPeriod, setPayrollPeriod] = useState(getCurrentPeriod());

  // New employee form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<string>('Montajchi Usta');
  const [newPhone, setNewPhone] = useState('+998 ');
  const [newSalaryType, setNewSalaryType] = useState<SalaryType>('fixed_plus_job');
  const [newBaseSalary, setNewBaseSalary] = useState<number>(3000000);
  const [newCommission, setNewCommission] = useState<number>(40000);
  const [newPercentageRate, setNewPercentageRate] = useState<number>(2);
  const [newPercentageTarget, setNewPercentageTarget] = useState<'total_sales' | 'net_profit'>('total_sales');
  const [newNotes, setNewNotes] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123');
  const [newPin, setNewPin] = useState('0000');
  const [newSystemRole, setNewSystemRole] = useState<SystemRole>('technician');
  const [newAllowedTabs, setNewAllowedTabs] = useState<ActiveTab[]>(DEFAULT_ROLE_TABS['technician']);

  // Edit employee form state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<string>('Montajchi Usta');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<Employee['status']>('active');
  const [editSalaryType, setEditSalaryType] = useState<SalaryType>('fixed_plus_job');
  const [editBaseSalary, setEditBaseSalary] = useState<number>(0);
  const [editCommission, setEditCommission] = useState<number>(40000);
  const [editPercentageRate, setEditPercentageRate] = useState<number>(2);
  const [editPercentageTarget, setEditPercentageTarget] = useState<'total_sales' | 'net_profit'>('total_sales');
  const [editNotes, setEditNotes] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('123');
  const [editPin, setEditPin] = useState('0000');
  const [editSystemRole, setEditSystemRole] = useState<SystemRole>('technician');
  const [editAllowedTabs, setEditAllowedTabs] = useState<ActiveTab[]>([]);
  const [editIsBlocked, setEditIsBlocked] = useState(false);

  // Payroll modal form state
  const [payPeriod, setPayPeriod] = useState(getCurrentPeriod());
  const [payBonus, setPayBonus] = useState(0);
  const [payDeduction, setPayDeduction] = useState(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [payNotes, setPayNotes] = useState('');
  const [payInstallations, setPayInstallations] = useState(0);
  const [customSalesTargetAmount, setCustomSalesTargetAmount] = useState<number | null>(null);

  // Advance modal form
  const [advAmount, setAdvAmount] = useState(0);
  const [advMethod, setAdvMethod] = useState<'cash' | 'card'>('cash');
  const [advPeriod, setAdvPeriod] = useState(getCurrentPeriod());
  const [advNotes, setAdvNotes] = useState('');

  const roles = ['Barchasi','Montajchi Usta','Bosh Muhandis','Tarmoq Sozlovchi','Kassir / Menejer','Xavfsizlik Mutaxassisi','Bosh Administrator','Omborchi'];

  const filtered = employees.filter((emp) => {
    const matchRole = selectedRole === 'Barchasi' || emp.role === selectedRole;
    const matchSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.username && emp.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      emp.phone.includes(searchQuery);
    return matchRole && matchSearch;
  });

  const totalInstallations = employees.reduce((sum, e) => sum + e.installationsCompleted, 0);
  const onSiteCount = employees.filter((e) => e.status === 'on_site').length;
  const activeCount = employees.filter((e) => e.status === 'active').length;

  // Total paid this month
  const currentMonthPayrolls = payrolls.filter(p => p.periodMonth === getCurrentPeriod() && p.status === 'paid');
  const totalPaidThisMonth = currentMonthPayrolls.reduce((sum, p) => sum + p.totalNet, 0);

  // Total advance this month
  const currentMonthAdvances = advances.filter(a => a.periodMonth === getCurrentPeriod());
  const totalAdvancesThisMonth = currentMonthAdvances.reduce((sum, a) => sum + a.amount, 0);

  // Payroll tab filtered
  const filteredPayrolls = useMemo(() => {
    return payrolls
      .filter(p => payrollPeriod === 'all' || p.periodMonth === payrollPeriod)
      .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  }, [payrolls, payrollPeriod]);

  // Get advance already paid to employee this period
  const getAdvancePaidForPeriod = (empId: string, period: string) => {
    return advances
      .filter(a => a.employeeId === empId && a.periodMonth === period)
      .reduce((sum, a) => sum + a.amount, 0);
  };

  // Period sales & net profit for percentage calculation
  const getPeriodSalesData = (period: string) => {
    const periodReceipts = receipts.filter(r => r.createdAt && getNormalizedDateKey(r.createdAt).startsWith(period));
    const totalSales = periodReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
    const periodExpenses = expenses.filter(e => e.createdAt && getNormalizedDateKey(e.createdAt).startsWith(period)).reduce((sum, e) => sum + e.amount, 0);
    const netProfit = Math.max(0, totalSales - periodExpenses);
    return { totalSales, periodExpenses, netProfit };
  };

  // Create employee
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const generatedUsername = newUsername.trim().toLowerCase() || newName.toLowerCase().replace(/\s+/g, '').slice(0, 10);

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      fullName: newName.trim(),
      role: newRole,
      phone: newPhone.trim() || '+998 90 000 00 00',
      status: 'active',
      salaryType: newSalaryType,
      baseSalary: (newSalaryType === 'fixed' || newSalaryType === 'fixed_plus_job' || newSalaryType === 'fixed_plus_percentage') ? newBaseSalary : undefined,
      commissionPerInstall: (newSalaryType === 'per_job' || newSalaryType === 'fixed_plus_job') ? newCommission : undefined,
      percentageRate: (newSalaryType === 'percentage' || newSalaryType === 'fixed_plus_percentage') ? newPercentageRate : undefined,
      percentageTarget: (newSalaryType === 'percentage' || newSalaryType === 'fixed_plus_percentage') ? newPercentageTarget : undefined,
      installationsCompleted: 0,
      totalEarned: 0,
      notes: newNotes.trim() || undefined,
      joinedDate: new Date().toISOString().split('T')[0],
      username: generatedUsername,
      password: newPassword.trim() || '123',
      pin: newPin.trim() || '0000',
      systemRole: newSystemRole,
      allowedTabs: newAllowedTabs && newAllowedTabs.length > 0 ? newAllowedTabs : DEFAULT_ROLE_TABS[newSystemRole],
      isBlocked: false
    };

    onAddEmployee(newEmp);
    setIsAddModalOpen(false);

    // Reset
    setNewName('');
    setNewPhone('+998 ');
    setNewBaseSalary(3000000);
    setNewCommission(40000);
    setNewPercentageRate(2);
    setNewNotes('');
    setNewUsername('');
    setNewPassword('123');
    setNewPin('0000');
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditName(emp.fullName);
    setEditRole(emp.role);
    setEditPhone(emp.phone);
    setEditStatus(emp.status);
    setEditSalaryType(emp.salaryType || 'fixed_plus_job');
    setEditBaseSalary(emp.baseSalary || 0);
    setEditCommission(emp.commissionPerInstall || 40000);
    setEditPercentageRate(emp.percentageRate || 2);
    setEditPercentageTarget(emp.percentageTarget || 'total_sales');
    setEditNotes(emp.notes || '');
    setEditUsername(emp.username || emp.fullName.toLowerCase().replace(/\s+/g, '').slice(0, 8));
    setEditPassword(emp.password || '123');
    setEditPin(emp.pin || '0000');
    setEditSystemRole(emp.systemRole || (emp.role === 'Bosh Administrator' ? 'admin' : emp.role.includes('Kassir') ? 'cashier' : 'technician'));
    setEditAllowedTabs(emp.allowedTabs || (emp.systemRole ? DEFAULT_ROLE_TABS[emp.systemRole] : DEFAULT_ROLE_TABS['technician']));
    setEditIsBlocked(!!emp.isBlocked);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editName.trim()) return;

    onUpdateEmployee({
      ...editingEmployee,
      fullName: editName.trim(),
      role: editRole,
      phone: editPhone.trim(),
      status: editStatus,
      salaryType: editSalaryType,
      baseSalary: (editSalaryType === 'fixed' || editSalaryType === 'fixed_plus_job' || editSalaryType === 'fixed_plus_percentage') ? editBaseSalary : undefined,
      commissionPerInstall: (editSalaryType === 'per_job' || editSalaryType === 'fixed_plus_job') ? editCommission : undefined,
      percentageRate: (editSalaryType === 'percentage' || editSalaryType === 'fixed_plus_percentage') ? editPercentageRate : undefined,
      percentageTarget: (editSalaryType === 'percentage' || editSalaryType === 'fixed_plus_percentage') ? editPercentageTarget : undefined,
      notes: editNotes.trim() || undefined,
      username: editUsername.trim().toLowerCase(),
      password: editPassword.trim(),
      pin: editPin.trim(),
      systemRole: editSystemRole,
      allowedTabs: editAllowedTabs,
      isBlocked: editIsBlocked
    });
    setEditingEmployee(null);
  };

  const handleToggleStatus = (emp: Employee) => {
    const nextStatus: Record<Employee['status'], Employee['status']> = {
      active: 'on_site', on_site: 'on_leave', on_leave: 'active'
    };
    onUpdateEmployee({ ...emp, status: nextStatus[emp.status] });
  };

  // Open payroll modal
  const handleOpenPayroll = (emp: Employee) => {
    setPayrollEmployee(emp);
    const currPeriod = getCurrentPeriod();
    setPayPeriod(currPeriod);
    setPayBonus(0);
    setPayDeduction(0);
    setPayMethod('cash');
    setPayNotes('');
    setPayInstallations(emp.installationsCompleted);
    setCustomSalesTargetAmount(null);
  };

  // Open advance modal
  const handleOpenAdvance = (emp: Employee) => {
    setAdvanceEmployee(emp);
    setAdvAmount(0);
    setAdvMethod('cash');
    setAdvPeriod(getCurrentPeriod());
    setAdvNotes('');
  };

  // Calculate gross breakdown for payroll modal
  const calcGrossComponents = (emp: Employee) => {
    const type = emp.salaryType || 'per_job';
    const base = (type === 'fixed' || type === 'fixed_plus_job' || type === 'fixed_plus_percentage') ? (emp.baseSalary || 0) : 0;
    
    const commission = (type === 'per_job' || type === 'fixed_plus_job') 
      ? (emp.commissionPerInstall || 0) * payInstallations 
      : 0;

    const periodData = getPeriodSalesData(payPeriod);
    const targetBase = customSalesTargetAmount !== null 
      ? customSalesTargetAmount 
      : (emp.percentageTarget === 'net_profit' ? periodData.netProfit : periodData.totalSales);

    const percentage = (type === 'percentage' || type === 'fixed_plus_percentage')
      ? Math.round((targetBase * (emp.percentageRate || 0)) / 100)
      : 0;

    const gross = base + commission + percentage + payBonus;

    return {
      base,
      commission,
      percentage,
      targetBase,
      gross
    };
  };

  const calcNet = (emp: Employee) => {
    const advAlreadyPaid = getAdvancePaidForPeriod(emp.id, payPeriod);
    const { gross } = calcGrossComponents(emp);
    return Math.max(0, gross - payDeduction - advAlreadyPaid);
  };

  // Save payroll
  const handleSavePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payrollEmployee) return;

    const advAlreadyPaid = getAdvancePaidForPeriod(payrollEmployee.id, payPeriod);
    const { base, commission, percentage, targetBase, gross } = calcGrossComponents(payrollEmployee);
    const net = calcNet(payrollEmployee);
    const payrollCount = payrolls.length + 1;

    const record: PayrollRecord = {
      id: `payroll-${Date.now()}`,
      payrollNumber: `IH-${String(payrollCount).padStart(4, '0')}`,
      employeeId: payrollEmployee.id,
      employeeName: payrollEmployee.fullName,
      employeeRole: payrollEmployee.role,
      periodMonth: payPeriod,
      periodLabel: periodLabel(payPeriod),
      salaryType: payrollEmployee.salaryType || 'per_job',
      baseSalary: base,
      installationsCount: payInstallations,
      commissionPerInstall: payrollEmployee.commissionPerInstall || 0,
      commissionTotal: commission,
      percentageRate: payrollEmployee.percentageRate,
      percentageTarget: payrollEmployee.percentageTarget,
      salesAmountConsidered: targetBase,
      percentageTotal: percentage,
      bonus: payBonus,
      deduction: payDeduction,
      advancePaid: advAlreadyPaid,
      totalGross: gross,
      totalNet: net,
      paymentMethod: payMethod,
      paidBy: 'Menejer',
      paidAt: new Date().toLocaleString('uz-UZ'),
      notes: payNotes.trim() || undefined,
      status: 'paid'
    };

    onAddPayroll(record);

    // Update employee totalEarned
    onUpdateEmployee({
      ...payrollEmployee,
      totalEarned: payrollEmployee.totalEarned + gross
    });

    setPayrollEmployee(null);
  };

  // Save advance
  const handleSaveAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceEmployee || advAmount <= 0) return;

    const advCount = advances.length + 1;
    const advance: EmployeeAdvance = {
      id: `adv-${Date.now()}`,
      advanceNumber: `AV-${String(advCount).padStart(4, '0')}`,
      employeeId: advanceEmployee.id,
      employeeName: advanceEmployee.fullName,
      amount: advAmount,
      paymentMethod: advMethod,
      paidBy: 'Menejer',
      paidAt: new Date().toLocaleString('uz-UZ'),
      periodMonth: advPeriod,
      notes: advNotes.trim() || undefined
    };

    onAddAdvance(advance);
    setAdvanceEmployee(null);
  };

  const availablePeriods = useMemo(() => {
    const set = new Set<string>([getCurrentPeriod()]);
    payrolls.forEach(p => set.add(p.periodMonth));
    return Array.from(set).sort().reverse();
  }, [payrolls]);

  // Helper for salary type labels
  const getSalaryTypeBadge = (emp: Employee) => {
    const type = emp.salaryType || 'per_job';
    if (type === 'fixed_plus_job') {
      return (
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 block font-medium">Ish haqi: Oklad + Montaj stavkasi</span>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono">
            {fmt(emp.baseSalary || 0)} so&apos;m <span className="text-amber-500 font-normal">+ {fmt(emp.commissionPerInstall || 0)} so&apos;m/ta</span>
          </div>
        </div>
      );
    }
    if (type === 'fixed_plus_percentage') {
      return (
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 block font-medium">Ish haqi: Oklad + Foiz (%)</span>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono">
            {fmt(emp.baseSalary || 0)} so&apos;m <span className="text-emerald-500 font-normal">+ {emp.percentageRate || 0}% ({emp.percentageTarget === 'net_profit' ? 'Foydadan' : 'Savdodan'})</span>
          </div>
        </div>
      );
    }
    if (type === 'per_job') {
      return (
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 block font-medium">Ish haqi: Ishbay (Montaj)</span>
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
            {emp.commissionPerInstall ? `${fmt(emp.commissionPerInstall)} so'm/ta` : 'Kelishilgan'}
          </div>
        </div>
      );
    }
    if (type === 'percentage') {
      return (
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 block font-medium">Ish haqi: Faqat Foiz (%)</span>
          <div className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">
            {emp.percentageRate || 0}% ({emp.percentageTarget === 'net_profit' ? 'Sof foydadan' : 'Jami savdodan'})
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-0.5">
        <span className="text-[10px] text-slate-400 block font-medium">Ish haqi: Oylik oklad</span>
        <div className="text-xs font-bold text-emerald-600 font-mono">
          {emp.baseSalary ? `${fmt(emp.baseSalary)} so'm` : '—'}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-500" />
            <span>Xodimlar & Moslashuvchan Ish Haqi Tizimi</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Oklad + Montaj stavkasi, Oklad + Savdo foizi, oylik maosh va avanslar hisobi
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 flex items-center gap-2 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Yangi Xodim Qo&apos;shish</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Jami Xodimlar</div>
            <div className="text-lg font-black text-slate-900 dark:text-white font-mono">{employees.length} kishi</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Obyektda (Montajda)</div>
            <div className="text-lg font-black text-cyan-600 dark:text-cyan-400 font-mono">{onSiteCount} usta</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Bu oy to&apos;langan</div>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">{fmt(totalPaidThisMonth)} so&apos;m</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Bu oy berilgan avans</div>
            <div className="text-sm font-black text-violet-600 dark:text-violet-400 font-mono">{fmt(totalAdvancesThisMonth)} so&apos;m</div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
        {([
          { id: 'employees', label: 'Xodimlar Ro\'yxati', icon: Users },
          { id: 'payroll', label: 'Ish Haqi Tarixi & Jurnal', icon: BarChart3 },
          { id: 'advances', label: 'Avanslar', icon: ArrowDownLeft }
        ] as { id: ScreenTab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setScreenTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
              screenTab === id
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {id === 'payroll' && payrolls.length > 0 && (
              <span className="ml-1 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 text-[10px] font-bold px-1.5 rounded-full">{payrolls.length}</span>
            )}
            {id === 'advances' && advances.length > 0 && (
              <span className="ml-1 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400 text-[10px] font-bold px-1.5 rounded-full">{advances.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: EMPLOYEES ── */}
      {screenTab === 'employees' && (
        <>
          {/* Filter Row */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ism yoki telefon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs focus:ring-2 focus:ring-amber-500/40 text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedRole === r
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Employee Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((emp) => {
              const monthAdvance = getAdvancePaidForPeriod(emp.id, getCurrentPeriod());
              const hasPayrollThisMonth = payrolls.some(p => p.employeeId === emp.id && p.periodMonth === getCurrentPeriod() && p.status === 'paid');

              return (
                <div
                  key={emp.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                          {emp.role}
                        </span>
                        {emp.systemRole === 'admin' ? (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                            👑 Admin
                          </span>
                        ) : emp.systemRole === 'cashier' ? (
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                            💳 Kassir
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-cyan-500 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                            🔧 Texnik
                          </span>
                        )}
                        {emp.isBlocked && (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                            🚫 Bloklangan
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition shrink-0 ${
                          emp.status === 'on_site'
                            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                            : emp.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'on_site' ? 'bg-cyan-500 animate-ping' : emp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {emp.status === 'on_site' ? 'Obyektda' : emp.status === 'active' ? "Bo'sh / Ishda" : "Ta'tilda"}
                      </button>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{emp.fullName}</h4>
                    
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-mono">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {emp.phone}
                      </div>
                      <div className="flex items-center gap-1 text-cyan-500 font-semibold" title="Tizimga kirish logini">
                        <KeyRound className="w-3 h-3" />
                        <span>@{emp.username || emp.id}</span>
                      </div>
                    </div>
                    {emp.notes && (
                      <p className="text-[11px] text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl italic">&ldquo;{emp.notes}&rdquo;</p>
                    )}
                  </div>

                  {/* Flexible Salary Stats Box */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-xl space-y-2">
                    {getSalaryTypeBadge(emp)}

                    {(emp.salaryType === 'per_job' || emp.salaryType === 'fixed_plus_job') && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-500">Bajarilgan montajlar:</span>
                        <span className="font-extrabold text-slate-900 dark:text-white font-mono">{emp.installationsCompleted} ta obyekt</span>
                      </div>
                    )}
                  </div>

                  {/* Advance badge */}
                  {monthAdvance > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 rounded-xl px-2.5 py-1.5">
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      Bu oy olingan avans: <span className="font-bold font-mono">{fmt(monthAdvance)} so&apos;m</span>
                    </div>
                  )}

                  {/* Payroll badge */}
                  {hasPayrollThisMonth && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl px-2.5 py-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Bu oy maoshi to&apos;landi
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {emp.joinedDate}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenAdvance(emp)}
                        className="px-2.5 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 text-violet-700 dark:text-violet-400 text-[10px] font-bold transition flex items-center gap-1"
                        title="Avans berish"
                      >
                        <ArrowDownLeft className="w-3 h-3" />
                        Avans
                      </button>
                      <button
                        onClick={() => handleOpenPayroll(emp)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold transition flex items-center gap-1"
                        title="Maosh to'lash"
                      >
                        <DollarSign className="w-3 h-3" />
                        Maosh
                      </button>
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-300 transition"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`"${emp.fullName}" xodimini o'chirishni tasdiqlaysizmi?`)) {
                            onDeleteEmployee(emp.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 transition"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-16 text-slate-400 text-sm">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                Xodimlar topilmadi
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB: PAYROLL HISTORY ── */}
      {screenTab === 'payroll' && (
        <div className="space-y-4">
          {/* Period Filter */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Davr:</span>
            <select
              value={payrollPeriod}
              onChange={(e) => setPayrollPeriod(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="all">Barcha davrlar</option>
              {availablePeriods.map(p => (
                <option key={p} value={p}>{periodLabel(p)}</option>
              ))}
            </select>
            <span className="ml-auto text-[11px] text-slate-400">
              Jami to&apos;langan: <span className="font-bold text-emerald-600">{fmt(filteredPayrolls.reduce((s, p) => s + p.totalNet, 0))} so&apos;m</span>
            </span>
          </div>

          {filteredPayrolls.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Hali ish haqi to&apos;lovlari yo&apos;q</p>
              <p className="text-xs mt-1">Xodimlar tabida &laquo;Maosh&raquo; tugmasini bosing</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPayrolls.map((p) => (
                <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    onClick={() => setExpandedPayroll(expandedPayroll === p.id ? null : p.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                        {p.employeeName.charAt(0)}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{p.employeeName}</div>
                        <div className="text-[11px] text-slate-400">{p.periodLabel} · {p.payrollNumber} · {p.paidAt}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">{fmt(p.totalNet)} so&apos;m</div>
                        <div className="text-[10px] text-slate-400">
                          {p.paymentMethod === 'cash' ? 'Naqd' : p.paymentMethod === 'card' ? 'Karta' : 'Bank'}
                        </div>
                      </div>
                      {expandedPayroll === p.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {expandedPayroll === p.id && (
                    <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="pt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Lavozim', value: p.employeeRole, color: '' },
                          p.baseSalary > 0 && { label: 'Asosiy oklad', value: `${fmt(p.baseSalary)} so'm`, color: 'font-bold' },
                          p.commissionTotal > 0 && { label: 'Montajlar haqqi', value: `${p.installationsCount} ta × ${fmt(p.commissionPerInstall)} = ${fmt(p.commissionTotal)} so'm`, color: 'text-amber-600' },
                          (p.percentageTotal || 0) > 0 && { label: `Foiz (${p.percentageRate}% ${p.percentageTarget === 'net_profit' ? 'Foydadan' : 'Savdodan'})`, value: `+${fmt(p.percentageTotal || 0)} so'm`, color: 'text-purple-600' },
                          p.bonus > 0 && { label: 'Bonus', value: `+${fmt(p.bonus)} so'm`, color: 'text-emerald-600' },
                          p.deduction > 0 && { label: 'Jarima', value: `-${fmt(p.deduction)} so'm`, color: 'text-red-500' },
                          p.advancePaid > 0 && { label: 'Ushlangan avans', value: `-${fmt(p.advancePaid)} so'm`, color: 'text-violet-600' },
                          { label: 'BRUTTO (Jami)', value: `${fmt(p.totalGross)} so'm`, color: 'font-bold text-slate-800 dark:text-white' },
                          { label: 'NETTO (Qo\'lga berildi)', value: `${fmt(p.totalNet)} so'm`, color: 'font-black text-emerald-600 dark:text-emerald-400 text-sm' },
                        ].filter(Boolean).map((item: any, idx) => (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5">
                            <span className="text-[10px] text-slate-400 block">{item.label}</span>
                            <span className={`text-xs font-bold font-mono ${item.color}`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                      {p.notes && (
                        <p className="mt-2 text-[11px] text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl">{p.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ADVANCES ── */}
      {screenTab === 'advances' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Jami {advances.length} ta avans</span>
            <span className="text-[11px] text-violet-600 dark:text-violet-400 font-bold font-mono">
              Jami: {fmt(advances.reduce((s, a) => s + a.amount, 0))} so&apos;m
            </span>
          </div>

          {advances.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <ArrowDownLeft className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Hali avans berilmagan</p>
              <p className="text-xs mt-1">Xodimlar kartasidagi &laquo;Avans&raquo; tugmasini bosing</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...advances].sort((a, b) => b.paidAt.localeCompare(a.paidAt)).map((adv) => (
                <div key={adv.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm">
                      {adv.employeeName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{adv.employeeName}</div>
                      <div className="text-[11px] text-slate-400">{adv.advanceNumber} · {periodLabel(adv.periodMonth)} · {adv.paidAt}</div>
                      {adv.notes && <div className="text-[10px] text-slate-400 italic">{adv.notes}</div>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-violet-600 dark:text-violet-400 font-mono">{fmt(adv.amount)} so&apos;m</div>
                    <div className="text-[10px] text-slate-400">{adv.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ MODAL: ADD EMPLOYEE ══ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HardHat className="w-5 h-5 text-amber-500" />
                Yangi Xodim Qo&apos;shish
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateEmployee} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">F.I.Sh.</label>
                <input type="text" required autoFocus placeholder="Masalan: Jamshid Normurodov" value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/40 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lavozimi</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none">
                    <option value="Montajchi Usta">Montajchi Usta</option>
                    <option value="Bosh Muhandis">Bosh Muhandis</option>
                    <option value="Tarmoq Sozlovchi">Tarmoq Sozlovchi</option>
                    <option value="Kassir / Menejer">Kassir / Menejer</option>
                    <option value="Xavfsizlik Mutaxassisi">Xavfsizlik Mutaxassisi</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Telefon</label>
                  <input type="text" required placeholder="+998 90 123 45 67" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono outline-none" />
                </div>
              </div>

              {/* Salary Type Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ish haqi to&apos;lov modeli</label>
                <select value={newSalaryType} onChange={(e) => setNewSalaryType(e.target.value as SalaryType)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold outline-none">
                  <option value="fixed_plus_job">🌟 Oklad + Montaj stavkasi (Oylik maosh + montaj haqi)</option>
                  <option value="fixed_plus_percentage">📈 Oklad + Savdodan foiz (%) (Oylik maosh + sotuv foizi)</option>
                  <option value="per_job">🔧 Faqat Ishbay (Har 1 montaj uchun)</option>
                  <option value="fixed">💵 Faqat Oylik maosh (Oklad)</option>
                  <option value="percentage">📊 Faqat Sotuvdan/Foydadan foiz (%)</option>
                </select>
              </div>

              {/* Dynamic Inputs according to Salary Type */}
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 p-3 rounded-xl space-y-3">
                {/* 1. Base Salary (if fixed, fixed_plus_job, fixed_plus_percentage) */}
                {(newSalaryType === 'fixed' || newSalaryType === 'fixed_plus_job' || newSalaryType === 'fixed_plus_percentage') && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Asosiy Oylik Maosh (Oklad, so&apos;mda)</label>
                    <input type="number" value={newBaseSalary} onChange={(e) => setNewBaseSalary(Number(e.target.value) || 0)}
                      className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold" />
                  </div>
                )}

                {/* 2. Commission per install (if per_job or fixed_plus_job) */}
                {(newSalaryType === 'per_job' || newSalaryType === 'fixed_plus_job') && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">1 ta montaj / kamera stavkasi (so&apos;mda)</label>
                    <input type="number" value={newCommission} onChange={(e) => setNewCommission(Number(e.target.value) || 0)}
                      className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-600 dark:text-amber-400 font-mono font-bold" />
                  </div>
                )}

                {/* 3. Percentage Rate and Target (if percentage or fixed_plus_percentage) */}
                {(newSalaryType === 'percentage' || newSalaryType === 'fixed_plus_percentage') && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Foiz stavkasi (% da)</label>
                      <input type="number" step="0.5" value={newPercentageRate} onChange={(e) => setNewPercentageRate(Number(e.target.value) || 0)}
                        placeholder="Masalan: 2%"
                        className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-600 font-mono font-bold" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Foiz manbasi</label>
                      <select value={newPercentageTarget} onChange={(e) => setNewPercentageTarget(e.target.value as any)}
                        className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium">
                        <option value="total_sales">Jami savdo tushumidan</option>
                        <option value="net_profit">Sof foydadan</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* ── AVTORIZATSIYA VA TIZIMGA KIRISH SOZLAMALARI ── */}
              <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <KeyRound className="w-4 h-4 text-cyan-500" />
                  <span>Tizimga Kirish (Login & Parol)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Login</label>
                    <input
                      type="text"
                      required
                      placeholder="masalan: jamshid"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Parol</label>
                    <input
                      type="text"
                      required
                      placeholder="123"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">PIN kod</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="0000"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono tracking-widest text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Tizimdagi Huquq Roli</label>
                    <select
                      value={newSystemRole}
                      onChange={(e) => {
                        const r = e.target.value as SystemRole;
                        setNewSystemRole(r);
                        setNewAllowedTabs(DEFAULT_ROLE_TABS[r]);
                      }}
                      className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold"
                    >
                      <option value="admin">👑 Administrator (To&apos;liq nazorat)</option>
                      <option value="manager">📊 Menejer (Savdo, Ombor, Dashboard)</option>
                      <option value="cashier">💳 Kassir (POS Kassa, Mijozlar, Qarz)</option>
                      <option value="technician">🔧 Texnik / Usta (Servis, Buyurtmalar)</option>
                      <option value="warehouse">📦 Omborchi (Ombor & Kirim)</option>
                    </select>
                  </div>
                </div>

                {/* Permissions checkboxes */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                    Ruxsat etilgan modullar:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    {ALL_MODULES.map((mod) => {
                      const checked = newAllowedTabs.includes(mod.id);
                      return (
                        <label key={mod.id} className="flex items-center gap-1.5 text-[10px] text-slate-700 dark:text-slate-300 cursor-pointer p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewAllowedTabs([...newAllowedTabs, mod.id]);
                              } else {
                                setNewAllowedTabs(newAllowedTabs.filter(t => t !== mod.id));
                              }
                            }}
                            className="rounded text-amber-500 focus:ring-amber-400"
                          />
                          <span className="truncate">{mod.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Izoh / Mutaxassisligi</label>
                <input type="text" placeholder="Hikvision sertifikati bor, tajribali usta..." value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Bekor qilish</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: EDIT EMPLOYEE ══ */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                Xodimni Tahrirlash
              </h3>
              <button onClick={() => setEditingEmployee(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">F.I.Sh.</label>
                <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/40 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lavozimi</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white">
                    <option value="Montajchi Usta">Montajchi Usta</option>
                    <option value="Bosh Muhandis">Bosh Muhandis</option>
                    <option value="Tarmoq Sozlovchi">Tarmoq Sozlovchi</option>
                    <option value="Kassir / Menejer">Kassir / Menejer</option>
                    <option value="Xavfsizlik Mutaxassisi">Xavfsizlik Mutaxassisi</option>
                    <option value="Bosh Administrator">Bosh Administrator</option>
                    <option value="Omborchi">Omborchi</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Holati</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold">
                    <option value="active">Ishda (Bo&apos;sh)</option>
                    <option value="on_site">Obyektda</option>
                    <option value="on_leave">Ta&apos;tilda</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Telefon</label>
                <input type="text" required value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono" />
              </div>

              {/* ── AVTORIZATSIYA VA LOGIN TAHRIRLASH ── */}
              <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-500" />
                    <span>Login & Parol Sozlamalari</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsBlocked}
                      onChange={(e) => setEditIsBlocked(e.target.checked)}
                      className="rounded text-rose-500 focus:ring-rose-400"
                    />
                    <span>Bloklash</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Login</label>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Parol</label>
                    <input
                      type="text"
                      required
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">PIN kod</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={editPin}
                      onChange={(e) => setEditPin(e.target.value)}
                      className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono tracking-widest text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Tizimdagi Huquq Roli</label>
                    <select
                      value={editSystemRole}
                      onChange={(e) => {
                        const r = e.target.value as SystemRole;
                        setEditSystemRole(r);
                        setEditAllowedTabs(DEFAULT_ROLE_TABS[r]);
                      }}
                      className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold"
                    >
                      <option value="admin">👑 Administrator (To&apos;liq)</option>
                      <option value="manager">📊 Menejer (Savdo, Ombor, Tahlil)</option>
                      <option value="cashier">💳 Kassir (Kassa, Mijozlar)</option>
                      <option value="technician">🔧 Texnik / Usta (Servis, Smetalar)</option>
                      <option value="warehouse">📦 Omborchi (Ombor & Kirim)</option>
                    </select>
                  </div>
                </div>

                {/* Permissions checkboxes */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                    Ruxsat etilgan modullar:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    {ALL_MODULES.map((mod) => {
                      const checked = editAllowedTabs.includes(mod.id);
                      return (
                        <label key={mod.id} className="flex items-center gap-1.5 text-[10px] text-slate-700 dark:text-slate-300 cursor-pointer p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditAllowedTabs([...editAllowedTabs, mod.id]);
                              } else {
                                setEditAllowedTabs(editAllowedTabs.filter(t => t !== mod.id));
                              }
                            }}
                            className="rounded text-amber-500 focus:ring-amber-400"
                          />
                          <span className="truncate">{mod.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Salary Type Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ish haqi to&apos;lov modeli</label>
                <select value={editSalaryType} onChange={(e) => setEditSalaryType(e.target.value as SalaryType)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold">
                  <option value="fixed_plus_job">🌟 Oklad + Montaj stavkasi (Oylik maosh + montaj haqi)</option>
                  <option value="fixed_plus_percentage">📈 Oklad + Savdodan foiz (%) (Oylik maosh + sotuv foizi)</option>
                  <option value="per_job">🔧 Faqat Ishbay (Har 1 montaj uchun)</option>
                  <option value="fixed">💵 Faqat Oylik maosh (Oklad)</option>
                  <option value="percentage">📊 Faqat Sotuvdan/Foydadan foiz (%)</option>
                </select>
              </div>

              {/* Dynamic Inputs according to Salary Type */}
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 p-3 rounded-xl space-y-3">
                {(editSalaryType === 'fixed' || editSalaryType === 'fixed_plus_job' || editSalaryType === 'fixed_plus_percentage') && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Asosiy Oylik Maosh (Oklad, so&apos;mda)</label>
                    <input type="number" value={editBaseSalary} onChange={(e) => setEditBaseSalary(Number(e.target.value) || 0)}
                      className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold" />
                  </div>
                )}

                {(editSalaryType === 'per_job' || editSalaryType === 'fixed_plus_job') && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">1 ta montaj / kamera stavkasi (so&apos;mda)</label>
                    <input type="number" value={editCommission} onChange={(e) => setEditCommission(Number(e.target.value) || 0)}
                      className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-600 dark:text-amber-400 font-mono font-bold" />
                  </div>
                )}

                {(editSalaryType === 'percentage' || editSalaryType === 'fixed_plus_percentage') && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Foiz stavkasi (% da)</label>
                      <input type="number" step="0.5" value={editPercentageRate} onChange={(e) => setEditPercentageRate(Number(e.target.value) || 0)}
                        className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-600 font-mono font-bold" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Foiz manbasi</label>
                      <select value={editPercentageTarget} onChange={(e) => setEditPercentageTarget(e.target.value as any)}
                        className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium">
                        <option value="total_sales">Jami savdo tushumidan</option>
                        <option value="net_profit">Sof foydadan</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Izoh</label>
                <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setEditingEmployee(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Bekor qilish</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: PAY SALARY ══ */}
      {payrollEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Ish Haqi To&apos;lash
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{payrollEmployee.fullName} · {payrollEmployee.role}</p>
              </div>
              <button onClick={() => setPayrollEmployee(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSavePayroll} className="space-y-4">
              {/* Period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Davr (oy)</label>
                  <select value={payPeriod} onChange={(e) => setPayPeriod(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold">
                    {Array.from({ length: 6 }, (_, i) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - i);
                      const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                      return <option key={p} value={p}>{periodLabel(p)}</option>;
                    })}
                  </select>
                </div>

                {/* If per_job or fixed_plus_job: allow adjusting installations */}
                {(payrollEmployee.salaryType === 'per_job' || payrollEmployee.salaryType === 'fixed_plus_job') ? (
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bajarilgan montajlar (ta)</label>
                    <input type="number" min="0" value={payInstallations} onChange={(e) => setPayInstallations(Number(e.target.value) || 0)}
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold" />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Holat</label>
                    <div className="mt-1 text-xs text-slate-500 py-2">
                      {payrollEmployee.salaryType === 'fixed_plus_percentage' ? 'Oklad + Savdo foizi' : payrollEmployee.salaryType === 'percentage' ? 'Faqat foiz' : 'Oklad'}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Calculation Breakdown */}
              {(() => {
                const { base, commission, percentage, targetBase, gross } = calcGrossComponents(payrollEmployee);
                const advancePaid = getAdvancePaidForPeriod(payrollEmployee.id, payPeriod);
                const net = Math.max(0, gross - payDeduction - advancePaid);

                return (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-2 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Hisob-kitob tafsilotlari</span>
                      <span className="text-[10px] font-mono text-slate-400">{periodLabel(payPeriod)}</span>
                    </div>

                    {base > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300">Asosiy oklad (maosh):</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">{fmt(base)} so&apos;m</span>
                      </div>
                    )}

                    {commission > 0 && (
                      <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400">
                        <span>Montaj haqqi ({payInstallations} ta × {fmt(payrollEmployee.commissionPerInstall || 0)} so&apos;m):</span>
                        <span className="font-bold font-mono">+{fmt(commission)} so&apos;m</span>
                      </div>
                    )}

                    {(payrollEmployee.salaryType === 'percentage' || payrollEmployee.salaryType === 'fixed_plus_percentage') && (
                      <div className="flex justify-between text-xs text-purple-600 dark:text-purple-400">
                        <span>
                          {payrollEmployee.percentageTarget === 'net_profit' ? 'Sof foydadan' : 'Jami savdodan'} {payrollEmployee.percentageRate}%:
                          <small className="block text-[9px] text-slate-400">({payrollEmployee.percentageTarget === 'net_profit' ? 'Foyda' : 'Savdo'}: {fmt(targetBase)} so&apos;m)</small>
                        </span>
                        <span className="font-bold font-mono">+{fmt(percentage)} so&apos;m</span>
                      </div>
                    )}

                    {payBonus > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600">
                        <span>Bonus:</span>
                        <span className="font-bold font-mono">+{fmt(payBonus)} so&apos;m</span>
                      </div>
                    )}

                    {payDeduction > 0 && (
                      <div className="flex justify-between text-xs text-red-500">
                        <span>Jarima / Ushlab qolish:</span>
                        <span className="font-bold font-mono">-{fmt(payDeduction)} so&apos;m</span>
                      </div>
                    )}

                    {advancePaid > 0 && (
                      <div className="flex justify-between text-xs text-violet-600">
                        <span>Oldindan berilgan avans:</span>
                        <span className="font-bold font-mono">-{fmt(advancePaid)} so&apos;m</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-1">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">BRUTTO (Jami hisoblangan):</span>
                      <span className="text-xs font-black font-mono text-slate-900 dark:text-white">{fmt(gross)} so&apos;m</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                      <span className="text-sm font-black text-emerald-600">NETTO (Qo&apos;lga beriladi):</span>
                      <span className="text-base font-black font-mono text-emerald-600">{fmt(net)} so&apos;m</span>
                    </div>
                  </div>
                );
              })()}

              {/* Bonus / Deduction */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5" /> Bonus (so&apos;m)
                  </label>
                  <input type="number" min="0" value={payBonus} onChange={(e) => setPayBonus(Number(e.target.value) || 0)}
                    className="w-full mt-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300 font-mono focus:ring-2 focus:ring-emerald-500/40" />
                </div>
                <div>
                  <label className="text-xs font-bold text-red-500 flex items-center gap-1">
                    <MinusCircle className="w-3.5 h-3.5" /> Jarima (so&apos;m)
                  </label>
                  <input type="number" min="0" value={payDeduction} onChange={(e) => setPayDeduction(Number(e.target.value) || 0)}
                    className="w-full mt-1 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-xs text-red-700 dark:text-red-300 font-mono focus:ring-2 focus:ring-red-500/40" />
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">To&apos;lov usuli</label>
                <div className="flex gap-2 mt-1">
                  {([
                    { v: 'cash', label: 'Naqd', icon: Banknote },
                    { v: 'card', label: 'Karta', icon: CreditCard },
                    { v: 'bank_transfer', label: 'Bank', icon: Briefcase }
                  ] as any[]).map(({ v, label, icon: Icon }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPayMethod(v)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition border ${
                        payMethod === v
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Izoh (ixtiyoriy)</label>
                <input type="text" placeholder="Qo'shimcha ma'lumot..." value={payNotes} onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setPayrollEmployee(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Bekor qilish</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {fmt(calcNet(payrollEmployee))} so&apos;m To&apos;lash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: ADVANCE ══ */}
      {advanceEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-violet-500" />
                  Avans Berish
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{advanceEmployee.fullName}</p>
              </div>
              <button onClick={() => setAdvanceEmployee(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveAdvance} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Avans summasi (so&apos;m)</label>
                <input
                  type="number" required min="1" autoFocus
                  value={advAmount || ''}
                  onChange={(e) => setAdvAmount(Number(e.target.value) || 0)}
                  placeholder="500 000"
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Davr</label>
                  <select value={advPeriod} onChange={(e) => setAdvPeriod(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white">
                    {Array.from({ length: 3 }, (_, i) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - i);
                      const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                      return <option key={p} value={p}>{periodLabel(p)}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">To&apos;lov usuli</label>
                  <div className="flex gap-2 mt-1">
                    <button type="button" onClick={() => setAdvMethod('cash')}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition border ${advMethod === 'cash' ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 border-transparent'}`}>
                      <Banknote className="w-3.5 h-3.5" /> Naqd
                    </button>
                    <button type="button" onClick={() => setAdvMethod('card')}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition border ${advMethod === 'card' ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 border-transparent'}`}>
                      <CreditCard className="w-3.5 h-3.5" /> Karta
                    </button>
                  </div>
                </div>
              </div>

              {/* Already given this period */}
              {getAdvancePaidForPeriod(advanceEmployee.id, advPeriod) > 0 && (
                <div className="flex items-center gap-2 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl px-3 py-2 text-xs text-violet-600 dark:text-violet-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {periodLabel(advPeriod)} uchun allaqachon <span className="font-bold font-mono mx-1">{fmt(getAdvancePaidForPeriod(advanceEmployee.id, advPeriod))} so&apos;m</span> avans berilgan
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Izoh (ixtiyoriy)</label>
                <input type="text" placeholder="Sabab yoki izoh..." value={advNotes} onChange={(e) => setAdvNotes(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setAdvanceEmployee(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Bekor qilish</button>
                <button type="submit" disabled={advAmount <= 0}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-violet-600/20 transition flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4" />
                  Avans Berish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
