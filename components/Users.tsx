import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import {
  Edit2, Trash2, Plus, X, Save, AlertTriangle,
  CheckCircle, AlertCircle, Mail, Shield, User as UserIcon, Lock
} from 'lucide-react';

export const Users: React.FC = () => {
  // State Management
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Form State
  const initialFormState = {
    name: '',
    email: '',
    role: 'Staff' as 'Admin' | 'Manager' | 'Staff',
    password: '' // Added password field
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showNotification('Failed to load team members', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Show Notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handlers
  const handleAddClick = () => {
    setFormData(initialFormState);
    setCurrentUser(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '' // Don't show existing password
    });
    setCurrentUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setCurrentUser(user);
    setIsDeleteOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      showNotification('Please fill in all required fields.', 'error');
      return;
    }

    try {
      if (currentUser) {
        // Edit Mode
        await api.updateUser(currentUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          ...(formData.password ? { password: formData.password } : {})
        });
        showNotification('Team member updated successfully!', 'success');
      } else {
        // Add Mode
        await api.createUser({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password || undefined
        });
        showNotification('New member added successfully!', 'success');
      }
      fetchUsers(); // Refresh list
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to save user:', error);
      showNotification('Failed to save team member', 'error');
    }
  };

  const confirmDelete = async () => {
    if (currentUser) {
      try {
        await api.deleteUser(currentUser.id);
        showNotification('Member removed from team.', 'success');
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        showNotification('Failed to remove member', 'error');
      } finally {
        setIsDeleteOpen(false);
        setCurrentUser(null);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border bg-white dark:bg-slate-800 animate-in slide-in-from-top-5 fade-in duration-300 ${notification.type === 'success' ? 'border-emerald-100 dark:border-emerald-900/30' : 'border-rose-100 dark:border-rose-900/30'
          }`}>
          <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
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

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight dark:text-white">Team Members</h1>
          <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">Manage access, roles, and user profiles.</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm dark:bg-indigo-600 dark:hover:bg-indigo-500"
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <table className="w-full text-left text-sm text-gray-500 dark:text-slate-400">
          <thead className="bg-gray-50/50 border-b border-gray-100 uppercase text-xs font-semibold text-slate-500 dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">User Profile</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Last Active</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/80 transition-colors dark:hover:bg-slate-800/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} className="w-10 h-10 rounded-full border border-gray-100 dark:border-slate-700 object-cover" alt="avatar" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail size={10} /> {u.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border
                                ${u.role === 'Admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-900/30'
                      : u.role === 'Manager'
                        ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30'
                        : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}>
                    <Shield size={10} />
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-mono">{u.lastActive}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(u)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                      title="Edit User"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(u)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                  No team members found.
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                  Loading members...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {currentUser ? 'Edit Member' : 'Add New Member'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-gray-100 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">Full Name</label>
                <div className="relative">
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    type="text"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                    placeholder="e.g. John Doe"
                  />
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">Email Address</label>
                <div className="relative">
                  <input
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                    placeholder="e.g. john@aspalpro.com"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">Role & Access</label>
                <div className="relative">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                  >
                    <option value="Staff">Staff (Limited Access)</option>
                    <option value="Manager">Manager (Editor Access)</option>
                    <option value="Admin">Admin (Full Access)</option>
                  </select>
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    type="password"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                    placeholder={currentUser ? "Leave blank to keep current" : "Set login password"}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
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
                  Save Member
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
              <h3 className="text-lg font-semibold text-slate-900 mb-2 dark:text-white">Remove Member?</h3>
              <p className="text-sm text-slate-500 mb-6 dark:text-slate-400">
                Are you sure you want to remove <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser?.name}</span>? They will lose access immediately.
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
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};