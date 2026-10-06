'use client';

import React, { useState } from 'react';
import { 
  ObjectHandover, 
  HandoverPhoto, 
  CustomerOrder, 
  Employee, 
  Currency 
} from '../types';
import { compressImage, formatBytes } from '../utils/imageCompressor';
import { SignaturePad } from './SignaturePad';
import { 
  X, 
  Camera, 
  MapPin, 
  Star, 
  CheckCircle2, 
  Printer, 
  Upload, 
  Trash2, 
  HardHat, 
  ShieldCheck, 
  ExternalLink, 
  Navigation, 
  FileText, 
  Eye, 
  Smartphone, 
  Sparkles, 
  User, 
  Phone, 
  Package, 
  Check, 
  AlertTriangle,
  Barcode,
  Cpu,
  Layers
} from 'lucide-react';

interface HandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: CustomerOrder | null;
  existingHandover?: ObjectHandover | null;
  employees: Employee[];
  currentUser?: Employee | null;
  onSaveHandover: (handover: ObjectHandover) => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({
  isOpen,
  onClose,
  order,
  existingHandover,
  employees,
  currentUser,
  onSaveHandover
}) => {
  const [viewMode, setViewMode] = useState<'create' | 'print'>(() => {
    return existingHandover ? 'print' : 'create';
  });

  // Form State
  const [photos, setPhotos] = useState<HandoverPhoto[]>(() => {
    return existingHandover?.photos || [];
  });
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<string | null>(null);

  // GPS State
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    mapUrl?: string;
  } | undefined>(() => existingHandover?.gpsLocation);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Client Rating & Feedback
  const [rating, setRating] = useState<number>(() => existingHandover?.clientRating || 5);
  const [feedback, setFeedback] = useState<string>(() => existingHandover?.clientFeedback || '');
  const [signature, setSignature] = useState<string>(() => existingHandover?.clientSignature || '');
  const [clientName, setClientName] = useState<string>(() => {
    return existingHandover?.clientNameConfirmed || order?.customerName || '';
  });
  const [address, setAddress] = useState<string>(() => {
    return existingHandover?.installationAddress || order?.deliveryAddress || '';
  });
  const [technicianNotes, setTechnicianNotes] = useState<string>(() => {
    return existingHandover?.technicianNotes || 'Barcha kameralar burchaklari sozlandi va mijoz telefoniga ulab berildi.';
  });
  const [videoUrl, setVideoUrl] = useState<string>(() => existingHandover?.videoNoteUrl || '');
  const [warrantyMonths, setWarrantyMonths] = useState<number>(() => existingHandover?.warrantyPeriodMonths || 12);

  // Selected Technicians
  const [selectedTechs, setSelectedTechs] = useState<{ id: string; fullName: string; phone?: string; role?: string }[]>(() => {
    if (existingHandover?.technicians && existingHandover.technicians.length > 0) {
      return existingHandover.technicians;
    }
    if (order?.technicians && order.technicians.length > 0) {
      return order.technicians.map((t) => ({
        id: t.id,
        fullName: t.fullName,
        phone: t.phone,
        role: 'Montajchi Usta'
      }));
    }
    if (order?.technicianId) {
      const found = employees.find((e) => e.id === order.technicianId);
      if (found) {
        return [{ id: found.id, fullName: found.fullName, phone: found.phone, role: found.role }];
      }
    }
    if (currentUser) {
      return [{ id: currentUser.id, fullName: currentUser.fullName, phone: currentUser.phone, role: currentUser.role }];
    }
    return [];
  });

  // Installed Items with Serial Numbers
  const [installedItems, setInstalledItems] = useState<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    serialNumbers?: string[];
  }[]>(() => {
    if (existingHandover?.installedItems && existingHandover.installedItems.length > 0) {
      return existingHandover.installedItems;
    }
    return (
      order?.items?.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unit: it.unit || 'dona',
        serialNumbers: it.selectedSerialNumbers ? [...it.selectedSerialNumbers] : []
      })) || []
    );
  });

  const handleUpdateItemSerial = (itemIdx: number, snIdx: number, val: string) => {
    setInstalledItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[itemIdx] };
      const sns = [...(target.serialNumbers || [])];
      sns[snIdx] = val.trim();
      target.serialNumbers = sns;
      copy[itemIdx] = target;
      return copy;
    });
  };

  if (!isOpen) return null;

  // 1. Get GPS Location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Brauzeringizda geolokatsiya qo'llab-quvvatlanmaydi");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const acc = Math.round(position.coords.accuracy);
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        setGpsLocation({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          mapUrl
        });
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Geolokatsiyaga ruxsat berilmadi. Telefon sozlamalaridan GPS ruxsatini yoqing.");
        } else {
          setLocationError("Joylashuvni aniqlashda xatolik yuz berdi.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // 2. Handle Photo Upload with Client-Side Compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    setCompressionStats(null);

    let totalOriginal = 0;
    let totalCompressed = 0;
    const newPhotos: HandoverPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const res = await compressImage(file, 1280, 1280, 0.75);
        totalOriginal += res.originalSizeBytes;
        totalCompressed += res.compressedSizeBytes;

        newPhotos.push({
          id: `photo-${Date.now()}-${i}`,
          url: res.dataUrl,
          caption: `Obyekt surati #${photos.length + newPhotos.length + 1}`,
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
        });
      } catch (err) {
        console.error("Rasm siqishda xatolik:", err);
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    setIsCompressing(false);

    if (totalOriginal > 0) {
      const savedPercent = Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100);
      setCompressionStats(
        `✓ ${newPhotos.length} ta surat muvaffaqiyatli siqildi (${formatBytes(totalOriginal)} ➔ ${formatBytes(totalCompressed)}, -${savedPercent}%)`
      );
      setTimeout(() => setCompressionStats(null), 5000);
    }
  };

  // Remove Photo
  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Update Photo Caption
  const handleUpdateCaption = (id: string, caption: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, caption } : p)));
  };

  // 3. Save Handover Report
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!signature) {
      alert("Iltimos, mijozdan ekranda raqamli imzo oling!");
      return;
    }

    const handoverNumber = existingHandover?.handoverNumber || `AKT-${Date.now().toString().slice(-4)}`;

    const report: ObjectHandover = {
      id: existingHandover?.id || `handover-${Date.now()}`,
      handoverNumber,
      orderId: order?.id,
      orderNumber: order?.orderNumber,
      shipmentId: order?.shipmentId,
      receiptId: order?.receiptId,
      customerId: order?.customerId,
      customerName: clientName || order?.customerName || 'Noma\'lum Mijoz',
      customerPhone: order?.customerPhone || '',
      installationAddress: address,
      projectName: order?.projectName || 'Xavfsizlik & Kamera Tizimlari Obyekti',
      gpsLocation,
      technicians: selectedTechs,
      installedItems,
      photos,
      videoNoteUrl: videoUrl,
      clientRating: rating,
      clientFeedback: feedback,
      clientSignature: signature,
      clientNameConfirmed: clientName,
      technicianNotes,
      warrantyPeriodMonths: warrantyMonths,
      createdAt: existingHandover?.createdAt || new Date().toISOString().replace('T', ' ').slice(0, 16),
      createdBy: currentUser?.fullName || selectedTechs[0]?.fullName || 'Usta',
      status: 'submitted'
    };

    onSaveHandover(report);
    setViewMode('print');
  };

  const handlePrint = () => {
    window.print();
  };

  const handoverData = existingHandover || {
    id: 'temp',
    handoverNumber: `AKT-${Date.now().toString().slice(-4)}`,
    customerName: clientName || order?.customerName || 'Hurmatli Mijoz',
    customerPhone: order?.customerPhone || '',
    installationAddress: address || order?.deliveryAddress || 'Kiritilmagan',
    projectName: order?.projectName || 'Xavfsizlik & Kamera Montaji',
    gpsLocation,
    technicians: selectedTechs,
    installedItems,
    photos,
    clientRating: rating,
    clientFeedback: feedback,
    clientSignature: signature,
    clientNameConfirmed: clientName,
    technicianNotes,
    warrantyPeriodMonths: warrantyMonths,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    createdBy: currentUser?.fullName || 'Usta',
    status: 'submitted' as const
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="no-print px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {viewMode === 'create' ? "Obyektni Topshirish & Dalolatnoma (Akt)" : "Obyekt Topshirish-Qabul Qilish Dalolatnomasi"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {order?.orderNumber || handoverData.handoverNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mijoz: <strong className="text-slate-700 dark:text-slate-300">{clientName || order?.customerName}</strong> • Usta: <strong className="text-purple-600">{selectedTechs.map((t) => t.fullName).join(', ') || 'Biriktirilmagan'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'print' ? (
              <>
                <button
                  type="button"
                  onClick={() => setViewMode('create')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  Tahrirlash
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Chop etish / PDF</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('print')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
              >
                <Eye className="w-3.5 h-3.5 text-purple-500" />
                <span>Akt Ko&apos;rinishi</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0 print:overflow-visible">
          
          {/* ============================================================= */}
          {/* MODE 1: CREATE / EDIT HANDOVER FORM */}
          {/* ============================================================= */}
          {viewMode === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* SECTION 1: OBYEKT & MANZIL & GPS */}
              <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      1. Obyekt Manzili & GPS Lokatsiya
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Aniqlanmoqda...' : '📍 GPS orqali joylashuvni olish'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Obyekt Manzili:
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Masalan: Toshkent sh., Chilonzor 9, 12-uy"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Mijoz F.I.Sh. (Qabul qiluvchi):
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Masalan: Alisher Vohidov"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* GPS Result Preview */}
                {gpsLocation && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        GPS: {gpsLocation.latitude}, {gpsLocation.longitude} (Aniqlik: ±{gpsLocation.accuracy}m)
                      </span>
                    </div>

                    <a
                      href={gpsLocation.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:underline"
                    >
                      <span>Xaritada ko&apos;rish</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {locationError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-600 font-medium">
                    ⚠️ {locationError}
                  </div>
                )}
              </div>

              {/* SECTION 2: O'RNATILGAN QURILMALAR VA S/N RAQAMLARI */}
              {installedItems && installedItems.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Barcode className="w-4 h-4 text-purple-600" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        2. O&apos;rnatilgan Qurilmalar & Seriya Raqamlari (S/N)
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                      {installedItems.length} ta pozitsiya
                    </span>
                  </div>

                  <div className="space-y-3">
                    {installedItems.map((item, itIdx) => (
                      <div
                        key={itIdx}
                        className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-black shrink-0">
                              {itIdx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.productName}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 shrink-0 ml-2">
                            {item.quantity} {item.unit || 'dona'}
                          </span>
                        </div>

                        {/* S/N Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          {Array.from({ length: item.quantity }).map((_, snIdx) => {
                            const val = (item.serialNumbers && item.serialNumbers[snIdx]) || '';
                            const isFilled = val.trim().length > 0;

                            return (
                              <div key={snIdx} className="space-y-0.5">
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder={`S/N #${snIdx + 1} (masalan: HK-100${snIdx + 1})`}
                                    value={val}
                                    onChange={(e) => handleUpdateItemSerial(itIdx, snIdx, e.target.value)}
                                    className={`w-full px-3 py-1.5 rounded-xl border text-xs font-mono outline-none transition ${
                                      isFilled
                                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-900 dark:text-emerald-300'
                                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-purple-500'
                                    }`}
                                  />
                                  {isFilled && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: FOTO-HISOBOT (CLIENT COMPRESSION) */}
              <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      3. Obyekt Foto-Hisoboti (Kamera & Qurilmalar)
                    </h3>
                  </div>

                  <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95">
                    <Upload className="w-3.5 h-3.5 text-purple-400" />
                    <span>Surat yuklash (Kamera / Galereya)</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {isCompressing && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                    <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                    <span>Suratlar brauzerda avtomatik siqilmoqda (yengil hajmga o&apos;tkazilmoqda)...</span>
                  </div>
                )}

                {compressionStats && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold">
                    {compressionStats}
                  </div>
                )}

                {/* Photos Grid */}
                {photos.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center text-slate-400 space-y-2">
                    <Camera className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-medium">
                      Hozircha suratlar yuklanmagan. O&apos;rnatilgan kameralar, server shkafi va kabel ulanishlarining rasmlarini yuklang.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col group"
                      >
                        <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={photo.caption || 'Obyekt surati'}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-rose-600/90 text-white flex items-center justify-center hover:bg-rose-700 transition shadow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                            {photo.timestamp}
                          </span>
                        </div>

                        <div className="p-2">
                          <input
                            type="text"
                            value={photo.caption || ''}
                            onChange={(e) => handleUpdateCaption(photo.id, e.target.value)}
                            placeholder="Izoh (masalan: 1-kamera burchagi)"
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: MIJOZ BAHOSI & SHARHI */}
              <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    3. Mijoz Bahosi va Fikri (Sifat Nazorati)
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                      Bajarilgan ish sifatiga baho:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 rounded-lg hover:scale-110 transition active:scale-95"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= rating
                                ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 font-bold text-xs text-amber-600 dark:text-amber-400">
                        {rating === 5 && "⭐ 5/5 - A'lo darajada"}
                        {rating === 4 && "⭐ 4/5 - Yaxshi"}
                        {rating === 3 && "⭐ 3/5 - O'rtacha"}
                        {rating === 2 && "⭐ 2/5 - Qoniqarsiz"}
                        {rating === 1 && "⭐ 1/5 - Juda yomon"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Mijozning fikri / izohi:
                  </label>
                  <textarea
                    rows={2}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Masalan: Usta ishni vaqtida tugatdi, kameralar sifati a'lo darajada ishlayapti..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
              </div>

              {/* SECTION 5: MIJOZ RAQAMLI IMZOSI (TOUCH CANVAS) */}
              <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      5. Mijozning Raqamli Imzosi (E-Imzo)
                    </h3>
                  </div>

                  <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                    Majburiy
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  📜 <strong>Tasdiqnoma:</strong> Men, buyurtmachi, montaj qilingan asbob-uskunalar to&apos;liq va nuqsonsiz o&apos;rnatilganligini, ko&apos;rsatilgan xizmatlar talab darajasida bajarilganligini tasdiqlayman va ishni qabul qilib olaman.
                </p>

                {/* Digital Touch Signature Canvas */}
                <SignaturePad
                  value={signature}
                  onChange={(sig) => setSignature(sig)}
                  width={600}
                  height={150}
                  placeholderText="Mijoz shu yerga barmog'i bilan imzo chekadi"
                />
              </div>

              {/* SECTION 6: USTA XULOSASI & KAFOLAT */}
              <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    6. Usta Xulosasi va Kafolat Muddati
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Usta Izohi va Tavsiyalari:
                    </label>
                    <input
                      type="text"
                      value={technicianNotes}
                      onChange={(e) => setTechnicianNotes(e.target.value)}
                      placeholder="Masalan: Parol admin12345 qilib topshirildi, rezerv kabel qoldirildi"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Kafolat muddati (Oy):
                    </label>
                    <select
                      value={warrantyMonths}
                      onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={6}>6 oy kafolat</option>
                      <option value={12}>12 oy (1 yil) kafolat</option>
                      <option value={24}>24 oy (2 yil) kafolat</option>
                      <option value={36}>36 oy (3 yil) kafolat</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  Bekor qilish
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Obyektni Topshirish & Aktni Saqlash</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================= */}
          {/* MODE 2: OFFICIAL PRINTABLE HANDOVER ACT (DALOLATNOMA) */}
          {/* ============================================================= */}
          {viewMode === 'print' && (
            <div className="printable-document bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none space-y-6">
              
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-purple-700">
                    SMART CONTROL • SECURITY & NETWORKING SYSTEMS
                  </div>
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 mt-1 uppercase">
                    Obyektni Topshirish va Ishlarni Qabul Qilish Dalolatnomasi
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Hujjat raqami: <strong className="font-mono text-slate-900">#{handoverData.handoverNumber}</strong> • Sana: <strong className="font-mono text-slate-900">{handoverData.createdAt}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">WST Namangan Filiali</div>
                  <div className="text-[11px] text-slate-500">Tel: +998 90 123-45-67</div>
                  <div className="inline-block px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold mt-1">
                    ✓ Obyekt Qabul Qilindi
                  </div>
                </div>
              </div>

              {/* Order & Client Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Buyurtmachi (Mijoz):</span>
                  <div className="font-bold text-slate-900 text-sm">{handoverData.customerName}</div>
                  <div className="text-slate-600 font-medium">Tel: {handoverData.customerPhone || '—'}</div>
                  <div className="text-slate-600 mt-1">📍 Manzil: <strong>{handoverData.installationAddress}</strong></div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Ijrochi (Ustalar):</span>
                  <div className="font-bold text-purple-700 text-sm">
                    {handoverData.technicians.map((t) => t.fullName).join(', ') || 'Smart Control Mutaxassislari'}
                  </div>
                  <div className="text-slate-600 mt-1">
                    Kafolat muddati: <strong>{handoverData.warrantyPeriodMonths} oy</strong>
                  </div>
                  {handoverData.gpsLocation && (
                    <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                      📍 GPS: {handoverData.gpsLocation.latitude}, {handoverData.gpsLocation.longitude}
                    </div>
                  )}
                </div>
              </div>

              {/* Installed Devices Table */}
              {handoverData.installedItems && handoverData.installedItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                    O&apos;rnatilgan Qurilmalar va Materiallar Ro&apos;yxati:
                  </h3>
                  <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2 px-3 text-left w-10">№</th>
                        <th className="py-2 px-3 text-left">Qurilma / Xizmat Nomi</th>
                        <th className="py-2 px-3 text-center w-24">Miqdori</th>
                        <th className="py-2 px-3 text-left">Seriya Raqamlari (S/N)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {handoverData.installedItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-3 text-slate-400">{idx + 1}</td>
                          <td className="py-1.5 px-3 font-semibold text-slate-900">{item.productName}</td>
                          <td className="py-1.5 px-3 text-center">{item.quantity} {item.unit}</td>
                          <td className="py-1.5 px-3 font-mono text-[11px] text-slate-600">
                            {item.serialNumbers && item.serialNumbers.length > 0
                              ? item.serialNumbers.join(', ')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Photo Evidence Gallery */}
              {handoverData.photos && handoverData.photos.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                    Obyekt Foto-Hisoboti ({handoverData.photos.length} ta surat ilova qilindi):
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {handoverData.photos.map((photo, i) => (
                      <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.caption || 'Foto'}
                          className="w-full h-24 object-cover"
                        />
                        <div className="p-1.5 bg-slate-50 text-[10px] font-medium text-slate-700 truncate">
                          {photo.caption || `Surat #${i + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Client Feedback & Rating */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-amber-900 block">
                    Mijoz Bahosi: {'⭐'.repeat(handoverData.clientRating)} ({handoverData.clientRating}/5)
                  </span>
                  {handoverData.clientFeedback && (
                    <p className="text-slate-700 italic mt-0.5">
                      &quot;{handoverData.clientFeedback}&quot;
                    </p>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  Usta izohi: <strong>{handoverData.technicianNotes || 'Kamchiliklarsiz topshirildi'}</strong>
                </div>
              </div>

              {/* Legal confirmation & Signatures */}
              <div className="border-t-2 border-slate-200 pt-4 space-y-4">
                <p className="text-[10px] text-slate-500 leading-relaxed text-center">
                  Ushbu dalolatnoma 2 (ikki) nusxada tuzildi. Buyurtmachi montaj qilingan tizimni to&apos;liq soz holatda qabul qilib olganligini, dasturiy ta&apos;minot va foydalanish bo&apos;yicha yo&apos;riqnoma berilganligini tasdiqlaydi.
                </p>

                <div className="grid grid-cols-2 gap-8 pt-2">
                  {/* Technician Signature */}
                  <div className="text-xs border-t border-slate-400 pt-2 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Topshirdi (Bosh Usta):
                    </span>
                    <div className="font-bold text-slate-900">
                      {handoverData.technicians[0]?.fullName || 'Usta'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-4">
                      ________________ (Imzo)
                    </div>
                  </div>

                  {/* Client Digital Signature */}
                  <div className="text-xs border-t border-slate-400 pt-2 text-center flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Qabul qildi (Buyurtmachi):
                    </span>
                    <div className="font-bold text-slate-900">
                      {handoverData.clientNameConfirmed || handoverData.customerName}
                    </div>

                    {/* Rendered Digital Signature Image */}
                    {handoverData.clientSignature ? (
                      <div className="my-1 border border-emerald-300 bg-emerald-50/40 rounded p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={handoverData.clientSignature}
                          alt="Mijoz imzosi"
                          className="h-10 object-contain mx-auto"
                        />
                        <span className="text-[8px] font-mono text-emerald-700 font-bold block">
                          ✓ Elektron imzo tasdiqlangan
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 font-mono mt-4">
                        ________________ (Imzo)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
