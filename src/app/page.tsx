'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ActiveTab, Product, Customer, SaleReceipt, AIInsight, Expense, ExpenseCategory, ProductCategory, Employee, EmployeePermissions, CustomerOrder, ShipmentOrder, AssignedTechnician, PaymentDetails, CartItem, Currency, PurchaseInvoice, PurchasePaymentRecord, ServiceTicket, CustomerDebtPayment, ZReport, PayrollRecord, EmployeeAdvance, ObjectHandover, CrmLead, CrmObjectPassport, CrmReminder, DEFAULT_ROLE_TABS, DEFAULT_ROLE_PERMISSIONS, Branch, StockTransfer, AuditLog, AuditAction, AuditEntityType } from '../types';
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
  INITIAL_CUSTOMER_DEBT_PAYMENTS,
  INITIAL_PAYROLLS, 
  INITIAL_ADVANCES, 
  INITIAL_HANDOVERS,
  INITIAL_CRM_LEADS,
  INITIAL_CRM_OBJECTS,
  INITIAL_CRM_REMINDERS,
  INITIAL_BRANCHES,
  INITIAL_STOCK_TRANSFERS
} from '../data/mockData';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { POSScreen } from '../components/POSScreen';
import { DashboardScreen } from '../components/DashboardScreen';
import { InventoryScreen } from '../components/InventoryScreen';
import { CustomersScreen } from '../components/CustomersScreen';
import { ExpensesScreen } from '../components/ExpensesScreen';
import { AIAdvisorScreen } from '../components/AIAdvisorScreen';
import { OrdersAndShipmentsScreen } from '../components/OrdersAndShipmentsScreen';
import { WarrantyScreen } from '../components/WarrantyScreen';
import { SettingsScreen } from '../components/SettingsScreen';
import { TechnicianPortalScreen } from '../components/TechnicianPortalScreen';
import { FinancialReportsScreen } from '../components/FinancialReportsScreen';
import { CrmScreen } from '../components/CrmScreen';
import { ZReportModal } from '../components/ZReportModal';
import { CashierOrderApprovalModal } from '../components/CashierOrderApprovalModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { LoginScreen } from '../components/LoginScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AdminAuthModal } from '../components/AdminAuthModal';
import { getTelegramSettings, sendTelegramMessage, generateDailySalesReport } from '../utils/telegram';
import { isTodayDate, getNowFormatted } from '../utils/formatters';
import { playOrderNotificationSound } from '../utils/sound';
import { CheckCircle2, X } from 'lucide-react';

interface CloudSyncPayload {
  products?: Product[];
  productCategories?: ProductCategory[];
  customers?: Customer[];
  receipts?: SaleReceipt[];
  expenses?: Expense[];
  expenseCategories?: ExpenseCategory[];
  employees?: Employee[];
  customerOrders?: CustomerOrder[];
  shipments?: ShipmentOrder[];
  purchases?: PurchaseInvoice[];
  serviceTickets?: ServiceTicket[];
  customerDebtPayments?: CustomerDebtPayment[];
  payrolls?: PayrollRecord[];
  advances?: EmployeeAdvance[];
  handovers?: ObjectHandover[];
  crmLeads?: CrmLead[];
  crmObjectPassports?: CrmObjectPassport[];
  crmReminders?: CrmReminder[];
  branches?: Branch[];
  stockTransfers?: StockTransfer[];
  exchangeRate?: number;
  baseCurrency?: Currency;
  deletedProductIds?: string[];
  deletedPurchaseIds?: string[];
}

