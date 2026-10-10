/**
 * SMART CONTROL — Telegram Hisobot Boti Integratsiyasi
 * 
 * Ushbu modul Telegram Bot API orqali do'kon egasi yoki ishchi guruhga
 * kunlik kassa hisoboti (Z-Report), kam qolgan tovarlar, ustalar montaj xulosasi,
 * nasiyalar va kafolat holatlarini to'g'ridan-to'g'ri avtomat yuborishni ta'minlaydi.
 */

import { Product, SaleReceipt, Expense, Employee, Customer, CustomerDebtPayment, ServiceTicket } from '../types';
import { formatNumberWithSpaces, formatUSDNumber, isTodayDate, getNormalizedDateKey } from './formatters';

export interface TelegramSettings {
  botToken: string;
  chatId: string;
  botUsername?: string;
  enabled: boolean;
  storeName: string;
  branchName: string;
  autoSendDaily: boolean;
  notifyLowStock: boolean;
  notifyNewDebts: boolean;
  notifyServiceTickets: boolean;
  lastSentAt?: string;
}

export const DEFAULT_TELEGRAM_SETTINGS: TelegramSettings = {
  botToken: '',
  chatId: '',
  botUsername: '',
  enabled: false,
  storeName: 'SMART CONTROL',
  branchName: 'Chilonzor-1 Filiali',
  autoSendDaily: true,
  notifyLowStock: true,
  notifyNewDebts: true,
  notifyServiceTickets: true,
};

const STORAGE_KEY = 'sc_telegram_settings';

/**
 * Get saved Telegram settings from local storage
 */
export const getTelegramSettings = (): TelegramSettings => {
  if (typeof window === 'undefined') return DEFAULT_TELEGRAM_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_TELEGRAM_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load telegram settings', e);
  }
  return DEFAULT_TELEGRAM_SETTINGS;
};

/**
 * Save Telegram settings to local storage
 */
export const saveTelegramSettings = (settings: TelegramSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save telegram settings', e);
  }
};

/**
 * Send an HTML formatted message directly via Telegram Bot API
 */
