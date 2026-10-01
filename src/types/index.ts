export type SpiritCategory = 
  | 'whisky'
  | 'vodka'
  | 'gin'
  | 'rum'
  | 'tequila'
  | 'liqueur'
  | 'beer'
  | 'wine'
  | 'rtd'
  | 'barware'
  | 'gifts';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  spiritType: SpiritCategory;
  displayOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  spiritType: SpiritCategory;
  price: number;
  salePrice?: number;
  stock: number;
  abv: string;
  volume: string;
  description: string;
  tastingNotes?: {
    nose?: string;
    palate?: string;
    finish?: string;
  };
  origin: string;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  rating: number;
  reviewsCount: number;
}

export interface BulkInventoryItem {
  id?: string;
  name?: string;
  slug?: string;
  stock: number;
  price?: number;
  salePrice?: number;
  mode?: 'set' | 'add';
}

export interface BulkInventoryResult {
  success: boolean;
  totalProcessed: number;
  updatedCount: number;
  unmatchedCount: number;
  items: Array<{
    productId: string;
    productName: string;
    oldStock: number;
    newStock: number;
    oldPrice?: number;
    newPrice?: number;
    matched: boolean;
  }>;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  verifiedPurchase?: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 
  | 'pending'
  | 'paid'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface TrackingStep {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  county: string;
  town: string;
  exactLocation: string;
  buildingOrLandmark?: string;
  deliveryNotes?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface MpesaPaymentDetails {
  phone: string;
  receiptNumber?: string;
  palplussReference: string;
  merchantTransactionId?: string;
  paidAt?: string;
  statusMessage?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  brand: string;
  price: number;
  quantity: number;
  image: string;
  volume: string;
}

export interface RiderLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  updatedAt: string;
  isLive: boolean;
}

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  bikeRegistration: string;
  photoUrl?: string;
  currentLocation?: RiderLocation;
  isOnline: boolean;
  activeOrderId?: string;
  rating?: number;
  deliveriesCompleted?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  userEmail: string;
  userName: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  promoCodeApplied?: string;
  status: OrderStatus;
  paymentMethod: 'mpesa_palpluss';
  paymentStatus: 'pending' | 'completed' | 'failed';
  mpesaDetails: MpesaPaymentDetails;
  shippingAddress: ShippingAddress;
  trackingTimeline: TrackingStep[];
  kwetuCoinsEarned?: number;
  kwetuCoinsRedeemed?: number;
  loyaltyDiscount?: number;
  assignedRiderId?: string;
  assignedRiderName?: string;
  assignedRiderPhone?: string;
  assignedRiderBike?: string;
  riderLocation?: RiderLocation;
  destinationCoords?: {
    lat: number;
    lng: number;
  };
  estimatedDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  expiryDate: string;
  usageLimit: number;
  timesUsed: number;
  isActive: boolean;
}

export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum VIP';

export interface KwetuCoinTransaction {
  id: string;
  userId: string;
  amount: number; // positive for earned, negative for redeemed
  type: 'earned_purchase' | 'redeemed_discount' | 'redeemed_delivery' | 'welcome_bonus' | 'admin_adjustment';
  description: string;
  orderNumber?: string;
  promoCodeGenerated?: string;
  timestamp: string;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  coinCost: number;
  discountType: 'fixed' | 'free_delivery';
  discountValue: number;
  minSpend: number;
  badge?: string;
  iconName: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  password?: string;
  phone?: string;
  role: 'customer' | 'admin' | 'superadmin' | 'rider';
  bikeRegistration?: string;
  kwetuCoins?: number;
  lifetimeCoinsEarned?: number;
  loyaltyTier?: LoyaltyTier;
  coinsHistory?: KwetuCoinTransaction[];
  defaultCounty?: string;
  defaultTown?: string;
  defaultAddress?: string;
  createdAt: string;
}

export interface SiteSettings {
  storeName: string;
  tagline: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  supportPhone: string;
  supportEmail: string;
  currency: string;
  isStoreOpen: boolean;
  bannerNotice: string;
  hubLocation: {
    lat: number;
    lng: number;
    name: string;
    address: string;
  };
  // PalPluss API configuration
  palplussMerchantId: string;
  palplussApiKey: string;
  palplussWebhookSecret: string;
  palplussLiveMode: boolean;
  palplussEndpoint: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  details: string;
  timestamp: string;
}
