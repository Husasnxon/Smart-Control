import React, { useState, useMemo } from 'react';
import { 
  InstallationProject, 
  CustomerOrder, 
  ShipmentOrder, 
  ProjectReturnRecord, 
  Product, 
  Customer, 
  Employee, 
  Currency, 
  SaleReceipt, 
  ObjectHandover,
  OrderItem,
  AssignedTechnician
} from '../types';
import { 
  formatDualMoney, 
  formatMoney, 
  formatNumberWithSpaces, 
  formatUSDNumber, 
  getNowFormatted 
} from '../utils/formatters';
import { 
  Building2, 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Phone, 
  HardHat, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  FileSpreadsheet, 
  DollarSign, 
  Undo2, 
  Printer, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  ChevronRight, 
  Layers, 
  TrendingDown, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Package,
  FileText
} from 'lucide-react';

interface InstallationProjectsTabProps {
  projects: InstallationProject[];
  onSaveProject: (project: InstallationProject) => void;
  onDeleteProject?: (projectId: string) => void;
  orders: CustomerOrder[];
  onSaveOrder: (order: CustomerOrder) => void;
  shipments: ShipmentOrder[];
  onSaveShipment: (shipment: ShipmentOrder) => void;
  projectReturns: ProjectReturnRecord[];
  onSaveProjectReturn: (ret: ProjectReturnRecord) => void;
  products: Product[];
  customers: Customer[];
  employees: Employee[];
  currentUser?: Employee | null;
  exchangeRate: number;
  baseCurrency?: Currency;
  receipts?: SaleReceipt[];
  handovers?: ObjectHandover[];
  onOpenNewOrderModal?: (prefill: { projectId: string; projectName: string; customerId?: string; customerName: string; customerPhone?: string; deliveryAddress?: string; isDop?: boolean }) => void;
  onOpenNewShipmentModal?: (prefill: { projectId: string; projectName: string; customerId?: string; customerName: string; customerPhone?: string; deliveryAddress?: string }) => void;
}

