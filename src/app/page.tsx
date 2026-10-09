'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ActiveTab, Product, Customer, SaleReceipt, AIInsight, Expense, ExpenseCategory, ProductCategory, Employee, CustomerOrder, ShipmentOrder, AssignedTechnician, PaymentDetails, CartItem, Currency, PurchaseInvoice, PurchasePaymentRecord, ServiceTicket, CustomerDebtPayment, ZReport, PayrollRecord, EmployeeAdvance, ObjectHandover, CrmLead, CrmObjectPassport, CrmReminder, DEFAULT_ROLE_TABS } from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_RECEIPTS, 
  INITIAL_AI_INSIGHTS, 
  INITIAL_EXPENSES, 
  INITIAL_EXPENSE_CATEGORIES, 
  INITIAL_PRODUCT_CATEGORIES, 
  INITIAL_EMPLOYEES, 
  INITIAL_CUSTOMER_ORDERS, 
  INITIAL_SHIPMENTS, 
  INITIAL_PURCHASES, 
  INITIAL_SERVICE_TICKETS, 
  INITIAL_CUSTOMER_DEBT_PAYMENTS, 
  INITIAL_PAYROLLS, 
  INITIAL_ADVANCES, 
  INITIAL_HANDOVERS,
  INITIAL_CRM_LEADS,
  INITIAL_CRM_OBJECTS,
  INITIAL_CRM_REMINDERS
} from '../data/mockData';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { POSScreen } from '../components/POSScreen';
import { DashboardScreen } from '../components/DashboardScreen';
import { InventoryScreen } from '../components/InventoryScreen';
import { CustomersScreen } from '../components/CustomersScreen';
import { ExpensesScreen } from '../components/ExpensesScreen';
import { AIAdvisorScreen } from '../components/AIAdvisorScreen';
import { SalesHistoryScreen } from '../components/SalesHistoryScreen';
import { EmployeesScreen } from '../components/EmployeesScreen';
import { OrdersAndShipmentsScreen } from '../components/OrdersAndShipmentsScreen';
import { WarrantyScreen } from '../components/WarrantyScreen';
import { SettingsScreen } from '../components/SettingsScreen';
import { TechnicianPortalScreen } from '../components/TechnicianPortalScreen';
import { FinancialReportsScreen } from '../components/FinancialReportsScreen';
import { CrmScreen } from '../components/CrmScreen';
import { ZReportModal } from '../components/ZReportModal';
import { CashierOrderApprovalModal } from '../components/CashierOrderApprovalModal';
import { LoginScreen } from '../components/LoginScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { getTelegramSettings, sendTelegramMessage, generateDailySalesReport } from '../utils/telegram';
import { isTodayDate, getNowFormatted } from '../utils/formatters';
import { playOrderNotificationSound } from '../utils/sound';
import { CheckCircle2, CloudLightning, X } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isSwitchUserModalOpen, setIsSwitchUserModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(INITIAL_PRODUCT_CATEGORIES);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [receipts, setReceipts] = useState<SaleReceipt[]>(INITIAL_RECEIPTS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(INITIAL_EXPENSE_CATEGORIES);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>(INITIAL_CUSTOMER_ORDERS);
  const [shipments, setShipments] = useState<ShipmentOrder[]>(INITIAL_SHIPMENTS);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(INITIAL_PURCHASES);
  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>(INITIAL_SERVICE_TICKETS);
  const [customerDebtPayments, setCustomerDebtPayments] = useState<CustomerDebtPayment[]>(INITIAL_CUSTOMER_DEBT_PAYMENTS);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(INITIAL_PAYROLLS);
  const [advances, setAdvances] = useState<EmployeeAdvance[]>(INITIAL_ADVANCES);
  const [handovers, setHandovers] = useState<ObjectHandover[]>(INITIAL_HANDOVERS);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>(INITIAL_AI_INSIGHTS);
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>(INITIAL_CRM_LEADS);
  const [crmObjectPassports, setCrmObjectPassports] = useState<CrmObjectPassport[]>(INITIAL_CRM_OBJECTS);
  const [crmReminders, setCrmReminders] = useState<CrmReminder[]>(INITIAL_CRM_REMINDERS);
  const [exchangeRate, setExchangeRate] = useState<number>(12850);
  const [baseCurrency, setBaseCurrency] = useState<Currency>('UZS');
  const [technicianSubTab, setTechnicianSubTab] = useState<string>('active_jobs');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isZReportOpen, setIsZReportOpen] = useState<boolean>(false);
  const [isGlobalApprovalModalOpen, setIsGlobalApprovalModalOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Ustalardan kelgan tasdiqlash kutilayotgan smetalar soni
  const pendingEstimatesCount = (customerOrders || []).filter(o => o.status === 'pending_cashier_approval').length;

  // 1. Dastur ochilganda kompyuterning lokal xotirasidan ma'lumotlarni yuklash
  useEffect(() => {
    try {
      const savedRate = localStorage.getItem('sc_exchange_rate');
      if (savedRate && !isNaN(Number(savedRate))) {
        setExchangeRate(Number(savedRate));
      }
      const savedCurrency = localStorage.getItem('sc_base_currency');
      if (savedCurrency === 'UZS' || savedCurrency === 'USD') {
        setBaseCurrency(savedCurrency);
      }
      const savedProducts = localStorage.getItem('sc_products');
      if (savedProducts) {
        try {
          const parsed: Product[] = JSON.parse(savedProducts);
          if (Array.isArray(parsed)) {
            setProducts(parsed);
          }
        } catch (e) {
          console.error("Failed to parse saved products", e);
        }
      } else {
        localStorage.setItem('sc_products', JSON.stringify(INITIAL_PRODUCTS));
        setProducts(INITIAL_PRODUCTS);
      }

      const savedCustomers = localStorage.getItem('sc_customers');
      if (savedCustomers) {
        try {
          const parsedCust = JSON.parse(savedCustomers);
          if (Array.isArray(parsedCust)) {
            setCustomers(parsedCust);
          }
        } catch (e) {
          console.error("Failed to parse saved customers", e);
        }
      } else {
        localStorage.setItem('sc_customers', JSON.stringify(INITIAL_CUSTOMERS));
        setCustomers(INITIAL_CUSTOMERS);
      }

      const savedReceipts = localStorage.getItem('sc_receipts');
      if (savedReceipts) {
        try {
          setReceipts(JSON.parse(savedReceipts));
        } catch (e) {}
      }

      const savedExpenses = localStorage.getItem('sc_expenses');
      if (savedExpenses) {
        try {
          setExpenses(JSON.parse(savedExpenses));
        } catch (e) {}
      }

      const savedCategories = localStorage.getItem('sc_categories');
      if (savedCategories) {
        try {
          setExpenseCategories(JSON.parse(savedCategories));
        } catch (e) {}
      }

      const savedProdCats = localStorage.getItem('sc_product_categories');
      if (savedProdCats) {
        try {
          setProductCategories(JSON.parse(savedProdCats));
        } catch (e) {}
      }

      const savedEmployees = localStorage.getItem('sc_employees');
      if (savedEmployees) {
        try {
          let parsedEmp: Employee[] = JSON.parse(savedEmployees);
          // Check if admin user is present and has username
          const hasAdmin = parsedEmp.some((e) => e.username === 'admin');
          if (!hasAdmin) {
            setEmployees(INITIAL_EMPLOYEES);
          } else {
            // Guarantee technician_portal is included for all technicians
            parsedEmp = parsedEmp.map((emp) => {
              if (emp.systemRole === 'technician' || (emp.role.toLowerCase().includes('usta') && emp.systemRole !== 'admin' && emp.systemRole !== 'manager')) {
                return { ...emp, allowedTabs: ['technician_portal'] as ActiveTab[] };
              }
              if (emp.systemRole === 'admin' || emp.systemRole === 'manager' || !emp.systemRole) {
                const tabs: ActiveTab[] = emp.allowedTabs ? [...emp.allowedTabs] : ([...DEFAULT_ROLE_TABS[emp.systemRole || 'admin']] as ActiveTab[]);
                if (!tabs.includes('financial_reports')) {
                  tabs.splice(1, 0, 'financial_reports');
                }
                if (!tabs.includes('crm')) {
                  tabs.splice(2, 0, 'crm');
                }
                if (!tabs.includes('technician_portal')) {
                  tabs.push('technician_portal');
                }
                return { ...emp, allowedTabs: tabs };
              } else if (emp.systemRole === 'cashier') {
                const tabs: ActiveTab[] = emp.allowedTabs ? [...emp.allowedTabs] : ([...DEFAULT_ROLE_TABS.cashier] as ActiveTab[]);
                if (!tabs.includes('crm')) {
                  tabs.unshift('crm');
                }
                return { ...emp, allowedTabs: tabs };
              }
              return emp;
            });
            setEmployees(parsedEmp);
          }
        } catch (e) {
          setEmployees(INITIAL_EMPLOYEES);
        }
      } else {
        setEmployees(INITIAL_EMPLOYEES);
      }

      const savedUser = localStorage.getItem('sc_current_user');
      if (savedUser) {
        try {
          let user: Employee = JSON.parse(savedUser);
          if (user.systemRole === 'technician' || (user.role.toLowerCase().includes('usta') && user.systemRole !== 'admin' && user.systemRole !== 'manager')) {
            user = { ...user, allowedTabs: ['technician_portal'] as ActiveTab[] };
            setActiveTab('technician_portal');
          } else if (user.systemRole === 'admin' || user.systemRole === 'manager' || !user.systemRole) {
            const tabs: ActiveTab[] = user.allowedTabs ? [...user.allowedTabs] : ([...DEFAULT_ROLE_TABS[user.systemRole || 'admin']] as ActiveTab[]);
            if (!tabs.includes('financial_reports')) {
              tabs.splice(1, 0, 'financial_reports');
            }
            if (!tabs.includes('crm')) {
              tabs.splice(2, 0, 'crm');
            }
            if (!tabs.includes('technician_portal')) {
              tabs.push('technician_portal');
            }
            user = { ...user, allowedTabs: tabs };
          } else if (user.systemRole === 'cashier') {
            const tabs: ActiveTab[] = user.allowedTabs ? [...user.allowedTabs] : ([...DEFAULT_ROLE_TABS.cashier] as ActiveTab[]);
            if (!tabs.includes('crm')) {
              tabs.unshift('crm');
            }
            user = { ...user, allowedTabs: tabs };
          }
          setCurrentUser(user);
        } catch (e) {
          console.error("User parse error", e);
        }
      }

      // One-time cleanup of old test orders and shipments
      const isOrdersPurged = localStorage.getItem('sc_orders_purged_v3');
      if (!isOrdersPurged) {
        localStorage.setItem('sc_customer_orders', JSON.stringify([]));
        localStorage.setItem('sc_shipments', JSON.stringify([]));
        localStorage.setItem('sc_handovers', JSON.stringify([]));
        localStorage.setItem('sc_orders_purged_v3', 'true');
        setCustomerOrders([]);
        setShipments([]);
        setHandovers([]);
      } else {
        const savedOrders = localStorage.getItem('sc_customer_orders');
        if (savedOrders) {
          try {
            setCustomerOrders(JSON.parse(savedOrders));
          } catch (e) {
            setCustomerOrders([]);
          }
        } else {
          setCustomerOrders([]);
        }

        const savedShipments = localStorage.getItem('sc_shipments');
        if (savedShipments) {
          try {
            setShipments(JSON.parse(savedShipments));
          } catch (e) {
            setShipments([]);
          }
        } else {
          setShipments([]);
        }
      }

      const savedPurchases = localStorage.getItem('sc_purchases');
      if (savedPurchases) setPurchases(JSON.parse(savedPurchases));

      const savedTickets = localStorage.getItem('sc_service_tickets');
      if (savedTickets) {
        try {
          const parsed = JSON.parse(savedTickets);
          if (Array.isArray(parsed)) {
            setServiceTickets(parsed);
          }
        } catch (e) {
          console.error("Service tickets parse error", e);
        }
      } else {
        localStorage.setItem('sc_service_tickets', JSON.stringify(INITIAL_SERVICE_TICKETS));
        setServiceTickets(INITIAL_SERVICE_TICKETS);
      }

      const savedDebtPayments = localStorage.getItem('sc_customer_debt_payments');
      if (savedDebtPayments) setCustomerDebtPayments(JSON.parse(savedDebtPayments));

      const savedPayrolls = localStorage.getItem('sc_payrolls');
      if (savedPayrolls) setPayrolls(JSON.parse(savedPayrolls));

      const savedAdvances = localStorage.getItem('sc_advances');
      if (savedAdvances) setAdvances(JSON.parse(savedAdvances));

      const savedHandovers = localStorage.getItem('sc_handovers');
      if (savedHandovers) setHandovers(JSON.parse(savedHandovers));

      const savedLeads = localStorage.getItem('sc_crm_leads');
      if (savedLeads) setCrmLeads(JSON.parse(savedLeads));

      const savedObjects = localStorage.getItem('sc_crm_objects');
      if (savedObjects) setCrmObjectPassports(JSON.parse(savedObjects));

      const savedReminders = localStorage.getItem('sc_crm_reminders');
      if (savedReminders) setCrmReminders(JSON.parse(savedReminders));
    } catch (e) {
      console.error("Local storage load error", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const lastSyncedTimestampRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);
  const lastLocalMutationsRef = useRef<Record<string, number>>({});

  const recordLocalMutation = (key: string) => {
    lastLocalMutationsRef.current[key] = Date.now();
  };

  const isLocalRecentlyMutated = (key: string) => {
    return (Date.now() - (lastLocalMutationsRef.current[key] || 0)) < 8000;
  };

  // Helper to push central snapshot to server
  const pushDataToCloud = async (overrideData?: any) => {
    try {
      const payload = {
        products,
        productCategories,
        customers,
        receipts,
        expenses,
        expenseCategories,
        employees,
        customerOrders,
        shipments,
        purchases,
        serviceTickets,
        customerDebtPayments,
        payrolls,
        advances,
        handovers,
        exchangeRate,
        baseCurrency,
        ...(overrideData || {})
      };
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.timestamp) {
          lastSyncedTimestampRef.current = json.timestamp;
        }
      }
    } catch (e) {
      console.warn('Cloud sync push error', e);
    }
  };

  // 2. Har bir o'zgarishni darhol kompyuter xotirasiga va bulutga yozib borish
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('sc_products', JSON.stringify(products));
      localStorage.setItem('sc_product_categories', JSON.stringify(productCategories));
      localStorage.setItem('sc_customers', JSON.stringify(customers));
      localStorage.setItem('sc_receipts', JSON.stringify(receipts));
      localStorage.setItem('sc_expenses', JSON.stringify(expenses));
      localStorage.setItem('sc_categories', JSON.stringify(expenseCategories));
      localStorage.setItem('sc_employees', JSON.stringify(employees));
      localStorage.setItem('sc_customer_orders', JSON.stringify(customerOrders));
      localStorage.setItem('sc_shipments', JSON.stringify(shipments));
      localStorage.setItem('sc_purchases', JSON.stringify(purchases));
      localStorage.setItem('sc_service_tickets', JSON.stringify(serviceTickets));
      localStorage.setItem('sc_customer_debt_payments', JSON.stringify(customerDebtPayments));
      localStorage.setItem('sc_payrolls', JSON.stringify(payrolls));
      localStorage.setItem('sc_advances', JSON.stringify(advances));
      localStorage.setItem('sc_handovers', JSON.stringify(handovers));
      localStorage.setItem('sc_base_currency', baseCurrency);

      // Push to central cloud sync
      pushDataToCloud();
    } catch (e) {
      console.error("Local storage save error", e);
    }
  }, [products, productCategories, customers, receipts, expenses, expenseCategories, employees, customerOrders, shipments, purchases, serviceTickets, customerDebtPayments, payrolls, advances, handovers, baseCurrency, isLoaded]);

  const syncFunctionRef = useRef<((force?: boolean) => Promise<void>) | null>(null);

  const handleForceSync = async () => {
    if (syncFunctionRef.current) {
      await syncFunctionRef.current(true);
      showToast("✓ Ma'lumotlar bulutdan yangilandi!");
    }
  };

  // 3. Real-time Cross-Device Cloud Sync Poller (Telefon va Kompyuter o'rtasida real-vaqtda sinxronizatsiya)
  useEffect(() => {
    if (!isLoaded) return;

    let isMounted = true;

    const syncWithCloud = async (force: boolean = false) => {
      if (isSyncingRef.current && !force) return;
      isSyncingRef.current = true;
      try {
        const res = await fetch('/api/sync', { cache: 'no-store' });
        if (!res.ok) {
          isSyncingRef.current = false;
          return;
        }
        const json = await res.json();
        
        // If server is empty, push local state to initialize server
        if (!json.data || !json.timestamp) {
          pushDataToCloud();
          isSyncingRef.current = false;
          return;
        }

        // If server has newer data or forced manual refresh
        if (force || json.timestamp > lastSyncedTimestampRef.current) {
          lastSyncedTimestampRef.current = json.timestamp;
          const remote = json.data;

          if (remote.customerOrders) {
            const rawOrders: CustomerOrder[] = remote.customerOrders;
            const deduped: CustomerOrder[] = [];
            const seenNums = new Set<string>();
            rawOrders.forEach(o => {
              const key = o.orderNumber || o.id;
              if (!seenNums.has(key)) {
                seenNums.add(key);
                deduped.push(o);
              }
            });

            setCustomerOrders(prevOrders => {
              const prevIds = new Set(prevOrders.map(o => o.id));
              const prevPendingIds = new Set(prevOrders.filter(o => o.status === 'pending_cashier_approval').map(o => o.id));

              // 1. Check if a new order was assigned to the currently logged in technician OR if their estimate was rejected
              if (currentUser?.systemRole === 'technician' || currentUser?.role?.toLowerCase().includes('usta')) {
                const newAssignedJob = deduped.find((o: any) => 
                  !prevIds.has(o.id) && (
                    o.technicianId === currentUser.id ||
                    (o.technicians && o.technicians.some((t: any) => t.id === currentUser.id || t.fullName?.toLowerCase().includes(currentUser.fullName.toLowerCase())))
                  )
                );
                if (newAssignedJob) {
                  playOrderNotificationSound();
                  showToast(`🔔 Yangi montaj topshirig'i keldi! (#${newAssignedJob.orderNumber})`);
                }

                // Check if any estimate created by or assigned to this technician was REJECTED by cashier
                const newlyRejectedEstimate = deduped.find((o: any) => {
                  const prevOrd = prevOrders.find((p: any) => p.id === o.id || p.orderNumber === o.orderNumber);
                  const isMyOrder = 
                    o.requestedByTechnicianId === currentUser.id ||
                    o.technicianId === currentUser.id ||
                    (o.requestedByTechnicianName && currentUser.fullName && o.requestedByTechnicianName.toLowerCase().includes(currentUser.fullName.toLowerCase())) ||
                    (o.technicianName && currentUser.fullName && o.technicianName.toLowerCase().includes(currentUser.fullName.toLowerCase()));
                  
                  return isMyOrder && o.status === 'rejected' && (!prevOrd || prevOrd.status === 'pending_cashier_approval');
                });

                if (newlyRejectedEstimate) {
                  playOrderNotificationSound();
                  showToast(`❌ Smetangiz (#${newlyRejectedEstimate.orderNumber}) kassir tomonidan rad etildi! Sabab: ${newlyRejectedEstimate.rejectionReason || "Sabab ko'rsatilmadi"}`);
                }
              }

              // 2. Check if a new on-site estimate was submitted by technician for cashier approval
              if (currentUser?.systemRole !== 'technician') {
                const newPendingEstimate = deduped.find((o: any) => 
                  o.status === 'pending_cashier_approval' && !prevPendingIds.has(o.id)
                );
                if (newPendingEstimate) {
                  playOrderNotificationSound();
                  showToast(`🔔 Usta ${newPendingEstimate.requestedByTechnicianName || newPendingEstimate.technicianName || 'Usta'} yangi smeta yubordi (#${newPendingEstimate.orderNumber})! Tasdiqlash uchun qo'ng'iroqchani bosing.`);
                }
              }

              return deduped;
            });
          }

          // Guard against stale server lambda snapshots overwriting fresh local changes
          if (remote.products && (!isLocalRecentlyMutated('products') || force)) {
            setProducts(remote.products);
          }
          if (remote.serviceTickets && (!isLocalRecentlyMutated('serviceTickets') || force)) {
            setServiceTickets(remote.serviceTickets);
          }
          if (remote.customers && (!isLocalRecentlyMutated('customers') || force)) {
            setCustomers(remote.customers);
          }
          if (remote.receipts && (!isLocalRecentlyMutated('receipts') || force)) {
            setReceipts(remote.receipts);
          }
          if (remote.expenses && (!isLocalRecentlyMutated('expenses') || force)) {
            setExpenses(remote.expenses);
          }
          if (remote.employees && (!isLocalRecentlyMutated('employees') || force)) {
            setEmployees(remote.employees);
          }
          if (remote.shipments) {
            const rawShipments: ShipmentOrder[] = remote.shipments;
            const dedupedShipments: ShipmentOrder[] = [];
            const seenShipNums = new Set<string>();
            rawShipments.forEach(s => {
              const key = s.shipmentNumber || s.id || s.orderId || s.orderNumber || '';
              if (!seenShipNums.has(key)) {
                seenShipNums.add(key);
                dedupedShipments.push(s);
              }
            });
            setShipments(dedupedShipments);
          }
          if (remote.purchases && (!isLocalRecentlyMutated('purchases') || force)) {
            setPurchases(remote.purchases);
          }
          if (remote.handovers && (!isLocalRecentlyMutated('handovers') || force)) {
            setHandovers(remote.handovers);
          }
          if (remote.customerDebtPayments && (!isLocalRecentlyMutated('customerDebtPayments') || force)) {
            setCustomerDebtPayments(remote.customerDebtPayments);
          }
          if (remote.payrolls && (!isLocalRecentlyMutated('payrolls') || force)) {
            setPayrolls(remote.payrolls);
          }
          if (remote.advances && (!isLocalRecentlyMutated('advances') || force)) {
            setAdvances(remote.advances);
          }
          if (remote.exchangeRate) setExchangeRate(remote.exchangeRate);
          if (remote.baseCurrency) setBaseCurrency(remote.baseCurrency);
        }
      } catch (err) {
        console.warn('Sync pull error:', err);
      } finally {
        if (isMounted) {
          isSyncingRef.current = false;
        }
      }
    };

    syncFunctionRef.current = syncWithCloud;

    // Initial sync
    syncWithCloud();

    // Fast polling every 2 seconds for real-time cross-device sync
    const intervalId = setInterval(() => syncWithCloud(), 2000);

    const onFocus = () => syncWithCloud(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithCloud(true);
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isLoaded, currentUser]);

  // 3. Avtomatik 23:59 da Z-Hisobotni yopish va Telegramga yuborish
  useEffect(() => {
    if (!isLoaded) return;

    const checkAutoCloseShift = async () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const todayKey = now.toISOString().split('T')[0];

      // Soat 23:59 ga yetganda
      if (hours === 23 && minutes >= 59) {
        const lastAutoCloseDate = localStorage.getItem('sc_last_auto_z_date');
        const manualClosedDate = localStorage.getItem('sc_today_z_closed_date');

        // Agar bugun hali na avtomat, na qo'lda yopilmagan bo'lsa
        if (lastAutoCloseDate !== todayKey && manualClosedDate !== todayKey) {
          const todayReceipts = receipts.filter(r => isTodayDate(r.createdAt));
          const todayExpenses = expenses.filter(e => isTodayDate(e.createdAt));

          const tgSettings = getTelegramSettings();
          let sentTelegram = false;

          if (tgSettings.botToken && tgSettings.chatId) {
            try {
              const reportHtml = generateDailySalesReport(
                receipts,
                expenses,
                exchangeRate,
                tgSettings.storeName || 'SMART CONTROL',
                'Chilonzor-1 Filiali',
                todayKey
              );
              const res = await sendTelegramMessage(tgSettings.botToken, tgSettings.chatId, reportHtml);
              sentTelegram = res.success;
            } catch (err) {
              console.error('Auto 23:59 telegram send error', err);
            }
          }

          // Arxivga avtomatik Z-Hisobot yozish
          const autoReport: ZReport = {
            id: `z-auto-${Date.now()}`,
            reportNumber: `Z-AUTO-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`,
            closedAt: `${todayKey} 23:59 (Avtomatik)`,
            cashierName: 'Avtomatik Tizim (23:59)',
            branchName: 'Chilonzor-1 Filiali',
            receiptsCount: todayReceipts.length,
            totalSalesUZS: todayReceipts.reduce((sum, r) => sum + r.totalAmount, 0),
            totalSalesUSD: todayReceipts.reduce((sum, r) => sum + (r.totalAmountUSD || (r.totalAmount / exchangeRate)), 0),
            cashUZS: todayReceipts.reduce((sum, r) => sum + (r.payments?.cash || 0), 0),
            cardUZS: todayReceipts.reduce((sum, r) => sum + (r.payments?.card || 0), 0),
            cashUSD: todayReceipts.reduce((sum, r) => sum + (r.payments?.cashUSD || 0), 0),
            debtUZS: todayReceipts.reduce((sum, r) => sum + (r.payments?.debt || 0), 0),
            cashbackUsedUZS: todayReceipts.reduce((sum, r) => sum + (r.payments?.cashbackUsed || 0), 0),
            expensesUZS: todayExpenses.reduce((sum, e) => sum + e.amount, 0),
            expectedCashUZS: 0,
            actualCashUZS: 0,
            differenceUZS: 0,
            sentToTelegram: sentTelegram,
            notes: '23:59 da tizim tomonidan avtomatik yopildi va Telegramga yuborildi.'
          };

          try {
            const existing = localStorage.getItem('sc_z_reports');
            const list = existing ? JSON.parse(existing) : [];
            list.unshift(autoReport);
            localStorage.setItem('sc_z_reports', JSON.stringify(list));
            localStorage.setItem('sc_last_auto_z_date', todayKey);
            localStorage.setItem('sc_today_z_closed_date', todayKey);
            showToast('23:59 — Kunlik smena avtomatik yopildi va Telegramga hisobot yuborildi!');
          } catch (e) {
            console.error('Failed to save auto z-report', e);
          }
        }
      }
    };

    const interval = setInterval(checkAutoCloseShift, 30000);
    checkAutoCloseShift();

    return () => clearInterval(interval);
  }, [isLoaded, receipts, expenses, exchangeRate]);

  // Offline receipts count
  const offlineReceipts = receipts.filter((r) => r.isOffline && !r.synced);
  const offlineCount = offlineReceipts.length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Global Escape key listener to close modals
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        setIsSwitchUserModalOpen(false);
        setIsZReportOpen(false);
        setIsGlobalApprovalModalOpen(false);
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Login handler
  const handleLoginSuccess = (emp: Employee) => {
    setCurrentUser(emp);
    try {
      localStorage.setItem('sc_current_user', JSON.stringify(emp));
    } catch (e) {
      console.error(e);
    }
    setIsSwitchUserModalOpen(false);

    // Switch to first allowed tab if current activeTab is not permitted
    const isTech = emp.systemRole === 'technician' || (emp.role.toLowerCase().includes('usta') && emp.systemRole !== 'admin' && emp.systemRole !== 'manager');
    if (isTech) {
      setActiveTab('technician_portal');
    } else {
      const allowed: ActiveTab[] = emp.allowedTabs && emp.allowedTabs.length > 0 
        ? emp.allowedTabs 
        : emp.systemRole 
        ? DEFAULT_ROLE_TABS[emp.systemRole] 
        : (['pos'] as ActiveTab[]);

      if (!allowed.includes(activeTab)) {
        setActiveTab((allowed[0] || 'pos') as ActiveTab);
      }
    }

    showToast(`Xush kelibsiz, ${emp.fullName}!`);
  };

  // Logout handler
  const handleLogout = () => {
    if (window.confirm("Tizimdan chiqishni tasdiqlaysizmi?")) {
      setCurrentUser(null);
      localStorage.removeItem('sc_current_user');
      setIsSwitchUserModalOpen(false);
      showToast("Tizimdan muvaffaqiyatli chiqildi");
    }
  };

  // Complete a sale
  const handleCompleteSale = (newReceipt: SaleReceipt) => {
    const finalReceipt: SaleReceipt = {
      ...newReceipt,
      cashierName: currentUser ? currentUser.fullName : (newReceipt.cashierName || 'Farrux A.')
    };

    // 1. Add receipt
    setReceipts((prev) => [finalReceipt, ...prev]);

    // 2. Decrement stock from products with S/N and Service logic
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = newReceipt.items.find((item) => item.product.id === prod.id);
        if (soldItem) {
          // O'rnatish va montaj xizmatlarida jismoniy ombor qoldig'i kamaytirilmaydi
          if (prod.isService) {
            return prod;
          }

          // Seriya raqamli mahsulot bo'lsa, sotilgan S/N lar ombordan chiqariladi
          if (prod.hasSerialNumber && soldItem.selectedSerialNumbers && soldItem.selectedSerialNumbers.length > 0) {
            const currentSerials = prod.serialNumbers || [];
            const remainingSerials = currentSerials.filter(
              (sn) => !soldItem.selectedSerialNumbers?.includes(sn)
            );
            return {
              ...prod,
              serialNumbers: remainingSerials,
              stockQuantity: remainingSerials.length
            };
          }

          const newQty = Math.max(0, prod.stockQuantity - soldItem.quantity);
          return { ...prod, stockQuantity: newQty };
        }
        return prod;
      })
    );

    // 3. Update customer cashback and purchases if customer selected
    if (newReceipt.customer) {
      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id === newReceipt.customer?.id) {
            const updatedCashback =
              cust.cashbackBalance -
              newReceipt.payments.cashbackUsed +
              newReceipt.cashbackEarned;
            const updatedPurchases = cust.totalPurchases + newReceipt.totalAmount;
            const debtDeltaUZS = newReceipt.payments.debt || (newReceipt.payments.debtUSD ? Math.round(newReceipt.payments.debtUSD * (newReceipt.exchangeRate || exchangeRate)) : 0);
            const debtDeltaUSD = newReceipt.payments.debtUSD || (newReceipt.payments.debt ? Number((newReceipt.payments.debt / (newReceipt.exchangeRate || exchangeRate)).toFixed(2)) : 0);
            const updatedDebt = cust.debtBalance + debtDeltaUZS;
            const updatedDebtUSD = Number(((cust.debtBalanceUSD || (cust.debtBalance > 0 ? cust.debtBalance / (newReceipt.exchangeRate || exchangeRate) : 0)) + debtDeltaUSD).toFixed(2));

            return {
              ...cust,
              cashbackBalance: Math.max(0, updatedCashback),
              totalPurchases: updatedPurchases,
              debtBalance: updatedDebt,
              debtBalanceUSD: updatedDebtUSD > 0 ? updatedDebtUSD : 0
            };
          }
          return cust;
        })
      );
    }

    // 4. Auto-create assigned active job/order for technician portal if technician or service is assigned
    const hasAssignedTech = (newReceipt.technicians && newReceipt.technicians.length > 0) || newReceipt.technicianId || newReceipt.items.some(i => i.product.isService);
    if (hasAssignedTech) {
      const posOrder: CustomerOrder = {
        id: `ord-pos-${newReceipt.id}`,
        orderNumber: `ORD-${newReceipt.receiptNumber}`,
        receiptId: newReceipt.id,
        organization: newReceipt.branchName || 'WST Namangan',
        warehouseName: 'Asosiy ombor',
        exchangeRate: newReceipt.exchangeRate || exchangeRate,
        customerId: newReceipt.customer?.id,
        customerName: newReceipt.customer?.fullName || 'Noma\'lum Mijoz',
        customerPhone: newReceipt.customer?.phone || '',
        deliveryAddress: newReceipt.installationAddress || '',
        projectName: newReceipt.customer ? `${newReceipt.customer.fullName} - Obyekt montaji` : 'Kassa Sotuv Montaji',
        items: newReceipt.items.map((it) => ({
          productId: it.product.id,
          productName: it.product.name,
          quantity: it.quantity,
          unit: it.product.unit || 'dona',
          unitPrice: it.appliedPrice,
          unitPriceUSD: it.appliedPriceUSD,
          discountPercent: it.discountPercent,
          totalPrice: it.appliedPrice * it.quantity,
          hasSerialNumber: it.product.hasSerialNumber,
          selectedSerialNumbers: it.selectedSerialNumbers,
          isService: it.product.isService
        })),
        subtotal: newReceipt.subtotal,
        discountTotal: newReceipt.discountTotal,
        totalAmount: newReceipt.totalAmount,
        totalAmountUSD: newReceipt.totalAmountUSD,
        currency: 'UZS',
        technicians: newReceipt.technicians,
        technicianId: newReceipt.technicianId,
        technicianName: newReceipt.technicianName,
        status: 'shipped',
        createdAt: newReceipt.createdAt,
        createdBy: finalReceipt.cashierName
      };
      setCustomerOrders((prev) => [posOrder, ...prev]);
    }

    // 5. Create corresponding Otgruzka (ShipmentOrder) so all POS sales appear in Otgruzka
    const posShipmentNumber = `OTG-${finalReceipt.receiptNumber.replace('CR-', '')}`;
    const posShipment: ShipmentOrder = {
      id: `ship-pos-${finalReceipt.id}`,
      shipmentNumber: posShipmentNumber,
      orderId: hasAssignedTech ? `ord-pos-${finalReceipt.id}` : undefined,
      orderNumber: `POS-${finalReceipt.receiptNumber}`,
      receiptId: finalReceipt.id,
      organization: finalReceipt.branchName || 'Chilonzor-1 Filiali',
      warehouseName: 'Asosiy ombor',
      exchangeRate: finalReceipt.exchangeRate || exchangeRate,
      customerId: finalReceipt.customer?.id || 'cust-direct',
      customerName: finalReceipt.customer?.fullName || 'Standart Xaridor',
      customerPhone: finalReceipt.customer?.phone || '',
      deliveryAddress: finalReceipt.installationAddress || 'To\'g\'ridan-to\'g\'ri savdo (POS Kassa)',
      projectName: finalReceipt.customer ? `${finalReceipt.customer.fullName} - POS Sotuv` : 'Kassa To\'g\'ridan-to\'g\'ri Sotuv',
      items: finalReceipt.items.map((it) => ({
        productId: it.product.id,
        productName: it.product.name,
        quantity: it.quantity,
        unit: it.product.unit || 'dona',
        unitPrice: it.appliedPrice,
        unitPriceUSD: it.appliedPriceUSD,
        discountPercent: it.discountPercent,
        totalPrice: it.appliedPrice * it.quantity,
        hasSerialNumber: it.product.hasSerialNumber,
        selectedSerialNumbers: it.selectedSerialNumbers,
        isService: it.product.isService
      })),
      subtotal: finalReceipt.subtotal,
      discountTotal: finalReceipt.discountTotal,
      totalAmount: finalReceipt.totalAmount,
      totalAmountUSD: finalReceipt.totalAmountUSD || Number((finalReceipt.totalAmount / (finalReceipt.exchangeRate || exchangeRate)).toFixed(2)),
      currency: 'UZS',
      technicians: finalReceipt.technicians,
      status: 'shipped',
      createdAt: finalReceipt.createdAt,
      shippedAt: finalReceipt.createdAt,
      createdBy: finalReceipt.cashierName,
      comment: `POS Kassa orqali sotildi (#${finalReceipt.receiptNumber})`
    };
    setShipments((prev) => [posShipment, ...prev]);

    // 6. Update technician stats if assigned to this sale (multi-technician support)
    if (newReceipt.technicians && newReceipt.technicians.length > 0) {
      setEmployees((prev) =>
        prev.map((emp) => {
          const match = newReceipt.technicians?.find((t) => t.id === emp.id);
          if (match) {
            const addedEarnings = match.wageUZS > 0 ? match.wageUZS : Math.round(match.wageUSD * exchangeRate);
            return {
              ...emp,
              installationsCompleted: emp.installationsCompleted + 1,
              totalEarned: emp.totalEarned + addedEarnings
            };
          }
          return emp;
        })
      );
    } else if (newReceipt.technicianId) {
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id === newReceipt.technicianId) {
            const addedEarnings = emp.commissionPerInstall || 0;
            return {
              ...emp,
              installationsCompleted: emp.installationsCompleted + 1,
              totalEarned: emp.totalEarned + addedEarnings
            };
          }
          return emp;
        })
      );
    }

    // 6. Realtime Telegram dispatch to bot if a technician is assigned
    if (hasAssignedTech) {
      try {
        const tg = getTelegramSettings();
        if (tg.enabled && tg.botToken && tg.chatId) {
          const techNames = newReceipt.technicians?.map(t => t.fullName).join(', ') || newReceipt.technicianName || 'Usta';
          const techWageInfo = newReceipt.technicians && newReceipt.technicians.length > 0
            ? `\n💵 *Usta xizmat haqi:* ${newReceipt.technicians.map(t => `${t.fullName}: $${t.wageUSD || Number(((t.wageUZS || 0) / exchangeRate).toFixed(1))}`).join(', ')}`
            : '';
          const itemsList = newReceipt.items.map(it => ` • ${it.product.name} (${it.quantity} ${it.product.unit || 'dona'})`).join('\n');
          const msg = `🛠️ *YANGI MONTAJ / OBYEKT TOPSHIRIG'I!*\n\n` +
            `🧾 *Chek / Buyurtma:* #${newReceipt.receiptNumber}\n` +
            `👷‍♂️ *Biriktirilgan Usta:* ${techNames}\n` +
            `👤 *Mijoz:* ${newReceipt.customer?.fullName || 'Noma\'lum Mijoz'} (${newReceipt.customer?.phone || '—'})\n` +
            `📍 *Manzil:* ${newReceipt.installationAddress || 'Ko\'rsatilmagan'}\n` +
            `📦 *Obyekt tovarlari:*\n${itemsList}` +
            techWageInfo +
            `\n\n📱 *Usta ilovasida obyekt ochildi va topshirishga tayyor.*`;
          sendTelegramMessage(tg.botToken, tg.chatId, msg);
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (newReceipt.isOffline) {
      showToast("⚡ Chek oflayn saqlandi! Tarmoq ulanganda bulutga sinxronlanadi.");
    } else {
      showToast(`✓ Sotuv yakunlandi! Chek ${newReceipt.receiptNumber} yaratildi.${hasAssignedTech ? " Ustaga topshiriq yuborildi." : ""}`);
    }
  };

  // Synchronize offline receipts to cloud
  const handleSync = () => {
    if (offlineCount === 0) return;

    setReceipts((prev) =>
      prev.map((r) => (r.isOffline ? { ...r, isOffline: false, synced: true } : r))
    );

    showToast(`✓ Barcha ${offlineCount} ta oflayn cheklar bulutga muvaffaqiyatli sinxronlandi!`);
  };

  // Handle Return (Vozvrat) of items from a completed receipt
  const handleReturnReceipt = (
    receiptId: string,
    returnData: {
      itemsToReturn: {
        productId: string;
        productName: string;
        quantity: number;
        serialNumbers: string[];
        unitPrice: number;
        totalRefund: number;
      }[];
      refundMethod: 'cash' | 'card' | 'debt_deduction';
      reason: string;
    }
  ) => {
    const targetReceipt = receipts.find((r) => r.id === receiptId);
    if (!targetReceipt) return;

    let totalRefundSum = 0;

    // 1. Reconcile Products (Add stock and S/N back to inventory)
    setProducts((prev) =>
      prev.map((prod) => {
        const returnedMatch = returnData.itemsToReturn.find((it) => it.productId === prod.id);
        if (returnedMatch) {
          const newQty = prod.isService ? prod.stockQuantity : prod.stockQuantity + returnedMatch.quantity;
          
          let updatedSerials = prod.serialNumbers ? [...prod.serialNumbers] : [];
          if (returnedMatch.serialNumbers && returnedMatch.serialNumbers.length > 0) {
            returnedMatch.serialNumbers.forEach((sn) => {
              if (!updatedSerials.includes(sn)) {
                updatedSerials.push(sn);
              }
            });
          }

          return {
            ...prod,
            stockQuantity: newQty,
            serialNumbers: prod.hasSerialNumber ? updatedSerials : prod.serialNumbers
          };
        }
        return prod;
      })
    );

    // 2. Calculate total refund
    returnData.itemsToReturn.forEach((it) => {
      totalRefundSum += it.totalRefund;
    });

    // 3. Reconcile Customer if attached
    if (targetReceipt.customer) {
      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id === targetReceipt.customer?.id) {
            const newPurchases = Math.max(0, cust.totalPurchases - totalRefundSum);

            let newDebt = cust.debtBalance;
            if (returnData.refundMethod === 'debt_deduction') {
              newDebt = Math.max(0, cust.debtBalance - totalRefundSum);
            }

            const cashbackRate = cust.cashbackRate || 1;
            const cashbackToReverse = Math.round(totalRefundSum * (cashbackRate / 100));
            const newCashback = Math.max(0, cust.cashbackBalance - cashbackToReverse);

            return {
              ...cust,
              totalPurchases: newPurchases,
              debtBalance: newDebt,
              cashbackBalance: newCashback
            };
          }
          return cust;
        })
      );
    }

    // 4. Update the receipt
    const returnTimestamp = new Date().toLocaleString('uz-UZ');
    const newReturnedRecords = returnData.itemsToReturn.map((it, idx) => ({
      id: `ret-${Date.now()}-${idx}`,
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      serialNumbers: it.serialNumbers.length > 0 ? it.serialNumbers : undefined,
      unitPrice: it.unitPrice,
      totalRefund: it.totalRefund,
      refundMethod: returnData.refundMethod,
      reason: returnData.reason,
      returnedAt: returnTimestamp
    }));

    setReceipts((prev) =>
      prev.map((r) => {
        if (r.id === receiptId) {
          const updatedItems = r.items.map((item) => {
            const retMatch = returnData.itemsToReturn.find((it) => it.productId === item.product.id);
            if (retMatch) {
              const prevReturned = item.returnedQuantity || 0;
              const prevSerials = item.returnedSerialNumbers || [];
              return {
                ...item,
                returnedQuantity: prevReturned + retMatch.quantity,
                returnedSerialNumbers: [...prevSerials, ...retMatch.serialNumbers]
              };
            }
            return item;
          });

          const allFullyReturned = updatedItems.every(
            (it) => (it.returnedQuantity || 0) >= it.quantity
          );

          const totalRefundedSoFar = (r.totalRefunded || 0) + totalRefundSum;

          return {
            ...r,
            items: updatedItems,
            status: allFullyReturned ? 'returned' : 'partially_returned',
            totalRefunded: totalRefundedSoFar,
            returnedItems: [...(r.returnedItems || []), ...newReturnedRecords],
            updatedAt: returnTimestamp
          };
        }
        return r;
      })
    );

    showToast(`✓ Tovarlar omborga muvaffaqiyatli qaytarildi! (Vozvrat: ${totalRefundSum.toLocaleString()} so'm)`);
  };

  // Handle Save Edit Receipt and Add More Items
  const handleSaveEditReceipt = (
    receiptId: string,
    updatedReceipt: SaleReceipt,
    newItemsStockDelta: {
      productId: string;
      quantity: number;
      serialNumbers: string[];
    }[]
  ) => {
    // 1. Deduct newly added items from inventory
    if (newItemsStockDelta && newItemsStockDelta.length > 0) {
      setProducts((prev) =>
        prev.map((prod) => {
          const delta = newItemsStockDelta.find((d) => d.productId === prod.id);
          if (delta) {
            if (prod.isService) return prod;

            const newStock = Math.max(0, prod.stockQuantity - delta.quantity);
            let updatedSerials = prod.serialNumbers ? [...prod.serialNumbers] : [];
            if (delta.serialNumbers.length > 0) {
              updatedSerials = updatedSerials.filter((s) => !delta.serialNumbers.includes(s));
            }

            return {
              ...prod,
              stockQuantity: newStock,
              serialNumbers: prod.hasSerialNumber ? updatedSerials : prod.serialNumbers
            };
          }
          return prod;
        })
      );
    }

    // 2. Find old receipt to compute changes in customer debt/purchases
    const oldReceipt = receipts.find((r) => r.id === receiptId);
    if (oldReceipt) {
      const addedAmount = updatedReceipt.totalAmount - oldReceipt.totalAmount;
      const addedDebt = updatedReceipt.payments.debt - oldReceipt.payments.debt;

      if (updatedReceipt.customer && (addedAmount !== 0 || addedDebt !== 0)) {
        setCustomers((prev) =>
          prev.map((cust) => {
            if (cust.id === updatedReceipt.customer?.id) {
              const updatedPurchases = Math.max(0, cust.totalPurchases + addedAmount);
              const updatedDebt = Math.max(0, cust.debtBalance + addedDebt);
              return {
                ...cust,
                totalPurchases: updatedPurchases,
                debtBalance: updatedDebt
              };
            }
            return cust;
          })
        );
      }
    }

    // 3. Update the receipt in state
    setReceipts((prev) =>
      prev.map((r) => (r.id === receiptId ? updatedReceipt : r))
    );

    showToast(`✓ Chek ${updatedReceipt.receiptNumber} muvaffaqiyatli yangilandi!`);
  };

  // Orders & Shipments Handlers
  const handleSaveOrder = (newOrder: CustomerOrder) => {
    let nextList: CustomerOrder[] = [];
    setCustomerOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === newOrder.id || (o.orderNumber && newOrder.orderNumber && o.orderNumber === newOrder.orderNumber));
      if (idx >= 0) {
        nextList = [...prev];
        nextList[idx] = newOrder;
      } else {
        nextList = [newOrder, ...prev];
      }
      return nextList;
    });

    const finalOrders = nextList.length > 0 ? nextList : [newOrder, ...customerOrders];

    // Immediate storage & cloud push
    try {
      localStorage.setItem('sc_customer_orders', JSON.stringify(finalOrders));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({
      customerOrders: finalOrders
    });

    if (newOrder.status === 'pending_cashier_approval') {
      showToast(`🔔 Usta smetasi yuborildi (#${newOrder.orderNumber}). Asosiy kassa tasdig'i kutilmoqda!`);

      // Try to notify Telegram bot if enabled
      try {
        const tg = getTelegramSettings();
        if (tg.enabled && tg.botToken && tg.chatId) {
          const msg = `🔔 *YANGI JOYIDA SMETA / BUYURTMA!*\n\n` +
            `📋 *Smeta raqami:* #${newOrder.orderNumber}\n` +
            `🛠️ *Usta:* ${newOrder.requestedByTechnicianName || newOrder.technicianName || 'Usta'}\n` +
            `👤 *Mijoz:* ${newOrder.customerName} (${newOrder.customerPhone || '—'})\n` +
            `📍 *Manzil:* ${newOrder.deliveryAddress || '—'}\n` +
            `💰 *Jami Summa:* $${newOrder.totalAmountUSD || Number((newOrder.totalAmount / exchangeRate).toFixed(1))} (${newOrder.totalAmount.toLocaleString()} so'm)\n` +
            `📦 *Pozitsiyalar:* ${newOrder.items.length} ta\n` +
            `⚠️ *Holat:* Asosiy kassa tasdig'i kutilmoqda ⏳`;
          sendTelegramMessage(tg.botToken, tg.chatId, msg);
        }
      } catch (e) {
        console.error(e);
      }
    } else if (newOrder.status === 'in_progress') {
      showToast(`▶️ Montaj boshlandi! Usta obyektda ishga kirishdi (#${newOrder.orderNumber}).`);

      try {
        const tg = getTelegramSettings();
        if (tg.enabled && tg.botToken && tg.chatId) {
          const techNames = newOrder.technicians?.map(t => t.fullName).join(', ') || newOrder.technicianName || 'Usta';
          const msg = `⚡ *MONTAJ ISHLARI BOSHLANDI!*\n\n` +
            `📋 *Buyurtma / Obyekt:* #${newOrder.orderNumber}\n` +
            `👷‍♂️ *Usta:* ${techNames}\n` +
            `👤 *Mijoz:* ${newOrder.customerName} (${newOrder.customerPhone || '—'})\n` +
            `📍 *Manzil:* ${newOrder.deliveryAddress || 'Ko\'rsatilmagan'}\n` +
            `⏰ *Boshlangan vaqt:* ${newOrder.startedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
            `🟢 *Holat:* Obyektda montaj jarayonida`;
          sendTelegramMessage(tg.botToken, tg.chatId, msg);
        }
      } catch (e) {
        console.error(e);
      }
    } else if (newOrder.status === 'rejected') {
      showToast(`⚠️ #${newOrder.orderNumber} smeta rad etildi.`);
    } else {
      showToast(`✓ Hisob-kitob (Smeta) ${newOrder.orderNumber} muvaffaqiyatli saqlandi!`);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    const updated = customerOrders.filter((o) => o.id !== orderId);
    setCustomerOrders(updated);
    try {
      localStorage.setItem('sc_customer_orders', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ customerOrders: updated });
    showToast("✓ Hisob-kitob smetasi o'chirildi.");
  };

  const handleClearAllOrders = () => {
    setCustomerOrders([]);
    setShipments([]);
    setHandovers([]);
    try {
      localStorage.setItem('sc_customer_orders', JSON.stringify([]));
      localStorage.setItem('sc_shipments', JSON.stringify([]));
      localStorage.setItem('sc_handovers', JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({
      customerOrders: [],
      shipments: [],
      handovers: []
    });
    showToast("✓ Barcha buyurtmalar, hisob-kitoblar va otgruzkalar tozalandi!");
  };

  const handleDirectApproveEstimate = (order: CustomerOrder) => {
    const shipmentId = order.shipmentId || `ship-${Date.now()}`;
    const cleanNum = (order.orderNumber || '').replace('ZAK-', '').replace('ZK-', '');
    const shipmentNumber = `OTG-${cleanNum || Math.floor(1000 + Math.random() * 9000)}`;

    const updatedOrder: CustomerOrder = {
      ...order,
      status: 'approved',
      shipmentId: shipmentId
    };

    const newShipment: ShipmentOrder = {
      id: shipmentId,
      shipmentNumber: shipmentNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      organization: order.organization || 'SMART CONTROL',
      warehouseName: order.warehouseName || 'Asosiy Ombor',
      customerId: order.customerId || 'cust-direct',
      customerName: order.customerName || 'Mijoz',
      customerPhone: order.customerPhone || '',
      deliveryAddress: order.deliveryAddress || 'Obyektda',
      projectName: order.projectName || `${order.customerName} - Obyekt montaji`,
      comment: order.comment || `Usta smetasi asosida yaratildi (#${order.orderNumber})`,
      currency: order.currency || 'UZS',
      exchangeRate: order.exchangeRate || exchangeRate,
      technicians: order.technicians || [],
      items: order.items.map(it => ({
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unit: it.unit || 'dona',
        unitPrice: it.unitPrice,
        unitPriceUSD: it.unitPriceUSD,
        discountPercent: it.discountPercent || 0,
        totalPrice: it.totalPrice || (it.unitPrice * it.quantity),
        hasSerialNumber: it.hasSerialNumber || false,
        selectedSerialNumbers: it.selectedSerialNumbers || [],
        isService: it.isService || false
      })),
      subtotal: order.subtotal || order.totalAmount,
      discountTotal: order.discountTotal || 0,
      totalAmount: order.totalAmount,
      totalAmountUSD: order.totalAmountUSD || Number((order.totalAmount / (order.exchangeRate || exchangeRate || 12850)).toFixed(2)),
      status: 'pending',
      paymentMethod: 'cash'
    };

    // Update customer orders list without duplicates
    let nextOrders: CustomerOrder[] = [];
    setCustomerOrders(prev => {
      const idx = prev.findIndex(o => o.id === order.id || o.orderNumber === order.orderNumber);
      if (idx >= 0) {
        nextOrders = [...prev];
        nextOrders[idx] = updatedOrder;
      } else {
        nextOrders = [updatedOrder, ...prev];
      }
      return nextOrders;
    });

    // Update shipments list without duplicates
    let nextShipments: ShipmentOrder[] = [];
    setShipments(prev => {
      const idx = prev.findIndex(s => s.id === shipmentId || s.orderId === order.id || s.orderNumber === order.orderNumber);
      if (idx >= 0) {
        nextShipments = [...prev];
        nextShipments[idx] = newShipment;
      } else {
        nextShipments = [newShipment, ...prev];
      }
      return nextShipments;
    });

    const finalOrders = nextOrders.length > 0 ? nextOrders : [updatedOrder];
    const finalShipments = nextShipments.length > 0 ? nextShipments : [newShipment];

    try {
      localStorage.setItem('sc_customer_orders', JSON.stringify(finalOrders));
      localStorage.setItem('sc_shipments', JSON.stringify(finalShipments));
    } catch (e) {
      console.error(e);
    }

    pushDataToCloud({
      customerOrders: finalOrders,
      shipments: finalShipments
    });

    // Notify telegram
    try {
      const tg = getTelegramSettings();
      if (tg.enabled && tg.botToken && tg.chatId) {
        const msg = `✅ *SMETA KASSIR TOMONIDAN TASDIQLANDI!*\n\n` +
          `📋 *Smeta raqami:* #${order.orderNumber}\n` +
          `📦 *Otgruzka raqami:* #${shipmentNumber}\n` +
          `🛠️ *Usta:* ${order.requestedByTechnicianName || order.technicianName || 'Usta'}\n` +
          `👤 *Mijoz:* ${order.customerName || '—'}\n` +
          `💰 *Jami Summa:* $${order.totalAmountUSD || Number((order.totalAmount / (order.exchangeRate || exchangeRate)).toFixed(1))} (${order.totalAmount.toLocaleString()} so'm)\n\n` +
          `🚚 *Holat:* "2. Otgruzka" bo'limiga o'tkazildi. To'lov usta pulni olib kelganda qabul qilinadi.`;
        sendTelegramMessage(tg.botToken, tg.chatId, msg);
      }
    } catch (e) {
      console.error(e);
    }

    showToast(`✓ #${order.orderNumber} smeta tasdiqlandi va "2. Otgruzka" bo'limiga o'tkazildi! To'lov usta pulni olib kelganda kiritiladi.`);
  };

  const handleRejectEstimate = (orderId: string, reason: string) => {
    let nextOrders: CustomerOrder[] = [];
    let rejectedOrderNum = '';
    setCustomerOrders(prev => {
      const targetOrd = prev.find((o) => o.id === orderId);
      if (!targetOrd) return prev;
      rejectedOrderNum = targetOrd.orderNumber;
      const updated: CustomerOrder = {
        ...targetOrd,
        status: 'rejected',
        rejectionReason: reason || "Tovarlar omborda yetarli emas yoki narx xato"
      };
      nextOrders = prev.map(o => (o.id === orderId || o.orderNumber === targetOrd.orderNumber ? updated : o));
      return nextOrders;
    });

    const finalOrders = nextOrders.length > 0 ? nextOrders : customerOrders;

    try {
      localStorage.setItem('sc_customer_orders', JSON.stringify(finalOrders));
    } catch (e) {
      console.error(e);
    }

    pushDataToCloud({
      customerOrders: finalOrders
    });

    const targetOrd = customerOrders.find(o => o.id === orderId);
    showToast(`⚠️ #${targetOrd?.orderNumber || rejectedOrderNum || ''} smeta rad etildi va ustaga yuborildi.`);

    // Send Telegram notification
    try {
      const tg = getTelegramSettings();
      if (tg.enabled && tg.botToken && tg.chatId) {
        const msg = `❌ *SMETA KASSIR TOMONIDAN RAD ETILDI!*\n\n` +
          `📋 *Smeta raqami:* #${targetOrd?.orderNumber || rejectedOrderNum || orderId}\n` +
          `🛠️ *Usta:* ${targetOrd?.requestedByTechnicianName || targetOrd?.technicianName || 'Usta'}\n` +
          `👤 *Mijoz:* ${targetOrd?.customerName || '—'}\n` +
          `⚠️ *Rad etish sababi:* ${reason || "Tovarlar omborda yetarli emas yoki narx xato"}\n\n` +
          `📱 *Usta ilovasida "❌ Rad" bo'limida tahrirlash va qayta yuborish imkoni mavjud.*`;
        sendTelegramMessage(tg.botToken, tg.chatId, msg);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveShipment = (newShipment: ShipmentOrder) => {
    setShipments((prev) => {
      const idx = prev.findIndex((s) => s.id === newShipment.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newShipment;
        return updated;
      }
      return [newShipment, ...prev];
    });
    showToast(`✓ Otgruzka hujjati ${newShipment.shipmentNumber} saqlandi!`);
  };

  const handleCompleteShipmentSale = (
    shipment: ShipmentOrder,
    paymentDetails: PaymentDetails,
    assignedTechs: AssignedTechnician[]
  ) => {
    const newReceiptNumber = `CR-${1000 + receipts.length + 1}`;
    const cartItems: CartItem[] = shipment.items.map((it) => {
      const prod = products.find((p) => p.id === it.productId) || {
        id: it.productId,
        barcode: '',
        sku: '',
        name: it.productName,
        category: 'Kuzatuv kameralari (CCTV)',
        costPrice: 0,
        retailPrice: it.unitPrice,
        stockQuantity: 0,
        minStockAlert: 1,
        unit: it.unit,
        hasSerialNumber: it.hasSerialNumber,
        isService: it.isService
      };

      return {
        product: prod,
        quantity: it.quantity,
        discountPercent: it.discountPercent,
        appliedPrice: it.unitPrice * (1 - (it.discountPercent || 0) / 100),
        appliedPriceUSD: it.unitPriceUSD,
        selectedSerialNumbers: it.selectedSerialNumbers && it.selectedSerialNumbers.length > 0 ? it.selectedSerialNumbers : undefined
      };
    });

    const isUSD = shipment.currency === 'USD';
    const rate = exchangeRate > 0 ? exchangeRate : 12850;
    const totalAmountUZS = isUSD ? Math.round(shipment.totalAmount * rate) : shipment.totalAmount;
    const subtotalUZS = isUSD ? Math.round(shipment.subtotal * rate) : shipment.subtotal;
    const discountUZS = isUSD ? Math.round(shipment.discountTotal * rate) : shipment.discountTotal;
    const totalAmountUSD = isUSD ? shipment.totalAmount : Number((shipment.totalAmount / rate).toFixed(2));

    const cust = customers.find((c) => c.id === shipment.customerId);
    const cashbackRate = cust?.cashbackRate || 1;
    const cashbackEarned = Math.round(totalAmountUZS * (cashbackRate / 100));

    const newReceipt: SaleReceipt = {
      id: `receipt-${Date.now()}`,
      receiptNumber: newReceiptNumber,
      createdAt: getNowFormatted(),
      cashierName: 'Farrux A. (Menejer)',
      customer: cust,
      items: cartItems,
      subtotal: subtotalUZS,
      discountTotal: discountUZS,
      totalAmount: totalAmountUZS,
      totalAmountUSD: totalAmountUSD,
      exchangeRate: rate,
      payments: paymentDetails,
      cashbackEarned,
      isOffline,
      synced: !isOffline,
      branchName: shipment.organization || 'WST Namangan',
      installationAddress: shipment.deliveryAddress,
      warrantyMonths: 24,
      technicians: assignedTechs.length > 0 ? assignedTechs : undefined,
      technicianId: assignedTechs[0]?.id,
      technicianName: assignedTechs[0]?.fullName,
      technicianPhone: assignedTechs[0]?.phone,
      status: 'completed',
      notes: shipment.comment ? `Otgruzka: ${shipment.shipmentNumber}. ${shipment.comment}` : `Otgruzka: ${shipment.shipmentNumber}`
    };

    setReceipts((prev) => [newReceipt, ...prev]);

    setProducts((prev) =>
      prev.map((prod) => {
        const shippedItem = shipment.items.find((item) => item.productId === prod.id);
        if (shippedItem) {
          if (prod.isService) return prod;

          const newStock = Math.max(0, prod.stockQuantity - shippedItem.quantity);
          let updatedSerials = prod.serialNumbers ? [...prod.serialNumbers] : [];

          if (shippedItem.selectedSerialNumbers && shippedItem.selectedSerialNumbers.length > 0) {
            updatedSerials = updatedSerials.filter((s) => !shippedItem.selectedSerialNumbers?.includes(s));
          }

          return {
            ...prod,
            stockQuantity: newStock,
            serialNumbers: prod.hasSerialNumber ? updatedSerials : prod.serialNumbers
          };
        }
        return prod;
      })
    );

    if (cust) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === cust.id) {
            return {
              ...c,
              totalPurchases: c.totalPurchases + totalAmountUZS,
              debtBalance: c.debtBalance + (paymentDetails.debt || 0),
              cashbackBalance: c.cashbackBalance + cashbackEarned
            };
          }
          return c;
        })
      );
    }

    if (assignedTechs.length > 0) {
      setEmployees((prev) =>
        prev.map((emp) => {
          const match = assignedTechs.find((t) => t.id === emp.id);
          if (match) {
            const addedEarnings = match.wageUZS > 0 ? match.wageUZS : Math.round(match.wageUSD * exchangeRate);
            return {
              ...emp,
              installationsCompleted: emp.installationsCompleted + 1,
              totalEarned: emp.totalEarned + addedEarnings
            };
          }
          return emp;
        })
      );
    }

    if (shipment.orderId) {
      setCustomerOrders((prev) =>
        prev.map((o) =>
          o.id === shipment.orderId
            ? {
                ...o,
                status: 'shipped',
                technicians: assignedTechs.length > 0 ? assignedTechs : o.technicians,
                technicianId: assignedTechs[0]?.id || o.technicianId,
                technicianName: assignedTechs[0]?.fullName || o.technicianName,
                receiptId: newReceipt.id
              }
            : o
        )
      );
    } else if (assignedTechs.length > 0) {
      const shipmentOrder: CustomerOrder = {
        id: `ord-ship-${shipment.id}`,
        orderNumber: `ORD-${shipment.shipmentNumber}`,
        shipmentId: shipment.id,
        receiptId: newReceipt.id,
        organization: shipment.organization || 'WST Namangan',
        warehouseName: shipment.warehouseName || 'Asosiy ombor',
        exchangeRate: shipment.exchangeRate || exchangeRate,
        customerId: shipment.customerId,
        customerName: shipment.customerName,
        customerPhone: shipment.customerPhone || '',
        deliveryAddress: shipment.deliveryAddress || '',
        projectName: shipment.projectName || `${shipment.customerName} - Obyekt montaji`,
        items: shipment.items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          unit: it.unit || 'dona',
          unitPrice: it.unitPrice,
          unitPriceUSD: it.unitPriceUSD,
          discountPercent: it.discountPercent,
          totalPrice: it.totalPrice,
          hasSerialNumber: it.hasSerialNumber,
          selectedSerialNumbers: it.selectedSerialNumbers,
          isService: it.isService
        })),
        subtotal: shipment.subtotal,
        discountTotal: shipment.discountTotal,
        totalAmount: shipment.totalAmount,
        totalAmountUSD: shipment.totalAmountUSD,
        currency: shipment.currency,
        technicians: assignedTechs,
        technicianId: assignedTechs[0]?.id,
        technicianName: assignedTechs[0]?.fullName,
        status: 'shipped',
        createdAt: shipment.createdAt,
        createdBy: 'Menejer'
      };
      setCustomerOrders((prev) => [shipmentOrder, ...prev]);
    }

    setShipments((prev) =>
      prev.map((s) => (s.id === shipment.id ? { ...shipment, status: 'shipped', receiptId: newReceipt.id } : s))
    );

    // Realtime Telegram notification to bot if technicians are assigned
    if (assignedTechs.length > 0) {
      try {
        const tg = getTelegramSettings();
        if (tg.enabled && tg.botToken && tg.chatId) {
          const techNames = assignedTechs.map((t) => t.fullName).join(', ');
          const techWageInfo = assignedTechs.length > 0
            ? `\n💵 *Usta xizmat haqi:* ${assignedTechs.map((t) => `${t.fullName}: $${t.wageUSD || Number(((t.wageUZS || 0) / exchangeRate).toFixed(1))}`).join(', ')}`
            : '';
          const itemsList = shipment.items.map((it) => ` • ${it.productName} (${it.quantity} ${it.unit || 'dona'})`).join('\n');
          const msg = `📦 *YANGI OTGRUZKA / MONTAJ TOPSHIRIG'I!*\n\n` +
            `🧾 *Otgruzka raqami:* #${shipment.shipmentNumber}\n` +
            `👷‍♂️ *Biriktirilgan Usta:* ${techNames}\n` +
            `👤 *Mijoz:* ${shipment.customerName} (${shipment.customerPhone || '—'})\n` +
            `📍 *Manzil:* ${shipment.deliveryAddress || 'Ko\'rsatilmagan'}\n` +
            `📦 *Obyekt tovarlari:*\n${itemsList}` +
            techWageInfo +
            `\n\n📱 *Usta ilovasida yangi obyekt ochildi.*`;
          sendTelegramMessage(tg.botToken, tg.chatId, msg);
        }
      } catch (e) {
        console.error(e);
      }
    }

    showToast(`✓ Otgruzka muvaffaqiyatli yakunlandi! Sotuv cheki ${newReceiptNumber} yaratildi.${assignedTechs.length > 0 ? " Ustaga montaj vazifasi yuborildi." : ""}`);
  };

  // Add Product
  const handleAddProduct = (newProd: Product) => {
    recordLocalMutation('products');
    let nextList: Product[] = [];
    setProducts((prev) => {
      nextList = [newProd, ...prev];
      return nextList;
    });
    const finalProducts = nextList.length > 0 ? nextList : [newProd, ...products];
    try {
      localStorage.setItem('sc_products', JSON.stringify(finalProducts));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ products: finalProducts });
    showToast(`✓ "${newProd.name}" omborga muvaffaqiyatli qo'shildi.`);
  };

  // Update Stock
  const handleUpdateStock = (productId: string, newStock: number) => {
    recordLocalMutation('products');
    let nextList: Product[] = [];
    setProducts((prev) => {
      nextList = prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p));
      return nextList;
    });
    const finalProducts = nextList.length > 0 ? nextList : products.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p));
    try {
      localStorage.setItem('sc_products', JSON.stringify(finalProducts));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ products: finalProducts });
    showToast("✓ Ombordagi qoldiq yangilandi.");
  };

  // Update Product (Redakt qilish)
  const handleUpdateProduct = (updatedProduct: Product) => {
    recordLocalMutation('products');
    let nextList: Product[] = [];
    setProducts((prev) => {
      nextList = prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      return nextList;
    });
    const finalProducts = nextList.length > 0 ? nextList : products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    try {
      localStorage.setItem('sc_products', JSON.stringify(finalProducts));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ products: finalProducts });
    showToast(`✓ "${updatedProduct.name}" tahrirlandi.`);
  };

  // Delete Product (O'chirish)
  const handleDeleteProduct = (productId: string) => {
    recordLocalMutation('products');
    const prod = products.find((p) => p.id === productId);
    let nextList: Product[] = [];
    setProducts((prev) => {
      nextList = prev.filter((p) => p.id !== productId);
      return nextList;
    });
    const finalProducts = nextList.length > 0 || products.length === 1 ? nextList : products.filter((p) => p.id !== productId);
    try {
      localStorage.setItem('sc_products', JSON.stringify(finalProducts));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ products: finalProducts });
    showToast(`✓ "${prod?.name || 'Tovar'}" ombordan o'chirildi.`);
  };

  // Omborga tovar kirimi (Prixod / Nakladnoy) - Yangi qo'shish va Tahrirlash (Redakt)
  const handleSavePurchase = (invoice: PurchaseInvoice, updatedProducts: Product[]) => {
    recordLocalMutation('products');
    recordLocalMutation('purchases');
    setPurchases((prev) => {
      const exists = prev.some((p) => p.id === invoice.id);
      if (exists) {
        return prev.map((p) => (p.id === invoice.id ? invoice : p));
      }
      return [invoice, ...prev];
    });
    setProducts(updatedProducts);
    try {
      localStorage.setItem('sc_products', JSON.stringify(updatedProducts));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ products: updatedProducts });
    showToast(`✓ Kirim nakladnoyi #${invoice.invoiceNumber} saqlandi va ombor qoldig'i yangilandi!`);
  };

  // Ta'minotchiga to'lov qilish va nakladnoyga biriktirish
  const handleRecordSupplierPayment = (payment: PurchasePaymentRecord, updatedInvoice: PurchaseInvoice) => {
    setPurchases((prev) =>
      prev.map((p) => (p.id === updatedInvoice.id ? updatedInvoice : p))
    );
    const amountStr = payment.currency === 'USD' 
      ? `$${payment.amountUSD}` 
      : `${payment.amount.toLocaleString()} so'm`;
    showToast(`✓ "${payment.supplierName}"ga ${amountStr} to'lov #${updatedInvoice.invoiceNumber} nakladnoyga biriktirildi!`);
  };

  // Kirim nakladnoyini bekor qilish
  const handleCancelPurchase = (invoiceId: string) => {
    setPurchases((prev) =>
      prev.map((p) => (p.id === invoiceId ? { ...p, status: 'cancelled' as const } : p))
    );
    showToast(`✓ Kirim nakladnoyi bekor qilindi.`);
  };

  // Add Customer
  const handleAddCustomer = (newCustomer: Customer) => {
    recordLocalMutation('customers');
    setCustomers((prev) => [newCustomer, ...prev]);
    showToast(`✓ Mijoz "${newCustomer.fullName}" ro'yxatga olindi (+10 000 so'm cashback berildi).`);
  };

  // Update Customer
  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    recordLocalMutation('customers');
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
    showToast(`✓ "${updatedCustomer.fullName}" ma'lumotlari yangilandi.`);
  };

  // Add manual cashback bonus
  const handleUpdateCashback = (customerId: string, amount: number) => {
    recordLocalMutation('customers');
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId ? { ...c, cashbackBalance: c.cashbackBalance + amount } : c
      )
    );
    showToast(`✓ Mijozga +${amount.toLocaleString()} so'm cashback qo'shildi!`);
  };

  // Add Expense or Income (Prixod & Rasxod) with Automatic Counterparty Debt Deduction
  const handleAddExpense = (newExp: Expense) => {
    recordLocalMutation('expenses');
    setExpenses((prev) => [newExp, ...prev]);

    if (newExp.type === 'income') {
      // 1. Check if payment belongs to a customer and reduce customer's debt
      const targetCustomer = customers.find(c => 
        (newExp.customerId && c.id === newExp.customerId) ||
        (newExp.customerName && (c.fullName.toLowerCase() === newExp.customerName.toLowerCase() || c.fullName.toLowerCase().includes(newExp.customerName.toLowerCase()) || newExp.customerName.toLowerCase().includes(c.fullName.toLowerCase()))) ||
        (newExp.paidBy && (c.fullName.toLowerCase() === newExp.paidBy.toLowerCase() || c.fullName.toLowerCase().includes(newExp.paidBy.toLowerCase()) || newExp.paidBy.toLowerCase().includes(c.fullName.toLowerCase())))
      );

      if (targetCustomer) {
        recordLocalMutation('customers');
        recordLocalMutation('customerDebtPayments');
        const oldDebt = targetCustomer.debtBalance || 0;
        const newDebtUZS = Math.max(0, oldDebt - newExp.amount);
        const newDebtUSD = Number((newDebtUZS / exchangeRate).toFixed(2));

        // Update customer debt balance
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === targetCustomer.id
              ? {
                  ...c,
                  debtBalance: newDebtUZS,
                  debtBalanceUSD: newDebtUSD
                }
              : c
          )
        );

        // Record customer debt payment entry
        if (oldDebt > 0) {
          const debtPaymentRecord: CustomerDebtPayment = {
            id: `cdp-${Date.now()}`,
            paymentNumber: `QP-${Math.floor(1000 + Math.random() * 9000)}`,
            createdAt: getNowFormatted(),
            customerId: targetCustomer.id,
            customerName: targetCustomer.fullName,
            customerPhone: targetCustomer.phone,
            amountUZS: newExp.amount,
            amountUSD: newExp.amountUSD || Number((newExp.amount / exchangeRate).toFixed(2)),
            currencyPaid: (newExp.currency as 'UZS' | 'USD') || 'UZS',
            paymentMethod: newExp.paymentSource === 'Kassa (Naqd)' ? 'cash' : (newExp.paymentSource === 'Valyuta (Naqd USD)' ? 'cashUSD' : 'card'),
            exchangeRate: exchangeRate,
            previousDebtUZS: oldDebt,
            remainingDebtUZS: newDebtUZS,
            receiptNumber: newExp.linkedDocNumber,
            notes: newExp.notes || `Pul kirimi orqali qarz to'lovi`,
            cashierName: newExp.createdBy || 'Farrux A.'
          };
          setCustomerDebtPayments((prev) => [debtPaymentRecord, ...prev]);
        }

        if (oldDebt > 0) {
          showToast(`✓ "${targetCustomer.fullName}"ning qarzidan ${newExp.amount.toLocaleString()} so'm yechildi (Qoldiq qarz: ${newDebtUZS.toLocaleString()} so'm)`);
        } else {
          showToast(`✓ "${targetCustomer.fullName}"dan pul kirimi kiritildi: ${newExp.amount.toLocaleString()} so'm`);
        }
      } else {
        showToast(`✓ Pul kirimi (Prixod) kiritildi: ${newExp.amount.toLocaleString()} so'm (${newExp.category})`);
      }
    } else {
      // 2. Check if expense was paid to a supplier and reduce supplier's outstanding invoice debts
      if (newExp.paidTo) {
        let remainingDeduction = newExp.amount;
        let supplierDebtReduced = false;

        recordLocalMutation('purchases');
        setPurchases((prev) =>
          prev.map((p) => {
            // Match specific invoice or match supplier name
            const isSpecificInvoice = newExp.linkedDocId ? p.id === newExp.linkedDocId : (newExp.linkedDocNumber ? p.invoiceNumber === newExp.linkedDocNumber : false);
            const isSupplierMatch = p.supplierName && (
              p.supplierName.toLowerCase().includes(newExp.paidTo!.toLowerCase()) ||
              newExp.paidTo!.toLowerCase().includes(p.supplierName.toLowerCase())
            );

            if ((isSpecificInvoice || isSupplierMatch) && remainingDeduction > 0) {
              const currentDebt = p.debtAmount !== undefined && p.debtAmount > 0 
                ? p.debtAmount 
                : (p.paymentStatus === 'debt' ? p.totalAmount : Math.max(0, p.totalAmount - (p.paidAmount || 0)));

              if (currentDebt > 0) {
                const deductAmount = isSpecificInvoice ? Math.min(currentDebt, newExp.amount) : Math.min(currentDebt, remainingDeduction);
                remainingDeduction -= deductAmount;
                supplierDebtReduced = true;

                const newDebt = Math.max(0, currentDebt - deductAmount);
                const newPaid = (p.paidAmount || 0) + deductAmount;
                const newDebtUSD = Number((newDebt / (p.exchangeRate || exchangeRate)).toFixed(2));
                const status = newDebt === 0 ? ('paid' as const) : ('partial' as const);

                return {
                  ...p,
                  paidAmount: newPaid,
                  debtAmount: newDebt,
                  debtAmountUSD: newDebtUSD,
                  paymentStatus: status
                };
              }
            }
            return p;
          })
        );

        if (supplierDebtReduced) {
          showToast(`✓ "${newExp.paidTo}" ta'minotchisiga ${newExp.amount.toLocaleString()} so'm to'landi va qarzimiz kamaytirildi!`);
        } else {
          showToast(`✓ Xarajat (Chiqim) kiritildi: ${newExp.amount.toLocaleString()} so'm (${newExp.category})`);
        }
      } else {
        showToast(`✓ Xarajat (Chiqim) kiritildi: ${newExp.amount.toLocaleString()} so'm (${newExp.category})`);
      }
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    recordLocalMutation('expenses');
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    showToast(`✓ Moliya yozuvi o'chirildi!`);
  };

  // Category management handlers
  const handleAddCategory = (newCat: ExpenseCategory) => {
    recordLocalMutation('expenseCategories');
    setExpenseCategories((prev) => [...prev, newCat]);
    showToast(`✓ Yangi toifa qo'shildi: "${newCat.name}"`);
  };

  const handleUpdateCategory = (categoryId: string, newName: string, newDesc?: string) => {
    recordLocalMutation('expenseCategories');
    const oldCat = expenseCategories.find((c) => c.id === categoryId);
    const oldName = oldCat?.name;

    setExpenseCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, name: newName, description: newDesc ?? c.description } : c))
    );

    if (oldName && oldName !== newName) {
      recordLocalMutation('expenses');
      setExpenses((prev) =>
        prev.map((e) => (e.category === oldName ? { ...e, category: newName } : e))
      );
    }

    showToast(`✓ Toifa nomi yangilandi: "${newName}"`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    recordLocalMutation('expenseCategories');
    const catToDelete = expenseCategories.find((c) => c.id === categoryId);
    if (!catToDelete) return;

    setExpenseCategories((prev) => prev.filter((c) => c.id !== categoryId));
    showToast(`✓ Toifa o'chirildi: "${catToDelete.name}"`);
  };

  // Product Category management handlers
  const handleAddProductCategory = (newCat: ProductCategory) => {
    recordLocalMutation('productCategories');
    setProductCategories((prev) => [...prev, newCat]);
    showToast(`✓ Yangi mahsulot kategoriyasi: "${newCat.name}"`);
  };

  const handleUpdateProductCategory = (categoryId: string, newName: string, newDesc?: string) => {
    recordLocalMutation('productCategories');
    const oldCat = productCategories.find((c) => c.id === categoryId);
    const oldName = oldCat?.name;

    setProductCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, name: newName, description: newDesc ?? c.description } : c))
    );

    // Cascade rename to all existing products in this category
    if (oldName && oldName !== newName) {
      recordLocalMutation('products');
      setProducts((prev) =>
        prev.map((p) => (p.category === oldName ? { ...p, category: newName } : p))
      );
    }

    showToast(`✓ Kategoriya nomi o'zgartirildi: "${newName}"`);
  };

  const handleDeleteProductCategory = (categoryId: string) => {
    recordLocalMutation('productCategories');
    const catToDelete = productCategories.find((c) => c.id === categoryId);
    if (!catToDelete) return;

    setProductCategories((prev) => prev.filter((c) => c.id !== categoryId));
    showToast(`✓ Kategoriya o'chirildi: "${catToDelete.name}"`);
  };

  // Employee Management handlers
  const handleAddEmployee = (newEmp: Employee) => {
    recordLocalMutation('employees');
    setEmployees((prev) => [newEmp, ...prev]);
    showToast(`✓ Xodim "${newEmp.fullName}" muvaffaqiyatli qo'shildi.`);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    recordLocalMutation('employees');
    setEmployees((prev) =>
      prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
    );
    showToast(`✓ "${updatedEmp.fullName}" ma'lumotlari yangilandi.`);
  };

  const handleDeleteEmployee = (empId: string) => {
    recordLocalMutation('employees');
    const emp = employees.find((e) => e.id === empId);
    setEmployees((prev) => prev.filter((e) => e.id !== empId));
    showToast(`✓ "${emp?.fullName || 'Xodim'}" ro'yxatdan o'chirildi.`);
  };

  const handleUpdateEmployeeStatus = (employeeId: string, newStatus: 'active' | 'on_site' | 'on_leave') => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, status: newStatus } : e))
    );
    if (currentUser && currentUser.id === employeeId) {
      setCurrentUser((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    const statusLabels: Record<string, string> = {
      active: "Faol (Bo'sh / Ishda)",
      on_site: "Obyektda (Montaj jarayonida)",
      on_leave: "Ta'tilda / Damda"
    };
    showToast(`✓ Usta holati yangilandi: ${statusLabels[newStatus] || newStatus}`);
  };

  // Payroll & Advance Handlers
  const handleAddPayroll = (record: PayrollRecord) => {
    setPayrolls((prev) => [record, ...prev]);

    // Avtomatik xarajat sifatida kiritish (kassa va buxgalteriya balansi uchun)
    const newExp: Expense = {
      id: `exp-pay-${Date.now()}`,
      category: 'Ish haqi / Oylik',
      amount: record.totalNet,
      paymentSource: record.paymentMethod === 'cash' ? 'Kassa (Naqd)' : 'Hisob raqam / Karta',
      paidTo: record.employeeName,
      notes: `${record.periodLabel} uchun ish haqi to'lovi (#${record.payrollNumber})`,
      createdAt: new Date().toISOString(),
      createdBy: 'Menejer'
    };
    setExpenses((prev) => [newExp, ...prev]);

    showToast(`✓ "${record.employeeName}"ga ${record.totalNet.toLocaleString()} so'm maosh to'landi (#${record.payrollNumber})`);
  };

  const handleAddAdvance = (advance: EmployeeAdvance) => {
    setAdvances((prev) => [advance, ...prev]);

    // Avtomatik xarajat sifatida kiritish
    const newExp: Expense = {
      id: `exp-adv-${Date.now()}`,
      category: 'Ish haqi / Oylik',
      amount: advance.amount,
      paymentSource: advance.paymentMethod === 'cash' ? 'Kassa (Naqd)' : 'Hisob raqam / Karta',
      paidTo: advance.employeeName,
      notes: `${advance.periodMonth} uchun avans (#${advance.advanceNumber})`,
      createdAt: new Date().toISOString(),
      createdBy: 'Menejer'
    };
    setExpenses((prev) => [newExp, ...prev]);

    showToast(`✓ "${advance.employeeName}"ga ${advance.amount.toLocaleString()} so'm avans berildi (#${advance.advanceNumber})`);
  };

  // Update Dollar Exchange Rate
  const handleUpdateExchangeRate = (newRate: number) => {
    setExchangeRate(newRate);
    try {
      localStorage.setItem('sc_exchange_rate', newRate.toString());
    } catch (e) {
      console.error(e);
    }
    showToast(`✓ Valyuta kursi yangilandi: 1$ = ${newRate.toLocaleString()} so'm`);
  };

  // Update Base System Currency
  const handleUpdateBaseCurrency = (currency: Currency) => {
    setBaseCurrency(currency);
    try {
      localStorage.setItem('sc_base_currency', currency);
    } catch (e) {
      console.error(e);
    }
    showToast(
      currency === 'USD'
        ? "✓ Asosiy tizim valyutasi AQSH Dollari ($ USD) ga o'zgartirildi"
        : "✓ Asosiy tizim valyutasi O'zbek so'mi (UZS) ga o'zgartirildi"
    );
  };

  // Service Ticket Handlers (Kafolat va Servis)
  const handleAddServiceTicket = (ticket: ServiceTicket) => {
    recordLocalMutation('serviceTickets');
    let nextList: ServiceTicket[] = [];
    setServiceTickets((prev) => {
      nextList = [ticket, ...prev];
      return nextList;
    });
    const finalTickets = nextList.length > 0 ? nextList : [ticket, ...serviceTickets];
    try {
      localStorage.setItem('sc_service_tickets', JSON.stringify(finalTickets));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ serviceTickets: finalTickets });
    showToast(`"${ticket.ticketNumber}" raqamli yangi servis arizasi ochildi!`);
  };

  const handleUpdateServiceTicket = (updated: ServiceTicket) => {
    recordLocalMutation('serviceTickets');
    let nextList: ServiceTicket[] = [];
    setServiceTickets((prev) => {
      nextList = prev.map((t) => (t.id === updated.id ? updated : t));
      return nextList;
    });
    const finalTickets = nextList.length > 0 ? nextList : serviceTickets.map((t) => (t.id === updated.id ? updated : t));
    try {
      localStorage.setItem('sc_service_tickets', JSON.stringify(finalTickets));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ serviceTickets: finalTickets });
    showToast(`"${updated.ticketNumber}" arizasi yangilandi!`);
  };

  const handleDeleteServiceTicket = (ticketId: string) => {
    recordLocalMutation('serviceTickets');
    const ticket = serviceTickets.find((t) => t.id === ticketId);
    let nextList: ServiceTicket[] = [];
    setServiceTickets((prev) => {
      nextList = prev.filter((t) => t.id !== ticketId);
      return nextList;
    });
    const finalTickets = nextList.length > 0 || serviceTickets.length === 1 ? nextList : serviceTickets.filter((t) => t.id !== ticketId);
    try {
      localStorage.setItem('sc_service_tickets', JSON.stringify(finalTickets));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ serviceTickets: finalTickets });
    showToast(`✓ "${ticket?.ticketNumber || 'Servis arizasi'}" o'chirildi`);
  };

  const handleReplaceDevice = (ticketId: string, oldSerial: string, newSerial: string, productId: string) => {
    recordLocalMutation('serviceTickets');
    recordLocalMutation('products');
    let nextTickets: ServiceTicket[] = [];
    setServiceTickets((prev) => {
      nextTickets = prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'replaced',
              replacementSerialNumber: newSerial,
              solutionNotes: `Nosoz ${oldSerial} ombordagi yangi ${newSerial} qurilmasiga almashtirildi.`
            }
          : t
      );
      return nextTickets;
    });

    let nextProducts: Product[] = [];
    setProducts((prev) => {
      nextProducts = prev.map((p) => {
        if (p.id === productId || (p.serialNumbers && p.serialNumbers.includes(newSerial))) {
          const updatedSerials = (p.serialNumbers || []).filter((sn) => sn !== newSerial);
          return {
            ...p,
            stockQuantity: Math.max(0, p.stockQuantity - 1),
            serialNumbers: updatedSerials
          };
        }
        return p;
      });
      return nextProducts;
    });

    const finalTickets = nextTickets.length > 0 ? nextTickets : serviceTickets;
    const finalProducts = nextProducts.length > 0 ? nextProducts : products;

    try {
      localStorage.setItem('sc_service_tickets', JSON.stringify(finalTickets));
      localStorage.setItem('sc_products', JSON.stringify(finalProducts));
    } catch (e) {
      console.error(e);
    }

    pushDataToCloud({ serviceTickets: finalTickets, products: finalProducts });
    showToast(`Qurilma muvaffaqiyatli almashtirildi! Yangi S/N: ${newSerial}`);
  };

  // Handover Report Handler (Obyekt Topshirish & Foto-Akt & Material Reconciliation)
  const handleSaveHandover = (handover: ObjectHandover) => {
    // 1. Save handover in state & storage
    setHandovers((prev) => {
      const exists = prev.some((h) => h.id === handover.id);
      const updated = exists ? prev.map((h) => (h.id === handover.id ? handover : h)) : [handover, ...prev];
      try {
        localStorage.setItem('sc_handovers', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    // 2. Inventory Reconciliation:
    // A) Returned items (Ortib qolgan tovarlarni ombor qoldig'iga qaytarish)
    if (handover.returnedItems && handover.returnedItems.length > 0) {
      setProducts((prev) =>
        prev.map((prod) => {
          const retMatch = handover.returnedItems?.find((r) => r.productId === prod.id);
          if (retMatch) {
            if (prod.isService) return prod;
            const newStock = prod.stockQuantity + retMatch.quantity;
            let updatedSerials = prod.serialNumbers ? [...prod.serialNumbers] : [];
            if (retMatch.serialNumbers && retMatch.serialNumbers.length > 0) {
              retMatch.serialNumbers.forEach((sn) => {
                if (!updatedSerials.includes(sn)) {
                  updatedSerials.push(sn);
                }
              });
            }
            return {
              ...prod,
              stockQuantity: newStock,
              serialNumbers: prod.hasSerialNumber ? updatedSerials : prod.serialNumbers
            };
          }
          return prod;
        })
      );
    }

    // B) Extra items (Joyida qo'shimcha sarflangan tovarlarni ombordan yechish)
    if (handover.extraItems && handover.extraItems.length > 0) {
      setProducts((prev) =>
        prev.map((prod) => {
          const extraMatch = handover.extraItems?.find((e) => e.productId === prod.id);
          if (extraMatch) {
            if (prod.isService) return prod;
            const newStock = Math.max(0, prod.stockQuantity - extraMatch.quantity);
            let updatedSerials = prod.serialNumbers ? [...prod.serialNumbers] : [];
            if (extraMatch.serialNumbers && extraMatch.serialNumbers.length > 0) {
              updatedSerials = updatedSerials.filter((sn) => !extraMatch.serialNumbers?.includes(sn));
            }
            return {
              ...prod,
              stockQuantity: newStock,
              serialNumbers: prod.hasSerialNumber ? updatedSerials : prod.serialNumbers
            };
          }
          return prod;
        })
      );
    }

    // 3. If linked to an order, update order status to 'completed'
    if (handover.orderId) {
      setCustomerOrders((prev) =>
        prev.map((o) =>
          o.id === handover.orderId
            ? {
                ...o,
                status: 'completed',
                hasHandoverReport: true,
                handoverReportId: handover.id
              }
            : o
        )
      );
    }

    // 4. Try to notify Telegram bot if enabled
    try {
      const tg = getTelegramSettings();
      if (tg.enabled && tg.botToken && tg.chatId) {
        const returnedMsg = handover.returnedItems && handover.returnedItems.length > 0
          ? `\n📦 *Omborga qaytgan:* ${handover.returnedItems.map((r) => `${r.productName} (${r.quantity} ${r.unit})`).join(', ')}`
          : '';
        const extraMsg = handover.extraItems && handover.extraItems.length > 0
          ? `\n⚡ *Qo'shimcha sarflangan:* ${handover.extraItems.map((e) => `${e.productName} (${e.quantity} ${e.unit})`).join(', ')}`
          : '';

        const msg = `📸 *YANGI OBYEKT TOPSHIRILDI!*\n\n` +
          `📋 *Dalolatnoma:* #${handover.handoverNumber}\n` +
          `👤 *Mijoz:* ${handover.customerName} (${handover.customerPhone || '—'})\n` +
          `📍 *Manzil:* ${handover.installationAddress}\n` +
          (handover.gpsLocation ? `🗺️ *GPS:* [Xaritada ko'rish](${handover.gpsLocation.mapUrl})\n` : '') +
          `🛠️ *Ustalar:* ${handover.technicians.map((t) => t.fullName).join(', ')}\n` +
          `⭐ *Mijoz Bahosi:* ${'⭐'.repeat(handover.clientRating)} (${handover.clientRating}/5)\n` +
          (handover.clientFeedback ? `💬 *Fikr:* _"${handover.clientFeedback}"_\n` : '') +
          `🖼️ *Suratlar soni:* ${handover.photos.length} ta\n` +
          returnedMsg +
          extraMsg +
          `\n✍️ *Mijoz imzosi:* Tasdiqlangan ✅\n` +
          `🕒 *Vaqt:* ${handover.createdAt}`;
        sendTelegramMessage(tg.botToken, tg.chatId, msg);
      }
    } catch (e) {
      console.error(e);
    }

    const retCount = handover.returnedItems?.length || 0;
    const extraCount = handover.extraItems?.length || 0;
    const reconciliationNote = retCount > 0 || extraCount > 0
      ? ` (Ombor qoldiqlari avtomatik moslashtirildi: ${retCount > 0 ? `${retCount} ta qaytarildi` : ''}${retCount > 0 && extraCount > 0 ? ', ' : ''}${extraCount > 0 ? `${extraCount} ta qo'shimcha yechildi` : ''})`
      : '';

    showToast(`✓ Obyekt topshirildi! Qabul dalolatnomasi #${handover.handoverNumber} saqlandi.${reconciliationNote}`);
  };

  const handleAddCustomerDebtPayment = (payment: CustomerDebtPayment) => {
    // 1. Update customer's debt balance
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === payment.customerId) {
          const newDebtUZS = Math.max(0, (c.debtBalance || 0) - payment.amountUZS);
          const newDebtUSD = Number((newDebtUZS / exchangeRate).toFixed(2));
          return {
            ...c,
            debtBalance: newDebtUZS,
            debtBalanceUSD: newDebtUSD
          };
        }
        return c;
      })
    );

    // 2. If payment is linked to a specific receipt, also deduct debt on that receipt
    if (payment.receiptId) {
      setReceipts((prev) =>
        prev.map((r) => {
          if (r.id === payment.receiptId) {
            const currentDebt = r.payments?.debt || 0;
            const newDebt = Math.max(0, currentDebt - payment.amountUZS);
            return {
              ...r,
              payments: {
                ...r.payments,
                debt: newDebt
              }
            };
          }
          return r;
        })
      );
    }

    // 3. Add to payment history
    setCustomerDebtPayments((prev) => [payment, ...prev]);

    showToast(`✓ Qarz to'lovi muvaffaqiyatli qabul qilindi! Kvitansiya ${payment.paymentNumber}`);
  };

  // -------------------------------------------------------------
  // CRM HANDLERS (Leads, Object Passports, Reminders)
  // -------------------------------------------------------------
  const handleAddLead = (lead: CrmLead) => {
    setCrmLeads((prev) => {
      const next = [lead, ...prev];
      localStorage.setItem('sc_crm_leads', JSON.stringify(next));
      return next;
    });
    showToast(`✓ Yangi lid saqlandi: ${lead.clientName}`);

    // Telegram notification
    try {
      const tgSettings = getTelegramSettings();
      if (tgSettings?.botToken && tgSettings?.chatId) {
        const msg = `🎯 <b>YANGI LID / MUROJAAT</b>\n\n` +
          `📌 <b>LID:</b> ${lead.leadNumber}\n` +
          `👤 <b>Mijoz:</b> ${lead.clientName}\n` +
          `📞 <b>Telefon:</b> ${lead.phone}\n` +
          `🏠 <b>Obyekt:</b> ${lead.objectType} | ${lead.address || '-'}\n` +
          `📹 <b>Kameralar:</b> ${lead.cameraCountEstimated || 0} ta\n` +
          `💰 <b>Byudjet:</b> $${lead.budgetEstimatedUSD || 0}\n` +
          `👷 <b>Usta:</b> ${lead.assignedTechnicianName || 'Biriktirilmagan'}\n` +
          `📝 <b>Izoh:</b> ${lead.notes || '-'}`;
        sendTelegramMessage(tgSettings.botToken, tgSettings.chatId, msg);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLead = (lead: CrmLead) => {
    setCrmLeads((prev) => {
      const next = prev.map((l) => (l.id === lead.id ? lead : l));
      localStorage.setItem('sc_crm_leads', JSON.stringify(next));
      return next;
    });
    showToast(`✓ Lid yangilandi: ${lead.leadNumber}`);
  };

  const handleDeleteLead = (leadId: string) => {
    setCrmLeads((prev) => {
      const next = prev.filter((l) => l.id !== leadId);
      localStorage.setItem('sc_crm_leads', JSON.stringify(next));
      return next;
    });
    showToast(`✓ Lid o'chirildi`);
  };

  const handleAddObjectPassport = (obj: CrmObjectPassport) => {
    setCrmObjectPassports((prev) => {
      const next = [obj, ...prev];
      localStorage.setItem('sc_crm_objects', JSON.stringify(next));
      return next;
    });
    showToast(`✓ Obyekt pasporti yaratildi: ${obj.objectName}`);
  };

  const handleUpdateObjectPassport = (obj: CrmObjectPassport) => {
    setCrmObjectPassports((prev) => {
      const next = prev.map((o) => (o.id === obj.id ? obj : o));
      localStorage.setItem('sc_crm_objects', JSON.stringify(next));
      return next;
    });
    showToast(`✓ Obyekt pasporti yangilandi`);
  };

  const handleDeleteObjectPassport = (objId: string) => {
    setCrmObjectPassports((prev) => {
      const next = prev.filter((o) => o.id !== objId);
      localStorage.setItem('sc_crm_objects', JSON.stringify(next));
      return next;
    });
    showToast(`✓ Obyekt pasporti o'chirildi`);
  };

  const handleAddReminder = (rem: CrmReminder) => {
    setCrmReminders((prev) => {
      const next = [rem, ...prev];
      localStorage.setItem('sc_crm_reminders', JSON.stringify(next));
      return next;
    });
    showToast(`✓ Eslatma qo'shildi: ${rem.title}`);
  };

  const handleToggleReminder = (remId: string) => {
    setCrmReminders((prev) => {
      const next = prev.map((r) => (r.id === remId ? { ...r, isCompleted: !r.isCompleted } : r));
      localStorage.setItem('sc_crm_reminders', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteReminder = (remId: string) => {
    setCrmReminders((prev) => {
      const next = prev.filter((r) => r.id !== remId);
      localStorage.setItem('sc_crm_reminders', JSON.stringify(next));
      return next;
    });
    showToast(`✓ Eslatma o'chirildi`);
  };

  const handleConvertLeadToOrder = (lead: CrmLead) => {
    setActiveTab('orders');
    showToast(`✓ Lid ${lead.leadNumber} bo'yicha smeta tuzish ochildi`);
  };

  // Calculate today's sales for header
  const todaySalesTotal = receipts.filter(r => isTodayDate(r.createdAt)).reduce((sum, r) => sum + r.totalAmount, 0);

  // Active tickets count for badge
  const activeServiceCount = serviceTickets.filter(
    (t) => t.status === 'in_diagnosis' || t.status === 'in_repair' || t.status === 'received'
  ).length;

  // Debtors count for badge
  const debtorsCount = customers.filter((c) => (c.debtBalance || 0) > 0).length;

  // If not authenticated, render LoginScreen
  if (!currentUser && isLoaded) {
    return (
      <LoginScreen
        employees={employees}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 flex h-[100dvh] max-h-[100dvh] w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 antialiased">
      {/* Left Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        technicianSubTab={technicianSubTab}
        onSelectTechnicianSubTab={setTechnicianSubTab}
        offlineCount={offlineCount}
        isOffline={isOffline}
        activeServiceCount={activeServiceCount}
        debtorsCount={debtorsCount}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={() => setIsSwitchUserModalOpen(true)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Top Header */}
        <Header
          isOffline={isOffline}
          setIsOffline={setIsOffline}
          offlineCount={offlineCount}
          onSync={handleSync}
          todaySalesTotal={todaySalesTotal}
          exchangeRate={exchangeRate}
          onUpdateExchangeRate={handleUpdateExchangeRate}
          baseCurrency={baseCurrency}
          onUpdateBaseCurrency={handleUpdateBaseCurrency}
          onOpenZReport={() => setIsZReportOpen(true)}
          currentUser={currentUser}
          onSwitchUser={() => setIsSwitchUserModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileNavOpen((prev) => !prev)}
          pendingEstimatesCount={pendingEstimatesCount}
          onOpenEstimatesApproval={() => setIsGlobalApprovalModalOpen(true)}
          onForceRefresh={handleForceSync}
        />

        {/* Dynamic Screen View */}
        <main className="flex-1 min-h-0 flex overflow-hidden">
          {activeTab === 'pos' && (
            <POSScreen
              products={products}
              customers={customers}
              employees={employees}
              customerOrders={customerOrders}
              onCompleteSale={handleCompleteSale}
              onAddCustomer={handleAddCustomer}
              onSaveOrder={handleSaveOrder}
              isOffline={isOffline}
              exchangeRate={exchangeRate}
              onUpdateExchangeRate={handleUpdateExchangeRate}
              baseCurrency={baseCurrency}
              onUpdateBaseCurrency={handleUpdateBaseCurrency}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersAndShipmentsScreen
              orders={customerOrders}
              shipments={shipments}
              products={products}
              customers={customers}
              employees={employees}
              exchangeRate={exchangeRate}
              baseCurrency={baseCurrency}
              currentUser={currentUser}
              handovers={handovers}
              onSaveOrder={handleSaveOrder}
              onDeleteOrder={handleDeleteOrder}
              onSaveShipment={handleSaveShipment}
              onCompleteShipmentSale={handleCompleteShipmentSale}
              onAddCustomer={handleAddCustomer}
              onSaveHandover={handleSaveHandover}
              onClearAllOrders={handleClearAllOrders}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardScreen
              products={products}
              customers={customers}
              receipts={receipts}
              expenses={expenses}
              aiInsights={aiInsights}
              onNavigateTab={(tab) => setActiveTab(tab)}
              isOffline={isOffline}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
            />
          )}

          {activeTab === 'financial_reports' && (
            <FinancialReportsScreen
              receipts={receipts}
              expenses={expenses}
              products={products}
              employees={employees}
              payrolls={payrolls}
              purchases={purchases}
              customers={customers}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              currentUser={currentUser}
              onReturnReceipt={handleReturnReceipt}
              onSaveEditReceipt={handleSaveEditReceipt}
              initialSubTab="pnl"
            />
          )}

          {activeTab === 'crm' && (
            <CrmScreen
              leads={crmLeads}
              onAddLead={handleAddLead}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              objectPassports={crmObjectPassports}
              onAddObjectPassport={handleAddObjectPassport}
              onUpdateObjectPassport={handleUpdateObjectPassport}
              onDeleteObjectPassport={handleDeleteObjectPassport}
              reminders={crmReminders}
              onAddReminder={handleAddReminder}
              onToggleReminder={handleToggleReminder}
              onDeleteReminder={handleDeleteReminder}
              employees={employees}
              customers={customers}
              customerOrders={customerOrders}
              products={products}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              onConvertToOrder={handleConvertLeadToOrder}
              onSaveOrder={handleSaveOrder}
              onNavigateToOrders={() => setActiveTab('orders')}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryScreen
              products={products}
              categories={productCategories}
              purchases={purchases}
              onSavePurchase={handleSavePurchase}
              onRecordSupplierPayment={handleRecordSupplierPayment}
              onCancelPurchase={handleCancelPurchase}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateStock={handleUpdateStock}
              onAddProductCategory={handleAddProductCategory}
              onUpdateProductCategory={handleUpdateProductCategory}
              onDeleteProductCategory={handleDeleteProductCategory}
              exchangeRate={exchangeRate}
              baseCurrency={baseCurrency}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'warranty' && (
            <WarrantyScreen
              products={products}
              receipts={receipts}
              purchases={purchases}
              serviceTickets={serviceTickets}
              onAddTicket={handleAddServiceTicket}
              onUpdateTicket={handleUpdateServiceTicket}
              onDeleteTicket={handleDeleteServiceTicket}
              onReplaceDevice={handleReplaceDevice}
              exchangeRate={exchangeRate}
              baseCurrency={baseCurrency}
              onViewReceipt={(receiptId) => {
                setActiveTab('financial_reports');
              }}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersScreen
              customers={customers}
              receipts={receipts}
              debtPayments={customerDebtPayments}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onUpdateCashback={handleUpdateCashback}
              onAddDebtPayment={handleAddCustomerDebtPayment}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              onViewReceipt={(receiptId) => {
                setActiveTab('financial_reports');
              }}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesScreen
              expenses={expenses}
              categories={expenseCategories}
              onAddExpense={handleAddExpense}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onDeleteExpense={handleDeleteExpense}
              todaySalesTotal={todaySalesTotal}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              employees={employees}
              payrolls={payrolls}
              advances={advances}
              receipts={receipts}
              shipments={shipments}
              customerOrders={customerOrders}
              customers={customers}
              purchases={purchases}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onAddPayroll={handleAddPayroll}
              onAddAdvance={handleAddAdvance}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              initialSubTab="all"
            />
          )}

          {activeTab === 'ai_advisor' && (
            <AIAdvisorScreen
              products={products}
              insights={aiInsights}
            />
          )}

          {activeTab === 'sales_history' && (
            <FinancialReportsScreen
              receipts={receipts}
              expenses={expenses}
              products={products}
              employees={employees}
              payrolls={payrolls}
              purchases={purchases}
              customers={customers}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              currentUser={currentUser}
              onReturnReceipt={handleReturnReceipt}
              onSaveEditReceipt={handleSaveEditReceipt}
              initialSubTab="sales_history"
            />
          )}

          {activeTab === 'employees' && (
            <ExpensesScreen
              expenses={expenses}
              categories={expenseCategories}
              onAddExpense={handleAddExpense}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onDeleteExpense={handleDeleteExpense}
              todaySalesTotal={todaySalesTotal}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              employees={employees}
              payrolls={payrolls}
              advances={advances}
              receipts={receipts}
              shipments={shipments}
              customerOrders={customerOrders}
              customers={customers}
              purchases={purchases}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onAddPayroll={handleAddPayroll}
              onAddAdvance={handleAddAdvance}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              initialSubTab="employees"
            />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              products={products}
              receipts={receipts}
              expenses={expenses}
              employees={employees}
              customers={customers}
              debtPayments={customerDebtPayments}
              serviceTickets={serviceTickets}
              purchases={purchases}
              exchangeRate={exchangeRate}
              onUpdateExchangeRate={handleUpdateExchangeRate}
              baseCurrency={baseCurrency}
              onUpdateBaseCurrency={handleUpdateBaseCurrency}
              currentUser={currentUser}
              onUpdateEmployee={handleUpdateEmployee}
            />
          )}

          {activeTab === 'technician_portal' && (
            <TechnicianPortalScreen
              currentUser={currentUser}
              employees={employees}
              orders={customerOrders}
              shipments={shipments}
              handovers={handovers}
              serviceTickets={serviceTickets}
              products={products}
              customers={customers}
              exchangeRate={exchangeRate}
              baseCurrency={baseCurrency}
              initialSubTab={technicianSubTab}
              onSaveHandover={handleSaveHandover}
              onSaveOrder={handleSaveOrder}
              onUpdateServiceTicket={handleUpdateServiceTicket}
              onUpdateEmployeeStatus={handleUpdateEmployeeStatus}
              onUpdateEmployee={handleUpdateEmployee}
              onRefresh={handleForceSync}
            />
          )}
        </main>
      </div>

      {/* Z-Report (Shift Closure) Modal */}
      <ZReportModal
        isOpen={isZReportOpen}
        onClose={() => setIsZReportOpen(false)}
        receipts={receipts}
        expenses={expenses}
        exchangeRate={exchangeRate}
        baseCurrency={baseCurrency}
        cashierName={currentUser?.fullName || "Farrux A."}
        branchName="Chilonzor-1 Filiali"
        onSaveZReport={(report) => {
          showToast(`Smena muvaffaqiyatli yopildi! Z-Hisobot: ${report.reportNumber}`);
        }}
      />

      {/* Global Cashier Order Approval Modal (Accessible via Header Bell & Notifications) */}
      <CashierOrderApprovalModal
        isOpen={isGlobalApprovalModalOpen}
        onClose={() => setIsGlobalApprovalModalOpen(false)}
        pendingOrders={(customerOrders || []).filter(o => o.status === 'pending_cashier_approval')}
        products={products}
        exchangeRate={exchangeRate}
        baseCurrency={baseCurrency}
        onApproveAndLoadToCart={(order) => {
          handleDirectApproveEstimate(order);
          setActiveTab('pos');
          setIsGlobalApprovalModalOpen(false);
        }}
        onDirectApproveSale={(order) => {
          handleDirectApproveEstimate(order);
          setIsGlobalApprovalModalOpen(false);
        }}
        onRejectOrder={(orderId, reason) => {
          handleRejectEstimate(orderId, reason);
        }}
      />

      {/* Switch Account Quick Modal */}
      {isSwitchUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl">
            <button
              type="button"
              onClick={() => setIsSwitchUserModalOpen(false)}
              className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <LoginScreen
              employees={employees}
              onLoginSuccess={handleLoginSuccess}
            />
          </div>
        </div>
      )}

      {/* Real-time Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-slate-900 text-white border border-slate-700/80 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
