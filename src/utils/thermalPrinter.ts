import { SaleReceipt } from '../types';
import { formatNumberWithSpaces, formatUSDNumber } from './formatters';

export interface ThermalPrintOptions {
  width: '58' | '80';
  customFooter?: string;
  showQR?: boolean;
  branchName?: string;
  storePhone?: string;
}

/**
 * Generates clean, high-contrast, zero-margin HTML specifically formatted for 58mm / 80mm thermal receipts.
 */
export function generateThermalReceiptHtml(
  receipt: SaleReceipt,
  options: ThermalPrintOptions = { width: '58' }
): string {
  const { width = '58', customFooter = "Xaridingiz uchun tashakkur! Barakali bo'lsin!", showQR = true, branchName = 'Asosiy Filial', storePhone = '+998 90 123-45-67' } = options;
  const is58 = width === '58';
  const fontSize = is58 ? '13px' : '14.5px';
  const titleSize = is58 ? '17px' : '19px';
  const subTitleSize = is58 ? '12px' : '13.5px';
  const smallSize = is58 ? '11.5px' : '12.5px';

  const netTotal = receipt.totalAmount - (receipt.totalRefunded || 0);

  const itemsRows = receipt.items.map((it, idx) => {
    const itemTotal = it.quantity * it.appliedPrice;
    const serialsHtml = it.selectedSerialNumbers && it.selectedSerialNumbers.length > 0 
      ? `<div style="font-size:${smallSize};font-weight:bold;margin:2px 0;padding:1px 3px;border:1px dashed #000;">S/N: ${it.selectedSerialNumbers.join(', ')}</div>`
      : '';
    const returnHtml = it.returnedQuantity && it.returnedQuantity > 0 
      ? `<div style="font-size:10px;font-weight:bold;font-style:italic;">[Qaytarildi: ${it.returnedQuantity} ${it.product.unit}]</div>`
      : '';

    return `
      <div style="margin-bottom: 6px; page-break-inside: avoid; border-bottom: 1px dotted #ccc; padding-bottom: 4px;">
        <div style="font-weight: 900; line-height: 1.2; font-size: ${fontSize};">${idx + 1}. ${escapeHtml(it.product.name)}</div>
        ${serialsHtml}
        <div style="display: flex; justify-content: space-between; font-size: ${smallSize}; margin-top: 2px;">
          <span>${it.quantity} ${it.product.unit} × ${formatNumberWithSpaces(it.appliedPrice)}</span>
          <span style="font-weight: 900; font-size: ${fontSize};">${formatNumberWithSpaces(itemTotal)}</span>
        </div>
        ${returnHtml}
      </div>
    `;
  }).join('');

  const statusStamp = receipt.status === 'returned'
    ? `<div style="margin-top:4px;padding:3px;background:#000;color:#fff;font-weight:900;font-size:11px;text-align:center;">[ BEKOR QILINDI / VOZVRAT ]</div>`
    : receipt.status === 'partially_returned'
    ? `<div style="margin-top:4px;padding:3px;background:#000;color:#fff;font-weight:900;font-size:11px;text-align:center;">[ QISMAN QAYTARILGAN ]</div>`
    : receipt.status === 'edited'
    ? `<div style="margin-top:4px;padding:3px;border:1px solid #000;font-weight:bold;font-size:11px;text-align:center;">[ TAHRIRLANGAN CHEK ]</div>`
    : '';

  const returnedBox = receipt.returnedItems && receipt.returnedItems.length > 0
    ? `
      <div style="border: 1px dashed #000; padding: 4px; margin: 6px 0; font-size: ${smallSize};">
        <div style="display:flex;justify-content:space-between;font-weight:900;">
          <span>Qaytarilganlar (Vozvrat):</span>
          <span>-${formatNumberWithSpaces(receipt.totalRefunded || 0)}</span>
        </div>
        ${receipt.returnedItems.map(r => `
          <div style="display:flex;justify-content:space-between;border-top:1px dotted #666;padding-top:2px;font-size:10px;">
            <span>• ${escapeHtml(r.productName)} (${r.quantity} ta)</span>
            <span style="font-weight:bold;">-${formatNumberWithSpaces(r.totalRefund)}</span>
          </div>
        `).join('')}
      </div>
    `
    : '';

  const paymentsHtml = `
    <div style="border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 5px; font-size: ${smallSize};">
      ${receipt.payments.cashUSD && receipt.payments.cashUSD > 0 ? `
        <div style="display:flex;justify-content:space-between;font-weight:bold;">
          <span>Naqd Dollar ($ USD):</span>
          <span>$${formatUSDNumber(receipt.payments.cashUSD)}</span>
        </div>
      ` : ''}
      ${receipt.payments.cash > 0 ? `
        <div style="display:flex;justify-content:space-between;">
          <span>Naqd So'm:</span>
          <span style="font-weight:bold;">${formatNumberWithSpaces(receipt.payments.cash)} so'm</span>
        </div>
      ` : ''}
      ${receipt.payments.card > 0 ? `
        <div style="display:flex;justify-content:space-between;">
          <span>Karta (Uzcard/Humo):</span>
          <span style="font-weight:bold;">${formatNumberWithSpaces(receipt.payments.card)} so'm</span>
        </div>
      ` : ''}
      ${receipt.payments.debt > 0 ? `
        <div style="display:flex;justify-content:space-between;font-weight:900;">
          <span>Nasiya / Qarz:</span>
          <span style="font-weight:900;">${formatNumberWithSpaces(receipt.payments.debt)} so'm</span>
        </div>
      ` : ''}
    </div>
  `;

  const warrantyHtml = receipt.warrantyMonths && receipt.warrantyMonths > 0
    ? `
      <div style="border: 1px solid #000; padding: 5px; margin: 6px 0; font-size: ${smallSize};">
        <div style="display:flex;justify-content:space-between;font-weight:900;">
          <span>KAFOLAT TALONI:</span>
          <span>${receipt.warrantyMonths} OY</span>
        </div>
        <div style="font-size:10px;line-height:1.2;margin-top:2px;">
          Kafolat uskuna S/N seriya raqami va ushbu chek orqali servis markazida amal qiladi. Plomba butunligi shart.
        </div>
      </div>
    `
    : '';

  const cashbackHtml = receipt.customer
    ? `
      <div style="border: 1px dotted #000; padding: 4px; margin: 5px 0; font-size: ${smallSize};">
        <div style="display:flex;justify-content:space-between;font-weight:bold;">
          <span>Cashback qo'shildi:</span>
          <span>+${(receipt.cashbackEarned || 0).toLocaleString()} so'm</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>Jami Cashback balansingiz:</span>
          <span style="font-weight:900;">${((receipt.customer.cashbackBalance || 0) - (receipt.payments.cashbackUsed || 0) + (receipt.cashbackEarned || 0)).toLocaleString()} so'm</span>
        </div>
      </div>
    `
    : '';

  // SVG QR Code representation
  const qrSvg = showQR ? `
    <div style="text-align: center; margin: 6px 0;">
      <svg width="80" height="80" viewBox="0 0 100 100" style="margin: 0 auto; display: block;">
        <rect width="100" height="100" fill="#ffffff" />
        <!-- Corner 1 -->
        <rect x="5" y="5" width="30" height="30" fill="#000000" />
        <rect x="10" y="10" width="20" height="20" fill="#ffffff" />
        <rect x="15" y="15" width="10" height="10" fill="#000000" />
        <!-- Corner 2 -->
        <rect x="65" y="5" width="30" height="30" fill="#000000" />
        <rect x="70" y="10" width="20" height="20" fill="#ffffff" />
        <rect x="75" y="15" width="10" height="10" fill="#000000" />
        <!-- Corner 3 -->
        <rect x="5" y="65" width="30" height="30" fill="#000000" />
        <rect x="10" y="70" width="20" height="20" fill="#ffffff" />
        <rect x="15" y="75" width="10" height="10" fill="#000000" />
        <!-- Center Patterns -->
        <rect x="42" y="12" width="6" height="6" fill="#000000" />
        <rect x="52" y="12" width="6" height="6" fill="#000000" />
        <rect x="42" y="24" width="6" height="6" fill="#000000" />
        <rect x="42" y="42" width="16" height="16" fill="#000000" />
        <rect x="46" y="46" width="8" height="8" fill="#ffffff" />
        <rect x="12" y="42" width="6" height="6" fill="#000000" />
        <rect x="24" y="42" width="6" height="6" fill="#000000" />
        <rect x="65" y="42" width="6" height="6" fill="#000000" />
        <rect x="80" y="42" width="6" height="6" fill="#000000" />
        <rect x="42" y="65" width="6" height="6" fill="#000000" />
        <rect x="52" y="75" width="6" height="6" fill="#000000" />
        <rect x="70" y="65" width="15" height="15" fill="#000000" />
        <rect x="75" y="70" width="5" height="5" fill="#ffffff" />
      </svg>
      <div style="font-size: 10px; font-family: monospace; font-weight: bold; margin-top: 2px;">${escapeHtml(receipt.receiptNumber)}</div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Chek: ${receipt.receiptNumber}</title>
        <style>
          @page {
            size: portrait;
            margin: 0mm;
          }
          @media print {
            @page {
              size: portrait;
              margin: 0mm;
            }
            html, body {
              width: ${is58 ? '48mm' : '72mm'} !important;
              max-width: ${is58 ? '48mm' : '72mm'} !important;
              min-width: ${is58 ? '48mm' : '72mm'} !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
            }
          }
          * {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            width: ${is58 ? '48mm' : '72mm'} !important;
            max-width: ${is58 ? '48mm' : '72mm'} !important;
            min-width: ${is58 ? '48mm' : '72mm'} !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", Courier, monospace;
            font-size: ${fontSize};
            line-height: 1.25;
          }
          .receipt-box {
            width: 100% !important;
            padding: 1mm 1.5mm;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <!-- Store Header -->
          <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
            <div style="font-weight: 900; font-size: ${titleSize}; letter-spacing: 0.5px;">SMART CONTROL</div>
            <div style="font-weight: bold; font-size: ${subTitleSize}; text-transform: uppercase;">Xavfsizlik & Tarmoq Tizimlari</div>
            <div style="font-size: ${smallSize};">Kameralar · Domofon · Tarmoq · Montaj</div>
            <div style="font-size: ${smallSize}; font-weight: bold; margin-top: 2px;">${escapeHtml(receipt.branchName || branchName)}</div>
            <div style="font-size: ${smallSize}; font-family: monospace;">Tel: ${escapeHtml(storePhone)}</div>
            ${statusStamp}
          </div>

          <!-- Metadata -->
          <div style="border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; font-size: ${smallSize};">
            <div style="display:flex; justify-content:space-between;">
              <span>Chek raqami:</span>
              <span style="font-weight:900;">${escapeHtml(receipt.receiptNumber)}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Sana / Vaqt:</span>
              <span>${escapeHtml(receipt.createdAt)}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Kassir / Mas'ul:</span>
              <span>${escapeHtml(receipt.cashierName)}</span>
            </div>
            ${receipt.customer ? `
              <div style="display:flex; justify-content:space-between; font-weight:900; border-top:1px dotted #999; margin-top:3px; padding-top:3px;">
                <span>Mijoz:</span>
                <span>${escapeHtml(receipt.customer.fullName)}</span>
              </div>
            ` : ''}
            ${receipt.installationAddress ? `
              <div style="margin-top:2px; padding-top:2px; border-top:1px dotted #999;">
                <span style="font-weight:bold;">Manzil:</span> ${escapeHtml(receipt.installationAddress)}
              </div>
            ` : ''}
            ${receipt.technicians && receipt.technicians.length > 0 ? `
              <div style="margin-top:2px; padding-top:2px; border-top:1px dotted #999;">
                <span style="font-weight:bold;">Usta:</span> ${escapeHtml(receipt.technicians.map(t => t.fullName).join(', '))}
              </div>
            ` : receipt.technicianName ? `
              <div style="margin-top:2px; padding-top:2px; border-top:1px dotted #999;">
                <span style="font-weight:bold;">Usta:</span> ${escapeHtml(receipt.technicianName)}
              </div>
            ` : ''}
          </div>

          <!-- Items Table -->
          <div style="border-bottom: 2px dashed #000; padding-bottom: 5px; margin-bottom: 5px;">
            <div style="display:flex; justify-content:space-between; font-weight:900; font-size:${smallSize}; border-bottom:1px solid #000; padding-bottom:3px; margin-bottom:4px; text-transform:uppercase;">
              <span>Tovar / Xizmat</span>
              <span>Summa</span>
            </div>
            ${itemsRows}
          </div>

          ${returnedBox}

          <!-- Totals -->
          <div style="border-bottom: 2px dashed #000; padding-bottom: 5px; margin-bottom: 5px; font-size: ${smallSize};">
            <div style="display:flex; justify-content:space-between;">
              <span>Oraliq jami:</span>
              <span>${formatNumberWithSpaces(receipt.subtotal)} so'm</span>
            </div>
            ${receipt.discountTotal > 0 ? `
              <div style="display:flex; justify-content:space-between; font-weight:bold;">
                <span>Chegirma:</span>
                <span>-${formatNumberWithSpaces(receipt.discountTotal)} so'm</span>
              </div>
            ` : ''}
            ${receipt.payments.cashbackUsed > 0 ? `
              <div style="display:flex; justify-content:space-between; font-weight:bold;">
                <span>Cashback yechildi:</span>
                <span>-${formatNumberWithSpaces(receipt.payments.cashbackUsed)} so'm</span>
              </div>
            ` : ''}
            ${(() => {
              const isPaidInUSD = receipt.payments.currencyPaid === 'USD' || 
                ((receipt.payments.cashUSD || 0) + (receipt.payments.debtUSD || 0) > 0 && (receipt.payments.cash || 0) === 0 && (receipt.payments.card || 0) === 0);
              const usdVal = receipt.totalAmountUSD || (receipt.exchangeRate ? Number((receipt.totalAmount / receipt.exchangeRate).toFixed(2)) : 0);

              if (isPaidInUSD) {
                return `
                  <div style="display:flex; justify-content:space-between; font-weight:900; font-size:${titleSize}; border-top:1.5px solid #000; padding-top:3px; margin-top:3px;">
                    <span>JAMI TO'LOV:</span>
                    <span>$${formatUSDNumber(usdVal)} USD</span>
                  </div>
                  ${receipt.totalRefunded && receipt.totalRefunded > 0 ? `
                    <div style="display:flex; justify-content:space-between; font-weight:900; border-top:1px dashed #000; padding-top:3px;">
                      <span>SOF SUMMA:</span>
                      <span>$${formatUSDNumber(usdVal - (receipt.exchangeRate ? (receipt.totalRefunded / receipt.exchangeRate) : 0))} USD</span>
                    </div>
                  ` : ''}
                  ${receipt.exchangeRate ? `
                    <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold; margin-top:2px;">
                      <span>So'mda:</span>
                      <span>${formatNumberWithSpaces(receipt.totalAmount)} so'm (1$=${formatNumberWithSpaces(receipt.exchangeRate)})</span>
                    </div>
                  ` : ''}
                `;
              }

              return `
                <div style="display:flex; justify-content:space-between; font-weight:900; font-size:${titleSize}; border-top:1.5px solid #000; padding-top:3px; margin-top:3px;">
                  <span>JAMI TO'LOV:</span>
                  <span>${formatNumberWithSpaces(receipt.totalAmount)} so'm</span>
                </div>
                ${receipt.totalRefunded && receipt.totalRefunded > 0 ? `
                  <div style="display:flex; justify-content:space-between; font-weight:900; border-top:1px dashed #000; padding-top:3px;">
                    <span>SOF SUMMA:</span>
                    <span>${formatNumberWithSpaces(netTotal)} so'm</span>
                  </div>
                ` : ''}
                ${receipt.exchangeRate ? `
                  <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold; margin-top:2px;">
                    <span>Valyutada ($ USD):</span>
                    <span>$${formatUSDNumber(usdVal)} (1$=${formatNumberWithSpaces(receipt.exchangeRate)})</span>
                  </div>
                ` : ''}
              `;
            })()}
          </div>

          ${paymentsHtml}

          ${receipt.notes ? `
            <div style="border: 1px dotted #999; padding: 4px; margin: 5px 0; font-size: 10px;">
              <strong>Izoh:</strong> ${escapeHtml(receipt.notes)}
            </div>
          ` : ''}

          ${warrantyHtml}
          ${cashbackHtml}

          <!-- Footer & QR -->
          <div style="text-align: center; margin-top: 6px; font-size: ${smallSize};">
            ${qrSvg}
            <div style="letter-spacing: 4px; font-weight: 900; font-family: monospace; font-size: 13px; margin: 4px 0;">||| | |||| || ||| ||||</div>
            <div style="font-weight: 900; margin: 4px 0; font-size: ${subTitleSize};">${escapeHtml(customFooter)}</div>
            <div style="font-size: 9px; color: #333;">Smart Control Security Systems</div>
            <div style="font-size: 8.5px; color: #555;">${receipt.isOffline ? '[Oflayn chek]' : '✓ Tizimda tasdiqlangan'}</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function escapeHtml(text: string = ''): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Robust, 100% isolated printing using a hidden <iframe> or popup.
 * This guarantees the current screen (dashboards, modals, background cards) NEVER leaks into the print job!
 */
export function printThermalReceiptViaIframe(
  receipt: SaleReceipt,
  options: ThermalPrintOptions = { width: '58' }
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const html = generateThermalReceiptHtml(receipt, options);
      printRawHtmlInIframe(html).then(resolve).catch(() => resolve(false));
    } catch (err) {
      console.error('Error generating receipt print frame:', err);
      resolve(false);
    }
  });
}

/**
 * Opens a dedicated small popup window to print the receipt cleanly if iframe has driver quirks
 */
export function printThermalReceiptViaPopup(
  receipt: SaleReceipt,
  options: ThermalPrintOptions = { width: '58' }
): boolean {
  try {
    const html = generateThermalReceiptHtml(receipt, options);
    const popup = window.open('', '_blank', 'width=380,height=600,left=200,top=200');
    if (!popup) {
      return false;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    setTimeout(() => {
      popup.focus();
      popup.print();
      setTimeout(() => {
        popup.close();
      }, 1000);
    }, 250);
    return true;
  } catch (e) {
    console.error('Popup print error:', e);
    return false;
  }
}

/**
 * Generic isolated HTML printer for any document (Z-Report, Warranty ticket, Smeta, QR Passport, Invoice)
 */
export function printRawHtmlInIframe(htmlContent: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Remove any existing print frame
      const oldFrame = document.getElementById('sc-silent-print-frame');
      if (oldFrame) {
        oldFrame.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'sc-silent-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '380px';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Cannot access iframe document');
      }

      doc.open();
      doc.write(htmlContent);
      doc.close();

      const triggerPrint = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              iframe.remove();
            }
            resolve(true);
          }, 1500);
        } catch (e) {
          console.error('Failed to trigger iframe print:', e);
          resolve(false);
        }
      };

      iframe.onload = () => {
        setTimeout(triggerPrint, 250);
      };

      // Fallback timeout
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          triggerPrint();
        }
      }, 500);

    } catch (err) {
      console.error('Iframe print error:', err);
      window.print();
      resolve(true);
    }
  });
}

/**
 * Transliterates Cyrillic/Uzbek characters to Latin ASCII for reliable ESC/POS thermal printing
 * (Prevents Chinese character gibberish on unconfigured thermal printer firmware).
 */
export function transliterateForEscPos(text: string): string {
  const map: Record<string, string> = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'J', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'X', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sh', 'Ъ': '',
    'Ы': 'I', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': '',
    'ы': 'i', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'ў': "o'", 'Ў': "O'", 'ғ': "g'", 'Ғ': "G'", 'ҳ': 'h', 'Ҳ': 'H', 'қ': 'q', 'Қ': 'Q'
  };
  return text.split('').map(char => map[char] || char).join('');
}

/**
 * Generates raw ESC/POS binary byte array for standard thermal receipt printers
 */
export function generateEscPosReceiptBytes(
  receipt: SaleReceipt,
  width: '58' | '80' = '58',
  customFooter = "Xaridingiz uchun tashakkur!"
): Uint8Array {
  const maxCols = width === '58' ? 32 : 48;
  const bytes: number[] = [];

  // Helper push strings
  const pushText = (txt: string) => {
    const clean = transliterateForEscPos(txt);
    for (let i = 0; i < clean.length; i++) {
      bytes.push(clean.charCodeAt(i) & 0xFF);
    }
  };

  const pushLine = (txt: string = '') => {
    pushText(txt);
    bytes.push(0x0A); // Line feed (LF)
  };

  const pushDivider = (char = '-') => {
    pushLine(char.repeat(maxCols));
  };

  const padRow = (left: string, right: string) => {
    const cleanL = transliterateForEscPos(left);
    const cleanR = transliterateForEscPos(right);
    const spacesNeeded = Math.max(1, maxCols - cleanL.length - cleanR.length);
    pushLine(cleanL + ' '.repeat(spacesNeeded) + cleanR);
  };

  // 1. Initialize Printer (ESC @)
  bytes.push(0x1B, 0x40);

  // 2. Center Align (ESC a 1)
  bytes.push(0x1B, 0x61, 0x01);

  // Double Height & Bold for Title
  bytes.push(0x1B, 0x21, 0x20); // Double height
  pushLine('SMART CONTROL');
  bytes.push(0x1B, 0x21, 0x00); // Normal font

  pushLine('Xavfsizlik & Tarmoq Tizimlari');
  pushLine('Kameralar * Domofon * Montaj');
  pushLine(receipt.branchName || 'Asosiy Filial');
  pushLine('Tel: +998 90 123-45-67');

  if (receipt.status === 'returned') {
    pushLine('[ BEKOR QILINDI / VOZVRAT ]');
  } else if (receipt.status === 'partially_returned') {
    pushLine('[ QISMAN QAYTARILGAN ]');
  }

  // 3. Left Align (ESC a 0)
  bytes.push(0x1B, 0x61, 0x00);
  pushDivider('=');

  padRow('Chek raqami:', receipt.receiptNumber);
  padRow('Sana / Vaqt:', receipt.createdAt);
  padRow("Kassir / Mas'ul:", receipt.cashierName);
  if (receipt.customer) {
    padRow('Mijoz:', receipt.customer.fullName);
  }
  if (receipt.installationAddress) {
    pushLine('Manzil: ' + receipt.installationAddress);
  }
  if (receipt.technicians && receipt.technicians.length > 0) {
    pushLine('Usta: ' + receipt.technicians.map(t => t.fullName).join(', '));
  } else if (receipt.technicianName) {
    pushLine('Usta: ' + receipt.technicianName);
  }

  pushDivider('-');
  pushLine('TOVAR / XIZMAT' + ' '.repeat(Math.max(1, maxCols - 19)) + 'SUMMA');
  pushDivider('-');

  // Items
  receipt.items.forEach((it, idx) => {
    pushLine(`${idx + 1}. ${it.product.name}`);
    if (it.selectedSerialNumbers && it.selectedSerialNumbers.length > 0) {
      pushLine(`  S/N: ${it.selectedSerialNumbers.join(', ')}`);
    }
    const qtyPrice = `${it.quantity} ${it.product.unit} x ${formatNumberWithSpaces(it.appliedPrice)}`;
    const total = formatNumberWithSpaces(it.quantity * it.appliedPrice);
    padRow('  ' + qtyPrice, total);
  });

  pushDivider('-');

  // Totals
  padRow('Oraliq jami:', `${formatNumberWithSpaces(receipt.subtotal)} so'm`);
  if (receipt.discountTotal > 0) {
    padRow('Chegirma:', `-${formatNumberWithSpaces(receipt.discountTotal)} so'm`);
  }
  if (receipt.payments.cashbackUsed > 0) {
    padRow('Cashback yechildi:', `-${formatNumberWithSpaces(receipt.payments.cashbackUsed)} so'm`);
  }

  // Bold Big Total
  bytes.push(0x1B, 0x45, 0x01); // Bold on
  padRow("JAMI TO'LOV:", `${formatNumberWithSpaces(receipt.totalAmount)} so'm`);
  bytes.push(0x1B, 0x45, 0x00); // Bold off

  if (receipt.exchangeRate) {
    padRow('USD ($):', `$${formatUSDNumber(receipt.totalAmountUSD || receipt.totalAmount / receipt.exchangeRate)} (1$=${formatNumberWithSpaces(receipt.exchangeRate)})`);
  }

  pushDivider('-');

  // Payments
  if (receipt.payments.cashUSD && receipt.payments.cashUSD > 0) {
    padRow('Naqd USD ($):', `$${formatUSDNumber(receipt.payments.cashUSD)}`);
  }
  if (receipt.payments.cash > 0) {
    padRow("Naqd So'm:", `${formatNumberWithSpaces(receipt.payments.cash)} so'm`);
  }
  if (receipt.payments.card > 0) {
    padRow('Karta:', `${formatNumberWithSpaces(receipt.payments.card)} so'm`);
  }
  if (receipt.payments.debt > 0) {
    padRow('Nasiya / Qarz:', `${formatNumberWithSpaces(receipt.payments.debt)} so'm`);
  }

  // Warranty
  if (receipt.warrantyMonths && receipt.warrantyMonths > 0) {
    pushDivider('-');
    bytes.push(0x1B, 0x61, 0x01); // Center
    pushLine(`*** KAFOLAT: ${receipt.warrantyMonths} OY ***`);
    pushLine('S/N raqami va chek orqali servis');
    bytes.push(0x1B, 0x61, 0x00); // Left
  }

  // Footer
  pushDivider('=');
  bytes.push(0x1B, 0x61, 0x01); // Center
  pushLine(customFooter);
  pushLine('Smart Control Security Systems');
  pushLine(receipt.isOffline ? '[Oflayn chek]' : '[Tasdiqlangan]');
  pushLine('');
  pushLine('');
  pushLine('');

  // Paper Cut (GS V 66 0)
  bytes.push(0x1D, 0x56, 0x42, 0x00);

  return new Uint8Array(bytes);
}

