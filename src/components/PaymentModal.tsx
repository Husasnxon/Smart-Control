'use client';

import React, { useState, useEffect } from 'react';
import { Customer, PaymentDetails, Currency } from '../types';
import { formatNumberWithSpaces, formatUSDNumber } from '../utils/formatters';
import { 
  X, 
  CreditCard, 
  Banknote, 
  Coins, 
  Gift, 
  DollarSign,
  ArrowRightLeft,
  CheckCircle2,
  User
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  customer?: Customer;
  onConfirmPayment: (payment: PaymentDetails, cashbackEarned: number) => void;
  isOffline: boolean;
  exchangeRate?: number;
  baseCurrency?: Currency;
  customers?: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  customer,
  onConfirmPayment,
  isOffline,
  exchangeRate = 12850,
  baseCurrency = 'UZS',
  customers,
  onSelectCustomer
}) => {
  const [cash, setCash] = useState<number>(0);         // So'mda naqd
  const [cashUSD, setCashUSD] = useState<number>(0);   // Dollarda naqd ($)
  const [card, setCard] = useState<number>(0);         // So'mda karta
  const [debt, setDebt] = useState<number>(0);         // So'mda qarz
  const [debtUSD, setDebtUSD] = useState<number>(0);   // Dollarda qarz ($)
  const [debtCurrencyMode, setDebtCurrencyMode] = useState<'UZS' | 'USD'>(baseCurrency === 'USD' ? 'USD' : 'UZS');
  const [useCashback, setUseCashback] = useState<number>(0); // So'mda cashback
  const [showQuickCustSelect, setShowQuickCustSelect] = useState<boolean>(false);

  // Calculate total in USD
  const totalAmountUSD = Number((totalAmount / exchangeRate).toFixed(2));

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      if (baseCurrency === 'USD') {
        setCashUSD(totalAmountUSD);
        setCash(0);
        setDebtCurrencyMode('USD');
      } else {
        setCash(totalAmount);
        setCashUSD(0);
        setDebtCurrencyMode('UZS');
      }
      setCard(0);
      setDebt(0);
      setDebtUSD(0);
      setUseCashback(0);
    }
  }

  // Escape key to close payment modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Maximum cashback usable cannot exceed customer balance or total amount
  const maxCashbackUsable = customer 
    ? Math.min(customer.cashbackBalance, totalAmount) 
    : 0;

  const handleCashbackToggle = (use: boolean) => {
    if (use) {
      const cb = maxCashbackUsable;
      setUseCashback(cb);
      const remaining = Math.max(0, totalAmount - cb);
      setCash(remaining);
      setCashUSD(0);
      setCard(0);
      setDebt(0);
      setDebtUSD(0);
    } else {
      setUseCashback(0);
      setCash(totalAmount);
      setCashUSD(0);
    }
  };

  // USD to UZS converted amount
  const cashUSDInUZS = Math.round(cashUSD * exchangeRate);
  const debtUSDInUZS = Math.round(debtUSD * exchangeRate);

  // Total covered in UZS
  const totalDebtUZS = debt + debtUSDInUZS;
  const totalDebtUSD = Number((debtUSD + (debt > 0 ? debt / exchangeRate : 0)).toFixed(2));

  const currentCovered = cash + cashUSDInUZS + card + totalDebtUZS + useCashback;
  const remainingOrChange = currentCovered - totalAmount;
  const isPaidEnough = currentCovered >= totalAmount;

  // Change (Qaytim) in UZS and USD
  const changeUZS = Math.max(0, remainingOrChange);
  const changeUSD = changeUZS > 0 ? Number((changeUZS / exchangeRate).toFixed(2)) : 0;

  // Check if cashback is globally enabled or disabled
  const isCashbackGloballyEnabled = typeof window !== 'undefined' 
    ? localStorage.getItem('sc_cashback_enabled') !== 'false' 
    : true;
  const isCustomerCashbackDisabled = customer?.tier === 'None' || !isCashbackGloballyEnabled;

  // Cashback earned is based on cash (UZS + converted USD) + card payment only
  const eligibleAmount = Math.max(0, cash + cashUSDInUZS + card);
  const cashbackRate = isCustomerCashbackDisabled ? 0 : (customer?.cashbackRate || 1); // Default 1%
  const cashbackEarned = isCustomerCashbackDisabled ? 0 : Math.round((eligibleAmount * cashbackRate) / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPaidEnough) return;

    let currencyPaid: 'UZS' | 'USD' | 'MIXED' = 'UZS';
    if ((cashUSD > 0 || debtUSD > 0) && cash === 0 && card === 0 && debt === 0) {
      currencyPaid = 'USD';
    } else if (cashUSD > 0 || debtUSD > 0) {
      currencyPaid = 'MIXED';
    }

    onConfirmPayment(
      {
        cash,
        cashUSD: cashUSD > 0 ? cashUSD : undefined,
        card,
        debt: totalDebtUZS,
        debtUSD: totalDebtUSD > 0 ? totalDebtUSD : undefined,
        cashbackUsed: useCashback,
        exchangeRate,
        currencyPaid,
        total: totalAmount,
        totalUSD: totalAmountUSD
      },
      cashbackEarned
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              To&apos;lovni Qabul Qilish ({baseCurrency === 'USD' ? 'Dollar / So\'m' : 'So\'m / Dollar'})
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>Kurs: 1$ = {formatNumberWithSpaces(exchangeRate)} so&apos;m</span>
              <span className="text-slate-400">&bull;</span>
              <span>Aralash to&apos;lov mumkin</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Total Amount Banner (Dual Currency: So'm + Dollar) */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-inner">
            <div>
              <span className="text-xs text-slate-400 block font-medium">To&apos;lov summasi</span>
              {baseCurrency === 'USD' ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-cyan-400 tracking-tight font-mono">
                    ${formatUSDNumber(totalAmountUSD)} <small className="text-xs font-normal text-slate-300">USD</small>
                  </span>
                  <span className="text-sm font-semibold text-slate-400 font-mono">
                    (~ {formatNumberWithSpaces(totalAmount)} so&apos;m)
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
                    {formatNumberWithSpaces(totalAmount)} <small className="text-xs font-normal text-slate-300">so&apos;m</small>
                  </span>
                  <span className="text-base font-bold text-cyan-400 font-mono">
                    (${formatUSDNumber(totalAmountUSD)})
                  </span>
                </div>
              )}
            </div>

            {customer && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Mijoz</span>
                <span className="text-xs font-semibold text-slate-200">{customer.fullName}</span>
                <span className="text-[11px] block text-purple-400">
                  {isCustomerCashbackDisabled ? 'Keshbeksiz (0%)' : `${customer.tier} (${customer.cashbackRate}% cashback)`}
                </span>
              </div>
            )}
          </div>

          {/* Cashback Selection if Customer has balance and cashback is enabled */}
          {isCashbackGloballyEnabled && customer && customer.cashbackBalance > 0 && customer.tier !== 'None' && (
            <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-purple-200">
                    Mavjud Cashback: {formatNumberWithSpaces(customer.cashbackBalance)} so&apos;m
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {useCashback > 0 ? `${formatNumberWithSpaces(useCashback)} so'm yechildi` : 'Xariddan chegirma sifatida yechish'}
                  </div>
                </div>
              </div>

              {useCashback > 0 ? (
                <button
                  type="button"
                  onClick={() => handleCashbackToggle(false)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition"
                >
                  Bekor qilish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCashbackToggle(true)}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition"
                >
                  Yechish
                </button>
              )}
            </div>
          )}

          {/* Payment inputs */}
          <div className="space-y-3">
            {/* Dollar ($) Cash Input */}
            <div className="p-3 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/80">
              <label className="flex items-center justify-between text-xs font-bold text-cyan-900 dark:text-cyan-200 mb-1">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-cyan-600" />
                  Naqd Dollar ($ USD)
                </span>
                {cashUSD > 0 && (
                  <span className="text-cyan-700 dark:text-cyan-300 font-mono text-[11px]">
                    = {formatNumberWithSpaces(cashUSDInUZS)} so&apos;m
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0 $"
                  value={cashUSD || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setCashUSD(val);
                    // Automatically adjust cash in so'm if desired
                    const inUZS = Math.round(val * exchangeRate);
                    const remainingUZS = Math.max(0, totalAmount - inUZS - card - debt - useCashback);
                    setCash(remainingUZS);
                  }}
                  className="flex-1 bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:ring-2 focus:ring-cyan-500/40 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const exactUSD = Math.ceil(totalAmount / exchangeRate);
                    setCashUSD(exactUSD);
                    setCash(0);
                    setCard(0);
                    setDebt(0);
                  }}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono transition"
                  title="To'liq summani dollarda to'lash"
                >
                  100% (${Math.ceil(totalAmount / exchangeRate)})
                </button>
              </div>
            </div>

            {/* Cash UZS Input */}
            <div>
              <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-500" />
                  Naqd Pul (So&apos;m)
                </span>
                <span className="text-slate-400 font-mono text-[11px]">so&apos;m</span>
              </label>
              <input
                type="number"
                min="0"
                value={cash || ''}
                onChange={(e) => setCash(Number(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500/40 text-slate-900 dark:text-white"
              />
            </div>

            {/* Card Input */}
            <div>
              <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  Plastik Karta (Humo / Uzcard)
                </span>
                <span className="text-slate-400 font-mono text-[11px]">so&apos;m</span>
              </label>
              <input
                type="number"
                min="0"
                value={card || ''}
                onChange={(e) => setCard(Number(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white"
              />
            </div>

            {/* Debt Input (only if customer chosen) */}
            {customer && (
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <Coins className="w-4 h-4 text-amber-500" />
                    Nasiya / Qarzga yozish ({customer.fullName})
                  </label>
                  
                  {/* Currency selector tabs for debt */}
                  <div className="flex items-center bg-amber-200/60 dark:bg-amber-900/60 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setDebtCurrencyMode('USD')}
                      className={`px-2 py-0.5 rounded-md transition ${
                        debtCurrencyMode === 'USD'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-800 dark:text-amber-300 hover:text-amber-950'
                      }`}
                    >
                      Dollar ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDebtCurrencyMode('UZS')}
                      className={`px-2 py-0.5 rounded-md transition ${
                        debtCurrencyMode === 'UZS'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-800 dark:text-amber-300 hover:text-amber-950'
                      }`}
                    >
                      So&apos;m
                    </button>
                  </div>
                </div>

                {debtCurrencyMode === 'USD' ? (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0.00 $"
                          value={debtUSD || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setDebtUSD(val);
                            setDebt(0);
                            const inUZS = Math.round(val * exchangeRate);
                            const remUZS = Math.max(0, totalAmount - cashUSDInUZS - card - inUZS - useCashback);
                            setCash(remUZS);
                          }}
                          className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:ring-2 focus:ring-amber-500/40 text-slate-900 dark:text-white"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-amber-600 font-mono">$ USD</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const remUZS = Math.max(0, totalAmount - cash - cashUSDInUZS - card - useCashback);
                          const remUSD = Number((remUZS / exchangeRate).toFixed(2));
                          setDebtUSD(remUSD);
                          setDebt(0);
                        }}
                        className="px-2.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs font-mono transition shadow-sm"
                        title="Qolgan qismini dollarda qarzga yozish"
                      >
                        Qoldiq ($)
                      </button>
                    </div>
                    {debtUSD > 0 && (
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 font-mono block">
                        ≈ {formatNumberWithSpaces(debtUSDInUZS)} so&apos;m qarz hisobiga yoziladi
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0 so'm"
                          value={debt || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setDebt(val);
                            setDebtUSD(0);
                            const remUZS = Math.max(0, totalAmount - cashUSDInUZS - card - val - useCashback);
                            setCash(remUZS);
                          }}
                          className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:ring-2 focus:ring-amber-500/40 text-slate-900 dark:text-white"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 font-mono">so&apos;m</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const remUZS = Math.max(0, totalAmount - cash - cashUSDInUZS - card - useCashback);
                          setDebt(remUZS);
                          setDebtUSD(0);
                        }}
                        className="px-2.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs font-mono transition shadow-sm"
                        title="Qolgan qismini so'mda qarzga yozish"
                      >
                        Qoldiq (So&apos;m)
                      </button>
                    </div>
                    {debt > 0 && (
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 font-mono block">
                        ≈ ${formatUSDNumber(Number((debt / exchangeRate).toFixed(2)))} USD
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {baseCurrency === 'USD' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setCashUSD(totalAmountUSD);
                    setCash(0);
                    setCard(0);
                    setDebt(0);
                    setDebtUSD(0);
                  }}
                  className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition shadow-sm"
                >
                  100% Dollar ($)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCash(totalAmount - useCashback);
                    setCashUSD(0);
                    setCard(0);
                    setDebt(0);
                    setDebtUSD(0);
                  }}
                  className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                >
                  100% So&apos;m
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setCash(totalAmount - useCashback);
                    setCashUSD(0);
                    setCard(0);
                    setDebt(0);
                    setDebtUSD(0);
                  }}
                  className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-sm"
                >
                  100% So&apos;m
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCashUSD(totalAmountUSD);
                    setCash(0);
                    setCard(0);
                    setDebt(0);
                    setDebtUSD(0);
                  }}
                  className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 hover:bg-cyan-100 transition"
                >
                  100% Dollar ($)
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setCard(totalAmount - useCashback);
                setCash(0);
                setCashUSD(0);
                setDebt(0);
                setDebtUSD(0);
              }}
              className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 hover:bg-blue-100 transition"
            >
              100% Karta
            </button>

            <button
              type="button"
              onClick={() => {
                if (!customer) {
                  setShowQuickCustSelect(true);
                  return;
                }
                if (baseCurrency === 'USD' || debtCurrencyMode === 'USD') {
                  setDebtUSD(totalAmountUSD);
                  setDebt(0);
                } else {
                  setDebt(totalAmount - useCashback);
                  setDebtUSD(0);
                }
                setCash(0);
                setCashUSD(0);
                setCard(0);
              }}
              className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 hover:bg-amber-100 transition"
              title="To'liq summani nasiya qarzga yozish"
            >
              📌 100% Nasiya ({baseCurrency === 'USD' ? '$' : 'So\'m'})
            </button>
          </div>

          {/* Quick inline customer selector for 1-Click Nasiya if customer not selected */}
          {(!customer && showQuickCustSelect) && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-amber-500" /> Nasiya uchun mijozni tanlang:
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickCustSelect(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs px-1.5 py-0.5 rounded"
                >
                  ✕
                </button>
              </div>
              <select
                onChange={(e) => {
                  const found = customers?.find(c => c.id === e.target.value);
                  if (found && onSelectCustomer) {
                    onSelectCustomer(found);
                    setShowQuickCustSelect(false);
                    if (baseCurrency === 'USD' || debtCurrencyMode === 'USD') {
                      setDebtUSD(totalAmountUSD);
                      setDebt(0);
                    } else {
                      setDebt(totalAmount - useCashback);
                      setDebtUSD(0);
                    }
                    setCash(0);
                    setCashUSD(0);
                    setCard(0);
                  }
                }}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>-- Ro&apos;yxatdan mijozni tanlang (1-Click Nasiya) --</option>
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phone || "Tel yo'q"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Change or Remaining Calculation */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">
                  {remainingOrChange >= 0 ? 'Qaytim (Mijozga beriladi)' : 'Yetmayotgan summa'}
                </span>
                <div className="flex items-baseline gap-2">
                  {baseCurrency === 'USD' ? (
                    <>
                      <span
                        className={`text-lg font-black font-mono ${
                          remainingOrChange >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-red-500'
                        }`}
                      >
                        ${formatUSDNumber(Math.abs(changeUSD || Number((remainingOrChange / exchangeRate))))} USD
                      </span>
                      <span className="text-xs font-semibold text-slate-400 font-mono">
                        ({formatNumberWithSpaces(Math.abs(remainingOrChange))} so&apos;m)
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className={`text-lg font-black font-mono ${
                          remainingOrChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                        }`}
                      >
                        {formatNumberWithSpaces(Math.abs(remainingOrChange))} so&apos;m
                      </span>
                      {changeUSD > 0 && (
                        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                          (${formatUSDNumber(changeUSD)})
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {customer && cashbackEarned > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">
                    Kutilayotgan Cashback
                  </span>
                  <span className="text-sm font-bold text-purple-700 dark:text-purple-300 font-mono">
                    +{formatNumberWithSpaces(cashbackEarned)} so&apos;m
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 1-Click Nasiya Direct Transfer Button */}
          {customer && totalDebtUZS >= totalAmount && (
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs tracking-wide shadow-lg shadow-amber-600/25 transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Coins className="w-4 h-4 text-amber-200" />
              <span>📌 1-Click Nasiya: {customer.fullName} nomiga qarzga yozish</span>
            </button>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isPaidEnough}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 transition active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>To&apos;lovni Tasdiqlash va Chek Chiqarish</span>
          </button>
        </form>
      </div>
    </div>
  );
};
