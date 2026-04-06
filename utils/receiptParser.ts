export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ParsedReceipt {
  storeName: string | null;
  totalAmount: number | null;
  date: string | null;
  items: ReceiptItem[];
  suggestedCategory: string;
  confidence: 'high' | 'medium' | 'low';
  rawText: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: [
    'restaurant', 'cafe', 'coffee', 'diner', 'pizza', 'burger', 'sushi',
    'bakery', 'grill', 'kitchen', 'food', 'eat', 'meal', 'jollibee',
    'mcdonalds', 'kfc', 'chowking', 'mang inasal', 'greenwich',
    'starbucks', 'tim hortons', 'dunkin', 'subway', 'wendy',
    'grocery', 'supermarket', 'market', 'puregold', 'sm supermarket',
    'robinsons', 'metro', 'savemore', 's&r', 'landers',
  ],
  Transport: [
    'grab', 'angkas', 'uber', 'taxi', 'gas', 'fuel', 'petrol',
    'shell', 'petron', 'caltex', 'parking', 'toll', 'lrt', 'mrt',
    'bus', 'jeep', 'tricycle', 'beep',
  ],
  Shopping: [
    'mall', 'shop', 'store', 'uniqlo', 'h&m', 'zara', 'nike',
    'sm store', 'department', 'lazada', 'shopee', 'amazon',
    'clothing', 'fashion', 'shoes', 'accessories',
  ],
  Bills: [
    'electric', 'water', 'internet', 'globe', 'smart', 'pldt',
    'meralco', 'maynilad', 'manila water', 'converge',
    'netflix', 'spotify', 'youtube', 'subscription', 'premium',
    'insurance', 'rent', 'mortgage',
  ],
  Health: [
    'pharmacy', 'drug', 'mercury', 'watsons', 'hospital', 'clinic',
    'medical', 'dental', 'doctor', 'medicine', 'vitamin',
    'laboratory', 'lab', 'checkup',
  ],
  Education: [
    'school', 'university', 'college', 'book', 'tuition',
    'national bookstore', 'fullybooked', 'supplies', 'notebook',
  ],
  Entertainment: [
    'cinema', 'movie', 'sm cinema', 'imax', 'concert', 'ticket',
    'bowling', 'arcade', 'karaoke', 'bar', 'club',
  ],
};

const KNOWN_STORES: string[] = [
  'jollibee', 'mcdonalds', 'kfc', 'chowking', 'mang inasal',
  'greenwich', 'starbucks', 'tim hortons', 'dunkin donuts',
  'puregold', 'sm supermarket', 'robinsons supermarket',
  'savemore', 's&r', 'landers', 'metro supermarket',
  'mercury drug', 'watsons', '7-eleven', 'ministop',
  'shell', 'petron', 'caltex', 'uniqlo', 'sm store',
  'national bookstore', 'fully booked',
];

export function parseReceipt(rawText: string): ParsedReceipt {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const storeName = extractStoreName(lines);
  const totalAmount = extractTotalAmount(lines);
  const date = extractDate(lines);
  const items = extractItems(lines);
  const suggestedCategory = guessCategory(rawText, storeName);
  const confidence = calculateConfidence(storeName, totalAmount, date);

  return {
    storeName,
    totalAmount,
    date,
    items,
    suggestedCategory,
    confidence,
    rawText,
  };
}