/**
 * Direct Silent Printing via Local POS Agent on Windows (http://127.0.0.1:12111)
 * Sends raw ESC/POS directly to Windows Print Spooler (XP-58C).
 * 0.05s instant execution with ZERO browser dialogs!
 */
export async function printReceiptViaLocalAgent(
  receipt: SaleReceipt,
  width: '58' | '80' = '58',
  customFooter?: string,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; message: string }> {
  try {
    onStatusUpdate?.("Mahalliy printerga yuborilmoqda...");
    const escPosBytes = generateEscPosReceiptBytes(receipt, width, customFooter);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('http://127.0.0.1:12111/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        printer: 'AUTO',
        bytes: Array.from(escPosBytes)
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: data.message || "Chek to'g'ridan-to'g'ri chop etildi!"
      };
    } else {
      return {
        success: false,
        message: "Mahalliy print agent xatolik berdi"
      };
    }
  } catch {
    return {
      success: false,
      message: "Mahalliy agent ishlamayapti"
    };
  }
}

/**
 * Super Fast Direct Print:
 * 1. Tries Local Agent first (instant silent Windows spooler print, zero dialogs)
 * 2. Falls back to WebUSB
 */
export async function printReceiptFastDirect(
  receipt: SaleReceipt,
  width: '58' | '80' = '58',
  customFooter?: string,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; message: string; method?: 'agent' | 'usb' | 'dialog' }> {
  // 1. Try local POS agent (Windows Spooler RAW)
  const agentRes = await printReceiptViaLocalAgent(receipt, width, customFooter, onStatusUpdate);
  if (agentRes.success) {
    return { ...agentRes, method: 'agent' };
  }

  // 2. Try WebUSB
  const usbRes = await printReceiptViaWebUSB(receipt, width, customFooter, onStatusUpdate);
  if (usbRes.success) {
    return { ...usbRes, method: 'usb' };
  }

  return {
    success: false,
    message: usbRes.message,
    method: 'dialog'
  };
}

