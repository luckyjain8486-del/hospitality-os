import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { StaffUser, UserRole, StaffPermissions } from '../models/hospitality.model';
import { ToastService } from './toast.service';

export const STAFF_USERS: StaffUser[] = [
  {
    id: 'staff-mgr',
    name: 'Lucky Jain',
    role: 'manager',
    title: 'General Manager & Franchise Partner',
    pin: '1234',
    avatarText: 'LJ',
    outletId: 'jaipur-central',
    outletName: 'Jaipur Central - MI Road',
    description: 'Unrestricted master access to all dining, hotel, inventory, financial, and configuration systems.',
    allowedRoutes: [
      '/dashboard',
      '/orders',
      '/pos',
      '/kds',
      '/tables',
      '/menu',
      '/inventory',
      '/customers',
      '/loyalty',
      '/hotel',
      '/reports',
      '/billing',
      '/settings',
      '/super-admin',
    ],
    permissions: {
      canTakeOrders: true,
      canSettleBills: true,
      canApplyDiscounts: true,
      canCancelOrders: true,
      canViewKitchen: true,
      canToggle86Menu: true,
      canEditMenuPrices: true,
      canAdjustInventory: true,
      canViewReports: true,
      canManageSettings: true,
      canAccessHotelPms: true,
    },
  },
  {
    id: 'staff-waiter',
    name: 'Mukesh Singh',
    role: 'waiter',
    title: 'Floor Captain & Waitstaff Lead',
    pin: '1111',
    avatarText: 'MS',
    outletId: 'jaipur-central',
    outletName: 'Jaipur Central - MI Road',
    description: 'Dedicated to floor table turnover, guest seating, quick KOT order punching, and table transfers.',
    allowedRoutes: ['/tables', '/pos', '/orders', '/menu'],
    permissions: {
      canTakeOrders: true,
      canSettleBills: false,
      canApplyDiscounts: false,
      canCancelOrders: false,
      canViewKitchen: false,
      canToggle86Menu: false,
      canEditMenuPrices: false,
      canAdjustInventory: false,
      canViewReports: false,
      canManageSettings: false,
      canAccessHotelPms: false,
    },
  },
  {
    id: 'staff-chef',
    name: 'Chef Sanjeev Rawat',
    role: 'chef',
    title: 'Executive Head Chef (KDS Line)',
    pin: '2222',
    avatarText: 'SR',
    outletId: 'jaipur-central',
    outletName: 'Jaipur Central - MI Road',
    description: 'Hot kitchen prep station line, digital ticket bumping, prep timer alerts, and menu item 86/sold-out toggles.',
    allowedRoutes: ['/kds', '/orders', '/menu', '/inventory'],
    permissions: {
      canTakeOrders: false,
      canSettleBills: false,
      canApplyDiscounts: false,
      canCancelOrders: false,
      canViewKitchen: true,
      canToggle86Menu: true,
      canEditMenuPrices: false,
      canAdjustInventory: true,
      canViewReports: false,
      canManageSettings: false,
      canAccessHotelPms: false,
    },
  },
  {
    id: 'staff-cashier',
    name: 'Ramesh Kumawat',
    role: 'cashier',
    title: 'Counter Billing & Cashier Lead',
    pin: '3333',
    avatarText: 'RK',
    outletId: 'jaipur-central',
    outletName: 'Jaipur Central - MI Road',
    description: 'Billing desk, payment settlements (UPI, Card, Cash), discount coupons, thermal receipt printing, and day-end shift register.',
    allowedRoutes: ['/pos', '/orders', '/tables', '/reports'],
    permissions: {
      canTakeOrders: true,
      canSettleBills: true,
      canApplyDiscounts: true,
      canCancelOrders: false,
      canViewKitchen: false,
      canToggle86Menu: false,
      canEditMenuPrices: false,
      canAdjustInventory: false,
      canViewReports: true,
      canManageSettings: false,
      canAccessHotelPms: false,
    },
  },
];

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly STORAGE_KEY = 'hospitalityos_active_user_v1';

  readonly allStaff = signal<StaffUser[]>(STAFF_USERS);
  readonly currentUser = signal<StaffUser>(this.loadInitialUser());

  readonly currentRole = computed(() => this.currentUser().role);
  readonly isManager = computed(() => this.currentUser().role === 'manager');
  readonly isCashier = computed(() => this.currentUser().role === 'cashier');
  readonly isChef = computed(() => this.currentUser().role === 'chef');
  readonly isWaiter = computed(() => this.currentUser().role === 'waiter');

  // Manager PIN modal state
  readonly showPinModal = signal(false);
  readonly pendingActionName = signal<string>('');
  private onPinSuccessCallback?: () => void;

  constructor(
    private toast: ToastService,
    private router: Router
  ) {}

  private loadInitialUser(): StaffUser {
    try {
      const savedId = localStorage.getItem(this.STORAGE_KEY);
      if (savedId) {
        const found = STAFF_USERS.find((u) => u.id === savedId || u.role === savedId);
        if (found) return found;
      }
    } catch (e) {}
    return STAFF_USERS[0]; // Manager default
  }

  switchUser(user: StaffUser) {
    this.currentUser.set(user);
    try {
      localStorage.setItem(this.STORAGE_KEY, user.id);
    } catch (e) {}

    this.toast.success(
      'Role Switched: ' + user.title,
      `Active view: ${user.name} (${user.role.toUpperCase()} MODE)`
    );

    // Auto-navigate to allowed initial view if current page is restricted
    try {
      const currentUrl = this.router.url.split('?')[0].split('#')[0];
      if (currentUrl && !this.canAccessRoute(currentUrl)) {
        const target = user.allowedRoutes[0] || '/pos';
        this.router.navigate([target]);
      }
    } catch (e) {}
  }

  switchRole(role: UserRole) {
    const user = this.allStaff().find((u) => u.role === role) || this.allStaff()[0];
    this.switchUser(user);
  }

  canAccessRoute(route: string): boolean {
    if (this.isManager()) return true;

    // Clean query parameters or trailing slashes
    const clean = route.split('?')[0].split('#')[0];
    return this.currentUser().allowedRoutes.some((r) => clean.startsWith(r));
  }

  hasPermission(key: keyof StaffPermissions): boolean {
    if (this.isManager()) return true;
    return !!this.currentUser().permissions[key];
  }

  // PetPooja-style Manager PIN verification
  requestManagerPin(actionName: string, onSuccess: () => void) {
    if (this.isManager()) {
      // General manager already has full override
      onSuccess();
      return;
    }

    this.pendingActionName.set(actionName);
    this.onPinSuccessCallback = onSuccess;
    this.showPinModal.set(true);
  }

  submitManagerPin(pin: string): boolean {
    const manager = this.allStaff().find((u) => u.role === 'manager');
    const valid = pin === (manager?.pin || '1234');

    if (valid) {
      this.toast.success('Manager Override Approved', `Action "${this.pendingActionName()}" authorized.`);
      this.showPinModal.set(false);
      if (this.onPinSuccessCallback) {
        this.onPinSuccessCallback();
        this.onPinSuccessCallback = undefined;
      }
      return true;
    } else {
      this.toast.error('Invalid PIN', 'Manager authorization PIN failed. Try 1234.');
      return false;
    }
  }

  closePinModal() {
    this.showPinModal.set(false);
    this.onPinSuccessCallback = undefined;
  }
}
