import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, TrendingUp,
  Settings as SettingsIcon, Users as UsersIcon, FileText, Menu, LogOut
} from 'lucide-react';
import { Page } from './types';
import { Dashboard } from './components/Dashboard';
import { Products } from './components/Products';
import { Inventory } from './components/Inventory';
import { Reports } from './components/Reports';
import { Users } from './components/Users';
import { Login } from './components/Login';

const Settings = () => (
  <div className="space-y-8 animate-in fade-in duration-300">
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 tracking-tight dark:text-white">Settings</h1>
      <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">System configuration.</p>
    </div>

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 dark:bg-slate-900 dark:border-slate-800 dark:divide-slate-800">
      <div className="p-6">
        <h3 className="text-base font-medium text-slate-900 dark:text-white">General Information</h3>
        <div className="mt-4 grid gap-4 max-w-md">
          <label className="block">
            <span className="text-slate-500 text-xs uppercase font-bold tracking-wider dark:text-slate-400">Store Name</span>
            <input type="text" className="mt-2 block w-full rounded-lg border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-slate-900 focus:ring-0 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-white" defaultValue="AspalPro Center" />
          </label>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-base font-medium text-slate-900 dark:text-white">Notifications</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Alerts</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Receive summaries regarding stock levels.</p>
            </div>
            <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-slate-900 dark:bg-indigo-600">
              <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('auth_token') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogin = () => {
    localStorage.setItem('auth_token', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setCurrentPage(Page.DASHBOARD); // Reset page on logout
    setIsLogoutModalOpen(false);
  };

  const NavItem = ({ page, icon: Icon, label }: { page: Page; icon: any; label: string }) => {
    const isActive = currentPage === page;
    return (
      <button
        onClick={() => {
          setCurrentPage(page);
          setIsSidebarOpen(false);
        }}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group mb-1
          ${isActive
            ? 'bg-white/10 text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5'}
        `}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
      </button>
    );
  };

  // Render Login Page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar - Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#111827] text-white transform transition-transform duration-300 ease-in-out flex flex-col border-r border-slate-800
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Package className="text-slate-900" size={18} />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Aspal Inventory</span>
          </div>

          <div className="space-y-6">
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Overview</p>
              <NavItem page={Page.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
            </div>

            <div>
              <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Operation</p>
              <NavItem page={Page.PRODUCTS} icon={Package} label="Products" />
              <NavItem page={Page.INVENTORY} icon={TrendingUp} label="Inventory" />
              <NavItem page={Page.REPORTS} icon={FileText} label="Reports" />
            </div>

            <div>
              <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">System</p>
              <NavItem page={Page.USERS} icon={UsersIcon} label="Team" />
              <NavItem page={Page.SETTINGS} icon={SettingsIcon} label="Settings" />
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <img src="https://picsum.photos/40/40?random=10" className="w-8 h-8 rounded-full border border-slate-600" alt="Admin" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Admin Utama</p>
              <p className="text-[10px] text-slate-400 truncate">Super Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30 dark:bg-slate-900 dark:border-slate-800">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 hover:bg-gray-50 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-slate-900 dark:text-white">AspalPro</span>
          <div className="w-8"></div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full p-6 lg:p-10 space-y-8">
            {currentPage === Page.DASHBOARD && (
              <Dashboard isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />
            )}
            {currentPage === Page.PRODUCTS && <Products />}
            {currentPage === Page.INVENTORY && <Inventory />}
            {currentPage === Page.REPORTS && <Reports />}
            {currentPage === Page.USERS && <Users />}
            {currentPage === Page.SETTINGS && <Settings />}
          </div>
        </div>
      </main>
      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-rose-900/30">
                <LogOut className="text-rose-600 dark:text-rose-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 dark:text-white">Sign Out?</h3>
              <p className="text-slate-500 text-sm mb-6 dark:text-slate-400">
                Are you sure you want to sign out of your account? You will need to login again to access the admin panel.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;