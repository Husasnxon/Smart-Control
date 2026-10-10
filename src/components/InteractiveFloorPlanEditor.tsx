'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  ObjectFloorPlan, 
  FloorPlanPin, 
  FloorPlanPinType, 
  FloorPlanPinCategory,
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
  Info,
  Flame,
  Zap,
  DoorClosed,
  Move,
  RotateCw,
  BellRing
} from 'lucide-react';

interface InteractiveFloorPlanEditorProps {
  objectPassport: CrmObjectPassport;
  onSaveObjectPassport: (updatedPassport: CrmObjectPassport) => void;
  onClose: () => void;
  isReadOnly?: boolean;
}

// ============================================================================
// REALISTIC VECTOR SVG DEVICE ICONS (MATCHING USER'S HARDWARE REFERENCES)
// ============================================================================

export const DeviceIconRenderer: React.FC<{ type: FloorPlanPinType; className?: string; size?: number }> = ({ 
  type, 
  className = "w-5 h-5", 
  size 
}) => {
  const customStyle = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  switch (type) {
    // 1. BULLET CAMERA (Matching Image 1: Front lens cone, body, sunshield, mount bracket)
    case 'camera_bullet':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          {/* Mount base & arm */}
          <path d="M6 34C6 31 8 30 11 30H14V26H11C6.5 26 3 29.5 3 34C3 38.5 6.5 42 11 42H14V38H11C8 38 6 37 6 34Z" fill="#64748b"/>
          <rect x="12" y="27" width="6" height="4" rx="1.5" fill="#475569"/>
          {/* Main camera body */}
          <rect x="12" y="14" width="22" height="18" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="2"/>
          {/* Front optical lens cone / sunshield (matching user image 1) */}
          <path d="M34 16L45 10V36L34 30V16Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5"/>
          {/* Lens iris glass */}
          <circle cx="43" cy="23" r="4" fill="#0369a1"/>
          <circle cx="43" cy="23" r="1.5" fill="#e0f2fe"/>
          {/* IR Sensor LEDs */}
          <circle cx="20" cy="18" r="1.5" fill="#ef4444"/>
          <rect x="15" y="21" width="14" height="2" rx="1" fill="#334155"/>
        </svg>
      );

    // 2. DOME CAMERA (Ceiling bubble / gumbaz)
    case 'camera_dome':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          {/* Outer ring base */}
          <circle cx="24" cy="24" r="21" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5"/>
          {/* Inner ring */}
          <circle cx="24" cy="24" r="15" fill="#1e293b" stroke="#0891b2" strokeWidth="1.5"/>
          {/* Smoked glass bubble eyeball */}
          <circle cx="24" cy="24" r="10" fill="#0e7490"/>
          {/* Optical lens center */}
          <circle cx="24" cy="24" r="4.5" fill="#082f49" stroke="#67e8f9" strokeWidth="1.5"/>
          <circle cx="22.5" cy="22.5" r="1.5" fill="#ffffff"/>
        </svg>
      );

    // 3. PTZ CAMERA (360 Rotating speed dome)
    case 'camera_ptz':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          {/* Wall mount arm */}
          <path d="M4 10H14V16L24 16V20" stroke="#6366f1" strokeWidth="3" strokeLinecap="round"/>
          {/* Rotating motorized sphere */}
          <circle cx="24" cy="30" r="14" fill="#0f172a" stroke="#818cf8" strokeWidth="2"/>
          <circle cx="24" cy="30" r="8" fill="#4338ca"/>
          <circle cx="24" cy="30" r="3.5" fill="#0f172a" stroke="#a5b4fc" strokeWidth="1.5"/>
          {/* Rotation arrows indicator */}
          <path d="M12 30A12 12 0 0 1 36 30" stroke="#c7d2fe" strokeWidth="1.5" strokeDasharray="2 2"/>
        </svg>
      );

    // 4. NVR / DVR SERVER RACK
    case 'nvr_server':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="10" width="40" height="28" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="2"/>
          {/* HDD Bays */}
          <rect x="8" y="16" width="20" height="5" rx="1" fill="#1e293b" stroke="#475569"/>
          <rect x="8" y="24" width="20" height="5" rx="1" fill="#1e293b" stroke="#475569"/>
          {/* Front LCD & Status LEDs */}
          <rect x="32" y="16" width="8" height="5" rx="1" fill="#fbbf24"/>
          <circle cx="34" cy="27" r="1.5" fill="#22c55e"/>
          <circle cx="38" cy="27" r="1.5" fill="#38bdf8"/>
          {/* Power Button */}
          <circle cx="36" cy="33" r="2" fill="#ef4444"/>
        </svg>
      );

    // 5. WI-FI ROUTER 4-5 ANTENNAS (Matching Image 2: TP-Link Black Router with 4 Antennas)
    case 'wifi_router':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          {/* 4 Tall Antennas (Matching Image 2) */}
          <rect x="8" y="4" width="2.5" height="22" rx="1" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8"/>
          <rect x="17" y="4" width="2.5" height="22" rx="1" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8"/>
          <rect x="29" y="4" width="2.5" height="22" rx="1" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8"/>
          <rect x="38" y="4" width="2.5" height="22" rx="1" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8"/>
          {/* Geometric Angular Router Body (Matching Image 2) */}
          <path d="M4 36L10 24H38L44 36L24 40L4 36Z" fill="#0f172a" stroke="#60a5fa" strokeWidth="2"/>
          {/* Top faceted ridges */}
          <path d="M10 24L24 34L38 24" stroke="#334155" strokeWidth="1.5"/>
          {/* Green Status LED array (Matching Image 2) */}
          <circle cx="16" cy="37" r="1" fill="#22c55e"/>
          <circle cx="20" cy="37.5" r="1" fill="#22c55e"/>
          <circle cx="24" cy="38" r="1.2" fill="#22c55e"/>
          <circle cx="28" cy="37.5" r="1" fill="#22c55e"/>
          <circle cx="32" cy="37" r="1" fill="#22c55e"/>
        </svg>
      );

    // 6. CEILING ACCESS POINT (Matching Image 4: White Circular Ceiling AP Disc)
    case 'wifi_ap':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          {/* Outer white disc with subtle shadow (Matching Image 4) */}
          <circle cx="24" cy="24" r="21" fill="#f8fafc" stroke="#3b82f6" strokeWidth="2"/>
          {/* Subtle textured ring */}
          <circle cx="24" cy="24" r="16" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 2"/>
          {/* Inner center disc */}
          <circle cx="24" cy="24" r="9" fill="#e2e8f0"/>
          {/* Central logo mark & blue status LED */}
          <path d="M22 22C22 20.9 22.9 20 24 20C25.1 20 26 20.9 26 22C26 23.1 25.1 24 24 24" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="24" cy="38" r="1.5" fill="#3b82f6"/>
        </svg>
      );

    // 7. POE SWITCH / PATCH PANEL
    case 'switch_poe':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="15" width="40" height="18" rx="3" fill="#0f172a" stroke="#a855f7" strokeWidth="2"/>
          {/* RJ-45 Port Pairs with LEDs */}
          <rect x="8" y="20" width="4" height="6" rx="0.5" fill="#1e293b" stroke="#7e22ce"/>
          <rect x="14" y="20" width="4" height="6" rx="0.5" fill="#1e293b" stroke="#7e22ce"/>
          <rect x="20" y="20" width="4" height="6" rx="0.5" fill="#1e293b" stroke="#7e22ce"/>
          <rect x="26" y="20" width="4" height="6" rx="0.5" fill="#1e293b" stroke="#7e22ce"/>
          <rect x="32" y="20" width="4" height="6" rx="0.5" fill="#1e293b" stroke="#7e22ce"/>
          {/* Green PoE activity dots */}
          <circle cx="10" cy="18" r="0.8" fill="#22c55e"/>
          <circle cx="16" cy="18" r="0.8" fill="#22c55e"/>
          <circle cx="22" cy="18" r="0.8" fill="#22c55e"/>
          <circle cx="28" cy="18" r="0.8" fill="#22c55e"/>
          <circle cx="34" cy="18" r="0.8" fill="#22c55e"/>
          <circle cx="40" cy="24" r="1.5" fill="#eab308"/>
        </svg>
      );

    // 8. BLACK TOWER UPS / QUVVAT BLOKI (Matching Image 3: Tower UPS with Blue LCD)
    case 'ups_battery':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          {/* Black Tower Housing (Matching Image 3) */}
          <rect x="10" y="4" width="28" height="40" rx="3" fill="#090d16" stroke="#eab308" strokeWidth="2"/>
          {/* Blue Illuminated LCD Screen (Matching Image 3) */}
          <rect x="15" y="9" width="18" height="11" rx="1.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1"/>
          <text x="18" y="17" fill="#ffffff" fontSize="5" fontFamily="monospace" fontWeight="bold">220V</text>
          {/* Front Control Buttons */}
          <rect x="15" y="22" width="4" height="2" rx="0.5" fill="#64748b"/>
          <rect x="22" y="22" width="4" height="2" rx="0.5" fill="#64748b"/>
          <rect x="29" y="22" width="4" height="2" rx="0.5" fill="#64748b"/>
          {/* Front Ventilation Louver Grille (Matching Image 3) */}
          <line x1="14" y1="27" x2="34" y2="27" stroke="#334155" strokeWidth="1.5"/>
          <line x1="14" y1="30" x2="34" y2="30" stroke="#334155" strokeWidth="1.5"/>
          <line x1="14" y1="33" x2="34" y2="33" stroke="#334155" strokeWidth="1.5"/>
          <line x1="14" y1="36" x2="34" y2="36" stroke="#334155" strokeWidth="1.5"/>
          <line x1="14" y1="39" x2="34" y2="39" stroke="#334155" strokeWidth="1.5"/>
        </svg>
      );

    // 9. 12V POWER BOX / POWER SUPPLY
    case 'power_box':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="32" height="32" rx="3" fill="#0f172a" stroke="#eab308" strokeWidth="2"/>
          <path d="M24 14L19 25H25L23 34L30 23H24L26 14H24Z" fill="#eab308"/>
          <circle cx="34" cy="14" r="1.5" fill="#22c55e"/>
        </svg>
      );

    // 10. FIRE / SECURITY STROBE SIREN (Matching Image 5: Red Strobe Flash Top, White Speaker Body)
    case 'siren_strobe':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          {/* Red Strobe Flasher Lens Top (Matching Image 5) */}
          <path d="M12 18C12 10 16 6 24 6C32 6 36 10 36 18H12Z" fill="#dc2626" stroke="#f87171" strokeWidth="1.5"/>
          {/* Strobe internal reflector highlights */}
          <path d="M17 14C17 11 20 9 24 9C28 9 31 11 31 14" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round"/>
          {/* White Bottom Speaker Enclosure (Matching Image 5) */}
          <path d="M10 18H38V38C38 41 35 43 32 43H16C13 43 10 41 10 38V18Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2"/>
          {/* Sound acoustic grill / tamper screw (Matching Image 5) */}
          <circle cx="24" cy="35" r="2" fill="#475569"/>
          <line x1="18" y1="26" x2="30" y2="26" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="20" y1="30" x2="28" y2="30" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );

    // 11. PIR MOTION SENSOR (Harakat datchigi)
    case 'motion_sensor':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="8" width="24" height="32" rx="4" fill="#0f172a" stroke="#f43f5e" strokeWidth="2"/>
          {/* Fresnel Lens Grid */}
          <rect x="16" y="14" width="16" height="14" rx="2" fill="#fda4af" stroke="#f43f5e" strokeWidth="1"/>
          <line x1="16" y1="21" x2="32" y2="21" stroke="#e11d48" strokeWidth="1"/>
          <line x1="24" y1="14" x2="24" y2="28" stroke="#e11d48" strokeWidth="1"/>
          {/* Red detection LED */}
          <circle cx="24" cy="34" r="2" fill="#ef4444"/>
        </svg>
      );

    // 12. SMOKE DETECTOR (Tutun datchigi)
    case 'smoke_sensor':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" fill="#0f172a" stroke="#f97316" strokeWidth="2"/>
          {/* Radial intake vents */}
          <circle cx="24" cy="24" r="13" fill="#1e293b" stroke="#ea580c" strokeWidth="1.5" strokeDasharray="4 2"/>
          <circle cx="24" cy="24" r="6" fill="#f97316"/>
          <circle cx="24" cy="24" r="2" fill="#ffffff"/>
        </svg>
      );

    // 13. GAS SENSOR (Gaz datchigi)
    case 'gas_sensor':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="8" width="28" height="32" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="2"/>
          {/* Gas grill */}
          <circle cx="24" cy="20" r="7" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5"/>
          <line x1="20" y1="20" x2="28" y2="20" stroke="#f59e0b" strokeWidth="1.5"/>
          <line x1="24" y1="16" x2="24" y2="24" stroke="#f59e0b" strokeWidth="1.5"/>
          <circle cx="18" cy="33" r="1.5" fill="#22c55e"/>
          <circle cx="24" cy="33" r="1.5" fill="#eab308"/>
          <circle cx="30" cy="33" r="1.5" fill="#ef4444"/>
        </svg>
      );

    // 14. INTERCOM OUTDOOR PANEL (Domofon chaqiruv paneli)
    case 'intercom_outdoor':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="6" width="24" height="36" rx="3" fill="#0f172a" stroke="#10b981" strokeWidth="2"/>
          {/* Camera lens */}
          <circle cx="24" cy="15" r="4" fill="#065f46" stroke="#34d399" strokeWidth="1.5"/>
          <circle cx="24" cy="15" r="1.5" fill="#ffffff"/>
          {/* Speaker slits */}
          <line x1="18" y1="23" x2="30" y2="23" stroke="#475569" strokeWidth="1.5"/>
          <line x1="18" y1="26" x2="30" y2="26" stroke="#475569" strokeWidth="1.5"/>
          {/* Call Bell Button with Light */}
          <circle cx="24" cy="34" r="4.5" fill="#047857" stroke="#6ee7b7" strokeWidth="1.5"/>
          <circle cx="24" cy="34" r="1.5" fill="#ffffff"/>
        </svg>
      );

    // 15. INTERCOM MONITOR (Domofon ekrani)
    case 'intercom_monitor':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="10" width="40" height="28" rx="3" fill="#0f172a" stroke="#14b8a6" strokeWidth="2"/>
          {/* Screen area */}
          <rect x="8" y="14" width="26" height="20" rx="1.5" fill="#042f2e" stroke="#0d9488" strokeWidth="1"/>
          {/* Touch buttons on side */}
          <circle cx="38" cy="18" r="2" fill="#14b8a6"/>
          <circle cx="38" cy="24" r="2" fill="#10b981"/>
          <circle cx="38" cy="30" r="2" fill="#ef4444"/>
        </svg>
      );

    // 16. SMART LOCK (Aqlli elektron qulf)
    case 'smart_lock':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          <rect x="14" y="6" width="20" height="36" rx="4" fill="#0f172a" stroke="#8b5cf6" strokeWidth="2"/>
          {/* Keypad dots */}
          <circle cx="20" cy="13" r="1.2" fill="#c4b5fd"/>
          <circle cx="24" cy="13" r="1.2" fill="#c4b5fd"/>
          <circle cx="28" cy="13" r="1.2" fill="#c4b5fd"/>
          <circle cx="20" cy="18" r="1.2" fill="#c4b5fd"/>
          <circle cx="24" cy="18" r="1.2" fill="#c4b5fd"/>
          <circle cx="28" cy="18" r="1.2" fill="#c4b5fd"/>
          {/* Handle */}
          <rect x="10" y="27" width="28" height="4" rx="2" fill="#7c3aed"/>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} style={customStyle} xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="18" fill="#1e293b" stroke="#94a3b8" strokeWidth="2"/>
          <circle cx="24" cy="24" r="6" fill="#38bdf8"/>
        </svg>
      );
  }
};

