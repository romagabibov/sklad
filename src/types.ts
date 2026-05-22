export type TransactionType = 'IN' | 'OUT' | 'DISPATCH';

export interface ProductVariant {
  id?: string;
  name: string; // e.g. "красная", "синяя"
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;      // Selling price
  costPrice: number;  // Purchase price (optional for basic setups)
  stock: number;      // Current stock level (could be calculated or generic)
  variants?: ProductVariant[];
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;      // Selling or purchasing price at the time of transaction
  total: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;       // ISO string
  items: TransactionItem[];
  totalAmount: number;
  recipientName?: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
}

export interface AttendanceRecord {
  id?: string;
  date: string; // YYYY-MM-DD
  workerId: string;
  isPresent: boolean;
}
