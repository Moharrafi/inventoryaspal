import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { api } from '../services/api';
import { Product, Transaction, SalesData } from '../types';
import { Loader2 } from 'lucide-react';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertCircle, ArrowUpRight, Sun, Moon, ChevronRight, X, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/format';

const COLORS = ['#1e293b', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const StatCard = ({ title, value, trend, trendValue, icon: Icon }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 dark:bg-slate-900 dark:border-slate-800">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-gray-50 rounded-lg text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
          {trend === 'up' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
          {trendValue}
        </div>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <h3 className="text-2xl font-semibold text-slate-900 tracking-tight mt-1 dark:text-white">{value}</h3>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-100 text-sm dark:bg-slate-900/95 dark:border-slate-800 dark:text-slate-100 z-50">
        <p className="font-bold text-slate-900 mb-2 border-b border-gray-100 pb-2 dark:text-white dark:border-slate-800">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm" style={{ backgroundColor: entry.color || entry.fill }}></div>
                <span className="text-slate-600 font-medium dark:text-slate-400">{entry.name}</span>
              </div>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {entry.name === 'Profit'
                  ? `Rp ${entry.value.toLocaleString()}`
                  : `${entry.value.toLocaleString()} units`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface DashboardProps {
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ isDarkMode, toggleTheme }) => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTopProductsModalOpen, setIsTopProductsModalOpen] = useState(false);
  const [selectedCategoryMonth, setSelectedCategoryMonth] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodData, transData] = await Promise.all([
          api.getProducts(),
          api.getTransactions()
        ]);
        setProducts(prodData);
        setTransactions(transData);

        // Calculate Monthly Sales Data from Transactions
        const currentYear = new Date().getFullYear();
        const monthlyData = MONTHS.map((month, index) => {
          // Filter transactions for this month and current year
          const monthTransactions = transData.filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'OUT' &&
              tDate.getMonth() === index &&
              tDate.getFullYear() === currentYear;
          });

          const orders = monthTransactions.reduce((acc, t) => acc + Number(t.quantity), 0);

          // Calculate revenue: quantity * price 
          // Note: Transaction doesn't store price snapshot, so we lookup current product price.
          // In a real app, transaction should store the price at time of sale.
          const revenue = monthTransactions.reduce((acc, t) => {
            const product = prodData.find(p => String(p.id) === String(t.productId));
            return acc + (Number(t.quantity) * (product ? Number(product.price) : 0));
          }, 0);

          // Profit approximation: revenue - (quantity * cost)
          const profit = monthTransactions.reduce((acc, t) => {
            const product = prodData.find(p => String(p.id) === String(t.productId));
            if (!product) return acc;
            const saleValue = Number(t.quantity) * Number(product.price);
            const costValue = Number(t.quantity) * Number(product.cost);
            return acc + (saleValue - costValue);
          }, 0);

          return {
            name: month,
            orders,
            revenue,
            profit
          };
        });

        setSalesData(monthlyData);

      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-500 text-sm font-medium animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  // General Stats Calculations
  const totalRevenue = salesData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalProfit = salesData.reduce((acc, curr) => acc + curr.profit, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  // Trend Calculations (Month over Month)
  const getMonthlyStats = (targetDate: Date) => {
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    const monthTx = transactions.filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'OUT' && tDate.getMonth() === targetMonth && tDate.getFullYear() === targetYear;
    });

    const revenue = monthTx.reduce((acc, t) => {
      const product = products.find(p => String(p.id) === String(t.productId));
      return acc + (Number(t.quantity) * (product ? Number(product.price) : 0));
    }, 0);

    const profit = monthTx.reduce((acc, t) => {
      const product = products.find(p => String(p.id) === String(t.productId));
      if (!product) return acc;
      return acc + (Number(t.quantity) * (Number(product.price) - Number(product.cost)));
    }, 0);

    return { revenue, profit };
  };

  const currentDate = new Date();
  const prevDate = new Date();
  prevDate.setMonth(currentDate.getMonth() - 1);

  const currentMonthStats = getMonthlyStats(currentDate);
  const prevMonthStats = getMonthlyStats(prevDate);

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { direction: 'up', value: '0%' }; // No previous data to compare
    const diff = current - previous;
    const percentage = (diff / previous) * 100;
    return {
      direction: percentage >= 0 ? 'up' : 'down',
      value: `${Math.abs(percentage).toFixed(1)}%`
    };
  };

  const revenueTrend = calculateTrend(currentMonthStats.revenue, prevMonthStats.revenue);
  const profitTrend = calculateTrend(currentMonthStats.profit, prevMonthStats.profit);

  // Stock Distribution Data (By Category)
  const stockByCategory = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + Number(product.stock);
    return acc;
  }, {} as Record<string, number>);

  const stockData = Object.entries(stockByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalStock = stockData.reduce((a, b) => a + Number(b.value), 0);

  // Category Sales Logic for Modal
  // 1. Filter OUT transactions
  // 2. Filter by Selected Month
  // 3. Map transaction to product to get category
  // 4. Aggregate quantity by category
  const categorySalesMap = transactions
    .filter(t => {
      // Must be an OUT transaction
      if (t.type !== 'OUT') return false;

      // Month Filter Logic
      if (selectedCategoryMonth === 'ALL') return true;

      const txDate = new Date(t.date);
      const txMonth = txDate.toLocaleString('default', { month: 'short' }); // e.g., "Oct", "Jan"
      return txMonth === selectedCategoryMonth;
    })
    .reduce((acc: Record<string, number>, curr) => {
      const product = products.find(p => p.id === curr.productId);
      if (product) {
        acc[product.category] = (acc[product.category] || 0) + curr.quantity;
      }
      return acc;
    }, {});

  const categorySalesData = Object.keys(categorySalesMap).map(cat => ({
    name: cat,
    sales: categorySalesMap[cat]
  })).sort((a, b) => b.sales - a.sales);

  // Product Performance Data (Full List)
  const productPerformanceData = products
    .map(product => {
      const currentYear = new Date().getFullYear();
      const soldCount = transactions
        .filter(t => {
          const tDate = new Date(t.date);
          return t.type === 'OUT' &&
            (String(t.productId) === String(product.id)) &&
            tDate.getFullYear() === currentYear;
        })
        .reduce((acc, curr) => acc + Number(curr.quantity), 0);
      return { ...product, soldCount };
    })
    .sort((a, b) => b.soldCount - a.soldCount);

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-500 relative">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-200 pb-6 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight dark:text-white">Executive Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">Overview of financial performance and inventory health.</p>
          </div>
          <div className="flex gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm border
                    ${isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700'
                  : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
                }`}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            trend={revenueTrend.direction}
            trendValue={revenueTrend.value}
            icon={DollarSign}
          />
          <StatCard
            title="Net Profit"
            value={formatCurrency(totalProfit)}
            trend={profitTrend.direction}
            trendValue={profitTrend.value}
            icon={ArrowUpRight}
          />
          <StatCard
            title="Active Products"
            value={products.length}
            trend="up" trendValue="Catalog" icon={Package}
          />
          <StatCard
            title="Low Stock"
            value={lowStockCount}
            trend={lowStockCount > 0 ? "down" : "up"}
            trendValue={lowStockCount > 0 ? "Attention" : "Healthy"}
            icon={AlertCircle}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Monthly Performance</h3>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span className="text-slate-500 dark:text-slate-400">Units Sold</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-500 dark:text-slate-400">Profit</span>
                </div>
              </div>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />

                  {/* Left Axis - Profit */}
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#10b981', fontSize: 11 }}
                    tickFormatter={(value) => formatCurrency(value).replace('Rp ', '')}
                  />

                  {/* Right Axis - Units */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6366f1', fontSize: 11 }}
                  />

                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />

                  {/* Profit Area */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                    name="Profit"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                  />

                  {/* Units Area */}
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUnits)"
                    name="Units Sold"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart with Detail Link */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800 relative">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Inventory Distribution</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Stock level by product category</p>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                View Breakdown <ChevronRight size={14} />
              </button>
            </div>

            <div className="h-[250px] w-full relative flex-1 min-h-[250px]">
              {/* Center Text Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
                <span className="text-3xl font-bold text-slate-800 dark:text-white">{totalStock}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">UNITS</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {stockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', bottom: '0px', width: '100%', color: isDarkMode ? '#94a3b8' : '#64748b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Product Performance Table Snippet */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Top Performing Products</h3>
            <button
              onClick={() => setIsTopProductsModalOpen(true)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">SKU</th>
                  <th className="px-6 py-3 font-medium">Size</th>
                  <th className="px-6 py-3 font-medium text-right">Price</th>
                  <th className="px-6 py-3 font-medium text-right">Sold ({new Date().getFullYear()})</th>
                  <th className="px-6 py-3 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {productPerformanceData
                  .slice(0, 5)
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-200">{p.name}</td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{p.sku}</td>
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{p.category}</td>
                      <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">Rp {Number(p.price).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{p.soldCount}</td>
                      <td className="px-6 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">Rp {(Number(p.price) * p.soldCount).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- CATEGORY SALES BREAKDOWN MODAL --- */}
      {isCategoryModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-slate-900 dark:border dark:border-slate-800 flex flex-col max-h-[90vh]">

            {/* Header with Month Filter */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 dark:border-slate-800 gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Category Sales</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Units sold per category</p>
              </div>

              {/* Month Filter Dropdown */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
                <Calendar size={14} className="text-slate-400" />
                <select
                  value={selectedCategoryMonth}
                  onChange={(e) => setSelectedCategoryMonth(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none dark:text-slate-200 cursor-pointer"
                >
                  <option value="ALL">All Time</option>
                  <option disabled>──────────</option>
                  {MONTHS.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-gray-100 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Bar Chart Visualization */}
              <div className="h-64 w-full mb-8 bg-gray-50 rounded-lg p-4 border border-gray-100 dark:bg-slate-800/50 dark:border-slate-800">
                {categorySalesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categorySalesData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 12 }}
                        width={60}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#0f172a' : '#fff',
                          borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                          borderRadius: '8px',
                          color: isDarkMode ? '#fff' : '#000'
                        }}
                      />
                      <Bar dataKey="sales" name="Units Sold" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <AlertCircle size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">No sales found for <span className="font-semibold">{selectedCategoryMonth === 'ALL' ? 'all time' : selectedCategoryMonth}</span>.</p>
                  </div>
                )}
              </div>

              {/* Detailed Table */}
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Detailed Breakdown</h3>
                <span className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
                  {selectedCategoryMonth === 'ALL' ? 'Lifetime Data' : `Month: ${selectedCategoryMonth}`}
                </span>
              </div>

              <div className="overflow-hidden border border-gray-200 rounded-lg dark:border-slate-800">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">SKU</th>
                      <th className="px-6 py-3 text-right">Units Sold</th>
                      <th className="px-6 py-3 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {(() => {
                      // Logic to aggregate sales by PRODUCT for the table
                      const filteredTx = transactions.filter(t => {
                        if (t.type !== 'OUT') return false;
                        if (selectedCategoryMonth === 'ALL') return true;
                        const txDate = new Date(t.date);
                        const txMonth = txDate.toLocaleString('default', { month: 'short' });
                        return txMonth === selectedCategoryMonth;
                      });

                      const productSalesMap = filteredTx.reduce((acc: Record<string, number>, curr) => {
                        acc[curr.productId] = (acc[curr.productId] || 0) + curr.quantity;
                        return acc;
                      }, {});

                      const totalSales = filteredTx.reduce((acc, curr) => acc + curr.quantity, 0);

                      const productSalesData = Object.keys(productSalesMap).map(pid => {
                        const product = products.find(p => String(p.id) === String(pid));
                        return {
                          product,
                          sales: productSalesMap[pid]
                        };
                      })
                        .filter(item => item.product) // Ensure product exists
                        .sort((a, b) => b.sales - a.sales);

                      if (productSalesData.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-slate-400">No transactions found for this period.</td>
                          </tr>
                        );
                      }

                      return productSalesData.map((item, index) => {
                        const percentage = totalSales > 0 ? ((item.sales / totalSales) * 100).toFixed(1) : '0';
                        const skuPrefix = item.product?.sku ? item.product.sku.split('-')[0].trim() : '-';

                        return (
                          <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                {item.product?.category}
                              </div>
                            </td>
                            <td className="px-6 py-3 font-mono text-slate-500 dark:text-slate-400">{skuPrefix}</td>
                            <td className="px-6 py-3 text-right font-bold text-slate-900 dark:text-white">{item.sales}</td>
                            <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400">{percentage}%</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end dark:bg-slate-800/50 dark:border-t dark:border-slate-800">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- TOP PRODUCTS FULL LIST MODAL --- */}
      {isTopProductsModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-slate-900 dark:border dark:border-slate-800 flex flex-col max-h-[90vh]">

            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Product Performance</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Full sales report for {new Date().getFullYear()}</p>
              </div>
              <button
                onClick={() => setIsTopProductsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-gray-100 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-0 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs font-semibold text-slate-500 uppercase sticky top-0 z-10 dark:bg-slate-800 dark:text-slate-400 shadow-sm border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-slate-800">Product</th>
                    <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-slate-800">SKU</th>
                    <th className="px-6 py-3 font-medium bg-gray-50 dark:bg-slate-800">Size</th>
                    <th className="px-6 py-3 font-medium text-right bg-gray-50 dark:bg-slate-800">Price</th>
                    <th className="px-6 py-3 font-medium text-right bg-gray-50 dark:bg-slate-800">Sold</th>
                    <th className="px-6 py-3 font-medium text-right bg-gray-50 dark:bg-slate-800">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {productPerformanceData.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-200">{p.name}</td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{p.sku}</td>
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{p.category}</td>
                      <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">Rp {Number(p.price).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-3 text-right font-bold text-slate-900 dark:text-white">{p.soldCount}</td>
                      <td className="px-6 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">Rp {(Number(p.price) * p.soldCount).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end dark:bg-slate-800/50 dark:border-t dark:border-slate-800">
              <button
                onClick={() => setIsTopProductsModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                Close
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
};