// ============================================================================
// PIN CONFIG & CATEGORIES
// ============================================================================

export interface PinConfigItem {
  label: string;
  category: FloorPlanPinCategory;
  color: string;
  bgColor: string;
  borderColor: string;
  defaultCoverage: number;
  isDirectional: boolean;
}

export const PIN_CONFIG: Record<FloorPlanPinType, PinConfigItem> = {
  // CCTV (Videokuzatuv)
  camera_bullet: { label: 'Kamera Bullet (Tashqi)', category: 'cctv', color: 'text-sky-400', bgColor: 'bg-sky-600', borderColor: 'border-sky-400', defaultCoverage: 90, isDirectional: true },
  camera_dome: { label: 'Kamera Dome (Gumbaz)', category: 'cctv', color: 'text-cyan-400', bgColor: 'bg-cyan-600', borderColor: 'border-cyan-400', defaultCoverage: 90, isDirectional: true },
  camera_ptz: { label: 'Kamera PTZ (360° Aylanuvchi)', category: 'cctv', color: 'text-indigo-400', bgColor: 'bg-indigo-600', borderColor: 'border-indigo-400', defaultCoverage: 360, isDirectional: false },
  nvr_server: { label: 'NVR / DVR Server Shchiti', category: 'cctv', color: 'text-amber-400', bgColor: 'bg-amber-600', borderColor: 'border-amber-400', defaultCoverage: 0, isDirectional: false },

  // INTERCOM & ACCESS (Domofoniya)
  intercom_outdoor: { label: 'Domofon Chaqiruv Paneli', category: 'intercom', color: 'text-emerald-400', bgColor: 'bg-emerald-600', borderColor: 'border-emerald-400', defaultCoverage: 110, isDirectional: true },
  intercom_monitor: { label: 'Domofon Ekrani (Monitor)', category: 'intercom', color: 'text-teal-400', bgColor: 'bg-teal-600', borderColor: 'border-teal-400', defaultCoverage: 0, isDirectional: false },
  smart_lock: { label: 'Aqlli Elektron Qulf', category: 'intercom', color: 'text-violet-400', bgColor: 'bg-violet-600', borderColor: 'border-violet-400', defaultCoverage: 0, isDirectional: false },

  // NETWORK (Tarmoq & Wi-Fi)
  wifi_router: { label: 'Wi-Fi Router (4-5 Antenna)', category: 'network', color: 'text-blue-400', bgColor: 'bg-blue-600', borderColor: 'border-blue-400', defaultCoverage: 360, isDirectional: false },
  wifi_ap: { label: 'Shift Wi-Fi AP (Doira)', category: 'network', color: 'text-blue-300', bgColor: 'bg-sky-500', borderColor: 'border-blue-300', defaultCoverage: 360, isDirectional: false },
  switch_poe: { label: 'PoE Switch & Patch-panel', category: 'network', color: 'text-purple-400', bgColor: 'bg-purple-600', borderColor: 'border-purple-400', defaultCoverage: 0, isDirectional: false },

  // ALARM & FIRE (Yong'in & Xavfsizlik)
  siren_strobe: { label: 'Sirena & Mayak (Qizil Chiroq)', category: 'alarm_fire', color: 'text-rose-400', bgColor: 'bg-rose-600', borderColor: 'border-rose-400', defaultCoverage: 180, isDirectional: true },
  motion_sensor: { label: 'PIR Harakat Datchigi', category: 'alarm_fire', color: 'text-rose-300', bgColor: 'bg-rose-500', borderColor: 'border-rose-300', defaultCoverage: 90, isDirectional: true },
  smoke_sensor: { label: 'Tutun / Yong\'in Datchigi', category: 'alarm_fire', color: 'text-orange-400', bgColor: 'bg-orange-600', borderColor: 'border-orange-400', defaultCoverage: 360, isDirectional: false },
  gas_sensor: { label: 'Gaz Sizish Datchigi', category: 'alarm_fire', color: 'text-amber-300', bgColor: 'bg-amber-500', borderColor: 'border-amber-300', defaultCoverage: 360, isDirectional: false },

  // POWER (Quvvat & Elektr)
  ups_battery: { label: 'UPS Zaxira Manbai (Displey)', category: 'power', color: 'text-yellow-400', bgColor: 'bg-yellow-600', borderColor: 'border-yellow-400', defaultCoverage: 0, isDirectional: false },
  power_box: { label: '12V Quvvat Bloki', category: 'power', color: 'text-yellow-300', bgColor: 'bg-yellow-500', borderColor: 'border-yellow-300', defaultCoverage: 0, isDirectional: false },
  other: { label: 'Boshqa Nuqta', category: 'cctv', color: 'text-slate-300', bgColor: 'bg-slate-600', borderColor: 'border-slate-400', defaultCoverage: 0, isDirectional: false }
};

