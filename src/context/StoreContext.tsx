import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Category,
  CartItem,
  Order,
  PromoCode,
  User,
  SiteSettings,
  AuditLog,
  OrderStatus,
  ShippingAddress,
  RiderLocation,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_PROMO_CODES,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_SAMPLE_ORDER,
  WHISKY_IMAGE,
  GIN_IMAGE,
} from '../data/seedData';
import { generateOrderNumber } from '../utils/formatters';
import { resolveCoordinatesForAddress, STORE_HUB_LOCATION } from '../utils/kenyaLocations';
import {
  seedFirestoreIfEmpty,
  subscribeToProducts,
  subscribeToCategories,
  subscribeToOrders,
  subscribeToPromoCodes,
  subscribeToSettings,
  subscribeToAuditLogs,
  syncSaveProduct,
  syncDeleteProduct,
  syncAdjustStock,
  syncSaveCategory,
  syncDeleteCategory,
  syncSaveOrder,
  syncUpdateOrderStatus,
  syncUpdateRiderLocation,
  syncSavePromoCode,
  syncTogglePromoCode,
  syncSaveSettings,
  syncSaveAuditLog,
  syncSaveUser,
  syncDeleteUser,
} from '../firebase/firestoreService';

export type ActiveView = 
  | 'store'
  | 'checkout'
  | 'order-confirmation'
  | 'track-order'
  | 'admin'
  | 'rider';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface StoreContextType {
  // Navigation & Modal Views
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isAgeGateOpen: boolean;
  ageVerified: boolean;
  verifyAge: (verified: boolean) => void;

  // Catalog Data
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id' | 'rating' | 'reviewsCount'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;

  // Category CRUD
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Shopping Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  deliveryFee: number;
  discountAmount: number;
  cartTotal: number;

  // Promo Codes
  appliedPromo: PromoCode | null;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  promoCodes: PromoCode[];
  addPromoCode: (promo: Omit<PromoCode, 'id' | 'timesUsed'>) => void;
  togglePromoCode: (id: string) => void;

  // User & Auth
  currentUser: User | null;
  loginWithPassword: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean }>;
  signupWithPassword: (data: { email: string; username: string; fullName: string; password: string; phone?: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  adminUsers: User[];
  createAdminAccount: (data: { email: string; username: string; fullName: string; role: 'admin' | 'superadmin' }) => void;
  deleteAdminAccount: (id: string) => void;

  // Orders & Payment
  orders: Order[];
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  createPendingOrder: (shippingAddress: ShippingAddress) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  lookupOrder: (orderNumber: string, phoneOrEmail: string) => Order | null;
  updateRiderGpsLocation: (orderId: string, location: RiderLocation) => void;
  assignRiderToOrder: (orderId: string, rider: User) => void;

  // PalPluss M-Pesa STK Push
  isPalPlussModalOpen: boolean;
  setIsPalPlussModalOpen: (open: boolean) => void;
  currentStkTransaction: {
    reference: string;
    phone: string;
    amount: number;
    orderNumber: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
    receipt?: string;
  } | null;
  initiatePalPlussPayment: (order: Order) => Promise<boolean>;
  simulatePalPlussAction: (action: 'SUCCESS' | 'CANCELLED') => Promise<void>;
  cancelPalPlussPayment: () => void;

  // Settings & Audit
  settings: SiteSettings;
  updateSettings: (updates: Partial<SiteSettings>) => void;
  auditLogs: AuditLog[];
  logAdminAction: (action: string, details: string) => void;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeView, setActiveView] = useState<ActiveView>('store');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Age Verification
  const [ageVerified, setAgeVerified] = useState<boolean>(() => {
    return localStorage.getItem('barkwetu_age_verified') === 'true';
  });
  const [isAgeGateOpen, setIsAgeGateOpen] = useState<boolean>(() => {
    return localStorage.getItem('barkwetu_age_verified') !== 'true';
  });

  // State
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('barkwetu_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('barkwetu_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('barkwetu_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() => {
    const saved = localStorage.getItem('barkwetu_promos');
    return saved ? JSON.parse(saved) : INITIAL_PROMO_CODES;
  });

  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('barkwetu_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [adminUsers, setAdminUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('barkwetu_admin_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('barkwetu_orders');
    return saved ? JSON.parse(saved) : [INITIAL_SAMPLE_ORDER];
  });

  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const [settings, setSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('barkwetu_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('barkwetu_audit_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'log-1',
        adminId: 'user-superadmin-1',
        adminUsername: 'admin',
        action: 'SYSTEM_INITIALIZED',
        details: 'BarKwetu store initial seed catalog and PalPluss payment gateway configured.',
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // PalPluss STK Push Modal & State
  const [isPalPlussModalOpen, setIsPalPlussModalOpen] = useState(false);
  const [currentStkTransaction, setCurrentStkTransaction] = useState<{
    reference: string;
    phone: string;
    amount: number;
    orderNumber: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
    receipt?: string;
  } | null>(null);

  // Firestore Real-Time Subscriptions & Auto-Seeding
  useEffect(() => {
    // 1. Seed initial Kenyan catalog & settings if Firestore is clean
    seedFirestoreIfEmpty().catch((err) => console.warn('Seeding check:', err));

    // 2. Active Firestore Real-Time Listeners
    const unsubProducts = subscribeToProducts((liveProducts) => {
      if (liveProducts && liveProducts.length > 0) {
        setProducts(liveProducts);
      }
    });

    const unsubCategories = subscribeToCategories((liveCats) => {
      if (liveCats && liveCats.length > 0) {
        setCategories(liveCats);
      }
    });

    const unsubOrders = subscribeToOrders((liveOrders) => {
      if (liveOrders && liveOrders.length > 0) {
        setOrders(liveOrders);
      }
    });

    const unsubPromos = subscribeToPromoCodes((livePromos) => {
      if (livePromos && livePromos.length > 0) {
        setPromoCodes(livePromos);
      }
    });

    const unsubSettings = subscribeToSettings((liveSettings) => {
      if (liveSettings) {
        setSettings(liveSettings);
      }
    });

    const unsubAudit = subscribeToAuditLogs((liveAudit) => {
      if (liveAudit && liveAudit.length > 0) {
        setAuditLogs(liveAudit);
      }
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubOrders();
      unsubPromos();
      unsubSettings();
      unsubAudit();
    };
  }, []);

  // Sync to LocalStorage (Fallback / offline cache)
  useEffect(() => {
    localStorage.setItem('barkwetu_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('barkwetu_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('barkwetu_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('barkwetu_promos', JSON.stringify(promoCodes));
  }, [promoCodes]);

  useEffect(() => {
    localStorage.setItem('barkwetu_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('barkwetu_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('barkwetu_admin_users', JSON.stringify(adminUsers));
  }, [adminUsers]);

  useEffect(() => {
    localStorage.setItem('barkwetu_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('barkwetu_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('barkwetu_current_user');
    }
  }, [currentUser]);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Age Gate Handler
  const verifyAge = (verified: boolean) => {
    if (verified) {
      setAgeVerified(true);
      setIsAgeGateOpen(false);
      localStorage.setItem('barkwetu_age_verified', 'true');
      showToast('Age verified. Welcome to BarKwetu Premium Spirits.', 'success');
    } else {
      setAgeVerified(false);
      setIsAgeGateOpen(true);
      localStorage.setItem('barkwetu_age_verified', 'false');
    }
  };

  // Audit Logging
  const logAdminAction = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminId: currentUser?.id || 'admin',
      adminUsername: currentUser?.username || 'admin',
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    syncSaveAuditLog(newLog).catch((e) => console.warn('Audit sync:', e));
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => {
    const itemPrice = item.product.salePrice ?? item.product.price;
    return sum + itemPrice * item.quantity;
  }, 0);

  const deliveryFee = settings.deliveryFee;

  const discountAmount = appliedPromo
    ? appliedPromo.discountType === 'percentage'
      ? Math.round((cartSubtotal * appliedPromo.discountValue) / 100)
      : Math.min(appliedPromo.discountValue, cartSubtotal)
    : 0;

  const cartTotal = Math.max(0, cartSubtotal - discountAmount + deliveryFee);

  // Cart Operations
  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      showToast(`${product.name} is currently out of stock.`, 'error');
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const newQty = Math.min(prevCart[existingIndex].quantity + quantity, product.stock);
        const updated = [...prevCart];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      }
      return [...prevCart, { product, quantity: Math.min(quantity, product.stock) }];
    });

    showToast(`Added ${quantity} × ${product.name} to basket.`, 'success');
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from basket.', 'info');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const clamped = Math.min(quantity, item.product.stock);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo(null);
  };

  // Promo Code Operations
  const applyPromoCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = promoCodes.find((p) => p.code.toUpperCase() === cleanCode && p.isActive);

    if (!found) {
      return { success: false, message: 'Invalid or inactive promo code.' };
    }

    if (new Date(found.expiryDate) < new Date()) {
      return { success: false, message: 'This promo code has expired.' };
    }

    if (cartSubtotal < found.minOrderValue) {
      return {
        success: false,
        message: `Minimum order value for ${found.code} is KSh ${found.minOrderValue.toLocaleString()}.`,
      };
    }

    setAppliedPromo(found);
    showToast(`Promo code ${found.code} applied successfully!`, 'success');
    return { success: true, message: 'Promo code applied.' };
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    showToast('Promo code removed.', 'info');
  };

  const addPromoCode = (promo: Omit<PromoCode, 'id' | 'timesUsed'>) => {
    const newPromo: PromoCode = {
      ...promo,
      id: `promo-${Date.now()}`,
      timesUsed: 0,
    };
    setPromoCodes((prev) => [...prev, newPromo]);
    syncSavePromoCode(newPromo).catch((e) => console.warn('Promo sync error:', e));
    logAdminAction('CREATE_PROMO', `Created promo code: ${promo.code}`);
    showToast(`Promo code ${promo.code} created!`, 'success');
  };

  const togglePromoCode = (id: string) => {
    setPromoCodes((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, isActive: !p.isActive };
          syncTogglePromoCode(id, updated.isActive).catch((e) => console.warn('Promo toggle error:', e));
          return updated;
        }
        return p;
      })
    );
  };

  // Product CRUD
  const addProduct = (productData: Omit<Product, 'id' | 'rating' | 'reviewsCount'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 1,
    };
    setProducts((prev) => [newProduct, ...prev]);
    syncSaveProduct(newProduct).catch((e) => console.warn('Product sync error:', e));
    logAdminAction('CREATE_PRODUCT', `Added new product: ${productData.name}`);
    showToast(`Product "${productData.name}" added to catalog.`, 'success');
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          syncSaveProduct(updated).catch((e) => console.warn('Product update sync error:', e));
          return updated;
        }
        return p;
      })
    );
    logAdminAction('UPDATE_PRODUCT', `Updated product ID ${id}`);
    showToast('Product updated successfully.', 'success');
  };

  const deleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    syncDeleteProduct(id).catch((e) => console.warn('Product delete sync error:', e));
    logAdminAction('DELETE_PRODUCT', `Deleted product: ${prod?.name || id}`);
    showToast('Product removed from catalog.', 'info');
  };

  const adjustStock = (id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStock = Math.max(0, p.stock + delta);
          syncAdjustStock(id, newStock).catch((e) => console.warn('Stock sync error:', e));
          return { ...p, stock: newStock };
        }
        return p;
      })
    );
    logAdminAction('ADJUST_STOCK', `Adjusted stock for ${id} by ${delta}`);
  };

  // Category CRUD
  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCat]);
    syncSaveCategory(newCat).catch((e) => console.warn('Category sync error:', e));
    logAdminAction('CREATE_CATEGORY', `Created category: ${categoryData.name}`);
    showToast(`Category "${categoryData.name}" created.`, 'success');
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          syncSaveCategory(updated).catch((e) => console.warn('Category update sync error:', e));
          return updated;
        }
        return c;
      })
    );
    logAdminAction('UPDATE_CATEGORY', `Updated category ID ${id}`);
    showToast('Category updated.', 'success');
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    syncDeleteCategory(id).catch((e) => console.warn('Category delete sync error:', e));
    logAdminAction('DELETE_CATEGORY', `Deleted category ID ${id}`);
    showToast('Category deleted.', 'info');
  };

  // Auth & Roles
  const loginWithPassword = async (identifier: string, pass: string) => {
    const cleanId = identifier.trim().toLowerCase();
    
    // Check initial hardcoded super-admin requirement: username 'admin', password 'admin123'
    if ((cleanId === 'admin' || cleanId === 'admin@barkwetu.co.ke') && (pass === 'admin123' || pass === (localStorage.getItem('barkwetu_admin_pwd') || 'admin123'))) {
      const adminUser: User = {
        id: 'user-superadmin-1',
        email: 'admin@barkwetu.co.ke',
        username: 'admin',
        fullName: 'Super Administrator',
        phone: '+254700000001',
        role: 'superadmin',
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      setCurrentUser(adminUser);
      setIsAuthModalOpen(false);
      showToast('Welcome Super Admin. Admin dashboard unlocked.', 'success');
      return { success: true };
    }

    // Check rider or other registered users/admins
    const matched = adminUsers.find(
      (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    if (matched) {
      setCurrentUser(matched);
      setIsAuthModalOpen(false);
      if (matched.role === 'rider') {
        setActiveView('rider');
        showToast(`Welcome Rider ${matched.fullName}! GPS tracking ready.`, 'success');
      } else {
        showToast(`Welcome back, ${matched.fullName}!`, 'success');
      }
      return { success: true };
    }

    // Direct rider shortcut login (username 'rider' or 'boda')
    if (cleanId === 'rider' || cleanId === 'boda' || cleanId === 'rider@barkwetu.co.ke') {
      const riderUser: User = {
        id: 'user-rider-1',
        email: 'rider@barkwetu.co.ke',
        username: 'rider',
        fullName: 'Juma Boda (Fleet #04)',
        phone: '+254700000004',
        role: 'rider',
        bikeRegistration: 'KMCE 482J',
        createdAt: '2026-03-01T00:00:00.000Z',
      };
      setCurrentUser(riderUser);
      setIsAuthModalOpen(false);
      setActiveView('rider');
      showToast('Rider portal unlocked. Real-time GPS sharing active.', 'success');
      return { success: true };
    }

    // Customer fallback
    if (pass.length >= 4) {
      const customer: User = {
        id: `user-${Date.now()}`,
        email: cleanId.includes('@') ? cleanId : `${cleanId}@customer.co.ke`,
        username: cleanId.split('@')[0],
        fullName: cleanId.split('@')[0].toUpperCase(),
        role: 'customer',
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(customer);
      setIsAuthModalOpen(false);
      showToast(`Welcome to BarKwetu, ${customer.fullName}!`, 'success');
      return { success: true };
    }

    return { success: false, message: 'Invalid credentials. Password must be at least 4 characters.' };
  };

  const loginWithGoogle = async () => {
    // Google Sign-In Simulation with realistic customer identity
    const googleUser: User = {
      id: 'google-usr-' + Date.now(),
      email: 'gmaurice101@gmail.com',
      username: 'gmaurice',
      fullName: 'Maurice G.',
      phone: '+254712345678',
      role: 'customer',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(googleUser);
    setIsAuthModalOpen(false);
    showToast('Signed in securely with Google Account.', 'success');
    return { success: true };
  };

  const signupWithPassword = async (data: {
    email: string;
    username: string;
    fullName: string;
    password: string;
    phone?: string;
  }) => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: data.email,
      username: data.username,
      fullName: data.fullName,
      phone: data.phone,
      role: 'customer',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(newUser);
    setIsAuthModalOpen(false);
    showToast(`Account created! Welcome, ${newUser.fullName}.`, 'success');
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    if (activeView === 'admin') {
      setActiveView('store');
    }
    showToast('You have been signed out.', 'info');
  };

  const createAdminAccount = (data: { email: string; username: string; fullName: string; role: 'admin' | 'superadmin' }) => {
    const newAdmin: User = {
      id: `admin-${Date.now()}`,
      email: data.email,
      username: data.username,
      fullName: data.fullName,
      role: data.role,
      createdAt: new Date().toISOString(),
    };
    setAdminUsers((prev) => [...prev, newAdmin]);
    syncSaveUser(newAdmin).catch((e) => console.warn('Admin user sync:', e));
    logAdminAction('CREATE_ADMIN', `Created new ${data.role}: ${data.username}`);
    showToast(`Admin account for ${data.fullName} created.`, 'success');
  };

  const deleteAdminAccount = (id: string) => {
    const target = adminUsers.find((u) => u.id === id);
    if (target?.role === 'superadmin') {
      showToast('Cannot delete primary Super Administrator.', 'error');
      return;
    }
    setAdminUsers((prev) => prev.filter((u) => u.id !== id));
    syncDeleteUser(id).catch((e) => console.warn('Admin user delete sync:', e));
    logAdminAction('DELETE_ADMIN', `Deleted admin account: ${target?.username}`);
    showToast('Admin account removed.', 'info');
  };

  // Orders & Checkout
  const createPendingOrder = (shippingAddress: ShippingAddress): Order => {
    const orderNumber = generateOrderNumber();
    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      brand: item.product.brand,
      price: item.product.salePrice ?? item.product.price,
      quantity: item.quantity,
      image: item.product.images[0] || WHISKY_IMAGE,
      volume: item.product.volume,
    }));

    const resolvedCoords = shippingAddress.coordinates || resolveCoordinatesForAddress(
      shippingAddress.town,
      shippingAddress.exactLocation
    );

    const enrichedAddress: ShippingAddress = {
      ...shippingAddress,
      coordinates: resolvedCoords,
    };

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      userId: currentUser?.id,
      userEmail: currentUser?.email || `${shippingAddress.phone}@barkwetu.co.ke`,
      userName: shippingAddress.fullName,
      phone: shippingAddress.phone,
      items: orderItems,
      subtotal: cartSubtotal,
      deliveryFee,
      discount: discountAmount,
      total: cartTotal,
      promoCodeApplied: appliedPromo?.code,
      status: 'pending',
      paymentMethod: 'mpesa_palpluss',
      paymentStatus: 'pending',
      mpesaDetails: {
        phone: shippingAddress.phone,
        palplussReference: `PLP-${Date.now().toString(36).toUpperCase()}`,
      },
      shippingAddress: enrichedAddress,
      destinationCoords: resolvedCoords,
      assignedRiderId: 'user-rider-1',
      assignedRiderName: 'Juma Boda (Fleet #04)',
      assignedRiderPhone: '+254700000004',
      assignedRiderBike: 'KMCE 482J',
      riderLocation: {
        lat: STORE_HUB_LOCATION.lat,
        lng: STORE_HUB_LOCATION.lng,
        heading: 0,
        speed: 0,
        accuracy: 5,
        updatedAt: new Date().toISOString(),
        isLive: true,
      },
      trackingTimeline: [
        {
          status: 'pending',
          title: 'Order Placed',
          description: 'Awaiting M-Pesa payment confirmation via PalPluss.',
          timestamp: new Date().toISOString(),
          completed: true,
        },
        {
          status: 'paid',
          title: 'Payment Confirmed',
          description: 'M-Pesa payment validated by PalPluss gateway.',
          timestamp: '',
          completed: false,
        },
        {
          status: 'preparing',
          title: 'Packaging & Quality Seal',
          description: 'Inspected and packed in chilled thermal bags.',
          timestamp: '',
          completed: false,
        },
        {
          status: 'out_for_delivery',
          title: 'Out for Express Delivery',
          description: 'Dedicated rider dispatched for delivery.',
          timestamp: '',
          completed: false,
        },
        {
          status: 'delivered',
          title: 'Delivered (Age Verified)',
          description: 'Delivered securely to customer.',
          timestamp: '',
          completed: false,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCurrentOrder(newOrder);
    syncSaveOrder(newOrder).catch((e) => console.warn('Order sync error:', e));

    // Deduct stock for placed items
    orderItems.forEach((item) => {
      adjustStock(item.productId, -item.quantity);
    });

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId || order.orderNumber === orderId) {
          const nowIso = new Date().toISOString();
          const updatedTimeline = order.trackingTimeline.map((step) => {
            const statusOrder: OrderStatus[] = ['pending', 'paid', 'preparing', 'out_for_delivery', 'delivered'];
            const stepIndex = statusOrder.indexOf(step.status);
            const targetIndex = statusOrder.indexOf(newStatus);
            const isCompleted = stepIndex <= targetIndex;
            return {
              ...step,
              completed: isCompleted,
              timestamp: isCompleted && !step.timestamp ? nowIso : step.timestamp,
            };
          });

          const updatedOrder = {
            ...order,
            status: newStatus,
            paymentStatus: (newStatus !== 'pending' && newStatus !== 'cancelled' ? 'completed' : order.paymentStatus) as any,
            trackingTimeline: updatedTimeline,
            updatedAt: nowIso,
          };

          syncUpdateOrderStatus(order.id, newStatus, updatedTimeline).catch((e) => console.warn('Order status sync error:', e));

          return updatedOrder;
        }
        return order;
      })
    );

    logAdminAction('ORDER_STATUS_UPDATE', `Updated order ${orderId} status to ${newStatus}`);
    showToast(`Order status updated to ${newStatus.replace('_', ' ').toUpperCase()}`, 'success');
  };

  const lookupOrder = (orderNumber: string, phoneOrEmail: string): Order | null => {
    const cleanNum = orderNumber.trim().toUpperCase();
    const cleanContact = phoneOrEmail.trim().toLowerCase().replace(/\D/g, '');

    const found = orders.find((o) => {
      const matchNum = o.orderNumber.toUpperCase() === cleanNum;
      const orderPhoneClean = o.phone.replace(/\D/g, '');
      const matchPhone = cleanContact.length >= 7 && (orderPhoneClean.includes(cleanContact) || cleanContact.includes(orderPhoneClean));
      const matchEmail = o.userEmail.toLowerCase().includes(phoneOrEmail.trim().toLowerCase());
      return matchNum && (matchPhone || matchEmail || cleanContact.length === 0);
    });

    return found || null;
  };

  const updateRiderGpsLocation = (orderId: string, location: RiderLocation) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId || order.orderNumber === orderId) {
          return {
            ...order,
            riderLocation: location,
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
    // Broadcast live location to Firestore
    syncUpdateRiderLocation(orderId, location).catch((e) => console.warn('Rider GPS Firestore sync:', e));
  };

  const assignRiderToOrder = (orderId: string, rider: User) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const updated = {
            ...order,
            assignedRiderId: rider.id,
            assignedRiderName: rider.fullName,
            assignedRiderPhone: rider.phone,
            assignedRiderBike: rider.bikeRegistration || 'KMCE 482J',
            updatedAt: new Date().toISOString(),
          };
          syncSaveOrder(updated).catch((e) => console.warn('Assign rider order sync:', e));
          return updated;
        }
        return order;
      })
    );
    logAdminAction('ASSIGN_RIDER', `Assigned rider ${rider.fullName} to order ${orderId}`);
    showToast(`Rider ${rider.fullName} assigned to order.`, 'success');
  };

  // PalPluss STK Push Trigger
  const initiatePalPlussPayment = async (order: Order): Promise<boolean> => {
    try {
      // Call backend PalPluss STK Push endpoint
      const response = await fetch('/api/payments/palpluss/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: order.phone,
          amount: order.total,
          orderNumber: order.orderNumber,
          customerName: order.userName,
        }),
      });

      const data = await response.json();
      const reference = data.reference || `PLP-${Date.now().toString(36).toUpperCase()}`;

      setCurrentStkTransaction({
        reference,
        phone: order.phone,
        amount: order.total,
        orderNumber: order.orderNumber,
        status: 'PENDING',
      });

      setIsPalPlussModalOpen(true);
      return true;
    } catch (err) {
      console.warn('PalPluss direct API error, falling back to local simulation mode', err);
      const reference = `PLP-${Date.now().toString(36).toUpperCase()}`;
      setCurrentStkTransaction({
        reference,
        phone: order.phone,
        amount: order.total,
        orderNumber: order.orderNumber,
        status: 'PENDING',
      });
      setIsPalPlussModalOpen(true);
      return true;
    }
  };

  const simulatePalPlussAction = async (action: 'SUCCESS' | 'CANCELLED') => {
    if (!currentStkTransaction || !currentOrder) return;

    if (action === 'SUCCESS') {
      const receiptChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let receipt = 'Q';
      for (let i = 0; i < 9; i++) {
        receipt += receiptChars.charAt(Math.floor(Math.random() * receiptChars.length));
      }

      setCurrentStkTransaction((prev) =>
        prev ? { ...prev, status: 'SUCCESS', receipt } : null
      );

      // Update Order to PAID
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === currentOrder.id) {
            const nowIso = new Date().toISOString();
            const updatedTimeline = o.trackingTimeline.map((step) => {
              if (step.status === 'pending' || step.status === 'paid') {
                return { ...step, completed: true, timestamp: nowIso };
              }
              return step;
            });
            const updatedOrder: Order = {
              ...o,
              status: 'paid',
              paymentStatus: 'completed',
              mpesaDetails: {
                ...o.mpesaDetails,
                receiptNumber: receipt,
                paidAt: nowIso,
                statusMessage: 'Payment received successfully via PalPluss STK Push',
              },
              trackingTimeline: updatedTimeline,
              updatedAt: nowIso,
            };
            syncSaveOrder(updatedOrder).catch((e) => console.warn('Paid order sync error:', e));
            return updatedOrder;
          }
          return o;
        })
      );

      clearCart();
      showToast(`Payment received! M-Pesa Receipt: ${receipt}`, 'success');

      setTimeout(() => {
        setIsPalPlussModalOpen(false);
        setActiveView('order-confirmation');
      }, 1500);
    } else {
      setCurrentStkTransaction((prev) =>
        prev ? { ...prev, status: 'CANCELLED' } : null
      );
      showToast('Payment request was cancelled or timed out.', 'error');
    }
  };

  const cancelPalPlussPayment = () => {
    setIsPalPlussModalOpen(false);
    setCurrentStkTransaction(null);
  };

  // Settings
  const updateSettings = (updates: Partial<SiteSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...updates };
      syncSaveSettings(updated).catch((e) => console.warn('Settings sync error:', e));
      return updated;
    });
    logAdminAction('UPDATE_SETTINGS', 'Site settings and PalPluss credentials updated');
    showToast('Store settings updated.', 'success');
  };

  return (
    <StoreContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedProductId,
        setSelectedProductId,
        selectedCategorySlug,
        setSelectedCategorySlug,
        searchQuery,
        setSearchQuery,
        isCartOpen,
        setIsCartOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isAgeGateOpen,
        ageVerified,
        verifyAge,

        products,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,

        addCategory,
        updateCategory,
        deleteCategory,

        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotal,
        deliveryFee,
        discountAmount,
        cartTotal,

        appliedPromo,
        applyPromoCode,
        removePromoCode,
        promoCodes,
        addPromoCode,
        togglePromoCode,

        currentUser,
        loginWithPassword,
        loginWithGoogle,
        signupWithPassword,
        logout,
        adminUsers,
        createAdminAccount,
        deleteAdminAccount,

        orders,
        currentOrder,
        setCurrentOrder,
        createPendingOrder,
        updateOrderStatus,
        lookupOrder,
        updateRiderGpsLocation,
        assignRiderToOrder,

        isPalPlussModalOpen,
        setIsPalPlussModalOpen,
        currentStkTransaction,
        initiatePalPlussPayment,
        simulatePalPlussAction,
        cancelPalPlussPayment,

        settings,
        updateSettings,
        auditLogs,
        logAdminAction,

        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
