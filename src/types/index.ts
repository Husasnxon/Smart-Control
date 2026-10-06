export type Currency = 'UZS' | 'USD';

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface Product {
  id: string;
  barcode: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number;       // Tannarxi
  retailPrice: number;     // Chakana narxi
  wholesalePrice?: number; // Ulgurji narxi
  stockQuantity: number;   // Qoldiq (xizmatlarda cheksiz)
  minStockAlert: number;   // Minimal qoldiq ogohlantirishi
  unit: string;            // dona, metr, to'plam, xizmat, nuqta
  hasSerialNumber: boolean;// Seriya raqami mavjudmi?
  serialNumbers?: string[];// Omborda mavjud seriya raqamlari (S/N)
  isService?: boolean;     // O'rnatish / montaj / sozlash xizmatimi?
  warrantyMonths?: number; // Kafolat muddati (oy)
  costPriceUSD?: number;   // Tannarxi ($ da)
  retailPriceUSD?: number; // Chakana narxi ($ da)
  technicianWageUSD?: number; // Ustaga to'lanadigan xizmat haqqi ($ da, masalan: 8$, 12$, 25$)
  technicianWageUZS?: number; // Ustaga to'lanadigan xizmat haqqi (so'mda)
  imageUrl?: string;
  color?: string;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  cashbackBalance: number; // To'plangan cashback (so'mda)
  totalPurchases: number;  // Jami xarid miqdori
  debtBalance: number;     // Qarzdorlik (so'mda)
  debtBalanceUSD?: number; // Qarzdorlik ($ da)
  tier: 'Standard' | 'Silver' | 'Gold' | 'VIP';
  cashbackRate: number;    // % da (masalan 1, 2, 3, 5)
  registeredDate: string;
  address?: string;
  debtDueDate?: string;    // Qarzni to'lash muddati (e.g. "2026-10-15")
  lastReminderSent?: string;// Oxirgi eslatma yuborilgan sana
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent: number;
  appliedPrice: number;    // So'mda
  appliedPriceUSD?: number;// $ da
  selectedSerialNumbers?: string[]; // Savatga tanlangan S/N lar
  returnedQuantity?: number; // Qaytarilgan miqdor (vozvrat)
  returnedSerialNumbers?: string[]; // Qaytarilgan S/N lar
}

export interface PaymentDetails {
  cash: number;            // Naqd (so'm)
  cashUSD?: number;        // Naqd ($)
  card: number;            // Karta (so'm)
  debt: number;            // Qarz (so'm)
  debtUSD?: number;        // Qarz ($)
  cashbackUsed: number;    // Cashback (so'm)
  exchangeRate?: number;   // Kurs (1$ = X so'm)
  currencyPaid?: 'UZS' | 'USD' | 'MIXED';
  total: number;           // Jami so'mda
  totalUSD?: number;       // Jami $ da
}

export interface AssignedTechnician {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  wageUSD: number;         // Ustaga tegadigan xizmat haqqi ($ da)
  wageUZS: number;         // Ustaga tegadigan xizmat haqqi (so'mda)
}

export interface ReturnedItemRecord {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  serialNumbers?: string[];
  unitPrice: number;
  totalRefund: number;
  refundMethod: 'cash' | 'card' | 'debt_deduction';
  reason: string;
  returnedAt: string;
}

export interface SaleReceipt {
  id: string;
  receiptNumber: string;
  createdAt: string;
  updatedAt?: string;
  cashierName: string;
  customer?: Customer;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  totalAmount: number;
  totalAmountUSD?: number;
  exchangeRate?: number;
  payments: PaymentDetails;
  cashbackEarned: number;
  isOffline: boolean;
  synced: boolean;
  branchName: string;
  installationAddress?: string; // O'rnatish / obyekt manzili
  warrantyMonths?: number;      // Kafolat muddati
  technicians?: AssignedTechnician[]; // Bir yoki bir nechta biriktirilgan ustalar va ularning ish haqqi
  technicianId?: string;        // Bosh usta ID si (moslik uchun)
  technicianName?: string;      // Bosh usta F.I.Sh. (moslik uchun)
  technicianPhone?: string;     // Usta telefon raqami
  status?: 'completed' | 'partially_returned' | 'returned' | 'edited';
  returnedItems?: ReturnedItemRecord[];
  totalRefunded?: number;
  notes?: string;
}

