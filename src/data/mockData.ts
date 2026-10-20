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
    branchName: 'Bosh Filial (Toshkent)'
  },
  {
    id: 'emp-4',
    fullName: 'Farrux Aliyev',
    role: 'Kassir / Menejer',
    phone: '+998 99 888 77 66',
    status: 'active',
    salaryType: 'fixed_plus_percentage',
    baseSalary: 4000000,
    percentageRate: 2,
    percentageTarget: 'total_sales',
    installationsCompleted: 0,
    totalEarned: 0,
    notes: 'Kassa savdolari, mijozlar bilan muloqot va shartnomalar',
    joinedDate: '2026-01-05',
    username: 'farrux',
    password: '123',
    pin: '1111',
    systemRole: 'cashier',
    allowedTabs: ['pos', 'orders', 'customers', 'warranty', 'sales_history'],
    permissions: DEFAULT_ROLE_PERMISSIONS['cashier'],
    branchId: 'branch-2',
    branchName: 'Chilonzor-1 Filiali'
  },
  {
    id: 'emp-1',
    fullName: 'Jamshid Normurodov',
    role: 'Bosh Muhandis',
    phone: '+998 90 234 56 78',
    status: 'active',
    salaryType: 'fixed_plus_job',
    baseSalary: 3000000,
    commissionPerInstall: 45000,
    installationsCompleted: 0,
    totalEarned: 0,
    notes: 'Katta obyektlar, NVR, 4K kameralar va optik payvandlash mutaxassisi',
    joinedDate: '2026-03-10',
    username: 'jamshid',
    password: '123',
    pin: '2222',
    systemRole: 'technician',
    allowedTabs: ['technician_portal'],
    permissions: DEFAULT_ROLE_PERMISSIONS['technician'],
    branchId: 'branch-3',
    branchName: 'Samarqand Filiali'
  },
  {
    id: 'emp-2',
    fullName: 'Dilshod Karimov',
    role: 'Montajchi Usta',
    phone: '+998 93 456 78 90',
    status: 'active',
    salaryType: 'per_job',
    commissionPerInstall: 35000,
    installationsCompleted: 0,
    totalEarned: 0,
    notes: 'Tashqi kamera montaji, UTP kabel tortish, gofra va domofon qulflari',
    joinedDate: '2026-06-15',
    username: 'dilshod',
    password: '123',
    pin: '3333',
    systemRole: 'technician',
    allowedTabs: ['technician_portal'],
    permissions: DEFAULT_ROLE_PERMISSIONS['technician']
  },
  {
    id: 'emp-3',
    fullName: 'Shohruh Oripov',
    role: 'Tarmoq Sozlovchi',
    phone: '+998 97 123 99 88',
    status: 'active',
    salaryType: 'per_job',
    commissionPerInstall: 50000,
    installationsCompleted: 0,
    totalEarned: 0,
    notes: 'MikroTik, Wi-Fi 6, PoE Switch, P2P Cloud va telefon ilovalari sozlash',
    joinedDate: '2026-09-01',
    username: 'shohruh',
    password: '123',
    pin: '4444',
    systemRole: 'technician',
    allowedTabs: ['technician_portal'],
    permissions: DEFAULT_ROLE_PERMISSIONS['technician']
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
    name: 'Bosh Filial (Toshkent)',
    code: 'BF-01',
    address: 'Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko\'chasi, 42-uy',
    phone: '+998 71 200 40 50',
    managerName: 'Admin Foydalanuvchi',
    isMain: true,
    status: 'active',
    createdAt: '2026-01-01',
    notes: 'Bosh ombor va markaziy savdo shoxobchasi'
  },
  {
    id: 'branch-2',
    name: 'Chilonzor-1 Filiali',
    code: 'CH-02',
    address: 'Toshkent sh., Chilonzor 9-mavze, Kichik halqa yo\'li',
    phone: '+998 90 123 45 67',
    managerName: 'Farrux Aliyev',
    isMain: false,
    status: 'active',
    createdAt: '2026-03-15',
    notes: 'Chakana savdo va montaj xizmatlari filiali'
  },
  {
    id: 'branch-3',
    name: 'Samarqand Filiali',
    code: 'SQ-03',
    address: 'Samarqand sh., Registon ko\'chasi, 15-uy',
    phone: '+998 66 233 44 55',
    managerName: 'Jamshid Normurodov',
    isMain: false,
    status: 'active',
    createdAt: '2026-05-20',
    notes: 'Samarqand viloyati bo\'yicha vakolatxona'
  }
];

export const INITIAL_STOCK_TRANSFERS: StockTransfer[] = [];
