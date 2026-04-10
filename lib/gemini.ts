const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface FinanceSummary {
  currency: string;
  month: string;
  spentTotal: number;
  incomeTotal: number;
  netFlow: number;
  categoryBreakdown: { label: string; total: number; percentage: number }[];
  budgetUtilization: { category: string; spent: number; limit: number; percentage: number; overLimit: boolean }[];
  totalWalletBalance: number;
  unsettledDebtsOwed: number;
  unsettledDebtsOwedToUser: number;
}

export async function getAIInsights(summary: FinanceSummary): Promise<string> {
  const prompt = buildPrompt(summary);

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No insights available.';
}

function buildPrompt(s: FinanceSummary): string {
  const categoryLines = s.categoryBreakdown.length
    ? s.categoryBreakdown.map((c) => `  - ${c.label}: ${s.currency}${c.total.toFixed(2)} (${c.percentage}%)`).join('\n')
    : '  - No expense data this month.';

  const budgetLines = s.budgetUtilization.length
    ? s.budgetUtilization.map((b) => `  - ${b.category}: ${b.percentage}% used (${s.currency}${b.spent.toFixed(2)} / ${s.currency}${b.limit.toFixed(2)})${b.overLimit ? ' ⚠️ OVER LIMIT' : ''}`).join('\n')
    : '  - No budgets set.';

  return `You are a friendly personal finance advisor. Analyze this user's financial data for ${s.month} and give 3-4 short, practical, personalized insights or tips. Be encouraging but honest. Use plain text only — no markdown, no asterisks, no bullet symbols. Separate each insight with a newline.

Financial Summary:
- Total wallet balance: ${s.currency}${s.totalWalletBalance.toFixed(2)}
- Monthly income: ${s.currency}${s.incomeTotal.toFixed(2)}
- Monthly spending: ${s.currency}${s.spentTotal.toFixed(2)}
- Net flow: ${s.currency}${s.netFlow.toFixed(2)}
- Unsettled debts owed by user: ${s.currency}${s.unsettledDebtsOwed.toFixed(2)}
- Unsettled debts owed to user: ${s.currency}${s.unsettledDebtsOwedToUser.toFixed(2)}

Top spending categories:
${categoryLines}

Budget utilization:
${budgetLines}

Give 3-4 concise insights in plain sentences. No bullet points or symbols.`;
}