/**
 * Direct Web Bluetooth API printing for portable / mobile thermal printers (Xprinter XP-58IIT, Goojprt, POS-58, etc.)
 * Connects directly via Bluetooth GATT Serial Service and transmits raw ESC/POS bytes without OS print dialog.
 */
export async function printReceiptViaBluetooth(
  receipt: SaleReceipt,
  width: '58' | '80' = '58',
  customFooter?: string,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; message: string; deviceName?: string }> {
  if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
    return {
      success: false,
      message: "Brauzeringiz Bluetooth to'g'ridan-to'g'ri chop etishni qo'llab-quvvatlamaydi (Chrome yoki Edge brauzeridan foydalaning)."
    };
  }

  try {
    onStatusUpdate?.("Bluetooth printer qidirilmoqda...");

    // Standard Thermal Printer Bluetooth Services & Serial SPP
    const navBluetooth = (navigator as any).bluetooth;
    const device = await navBluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Service
        '0000ffe0-0000-1000-8000-00805f9b34fb', // Common BLE Serial (Goojprt, Xprinter)
        '0000ff00-0000-1000-8000-00805f9b34fb', // Custom ESC/POS
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'
      ]
    });

    onStatusUpdate?.(`${device.name || 'Printer'}ga ulanmoqda...`);

    const server = await device.gatt?.connect();
    if (!server) {
      throw new Error("Printer GATT serveriga ulanib bo'lmadi.");
    }

    onStatusUpdate?.("Xizmatlar aniqlanmoqda...");

    const services = await server.getPrimaryServices();
    let writeCharacteristic: any = null;

    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          writeCharacteristic = char;
          break;
        }
      }
      if (writeCharacteristic) break;
    }

    if (!writeCharacteristic) {
      throw new Error("Printerda ma'lumot yozish kanali (Write Characteristic) topilmadi.");
    }

    onStatusUpdate?.("Chek chop etilmoqda...");

    const escPosData = generateEscPosReceiptBytes(receipt, width, customFooter);

    // Send in chunks of 512 bytes with small delay
    const chunkSize = 512;
    for (let i = 0; i < escPosData.length; i += chunkSize) {
      const chunk = escPosData.slice(i, i + chunkSize);
      if (writeCharacteristic.writeValueWithResponse) {
        await writeCharacteristic.writeValueWithResponse(chunk);
      } else {
        await writeCharacteristic.writeValue(chunk);
      }
      await new Promise(r => setTimeout(r, 40));
    }

    onStatusUpdate?.("Chop etish muvaffaqiyatli yakunlandi!");

    // Disconnect cleanly
    setTimeout(() => {
      try {
        device.gatt?.disconnect();
      } catch {
        // ignore
      }
    }, 1000);

    return {
      success: true,
      message: "Chek Bluetooth orqali muvaffaqiyatli chop etildi!",
      deviceName: device.name || 'Bluetooth Printer'
    };

  } catch (error: any) {
    console.error("Bluetooth print error:", error);
    if (error.name === 'NotFoundError') {
      return { success: false, message: "Printer tanlanmadi yoki bekor qilindi." };
    }
    return {
      success: false,
      message: error.message || "Bluetooth printerga ulanishda xatolik yuz berdi."
    };
  }
}