interface CloudSyncResponse {
  timestamp: number;
  modified?: boolean;
  data?: CloudSyncPayload | null;
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isSwitchUserModalOpen, setIsSwitchUserModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [settingsInitialTab, setSettingsInitialTab] = useState<'telegram' | 'reports' | 'store' | 'branches' | 'backup' | 'permissions' | 'ai' | 'integrations'>('branches');
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
  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>([]);
  const [customerDebtPayments, setCustomerDebtPayments] = useState<CustomerDebtPayment[]>(INITIAL_CUSTOMER_DEBT_PAYMENTS);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(INITIAL_PAYROLLS);
  const [advances, setAdvances] = useState<EmployeeAdvance[]>(INITIAL_ADVANCES);
  const [handovers, setHandovers] = useState<ObjectHandover[]>(INITIAL_HANDOVERS);
  const [aiInsights] = useState<AIInsight[]>(INITIAL_AI_INSIGHTS);
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>(INITIAL_CRM_LEADS);
  const [crmObjectPassports, setCrmObjectPassports] = useState<CrmObjectPassport[]>(INITIAL_CRM_OBJECTS);
  const [crmReminders, setCrmReminders] = useState<CrmReminder[]>(INITIAL_CRM_REMINDERS);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [currentBranchId, setCurrentBranchId] = useState<string>('branch-1');
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(INITIAL_STOCK_TRANSFERS);
  const [deletedProductIds, setDeletedProductIds] = useState<string[]>([]);
  const [deletedPurchaseIds, setDeletedPurchaseIds] = useState<string[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(12850);
  const [baseCurrency, setBaseCurrency] = useState<Currency>('UZS');
  const [technicianSubTab, setTechnicianSubTab] = useState<string>('active_jobs');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isZReportOpen, setIsZReportOpen] = useState<boolean>(false);
  const [isGlobalApprovalModalOpen, setIsGlobalApprovalModalOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [activeModalReceipt, setActiveModalReceipt] = useState<SaleReceipt | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminAuthModal, setAdminAuthModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionDetails?: string;
    onSuccess: (admin: Employee) => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onSuccess: () => {}
  });

  // Active branch selector
  const currentBranch = useMemo(() => {
    if (currentBranchId === 'all') return null;
    return branches.find(b => b.id === currentBranchId) || branches.find(b => b.isMain) || branches[0] || null;
  }, [branches, currentBranchId]);

  const pushDataToCloudRef = useRef<((overrideData?: Record<string, unknown>) => Promise<void>) | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Xavfsizlik & Audit Jurnali yozish funksiyasi
  const addAuditLog = useCallback(
    (entry: {
      action: AuditAction;
      entityType: AuditEntityType;
      entityId: string;
      entityTitle: string;
      details: string;
      oldValue?: string;
      newValue?: string;
      adminApproved?: boolean;
      adminName?: string;
      performedBy?: AuditLog['performedBy'];
    }) => {
      const isCurrentAdmin = Boolean(
        currentUser?.systemRole === 'admin' ||
        currentUser?.role?.toLowerCase().includes('admin')
      );

      const performer = entry.performedBy || {
        id: currentUser?.id || 'sys-admin',
        name: currentUser?.fullName || 'Bosh Administrator',
        role: currentUser?.role || 'Administrator',
        systemRole: currentUser?.systemRole || 'admin',
        branchName: currentBranch?.name || 'Bosh Filial'
      };

      const newLog: AuditLog = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleString('uz-UZ'),
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        entityTitle: entry.entityTitle,
        performedBy: performer,
        adminApproved:
          entry.adminApproved !== undefined ? entry.adminApproved : isCurrentAdmin,
        adminName:
          entry.adminName ||
          (entry.adminApproved !== false && isCurrentAdmin
            ? currentUser?.fullName
            : undefined),
        details: entry.details,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        branchId: currentBranch?.id
      };

      setAuditLogs((prev) => [newLog, ...prev]);
      try {
        const existing = localStorage.getItem('sc_audit_logs');
        const list = existing ? JSON.parse(existing) : [];
        list.unshift(newLog);
        localStorage.setItem('sc_audit_logs', JSON.stringify(list.slice(0, 500)));
      } catch (e) {
        console.error('Audit log save error', e);
      }
    },
    [currentUser, currentBranch]
  );

  // Administrator huquqi yoki maxsus berilgan ruxsatnoma bilan bajariladigan amallarni tekshirish
  const requestAdminAuth = (
    title: string,
    description: string,
    actionDetails: string,
    action: (verifiedAdmin?: Employee, byPermission?: boolean) => void,
    requiredPermission?: keyof EmployeePermissions
  ) => {
    const isCurrentAdmin = Boolean(
      currentUser?.systemRole === 'admin' ||
      currentUser?.role?.toLowerCase().includes('admin')
    );

    // 1. Agar foydalanuvchi Administrator bo'lsa, to'g'ridan-to'g'ri o'tkazish
    if (isCurrentAdmin) {
      action(currentUser || undefined, false);
      return;
    }

    // 2. Agar foydalanuvchiga (menejer/kassirga) admin tomonidan ushbu ruxsat berilgan bo'lsa:
    // Modal ochilmaydi, amal bajariladi, lekin audit tarixida ushbu xodim tomonidan o'zgartirilganligi aniq yoziladi!
    if (requiredPermission && currentUser?.permissions && Boolean(currentUser.permissions[requiredPermission])) {
      action(undefined, true);
      return;
    }

    // 3. Aks holda Administrator PIN-kodi yoki parolini so'rash
    setAdminAuthModal({
      isOpen: true,
      title,
      description,
      actionDetails,
      onSuccess: (verifiedAdmin) => {
        action(verifiedAdmin, false);
      }
    });
  };

  // Ustalardan kelgan tasdiqlash kutilayotgan smetalar soni
  const pendingEstimatesCount = (customerOrders || []).filter(o => o.status === 'pending_cashier_approval').length;

  // 1. Dastur ochilganda kompyuterning lokal xotirasidan ma'lumotlarni yuklash
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const isZeroClean = localStorage.getItem('sc_zero_clean_slate_v5');
        if (!isZeroClean) {
          localStorage.setItem('sc_receipts', '[]');
          localStorage.setItem('sc_expenses', '[]');
          localStorage.setItem('sc_advances', '[]');
          localStorage.setItem('sc_payrolls', '[]');
          localStorage.setItem('sc_customer_orders', '[]');
          localStorage.setItem('sc_shipments', '[]');
          localStorage.setItem('sc_handovers', '[]');
          localStorage.setItem('sc_purchases', '[]');
          localStorage.setItem('sc_service_tickets', '[]');
          localStorage.setItem('sc_customer_debt_payments', '[]');
          localStorage.setItem('sc_exchange_rate', '12850');

          const existingProdsRaw = localStorage.getItem('sc_products');
          let prodsToZero: Product[] = INITIAL_PRODUCTS;
          if (existingProdsRaw) {
            try {
              const parsed = JSON.parse(existingProdsRaw);
              if (Array.isArray(parsed)) prodsToZero = parsed;
            } catch (e) {}
          }
          const zeroedProds = prodsToZero.map(p => ({ ...p, stockQuantity: 0, serialNumbers: [] }));
          localStorage.setItem('sc_products', JSON.stringify(zeroedProds));
          localStorage.setItem('sc_zero_clean_slate_v5', 'true');

          setReceipts([]);
          setExpenses([]);
          setAdvances([]);
          setPayrolls([]);
          setCustomerOrders([]);
          setShipments([]);
          setHandovers([]);
          setPurchases([]);
          setServiceTickets([]);
          setCustomerDebtPayments([]);
          setExchangeRate(12850);
          setProducts(zeroedProds);

          fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reset: true, products: zeroedProds, exchangeRate: 12850 })
          }).catch(() => {});
        }

        const savedRate = localStorage.getItem('sc_exchange_rate');
      if (savedRate && !isNaN(Number(savedRate))) {
        setExchangeRate(Number(savedRate));
      }
      const savedCurrency = localStorage.getItem('sc_base_currency');
      if (savedCurrency === 'UZS' || savedCurrency === 'USD') {
        setBaseCurrency(savedCurrency);
      }
      const savedDeletedProdIds = localStorage.getItem('sc_deleted_product_ids');
      let activeDeletedProdIds: string[] = [];
      if (savedDeletedProdIds) {
        try {
          const parsedDelProds = JSON.parse(savedDeletedProdIds);
          if (Array.isArray(parsedDelProds)) {
            activeDeletedProdIds = parsedDelProds;
            setDeletedProductIds(parsedDelProds);
          }
        } catch (e) {}
      }

      const savedDeletedPurchIds = localStorage.getItem('sc_deleted_purchase_ids');
      let activeDeletedPurchIds: string[] = [];
      if (savedDeletedPurchIds) {
        try {
          const parsedDelPurch = JSON.parse(savedDeletedPurchIds);
          if (Array.isArray(parsedDelPurch)) {
            activeDeletedPurchIds = parsedDelPurch;
            setDeletedPurchaseIds(parsedDelPurch);
          }
        } catch (e) {}
      }

      const savedProducts = localStorage.getItem('sc_products');
      if (savedProducts !== null) {
        try {
          const parsed: Product[] = JSON.parse(savedProducts);
          if (Array.isArray(parsed)) {
            let filtered = parsed.filter(p => !activeDeletedProdIds.includes(p.id));
            filtered = filtered.map(p => {
              if (p.isService || p.id === 'prod-10' || p.sku === 'SRV-CAM-INST' || p.name.toLowerCase().includes('montaj') || p.name.toLowerCase().includes('xizmat')) {
                return { ...p, category: 'Montaj', isService: true, wholesalePrice: undefined };
              }
              return p;
            });

            // Deduplicate any accidental duplicate rows (e.g. repeated imports of same product)
            const seenKeys = new Set<string>();
            const deduplicated: Product[] = [];
            for (const item of filtered) {
              const k = (item.name || '').trim().toLowerCase();
              if (!seenKeys.has(k)) {
                seenKeys.add(k);
                deduplicated.push(item);
              } else {
                const existing = deduplicated.find(d => (d.name || '').trim().toLowerCase() === k);
                if (existing) {
                  const mergedSerials = Array.from(new Set([...(existing.serialNumbers || []), ...(item.serialNumbers || [])]));
                  existing.serialNumbers = mergedSerials.length > 0 ? mergedSerials : existing.serialNumbers;
                  if (existing.hasSerialNumber) {
                    existing.stockQuantity = mergedSerials.length;
                  }
                }
              }
            }

            // Ensure consistency: for any product with hasSerialNumber: true, stockQuantity must strictly match serialNumbers.length
            const sanitized = deduplicated.map(p => {
              if (p.isService) {
                return { ...p, stockQuantity: 9999 };
              }
              if (p.hasSerialNumber) {
                const snLen = p.serialNumbers?.length || 0;
                return { ...p, stockQuantity: snLen };
              }
              return p;
            });

            setProducts(sanitized);
            localStorage.setItem('sc_products', JSON.stringify(sanitized));
          } else {
            const initFiltered = INITIAL_PRODUCTS.filter(p => !activeDeletedProdIds.includes(p.id));
            setProducts(initFiltered);
          }
        } catch (e) {
          console.error("Failed to parse saved products", e);
        }
      } else {
        const initFiltered = INITIAL_PRODUCTS.filter(p => !activeDeletedProdIds.includes(p.id));
        localStorage.setItem('sc_products', JSON.stringify(initFiltered));
        setProducts(initFiltered);
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
      let currentCategories: ProductCategory[] = INITIAL_PRODUCT_CATEGORIES;
      if (savedProdCats) {
        try {
          const parsed = JSON.parse(savedProdCats);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentCategories = parsed;
          }
        } catch (e) {}
      }
      const hasMontaj = currentCategories.some(c => c.name.toLowerCase() === 'montaj');
      if (!hasMontaj) {
        const legacyIdx = currentCategories.findIndex(c => c.name.toLowerCase().includes('montaj') || c.name.toLowerCase().includes('o\'rnatish'));
        if (legacyIdx >= 0) {
          currentCategories[legacyIdx] = { ...currentCategories[legacyIdx], name: 'Montaj' };
        } else {
          currentCategories.push({
            id: 'pcat-montaj',
            name: 'Montaj',
            description: "Kamera o'rnatish, domofon montaj, kabel tortish va sozlash",
            color: '#EC4899'
          });
        }
      } else {
        currentCategories = currentCategories.map(c => 
          c.name.toLowerCase().includes('o\'rnatish & montaj') ? { ...c, name: 'Montaj' } : c
        );
      }
      setProductCategories(currentCategories);
      localStorage.setItem('sc_product_categories', JSON.stringify(currentCategories));

      const savedEmployees = localStorage.getItem('sc_employees');
      if (savedEmployees) {
        try {
          let parsedEmp: Employee[] = JSON.parse(savedEmployees);
          if (Array.isArray(parsedEmp)) {
            // Guarantee technician_portal is included for all technicians
            parsedEmp = parsedEmp.map((emp) => {
              if (emp.systemRole === 'technician' || (emp.role && emp.role.toLowerCase().includes('usta') && emp.systemRole !== 'admin' && emp.systemRole !== 'manager')) {
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

            // Ensure at least one admin exists if employees exist, but NEVER overwrite the user's staff!
            if (parsedEmp.length > 0 && !parsedEmp.some((e) => e.systemRole === 'admin')) {
              parsedEmp[0].systemRole = 'admin';
            }
            setEmployees(parsedEmp);
          }
        } catch (e) {
          console.error("Failed to parse saved employees", e);
        }
      } else {
        localStorage.setItem('sc_employees', JSON.stringify(INITIAL_EMPLOYEES));
        setEmployees(INITIAL_EMPLOYEES);
      }

      const savedUser = localStorage.getItem('sc_current_user');
      if (savedUser) {
        try {
          let user: Employee = JSON.parse(savedUser);
          if (user.systemRole === 'technician' || (user.role && user.role.toLowerCase().includes('usta') && user.systemRole !== 'admin' && user.systemRole !== 'manager')) {
            user = { ...user, allowedTabs: ['technician_portal'] as ActiveTab[] };
            setActiveTab('technician_portal');
          } else if (user.systemRole === 'admin' || user.systemRole === 'manager' || !user.systemRole || (user.role && user.role.toLowerCase().includes('admin'))) {
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
            user = {
              ...user,
              systemRole: user.systemRole || 'admin',
              allowedTabs: tabs,
              permissions: {
                ...(DEFAULT_ROLE_PERMISSIONS.admin || {}),
                ...(user.permissions || {}),
                onlyAssignedOrders: false
              }
            };
            try {
              localStorage.setItem('sc_current_user', JSON.stringify(user));
            } catch (e) {}
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
      if (savedPurchases !== null) {
        try {
          const parsedPurchases = JSON.parse(savedPurchases);
          if (Array.isArray(parsedPurchases)) {
            const filteredPurchases = parsedPurchases.filter(p => !activeDeletedPurchIds.includes(p.id));
            setPurchases(filteredPurchases);
          } else {
            setPurchases(INITIAL_PURCHASES.filter(p => !activeDeletedPurchIds.includes(p.id)));
          }
        } catch (e) {
          setPurchases(INITIAL_PURCHASES.filter(p => !activeDeletedPurchIds.includes(p.id)));
        }
      } else {
        const initPurchasesFiltered = INITIAL_PURCHASES.filter(p => !activeDeletedPurchIds.includes(p.id));
        localStorage.setItem('sc_purchases', JSON.stringify(initPurchasesFiltered));
        setPurchases(initPurchasesFiltered);
      }

      const isTicketsPurged = localStorage.getItem('sc_service_tickets_clean_v1');
      if (!isTicketsPurged) {
        localStorage.setItem('sc_service_tickets', JSON.stringify([]));
        localStorage.setItem('sc_service_tickets_clean_v1', 'true');
        setServiceTickets([]);
        pushDataToCloudRef.current?.({ serviceTickets: [] });
      } else {
        const savedTickets = localStorage.getItem('sc_service_tickets');
        if (savedTickets) {
          try {
            const parsed = JSON.parse(savedTickets);
            if (Array.isArray(parsed)) {
              const cleaned = (parsed as ServiceTicket[]).filter((ticket) => ticket.id !== 'srv-101' && ticket.id !== 'srv-102');
              setServiceTickets(cleaned);
              localStorage.setItem('sc_service_tickets', JSON.stringify(cleaned));
            }
          } catch (e) {
            setServiceTickets([]);
          }
        } else {
          setServiceTickets([]);
        }
      }

      const savedDebtPayments = localStorage.getItem('sc_customer_debt_payments');
      if (savedDebtPayments) setCustomerDebtPayments(JSON.parse(savedDebtPayments));

      const savedAuditLogs = localStorage.getItem('sc_audit_logs');
      if (savedAuditLogs) {
        try {
          setAuditLogs(JSON.parse(savedAuditLogs));
        } catch (e) {}
      }

      const savedPayrolls = localStorage.getItem('sc_payrolls');
      if (savedPayrolls) setPayrolls(JSON.parse(savedPayrolls));

      const savedAdvances = localStorage.getItem('sc_advances');
      if (savedAdvances) setAdvances(JSON.parse(savedAdvances));

      const savedHandovers = localStorage.getItem('sc_handovers');
      if (savedHandovers) setHandovers(JSON.parse(savedHandovers));

      const savedLeads = localStorage.getItem('sc_crm_leads');
      if (savedLeads) setCrmLeads(JSON.parse(savedLeads));

      const savedObjects = localStorage.getItem('sc_crm_objects');
      if (savedObjects) {
        try {
          const parsed = JSON.parse(savedObjects);
          if (Array.isArray(parsed)) {
            // Merge initial floorPlans into mock objects if missing
            const merged = parsed.map((obj: CrmObjectPassport) => {
              const initObj = INITIAL_CRM_OBJECTS.find(io => io.id === obj.id);
              if (initObj && (!obj.floorPlans || obj.floorPlans.length === 0)) {
                return {
                  ...obj,
                  floorPlans: initObj.floorPlans,
                  installationStage: obj.installationStage || initObj.installationStage,
                  cablingCompletedDate: obj.cablingCompletedDate || initObj.cablingCompletedDate,
                  cablingTechnicianName: obj.cablingTechnicianName || initObj.cablingTechnicianName
                };
              }
              return obj;
            });
            setCrmObjectPassports(merged);
            localStorage.setItem('sc_crm_objects', JSON.stringify(merged));
          } else {
            setCrmObjectPassports(INITIAL_CRM_OBJECTS);
          }
        } catch (e) {
          setCrmObjectPassports(INITIAL_CRM_OBJECTS);
        }
      } else {
        setCrmObjectPassports(INITIAL_CRM_OBJECTS);
      }

      const savedReminders = localStorage.getItem('sc_crm_reminders');
      if (savedReminders) setCrmReminders(JSON.parse(savedReminders));

      const savedBranches = localStorage.getItem('sc_branches');
      if (savedBranches) {
        try {
          const parsed = JSON.parse(savedBranches);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBranches(parsed);
          } else if (INITIAL_BRANCHES.length > 0) {
            setBranches(INITIAL_BRANCHES);
            localStorage.setItem('sc_branches', JSON.stringify(INITIAL_BRANCHES));
          }
        } catch (e) {
          console.error("Failed to parse saved branches", e);
        }
      } else {
        localStorage.setItem('sc_branches', JSON.stringify(INITIAL_BRANCHES));
        setBranches(INITIAL_BRANCHES);
      }

      const savedCurrentBranchId = localStorage.getItem('sc_current_branch_id');
      if (savedCurrentBranchId) {
        setCurrentBranchId(savedCurrentBranchId);
      }

      const savedTransfers = localStorage.getItem('sc_stock_transfers');
      if (savedTransfers) {
        try {
          const parsed = JSON.parse(savedTransfers);
          if (Array.isArray(parsed)) {
            setStockTransfers(parsed);
          }
        } catch (e) {
          console.error("Failed to parse saved transfers", e);
        }
      }
    } catch (e) {
      console.error("Local storage load error", e);
    } finally {
      setIsLoaded(true);
    }
    }, 0);
    return () => clearTimeout(timer);
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
  const pushDataToCloud = async (overrideData?: Partial<CloudSyncPayload>) => {
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
        branches,
        stockTransfers,
        exchangeRate,
        baseCurrency,
        deletedProductIds,
        deletedPurchaseIds,
        ...(overrideData || {})
      };
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json: CloudSyncResponse = await res.json();
        if (json.timestamp) {
          lastSyncedTimestampRef.current = json.timestamp;
        }
      }
    } catch (e) {
      console.warn('Cloud sync push error', e);
    }
  };

  useEffect(() => {
    pushDataToCloudRef.current = pushDataToCloud;
  });

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
      localStorage.setItem('sc_branches', JSON.stringify(branches));
      localStorage.setItem('sc_current_branch_id', currentBranchId);
      localStorage.setItem('sc_stock_transfers', JSON.stringify(stockTransfers));
      localStorage.setItem('sc_base_currency', baseCurrency);

      // Push to central cloud sync
      pushDataToCloudRef.current?.();
    } catch (e) {
      console.error("Local storage save error", e);
    }
  }, [products, productCategories, customers, receipts, expenses, expenseCategories, employees, customerOrders, shipments, purchases, serviceTickets, customerDebtPayments, payrolls, advances, handovers, branches, currentBranchId, stockTransfers, baseCurrency, isLoaded]);

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
        const sinceQuery = force ? '' : `?since=${lastSyncedTimestampRef.current}`;
        const res = await fetch(`/api/sync${sinceQuery}`, { cache: 'no-store' });
        if (!res.ok) {
          isSyncingRef.current = false;
          return;
        }
        const json: CloudSyncResponse = await res.json();
        
        // If server says no changes since our timestamp, do not transfer or process anything
        if (json.modified === false) {
          return;
        }

        // If server is empty, push local state to initialize server
        if (!json.data || !json.timestamp) {
          pushDataToCloudRef.current?.();
          return;
        }

        // If server has newer data or forced manual refresh
        if (force || json.timestamp > lastSyncedTimestampRef.current) {
          lastSyncedTimestampRef.current = json.timestamp;
          const remote = json.data;

          if (remote.customerOrders) {
            const rawOrders = remote.customerOrders;
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
                const newAssignedJob = deduped.find((o) =>
                  !prevIds.has(o.id) && (
                    o.technicianId === currentUser.id ||
                    (o.technicians && o.technicians.some((technician) => technician.id === currentUser.id || technician.fullName?.toLowerCase().includes(currentUser.fullName.toLowerCase())))
                  )
                );
                if (newAssignedJob) {
                  playOrderNotificationSound();
                  showToast(`🔔 Yangi montaj topshirig'i keldi! (#${newAssignedJob.orderNumber})`);
                }

                // Check if any estimate created by or assigned to this technician was REJECTED by cashier
                const newlyRejectedEstimate = deduped.find((o) => {
                  const prevOrd = prevOrders.find((previousOrder) => previousOrder.id === o.id || previousOrder.orderNumber === o.orderNumber);
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
                const newPendingEstimate = deduped.find((o) =>
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
          if (remote.deletedProductIds && Array.isArray(remote.deletedProductIds)) {
            setDeletedProductIds((prev) => {
              const merged = Array.from(new Set([...prev, ...remote.deletedProductIds!]));
              try { localStorage.setItem('sc_deleted_product_ids', JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }
          if (remote.deletedPurchaseIds && Array.isArray(remote.deletedPurchaseIds)) {
            setDeletedPurchaseIds((prev) => {
              const merged = Array.from(new Set([...prev, ...remote.deletedPurchaseIds!]));
              try { localStorage.setItem('sc_deleted_purchase_ids', JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }

          if (remote.products && !isLocalRecentlyMutated('products')) {
            const localRawProd = typeof window !== 'undefined' ? localStorage.getItem('sc_products') : null;
            const localHasProds = localRawProd && localRawProd !== '[]';
            if (remote.products.length === 0 && localHasProds && !force) {
              pushDataToCloudRef.current?.();
            } else {
              const allDelProds = new Set([...deletedProductIds, ...(remote.deletedProductIds || [])]);
              const sanitizedProducts = remote.products.filter(p => !allDelProds.has(p.id));
              setProducts(sanitizedProducts);
            }
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
            // Guard employees: do not let stale cloud mock data overwrite user's custom employees
            const isRemoteMockEmp = remote.employees.some(e => e.fullName === 'Farrux Aliyev') && remote.employees.some(e => e.fullName === 'Jamshid Normurodov');
            const localRawEmp = typeof window !== 'undefined' ? localStorage.getItem('sc_employees') : null;
            const localHasCustomEmp = localRawEmp && !localRawEmp.includes('Farrux Aliyev') && localRawEmp.length > 10;

            if (isRemoteMockEmp && localHasCustomEmp) {
              // Local has real custom staff, remote has stale mock data. Keep local and update cloud!
              pushDataToCloudRef.current?.();
            } else {
              setEmployees(remote.employees);
            }
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
          if (remote.purchases && !isLocalRecentlyMutated('purchases')) {
            const localRawPurch = typeof window !== 'undefined' ? localStorage.getItem('sc_purchases') : null;
            const localHasPurch = localRawPurch && localRawPurch !== '[]';
            if (remote.purchases.length === 0 && localHasPurch && !force) {
              pushDataToCloudRef.current?.();
            } else {
              const allDelPurch = new Set([...deletedPurchaseIds, ...(remote.deletedPurchaseIds || [])]);
              const sanitizedPurchases = remote.purchases.filter(p => !allDelPurch.has(p.id));
              setPurchases(sanitizedPurchases);
            }
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
          if (remote.branches && (!isLocalRecentlyMutated('branches') || force)) {
            // Guard branches: do not let stale cloud mock branches overwrite user's custom branches
            const isRemoteMockBranch = remote.branches.some(b => b.name === 'Chilonzor-1 Filiali') && remote.branches.some(b => b.name === 'Samarqand Filiali');
            const localRawBranch = typeof window !== 'undefined' ? localStorage.getItem('sc_branches') : null;
            const localHasCustomBranch = localRawBranch && !localRawBranch.includes('Chilonzor-1 Filiali') && localRawBranch.length > 10;

            if (isRemoteMockBranch && localHasCustomBranch) {
              // Local has real custom branches, remote has stale mock data. Keep local and update cloud!
              pushDataToCloudRef.current?.();
            } else {
              setBranches(remote.branches);
            }
          }
          if (remote.stockTransfers && (!isLocalRecentlyMutated('stockTransfers') || force)) {
            setStockTransfers(remote.stockTransfers);
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

    // Smart polling: only polls every 15 seconds when the tab is visible (99.9% bandwidth saving)
    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncWithCloud();
      }
    }, 15000);

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
  }, [isLoaded, currentUser, showToast]);

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
  }, [isLoaded, receipts, expenses, exchangeRate, showToast]);

  // Offline receipts count
  const offlineReceipts = receipts.filter((r) => r.isOffline && !r.synced);
  const offlineCount = offlineReceipts.length;

  // Universal Global Capture-Phase Escape Key listener for all sections & modals
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        // 1. If root page modals are open, close them first
        if (isSwitchUserModalOpen || isZReportOpen || isGlobalApprovalModalOpen || isMobileNavOpen) {
          setIsSwitchUserModalOpen(false);
          setIsZReportOpen(false);
          setIsGlobalApprovalModalOpen(false);
          setIsMobileNavOpen(false);
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // 2. Query all visible modal dialogs, backdrops, or overlays in DOM
        const potentialOverlays = Array.from(
          document.querySelectorAll<HTMLElement>(
            '.fixed.inset-0, [role="dialog"], [aria-modal="true"], dialog[open]'
          )
        ).filter(el => {
          try {
            const style = window.getComputedStyle(el);
            const isVisible =
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              style.opacity !== '0' &&
              el.offsetWidth > 0 &&
              el.offsetHeight > 0;
            const isShell =
              el.closest('header.sticky') ||
              el.classList.contains('sidebar-container') ||
              el.tagName === 'BODY' ||
              el.tagName === 'HTML';
            return isVisible && !isShell;
          } catch (e) {
            return false;
          }
        });

        if (potentialOverlays.length > 0) {
          // Get topmost overlay
          const topModal = potentialOverlays[potentialOverlays.length - 1];

          // Search for close / cancel button
          const buttons = Array.from(topModal.querySelectorAll<HTMLButtonElement>('button'));

          // Option A: Button containing Lucide X icon or close title/aria
          const xBtn = buttons.find(b => {
            const hasXIcon = b.querySelector('svg.lucide-x') !== null || b.querySelector('svg[class*="lucide-x"]') !== null;
            const titleOrAria = (b.getAttribute('title') || b.getAttribute('aria-label') || '').toLowerCase();
            return hasXIcon || titleOrAria.includes('yopish') || titleOrAria.includes('close') || titleOrAria.includes('bekor');
          });

          if (xBtn) {
            xBtn.click();
            e.preventDefault();
            e.stopPropagation();
            return;
          }

          // Option B: Button with Uzbek, Russian, English Cancel / Close text
          const cancelTextBtn = buttons.find(b => {
            const txt = b.textContent?.trim().toLowerCase() || '';
            return [
              'bekor qilish',
              'yopish',
              'bekor',
              'chiqish',
              'orqaga',
              'отмена',
              'закрыть',
              'cancel',
              'close'
            ].includes(txt);
          });

          if (cancelTextBtn) {
            cancelTextBtn.click();
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [isSwitchUserModalOpen, isZReportOpen, isGlobalApprovalModalOpen, isMobileNavOpen]);

  // Login handler
  const handleLoginSuccess = (emp: Employee) => {
    setCurrentUser(emp);
    try {
      localStorage.setItem('sc_current_user', JSON.stringify(emp));
    } catch (e) {
      console.error(e);
    }
    setIsSwitchUserModalOpen(false);

    // If employee is assigned to a specific branch, auto-switch to that branch
    if (emp.branchId) {
      setCurrentBranchId(emp.branchId);
      localStorage.setItem('sc_current_branch_id', emp.branchId);
    }

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
    // 0. Hard validation: Ensure no physical out-of-stock items can ever be sold
    for (const item of newReceipt.items) {
      if (!item.product.isService) {
        const prod = products.find((p) => p.id === item.product.id);
        const avail = prod
          ? (prod.hasSerialNumber ? (prod.serialNumbers?.length || 0) : (prod.stockQuantity || 0))
          : 0;
        if (avail <= 0 || item.quantity > avail) {
          showToast(`❌ Xatolik: «${item.product.name}» tovari omborda mavjud emas (Omborda: ${avail}, So'ralgan: ${item.quantity})! Sotuv rad etildi.`);
          return;
        }
      }
    }

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

    requestAdminAuth(
      "Chek tovarlarini qaytarish (Vozvrat)",
      `Chek #${targetReceipt.receiptNumber} bo'yicha tovarlarni qaytarish va mijozga hisob-kitob qilish faqat Administrator ruxsati bilan amalga oshiriladi.`,
      `Chek: #${targetReceipt.receiptNumber} | Sabab: ${returnData.reason || "Ko'rsatilmadi"}`,
      (verifiedAdmin, byPermission) => {
        let totalRefundSum = 0;

        // 1. Reconcile Products (Add stock and S/N back to inventory)
        setProducts((prev) =>
          prev.map((prod) => {
            const returnedMatch = returnData.itemsToReturn.find((it) => it.productId === prod.id);
            if (returnedMatch) {
              const newQty = prod.isService ? prod.stockQuantity : prod.stockQuantity + returnedMatch.quantity;
              
              const updatedSerials = prod.serialNumbers ? [...prod.serialNumbers] : [];
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

        // 5. Update linked customer orders if any (Smeta va Hisob-kitoblar bo'limi)
        setCustomerOrders((prev) =>
          prev.map((o) => {
            const isMatch =
              o.receiptId === receiptId ||
              o.id === `ord-pos-${receiptId}` ||
              o.orderNumber === `ORD-${targetReceipt.receiptNumber}` ||
              o.orderNumber.includes(targetReceipt.receiptNumber.replace(/^CR-/, ''));

            if (isMatch) {
              const updatedItems = o.items.map((item) => {
                const retMatch = returnData.itemsToReturn.find((it) => it.productId === item.productId);
                if (retMatch) {
                  const prevReturned = item.returnedQuantity || 0;
                  return {
                    ...item,
                    returnedQuantity: prevReturned + retMatch.quantity
                  };
                }
                return item;
              });

              const allFullyReturned = updatedItems.every(
                (it) => (it.returnedQuantity || 0) >= it.quantity
              );

              const totalRefundedSoFar = (o.totalRefunded || 0) + totalRefundSum;

              return {
                ...o,
                items: updatedItems,
                totalRefunded: totalRefundedSoFar,
                status: allFullyReturned ? 'returned' : 'partially_returned'
              };
            }
            return o;
          })
        );

        // 6. Update linked shipments if any (Otgruzka bo'limi)
        setShipments((prev) =>
          prev.map((s) => {
            const isMatch =
              s.receiptId === receiptId ||
              s.orderId === `ord-pos-${receiptId}` ||
              s.shipmentNumber.includes(targetReceipt.receiptNumber.replace(/^CR-/, ''));

            if (isMatch) {
              const updatedItems = s.items.map((item) => {
                const retMatch = returnData.itemsToReturn.find((it) => it.productId === item.productId);
                if (retMatch) {
                  const prevReturned = item.returnedQuantity || 0;
                  return {
                    ...item,
                    returnedQuantity: prevReturned + retMatch.quantity
                  };
                }
                return item;
              });

              const allFullyReturned = updatedItems.every(
                (it) => (it.returnedQuantity || 0) >= it.quantity
              );

              const totalRefundedSoFar = (s.totalRefunded || 0) + totalRefundSum;

              return {
                ...s,
                items: updatedItems,
                totalRefunded: totalRefundedSoFar,
                status: allFullyReturned ? 'returned' : 'partially_returned'
              };
            }
            return s;
          })
        );

        const approvedName = verifiedAdmin?.fullName
          ? verifiedAdmin.fullName
          : byPermission
            ? `${currentUser?.fullName} (Admin ruxsati bilan)`
            : (currentUser?.fullName || 'Administrator');

        addAuditLog({
          action: 'return',
          entityType: 'receipt',
          entityId: targetReceipt.id,
          entityTitle: `Chek #${targetReceipt.receiptNumber}`,
          details: `Chekdan tovarlar qaytarildi (Vozvrat: ${totalRefundSum.toLocaleString()} so'm). Qaytarish usuli: ${returnData.refundMethod}. Sabab: ${returnData.reason || "Ko'rsatilmadi"}${byPermission ? " [Admin ruxsati bilan]" : ""}`,
          newValue: `Vozvrat: -${totalRefundSum.toLocaleString()} so'm`,
          adminApproved: true,
          adminName: approvedName
        });

        showToast(`✓ Tovarlar omborga muvaffaqiyatli qaytarildi! (Vozvrat: ${totalRefundSum.toLocaleString()} so'm)`);
      },
      'canReturnReceipts'
    );
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
    const oldReceipt = receipts.find((r) => r.id === receiptId);

    requestAdminAuth(
      "Sotuv chekini tahrirlash",
      `Chek #${updatedReceipt.receiptNumber} ma'lumotlarini o'zgartirish faqat Administrator ruxsati bilan amalga oshiriladi.`,
      `Chek: #${updatedReceipt.receiptNumber} | Yangi summa: ${updatedReceipt.totalAmount.toLocaleString()} so'm`,
      (verifiedAdmin, byPermission) => {
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

        const approvedName = verifiedAdmin?.fullName
          ? verifiedAdmin.fullName
          : byPermission
            ? `${currentUser?.fullName} (Admin ruxsati bilan)`
            : (currentUser?.fullName || 'Administrator');

        addAuditLog({
          action: 'update',
          entityType: 'receipt',
          entityId: updatedReceipt.id,
          entityTitle: `Chek #${updatedReceipt.receiptNumber}`,
          details: `Sotilgan chek ma'lumotlari tahrirlandi. Eski summa: ${oldReceipt ? oldReceipt.totalAmount.toLocaleString() : 0} so'm -> Yangi summa: ${updatedReceipt.totalAmount.toLocaleString()} so'm${byPermission ? " [Admin ruxsati bilan]" : ""}`,
          oldValue: oldReceipt ? `${oldReceipt.totalAmount.toLocaleString()} so'm` : undefined,
          newValue: `${updatedReceipt.totalAmount.toLocaleString()} so'm`,
          adminApproved: true,
          adminName: approvedName
        });

        showToast(`✓ Chek ${updatedReceipt.receiptNumber} muvaffaqiyatli yangilandi!`);
      },
      'canEditReceipts'
    );
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
    const finalProducts = [newProd, ...products.filter(p => p.id !== newProd.id)];
    setProducts(finalProducts);

    const updatedDeletedIds = deletedProductIds.filter(id => id !== newProd.id);
    setDeletedProductIds(updatedDeletedIds);

    try {
      localStorage.setItem('sc_products', JSON.stringify(finalProducts));
      localStorage.setItem('sc_deleted_product_ids', JSON.stringify(updatedDeletedIds));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ products: finalProducts, deletedProductIds: updatedDeletedIds });
    showToast(`✓ "${newProd.name}" omborga muvaffaqiyatli qo'shildi.`);
  };

  // Batch Import Products from Excel with atomic state update & strict Deduplication
  const handleImportProductsBatch = (importedProducts: Product[], mode: 'append' | 'merge' = 'append') => {
    if (!importedProducts || importedProducts.length === 0) return;
    recordLocalMutation('products');

    const getProductDedupeKey = (p: Product) => {
      const trimmedName = (p.name || '').trim().toLowerCase();
      const hasRealBarcode = p.barcode && !p.barcode.startsWith('BC-');
      const hasRealSku = p.sku && !p.sku.startsWith('SKU-');
      if (hasRealBarcode) return `bc:${p.barcode.trim().toLowerCase()}`;
      if (hasRealSku) return `sku:${p.sku.trim().toLowerCase()}`;
      return `name:${trimmedName}`;
    };

    // 1. Deduplicate within the incoming batch first
    const importedKeyMap = new Map<string, Product>();
    for (const item of importedProducts) {
      const key = getProductDedupeKey(item);
      const existingInBatch = importedKeyMap.get(key);
      if (!existingInBatch) {
        importedKeyMap.set(key, { ...item });
      } else {
        const mergedSerials = Array.from(new Set([...(existingInBatch.serialNumbers || []), ...(item.serialNumbers || [])]));
        const combinedStock = existingInBatch.isService ? 9999 : (existingInBatch.hasSerialNumber ? mergedSerials.length : existingInBatch.stockQuantity + item.stockQuantity);
        importedKeyMap.set(key, {
          ...existingInBatch,
          stockQuantity: combinedStock,
          serialNumbers: mergedSerials.length > 0 ? mergedSerials : existingInBatch.serialNumbers,
          costPrice: item.costPrice > 0 ? item.costPrice : existingInBatch.costPrice,
          costPriceUSD: (item.costPriceUSD && item.costPriceUSD > 0) ? item.costPriceUSD : existingInBatch.costPriceUSD,
          retailPrice: item.retailPrice > 0 ? item.retailPrice : existingInBatch.retailPrice,
          retailPriceUSD: (item.retailPriceUSD && item.retailPriceUSD > 0) ? item.retailPriceUSD : existingInBatch.retailPriceUSD,
          wholesalePrice: (item.wholesalePrice && item.wholesalePrice > 0) ? item.wholesalePrice : existingInBatch.wholesalePrice,
        });
      }
    }

    const uniqueImportedList = Array.from(importedKeyMap.values());

    // 2. Merge / Update against existing warehouse products
    const workingProducts = [...products];
    let addedCount = 0;
    let updatedCount = 0;

    for (const newP of uniqueImportedList) {
      const existingIdx = workingProducts.findIndex(p => {
        const pKey = getProductDedupeKey(p);
        const newKey = getProductDedupeKey(newP);
        if (pKey === newKey) return true;
        if (p.name.trim().toLowerCase() === newP.name.trim().toLowerCase()) return true;
        if (p.barcode && newP.barcode && !p.barcode.startsWith('BC-') && !newP.barcode.startsWith('BC-') && p.barcode.trim().toLowerCase() === newP.barcode.trim().toLowerCase()) return true;
        if (p.sku && newP.sku && !p.sku.startsWith('SKU-') && !newP.sku.startsWith('SKU-') && p.sku.trim().toLowerCase() === newP.sku.trim().toLowerCase()) return true;
        return false;
      });

      if (existingIdx !== -1) {
        // MATCH FOUND! Avoid duplicate entry
        const existing = workingProducts[existingIdx];
        const mergedSerials = Array.from(new Set([...(existing.serialNumbers || []), ...(newP.serialNumbers || [])]));
        
        let newStock = existing.stockQuantity;
        if (existing.isService) {
          newStock = 9999;
        } else if (existing.hasSerialNumber || newP.hasSerialNumber) {
          newStock = mergedSerials.length;
        } else if (mode === 'merge') {
          newStock = existing.stockQuantity + newP.stockQuantity;
        } else {
          newStock = newP.stockQuantity > 0 ? (existing.stockQuantity > 0 ? existing.stockQuantity + newP.stockQuantity : newP.stockQuantity) : existing.stockQuantity;
        }

        workingProducts[existingIdx] = {
          ...existing,
          category: newP.category || existing.category,
          unit: newP.unit || existing.unit,
          costPrice: newP.costPrice > 0 ? newP.costPrice : existing.costPrice,
          costPriceUSD: (newP.costPriceUSD && newP.costPriceUSD > 0) ? newP.costPriceUSD : existing.costPriceUSD,
          retailPrice: newP.retailPrice > 0 ? newP.retailPrice : existing.retailPrice,
          retailPriceUSD: (newP.retailPriceUSD && newP.retailPriceUSD > 0) ? newP.retailPriceUSD : existing.retailPriceUSD,
          wholesalePrice: (newP.wholesalePrice && newP.wholesalePrice > 0) ? newP.wholesalePrice : existing.wholesalePrice,
          stockQuantity: newStock,
          hasSerialNumber: existing.hasSerialNumber || newP.hasSerialNumber,
          serialNumbers: mergedSerials.length > 0 ? mergedSerials : existing.serialNumbers,
          warrantyMonths: newP.warrantyMonths || existing.warrantyMonths
        };
        updatedCount++;
      } else {
        workingProducts.unshift(newP);
        addedCount++;
      }
    }

    // 3. Remove any previous duplicate rows that might already exist in workingProducts
    const finalCleanList: Product[] = [];
    const seenFinalKeys = new Set<string>();
    for (const p of workingProducts) {
      const k = getProductDedupeKey(p);
      if (!seenFinalKeys.has(k)) {
        seenFinalKeys.add(k);
        finalCleanList.push(p);
      }
    }

    setProducts(finalCleanList);

    const importedIds = new Set(finalCleanList.map(p => p.id));
    const nextDeletedIds = deletedProductIds.filter(id => !importedIds.has(id));
    setDeletedProductIds(nextDeletedIds);

    try {
      localStorage.setItem('sc_products', JSON.stringify(finalCleanList));
      localStorage.setItem('sc_deleted_product_ids', JSON.stringify(nextDeletedIds));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ products: finalCleanList, deletedProductIds: nextDeletedIds });

    showToast(`✓ Excel import yakunlandi: ${addedCount} ta yangi tovar qo'shildi, ${updatedCount} ta mavjud tovar yangilandi.`);
  };

  // Update Stock
  const handleUpdateStock = (productId: string, newStock: number) => {
    recordLocalMutation('products');
    const finalProducts = products.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p));
    setProducts(finalProducts);
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
    const finalProducts = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    setProducts(finalProducts);
    try {
      localStorage.setItem('sc_products', JSON.stringify(finalProducts));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ products: finalProducts });
    showToast(`✓ "${updatedProduct.name}" tahrirlandi.`);
  };

  // Batch Update Products (e.g. bulk S/N toggle or bulk price updates)
  const handleUpdateProductsBatch = (updatedList: Product[]) => {
    if (!updatedList || updatedList.length === 0) return;
    recordLocalMutation('products');
    const updateMap = new Map(updatedList.map(p => [p.id, p]));
    const finalProducts = products.map(p => updateMap.get(p.id) || p);
    setProducts(finalProducts);
    try {
      localStorage.setItem('sc_products', JSON.stringify(finalProducts));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ products: finalProducts });
    showToast(`✓ ${updatedList.length} ta mahsulot muvaffaqiyatli yangilandi.`);
  };

  // Delete Product (O'chirish)
  const handleDeleteProduct = (productId: string) => {
    recordLocalMutation('products');
    const prod = products.find((p) => p.id === productId);
    const finalProducts = products.filter((p) => p.id !== productId);
    setProducts(finalProducts);

    const updatedDeletedIds = Array.from(new Set([...deletedProductIds, productId]));
    setDeletedProductIds(updatedDeletedIds);

    try {
      localStorage.setItem('sc_products', JSON.stringify(finalProducts));
      localStorage.setItem('sc_deleted_product_ids', JSON.stringify(updatedDeletedIds));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ products: finalProducts, deletedProductIds: updatedDeletedIds });
    showToast(`✓ "${prod?.name || 'Tovar'}" ombordan butunlay o'chirildi.`);
  };

  // Ombor qoldig'ini butunlay 0 ga tushirish (tozalash)
  const handleClearAllStock = () => {
    recordLocalMutation('products');
    const zeroed = products.map((p) => {
      if (p.isService) {
        return { ...p, stockQuantity: 9999 };
      }
      return {
        ...p,
        stockQuantity: 0,
        serialNumbers: []
      };
    });
    setProducts(zeroed);
    try {
      localStorage.setItem('sc_products', JSON.stringify(zeroed));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ products: zeroed });
    showToast("✓ Barcha tovarlar ombor qoldig'i 0 ga tushirildi (Tozalandi)!");
  };

  // Omborga tovar kirimi (Prixod / Nakladnoy) - Yangi qo'shish va Tahrirlash (Redakt)
  const handleSavePurchase = (invoice: PurchaseInvoice, updatedProducts: Product[]) => {
    recordLocalMutation('products');
    recordLocalMutation('purchases');
    let nextPurchases: PurchaseInvoice[] = [];
    setPurchases((prev) => {
      const exists = prev.some((p) => p.id === invoice.id);
      if (exists) {
        nextPurchases = prev.map((p) => (p.id === invoice.id ? invoice : p));
      } else {
        nextPurchases = [invoice, ...prev];
      }
      return nextPurchases;
    });
    setProducts(updatedProducts);
    const finalPurchases = nextPurchases.length > 0 ? nextPurchases : [invoice, ...purchases.filter((p) => p.id !== invoice.id)];
    try {
      localStorage.setItem('sc_purchases', JSON.stringify(finalPurchases));
      localStorage.setItem('sc_products', JSON.stringify(updatedProducts));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ purchases: finalPurchases, products: updatedProducts });

    const isEdit = purchases.some((p) => p.id === invoice.id);
    addAuditLog({
      action: isEdit ? 'update' : 'create',
      entityType: 'purchase',
      entityId: invoice.id,
      entityTitle: `Kirim nakladnoyi #${invoice.invoiceNumber}`,
      details: `${isEdit ? 'Tahrirlandi' : 'Yangi kiritildi'}. Ta'minotchi: ${invoice.supplierName} | Jami summa: ${invoice.totalAmount.toLocaleString()} so'm | Tovarlar soni: ${invoice.items?.length || 0}`,
      newValue: `${invoice.totalAmount.toLocaleString()} so'm`,
      adminApproved: currentUser?.systemRole === 'admin'
    });

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
    const target = purchases.find((p) => p.id === invoiceId);
    if (!target || target.status === 'cancelled') return;

    requestAdminAuth(
      "Kirim nakladnoyini bekor qilish",
      `Nakladnoy #${target.invoiceNumber}ni bekor qilish faqat Administrator huquqi bilan amalga oshiriladi. Tovarlar ombor qoldig'idan chiqariladi.`,
      `Nakladnoy: #${target.invoiceNumber} | Ta'minotchi: ${target.supplierName} | Summa: ${target.totalAmount.toLocaleString()} so'm`,
      (verifiedAdmin, byPermission) => {
        recordLocalMutation('purchases');
        recordLocalMutation('products');

        let updatedProducts = [...products];
        if (target.items && target.items.length > 0) {
          target.items.forEach((item) => {
            updatedProducts = updatedProducts.map((prod) => {
              if (prod.id === item.productId || prod.name === item.productName) {
                const currentStock = prod.stockQuantity || 0;
                const newStock = Math.max(0, currentStock - (item.quantity || 1));
                let newSerialNumbers = prod.serialNumbers || [];
                if (item.serialNumbers && item.serialNumbers.length > 0) {
                  const itemSns = new Set(item.serialNumbers);
                  newSerialNumbers = newSerialNumbers.filter((sn) => !itemSns.has(sn));
                }
                return {
                  ...prod,
                  stockQuantity: newStock,
                  serialNumbers: newSerialNumbers,
                };
              }
              return prod;
            });
          });
        }

        const nextPurchases = purchases.map((p) => (p.id === invoiceId ? { ...p, status: 'cancelled' as const } : p));
        setPurchases(nextPurchases);
        setProducts(updatedProducts);

        try {
          localStorage.setItem('sc_purchases', JSON.stringify(nextPurchases));
          localStorage.setItem('sc_products', JSON.stringify(updatedProducts));
        } catch (e) {
          console.error(e);
        }

        pushDataToCloud({ purchases: nextPurchases, products: updatedProducts });

        const approvedName = verifiedAdmin?.fullName
          ? verifiedAdmin.fullName
          : byPermission
            ? `${currentUser?.fullName} (Admin ruxsati bilan)`
            : (currentUser?.fullName || 'Administrator');

        addAuditLog({
          action: 'update',
          entityType: 'purchase',
          entityId: target.id,
          entityTitle: `Kirim nakladnoyi #${target.invoiceNumber}`,
          details: `Nakladnoy bekor qilindi (Status: Bekor qilingan). Ta'minotchi: ${target.supplierName}, Summa: ${target.totalAmount.toLocaleString()} so'm${byPermission ? " [Admin ruxsati bilan]" : ""}`,
          oldValue: `${target.totalAmount.toLocaleString()} so'm`,
          newValue: "Bekor qilindi",
          adminApproved: true,
          adminName: approvedName
        });

        showToast(`✓ #${target.invoiceNumber} kirim nakladnoyi bekor qilindi va tovarlar qoldiqdan chiqarildi.`);
      },
      'canCancelPurchases'
    );
  };

  // Kirim nakladnoyini (Prixodni) butunlay o'chirish va ombor qoldig'ini qaytarish
  const handleDeletePurchase = (invoiceId: string) => {
    const target = purchases.find((p) => p.id === invoiceId);
    if (!target) return;

    requestAdminAuth(
      "Kirim nakladnoyini (Prixod) butunlay o'chirish",
      `Nakladnoy #${target.invoiceNumber}ni tizimdan butunlay o'chirish ombor qoldig'iga ta'sir qiladi. Ushbu amal faqat Administrator ruxsati bilan bajariladi.`,
      `Nakladnoy: #${target.invoiceNumber} | Ta'minotchi: ${target.supplierName} | Summa: ${target.totalAmount.toLocaleString()} so'm`,
      (verifiedAdmin, byPermission) => {
        recordLocalMutation('purchases');
        recordLocalMutation('products');

        // Agar prixod bekor qilinmagan bo'lsa (ya'ni tovarlar omborga kirgan bo'lsa),
        // ushbu tovarlar sonini ombor qoldig'idan kamaytirish va seriya raqamlarini tozalash
        let updatedProducts = [...products];
        if (target.status !== 'cancelled' && target.items && target.items.length > 0) {
          target.items.forEach((item) => {
            updatedProducts = updatedProducts.map((prod) => {
              if (prod.id === item.productId || prod.name === item.productName) {
                const currentStock = prod.stockQuantity || 0;
                const newStock = Math.max(0, currentStock - (item.quantity || 1));
                let newSerialNumbers = prod.serialNumbers || [];
                if (item.serialNumbers && item.serialNumbers.length > 0) {
                  const itemSns = new Set(item.serialNumbers);
                  newSerialNumbers = newSerialNumbers.filter((sn) => !itemSns.has(sn));
                }
                return {
                  ...prod,
                  stockQuantity: newStock,
                  serialNumbers: newSerialNumbers,
                };
              }
              return prod;
            });
          });
        }

        const nextPurchases = purchases.filter((p) => p.id !== invoiceId);
        const updatedDeletedPurchases = Array.from(new Set([...deletedPurchaseIds, invoiceId]));
        setDeletedPurchaseIds(updatedDeletedPurchases);
        setPurchases(nextPurchases);
        setProducts(updatedProducts);

        try {
          localStorage.setItem('sc_purchases', JSON.stringify(nextPurchases));
          localStorage.setItem('sc_products', JSON.stringify(updatedProducts));
          localStorage.setItem('sc_deleted_purchase_ids', JSON.stringify(updatedDeletedPurchases));
        } catch (e) {
          console.error(e);
        }

        pushDataToCloud({
          purchases: nextPurchases,
          products: updatedProducts,
          deletedPurchaseIds: updatedDeletedPurchases
        });

        const approvedName = verifiedAdmin?.fullName
          ? verifiedAdmin.fullName
          : byPermission
            ? `${currentUser?.fullName} (Admin ruxsati bilan)`
            : (currentUser?.fullName || 'Administrator');

        addAuditLog({
          action: 'delete',
          entityType: 'purchase',
          entityId: target.id,
          entityTitle: `Kirim nakladnoyi #${target.invoiceNumber}`,
          details: `Nakladnoy butunlay o'chirildi. Ta'minotchi: ${target.supplierName}, Summa: ${target.totalAmount.toLocaleString()} so'm${byPermission ? " [Admin ruxsati bilan]" : ""}`,
          oldValue: `${target.totalAmount.toLocaleString()} so'm`,
          adminApproved: true,
          adminName: approvedName
        });

        showToast(`✓ #${target.invoiceNumber} prixod butunlay o'chirildi va ombor qoldig'i to'g'rilandi!`);
      },
      'canDeletePurchases'
    );
  };

  // Filial qo'shish
  const handleAddBranch = (newBranch: Branch) => {
    recordLocalMutation('branches');
    let updatedBranches: Branch[] = [];
    setBranches((prev) => {
      let updated = [...prev];
      if (newBranch.isMain) {
        updated = updated.map((b) => ({ ...b, isMain: false }));
      }
      updatedBranches = [...updated, newBranch];
      return updatedBranches;
    });
    try {
      const currentList = branches.filter(b => b.id !== newBranch.id);
      const combined = newBranch.isMain ? currentList.map(b => ({ ...b, isMain: false })) : currentList;
      const finalBranches = [...combined, newBranch];
      localStorage.setItem('sc_branches', JSON.stringify(finalBranches));
      pushDataToCloud({ branches: finalBranches });
    } catch (e) {
      console.error(e);
    }
    showToast(`✓ Yangi filial "${newBranch.name}" muvaffaqiyatli qo'shildi!`);
  };

  // Filialni yangilash
  const handleUpdateBranch = (updatedBranch: Branch) => {
    recordLocalMutation('branches');
    let updatedBranches: Branch[] = [];
    setBranches((prev) => {
      updatedBranches = prev.map((b) => {
        if (b.id === updatedBranch.id) return updatedBranch;
        if (updatedBranch.isMain) return { ...b, isMain: false };
        return b;
      });
      return updatedBranches;
    });
    try {
      const finalBranches = branches.map(b => {
        if (b.id === updatedBranch.id) return updatedBranch;
        if (updatedBranch.isMain) return { ...b, isMain: false };
        return b;
      });
      localStorage.setItem('sc_branches', JSON.stringify(finalBranches));
      pushDataToCloud({ branches: finalBranches });
    } catch (e) {
      console.error(e);
    }
    showToast(`✓ "${updatedBranch.name}" filiali ma'lumotlari yangilandi!`);
  };

  // Filialni o'chirish
  const handleDeleteBranch = (branchId: string) => {
    const toDelete = branches.find((b) => b.id === branchId);
    if (!toDelete) return;

    if (branches.length <= 1) {
      alert("Oxirgi bitta filialni o'chirib bo'lmaydi! Kamida bitta filial tizimda mavjud bo'lishi shart.");
      return;
    }

    // Yangi filiallar ro'yxati
    let updatedBranches = branches.filter((b) => b.id !== branchId);

    // Agar o'chirilayotgan filial asosiy bo'lsa, qolgan birinchi filialni asosiy qilib tayinlaymiz
    if (toDelete.isMain && updatedBranches.length > 0) {
      updatedBranches = updatedBranches.map((b, idx) => idx === 0 ? { ...b, isMain: true } : b);
    }

    const nextMain = updatedBranches.find((b) => b.isMain) || updatedBranches[0];

    recordLocalMutation('branches');
    setBranches(updatedBranches);
    try {
      localStorage.setItem('sc_branches', JSON.stringify(updatedBranches));
    } catch (e) {
      console.error("Local storage branch delete error", e);
    }

    // Agar joriy faol filial o'chirilgan bo'lsa, keyingi filialga o'tkazish
    if (currentBranchId === branchId && nextMain) {
      setCurrentBranchId(nextMain.id);
      try {
        localStorage.setItem('sc_current_branch_id', nextMain.id);
      } catch (e) {
        console.error("Local storage branch id switch error", e);
      }
    }

    // O'chirilgan filial xodimlarini keyingi filialga o'tkazish
    let updatedEmployees = employees;
    if (nextMain && employees.some((emp) => emp.branchId === branchId)) {
      recordLocalMutation('employees');
      updatedEmployees = employees.map((emp) =>
        emp.branchId === branchId ? { ...emp, branchId: nextMain.id } : emp
      );
      setEmployees(updatedEmployees);
      try {
        localStorage.setItem('sc_employees', JSON.stringify(updatedEmployees));
      } catch (e) {
        console.error("Local storage employee branch update error", e);
      }
    }

    // Bulutga darhol push qilish
    pushDataToCloudRef.current?.({ branches: updatedBranches, employees: updatedEmployees });

    showToast(`✓ "${toDelete.name}" filiali muvaffaqiyatli o'chirildi.`);
  };

  // Faol filialni tanlash / almashtirish
  const handleSelectBranch = (branch: Branch | null) => {
    if (!branch) {
      setCurrentBranchId('all');
      localStorage.setItem('sc_current_branch_id', 'all');
      showToast(`✓ Barcha filiallar (konsolidatsiyalangan) tanlandi`);
      return;
    }
    setCurrentBranchId(branch.id);
    localStorage.setItem('sc_current_branch_id', branch.id);
    showToast(`✓ Faol filial tanlandi: ${branch.name}`);
  };

  // Filiallararo tovar ko'chirish (Peremesheniya)
  const handleAddStockTransfer = (transfer: StockTransfer, updatedProducts: Product[]) => {
    recordLocalMutation('stockTransfers');
    recordLocalMutation('products');
    setStockTransfers((prev) => [transfer, ...prev]);
    setProducts(updatedProducts);
    try {
      localStorage.setItem('sc_products', JSON.stringify(updatedProducts));
      localStorage.setItem('sc_stock_transfers', JSON.stringify([transfer, ...stockTransfers]));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ products: updatedProducts, stockTransfers: [transfer, ...stockTransfers] });
    showToast(`✓ #${transfer.transferNumber} raqamli peremesheniya muvaffaqiyatli amalga oshirildi!`);
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

  // Delete Customer
  const handleDeleteCustomer = (customerId: string) => {
    recordLocalMutation('customers');
    const updated = customers.filter(c => c.id !== customerId);
    setCustomers(updated);
    try {
      localStorage.setItem('sc_customers', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ customers: updated });
    showToast("✓ Mijoz o'chirildi.");
  };

  // Clear all customer debts to 0
  const handleClearAllDebts = () => {
    recordLocalMutation('customers');
    const updated = customers.map(c => ({
      ...c,
      debtBalance: 0,
      debtBalanceUSD: 0
    }));
    setCustomers(updated);
    try {
      localStorage.setItem('sc_customers', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ customers: updated });
    showToast("✓ Barcha qarzdorliklar 0 ga tushirildi (Tozalandi)!");
  };

  // Clear all customers database
  const handleClearAllCustomers = () => {
    recordLocalMutation('customers');
    setCustomers([]);
    try {
      localStorage.setItem('sc_customers', JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ customers: [] });
    showToast("✓ Barcha mijozlar bazasi tozalandi!");
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

    // Audit jurnali yozuvi
    addAuditLog({
      action: 'create',
      entityType: 'expense',
      entityId: newExp.id,
      entityTitle: `${newExp.type === 'income' ? 'Kirim (Prixod)' : 'Chiqim (Xarajat)'}: ${newExp.category}`,
      details: `${newExp.amount.toLocaleString()} so'm | To'lov manbai: ${newExp.paymentSource} | Kontragent: ${newExp.paidTo || newExp.paidBy || newExp.customerName || '-'} | Izoh: ${newExp.notes || '-'}`,
      newValue: `${newExp.amount.toLocaleString()} so'm`,
      adminApproved: currentUser?.systemRole === 'admin'
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    const target = expenses.find((e) => e.id === expenseId);
    if (!target) return;

    requestAdminAuth(
      "Moliya yozuvini (kirim/chiqim) o'chirish",
      `"${target.category}" yozuvini o'chirish faqat Administrator ruxsati bilan amalga oshiriladi.`,
      `Tur: ${target.type === 'income' ? 'Kirim' : 'Chiqim'} | Summa: ${target.amount.toLocaleString()} so'm | Manba: ${target.paymentSource}`,
      (verifiedAdmin, byPermission) => {
        recordLocalMutation('expenses');
        const updated = expenses.filter((e) => e.id !== expenseId);
        setExpenses(updated);
        try {
          localStorage.setItem('sc_expenses', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        pushDataToCloud({ expenses: updated });

        const approvedName = verifiedAdmin?.fullName
          ? verifiedAdmin.fullName
          : byPermission
            ? `${currentUser?.fullName} (Admin ruxsati bilan)`
            : (currentUser?.fullName || 'Administrator');

        addAuditLog({
          action: 'delete',
          entityType: 'expense',
          entityId: target.id,
          entityTitle: `${target.type === 'income' ? 'Kirim' : 'Chiqim'}: ${target.category}`,
          details: `${target.amount.toLocaleString()} so'm o'chirildi. Manba: ${target.paymentSource} | Kontragent: ${target.paidTo || target.paidBy || target.customerName || '-'}${byPermission ? " [Admin ruxsati bilan]" : ""}`,
          oldValue: `${target.amount.toLocaleString()} so'm`,
          adminApproved: true,
          adminName: approvedName
        });

        showToast(`✓ Moliya yozuvi o'chirildi!`);
      },
      'canDeleteExpenses'
    );
  };

  const handleDeleteReceipt = (receiptId: string) => {
    const receiptToDelete = receipts.find((r) => r.id === receiptId);
    if (!receiptToDelete) return;

    requestAdminAuth(
      "Sotuv chekini o'chirish",
      `Chek #${receiptToDelete.receiptNumber}ni tizimdan o'chirish ombor qoldig'i va hisobotlarga ta'sir qiladi. Ushbu amal faqat Administrator ruxsati bilan bajariladi.`,
      `Chek: #${receiptToDelete.receiptNumber} | Summa: ${receiptToDelete.totalAmount.toLocaleString()} so'm`,
      (verifiedAdmin, byPermission) => {
        recordLocalMutation('receipts');
        recordLocalMutation('products');
        let updatedProducts = products;
        if (receiptToDelete.status !== 'returned') {
          updatedProducts = products.map((prod) => {
            const item = receiptToDelete.items.find((i) => i.product.id === prod.id);
            if (item) {
              if (prod.isService) {
                return prod;
              }
              if (prod.hasSerialNumber) {
                const restoredSerials = item.selectedSerialNumbers ? [...(prod.serialNumbers || []), ...item.selectedSerialNumbers] : (prod.serialNumbers || []);
                const uniqueSerials = Array.from(new Set(restoredSerials));
                return {
                  ...prod,
                  stockQuantity: uniqueSerials.length,
                  serialNumbers: uniqueSerials
                };
              }
              return {
                ...prod,
                stockQuantity: Math.max(0, prod.stockQuantity + item.quantity)
              };
            }
            return prod;
          });
          setProducts(updatedProducts);
          try {
            localStorage.setItem('sc_products', JSON.stringify(updatedProducts));
          } catch (e) {}
        }
        const updatedReceipts = receipts.filter((r) => r.id !== receiptId);
        setReceipts(updatedReceipts);
        try {
          localStorage.setItem('sc_receipts', JSON.stringify(updatedReceipts));
        } catch (e) {}
        pushDataToCloud({ receipts: updatedReceipts, products: updatedProducts });

        const approvedName = verifiedAdmin?.fullName
          ? verifiedAdmin.fullName
          : byPermission
            ? `${currentUser?.fullName} (Admin ruxsati bilan)`
            : (currentUser?.fullName || 'Administrator');

        addAuditLog({
          action: 'delete',
          entityType: 'receipt',
          entityId: receiptToDelete.id,
          entityTitle: `Chek #${receiptToDelete.receiptNumber}`,
          details: `Sotuv cheki #${receiptToDelete.receiptNumber} o'chirildi (${receiptToDelete.totalAmount.toLocaleString()} so'm). Tovarlar omborga qaytarildi.${byPermission ? " [Admin ruxsati bilan]" : ""}`,
          oldValue: `${receiptToDelete.totalAmount.toLocaleString()} so'm`,
          adminApproved: true,
          adminName: approvedName
        });

        showToast("✓ Savdo tushumi muvaffaqiyatli o'chirildi!");
      },
      'canDeleteReceipts'
    );
  };

  const handleClearCashFlow = () => {
    requestAdminAuth(
      "Barcha pul oqimi va kassa ma'lumotlarini tozalash",
      "DIQQAT! Barcha kassa tushumlari va chiqimlar butunlay o'chiriladi. Bu amalni faqat Administrator tasdiqlashi mumkin.",
      `Hozirgi yozuvlar: ${expenses.length} ta xarajat, ${receipts.length} ta chek`,
      (verifiedAdmin, byPermission) => {
        recordLocalMutation('expenses');
        recordLocalMutation('receipts');
        setExpenses([]);
        setReceipts([]);
        try {
          localStorage.setItem('sc_expenses', JSON.stringify([]));
          localStorage.setItem('sc_receipts', JSON.stringify([]));
        } catch (e) {}
        pushDataToCloud({ expenses: [], receipts: [] });

        const approvedName = verifiedAdmin?.fullName
          ? verifiedAdmin.fullName
          : byPermission
            ? `${currentUser?.fullName} (Admin ruxsati bilan)`
            : (currentUser?.fullName || 'Administrator');

        addAuditLog({
          action: 'delete',
          entityType: 'expense',
          entityId: 'all-cashflow',
          entityTitle: "Barcha pul oqimi va kassa tushumlari",
          details: `Barcha kassa yozuvlari va xarajatlar to'liq tozalandi${byPermission ? " [Admin ruxsati bilan]" : ""}`,
          adminApproved: true,
          adminName: approvedName
        });

        showToast("✓ Barcha pul oqimi va kassa tushumlari tozalandi!");
      },
      'canDeleteExpenses'
    );
  };

  const handleDeleteAdvance = (advanceId: string) => {
    const target = advances.find((a) => a.id === advanceId);
    if (!target) return;

    requestAdminAuth(
      "Avans yozuvini o'chirish",
      `"${target.employeeName}" uchun berilgan #${target.advanceNumber} avans yozuvini o'chirish faqat Administrator ruxsati bilan bajariladi.`,
      `Xodim: ${target.employeeName} | Summa: ${target.amount.toLocaleString()} so'm`,
      (verifiedAdmin, byPermission) => {
        recordLocalMutation('advances');
        const updated = advances.filter((a) => a.id !== advanceId);
        setAdvances(updated);
        try {
          localStorage.setItem('sc_advances', JSON.stringify(updated));
        } catch (e) {}
        pushDataToCloud({ advances: updated });

        const approvedName = verifiedAdmin?.fullName
          ? verifiedAdmin.fullName
          : byPermission
            ? `${currentUser?.fullName} (Admin ruxsati bilan)`
            : (currentUser?.fullName || 'Administrator');

        addAuditLog({
          action: 'delete',
          entityType: 'advance',
          entityId: target.id,
          entityTitle: `Avans #${target.advanceNumber}`,
          details: `"${target.employeeName}"ga berilgan ${target.amount.toLocaleString()} so'm avans yozuvi o'chirildi.${byPermission ? " [Admin ruxsati bilan]" : ""}`,
          oldValue: `${target.amount.toLocaleString()} so'm`,
          adminApproved: true,
          adminName: approvedName
        });

        showToast("✓ Avans yozuvi o'chirildi!");
      },
      'canManageAdvances'
    );
  };

  const handleClearAdvances = () => {
    requestAdminAuth(
      "Barcha xodimlar avanslarini tozalash",
      "DIQQAT! Barcha xodimlarga berilgan avans yozuvlari butunlay o'chiriladi. Bu amalni faqat Administrator tasdiqlashi mumkin.",
      `Jami avanslar: ${advances.length} ta yozuv`,
      (verifiedAdmin, byPermission) => {
        recordLocalMutation('advances');
        setAdvances([]);
        try {
          localStorage.setItem('sc_advances', JSON.stringify([]));
        } catch (e) {}
        pushDataToCloud({ advances: [] });

        const approvedName = verifiedAdmin?.fullName
          ? verifiedAdmin.fullName
          : byPermission
            ? `${currentUser?.fullName} (Admin ruxsati bilan)`
            : (currentUser?.fullName || 'Administrator');

        addAuditLog({
          action: 'delete',
          entityType: 'advance',
          entityId: 'all-advances',
          entityTitle: "Barcha xodimlar avanslari",
          details: `Barcha xodimlar avans yozuvlari tozalandi${byPermission ? " [Admin ruxsati bilan]" : ""}`,
          adminApproved: true,
          adminName: approvedName
        });

        showToast("✓ Barcha xodimlar avanslari tozalandi!");
      },
      'canManageAdvances'
    );
  };

  const handleDeletePayroll = (payrollId: string) => {
    const target = payrolls.find((p) => p.id === payrollId);
    if (!target) return;

    requestAdminAuth(
      "Oylik to'lovi yozuvini o'chirish",
      `"${target.employeeName}" uchun to'langan #${target.payrollNumber} oylik yozuvini o'chirish faqat Administrator ruxsati bilan bajariladi.`,
      `Xodim: ${target.employeeName} | Summa: ${target.totalNet.toLocaleString()} so'm | Davr: ${target.periodLabel}`,
      (verifiedAdmin, byPermission) => {
        recordLocalMutation('payrolls');
        const updated = payrolls.filter((p) => p.id !== payrollId);
        setPayrolls(updated);
        try {
          localStorage.setItem('sc_payrolls', JSON.stringify(updated));
        } catch (e) {}
        pushDataToCloud({ payrolls: updated });

        const approvedName = verifiedAdmin?.fullName
          ? verifiedAdmin.fullName
          : byPermission
            ? `${currentUser?.fullName} (Admin ruxsati bilan)`
            : (currentUser?.fullName || 'Administrator');

        addAuditLog({
          action: 'delete',
          entityType: 'payroll',
          entityId: target.id,
          entityTitle: `Ish haqi #${target.payrollNumber}`,
          details: `"${target.employeeName}" uchun to'langan ${target.totalNet.toLocaleString()} so'm oylik yozuvi o'chirildi.${byPermission ? " [Admin ruxsati bilan]" : ""}`,
          oldValue: `${target.totalNet.toLocaleString()} so'm`,
          adminApproved: true,
          adminName: approvedName
        });

        showToast("✓ Oylik to'lovi yozuvi o'chirildi!");
      },
      'canManagePayroll'
    );
  };

  // Category management handlers
  const handleAddCategory = (newCat: ExpenseCategory) => {
    recordLocalMutation('expenseCategories');
    const updated = [...expenseCategories, newCat];
    setExpenseCategories(updated);
    try {
      localStorage.setItem('sc_categories', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ expenseCategories: updated });
    showToast(`✓ Yangi toifa qo'shildi: "${newCat.name}"`);
  };

  const handleUpdateCategory = (categoryId: string, newName: string, newDesc?: string) => {
    recordLocalMutation('expenseCategories');
    const oldCat = expenseCategories.find((c) => c.id === categoryId);
    const oldName = oldCat?.name;

    const updated = expenseCategories.map((c) =>
      c.id === categoryId ? { ...c, name: newName, description: newDesc ?? c.description } : c
    );
    setExpenseCategories(updated);
    try {
      localStorage.setItem('sc_categories', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    let updatedExpenses = expenses;
    if (oldName && oldName !== newName) {
      recordLocalMutation('expenses');
      updatedExpenses = expenses.map((e) =>
        e.category === oldName ? { ...e, category: newName } : e
      );
      setExpenses(updatedExpenses);
      try {
        localStorage.setItem('sc_expenses', JSON.stringify(updatedExpenses));
      } catch (e) {
        console.error(e);
      }
    }

    pushDataToCloud({ expenseCategories: updated, expenses: updatedExpenses });
    showToast(`✓ Toifa nomi yangilandi: "${newName}"`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    recordLocalMutation('expenseCategories');
    const catToDelete = expenseCategories.find((c) => c.id === categoryId);
    if (!catToDelete) return;

    const updated = expenseCategories.filter((c) => c.id !== categoryId);
    setExpenseCategories(updated);
    try {
      localStorage.setItem('sc_categories', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ expenseCategories: updated });
    showToast(`✓ Toifa o'chirildi: "${catToDelete.name}"`);
  };

  // Product Category management handlers
  const handleAddProductCategory = (newCat: ProductCategory) => {
    recordLocalMutation('productCategories');
    const updated = [...productCategories, newCat];
    setProductCategories(updated);
    try {
      localStorage.setItem('sc_product_categories', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ productCategories: updated });
    showToast(`✓ Yangi mahsulot kategoriyasi: "${newCat.name}"`);
  };

  const handleUpdateProductCategory = (categoryId: string, newName: string, newDesc?: string) => {
    recordLocalMutation('productCategories');
    const oldCat = productCategories.find((c) => c.id === categoryId);
    const oldName = oldCat?.name;

    const updated = productCategories.map((c) =>
      c.id === categoryId ? { ...c, name: newName, description: newDesc ?? c.description } : c
    );
    setProductCategories(updated);
    try {
      localStorage.setItem('sc_product_categories', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    let updatedProducts = products;
    // Cascade rename to all existing products in this category
    if (oldName && oldName !== newName) {
      recordLocalMutation('products');
      updatedProducts = products.map((p) =>
        p.category === oldName ? { ...p, category: newName } : p
      );
      setProducts(updatedProducts);
      try {
        localStorage.setItem('sc_products', JSON.stringify(updatedProducts));
      } catch (e) {
        console.error(e);
      }
    }

    pushDataToCloud({ productCategories: updated, products: updatedProducts });
    showToast(`✓ Kategoriya nomi o'zgartirildi: "${newName}"`);
  };

  const handleDeleteProductCategory = (categoryId: string) => {
    recordLocalMutation('productCategories');
    const catToDelete = productCategories.find((c) => c.id === categoryId);
    if (!catToDelete) return;

    const updated = productCategories.filter((c) => c.id !== categoryId);
    setProductCategories(updated);
    try {
      localStorage.setItem('sc_product_categories', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    pushDataToCloud({ productCategories: updated });
    showToast(`✓ Kategoriya o'chirildi: "${catToDelete.name}"`);
  };

  // Employee Management handlers
  const handleAddEmployee = (newEmp: Employee) => {
    recordLocalMutation('employees');
    const updated = [newEmp, ...employees.filter((e) => e.id !== newEmp.id)];
    setEmployees(updated);
    try {
      localStorage.setItem('sc_employees', JSON.stringify(updated));
    } catch (e) {
      console.error("Local storage employee add error", e);
    }
    pushDataToCloud({ employees: updated });
    showToast(`✓ Xodim "${newEmp.fullName}" muvaffaqiyatli qo'shildi.`);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    recordLocalMutation('employees');
    const updated = employees.map((e) => (e.id === updatedEmp.id ? updatedEmp : e));
    setEmployees(updated);
    try {
      localStorage.setItem('sc_employees', JSON.stringify(updated));
    } catch (e) {
      console.error("Local storage employee update error", e);
    }
    pushDataToCloud({ employees: updated });
    showToast(`✓ "${updatedEmp.fullName}" ma'lumotlari yangilandi.`);
  };

  const handleDeleteEmployee = (empId: string) => {
    recordLocalMutation('employees');
    const emp = employees.find((e) => e.id === empId);
    const updated = employees.filter((e) => e.id !== empId);
    setEmployees(updated);
    try {
      localStorage.setItem('sc_employees', JSON.stringify(updated));
    } catch (e) {
      console.error("Local storage employee delete error", e);
    }
    pushDataToCloud({ employees: updated });
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
    requestAdminAuth(
      "Oylik maosh to'lash (Ish haqi)",
      `Xodim "${record.employeeName}"ga ${record.totalNet.toLocaleString()} so'm oylik to'lash faqat Administrator ruxsati bilan amalga oshiriladi.`,
      `Xodim: ${record.employeeName} | Summa: ${record.totalNet.toLocaleString()} so'm | Davr: ${record.periodLabel}`,
      (verifiedAdmin, byPermission) => {
        setPayrolls((prev) => [record, ...prev]);

        const approvedName = verifiedAdmin?.fullName
          ? verifiedAdmin.fullName
          : byPermission
            ? `${currentUser?.fullName} (Admin ruxsati bilan)`
            : (currentUser?.fullName || 'Administrator');

        // Avtomatik xarajat sifatida kiritish (kassa va buxgalteriya balansi uchun)
        const newExp: Expense = {
          id: `exp-pay-${Date.now()}`,
          category: 'Ish haqi / Oylik',
          amount: record.totalNet,
          paymentSource: record.paymentMethod === 'cash' ? 'Kassa (Naqd)' : 'Hisob raqam / Karta',
          paidTo: record.employeeName,
          notes: `${record.periodLabel} uchun ish haqi to'lovi (#${record.payrollNumber})`,
          createdAt: new Date().toISOString(),
          createdBy: approvedName,
          branchId: record.branchId || currentBranch?.id,
          branchName: record.branchName || currentBranch?.name
        };
        setExpenses((prev) => [newExp, ...prev]);

        addAuditLog({
          action: 'payout',
          entityType: 'payroll',
          entityId: record.id,
          entityTitle: `Ish haqi to'lovi #${record.payrollNumber}`,
          details: `"${record.employeeName}"ga ${record.periodLabel} davri uchun ${record.totalNet.toLocaleString()} so'm oylik to'landi. To'lov turi: ${record.paymentMethod === 'cash' ? 'Naqd pul' : 'Bank kartasi'}${byPermission ? " [Admin ruxsati bilan]" : ""}`,
          newValue: `${record.totalNet.toLocaleString()} so'm`,
          adminApproved: true,
          adminName: approvedName
        });

        showToast(`✓ "${record.employeeName}"ga ${record.totalNet.toLocaleString()} so'm maosh to'landi (#${record.payrollNumber})`);
      },
      'canManagePayroll'
    );
  };

  const handleAddAdvance = (advance: EmployeeAdvance) => {
    requestAdminAuth(
      "Xodimga avans to'lash",
      `Xodim "${advance.employeeName}"ga ${advance.amount.toLocaleString()} so'm avans to'lash faqat Administrator ruxsati bilan amalga oshiriladi.`,
      `Xodim: ${advance.employeeName} | Avans summasi: ${advance.amount.toLocaleString()} so'm | Oy: ${advance.periodMonth}`,
      (verifiedAdmin, byPermission) => {
        setAdvances((prev) => [advance, ...prev]);

        const approvedName = verifiedAdmin?.fullName
          ? verifiedAdmin.fullName
          : byPermission
            ? `${currentUser?.fullName} (Admin ruxsati bilan)`
            : (currentUser?.fullName || 'Administrator');

        // Avtomatik xarajat sifatida kiritish
        const newExp: Expense = {
          id: `exp-adv-${Date.now()}`,
          category: 'Ish haqi / Oylik',
          amount: advance.amount,
          paymentSource: advance.paymentMethod === 'cash' ? 'Kassa (Naqd)' : 'Hisob raqam / Karta',
          paidTo: advance.employeeName,
          notes: `${advance.periodMonth} uchun avans (#${advance.advanceNumber})`,
          createdAt: new Date().toISOString(),
          createdBy: approvedName,
          branchId: advance.branchId || currentBranch?.id,
          branchName: advance.branchName || currentBranch?.name
        };
        setExpenses((prev) => [newExp, ...prev]);

        addAuditLog({
          action: 'payout',
          entityType: 'advance',
          entityId: advance.id,
          entityTitle: `Avans to'lovi #${advance.advanceNumber}`,
          details: `"${advance.employeeName}"ga ${advance.periodMonth} oyi uchun ${advance.amount.toLocaleString()} so'm avans berildi. To'lov turi: ${advance.paymentMethod === 'cash' ? 'Naqd pul' : 'Bank kartasi'}${byPermission ? " [Admin ruxsati bilan]" : ""}`,
          newValue: `${advance.amount.toLocaleString()} so'm`,
          adminApproved: true,
          adminName: approvedName
        });

        showToast(`✓ "${advance.employeeName}"ga ${advance.amount.toLocaleString()} so'm avans berildi (#${advance.advanceNumber})`);
      },
      'canManageAdvances'
    );
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
    const taggedTicket: ServiceTicket = {
      ...ticket,
      branchId: ticket.branchId || currentBranch?.id,
      branchName: ticket.branchName || currentBranch?.name
    };
    let nextList: ServiceTicket[] = [];
    setServiceTickets((prev) => {
      nextList = [taggedTicket, ...prev];
      return nextList;
    });
    const finalTickets = nextList.length > 0 ? nextList : [taggedTicket, ...serviceTickets];
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
            const updatedSerials = prod.serialNumbers ? [...prod.serialNumbers] : [];
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

  // Calculate today's sales for header (excluding returned receipts and subtracting partial refunds)
  const todaySalesTotal = receipts
    .filter(r => isTodayDate(r.createdAt) && r.status !== 'returned')
    .reduce((sum, r) => sum + Math.max(0, r.totalAmount - (r.totalRefunded || 0)), 0);

  // Active tickets count for badge
  const activeServiceCount = serviceTickets.filter(
    (t) => t.status === 'in_diagnosis' || t.status === 'in_repair' || t.status === 'received'
  ).length;

  // Debtors count for badge
  const debtorsCount = customers.filter((c) => (c.debtBalance || 0) > 0).length;

  // -------------------------------------------------------------
  // BRANCH DATA ISOLATION: Filtered entities according to current branch
  // -------------------------------------------------------------
  // If currentBranchId is 'all' or empty, superadmin sees all data.
  // Otherwise, filter items by item.branchId === currentBranchId (or fallback to 'branch-1' if item.branchId is undefined)
  const isBranchAll = currentBranchId === 'all';

  const branchFilteredProducts = useMemo(() => {
    if (isBranchAll) return products;
    return products.filter((p) => (p.branchId || 'branch-1') === currentBranchId);
  }, [products, currentBranchId, isBranchAll]);

  const branchFilteredReceipts = useMemo(() => {
    if (isBranchAll) return receipts;
    return receipts.filter((r) => (r.branchId || 'branch-1') === currentBranchId);
  }, [receipts, currentBranchId, isBranchAll]);

  const branchFilteredExpenses = useMemo(() => {
    if (isBranchAll) return expenses;
    return expenses.filter((e) => (e.branchId || 'branch-1') === currentBranchId);
  }, [expenses, currentBranchId, isBranchAll]);

  const branchFilteredOrders = useMemo(() => {
    if (isBranchAll) return customerOrders;
    return customerOrders.filter((o) => (o.branchId || 'branch-1') === currentBranchId);
  }, [customerOrders, currentBranchId, isBranchAll]);

  const branchFilteredShipments = useMemo(() => {
    if (isBranchAll) return shipments;
    return shipments.filter((s) => (s.branchId || 'branch-1') === currentBranchId);
  }, [shipments, currentBranchId, isBranchAll]);

  const branchFilteredPurchases = useMemo(() => {
    if (isBranchAll || currentUser?.systemRole === 'admin' || !currentBranch) return purchases;
    return purchases.filter((p) => (p.branchId || 'branch-1') === currentBranchId || p.warehouseName?.toLowerCase() === currentBranch?.name?.toLowerCase());
  }, [purchases, currentBranchId, isBranchAll, currentUser, currentBranch]);

  const branchFilteredEmployees = useMemo(() => {
    if (isBranchAll || currentUser?.systemRole === 'admin') return employees;
    return employees.filter((emp) => !emp.branchId || emp.branchId === 'all' || emp.branchId === currentBranchId);
  }, [employees, currentBranchId, isBranchAll, currentUser]);

  const branchFilteredPayrolls = useMemo(() => {
    if (isBranchAll) return payrolls;
    return payrolls.filter((pr) => (pr.branchId || 'branch-1') === currentBranchId);
  }, [payrolls, currentBranchId, isBranchAll]);

  const branchFilteredAdvances = useMemo(() => {
    if (isBranchAll) return advances;
    return advances.filter((adv) => (adv.branchId || 'branch-1') === currentBranchId);
  }, [advances, currentBranchId, isBranchAll]);

  const branchFilteredLeads = useMemo(() => {
    if (isBranchAll) return crmLeads;
    return crmLeads.filter((l) => (l.branchId || 'branch-1') === currentBranchId);
  }, [crmLeads, currentBranchId, isBranchAll]);

  const branchFilteredObjects = useMemo(() => {
    if (isBranchAll) return crmObjectPassports;
    return crmObjectPassports.filter((obj) => (obj.branchId || 'branch-1') === currentBranchId);
  }, [crmObjectPassports, currentBranchId, isBranchAll]);

  const branchFilteredReminders = useMemo(() => {
    if (isBranchAll) return crmReminders;
    return crmReminders.filter((rem) => (rem.branchId || 'branch-1') === currentBranchId);
  }, [crmReminders, currentBranchId, isBranchAll]);

  const branchFilteredTickets = useMemo(() => {
    if (isBranchAll) return serviceTickets;
    return serviceTickets.filter((t) => (t.branchId || 'branch-1') === currentBranchId);
  }, [serviceTickets, currentBranchId, isBranchAll]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-8 py-7 shadow-xl backdrop-blur-sm">
          <div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
          <div className="text-center">
            <div className="text-lg font-black tracking-tight">Smart Control</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Ma&apos;lumotlar yuklanmoqda...</div>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, render LoginScreen
  if (!currentUser) {
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
          currentBranch={currentBranch}
          branches={branches}
          onSelectBranch={handleSelectBranch}
          onManageBranches={() => {
            setSettingsInitialTab('branches');
            setActiveTab('settings');
          }}
        />

        {/* Dynamic Screen View */}
        <main className="flex-1 min-h-0 flex overflow-hidden">
          {activeTab === 'pos' && (
            <POSScreen
              products={branchFilteredProducts}
              customers={customers}
              employees={branchFilteredEmployees}
              allEmployees={employees}
              branches={branches}
              customerOrders={branchFilteredOrders}
              onCompleteSale={handleCompleteSale}
              onAddCustomer={handleAddCustomer}
              onSaveOrder={handleSaveOrder}
              isOffline={isOffline}
              exchangeRate={exchangeRate}
              onUpdateExchangeRate={handleUpdateExchangeRate}
              baseCurrency={baseCurrency}
              onUpdateBaseCurrency={handleUpdateBaseCurrency}
              currentBranch={currentBranch}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersAndShipmentsScreen
              orders={branchFilteredOrders}
              shipments={branchFilteredShipments}
              products={branchFilteredProducts}
              customers={customers}
              employees={branchFilteredEmployees}
              allEmployees={employees}
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
              branches={branches}
              currentBranch={currentBranch}
              receipts={receipts}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardScreen
              products={branchFilteredProducts}
              customers={customers}
              receipts={branchFilteredReceipts}
              expenses={branchFilteredExpenses}
              aiInsights={aiInsights}
              onNavigateTab={(tab) => setActiveTab(tab)}
              isOffline={isOffline}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
            />
          )}

          {activeTab === 'financial_reports' && (
            <FinancialReportsScreen
              receipts={branchFilteredReceipts}
              expenses={branchFilteredExpenses}
              products={branchFilteredProducts}
              employees={branchFilteredEmployees}
              payrolls={branchFilteredPayrolls}
              purchases={branchFilteredPurchases}
              customers={customers}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              currentUser={currentUser}
              onReturnReceipt={handleReturnReceipt}
              onSaveEditReceipt={handleSaveEditReceipt}
              onDeleteReceipt={handleDeleteReceipt}
              initialSubTab="pnl"
              branches={branches}
            />
          )}

          {activeTab === 'crm' && (
            <CrmScreen
              leads={branchFilteredLeads}
              onAddLead={handleAddLead}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              objectPassports={branchFilteredObjects}
              onAddObjectPassport={handleAddObjectPassport}
              onUpdateObjectPassport={handleUpdateObjectPassport}
              onDeleteObjectPassport={handleDeleteObjectPassport}
              reminders={branchFilteredReminders}
              onAddReminder={handleAddReminder}
              onToggleReminder={handleToggleReminder}
              onDeleteReminder={handleDeleteReminder}
              employees={branchFilteredEmployees}
              customers={customers}
              customerOrders={branchFilteredOrders}
              products={branchFilteredProducts}
              currentUser={currentUser}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              onConvertToOrder={handleConvertLeadToOrder}
              onSaveOrder={handleSaveOrder}
              onNavigateToOrders={() => setActiveTab('orders')}
              currentBranch={currentBranch}
              branches={branches}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryScreen
              products={branchFilteredProducts}
              categories={productCategories}
              purchases={purchases}
              branches={branches}
              currentBranch={currentBranch}
              stockTransfers={stockTransfers}
              onAddStockTransfer={handleAddStockTransfer}
              onSavePurchase={handleSavePurchase}
              onRecordSupplierPayment={handleRecordSupplierPayment}
              onCancelPurchase={handleCancelPurchase}
              onDeletePurchase={handleDeletePurchase}
              onAddProduct={handleAddProduct}
              onImportProductsBatch={handleImportProductsBatch}
              onUpdateProduct={handleUpdateProduct}
              onUpdateProductsBatch={handleUpdateProductsBatch}
              onDeleteProduct={handleDeleteProduct}
              onUpdateStock={handleUpdateStock}
              onClearAllStock={handleClearAllStock}
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
              products={branchFilteredProducts}
              receipts={branchFilteredReceipts}
              purchases={branchFilteredPurchases}
              serviceTickets={branchFilteredTickets}
              onAddTicket={handleAddServiceTicket}
              onUpdateTicket={handleUpdateServiceTicket}
              onDeleteTicket={handleDeleteServiceTicket}
              onReplaceDevice={handleReplaceDevice}
              exchangeRate={exchangeRate}
              baseCurrency={baseCurrency}
              onViewReceipt={(receiptId) => {
                const found = (receipts || []).find(r => r.id === receiptId || r.receiptNumber === receiptId);
                if (found) {
                  setActiveModalReceipt(found);
                } else {
                  setActiveTab('financial_reports');
                }
              }}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersScreen
              customers={customers}
              receipts={branchFilteredReceipts}
              debtPayments={customerDebtPayments}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onClearAllDebts={handleClearAllDebts}
              onClearAllCustomers={handleClearAllCustomers}
              onUpdateCashback={handleUpdateCashback}
              onAddDebtPayment={handleAddCustomerDebtPayment}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              onViewReceipt={(receiptId) => {
                const found = (receipts || []).find(r => r.id === receiptId || r.receiptNumber === receiptId);
                if (found) {
                  setActiveModalReceipt(found);
                } else {
                  setActiveTab('financial_reports');
                }
              }}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesScreen
              expenses={branchFilteredExpenses}
              categories={expenseCategories}
              onAddExpense={handleAddExpense}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onDeleteExpense={handleDeleteExpense}
              onDeleteReceipt={handleDeleteReceipt}
              onClearCashFlow={handleClearCashFlow}
              onDeleteAdvance={handleDeleteAdvance}
              onClearAdvances={handleClearAdvances}
              onDeletePayroll={handleDeletePayroll}
              todaySalesTotal={todaySalesTotal}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              employees={currentUser?.systemRole === 'admin' || !!currentUser?.permissions?.canAccessAllBranches ? employees : branchFilteredEmployees}
              payrolls={currentUser?.systemRole === 'admin' || !!currentUser?.permissions?.canAccessAllBranches ? payrolls : branchFilteredPayrolls}
              advances={currentUser?.systemRole === 'admin' || !!currentUser?.permissions?.canAccessAllBranches ? advances : branchFilteredAdvances}
              receipts={branchFilteredReceipts}
              shipments={branchFilteredShipments}
              customerOrders={branchFilteredOrders}
              customers={customers}
              purchases={branchFilteredPurchases}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onAddPayroll={handleAddPayroll}
              onAddAdvance={handleAddAdvance}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              initialSubTab="all"
              branches={branches}
              currentBranch={currentBranch}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'ai_advisor' && (
            <AIAdvisorScreen
              products={branchFilteredProducts}
              insights={aiInsights}
            />
          )}

          {activeTab === 'sales_history' && (
            <FinancialReportsScreen
              receipts={branchFilteredReceipts}
              expenses={branchFilteredExpenses}
              products={branchFilteredProducts}
              employees={branchFilteredEmployees}
              payrolls={branchFilteredPayrolls}
              purchases={branchFilteredPurchases}
              customers={customers}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              currentUser={currentUser}
              onReturnReceipt={handleReturnReceipt}
              onSaveEditReceipt={handleSaveEditReceipt}
              onDeleteReceipt={handleDeleteReceipt}
              initialSubTab="sales_history"
              branches={branches}
            />
          )}

          {activeTab === 'employees' && (
            <ExpensesScreen
              expenses={branchFilteredExpenses}
              categories={expenseCategories}
              onAddExpense={handleAddExpense}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onDeleteExpense={handleDeleteExpense}
              onDeleteReceipt={handleDeleteReceipt}
              onClearCashFlow={handleClearCashFlow}
              onDeleteAdvance={handleDeleteAdvance}
              onClearAdvances={handleClearAdvances}
              onDeletePayroll={handleDeletePayroll}
              todaySalesTotal={todaySalesTotal}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              employees={currentUser?.systemRole === 'admin' || !!currentUser?.permissions?.canAccessAllBranches ? employees : branchFilteredEmployees}
              payrolls={currentUser?.systemRole === 'admin' || !!currentUser?.permissions?.canAccessAllBranches ? payrolls : branchFilteredPayrolls}
              advances={currentUser?.systemRole === 'admin' || !!currentUser?.permissions?.canAccessAllBranches ? advances : branchFilteredAdvances}
              receipts={branchFilteredReceipts}
              shipments={branchFilteredShipments}
              customerOrders={branchFilteredOrders}
              customers={customers}
              purchases={branchFilteredPurchases}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onAddPayroll={handleAddPayroll}
              onAddAdvance={handleAddAdvance}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              initialSubTab="employees"
              branches={branches}
              currentBranch={currentBranch}
              currentUser={currentUser}
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
              branches={branches}
              onAddBranch={handleAddBranch}
              onUpdateBranch={handleUpdateBranch}
              onDeleteBranch={handleDeleteBranch}
              auditLogs={auditLogs}
              initialSubTab={settingsInitialTab}
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
              objectPassports={crmObjectPassports}
              products={products}
              customers={customers}
              exchangeRate={exchangeRate}
              baseCurrency={baseCurrency}
              initialSubTab={technicianSubTab}
              onSaveHandover={handleSaveHandover}
              onSaveOrder={handleSaveOrder}
              onUpdateServiceTicket={handleUpdateServiceTicket}
              onUpdateObjectPassport={handleUpdateObjectPassport}
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

      {/* Global Direct Receipt Modal (e.g. from Servis / Kafolat / Mijozlar) */}
      {activeModalReceipt && (
        <ReceiptModal
          receipt={activeModalReceipt}
          onClose={() => setActiveModalReceipt(null)}
          onOpenReturn={() => {
            setActiveModalReceipt(null);
            setActiveTab('financial_reports');
          }}
        />
      )}

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

      {/* Admin Verification Modal for Protected Actions */}
      <AdminAuthModal
        isOpen={adminAuthModal.isOpen}
        onClose={() => setAdminAuthModal((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={(verifiedAdmin) => {
          const successCallback = adminAuthModal.onSuccess;
          setAdminAuthModal((prev) => ({ ...prev, isOpen: false }));
          successCallback(verifiedAdmin);
        }}
        title={adminAuthModal.title}
        description={adminAuthModal.description}
        actionDetails={adminAuthModal.actionDetails}
        employees={employees}
        currentUser={currentUser}
      />

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
