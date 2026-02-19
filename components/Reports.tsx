import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { api } from '../services/api';
import { Product, Transaction } from '../types';
import { Download, Printer, Calendar, TrendingUp, DollarSign, Percent, ArrowUpRight, TrendingDown, Activity, ChevronDown, FileText, Package, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Reports: React.FC = () => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
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
            console.error('Failed to fetch report data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Process Data for selected Year
    const monthlyData = React.useMemo(() => {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        return months.map((monthName, index) => {
            // Filter transactions for this month and selected year
            const monthTransactions = transactions.filter(t => {
                const date = new Date(t.date);
                return (
                    t.type === 'OUT' &&
                    date.getMonth() === index &&
                    date.getFullYear().toString() === selectedYear
                );
            });

            const orders = monthTransactions.length;

            // Calculate Revenue and Profit
            // Revenue = Sum(Qty * Price)
            // Profit = Sum(Qty * (Price - Cost))
            // Note: Using current product price/cost as historical snapshot is not available
            let revenue = 0;
            let profit = 0;

            monthTransactions.forEach(t => {
                const product = products.find(p => String(p.id) === String(t.productId));
                if (product) {
                    const qty = Number(t.quantity);
                    const price = Number(product.price);
                    const cost = Number(product.cost);

                    revenue += qty * price;
                    profit += qty * (price - cost);
                }
            });

            return {
                name: monthName,
                orders,
                revenue,
                profit
            };
        });
    }, [transactions, products, selectedYear]);

    // Aggregate Annual Stats
    const totalRevenue = monthlyData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalProfit = monthlyData.reduce((acc, curr) => acc + curr.profit, 0);
    const totalCost = totalRevenue - totalProfit;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Find month with highest profit
    const maxProfitMonth = [...monthlyData].sort((a, b) => b.profit - a.profit)[0];

    const downloadReport = (type: 'FINANCIAL' | 'INVENTORY' | 'TRANSACTIONS') => {
        const doc = new jsPDF();

        // Add Company Brand
        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42); // Slate 900
        doc.text("AspalPro Admin", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text("Aspal Emulsion Waterproofing Management System", 14, 26);

        // Line separator
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 32, 196, 32);

        // Report Meta
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);

        let title = "";
        let head: string[][] = [];
        let body: (string | number)[][] = [];

        if (type === 'FINANCIAL') {
            title = `Financial Report - Fiscal Year ${selectedYear}`;
            head = [['Month', 'Year', 'Orders', 'Revenue', 'Cost', 'Profit', 'Margin']];
            body = monthlyData.map(d => [
                d.name,
                selectedYear,
                d.orders,
                `Rp ${d.revenue.toLocaleString('id-ID')}`,
                `Rp ${(d.revenue - d.profit).toLocaleString('id-ID')}`,
                `Rp ${d.profit.toLocaleString('id-ID')}`,
                `${d.revenue > 0 ? ((d.profit / d.revenue) * 100).toFixed(1) : '0.0'}%`
            ]);
        } else if (type === 'INVENTORY') {
            title = "Inventory Stock Report";
            head = [['Product Name', 'Category', 'SKU', 'Stock', 'Status', 'Valuation']];
            body = products.map(p => [
                p.name,
                p.category,
                p.sku,
                p.stock,
                p.stock <= 0 ? 'Out of Stock' : p.stock <= p.minStock ? 'Low Stock' : 'Active',
                `Rp ${(p.stock * p.price).toLocaleString('id-ID')}`
            ]);
        } else if (type === 'TRANSACTIONS') {
            title = `Transaction History Log (${selectedYear})`;
            head = [['Date', 'Type', 'Product', 'Qty', 'Total Value', 'Status']];
            // Filter transactions for the selected year and sort by date descending
            const yearTransactions = transactions
                .filter(t => new Date(t.date).getFullYear().toString() === selectedYear)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            body = yearTransactions.map(t => [
                t.date,
                t.type === 'IN' ? 'INBOUND' : 'OUTBOUND',
                t.productName,
                t.type === 'IN' ? `+${t.quantity}` : `-${t.quantity}`,
                `Rp ${t.totalValue.toLocaleString('id-ID')}`,
                t.status
            ]);
        }

        doc.text(title, 14, 45);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 51);

        autoTable(doc, {
            head: head,
            body: body,
            startY: 60,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
                textColor: [51, 65, 85]
            },
            headStyles: {
                fillColor: [15, 23, 42],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { fontStyle: 'bold' } // First column bold
            }
        });

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
            doc.text('Confidential - For Internal Use Only', 14, 285);
        }

        doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        setIsExportMenuOpen(false);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-100 text-sm dark:bg-slate-900/95 dark:border-slate-800 dark:text-slate-100 z-50">
                    <p className="font-bold text-slate-900 mb-2 border-b border-gray-100 pb-2 dark:text-white dark:border-slate-800">{label} {selectedYear}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-6 mb-1">
                            <span className="text-slate-500 font-medium dark:text-slate-400 capitalize">{entry.name}:</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {entry.name === 'Margin' ? `${entry.value}%` : `Rp ${(entry.value / 1000000).toFixed(1)}M`}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-slate-500 text-sm font-medium animate-pulse">Generated Report Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300 relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-6 dark:border-slate-800">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight dark:text-white">Financial Reports</h1>
                    <p className="text-slate-500 text-sm mt-2 dark:text-slate-400">
                        Comprehensive analysis of revenue, expenses, and profit margins.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm dark:bg-slate-900 dark:border-slate-700">
                        <Calendar size={16} className="text-slate-400 mr-2" />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none dark:text-slate-200"
                        >
                            <option value="2026">Fiscal Year 2026</option>
                            <option value="2025">Fiscal Year 2025</option>
                            <option value="2024">Fiscal Year 2024</option>
                            <option value="2023">Fiscal Year 2023</option>
                        </select>
                    </div>

                    {/* Export Menu Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                        >
                            <Download size={16} />
                            Export PDF
                            <ChevronDown size={14} className={`transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isExportMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 dark:bg-slate-800 dark:border-slate-700">
                                <div className="px-4 py-2 border-b border-gray-50 dark:border-slate-700/50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select PDF Report</p>
                                </div>
                                <button onClick={() => downloadReport('FINANCIAL')} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-slate-700 flex items-center gap-3 transition-colors dark:text-slate-200 dark:hover:bg-slate-700/50">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg dark:bg-indigo-900/20 dark:text-indigo-400">
                                        <FileText size={16} />
                                    </div>
                                    <div>
                                        <span className="font-medium block">Financial Report</span>
                                        <span className="text-xs text-slate-400">Profit, Revenue & Margins</span>
                                    </div>
                                </button>
                                <button onClick={() => downloadReport('INVENTORY')} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-slate-700 flex items-center gap-3 transition-colors dark:text-slate-200 dark:hover:bg-slate-700/50">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg dark:bg-emerald-900/20 dark:text-emerald-400">
                                        <Package size={16} />
                                    </div>
                                    <div>
                                        <span className="font-medium block">Inventory Stock</span>
                                        <span className="text-xs text-slate-400">Current Stock Levels</span>
                                    </div>
                                </button>
                                <button onClick={() => downloadReport('TRANSACTIONS')} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-slate-700 flex items-center gap-3 transition-colors dark:text-slate-200 dark:hover:bg-slate-700/50">
                                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg dark:bg-rose-900/20 dark:text-rose-400">
                                        <Activity size={16} />
                                    </div>
                                    <div>
                                        <span className="font-medium block">Transaction Log</span>
                                        <span className="text-xs text-slate-400">Inbound & Outbound History</span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Overlay to close menu when clicking outside */}
                    {isExportMenuOpen && (
                        <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={() => setIsExportMenuOpen(false)}
                        />
                    )}

                    <button className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                        <Printer size={18} />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <DollarSign size={20} />
                        </div>
                        {/* Placeholder for Year-over-Year growth if needed */}
                        {/* <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">+12.5%</span> */}
                    </div>
                    <p className="text-indigo-100 text-sm font-medium">Total Revenue</p>
                    <h3 className="text-2xl font-bold mt-1">Rp {(totalRevenue / 1000000000).toFixed(2)}B</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg dark:bg-emerald-900/30 dark:text-emerald-400">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium dark:text-slate-400">Net Profit</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1 dark:text-white">Rp {(totalProfit / 1000000000).toFixed(2)}B</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg dark:bg-rose-900/30 dark:text-rose-400">
                            <TrendingDown size={20} />
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium dark:text-slate-400">Total Operational Cost</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1 dark:text-white">Rp {(totalCost / 1000000000).toFixed(2)}B</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-violet-50 text-violet-600 rounded-lg dark:bg-violet-900/30 dark:text-violet-400">
                            <Percent size={20} />
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium dark:text-slate-400">Avg. Profit Margin</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1 dark:text-white">{avgMargin.toFixed(1)}%</h3>
                </div>
            </div>

            {/* NEW: Split Charts for Specific Sales & Profit Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Monthly Sales Trend */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Sales Trend</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Revenue growth over time (Penjualan Perbulan)</p>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg dark:bg-indigo-900/20 dark:text-indigo-400">
                            <Activity size={20} />
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(value) => `${value / 1000000}M`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1 }} />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Revenue"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Company Profit Trend */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Company Profit</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Net earnings per month (Keuntungan)</p>
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg dark:bg-emerald-900/20 dark:text-emerald-400">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(value) => `${value / 1000000}M`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar
                                    dataKey="profit"
                                    name="Profit"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                    barSize={30}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Best performing month: <span className="font-bold text-emerald-600 dark:text-emerald-400">{maxProfitMonth?.name || '-'}</span> with <span className="font-bold text-slate-800 dark:text-white">Rp {maxProfitMonth?.profit.toLocaleString() || 0}</span> profit.
                        </p>
                    </div>
                </div>
            </div>

            {/* Detailed Data Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center dark:border-slate-800">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Breakdown</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Detailed financial data for the current fiscal year.</p>
                    </div>
                    <button onClick={() => downloadReport('FINANCIAL')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-lg transition-colors dark:bg-indigo-900/20 dark:text-indigo-300">
                        Download PDF Report
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 text-xs uppercase font-bold text-slate-500 tracking-wider dark:bg-slate-800/50 dark:text-slate-400">
                            <tr>
                                <th className="px-8 py-5">Month</th>
                                <th className="px-8 py-5 text-right">Orders</th>
                                <th className="px-8 py-5 text-right">Revenue</th>
                                <th className="px-8 py-5 text-right">Cost of Goods</th>
                                <th className="px-8 py-5 text-right">Net Profit</th>
                                <th className="px-8 py-5 text-right">Margin</th>
                                <th className="px-8 py-5 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                            {monthlyData.map((row, index) => {
                                const cost = row.revenue - row.profit;
                                const margin = row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(1) : '0.0';
                                return (
                                    <tr key={index} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/50">
                                        <td className="px-8 py-4 font-bold text-slate-900 dark:text-white">{row.name} {selectedYear}</td>
                                        <td className="px-8 py-4 text-right text-slate-600 dark:text-slate-400">{row.orders}</td>
                                        <td className="px-8 py-4 text-right font-medium text-slate-900 dark:text-slate-200">Rp {row.revenue.toLocaleString()}</td>
                                        <td className="px-8 py-4 text-right text-slate-500 dark:text-slate-400">Rp {cost.toLocaleString()}</td>
                                        <td className="px-8 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">Rp {row.profit.toLocaleString()}</td>
                                        <td className="px-8 py-4 text-right">
                                            <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold dark:bg-emerald-900/20 dark:text-emerald-400">{margin}%</span>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <button onClick={() => downloadReport('FINANCIAL')} className="text-slate-400 hover:text-indigo-600 transition-colors p-1" title="Download Monthly PDF">
                                                <Download size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};