function extractStoreName(lines: string[]): string | null {
  const fullText = lines.join(' ').toLowerCase();
  for (const store of KNOWN_STORES) {
    if (fullText.includes(store)) {
      return store
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    if (line.length < 3 || line.length > 40) continue;
    if (/^\d/.test(line)) continue;
    if (/^\*/.test(line)) continue;
    if (/^[-=]+$/.test(line)) continue;
    if (/\d{4,}/.test(line)) continue;
    if (/tel|phone|fax|vat|tin|reg/i.test(line)) continue;

    return line.replace(/[*#=]/g, '').trim();
  }

  return null;
}

function extractTotalAmount(lines: string[]): number | null {
  const totalPatterns = [
    /total\s*(?:due|amount|sale|:)?\s*[₱P]?\s*([\d,]+\.?\d*)/i,
    /grand\s*total\s*[₱P]?\s*([\d,]+\.?\d*)/i,
    /amount\s*(?:due|tendered)?\s*[₱P]?\s*([\d,]+\.?\d*)/i,
    /(?:sub)?total\s*[₱P]?\s*([\d,]+\.?\d*)/i,
    /[₱P]\s*([\d,]+\.\d{2})\s*$/i,
  ];

  const reversed = [...lines].reverse();

  for (const line of reversed) {
    const isSubtotal = /sub\s*total/i.test(line);

    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match) {
        const amount = parseAmount(match[1]);
        if (amount && amount > 0 && amount < 1_000_000) {
          if (isSubtotal) continue;
          return amount;
        }
      }
    }
  }

  let largest = 0;
  for (const line of reversed) {
    const amounts = line.match(/[\d,]+\.\d{2}/g);
    if (!amounts) continue;

    for (const amountText of amounts) {
      const value = parseAmount(amountText);
      if (value && value > largest && value < 1_000_000) {
        largest = value;
      }
    }
  }

  return largest > 0 ? largest : null;
}

function parseAmount(str: string): number | null {
  if (!str) return null;
  const cleaned = str.replace(/,/g, '');
  const num = Number.parseFloat(cleaned);
  return Number.isNaN(num) ? null : Math.round(num * 100) / 100;
}

function extractDate(lines: string[]): string | null {
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})/i,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s+(\d{4})/i,
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})(?!\d)/,
  ];

  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };

  for (const line of lines) {
    for (let patternIndex = 0; patternIndex < datePatterns.length; patternIndex++) {
      const match = line.match(datePatterns[patternIndex]);
      if (!match) continue;

      try {
        let year: string;
        let month: string;
        let day: string;

        if (patternIndex === 0) {
          month = match[1].padStart(2, '0');
          day = match[2].padStart(2, '0');
          year = match[3];
        } else if (patternIndex === 1) {
          year = match[1];
          month = match[2].padStart(2, '0');
          day = match[3].padStart(2, '0');
        } else if (patternIndex === 2) {
          day = match[1].padStart(2, '0');
          month = months[match[2].slice(0, 3).toLowerCase()];
          year = match[3];
        } else if (patternIndex === 3) {
          month = months[match[1].slice(0, 3).toLowerCase()];
          day = match[2].padStart(2, '0');
          year = match[3];
        } else {
          month = match[1].padStart(2, '0');
          day = match[2].padStart(2, '0');
          year = `20${match[3]}`;
        }

        if (!month) continue;

        const m = Number.parseInt(month, 10);
        const d = Number.parseInt(day, 10);
        if (m < 1 || m > 12 || d < 1 || d > 31) continue;

        return `${year}-${month}-${day}`;
      } catch {
        continue;
      }
    }
  }

  return null;
}

function extractItems(lines: string[]): ReceiptItem[] {
  const items: ReceiptItem[] = [];

  const itemPatterns = [
    /^(\d+)\s*[xX]\s+(.+?)\s+([\d,]+\.\d{2})$/,
    /^(.+?)\s{2,}(\d+)\s+([\d,]+\.\d{2})$/,
    /^(.+?)\s{2,}([\d,]+\.\d{2})$/,
  ];

  const skipWords = [
    'total', 'subtotal', 'sub total', 'change', 'cash', 'tendered',
    'vat', 'tax', 'discount', 'service charge', 'thank you',
    'receipt', 'official', 'invoice', 'tin', 'address',
    'tel', 'phone', 'date', 'time', 'cashier', 'terminal',
  ];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (skipWords.some((word) => lower.includes(word))) continue;
    if (/^[-=*]+$/.test(line)) continue;
    if (line.length < 5) continue;

    for (const pattern of itemPatterns) {
      const match = line.match(pattern);
      if (!match) continue;

      let name: string;
      let quantity: number;
      let totalPrice: number;

      if (pattern === itemPatterns[0]) {
        quantity = Number.parseInt(match[1], 10);
        name = match[2].trim();
        totalPrice = parseAmount(match[3]) || 0;
      } else if (pattern === itemPatterns[1]) {
        name = match[1].trim();
        quantity = Number.parseInt(match[2], 10);
        totalPrice = parseAmount(match[3]) || 0;
      } else {
        name = match[1].trim();
        quantity = 1;
        totalPrice = parseAmount(match[2]) || 0;
      }

      if (name.length < 2 || name.length > 60) continue;
      if (totalPrice <= 0 || totalPrice > 100_000) continue;
      if (quantity <= 0 || quantity > 100) continue;
      if (/^\d+$/.test(name)) continue;

      items.push({
        name: cleanItemName(name),
        quantity,
        unitPrice: Math.round((totalPrice / quantity) * 100) / 100,
        totalPrice,
      });

      break;
    }
  }

  return items;
}

function cleanItemName(name: string): string {
  return name
    .replace(/[*#]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function guessCategory(rawText: string, storeName: string | null): string {
  const searchText = `${rawText} ${storeName || ''}`.toLowerCase();

  let bestCategory = 'Others';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        score += keyword.length;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

function calculateConfidence(
  storeName: string | null,
  totalAmount: number | null,
  date: string | null
): 'high' | 'medium' | 'low' {
  let score = 0;
  if (storeName) score++;
  if (totalAmount) score++;
  if (date) score++;

  if (score >= 3) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}