export const InstallationProjectsTab: React.FC<InstallationProjectsTabProps> = ({
  projects = [],
  onSaveProject,
  onDeleteProject,
  orders = [],
  onSaveOrder,
  shipments = [],
  onSaveShipment,
  projectReturns = [],
  onSaveProjectReturn,
  products = [],
  customers = [],
  employees = [],
  currentUser,
  exchangeRate,
  baseCurrency = 'UZS',
  receipts = [],
  handovers = [],
  onOpenNewOrderModal,
  onOpenNewShipmentModal
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planning' | 'in_progress' | 'completed' | 'on_hold'>('all');

  // Modals state
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<InstallationProject | null>(null);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<InstallationProject | null>(null);

  // Detail Modal internal tab
  const [detailSubTab, setDetailSubTab] = useState<'summary' | 'orders' | 'shipments' | 'returns' | 'reconciliation' | 'handovers'>('reconciliation');

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnSelectedProductId, setReturnSelectedProductId] = useState('');
  const [returnQty, setReturnQty] = useState(1);
  const [returnNotes, setReturnNotes] = useState('');
  const [returnSerialInput, setReturnSerialInput] = useState('');

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Project Form State
  const [formProjectNumber, setFormProjectNumber] = useState('');
  const [formName, setFormName] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formStartDate, setFormStartDate] = useState(getNowFormatted().split(' ')[0]);
  const [formTargetEndDate, setFormTargetEndDate] = useState('');
  const [formStatus, setFormStatus] = useState<InstallationProject['status']>('in_progress');
  const [formPrimaryTechId, setFormPrimaryTechId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.projectNumber.toLowerCase().includes(q) || 
        p.customerName.toLowerCase().includes(q) || 
        p.customerPhone.includes(q) || 
        p.address.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  // Handle open create project modal
  const handleOpenCreateModal = (projectToEdit?: InstallationProject) => {
    if (projectToEdit) {
      setEditingProject(projectToEdit);
      setFormProjectNumber(projectToEdit.projectNumber);
      setFormName(projectToEdit.name);
      setFormCustomerId(projectToEdit.customerId || '');
      setFormCustomerName(projectToEdit.customerName);
      setFormCustomerPhone(projectToEdit.customerPhone);
      setFormAddress(projectToEdit.address);
      setFormStartDate(projectToEdit.startDate);
      setFormTargetEndDate(projectToEdit.targetEndDate || '');
      setFormStatus(projectToEdit.status);
      setFormPrimaryTechId(projectToEdit.primaryTechnicianId || '');
      setFormNotes(projectToEdit.notes || '');
    } else {
      setEditingProject(null);
      const nextNum = `PRJ-${1000 + projects.length + 1}`;
      setFormProjectNumber(nextNum);
      setFormName('');
      setFormCustomerId('');
      setFormCustomerName('');
      setFormCustomerPhone('');
      setFormAddress('');
      setFormStartDate(getNowFormatted().split(' ')[0]);
      setFormTargetEndDate('');
      setFormStatus('in_progress');
      setFormPrimaryTechId('');
      setFormNotes('');
    }
    setIsCreateProjectModalOpen(true);
  };

  // Handle Save Project
  const handleSaveProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCustomerName.trim()) {
      alert("Iltimos, loyiha nomi va mijoz ma'lumotlarini kiriting!");
      return;
    }

    const primaryTech = employees.find(emp => emp.id === formPrimaryTechId);

    const projectData: InstallationProject = {
      id: editingProject ? editingProject.id : `proj-${Date.now()}`,
      projectNumber: formProjectNumber.trim() || `PRJ-${Date.now()}`,
      name: formName.trim(),
      customerId: formCustomerId || undefined,
      customerName: formCustomerName.trim(),
      customerPhone: formCustomerPhone.trim(),
      address: formAddress.trim(),
      startDate: formStartDate,
      targetEndDate: formTargetEndDate || undefined,
      status: formStatus,
      primaryTechnicianId: formPrimaryTechId || undefined,
      primaryTechnicianName: primaryTech ? primaryTech.fullName : undefined,
      notes: formNotes.trim() || undefined,
      createdAt: editingProject ? editingProject.createdAt : getNowFormatted(),
      updatedAt: getNowFormatted()
    };

    onSaveProject(projectData);
    setIsCreateProjectModalOpen(false);
    if (selectedProjectForDetail && selectedProjectForDetail.id === projectData.id) {
      setSelectedProjectForDetail(projectData);
    }
  };

  // Helper: compute project statistics
  const getProjectStats = (proj: InstallationProject) => {
    // 1. Linked Estimates (Smetalar)
    const linkedOrders = orders.filter(o => 
      o.projectId === proj.id || 
      (o.projectName && o.projectName.trim().toLowerCase() === proj.name.trim().toLowerCase())
    );

    // Total Estimated
    let totalEstimatedUZS = 0;
    let totalEstimatedUSD = 0;
    linkedOrders.forEach(o => {
      if (o.status === 'cancelled' || o.status === 'rejected') return;
      const uzs = o.currency === 'USD' ? Math.round(o.totalAmount * (o.exchangeRate || exchangeRate)) : o.totalAmount;
      const usd = o.currency === 'USD' ? o.totalAmount : Number((o.totalAmount / (o.exchangeRate || exchangeRate)).toFixed(2));
      totalEstimatedUZS += uzs;
      totalEstimatedUSD += usd;
    });

    // 2. Linked Shipments (Otgruzkalar)
    const linkedShipments = shipments.filter(s => 
      s.projectId === proj.id || 
      (s.projectName && s.projectName.trim().toLowerCase() === proj.name.trim().toLowerCase())
    );

    let totalShippedUZS = 0;
    let totalShippedUSD = 0;
    linkedShipments.forEach(s => {
      if (s.status === 'cancelled') return;
      const uzs = s.currency === 'USD' ? Math.round(s.totalAmount * (s.exchangeRate || exchangeRate)) : s.totalAmount;
      const usd = s.currency === 'USD' ? s.totalAmount : Number((s.totalAmount / (s.exchangeRate || exchangeRate)).toFixed(2));
      totalShippedUZS += uzs;
      totalShippedUSD += usd;
    });

    // 3. Linked Returns (Vozvratlar)
    const linkedReturns = projectReturns.filter(r => r.projectId === proj.id);
    let totalReturnedUZS = 0;
    let totalReturnedUSD = 0;
    linkedReturns.forEach(r => {
      totalReturnedUZS += r.totalAmount;
      totalReturnedUSD += r.totalAmountUSD || Number((r.totalAmount / exchangeRate).toFixed(2));
    });

    // 4. Net Shipped / Delivered (Haqiqatda obyektda qolgan tovarlar)
    const netShippedUZS = Math.max(0, totalShippedUZS - totalReturnedUZS);
    const netShippedUSD = Math.max(0, totalShippedUSD - totalReturnedUSD);

    // 5. Payments from Receipts & Cash
    // Match receipts by customer or project note
    const linkedReceipts = receipts.filter(rc => 
      (rc.customer?.id && proj.customerId && rc.customer.id === proj.customerId) ||
      (rc.customer?.fullName && proj.customerName && rc.customer.fullName.toLowerCase() === proj.customerName.toLowerCase()) ||
      (rc.notes && rc.notes.includes(proj.name)) ||
      (rc.notes && rc.notes.includes(proj.projectNumber))
    );

    let totalPaidUZS = 0;
    let totalPaidUSD = 0;
    linkedReceipts.forEach(rc => {
      totalPaidUZS += rc.totalAmount;
      totalPaidUSD += rc.totalAmountUSD || Number((rc.totalAmount / exchangeRate).toFixed(2));
    });

    // Balance
    const remainingToPayUZS = Math.max(0, netShippedUZS - totalPaidUZS);
    const remainingToPayUSD = Math.max(0, netShippedUSD - totalPaidUSD);

    return {
      linkedOrders,
      linkedShipments,
      linkedReturns,
      linkedReceipts,
      totalEstimatedUZS,
      totalEstimatedUSD,
      totalShippedUZS,
      totalShippedUSD,
      totalReturnedUZS,
      totalReturnedUSD,
      netShippedUZS,
      netShippedUSD,
      totalPaidUZS,
      totalPaidUSD,
      remainingToPayUZS,
      remainingToPayUSD
    };
  };

  // Helper: Detailed Product-by-Product Reconciliation (Reja vs Fakt jadvali)
  const getProductReconciliation = (proj: InstallationProject) => {
    const { linkedOrders, linkedShipments, linkedReturns } = getProjectStats(proj);

    // Map: productId -> details
    const map = new Map<string, {
      productId: string;
      productName: string;
      unit: string;
      unitPriceUZS: number;
      unitPriceUSD: number;
      plannedQty: number;
      shippedQty: number;
      returnedQty: number;
      netQty: number;
      diffQty: number; // netQty - plannedQty
      diffAmountUZS: number;
      diffAmountUSD: number;
    }>();

    // 1. Accumulate Planned from Estimates
    linkedOrders.forEach(ord => {
      if (ord.status === 'cancelled' || ord.status === 'rejected') return;
      const isUSD = ord.currency === 'USD';
      ord.items.forEach(item => {
        const pId = item.productId || item.productName;
        const entry = map.get(pId) || {
          productId: item.productId,
          productName: item.productName,
          unit: item.unit || 'dona',
          unitPriceUZS: isUSD ? Math.round(item.unitPrice * (ord.exchangeRate || exchangeRate)) : item.unitPrice,
          unitPriceUSD: isUSD ? item.unitPrice : Number((item.unitPrice / (ord.exchangeRate || exchangeRate)).toFixed(2)),
          plannedQty: 0,
          shippedQty: 0,
          returnedQty: 0,
          netQty: 0,
          diffQty: 0,
          diffAmountUZS: 0,
          diffAmountUSD: 0
        };
        entry.plannedQty += item.quantity;
        map.set(pId, entry);
      });
    });

    // 2. Accumulate Shipped from Shipments
    linkedShipments.forEach(ship => {
      if (ship.status === 'cancelled') return;
      const isUSD = ship.currency === 'USD';
      ship.items.forEach(item => {
        const pId = item.productId || item.productName;
        const entry = map.get(pId) || {
          productId: item.productId,
          productName: item.productName,
          unit: item.unit || 'dona',
          unitPriceUZS: isUSD ? Math.round(item.unitPrice * (ship.exchangeRate || exchangeRate)) : item.unitPrice,
          unitPriceUSD: isUSD ? item.unitPrice : Number((item.unitPrice / (ship.exchangeRate || exchangeRate)).toFixed(2)),
          plannedQty: 0,
          shippedQty: 0,
          returnedQty: 0,
          netQty: 0,
          diffQty: 0,
          diffAmountUZS: 0,
          diffAmountUSD: 0
        };
        entry.shippedQty += item.quantity;
        map.set(pId, entry);
      });
    });

    // 3. Accumulate Returned from Returns
    linkedReturns.forEach(ret => {
      ret.items.forEach(item => {
        const pId = item.productId || item.productName;
        const entry = map.get(pId);
        if (entry) {
          entry.returnedQty += item.quantity;
        }
      });
    });

    // 4. Calculate Net and Difference
    const rows = Array.from(map.values()).map(r => {
      const netQty = Math.max(0, r.shippedQty - r.returnedQty);
      const diffQty = netQty - r.plannedQty;
      const diffAmountUZS = diffQty * r.unitPriceUZS;
      const diffAmountUSD = diffQty * r.unitPriceUSD;
      return {
        ...r,
        netQty,
        diffQty,
        diffAmountUZS,
        diffAmountUSD
      };
    });

    // Sort by largest planned first
    rows.sort((a, b) => b.plannedQty - a.plannedQty);
    return rows;
  };

  // Handle Return Item to Warehouse
  const handleSaveReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForDetail) return;
    if (!returnSelectedProductId) {
      alert("Iltimos, qaytariladigan mahsulotni tanlang!");
      return;
    }
    if (returnQty <= 0) {
      alert("Iltimos, musbat miqdor kiriting!");
      return;
    }

    const prod = products.find(p => p.id === returnSelectedProductId);
    if (!prod) return;

    const unitPriceUZS = prod.retailPrice || 0;
    const unitPriceUSD = prod.retailPriceUSD || Number((unitPriceUZS / exchangeRate).toFixed(2));
    const totalAmount = unitPriceUZS * returnQty;
    const totalAmountUSD = unitPriceUSD * returnQty;

    const serials = returnSerialInput
      .split(/[\n,]/)
      .map(s => s.trim())
      .filter(Boolean);

    const newReturn: ProjectReturnRecord = {
      id: `ret-${Date.now()}`,
      returnNumber: `VOZ-${1000 + projectReturns.length + 1}`,
      projectId: selectedProjectForDetail.id,
      projectName: selectedProjectForDetail.name,
      customerId: selectedProjectForDetail.customerId,
      customerName: selectedProjectForDetail.customerName,
      createdAt: getNowFormatted(),
      createdBy: currentUser ? currentUser.fullName : 'Kassir / Muhandis',
      items: [{
        productId: prod.id,
        productName: prod.name,
        quantity: returnQty,
        unit: prod.unit || 'dona',
        unitPrice: unitPriceUZS,
        unitPriceUSD: unitPriceUSD,
        totalPrice: totalAmount,
        serialNumbers: serials.length > 0 ? serials : undefined
      }],
      totalAmount,
      totalAmountUSD,
      notes: returnNotes.trim() || "Obyektdan ortib qolgan tovar qaytarildi",
      returnedToWarehouse: true
    };

    onSaveProjectReturn(newReturn);

    // Reset return form
    setIsReturnModalOpen(false);
    setReturnSelectedProductId('');
    setReturnQty(1);
    setReturnNotes('');
    setReturnSerialInput('');
  };

  // Handle Finalize Reconciliation (Fakt bo'yicha yopish / ortiqcha rejalarni tozalash)
  const handleReconcileAndCleanEstimates = (proj: InstallationProject) => {
    const reconciliationRows = getProductReconciliation(proj);
    const unfulfilledItems = reconciliationRows.filter(r => r.plannedQty > r.netQty);

    if (unfulfilledItems.length === 0) {
      alert("Ushbu loyihada chiqarilmagan ortiqcha reja tovarlari yo'q. Barcha rejadagi tovarlar to'liq yetkazilgan!");
      return;
    }

    const confirmMsg = `Loyiha bo'yicha ${unfulfilledItems.length} turdagi tovar rejadagidan kam ketgan (sarflanmagan):\n` +
      unfulfilledItems.map(i => `• ${i.productName}: reja ${i.plannedQty} ${i.unit}, ketgani ${i.netQty} ${i.unit} (Farq: ${i.diffQty})`).join('\n') +
      `\n\nHaqiqatan ham loyihani faqat haqiqatda yetkazilgan tovarlar bo'yicha qayta hisoblab, yakunlamoqchimisiz? Mijoz faqat o'rnatilgan tovarlar uchun hisoblanadi.`;

    if (!window.confirm(confirmMsg)) return;

    // Adjust linked orders to match actual net shipped quantities
    const { linkedOrders } = getProjectStats(proj);
    linkedOrders.forEach(ord => {
      let modified = false;
      const updatedItems = ord.items.map(item => {
        const rec = reconciliationRows.find(r => r.productId === item.productId || r.productName === item.productName);
        if (rec && rec.plannedQty > rec.netQty) {
          // If this order holds more than netQty, adjust proportionally or clamp
          const newQty = Math.min(item.quantity, rec.netQty);
          if (newQty !== item.quantity) {
            modified = true;
            return {
              ...item,
              quantity: newQty,
              totalPrice: item.unitPrice * newQty
            };
          }
        }
        return item;
      });

      if (modified) {
        const subtotal = updatedItems.reduce((s, i) => s + i.totalPrice, 0);
        const discountTotal = ord.discountTotal || 0;
        const totalAmount = Math.max(0, subtotal - discountTotal);
        const totalAmountUSD = ord.currency === 'USD' ? totalAmount : Number((totalAmount / (ord.exchangeRate || exchangeRate)).toFixed(2));

        onSaveOrder({
          ...ord,
          items: updatedItems,
          subtotal,
          totalAmount,
          totalAmountUSD,
          comment: (ord.comment ? ord.comment + " | " : "") + "Faktik ketgan tovarlar bo'yicha yakuniy hisob-kitob qilindi"
        });
      }
    });

    // Update project status to completed if desired
    onSaveProject({
      ...proj,
      status: 'completed',
      actualEndDate: getNowFormatted().split(' ')[0],
      updatedAt: getNowFormatted()
    });

    alert("Muvaffaqiyatli! Loyiha smetalari haqiqatda ketgan tovarlar (fakt) bo'yicha qayta hisoblandi va loyiha muvaffaqiyatli yakunlandi.");
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* HEADER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <span>Uzoq Muddatli Obyektlar & Loyihalar (Projects)</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {filteredProjects.length} ta loyiha
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Oylab davom etadigan obyektlar, bosqichma-bosqich smetalar (Dop-smeta), ombordan chiqim va tovar qaytarish (vozvrat) nazorati
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yangi Loyiha Ochish</span>
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Loyiha nomi, mijoz, telefon yoki manzil bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['all', 'in_progress', 'planning', 'completed', 'on_hold'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              {st === 'all' && 'Barchasi'}
              {st === 'in_progress' && '🟡 Jarayonda'}
              {st === 'planning' && '🔵 Rejalashtirilmoqda'}
              {st === 'completed' && '🟢 Yakunlangan'}
              {st === 'on_hold' && '⚪ To\'xtatilgan'}
            </button>
          ))}
        </div>
      </div>

      {/* PROJECTS GRID */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {searchQuery ? "Qidiruv bo'yicha loyiha topilmadi" : "Hali uzoq muddatli loyihalar ochilmagan"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Katta obyektlar (zavod, ko&apos;p qavatli bino, mehmonxona, hovli) bo&apos;yicha yangi loyiha oching. Unga bir nechta bosqichli smetalar va ombor chiqimlarini bog&apos;lab boshqaring.
          </p>
          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-md hover:bg-indigo-500 transition"
          >
            + Birinchi Loyihani Yaratish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProjects.map((proj) => {
            const stats = getProjectStats(proj);
            const statusConfig = {
              in_progress: { label: 'Jarayonda', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
              planning: { label: 'Rejalashtirilmoqda', bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' },
              completed: { label: 'Yakunlangan', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
              on_hold: { label: 'To\'xtatilgan', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30' },
              cancelled: { label: 'Bekor qilingan', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' }
            }[proj.status];

            return (
              <div
                key={proj.id}
                onClick={() => {
                  setSelectedProjectForDetail(proj);
                  setDetailSubTab('reconciliation');
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-500/40 transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Project Number & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                      {proj.projectNumber}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${statusConfig.bg}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Project Name & Address */}
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-1">
                    {proj.name}
                  </h3>

                  <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 line-clamp-1">
                      <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{proj.customerName}</span>
                      {proj.customerPhone && <span className="font-mono text-[11px] text-slate-400">({proj.customerPhone})</span>}
                    </div>
                    {proj.address && (
                      <div className="flex items-center gap-1.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span>{proj.address}</span>
                      </div>
                    )}
                    {proj.primaryTechnicianName && (
                      <div className="flex items-center gap-1.5">
                        <HardHat className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        <span>Usta: <strong className="text-slate-700 dark:text-slate-300">{proj.primaryTechnicianName}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Mini KPI Dashboard */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-medium">Smetalar (Reja):</span>
                      <strong className="font-mono text-slate-900 dark:text-white font-bold text-xs">
                        {stats.totalEstimatedUSD > 0 ? `$${formatUSDNumber(stats.totalEstimatedUSD)}` : `${formatNumberWithSpaces(stats.totalEstimatedUZS)} so'm`}
                      </strong>
                      <span className="text-[10px] text-slate-400 block">{stats.linkedOrders.length} ta bosqich</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-medium">Chiqqan (Fakt):</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        {stats.netShippedUSD > 0 ? `$${formatUSDNumber(stats.netShippedUSD)}` : `${formatNumberWithSpaces(stats.netShippedUZS)} so'm`}
                      </strong>
                      <span className="text-[10px] text-slate-400 block">{stats.linkedShipments.length} ta otgruzka</span>
                    </div>
                  </div>

                  {/* Returns Warning Badge if any */}
                  {stats.totalReturnedUZS > 0 && (
                    <div className="mt-2 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-[11px] text-rose-700 dark:text-rose-300 flex items-center justify-between">
                      <span className="flex items-center gap-1 font-medium">
                        <Undo2 className="w-3.5 h-3.5 shrink-0" /> Ortib qolgan tovar qaytarilgan:
                      </span>
                      <strong className="font-mono">
                        {stats.totalReturnedUSD > 0 ? `-$${formatUSDNumber(stats.totalReturnedUSD)}` : `-${formatNumberWithSpaces(stats.totalReturnedUZS)} so'm`}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-3.5 pt-2 flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                  <span>Loyiha papkasini ochish</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT PROJECT */}
      {/* ========================================================================= */}
      {isCreateProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingProject ? "Loyihani Tahrirlash" : "Yangi Uzoq Muddatli Loyiha Ochish"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Obyekt ma&apos;lumotlari va mas&apos;ul ustalarni belgilash
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateProjectModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProjectSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Loyiha Raqami:
                  </label>
                  <input
                    type="text"
                    required
                    value={formProjectNumber}
                    onChange={(e) => setFormProjectNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Loyiha Holati:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as InstallationProject['status'])}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="in_progress">🟡 Montaj jarayonida</option>
                    <option value="planning">🔵 Rejalashtirilmoqda</option>
                    <option value="completed">🟢 Yakunlangan</option>
                    <option value="on_hold">⚪ To&apos;xtatilgan</option>
                    <option value="cancelled">🔴 Bekor qilingan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Loyiha / Obyekt Nomi: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Grand Hotel Mehmonxonasi, Akfa 3-bino, Sardor Hovlisi"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* Customer Selector */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Mijoz Ma&apos;lumotlari:
                  </span>
                  <select
                    onChange={(e) => {
                      const cust = customers.find(c => c.id === e.target.value);
                      if (cust) {
                        setFormCustomerId(cust.id);
                        setFormCustomerName(cust.fullName);
                        setFormCustomerPhone(cust.phone || '');
                      }
                    }}
                    className="text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 outline-none text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Mavjud mijozlar bazasidan tanlash --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Mijoz F.I.Sh. *</label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Sardor Rahimov"
                      value={formCustomerName}
                      onChange={(e) => setFormCustomerName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Telefon Raqami:</label>
                    <input
                      type="text"
                      placeholder="+998 90 123 45 67"
                      value={formCustomerPhone}
                      onChange={(e) => setFormCustomerPhone(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Obyekt Manzili:
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Toshkent sh., Chilonzor 9-mavze, 45-uy"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* Dates & Primary Tech */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Boshlangan Sana:
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Kutilayotgan Yakunlash Sanasi:
                  </label>
                  <input
                    type="date"
                    value={formTargetEndDate}
                    onChange={(e) => setFormTargetEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Primary Tech */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Mas&apos;ul Montajchi Usta / Muhandis:
                </label>
                <select
                  value={formPrimaryTechId}
                  onChange={(e) => setFormPrimaryTechId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">-- Mas&apos;ul ustani biriktirish --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.role})</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Qo&apos;shimcha Izoh yoki Shartlar:
                </label>
                <textarea
                  rows={2}
                  placeholder="Loyiha tafsilotlari, kelishuvlar, xavfsizlik talablari..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none resize-none"
                />
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
                >
                  {editingProject ? "O'zgarishlarni Saqlash" : "Loyihani Saqlash"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PROJECT DETAIL CABINET (LOYIHA PAPKASI) */}
      {/* ========================================================================= */}
      {selectedProjectForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[94vh]">
            
            {/* CABINET HEADER */}
            <div className="px-5 sm:px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-extrabold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-800">
                      {selectedProjectForDetail.projectNumber}
                    </span>
                    <h2 className="text-base font-extrabold text-white">
                      {selectedProjectForDetail.name}
                    </h2>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                      {selectedProjectForDetail.status === 'in_progress' ? '🟡 Montaj Jarayonida' : selectedProjectForDetail.status === 'completed' ? '🟢 Yakunlangan' : '🔵 Rejada'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>Mijoz: <strong className="text-slate-200">{selectedProjectForDetail.customerName}</strong> ({selectedProjectForDetail.customerPhone})</span>
                    {selectedProjectForDetail.address && <span>• {selectedProjectForDetail.address}</span>}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
                  title="Loyiha Svodkasi va Akt Sverkani chop etish"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Chop Etish (Akt Sverka)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCreateModal(selectedProjectForDetail)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Tahrirlash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProjectForDetail(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* STATS STRIP */}
            {(() => {
              const stats = getProjectStats(selectedProjectForDetail);
              return (
                <div className="bg-slate-50 dark:bg-slate-850 px-5 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">1. Jami Smetalar (Reja):</span>
                    <strong className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 block mt-0.5">
                      {stats.totalEstimatedUSD > 0 ? `$${formatUSDNumber(stats.totalEstimatedUSD)}` : `${formatNumberWithSpaces(stats.totalEstimatedUZS)} so'm`}
                    </strong>
                    <span className="text-[10px] text-slate-500">{stats.linkedOrders.length} ta bosqich (dop-smeta)</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">2. Ombordan Chiqqan (Fakt):</span>
                    <strong className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {stats.totalShippedUSD > 0 ? `$${formatUSDNumber(stats.totalShippedUSD)}` : `${formatNumberWithSpaces(stats.totalShippedUZS)} so'm`}
                    </strong>
                    <span className="text-[10px] text-slate-500">{stats.linkedShipments.length} ta yuklash (nakladnoy)</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">3. Ortib Qolgan (Vozvrat):</span>
                    <strong className="text-sm font-black font-mono text-rose-600 dark:text-rose-400 block mt-0.5">
                      {stats.totalReturnedUSD > 0 ? `-$${formatUSDNumber(stats.totalReturnedUSD)}` : `-${formatNumberWithSpaces(stats.totalReturnedUZS)} so'm`}
                    </strong>
                    <span className="text-[10px] text-slate-500">{stats.linkedReturns.length} ta qaytarish akti</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">4. Faktik Qolgan Qarz:</span>
                    <strong className="text-sm font-black font-mono text-amber-600 dark:text-amber-400 block mt-0.5">
                      {stats.remainingToPayUSD > 0 ? `$${formatUSDNumber(stats.remainingToPayUSD)}` : `${formatNumberWithSpaces(stats.remainingToPayUZS)} so'm`}
                    </strong>
                    <span className="text-[10px] text-slate-500">Mijoz to&apos;lagan: {formatNumberWithSpaces(stats.totalPaidUZS)} so&apos;m</span>
                  </div>
                </div>
              );
            })()}

            {/* DETAIL SUB-TABS */}
            <div className="px-5 sm:px-6 pt-3 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setDetailSubTab('reconciliation')}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  detailSubTab === 'reconciliation'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Reja va Fakt Solishtirmasi (Akt Sverka)</span>
              </button>

              <button
                onClick={() => setDetailSubTab('orders')}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  detailSubTab === 'orders'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-sky-500" />
                <span>Smetalar & Bosqichlar (Dop-Smetalar)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 font-mono">
                  {getProjectStats(selectedProjectForDetail).linkedOrders.length}
                </span>
              </button>

              <button
                onClick={() => setDetailSubTab('shipments')}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  detailSubTab === 'shipments'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Truck className="w-4 h-4 text-emerald-500" />
                <span>Ombor Chiqimlari (Otgruzkalar)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 font-mono">
                  {getProjectStats(selectedProjectForDetail).linkedShipments.length}
                </span>
              </button>

              <button
                onClick={() => setDetailSubTab('returns')}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  detailSubTab === 'returns'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Undo2 className="w-4 h-4 text-rose-500" />
                <span>Ortiqcha Tovarlar (Vozvrat)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 font-mono">
                  {getProjectStats(selectedProjectForDetail).linkedReturns.length}
                </span>
              </button>
            </div>

            {/* DETAIL BODY */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">

              {/* ------------------------------------------------------------- */}
              {/* TAB 1: RECONCILIATION (REJA VS FAKT JADVALI) */}
              {/* ------------------------------------------------------------- */}
              {detailSubTab === 'reconciliation' && (() => {
                const rows = getProductReconciliation(selectedProjectForDetail);
                const hasUnderutilized = rows.some(r => r.plannedQty > r.netQty);

                return (
                  <div className="space-y-4">
                    {/* Top Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/70 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/50">
                      <div>
                        <h4 className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          <span>Tovarlar Bo&apos;yicha Reja va Fakt Solishtirmasi</span>
                        </h4>
                        <p className="text-[11px] text-indigo-800 dark:text-indigo-300 mt-0.5">
                          Smetada rejalashtirilgan tovarlar bilan haqiqatda obyektga o&apos;rnatilgan tovarlarning shaffof farqi
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasUnderutilized && (
                          <button
                            type="button"
                            onClick={() => handleReconcileAndCleanEstimates(selectedProjectForDetail)}
                            className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition flex items-center gap-1.5 active:scale-[0.98]"
                            title="Obyektda ishlatilmagan tovarlarni hisob-kitobdan chiqarish"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Ortiqcha Rejalarni Tozalash (Fakt bo&apos;yicha yopish)</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setIsReturnModalOpen(true)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 transition flex items-center gap-1.5"
                        >
                          <Undo2 className="w-4 h-4" />
                          <span>+ Tovar Qaytarish (Vozvrat)</span>
                        </button>
                      </div>
                    </div>

                    {/* Table */}
                    {rows.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        Ushbu loyihaga hali birorta ham smeta yoki chiqim bog&apos;lanmagan.
                      </div>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="py-2.5 px-3">Mahsulot / Xizmat Nomi</th>
                              <th className="py-2.5 px-3 text-center">Boshlang&apos;ich Reja</th>
                              <th className="py-2.5 px-3 text-center">Ombordan Chiqqan</th>
                              <th className="py-2.5 px-3 text-center">Qaytarilgan (Vozvrat)</th>
                              <th className="py-2.5 px-3 text-center font-black text-indigo-600 dark:text-indigo-400">Faktik Ketgani</th>
                              <th className="py-2.5 px-3 text-right">Farq (Balans)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {rows.map((row) => {
                              const isSaved = row.diffQty < 0; // kam ketgan (mijoz tejadi)
                              const isExtra = row.diffQty > 0; // qo'shimcha ketgan
                              const isExact = row.diffQty === 0;

                              return (
                                <tr key={row.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                                  <td className="py-2.5 px-3">
                                    <span className="font-bold text-slate-900 dark:text-white block">{row.productName}</span>
                                    <span className="text-[10px] text-slate-400">
                                      Dona narxi: {row.unitPriceUSD > 0 ? `$${formatUSDNumber(row.unitPriceUSD)}` : `${formatNumberWithSpaces(row.unitPriceUZS)} so'm`}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {row.plannedQty} {row.unit}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                                    {row.shippedQty} {row.unit}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono text-rose-600 dark:text-rose-400">
                                    {row.returnedQty > 0 ? `-${row.returnedQty} ${row.unit}` : '0'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono font-black text-xs text-indigo-600 dark:text-indigo-400">
                                    {row.netQty} {row.unit}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    {isSaved && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                                        <TrendingDown className="w-3 h-3" />
                                        Kam ketdi: {row.diffQty} {row.unit} ({row.diffAmountUSD !== 0 ? `-$${formatUSDNumber(Math.abs(row.diffAmountUSD))}` : `-${formatNumberWithSpaces(Math.abs(row.diffAmountUZS))} so'm`})
                                      </span>
                                    )}
                                    {isExtra && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200">
                                        <TrendingUp className="w-3 h-3" />
                                        Qo&apos;shildi: +{row.diffQty} {row.unit} (+${formatUSDNumber(row.diffAmountUSD)})
                                      </span>
                                    )}
                                    {isExact && (
                                      <span className="text-[11px] font-mono text-slate-400">
                                        🟢 100% Mos
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: ESTIMATES & PHASES (SMETALAR & BOSQICHLAR) */}
              {/* ------------------------------------------------------------- */}
              {detailSubTab === 'orders' && (() => {
                const { linkedOrders } = getProjectStats(selectedProjectForDetail);

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Loyihaga Biriktirilgan Smetalar & Qo&apos;shimcha Kelishuvlar (Dop-Smetalar)
                      </h4>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenNewOrderModal) {
                            onOpenNewOrderModal({
                              projectId: selectedProjectForDetail.id,
                              projectName: selectedProjectForDetail.name,
                              customerId: selectedProjectForDetail.customerId,
                              customerName: selectedProjectForDetail.customerName,
                              customerPhone: selectedProjectForDetail.customerPhone,
                              deliveryAddress: selectedProjectForDetail.address,
                              isDop: true
                            });
                          } else {
                            alert("Yangi smeta tuzish uchun chap menyudagi 'Hisob-kitob (Smeta)' bo'limiga o'ting va loyiha nomini tanlang.");
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Yangi Qo&apos;shimcha Smeta (Dop-Smeta) Tuzish</span>
                      </button>
                    </div>

                    {linkedOrders.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        Ushbu loyihaga hali smeta kiritilmagan.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {linkedOrders.map((ord, idx) => (
                          <div
                            key={ord.id}
                            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold">
                                {idx === 0 ? '1' : `+${idx}`}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    {ord.orderNumber}
                                  </span>
                                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                    {idx === 0 ? "Boshlang'ich Asosiy Smeta" : (ord.estimatePhaseName || `Qo'shimcha Smeta #${idx}`)}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  Sana: {ord.createdAt} • {ord.items.length} turdagi tovar va xizmatlar
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 justify-between sm:justify-end">
                              <div className="text-right">
                                <span className="font-mono font-black text-sm text-slate-900 dark:text-white block">
                                  {ord.currency === 'USD' ? `$${formatUSDNumber(ord.totalAmount)}` : `${formatNumberWithSpaces(ord.totalAmount)} so'm`}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {ord.currency === 'USD' ? `≈ ${formatNumberWithSpaces(Math.round(ord.totalAmount * (ord.exchangeRate || exchangeRate)))} so'm` : `≈ $${formatUSDNumber(Number((ord.totalAmount / (ord.exchangeRate || exchangeRate)).toFixed(2)))}`}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {ord.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ------------------------------------------------------------- */}
              {/* TAB 3: SHIPMENTS (OMBOR CHIQIMLARI) */}
              {/* ------------------------------------------------------------- */}
              {detailSubTab === 'shipments' && (() => {
                const { linkedShipments } = getProjectStats(selectedProjectForDetail);

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Ombordan Bosqichma-bosqich Chiqarilgan Tovarlar (Otgruzkalar)
                      </h4>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenNewShipmentModal) {
                            onOpenNewShipmentModal({
                              projectId: selectedProjectForDetail.id,
                              projectName: selectedProjectForDetail.name,
                              customerId: selectedProjectForDetail.customerId,
                              customerName: selectedProjectForDetail.customerName,
                              customerPhone: selectedProjectForDetail.customerPhone,
                              deliveryAddress: selectedProjectForDetail.address
                            });
                          } else {
                            alert("Yangi otgruzka yaratish uchun 'Otgruzka' bo'limiga o'ting va loyiha nomini tanlang.");
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>+ Smetadan Yangi Chiqim Qilish (Otgruzka)</span>
                      </button>
                    </div>

                    {linkedShipments.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        Ushbu loyiha uchun hali ombordan tovar chiqarilmagan.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {linkedShipments.map((ship) => (
                          <div
                            key={ship.id}
                            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                                <Truck className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                  {ship.shipmentNumber}
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  Sana: {ship.createdAt} • {ship.items.length} xil tovar yuklandi
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 justify-between sm:justify-end">
                              <div className="text-right">
                                <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 block">
                                  {ship.currency === 'USD' ? `$${formatUSDNumber(ship.totalAmount)}` : `${formatNumberWithSpaces(ship.totalAmount)} so'm`}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Holat: {ship.status === 'shipped' ? 'Yetkazildi' : 'Kutilmoqda'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ------------------------------------------------------------- */}
              {/* TAB 4: RETURNS (ORTIQCHA TOVAR QAYTARISH / VOZVRAT) */}
              {/* ------------------------------------------------------------- */}
              {detailSubTab === 'returns' && (() => {
                const { linkedReturns } = getProjectStats(selectedProjectForDetail);

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          Obyektdan Ortib Qolib Omborga Qaytarilgan Tovarlar
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Ushbu tovarlar avtomatik tarzda ombor qoldig&apos;iga qaytariladi va loyiha narxidan ayiriladi
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsReturnModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition flex items-center gap-1.5"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>+ Yangi Qaytarish (Vozvrat) Rasmiylashtirish</span>
                      </button>
                    </div>

                    {linkedReturns.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        Hozircha ushbu obyektdan ortib qolgan tovar qaytarilmagan.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {linkedReturns.map((ret) => (
                          <div
                            key={ret.id}
                            className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
                                <Undo2 className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-mono font-bold text-rose-900 dark:text-rose-200">
                                  {ret.returnNumber}
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  Sana: {ret.createdAt} • Qabul qiluvchi: {ret.createdBy}
                                </span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {ret.items.map((it, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                      {it.productName}: {it.quantity} {it.unit}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-mono font-black text-sm text-rose-600 dark:text-rose-400 block">
                                -${formatUSDNumber(ret.totalAmountUSD || Number((ret.totalAmount / exchangeRate).toFixed(2)))}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                -{formatNumberWithSpaces(ret.totalAmount)} so&apos;m
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RETURN ITEM MODAL (ORTIQCHA TOVAR QAYTARISH) */}
      {/* ========================================================================= */}
      {isReturnModalOpen && selectedProjectForDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            
            <div className="px-5 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
                  <Undo2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Omborga Tovar Qaytarish (Vozvrat)</h4>
                  <p className="text-[10px] text-slate-400">Obyektdan ortib qolgan tovar ombor qoldig&apos;iga qaytadi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveReturnSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Qaytariladigan Mahsulot: *
                </label>
                <select
                  required
                  value={returnSelectedProductId}
                  onChange={(e) => setReturnSelectedProductId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/40"
                >
                  <option value="">-- Mahsulotni tanlang --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Omborda hozir: {p.stockQuantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Qaytarilayotgan Miqdor: *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={returnQty}
                  onChange={(e) => setReturnQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Seriya Raqamlari (S/N) - agar bo&apos;lsa:
                </label>
                <textarea
                  rows={2}
                  placeholder="Har bir seriya raqamini yangi qatorda yozing..."
                  value={returnSerialInput}
                  onChange={(e) => setReturnSerialInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-xs text-slate-900 dark:text-white outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Qaytarish Sababi / Izoh:
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Obyektda ortib qoldi, karobkasi ochilmagan"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition"
                >
                  Omborga Qaytarishni Tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PRINTABLE STATEMENT (LOYIHA SVODKASI & AKT SVERKA) */}
      {/* ========================================================================= */}
      {isPrintModalOpen && selectedProjectForDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-slate-900">
            
            {/* Header Toolbar */}
            <div className="no-print px-5 py-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs">Akt Sverka va Loyiha Svodkasi (A4 Chop Etish)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Chop Etish</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-xs bg-white">
              
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                    SMART CONTROL
                  </h1>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                    Xavfsizlik va Videokuzatuv Tizimlari Markazi
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tel: +998 90 000 00 00 • Manzil: O&apos;zbekiston
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-slate-900 block">
                    AKT SVERKA #{selectedProjectForDetail.projectNumber}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Sana: {getNowFormatted()}
                  </span>
                </div>
              </div>

              {/* Project Meta */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Loyiha Nomi:</span>
                  <strong className="text-sm text-slate-900">{selectedProjectForDetail.name}</strong>
                  <span className="text-xs text-slate-600 block mt-0.5">{selectedProjectForDetail.address}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Buyurtmachi (Mijoz):</span>
                  <strong className="text-sm text-slate-900">{selectedProjectForDetail.customerName}</strong>
                  <span className="text-xs font-mono text-slate-600 block mt-0.5">{selectedProjectForDetail.customerPhone}</span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 mb-2">
                  Haqiqatda Sarflangan Tovar va Xizmatlar Ro&apos;yxati
                </h4>
                <table className="w-full text-left text-xs border border-slate-300 divide-y divide-slate-200">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 border-r border-slate-200">№</th>
                      <th className="p-2 border-r border-slate-200">Nomi</th>
                      <th className="p-2 border-r border-slate-200 text-center">Boshlang&apos;ich Reja</th>
                      <th className="p-2 border-r border-slate-200 text-center">Faktik O&apos;rnatildi</th>
                      <th className="p-2 border-r border-slate-200 text-right">Narxi</th>
                      <th className="p-2 text-right">Jami Summa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {getProductReconciliation(selectedProjectForDetail).map((row, idx) => (
                      <tr key={row.productId}>
                        <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-sans font-medium text-slate-900">
                          {row.productName}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center text-slate-500">
                          {row.plannedQty} {row.unit}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-900">
                          {row.netQty} {row.unit}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-right">
                          {row.unitPriceUSD > 0 ? `$${formatUSDNumber(row.unitPriceUSD)}` : `${formatNumberWithSpaces(row.unitPriceUZS)}`}
                        </td>
                        <td className="p-2 text-right font-bold">
                          {row.unitPriceUSD > 0 ? `$${formatUSDNumber(row.netQty * row.unitPriceUSD)}` : `${formatNumberWithSpaces(row.netQty * row.unitPriceUZS)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              {(() => {
                const stats = getProjectStats(selectedProjectForDetail);
                return (
                  <div className="flex justify-end">
                    <div className="w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Faktik Tovar va Xizmatlar:</span>
                        <strong className="text-slate-900">${formatUSDNumber(stats.netShippedUSD)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">To&apos;langan Avans / Mablag&apos;:</span>
                        <strong className="text-emerald-600">${formatUSDNumber(stats.totalPaidUSD)}</strong>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                        <span>Qoldiq To&apos;lov:</span>
                        <span className="text-indigo-600">${formatUSDNumber(stats.remainingToPayUSD)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <p className="font-bold text-slate-700">Topshiruvchi (Pudratchi):</p>
                  <p className="text-slate-500 mt-0.5">SMART CONTROL MCHJ</p>
                  <div className="mt-8 border-b border-slate-400 w-48"></div>
                  <p className="text-[10px] text-slate-400 mt-1">Imzo va muhr</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Qabul Qiluvchi (Buyurtmachi):</p>
                  <p className="text-slate-500 mt-0.5">{selectedProjectForDetail.customerName}</p>
                  <div className="mt-8 border-b border-slate-400 w-48"></div>
                  <p className="text-[10px] text-slate-400 mt-1">Imzo va sana</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
