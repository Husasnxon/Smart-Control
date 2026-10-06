import * as XLSX from 'xlsx';
import { Product, SaleReceipt, Customer, ServiceTicket, CustomerDebtPayment, PurchaseInvoice, PurchasePaymentRecord } from '../types';

/**
 * Cleanly format array of serial numbers for Excel
 */
const formatSerialsForExcel = (serials?: string[]): string => {
  if (!serials || serials.length === 0) return '';
  return serials.join(', ');
};

// =====================================================================
// 1. PRODUCTS EXPORT & IMPORT TEMPLATE
// =====================================================================

/**
 * Export full warehouse products list to Excel (.xlsx)
 */
export const exportProductsToExcel = (products: Product[], filename = 'ombor_mahsulotlari.xlsx') => {
  const data = products.map((p, idx) => ({
    '№': idx + 1,
    'Mahsulot Nomi': p.name,
    'Kategoriya': p.category,
    'Artikul (SKU)': p.sku || '',
    'Shtrix-kod (Barcode)': p.barcode || '',
    'Qoldiq Miqdori': p.isService ? 'Cheksiz (Xizmat)' : p.stockQuantity,
    'O\'lchov Birligi': p.unit || 'dona',
    'Tannarx (So\'m)': p.costPrice || 0,
    'Tannarx ($ USD)': p.costPriceUSD || '',
    'Sotish Narxi (So\'m)': p.retailPrice || 0,
    'Sotish Narxi ($ USD)': p.retailPriceUSD || '',
    'Ulgurji Narxi (So\'m)': p.wholesalePrice || '',
    'Usta Ish Haqqi (So\'m)': p.technicianWageUZS || '',
    'Usta Ish Haqqi ($ USD)': p.technicianWageUSD || '',
    'Kafolat Muddati (Oy)': p.warrantyMonths || 0,
    'S/N Nazorati': p.hasSerialNumber ? 'Mavjud' : 'Yo\'q',
    'Mavjud Seriya Raqamlari (S/N)': formatSerialsForExcel(p.serialNumbers),
    'Xizmat Turi (Montaj)': p.isService ? 'Ha' : 'Yo\'q'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 5 },   // №
    { wch: 45 },  // Nomi
    { wch: 28 },  // Kategoriya
    { wch: 18 },  // SKU
    { wch: 18 },  // Barcode
    { wch: 15 },  // Qoldiq
    { wch: 12 },  // Birligi
    { wch: 15 },  // Tannarx UZS
    { wch: 15 },  // Tannarx USD
    { wch: 18 },  // Sotish narxi UZS
    { wch: 18 },  // Sotish narxi USD
    { wch: 18 },  // Ulgurji narxi
    { wch: 18 },  // Usta haqqi UZS
    { wch: 18 },  // Usta haqqi USD
    { wch: 18 },  // Kafolat
    { wch: 15 },  // S/N Nazorati
    { wch: 40 },  // S/N lar
    { wch: 15 }   // Xizmat
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ombor');
  XLSX.writeFile(workbook, filename);
};

/**
 * Generate and download a sample Excel template for importing products
 */
export const downloadProductImportTemplate = () => {
  const sampleData = [
    {
      'Mahsulot Nomi': 'Hikvision DS-2CD1043G0-I 4MP IP Tashqi Kamera',
      'Kategoriya': 'Kuzatuv kameralari (CCTV)',
      'Artikul (SKU)': 'HIK-IPC-4MP-SAMPLE',
      'Shtrix-kod (Barcode)': '6931847109999',
      'Qoldiq Miqdori': 10,
      'O\'lchov Birligi': 'dona',
      'Tannarx (So\'m)': 340000,
      'Sotish Narxi (So\'m)': 440000,
      'Sotish Narxi ($ USD)': 35,
      'Kafolat Muddati (Oy)': 24,
      'Seriya Raqamlari (Vergul bilan)': 'HK-4MP-9901, HK-4MP-9902, HK-4MP-9903'
    },
    {
      'Mahsulot Nomi': 'Dahua 8-kanalli 4K NVR Video Registrator',
      'Kategoriya': 'Video Registratorlar (NVR/DVR)',
      'Artikul (SKU)': 'DH-NVR-4K-SAMPLE',
      'Shtrix-kod (Barcode)': '6931847108888',
      'Qoldiq Miqdori': 5,
      'O\'lchov Birligi': 'dona',
      'Tannarx (So\'m)': 650000,
      'Sotish Narxi (So\'m)': 890000,
      'Sotish Narxi ($ USD)': 70,
      'Kafolat Muddati (Oy)': 24,
      'Seriya Raqamlari (Vergul bilan)': 'DH-NVR-8801, DH-NVR-8802'
    },
    {
      'Mahsulot Nomi': 'UTP Cat6 23AWG Tashqi Mis Kabel (305m Quti)',
      'Kategoriya': 'Kabellar & Aksessuarlar',
      'Artikul (SKU)': 'CBL-CAT6-OUT-SAMPLE',
      'Shtrix-kod (Barcode)': '4780001122999',
      'Qoldiq Miqdori': 15,
      'O\'lchov Birligi': 'quti',
      'Tannarx (So\'m)': 440000,
      'Sotish Narxi (So\'m)': 620000,
      'Sotish Narxi ($ USD)': 48,
      'Kafolat Muddati (Oy)': 0,
      'Seriya Raqamlari (Vergul bilan)': ''
    },
    {
      'Mahsulot Nomi': 'Kamera montaji va burchak sozlash (1 nuqta)',
      'Kategoriya': 'O\'rnatish & Montaj xizmatlari',
      'Artikul (SKU)': 'SRV-CAM-INST-SAMPLE',
      'Shtrix-kod (Barcode)': 'SRV-001-SMP',
      'Qoldiq Miqdori': 9999,
      'O\'lchov Birligi': 'nuqta',
      'Tannarx (So\'m)': 0,
      'Sotish Narxi (So\'m)': 100000,
      'Sotish Narxi ($ USD)': 8,
      'Kafolat Muddati (Oy)': 12,
      'Seriya Raqamlari (Vergul bilan)': ''
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 45 },
    { wch: 28 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 40 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tovarlar_Shabloni');
  XLSX.writeFile(workbook, 'smart_control_tovarlar_shabloni.xlsx');
};

/**
 * Parse products from an uploaded Excel / CSV file
 */
export const parseProductsFromExcel = async (
  file: File
): Promise<{ products: Product[]; errors: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        const products: Product[] = [];
        const errors: string[] = [];

        rawJson.forEach((row, idx) => {
          // Normalize column names
          const name = row['Mahsulot Nomi'] || row['Nomi'] || row['Name'] || row['Наименование'] || row['nomi'];
          if (!name) {
            errors.push(`Qator ${idx + 2}: Mahsulot nomi ko'rsatilmagan`);
            return;
          }

          const category = row['Kategoriya'] || row['Category'] || row['Категория'] || 'Kuzatuv kameralari (CCTV)';
          const sku = row['Artikul (SKU)'] || row['SKU'] || row['Artikul'] || row['Артикул'] || `SKU-${Date.now()}-${idx}`;
          const barcode = String(row['Shtrix-kod (Barcode)'] || row['Barcode'] || row['Shtrix-kod'] || row['Штрихкод'] || `BC-${Date.now()}-${idx}`);
          const stockQty = Number(row['Qoldiq Miqdori'] || row['Qoldiq'] || row['Stock'] || row['Количество'] || 0);
          const unit = row['O\'lchov Birligi'] || row['Birlik'] || row['Unit'] || row['Ед. изм.'] || 'dona';
          const costPrice = Number(row['Tannarx (So\'m)'] || row['Tannarx'] || row['Cost'] || row['Себестоимость'] || 0);
          const retailPrice = Number(row['Sotish Narxi (So\'m)'] || row['Narxi'] || row['Price'] || row['Цена'] || 0);
          const retailPriceUSD = row['Sotish Narxi ($ USD)'] || row['Narxi ($)'] || row['Price USD'] ? Number(row['Sotish Narxi ($ USD)'] || row['Narxi ($)'] || row['Price USD']) : undefined;
          const warrantyMonths = Number(row['Kafolat Muddati (Oy)'] || row['Kafolat'] || row['Warranty'] || row['Гарантия'] || 12);
          
          // Serial numbers parsing
          const serialsRaw = row['Seriya Raqamlari (Vergul bilan)'] || row['Seriya raqamlari'] || row['S/N'] || row['Серийные номера'];
          let serialNumbers: string[] = [];
          if (serialsRaw) {
            serialNumbers = String(serialsRaw)
              .split(/[,;\n\r]+/)
              .map(s => s.trim())
              .filter(s => s.length > 0);
          }

          const isService = category.toLowerCase().includes('xizmat') || category.toLowerCase().includes('montaj') || unit === 'xizmat' || unit === 'nuqta';
          const hasSerialNumber = serialNumbers.length > 0 || (row['S/N Nazorati'] && String(row['S/N Nazorati']).toLowerCase() === 'mavjud');

          products.push({
            id: `prod-import-${Date.now()}-${idx}`,
            name: String(name).trim(),
            category: String(category).trim(),
            sku: String(sku).trim(),
            barcode: String(barcode).trim(),
            stockQuantity: isService ? 9999 : (hasSerialNumber && serialNumbers.length > 0 ? serialNumbers.length : stockQty),
            minStockAlert: 5,
            unit: String(unit).trim(),
            costPrice,
            retailPrice: retailPrice > 0 ? retailPrice : Math.round(costPrice * 1.3),
            retailPriceUSD,
            warrantyMonths,
            hasSerialNumber,
            serialNumbers: hasSerialNumber ? serialNumbers : undefined,
            isService
          });
        });

        resolve({ products, errors });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

// =====================================================================
// 2. SALES RECEIPTS EXPORT
// =====================================================================

/**
 * Export sales receipts history to Excel (.xlsx)
 */
export const exportSalesToExcel = (receipts: SaleReceipt[], filename = 'sotuvlar_tarixi.xlsx') => {
  const data = receipts.map((r, idx) => {
    const itemsDescription = r.items.map(it => `${it.product?.name || 'Tovar'} (${it.quantity} ${it.product?.unit || 'dona'})`).join('; ');
    const serialsList = r.items
      .filter(it => it.selectedSerialNumbers && it.selectedSerialNumbers.length > 0)
      .map(it => `${it.product?.name}: ${it.selectedSerialNumbers?.join(', ')}`)
      .join('; ');

    const techNames = r.technicians && r.technicians.length > 0
      ? r.technicians.map(t => `${t.fullName} (${t.role})`).join(', ')
      : (r.technicianName || '-');

    return {
      '№': idx + 1,
      'Chek Raqami': r.receiptNumber,
      'Sana va Vaqt': r.createdAt,
      'Kassir': r.cashierName,
      'Mijoz': r.customer?.fullName || 'Chakana xaridor',
      'Mijoz Telefoni': r.customer?.phone || '-',
      'Obyekt / O\'rnatish Manzili': r.installationAddress || '-',
      'Sotilgan Mahsulotlar': itemsDescription,
      'Sotilgan S/N Seriya Raqamlari': serialsList,
      'Kafolat Muddati (Oy)': r.warrantyMonths || 12,
      'Jami Summa (So\'m)': r.totalAmount,
      'Jami Summa ($ USD)': r.totalAmountUSD || '',
      'Naqd To\'lov (So\'m)': r.payments?.cash || 0,
      'Naqd To\'lov ($ USD)': r.payments?.cashUSD || '',
      'Karta To\'lov (So\'m)': r.payments?.card || 0,
      'Nasiya / Qarz (So\'m)': r.payments?.debt || 0,
      'Cashback Ishlatilgan': r.payments?.cashbackUsed || 0,
      'Cashback Berilgan': r.cashbackEarned || 0,
      'Biriktirilgan Ustalar': techNames,
      'Holati': r.status === 'returned' ? 'Qaytarilgan (Vozvrat)' : (r.status === 'partially_returned' ? 'Qisman qaytarilgan' : 'Muvaffaqiyatli')
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 5 },   // №
    { wch: 15 },  // Chek raqami
    { wch: 18 },  // Sana
    { wch: 18 },  // Kassir
    { wch: 30 },  // Mijoz
    { wch: 18 },  // Telefon
    { wch: 35 },  // Manzil
    { wch: 50 },  // Mahsulotlar
    { wch: 35 },  // S/N lar
    { wch: 15 },  // Kafolat
    { wch: 18 },  // Jami summa UZS
    { wch: 18 },  // Jami summa USD
    { wch: 18 },  // Naqd UZS
    { wch: 18 },  // Naqd USD
    { wch: 18 },  // Karta UZS
    { wch: 18 },  // Nasiya UZS
    { wch: 18 },  // Cashback ishlatilgan
    { wch: 18 },  // Cashback berilgan
    { wch: 30 },  // Ustalar
    { wch: 18 }   // Holati
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sotuvlar_Tarixi');
  XLSX.writeFile(workbook, filename);
};

// =====================================================================
// 3. CUSTOMER DEBTS & REPAYMENTS EXPORT
// =====================================================================

/**
 * Export customer debts ledger to Excel (.xlsx)
 */
export const exportDebtsToExcel = (
  customers: Customer[], 
  debtPayments: CustomerDebtPayment[], 
  exchangeRate = 12850,
  filename = 'mijozlar_qarz_daftari.xlsx'
) => {
  const debtors = customers.filter(c => (c.debtBalance || 0) > 0);

  // Sheet 1: Active Debtors
  const debtorsData = debtors.map((c, idx) => ({
    '№': idx + 1,
    'Mijoz F.I.Sh.': c.fullName,
    'Telefon Raqami': c.phone,
    'Sodiqlik Darajasi (Tier)': c.tier,
    'Qarzdorlik (So\'m)': c.debtBalance,
    'Qarzdorlik ($ USD)': c.debtBalanceUSD || Number((c.debtBalance / exchangeRate).toFixed(2)),
    'Jami Xaridlari (So\'m)': c.totalPurchases,
    'To\'plangan Cashback (So\'m)': c.cashbackBalance,
    'Ro\'yxatdan O\'tgan Sana': c.registeredDate
  }));

  const worksheet1 = XLSX.utils.json_to_sheet(debtorsData);
  worksheet1['!cols'] = [
    { wch: 5 },
    { wch: 35 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 22 },
    { wch: 18 }
  ];

  // Sheet 2: Repayments History Log
  const paymentsData = debtPayments.map((p, idx) => ({
    '№': idx + 1,
    'Kvitansiya Raqami': p.paymentNumber,
    'To\'lov Sanasi': p.createdAt,
    'Mijoz': p.customerName,
    'Telefon': p.customerPhone || '-',
    'To\'langan Summa (So\'m)': p.amountUZS,
    'To\'langan Summa ($ USD)': p.amountUSD || '',
    'To\'lov Usuli': p.paymentMethod,
    'Oldingi Qarz (So\'m)': p.previousDebtUZS,
    'Qolgan Qarz Balansi (So\'m)': p.remainingDebtUZS,
    'Bog\'langan Chek': p.receiptNumber || '-',
    'Kassir': p.cashierName,
    'Izoh': p.notes || '-'
  }));

  const worksheet2 = XLSX.utils.json_to_sheet(paymentsData);
  worksheet2['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet1, 'Qarzdorlar');
  XLSX.utils.book_append_sheet(workbook, worksheet2, 'To\'lovlar_Tarixi');
  XLSX.writeFile(workbook, filename);
};

// =====================================================================
// 4. WARRANTY & SERVICE TICKETS EXPORT
// =====================================================================

/**
 * Export service tickets and warranty records to Excel (.xlsx)
 */
export const exportWarrantyToExcel = (
  tickets: ServiceTicket[], 
  filename = 'kafolat_va_servis_jurnali.xlsx'
) => {
  const statusTranslations: Record<string, string> = {
    received: 'Qabul qilindi',
    in_diagnosis: 'Diagnostika',
    in_repair: 'Ta\'mirda',
    ready: 'Tayyor (Topshirishga)',
    replaced: 'Almashtirildi (Zamen)',
    returned_to_client: 'Mijozga topshirildi',
    cancelled: 'Bekor qilindi'
  };

  const data = tickets.map((t, idx) => ({
    '№': idx + 1,
    'Chipta Raqami': t.ticketNumber,
    'Qabul Qilingan Sana': t.createdAt,
    'Tayyor Bo\'lgan Sana': t.completedAt || '-',
    'Seriya Raqami (S/N)': t.serialNumber,
    'Qurilma Nomi': t.productName,
    'Mijoz': t.customerName,
    'Telefon': t.customerPhone,
    'Obyekt / Manzil': t.installationAddress || '-',
    'Biriktirilgan Usta': t.assignedTechnicianName || '-',
    'Nosozlik / Shikoyat': t.issueDescription,
    'Holati': statusTranslations[t.status] || t.status,
    'Kafolat Turi': t.isWarrantyFree ? 'Kafolatli (Bepul)' : 'Kafolatsiz (Pullik)',
    'Ta\'mir Summasi (So\'m)': t.repairCost || 0,
    'Ta\'mir Summasi ($ USD)': t.repairCostUSD || '',
    'Almashtirilgan Yangi S/N (Zamen)': t.replacementSerialNumber || '-',
    'Usta Xulosasi': t.diagnosticNotes || '-',
    'Qilingan Ishlar': t.solutionNotes || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 5 },   // №
    { wch: 15 },  // Chipta
    { wch: 18 },  // Sana
    { wch: 18 },  // Tayyor sana
    { wch: 22 },  // S/N
    { wch: 35 },  // Nomi
    { wch: 28 },  // Mijoz
    { wch: 18 },  // Telefon
    { wch: 30 },  // Manzil
    { wch: 25 },  // Usta
    { wch: 40 },  // Nosozlik
    { wch: 22 },  // Holati
    { wch: 20 },  // Kafolat
    { wch: 18 },  // Ta'mir UZS
    { wch: 18 },  // Ta'mir USD
    { wch: 25 },  // Yangi S/N
    { wch: 35 },  // Xulosa
    { wch: 35 }   // Ishlar
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Servis_Jurnali');
  XLSX.writeFile(workbook, filename);
};

// =====================================================================
// 5. PURCHASES (KIRIM NAKLADNOYLAR) & SUPPLIERS REPORT EXPORT
// =====================================================================

/**
 * Export purchase invoices (Kirim nakladnoylar) to Excel (.xlsx)
 */
export const exportPurchasesToExcel = (
  purchases: PurchaseInvoice[],
  filename = 'ombor_kirim_nakladnoylar.xlsx'
) => {
  const statusLabels: Record<string, string> = {
    paid: 'To\'liq to\'langan',
    partial: 'Qisman to\'langan',
    debt: 'Nasiya (Qarz)'
  };

  const data = purchases.map((p, idx) => ({
    '№': idx + 1,
    'Nakladnoy №': p.invoiceNumber,
    'Sana': p.createdAt,
    'Yetkazib Beruvchi (Ta\'minotchi)': p.supplierName,
    'Telefon': p.supplierPhone || '-',
    'Schot-faktura №': p.supplierInvoiceNumber || '-',
    'Ombor': p.warehouseName,
    'Tovarlar Turlari Soni': p.items.length,
    'Jami Dona': p.totalQuantity,
    'Valyuta': p.currency,
    'Kurs (1$)': p.exchangeRate,
    'Jami Summa (So\'m)': p.totalAmount,
    'Jami Summa ($ USD)': p.totalAmountUSD,
    'To\'langan Summa (So\'m)': p.paidAmount || 0,
    'To\'langan Summa ($ USD)': p.paidAmountUSD || 0,
    'Qoldiq Qarz (So\'m)': p.debtAmount || 0,
    'Qoldiq Qarz ($ USD)': p.debtAmountUSD || 0,
    'To\'lov Holati': statusLabels[p.paymentStatus] || p.paymentStatus,
    'Qabul Qildi': p.receivedBy || '-',
    'Holati': p.status === 'received' ? 'Qabul qilingan' : p.status === 'draft' ? 'Qoralama' : 'Bekor qilingan',
    'Izoh': p.notes || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 5 },   // №
    { wch: 16 },  // Nakladnoy
    { wch: 18 },  // Sana
    { wch: 30 },  // Ta'minotchi
    { wch: 16 },  // Tel
    { wch: 18 },  // SF
    { wch: 18 },  // Ombor
    { wch: 18 },  // Turlar
    { wch: 12 },  // Jami dona
    { wch: 10 },  // Valyuta
    { wch: 12 },  // Kurs
    { wch: 18 },  // Jami UZS
    { wch: 18 },  // Jami USD
    { wch: 18 },  // To'langan UZS
    { wch: 18 },  // To'langan USD
    { wch: 18 },  // Qarz UZS
    { wch: 18 },  // Qarz USD
    { wch: 20 },  // To'lov holati
    { wch: 20 },  // Qabul qildi
    { wch: 16 },  // Holati
    { wch: 30 }   // Izoh
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kirim_Nakladnoylar');
  XLSX.writeFile(workbook, filename);
};

