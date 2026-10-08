'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  CustomerOrder, 
  ShipmentOrder, 
  Employee, 
  ObjectHandover, 
  ServiceTicket, 
  Currency,
  Product,
  Customer
} from '../types';
import { formatNumberWithSpaces, formatUSDNumber } from '../utils/formatters';
import { compressImage } from '../utils/imageCompressor';
import { HandoverModal } from './HandoverModal';
import { OnSiteEstimateModal } from './OnSiteEstimateModal';
import { HddCalculatorModal } from './HddCalculatorModal';
import { 
  HardHat, 
  HardDrive,
  MapPin, 
  Phone, 
  CheckCircle2, 
  Navigation, 
  Camera, 
  FileText, 
  DollarSign, 
  Star, 
  Wrench, 
  Cpu, 
  ShieldCheck, 
  CheckCheck, 
  Search, 
  Activity, 
  Smartphone, 
  Monitor, 
  ChevronRight, 
  Sparkles, 
  UserCheck, 
  TrendingUp, 
  Clock, 
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Calculator,
  Send,
  FileSpreadsheet,
  Package,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle,
  User,
  Upload,
  Trash2,
  Lock,
  KeyRound,
  Edit3,
  Save,
  Check,
  Play,
  Flag,
  CalendarDays,
  Filter
} from 'lucide-react';

export type MainMobileTab = 'orders' | 'in_progress' | 'completed' | 'profile';
export type OrdersSubFilter = 'active_jobs' | 'estimates' | 'service_tasks';
export type EarningsPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';

interface TechnicianPortalScreenProps {
  currentUser: Employee | null;
  employees: Employee[];
  orders: CustomerOrder[];
  shipments: ShipmentOrder[];
  handovers: ObjectHandover[];
  serviceTickets: ServiceTicket[];
  products?: Product[];
  customers?: Customer[];
  exchangeRate: number;
  baseCurrency?: Currency;
  initialSubTab?: string;
  onSaveHandover: (handover: ObjectHandover) => void;
  onSaveOrder?: (order: CustomerOrder) => void;
  onUpdateServiceTicket?: (ticket: ServiceTicket) => void;
  onUpdateEmployeeStatus?: (employeeId: string, newStatus: 'active' | 'on_site' | 'on_leave') => void;
  onUpdateEmployee?: (emp: Employee) => void;
}

