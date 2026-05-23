export type UserRole = "admin" | "cashier";

export type NovaUser = {
  id: number;
  name: string;
  role: UserRole;
  pin: string;
  initials: string;
  color: string;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  sku: string;
  stock: number;
};

export type CartLine = Product & { qty: number };

export type PaymentMethod = "card" | "cash";

export type SaleCustomer = {
  name: string;
  phone: string;
};

export type Transaction = {
  id: string;
  items: CartLine[];
  subtotal: number;
  tax: number;
  gst: number;
  pst: number;
  total: number;
  discount: number;
  method: PaymentMethod;
  user: NovaUser;
  till: number;
  timestamp: Date;
  customer?: SaleCustomer | null;
  cashIn?: number | null;
};

export type AdminTab = "dashboard" | "transactions" | "products" | "staff";

export type SuspendedSale = {
  id: string;
  label: string;
  till: number;
  cashierName: string;
  cart: CartLine[];
  discountPct: number;
  customer: SaleCustomer | null;
  suspendedAt: Date;
};
