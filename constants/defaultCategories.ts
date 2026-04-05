export type CategoryKind = 'expense' | 'income' | 'both';

export interface DefaultCategoryTemplate {
  name: string;
  icon: string;
  color: string;
  type: CategoryKind;
  sortOrder: number;
}

export const DEFAULT_SYSTEM_CATEGORIES: DefaultCategoryTemplate[] = [
  { name: 'Food & Dining', icon: 'restaurant-outline', color: '#E76F51', type: 'expense', sortOrder: 1 },
  { name: 'Groceries', icon: 'basket-outline', color: '#2A9D8F', type: 'expense', sortOrder: 2 },
  { name: 'Transportation', icon: 'car-outline', color: '#F4A261', type: 'expense', sortOrder: 3 },
  { name: 'Bills & Utilities', icon: 'flash-outline', color: '#E9C46A', type: 'expense', sortOrder: 4 },
  { name: 'Rent & Housing', icon: 'home-outline', color: '#457B9D', type: 'expense', sortOrder: 5 },
  { name: 'Health & Medical', icon: 'medkit-outline', color: '#E63946', type: 'expense', sortOrder: 6 },
  { name: 'Education', icon: 'school-outline', color: '#6D597A', type: 'expense', sortOrder: 7 },
  { name: 'Shopping', icon: 'bag-handle-outline', color: '#BC6C25', type: 'expense', sortOrder: 8 },
  { name: 'Entertainment', icon: 'game-controller-outline', color: '#9D4EDD', type: 'expense', sortOrder: 9 },
  { name: 'Travel', icon: 'airplane-outline', color: '#3A86FF', type: 'expense', sortOrder: 10 },
  { name: 'Personal Care', icon: 'cut-outline', color: '#D90429', type: 'expense', sortOrder: 11 },
  { name: 'Subscriptions', icon: 'repeat-outline', color: '#6C757D', type: 'expense', sortOrder: 12 },
  { name: 'Gifts & Donations', icon: 'gift-outline', color: '#F72585', type: 'both', sortOrder: 13 },
  { name: 'Pets', icon: 'paw-outline', color: '#2B9348', type: 'expense', sortOrder: 14 },
  { name: 'Miscellaneous', icon: 'apps-outline', color: '#6C757D', type: 'both', sortOrder: 15 },
  { name: 'Salary', icon: 'wallet-outline', color: '#2A9D8F', type: 'income', sortOrder: 101 },
  { name: 'Freelance', icon: 'briefcase-outline', color: '#3A86FF', type: 'income', sortOrder: 102 },
  { name: 'Business', icon: 'business-outline', color: '#4361EE', type: 'income', sortOrder: 103 },
  { name: 'Investments', icon: 'trending-up-outline', color: '#2B9348', type: 'income', sortOrder: 104 },
  { name: 'Allowance', icon: 'cash-outline', color: '#90BE6D', type: 'income', sortOrder: 105 },
  { name: 'Refunds', icon: 'return-down-back-outline', color: '#4D908E', type: 'income', sortOrder: 106 },
  { name: 'Gifts Received', icon: 'gift-outline', color: '#F72585', type: 'income', sortOrder: 107 },
  { name: 'Other Income', icon: 'add-circle-outline', color: '#2A9D8F', type: 'income', sortOrder: 108 },
];

const DEFAULT_BY_NAME = new Map(
  DEFAULT_SYSTEM_CATEGORIES.map((template) => [template.name.trim().toLowerCase(), template])
);

export const FALLBACK_CATEGORY_VISUALS = {
  expense: { name: 'Uncategorized', icon: 'wallet-outline', color: '#E68A2E' },
  income: { name: 'Income', icon: 'trending-up-outline', color: '#51A351' },
  both: { name: 'Uncategorized', icon: 'apps-outline', color: '#6C757D' },
} as const;

export const getDefaultTemplateByName = (name?: string | null) => {
  if (!name) return null;
  return DEFAULT_BY_NAME.get(name.trim().toLowerCase()) ?? null;
};