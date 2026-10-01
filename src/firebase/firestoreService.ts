import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import { db, auth } from './config';
import {
  Product,
  Category,
  Order,
  PromoCode,
  SiteSettings,
  AuditLog,
  User,
  OrderStatus,
  ProductReview,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_PROMO_CODES,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_SAMPLE_ORDER,
  INITIAL_REVIEWS,
} from '../data/seedData';

// Collection References
const PRODUCTS_COL = 'products';
const CATEGORIES_COL = 'categories';
const ORDERS_COL = 'orders';
const PROMOS_COL = 'promoCodes';
const SETTINGS_COL = 'settings';
const AUDIT_COL = 'auditLogs';
const USERS_COL = 'users';
const REVIEWS_COL = 'reviews';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  const errMsg = errInfo.error.toLowerCase();
  if (
    !errMsg.includes('unavailable') &&
    !errMsg.includes('offline') &&
    !errMsg.includes('the client is offline') &&
    !errMsg.includes('failed to get document from server')
  ) {
    console.warn('Firestore Warning/Notice: ', JSON.stringify(errInfo));
  }
  return errInfo;
}

/**
 * Validates connection to Firestore backend
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'main'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in local offline cache mode.');
    }
    return false;
  }
}

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

    // 7. Check reviews
    const reviewSnapshot = await getDocs(collection(db, REVIEWS_COL));
    if (reviewSnapshot.empty) {
      console.log('🌱 Seeding Firestore with product reviews...');
      for (const r of INITIAL_REVIEWS) {
        await setDoc(doc(db, REVIEWS_COL, r.id), sanitizeForFirestore(r));
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'seed_check');
  }
};

// ================= Real-time Listeners =================

export const subscribeToReviews = (callback: (reviews: ProductReview[]) => void) => {
  const q = collection(db, REVIEWS_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as ProductReview);
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, REVIEWS_COL);
    }
  );
};

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const q = collection(db, PRODUCTS_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Product);
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, PRODUCTS_COL);
    }
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
    (err) => {
      handleFirestoreError(err, OperationType.LIST, CATEGORIES_COL);
    }
  );
};

export const subscribeToOrders = (
  callback: (orders: Order[], newOrders: Order[]) => void
) => {
  const q = collection(db, ORDERS_COL);
  let isInitialLoad = true;

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Order);
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (isInitialLoad) {
        isInitialLoad = false;
        callback(items, []);
      } else {
        const newlyAddedOrders: Order[] = [];
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as Order;
            newlyAddedOrders.push(data);
          }
        });
        callback(items, newlyAddedOrders);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, ORDERS_COL);
    }
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
    (err) => {
      handleFirestoreError(err, OperationType.LIST, PROMOS_COL);
    }
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
    (err) => {
      handleFirestoreError(err, OperationType.GET, `${SETTINGS_COL}/main`);
    }
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
    (err) => {
      handleFirestoreError(err, OperationType.LIST, AUDIT_COL);
    }
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
    (err) => {
      handleFirestoreError(err, OperationType.LIST, USERS_COL);
    }
  );
};

// ================= Active Mutators =================

// Products
export const syncSaveProduct = async (product: Product) => {
  try {
    const clean = sanitizeForFirestore(product);
    await setDoc(doc(db, PRODUCTS_COL, product.id), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PRODUCTS_COL}/${product.id}`);
  }
};

export const syncDeleteProduct = async (productId: string) => {
  try {
    await deleteDoc(doc(db, PRODUCTS_COL, productId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${PRODUCTS_COL}/${productId}`);
  }
};

export const syncAdjustStock = async (productId: string, newStock: number) => {
  try {
    await updateDoc(doc(db, PRODUCTS_COL, productId), { stock: newStock });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${PRODUCTS_COL}/${productId}`);
  }
};

// Categories
export const syncSaveCategory = async (category: Category) => {
  try {
    const clean = sanitizeForFirestore(category);
    await setDoc(doc(db, CATEGORIES_COL, category.id), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${CATEGORIES_COL}/${category.id}`);
  }
};

export const syncDeleteCategory = async (categoryId: string) => {
  try {
    await deleteDoc(doc(db, CATEGORIES_COL, categoryId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${CATEGORIES_COL}/${categoryId}`);
  }
};

// Orders
export const syncSaveOrder = async (order: Order) => {
  try {
    const clean = sanitizeForFirestore(order);
    await setDoc(doc(db, ORDERS_COL, order.id), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${ORDERS_COL}/${order.id}`);
  }
};

export const syncUpdateRiderLocation = async (orderId: string, location: any) => {
  try {
    const clean = sanitizeForFirestore(location);
    await updateDoc(doc(db, ORDERS_COL, orderId), {
      riderLocation: clean,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${ORDERS_COL}/${orderId}`);
  }
};

export const syncUpdateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  timeline: any[],
  mpesaDetails?: any
) => {
  try {
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
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${ORDERS_COL}/${orderId}`);
  }
};

// Promo Codes
export const syncSavePromoCode = async (promo: PromoCode) => {
  try {
    const clean = sanitizeForFirestore(promo);
    await setDoc(doc(db, PROMOS_COL, promo.id), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PROMOS_COL}/${promo.id}`);
  }
};

export const syncTogglePromoCode = async (promoId: string, isActive: boolean) => {
  try {
    await updateDoc(doc(db, PROMOS_COL, promoId), { isActive });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${PROMOS_COL}/${promoId}`);
  }
};

// Settings
export const syncSaveSettings = async (settings: SiteSettings) => {
  try {
    const clean = sanitizeForFirestore(settings);
    await setDoc(doc(db, SETTINGS_COL, 'main'), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${SETTINGS_COL}/main`);
  }
};

// Audit Logs
export const syncSaveAuditLog = async (log: AuditLog) => {
  try {
    const clean = sanitizeForFirestore(log);
    await setDoc(doc(db, AUDIT_COL, log.id), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${AUDIT_COL}/${log.id}`);
  }
};

// Users
export const syncSaveUser = async (user: User) => {
  try {
    const clean = sanitizeForFirestore(user);
    await setDoc(doc(db, USERS_COL, user.id), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${USERS_COL}/${user.id}`);
  }
};

export const syncDeleteUser = async (userId: string) => {
  try {
    await deleteDoc(doc(db, USERS_COL, userId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${USERS_COL}/${userId}`);
  }
};

// Reviews
export const syncSaveReview = async (review: ProductReview) => {
  try {
    const clean = sanitizeForFirestore(review);
    await setDoc(doc(db, REVIEWS_COL, review.id), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${REVIEWS_COL}/${review.id}`);
  }
};

export const syncDeleteReview = async (reviewId: string) => {
  try {
    await deleteDoc(doc(db, REVIEWS_COL, reviewId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${REVIEWS_COL}/${reviewId}`);
  }
};
