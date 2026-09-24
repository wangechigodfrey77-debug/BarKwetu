import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Category, PromoCode, OrderStatus } from '../types';
import { formatKES, formatDateTime, formatKenyanPhone } from '../utils/formatters';
import { FleetTrackerTab } from '../components/admin/FleetTrackerTab';
import {
  Shield,
  Package,
  FolderTree,
  ShoppingBag,
  Percent,
  Users,
  Settings,
  Activity,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Eye,
  Lock,
  Truck,
  ArrowLeft,
  Key,
  Bike,
  Radio,
} from 'lucide-react';

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'fleet'
  | 'discounts'
  | 'admins'
  | 'settings'
  | 'audit';

export const AdminDashboardView: React.FC = () => {
  const {
    currentUser,
    loginWithPassword,
    logout,
    setActiveView,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    orders,
    updateOrderStatus,
    assignRiderToOrder,
    promoCodes,
    addPromoCode,
    togglePromoCode,
    adminUsers,
    createAdminAccount,
    deleteAdminAccount,
    settings,
    updateSettings,
    auditLogs,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Admin login states (for locked gate)
  const [adminUsernameInput, setAdminUsernameInput] = useState('admin');
  const [adminPasswordInput, setAdminPasswordInput] = useState('admin123');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Product Form Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<{
    name: string;
    slug: string;
    brand: string;
    categoryId: string;
    categoryName: string;
    spiritType: any;
    price: number;
    salePrice?: number;
    stock: number;
    abv: string;
    volume: string;
    description: string;
    origin: string;
    images: string[];
    isFeatured: boolean;
    isActive: boolean;
  }>({
    name: '',
    slug: '',
    brand: '',
    categoryId: categories[0]?.id || 'cat-whisky',
    categoryName: categories[0]?.name || 'Whisky / Whiskey',
    spiritType: 'whisky',
    price: 3500,
    salePrice: undefined,
    stock: 20,
    abv: '40.0%',
    volume: '750ml',
    description: '',
    origin: 'Scotland',
    images: ['/src/assets/images/category_single_malt_1790229532902.jpg'],
    isFeatured: false,
    isActive: true,
  });

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '/src/assets/images/category_craft_gin_1790229549047.jpg',
    spiritType: 'gin' as any,
    displayOrder: 1,
    isActive: true,
  });

  // Promo Form Modal State
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minOrderValue: 3000,
    expiryDate: '2027-12-31',
    usageLimit: 100,
    isActive: true,
  });

  // New Admin Form State
  const [newAdminForm, setNewAdminForm] = useState({
    fullName: '',
    email: '',
    username: '',
    role: 'admin' as 'admin' | 'superadmin',
  });

  // Change Admin Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Selected Order for Details Modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);

  // Filter orders
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all');

  // Protect Admin Route: If not logged in as admin or superadmin, show full admin login terminal
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
    const handleFormAdminLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAdminLoginError('');
      setIsLoggingIn(true);
      const res = await loginWithPassword(adminUsernameInput, adminPasswordInput);
      setIsLoggingIn(false);
      if (!res.success) {
        setAdminLoginError(res.message || 'Invalid administrator username or password.');
      }
    };

    const handleOneClickSuperAdmin = async () => {
      setAdminUsernameInput('admin');
      setAdminPasswordInput('admin123');
      setIsLoggingIn(true);
      await loginWithPassword('admin', 'admin123');
      setIsLoggingIn(false);
    };

    return (
      <div className="min-h-screen bg-[#090a0d] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121318] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-[#1c1e26] border border-[#d4af37]/40 flex items-center justify-center mx-auto mb-3 text-[#d4af37] shadow-lg shadow-[#d4af37]/10">
              <Shield className="w-7 h-7" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#d4af37] font-bold block mb-1">
              BarKwetu Operations
            </span>
            <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
              Admin Portal Login
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {currentUser
                ? `Currently signed in as ${currentUser.fullName} (Customer). Please enter admin credentials below to access management.`
                : 'Sign in with administrator credentials to manage catalog, orders, and delivery dispatches.'}
            </p>
          </div>

          {/* 1-Click Super Admin Access Button */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handleOneClickSuperAdmin}
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-xs hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20 cursor-pointer"
            >
              <Shield className="w-4 h-4 stroke-[2.5]" />
              <span>⚡ 1-Click Super-Admin Bypass (admin / admin123)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-[1px] bg-zinc-800" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Or Enter Credentials</span>
            <div className="flex-1 h-[1px] bg-zinc-800" />
          </div>

          {adminLoginError && (
            <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300">
              {adminLoginError}
            </div>
          )}

          <form onSubmit={handleFormAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Admin Username / Email
              </label>
              <input
                type="text"
                required
                value={adminUsernameInput}
                onChange={(e) => setAdminUsernameInput(e.target.value)}
                placeholder="admin"
                className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="admin123"
                className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveView('store')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
              >
                Back to Store
              </button>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-200 hover:bg-white text-zinc-950 font-bold text-xs transition-all cursor-pointer"
              >
                {isLoggingIn ? 'Verifying...' : 'Sign In as Admin'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Analytics Metrics
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'completed')
    .reduce((sum, o) => sum + o.total, 0);

  const completedOrdersCount = orders.filter((o) => o.status === 'delivered').length;
  const activeOrdersCount = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const lowStockProducts = products.filter((p) => p.stock <= 5 && p.isActive);

  // Handle Save Product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    const matchedCat = categories.find((c) => c.id === productForm.categoryId);

    if (editingProductId) {
      updateProduct(editingProductId, {
        ...productForm,
        categoryName: matchedCat?.name || productForm.categoryName,
        slug: productForm.name.toLowerCase().replace(/\s+/g, '-'),
      });
    } else {
      addProduct({
        ...productForm,
        categoryName: matchedCat?.name || productForm.categoryName,
        slug: productForm.name.toLowerCase().replace(/\s+/g, '-'),
      });
    }
    setIsProductModalOpen(false);
    setEditingProductId(null);
  };

  // Open Edit Product
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setProductForm({
      name: prod.name,
      slug: prod.slug,
      brand: prod.brand,
      categoryId: prod.categoryId,
      categoryName: prod.categoryName,
      spiritType: prod.spiritType,
      price: prod.price,
      salePrice: prod.salePrice,
      stock: prod.stock,
      abv: prod.abv,
      volume: prod.volume,
      description: prod.description,
      origin: prod.origin,
      images: prod.images,
      isFeatured: prod.isFeatured,
      isActive: prod.isActive,
    });
    setIsProductModalOpen(true);
  };

  // Handle Save Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) return;

    if (editingCategoryId) {
      updateCategory(editingCategoryId, {
        ...categoryForm,
        slug: categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
      });
    } else {
      addCategory({
        ...categoryForm,
        slug: categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
      });
    }
    setIsCategoryModalOpen(false);
    setEditingCategoryId(null);
  };

  // Handle Create Promo
  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.code) return;
    addPromoCode(promoForm);
    setIsPromoModalOpen(false);
    setPromoForm({
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 3000,
      expiryDate: '2027-12-31',
      usageLimit: 100,
      isActive: true,
    });
  };

  // Handle Create Admin
  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminForm.email || !newAdminForm.username || !newAdminForm.fullName) return;
    createAdminAccount(newAdminForm);
    setNewAdminForm({ fullName: '', email: '', username: '', role: 'admin' });
  };

  // Handle Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    localStorage.setItem('barkwetu_admin_pwd', newPassword);
    showToast('Admin password changed successfully.', 'success');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-[#090a0d] text-zinc-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#0e0f14] border-r border-zinc-800 p-4 sm:p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
            <div>
              <h2 className="font-serif text-xl font-bold text-white flex items-center gap-1.5">
                <span>{settings.storeName}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 font-sans">
                  ADMIN
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500 mt-1">
                Logged in as <strong className="text-zinc-300">{currentUser.fullName}</strong> ({currentUser.role})
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#d4af37] text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Overview & Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#d4af37] text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Products & Stock</span>
              </div>
              <span className="tabular-nums opacity-70 font-mono">{products.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-[#d4af37] text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderTree className="w-4 h-4" />
                <span>Categories</span>
              </div>
              <span className="tabular-nums opacity-70 font-mono">{categories.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#d4af37] text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Orders & Dispatch</span>
              </div>
              {activeOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[10px] font-bold rounded-full tabular-nums">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                activeTab === 'fleet'
                  ? 'bg-[#d4af37] text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bike className="w-4 h-4 text-emerald-400" />
                <span>Rider Fleet & GPS</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </button>

            <button
              onClick={() => setActiveTab('discounts')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                activeTab === 'discounts'
                  ? 'bg-[#d4af37] text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Percent className="w-4 h-4" />
                <span>Discounts & Promos</span>
              </div>
              <span className="tabular-nums opacity-70 font-mono">{promoCodes.length}</span>
            </button>

            {currentUser.role === 'superadmin' && (
              <button
                onClick={() => setActiveTab('admins')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                  activeTab === 'admins'
                    ? 'bg-[#d4af37] text-black font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  <span>Admin Accounts</span>
                </div>
                <span className="tabular-nums opacity-70 font-mono">{adminUsers.length}</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#d4af37] text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings & PalPluss</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-[#d4af37] text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Audit Logs</span>
            </button>
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-zinc-800 space-y-2 text-xs">
          <button
            onClick={() => setActiveView('store')}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Public Storefront</span>
          </button>
          <button
            onClick={logout}
            className="w-full py-2 px-3 rounded-xl border border-zinc-800 hover:border-rose-800/50 hover:bg-rose-950/20 text-rose-300 font-medium transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        {/* ================= TAB: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                Operations & Sales Overview
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Real-time snapshot of revenue, active orders, and Kenyan fulfillment.
              </p>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-5">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  Total Gross Revenue
                </span>
                <p className="text-2xl font-bold text-white font-serif mt-2 tabular-nums">
                  {formatKES(totalRevenue)}
                </p>
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-block">
                  via PalPluss M-Pesa
                </span>
              </div>

              <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-5">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  Active Dispatches
                </span>
                <p className="text-2xl font-bold text-[#d4af37] font-serif mt-2 tabular-nums">
                  {activeOrdersCount} orders
                </p>
                <span className="text-[11px] text-zinc-400 mt-1 inline-block">
                  Awaiting delivery handover
                </span>
              </div>

              <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-5">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  Delivered Orders
                </span>
                <p className="text-2xl font-bold text-white font-serif mt-2 tabular-nums">
                  {completedOrdersCount} orders
                </p>
                <span className="text-[11px] text-emerald-400 mt-1 inline-block">
                  100% Age Verified Handover
                </span>
              </div>

              <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-5">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  Low-Stock Alerts
                </span>
                <p className={`text-2xl font-bold font-serif mt-2 tabular-nums ${lowStockProducts.length > 0 ? 'text-amber-400' : 'text-zinc-200'}`}>
                  {lowStockProducts.length} items
                </p>
                <span className="text-[11px] text-zinc-400 mt-1 inline-block">
                  {lowStockProducts.length > 0 ? 'Replenish required' : 'Stock levels optimal'}
                </span>
              </div>
            </div>

            {/* Recent Orders List in Overview */}
            <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold text-white">Recent Customer Orders</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-[#d4af37] hover:underline font-semibold cursor-pointer"
                >
                  View All Orders →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
                      <th className="pb-3">Order #</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Destination</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3">M-Pesa Ref</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.id} className="hover:bg-[#161822] transition-colors">
                        <td className="py-3 font-mono font-semibold text-white">{o.orderNumber}</td>
                        <td className="py-3">
                          <p className="font-medium text-zinc-200">{o.userName}</p>
                          <p className="text-[11px] text-zinc-500">{formatKenyanPhone(o.phone)}</p>
                        </td>
                        <td className="py-3 text-zinc-300">
                          {o.shippingAddress.town}, {o.shippingAddress.county}
                        </td>
                        <td className="py-3 font-bold text-white tabular-nums">{formatKES(o.total)}</td>
                        <td className="py-3 font-mono text-zinc-400">
                          {o.mpesaDetails?.receiptNumber || 'Pending'}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30">
                            {o.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setSelectedOrderDetails(o)}
                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: PRODUCTS ================= */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  Spirits & Catalog Management
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Add, edit, adjust inventory quantities, and configure sale prices.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingProductId(null);
                  setProductForm({
                    name: '',
                    slug: '',
                    brand: '',
                    categoryId: categories[0]?.id || 'cat-whisky',
                    categoryName: categories[0]?.name || 'Whisky / Whiskey',
                    spiritType: 'whisky',
                    price: 4500,
                    salePrice: undefined,
                    stock: 25,
                    abv: '40.0%',
                    volume: '750ml',
                    description: '',
                    origin: 'Scotland',
                    images: ['/src/assets/images/category_single_malt_1790229532902.jpg'],
                    isFeatured: false,
                    isActive: true,
                  });
                  setIsProductModalOpen(true);
                }}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-semibold text-xs flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-md shadow-[#d4af37]/20"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add New Spirit</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-[#121318] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0e0f14] border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Spirit Details</th>
                      <th className="p-4">Category / Brand</th>
                      <th className="p-4">Price (KES)</th>
                      <th className="p-4">Stock Adjustment</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-[#161822] transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#090a0d] rounded-lg p-1 flex items-center justify-center shrink-0">
                            <img src={p.images[0]} alt={p.name} className="max-h-full max-w-full object-contain" />
                          </div>
                          <div>
                            <p className="font-semibold text-white leading-tight">{p.name}</p>
                            <p className="text-[11px] text-zinc-500">{p.volume} · {p.abv} · {p.origin}</p>
                          </div>
                        </td>

                        <td className="p-4 text-zinc-300">
                          <p className="font-medium text-white">{p.brand}</p>
                          <p className="text-[11px] text-zinc-500">{p.categoryName}</p>
                        </td>

                        <td className="p-4">
                          {p.salePrice ? (
                            <div>
                              <span className="font-bold text-[#d4af37] block tabular-nums">
                                {formatKES(p.salePrice)}
                              </span>
                              <span className="text-[10px] text-zinc-500 line-through tabular-nums">
                                {formatKES(p.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-white tabular-nums">{formatKES(p.price)}</span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-[#090a0d] border border-zinc-800 rounded-lg">
                              <button
                                onClick={() => adjustStock(p.id, -1)}
                                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-bold text-white tabular-nums">
                                {p.stock}
                              </span>
                              <button
                                onClick={() => adjustStock(p.id, 1)}
                                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            <span className={`text-[11px] font-semibold ${p.stock <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {p.stock <= 0 ? 'Out' : p.stock <= 5 ? 'Low' : 'OK'}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => updateProduct(p.id, { isActive: !p.isActive })}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                              p.isActive ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' : 'bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {p.isActive ? 'Active' : 'Draft'}
                          </button>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: CATEGORIES ================= */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  Categories Management
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Organize store shelves, navigation categories, and spirit types.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCategoryId(null);
                  setCategoryForm({
                    name: '',
                    slug: '',
                    description: '',
                    image: '/src/assets/images/category_craft_gin_1790229549047.jpg',
                    spiritType: 'whisky',
                    displayOrder: categories.length + 1,
                    isActive: true,
                  });
                  setIsCategoryModalOpen(true);
                }}
                className="py-2.5 px-5 rounded-xl bg-[#d4af37] text-black font-semibold text-xs flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#121318] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded">
                        Order #{c.displayOrder}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${c.isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {c.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-white">{c.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{c.description}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">
                      {products.filter((p) => p.categoryId === c.id || p.spiritType === c.spiritType).length} spirits
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCategoryId(c.id);
                          setCategoryForm({
                            name: c.name,
                            slug: c.slug,
                            description: c.description,
                            image: c.image,
                            spiritType: c.spiritType,
                            displayOrder: c.displayOrder,
                            isActive: c.isActive,
                          });
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCategory(c.id)}
                        className="p-1.5 rounded bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB: ORDERS & DISPATCH ================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  Orders & Live Dispatch Pipeline
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Advance customer order status to trigger live delivery tracking updates.
                </p>
              </div>

              {/* Status Filter */}
              <select
                value={orderFilterStatus}
                onChange={(e) => setOrderFilterStatus(e.target.value)}
                className="bg-[#121318] border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d4af37]"
              >
                <option value="all">All Orders ({orders.length})</option>
                <option value="pending">Pending Payment</option>
                <option value="paid">Payment Confirmed</option>
                <option value="preparing">Packaging & Cold-Seal</option>
                <option value="out_for_delivery">Out for Express Delivery</option>
                <option value="delivered">Delivered (18+ Verified)</option>
              </select>
            </div>

            <div className="space-y-4">
              {orders
                .filter((o) => orderFilterStatus === 'all' || o.status === orderFilterStatus)
                .map((order) => (
                  <div
                    key={order.id}
                    className="bg-[#121318] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-bold text-white">{order.orderNumber}</span>
                          <span className="text-xs text-zinc-400">· {formatDateTime(order.createdAt)}</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Customer: <strong className="text-white">{order.userName}</strong> ({formatKenyanPhone(order.phone)}) · {order.shippingAddress.exactLocation}, {order.shippingAddress.town}, {order.shippingAddress.county}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-[#d4af37] tabular-nums">
                          {formatKES(order.total)}
                        </span>
                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium cursor-pointer"
                        >
                          View Full Details
                        </button>
                      </div>
                    </div>

                    {/* Status Advancement Selector Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-500 font-medium">Update Status:</span>
                        {(['pending', 'paid', 'preparing', 'out_for_delivery', 'delivered'] as OrderStatus[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => updateOrderStatus(order.id, st)}
                            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                              order.status === st
                                ? 'bg-[#d4af37] text-black shadow-md'
                                : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
                            }`}
                          >
                            {st.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-zinc-400">
                        {order.assignedRiderName && (
                          <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40 font-medium">
                            <Bike className="w-3.5 h-3.5" />
                            <span>{order.assignedRiderName}</span>
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">M-Pesa Receipt:</span>
                          <span className="font-mono font-bold text-white bg-[#090a0d] px-2 py-0.5 rounded border border-zinc-800">
                            {order.mpesaDetails?.receiptNumber || 'None'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ================= TAB: RIDER FLEET & GPS RADAR ================= */}
        {activeTab === 'fleet' && <FleetTrackerTab />}

        {/* ================= TAB: DISCOUNTS & PROMO CODES ================= */}
        {activeTab === 'discounts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  Discount Offers & Promo Codes
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Create percentage discounts, fixed KSh deductions, and flash sale vouchers.
                </p>
              </div>

              <button
                onClick={() => setIsPromoModalOpen(true)}
                className="py-2.5 px-5 rounded-xl bg-[#d4af37] text-black font-semibold text-xs flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create Promo Code</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {promoCodes.map((p) => (
                <div key={p.id} className="bg-[#121318] border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-lg text-white bg-[#090a0d] px-3 py-1 rounded-lg border border-zinc-800">
                      {p.code}
                    </span>
                    <button
                      onClick={() => togglePromoCode(p.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer ${
                        p.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-[#d4af37]">
                    {p.discountType === 'percentage' ? `${p.discountValue}% OFF` : `KSh ${p.discountValue} Flat OFF`}
                  </p>

                  <div className="text-xs text-zinc-400 space-y-1">
                    <p>Min Order: <strong>{formatKES(p.minOrderValue)}</strong></p>
                    <p>Used: <strong>{p.timesUsed} / {p.usageLimit} times</strong></p>
                    <p>Expires: <strong>{p.expiryDate}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB: ADMIN ACCOUNTS ================= */}
        {activeTab === 'admins' && currentUser.role === 'superadmin' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                Admin Roles & Account Governance
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Manage operational staff and create new dispatch administrator accounts.
              </p>
            </div>

            {/* Create Admin Form */}
            <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-6">
              <h3 className="font-serif text-lg font-bold text-white mb-4">Add New Administrator</h3>
              <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newAdminForm.fullName}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, fullName: e.target.value })}
                    placeholder="e.g. Victor Mutua"
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newAdminForm.email}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                    placeholder="mutua@barkwetu.co.ke"
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newAdminForm.username}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, username: e.target.value })}
                    placeholder="vmutua"
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#d4af37] text-black font-semibold text-xs hover:brightness-110 transition-colors cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </div>

            {/* Admins Table */}
            <div className="bg-[#121318] border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e0f14] border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Admin Name</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {adminUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#161822]">
                      <td className="p-4 font-semibold text-white">{u.fullName}</td>
                      <td className="p-4 font-mono text-zinc-300">{u.username}</td>
                      <td className="p-4 text-zinc-400">{u.email}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {u.role !== 'superadmin' && (
                          <button
                            onClick={() => deleteAdminAccount(u.id)}
                            className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB: SETTINGS & PALPLUSS ================= */}
        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                Store Settings & Gateway Integration
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Configure delivery rates, store branding, PalPluss STK Push API keys, and admin security.
              </p>
            </div>

            {/* PalPluss API Configuration Box */}
            <div className="bg-[#121318] border border-[#00A859]/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#00A859]" />
                  <h3 className="font-serif text-lg font-bold text-white">
                    PalPluss M-Pesa STK Push API Configuration
                  </h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#00A859]/10 text-[#00A859] border border-[#00A859]/30 px-2.5 py-0.5 rounded-full">
                  Direct Gateway
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    PalPluss Merchant ID
                  </label>
                  <input
                    type="text"
                    value={settings.palplussMerchantId}
                    onChange={(e) => updateSettings({ palplussMerchantId: e.target.value })}
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    PalPluss API Secret Key
                  </label>
                  <input
                    type="password"
                    value={settings.palplussApiKey}
                    onChange={(e) => updateSettings({ palplussApiKey: e.target.value })}
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Webhook Listener URL
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="https://barkwetu.co.ke/api/payments/palpluss/webhook"
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Environment Mode
                  </label>
                  <select
                    value={settings.palplussLiveMode ? 'live' : 'sandbox'}
                    onChange={(e) => updateSettings({ palplussLiveMode: e.target.value === 'live' })}
                    className="w-full bg-[#090a0d] border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="sandbox">Sandbox / Demo Simulation</option>
                    <option value="live">Live Production (Safaricom M-Pesa)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* General Store Details */}
            <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
              <h3 className="font-serif text-lg font-bold text-white pb-3 border-b border-zinc-800">
                General Store Settings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Store Name</label>
                  <input
                    type="text"
                    value={settings.storeName}
                    onChange={(e) => updateSettings({ storeName: e.target.value })}
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Fixed Delivery Fee (KES)
                  </label>
                  <input
                    type="number"
                    value={settings.deliveryFee}
                    onChange={(e) => updateSettings({ deliveryFee: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Support Phone</label>
                  <input
                    type="text"
                    value={settings.supportPhone}
                    onChange={(e) => updateSettings({ supportPhone: e.target.value })}
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => updateSettings({ supportEmail: e.target.value })}
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>
            </div>

            {/* Change Admin Password */}
            <div className="bg-[#121318] border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                <Key className="w-4 h-4 text-[#d4af37]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  Change Super-Admin Master Password
                </h3>
              </div>

              <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-[#d4af37] text-white hover:text-black font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB: AUDIT LOGS ================= */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                Admin Action Audit Trail
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Immutable record of administrative interventions, price changes, and order modifications.
              </p>
            </div>

            <div className="bg-[#121318] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e0f14] border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Admin</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#161822]">
                      <td className="p-4 font-mono text-zinc-400 text-[11px]">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="p-4 font-semibold text-white">{log.adminUsername}</td>
                      <td className="p-4">
                        <span className="font-mono text-[11px] font-bold text-[#d4af37]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-300">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Product Form Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#121318] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl my-auto">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif font-bold text-white mb-4">
              {editingProductId ? 'Edit Spirit' : 'Add New Spirit to Catalog'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Spirit Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. The Macallan 12 Double Cask"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="e.g. Macallan"
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Category</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Price (KES)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Sale Price (Optional)</label>
                  <input
                    type="number"
                    value={productForm.salePrice || ''}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        salePrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="Leave blank if no sale"
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Bottle Size</label>
                  <input
                    type="text"
                    value={productForm.volume}
                    onChange={(e) => setProductForm({ ...productForm, volume: e.target.value })}
                    placeholder="750ml"
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">ABV (%)</label>
                  <input
                    type="text"
                    value={productForm.abv}
                    onChange={(e) => setProductForm({ ...productForm, abv: e.target.value })}
                    placeholder="40.0%"
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Origin Country</label>
                  <input
                    type="text"
                    value={productForm.origin}
                    onChange={(e) => setProductForm({ ...productForm, origin: e.target.value })}
                    placeholder="Speyside, Scotland"
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Description & Sommelier Notes</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                    className="rounded bg-zinc-800 border-zinc-700 text-[#d4af37]"
                  />
                  <span>Feature on Storefront</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                    className="rounded bg-zinc-800 border-zinc-700 text-[#d4af37]"
                  />
                  <span>Active for Purchase</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#d4af37] text-black font-semibold hover:brightness-110"
                >
                  Save Spirit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#121318] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-serif font-bold text-white mb-4">
              {editingCategoryId ? 'Edit Category' : 'Add Category'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Single Malt Scotch"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Brief summary"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#d4af37] text-black font-semibold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promo Code Modal */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#121318] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setIsPromoModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-serif font-bold text-white mb-4">
              Create New Promo Voucher
            </h3>

            <form onSubmit={handleSavePromo} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Promo Code</label>
                <input
                  type="text"
                  required
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. FLASH20"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Discount Type</label>
                  <select
                    value={promoForm.discountType}
                    onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value as any })}
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (KSh)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={promoForm.discountValue}
                    onChange={(e) => setPromoForm({ ...promoForm, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Min Order (KES)</label>
                  <input
                    type="number"
                    value={promoForm.minOrderValue}
                    onChange={(e) => setPromoForm({ ...promoForm, minOrderValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={promoForm.expiryDate}
                    onChange={(e) => setPromoForm({ ...promoForm, expiryDate: e.target.value })}
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#d4af37] text-black font-semibold"
                >
                  Create Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-[#121318] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrderDetails(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif font-bold text-white mb-1">
              Order #{selectedOrderDetails.orderNumber} Details
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Placed on {formatDateTime(selectedOrderDetails.createdAt)}
            </p>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#0d0e12] rounded-xl border border-zinc-800 space-y-1">
                <p><strong>Customer:</strong> {selectedOrderDetails.userName}</p>
                <p><strong>Phone:</strong> {formatKenyanPhone(selectedOrderDetails.phone)}</p>
                <p><strong>Address:</strong> {selectedOrderDetails.shippingAddress.exactLocation}, {selectedOrderDetails.shippingAddress.town}, {selectedOrderDetails.shippingAddress.county}</p>
                {selectedOrderDetails.shippingAddress.deliveryNotes && (
                  <p><strong>Rider Notes:</strong> {selectedOrderDetails.shippingAddress.deliveryNotes}</p>
                )}
                <p><strong>M-Pesa Receipt:</strong> <span className="font-mono text-[#00A859]">{selectedOrderDetails.mpesaDetails?.receiptNumber || 'None'}</span></p>
              </div>

              <div>
                <h4 className="font-semibold text-zinc-300 mb-2">Order Items:</h4>
                <div className="space-y-2">
                  {selectedOrderDetails.items.map((i: any, idx: number) => (
                    <div key={idx} className="flex justify-between p-2 bg-[#161822] rounded-lg">
                      <span>{i.quantity} × {i.productName} ({i.volume})</span>
                      <span className="font-bold tabular-nums">{formatKES(i.price * i.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 space-y-1 text-right">
                <p>Subtotal: <strong>{formatKES(selectedOrderDetails.subtotal)}</strong></p>
                <p>Delivery Fee: <strong>{formatKES(selectedOrderDetails.deliveryFee)}</strong></p>
                {selectedOrderDetails.discount > 0 && (
                  <p className="text-emerald-400">Discount: <strong>-{formatKES(selectedOrderDetails.discount)}</strong></p>
                )}
                <p className="text-sm font-bold text-[#d4af37]">Total: {formatKES(selectedOrderDetails.total)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
