'use client';

import React, { useState, useEffect } from 'react';
import { SaleReceipt } from '../types';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  MapPin, 
  HardHat, 
  RotateCcw, 
  Edit3, 
  CheckCircle2, 
  QrCode, 
  SlidersHorizontal, 
  Smartphone, 
  PhoneCall, 
  CheckCheck, 
  Copy,
  Bluetooth,
  Usb,
  Loader2,
  Settings2,
  AlertCircle
} from 'lucide-react';
import { formatNumberWithSpaces, formatUSDNumber } from '../utils/formatters';
import { 
  printThermalReceiptViaIframe, 
  printReceiptViaBluetooth, 
  printReceiptFastDirect,
  printReceiptViaWebUSB,
  printReceiptViaWebSerial,
  printThermalReceiptViaPopup 
} from '../utils/thermalPrinter';

interface ReceiptModalProps {
  receipt: SaleReceipt | null;
  onClose: () => void;
  onOpenReturn?: (receipt: SaleReceipt) => void;
  onOpenEdit?: (receipt: SaleReceipt) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receipt,
  onClose,
  onOpenReturn,
  onOpenEdit
}) => {
  const [paperWidth, setPaperWidth] = useState<'58' | '80'>('58');
  const [showSettings, setShowSettings] = useState(false);
  const [showQR, setShowQR] = useState(true);
  const [customFooter, setCustomFooter] = useState("Xaridingiz uchun tashakkur! Barakali bo'lsin!");
  const [isCopied, setIsCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [btStatus, setBtStatus] = useState<string | null>(null);
  const [btError, setBtError] = useState<string | null>(null);
  const [usbStatus, setUsbStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem('sc_receipt_width');
      if (savedWidth === '58' || savedWidth === '80') {
        setPaperWidth(savedWidth);
      }
      const savedFooter = localStorage.getItem('sc_receipt_footer');
      if (savedFooter) {
        setCustomFooter(savedFooter);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ESC key listener to quickly close receipt modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!receipt) return null;

  const handleWidthChange = (w: '58' | '80') => {
    setPaperWidth(w);
    try {
      localStorage.setItem('sc_receipt_width', w);
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Isolated Thermal Print (Zero background bleed, clean 58mm/80mm roll)
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printThermalReceiptViaIframe(receipt, {
        width: paperWidth,
        customFooter,
        showQR,
        branchName: receipt.branchName || 'Asosiy Filial',
        storePhone: '+998 90 123-45-67'
      });
    } catch (err) {
      console.error('Print error:', err);
      printThermalReceiptViaPopup(receipt, {
        width: paperWidth,
        customFooter,
        showQR,
        branchName: receipt.branchName || 'Asosiy Filial',
        storePhone: '+998 90 123-45-67'
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // 1b. Direct Popup Print (Alternative for stubborn drivers)
  const handlePopupPrint = () => {
    printThermalReceiptViaPopup(receipt, {
      width: paperWidth,
      customFooter,
      showQR,
      branchName: receipt.branchName || 'Asosiy Filial',
      storePhone: '+998 90 123-45-67'
    });
  };

  // 2. Direct Web Bluetooth ESC/POS Print (For mobile / portable Bluetooth thermal printers)
  const handleBluetoothPrint = async () => {
    setBtStatus('Ulanmoqda...');
    setBtError(null);
    try {
      const res = await printReceiptViaBluetooth(
        receipt,
        paperWidth,
        customFooter,
        (status) => setBtStatus(status)
      );
      if (!res.success) {
        setBtError(res.message);
        setTimeout(() => setBtError(null), 6000);
      } else {
        setBtStatus(res.message);
        setTimeout(() => setBtStatus(null), 4000);
      }
    } catch (e: any) {
      setBtError(e.message || "Bluetooth printerga ulanib bo'lmadi.");
      setTimeout(() => setBtError(null), 6000);
    }
  };

  // 3. Super Fast Direct Print (Local Spooler Agent -> WebUSB -> Fallback)
  const handleUsbPrint = async () => {
    setUsbStatus('Printerga yuborilmoqda...');
    setBtError(null);
    try {
      const res = await printReceiptFastDirect(
        receipt,
        paperWidth,
        customFooter,
        (status) => setUsbStatus(status)
      );
      if (!res.success) {
        setBtError(res.message);
        setTimeout(() => setBtError(null), 8000);
        // Fallback to driver dialog if all direct methods fail
        setTimeout(() => {
          handlePrint();
        }, 1000);
      } else {
        setUsbStatus(res.message);
        setTimeout(() => setUsbStatus(null), 4000);
      }
    } catch (e: any) {
      setBtError(e.message || "Printerga ulanib bo'lmadi.");
      setTimeout(() => setBtError(null), 7000);
      handlePrint();
    } finally {
      setTimeout(() => setUsbStatus(null), 5000);
    }
  };

  const netTotal = receipt.totalAmount - (receipt.totalRefunded || 0);

  const copyReceiptSummary = () => {
    const summary = `🧾 SMART CONTROL Chek: ${receipt.receiptNumber}
📅 Sana: ${receipt.createdAt}
🏢 Filial: ${receipt.branchName}
💵 Jami: ${formatNumberWithSpaces(receipt.totalAmount)} so'm
${receipt.customer ? `👤 Mijoz: ${receipt.customer.fullName} (${receipt.customer.phone})` : ''}
${receipt.warrantyMonths ? `🛡️ Kafolat: ${receipt.warrantyMonths} oy` : ''}
Rahmat!`;

    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-auto">
        {/* Modal Top Actions (Hidden when printing) */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              receipt.status === 'returned'
                ? 'bg-rose-500'
                : receipt.status === 'partially_returned'
                ? 'bg-amber-500'
                : receipt.status === 'edited'
                ? 'bg-blue-500'
                : 'bg-emerald-500'
            }`} />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Chek: {receipt.receiptNumber}
            </span>
          </div>

          {/* Width & Print Actions */}
          <div className="flex items-center gap-2">
            {/* Width Toggle 58mm / 80mm */}
            <div className="flex items-center bg-slate-200 dark:bg-slate-700 p-0.5 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => handleWidthChange('58')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  paperWidth === '58'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="58mm termal printerlar (Xprinter XP-58, Goojprt, Zjiang)"
              >
                58 mm (Standart)
              </button>
              <button
                type="button"
                onClick={() => handleWidthChange('80')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  paperWidth === '80'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="80mm keng termal printerlar (XP-80, Epson, Sam4s)"
              >
                80 mm
              </button>
            </div>

            {/* Main Primary Direct Print Button */}
            <button
              type="button"
              onClick={handleUsbPrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95"
              title="Ikkinchi darchaga o'tmasdan to'g'ridan-to'g'ri printerga yuborish"
            >
              <Usb className="w-3.5 h-3.5" />
              <span>To&apos;g&apos;ridan-to&apos;g&apos;ri Chop Etish</span>
            </button>

            {/* Bluetooth Direct Print */}
            <button
              type="button"
              onClick={handleBluetoothPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs shadow-sm transition"
              title="Bluetooth portativ printer orqali to'g'ridan-to'g'ri chiqarish (Usta / Mobil)"
            >
              <Bluetooth className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Bluetooth</span>
            </button>

            {/* Standard Driver Dialog (Fallback) */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              title="Standart brauzer darchasini ochish (Drayver orqali)"
            >
              {isPrinting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Brauzer darchasi</span>
            </button>

            {/* Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg border transition ${
                showSettings 
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 border-amber-300' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title="Printer va chek sozlamalari"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* USB Status or Toast */}
        {usbStatus && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 flex items-center gap-2 animate-in fade-in duration-150">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="font-semibold">{usbStatus}</span>
          </div>
        )}

        {/* Bluetooth Status or Error Toast */}
        {btStatus && (
          <div className="bg-blue-600 text-white text-xs px-4 py-2 flex items-center gap-2 animate-in fade-in duration-150">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="font-semibold">{btStatus}</span>
          </div>
        )}
        {btError && (
          <div className="bg-rose-600 text-white text-xs px-4 py-2 flex items-center justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{btError}</span>
            </div>
            <button onClick={() => setBtError(null)} className="text-white/80 hover:text-white text-xs underline">
              Yopish
            </button>
          </div>
        )}

        {/* Settings Bar if toggled */}
        {showSettings && (
          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 text-xs space-y-2.5 print:hidden animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-amber-600" />
                <span>Termal Printer Sozlamalari (58mm / 80mm)</span>
              </div>
              <div className="text-[11px] text-amber-800 dark:text-amber-400">
                Xprinter XP-58IIT, XP-58C, XP-80, Bluetooth & USB moslashtirilgan
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-amber-200 dark:border-amber-800/60">
                <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-amber-600" />
                  <span>QR-kod ko&apos;rsatilsinmi:</span>
                </label>
                <input
                  type="checkbox"
                  checked={showQR}
                  onChange={(e) => setShowQR(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-amber-200 dark:border-amber-800/60">
                <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Usb className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ulanish turlari:</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  USB / Bluetooth / LAN
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-amber-950 dark:text-amber-200 mb-1">
                Chek oxiridagi xabar (Footer):
              </label>
              <input
                type="text"
                value={customFooter}
                onChange={(e) => {
                  setCustomFooter(e.target.value);
                  localStorage.setItem('sc_receipt_footer', e.target.value);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                placeholder="Xaridingiz uchun tashakkur!"
              />
            </div>

            {/* Crucial tip for Chrome settings */}
            <div className="bg-amber-100/90 dark:bg-amber-900/40 p-2.5 rounded-xl border border-amber-300 dark:border-amber-800 text-[11px] text-amber-950 dark:text-amber-200 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <span>💡 Chrome darchasida to&apos;g&apos;ri sozlamalar (XP-58 uchun):</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li><strong>Размер бумаги:</strong> <code>58(48) x 210 mm</code> yoki <code>58 x 210 mm</code> tanlang (3276 mm emas).</li>
                <li><strong>Поля (Margins):</strong> <code>Нет</code> (Bo&apos;sh joylarsiz) qiling.</li>
                <li><strong>Ориентация:</strong> <code>Вертикальная</code> (Portret).</li>
                <li><strong>Yoki:</strong> To&apos;g&apos;ridan-to&apos;g&apos;ri yuqoridagi <strong>&quot;USB To&apos;g&apos;ridan-to&apos;g&apos;ri&quot;</strong> yoki <strong>&quot;Bluetooth&quot;</strong> tugmasini bosing — darchasiz tezkor chiqaradi!</li>
              </ul>
            </div>
          </div>
        )}

        {/* Thermal Receipt Paper Style */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div 
            className={`printable-receipt bg-white text-black p-4 sm:p-5 rounded-sm shadow-md border border-slate-300 print:border-none print:shadow-none font-mono text-[11px] leading-tight print:text-[10px] print:m-0 ${
              paperWidth === '58' ? 'w-[260px] max-w-[260px]' : 'w-[360px] max-w-[360px]'
            }`}
          >
            {/* Store Brand Banner */}
            <div className="text-center border-b border-dashed border-black pb-2 mb-2">
              <h2 className="font-black text-sm sm:text-base tracking-wider text-black">
                SMART CONTROL
              </h2>
              <p className="text-[10px] font-bold text-black uppercase tracking-wide">
                Xavfsizlik & Tarmoq Tizimlari
              </p>
              <p className="text-[9px] text-black">
                Kameralar · Domofon · Tarmoq · Montaj
              </p>
              <p className="text-[9px] text-black font-semibold mt-0.5">
                {receipt.branchName || 'Asosiy Filial'}
              </p>
              <p className="text-[9px] text-black font-mono">
                Tel: +998 90 123-45-67
              </p>

              {/* Status Stamp if returned or edited */}
              {receipt.status === 'returned' && (
                <div className="mt-1.5 py-0.5 px-1 bg-black text-white font-black text-[9px] uppercase tracking-wider">
                  [ BEKOR QILINDI / VOZVRAT ]
                </div>
              )}
              {receipt.status === 'partially_returned' && (
                <div className="mt-1.5 py-0.5 px-1 bg-black text-white font-black text-[9px] uppercase tracking-wider">
                  [ QISMAN QAYTARILGAN ]
                </div>
              )}
              {receipt.status === 'edited' && (
                <div className="mt-1.5 py-0.5 px-1 border border-black text-black font-bold text-[9px] uppercase tracking-wider">
                  [ TAHRIRLANGAN CHEK ]
                </div>
              )}
            </div>

            {/* Receipt Metadata */}
            <div className="space-y-0.5 text-[10px] border-b border-dashed border-black pb-2 mb-2 text-black">
              <div className="flex justify-between">
                <span>Chek raqami:</span>
                <span className="font-bold">{receipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Sana / Vaqt:</span>
                <span>{receipt.createdAt}</span>
              </div>
              {receipt.updatedAt && (
                <div className="flex justify-between text-[9px] italic">
                  <span>Oxirgi tahrir:</span>
                  <span>{receipt.updatedAt}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Kassir / Mas&apos;ul:</span>
                <span>{receipt.cashierName}</span>
              </div>
              {receipt.customer && (
                <div className="flex justify-between font-bold pt-0.5 border-t border-dotted border-black/40 mt-0.5">
                  <span>Mijoz:</span>
                  <span>{receipt.customer.fullName}</span>
                </div>
              )}
              {receipt.installationAddress && (
                <div className="mt-0.5 pt-0.5 border-t border-dotted border-black/30">
                  <span className="font-bold text-[9px]">Manzil / Obyekt:</span>
                  <div className="text-[9px] pl-2">{receipt.installationAddress}</div>
                </div>
              )}
              {receipt.technicians && receipt.technicians.length > 0 ? (
                <div className="mt-0.5 pt-0.5 border-t border-dotted border-black/30">
                  <span className="font-bold text-[9px]">Mas&apos;ul montajchi:</span>
                  <div className="text-[9px] pl-2">
                    {receipt.technicians.map(t => t.fullName).join(', ')}
                  </div>
                </div>
              ) : receipt.technicianName ? (
                <div className="mt-0.5 pt-0.5 border-t border-dotted border-black/30">
                  <span className="font-bold text-[9px]">Mas&apos;ul usta:</span>
                  <div className="text-[9px] pl-2">{receipt.technicianName}</div>
                </div>
              ) : null}
            </div>

            {/* Items Table */}
            <div className="border-b border-dashed border-black pb-2 mb-2">
              <div className="flex justify-between font-bold text-[10px] border-b border-black pb-0.5 mb-1 uppercase">
                <span>Tovar / Xizmat</span>
                <span>Summa</span>
              </div>
              <div className="space-y-1.5">
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="text-[10px]">
                    <div className="font-bold leading-tight">
                      {idx + 1}. {item.product.name}
                    </div>

                    {/* Serial Numbers (S/N) */}
                    {item.selectedSerialNumbers && item.selectedSerialNumbers.length > 0 && (
                      <div className="text-[9px] font-bold bg-slate-100 print:bg-transparent px-1 py-0.5 my-0.5 border border-black/30">
                        S/N: {item.selectedSerialNumbers.join(', ')}
                      </div>
                    )}

                    <div className="flex justify-between text-[9px]">
                      <span>{item.quantity} {item.product.unit} × {formatNumberWithSpaces(item.appliedPrice)}</span>
                      <span className="font-bold">
                        {formatNumberWithSpaces(item.quantity * item.appliedPrice)}
                      </span>
                    </div>

                    {/* Returned quantity if any */}
                    {item.returnedQuantity && item.returnedQuantity > 0 ? (
                      <div className="text-[8px] font-bold pl-2 italic">
                        [Qaytarildi: {item.returnedQuantity} {item.product.unit}]
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {/* Returned Items Box if any */}
            {receipt.returnedItems && receipt.returnedItems.length > 0 && (
              <div className="border border-dashed border-black p-1.5 mb-2 text-[9px] space-y-0.5">
                <div className="font-bold flex items-center justify-between uppercase">
                  <span>Qaytarilganlar (Vozvrat):</span>
                  <span>-{formatNumberWithSpaces(receipt.totalRefunded || 0)}</span>
                </div>
                {receipt.returnedItems.map((ret, rIdx) => (
                  <div key={rIdx} className="border-t border-dotted border-black/40 pt-0.5 text-[8px]">
                    <div className="flex justify-between">
                      <span>• {ret.productName} ({ret.quantity} ta)</span>
                      <span className="font-bold">-{formatNumberWithSpaces(ret.totalRefund)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals Calculation */}
            <div className="space-y-0.5 text-[10px] border-b border-dashed border-black pb-2 mb-2">
              <div className="flex justify-between">
                <span>Oraliq jami:</span>
                <span>{formatNumberWithSpaces(receipt.subtotal)} so&apos;m</span>
              </div>
              {receipt.discountTotal > 0 && (
                <div className="flex justify-between font-semibold">
                  <span>Chegirma:</span>
                  <span>-{formatNumberWithSpaces(receipt.discountTotal)} so&apos;m</span>
                </div>
              )}
              {receipt.payments.cashbackUsed > 0 && (
                <div className="flex justify-between font-semibold">
                  <span>Cashback yechildi:</span>
                  <span>-{formatNumberWithSpaces(receipt.payments.cashbackUsed)} so&apos;m</span>
                </div>
              )}
              <div className="flex justify-between font-black text-xs sm:text-sm pt-1 border-t border-black">
                <span>JAMI TO&apos;LOV:</span>
                <span>{formatNumberWithSpaces(receipt.totalAmount)} so&apos;m</span>
              </div>
              {receipt.totalRefunded && receipt.totalRefunded > 0 ? (
                <div className="flex justify-between font-black text-xs pt-0.5 border-t border-dashed border-black">
                  <span>SOF SUMMA:</span>
                  <span>{formatNumberWithSpaces(netTotal)} so&apos;m</span>
                </div>
              ) : null}
              {receipt.exchangeRate && (
                <div className="flex justify-between text-[9px] font-bold pt-0.5">
                  <span>Valyutada ($ USD):</span>
                  <span>
                    ${formatUSDNumber(receipt.totalAmountUSD || Number((receipt.totalAmount / receipt.exchangeRate)))}
                    <small className="font-normal ml-1">
                      (1$ = {formatNumberWithSpaces(receipt.exchangeRate)})
                    </small>
                  </span>
                </div>
              )}
            </div>

            {/* Payment Details Breakdown */}
            <div className="space-y-0.5 text-[9px] border-b border-dashed border-black pb-2 mb-2">
              {receipt.payments.cashUSD && receipt.payments.cashUSD > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Naqd Dollar ($ USD):</span>
                  <span>${formatUSDNumber(receipt.payments.cashUSD)}</span>
                </div>
              )}
              {receipt.payments.cash > 0 && (
                <div className="flex justify-between">
                  <span>Naqd So&apos;m:</span>
                  <span>{formatNumberWithSpaces(receipt.payments.cash)} so&apos;m</span>
                </div>
              )}
              {receipt.payments.card > 0 && (
                <div className="flex justify-between">
                  <span>Karta:</span>
                  <span>{formatNumberWithSpaces(receipt.payments.card)} so&apos;m</span>
                </div>
              )}
              {receipt.payments.debt > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Nasiya / Qarz:</span>
                  <span>{formatNumberWithSpaces(receipt.payments.debt)} so&apos;m</span>
                </div>
              )}
            </div>

            {/* Notes if any */}
            {receipt.notes && (
              <div className="text-[9px] border border-dotted border-black/40 p-1 mb-2">
                <strong>Izoh:</strong> {receipt.notes}
              </div>
            )}

            {/* Warranty Certificate (Kafolat Taloni) */}
            {receipt.warrantyMonths && receipt.warrantyMonths > 0 ? (
              <div className="border border-black p-1.5 mb-2 text-[9px] space-y-0.5">
                <div className="flex items-center justify-between font-black uppercase">
                  <span>KAFOLAT TALONI:</span>
                  <span>{receipt.warrantyMonths} OY</span>
                </div>
                <p className="text-[8px] leading-tight">
                  Kafolat uskuna S/N seriya raqami va ushbu chek orqali servis markazida amal qiladi. Plomba butunligi shart.
                </p>
              </div>
            ) : null}

            {/* Cashback Balance section */}
            {receipt.customer && (
              <div className="border border-dotted border-black/60 p-1 mb-2 text-[9px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>Cashback qo&apos;shildi:</span>
                  <span>+{receipt.cashbackEarned.toLocaleString()} so&apos;m</span>
                </div>
                <div className="flex justify-between">
                  <span>Jami Cashback balansingiz:</span>
                  <span className="font-bold">
                    {(receipt.customer.cashbackBalance - receipt.payments.cashbackUsed + receipt.cashbackEarned).toLocaleString()} so&apos;m
                  </span>
                </div>
              </div>
            )}

            {/* QR Code Simulation & Footer */}
            <div className="text-center pt-1 text-[9px] space-y-1">
              {showQR && (
                <div className="flex flex-col items-center justify-center py-1">
                  <div className="w-16 h-16 border-2 border-black p-1 flex items-center justify-center bg-white">
                    <QrCode className="w-14 h-14 text-black" />
                  </div>
                  <span className="text-[8px] font-mono mt-0.5">
                    {receipt.receiptNumber}
                  </span>
                </div>
              )}

              {/* Barcode representation */}
              <div className="py-1 tracking-[4px] font-mono text-center text-xs font-black select-none">
                ||| | |||| || ||| |||| | ||
              </div>

              <p className="font-bold">{customFooter}</p>
              <p className="text-[8px] text-slate-600 print:text-black">
                Smart Control Security Systems
              </p>
              <p className="text-[7px]">
                {receipt.isOffline ? '[Oflayn chek]' : '✓ Tizimda tasdiqlangan'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden when printing) */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyReceiptSummary}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition flex items-center gap-1.5"
            >
              {isCopied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Nusxalandi!' : 'Chekni Nusxalash'}</span>
            </button>

            {onOpenReturn && receipt.status !== 'returned' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReturn(receipt);
                }}
                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/50 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Vozvrat</span>
              </button>
            )}

            {onOpenEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEdit(receipt);
                }}
                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-900/50 transition flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Tahrirlash</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUsbPrint}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95 flex items-center gap-2"
              title="Ikkinchi darchaga o'tmasdan to'g'ridan-to'g'ri USB printerdan chiqarish"
            >
              <Usb className="w-4 h-4" />
              <span>To&apos;g&apos;ridan-to&apos;g&apos;ri Chop Etish ({paperWidth}mm)</span>
            </button>
            <button
              type="button"
              onClick={handleBluetoothPrint}
              className="px-3.5 py-2 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
              title="Portativ Bluetooth printer orqali to'g'ridan-to'g'ri chiqarish"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>Bluetooth</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-3 py-2 rounded-xl font-semibold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
              title="Standart brauzer darchasini ochish"
            >
              {isPrinting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              <span>Darcha orqali</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
