'use client';

import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { parseProductsFromExcel, downloadProductImportTemplate } from '../utils/excel';
import { formatNumberWithSpaces } from '../utils/formatters';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Check, 
  FileText, 
  ArrowRight,
  RefreshCw,
  PackagePlus,
  Loader2
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProducts: (importedProducts: Product[], mode: 'append' | 'merge') => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportProducts
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<Product[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'merge'>('append');
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseErrors([]);

    try {
      const result = await parseProductsFromExcel(file);
      setParsedProducts(result.products);
      setParseErrors(result.errors);
    } catch (err: any) {
      setParseErrors([err.message || "Faylni o'qishda xatolik yuz berdi. Iltimos, shablon formatiga mosligini tekshiring."]);
      setParsedProducts([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedProducts.length === 0) return;
    onImportProducts(parsedProducts, importMode);
    onClose();
  };

  const totalSerialsCount = parsedProducts.reduce((sum, p) => sum + (p.serialNumbers?.length || 0), 0);
  const totalCostValue = parsedProducts.reduce((sum, p) => sum + (p.costPrice * (p.isService ? 0 : p.stockQuantity)), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Excel Orqali Tovarlarni Ommaviy Yuklash (Import)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                .xlsx, .xls yoki .csv fayllar orqali ombor bazasini tezkor to&apos;ldirish
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: DOWNLOAD TEMPLATE BANNER */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Tayyor Excel Shablonidan Foydalaning</span>
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Xatoliklarsiz yuklash uchun namunaviy ustunlar (Nomi, Kategoriya, SKU, S/N) kiritilgan shablonni ko&apos;chirib oling.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadProductImportTemplate}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Shablonni Yuklab Olish (.xlsx)</span>
            </button>
          </div>

          {/* STEP 2: DROPZONE / FILE SELECTOR */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            {isParsing ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-2 text-emerald-600">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold">Excel fayli tahlil qilinmoqda...</span>
              </div>
            ) : selectedFile ? (
              <div className="py-2 flex flex-col items-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="font-bold text-sm text-slate-800 dark:text-white font-mono">
                  {selectedFile.name}
                </div>
                <span className="text-[11px] text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB — Boshqa fayl tanlash uchun bosing
                </span>
              </div>
            ) : (
              <div className="py-4 flex flex-col items-center space-y-2 text-slate-500 dark:text-slate-400">
                <Upload className="w-8 h-8 text-slate-400" />
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                    Excel faylini shu yerga tashlang
                  </span>
                  <span className="text-xs"> yoki kompyuterdan tanlash uchun bosing</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Qo&apos;llab-quvvatlanadi: .xlsx, .xls, .csv
                </span>
              </div>
            )}
          </div>

          {/* PARSE ERRORS IF ANY */}
          {parseErrors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Ayrim qatorlarda xatoliklar aniqlandi ({parseErrors.length} ta):</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 max-h-24 overflow-y-auto pl-1">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* STEP 3: PREVIEW & STATS */}
          {parsedProducts.length > 0 && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Topilgan Tovarlar</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    {parsedProducts.length} ta
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800">
                  <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 uppercase">Seriya Raqamlari (S/N)</span>
                  <div className="text-lg font-black text-cyan-700 dark:text-cyan-300 font-mono mt-0.5">
                    {totalSerialsCount} ta S/N
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Jami Tannarx Qiymati</span>
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                    {formatNumberWithSpaces(totalCostValue)} so&apos;m
                  </div>
                </div>
              </div>

              {/* Import Mode Selector */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Qo&apos;shish Usuli:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    onClick={() => setImportMode('append')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      importMode === 'append'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5"
                    />
                    <div>
                      <strong className="block">Yangi tovarlar sifatida qo&apos;shish (Append)</strong>
                      <span className="text-[11px] text-slate-400">
                        Barcha qatorlar omborga yangi mahsulot sifatida qo&apos;shiladi
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode('merge')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      importMode === 'merge'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5"
                    />
                    <div>
                      <strong className="block">Mavjud tovarlar bilan birlashtirish (Merge)</strong>
                      <span className="text-[11px] text-slate-400">
                        SKU yoki Barcode bir xil bo&apos;lsa, qoldiq va S/N lar ustiga qo&apos;shiladi
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
                  <span>Dastlabki 5 ta tovar ko&apos;rinishi:</span>
                  <span className="font-mono">Jami: {parsedProducts.length} ta</span>
                </div>
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-2">Nomi</th>
                        <th className="px-3 py-2">Kategoriya</th>
                        <th className="px-3 py-2">Qoldiq</th>
                        <th className="px-3 py-2 text-right">Tannarx</th>
                        <th className="px-3 py-2 text-right">Sotish narxi</th>
                        <th className="px-3 py-2">S/N lar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedProducts.slice(0, 5).map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                            {p.name}
                          </td>
                          <td className="px-3 py-2 text-slate-500 text-[11px] truncate max-w-[120px]">
                            {p.category}
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-cyan-600">
                            {p.isService ? 'Xizmat' : `${p.stockQuantity} ${p.unit}`}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-600">
                            {formatNumberWithSpaces(p.costPrice)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatNumberWithSpaces(p.retailPrice)}
                          </td>
                          <td className="px-3 py-2 font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                            {p.serialNumbers && p.serialNumbers.length > 0 ? `${p.serialNumbers.length} ta S/N` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Bekor qilish
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedProducts.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Omborga Yuklash ({parsedProducts.length} ta tovar)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