export type SalaryType = 'fixed' | 'per_job' | 'percentage' | 'fixed_plus_job' | 'fixed_plus_percentage';

export type SystemRole = 'admin' | 'manager' | 'cashier' | 'technician' | 'warehouse';

export interface EmployeePermissions {
  // Buyurtmalar & Otgruzka (Smetalar)
  onlyAssignedOrders?: boolean;      // Faqat o'zi biriktirilgan (qatnashgan) smeta va otgruzkalarni ko'rish
  canCreateOrders?: boolean;          // Yangi smeta/buyurtma tuzish
  canCreateShipments?: boolean;       // Otgruzka (yuklash) qilish
  canDeleteOrders?: boolean;          // Smetani o'chirish / bekor qilish

  // Savdo & Kassa (POS)
  canMakeSales?: boolean;             // POS Kassada savdo qilish
  canEditReceipts?: boolean;          // Sotilgan chek/tovarni redakt qilish (tahrirlash)
  canReturnReceipts?: boolean;        // Vozvrat (qaytarish) qilish
  canGiveDiscount?: boolean;          // Chegirma (skidka) berish
  canEditPrice?: boolean;             // Sotuv narxini qo'lda o'zgartirish
  canCloseZReport?: boolean;          // Smenani yopish (Z-Hisobot)

  // Ombor & Tovar
  canViewStock?: boolean;             // Ombor qoldiqlarini ko'rish
  canViewCostPrice?: boolean;         // Tannarx (kirim narxi) va sof foydani ko'rish
  canManageProducts?: boolean;        // Tovar qo'shish va tahrirlash
  canCreatePurchases?: boolean;       // Kirim nakladnoy (Приход) qilish
  canAdjustStock?: boolean;           // Spisaniye / inventarizatsiya

  // Servis & Kafolat
  canManageService?: boolean;         // Servis zayavkalarini boshqarish
  canReplaceDevices?: boolean;        // Ombordan yangi qurilmaga almashtirish (Zamen)

  // Moliya & Xarajatlar
  canViewExpenses?: boolean;          // Xarajatlar va kassa chiqimlarini ko'rish
  canCreateExpenses?: boolean;        // Chiqim kiritish
  canViewPayroll?: boolean;           // Xodimlar ish haqi va avanslarni ko'rish

  // Tizim & Boshqaruv
  canManageSettings?: boolean;        // Sozlamalar va Telegram botni boshqarish
  canManagePermissions?: boolean;     // Xodimlar huquqlarini o'zgartirish
  canViewFinancialReports?: boolean;  // P&L va moliyaviy hisobotlarni ko'rish
}

