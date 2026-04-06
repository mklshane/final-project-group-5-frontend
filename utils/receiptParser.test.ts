import { parseReceipt } from './receiptParser';

const SAMPLE = `
JOLLIBEE FOODS CORPORATION
Date: 03/22/2026
1x Chickenjoy 1pc         89.00
1x Jolly Spaghetti        89.00
TOTAL                    178.00
`;

const result = parseReceipt(SAMPLE);

console.assert(result.totalAmount === 178, `Expected 178, got ${String(result.totalAmount)}`);
console.assert(result.date === '2026-03-22', `Expected 2026-03-22, got ${String(result.date)}`);
console.assert(result.suggestedCategory === 'Food', `Expected Food, got ${String(result.suggestedCategory)}`);
