import { Injectable, signal, computed } from '@angular/core';
import {
  Customer,
  HotelReservation,
  InventoryItem,
  LoyaltyCoupon,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  Outlet,
  PaymentMethod,
  Room,
  RoomStatus,
  HousekeepingStatus,
  TableItem,
  TableStatus,
  Tenant,
} from '../models/hospitality.model';
import {
  INITIAL_COUPONS,
  INITIAL_CUSTOMERS,
  INITIAL_HOTEL_RESERVATIONS,
  INITIAL_INVENTORY,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_OUTLETS,
  INITIAL_ROOMS,
  INITIAL_TABLES,
  INITIAL_TENANTS,
} from './hospitality-data';
import { ToastService } from './toast.service';

export interface PosCartItem {
  id: string; // unique cart entry key
  menuItem: MenuItem;
  quantity: number;
  selectedVariant?: string;
  selectedModifiers: string[];
  unitPrice: number;
  specialInstructions?: string;
}

@Injectable({
  providedIn: 'root',
})
export class HospitalityService {
  private readonly STORAGE_PREFIX = 'hospitalityos_v1_';

  // Navigation & Platform State
  readonly isSuperAdmin = signal<boolean>(false);
  readonly selectedOutletId = signal<string>('all');
  readonly selectedDateRange = signal<'today' | 'yesterday' | 'week' | 'month'>('today');
  readonly searchQuery = signal<string>('');

  // Core Collections
  readonly outlets = signal<Outlet[]>(INITIAL_OUTLETS);
  readonly orders = signal<Order[]>(this.loadFromStorage('orders', INITIAL_ORDERS));
  readonly menuItems = signal<MenuItem[]>(this.loadFromStorage('menu', INITIAL_MENU_ITEMS));
  readonly tables = signal<TableItem[]>(this.loadFromStorage('tables', INITIAL_TABLES));
  readonly inventory = signal<InventoryItem[]>(this.loadFromStorage('inventory', INITIAL_INVENTORY));
  readonly customers = signal<Customer[]>(this.loadFromStorage('customers', INITIAL_CUSTOMERS));
  readonly coupons = signal<LoyaltyCoupon[]>(this.loadFromStorage('coupons', INITIAL_COUPONS));
  readonly rooms = signal<Room[]>(this.loadFromStorage('rooms', INITIAL_ROOMS));
  readonly reservations = signal<HotelReservation[]>(this.loadFromStorage('reservations', INITIAL_HOTEL_RESERVATIONS));
  readonly tenants = signal<Tenant[]>(this.loadFromStorage('tenants', INITIAL_TENANTS));

  // POS State
  readonly cartItems = signal<PosCartItem[]>([]);
  readonly posOrderType = signal<OrderType>('dine-in');
  readonly posSelectedTable = signal<string>('T-01');
  readonly posCustomerName = signal<string>('');
  readonly posCustomerPhone = signal<string>('');
  readonly posAppliedCoupon = signal<LoyaltyCoupon | null>(null);
  readonly posApplyServiceCharge = signal<boolean>(true);
  readonly posPaymentMethod = signal<PaymentMethod>('upi');

  // Filtered computed signals based on active outlet
  readonly currentOutlet = computed(() => {
    const id = this.selectedOutletId();
    if (id === 'all') return null;
    return this.outlets().find((o) => o.id === id) || null;
  });