export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, EmployeePermissions> = {
  admin: {
    onlyAssignedOrders: false,
    canCreateOrders: true,
    canCreateShipments: true,
    canDeleteOrders: true,
    canMakeSales: true,
    canEditReceipts: true,
    canReturnReceipts: true,
    canGiveDiscount: true,
    canEditPrice: true,
    canCloseZReport: true,
    canViewStock: true,
    canViewCostPrice: true,
    canManageProducts: true,
    canCreatePurchases: true,
    canAdjustStock: true,
    canManageService: true,
    canReplaceDevices: true,
    canViewExpenses: true,
    canCreateExpenses: true,
    canViewPayroll: true,
    canManageSettings: true,
    canManagePermissions: true,
    canViewFinancialReports: true
  },
  manager: {
    onlyAssignedOrders: false,
    canCreateOrders: true,
    canCreateShipments: true,
    canDeleteOrders: false,
    canMakeSales: true,
    canEditReceipts: true,
    canReturnReceipts: true,
    canGiveDiscount: true,
    canEditPrice: false,
    canCloseZReport: true,
    canViewStock: true,
    canViewCostPrice: true,
    canManageProducts: true,
    canCreatePurchases: true,
    canAdjustStock: false,
    canManageService: true,
    canReplaceDevices: true,
    canViewExpenses: false,
    canCreateExpenses: true,
    canViewPayroll: false,
    canManageSettings: false,
    canManagePermissions: false,
    canViewFinancialReports: true
  },
  cashier: {
    onlyAssignedOrders: false,
    canCreateOrders: true,
    canCreateShipments: true,
    canDeleteOrders: false,
    canMakeSales: true,
    canEditReceipts: false, // Kassir chekni redakt qilolmaydi (sozlamalardan yoqish mumkin)
    canReturnReceipts: true,
    canGiveDiscount: true,
    canEditPrice: false,
    canCloseZReport: true,
    canViewStock: true,
    canViewCostPrice: false,
    canManageProducts: false,
    canCreatePurchases: false,
    canAdjustStock: false,
    canManageService: true,
    canReplaceDevices: false,
    canViewExpenses: false,
    canCreateExpenses: false,
    canViewPayroll: false,
    canManageSettings: false,
    canManagePermissions: false,
    canViewFinancialReports: false
  },
  technician: {
    onlyAssignedOrders: true, // ⭐ Ustalar faqat o'zi qatnashgan smeta va otgruzkalarni ko'radi!
    canCreateOrders: true,
    canCreateShipments: false,
    canDeleteOrders: false,
    canMakeSales: false,
    canEditReceipts: false,
    canReturnReceipts: false,
    canGiveDiscount: false,
    canEditPrice: false,
    canCloseZReport: false,
    canViewStock: true,
    canViewCostPrice: false,
    canManageProducts: false,
    canCreatePurchases: false,
    canAdjustStock: false,
    canManageService: true,
    canReplaceDevices: true,
    canViewExpenses: false,
    canCreateExpenses: false,
    canViewPayroll: false,
    canManageSettings: false,
    canManagePermissions: false,
    canViewFinancialReports: false
  },
  warehouse: {
    onlyAssignedOrders: false,
    canCreateOrders: false,
    canCreateShipments: true,
    canDeleteOrders: false,
    canMakeSales: false,
    canEditReceipts: false,
    canReturnReceipts: false,
    canGiveDiscount: false,
    canEditPrice: false,
    canCloseZReport: false,
    canViewStock: true,
    canViewCostPrice: true,
    canManageProducts: true,
    canCreatePurchases: true,
    canAdjustStock: true,
    canManageService: false,
    canReplaceDevices: true,
    canViewExpenses: false,
    canCreateExpenses: false,
    canViewPayroll: false,
    canManageSettings: false,
    canManagePermissions: false,
    canViewFinancialReports: false
  }
};

export const DEFAULT_ROLE_TABS: Record<SystemRole, ActiveTab[]> = {
  admin: ['dashboard', 'financial_reports', 'pos', 'orders', 'inventory', 'warranty', 'technician_portal', 'employees', 'customers', 'expenses', 'ai_advisor', 'sales_history', 'settings'],
  manager: ['dashboard', 'financial_reports', 'pos', 'orders', 'inventory', 'warranty', 'technician_portal', 'customers', 'sales_history'],
  cashier: ['pos', 'orders', 'customers', 'warranty', 'sales_history'],
  technician: ['technician_portal', 'orders', 'warranty'],
  warehouse: ['inventory', 'orders', 'warranty'],
};

export interface Employee {
  id: string;
  fullName: string;
  role: 'Montajchi Usta' | 'Bosh Muhandis' | 'Tarmoq Sozlovchi' | 'Kassir / Menejer' | 'Xavfsizlik Mutaxassisi' | 'Bosh Administrator' | 'Omborchi' | string;
  phone: string;
  status: 'active' | 'on_site' | 'on_leave'; // 'Ishda (Bo'sh)' | 'Obyektda' | 'Ta'tilda'
  salaryType: SalaryType; // Oklad, Ishbay, Foiz, Oklad + Montaj, Oklad + Foiz
  baseSalary?: number;          // Oylik asosiy maosh (oklad)
  commissionPerInstall?: number;// 1 ta montaj/nuqta uchun stavka (so'mda)
  percentageRate?: number;      // Sotuvdan yoki foydadan foiz stavkasi (masalan: 2%, 5%)
  percentageTarget?: 'total_sales' | 'net_profit'; // Foiz hisoblash manbasi
  installationsCompleted: number;// Bajarilgan montajlar soni
  totalEarned: number;          // Jami ishlab topilgan daromad (so'm)
  notes?: string;
  joinedDate: string;
  
