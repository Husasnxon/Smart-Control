import { Product, Customer, SaleReceipt, AIInsight, Expense, ExpenseCategory, ProductCategory, Employee, CustomerOrder, ShipmentOrder, PurchaseInvoice, ServiceTicket, CustomerDebtPayment, PayrollRecord, EmployeeAdvance, ObjectHandover, CrmLead, CrmObjectPassport, CrmReminder, DEFAULT_ROLE_PERMISSIONS, Branch, StockTransfer } from '../types';

export const INITIAL_PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 'pcat-1', name: 'Kuzatuv kameralari (CCTV)', description: 'IP, HD kameralar, PTZ aylanuvchi va Wi-Fi kameralar', color: '#06B6D4' },
  { id: 'pcat-2', name: 'Video Registratorlar (NVR/DVR)', description: '4, 8, 16, 32 kanalli NVR va DVR video yozuv qurilmalari', color: '#3B82F6' },
  { id: 'pcat-3', name: 'Domofoniya & Kirish nazorati', description: 'IP domofon monitorlari, chaqiruv panellari, elektron qulflar', color: '#8B5CF6' },
  { id: 'pcat-4', name: 'Wi-Fi & Tarmoq uskunalari', description: 'Gigabit routerlar, PoE Switchlar, Access Pointlar', color: '#10B981' },
  { id: 'pcat-5', name: "Yong'in xavfsizligi tizimlari", description: "Tutun datchiklari, gaz sezgichlar, yong'in sirenalari", color: '#EF4444' },
  { id: 'pcat-6', name: 'Kabellar & Aksessuarlar', description: 'UTP Cat6, quvvat bloklari, BNC/RJ45, gofra, montaj qutilari', color: '#F59E0B' },
  { id: 'pcat-7', name: "O'rnatish & Montaj xizmatlari", description: "Kamera o'rnatish, domofon montaj, kabel tortish va sozlash", color: '#EC4899' }
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_AI_INSIGHTS: AIInsight[] = [];

export const INITIAL_RECEIPTS: SaleReceipt[] = [];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-admin',
    fullName: 'Bosh Administrator',
    role: 'Bosh Administrator',
    phone: '+998 90 123 45 67',
    status: 'active',
    salaryType: 'fixed',
    baseSalary: 10000000,
    installationsCompleted: 0,
    totalEarned: 0,
    notes: 'Tizim to\'liq nazorati va boshqaruvi',
    joinedDate: '2026-01-01',
    username: 'admin',
    password: '123',
    pin: '0000',
    systemRole: 'admin',
    allowedTabs: ['dashboard', 'pos', 'orders', 'inventory', 'warranty', 'employees', 'customers', 'expenses', 'ai_advisor', 'sales_history', 'settings'],
    permissions: DEFAULT_ROLE_PERMISSIONS['admin'],
    branchId: 'branch-1',
    branchName: 'Bosh Filial'
  }
];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  // Kirim Toifalari (Income)
  { id: 'cat-inc-1', name: 'Otgruzka / Sotuv to\'lovi', description: "Sotilgan tovarlar va otgruzkalar bo'yicha to'lovlar", color: '#10B981', isDefault: true, type: 'income' },
  { id: 'cat-inc-2', name: 'Mijozdan Nasiya to\'lovi', description: "Qarzdorlik va nasiya to'lovlari qaytarilishi", color: '#059669', isDefault: true, type: 'income' },
  { id: 'cat-inc-3', name: 'Xizmat & Montaj tushumi', description: "Usta montaji, sozlash va servis xizmatlari tushumi", color: '#3B82F6', isDefault: true, type: 'income' },
  { id: 'cat-inc-4', name: 'Muassis / Boshlang\'ich sarmoya', description: "Ta'sischilar mablag'i yoki kassa to'ldirish", color: '#8B5CF6', isDefault: true, type: 'income' },
  { id: 'cat-inc-5', name: 'Boshqa kirimlar', description: "Keshbek, komissiya yoki boshqa tushumlar", color: '#6366F1', isDefault: true, type: 'income' },

  // Chiqim Toifalari (Expense)
  { id: 'cat-1', name: 'Ijara', description: "Do'kon, ustaxona yoki ombor ijarasi", color: '#EF4444', isDefault: true, type: 'expense' },
  { id: 'cat-2', name: 'Oylik / Ish haqi', description: "Xodimlar va montaj ustalari ish haqi", color: '#8B5CF6', isDefault: true, type: 'expense' },
  { id: 'cat-3', name: 'Transport & Yetkazish', description: "Obyektlarga borish, benzin, yetkazish", color: '#F59E0B', isDefault: true, type: 'expense' },
  { id: 'cat-4', name: 'Asboblar & Uskunalar', description: "Drel, perferator, kabel sinagich, narvon, testerlar", color: '#3B82F6', isDefault: true, type: 'expense' },
  { id: 'cat-5', name: 'Kommunal & Internet', description: "Elektr, optik internet, aloqa xarajatlari", color: '#06B6D4', isDefault: true, type: 'expense' },
  { id: 'cat-6', name: 'Reklama & Marketing', description: "Instagram/Telegram kanallarida montaj va kamera reklamasi", color: '#EC4899', isDefault: true, type: 'expense' },
  { id: 'cat-7', name: 'Mayda xo\'jalik', description: "Izolenta, kassa chek qog'ozi, choy va kanselyariya", color: '#10B981', isDefault: true, type: 'expense' },
  { id: 'cat-8', name: 'Boshqa chiqimlar', description: "Kutilmagan yoki rejalashtirilmagan chiqimlar", color: '#64748B', isDefault: true, type: 'expense' }
];

export const INITIAL_CUSTOMER_ORDERS: CustomerOrder[] = [];

export const INITIAL_SHIPMENTS: ShipmentOrder[] = [];

export const DEFAULT_SUPPLIERS = [
  'Hikvision Official Diler (Toshkent)',
  'Dahua Technology Uzbekistan MCHJ',
  'ZKTeco Biometrics & Access Central Asia',
  'Ruijie / Reyee Networks Distribyutor',
  'Malohat Kabel & Elektr Savdo MCHJ',
  'Delta Security Systems'
];

export const INITIAL_PURCHASES: PurchaseInvoice[] = [];

export const INITIAL_SERVICE_TICKETS: ServiceTicket[] = [];

export const INITIAL_CUSTOMER_DEBT_PAYMENTS: CustomerDebtPayment[] = [];

export const INITIAL_PAYROLLS: PayrollRecord[] = [];

export const INITIAL_ADVANCES: EmployeeAdvance[] = [];

export const INITIAL_HANDOVERS: ObjectHandover[] = [];

export const INITIAL_CRM_LEADS: CrmLead[] = [];

export const INITIAL_CRM_OBJECTS: CrmObjectPassport[] = [];

export const INITIAL_CRM_REMINDERS: CrmReminder[] = [];

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'branch-1',
    name: 'Bosh Filial',
    code: 'BF-01',
    address: 'Markaziy savdo shoxobchasi va ombor',
    phone: '+998 71 200 40 50',
    managerName: 'Administrator',
    isMain: true,
    status: 'active',
    createdAt: '2026-01-01',
    notes: 'Bosh ombor va markaziy savdo shoxobchasi'
  }
];

export const INITIAL_STOCK_TRANSFERS: StockTransfer[] = [];