export const TechnicianPortalScreen: React.FC<TechnicianPortalScreenProps> = ({
  currentUser,
  employees,
  orders,
  shipments,
  handovers,
  serviceTickets,
  products = [],
  customers = [],
  exchangeRate,
  baseCurrency = 'UZS',
  initialSubTab,
  onSaveHandover,
  onSaveOrder,
  onUpdateServiceTicket,
  onUpdateEmployeeStatus,
  onUpdateEmployee
}) => {
  // Device view mode: 'mobile' (default) or 'desktop'
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile');

  // Filter technicians list
  const techniciansList = useMemo(() => {
    return (employees || []).filter(
      e => e && (
        e.systemRole === 'technician' || 
        (e.role && (
          e.role.toLowerCase().includes('usta') || 
          e.role.toLowerCase().includes('muhandis') ||
          e.role.toLowerCase().includes('montaj')
        ))
      )
    );
  }, [employees]);

  const [selectedTechId, setSelectedTechId] = useState<string>(() => {
    if (currentUser?.systemRole === 'technician') return currentUser.id;
    return techniciansList[0]?.id || currentUser?.id || 'emp-3';
  });

  const activeTechnician = useMemo(() => {
    return (employees || []).find(e => e && e.id === selectedTechId) || currentUser || employees[0];
  }, [employees, selectedTechId, currentUser]);

  const activeTechName = (activeTechnician?.fullName || '').toLowerCase().trim();

  // Main Bottom Navigation Tab: 'orders' | 'in_progress' | 'completed' | 'profile'
  const [mainTab, setMainTab] = useState<MainMobileTab>(() => {
    if (initialSubTab === 'earnings' || initialSubTab === 'profile') return 'profile';
    if (initialSubTab === 'in_progress') return 'in_progress';
    if (initialSubTab === 'completed' || initialSubTab === 'completed_handovers') return 'completed';
    return 'orders';
  });

  // Orders Sub-Filter: 'active_jobs' | 'estimates' | 'service_tasks'
  const [ordersSubFilter, setOrdersSubFilter] = useState<OrdersSubFilter>(() => {
    if (initialSubTab === 'estimates') return 'estimates';
    if (initialSubTab === 'service_tasks') return 'service_tasks';
    return 'active_jobs';
  });

  // Earnings Time Period Filter
  const [earningsPeriod, setEarningsPeriod] = useState<EarningsPeriod>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Sync initialSubTab changes from sidebar
  useEffect(() => {
    if (initialSubTab) {
      if (initialSubTab === 'earnings' || initialSubTab === 'profile') {
        setMainTab('profile');
      } else if (initialSubTab === 'in_progress') {
        setMainTab('in_progress');
      } else if (initialSubTab === 'completed' || initialSubTab === 'completed_handovers') {
        setMainTab('completed');
      } else if (initialSubTab === 'estimates') {
        setMainTab('orders');
        setOrdersSubFilter('estimates');
      } else if (initialSubTab === 'service_tasks') {
        setMainTab('orders');
        setOrdersSubFilter('service_tasks');
      } else if (initialSubTab === 'active_jobs' || initialSubTab === 'orders') {
        setMainTab('orders');
        setOrdersSubFilter('active_jobs');
      }
    }
  }, [initialSubTab]);

  const [searchQuery, setSearchQuery] = useState('');
  const [estimateStatusFilter, setEstimateStatusFilter] = useState<'all' | 'pending' | 'shipped' | 'completed'>('all');

  // Accordion expanded state for job cards (Compact by default)
  const [expandedJobIds, setExpandedJobIds] = useState<Record<string, boolean>>({});

  // Handover Modal state
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [selectedHandoverOrder, setSelectedHandoverOrder] = useState<CustomerOrder | null>(null);
  const [selectedViewingHandover, setSelectedViewingHandover] = useState<ObjectHandover | null>(null);

  // On-Site Estimate Modal state
  const [isOnSiteEstimateOpen, setIsOnSiteEstimateOpen] = useState(false);
  const [estimateTargetOrder, setEstimateTargetOrder] = useState<CustomerOrder | null>(null);

  // HDD Calculator Modal state
  const [isHddCalcOpen, setIsHddCalcOpen] = useState(false);

  // Profile Edit State
  const [profileFullName, setProfileFullName] = useState(activeTechnician?.fullName || '');
  const [profilePhone, setProfilePhone] = useState(activeTechnician?.phone || '');
  const [profileAvatar, setProfileAvatar] = useState(activeTechnician?.avatar || '');
  const [profilePassword, setProfilePassword] = useState(activeTechnician?.password || '');
  const [profilePin, setProfilePin] = useState(activeTechnician?.pin || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  useEffect(() => {
    if (activeTechnician) {
      setProfileFullName(activeTechnician.fullName || '');
      setProfilePhone(activeTechnician.phone || '');
      setProfileAvatar(activeTechnician.avatar || '');
      setProfilePassword(activeTechnician.password || '');
      setProfilePin(activeTechnician.pin || '');
    }
  }, [activeTechnician]);

  // Toggle single accordion job card
  const toggleJobExpanded = (orderId: string) => {
    setExpandedJobIds(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // 1. Filter active jobs assigned to this technician
  const assignedActiveJobs = useMemo(() => {
    if (!activeTechnician) return [];

    return (orders || []).filter(order => {
      if (!order) return false;
      const isAssigned = 
        (order.technicians && Array.isArray(order.technicians) && order.technicians.some(t => t && ((activeTechnician.id && t.id === activeTechnician.id) || (t.fullName && activeTechName && t.fullName.toLowerCase().includes(activeTechName))))) ||
        (activeTechnician.id && order.technicianId === activeTechnician.id) ||
        (order.technicianName && activeTechName && order.technicianName.toLowerCase().includes(activeTechName)) ||
        (activeTechnician.id && order.requestedByTechnicianId === activeTechnician.id);
      
      if (!isAssigned) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = 
          (order.orderNumber || '').toLowerCase().includes(q) ||
          (order.customerName || '').toLowerCase().includes(q) ||
          (order.projectName || '').toLowerCase().includes(q) ||
          (order.deliveryAddress || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [orders, activeTechnician, activeTechName, searchQuery]);

  // 2. Segregate jobs by lifecycle stage:
  // A) Unstarted Jobs (Yangi kutilayotgan buyurtmalar)
  const unstartedJobs = useMemo(() => {
    return assignedActiveJobs.filter(order => {
      const matchingHandover = (handovers || []).find(h => h && (h.orderNumber === order.orderNumber || (order.id && h.orderId === order.id)));
      const isCompleted = order.status === 'completed' || !!matchingHandover;
      const isInProgress = order.status === 'in_progress' || (!!order.startedAt && !isCompleted);
      return !isCompleted && !isInProgress;
    });
  }, [assignedActiveJobs, handovers]);

  // B) In-Progress Jobs (Ayni vaqtda montaj jarayonidagi ishlar)
  const inProgressJobs = useMemo(() => {
    return assignedActiveJobs.filter(order => {
      const matchingHandover = (handovers || []).find(h => h && (h.orderNumber === order.orderNumber || (order.id && h.orderId === order.id)));
      const isCompleted = order.status === 'completed' || !!matchingHandover;
      return !isCompleted && (order.status === 'in_progress' || !!order.startedAt);
    });
  }, [assignedActiveJobs, handovers]);

  // C) Completed Jobs (Topshirilgan obyektlar)
  const completedJobsList = useMemo(() => {
    return assignedActiveJobs.filter(order => {
      const matchingHandover = (handovers || []).find(h => h && (h.orderNumber === order.orderNumber || (order.id && h.orderId === order.id)));
      return order.status === 'completed' || !!matchingHandover;
    });
  }, [assignedActiveJobs, handovers]);

  // 3. Filter all estimates & shipments (Hisob-kitob va Otgruzkalar)
  const myEstimatesAndShipments = useMemo(() => {
    if (!activeTechnician) return [];

    return (orders || []).filter(order => {
      if (!order) return false;
      const isAssigned = 
        (order.technicians && Array.isArray(order.technicians) && order.technicians.some(t => t && ((activeTechnician.id && t.id === activeTechnician.id) || (t.fullName && activeTechName && t.fullName.toLowerCase().includes(activeTechName))))) ||
        (activeTechnician.id && order.technicianId === activeTechnician.id) ||
        (order.technicianName && activeTechName && order.technicianName.toLowerCase().includes(activeTechName)) ||
        (activeTechnician.id && order.requestedByTechnicianId === activeTechnician.id) ||
        (currentUser?.systemRole === 'admin' || currentUser?.systemRole === 'manager');

      if (!isAssigned) return false;

      // Status filter
      if (estimateStatusFilter === 'pending' && order.status !== 'pending_cashier_approval') return false;
      if (estimateStatusFilter === 'shipped' && order.status !== 'shipped') return false;
      if (estimateStatusFilter === 'completed' && order.status !== 'completed') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = 
          (order.orderNumber || '').toLowerCase().includes(q) ||
          (order.customerName || '').toLowerCase().includes(q) ||
          (order.projectName || '').toLowerCase().includes(q) ||
          (order.deliveryAddress || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [orders, activeTechnician, activeTechName, estimateStatusFilter, searchQuery, currentUser]);

  // 4. Filter completed handovers/acts for this technician
  const myHandovers = useMemo(() => {
    if (!activeTechnician) return [];

    return (handovers || []).filter(h => {
      if (!h) return false;
      const isMyAct = 
        (h.technicians && Array.isArray(h.technicians) && h.technicians.some(t => t && ((activeTechnician.id && t.id === activeTechnician.id) || (t.fullName && activeTechName && t.fullName.toLowerCase().includes(activeTechName))))) ||
        (h.createdBy && activeTechName && h.createdBy.toLowerCase().includes(activeTechName));
      
      if (!isMyAct) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = 
          (h.handoverNumber || '').toLowerCase().includes(q) ||
          (h.customerName || '').toLowerCase().includes(q) ||
          (h.installationAddress || '').toLowerCase().includes(q) ||
          (h.projectName || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [handovers, activeTechnician, activeTechName, searchQuery]);

  // 5. Filter service tickets for this technician
  const myServiceTickets = useMemo(() => {
    if (!activeTechnician) return [];

    return (serviceTickets || []).filter(t => {
      if (!t) return false;
      const isMyTicket = 
        (t.assignedTechnicianName && activeTechName && t.assignedTechnicianName.toLowerCase().includes(activeTechName)) ||
        (currentUser?.systemRole === 'admin' || currentUser?.systemRole === 'manager');

      if (!isMyTicket) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = 
          (t.ticketNumber || '').toLowerCase().includes(q) ||
          (t.customerName || '').toLowerCase().includes(q) ||
          (t.productName || '').toLowerCase().includes(q) ||
          (t.serialNumber || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [serviceTickets, activeTechnician, activeTechName, searchQuery, currentUser]);

  // Helper to test if a date string falls inside the chosen earningsPeriod
  const checkDateInPeriod = (dateInput?: string, period: EarningsPeriod = 'all', startStr?: string, endStr?: string): boolean => {
    if (period === 'all') return true;
    if (!dateInput) return false;

    let d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      const clean = dateInput.trim();
      const parts = clean.split(/[\s,T]+/)[0]?.split(/[./-]/);
      if (parts && parts.length === 3) {
        if (parts[0].length === 4) {
          d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      }
    }
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (period === 'today') {
      return d >= todayStart && d <= todayEnd;
    }

    if (period === 'yesterday') {
      const yStart = new Date(todayStart);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(todayEnd);
      yEnd.setDate(yEnd.getDate() - 1);
      return d >= yStart && d <= yEnd;
    }

    if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      return d >= monday && d <= todayEnd;
    }

    if (period === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return d >= monthStart && d <= todayEnd;
    }

    if (period === 'custom') {
      if (startStr) {
        const cStart = new Date(startStr + 'T00:00:00');
        if (!isNaN(cStart.getTime()) && d < cStart) return false;
      }
      if (endStr) {
        const cEnd = new Date(endStr + 'T23:59:59');
        if (!isNaN(cEnd.getTime()) && d > cEnd) return false;
      }
      return true;
    }

    return true;
  };

  // Filtered earnings jobs & handovers based on period
  const filteredEarningsJobs = useMemo(() => {
    return assignedActiveJobs.filter(order => checkDateInPeriod(order.createdAt || order.completedAt || order.startedAt, earningsPeriod, customStartDate, customEndDate));
  }, [assignedActiveJobs, earningsPeriod, customStartDate, customEndDate]);

  const filteredEarningsHandovers = useMemo(() => {
    return myHandovers.filter(h => checkDateInPeriod(h.createdAt, earningsPeriod, customStartDate, customEndDate));
  }, [myHandovers, earningsPeriod, customStartDate, customEndDate]);

  // Calculate Period-specific Earnings and KPI Statistics
  const periodStats = useMemo(() => {
    let totalWagesUSD = 0;
    let totalWagesUZS = 0;
    let totalCamerasInstalled = 0;
    let totalRatingSum = 0;
    let ratingsCount = 0;

    filteredEarningsHandovers.forEach(h => {
      if (h?.clientRating) {
        totalRatingSum += h.clientRating;
        ratingsCount++;
      }
      if (h?.installedItems && Array.isArray(h.installedItems)) {
        h.installedItems.forEach(it => {
          if (it?.productName && (it.productName.toLowerCase().includes('kamera') || it.productName.toLowerCase().includes('camera'))) {
            totalCamerasInstalled += (it.quantity || 1);
          }
        });
      }
    });

    filteredEarningsJobs.forEach(order => {
      if (order?.technicians && Array.isArray(order.technicians)) {
        const myAssignment = order.technicians.find(t => 
          t && ((activeTechnician?.id && t.id === activeTechnician.id) || 
          (t.fullName && activeTechnician?.fullName && t.fullName.toLowerCase().includes(activeTechnician.fullName.toLowerCase())))
        );
        if (myAssignment) {
          totalWagesUSD += myAssignment.wageUSD || 0;
          totalWagesUZS += myAssignment.wageUZS || (myAssignment.wageUSD ? Math.round(myAssignment.wageUSD * exchangeRate) : 0);
        }
      }
    });

    const averageRating = ratingsCount > 0 ? (totalRatingSum / ratingsCount).toFixed(1) : '5.0';

    return {
      totalWagesUSD,
      totalWagesUZS,
      totalCamerasInstalled,
      averageRating,
      jobsCount: filteredEarningsJobs.length
    };
  }, [filteredEarningsJobs, filteredEarningsHandovers, activeTechnician, exchangeRate]);

  // Start job handler (Montajni boshlash)
  const handleStartJob = (order: CustomerOrder) => {
    const startTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedOrder: CustomerOrder = {
      ...order,
      status: 'in_progress',
      startedAt: order.startedAt || startTime
    };
    if (onSaveOrder) {
      onSaveOrder(updatedOrder);
    }
    if (activeTechnician && onUpdateEmployeeStatus) {
      onUpdateEmployeeStatus(activeTechnician.id, 'on_site');
    }
    setExpandedJobIds(prev => ({ ...prev, [order.id]: true }));
    setMainTab('in_progress');
  };

  // Status Change handler
  const handleStatusChange = (newStatus: 'active' | 'on_site' | 'on_leave') => {
    if (activeTechnician && onUpdateEmployeeStatus) {
      onUpdateEmployeeStatus(activeTechnician.id, newStatus);
    }
  };

  // Avatar Upload Handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const res = await compressImage(file, 400, 400, 0.8);
      setProfileAvatar(res.dataUrl);
      setIsUploadingAvatar(false);
    } catch (err) {
      console.error("Avatar yuklashda xatolik:", err);
      setIsUploadingAvatar(false);
    }
  };

  // Save Profile Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTechnician || !onUpdateEmployee) return;

    const updatedEmp: Employee = {
      ...activeTechnician,
      fullName: profileFullName.trim() || activeTechnician.fullName,
      phone: profilePhone.trim() || activeTechnician.phone,
      avatar: profileAvatar,
      password: profilePassword,
      pin: profilePin
    };

    onUpdateEmployee(updatedEmp);
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3000);
  };

  // Status styling badge helper
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'on_site':
        return { label: 'Obyektda', bg: 'bg-amber-500', text: 'text-amber-300', dot: 'bg-amber-400' };
      case 'on_leave':
        return { label: "Ta'tilda", bg: 'bg-slate-500', text: 'text-slate-300', dot: 'bg-slate-400' };
      default:
        return { label: "Ishda (Bo'sh)", bg: 'bg-emerald-500', text: 'text-emerald-300', dot: 'bg-emerald-400 animate-pulse' };
    }
  };

  const currentStatusInfo = getStatusBadge(activeTechnician?.status);

  // Render Job Card Helper
  const renderJobCard = (order: CustomerOrder) => {
    const isExpanded = !!expandedJobIds[order.id];
    const address = order.deliveryAddress || 'Toshkent shahar';
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    const yandexMapsUrl = `https://yandex.uz/maps/?text=${encodeURIComponent(address)}`;
    
    const myWageAssignment = order.technicians?.find(t => 
      t && ((activeTechnician?.id && t.id === activeTechnician.id) || 
      (t.fullName && activeTechName && t.fullName.toLowerCase().includes(activeTechName)))
    );
    const myWageUSD = myWageAssignment?.wageUSD || 0;
    const myWageUZS = myWageAssignment?.wageUZS || (myWageUSD ? Math.round(myWageUSD * exchangeRate) : 0);
    const matchingHandover = (handovers || []).find(h => h && (h.orderNumber === order.orderNumber || (order.id && h.orderId === order.id)));
    const isPendingApproval = order.status === 'pending_cashier_approval';
    const isCompleted = order.status === 'completed' || !!matchingHandover;
    const isInProgress = order.status === 'in_progress' || (!!order.startedAt && !isCompleted);
    const isUnstarted = !isCompleted && !isInProgress && !isPendingApproval;

    return (
      <div
        key={order.id}
        className={`bg-slate-900 rounded-2xl border transition shadow-md overflow-hidden ${
          isPendingApproval 
            ? 'border-amber-500/80 bg-slate-900/90' 
            : isInProgress
            ? 'border-purple-500/80 bg-slate-900/95 ring-1 ring-purple-500/30'
            : isCompleted
            ? 'border-emerald-700/60 bg-slate-900'
            : 'border-sky-700/60'
        }`}
      >
        {/* COMPACT CARD HEADER (CLICK TO EXPAND) */}
        <div
          onClick={() => toggleJobExpanded(order.id)}
          className="p-3.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-850 transition select-none"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black font-mono text-purple-400 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800">
                #{order.orderNumber}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                isCompleted 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                  : isPendingApproval
                  ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                  : isInProgress
                  ? 'bg-purple-950 text-purple-300 border border-purple-800 animate-pulse'
                  : 'bg-sky-950 text-sky-300 border border-sky-800'
              }`}>
                {isCompleted 
                  ? '✓ Topshirilgan' 
                  : isPendingApproval 
                  ? '🟡 Kassa Tasdig\'i' 
                  : isInProgress 
                  ? `⚡ Montaj jarayonida (${order.startedAt || 'Boshlangan'})` 
                  : '⏳ Boshlanmagan'}
              </span>
            </div>

            <h3 className="text-xs font-black text-white mt-1 truncate">
              {order.projectName || 'Kuzatuv tizimi montaji'}
            </h3>

            <div className="text-[11px] text-slate-300 font-bold mt-0.5 truncate">
              👤 {order.customerName}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block font-semibold">Ish haqi:</span>
              <span className="text-xs font-black text-emerald-400 font-mono">
                ${myWageUSD > 0 ? myWageUSD : Number((myWageUZS / exchangeRate).toFixed(1))}
              </span>
            </div>

            <button
              type="button"
              className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* EXPANDABLE DETAILS (SMOOTH ACCORDION) */}
        {isExpanded && (
          <div className="p-3.5 bg-slate-950 border-t border-slate-800/80 space-y-3 animate-in fade-in zoom-in-95">
            {/* Customer Phone & 1-Tap Call */}
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Telefon:</span>
                <strong className="text-white text-xs">{order.customerPhone || 'Kiritilmagan'}</strong>
              </div>

              {order.customerPhone && (
                <a
                  href={`tel:${order.customerPhone.replace(/[^0-9+]/g, '')}`}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Qo&apos;ng&apos;iroq</span>
                </a>
              )}
            </div>

            {/* Address & 1-Tap Map Navigation Buttons */}
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-start gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span className="text-[11px] font-medium leading-tight">{address}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 font-bold text-[11px] flex items-center justify-center gap-1 border border-blue-800/60 transition"
                >
                  <Navigation className="w-3 h-3 text-blue-400" />
                  <span>Google Maps</span>
                </a>

                <a
                  href={yandexMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-bold text-[11px] flex items-center justify-center gap-1 border border-rose-800/60 transition"
                >
                  <Navigation className="w-3 h-3 text-rose-400" />
                  <span>Yandex Nav</span>
                </a>
              </div>
            </div>

            {/* Equipment Checklist */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Jihozlar &amp; Materiallar ({order.items.length} ta):
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {order.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Cpu className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="text-slate-200 truncate">{it.productName}</span>
                      </div>
                      <span className="font-mono font-bold text-cyan-400 shrink-0">
                        {it.quantity} {it.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons for 3 Stages */}
            <div className="space-y-2 pt-1">
              {/* STAGE 1: UNSTARTED - START JOB BUTTON */}
              {isUnstarted && (
                <button
                  type="button"
                  onClick={() => handleStartJob(order)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-98 animate-pulse"
                >
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>▶️ Ishni Boshlash (Obyektga Kirishish)</span>
                </button>
              )}

              {/* EXTRA ITEM / SERVICE ADDITION */}
              {!isCompleted && (
                <button
                  type="button"
                  onClick={() => {
                    setEstimateTargetOrder(order);
                    setIsOnSiteEstimateOpen(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>➕ Qo&apos;shimcha Jihoz / Hizmat Qo&apos;shish</span>
                </button>
              )}

              {/* STAGE 2: IN PROGRESS - COMPLETE & HANDOVER ACT */}
              {isInProgress && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedViewingHandover(null);
                    setSelectedHandoverOrder(order);
                    setIsHandoverModalOpen(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition active:scale-98"
                >
                  <Flag className="w-4 h-4 text-emerald-400" />
                  <span>🏁 Ishni Yakunlash &amp; Akt Tuzish (Foto &amp; E-Imzo)</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              )}

              {/* STAGE 3: COMPLETED - VIEW OFFICIAL ACT */}
              {isCompleted && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedViewingHandover(matchingHandover || null);
                    setSelectedHandoverOrder(order);
                    setIsHandoverModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-800 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>📜 Rasmiy Aktni Ko&apos;rish (PDF / Chop)</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full bg-slate-950 overflow-hidden antialiased select-none">
      
      {/* Top View Mode Switcher (Visible on desktop/tablets, hidden on mobile for native app feel) */}
      <div className="hidden sm:flex bg-slate-950/90 border-b border-slate-800/80 px-4 py-2 items-center justify-between shrink-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <HardHat className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-white tracking-wide">Usta Kabineti</span>
          <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold">
            Mobil App Rejimi
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* If Admin/Manager, allow switching technician */}
          {(currentUser?.systemRole === 'admin' || currentUser?.systemRole === 'manager') && techniciansList.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2 py-1 rounded-xl">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer"
              >
                {techniciansList.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.fullName} ({t.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Desktop / Mobile Switcher */}
          <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                deviceMode === 'mobile'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Smartfon (App)</span>
            </button>

            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                deviceMode === 'desktop'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Keng Ekran</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Wrapper (Responsive smartphone frame or full desktop width) */}
      <div className={`flex-1 min-h-0 flex justify-center overflow-hidden ${deviceMode === 'mobile' ? 'p-0 sm:p-4 bg-slate-950 sm:bg-slate-900/60' : 'p-2 sm:p-4'}`}>
        <div className={`flex flex-col h-full min-h-0 overflow-hidden bg-slate-950 transition-all duration-300 relative ${
          deviceMode === 'mobile' 
            ? 'w-full max-w-[460px] sm:rounded-[36px] sm:border-[5px] sm:border-slate-800 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10' 
            : 'w-full rounded-2xl border border-slate-800'
        }`}>

          {/* ======================================================== */}
          {/* 1. TECHNICIAN PROFILE HEADER CARD (PINNED AT TOP) */}
          {/* ======================================================== */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-br from-slate-900 via-purple-950/70 to-slate-900 border-b border-purple-900/30 text-white relative shrink-0 z-20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-600/30 shrink-0 relative">
                  {profileAvatar || activeTechnician?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileAvatar || activeTechnician?.avatar}
                      alt={activeTechnician?.fullName}
                      className="w-full h-full object-cover rounded-[14px]"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                      <HardHat className="w-6 h-6 text-purple-300" />
                    </div>
                  )}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${currentStatusInfo.dot}`} />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm sm:text-base font-black text-white tracking-tight leading-tight">
                      {activeTechnician?.fullName || 'Usta'}
                    </h2>
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{periodStats.averageRating}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-purple-300 font-medium">
                    {activeTechnician?.role || 'Montajchi Usta'} &bull; <span className="text-slate-400">{activeTechnician?.phone}</span>
                  </p>
                </div>
              </div>

              {/* Status Pill Indicator */}
              <div className="text-right">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[10px] font-bold">
                  <span className={`w-2 h-2 rounded-full ${currentStatusInfo.dot}`} />
                  <span className={currentStatusInfo.text}>{currentStatusInfo.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: BUYURTMALAR (ORDERS & NEW UNSTARTED JOBS) */}
          {/* ======================================================== */}
          {mainTab === 'orders' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-950">
              
              {/* Action: On-Site Estimate Button & Search Bar */}
              <div className="p-3 bg-slate-950 border-b border-slate-900 space-y-2 shrink-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEstimateTargetOrder(null);
                      setIsOnSiteEstimateOpen(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-98"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>➕ Joyida Yangi Smeta</span>
                    <span className="text-[9px] bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                      Kassaga
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsHddCalcOpen(true)}
                    className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition active:scale-98"
                  >
                    <HardDrive className="w-4 h-4 text-purple-200" />
                    <span>💾 CCTV HDD Kalkulyator</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buyurtma, mijoz yoki manzil..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
                  />
                </div>

                {/* Orders Sub-Filter Pills */}
                <div className="grid grid-cols-3 gap-1 pt-1 select-none">
                  <button
                    type="button"
                    onClick={() => setOrdersSubFilter('active_jobs')}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition text-center truncate ${
                      ordersSubFilter === 'active_jobs'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Yangi ({unstartedJobs.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrdersSubFilter('estimates')}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition text-center truncate ${
                      ordersSubFilter === 'estimates'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Smeta ({myEstimatesAndShipments.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrdersSubFilter('service_tasks')}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition text-center truncate ${
                      ordersSubFilter === 'service_tasks'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Servis ({myServiceTickets.length})
                  </button>
                </div>
              </div>

              {/* Scrollable Orders List Content */}
              <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-2.5 pb-24 overscroll-contain">
                
                {/* 1. YANGI / KUTILAYOTGAN BUYURTMALAR */}
                {ordersSubFilter === 'active_jobs' && (
                  <div className="space-y-2.5">
                    {unstartedJobs.length === 0 ? (
                      <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800/80 space-y-2">
                        <Package className="w-10 h-10 text-purple-400/60 mx-auto" />
                        <h3 className="text-sm font-bold text-white">Yangi kutilayotgan buyurtma yo&apos;q</h3>
                        <p className="text-xs text-slate-400">
                          Sizga yangi montaj biriktirilganda shu yerda paydo bo&apos;ladi.
                        </p>
                      </div>
                    ) : (
                      unstartedJobs.map(order => renderJobCard(order))
                    )}
                  </div>
                )}

                {/* 2. SMETALAR & OTGRUZKALAR LIST */}
                {ordersSubFilter === 'estimates' && (
                  <div className="space-y-2.5">
                    {myEstimatesAndShipments.length === 0 ? (
                      <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-2">
                        <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
                        <h3 className="text-sm font-bold text-white">Hisob-kitob smetalari topilmadi</h3>
                        <p className="text-xs text-slate-400">
                          &quot;➕ Joyida Yangi Smeta&quot; tugmasi orqali hisob-kitob tuzishingiz mumkin.
                        </p>
                      </div>
                    ) : (
                      myEstimatesAndShipments.map((order) => {
                        const isPendingApproval = order.status === 'pending_cashier_approval';
                        const isShipped = order.status === 'shipped';
                        const isCompleted = order.status === 'completed';

                        return (
                          <div
                            key={order.id}
                            className={`bg-slate-900 rounded-2xl border p-3.5 space-y-2.5 shadow-md ${
                              isPendingApproval ? 'border-amber-500/80 bg-slate-900/95' : 'border-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-black font-mono text-purple-400 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800">
                                    #{order.orderNumber}
                                  </span>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    isPendingApproval
                                      ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                                      : isShipped
                                      ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                      : isCompleted
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}>
                                    {isPendingApproval
                                      ? '🟡 Kassa Tasdig\'i Kutilmoqda'
                                      : isShipped
                                      ? '✓ Kassadan Chiqarildi (Otgruzka)'
                                      : isCompleted
                                      ? '✓ Bajarildi va Topshirildi'
                                      : order.status}
                                  </span>
                                </div>
                                <h4 className="text-xs font-black text-white mt-1">
                                  {order.projectName || 'Smeta / Obyekt'}
                                </h4>
                                <span className="text-[11px] text-slate-300 block">👤 {order.customerName}</span>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block">Jami summa:</span>
                                <strong className="text-xs font-black text-white font-mono block">
                                  ${order.totalAmountUSD || Number((order.totalAmount / exchangeRate).toFixed(1))}
                                </strong>
                              </div>
                            </div>

                            {/* Items count & summary */}
                            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] flex items-center justify-between text-slate-300">
                              <span>📦 {order.items.length} xil mahsulot / xizmat</span>
                              <span className="font-mono text-slate-400">{formatNumberWithSpaces(order.totalAmount)} so&apos;m</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 3. SERVIS ARIZALARI */}
                {ordersSubFilter === 'service_tasks' && (
                  <div className="space-y-2.5">
                    {myServiceTickets.length === 0 ? (
                      <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800">
                        <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        <h3 className="text-sm font-bold text-white">Servis arizalari yo&apos;q</h3>
                        <p className="text-xs text-slate-400 mt-1">Kafolatli ta&apos;mir buyurtmalari bu yerda ko&apos;rinadi.</p>
                      </div>
                    ) : (
                      myServiceTickets.map((t) => (
                        <div
                          key={t.id}
                          className="bg-slate-900 rounded-2xl border border-slate-800 p-3.5 shadow-md space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                                #{t.ticketNumber}
                              </span>
                              <h4 className="text-xs font-black text-white mt-1">{t.productName}</h4>
                              <span className="text-[10px] font-mono text-slate-400">S/N: {t.serialNumber}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                              {t.status === 'received' ? 'Qabul qilindi' : 'Diagnostika'}
                            </span>
                          </div>

                          <div className="p-2.5 bg-slate-950 rounded-xl text-xs space-y-1 border border-slate-800">
                            <div className="text-slate-300">👤 {t.customerName} ({t.customerPhone})</div>
                            <div className="text-rose-400 font-medium">⚠️ {t.issueDescription}</div>
                          </div>

                          {t.customerPhone && (
                            <a
                              href={`tel:${t.customerPhone.replace(/[^0-9+]/g, '')}`}
                              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Mijozga Qo&apos;ng&apos;iroq Qilish</span>
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: JARAYONDA (IN-PROGRESS ON-SITE JOBS) */}
          {/* ======================================================== */}
          {mainTab === 'in_progress' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-950">
              <div className="p-3 bg-slate-950 border-b border-slate-900 space-y-1 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
                    Montaj Jarayonidagi Obyektlar
                  </span>
                  <span className="text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full">
                    {inProgressJobs.length} ta faol
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ushbu obyektlarda ish boshlangan. Ish yakunlangach &quot;Akt Tuzish&quot;ni bosing.
                </p>
              </div>

              <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-2.5 pb-24 overscroll-contain">
                {inProgressJobs.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
                    <Activity className="w-10 h-10 text-purple-400/50 mx-auto" />
                    <h3 className="text-sm font-bold text-white">Hozirda montaj jarayonida ish yo&apos;q</h3>
                    <p className="text-xs text-slate-400">
                      &quot;Buyurtmalar&quot; bo&apos;limiga o&apos;tib, yangi biriktirilgan obyektda &quot;▶️ Ishni Boshlash&quot; tugmasini bosing.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMainTab('orders')}
                      className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                    >
                      Buyurtmalarga O&apos;tish
                    </button>
                  </div>
                ) : (
                  inProgressJobs.map(order => renderJobCard(order))
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: TOPSHIRILGAN ISHLAR (COMPLETED HANDOVERS & ACTS) */}
          {/* ======================================================== */}
          {mainTab === 'completed' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-950">
              <div className="p-3 bg-slate-950 border-b border-slate-900 space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Topshirilgan Ishlar va Aktlar
                  </span>
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    {myHandovers.length} ta akt
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Akt raqami, mijoz yoki manzil..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-2.5 pb-24 overscroll-contain">
                {myHandovers.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-1" />
                    <h3 className="text-sm font-bold text-white">Topshirilgan aktlar yo&apos;q</h3>
                    <p className="text-xs text-slate-400">
                      Obyektni topshirib mijozdan elektron imzo olganingizdan so&apos;ng aktlar shu yerda saqlanadi.
                    </p>
                  </div>
                ) : (
                  myHandovers.map((h) => (
                    <div
                      key={h.id}
                      className="bg-slate-900 rounded-2xl border border-slate-800 p-3.5 space-y-2 shadow-md hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                              #{h.handoverNumber}
                            </span>
                            <span className="text-[10px] text-slate-400">{h.createdAt?.split('T')[0] || h.createdAt}</span>
                          </div>
                          <h4 className="text-xs font-black text-white mt-1">
                            {h.projectName || 'Kuzatuv tizimi montaji'}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">👤 {h.customerName} &bull; 📍 {h.installationAddress}</p>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          ⭐ {h.clientRating}/5
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedViewingHandover(h);
                          setIsHandoverModalOpen(true);
                        }}
                        className="w-full py-2.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-purple-800 transition active:scale-98"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>📜 Rasmiy Dalolatnomani Ochish (PDF / Chop)</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: PROFIL & DAROMAD (PROFILE & EARNINGS WITH TIME FILTER) */}
          {/* ======================================================== */}
          {mainTab === 'profile' && (
            <div className="flex-1 min-h-0 p-3 sm:p-5 overflow-y-auto space-y-5 pb-28 bg-slate-950 overscroll-contain">
              
              {/* Profile Save Toast */}
              {profileSavedToast && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>✓ Profil ma&apos;lumotlaringiz muvaffaqiyatli saqlandi!</span>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION A: DAROMAD VA KPI STATISTIKASI (VAQT FILTRI BILAN) */}
              {/* ======================================================== */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Mening Daromadim &amp; Ish Haqi
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-purple-400" />
                    Vaqt Filtrlari
                  </span>
                </div>

                {/* Interactive Time Period Selector Pills */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 select-none bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEarningsPeriod('today')}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition text-center truncate ${
                      earningsPeriod === 'today'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Bugun
                  </button>

                  <button
                    type="button"
                    onClick={() => setEarningsPeriod('yesterday')}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition text-center truncate ${
                      earningsPeriod === 'yesterday'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Kecha
                  </button>

                  <button
                    type="button"
                    onClick={() => setEarningsPeriod('week')}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition text-center truncate ${
                      earningsPeriod === 'week'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Shu hafta
                  </button>

                  <button
                    type="button"
                    onClick={() => setEarningsPeriod('month')}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition text-center truncate ${
                      earningsPeriod === 'month'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Shu oy
                  </button>

                  <button
                    type="button"
                    onClick={() => setEarningsPeriod('all')}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition text-center truncate ${
                      earningsPeriod === 'all'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Barchasi
                  </button>

                  <button
                    type="button"
                    onClick={() => setEarningsPeriod('custom')}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition text-center truncate flex items-center justify-center gap-1 ${
                      earningsPeriod === 'custom'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Oraliq</span>
                  </button>
                </div>

                {/* Custom Date Inputs (If custom period selected) */}
                {earningsPeriod === 'custom' && (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 animate-in fade-in">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Dan (Boshlanish):</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Gacha (Tugash):</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Gradient KPI Earnings Banner */}
                <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-300 uppercase font-bold tracking-wide">
                      Tanlangan Davr Ish Haqi:
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800">
                      {earningsPeriod === 'today' ? 'Bugun' : earningsPeriod === 'yesterday' ? 'Kecha' : earningsPeriod === 'week' ? 'Shu hafta' : earningsPeriod === 'month' ? 'Shu oy' : earningsPeriod === 'custom' ? 'Tanlangan sana' : 'Barcha vaqt'}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                      ${periodStats.totalWagesUSD}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-300 font-mono font-semibold">
                      ≈ {formatNumberWithSpaces(periodStats.totalWagesUZS)} so&apos;m
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs text-slate-300">
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 text-center">
                      <span className="text-[10px] text-slate-400 block">Nuqtalar</span>
                      <strong className="text-white font-bold">{periodStats.totalCamerasInstalled} ta</strong>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 text-center">
                      <span className="text-[10px] text-slate-400 block">Baholar</span>
                      <strong className="text-amber-400 font-bold">⭐ {periodStats.averageRating}</strong>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 text-center">
                      <span className="text-[10px] text-slate-400 block">Obyektlar</span>
                      <strong className="text-cyan-400 font-bold">{periodStats.jobsCount} ta</strong>
                    </div>
                  </div>
                </div>

                {/* Period Breakdown of Objects */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block px-1">
                    Ushbu davrdagi obyektlar ({filteredEarningsJobs.length} ta):
                  </span>
                  {filteredEarningsJobs.length === 0 ? (
                    <div className="p-4 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-xs text-slate-400">
                      Ushbu tanlangan davrda daromadlar mavjud emas.
                    </div>
                  ) : (
                    filteredEarningsJobs.map((order) => {
                      const myWageAssignment = order.technicians?.find(t => 
                        t && ((activeTechnician?.id && t.id === activeTechnician.id) || 
                        (t.fullName && activeTechName && t.fullName.toLowerCase().includes(activeTechName)))
                      );
                      const wageUSD = myWageAssignment?.wageUSD || 0;
                      return (
                        <div key={order.id} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-white block">#{order.orderNumber} - {order.customerName}</strong>
                            <span className="text-[10px] text-slate-400">{order.projectName || 'Kuzatuv montaji'} &bull; {order.createdAt?.split('T')[0] || ''}</span>
                          </div>
                          <span className="font-mono font-black text-emerald-400 text-sm">${wageUSD}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ======================================================== */}
              {/* SECTION B: USTA SHAXSIY MA'LUMOTLARINI TAHRIRLASH */}
              {/* ======================================================== */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 px-1">
                  <User className="w-4 h-4 text-purple-400" />
                  Shaxsiy Ma&apos;lumotlar &amp; Sozlamalar
                </span>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Avatar Photo Upload / Edit */}
                  <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex flex-col items-center gap-3">
                    <div className="relative w-24 h-24 rounded-full bg-slate-800 p-1 border-2 border-purple-500/50 shadow-xl overflow-hidden group">
                      {profileAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profileAvatar}
                          alt="Usta surati"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-purple-400">
                          <HardHat className="w-10 h-10" />
                        </div>
                      )}

                      {profileAvatar && (
                        <button
                          type="button"
                          onClick={() => setProfileAvatar('')}
                          className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow hover:bg-rose-500"
                          title="Suratni o'chirish"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-md transition active:scale-95">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isUploadingAvatar ? 'Yuklanmoqda...' : 'Suratni o\'zgartirish (Kamera / Galereya)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Form Fields: Full Name, Phone, Role */}
                  <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Ism va Familiya (F.I.Sh.):
                      </label>
                      <input
                        type="text"
                        required
                        value={profileFullName}
                        onChange={(e) => setProfileFullName(e.target.value)}
                        placeholder="Masalan: Jamshid Normurodov"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Telefon raqami:
                      </label>
                      <input
                        type="text"
                        required
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Mutaxassisligi / Lavozimi:
                      </label>
                      <input
                        type="text"
                        disabled
                        value={activeTechnician?.role || 'Montajchi Usta'}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 font-semibold outline-none cursor-not-allowed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-purple-400" />
                          <span>Parol:</span>
                        </label>
                        <input
                          type="text"
                          value={profilePassword}
                          onChange={(e) => setProfilePassword(e.target.value)}
                          placeholder="Parol"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-semibold outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-purple-400" />
                          <span>4 xonali PIN:</span>
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          value={profilePin}
                          onChange={(e) => setProfilePin(e.target.value)}
                          placeholder="Masalan: 2222"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-semibold outline-none focus:border-purple-500 text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Profile Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition active:scale-98"
                  >
                    <Save className="w-4 h-4" />
                    <span>💾 Profil Ma&apos;lumotlarini Saqlash</span>
                  </button>
                </form>

                {/* Quick HDD Tool in Profile */}
                <div
                  onClick={() => setIsHddCalcOpen(true)}
                  className="p-3.5 bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-800/50 rounded-2xl flex items-center justify-between cursor-pointer hover:border-purple-600 transition shadow-md group active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30 group-hover:scale-105 transition">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white group-hover:text-purple-300 transition">
                        💾 CCTV Qattiq Disk (HDD) Kalkulyatori
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Disk hajmi yoki arxiv kunini hisoblash (Hik/Dah/UNV/Tiandy/VIGI)
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* MOBILE BOTTOM NAVIGATION BAR: 4 TABS */}
          {/* [ BUYURTMALAR | JARAYONDA | TOPSHIRILGAN | PROFIL ] */}
          {/* ======================================================== */}
          <div className="shrink-0 sticky bottom-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 p-2 z-30 shadow-2xl">
            <div className="grid grid-cols-4 gap-1">
              
              {/* Tab 1: Buyurtmalar (New / Unstarted) */}
              <button
                type="button"
                onClick={() => setMainTab('orders')}
                className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition relative ${
                  mainTab === 'orders'
                    ? 'text-purple-400 bg-purple-950/70 border border-purple-800/40 font-bold shadow-md shadow-purple-950/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Package className="w-5 h-5" />
                <span className="text-[10px] font-semibold truncate">Buyurtmalar</span>
                {unstartedJobs.length > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 bg-purple-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow">
                    {unstartedJobs.length}
                  </span>
                )}
              </button>

              {/* Tab 2: Jarayonda (In Progress) */}
              <button
                type="button"
                onClick={() => setMainTab('in_progress')}
                className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition relative ${
                  mainTab === 'in_progress'
                    ? 'text-purple-400 bg-purple-950/70 border border-purple-800/40 font-bold shadow-md shadow-purple-950/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-5 h-5" />
                <span className="text-[10px] font-semibold truncate">Jarayonda</span>
                {inProgressJobs.length > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 bg-amber-500 text-slate-950 rounded-full text-[9px] font-bold flex items-center justify-center shadow animate-pulse">
                    {inProgressJobs.length}
                  </span>
                )}
              </button>

              {/* Tab 3: Topshirilgan (Completed) */}
              <button
                type="button"
                onClick={() => setMainTab('completed')}
                className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition relative ${
                  mainTab === 'completed'
                    ? 'text-emerald-400 bg-emerald-950/70 border border-emerald-800/40 font-bold shadow-md shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-[10px] font-semibold truncate">Topshirilgan</span>
                {myHandovers.length > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 bg-emerald-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow">
                    {myHandovers.length}
                  </span>
                )}
              </button>

              {/* Tab 4: Profil (Profile & Earnings) */}
              <button
                type="button"
                onClick={() => setMainTab('profile')}
                className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition relative ${
                  mainTab === 'profile'
                    ? 'text-purple-400 bg-purple-950/70 border border-purple-800/40 font-bold shadow-md shadow-purple-950/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-[10px] font-semibold truncate">Profil</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ON-SITE ESTIMATE BUILDER MODAL */}
      {/* ======================================================== */}
      {onSaveOrder && (
        <OnSiteEstimateModal
          isOpen={isOnSiteEstimateOpen}
          onClose={() => {
            setIsOnSiteEstimateOpen(false);
            setEstimateTargetOrder(null);
          }}
          products={products}
          customers={customers}
          activeTechnician={activeTechnician}
          orders={orders}
          exchangeRate={exchangeRate}
          baseCurrency={baseCurrency}
          targetOrder={estimateTargetOrder}
          onSaveOrder={onSaveOrder}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 2: HANDOVER & E-SIGNATURE ACT MODAL */}
      {/* ======================================================== */}
      <HandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => {
          setIsHandoverModalOpen(false);
          setSelectedHandoverOrder(null);
          setSelectedViewingHandover(null);
        }}
        order={selectedHandoverOrder}
        existingHandover={selectedViewingHandover}
        employees={employees}
        products={products}
        currentUser={currentUser}
        onSaveHandover={(handover) => {
          onSaveHandover(handover);
          setSelectedViewingHandover(handover);
        }}
      />

      {/* ======================================================== */}
      {/* MODAL 3: CCTV HDD STORAGE CALCULATOR */}
      {/* ======================================================== */}
      <HddCalculatorModal
        isOpen={isHddCalcOpen}
        onClose={() => setIsHddCalcOpen(false)}
      />
    </div>
  );
};
