import { Product, Transaction, SalesData, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
    getProducts: async (): Promise<Product[]> => {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },
    getTransactions: async (): Promise<Transaction[]> => {
        const res = await fetch(`${API_URL}/transactions`);
        if (!res.ok) throw new Error('Failed to fetch transactions');
        return res.json();
    },
    getSalesData: async (): Promise<SalesData[]> => {
        const res = await fetch(`${API_URL}/sales`);
        if (!res.ok) throw new Error('Failed to fetch sales data');
        const data = await res.json();
        return data.map((item: any) => ({
            ...item,
            revenue: Number(item.revenue),
            profit: Number(item.profit),
            orders: Number(item.orders)
        }));
    },
    getUsers: async (): Promise<User[]> => {
        const res = await fetch(`${API_URL}/users`);
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
    },
    createTransaction: async (data: Omit<Transaction, 'id' | 'status' | 'productName' | 'totalValue'>): Promise<{ success: boolean; id: number }> => {
        const res = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create transaction');
        return res.json();
    },
    updateTransaction: async (id: number | string, data: any): Promise<{ success: boolean }> => {
        const res = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update transaction');
        return res.json();
    },
    login: async (email, password) => {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Login failed');
        }
        return res.json();
    },
    createUser: async (user: Omit<User, 'id' | 'lastActive' | 'avatar'> & { password?: string }) => {
        const res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });
        if (!res.ok) throw new Error('Failed to create user');
        return res.json();
    },
    updateUser: async (id: string | number, user: Partial<User> & { password?: string }) => {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });
        if (!res.ok) throw new Error('Failed to update user');
        return res.json();
    },
    deleteUser: async (id: string | number) => {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete user');
        return res.json();
    }
};