/**
 * Direct WebUSB API printing for USB POS Printers (Xprinter XP-58 / XP-80, Epson, etc.)
 * Bypasses Windows print spooler and Chrome print dialog entirely.
 */
export async function printReceiptViaWebUSB(
  receipt: SaleReceipt,
  width: '58' | '80' = '58',
  customFooter?: string,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; message: string; deviceName?: string }> {
  if (typeof navigator === 'undefined' || !(navigator as any).usb) {
    return {
      success: false,
      message: "Brauzeringiz WebUSB to'g'ridan-to'g'ri chop etishni qo'llab-quvvatlamaydi (Google Chrome yoki Microsoft Edge ishlating)."
    };
  }

  try {
    const navUsb = (navigator as any).usb;
    
    // 1. Try previously paired USB devices first for instant 1-click zero-popup print
    const pairedDevices = await navUsb.getDevices();
    let device = pairedDevices.length > 0 ? pairedDevices[0] : null;

    if (!device) {
      onStatusUpdate?.("USB printer tanlanmoqda...");
      device = await navUsb.requestDevice({
        filters: []
      });
    }

    if (!device) {
      return { success: false, message: "Printer topilmadi." };
    }

    onStatusUpdate?.(`${device.productName || 'USB Printer'} ochilmoqda...`);
    if (!device.opened) {
      await device.open();
    }

    // Select configuration 1 if needed
    if (device.configuration === null) {
      try {
        await device.selectConfiguration(1);
      } catch {
        // ignore
      }
    }

    // Find printer interface (Interface class 7 is printer) or first available OUT endpoint
    let interfaceNumber = 0;
    let endpointNumber = 1;

    const configuration = device.configuration;
    if (configuration && configuration.interfaces) {
      for (const iface of configuration.interfaces) {
        for (const alt of iface.alternates) {
          const outEndpoint = alt.endpoints.find((ep: any) => ep.direction === 'out');
          if (outEndpoint) {
            interfaceNumber = iface.interfaceNumber;
            endpointNumber = outEndpoint.endpointNumber;
            break;
          }
        }
      }
    }

    try {
      await device.claimInterface(interfaceNumber);
    } catch {
      // interface may already be claimed
    }

    onStatusUpdate?.("Chek USB orqali chop etilmoqda...");

    const escPosData = generateEscPosReceiptBytes(receipt, width, customFooter);
    await device.transferOut(endpointNumber, escPosData);

    onStatusUpdate?.("Muvaffaqiyatli chop etildi!");
    
    // Release and close cleanly
    setTimeout(async () => {
      try {
        await device.releaseInterface(interfaceNumber);
        await device.close();
      } catch {
        // ignore
      }
    }, 500);

    return {
      success: true,
      message: "Chek to'g'ridan-to'g'ri chop etildi!",
      deviceName: device.productName || 'USB Printer'
    };

  } catch (error: any) {
    console.error("WebUSB print error:", error);
    if (error.name === 'NotFoundError') {
      return { success: false, message: "USB printer tanlanmadi yoki bekor qilindi." };
    }
    if (error.message?.includes('Access denied') || error.name === 'SecurityError') {
      return {
        success: false,
        message: "Windows tizimining 'XP-58C' drayveri USB portni band qilgan. Chek darcha orqali chiqarilmoqda..."
      };
    }
    return {
      success: false,
      message: error.message || "USB printerga ulanishda xatolik yuz berdi."
    };
  }
}

