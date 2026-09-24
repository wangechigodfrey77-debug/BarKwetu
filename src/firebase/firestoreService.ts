import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  increment,
} from 'firebase/firestore';
import { db } from './config';
import {
  Product,
  Category,
  Order,
  PromoCode,
  SiteSettings,
  AuditLog,
  User,
  OrderStatus,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_PROMO_CODES,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_SAMPLE_ORDER,
} from '../data/seedData';

// Collection References
const PRODUCTS_COL = 'products';
const CATEGORIES_COL = 'categories';
const ORDERS_COL = 'orders';
const PROMOS_COL = 'promoCodes';
const SETTINGS_COL = 'settings';
const AUDIT_COL = 'auditLogs';
const USERS_COL = 'users';

/**
 * Deep recursive sanitizer that removes undefined values so Firestore does not reject writes
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as any;
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  const clean: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean;
}

// Seeding function if Firestore is uninitialized
export const seedFirestoreIfEmpty = async () => {
  try {
    // 1. Check products
    const prodSnapshot = await getDocs(collection(db, PRODUCTS_COL));
    if (prodSnapshot.empty) {
      console.log('🌱 Seeding Firestore with BarKwetu initial products...');
      for (const p of INITIAL_PRODUCTS) {
        await setDoc(doc(db, PRODUCTS_COL, p.id), sanitizeForFirestore(p));
      }
    }

    // 2. Check categories
    const catSnapshot = await getDocs(collection(db, CATEGORIES_COL));
    if (catSnapshot.empty) {
      console.log('🌱 Seeding Firestore with BarKwetu categories...');
      for (const c of INITIAL_CATEGORIES) {
        await setDoc(doc(db, CATEGORIES_COL, c.id), sanitizeForFirestore(c));
      }
    }

    // 3. Check promos
    const promoSnapshot = await getDocs(collection(db, PROMOS_COL));
    if (promoSnapshot.empty) {
      console.log('🌱 Seeding Firestore with BarKwetu promo codes...');
      for (const pr of INITIAL_PROMO_CODES) {
        await setDoc(doc(db, PROMOS_COL, pr.id), sanitizeForFirestore(pr));
      }
    }

    // 4. Check settings
    const settingDoc = await getDoc(doc(db, SETTINGS_COL, 'main'));
    if (!settingDoc.exists()) {
      console.log('🌱 Seeding Firestore with BarKwetu site settings...');
      await setDoc(doc(db, SETTINGS_COL, 'main'), sanitizeForFirestore(INITIAL_SETTINGS));
    }

    // 5. Check sample orders
    const orderSnapshot = await getDocs(collection(db, ORDERS_COL));
    if (orderSnapshot.empty) {
      console.log('🌱 Seeding Firestore with sample Kenyan order...');
      await setDoc(doc(db, ORDERS_COL, INITIAL_SAMPLE_ORDER.id), sanitizeForFirestore(INITIAL_SAMPLE_ORDER));
    }

    // 6. Check users
    const userSnapshot = await getDocs(collection(db, USERS_COL));
    if (userSnapshot.empty) {
      console.log('🌱 Seeding Firestore with admin users...');
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, USERS_COL, u.id), sanitizeForFirestore(u));
      }
    }
  } catch (error) {
    console.warn('Firestore seeding notice:', error);
  }
};

// ================= Real-time Listeners =================

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const q = collection(db, PRODUCTS_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Product);
      callback(items);
    },
    (err) => console.error('Error listening to products:', err)
  );
};

export const subscribeToCategories = (callback: (categories: Category[]) => void) => {
  const q = collection(db, CATEGORIES_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Category);
      items.sort((a, b) => a.displayOrder - b.displayOrder);
      callback(items);
    },
    (err) => console.error('Error listening to categories:', err)
  );
};

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  const q = collection(db, ORDERS_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Order);
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (err) => console.error('Error listening to orders:', err)
  );
};

export const subscribeToPromoCodes = (callback: (promos: PromoCode[]) => void) => {
  const q = collection(db, PROMOS_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as PromoCode);
      callback(items);
    },
    (err) => console.error('Error listening to promo codes:', err)
  );
};

export const subscribeToSettings = (callback: (settings: SiteSettings) => void) => {
  const docRef = doc(db, SETTINGS_COL, 'main');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as SiteSettings);
      }
    },
    (err) => console.error('Error listening to settings:', err)
  );
};

export const subscribeToAuditLogs = (callback: (logs: AuditLog[]) => void) => {
  const q = collection(db, AUDIT_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as AuditLog);
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(items);
    },
    (err) => console.error('Error listening to audit logs:', err)
  );
};

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  const q = collection(db, USERS_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as User);
      callback(items);
    },
    (err) => console.error('Error listening to users:', err)
  );
};

// ================= Active Mutators =================

// Products
export const syncSaveProduct = async (product: Product) => {
  const clean = sanitizeForFirestore(product);
  await setDoc(doc(db, PRODUCTS_COL, product.id), clean);
};

export const syncDeleteProduct = async (productId: string) => {
  await deleteDoc(doc(db, PRODUCTS_COL, productId));
};

export const syncAdjustStock = async (productId: string, newStock: number) => {
  await updateDoc(doc(db, PRODUCTS_COL, productId), { stock: newStock });
};

// Categories
export const syncSaveCategory = async (category: Category) => {
  const clean = sanitizeForFirestore(category);
  await setDoc(doc(db, CATEGORIES_COL, category.id), clean);
};

export const syncDeleteCategory = async (categoryId: string) => {
  await deleteDoc(doc(db, CATEGORIES_COL, categoryId));
};

// Orders
export const syncSaveOrder = async (order: Order) => {
  const clean = sanitizeForFirestore(order);
  await setDoc(doc(db, ORDERS_COL, order.id), clean);
};

export const syncUpdateRiderLocation = async (orderId: string, location: any) => {
  const clean = sanitizeForFirestore(location);
  await updateDoc(doc(db, ORDERS_COL, orderId), {
    riderLocation: clean,
    updatedAt: new Date().toISOString(),
  });
};

export const syncUpdateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  timeline: any[],
  mpesaDetails?: any
) => {
  const updatePayload: any = {
    status,
    timeline: sanitizeForFirestore(timeline),
    updatedAt: new Date().toISOString(),
  };
  if (mpesaDetails) {
    updatePayload.mpesaDetails = sanitizeForFirestore(mpesaDetails);
    updatePayload.paymentStatus = 'completed';
  }
  await updateDoc(doc(db, ORDERS_COL, orderId), updatePayload);
};

// Promo Codes
export const syncSavePromoCode = async (promo: PromoCode) => {
  const clean = sanitizeForFirestore(promo);
  await setDoc(doc(db, PROMOS_COL, promo.id), clean);
};

export const syncTogglePromoCode = async (promoId: string, isActive: boolean) => {
  await updateDoc(doc(db, PROMOS_COL, promoId), { isActive });
};

// Settings
export const syncSaveSettings = async (settings: SiteSettings) => {
  const clean = sanitizeForFirestore(settings);
  await setDoc(doc(db, SETTINGS_COL, 'main'), clean);
};

// Audit Logs
export const syncSaveAuditLog = async (log: AuditLog) => {
  const clean = sanitizeForFirestore(log);
  await setDoc(doc(db, AUDIT_COL, log.id), clean);
};

// Users
export const syncSaveUser = async (user: User) => {
  const clean = sanitizeForFirestore(user);
  await setDoc(doc(db, USERS_COL, user.id), clean);
};

export const syncDeleteUser = async (userId: string) => {
  await deleteDoc(doc(db, USERS_COL, userId));
};
