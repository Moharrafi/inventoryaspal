export interface Product {
  id: string | number;
  name: string;
  sku: string;
  category: '1 kg' | '5 kg' | '20 kg' | '25 kg';
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  status: 'Active' | 'Low Stock' | 'Out of Stock';
  image?: string;
}

export interface Transaction {
  id: string | number;
  date: string;
  type: 'IN' | 'OUT';
  productId: string;
  productName: string;
  quantity: number;
  totalValue: number;
  notes?: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  supplier?: string;           // New: For IN transactions
  channel?: 'Online' | 'Offline'; // New: For OUT transactions
}

export interface User {
  id: string | number;
  name: string;
  role: 'Admin' | 'Manager' | 'Staff';
  email: string;
  lastActive: string;
  avatar: string;
}

export interface SalesData {
  name: string;
  revenue: number;
  profit: number;
  orders: number;
}

export enum Page {
  DASHBOARD = 'DASHBOARD',
  PRODUCTS = 'PRODUCTS',
  INVENTORY = 'INVENTORY',
  REPORTS = 'REPORTS',
  USERS = 'USERS',
  SETTINGS = 'SETTINGS',
}