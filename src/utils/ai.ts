import { Product, Employee, CrmLead, CrmObjectType, CrmLeadSource } from '../types';

export interface AiParsedCrmResult {
  clientName: string;
  phone: string;
  address?: string;
  objectType: CrmObjectType;
  source?: CrmLeadSource;
  cameraCountEstimated?: number;
  budgetEstimatedUSD?: number;
  assignedTechnicianName?: string;
  siteVisitDate?: string;
  siteVisitTime?: string;
  recommendedItems?: {
    productId?: string;
    productName: string;
    quantity: number;
    unitPriceUSD?: number;
    totalPriceUSD?: number;
  }[];
  notes?: string;
  nextActionNote?: string;
  commercialProposalText?: string;
}

export const getGeminiApiKey = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('sc_gemini_api_key') || '';
};

export const saveGeminiApiKey = (key: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sc_gemini_api_key', key.trim());
};

export const getGeminiModel = (): string => {
  if (typeof window === 'undefined') return 'gemini-3.8-flash';
  const saved = localStorage.getItem('sc_gemini_model');
  if (!saved || saved.includes('1.5') || saved.includes('2.0')) {
    return 'gemini-3.8-flash';
  }
  return saved;
};

export const saveGeminiModel = (model: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sc_gemini_model', model);
};

/**
 * Fallback Local Heuristic Parser if Gemini API is offline or key not provided
 */
