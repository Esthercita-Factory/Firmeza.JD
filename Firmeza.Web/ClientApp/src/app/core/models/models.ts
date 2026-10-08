export interface Product {
  id: number;
  name: string;
  category: string;
  description?: string;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
  sku: string;
}

export interface Customer {
  id: number;
  name: string;
  document: string;
  email?: string;
  phone?: string;
  age?: number;
  address?: string;
  totalPurchases?: number;
}

export interface SaleDetail {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  date: string | Date;
  customerId: number;
  customerName: string;
  itemsCount: number;
  subtotal: number;
  tax: number;
  totalAmount: number;
  details: SaleDetail[];
  status: 'Completada' | 'Pendiente' | 'Anulada' | 'Confirmada' | 'Entregada' | 'Cancelada' | 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';
  invoiceNumber: string;
}

export interface DashboardSummary {
  todaySales: number;
  todaySalesChange: number;
  newCustomers: number;
  newCustomersChange: number;
  lowStockProductsCount: number;
  averageTicket: number;
  averageTicketChange: number;
  weeklySales: { day: string; amount: number; isToday?: boolean }[];
  topProducts: { name: string; quantitySold: number; percentage: number }[];
  lowStockAlerts: Product[];
}
