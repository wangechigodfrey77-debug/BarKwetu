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

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone?: string;
  role: 'customer' | 'admin' | 'superadmin' | 'rider';
  bikeRegistration?: string;
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