export const localHeuristicCrmParser = (
  text: string,
  products: Product[] = [],
  employees: Employee[] = []
): AiParsedCrmResult => {
  const lower = text.toLowerCase();

  // Extract phone number (+998...)
  const phoneMatch = text.match(/(?:\+?998[\s-]?)?(?:\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}|\d{9})/);
  const phone = phoneMatch ? (phoneMatch[0].startsWith('+998') ? phoneMatch[0] : `+998 ${phoneMatch[0]}`) : '+998 ';

  // Extract camera count (e.g. "6 ta kamera", "4 ta", "8 kamerali")
  const cameraMatch = text.match(/(\d+)\s*(?:ta\s*)?(?:ta|dona)?\s*kamera/i) || text.match(/(\d+)\s*ta/i);
  const cameraCount = cameraMatch ? parseInt(cameraMatch[1], 10) : 4;

  // Extract budget in USD (e.g. "350 dollar", "$400", "500$")
  const budgetMatch = text.match(/(\d+)\s*(?:\$|dollar|usd)/i) || text.match(/(?:\$|usd)\s*(\d+)/i);
  const budgetUSD = budgetMatch ? parseInt(budgetMatch[1], 10) : cameraCount * 65;

  // Detect Object Type
  let objectType: CrmObjectType = 'xonadon';
  if (lower.includes('do\'kon') || lower.includes('dokon') || lower.includes('magazin') || lower.includes('savdo') || lower.includes('market')) {
    objectType = 'dokon';
  } else if (lower.includes('ofis') || lower.includes('office') || lower.includes('markaz') || lower.includes('bino')) {
    objectType = 'ofis';
  } else if (lower.includes('zavod') || lower.includes('ombor') || lower.includes('fabrika') || lower.includes('tsex')) {
    objectType = 'ombor_zavod';
  } else if (lower.includes('maktab') || lower.includes('bog\'cha') || lower.includes('davlat')) {
    objectType = 'davlat';
  }

  // Detect Name (Look for "aka", "bek", "MCHJ", or first capitalized words)
  let clientName = 'Yangi Mijoz';
  const nameMatch = text.match(/([A-ZА-ЯЎҚҒҲ][a-zа-яўқғҳ']+\s+(?:aka|oka|aka|bek|Rahimov|Karimov|Aliyev|MCHJ))/i);
  if (nameMatch) {
    clientName = nameMatch[1];
  } else {
    const words = text.split(/[\s,]+/);
    if (words.length > 0 && words[0].length > 2) {
      clientName = `${words[0]} ${words[1] || ''}`.trim();
    }
  }

  // Find matching technician
  const matchedTech = employees.find(e => 
    e.role.toLowerCase().includes('usta') && 
    (lower.includes(e.fullName.toLowerCase().split(' ')[0]) || lower.includes(e.fullName.toLowerCase()))
  ) || employees.find(e => e.role.toLowerCase().includes('usta'));

  // Suggested Products
  const recommendedItems: AiParsedCrmResult['recommendedItems'] = [];
  
  // 1. Cameras
  const camProd = products.find(p => p.category.toLowerCase().includes('kamera') && !p.isService) || products[0];
  if (camProd) {
    recommendedItems.push({
      productId: camProd.id,
      productName: camProd.name,
      quantity: cameraCount,
      unitPriceUSD: camProd.retailPriceUSD || Math.round(camProd.retailPrice / 12850),
      totalPriceUSD: (camProd.retailPriceUSD || Math.round(camProd.retailPrice / 12850)) * cameraCount
    });
  }

  // 2. NVR/DVR
  const nvrProd = products.find(p => p.category.toLowerCase().includes('registrator') || p.name.toLowerCase().includes('nvr') || p.name.toLowerCase().includes('dvr'));
  if (nvrProd) {
    recommendedItems.push({
      productId: nvrProd.id,
      productName: nvrProd.name,
      quantity: 1,
      unitPriceUSD: nvrProd.retailPriceUSD || Math.round(nvrProd.retailPrice / 12850),
      totalPriceUSD: nvrProd.retailPriceUSD || Math.round(nvrProd.retailPrice / 12850)
    });
  }

  // 3. Service / Installation
  const serviceProd = products.find(p => p.isService || p.category.toLowerCase().includes('montaj'));
  if (serviceProd) {
    recommendedItems.push({
      productId: serviceProd.id,
      productName: serviceProd.name,
      quantity: cameraCount,
      unitPriceUSD: serviceProd.retailPriceUSD || Math.round(serviceProd.retailPrice / 12850),
      totalPriceUSD: (serviceProd.retailPriceUSD || Math.round(serviceProd.retailPrice / 12850)) * cameraCount
    });
  }

  const commercialProposalText = 
    `Assalomu alaykum, ${clientName}!\n\n` +
    `Sizning ob'ektingiz uchun Smart Control CCTV kuzatuv tizimi tijoriy taklifi:\n` +
    `📹 Kameralar soni: ${cameraCount} ta nuqta\n` +
    `💰 Taxminiy qiymati: $${budgetUSD}\n` +
    `🛡️ Rasmiy kafolat: 24 oy\n` +
    `👷 Usta ko'rigi (O'lchash-hisoblash): Bepul\n\n` +
    `Savollaringiz bo'lsa, javob berishdan mamnunmiz!`;

  return {
    clientName,
    phone,
    objectType,
    source: lower.includes('insta') ? 'instagram' : lower.includes('tele') ? 'telegram' : 'phone',
    cameraCountEstimated: cameraCount,
    budgetEstimatedUSD: budgetUSD,
    assignedTechnicianName: matchedTech?.fullName,
    siteVisitDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    siteVisitTime: '14:00',
    notes: text,
    nextActionNote: 'O\'lchash-hisoblashga borish va smeta hisoblash',
    recommendedItems,
    commercialProposalText
  };
};

/**
 * Main AI Caller: Uses Google Gemini API if key is available, else local intelligent parser
 */
export const processCrmInputWithGemini = async (
  rawInput: string,
  products: Product[] = [],
  employees: Employee[] = []
): Promise<AiParsedCrmResult> => {
  const apiKey = getGeminiApiKey();
  const model = getGeminiModel() || 'gemini-1.5-flash';

  if (!apiKey) {
    // Return high quality local heuristic result
    return localHeuristicCrmParser(rawInput, products, employees);
  }

  const productsSummary = products.slice(0, 20).map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    priceUSD: p.retailPriceUSD || Math.round(p.retailPrice / 12850)
  }));

  const employeesSummary = employees.map(e => ({
    id: e.id,
    name: e.fullName,
    role: e.role
  }));

  const systemPrompt = `You are an expert AI CCTV and Security Systems CRM Assistant for 'Smart Control' company in Uzbekistan.
Analyze the user's voice transcription, chat, or request in Uzbek, Russian, or English, and extract structured CRM lead and quotation details.

Available warehouse products:
${JSON.stringify(productsSummary)}

Available technicians/engineers:
${JSON.stringify(employeesSummary)}

Return ONLY valid JSON (no markdown formatting, no backticks, no code fence) matching this TypeScript structure:
{
  "clientName": "string",
  "phone": "string (e.g. +998 90 123 45 67)",
  "address": "string or empty",
  "objectType": "xonadon" | "dokon" | "ofis" | "ombor_zavod" | "davlat" | "boshqa",
  "source": "phone" | "instagram" | "telegram" | "walk_in" | "recommendation" | "other",
  "cameraCountEstimated": number,
  "budgetEstimatedUSD": number,
  "assignedTechnicianName": "string or empty",
  "siteVisitDate": "YYYY-MM-DD",
  "siteVisitTime": "HH:MM",
  "notes": "string summary of request",
  "nextActionNote": "string (e.g. O'lchash-hisoblashga borish / Smeta yuborish)",
  "recommendedItems": [
    {
      "productId": "string matching available product id if possible",
      "productName": "string",
      "quantity": number,
      "unitPriceUSD": number,
      "totalPriceUSD": number
    }
  ],
  "commercialProposalText": "Polite, professional offer in Uzbek language with emojis, ready to be sent via Telegram"
}`;

  const candidateModels = [model, 'gemini-3.8-flash', 'gemini-flash-latest'].filter((v, i, a) => a.indexOf(v) === i);

  for (const currentModel of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: `Customer inquiry / Technician Voice Note:\n"${rawInput}"` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        console.warn(`Gemini model ${currentModel} returned status ${response.status}. Trying next candidate model...`);
        continue;
      }

      const data = await response.json();
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (candidateText) {
        const cleanJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          ...localHeuristicCrmParser(rawInput, products, employees),
          ...parsed
        };
      }
    } catch (error) {
      console.error(`Gemini model ${currentModel} fetch error:`, error);
    }
  }

  return localHeuristicCrmParser(rawInput, products, employees);
};
