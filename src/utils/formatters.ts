import { Currency } from '../types';

/**
 * Format integer with space separators: e.g. 1 770 000
 * Deterministic across Node.js (server) and all browser engines (client).
 */
export function formatNumberWithSpaces(amount: number): string {
  const rounded = Math.round(amount || 0);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Format USD amount with commas and 2 decimals: e.g. 1,770.00
 * Deterministic across Node.js (server) and all browser engines (client).
 */
export function formatUSDNumber(amount: number): string {
  const num = amount || 0;
  const fixed = num.toFixed(2);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * Format monetary amount according to chosen base currency
 * @param amountUZS Amount in UZS
 * @param currency 'UZS' or 'USD'
 * @param exchangeRate Exchange rate (1$ = X UZS)
 */
export function formatMoney(amountUZS: number, currency: Currency = 'UZS', exchangeRate: number = 12850): string {
  if (currency === 'USD') {
    const usd = exchangeRate > 0 ? amountUZS / exchangeRate : 0;
    return `$${formatUSDNumber(usd)}`;
  }
  return `${formatNumberWithSpaces(amountUZS)} so'm`;
}

/**
 * Format monetary amount with primary and secondary display
 */
export function formatDualMoney(amountUZS: number, currency: Currency = 'UZS', exchangeRate: number = 12850): { primary: string; secondary: string } {
  const usd = exchangeRate > 0 ? amountUZS / exchangeRate : 0;
  const uzsStr = `${formatNumberWithSpaces(amountUZS)} so'm`;
  const usdStr = `$${formatUSDNumber(usd)}`;

  if (currency === 'USD') {
    return {
      primary: usdStr,
      secondary: uzsStr
    };
  }
  return {
    primary: uzsStr,
    secondary: usdStr
  };
}

/**
 * Returns a standardized "YYYY-MM-DD" date key from any date format:
 * - "2026-10-06 14:30"
 * - "2026-10-06T14:30:00.000Z"
 * - "Bugun, 08:30"
 * - "16:10" (time only -> treated as today)
 * - "06.10.2026, 16:10:00"
 */
export function getNormalizedDateKey(dateInput?: string | Date | null): string {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  if (!dateInput) return todayKey;

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return todayKey;
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const day = String(dateInput.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const str = String(dateInput).trim();

  // 1. "Bugun..." or time only (e.g. "16:10" or "08:30:00")
  if (str.toLowerCase().startsWith('bugun') || /^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    return todayKey;
  }

  // 2. "YYYY-MM-DD" or "YYYY-MM-DD HH:mm"
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 3. "DD.MM.YYYY" (e.g. "06.10.2026")
  const dmyMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 4. Fallback Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return todayKey;
}

/**
 * Checks if a given date string or Date object represents today
 */
export function isTodayDate(dateInput?: string | Date | null): boolean {
  const targetKey = getNormalizedDateKey(dateInput);
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return targetKey === todayKey;
}

/**
 * Helper to get current timestamp in standard "YYYY-MM-DD HH:mm" format
 */
export function getNowFormatted(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