  readonly filteredOrders = computed(() => {
    const outletId = this.selectedOutletId();
    const query = this.searchQuery().toLowerCase().trim();
    return this.orders().filter((order) => {
      const matchOutlet = outletId === 'all' || order.outletId === outletId;
      if (!matchOutlet) return false;
      if (!query) return true;
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.toLowerCase().includes(query) ||
        (order.tableNumber && order.tableNumber.toLowerCase().includes(query))
      );
    });
  });

  readonly filteredTables = computed(() => {
    return this.tables();
  });

  // KPI Metrics computed for Dashboard
  readonly kpiMetrics = computed(() => {
    const ordersList = this.filteredOrders();
    const validOrders = ordersList.filter((o) => o.status !== 'cancelled');
    const totalRev = validOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrdCount = validOrders.length;
    const aov = totalOrdCount > 0 ? Math.round(totalRev / totalOrdCount) : 0;

    const tablesList = this.tables();
    const occupiedTables = tablesList.filter((t) => t.status === 'occupied' || t.status === 'billing').length;
    const totalTables = tablesList.length;

    const customersList = this.customers();
    const newCustCount = customersList.filter((c) => c.segment === 'New').length;
    const repeatCustCount = customersList.filter((c) => c.segment === 'Regular' || c.segment === 'VIP').length;
    const repeatRate = customersList.length > 0 ? Math.round((repeatCustCount / customersList.length) * 100) : 42;

    return {
      totalRevenue: totalRev > 0 ? totalRev : 184500,
      totalOrders: totalOrdCount > 0 ? totalOrdCount : 248,
      avgOrderValue: aov > 0 ? aov : 743,
      occupiedTables,
      totalTables,
      newCustomers: newCustCount > 0 ? newCustCount : 36,
      repeatCustomerRate: repeatRate,
    };
  });

  // POS Dynamic Cart Calculations
  readonly cartSubtotal = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  });

  readonly cartDiscount = computed(() => {
    const sub = this.cartSubtotal();
    const coupon = this.posAppliedCoupon();
    if (!coupon || sub < coupon.minSpend) return 0;
    if (coupon.discountType === 'percentage') {
      const calc = (sub * coupon.discountValue) / 100;
      return coupon.maxDiscount ? Math.min(calc, coupon.maxDiscount) : calc;
    }
    return coupon.discountValue;
  });

  readonly cartTax = computed(() => {
    // 5% GST for restaurant dining / takeaway
    const discounted = Math.max(0, this.cartSubtotal() - this.cartDiscount());
    return Math.round(discounted * 0.05 * 100) / 100;
  });

  readonly cartServiceCharge = computed(() => {
    if (!this.posApplyServiceCharge() || this.posOrderType() !== 'dine-in') return 0;
    const discounted = Math.max(0, this.cartSubtotal() - this.cartDiscount());
    return Math.round(discounted * 0.05 * 100) / 100;
  });

  readonly cartTotal = computed(() => {
    const sub = this.cartSubtotal();
    const disc = this.cartDiscount();
    const tax = this.cartTax();
    const sc = this.cartServiceCharge();
    return Math.round((sub - disc + tax + sc) * 100) / 100;
  });

  constructor(private toast: ToastService) {}

  // Helper for localStorage
  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(this.STORAGE_PREFIX + key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse ' + key + ' from localStorage', e);
    }
    return fallback;
  }

  private saveToStorage<T>(key: string, data: T) {
    try {
      localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save ' + key + ' to localStorage', e);
    }
  }

  // Outlet Switching
  setOutlet(outletId: string) {
    this.selectedOutletId.set(outletId);
    const outletName = outletId === 'all' ? 'All Outlets' : this.outlets().find((o) => o.id === outletId)?.name || outletId;
    this.toast.info('Outlet Changed', `Switched view to ${outletName}`);
  }

  setDateRange(range: 'today' | 'yesterday' | 'week' | 'month') {
    this.selectedDateRange.set(range);
  }

  toggleSuperAdmin() {
    this.isSuperAdmin.update((v) => !v);
    const mode = this.isSuperAdmin() ? 'Super Admin Portal' : 'HospitalityOS Restaurant Portal';
    this.toast.info('View Switched', `Now in ${mode}`);
  }

  // --- ORDER MANAGEMENT ACTIONS ---
  updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    this.orders.update((list) => {
      const updated = list.map((order) => {
        if (order.id === orderId) {
          return { ...order, status: newStatus };
        }
        return order;
      });
      this.saveToStorage('orders', updated);
      return updated;
    });
    this.toast.success('Order Status Updated', `Order #${orderId} moved to ${newStatus.toUpperCase()}`);
  }

  cancelOrder(orderId: string, reason?: string) {
    this.orders.update((list) => {
      const updated = list.map((order) => {
        if (order.id === orderId) {
          return { ...order, status: 'cancelled' as OrderStatus, notes: (order.notes ? order.notes + ' | ' : '') + 'Cancelled: ' + (reason || 'Customer requested') };
        }
        return order;
      });
      this.saveToStorage('orders', updated);
      return updated;
    });
    this.toast.warning('Order Cancelled', `Order #${orderId} has been cancelled.`);
  }

  createOrder(orderData: Partial<Order>): Order {
    const nextNum = Math.floor(2490 + Math.random() * 500);
    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: `#HOS-${nextNum}`,
      type: orderData.type || 'dine-in',
      status: 'pending',
      items: orderData.items || [],
      outletId: orderData.outletId || (this.selectedOutletId() === 'all' ? 'jaipur-central' : this.selectedOutletId()),
      outletName: this.selectedOutletId() === 'all' ? 'Jaipur Central - MI Road' : this.currentOutlet()?.name || 'Jaipur Central',
      tableNumber: orderData.tableNumber,
      customerName: orderData.customerName || 'Walk-in Guest',
      customerPhone: orderData.customerPhone || '+91 98290 00000',
      subtotal: orderData.subtotal || 0,
      tax: orderData.tax || 0,
      discount: orderData.discount || 0,
      serviceCharge: orderData.serviceCharge || 0,
      total: orderData.total || 0,
      paymentMethod: orderData.paymentMethod || 'upi',
      paymentStatus: orderData.paymentStatus || 'paid',
      createdAt: 'Just now',
      prepTimeMinutes: orderData.prepTimeMinutes || 20,
      elapsedMinutes: 0,
      serverName: orderData.serverName || 'Lucky Jain',
      notes: orderData.notes,
    };

    this.orders.update((list) => {
      const updated = [newOrder, ...list];
      this.saveToStorage('orders', updated);
      return updated;
    });

    // If dine-in, mark table as occupied
    if (newOrder.type === 'dine-in' && newOrder.tableNumber) {
      this.updateTableStatus(newOrder.tableNumber, 'occupied', newOrder.id, newOrder.total);
    }

    this.toast.success('New Order Created', `${newOrder.orderNumber} for ₹${newOrder.total} placed successfully!`);
    return newOrder;
  }

  // --- POS CART ACTIONS ---
  addToCart(item: MenuItem, variantName?: string, modifiers: string[] = [], instructions?: string) {
    let unitPrice = item.price;
    if (variantName && item.variants) {
      const v = item.variants.find((vr) => vr.name === variantName);
      if (v) unitPrice = v.price;
    }
    // Add modifiers cost
    if (modifiers.length > 0 && item.modifiers) {
      item.modifiers.forEach((g) => {
        g.options.forEach((opt) => {
          if (modifiers.includes(opt.name)) {
            unitPrice += opt.price;
          }
        });
      });
    }

    const cartKey = `${item.id}-${variantName || 'default'}-${modifiers.sort().join('-')}`;

    this.cartItems.update((items) => {
      const existingIdx = items.findIndex((i) => i.id === cartKey);
      if (existingIdx > -1) {
        const next = [...items];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + 1,
        };
        return next;
      } else {
        return [
          ...items,
          {
            id: cartKey,
            menuItem: item,
            quantity: 1,
            selectedVariant: variantName,
            selectedModifiers: modifiers,
            unitPrice,
            specialInstructions: instructions,
          },
        ];
      }
    });

    this.toast.info('Item Added', `${item.name} added to current ticket`);
  }

  updateCartQuantity(cartItemId: string, change: number) {
    this.cartItems.update((items) => {
      return items
        .map((i) => {
          if (i.id === cartItemId) {
            const nextQty = i.quantity + change;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as PosCartItem[];
    });
  }

  removeCartItem(cartItemId: string) {
    this.cartItems.update((items) => items.filter((i) => i.id !== cartItemId));
  }

  clearCart() {
    this.cartItems.set([]);
    this.posAppliedCoupon.set(null);
    this.posCustomerName.set('');
    this.posCustomerPhone.set('');
  }

  applyPosCoupon(couponCode: string): boolean {
    const found = this.coupons().find((c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive);
    if (!found) {
      this.toast.error('Invalid Coupon', `Code "${couponCode}" is invalid or expired.`);
      return false;
    }
    if (this.cartSubtotal() < found.minSpend) {
      this.toast.warning('Minimum Spend Required', `Coupon requires min spend of ₹${found.minSpend}.`);
      return false;
    }
    this.posAppliedCoupon.set(found);
    this.toast.success('Coupon Applied', `Code "${found.code}" applied successfully!`);
    return true;
  }

  removePosCoupon() {
    this.posAppliedCoupon.set(null);
    this.toast.info('Coupon Removed', 'Coupon discount cleared.');
  }

  checkoutPosOrder(): Order | null {
    if (this.cartItems().length === 0) {
      this.toast.error('Cart Empty', 'Please add items before placing order.');
      return null;
    }

    const orderItems: OrderItem[] = this.cartItems().map((c) => ({
      id: 'oi-' + Math.random().toString(36).substring(2, 7),
      menuItemId: c.menuItem.id,
      name: c.menuItem.name,
      quantity: c.quantity,
      price: c.unitPrice,
      variant: c.selectedVariant,
      modifiers: c.selectedModifiers,
      instructions: c.specialInstructions,
    }));

    const order = this.createOrder({
      type: this.posOrderType(),
      tableNumber: this.posOrderType() === 'dine-in' ? this.posSelectedTable() : undefined,
      customerName: this.posCustomerName() || 'Guest Customer',
      customerPhone: this.posCustomerPhone() || '+91 98290 12345',
      items: orderItems,
      subtotal: this.cartSubtotal(),
      tax: this.cartTax(),
      discount: this.cartDiscount(),
      serviceCharge: this.cartServiceCharge(),
      total: this.cartTotal(),
      paymentMethod: this.posPaymentMethod(),
      paymentStatus: 'paid',
    });

    this.clearCart();
    return order;
  }

  // --- TABLE ACTIONS ---
  updateTableStatus(tableNumberOrId: string, status: TableStatus, orderId?: string, amount?: number) {
    this.tables.update((list) => {
      const updated = list.map((t) => {
        if (t.id === tableNumberOrId || t.tableNumber === tableNumberOrId) {
          return {
            ...t,
            status,
            currentOrderId: status === 'available' ? undefined : orderId || t.currentOrderId,
            currentAmount: status === 'available' ? undefined : amount !== undefined ? amount : t.currentAmount,
            occupiedSince: status === 'occupied' && !t.occupiedSince ? 'Just now' : status === 'available' ? undefined : t.occupiedSince,
            durationMinutes: status === 'available' ? undefined : t.durationMinutes || 5,
          };
        }
        return t;
      });
      this.saveToStorage('tables', updated);
      return updated;
    });
  }

  transferTable(sourceTableNumber: string, targetTableNumber: string) {
    const source = this.tables().find((t) => t.tableNumber === sourceTableNumber);
    if (!source) return;

    this.tables.update((list) => {
      const updated = list.map((t) => {
        if (t.tableNumber === sourceTableNumber) {
          return { ...t, status: 'available' as TableStatus, currentOrderId: undefined, currentAmount: undefined, occupiedSince: undefined, durationMinutes: undefined, guestCount: undefined };
        }
        if (t.tableNumber === targetTableNumber) {
          return {
            ...t,
            status: 'occupied' as TableStatus,
            currentOrderId: source.currentOrderId,
            currentAmount: source.currentAmount,
            occupiedSince: source.occupiedSince,
            durationMinutes: source.durationMinutes,
            guestCount: source.guestCount,
            server: source.server,
          };
        }
        return t;
      });
      this.saveToStorage('tables', updated);
      return updated;
    });

    this.toast.success('Table Transferred', `Order transferred from ${sourceTableNumber} to ${targetTableNumber}.`);
  }

  // --- MENU ACTIONS ---
  toggleItemAvailability(itemId: string) {
    this.menuItems.update((list) => {
      const updated = list.map((item) => {
        if (item.id === itemId) {
          const next = !item.isAvailable;
          this.toast.info('Item Availability Updated', `${item.name} is now ${next ? 'Available' : 'Sold Out'}`);
          return { ...item, isAvailable: next };
        }
        return item;
      });
      this.saveToStorage('menu', updated);
      return updated;
    });
  }

  addMenuItem(itemData: Omit<MenuItem, 'id'>) {
    const newItem: MenuItem = {
      ...itemData,
      id: 'item-' + Date.now(),
    };
    this.menuItems.update((list) => {
      const updated = [newItem, ...list];
      this.saveToStorage('menu', updated);
      return updated;
    });
    this.toast.success('Menu Item Added', `${newItem.name} has been added to the catalog.`);
  }

  updateMenuItem(updatedItem: MenuItem) {
    this.menuItems.update((list) => {
      const updated = list.map((i) => (i.id === updatedItem.id ? updatedItem : i));
      this.saveToStorage('menu', updated);
      return updated;
    });
    this.toast.success('Menu Item Saved', `${updatedItem.name} updated successfully.`);
  }

  deleteMenuItem(itemId: string) {
    this.menuItems.update((list) => {
      const updated = list.filter((i) => i.id !== itemId);
      this.saveToStorage('menu', updated);
      return updated;
    });
    this.toast.warning('Item Removed', 'Menu item has been deleted.');
  }

  // --- INVENTORY ACTIONS ---
  adjustInventoryStock(itemId: string, adjustmentAmount: number, reason: string) {
    this.inventory.update((list) => {
      const updated = list.map((item) => {
        if (item.id === itemId) {
          const newStock = Math.max(0, Math.round((item.currentStock + adjustmentAmount) * 10) / 10);
          let newStatus: 'healthy' | 'low' | 'critical' = 'healthy';
          if (newStock <= item.minStock * 0.5) newStatus = 'critical';
          else if (newStock <= item.minStock) newStatus = 'low';

          return {
            ...item,
            currentStock: newStock,
            status: newStatus,
            lastRestocked: adjustmentAmount > 0 ? new Date().toISOString().split('T')[0] : item.lastRestocked,
          };
        }
        return item;
      });
      this.saveToStorage('inventory', updated);
      return updated;
    });
    this.toast.success('Stock Adjusted', `Stock adjusted by ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount} (${reason}).`);
  }

  // --- HOTEL ACTIONS ---
  updateRoomStatus(roomId: string, status: RoomStatus, housekeeping?: HousekeepingStatus) {
    this.rooms.update((list) => {
      const updated = list.map((rm) => {
        if (rm.id === roomId || rm.roomNumber === roomId) {
          return {
            ...rm,
            status,
            housekeeping: housekeeping || rm.housekeeping,
          };
        }
        return rm;
      });
      this.saveToStorage('rooms', updated);
      return updated;
    });
    this.toast.success('Room Updated', `Room status updated successfully.`);
  }

  checkInGuest(reservationId: string) {
    this.reservations.update((list) => {
      const updated = list.map((res) => {
        if (res.id === reservationId) {
          this.updateRoomStatus(res.roomNumber, 'occupied', 'clean');
          return { ...res, status: 'checked-in' as const };
        }
        return res;
      });
      this.saveToStorage('reservations', updated);
      return updated;
    });
    this.toast.success('Guest Checked-In', 'Guest successfully checked-in and room marked occupied.');
  }

  checkOutGuest(reservationId: string) {
    this.reservations.update((list) => {
      const updated = list.map((res) => {
        if (res.id === reservationId) {
          this.updateRoomStatus(res.roomNumber, 'available', 'dirty');
          return { ...res, status: 'checked-out' as const };
        }
        return res;
      });
      this.saveToStorage('reservations', updated);
      return updated;
    });
    this.toast.info('Guest Checked-Out', 'Guest checked-out. Room queued for housekeeping inspection.');
  }

  // --- CRM & COUPON ACTIONS ---
  addCustomer(customerData: Omit<Customer, 'id'>) {
    const newCust: Customer = {
      ...customerData,
      id: 'cust-' + Date.now(),
    };
    this.customers.update((list) => {
      const updated = [newCust, ...list];
      this.saveToStorage('customers', updated);
      return updated;
    });
    this.toast.success('Customer Added', `${newCust.name} added to CRM.`);
  }

  addCoupon(couponData: Omit<LoyaltyCoupon, 'id' | 'usageCount' | 'isActive'>) {
    const newCoupon: LoyaltyCoupon = {
      ...couponData,
      id: 'c-' + Date.now(),
      usageCount: 0,
      isActive: true,
    };
    this.coupons.update((list) => {
      const updated = [newCoupon, ...list];
      this.saveToStorage('coupons', updated);
      return updated;
    });
    this.toast.success('Coupon Created', `Coupon code ${newCoupon.code} is now active.`);
  }

  // --- RESET ALL DEMO DATA ---
  resetAllDemoData() {
    localStorage.clear();
    this.orders.set(INITIAL_ORDERS);
    this.menuItems.set(INITIAL_MENU_ITEMS);
    this.tables.set(INITIAL_TABLES);
    this.inventory.set(INITIAL_INVENTORY);
    this.customers.set(INITIAL_CUSTOMERS);
    this.coupons.set(INITIAL_COUPONS);
    this.rooms.set(INITIAL_ROOMS);
    this.reservations.set(INITIAL_HOTEL_RESERVATIONS);
    this.tenants.set(INITIAL_TENANTS);
    this.selectedOutletId.set('all');
    this.clearCart();
    this.toast.success('Demo Data Reset', 'All database tables restored to pristine demonstration state.');
  }
}