export const CATEGORIES_CONFIG: Record<FloorPlanPinCategory, { title: string; icon: any; color: string; bg: string }> = {
  cctv: { title: '📹 Videokuzatuv', icon: Video, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' },
  intercom: { title: '🚪 Domofoniya', icon: DoorClosed, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  network: { title: '🌐 Tarmoq & Wi-Fi', icon: Wifi, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  alarm_fire: { title: '🔥 Yong\'in & Xavfsizlik', icon: Flame, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
  power: { title: '⚡ Elektr & Quvvat', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' }
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
  
  // Categorized palette state
  const [activeCategoryTab, setActiveCategoryTab] = useState<FloorPlanPinCategory>('cctv');
  const [activePinPalette, setActivePinPalette] = useState<FloorPlanPinType>('camera_bullet');
  const [isAddingPinMode, setIsAddingPinMode] = useState(false);

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Interactive Live Drag & Drop / Rotate Pin state
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [rotatingPinId, setRotatingPinId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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

  // ============================================================================
  // MOUSE WHEEL ZOOM (SCROLL TO ZOOM IN/OUT)
  // ============================================================================
  const handleWheelZoom = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoomLevel(prev => {
      const nextZoom = Math.min(Math.max(prev * zoomFactor, 0.35), 4.5);
      return Number(nextZoom.toFixed(2));
    });
  }, []);

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
    if (!isAddingPinMode || isReadOnly || draggingPinId || rotatingPinId) return;
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (clickX < 0 || clickX > rect.width || clickY < 0 || clickY > rect.height) return;

    const xPercent = Number(((clickX / rect.width) * 100).toFixed(2));
    const yPercent = Number(((clickY / rect.height) * 100).toFixed(2));

    const pinConfig = PIN_CONFIG[activePinPalette] || PIN_CONFIG.other;
    const pinIndex = (activePlan?.pins?.length || 0) + 1;

    const newPin: FloorPlanPin = {
      id: `pin-${Date.now()}`,
      pinType: activePinPalette,
      label: `${pinConfig.label.split(' ')[0]} #${pinIndex}`,
      roomName: `Xona ${pinIndex}`,
      xPercent,
      yPercent,
      rotationAngle: pinConfig.isDirectional ? 90 : 0,
      coverageAngle: pinConfig.defaultCoverage,
      cableType: 'UTP Cat6 Mis Tashqi (Outdoor)',
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

  // ============================================================================
  // INTERACTIVE LIVE PIN DRAGGING & ROTATION WITH MOUSE / TOUCH
  // ============================================================================

  const handlePinMouseDown = (e: React.MouseEvent, pin: FloorPlanPin) => {
    if (isReadOnly || isAddingPinMode) return;
    e.stopPropagation();
    setDraggingPinId(pin.id);
    setSelectedPin(pin);
  };

  const handleRotateKnobMouseDown = (e: React.MouseEvent, pin: FloorPlanPin) => {
    if (isReadOnly) return;
    e.stopPropagation();
    setRotatingPinId(pin.id);
    setSelectedPin(pin);
  };

  // Global Mouse Move for Canvas Pan, Pin Drag, and Angle Rotation
  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // 1. ROTATING PIN ANGLE (Azimut burchagini aylantirish)
    if (rotatingPinId && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const currentPin = activePlan?.pins?.find(p => p.id === rotatingPinId);
      if (!currentPin) return;

      const pinPixelX = rect.left + (currentPin.xPercent / 100) * rect.width;
      const pinPixelY = rect.top + (currentPin.yPercent / 100) * rect.height;

      const dx = e.clientX - pinPixelX;
      const dy = e.clientY - pinPixelY;

      // Calculate angle in degrees (0 - 360)
      let angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      if (angleDeg < 0) angleDeg += 360;

      // Snap to 5 degrees
      angleDeg = Math.round(angleDeg / 5) * 5;

      const updatedPlans = floorPlans.map(plan => {
        if (plan.id === activePlanId) {
          return {
            ...plan,
            pins: (plan.pins || []).map(p => p.id === rotatingPinId ? { ...p, rotationAngle: angleDeg } : p)
          };
        }
        return plan;
      });
      setFloorPlans(updatedPlans);
      if (selectedPin?.id === rotatingPinId) {
        setSelectedPin(prev => prev ? { ...prev, rotationAngle: angleDeg } : null);
      }
      return;
    }

    // 2. DRAGGING PIN POSITION (Nuqta joyini siljitish)
    if (draggingPinId && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const xPercent = Math.max(1, Math.min(99, Number(((clickX / rect.width) * 100).toFixed(2))));
      const yPercent = Math.max(1, Math.min(99, Number(((clickY / rect.height) * 100).toFixed(2))));

      const updatedPlans = floorPlans.map(plan => {
        if (plan.id === activePlanId) {
          return {
            ...plan,
            pins: (plan.pins || []).map(p => p.id === draggingPinId ? { ...p, xPercent, yPercent } : p)
          };
        }
        return plan;
      });
      setFloorPlans(updatedPlans);
      if (selectedPin?.id === draggingPinId) {
        setSelectedPin(prev => prev ? { ...prev, xPercent, yPercent } : null);
      }
      return;
    }

    // 3. PANNING CANVAS (Sxemani siljitish)
    if (isDraggingPan) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleContainerMouseUp = () => {
    setIsDraggingPan(false);
    setDraggingPinId(null);
    setRotatingPinId(null);
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
  const handleAddPinPhoto = async (e: React.ChangeEvent<HTMLInputElement>, stage: 'cabling_rough' | 'device_finished') => {
    if (!selectedPin) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await compressImage(file, 1280, 1280, 0.75);
      const newPhoto: FloorPlanPinPhoto = {
        id: `photo-${Date.now()}`,
        url: res.dataUrl,
        stage,
        caption: stage === 'cabling_rough' ? 'Suvoqdan oldingi kabel trassasi' : 'O\'rnatilgan qurilma surati',
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

  // Filter available pin palette by category
  const filteredPaletteTypes = useMemo(() => {
    return (Object.keys(PIN_CONFIG) as FloorPlanPinType[]).filter(
      typeKey => PIN_CONFIG[typeKey].category === activeCategoryTab
    );
  }, [activeCategoryTab]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-fade-in select-none">
      {/* ========================================================================= */}
      {/* TOP NAV BAR */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-black text-white">
                2D Interaktiv Sxema & Xonalar Xaritasi
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-500/30">
                {objectPassport.passportNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Obyekt: <b className="text-slate-200">{objectPassport.objectName}</b> • {objectPassport.customerName}
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
      {/* MAIN WORKSPACE: CATEGORIZED PALETTE SIDEBAR + CANVAS */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Toolbar (Categorized Palette) */}
        {!isReadOnly && (
          <div className="w-full md:w-80 bg-slate-900/95 border-r border-slate-800 p-3 flex flex-col gap-3 shrink-0 overflow-y-auto max-h-[40vh] md:max-h-full">
            
            {/* Category Tabs */}
            <div>
              <p className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>1. Bo'limni tanlang:</span>
                <span className="text-[10px] text-sky-400 font-mono">5 ta kategoriya</span>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-1.5">
                {(Object.keys(CATEGORIES_CONFIG) as FloorPlanPinCategory[]).map((catKey) => {
                  const cat = CATEGORIES_CONFIG[catKey];
                  const Icon = cat.icon;
                  const isSelected = activeCategoryTab === catKey;
                  return (
                    <button
                      key={catKey}
                      onClick={() => {
                        setActiveCategoryTab(catKey);
                        const firstType = (Object.keys(PIN_CONFIG) as FloorPlanPinType[]).find(t => PIN_CONFIG[t].category === catKey);
                        if (firstType) setActivePinPalette(firstType);
                      }}
                      className={`p-2 rounded-xl text-left text-xs font-bold border transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-sky-600 text-white shadow-md border-sky-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate text-[11px]">{cat.title.split(' ')[1] || cat.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hardware Pins Palette List */}
            <div>
              <p className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">
                2. Qurilma modelini tanlang:
              </p>

              <div className="space-y-1.5 max-h-52 md:max-h-60 overflow-y-auto pr-1">
                {filteredPaletteTypes.map((typeKey) => {
                  const item = PIN_CONFIG[typeKey];
                  const isSelected = activePinPalette === typeKey;

                  return (
                    <div
                      key={typeKey}
                      onClick={() => {
                        setActivePinPalette(typeKey);
                        setIsAddingPinMode(true);
                      }}
                      className={`p-2.5 rounded-2xl border transition flex items-center justify-between gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-sky-950/60 border-sky-400 shadow-md ring-1 ring-sky-400/50'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1.5 shrink-0 shadow">
                          <DeviceIconRenderer type={typeKey} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white line-clamp-1">{item.label}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {item.isDirectional ? `Ko'rish burchagi: ${item.defaultCoverage}°` : '360° / Statik nuqta'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition shrink-0 ${
                          isSelected && isAddingPinMode
                            ? 'bg-sky-500 text-white animate-pulse'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isSelected && isAddingPinMode ? 'Xaritani bosing 👆' : 'Tanlash'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pin Placement Indicator & Instruction */}
            <div className={`p-3 rounded-2xl border transition ${
              isAddingPinMode 
                ? 'bg-sky-950/40 border-sky-500/80 shadow-lg shadow-sky-500/10 animate-pulse' 
                : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Nuqta joylashtirish:</span>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                  isAddingPinMode ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isAddingPinMode ? 'Xaritani bosing 👆' : 'Tayyor'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isAddingPinMode 
                  ? `Tanlangan: ${PIN_CONFIG[activePinPalette]?.label}. Xaritadagi xonaga bosing.`
                  : 'Sichqoncha bilan nuqtani ushlab surishingiz yoki burishingiz mumkin.'}
              </p>
            </div>

            {/* Plan Info & Management */}
            <div className="mt-auto space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Jami nuqtalar:</span>
                <span className="font-mono font-bold text-white">{activePlan?.pins?.length || 0} ta</span>
              </div>
              <div className="flex items-center justify-between">
                <span>1-Bosqich (Kabel):</span>
                <span className="font-mono font-bold text-sky-400">
                  {activePlan?.pins?.filter(p => p.status === 'cabled').length || 0} ta
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>2-Bosqich (O'rnatildi):</span>
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
        {/* INTERACTIVE CANVAS AREA (WITH SCROLL WHEEL ZOOM & DRAG & ANGLE ROTATION) */}
        {/* ========================================================================= */}
        <div
          ref={containerRef}
          onWheel={handleWheelZoom}
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
          onMouseLeave={handleContainerMouseUp}
          onMouseDown={(e) => {
            if (e.button === 0 && !isAddingPinMode && !draggingPinId && !rotatingPinId) {
              setIsDraggingPan(true);
              setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
            }
          }}
          className={`flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center select-none ${
            isAddingPinMode ? 'cursor-crosshair' : isDraggingPan ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Zoom & Canvas Floating Controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-2xl">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 4))}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Yaqinlashtirish (yoki sichqoncha g'ildiragini aylantiring)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs px-2 font-bold text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.35))}
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
              title="100% asl holat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Mouse Wheel & Drag Helper Hint */}
          <div className="absolute bottom-4 right-4 z-20 hidden md:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-400">
            <span>🖱️ G'ildirak = Zoom</span>
            <span>•</span>
            <span>👆 Nuqtani ushlab tortish = Joyini o'zgartirish</span>
            <span>•</span>
            <span>🔄 Konus uchi = Burchakni burish</span>
          </div>

          {/* Empty Blueprint Placeholder */}
          {!activePlan?.planImageUrl && (
            <div className="p-8 max-w-md text-center bg-slate-900/80 border border-dashed border-slate-700 rounded-3xl space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mx-auto">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">2D Sxema yoki Chizma Yuklanmagan</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ushbu obyekt uchun arxitekturaviy loyiha, qavat chizmasi yoki telefon orqali olingan chizma suratini yuklang.
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
                transition: isDraggingPan || draggingPinId || rotatingPinId ? 'none' : 'transform 0.1s ease-out'
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
                const isBeingDragged = draggingPinId === pin.id;
                const isBeingRotated = rotatingPinId === pin.id;
                const hasCoverageCone = (pin.coverageAngle || 0) > 0 && pinConf.isDirectional;

                const rotDeg = pin.rotationAngle || 0;
                const fovDeg = pin.coverageAngle || 90;
                const coneRadius = 110; // pixels

                return (
                  <div
                    key={pin.id}
                    style={{
                      left: `${pin.xPercent}%`,
                      top: `${pin.yPercent}%`
                    }}
                    onMouseDown={(e) => handlePinMouseDown(e, pin)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move group z-10 ${
                      isBeingDragged ? 'scale-125 z-40' : ''
                    }`}
                  >
                    {/* VISUAL COVERAGE CONE / CAMERA VIEWING ANGLE SECTOR */}
                    {hasCoverageCone && (
                      <div
                        style={{
                          transform: `rotate(${rotDeg - 90}deg)`,
                          transformOrigin: 'center center'
                        }}
                        className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10"
                      >
                        <svg
                          width={coneRadius * 2}
                          height={coneRadius * 2}
                          viewBox={`0 0 ${coneRadius * 2} ${coneRadius * 2}`}
                          className="overflow-visible"
                        >
                          {(() => {
                            const cx = coneRadius;
                            const cy = coneRadius;
                            const halfFovRad = ((fovDeg / 2) * Math.PI) / 180;
                            const x1 = cx + coneRadius * Math.cos(-halfFovRad);
                            const y1 = cy + coneRadius * Math.sin(-halfFovRad);
                            const x2 = cx + coneRadius * Math.cos(halfFovRad);
                            const y2 = cy + coneRadius * Math.sin(halfFovRad);
                            const largeArcFlag = fovDeg > 180 ? 1 : 0;

                            const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${coneRadius} ${coneRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                            return (
                              <path
                                d={pathD}
                                fill={
                                  pin.status === 'installed' || pin.status === 'tested'
                                    ? 'rgba(16, 185, 129, 0.35)'
                                    : 'rgba(56, 189, 248, 0.35)'
                                }
                                stroke={
                                  pin.status === 'installed' || pin.status === 'tested'
                                    ? 'rgba(52, 211, 153, 0.8)'
                                    : 'rgba(56, 189, 248, 0.8)'
                                }
                                strokeWidth="1.5"
                                strokeDasharray={pin.status === 'cabled' ? '4 2' : 'none'}
                              />
                            );
                          })()}
                        </svg>

                        {/* Direct Angle Rotation Knob at Tip of Cone (Interactive Rotator) */}
                        {!isReadOnly && (
                          <div
                            style={{
                              left: `${coneRadius + Math.cos(0) * (coneRadius - 5)}px`,
                              top: `${coneRadius}px`
                            }}
                            onMouseDown={(e) => handleRotateKnobMouseDown(e, pin)}
                            title="Yo'nalish burchagini aylantirish uchun ushlang"
                            className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center cursor-ew-resize pointer-events-auto shadow-lg ring-2 ring-white/60 group-hover:scale-110 transition transform"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* PIN MARKER BADGE WITH REALISTIC HARDWARE SVG ICON */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPin(pin);
                        setIsPinModalOpen(true);
                      }}
                      className={`relative flex items-center justify-center w-10 h-10 rounded-2xl border-2 shadow-2xl transition transform group-hover:scale-115 p-1 bg-slate-950/95 ${
                        statusConf.pinBorder
                      } ${isSelected ? 'ring-4 ring-sky-400 ring-offset-2 ring-offset-slate-900' : ''}`}
                    >
                      <DeviceIconRenderer type={pin.pinType} className="w-full h-full object-contain" />

                      {/* Direction Pointer Arrow if Directional */}
                      {hasCoverageCone && (
                        <div
                          style={{ transform: `rotate(${rotDeg}deg)` }}
                          className="absolute -top-1 w-2 h-2 bg-sky-400 rounded-full shadow border border-white"
                        />
                      )}

                      {/* Photos Count Badge */}
                      {pin.photos && pin.photos.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-600 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center border border-slate-900 shadow">
                          {pin.photos.length}
                        </span>
                      )}
                    </div>

                    {/* Live Angle Badge if Rotating */}
                    {isBeingRotated && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-sky-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg whitespace-nowrap z-50">
                        {pin.rotationAngle}°
                      </div>
                    )}

                    {/* Hover Tooltip Label */}
                    <div className="absolute top-11 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700 shadow-2xl text-[10px] whitespace-nowrap z-30 pointer-events-none">
                      <span className="font-bold text-white">{pin.label}</span>
                      <span className="text-slate-400">{pin.roomName}</span>
                      <span className={`font-semibold ${statusConf.color}`}>{statusConf.label}</span>
                      {hasCoverageCone && (
                        <span className="text-emerald-400 font-mono">Burchak: {pin.rotationAngle}° ({pin.coverageAngle}°)</span>
                      )}
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
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2 shadow-lg">
                  <DeviceIconRenderer type={selectedPin.pinType} className="w-full h-full object-contain" />
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
                    <span className="font-mono text-emerald-400 font-bold">{selectedPin.rotationAngle || 0}°</span>
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
                    <span className="font-mono text-sky-400 font-bold">{selectedPin.coverageAngle || 90}°</span>
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
                        onChange={(e) => handleAddPinPhoto(e, 'cabling_rough')}
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
                        onChange={(e) => handleAddPinPhoto(e, 'device_finished')}
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
                        photo.stage === 'cabling_rough' || photo.stage === 'cabling' ? 'bg-sky-500 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                        {photo.stage === 'cabling_rough' || photo.stage === 'cabling' ? '🔌 Kabel / Suvoq oldi' : '📹 Qurilma'}
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
