export type OrderType = 'dine-in' | 'takeaway' | 'delivery' | 'parcel';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'upi' | 'card' | 'cash' | 'split';
export type PaymentStatus = 'paid' | 'pending' | 'refunded';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
  modifiers?: string[];
  instructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  outletId: string;
  outletName: string;
  tableNumber?: string;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  tax: number;
  discount: number;
  serviceCharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  prepTimeMinutes: number;
  elapsedMinutes?: number;
  serverName?: string;
  notes?: string;
}

export type MenuCategory =
  | 'all'
  | 'starters'
  | 'main-course'
  | 'pizza'
  | 'burgers'
  | 'beverages'
  | 'desserts';

export interface MenuModifierOption {
  name: string;
  price: number;
}

export interface MenuModifierGroup {
  name: string;
  options: MenuModifierOption[];
}

export interface MenuItemVariant {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  costPrice: number;
  description: string;
  isVeg: boolean;
  isBestseller?: boolean;
  isAvailable: boolean;
  image: string;
  preparationTime: number; // in mins
  outletsAvailable: string[];
  variants?: MenuItemVariant[];
  modifiers?: MenuModifierGroup[];
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'billing';

export interface TableItem {
  id: string;
  tableNumber: string;
  capacity: number;
  zone: 'Ground Floor' | 'Rooftop Terrace' | 'Family Lounge' | 'Courtyard';
  status: TableStatus;
  currentOrderId?: string;
  currentAmount?: number;
  occupiedSince?: string;
  durationMinutes?: number;
  guestCount?: number;
  server?: string;
  reservedFor?: {
    guestName: string;
    phone: string;
    time: string;
    partySize: number;
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Dairy' | 'Vegetables' | 'Grains & Flour' | 'Oils & Condiments' | 'Spices' | 'Beverages';
  currentStock: number;
  minStock: number;
  unit: 'kg' | 'L' | 'bags' | 'units' | 'crates';
  unitCost: number;
  supplierName: string;
  lastRestocked: string;
  status: 'healthy' | 'low' | 'critical';
  wastageThisMonth: number;
}

export type CustomerSegment = 'VIP' | 'Regular' | 'New' | 'At Risk';
export type LoyaltyTier = 'Silver' | 'Gold' | 'Platinum';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  segment: CustomerSegment;
  tier: LoyaltyTier;
  totalVisits: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastVisitDate: string;
  favoriteItems: string[];
  notes: string;
  avatar?: string;
}

export interface LoyaltyCoupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend: number;
  maxDiscount?: number;
  validUntil: string;
  usageCount: number;
  isActive: boolean;
}

export type RoomStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';
export type HousekeepingStatus = 'clean' | 'dirty' | 'inspecting' | 'in-progress';
export type RoomType = 'Deluxe' | 'Executive Suite' | 'Royal Heritage' | 'Presidential Villa';

export interface Room {
  id: string;
  roomNumber: string;
  type: RoomType;
  floor: number;
  pricePerNight: number;
  status: RoomStatus;
  housekeeping: HousekeepingStatus;
  amenities: string[];
  currentGuest?: {
    name: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    folioAmount: number;
    adults: number;
  };
}

export interface Reservation {
  id: string;
  bookingNumber: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  roomNumber: string;
  roomType: RoomType;
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  totalAmount: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  nights: number;
}

export type HotelReservation = Reservation;

export interface Outlet {
  id: string;
  name: string;
  location: string;
  phone: string;
  tablesCount: number;
  staffCount: number;
}

export interface Tenant {
  id: string;
  name: string;
  legalEntity: string;
  plan: 'Starter' | 'Growth' | 'Enterprise';
  status: 'Active' | 'Trial' | 'Suspended';
  outletsCount: number;
  activeUsers: number;
  mrr: number;
  joinedDate: string;
  contactEmail: string;
}

export interface FeatureEntitlement {
  id: string;
  name: string;
  module: 'Restaurant' | 'Hotel' | 'CRM' | 'Platform';
  description: string;
  starter: boolean;
  growth: boolean;
  enterprise: boolean;
  tenantOverrides?: Record<string, boolean>; // tenantId -> enabled
}

export type UserRole = 'manager' | 'cashier' | 'chef' | 'waiter';

export interface StaffPermissions {
  canTakeOrders: boolean;
  canSettleBills: boolean;
  canApplyDiscounts: boolean;
  canCancelOrders: boolean;
  canViewKitchen: boolean;
  canToggle86Menu: boolean;
  canEditMenuPrices: boolean;
  canAdjustInventory: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canAccessHotelPms: boolean;
}

export interface StaffUser {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  pin: string;
  avatarText: string;
  outletId: string;
  outletName: string;
  description: string;
  allowedRoutes: string[];
  permissions: StaffPermissions;
}

