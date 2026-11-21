export const STOCK_CATEGORIES = [
  'Bebidas',
  'Cervezas',
  'Licuados y limonadas',
  'Tragos',
  'Comidas',
  'Galletitas',
  'Batas',
  'Ropa',
  'Otros',
] as const;

export type StockCategory = (typeof STOCK_CATEGORIES)[number];

export function isStockCategory(value: string): value is StockCategory {
  return (STOCK_CATEGORIES as readonly string[]).includes(value);
}

