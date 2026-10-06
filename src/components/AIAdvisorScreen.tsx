'use client';

import React, { useState } from 'react';
import { Product, AIInsight } from '../types';
import { 
  Sparkles, 
  AlertCircle, 
  Send, 
  Copy, 
  Check, 
  Bot, 
  TrendingUp, 
  Package, 
  Clock, 
  ChevronRight,
  Share2
} from 'lucide-react';

interface AIAdvisorScreenProps {
  products: Product[];
  insights: AIInsight[];
}

export const AIAdvisorScreen: React.FC<AIAdvisorScreenProps> = ({
  products,
  insights
}) => {
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<
    { sender: 'user' | 'ai'; text: string; time: string }[]
  >([
    {
      sender: 'ai',
      text: "Assalomu alaykum! Men Smart Control AI maslahatchisiman. Savdo aylanmasi, zaxiralar bashorati va eng xaridorgir tovarlar bo'yicha har qanday savolingizga javob berishga tayyorman.",
      time: '07:15'
    }
  ]);

  // Generate simulated supplier order list
  const lowStockItems = products.filter((p) => p.stockQuantity <= p.minStockAlert);
  const totalOrderSum = lowStockItems.reduce((sum, p) => sum + p.costPrice * 50, 0);

  const handleCopyOrder = () => {
    const orderText = `SMART CONTROL — TA'MINOT BUYURTMASI:\nSana: ${new Date().toLocaleDateString()}\n\n` +
      lowStockItems
        .map((p, i) => `${i + 1}. ${p.name} — 50 ${p.unit} (Tannarxi: ${p.costPrice.toLocaleString()} so'm)`)
        .join('\n') +
      `\n\nJami kutilayotgan summa: ${totalOrderSum.toLocaleString()} so'm.`;

    navigator.clipboard.writeText(orderText);
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  const handleSendQuestion = (questionText?: string) => {
    const q = questionText || chatInput;
    if (!q.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    // Dynamic AI response simulation based on real store state
    setTimeout(() => {
      let reply = "Savolingiz tahlil qilindi. ";
      const lower = q.toLowerCase();

      if (lower.includes('marja') || lower.includes('foyda')) {
        reply = "Tizim ma'lumotlariga ko'ra, eng yuqori sof marjaga ega tovarlar: Baseus zaryadlovchi (+66% marja) va Snickers (+50% marja). Ushbu tovarlarni kassa oldiga (impulsiv zona) joylashtirish tavsiya etiladi.";
      } else if (lower.includes('zakaz') || lower.includes('ta\'minot') || lower.includes('tugay')) {
        reply = `Hozirda ${lowStockItems.length} ta mahsulot kritik darajada (Coca-Cola 1.5L, Sut, Ahmad Tea). Ular 2 kunga yetadi. Bugun ta'minotchi bilan bog'lanib, yangi partiyani qabul qilishingiz zarur.`;
      } else if (lower.includes('aksiya') || lower.includes('cashback') || lower.includes('mijoz')) {
        reply = "Sotuv sur'atini oshirish uchun o'rtacha cheki 150 000 so'mdan oshgan barcha mijozlarga 2 barobar ko'proq cashback (Double Cashback) e'lon qilishni tavsiya qilaman. Bu qayta xaridlar sonini 28% ga ko'paytiradi.";
      } else {
        reply = `Kassalar va ombor tahliliga ko'ra: jami ${products.length} ta mahsulot hisobda turibdi. Savdo dinamikasi barqaror o'smoqda. Eng faol savdo soati: 17:00 dan 20:00 gacha.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 600);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-950 text-white border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 bg-indigo-500/30 px-2.5 py-0.5 rounded-full">
              Google Gemini &bull; Real-vaqt AI Dvigateli
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Smart Control AI Maslahatchisi</h2>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">
            Tizim har bir chek va qoldiqni real-vaqtda tahlil qilib, qaysi tovarlar tugashini oldindan aytadi, ta&apos;minotchiga avtomat zakaz shakllantiradi va daromadni oshirish sirlarini ochadi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm text-center">
            <div className="text-lg font-black font-mono text-emerald-400">98.4%</div>
            <div className="text-[10px] text-slate-300">Prognoz aniqligi</div>
          </div>
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm text-center">
            <div className="text-lg font-black font-mono text-purple-300">4 ta</div>
            <div className="text-[10px] text-slate-300">Kutilayotgan zakaz</div>
          </div>
        </div>
      </div>

      {/* Main 2-column layout: Left = Stockout forecast & Smart order, Right = AI Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Alerts & Smart Order */}
        <div className="space-y-6">
          {/* Smart Auto Order Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-500" />
                Aqlli Ta&apos;minot Buyurtmasi (Smart Order)
              </h3>
              <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">
                Tayyor ro&apos;yxat
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Quyidagi tovarlar yaqin 2-3 kunda tugaydi. AI ular uchun optimal ta&apos;minot partiyasini hisobladi:
            </p>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {lowStockItems.map((prod) => (
                <div key={prod.id} className="p-3 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{prod.name}</span>
                    <div className="text-[10px] text-slate-400">
                      Hozirgi qoldiq: <span className="text-amber-600 font-bold">{prod.stockQuantity} {prod.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-600 font-mono text-sm">+50 {prod.unit}</span>
                    <span className="block text-[10px] text-slate-400">
                      {(prod.costPrice * 50).toLocaleString()} so&apos;m
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-[11px] text-slate-400 block">Jami buyurtma qiymati:</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                  {totalOrderSum.toLocaleString()} so&apos;m
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyOrder}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 flex items-center gap-1.5 transition"
                >
                  {copiedOrder ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedOrder ? 'Nusxalandi!' : 'Nusxa olish'}</span>
                </button>

                <button
                  onClick={() => alert("Telegram orqali ta'minotchi 'Toshkent Beverages'ga yuborildi!")}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegramga Jo&apos;natish</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Insights list */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Avtomatik AI Xulosalari va Tavsiyalari
            </h4>

            {insights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        insight.impact === 'high'
                          ? 'bg-red-500'
                          : insight.impact === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {insight.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{insight.date}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {insight.description}
                </p>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span><strong>Tavsiya:</strong> {insight.recommendedAction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive AI Chat Advisor */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-[650px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Smart Control AI Suhbatdoshi
                </h4>
                <div className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Onlayn &bull; Do&apos;kon bazasiga ulangan
                </div>
              </div>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto bg-slate-50/50 dark:bg-slate-800/30 no-scrollbar">
            <button
              onClick={() => handleSendQuestion("Qaysi tovarlarim tezroq tugayapti?")}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 whitespace-nowrap transition"
            >
              Qaysi tovarlar tugayapti?
            </button>
            <button
              onClick={() => handleSendQuestion("Eng ko'p marjali mahsulotlarim qaysi?")}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 whitespace-nowrap transition"
            >
              Eng ko&apos;p sof foyda beruvchi tovarlar
            </button>
            <button
              onClick={() => handleSendQuestion("Savdoni oshirish uchun qanday cashback aksiyasi tavsiya qilasiz?")}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 whitespace-nowrap transition"
            >
              Cashback aksiyasi taklifi
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">{m.time}</span>
              </div>
            ))}
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuestion();
            }}
            className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2"
          >
            <input
              type="text"
              placeholder="AI maslahatchiga savol bering (masalan: qaysi tovar sotilmayapti?)..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
