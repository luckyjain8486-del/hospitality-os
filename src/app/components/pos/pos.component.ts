import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalityService, PosCartItem } from '../../services/hospitality.service';
import { RoleService } from '../../services/role.service';
import { MenuCategory, MenuItem, Order, OrderType, PaymentMethod } from '../../models/hospitality.model';
import { IconComponent } from '../shared/icon.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="h-[calc(100vh-5.5rem)] flex flex-col -m-6 overflow-hidden">
      <!-- POS Top Subheader with PetPooja Role Badge -->
      <div class="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-3">
          <span class="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            @if (roleService.isWaiter()) {
              <span class="text-amber-800">🍽️ Captain KOT Terminal · {{ roleService.currentUser().name }}</span>
            } @else if (roleService.isCashier()) {
              <span class="text-emerald-800">💳 Cashier Counter #01 · {{ roleService.currentUser().name }}</span>
            } @else if (roleService.isChef()) {
              <span class="text-blue-800">👨‍🍳 Kitchen POS View · {{ roleService.currentUser().name }}</span>
            } @else {
              <span>POS Register Master · {{ roleService.currentUser().name }}</span>
            }
          </span>
          <span class="text-xs text-slate-400">|</span>
          <span class="text-xs font-semibold text-slate-600">
            Outlet: {{ hospitality.currentOutlet()?.name || 'Jaipur Central' }}
          </span>
        </div>

        <div class="flex items-center gap-3">
          <!-- Order Type selector pills -->
          <div class="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              (click)="hospitality.posOrderType.set('dine-in')"
              class="px-3 py-1 rounded-lg transition-all"
              [ngClass]="{ 'bg-white text-slate-900 shadow-xs': hospitality.posOrderType() === 'dine-in' }"
            >
              🍽️ Dine-in
            </button>
            <button
              (click)="hospitality.posOrderType.set('takeaway')"
              class="px-3 py-1 rounded-lg transition-all"
              [ngClass]="{ 'bg-white text-slate-900 shadow-xs': hospitality.posOrderType() === 'takeaway' }"
            >
              🛍️ Takeaway
            </button>
            <button
              (click)="hospitality.posOrderType.set('delivery')"
              class="px-3 py-1 rounded-lg transition-all"
              [ngClass]="{ 'bg-white text-slate-900 shadow-xs': hospitality.posOrderType() === 'delivery' }"
            >
              🛵 Delivery
            </button>
          </div>

          @if (hospitality.posOrderType() === 'dine-in') {
            <!-- Table picker -->
            <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <span class="text-slate-400 font-medium">Table:</span>
              <select
                [ngModel]="hospitality.posSelectedTable()"
                (ngModelChange)="hospitality.posSelectedTable.set($event)"
                class="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                @for (t of hospitality.tables(); track t.id) {
                  <option [value]="t.tableNumber">
                    {{ t.tableNumber }} ({{ t.capacity }} seats) - {{ t.status | uppercase }}
                  </option>
                }
              </select>
            </div>
          }
        </div>
      </div>

      <!-- Main 3-Column POS Workspace -->
      <div class="flex-1 flex overflow-hidden">
        <!-- 1. LEFT: Categories Bar -->
        <div class="w-48 bg-white border-r border-slate-200/90 flex flex-col flex-shrink-0 p-3 space-y-1.5 overflow-y-auto">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">Categories</span>
          @for (cat of categories; track cat.id) {
            <button
              (click)="selectedCategory.set(cat.id)"
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left"
              [ngClass]="selectedCategory() === cat.id ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'"
            >
              <div class="flex items-center gap-2">
                <span>{{ cat.icon }}</span>
                <span>{{ cat.name }}</span>
              </div>
              <span
                class="text-[10px] px-1.5 py-0.2 rounded-full"
                [ngClass]="selectedCategory() === cat.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'"
              >
                {{ getItemCountForCategory(cat.id) }}
              </span>
            </button>
          }
        </div>

        <!-- 2. CENTER: Menu Items Grid -->
        <div class="flex-1 bg-slate-50/70 p-5 overflow-y-auto">
          <!-- Food search & veg filter bar -->
          <div class="flex items-center justify-between gap-3 mb-4">
            <div class="relative flex-1 max-w-sm">
              <app-icon name="search" [size]="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
              <input
                type="text"
                placeholder="Search food by name..."
                [(ngModel)]="menuSearch"
                class="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 shadow-2xs"
              />
            </div>

            <!-- Veg Only toggle -->
            <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <input type="checkbox" [(ngModel)]="vegOnly" class="rounded text-emerald-600 focus:ring-0" />
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Pure Veg Only
              </span>
            </label>
          </div>

          <!-- Cards Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            @for (item of filteredMenuItems(); track item.id) {
              <div
                (click)="openItemConfig(item)"
                class="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
              >
                <div class="relative h-32 w-full overflow-hidden bg-slate-100">
                  <img
                    [src]="item.image"
                    [alt]="item.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <!-- Veg / Non-veg marker -->
                  <div class="absolute top-2.5 left-2.5 w-5 h-5 rounded bg-white/90 backdrop-blur-xs flex items-center justify-center border border-slate-200 shadow-xs">
                    <span class="w-2.5 h-2.5 rounded-full" [ngClass]="item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'"></span>
                  </div>

                  @if (item.isBestseller) {
                    <div class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-amber-500 text-white font-bold text-[9px] uppercase tracking-wide shadow-xs">
                      ★ Bestseller
                    </div>
                  }
                </div>

                <div class="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 class="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {{ item.name }}
                    </h3>
                    <p class="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                      {{ item.description }}
                    </p>
                  </div>

                  <div class="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                    <div class="font-extrabold text-sm text-slate-900">
                      ₹{{ item.price }}
                    </div>
                    <button
                      type="button"
                      class="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <app-icon name="plus" [size]="12"></app-icon>
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- 3. RIGHT: Active Order / Cart Panel -->
        <div class="w-96 bg-white border-l border-slate-200/90 flex flex-col flex-shrink-0 shadow-lg justify-between">
          <!-- Cart Header -->
          <div class="p-4 border-b border-slate-100">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-slate-900">Current Ticket</span>
                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {{ hospitality.cartItems().length }} items
                </span>
              </div>
              @if (hospitality.cartItems().length > 0) {
                <button
                  (click)="hospitality.clearCart()"
                  class="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Clear All
                </button>
              }
            </div>

            <!-- Customer phone/name quick inputs -->
            <div class="grid grid-cols-2 gap-2 mt-2">
              <input
                type="text"
                placeholder="Guest Name"
                [ngModel]="hospitality.posCustomerName()"
                (ngModelChange)="hospitality.posCustomerName.set($event)"
                class="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
              <input
                type="text"
                placeholder="+91 Mobile #"
                [ngModel]="hospitality.posCustomerPhone()"
                (ngModelChange)="hospitality.posCustomerPhone.set($event)"
                class="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <!-- Cart Items List (Scrollable) -->
          <div class="flex-1 p-4 overflow-y-auto space-y-2.5 divide-y divide-slate-100">
            @for (cartItem of hospitality.cartItems(); track cartItem.id) {
              <div class="pt-2.5 first:pt-0 flex items-start justify-between gap-3 text-xs">
                <div class="flex-1 space-y-0.5">
                  <div class="font-bold text-slate-900 line-clamp-1">
                    {{ cartItem.menuItem.name }}
                  </div>
                  @if (cartItem.selectedVariant) {
                    <span class="text-[10px] text-slate-500 block">Var: {{ cartItem.selectedVariant }}</span>
                  }
                  @if (cartItem.selectedModifiers.length > 0) {
                    <span class="text-[10px] text-emerald-600 block">+ {{ cartItem.selectedModifiers.join(', ') }}</span>
                  }
                  <div class="text-[11px] font-bold text-slate-700">
                    ₹{{ cartItem.unitPrice }} × {{ cartItem.quantity }} = ₹{{ cartItem.unitPrice * cartItem.quantity }}
                  </div>
                </div>

                <!-- Quantity controls -->
                <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    (click)="hospitality.updateCartQuantity(cartItem.id, -1)"
                    class="w-6 h-6 rounded-lg bg-white shadow-2xs flex items-center justify-center text-slate-700 hover:bg-slate-50"
                  >
                    <app-icon name="minus" [size]="12"></app-icon>
                  </button>
                  <span class="w-5 text-center font-bold text-xs text-slate-900">{{ cartItem.quantity }}</span>
                  <button
                    (click)="hospitality.updateCartQuantity(cartItem.id, 1)"
                    class="w-6 h-6 rounded-lg bg-white shadow-2xs flex items-center justify-center text-slate-700 hover:bg-slate-50"
                  >
                    <app-icon name="plus" [size]="12"></app-icon>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="text-center py-16 text-slate-400">
                <app-icon name="pos" [size]="36" class="mx-auto mb-2 opacity-40"></app-icon>
                <p class="font-semibold text-slate-600 text-xs">Register ticket is empty</p>
                <p class="text-[11px] text-slate-400 mt-0.5">Click any food card to add to order</p>
              </div>
            }
          </div>

          <!-- Cart Bill Breakdown & Checkout -->
          <div class="p-4 border-t border-slate-200/80 bg-slate-50/60 space-y-3">
            <!-- Coupon Code input -->
            <div class="flex items-center gap-2">
              <input
                type="text"
                placeholder="Promo coupon code (e.g. FESTIVE15)"
                [(ngModel)]="couponInput"
                class="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl uppercase font-mono font-semibold"
              />
              <button
                (click)="applyCoupon()"
                class="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
              >
                Apply
              </button>
            </div>

            @if (hospitality.posAppliedCoupon()) {
              <div class="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                <span>Code {{ hospitality.posAppliedCoupon()!.code }} applied</span>
                <button (click)="hospitality.removePosCoupon()" class="text-xs font-bold text-emerald-800 hover:underline">
                  Remove
                </button>
              </div>
            }

            <!-- Calculations list -->
            <div class="space-y-1.5 text-xs text-slate-600">
              <div class="flex justify-between">
                <span>Subtotal:</span>
                <span class="font-semibold text-slate-900">₹{{ hospitality.cartSubtotal() | number:'1.0-2' }}</span>
              </div>
              @if (hospitality.cartDiscount() > 0) {
                <div class="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount:</span>
                  <span>-₹{{ hospitality.cartDiscount() | number:'1.0-2' }}</span>
                </div>
              }
              <div class="flex justify-between">
                <span>GST (5%):</span>
                <span>₹{{ hospitality.cartTax() | number:'1.0-2' }}</span>
              </div>
              @if (hospitality.posOrderType() === 'dine-in') {
                <div class="flex justify-between items-center text-slate-500">
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      [ngModel]="hospitality.posApplyServiceCharge()"
                      (ngModelChange)="hospitality.posApplyServiceCharge.set($event)"
                      class="rounded text-slate-900 focus:ring-0"
                    />
                    <span>Service Charge (5%):</span>
                  </label>
                  <span>₹{{ hospitality.cartServiceCharge() | number:'1.0-2' }}</span>
                </div>
              }
              <div class="flex justify-between font-extrabold text-slate-900 text-sm pt-2 border-t border-slate-200">
                <span>PAYABLE TOTAL:</span>
                <span class="text-base text-emerald-600">₹{{ hospitality.cartTotal() | number:'1.0-2' }}</span>
              </div>
            </div>

            <!-- Payment mode selection -->
            <div class="grid grid-cols-3 gap-1.5 pt-1">
              <button
                (click)="hospitality.posPaymentMethod.set('upi')"
                class="py-2 rounded-xl text-center text-xs font-bold border transition-all"
                [ngClass]="hospitality.posPaymentMethod() === 'upi' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
              >
                UPI QR
              </button>
              <button
                (click)="hospitality.posPaymentMethod.set('card')"
                class="py-2 rounded-xl text-center text-xs font-bold border transition-all"
                [ngClass]="hospitality.posPaymentMethod() === 'card' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
              >
                Card
              </button>
              <button
                (click)="hospitality.posPaymentMethod.set('cash')"
                class="py-2 rounded-xl text-center text-xs font-bold border transition-all"
                [ngClass]="hospitality.posPaymentMethod() === 'cash' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
              >
                Cash
              </button>
            </div>

            <!-- Settle & Print Button -->
            <button
              (click)="processOrderAndBill()"
              [disabled]="hospitality.cartItems().length === 0"
              class="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <app-icon name="check" [size]="16" class="text-emerald-400"></app-icon>
              <span>
                {{ roleService.isWaiter() ? 'Punch Table KOT (Send to Chef)' : 'Collect ₹' + (hospitality.cartTotal() | number:'1.0-2') + ' & Settle Bill' }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: CONFIGURE ITEM (Variants / Modifiers / Instructions) -->
      @if (configuringItem()) {
        <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs text-slate-700">
            <div class="flex items-start justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-3">
                <img [src]="configuringItem()!.image" class="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h3 class="text-sm font-bold text-slate-900">{{ configuringItem()!.name }}</h3>
                  <span class="text-xs text-slate-500">Base Price: ₹{{ configuringItem()!.price }}</span>
                </div>
              </div>
              <button (click)="configuringItem.set(null)" class="text-slate-400 hover:text-slate-600">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <div class="space-y-4 my-4 max-h-80 overflow-y-auto">
              <!-- Variants -->
              @if (configuringItem()!.variants && configuringItem()!.variants!.length > 0) {
                <div>
                  <span class="font-bold text-slate-900 block mb-2">Select Portion / Variant:</span>
                  <div class="grid grid-cols-2 gap-2">
                    @for (v of configuringItem()!.variants; track v.name) {
                      <button
                        (click)="selectedVariant = v.name"
                        class="p-2.5 rounded-xl border text-left flex items-center justify-between transition-all"
                        [ngClass]="selectedVariant === v.name ? 'border-slate-900 bg-slate-50 font-bold' : 'border-slate-200'"
                      >
                        <span>{{ v.name }}</span>
                        <span class="text-slate-900 font-extrabold">₹{{ v.price }}</span>
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Modifiers -->
              @if (configuringItem()!.modifiers && configuringItem()!.modifiers!.length > 0) {
                @for (group of configuringItem()!.modifiers; track group.name) {
                  <div>
                    <span class="font-bold text-slate-900 block mb-2">{{ group.name }}:</span>
                    <div class="space-y-1.5">
                      @for (opt of group.options; track opt.name) {
                        <label class="flex items-center justify-between p-2 rounded-xl border border-slate-200/80 bg-slate-50/50 cursor-pointer">
                          <span class="flex items-center gap-2">
                            <input
                              type="checkbox"
                              [checked]="isModifierSelected(opt.name)"
                              (change)="toggleModifier(opt.name)"
                              class="rounded text-slate-900 focus:ring-0"
                            />
                            <span>{{ opt.name }}</span>
                          </span>
                          @if (opt.price > 0) {
                            <span class="font-bold text-slate-900">+₹{{ opt.price }}</span>
                          } @else {
                            <span class="text-slate-400">Free</span>
                          }
                        </label>
                      }
                    </div>
                  </div>
                }
              }

              <!-- Cooking notes -->
              <div>
                <span class="font-bold text-slate-900 block mb-1">Kitchen Instructions:</span>
                <input
                  type="text"
                  placeholder="e.g. Less spicy, crispy naan, extra lemons"
                  [(ngModel)]="customInstructions"
                  class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-slate-100">
              <span class="font-bold text-slate-900 text-sm">Calculated Item Total: ₹{{ calculateConfiguredPrice() }}</span>
              <button
                (click)="addConfiguredItemToCart()"
                class="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class PosComponent {
  selectedCategory = signal<MenuCategory>('all');
  menuSearch = '';
  vegOnly = false;
  couponInput = '';

  configuringItem = signal<MenuItem | null>(null);
  selectedVariant = '';
  selectedModifiers: string[] = [];
  customInstructions = '';

  readonly categories: { id: MenuCategory; name: string; icon: string }[] = [
    { id: 'all', name: 'All Menu', icon: '📋' },
    { id: 'starters', name: 'Starters', icon: '🍢' },
    { id: 'main-course', name: 'Main Course', icon: '🍛' },
    { id: 'pizza', name: 'Pizza', icon: '🍕' },
    { id: 'burgers', name: 'Burgers', icon: '🍔' },
    { id: 'beverages', name: 'Beverages', icon: '☕' },
    { id: 'desserts', name: 'Desserts', icon: '🍨' },
  ];

  readonly filteredMenuItems = computed(() => {
    const cat = this.selectedCategory();
    const q = this.menuSearch.toLowerCase().trim();
    const veg = this.vegOnly;

    return this.hospitality.menuItems().filter((item) => {
      if (cat !== 'all' && item.category !== cat) return false;
      if (veg && !item.isVeg) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    });
  });

  constructor(
    public hospitality: HospitalityService,
    public roleService: RoleService,
    private toast: ToastService
  ) {}

  getItemCountForCategory(catId: MenuCategory): number {
    if (catId === 'all') return this.hospitality.menuItems().length;
    return this.hospitality.menuItems().filter((i) => i.category === catId).length;
  }

  openItemConfig(item: MenuItem) {
    if ((item.variants && item.variants.length > 0) || (item.modifiers && item.modifiers.length > 0)) {
      this.configuringItem.set(item);
      this.selectedVariant = item.variants ? item.variants[0].name : '';
      this.selectedModifiers = [];
      this.customInstructions = '';
    } else {
      this.hospitality.addToCart(item);
    }
  }

  isModifierSelected(name: string): boolean {
    return this.selectedModifiers.includes(name);
  }

  toggleModifier(name: string) {
    if (this.selectedModifiers.includes(name)) {
      this.selectedModifiers = this.selectedModifiers.filter((m) => m !== name);
    } else {
      this.selectedModifiers.push(name);
    }
  }

  calculateConfiguredPrice(): number {
    const item = this.configuringItem();
    if (!item) return 0;
    let price = item.price;
    if (this.selectedVariant && item.variants) {
      const v = item.variants.find((x) => x.name === this.selectedVariant);
      if (v) price = v.price;
    }
    if (this.selectedModifiers.length > 0 && item.modifiers) {
      item.modifiers.forEach((g) => {
        g.options.forEach((o) => {
          if (this.selectedModifiers.includes(o.name)) {
            price += o.price;
          }
        });
      });
    }
    return price;
  }

  addConfiguredItemToCart() {
    const item = this.configuringItem();
    if (item) {
      this.hospitality.addToCart(item, this.selectedVariant, this.selectedModifiers, this.customInstructions);
      this.configuringItem.set(null);
    }
  }

  applyCoupon() {
    if (!this.couponInput) return;
    if (this.roleService.isWaiter()) {
      // PetPooja role constraint: Waiter cannot give arbitrary discount without Manager authorization
      const code = this.couponInput;
      this.roleService.requestManagerPin(`Apply Discount Promo [${code}]`, () => {
        this.hospitality.applyPosCoupon(code);
        this.couponInput = '';
      });
    } else {
      this.hospitality.applyPosCoupon(this.couponInput);
      this.couponInput = '';
    }
  }

  processOrderAndBill() {
    const order = this.hospitality.checkoutPosOrder();
    if (order) {
      if (this.roleService.isWaiter()) {
        this.toast.success('KOT Dispatched to Kitchen', `Table ticket ${order.orderNumber} placed by Captain ${this.roleService.currentUser().name}. Sent to Kitchen line.`);
      } else {
        this.toast.success('Bill Settled & KOT Generated', `Ticket ${order.orderNumber} collected via ${order.paymentMethod.toUpperCase()} by Cashier ${this.roleService.currentUser().name}.`);
      }
    }
  }
}