export const sendTelegramMessage = async (
  botToken: string,
  chatId: string,
  text: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const token = botToken.trim();
    const chat = chatId.trim();

    if (!token) {
      return { success: false, message: 'Telegram Bot Token kiritilmagan!' };
    }
    if (!chat) {
      return { success: false, message: 'Telegram Chat ID kiritilmagan!' };
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chat,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      const errDetail = data.description || 'Noma\'lum xatolik yuz berdi';
      return {
        success: false,
        message: `Telegram API xatosi: ${errDetail}`,
      };
    }

    // Save timestamp of successful send
    const current = getTelegramSettings();
    saveTelegramSettings({
      ...current,
      lastSentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });

    return {
      success: true,
      message: 'Hisobot Telegramga muvaffaqiyatli yuborildi!',
      data: data.result,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Tarmoqqa ulanishda xatolik: ${error?.message || 'Internet aloqasini tekshiring'}`,
    };
  }
};

/**
 * Send a quick test ping message to verify token and chat ID
 */
export const testTelegramConnection = async (
  botToken: string,
  chatId: string,
  storeName = 'SMART CONTROL'
): Promise<{ success: boolean; message: string }> => {
  const now = new Date().toLocaleString('uz-UZ', { hour12: false });
  const text = 
`🔔 <b>${escapeHtml(storeName)} — Tizim Sinovi</b>
━━━━━━━━━━━━━━━━━━━━
✅ <b>Aloqa o'rnatildi!</b>
Telegram hisobot boti muvaffaqiyatli ulandi.
Endi kunlik kassa xulosalari, kam qolgan tovarlar va servis xabarlari shu yerga keladi.

📅 <b>Vaqt:</b> <code>${now}</code>
🚀 <b>Holat:</b> Tizim faol va barqaror ishlamoqda.`;

  return sendTelegramMessage(botToken, chatId, text);
};

// =====================================================================
// REPORT GENERATORS
// =====================================================================

/**
 * Escape HTML special chars for Telegram HTML parse_mode
 */
export const escapeHtml = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * 1. Bugungi Kunlik Kassa & Savdo Hisoboti (Daily Z-Report)
 */
export const generateDailySalesReport = (
  receipts: SaleReceipt[],
  expenses: Expense[],
  exchangeRate: number,
  storeName = 'SMART CONTROL',
  branchName = 'Chilonzor-1 Filiali',
  targetDate?: string, // Format: 'YYYY-MM-DD'
  auditInfo?: { actualCashUZS?: number; differenceUZS?: number; actualCashUSD?: number; differenceUSD?: number; notes?: string }
): string => {
  const dateKey = targetDate || new Date().toISOString().split('T')[0];
  const displayDate = new Date().toLocaleString('uz-UZ', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  // Filter receipts for today
  const todayReceipts = receipts.filter(r => getNormalizedDateKey(r.createdAt) === dateKey);
  
  // Financial breakdown
  let totalSales = 0;
  let totalCashUZS = 0;
  let totalCardUZS = 0;
  let totalCashUSD = 0;
  let totalDebtUZS = 0;
  let totalCashbackUsed = 0;

  todayReceipts.forEach(r => {
    totalSales += r.totalAmount;
    if (r.payments) {
      totalCashUZS += r.payments.cash || 0;
      totalCardUZS += r.payments.card || 0;
      totalCashUSD += r.payments.cashUSD || 0;
      totalDebtUZS += r.payments.debt || 0;
      totalCashbackUsed += r.payments.cashbackUsed || 0;
    }
  });

  // Today's expenses
  const todayExpenses = expenses.filter(e => targetDate ? getNormalizedDateKey(e.createdAt) === targetDate : isTodayDate(e.createdAt));
  const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Cash in drawer (Naqd kassa: naqd so'm + naqd dollar * kurs - xarajatlar)
  const cashUSDInUZS = totalCashUSD * exchangeRate;
  const netCashInDrawer = (totalCashUZS + cashUSDInUZS) - totalExpenses;
  const approxUSDTotal = (totalSales / exchangeRate).toFixed(2);

  // Installations & Techs summary
  const techMap = new Map<string, { count: number; wage: number }>();
  todayReceipts.forEach(r => {
    if (r.technicians && r.technicians.length > 0) {
      r.technicians.forEach(t => {
        const existing = techMap.get(t.fullName) || { count: 0, wage: 0 };
        techMap.set(t.fullName, {
          count: existing.count + 1,
          wage: existing.wage + t.wageUZS
        });
      });
    }
  });

  let message = 
`📊 <b>${escapeHtml(storeName)} — KUNLIK KASSA HISOBOTI</b>
🏢 <b>Filial:</b> ${escapeHtml(branchName)}
📅 <b>Sana va vaqt:</b> <code>${displayDate}</code>
━━━━━━━━━━━━━━━━━━━━
💰 <b>JAMI SAVDO:</b> <code>${formatNumberWithSpaces(totalSales)} so'm</code> (≈ $${approxUSDTotal})
🧾 <b>Cheklar soni:</b> ${todayReceipts.length} ta
${todayReceipts.length > 0 ? `🎯 <b>O'rtacha chek:</b> <code>${formatNumberWithSpaces(Math.round(totalSales / todayReceipts.length))} so'm</code>\n` : ''}
💳 <b>TO'LOV TURLARI BO'YICHA:</b>
• 💵 <b>Naqd (so'm):</b> <code>${formatNumberWithSpaces(totalCashUZS)} so'm</code>
• 💳 <b>Karta (Uzcard/Humo):</b> <code>${formatNumberWithSpaces(totalCardUZS)} so'm</code>
• 💵 <b>Naqd ($ USD):</b> <code>$${formatUSDNumber(totalCashUSD)}</code> (≈ ${formatNumberWithSpaces(cashUSDInUZS)} so'm)
• 📝 <b>Nasiyaga (Qarz):</b> <code>${formatNumberWithSpaces(totalDebtUZS)} so'm</code>
${totalCashbackUsed > 0 ? `• 🎁 <b>Cashback ishlatildi:</b> <code>${formatNumberWithSpaces(totalCashbackUsed)} so'm</code>\n` : ''}
━━━━━━━━━━━━━━━━━━━━
📉 <b>CHIQIMLAR & XARAJATLAR:</b> <code>${formatNumberWithSpaces(totalExpenses)} so'm</code>
${todayExpenses.length > 0 ? todayExpenses.slice(0, 4).map(e => `  ▫️ <i>${escapeHtml(e.category)}:</i> ${formatNumberWithSpaces(e.amount)} so'm`).join('\n') + '\n' : ''}
💵 <b>KASSADAGI SOF NAQD PUL:</b>
<code>${formatNumberWithSpaces(Math.max(0, netCashInDrawer))} so'm</code>`;

  // Technicians section if any
  if (techMap.size > 0) {
    message += `\n\n━━━━━━━━━━━━━━━━━━━━\n👷 <b>BUGUNGI USTALAR & MONTAJ:</b>`;
    techMap.forEach((val, name) => {
      message += `\n• <b>${escapeHtml(name)}:</b> ${val.count} ta obyekt (<code>${formatNumberWithSpaces(val.wage)} so'm</code>)`;
    });
  }

  // Physical cash audit reconciliation if provided
  if (auditInfo) {
    message += `\n\n━━━━━━━━━━━━━━━━━━━━\n🔒 <b>KASSADAGI FAKTIK NAQD PUL:</b>`;
    if (auditInfo.actualCashUZS !== undefined) {
      const diffUZS = auditInfo.differenceUZS || 0;
      const statusUZS = diffUZS === 0 ? '🟢 To\'liq mos' : diffUZS > 0 ? `🟡 Ortiqcha (+${formatNumberWithSpaces(diffUZS)})` : `🔴 Kamomad (${formatNumberWithSpaces(diffUZS)})`;
      message += `\n• <b>So'm:</b> <code>${formatNumberWithSpaces(auditInfo.actualCashUZS)} so'm</code> (${statusUZS})`;
    }
    if (auditInfo.actualCashUSD !== undefined) {
      const diffUSD = auditInfo.differenceUSD || 0;
      const statusUSD = diffUSD === 0 ? '🟢 To\'liq mos' : diffUSD > 0 ? `🟡 Ortiqcha (+$${diffUSD})` : `🔴 Kamomad ($${diffUSD})`;
      message += `\n• <b>Dollar ($):</b> <code>$${formatUSDNumber(auditInfo.actualCashUSD)} USD</code> (${statusUSD})`;
    }
    if (auditInfo.notes) {
      message += `\n📝 <b>Izoh:</b> <i>${escapeHtml(auditInfo.notes)}</i>`;
    }
  }

  message += `\n\n🤖 <i>SMART CONTROL ERP avtomatik hisoboti</i>`;
  return message;
};

/**
 * 2. Kam Qolgan Tovarlar Signali (Low Stock Alert)
 */
export const generateLowStockReport = (
  products: Product[],
  storeName = 'SMART CONTROL',
  branchName = 'Asosiy Ombor'
): string => {
  const lowStockItems = products.filter(
    p => !p.isService && p.stockQuantity <= (p.minStockAlert || 5)
  );

  const displayDate = new Date().toLocaleString('uz-UZ', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  if (lowStockItems.length === 0) {
    return (
`✅ <b>${escapeHtml(storeName)} — OMBOR MONITORINGI</b>
━━━━━━━━━━━━━━━━━━━━
Omborda barcha tovarlar yetarli miqdorda mavjud.
Kam qolgan yoki tugagan mahsulotlar aniqlanmadi!

📅 <b>Vaqt:</b> <code>${displayDate}</code>`
    );
  }

  // Sort: 0 stock items first
  lowStockItems.sort((a, b) => a.stockQuantity - b.stockQuantity);

  let message = 
`⚠️ <b>${escapeHtml(storeName)} — OMBOR OGOHLANTIRISHI</b>
📦 <b>Kam qolgan va tugagan tovarlar ro'yxati:</b>
🏢 <b>Ombor:</b> ${escapeHtml(branchName)}
📅 <b>Vaqt:</b> <code>${displayDate}</code>
━━━━━━━━━━━━━━━━━━━━\n`;

  lowStockItems.slice(0, 15).forEach((p, idx) => {
    const isOutOfStock = p.stockQuantity === 0;
    const statusIcon = isOutOfStock ? '🔴' : '🟡';
    const statusText = isOutOfStock ? '<b>TUGADI (0 dona)</b>' : `<b>${p.stockQuantity} ${escapeHtml(p.unit || 'dona')} qoldi</b>`;
    const priceText = p.retailPriceUSD ? `$${p.retailPriceUSD}` : `${formatNumberWithSpaces(p.retailPrice)} so'm`;
    
    message += `${statusIcon} ${idx + 1}. <b>${escapeHtml(p.name)}</b>\n`;
    message += `   Qoldiq: ${statusText} | Narx: <code>${priceText}</code>\n`;
    if (p.sku) {
      message += `   Artikul: <code>${escapeHtml(p.sku)}</code>\n`;
    }
  });

  if (lowStockItems.length > 15) {
    message += `\n... va yana <b>${lowStockItems.length - 15} ta</b> tovar qoldig'i kam!`;
  }

  message += `\n━━━━━━━━━━━━━━━━━━━━\n🛒 <i>Zudlik bilan ta'minotchilarga buyurtma berish tavsiya etiladi.</i>`;
  return message;
};

/**
 * 3. O'rnatishlar va Ustalar Hisoboti (Technicians Report)
 */
export const generateTechniciansReport = (
  receipts: SaleReceipt[],
  employees: Employee[],
  storeName = 'SMART CONTROL',
  targetDate?: string
): string => {
  const dateKey = targetDate || getNormalizedDateKey();
  const todayReceipts = receipts.filter(r => getNormalizedDateKey(r.createdAt) === dateKey);

  const techStats = new Map<string, {
    fullName: string;
    phone: string;
    jobsCount: number;
    totalWage: number;
    addresses: string[];
  }>();

  todayReceipts.forEach(r => {
    if (r.technicians && r.technicians.length > 0) {
      r.technicians.forEach(t => {
        const techId = t.id || t.fullName;
        const cur = techStats.get(techId) || {
          fullName: t.fullName,
          phone: t.phone || '',
          jobsCount: 0,
          totalWage: 0,
          addresses: [],
        };
        cur.jobsCount += 1;
        cur.totalWage += t.wageUZS;
        if (r.installationAddress && !cur.addresses.includes(r.installationAddress)) {
          cur.addresses.push(r.installationAddress);
        }
        techStats.set(techId, cur);
      });
    }
  });

  const displayDate = new Date().toLocaleDateString('uz-UZ');

  if (techStats.size === 0) {
    return (
`👷 <b>${escapeHtml(storeName)} — USTALAR VA MONTAJ HISOBOTI</b>
━━━━━━━━━━━━━━━━━━━━
Bugun (<code>${displayDate}</code>) hali o'rnatish va servis xizmatlari qayd etilmadi.`
    );
  }

  let totalWagesAll = 0;
  let totalJobsAll = 0;

  let message = 
`👷 <b>${escapeHtml(storeName)} — USTALAR VA MONTAJ HISOBOTI</b>
📅 <b>Sana:</b> <code>${displayDate}</code>
━━━━━━━━━━━━━━━━━━━━\n`;

  techStats.forEach((t) => {
    totalWagesAll += t.totalWage;
    totalJobsAll += t.jobsCount;

    message += `🔧 <b>${escapeHtml(t.fullName)}</b>\n`;
    message += `• Bajarilgan ishlar: <b>${t.jobsCount} ta obyekt</b>\n`;
    message += `• Hisoblangan xizmat haqi: <code>${formatNumberWithSpaces(t.totalWage)} so'm</code>\n`;
    if (t.addresses.length > 0) {
      message += `• Manzillar: <i>${escapeHtml(t.addresses.slice(0, 3).join(', '))}</i>\n`;
    }
    message += `\n`;
  });

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🎯 <b>Jami montajlar:</b> ${totalJobsAll} ta\n`;
  message += `💰 <b>Jami to'lanadigan ish haqi:</b> <code>${formatNumberWithSpaces(totalWagesAll)} so'm</code>`;

  return message;
};

/**
 * 4. Nasiyalar & Qarzlar Daftari Xulosasi (Debts Summary Report)
 */
export const generateDebtSummaryReport = (
  customers: Customer[],
  debtPayments: CustomerDebtPayment[],
  exchangeRate: number,
  storeName = 'SMART CONTROL'
): string => {
  const debtors = customers.filter(c => (c.debtBalance || 0) > 0 || (c.debtBalanceUSD || 0) > 0);
  
  let totalDebtUZS = 0;
  let totalDebtUSD = 0;
  debtors.forEach(c => {
    totalDebtUZS += c.debtBalance || 0;
    totalDebtUSD += c.debtBalanceUSD || 0;
  });

  const todayPayments = debtPayments.filter(p => isTodayDate(p.createdAt));
  const totalCollectedToday = todayPayments.reduce((sum, p) => sum + p.amountUZS, 0);

  // Top 5 debtors
  const topDebtors = [...debtors].sort((a, b) => (b.debtBalance || 0) - (a.debtBalance || 0)).slice(0, 5);

  let message = 
`📝 <b>${escapeHtml(storeName)} — NASIYALAR & QARZ DAFTARI</b>
━━━━━━━━━━━━━━━━━━━━
👥 <b>Faol qarzdorlar soni:</b> ${debtors.length} ta mijoz
💰 <b>JAMI QARZDORLIK:</b>
• So'mda: <code>${formatNumberWithSpaces(totalDebtUZS)} so'm</code>
• Dollarda: <code>$${formatUSDNumber(totalDebtUSD)} USD</code>
• Jami ekvivalent: <code>${formatNumberWithSpaces(totalDebtUZS + Math.round(totalDebtUSD * exchangeRate))} so'm</code>
━━━━━━━━━━━━━━━━━━━━
💵 <b>Bugun undirilgan qarzlar:</b> <code>${formatNumberWithSpaces(totalCollectedToday)} so'm</code> (${todayPayments.length} ta to'lov)
\n`;

  if (topDebtors.length > 0) {
    message += `⚠️ <b>ENG YIRIK QARZDORLAR:</b>\n`;
    topDebtors.forEach((c, i) => {
      const usdPart = (c.debtBalanceUSD || 0) > 0 ? ` + $${formatUSDNumber(c.debtBalanceUSD || 0)}` : '';
      message += `${i + 1}. <b>${escapeHtml(c.fullName)}</b> (${escapeHtml(c.phone)})\n`;
      message += `   Qarz: <code>${formatNumberWithSpaces(c.debtBalance || 0)} so'm${usdPart}</code>\n`;
    });
  }

  return message;
};