  // Auth & Access Control (Login & Parol tizimi)
  username?: string;            // Login (foydalanuvchi nomi)
  login?: string;               // Login alias
  password?: string;            // Parol
  pin?: string;                 // 4 xonali tezkor PIN
  systemRole?: SystemRole;      // Tizimdagi roli
  allowedTabs?: ActiveTab[];    // Ruxsat etilgan bo'limlar
  permissions?: EmployeePermissions; // Granulyar huquqlar (MoySklad uslubida)
  isBlocked?: boolean;          // Bloklanganlik holati
  avatar?: string;
}

export interface AIInsight {
  id: string;
  type: 'stock_warning' | 'trend' | 'smart_order' | 'dead_stock';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendedAction: string;
  productIds?: string[];
  daysLeft?: number;
  date: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  paymentSource: 'Kassa (Naqd)' | 'Hisob raqam / Karta';
  paidTo: string;
  notes: string;
  createdAt: string;
  createdBy: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  category?: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  unitPriceUSD?: number;
  discountPercent: number;
  totalPrice: number;
  hasSerialNumber: boolean;
  isService?: boolean;
  selectedSerialNumbers?: string[]; // Otgruzkada kiritiladigan / tanlanadigan S/N lar
}

export interface CustomerOrder {
  id: string;
  orderNumber: string; // Masalan: "ZK-1001" (Заказ покупателя / Hisob-kitob smetasi)
  createdAt: string;
  organization: string; // "WST Namangan"
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  warehouseName: string; // "Asosiy ombor"
  deliveryAddress?: string;
  projectName?: string;
  comment?: string;
  currency: 'UZS' | 'USD';
  exchangeRate: number;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  totalAmount: number;
  totalAmountUSD?: number;
  status: 'new' | 'calculated' | 'approved' | 'shipped' | 'cancelled' | 'pending_cashier_approval' | 'rejected';
  shipmentId?: string;
  receiptId?: string;
  technicians?: AssignedTechnician[];
  technicianId?: string;
  technicianName?: string;
  hasHandoverReport?: boolean;
  handoverReportId?: string;
  createdSource?: 'technician_on_site' | 'office_pos' | 'web';
  requestedByTechnicianName?: string;
  requestedByTechnicianId?: string;
  rejectionReason?: string;
}

export interface ShipmentOrder {
  id: string;
  shipmentNumber: string; // Masalan: "OTG-2001" (Отгрузка / Yuklash)
  orderId?: string;       // Qaysi hisob-kitobdan olingan
  orderNumber?: string;
  createdAt: string;
  organization: string;   // "WST Namangan"
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  warehouseName: string;  // "Asosiy ombor"
  deliveryAddress?: string;
  projectName?: string;
  comment?: string;
  currency: 'UZS' | 'USD';
  exchangeRate: number;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  totalAmount: number;
  totalAmountUSD?: number;
  technicians?: AssignedTechnician[];
  status: 'pending' | 'shipped' | 'cancelled';
  receiptId?: string;     // Yaratilgan sotuv cheki ID si
  paymentMethod: 'cash' | 'card' | 'debt' | 'usd';
  hasHandoverReport?: boolean;
  handoverReportId?: string;
}

export interface HandoverPhoto {
  id: string;
  url: string;        // Base64 compressed image (200-300KB)
  caption?: string;   // Masalan: "Darvoza ustidagi 1-kamera", "DVR shkafi va blok pitaniya"
  timestamp: string;
}

