import { Product, SalesData, Transaction, User } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'P001',
    name: 'Aspal Emulsion Waterproofing - Premium',
    sku: 'AE-20KG-PREM',
    category: '20 kg',
    price: 450000,
    cost: 320000,
    stock: 150,
    minStock: 20,
    status: 'Active',
    image: 'https://picsum.photos/100/100?random=1'
  },
  {
    id: 'P002',
    name: 'Aspal Emulsion Regular',
    sku: 'AE-25KG-REG',
    category: '25 kg',
    price: 550000,
    cost: 400000,
    stock: 12,
    minStock: 5,
    status: 'Active',
    image: 'https://picsum.photos/100/100?random=2'
  },
  {
    id: 'P003',
    name: 'Bitumen Primer',
    sku: 'BP-5KG-STD',
    category: '5 kg',
    price: 125000,
    cost: 85000,
    stock: 8,
    minStock: 15,
    status: 'Low Stock',
    image: 'https://picsum.photos/100/100?random=3'
  },
  {
    id: 'P004',
    name: 'Aspal Bakar Murni',
    sku: 'AB-1KG-01',
    category: '1 kg',
    price: 15000,
    cost: 9000,
    stock: 5000,
    minStock: 1000,
    status: 'Active',
    image: 'https://picsum.photos/100/100?random=4'
  },
  {
    id: 'P005',
    name: 'Membrane Bakar Primer',
    sku: 'MB-20KG-PR',
    category: '20 kg',
    price: 450000,
    cost: 300000,
    stock: 0,
    minStock: 10,
    status: 'Out of Stock',
    image: 'https://picsum.photos/100/100?random=5'
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TRX-001', date: '2023-10-25', type: 'OUT', productId: 'P001', productName: 'Aspal Emulsion - Premium', quantity: 10, totalValue: 4500000, status: 'Completed', notes: 'Project A', channel: 'Offline' },
  { id: 'TRX-002', date: '2023-10-24', type: 'OUT', productId: 'P002', productName: 'Aspal Emulsion Regular', quantity: 2, totalValue: 1100000, status: 'Completed', notes: 'Tokopedia Order #123', channel: 'Online' },
  { id: 'TRX-003', date: '2023-10-24', type: 'IN', productId: 'P001', productName: 'Aspal Emulsion - Premium', quantity: 100, totalValue: 32000000, status: 'Completed', notes: 'Restock Batch 55', supplier: 'PT. Aspal Indo' },
  { id: 'TRX-004', date: '2023-10-23', type: 'OUT', productId: 'P003', productName: 'Bitumen Primer', quantity: 5, totalValue: 625000, status: 'Completed', notes: 'Shopee Order #999', channel: 'Online' },
  { id: 'TRX-005', date: '2023-10-22', type: 'IN', productId: 'P004', productName: 'Aspal Bakar Murni', quantity: 2000, totalValue: 18000000, status: 'Completed', notes: 'Bulk Import', supplier: 'CV. Sumber Rejeki' },
];

export const MOCK_SALES_DATA: SalesData[] = [
  { name: 'Jan', revenue: 120000000, profit: 45000000, orders: 120 },
  { name: 'Feb', revenue: 135000000, profit: 52000000, orders: 132 },
  { name: 'Mar', revenue: 110000000, profit: 38000000, orders: 105 },
  { name: 'Apr', revenue: 155000000, profit: 60000000, orders: 150 },
  { name: 'May', revenue: 180000000, profit: 75000000, orders: 185 },
  { name: 'Jun', revenue: 170000000, profit: 68000000, orders: 160 },
  { name: 'Jul', revenue: 195000000, profit: 82000000, orders: 200 },
  { name: 'Aug', revenue: 210000000, profit: 90000000, orders: 220 },
  { name: 'Sep', revenue: 205000000, profit: 88000000, orders: 215 },
  { name: 'Oct', revenue: 240000000, profit: 105000000, orders: 250 },
];

export const MOCK_USERS: User[] = [
  { id: 'U001', name: 'Admin Utama', role: 'Admin', email: 'admin@aspalpro.com', lastActive: 'Now', avatar: 'https://picsum.photos/40/40?random=10' },
  { id: 'U002', name: 'Budi Santoso', role: 'Manager', email: 'budi@aspalpro.com', lastActive: '2h ago', avatar: 'https://picsum.photos/40/40?random=11' },
  { id: 'U003', name: 'Siti Aminah', role: 'Staff', email: 'siti@aspalpro.com', lastActive: '1d ago', avatar: 'https://picsum.photos/40/40?random=12' },
];