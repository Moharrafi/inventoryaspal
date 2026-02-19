import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product } from '../types';
import { ArrowUpRight, ArrowDownLeft, Calendar, Search, Download, Box, TrendingUp, TrendingDown, Plus, X, Save, CheckCircle, Truck, Globe, Store, ChevronDown, Lock, Unlock, Edit2, AlertCircle } from 'lucide-react';
import { Transaction } from '../types';

import { formatCurrency } from '../utils/format';

const CustomSelect = ({ options, value, onChange, placeholder }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const selectedOption = options.find((o: any) => String(o.value) === String(value));

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm flex justify-between items-center focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white group hover:bg-white hover:border-slate-300 transition-colors"
            >
                {selectedOption ? (
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="font-semibold text-slate-900 text-sm dark:text-white">{selectedOption.label}</span>
                        {(selectedOption.category || selectedOption.description) && (
                            <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 rounded border border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
                                {selectedOption.category || selectedOption.description}
                                {selectedOption.stock !== undefined && ` • Stock: ${selectedOption.stock}`}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-slate-500 dark:text-slate-400">{placeholder}</span>
                )}
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto flex flex-col dark:bg-slate-900 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-100 origin-top scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
                    <div className="p-1">
                        {options.map((option: any) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2.5 mb-1 rounded-lg hover:bg-indigo-50 flex justify-between items-center group transition-colors dark:hover:bg-slate-800 ${String(value) === String(option.value) ? 'bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800' : ''
                                    }`}
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className={`font-medium text-sm ${String(value) === String(option.value) ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {option.label}
                                    </span>
                                    {(option.category || option.description) && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{option.category || option.description}</span>
                                    )}
                                </div>
                                {option.stock !== undefined && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${option.stock > 0
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                        }`}>
                                        {option.stock}
                                    </span>
                                )}
                                {option.icon && (
                                    <span className="bg-slate-100 p-1.5 rounded-md text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-white group-hover:text-indigo-500 transition-colors">
                                        {option.icon}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const Inventory: React.FC = () => {
    // State for Transactions
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [txData, prodData] = await Promise.all([
                api.getTransactions(),
                api.getProducts()
            ]);
            setTransactions(txData);
            setProducts(prodData);
        } catch (error) {
            console.error('Failed to fetch inventory data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter States
    const [activeTab, setActiveTab] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Lock & Edit States
    const [isLocked, setIsLocked] = useState(true);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [editingTxId, setEditingTxId] = useState<string | number | null>(null);

    // Initial form state extended with new fields
    const initialFormState = {
        type: 'IN' as 'IN' | 'OUT',
        productId: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        supplier: '',
        channel: 'Online' as 'Online' | 'Offline'
    };

    const [formData, setFormData] = useState(initialFormState);

    // Derived Calculations
    const filteredTransactions = transactions.filter(t => {
        const matchesTab = activeTab === 'ALL' || t.type === activeTab;
        const matchesSearch = t.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.supplier && t.supplier.toLowerCase().includes(searchTerm.toLowerCase()));

        // Date Range Logic
        const matchesStartDate = startDate ? t.date >= startDate : true;
        const matchesEndDate = endDate ? t.date <= endDate : true;

        return matchesTab && matchesSearch && matchesStartDate && matchesEndDate;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm, startDate, endDate]);

    const totalInbound = transactions.filter(t => t.type === 'IN').reduce((acc, curr) => acc + Number(curr.totalValue), 0);
    const totalOutbound = transactions.filter(t => t.type === 'OUT').reduce((acc, curr) => acc + Number(curr.totalValue), 0);

    // Handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const selectedProduct = products.find(p => String(p.id) === String(formData.productId));

        if (!selectedProduct || !formData.quantity) return;

        const quantityNum = parseInt(formData.quantity);

        try {
            const payload = {
                date: formData.date,
                type: formData.type,
                productId: selectedProduct.id as string,
                quantity: quantityNum,
                notes: formData.notes,
                supplier: formData.type === 'IN' ? formData.supplier : undefined,
                channel: formData.type === 'OUT' ? formData.channel : undefined
            };

            if (editingTxId) {
                await api.updateTransaction(editingTxId, payload);
            } else {
                await api.createTransaction(payload);
            }

            // Refresh data
            fetchData();
            setIsModalOpen(false);
            setFormData(initialFormState);
            setEditingTxId(null);
        } catch (error) {
            console.error('Failed to save transaction:', error);
            alert('Failed to save transaction');
        }
    };

    const openModal = () => {
        setFormData(initialFormState);
        setEditingTxId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (tx: Transaction) => {
        setEditingTxId(tx.id);
        const prod = products.find(p => p.name === tx.productName); // Find product to get ID (since simplified tx might not have productId if derived differently, but backend sends productId usually. Check backend response)
        // Backend 'getTransactions' sends 'productId'.

        setFormData({
            type: tx.type,
            productId: String(tx.productId),
            quantity: String(tx.quantity),
            date: tx.date.split('T')[0],
            notes: tx.notes || '',
            supplier: tx.supplier || '',
            channel: (tx.channel as any) || 'Online'
        });
        setIsModalOpen(true);
    };

    const handleLockClick = () => {
        if (isLocked) {
            setIsPasswordModalOpen(true);
        } else {
            setIsLocked(true); // Re-lock
        }
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === 'admin123') {
            setIsLocked(false);
            setIsPasswordModalOpen(false);
            setPasswordInput('');
            setPasswordError(false);
        } else {
            setPasswordError(true);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight dark:text-white">Inventory Log</h1>
                    <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">Track stock movements and transaction history.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleLockClick}
                        className={`flex items-center justify-center p-2 rounded-lg border transition-all ${isLocked
                                ? 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 hover:text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
                                : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400'
                            }`}
                        title={isLocked ? "Unlock to Edit" : "Lock Editing"}
                    >
                        {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
                    </button>
                    <button
                        onClick={openModal}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm active:scale-95 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                    >
                        <Plus size={16} />
                        Record Transaction
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg dark:bg-indigo-900/30 dark:text-indigo-400">
                        <Box size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide dark:text-slate-400">Total Transactions</p>
                        <h3 className="text-xl font-bold text-slate-900 mt-1 dark:text-white">{transactions.length}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg dark:bg-emerald-900/30 dark:text-emerald-400">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide dark:text-slate-400">Inbound Value</p>
                        <h3 className="text-xl font-bold text-slate-900 mt-1 dark:text-white">{formatCurrency(totalInbound)}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-lg dark:bg-rose-900/30 dark:text-rose-400">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide dark:text-slate-400">Outbound Value</p>
                        <h3 className="text-xl font-bold text-slate-900 mt-1 dark:text-white">{formatCurrency(totalOutbound)}</h3>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
                {/* Toolbar */}
                <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full sm:w-auto pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0"
                                    placeholder="Start Date"
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                            <span className="text-slate-400 hidden sm:inline">-</span>
                            <div className="relative flex-1 sm:flex-none">
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full sm:w-auto pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0"
                                    placeholder="End Date"
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    title="Clear Dates"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg self-start lg:self-center dark:bg-slate-800 shrink-0">
                        {['ALL', 'IN', 'OUT'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`
                            px-4 py-1.5 text-xs font-semibold rounded-md transition-all
                            ${activeTab === tab
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}
                        `}
                            >
                                {tab === 'ALL' ? 'All' : tab === 'IN' ? 'Inbound' : 'Outbound'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 text-xs uppercase font-semibold text-slate-500 tracking-wider dark:bg-slate-800/50 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">Transaction Info</th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">Type</th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">Source / Channel</th>
                                <th className="px-6 py-4 border-b border-gray-100 text-right dark:border-slate-800">Quantity</th>
                                <th className="px-6 py-4 border-b border-gray-100 text-right dark:border-slate-800">Total Value</th>
                                <th className="px-6 py-4 border-b border-gray-100 text-center dark:border-slate-800">Status</th>
                                {!isLocked && (
                                    <th className="px-6 py-4 border-b border-gray-100 text-center dark:border-slate-800">Action</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {currentTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900 text-sm dark:text-white">{tx.productName}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">{tx.id}</span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            {tx.notes && <p className="text-xs text-slate-500 mt-1 italic dark:text-slate-400">"{tx.notes}"</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                    ${tx.type === 'IN'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                                : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30'
                                            }`}>
                                            {tx.type === 'IN' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                            {tx.type === 'IN' ? 'Stock In' : 'Stock Out'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tx.type === 'IN' ? (
                                            <div className="flex items-center gap-2">
                                                <Truck size={14} className="text-slate-400" />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {tx.supplier || 'Unknown Supplier'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${tx.channel === 'Online'
                                                ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
                                                : 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30'
                                                }`}>
                                                {tx.channel === 'Online' ? <Globe size={10} /> : <Store size={10} />}
                                                {tx.channel || 'Direct'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`font-semibold text-sm ${tx.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Rp {tx.totalValue.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                            {tx.status}
                                        </span>
                                    </td>
                                    {!isLocked && (
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleEdit(tx)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                                title="Edit Transaction"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={isLocked ? 6 : 7} className="px-6 py-12 text-center text-slate-400 text-sm">
                                        No transactions found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer/Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-slate-500 bg-gray-50/30 dark:bg-slate-800/30 dark:border-slate-800 dark:text-slate-400">
                    <span>
                        Showing {filteredTransactions.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} entries
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 border border-gray-200 bg-white rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                            Previous
                        </button>
                        <span className="flex items-center px-2">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-1.5 border border-gray-200 bg-white rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* --- ADD/EDIT TRANSACTION MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-slate-900 dark:border dark:border-slate-800">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 dark:border-slate-800">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {editingTxId ? 'Edit Transaction' : 'Record Transaction'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-gray-100 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">

                            {/* Transaction Type Toggle */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'IN' })}
                                    className={`py-3 px-4 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${formData.type === 'IN'
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-1 ring-emerald-500 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400'
                                        : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                        }`}
                                >
                                    <ArrowDownLeft size={18} /> Stock In (Inbound)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'OUT' })}
                                    className={`py-3 px-4 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${formData.type === 'OUT'
                                        ? 'bg-rose-50 border-rose-200 text-rose-700 ring-1 ring-rose-500 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400'
                                        : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                        }`}
                                >
                                    <ArrowUpRight size={18} /> Stock Out (Outbound)
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 dark:text-slate-400">Select Product</label>
                                <CustomSelect
                                    options={products.map(p => ({
                                        value: p.id,
                                        label: p.name,
                                        category: p.category,
                                        stock: p.stock
                                    }))}
                                    value={formData.productId}
                                    onChange={(val: string) => setFormData(prev => ({ ...prev, productId: val }))}
                                    placeholder="Select a product..."
                                />
                            </div>

                            {/* Conditional Fields based on Type */}
                            {formData.type === 'IN' ? (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 dark:text-slate-400">Supplier Name</label>
                                    <div className="relative">
                                        <input
                                            required={formData.type === 'IN'}
                                            name="supplier"
                                            type="text"
                                            value={formData.supplier}
                                            onChange={handleInputChange}
                                            placeholder="e.g. PT. Aspal Indo"
                                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                                        />
                                        <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 dark:text-slate-400">Sales Channel</label>
                                    <div className="relative">
                                        <CustomSelect
                                            options={[
                                                { value: 'Online', label: 'Online', description: 'Marketplace/Web', icon: <Globe size={14} /> },
                                                { value: 'Offline', label: 'Offline', description: 'Direct/Store', icon: <Store size={14} /> }
                                            ]}
                                            value={formData.channel}
                                            onChange={(val: string) => setFormData(prev => ({ ...prev, channel: val as any }))}
                                            placeholder="Select channel..."
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 dark:text-slate-400">Quantity</label>
                                    <input
                                        required
                                        name="quantity"
                                        type="number"
                                        min="1"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 dark:text-slate-400">Date</label>
                                    <div className="relative">
                                        <input
                                            required
                                            name="date"
                                            type="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0"
                                        />
                                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 dark:text-slate-400">Notes / Reference</label>
                                <textarea
                                    name="notes"
                                    rows={3}
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                                    placeholder="e.g. Project Sunter, Restock Supplier A..."
                                ></textarea>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-2 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${formData.type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                        }`}
                                >
                                    <Save size={16} />
                                    {editingTxId ? 'Update' : 'Save'} {formData.type === 'IN' ? 'Inbound' : 'Outbound'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- PASSWORD MODAL --- */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-slate-900 dark:border dark:border-slate-800">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center dark:border-slate-800">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Enter Password to Unlock</h2>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-gray-100 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordSubmit} className="p-6">
                            <p className="text-sm text-slate-500 mb-4 dark:text-slate-400">
                                Please enter the administrator password to edit transaction history.
                            </p>
                            <input
                                autoFocus
                                type="password"
                                value={passwordInput}
                                onChange={(e) => {
                                    setPasswordInput(e.target.value);
                                    setPasswordError(false);
                                }}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 mb-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                placeholder="Password..."
                            />
                            {passwordError && (
                                <p className="text-xs text-rose-500 flex items-center gap-1 mb-2">
                                    <AlertCircle size={12} /> Incorrect password. Try again.
                                </p>
                            )}
                            <button
                                type="submit"
                                className="w-full mt-2 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors dark:bg-indigo-600 dark:hover:bg-indigo-500"
                            >
                                Unlock Editing
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};