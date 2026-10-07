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
import { 
  HardHat, 
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
  Check
} from 'lucide-react';

export type MainMobileTab = 'orders' | 'earnings' | 'profile';
export type OrdersSubFilter = 'active_jobs' | 'estimates' | 'completed_handovers' | 'service_tasks';

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
    return employees.filter(
      e => e.systemRole === 'technician' || 
      e.role.toLowerCase().includes('usta') || 
      e.role.toLowerCase().includes('muhandis') ||
      e.role.toLowerCase().includes('montaj')
    );
  }, [employees]);

  const [selectedTechId, setSelectedTechId] = useState<string>(() => {
    if (currentUser?.systemRole === 'technician') return currentUser.id;
    return techniciansList[0]?.id || currentUser?.id || 'emp-3';
  });

  const activeTechnician = useMemo(() => {
    return employees.find(e => e.id === selectedTechId) || currentUser || employees[0];
  }, [employees, selectedTechId, currentUser]);

  // Main Bottom Navigation Tab: 'orders' | 'earnings' | 'profile'
  const [mainTab, setMainTab] = useState<MainMobileTab>(() => {
    if (initialSubTab === 'earnings') return 'earnings';
    if (initialSubTab === 'profile') return 'profile';
    return 'orders';
  });

  // Orders Sub-Filter: 'active_jobs' | 'estimates' | 'completed_handovers' | 'service_tasks'
  const [ordersSubFilter, setOrdersSubFilter] = useState<OrdersSubFilter>(() => {
    if (initialSubTab === 'estimates') return 'estimates';
    if (initialSubTab === 'completed_handovers') return 'completed_handovers';
    if (initialSubTab === 'service_tasks') return 'service_tasks';
    return 'active_jobs';
  });

  // Sync initialSubTab changes from sidebar
  useEffect(() => {
    if (initialSubTab) {
      if (initialSubTab === 'earnings') {
        setMainTab('earnings');
      } else if (initialSubTab === 'profile') {
        setMainTab('profile');
      } else if (initialSubTab === 'estimates') {
        setMainTab('orders');
        setOrdersSubFilter('estimates');
      } else if (initialSubTab === 'completed_handovers') {
        setMainTab('orders');
        setOrdersSubFilter('completed_handovers');
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
      setProfileFullName(activeTechnician.fullName);
      setProfilePhone(activeTechnician.phone);
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

    return orders.filter(order => {
      const isAssigned = 
        (order.technicians && order.technicians.some(t => t.id === activeTechnician.id || t.fullName.toLowerCase().includes(activeTechnician.fullName.toLowerCase()))) ||
        order.technicianId === activeTechnician.id ||
        (order.technicianName && order.technicianName.toLowerCase().includes(activeTechnician.fullName.toLowerCase())) ||
        (order.requestedByTechnicianId === activeTechnician.id);
      
      if (!isAssigned) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          order.orderNumber.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          (order.projectName && order.projectName.toLowerCase().includes(q)) ||
          (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [orders, activeTechnician, searchQuery]);

  // 2. Filter all estimates & shipments (Hisob-kitob va Otgruzkalar)
  const myEstimatesAndShipments = useMemo(() => {
    if (!activeTechnician) return [];

    return orders.filter(order => {
      const isAssigned = 
        (order.technicians && order.technicians.some(t => t.id === activeTechnician.id || t.fullName.toLowerCase().includes(activeTechnician.fullName.toLowerCase()))) ||
        order.technicianId === activeTechnician.id ||
        (order.technicianName && order.technicianName.toLowerCase().includes(activeTechnician.fullName.toLowerCase())) ||
        (order.requestedByTechnicianId === activeTechnician.id) ||
        (currentUser?.systemRole === 'admin' || currentUser?.systemRole === 'manager');

      if (!isAssigned) return false;

      // Status filter
      if (estimateStatusFilter === 'pending' && order.status !== 'pending_cashier_approval') return false;
      if (estimateStatusFilter === 'shipped' && order.status !== 'shipped') return false;
      if (estimateStatusFilter === 'completed' && order.status !== 'completed') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          order.orderNumber.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          (order.projectName && order.projectName.toLowerCase().includes(q)) ||
          (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [orders, activeTechnician, estimateStatusFilter, searchQuery, currentUser]);

  // 3. Filter completed handovers/acts for this technician
  const myHandovers = useMemo(() => {
    if (!activeTechnician) return [];

    return handovers.filter(h => {
      const isMyAct = 
        (h.technicians && h.technicians.some(t => t.id === activeTechnician.id || t.fullName.toLowerCase().includes(activeTechnician.fullName.toLowerCase()))) ||
        h.createdBy.toLowerCase().includes(activeTechnician.fullName.toLowerCase());
      
      if (!isMyAct) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          h.handoverNumber.toLowerCase().includes(q) ||
          h.customerName.toLowerCase().includes(q) ||
          h.installationAddress.toLowerCase().includes(q) ||
          (h.projectName ? h.projectName.toLowerCase().includes(q) : false);
        if (!match) return false;
      }

      return true;
    });
  }, [handovers, activeTechnician, searchQuery]);

  // 4. Filter service tickets for this technician
  const myServiceTickets = useMemo(() => {
    if (!activeTechnician) return [];

    return serviceTickets.filter(t => {
      const isMyTicket = 
        (t.assignedTechnicianName && t.assignedTechnicianName.toLowerCase().includes(activeTechnician.fullName.toLowerCase())) ||
        (currentUser?.systemRole === 'admin' || currentUser?.systemRole === 'manager');

      if (!isMyTicket) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          t.ticketNumber.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.productName.toLowerCase().includes(q) ||
          t.serialNumber.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [serviceTickets, activeTechnician, searchQuery, currentUser]);

  // 5. Calculate Earnings and KPI Statistics
  const stats = useMemo(() => {
    let totalWagesUSD = 0;
    let totalWagesUZS = 0;
    let totalCamerasInstalled = 0;
    let totalRatingSum = 0;
    let ratingsCount = 0;

    // From handovers
    myHandovers.forEach(h => {
      if (h.clientRating) {
        totalRatingSum += h.clientRating;
        ratingsCount++;
      }
      if (h.installedItems) {
        h.installedItems.forEach(it => {
          if (it.productName.toLowerCase().includes('kamera') || it.productName.toLowerCase().includes('camera')) {
            totalCamerasInstalled += it.quantity;
          }
        });
      }
    });

    // From shipments/orders wages
    assignedActiveJobs.forEach(order => {
      if (order.technicians) {
        const myAssignment = order.technicians.find(t => t.id === activeTechnician?.id || t.fullName.toLowerCase().includes(activeTechnician?.fullName.toLowerCase() || ''));
        if (myAssignment) {
          totalWagesUSD += myAssignment.wageUSD || 0;
          totalWagesUZS += myAssignment.wageUZS || (myAssignment.wageUSD ? Math.round(myAssignment.wageUSD * exchangeRate) : 0);
        }
      }
    });

    const averageRating = ratingsCount > 0 ? (totalRatingSum / ratingsCount).toFixed(1) : '5.0';
    const pendingApprovalCount = orders.filter(o => o.status === 'pending_cashier_approval' && (o.requestedByTechnicianId === activeTechnician?.id || o.technicianId === activeTechnician?.id)).length;

    return {
      activeCount: assignedActiveJobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled').length,
      pendingApprovalCount,
      completedHandoversCount: myHandovers.length,
      activeTicketsCount: myServiceTickets.filter(t => t.status !== 'returned_to_client' && t.status !== 'cancelled').length,
      totalWagesUSD,
      totalWagesUZS,
      totalCamerasInstalled,
      averageRating
    };
  }, [assignedActiveJobs, myHandovers, myServiceTickets, activeTechnician, exchangeRate, orders]);

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

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-y-auto antialiased">
      
      {/* Top View Mode Switcher (Desktop Preview Controller) */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
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
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2 py-1 rounded-xl">
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

          {/* Device Simulator Toggle */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                deviceMode === 'mobile'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mobil telefon formati"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Smartfon</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                deviceMode === 'desktop'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Keng ekran (Desktop) formati"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Keng</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container: Mobile Frame or Full Width */}
      <div className={`flex-1 flex justify-center p-0 sm:p-4 md:p-6 ${deviceMode === 'mobile' ? 'items-start' : 'items-stretch'}`}>
        
        {/* Smartphone Shell Frame */}
        <div className={`w-full transition-all duration-200 ${
          deviceMode === 'mobile'
            ? 'max-w-md bg-slate-950 sm:rounded-[36px] sm:border-[6px] sm:border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[640px] sm:my-2 relative'
            : 'w-full max-w-6xl space-y-5'
        }`}>

          {/* Smartphone Top Notch & Live Status Bar */}
          {deviceMode === 'mobile' && (
            <div className="bg-slate-950 px-5 pt-3 pb-2 flex items-center justify-between text-[11px] text-slate-400 font-semibold select-none border-b border-slate-900">
              <span className="font-mono text-white font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500/80 mr-1 animate-pulse" />
                <span className="text-[9px] text-purple-300 font-bold uppercase tracking-wider">SMART USTA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-400 font-bold">5G</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. TECHNICIAN PROFILE HEADER CARD & LIVE STATUS */}
          {/* ======================================================== */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-purple-950/70 to-slate-900 border-b border-purple-900/30 text-white relative">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-600/30 shrink-0 relative">
                  {profileAvatar || activeTechnician?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileAvatar || activeTechnician?.avatar}
                      alt={activeTechnician?.fullName}
                      className="w-full h-full object-cover rounded-[14px]"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                      <HardHat className="w-7 h-7 text-purple-300" />
                    </div>
                  )}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${currentStatusInfo.dot}`} />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-black text-white tracking-tight leading-tight">
                      {activeTechnician?.fullName || 'Usta'}
                    </h2>
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{stats.averageRating}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-purple-300 font-medium">
                    {activeTechnician?.role || 'Montajchi Usta'} &bull; <span className="text-slate-400">{activeTechnician?.phone}</span>
                  </p>
                </div>
              </div>

              {/* Status Pill Indicator */}
              <div className="text-right">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold">
                  <span className={`w-2 h-2 rounded-full ${currentStatusInfo.dot}`} />
                  <span className={currentStatusInfo.text}>{currentStatusInfo.label}</span>
                </div>
              </div>
            </div>

            {/* Live Status Quick Toggles */}
            <div className="grid grid-cols-3 gap-1.5 mt-3.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => handleStatusChange('active')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                  activeTechnician?.status === 'active' || !activeTechnician?.status
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                <span>Ishda (Bo&apos;sh)</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('on_site')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                  activeTechnician?.status === 'on_site'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                <span>Obyektda</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('on_leave')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                  activeTechnician?.status === 'on_leave'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Ta&apos;tilda</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: BUYURTMALAR & OBYEKTLAR (ORDERS & JOBS) */}
          {/* ======================================================== */}
          {mainTab === 'orders' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
              
              {/* Action: On-Site Estimate Button & Search Bar */}
              <div className="p-3 bg-slate-950 border-b border-slate-900 space-y-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEstimateTargetOrder(null);
                    setIsOnSiteEstimateOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-98"
                >
                  <Calculator className="w-4 h-4" />
                  <span>➕ Joyida Yangi Smeta / Hisob-kitob Tuzish</span>
                  <span className="text-[9px] bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                    Kassaga
                  </span>
                </button>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Obyekt, smeta, mijoz yoki manzil..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
                  />
                </div>

                {/* Orders Sub-Filter Pills */}
                <div className="grid grid-cols-4 gap-1 pt-1 select-none">
                  <button
                    type="button"
                    onClick={() => setOrdersSubFilter('active_jobs')}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition text-center truncate ${
                      ordersSubFilter === 'active_jobs'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Obyektlar ({assignedActiveJobs.length})
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
                    onClick={() => setOrdersSubFilter('completed_handovers')}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition text-center truncate ${
                      ordersSubFilter === 'completed_handovers'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Aktlar ({myHandovers.length})
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
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 pb-24">
                
                {/* 1. FAOL OBYEKTLAR: COMPACT ACCORDION LIST (OYNA CHO'ZILIB KETMAYDI) */}
                {ordersSubFilter === 'active_jobs' && (
                  <div className="space-y-2.5">
                    {assignedActiveJobs.length === 0 ? (
                      <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800/80 space-y-2">
                        <HardHat className="w-10 h-10 text-purple-400/60 mx-auto" />
                        <h3 className="text-sm font-bold text-white">Hozirda faol obyekt yo&apos;q</h3>
                        <p className="text-xs text-slate-400">
                          Sizga yangi montaj biriktirilganda shu yerda ixcham kartochka sifatida paydo bo&apos;ladi.
                        </p>
                      </div>
                    ) : (
                      assignedActiveJobs.map((order) => {
                        const isExpanded = !!expandedJobIds[order.id];
                        const address = order.deliveryAddress || 'Toshkent shahar';
                        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
                        const yandexMapsUrl = `https://yandex.uz/maps/?text=${encodeURIComponent(address)}`;
                        
                        const myWageAssignment = order.technicians?.find(t => t.id === activeTechnician?.id || t.fullName.toLowerCase().includes(activeTechnician?.fullName.toLowerCase() || ''));
                        const myWageUSD = myWageAssignment?.wageUSD || 0;
                        const myWageUZS = myWageAssignment?.wageUZS || (myWageUSD ? Math.round(myWageUSD * exchangeRate) : 0);
                        const matchingHandover = handovers.find(h => h.orderNumber === order.orderNumber || (order.id && h.orderId === order.id));
                        const isPendingApproval = order.status === 'pending_cashier_approval';

                        return (
                          <div
                            key={order.id}
                            className={`bg-slate-900 rounded-2xl border transition shadow-md overflow-hidden ${
                              isPendingApproval ? 'border-amber-500/80 bg-slate-900/90' : 'border-slate-800'
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
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                    matchingHandover 
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                                      : isPendingApproval
                                      ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                                      : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                  }`}>
                                    {matchingHandover ? '✓ Topshirilgan' : isPendingApproval ? '🟡 Kassa Tasdig\'i' : 'Montaj jarayonida'}
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

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-1">
                                  {!matchingHandover && (
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

                                  {matchingHandover ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedViewingHandover(matchingHandover);
                                        setSelectedHandoverOrder(order);
                                        setIsHandoverModalOpen(true);
                                      }}
                                      className="w-full py-3 px-4 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-800 transition"
                                    >
                                      <FileText className="w-4 h-4" />
                                      <span>Rasmiy Aktni Ko&apos;rish (PDF / Chop)</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedViewingHandover(null);
                                        setSelectedHandoverOrder(order);
                                        setIsHandoverModalOpen(true);
                                      }}
                                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition active:scale-98"
                                    >
                                      <Camera className="w-4 h-4" />
                                      <span>📸 Obyektni Topshirish (Foto &amp; E-Imzo)</span>
                                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
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
                          Yuqoridagi <strong>&quot;Joyida Yangi Smeta&quot;</strong> tugmasi orqali hisoblab bering.
                        </p>
                      </div>
                    ) : (
                      myEstimatesAndShipments.map((order) => {
                        const matchingAct = handovers.find(h => h.orderNumber === order.orderNumber || (order.id && h.orderId === order.id));
                        return (
                          <div
                            key={order.id}
                            className="bg-slate-900 rounded-2xl border border-slate-800 p-3.5 shadow-md space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-black font-mono text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800">
                                  #{order.orderNumber}
                                </span>
                                <h4 className="text-xs font-black text-white mt-1">
                                  {order.projectName || 'Obyekt Smeta Hisob-kitobi'}
                                </h4>
                                <div className="text-[11px] text-slate-300 font-bold mt-0.5">
                                  👤 {order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ''}
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-xs font-black text-emerald-400 font-mono block">
                                  ${order.totalAmountUSD || Number((order.totalAmount / exchangeRate).toFixed(1))}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {formatNumberWithSpaces(order.totalAmount)} so&apos;m
                                </span>
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                              <button
                                type="button"
                                onClick={() => {
                                  setEstimateTargetOrder(order);
                                  setIsOnSiteEstimateOpen(true);
                                }}
                                className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1"
                              >
                                <Plus className="w-3 h-3 text-amber-400" />
                                <span>Tahrirlash</span>
                              </button>

                              {matchingAct ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedViewingHandover(matchingAct);
                                    setSelectedHandoverOrder(order);
                                    setIsHandoverModalOpen(true);
                                  }}
                                  className="py-2 px-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 font-bold text-[11px] flex items-center justify-center gap-1"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Akt Ko&apos;rish</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedViewingHandover(null);
                                    setSelectedHandoverOrder(order);
                                    setIsHandoverModalOpen(true);
                                  }}
                                  className="py-2 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center justify-center gap-1"
                                >
                                  <Camera className="w-3 h-3" />
                                  <span>Topshirish (Akt)</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 3. TOPSHIRILGAN AKTLAR */}
                {ordersSubFilter === 'completed_handovers' && (
                  <div className="space-y-2.5">
                    {myHandovers.length === 0 ? (
                      <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800">
                        <CheckCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        <h3 className="text-sm font-bold text-white">Hozircha dalolatnomalar yo&apos;q</h3>
                        <p className="text-xs text-slate-400 mt-1">Obyekt topshirilgach dalolatnomalar shu yerda saqlanadi.</p>
                      </div>
                    ) : (
                      myHandovers.map((h) => (
                        <div
                          key={h.id}
                          className="bg-slate-900 rounded-2xl border border-slate-800 p-3.5 shadow-md space-y-2.5"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                                #{h.handoverNumber}
                              </span>
                              <h4 className="text-xs font-black text-white mt-1">{h.projectName}</h4>
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
                            className="w-full py-2.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-purple-800"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Rasmiy Dalolatnomani Ochish</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 4. SERVIS ARIZALARI */}
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
          {/* TAB 2: DAROMAD (EARNINGS) */}
          {/* ======================================================== */}
          {mainTab === 'earnings' && (
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 pb-24 bg-slate-950">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 px-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Ish Haqi va KPI Statistikasi
              </span>

              <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-2xl p-4 space-y-3 shadow-lg">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Jami Hisoblangan Ish Haqi:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400 font-mono">${stats.totalWagesUSD}</span>
                  <span className="text-xs text-slate-300 font-mono">≈ {formatNumberWithSpaces(stats.totalWagesUZS)} so&apos;m</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <div>📸 O&apos;rnatilgan nuqtalar: <strong className="text-white">{stats.totalCamerasInstalled} ta</strong></div>
                  <div>⭐ Mijozlar bahosi: <strong className="text-amber-400">{stats.averageRating} / 5</strong></div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block px-1">Obyektlar Bo&apos;yicha Taqsimot:</span>
                {assignedActiveJobs.map((order) => {
                  const myWageAssignment = order.technicians?.find(t => t.id === activeTechnician?.id || t.fullName.toLowerCase().includes(activeTechnician?.fullName.toLowerCase() || ''));
                  const wageUSD = myWageAssignment?.wageUSD || 0;
                  return (
                    <div key={order.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-white block">#{order.orderNumber} - {order.customerName}</strong>
                        <span className="text-[10px] text-slate-400">{order.projectName}</span>
                      </div>
                      <span className="font-mono font-black text-emerald-400 text-sm">${wageUSD}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: PROFIL (USTA SHAXSIY PROFILI & TAHRIRLASH) */}
          {/* ======================================================== */}
          {mainTab === 'profile' && (
            <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-4 pb-24 bg-slate-950">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 px-1">
                <User className="w-3.5 h-3.5 text-purple-400" />
                Usta Shaxsiy Profili &amp; Sozlamalar
              </span>

              {profileSavedToast && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>✓ Profil ma&apos;lumotlaringiz muvaffaqiyatli saqlandi!</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Avatar Photo Upload / Edit */}
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center gap-3">
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

                  <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-md transition active:scale-95">
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
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
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
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>💾 Profil Ma&apos;lumotlarini Saqlash</span>
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* MOBILE BOTTOM NAVIGATION BAR: 3 TABS (BUYURTMALAR, DAROMAD, PROFIL) */}
          {/* ======================================================== */}
          <div className="sticky bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 p-2 z-20">
            <div className="grid grid-cols-3 gap-1.5">
              
              {/* Tab 1: Buyurtmalar */}
              <button
                type="button"
                onClick={() => setMainTab('orders')}
                className={`py-2 px-2 rounded-xl flex flex-col items-center gap-1 transition relative ${
                  mainTab === 'orders'
                    ? 'text-purple-400 bg-purple-950/60 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-5 h-5" />
                <span className="text-[10px]">Buyurtmalar</span>
                {assignedActiveJobs.length > 0 && (
                  <span className="absolute top-1 right-4 w-4 h-4 bg-purple-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {assignedActiveJobs.length}
                  </span>
                )}
              </button>

              {/* Tab 2: Daromad */}
              <button
                type="button"
                onClick={() => setMainTab('earnings')}
                className={`py-2 px-2 rounded-xl flex flex-col items-center gap-1 transition relative ${
                  mainTab === 'earnings'
                    ? 'text-emerald-400 bg-emerald-950/60 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span className="text-[10px]">Daromad</span>
              </button>

              {/* Tab 3: Profil */}
              <button
                type="button"
                onClick={() => setMainTab('profile')}
                className={`py-2 px-2 rounded-xl flex flex-col items-center gap-1 transition relative ${
                  mainTab === 'profile'
                    ? 'text-purple-400 bg-purple-950/60 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-[10px]">Profil</span>
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
    </div>
  );
};