/**
 * 5. Kafolat & Servis Xulosasi (Warranty & Service Tickets Report)
 */
export const generateServiceWarrantyReport = (
  tickets: ServiceTicket[],
  storeName = 'SMART CONTROL'
): string => {
  const activeTickets = tickets.filter(
    t => t.status === 'received' || t.status === 'in_diagnosis' || t.status === 'in_repair'
  );
  const readyTickets = tickets.filter(t => t.status === 'ready');
  const replacedTickets = tickets.filter(t => t.status === 'replaced');

  let message = 
`🛠 <b>${escapeHtml(storeName)} — KAFOLAT & SERVIS MARKAZI</b>
━━━━━━━━━━━━━━━━━━━━
📋 <b>Jami qayd etilgan servis ishlari:</b> ${tickets.length} ta
⏳ <b>Ta'mir jarayonida (Faol):</b> ${activeTickets.length} ta
✅ <b>Tayyor (Mijozga topshirishga):</b> ${readyTickets.length} ta
🔄 <b>Ombordan yangisiga almashtirildi (Zamen):</b> ${replacedTickets.length} ta
━━━━━━━━━━━━━━━━━━━━\n`;

  if (readyTickets.length > 0) {
    message += `🎉 <b>TAYYOR BO'LGAN QURILMALAR (Mijozga berish kerak):</b>\n`;
    readyTickets.slice(0, 5).forEach((t, i) => {
      message += `${i + 1}. <b>${escapeHtml(t.productName)}</b> (S/N: <code>${escapeHtml(t.serialNumber)}</code>)\n`;
      message += `   Mijoz: ${escapeHtml(t.customerName)} (${escapeHtml(t.customerPhone)})\n`;
    });
    message += `\n`;
  }

  if (activeTickets.length > 0) {
    message += `🔧 <b>HOZIR TA'MIRLANAYOTGANLAR:</b>\n`;
    activeTickets.slice(0, 5).forEach((t, i) => {
      message += `${i + 1}. <b>${escapeHtml(t.productName)}</b> — <i>${escapeHtml(t.issueDescription)}</i>\n`;
      message += `   Usta: ${escapeHtml(t.assignedTechnicianName || 'Biriktirilmagan')}\n`;
    });
  }

  return message;
};