/**
 * Direct WebSerial API printing for COM/Serial/Virtual USB POS Printers
 */
export async function printReceiptViaWebSerial(
  receipt: SaleReceipt,
  width: '58' | '80' = '58',
  customFooter?: string,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; message: string }> {
  if (typeof navigator === 'undefined' || !(navigator as any).serial) {
    return {
      success: false,
      message: "Brauzeringiz Web Serial to'g'ridan-to'g'ri ulanishni qo'llab-quvvatlamaydi."
    };
  }

  try {
    onStatusUpdate?.("Serial / COM port tanlanmoqda...");
    const navSerial = (navigator as any).serial;
    const port = await navSerial.requestPort();
    
    await port.open({ baudRate: 9600 });
    onStatusUpdate?.("Chek yuborilmoqda...");

    const writer = port.writable.getWriter();
    const escPosData = generateEscPosReceiptBytes(receipt, width, customFooter);
    await writer.write(escPosData);
    writer.releaseLock();
    await port.close();

    return {
      success: true,
      message: "Chek Serial/COM port orqali chop etildi!"
    };
  } catch (error: any) {
    console.error("WebSerial print error:", error);
    if (error.name === 'NotFoundError') {
      return { success: false, message: "Port tanlanmadi." };
    }
    return {
      success: false,
      message: error.message || "Serial portga ulanishda xatolik yuz berdi."
    };
  }
}
