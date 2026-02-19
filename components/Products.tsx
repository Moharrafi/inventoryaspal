import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, X, Save, AlertTriangle, CheckCircle, Wand2, AlertCircle, LayoutGrid, List, MoreHorizontal, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';

export const Products: React.FC = () => {
    // State Management
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

    // Notification State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Fetch Products on Mount
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                const data = await api.getProducts();
                setProducts(data);
            } catch (error) {
                console.error('Failed to fetch products:', error);
                showNotification('Failed to load products. Please check the backend connection.', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Helper: Show Notification
    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        // Clear notification after 3 seconds
        const timer = setTimeout(() => {
            setNotification(null);
        }, 3000);
        return () => clearTimeout(timer); // Cleanup timeout to avoid memory leaks
    };
    const initialFormState: any = {
        name: '',
        sku: '',
        category: '20 kg',
        price: '',
        cost: '',
        stock: '',
        minStock: 5,
        status: 'Active',
    };

    const [formData, setFormData] = useState<any>(initialFormState);

    // Filter Logic
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );



    // Handlers
    const handleAddClick = () => {
        setFormData({
            ...initialFormState,
        });
        setCurrentProduct(null); // Null means we are in "Add" mode
        setIsFormOpen(true);
    };

    const handleEditClick = (product: Product) => {
        // When editing, we pass the numbers directly. 
        // Input type="number" handles numbers fine, but to allow clearing,
        // the state update logic needs to allow strings.
        setFormData({ ...product });
        setCurrentProduct(product); // Set current product for "Edit" mode
        setIsFormOpen(true);
    };

    const handleDeleteClick = (product: Product) => {
        setCurrentProduct(product);
        setIsDeleteOpen(true);
    };

    const generateSku = (name: string, category: string) => {
        const nameCode = name ? name.substring(0, 3).toUpperCase() : 'ASP';
        const catCode = category ? category.replace(' ', '').toUpperCase() : 'GEN';
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${nameCode}-${catCode}-${random}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Basic validation
            if (!formData.name || !formData.price) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }

            // Convert string inputs back to numbers for the data model
            const submissionData = {
                ...formData,
                price: Number(formData.price),
                cost: Number(formData.cost),
                stock: Number(formData.stock),
                minStock: Number(formData.minStock),
            };

            if (currentProduct) {
                // Edit Mode
                setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...submissionData, id: p.id, image: p.image } as Product : p));
                showNotification('Product updated successfully!', 'success');
            } else {
                // Add Mode - Generate SKU Automatically
                const autoSku = generateSku(formData.name || '', formData.category || '');

                const newProduct: Product = {
                    ...submissionData as Product,
                    sku: autoSku,
                    id: `P${Math.floor(Math.random() * 10000).toString().padStart(3, '0')}`,
                    image: 'https://picsum.photos/300/300?random=' + Math.floor(Math.random() * 1000) // Keep placeholder if needed by type, but unused in UI
                };
                setProducts(prev => [newProduct, ...prev]);
                showNotification('New product added successfully!', 'success');
            }

            setIsFormOpen(false);
        } catch (error) {
            showNotification('An error occurred while saving.', 'error');
        }
    };

    const confirmDelete = () => {
        if (currentProduct) {
            setProducts(prev => prev.filter(p => p.id !== currentProduct.id));
            setIsDeleteOpen(false);
            setCurrentProduct(null);
            showNotification('Product deleted successfully.', 'success');
        }
    };

    // Form Input Change Handler
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Allow the raw value to be set in state. 
        // This allows empty strings ("") which clears the input, solving the "cannot delete 0" issue.
        // It also prevents "07" issues because we don't force number parsing on every keystroke that might reformat it.
        setFormData((prev: any) => ({
            ...prev,
            [name]: value
        }));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-slate-500 text-sm font-medium animate-pulse">Loading products...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 relative">
            {/* Notification Toast - Top Center Elegant Style */}
            {notification && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border bg-white dark:bg-slate-800 animate-in slide-in-from-top-5 fade-in duration-300 ${notification.type === 'success' ? 'border-emerald-100 dark:border-emerald-900/30' : 'border-rose-100 dark:border-rose-900/30'
                    }`}>
                    <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                        {notification.type === 'success' ? <CheckCircle size={20} strokeWidth={2.5} /> : <AlertCircle size={20} strokeWidth={2.5} />}
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{notification.type === 'success' ? 'Success' : 'Error'}</p>
                        <p className="text-xs text-slate-500 font-medium dark:text-slate-400">{notification.message}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 dark:hover:text-slate-200 rounded-full transition-colors">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight dark:text-white">Product Catalog</h1>
                    <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">Manage inventory, pricing, and stock levels.</p>
                </div>
                <button
                    onClick={handleAddClick}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all shadow-sm active:scale-95 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                    <Plus size={16} />
                    Add Product
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* View Mode Toggle */}
                    <div className="flex bg-white border border-gray-200 rounded-lg p-1 dark:bg-slate-900 dark:border-slate-800">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-100 text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>

                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
                        <Filter size={16} />
                        <span className="hidden sm:inline">Filters</span>
                    </button>
                </div>
            </div>

            {/* Product Views */}
            {viewMode === 'list' ? (
                // TABLE VIEW
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-gray-200 dark:bg-slate-800/50 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Product Name / SKU</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Price</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Stock</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50/80 transition-colors group dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">{product.name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5 dark:text-slate-400">{product.sku} <span className="text-gray-300 mx-1 dark:text-slate-600">|</span> {product.category}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                                Rp {Number(product.price).toLocaleString('id-ID')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium ${product.stock <= product.minStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                    {product.stock}
                                                </span>
                                                <span className="text-xs text-slate-400">avail</span>
                                            </div>
                                            {product.stock <= product.minStock && (
                                                <div className="h-1 w-16 bg-rose-100 rounded-full mt-1 overflow-hidden dark:bg-rose-900/30">
                                                    <div className="h-full bg-rose-500 w-1/2"></div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-xs font-medium rounded-md border
                        ${product.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30' :
                                                    product.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' :
                                                        'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30'}`}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => handleEditClick(product)}
                                                    className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-colors dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                                                    title="Edit Product"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(product)}
                                                    className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-colors dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredProducts.length === 0 && (
                            <div className="p-10 text-center text-slate-400">
                                <p>No products found matching your search.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // GRID VIEW - NO IMAGES
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group dark:bg-slate-900 dark:border-slate-800 flex flex-col">

                            <div className="p-5 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border
                                ${product.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30' :
                                            product.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' :
                                                'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30'}`}>
                                        {product.status}
                                    </span>
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide bg-indigo-50 px-2 py-1 rounded border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">{product.category}</p>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight dark:text-white" title={product.name}>{product.name}</h3>
                                    <p className="text-xs text-slate-500 font-mono mt-1 dark:text-slate-400">{product.sku}</p>
                                </div>

                                <div className="mt-auto">
                                    <div className="flex justify-between items-end border-t border-gray-50 pt-4 dark:border-slate-800 mb-4">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-0.5">Price</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-200">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 mb-0.5">Stock</p>
                                            <p className={`font-bold ${product.stock <= product.minStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                                                {product.stock} <span className="text-[10px] font-normal text-slate-400">units</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions Overlay / Footer */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditClick(product)}
                                            className="flex-1 py-2 text-xs font-medium text-slate-700 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-100 transition-colors flex items-center justify-center gap-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                                        >
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(product)}
                                            className="py-2 px-3 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 border border-rose-100 transition-colors dark:bg-rose-900/20 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/40"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full p-10 text-center text-slate-400">
                            <p>No products found matching your search.</p>
                        </div>
                    )}
                </div>
            )}

            {/* --- ADD / EDIT MODAL --- */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-slate-900 dark:border dark:border-slate-800">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 dark:border-slate-800">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {currentProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-gray-100 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">Product Name</label>
                                    <input
                                        required
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        type="text"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                                        placeholder="e.g. Aspal Emulsion Premium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1 dark:text-slate-400">
                                        SKU Code
                                        {!currentProduct && <span className="bg-indigo-50 text-indigo-600 text-[10px] px-1.5 rounded border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">AUTO</span>}
                                    </label>
                                    <div className="relative">
                                        <input
                                            disabled
                                            name="sku"
                                            value={currentProduct ? formData.sku : 'Auto-generated upon save'}
                                            type="text"
                                            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-slate-500 cursor-not-allowed dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500"
                                        />
                                        {!currentProduct && <Wand2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400" />}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">Category (Size)</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                                    >
                                        <option value="1 kg">1 kg</option>
                                        <option value="5 kg">5 kg</option>
                                        <option value="20 kg">20 kg</option>
                                        <option value="25 kg">25 kg</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">Selling Price (Rp)</label>
                                    <input
                                        required
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">Cost Price (Rp)</label>
                                    <input
                                        required
                                        name="cost"
                                        value={formData.cost}
                                        onChange={handleInputChange}
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">Current Stock</label>
                                    <input
                                        required
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">Min. Stock Alert</label>
                                    <input
                                        required
                                        name="minStock"
                                        value={formData.minStock}
                                        onChange={handleInputChange}
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Low Stock">Low Stock</option>
                                        <option value="Out of Stock">Out of Stock</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                                >
                                    <Save size={16} />
                                    Save Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- DELETE MODAL --- */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-slate-900 dark:border dark:border-slate-800">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-rose-900/30 dark:text-rose-500">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2 dark:text-white">Delete Product?</h3>
                            <p className="text-sm text-slate-500 mb-6 dark:text-slate-400">
                                Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{currentProduct?.name}</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setIsDeleteOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors w-full"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};