export interface ObjectHandover {
  id: string;
  handoverNumber: string;         // e.g. "AKT-1001" (Obyekt Qabul Qilish Dalolatnomasi)
  orderId?: string;               // Bog'langan smeta ID si
  orderNumber?: string;
  shipmentId?: string;            // Bog'langan otgruzka ID si
  shipmentNumber?: string;
  receiptId?: string;             // Bog'langan sotuv cheki ID si
  receiptNumber?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  installationAddress: string;
  projectName?: string;
  gpsLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    mapUrl?: string;
  };
  technicians: {
    id: string;
    fullName: string;
    phone?: string;
    role?: string;
    wageUSD?: number;
    wageUZS?: number;
  }[];
  installedItems: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    serialNumbers?: string[];
  }[];
  photos: HandoverPhoto[];
  videoNoteUrl?: string;          // Telegram yoki tashqi video havola
  clientRating: number;           // 1 dan 5 gacha baho
  clientFeedback?: string;        // Mijozning sharhi va mulohazasi
  clientSignature: string;        // Sensor ekranda chizilgan elektron imzo (Base64)
  clientNameConfirmed?: string;   // Imzolagan shaxs F.I.Sh.
  technicianNotes?: string;       // Usta izohi / tavsiyalari (e.g. "Parol admin12345 qilib topshirildi")
  warrantyPeriodMonths?: number;  // Kafolat muddati (oy)
  createdAt: string;              // e.g. "2026-10-05 17:30"
  createdBy: string;              // Topshirgan usta ismi
  status: 'submitted' | 'approved' | 'rejected';
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  category?: string;
  sku?: string;
  quantity: number;
  unit: string;
  costPrice: number;       // So'mda tannarx
  costPriceUSD?: number;   // $ da tannarx
  retailPrice: number;     // Chakana narx (so'mda)
  retailPriceUSD?: number; // Chakana narx ($ da)
  totalCost: number;       // Jami tannarx (so'mda)
  hasSerialNumber: boolean;
  serialNumbers: string[]; // Ushbu kirimda kelgan S/N lar
}

export interface PurchasePaymentRecord {
  id: string;
  purchaseId: string;
  invoiceNumber: string;
  supplierName: string;
  amount: number;       // in UZS
  amountUSD: number;    // in USD
  currency: 'UZS' | 'USD';
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'usd';
  date: string;
  notes?: string;
  paidBy?: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;         // Masalan: "PR-1001" (Приход / Kirim nakladnoy)
  supplierInvoiceNumber?: string;// Yetkazib beruvchining schot-faktura raqami
  supplierName: string;          // Yetkazib beruvchi korxona nomi
  supplierPhone?: string;        // Telefon raqami
  createdAt: string;
  warehouseName: string;         // "Asosiy Ombor"
  currency: 'UZS' | 'USD';
  exchangeRate: number;
  items: PurchaseItem[];
  totalQuantity: number;
  totalAmount: number;           // Jami summa (so'mda)
  totalAmountUSD: number;        // Jami summa ($ da)
  paymentStatus: 'paid' | 'partial' | 'debt'; // To'langan, qisman, nasiya
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'usd';
  paidAmount?: number;           // To'langan summa (so'mda)
  paidAmountUSD?: number;        // To'langan summa ($ da)
  debtAmount?: number;           // Qolgan qarz (so'mda)
  debtAmountUSD?: number;        // Qolgan qarz ($ da)
  payments?: PurchasePaymentRecord[]; // Bog'langan to'lovlar tarixi
  status: 'received' | 'draft' | 'cancelled';
  notes?: string;
  receivedBy: string;            // Qabul qilgan xodim
}

export type ServiceTicketStatus = 
  | 'received'          // Qabul qilindi
  | 'in_diagnosis'      // Diagnostikada
  | 'in_repair'         // Ta'mirlanmoqda
  | 'ready'             // Tayyor (Mijozga topshirishga)
  | 'replaced'          // Yangisiga almashtirildi (Zamen)
  | 'returned_to_client'// Mijozga topshirildi
  | 'cancelled';        // Bekor qilindi

export interface ServiceTicket {
  id: string;
  ticketNumber: string;               // e.g. "SRV-1001"
  createdAt: string;                  // e.g. "2026-10-04 10:30"
  completedAt?: string;
  serialNumber: string;               // e.g. "HK-4MP-982101"
  productId: string;
  productName: string;
  category: string;
  receiptId?: string;                 // Linked sale receipt ID
  receiptNumber?: string;             // e.g. "CK-1001"
  saleDate?: string;
  warrantyMonths: number;
  isUnderWarranty: boolean;
  warrantyExpiresAt?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  installationAddress?: string;
  assignedTechnicianName?: string;
  assignedTechnicianPhone?: string;
  issueDescription: string;           // Mijoz shikoyati / nosozlik
  diagnosticNotes?: string;           // Usta xulosasi
  solutionNotes?: string;             // Qilingan ishlar
  status: ServiceTicketStatus;
  isWarrantyFree: boolean;            // Bepul kafolatli ta'mir
  repairCost: number;                 // Ta'mir summasi (so'mda)
  repairCostUSD?: number;             // Ta'mir summasi ($ da)
  replacementSerialNumber?: string;   // Agar ombordan zamen qilingan bo'lsa yangi S/N
  receivedBy: string;                 // Qabul qilgan xodim
}

