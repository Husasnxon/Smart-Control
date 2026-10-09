'use client';

import React, { useState, useEffect } from 'react';
import { CrmObjectPassport, FloorPlanPin } from '../types';
import QRCode from 'qrcode';
import { 
  X, 
  Printer, 
  Download, 
  QrCode, 
  Smartphone, 
  FileText, 
  Layers, 
  Camera, 
  CheckCircle2, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Key, 
  HardDrive, 
  ExternalLink,
  Copy,
  Check,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';
import { InteractiveFloorPlanEditor } from './InteractiveFloorPlanEditor';

interface ObjectQrPassportModalProps {
  objectPassport: CrmObjectPassport;
  onSaveObjectPassport: (updatedPassport: CrmObjectPassport) => void;
  onClose: () => void;
}

type PrintFormat = 'sticker_80mm' | 'a4_full' | 'live_mobile_preview';

export const ObjectQrPassportModal: React.FC<ObjectQrPassportModalProps> = ({
  objectPassport,
  onSaveObjectPassport,
  onClose
}) => {
  const [activeFormat, setActiveFormat] = useState<PrintFormat>('sticker_80mm');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isFloorPlanEditorOpen, setIsFloorPlanEditorOpen] = useState(false);
  const [selectedMobilePin, setSelectedMobilePin] = useState<FloorPlanPin | null>(null);

  // Generate QR Code URL on mount
  useEffect(() => {
    // Generate QR payload containing object passport summary and deep-link token
    const qrPayload = JSON.stringify({
      passportId: objectPassport.id,
      number: objectPassport.passportNumber,
      object: objectPassport.objectName,
      customer: objectPassport.customerName,
      token: objectPassport.qrToken || `qr-${objectPassport.id}`
    });

    QRCode.toDataURL(qrPayload, {
      width: 400,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR generation error:', err));
  }, [objectPassport]);

  // Total pins summary
  const allPins: FloorPlanPin[] = (objectPassport.floorPlans || []).flatMap(p => p.pins || []);
  const cabledPinsCount = allPins.filter(p => p.status === 'cabled').length;
  const installedPinsCount = allPins.filter(p => p.status === 'installed' || p.status === 'tested').length;
  const totalCableLength = allPins.reduce((acc, p) => acc + (p.cableLengthMeters || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 max-w-4xl w-full shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto print:p-0 print:m-0 print:border-none print:bg-white print:text-black">
        
        {/* ========================================================================= */}
        {/* MODAL HEADER (HIDDEN IN PRINT) */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white shadow-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  QR Texnik Pasport & Termo-Stiker
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-500/30">
                  {objectPassport.passportNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Obyekt: <b className="text-slate-200">{objectPassport.objectName}</b> • {objectPassport.customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFloorPlanEditorOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Sxemani Ko'rish / Tahrirlash</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FORMAT SELECTOR TABS (HIDDEN IN PRINT) */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800 print:hidden text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFormat('sticker_80mm')}
              className={`px-3 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
                activeFormat === 'sticker_80mm'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>80mm Termo-Stiker (NVR / Shchitka)</span>
            </button>

            <button
              onClick={() => setActiveFormat('a4_full')}
              className={`px-3 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
                activeFormat === 'a4_full'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>A4 To'liq Texnik Hujjat</span>
            </button>

            <button
              onClick={() => setActiveFormat('live_mobile_preview')}
              className={`px-3 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
                activeFormat === 'live_mobile_preview'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Mobil Skaner Ko'rinishi</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-extrabold shadow-lg shadow-emerald-600/20 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Chop Etish / PDF</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: 80MM THERMAL STICKER FOR NVR / ELECTRICAL CABINET */}
        {/* ========================================================================= */}
        {activeFormat === 'sticker_80mm' && (
          <div className="flex justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800 print:bg-white print:p-0 print:border-none">
            <div className="w-[320px] bg-white text-black p-5 rounded-2xl border-2 border-black shadow-2xl space-y-3 font-sans print:shadow-none print:border-none print:w-[80mm] print:p-2">
              {/* Header */}
              <div className="text-center border-b-2 border-black pb-2 space-y-0.5">
                <h4 className="text-sm font-black tracking-tight uppercase">SMART CONTROL</h4>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">TEXNIK PASPORT & SXEMA</p>
                <div className="font-mono text-xs font-black bg-black text-white px-2 py-0.5 rounded w-max mx-auto mt-1">
                  {objectPassport.passportNumber}
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-2 bg-slate-50 border border-black rounded-xl">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-40 h-40 object-contain" />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-xs font-bold text-slate-400">
                    QR Generatsiya qilinmoqda...
                  </div>
                )}
                <p className="text-[9px] font-black text-center text-slate-800 uppercase tracking-tight mt-1">
                  📱 Kamerangizni yo'naltiring
                </p>
                <p className="text-[8px] text-center text-slate-600 leading-tight">
                  Suvoq ostidagi kabellar, xonalar suratlari va 2D montaj loyihasi
                </p>
              </div>

              {/* Object Details Table */}
              <div className="space-y-1 text-[10px] border-t border-b border-black py-2 leading-snug">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Obyekt:</span>
                  <span className="font-black text-right line-clamp-1 max-w-[170px]">{objectPassport.objectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Mijoz:</span>
                  <span className="font-semibold text-right">{objectPassport.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Tel:</span>
                  <span className="font-mono font-bold text-right">{objectPassport.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Montaj nuqtalari:</span>
                  <span className="font-bold text-right">{allPins.length || objectPassport.installedCamerasCount} ta nuqta</span>
                </div>
                {objectPassport.dvrModel && (
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-600">Registrator:</span>
                    <span className="font-mono font-semibold text-right truncate max-w-[150px]">{objectPassport.dvrModel}</span>
                  </div>
                )}
                {objectPassport.installedByTechnicianName && (
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-600">Mas'ul usta:</span>
                    <span className="font-bold text-right">{objectPassport.installedByTechnicianName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Sana:</span>
                  <span className="font-mono font-bold text-right">{objectPassport.installationDate}</span>
                </div>
              </div>

              {/* Footer Notice */}
              <div className="text-center pt-1">
                <p className="text-[8px] font-bold text-slate-500 uppercase">
                  Kafolat muddati: {objectPassport.warrantyMonths} oy • Servis: +998 (90) 000-00-00
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: FULL A4 TECHNICAL PASSPORT WITH ROOM/PIN SUMMARY */}
        {/* ========================================================================= */}
        {activeFormat === 'a4_full' && (
          <div className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-2xl space-y-6 print:shadow-none print:border-none print:p-0">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">SMART CONTROL</h2>
                <p className="text-xs uppercase tracking-wider text-slate-600 font-bold">Xavfsizlik Tizimlari & Kuzatuv Texnik Pasporti</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-mono font-black text-slate-900">{objectPassport.passportNumber}</span>
                <p className="text-xs text-slate-500">Sana: {objectPassport.installationDate}</p>
              </div>
            </div>

            {/* Client & Facility Grid with QR Code */}
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="col-span-2 space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Buyurtmachi & Obyekt:</p>
                  <p className="font-extrabold text-sm text-slate-900">{objectPassport.customerName}</p>
                  <p className="text-slate-700 font-semibold">{objectPassport.objectName}</p>
                  <p className="text-slate-600">{objectPassport.address}</p>
                  <p className="font-bold text-slate-900">{objectPassport.customerPhone}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Montaj & Kafolat:</p>
                  <p className="font-bold text-slate-900">Kafolat muddati: {objectPassport.warrantyMonths} oy ({objectPassport.warrantyExpiresAt} gacha)</p>
                  <p className="text-slate-700">Mas'ul muhandis / usta: <span className="font-bold">{objectPassport.installedByTechnicianName || '-'}</span></p>
                  <p className="text-slate-700">Jami kabel sarfi: <span className="font-mono font-bold text-slate-900">{totalCableLength} metr</span></p>
                </div>
              </div>

              {/* QR Code Column */}
              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-32 h-32 object-contain" />}
                <p className="text-[10px] font-bold text-slate-800 mt-1">Mobil Texnik Pasport</p>
                <p className="text-[9px] text-slate-500">Kabel va xonalar xaritasi</p>
              </div>
            </div>

            {/* DVR / NVR Hardware Details */}
            <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-300">
                1. Registrator (DVR/NVR) va Tarmoq Sozlamalari
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500">Model:</span> <span className="font-bold text-slate-900">{objectPassport.dvrModel || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Seriya raqami (S/N):</span> <span className="font-mono font-bold text-slate-900">{objectPassport.dvrSerialNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Cloud ID / Hik-Connect:</span> <span className="font-mono font-bold text-slate-900">{objectPassport.dvrCloudId || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Xotira (HDD):</span> <span className="font-bold text-slate-900">{objectPassport.hddCapacity || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Admin Login:</span> <span className="font-mono font-bold text-slate-900">{objectPassport.dvrAdminLogin || 'admin'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Admin Parol:</span> <span className="font-mono font-bold text-slate-900">{objectPassport.dvrAdminPassword || '******'}</span>
                </div>
              </div>
            </div>

            {/* Floor Plan Pins & Rooms Table */}
            {allPins.length > 0 && (
              <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-300 flex items-center justify-between">
                  <span>2. Obyekt Nuqtalari & Kabel Trassalari Jadvali</span>
                  <span className="font-mono text-slate-600">{allPins.length} ta nuqta</span>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Nuqta & Xona</th>
                      <th className="px-3 py-2">Qurilma Modeli</th>
                      <th className="px-3 py-2">Kabel Turi & Uzunligi</th>
                      <th className="px-3 py-2">Holati</th>
                      <th className="px-3 py-2">Trassa Izohi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {allPins.map((pin, idx) => (
                      <tr key={pin.id}>
                        <td className="px-3 py-2 font-bold font-mono">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <span className="font-bold text-slate-900">{pin.label}</span>
                          <span className="block text-[10px] text-slate-500">{pin.roomName}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-semibold text-slate-800">{pin.plannedProduct || '-'}</span>
                          {pin.serialNumber && <span className="block text-[10px] font-mono text-slate-500">S/N: {pin.serialNumber}</span>}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-bold text-slate-900">{pin.cableLengthMeters || 0}m</span>
                          <span className="block text-[10px] text-slate-500">{pin.cableType || 'UTP Cat6'}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                            {pin.status === 'cabled' ? 'Kabel tortilgan' : pin.status === 'installed' ? 'O\'rnatildi' : pin.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600 text-[11px]">{pin.cableRouteNotes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signatures */}
            <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs">
              <div>
                <p className="font-bold text-slate-900">Usta / Muhandis:</p>
                <div className="mt-8 border-b border-slate-400 w-48" />
                <p className="text-[10px] text-slate-500 mt-1">Imzo & F.I.Sh.</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="font-bold text-slate-900">Mijoz / Qabul qiluvchi:</p>
                <div className="mt-8 border-b border-slate-400 w-48" />
                <p className="text-[10px] text-slate-500 mt-1">Imzo & F.I.Sh.</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: LIVE MOBILE INSPECTOR SIMULATOR */}
        {/* ========================================================================= */}
        {activeFormat === 'live_mobile_preview' && (
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="max-w-md w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
              {/* Simulated Mobile Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">Mobil Texnik Inspector</span>
                </div>
                <span className="font-mono text-[11px] text-teal-400 font-bold bg-teal-950 px-2 py-0.5 rounded border border-teal-500/30">
                  {objectPassport.passportNumber}
                </span>
              </div>

              {/* Object Header Info */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <h4 className="font-black text-white text-sm">{objectPassport.objectName}</h4>
                <p className="text-slate-400">{objectPassport.address}</p>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-300">Mijoz: {objectPassport.customerName}</span>
                  <a href={`tel:${objectPassport.customerPhone}`} className="text-emerald-400 font-bold">
                    {objectPassport.customerPhone}
                  </a>
                </div>
              </div>

              {/* 2D Schema Link Button */}
              <button
                onClick={() => setIsFloorPlanEditorOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-sky-600/20 active:scale-98 transition"
              >
                <Layers className="w-4 h-4" />
                <span>Interaktiv 2D Xaritani Ochish ({allPins.length} nuqta)</span>
              </button>

              {/* Pins & Rooms List */}
              <div className="space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Xonalar va Kabel Trassalari:
                </p>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {allPins.map((pin) => (
                    <div
                      key={pin.id}
                      onClick={() => setSelectedMobilePin(pin)}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 cursor-pointer transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{pin.pinType.includes('camera') ? '📹' : '📍'}</span>
                          <div>
                            <p className="text-xs font-bold text-white">{pin.label}</p>
                            <p className="text-[11px] text-slate-400">{pin.roomName}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          pin.status === 'installed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                        }`}>
                          {pin.status === 'installed' ? 'O\'rnatildi' : 'Kabel tortilgan'}
                        </span>
                      </div>

                      {/* Cable details preview */}
                      <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg">
                        <span>🔌 {pin.cableType || 'UTP Cat6'}</span>
                        <span className="font-mono font-bold text-sky-400">{pin.cableLengthMeters || 0} metr</span>
                      </div>

                      {/* Photos thumbnail preview */}
                      {pin.photos && pin.photos.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                          {pin.photos.map((ph) => (
                            <img
                              key={ph.id}
                              src={ph.url}
                              alt="Photo"
                              className="w-12 h-12 object-cover rounded-lg border border-slate-800 shrink-0"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {allPins.length === 0 && (
                    <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                      Hali xonalar va nuqtalar kiritilmagan. Yuqoridagi "2D Xaritani Ochish" tugmasini bosing.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Floor Plan Editor when clicked */}
      {isFloorPlanEditorOpen && (
        <InteractiveFloorPlanEditor
          objectPassport={objectPassport}
          onSaveObjectPassport={(updated) => {
            onSaveObjectPassport(updated);
            setIsFloorPlanEditorOpen(false);
          }}
          onClose={() => setIsFloorPlanEditorOpen(false)}
        />
      )}
    </div>
  );
};
