'use client';

import React, { useState, useMemo } from 'react';
import { 
  HardDrive, 
  X, 
  Calculator, 
  Clock, 
  Calendar, 
  Video, 
  Tv, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  Layers, 
  Info,
  Mic,
  Activity,
  Sliders,
  RotateCcw
} from 'lucide-react';
import { formatNumberWithSpaces } from '../utils/formatters';

export type CctvBrand = 'hikvision' | 'dahua' | 'unv' | 'tiandy' | 'vigi' | 'universal';
export type CctvCodec = 'smart_h265' | 'h265' | 'h264';
export type RecordingMode = 'continuous_24' | 'motion' | 'business_12' | 'custom_hours';
export type CalcMode = 'days_to_hdd' | 'hdd_to_days';

interface HddCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BRAND_CONFIGS: Record<CctvBrand, { name: string; smartCodecName: string; color: string; bg: string }> = {
  hikvision: { name: 'Hikvision', smartCodecName: 'H.265+ (Smart Codec)', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/40' },
  dahua: { name: 'Dahua', smartCodecName: 'Smart H.265+', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/40' },
  unv: { name: 'Uniview (UNV)', smartCodecName: 'Ultra 265 (U-Code)', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40' },
  tiandy: { name: 'Tiandy', smartCodecName: 'S+265 Codec', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40' },
  vigi: { name: 'TP-Link VIGI', smartCodecName: 'VIGI Smart Coding', color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/40' },
  universal: { name: 'Universal / Boshqa', smartCodecName: 'Smart H.265', color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/40' }
};

const RESOLUTION_OPTIONS = [
  { value: 1.0, label: '1.0 MP (720p HD)', baseBitrateH264: 2048 },
  { value: 2.0, label: '2.0 MP (1080p Full HD)', baseBitrateH264: 4096 },
  { value: 3.0, label: '3.0 MP (2K Super HD)', baseBitrateH264: 6144 },
  { value: 4.0, label: '4.0 MP (2K QHD)', baseBitrateH264: 8192 },
  { value: 5.0, label: '5.0 MP (3K Ultra)', baseBitrateH264: 10240 },
  { value: 6.0, label: '6.0 MP', baseBitrateH264: 12288 },
  { value: 8.0, label: '8.0 MP (4K Ultra HD)', baseBitrateH264: 16384 },
  { value: 12.0, label: '12.0 MP (4K Max Pro)', baseBitrateH264: 24576 }
];

const STANDARD_HDD_SIZES = [
  { tb: 0.5, gb: 500, label: '500 GB' },
  { tb: 1, gb: 1000, label: '1 TB (1000 GB)' },
  { tb: 2, gb: 2000, label: '2 TB (2000 GB)' },
  { tb: 3, gb: 3000, label: '3 TB' },
  { tb: 4, gb: 4000, label: '4 TB (4000 GB)' },
  { tb: 6, gb: 6000, label: '6 TB' },
  { tb: 8, gb: 8000, label: '8 TB (8000 GB)' },
  { tb: 10, gb: 10000, label: '10 TB' },
  { tb: 16, gb: 16000, label: '16 TB' }
];

export const HddCalculatorModal: React.FC<HddCalculatorModalProps> = ({ isOpen, onClose }) => {
  // Mode: 'days_to_hdd' (Necha kun kerak -> Qancha HDD) yoki 'hdd_to_days' (Qo'yilgan HDD -> Necha kunga yetadi)
  const [calcMode, setCalcMode] = useState<CalcMode>('days_to_hdd');

  // Parameters
  const [brand, setBrand] = useState<CctvBrand>('hikvision');
  const [cameraCount, setCameraCount] = useState<number>(4);
  const [resolution, setResolution] = useState<number>(2.0);
  const [codec, setCodec] = useState<CctvCodec>('smart_h265');
  const [fps, setFps] = useState<number>(25);
  const [hasAudio, setHasAudio] = useState<boolean>(true);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('continuous_24');
  const [customDailyHours, setCustomDailyHours] = useState<number>(14);

  // Target values
  const [targetDays, setTargetDays] = useState<number>(15);
  const [selectedHddCapacityGB, setSelectedHddCapacityGB] = useState<number>(2000); // 2TB default
  const [isCustomHdd, setIsCustomHdd] = useState<boolean>(false);
  const [customHddGB, setCustomHddGB] = useState<number>(2000);

  if (!isOpen) return null;

  // Calculation Logic
  const calculationResults = useMemo(() => {
    const safeCamCount = isNaN(cameraCount) || cameraCount <= 0 ? 1 : cameraCount;
    const safeTargetDays = isNaN(targetDays) || targetDays <= 0 ? 15 : targetDays;
    const safeCustomHddGB = isNaN(customHddGB) || customHddGB <= 0 ? 2000 : customHddGB;
    const safeDailyHours = isNaN(customDailyHours) || customDailyHours <= 0 ? 14 : customDailyHours;

    const resConfig = RESOLUTION_OPTIONS.find(r => r.value === resolution) || RESOLUTION_OPTIONS[1];
    let baseBitrate = resConfig.baseBitrateH264;

    // Apply Codec compression ratio
    if (codec === 'smart_h265') {
      baseBitrate = Math.round(baseBitrate * 0.25); // ~75% savings
    } else if (codec === 'h265') {
      baseBitrate = Math.round(baseBitrate * 0.50); // ~50% savings
    } else {
      baseBitrate = Math.round(baseBitrate * 1.0); // H.264
    }

    // Apply FPS multiplier
    const fpsMultiplier = fps >= 25 ? 1.0 : fps >= 20 ? 0.85 : fps >= 15 ? 0.70 : 0.55;
    let cameraBitrateKbps = Math.round(baseBitrate * fpsMultiplier);

    // Audio stream add (~64 kbps per camera)
    if (hasAudio) {
      cameraBitrateKbps += 64;
    }

    // Total bitrate for all cameras
    const totalBitrateKbps = cameraBitrateKbps * safeCamCount;

    // Daily active recording hours
    let hoursPerDay = 24;
    if (recordingMode === 'motion') {
      hoursPerDay = 10; // 10 active hours of motion per day
    } else if (recordingMode === 'business_12') {
      hoursPerDay = 12; // 12 hours office/shop
    } else if (recordingMode === 'custom_hours') {
      hoursPerDay = Math.max(1, Math.min(24, safeDailyHours));
    }

    // Daily consumption in GB: (Kbps * 3600 * hours) / (8 * 1024 * 1024)
    const dailyConsumptionGB = Number(((totalBitrateKbps * 3600 * hoursPerDay) / (8 * 1024 * 1024)).toFixed(2));
    const hourlyConsumptionGB = Number((dailyConsumptionGB / hoursPerDay).toFixed(2));

    // MODE 1: From Target Days -> Required HDD Size
    const requiredStorageGB = Number((dailyConsumptionGB * safeTargetDays).toFixed(1));
    const requiredStorageTB = Number((requiredStorageGB / 1024).toFixed(2));

    // Find recommended commercial HDD size (factoring in 7% format overhead)
    const neededWithOverheadGB = requiredStorageGB / 0.93;
    const recommendedHdd = STANDARD_HDD_SIZES.find(h => h.gb >= neededWithOverheadGB) || {
      tb: Math.ceil(neededWithOverheadGB / 1000),
      gb: Math.ceil(neededWithOverheadGB / 1000) * 1000,
      label: `${Math.ceil(neededWithOverheadGB / 1000)} TB`
    };

    // MODE 2: From Given HDD Size -> Available Days
    const actualHddGB = isCustomHdd ? safeCustomHddGB : selectedHddCapacityGB;
    const usableHddGB = actualHddGB * 0.93; // 93% usable after file system format
    const totalDaysAvailable = dailyConsumptionGB > 0 ? usableHddGB / dailyConsumptionGB : 0;
    const fullDays = Math.floor(totalDaysAvailable);
    const extraHours = Math.round((totalDaysAvailable - fullDays) * hoursPerDay);

    return {
      cameraBitrateKbps: isNaN(cameraBitrateKbps) ? 1024 : cameraBitrateKbps,
      totalBitrateKbps: isNaN(totalBitrateKbps) ? 4096 : totalBitrateKbps,
      dailyConsumptionGB: isNaN(dailyConsumptionGB) ? 10 : dailyConsumptionGB,
      hourlyConsumptionGB: isNaN(hourlyConsumptionGB) ? 0.4 : hourlyConsumptionGB,
      hoursPerDay,
      // Mode 1 output
      requiredStorageGB: isNaN(requiredStorageGB) ? 150 : requiredStorageGB,
      requiredStorageTB: isNaN(requiredStorageTB) ? 0.15 : requiredStorageTB,
      recommendedHdd: recommendedHdd || { tb: 2, gb: 2000, label: '2 TB (2000 GB)' },
      // Mode 2 output
      actualHddGB: isNaN(actualHddGB) ? 2000 : actualHddGB,
      usableHddGB: isNaN(usableHddGB) ? 1860 : Number(usableHddGB.toFixed(0)),
      totalDaysAvailable: isNaN(totalDaysAvailable) ? 30 : Number(totalDaysAvailable.toFixed(1)),
      fullDays: isNaN(fullDays) ? 30 : fullDays,
      extraHours: isNaN(extraHours) ? 0 : extraHours
    };
  }, [
    resolution, 
    codec, 
    fps, 
    hasAudio, 
    cameraCount, 
    recordingMode, 
    customDailyHours, 
    targetDays, 
    isCustomHdd, 
    customHddGB, 
    selectedHddCapacityGB
  ]);

  const activeBrandConfig = BRAND_CONFIGS[brand] || BRAND_CONFIGS.hikvision;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-900 border-b border-purple-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white">CCTV Qattiq Disk (HDD) Kalkulyatori</h3>
                <span className="text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded">
                  Multi-Brand
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hikvision, Dahua, UNV, Tiandy, VIGI uchun 100% aniq hisoblash
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Main Calculation Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setCalcMode('days_to_hdd')}
              className={`py-2.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                calcMode === 'days_to_hdd'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>1. Disk Hajmini Topish</span>
            </button>

            <button
              type="button"
              onClick={() => setCalcMode('hdd_to_days')}
              className={`py-2.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                calcMode === 'hdd_to_days'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>2. Necha Kunga Yetadi?</span>
            </button>
          </div>

          {/* SECTION 1: CAMERA SPECIFICATIONS */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 space-y-3">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-purple-400" />
              Kamera va Tizim Parametrlari
            </span>

            {/* Brand Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Qurilma / Kamera Brendi:</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                {(Object.keys(BRAND_CONFIGS) as CctvBrand[]).map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(b)}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-black border transition truncate ${
                      brand === b
                        ? `${BRAND_CONFIGS[b].bg} ${BRAND_CONFIGS[b].color} shadow-sm ring-1 ring-white/20`
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {BRAND_CONFIGS[b].name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Cameras Count & Resolution */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Kameralar Soni:</label>
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5">
                  <input
                    type="number"
                    min={1}
                    max={128}
                    value={cameraCount}
                    onChange={(e) => setCameraCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-transparent text-white font-black text-xs outline-none"
                  />
                  <span className="text-[11px] text-slate-400 font-semibold">ta</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Ruxsati (Sifati / MP):</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white font-bold outline-none cursor-pointer"
                >
                  {RESOLUTION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Video Codec & FPS */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Video Siqish (Codec):</label>
                <select
                  value={codec}
                  onChange={(e) => setCodec(e.target.value as CctvCodec)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white font-bold outline-none cursor-pointer"
                >
                  <option value="smart_h265" className="bg-slate-900 text-white">
                    ✨ {activeBrandConfig.smartCodecName}
                  </option>
                  <option value="h265" className="bg-slate-900 text-white">
                    Standard H.265 (HEVC)
                  </option>
                  <option value="h264" className="bg-slate-900 text-white">
                    Oldingi H.264 (Katta hajm)
                  </option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Kadr Tezligi (FPS):</label>
                <select
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white font-bold outline-none cursor-pointer"
                >
                  <option value={25} className="bg-slate-900 text-white">25 fps (To&apos;liq ravon)</option>
                  <option value={20} className="bg-slate-900 text-white">20 fps</option>
                  <option value={15} className="bg-slate-900 text-white">15 fps (Standart tejamkor)</option>
                  <option value={10} className="bg-slate-900 text-white">10 fps (Ekonom)</option>
                </select>
              </div>
            </div>

            {/* Recording Mode & Audio */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Yozib Olish Rejimi:</label>
                <select
                  value={recordingMode}
                  onChange={(e) => setRecordingMode(e.target.value as RecordingMode)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white font-bold outline-none cursor-pointer"
                >
                  <option value="continuous_24" className="bg-slate-900 text-white">🕒 24/7 Doimiy (24 soat)</option>
                  <option value="motion" className="bg-slate-900 text-white">🏃 Datchik / Harakat (10 soat)</option>
                  <option value="business_12" className="bg-slate-900 text-white">🏢 Ish vaqti (12 soat)</option>
                  <option value="custom_hours" className="bg-slate-900 text-white">⚙️ Maxsus soat kiritish</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Ovoz (Mikrofon):</label>
                <button
                  type="button"
                  onClick={() => setHasAudio(!hasAudio)}
                  className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    hasAudio
                      ? 'bg-purple-950 text-purple-300 border-purple-800'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Mic className={`w-3.5 h-3.5 ${hasAudio ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span>{hasAudio ? 'Bor (Audio yoziladi)' : 'Yo\'q (Faqat video)'}</span>
                </button>
              </div>
            </div>

            {/* Custom Hours Input */}
            {recordingMode === 'custom_hours' && (
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold">Kuniga yoziladigan o&apos;rtacha soat:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={customDailyHours}
                    onChange={(e) => setCustomDailyHours(Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))}
                    className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-center outline-none"
                  />
                  <span className="text-slate-400">soat/kun</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: CALCULATION INPUT & OUTPUT */}
          {calcMode === 'days_to_hdd' ? (
            /* ======================================================== */
            /* MODE 1: TARGET DAYS -> REQUIRED HDD */
            /* ======================================================== */
            <div className="space-y-3">
              {/* Target Days Input */}
              <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    Kerakli Saqlash Muddati (Kun):
                  </label>
                  <span className="text-xs font-black text-purple-400 font-mono">{targetDays} kun</span>
                </div>

                <div className="grid grid-cols-5 gap-1 select-none">
                  {[7, 15, 30, 45, 60].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTargetDays(d)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition ${
                        targetDays === d
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d} kun
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min={1}
                  max={120}
                  value={targetDays}
                  onChange={(e) => setTargetDays(parseInt(e.target.value) || 1)}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Result Recommendation Card */}
              <div className="bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-900 border border-purple-800/50 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
                <span className="text-[10px] text-purple-300 uppercase font-extrabold tracking-wider block">
                  Tavsiya Etilgan Qattiq Disk (HDD):
                </span>

                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight flex items-center gap-2">
                      <HardDrive className="w-8 h-8 text-purple-400" />
                      <span>{calculationResults.recommendedHdd.label}</span>
                    </h2>
                    <p className="text-[11px] text-purple-300/80 font-medium mt-0.5">
                      WD Purple / Seagate SkyHawk (Kuzatuv diski)
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Aniq hisoblangan:</span>
                    <strong className="text-sm font-black text-emerald-400 font-mono">
                      {calculationResults.requiredStorageTB >= 1 
                        ? `${calculationResults.requiredStorageTB} TB` 
                        : `${calculationResults.requiredStorageGB} GB`}
                    </strong>
                  </div>
                </div>

                {/* Sub Stats Grid */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs">
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[10px] text-slate-400 block">Kunlik sarf</span>
                    <strong className="text-white font-bold font-mono">{calculationResults.dailyConsumptionGB} GB</strong>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[10px] text-slate-400 block">Kamera oqimi</span>
                    <strong className="text-cyan-400 font-bold font-mono">{calculationResults.cameraBitrateKbps} Kbps</strong>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[10px] text-slate-400 block">Yozuv soati</span>
                    <strong className="text-amber-400 font-bold font-mono">{calculationResults.hoursPerDay} soat/kun</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* MODE 2: GIVEN HDD -> AVAILABLE RECORDING DAYS */
            /* ======================================================== */
            <div className="space-y-3">
              {/* Selected HDD Capacity Selector */}
              <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-white flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    O&apos;rnatilgan yoki Tanlangan Disk (HDD):
                  </label>
                  <span className="text-xs font-black text-emerald-400 font-mono">
                    {isCustomHdd ? `${customHddGB} GB` : (STANDARD_HDD_SIZES.find(h => h.gb === selectedHddCapacityGB)?.label || `${selectedHddCapacityGB} GB`)}
                  </span>
                </div>

                {/* Standard Disk Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 select-none">
                  {STANDARD_HDD_SIZES.slice(0, 8).map(h => (
                    <button
                      key={h.gb}
                      type="button"
                      onClick={() => {
                        setIsCustomHdd(false);
                        setSelectedHddCapacityGB(h.gb);
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center ${
                        !isCustomHdd && selectedHddCapacityGB === h.gb
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>

                {/* Custom GB Input */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomHdd(!isCustomHdd)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition border ${
                      isCustomHdd ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Boshqa hajm (GB)
                  </button>

                  {isCustomHdd && (
                    <div className="flex-1 flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 animate-in fade-in">
                      <input
                        type="number"
                        min={100}
                        max={100000}
                        value={customHddGB}
                        onChange={(e) => setCustomHddGB(Math.max(100, parseInt(e.target.value) || 100))}
                        placeholder="Masalan: 3000"
                        className="w-full bg-transparent text-white font-mono font-bold text-xs outline-none"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">GB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mode 2 Result Card: Total Days */}
              <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-800/50 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                <span className="text-[10px] text-emerald-300 uppercase font-extrabold tracking-wider block">
                  Ushbu Diskda Arxiv Necha Kunga Yetadi:
                </span>

                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight flex items-center gap-2">
                      <Calendar className="w-8 h-8 text-emerald-400" />
                      <span>{calculationResults.fullDays} kun</span>
                    </h2>
                    <p className="text-[11px] text-emerald-300/80 font-medium mt-0.5">
                      {calculationResults.extraHours > 0 
                        ? `≈ ${calculationResults.fullDays} kun-u ${calculationResults.extraHours} soat uzluksiz arxiv` 
                        : `≈ ${calculationResults.fullDays} kun to'liq arxiv saqlanadi`}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Foydali hajm:</span>
                    <strong className="text-xs font-black text-white font-mono">
                      {calculationResults.usableHddGB} GB
                    </strong>
                  </div>
                </div>

                {/* Sub Stats Grid */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs">
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[10px] text-slate-400 block">Kunlik sarf</span>
                    <strong className="text-white font-bold font-mono">{calculationResults.dailyConsumptionGB} GB/kun</strong>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[10px] text-slate-400 block">Kamera soni</span>
                    <strong className="text-cyan-400 font-bold font-mono">{cameraCount} ta ({resolution} MP)</strong>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[10px] text-slate-400 block">Codec</span>
                    <strong className="text-purple-400 font-bold text-[10px] truncate block">
                      {codec === 'smart_h265' ? activeBrandConfig.name : codec.toUpperCase()}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Xalqaro ITU-T H.265+ va NVR standartlari asosida</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
          >
            Yopish
          </button>
        </div>

      </div>
    </div>
  );
};