export interface CustomerDebtPayment {
  id: string;
  paymentNumber: string;              // e.g. "QP-1001" (Qarz To'lovi)
  createdAt: string;                  // e.g. "2026-10-04 14:20"
  customerId: string;
  customerName: string;
  customerPhone?: string;
  amountUZS: number;                  // To'langan summa so'mda
  amountUSD: number;                  // To'langan summa $ da
  currencyPaid: 'UZS' | 'USD';        // Qaysi valyutada to'landi
  paymentMethod: 'cash' | 'cashUSD' | 'card' | 'bank_transfer';
  exchangeRate: number;
  previousDebtUZS: number;            // To'lovdan oldingi qarz
  remainingDebtUZS: number;           // To'lovdan keyingi qoldiq qarz
  receiptId?: string;                 // Muayyan chekka bog'langan bo'lsa
  receiptNumber?: string;
  notes?: string;
  cashierName: string;
}

export interface PayrollRecord {
  id: string;
  payrollNumber: string;              // e.g. "IH-0012"
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  periodMonth: string;                // e.g. "2026-10" (yil-oy)
  periodLabel: string;                // e.g. "Oktyabr 2026"
  salaryType: SalaryType;
  baseSalary: number;                 // Asosiy oklad (so'm)
  installationsCount: number;         // Bajarilgan montajlar (per_job yoki fixed_plus_job uchun)
  commissionPerInstall: number;       // 1 montaj stavkasi
  commissionTotal: number;            // Jami montaj haqqi
  percentageRate?: number;            // % stavkasi
  percentageTarget?: 'total_sales' | 'net_profit';
  salesAmountConsidered?: number;     // Hisobga olingan savdo summasi
  percentageTotal?: number;           // Foizdan chiqqan summa
  bonus: number;                      // Bonus (so'm)
  deduction: number;                  // Jarima / ushlab qolish (so'm)
  advancePaid: number;                // Avans sifatida berilgan (so'm)
  totalGross: number;                 // Jami hisoblangan (brutto)
  totalNet: number;                   // Qo'lga beriladigan (netto = gross - advance - deduction)
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  paidBy: string;                     // Kim berdi
  paidAt: string;                     // Qachon berildi
  notes?: string;
  status: 'paid' | 'pending';
}

export interface EmployeeAdvance {
  id: string;
  advanceNumber: string;              // e.g. "AV-0005"
  employeeId: string;
  employeeName: string;
  amount: number;                     // Avans summasi (so'm)
  paymentMethod: 'cash' | 'card';
  paidBy: string;
  paidAt: string;                     // e.g. "2026-10-04 14:30"
  periodMonth: string;                // Qaysi oy uchun e.g. "2026-10"
  notes?: string;
}

export interface ZReport {
  id: string;
  reportNumber: string;               // e.g. "Z-0012"
  closedAt: string;                   // e.g. "2026-10-04 22:30"
  openedAt?: string;
  cashierName: string;
  branchName: string;
  receiptsCount: number;
  totalSalesUZS: number;
  totalSalesUSD: number;
  cashUZS: number;
  cardUZS: number;
  cashUSD: number;
  debtUZS: number;
  cashbackUsedUZS: number;
  expensesUZS: number;
  expectedCashUZS: number;
  actualCashUZS: number;
  differenceUZS: number;
  sentToTelegram: boolean;
  notes?: string;
}

export type ActiveTab = 'dashboard' | 'financial_reports' | 'pos' | 'orders' | 'inventory' | 'warranty' | 'technician_portal' | 'customers' | 'employees' | 'expenses' | 'ai_advisor' | 'sales_history' | 'settings';

