# SMART CONTROL — Autonomous Development Guidelines & Rules

## 1. Project Context
- **Name:** Smart Control (ERP / CRM / Security Systems & Technical Installation Management System)
- **Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Supabase Cloud Database + IndexedDB Offline Sync.
- **Repository:** `https://github.com/Husasnxon/Smart-Control.git` (branch: `main`)
- **Production URL:** `https://smart-control-khaki.vercel.app`
- **Working Directory:** `C:\Users\Husanxon\.gemini\antigravity\scratch\smart-control`

---

## 2. Autonomous Mode Rules (Mustaqil Ishlash Qoidalari)
1. **End-to-End Execution (Boshidan oxirigacha mustaqil yakunlash):**
   - Foydalanuvchi biror vazifa yoki muammoni aytganda, kodni yozish, lokal tekshirish (`npm.cmd run build`), Git'ga commit/push qilish va Vercel jonli serveriga deploy qilishni to'liq avtonom tarzda bajaring.
   - Foydalanuvchini har bir mayda qadam uchun to'xtatmang. Faqatgina loyiha konsepsiyasida muhim qaror yoki tanlov kerak bo'lganda so'rang.

2. **Windows Execution Compatibility:**
   - Windows PowerShell muhitida `npm` va `npx` o'rniga doimo `npm.cmd` va `npx.cmd` dan foydalaning (Execution Policy xatoliklarining oldini olish uchun).
   - Git amallarini UTF-8 va CRLF to'g'ri boshqarilgan holda bajaring.

3. **Production Deployment Automation:**
   - Har bir yangilik yoki tuzatishdan keyin `npm.cmd run build` orqali TypeScript va Turbopack tekshiruvidan 100% o'tkazing.
   - `git push origin main` orqali GitHub'ga yuboring.
   - `npx.cmd vercel --prod --yes` orqali to'g'ridan-to'g'ri jonli serverga chiqaring va holatni tasdiqlang.

---

## 3. POS & Thermal Printing Standards
- **Lenta o'lchamlari:** 58mm (Xprinter XP-58IIT, XP-58C, Goojprt) va 80mm (XP-80, Epson).
- **Chop etish texnologiyalari:**
  1. **WebUSB API:** USB kabel orqali to'g'ridan-to'g'ri ESC/POS (drayversiz, Chrome darchasisiz).
  2. **Web Bluetooth API:** Planshet va smartfonlar orqali usta kabineti uchun to'g'ridan-to'g'ri ESC/POS.
  3. **Iframe Print:** Izolyatsiyalangan darcha (orqa fon elementlari chekka aralashmaydi).
- **Qoidalar:** Cheklarda lotin alifbosi transliteratsiyasi (`transliterateForEscPos`) qo'llansin, noaniq xitoycha simvollar chiqmasligi kafolatlansin.

---

## 4. Communication & Language
- Barcha javoblar aniq, professional, o'zbek tilida beriladi.
- Har bir deploydan so'ng to'g'ridan-to'g'ri jonli havola ko'rsatiladi: `https://smart-control-khaki.vercel.app`.
