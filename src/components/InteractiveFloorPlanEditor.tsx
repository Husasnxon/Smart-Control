'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ObjectFloorPlan, 
  FloorPlanPin, 
  FloorPlanPinType, 
  FloorPlanPinPhoto,
  CrmObjectPassport 
} from '../types';
import { compressImage } from '../utils/imageCompressor';
import { 
  X, 
  Plus, 
  Trash2, 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Camera, 
  Video, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Eye, 
  Compass, 
  Edit3, 
  Save, 
  Printer, 
  Download, 
  Image as ImageIcon,
  Cpu,
  Wifi,
  Sliders,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

interface InteractiveFloorPlanEditorProps {
  objectPassport: CrmObjectPassport;
  onSaveObjectPassport: (updatedPassport: CrmObjectPassport) => void;
  onClose: () => void;
  isReadOnly?: boolean;
}

const PIN_CONFIG: Record<FloorPlanPinType, { label: string; icon: string; color: string; bgColor: string; borderColor: string; defaultCoverage: number }> = {
  camera_bullet: { label: 'Kamera (Bullet / Tashqi)', icon: '📹', color: 'text-sky-400', bgColor: 'bg-sky-500', borderColor: 'border-sky-400', defaultCoverage: 90 },
  camera_dome: { label: 'Kamera (Dome / Gumbaz)', icon: '🔘', color: 'text-cyan-400', bgColor: 'bg-cyan-500', borderColor: 'border-cyan-400', defaultCoverage: 90 },
  camera_ptz: { label: 'Kamera PTZ (360°)', icon: '🔄', color: 'text-indigo-400', bgColor: 'bg-indigo-500', borderColor: 'border-indigo-400', defaultCoverage: 360 },
  intercom_outdoor: { label: 'Domofon Tashqi Panel', icon: '🚪', color: 'text-emerald-400', bgColor: 'bg-emerald-500', borderColor: 'border-emerald-400', defaultCoverage: 110 },
  intercom_monitor: { label: 'Domofon Monitori', icon: '🖥️', color: 'text-teal-400', bgColor: 'bg-teal-500', borderColor: 'border-teal-400', defaultCoverage: 0 },
  nvr_server: { label: 'NVR / Registrator Server', icon: '🎛️', color: 'text-amber-400', bgColor: 'bg-amber-500', borderColor: 'border-amber-400', defaultCoverage: 0 },
  switch_poe: { label: 'PoE Switch / Shchit', icon: '🔌', color: 'text-purple-400', bgColor: 'bg-purple-500', borderColor: 'border-purple-400', defaultCoverage: 0 },
  wifi_ap: { label: 'Wi-Fi Access Point', icon: '📶', color: 'text-blue-400', bgColor: 'bg-blue-500', borderColor: 'border-blue-400', defaultCoverage: 360 },
  motion_sensor: { label: 'Harakat Datchigi (PIR)', icon: '🚨', color: 'text-rose-400', bgColor: 'bg-rose-500', borderColor: 'border-rose-400', defaultCoverage: 90 },
  smoke_sensor: { label: 'Tutun Datchigi', icon: '🔥', color: 'text-orange-400', bgColor: 'bg-orange-500', borderColor: 'border-orange-400', defaultCoverage: 360 },
  smart_lock: { label: 'Aqlli Qulf (Smart Lock)', icon: '🔒', color: 'text-violet-400', bgColor: 'bg-violet-500', borderColor: 'border-violet-400', defaultCoverage: 0 },
  power_box: { label: 'Quvvat Bloki / UPS', icon: '⚡', color: 'text-yellow-400', bgColor: 'bg-yellow-500', borderColor: 'border-yellow-400', defaultCoverage: 0 },
  other: { label: 'Boshqa Nuqta', icon: '📍', color: 'text-slate-300', bgColor: 'bg-slate-500', borderColor: 'border-slate-400', defaultCoverage: 0 }
};

const STATUS_CONFIG = {
  planned: { label: 'Rejada', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', pinBorder: 'border-amber-400' },
  cabled: { label: 'Kabel tortilgan (1-bosqich)', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30', pinBorder: 'border-sky-400 ring-2 ring-sky-400/40' },
  installed: { label: 'Qurilma o\'rnatildi (2-bosqich)', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', pinBorder: 'border-emerald-400' },
  tested: { label: 'Sinovdan o\'tdi & Faol', color: 'text-teal-300', bg: 'bg-teal-500/10 border-teal-500/30', pinBorder: 'border-teal-300' },
  issue: { label: 'Muammo bor', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', pinBorder: 'border-rose-500 animate-pulse' }
};

export const InteractiveFloorPlanEditor: React.FC<InteractiveFloorPlanEditorProps> = ({
  objectPassport,
  onSaveObjectPassport,
  onClose,
  isReadOnly = false
}) => {
  const [floorPlans, setFloorPlans] = useState<ObjectFloorPlan[]>(
    objectPassport.floorPlans && objectPassport.floorPlans.length > 0 
      ? objectPassport.floorPlans 
      : [{
          id: `plan-${Date.now()}`,
          title: '1-Qavat Loyihasi',
          floorLevel: 1,
          planImageUrl: '',
          pins: []
        }]
  );
  const [activePlanId, setActivePlanId] = useState<string>(floorPlans[0]?.id || '');
  const [selectedPin, setSelectedPin] = useState<FloorPlanPin | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [activePinPalette, setActivePinPalette] = useState<FloorPlanPinType>('camera_bullet');
  const [isAddingPinMode, setIsAddingPinMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isUploadingPlan, setIsUploadingPlan] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [newFloorTitle, setNewFloorTitle] = useState('');
  const [isAddFloorModalOpen, setIsAddFloorModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const activePlan = floorPlans.find(p => p.id === activePlanId) || floorPlans[0];

  // Sync active plan id
  useEffect(() => {
    if (!floorPlans.some(p => p.id === activePlanId) && floorPlans.length > 0) {
      setActivePlanId(floorPlans[0].id);
    }
  }, [floorPlans, activePlanId]);

  // Handle plan image upload
  const handlePlanImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPlan(true);
    try {
      const result = await compressImage(file, 2048, 2048, 0.85);
      const updated = floorPlans.map(plan => {
        if (plan.id === activePlanId) {
          return {
            ...plan,
            planImageUrl: result.dataUrl,
            widthPx: result.width,
            heightPx: result.height
          };
        }
        return plan;
      });
      setFloorPlans(updated);
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    } catch (err) {
      alert("Rasmni yuklashda xatolik yuz berdi");
    } finally {
      setIsUploadingPlan(false);
    }
  };

  // Add new floor/plan
  const handleAddNewFloor = () => {
    if (!newFloorTitle.trim()) return;
    const newPlan: ObjectFloorPlan = {
      id: `plan-${Date.now()}`,
      title: newFloorTitle.trim(),
      floorLevel: floorPlans.length + 1,
      planImageUrl: '',
      pins: []
    };
    const updated = [...floorPlans, newPlan];
    setFloorPlans(updated);
    setActivePlanId(newPlan.id);
    setNewFloorTitle('');
    setIsAddFloorModalOpen(false);
  };

  // Delete floor plan
  const handleDeleteFloor = (planId: string) => {
    if (floorPlans.length <= 1) {
      alert("Kamida bitta qavat/sxema qolishi kerak");
      return;
    }
    if (confirm("Ushbu qavat va uning barcha nuqtalarini o'chirishni tasdiqlaysizmi?")) {
      const updated = floorPlans.filter(p => p.id !== planId);
      setFloorPlans(updated);
      if (activePlanId === planId) {
        setActivePlanId(updated[0].id);
      }
    }
  };

  // Canvas Click to Add Pin
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingPinMode || isReadOnly) return;
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (clickX < 0 || clickX > rect.width || clickY < 0 || clickY > rect.height) return;

    const xPercent = Number(((clickX / rect.width) * 100).toFixed(2));
    const yPercent = Number(((clickY / rect.height) * 100).toFixed(2));

    const pinConfig = PIN_CONFIG[activePinPalette];
    const pinIndex = (activePlan?.pins?.length || 0) + 1;

    const newPin: FloorPlanPin = {
      id: `pin-${Date.now()}`,
      pinType: activePinPalette,
      label: `${pinConfig.label.split(' ')[0]} #${pinIndex}`,
      roomName: `Xona ${pinIndex}`,
      xPercent,
      yPercent,
      rotationAngle: 45,
      coverageAngle: pinConfig.defaultCoverage,
      cableType: 'UTP Cat6 Mis Tashqi',
      cableLengthMeters: 25,
      cableRouteNotes: 'Gipsokarton orqasida 1.5m zaxira',
      plannedProduct: '',
      status: 'cabled',
      photos: []
    };

    const updatedPlans = floorPlans.map(plan => {
      if (plan.id === activePlanId) {
        return {
          ...plan,
          pins: [...(plan.pins || []), newPin]
        };
      }
      return plan;
    });

    setFloorPlans(updatedPlans);
    setIsAddingPinMode(false);
    setSelectedPin(newPin);
    setIsPinModalOpen(true);
  };

  // Save pin edits
  const handleSavePin = (updatedPin: FloorPlanPin) => {
    const updatedPlans = floorPlans.map(plan => {
      if (plan.id === activePlanId) {
        return {
          ...plan,
          pins: (plan.pins || []).map(p => p.id === updatedPin.id ? updatedPin : p)
        };
      }
      return plan;
    });
    setFloorPlans(updatedPlans);
    setSelectedPin(null);
    setIsPinModalOpen(false);
  };

  // Delete Pin
  const handleDeletePin = (pinId: string) => {
    if (confirm("Ushbu nuqtani va unga biriktirilgan rasmlarni o'chirishni tasdiqlaysizmi?")) {
      const updatedPlans = floorPlans.map(plan => {
        if (plan.id === activePlanId) {
          return {
            ...plan,
            pins: (plan.pins || []).filter(p => p.id !== pinId)
          };
        }
        return plan;
      });
      setFloorPlans(updatedPlans);
      setSelectedPin(null);
      setIsPinModalOpen(false);
    }
  };

  // Save changes back to object passport
  const handleSaveAll = () => {
    // Calculate total installed vs cabled to update installationStage
    let totalPins = 0;
    let installedPins = 0;
    let cabledPins = 0;

    floorPlans.forEach(p => {
      p.pins?.forEach(pin => {
        totalPins++;
        if (pin.status === 'installed' || pin.status === 'tested') installedPins++;
        if (pin.status === 'cabled') cabledPins++;
      });
    });

    let autoStage: 'cabling_phase' | 'devices_phase' | 'fully_completed' = 'cabling_phase';
    if (totalPins > 0 && installedPins === totalPins) {
      autoStage = 'fully_completed';
    } else if (installedPins > 0 || cabledPins > 0) {
      autoStage = installedPins > 0 ? 'devices_phase' : 'cabling_phase';
    }

    const updatedPassport: CrmObjectPassport = {
      ...objectPassport,
      floorPlans,
      installationStage: objectPassport.installationStage || autoStage,
      installedCamerasCount: totalPins > 0 ? totalPins : objectPassport.installedCamerasCount
    };

    onSaveObjectPassport(updatedPassport);
    alert("Sxema va barcha nuqtalar muvaffaqiyatli saqlandi!");
    onClose();
  };

  // Photo upload inside pin modal
  const handleAddPinPhoto = async (e: React.ChangeEvent<HTMLInputElement>, stage: 'cabling' | 'device') => {
    if (!selectedPin) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await compressImage(file, 1280, 1280, 0.75);
      const newPhoto: FloorPlanPinPhoto = {
        id: `photo-${Date.now()}`,
        url: res.dataUrl,
        stage,
        caption: stage === 'cabling' ? 'Suvoqdan oldingi kabel trassasi' : 'O\'rnatilgan qurilma surati',
        takenAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };

      setSelectedPin({
        ...selectedPin,
        photos: [...(selectedPin.photos || []), newPhoto]
      });
    } catch (err) {
      alert("Suratni yuklashda xatolik");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-fade-in select-none">
      {/* ========================================================================= */}
      {/* TOP NAV BAR */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-black text-white">
                2D Obyekt Sxemasi & Xonalar Xaritasi
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-500/30">
                {objectPassport.passportNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Obyekt: <b className="text-slate-200">{objectPassport.objectName}</b> • Mijoz: {objectPassport.customerName}
            </p>
          </div>
        </div>

        {/* Floor selector tabs */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {floorPlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => {
                setActivePlanId(plan.id);
                setZoomLevel(1);
                setPanPosition({ x: 0, y: 0 });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activePlanId === plan.id
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{plan.title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
                {plan.pins?.length || 0}
              </span>
            </button>
          ))}

          {!isReadOnly && (
            <button
              onClick={() => setIsAddFloorModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 border border-dashed border-slate-700"
              title="Yangi qavat qo'shish"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Saqlash</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Floor Selector Bar */}
      <div className="flex md:hidden items-center gap-2 px-3 py-2 bg-slate-900/90 border-b border-slate-800 overflow-x-auto shrink-0">
        {floorPlans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setActivePlanId(plan.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1 ${
              activePlanId === plan.id
                ? 'bg-sky-600 text-white'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            <span>{plan.title}</span>
            <span className="text-[10px] px-1 rounded-full bg-black/30 font-mono">
              {plan.pins?.length || 0}
            </span>
          </button>
        ))}
        {!isReadOnly && (
          <button
            onClick={() => setIsAddFloorModalOpen(true)}
            className="p-1 rounded-lg bg-slate-950 border border-dashed border-slate-700 text-slate-400"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MAIN WORKSPACE: SIDEBAR TOOLBAR + CANVAS */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Toolbar (Pin Palette & Layer Tools) */}
        {!isReadOnly && (
          <div className="w-full md:w-72 bg-slate-900/95 border-r border-slate-800 p-3 flex flex-col gap-3 shrink-0 overflow-y-auto max-h-[35vh] md:max-h-full">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">
                1. Qurilma & Nuqta Tanlang:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(PIN_CONFIG) as FloorPlanPinType[]).map((typeKey) => {
                  const item = PIN_CONFIG[typeKey];
                  const isSelected = activePinPalette === typeKey;
                  return (
                    <button
                      key={typeKey}
                      onClick={() => {
                        setActivePinPalette(typeKey);
                        setIsAddingPinMode(true);
                      }}
                      className={`p-2 rounded-xl text-left text-xs font-bold border transition flex items-center gap-2 ${
                        isSelected
                          ? 'bg-sky-600/20 border-sky-500 text-sky-200 ring-1 ring-sky-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="truncate text-[11px] leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pin Placement Indicator */}
            <div className={`p-3 rounded-2xl border transition ${
              isAddingPinMode 
                ? 'bg-sky-950/40 border-sky-500/60 shadow-lg shadow-sky-500/10 animate-pulse' 
                : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Nuqta joylashtirish:</span>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                  isAddingPinMode ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isAddingPinMode ? 'Xaritani bosing 👆' : 'Kutmoqda'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isAddingPinMode 
                  ? `Tanlangan: ${PIN_CONFIG[activePinPalette].label}. Sxema ustidagi kerakli joyga bosing.`
                  : 'Yuqoridan qurilma turini tanlang va chizmaga joylashtiring.'}
              </p>
            </div>

            {/* Plan Info & Management */}
            <div className="mt-auto space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Jami nuqtalar:</span>
                <span className="font-mono font-bold text-white">{activePlan?.pins?.length || 0} ta</span>
              </div>
              <div className="flex items-center justify-between">
                <span>1-Bosqich (Kabel tortilgan):</span>
                <span className="font-mono font-bold text-sky-400">
                  {activePlan?.pins?.filter(p => p.status === 'cabled').length || 0} ta
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>2-Bosqich (O'rnatilgan):</span>
                <span className="font-mono font-bold text-emerald-400">
                  {activePlan?.pins?.filter(p => p.status === 'installed' || p.status === 'tested').length || 0} ta
                </span>
              </div>

              {/* Upload or Change floor plan image */}
              <label className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>{activePlan?.planImageUrl ? "Chizmani o'zgartirish" : "2D Chizmani yuklash"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePlanImageUpload}
                  className="hidden"
                />
              </label>

              {activePlan && floorPlans.length > 1 && (
                <button
                  onClick={() => handleDeleteFloor(activePlan.id)}
                  className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-xl font-bold border border-rose-800/40 transition text-[11px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ushbu Qavatni O'chirish</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* INTERACTIVE CANVAS AREA */}
        {/* ========================================================================= */}
        <div
          ref={containerRef}
          className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center cursor-crosshair"
          onMouseDown={(e) => {
            if (e.button === 0 && !isAddingPinMode) {
              setIsDraggingPan(true);
              setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
            }
          }}
          onMouseMove={(e) => {
            if (isDraggingPan) {
              setPanPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
              });
            }
          }}
          onMouseUp={() => setIsDraggingPan(false)}
          onMouseLeave={() => setIsDraggingPan(false)}
        >
          {/* Zoom & Canvas Floating Controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-2xl">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Yaqinlashtirish"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs px-2 font-bold text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Uzoqlashtirish"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setPanPosition({ x: 0, y: 0 });
              }}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Asl holatga qaytarish"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Empty Blueprint Placeholder */}
          {!activePlan?.planImageUrl && (
            <div className="p-8 max-w-md text-center bg-slate-900/80 border border-dashed border-slate-700 rounded-3xl space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mx-auto">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">2D Sxema yoki Chizma Mavjud Emas</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ushbu obyekt uchun arxitekturaviy loyiha, qavat chizmasi yoki qo'lda chizilgan eskiz suratini yuklang.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-sky-600/20 cursor-pointer transition">
                <Upload className="w-4 h-4" />
                <span>Loyihani Yuklash (JPG / PNG)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePlanImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Render Active Plan Canvas & Pins */}
          {activePlan?.planImageUrl && (
            <div
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: isDraggingPan ? 'none' : 'transform 0.1s ease-out'
              }}
              className="relative inline-block"
              onClick={handleCanvasClick}
            >
              <img
                ref={imageRef}
                src={activePlan.planImageUrl}
                alt={activePlan.title}
                className="max-h-[80vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border border-slate-800 pointer-events-auto"
                draggable={false}
              />

              {/* Render Interactive Pins */}
              {activePlan.pins?.map((pin) => {
                const pinConf = PIN_CONFIG[pin.pinType] || PIN_CONFIG.other;
                const statusConf = STATUS_CONFIG[pin.status] || STATUS_CONFIG.cabled;
                const isSelected = selectedPin?.id === pin.id;
                const hasCoverageCone = (pin.coverageAngle || 0) > 0 && (pin.pinType.includes('camera') || pin.pinType === 'intercom_outdoor' || pin.pinType === 'motion_sensor');

                return (
                  <div
                    key={pin.id}
                    style={{
                      left: `${pin.xPercent}%`,
                      top: `${pin.yPercent}%`
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPin(pin);
                      setIsPinModalOpen(true);
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                  >
                    {/* Visual Coverage Cone / Viewing Angle Sector */}
                    {hasCoverageCone && (
                      <div
                        style={{
                          transform: `rotate(${pin.rotationAngle || 0}deg)`,
                          transformOrigin: 'center center'
                        }}
                        className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10"
                      >
                        <div
                          style={{
                            clipPath: `polygon(50% 50%, ${50 - Math.tan(((pin.coverageAngle || 90) / 2) * (Math.PI / 180)) * 50}% 0%, ${50 + Math.tan(((pin.coverageAngle || 90) / 2) * (Math.PI / 180)) * 50}% 0%)`,
                            width: '120px',
                            height: '120px'
                          }}
                          className={`opacity-30 group-hover:opacity-60 transition duration-300 ${
                            pin.status === 'installed' || pin.status === 'tested'
                              ? 'bg-gradient-to-t from-emerald-500/80 to-emerald-400/20'
                              : 'bg-gradient-to-t from-amber-500/80 to-amber-400/20'
                          }`}
                        />
                      </div>
                    )}

                    {/* Pin Marker Badge */}
                    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-2xl transition transform group-hover:scale-125 ${
                      statusConf.pinBorder
                    } ${pinConf.bgColor}`}>
                      <span className="text-xs">{pinConf.icon}</span>

                      {/* Direction Arrow if Camera */}
                      {hasCoverageCone && (
                        <div
                          style={{ transform: `rotate(${pin.rotationAngle || 0}deg)` }}
                          className="absolute -top-1 w-1.5 h-1.5 bg-white rounded-full shadow"
                        />
                      )}

                      {/* Photos Count Badge */}
                      {pin.photos && pin.photos.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-600 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center border border-slate-900 shadow">
                          {pin.photos.length}
                        </span>
                      )}
                    </div>

                    {/* Hover Tooltip Label */}
                    <div className="absolute top-9 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700 shadow-2xl text-[10px] whitespace-nowrap z-30 pointer-events-none">
                      <span className="font-bold text-white">{pin.label}</span>
                      <span className="text-slate-400">{pin.roomName}</span>
                      <span className={`font-semibold ${statusConf.color}`}>{statusConf.label}</span>
                      {pin.cableLengthMeters && (
                        <span className="text-sky-400 font-mono">Kabel: {pin.cableLengthMeters}m ({pin.cableType || 'UTP'})</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PIN DETAIL & EDIT MODAL (CHERNOVOY + CHISTOVOY TAFSILOTLARI) */}
      {/* ========================================================================= */}
      {isPinModalOpen && selectedPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${PIN_CONFIG[selectedPin.pinType]?.bgColor || 'bg-sky-500'} text-white shadow-lg`}>
                  <span className="text-lg">{PIN_CONFIG[selectedPin.pinType]?.icon}</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>{selectedPin.label}</span>
                    <span className="text-xs font-mono text-slate-400">({selectedPin.roomName})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tur: <b className="text-slate-200">{PIN_CONFIG[selectedPin.pinType]?.label}</b>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isReadOnly && (
                  <button
                    onClick={() => handleDeletePin(selectedPin.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Nuqtani o'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsPinModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stage Status Selector */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-300">Montaj Bosqichi & Holati:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(STATUS_CONFIG) as (keyof typeof STATUS_CONFIG)[]).map((stKey) => {
                  const st = STATUS_CONFIG[stKey];
                  const isCur = selectedPin.status === stKey;
                  return (
                    <button
                      key={stKey}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => setSelectedPin({ ...selectedPin, status: stKey })}
                      className={`p-2 rounded-xl text-xs font-bold border transition text-left ${
                        isCur
                          ? `${st.bg} ${st.color} ring-1 ring-white/20`
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic Room & Location Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nuqta Nomi / Belgisi *</label>
                <input
                  disabled={isReadOnly}
                  value={selectedPin.label}
                  onChange={(e) => setSelectedPin({ ...selectedPin, label: e.target.value })}
                  placeholder="Kamera #1"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-sky-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Xona / Joylashuv Nomi *</label>
                <input
                  disabled={isReadOnly}
                  value={selectedPin.roomName}
                  onChange={(e) => setSelectedPin({ ...selectedPin, roomName: e.target.value })}
                  placeholder="Mehmonxona - Fasad"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 1-BOSQICH: CHERNOVOY / KABEL MONTAJ MA'LUMOTLARI */}
            <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🔌</span>
                <h4 className="text-xs font-black uppercase tracking-wider text-sky-400">
                  1-Bosqich (Chernovoy): Kabel & Trassa Ma'lumotlari
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Kabel Turi & Markasi</label>
                  <select
                    disabled={isReadOnly}
                    value={selectedPin.cableType || 'UTP Cat6 Mis Tashqi'}
                    onChange={(e) => setSelectedPin({ ...selectedPin, cableType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="UTP Cat6 Mis Tashqi (Outdoor)">UTP Cat6 Mis Tashqi (Outdoor)</option>
                    <option value="UTP Cat5e Ichki (Indoor)">UTP Cat5e Ichki (Indoor)</option>
                    <option value="FTP Cat6 Ekranli">FTP Cat6 Ekranli</option>
                    <option value="Koaksial RG-6 + Quvvat (Kombinirovanniy)">Koaksial RG-6 + Quvvat</option>
                    <option value="ShVVP 2x0.75 Quvvat">ShVVP 2x0.75 Quvvat kabeli</option>
                    <option value="Optika FTTH 1/2 core">Optika FTTH 1/2 core</option>
                    <option value="Boshqa">Boshqa kabel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Kabel Uzunligi (metr)</label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={selectedPin.cableLengthMeters || 25}
                    onChange={(e) => setSelectedPin({ ...selectedPin, cableLengthMeters: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-sky-500 focus:outline-none font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Trassa Yo'nalishi & Zaxira Izohi</label>
                <input
                  disabled={isReadOnly}
                  value={selectedPin.cableRouteNotes || ''}
                  onChange={(e) => setSelectedPin({ ...selectedPin, cableRouteNotes: e.target.value })}
                  placeholder="Gipsokarton shift orqasidan, 1.8m zaxira qoldirilgan, balandligi 2.8m"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-sky-500 focus:outline-none text-xs"
                />
              </div>
            </div>

            {/* 2-BOSQICH: CHISTOVOY / QURILMA & ANGLE MA'LUMOTLARI */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📹</span>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  2-Bosqich (Chistovoy): Qurilma & Yo'nalish Burchagi
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Rejadagi / O'rnatilgan Qurilma Modeli</label>
                  <input
                    disabled={isReadOnly}
                    value={selectedPin.plannedProduct || ''}
                    onChange={(e) => setSelectedPin({ ...selectedPin, plannedProduct: e.target.value })}
                    placeholder="Hikvision DS-2CD1043G0-I 4MP"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Seriya Raqami (S/N)</label>
                  <input
                    disabled={isReadOnly}
                    value={selectedPin.serialNumber || ''}
                    onChange={(e) => setSelectedPin({ ...selectedPin, serialNumber: e.target.value })}
                    placeholder="HK-4MP-982101"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 focus:border-emerald-500 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Angles & View Direction Slider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
                    <span>Yo'nalish burchagi (Azimut):</span>
                    <span className="font-mono text-emerald-400">{selectedPin.rotationAngle || 0}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    disabled={isReadOnly}
                    value={selectedPin.rotationAngle || 0}
                    onChange={(e) => setSelectedPin({ ...selectedPin, rotationAngle: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
                    <span>Qamrov burchagi (FOV):</span>
                    <span className="font-mono text-sky-400">{selectedPin.coverageAngle || 90}°</span>
                  </div>
                  <select
                    disabled={isReadOnly}
                    value={selectedPin.coverageAngle || 90}
                    onChange={(e) => setSelectedPin({ ...selectedPin, coverageAngle: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="60">60° (Tor burchak / Uzun masofa)</option>
                    <option value="90">90° (Standart 2.8mm / 3.6mm linza)</option>
                    <option value="110">110° (Keng burchakli kamera / Domofon)</option>
                    <option value="180">180° (Panoramik)</option>
                    <option value="360">360° (PTZ / FishEye gumbaz)</option>
                    <option value="0">0° (Konussiz / Statik nuqta)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SUVODAN OLDINGI VA KEYINGI SURATLAR (PHOTO GALLERY) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Suvoqdan oldingi xona & Kabel suratlari
                  </h4>
                </div>

                {!isReadOnly && (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer transition">
                      <Camera className="w-3.5 h-3.5" />
                      <span>🔌 1-Kabel surati</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleAddPinPhoto(e, 'cabling')}
                        className="hidden"
                      />
                    </label>

                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition">
                      <Camera className="w-3.5 h-3.5" />
                      <span>📹 2-Qurilma surati</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleAddPinPhoto(e, 'device')}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Photo Thumbnails */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedPin.photos?.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center cursor-pointer"
                    onClick={() => setPreviewPhotoUrl(photo.url)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded w-max mb-1 ${
                        photo.stage === 'cabling' ? 'bg-sky-500 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                        {photo.stage === 'cabling' ? '🔌 Kabel / Suvoq oldi' : '📹 Qurilma'}
                      </span>
                      <span className="text-[10px] text-slate-200 truncate font-semibold">
                        {photo.caption || photo.takenAt}
                      </span>
                    </div>

                    {!isReadOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPin({
                            ...selectedPin,
                            photos: selectedPin.photos?.filter(p => p.id !== photo.id)
                          });
                        }}
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition shadow"
                        title="Suratni o'chirish"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                {(!selectedPin.photos || selectedPin.photos.length === 0) && (
                  <div className="col-span-full py-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl text-xs">
                    Suvoqdan oldingi xona va kabel suratlari hali yuklanmagan. Mobil kameradan suratga oling.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-xs"
              >
                Yopish
              </button>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleSavePin(selectedPin)}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20"
                >
                  Nuqtani Saqlash
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD NEW FLOOR / DRAWING */}
      {/* ========================================================================= */}
      {isAddFloorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              Yangi Qavat yoki Sxema Qo'shish
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Qavat / Zona Nomi:</label>
              <input
                value={newFloorTitle}
                onChange={(e) => setNewFloorTitle(e.target.value)}
                placeholder="Masalan: 2-Qavat, Hovli & Fasad, Garaj"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-sky-500 focus:outline-none font-bold"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddFloorModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleAddNewFloor}
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg"
              >
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LIGHTBOX PREVIEW PHOTO */}
      {/* ========================================================================= */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in cursor-zoom-out"
        >
          <img
            src={previewPhotoUrl}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-slate-800"
          />
        </div>
      )}
    </div>
  );
};
