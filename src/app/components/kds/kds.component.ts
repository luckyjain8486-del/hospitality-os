import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HospitalityService } from '../../services/hospitality.service';
import { EntitlementsService } from '../../services/entitlements.service';
import { RoleService } from '../../services/role.service';
import { Order, OrderStatus } from '../../models/hospitality.model';
import { IconComponent } from '../shared/icon.component';
import { LockedFeatureComponent } from '../shared/locked-feature.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-kds',
  standalone: true,
  imports: [CommonModule, IconComponent, LockedFeatureComponent],
  template: `
    @if (!entitlements.isFeatureEnabled('feat-kds')) {
      <app-locked-feature
        featureTitle="Kitchen Display System (KDS)"
        planRequirement="Growth"
        description="Streamline kitchen communications with real-time digital Kanban bump screens, prep timers and multi-station routing."
      ></app-locked-feature>
    } @else {
      <div class="space-y-6">
        <!-- KDS Top Controls -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Kitchen Display System (KDS)</h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Kitchen Live
              </span>
            </div>
            <p class="text-sm text-slate-500 mt-0.5">
              High-contrast digital order bump screen for Chef & Cook line.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <!-- 86 Item Quick Drawer button (PetPooja Chef Feature) -->
            <button
              (click)="show86Modal.set(true)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100/80 text-rose-800 font-bold text-xs transition-colors cursor-pointer"
              title="86 List: Instantly mark items as sold-out or back in stock"
            >
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>86 List ({{ soldOutItemsCount() }} Sold Out)</span>
            </button>

            <!-- Role station indicator -->
            <span class="text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5"
              [ngClass]="roleService.isChef() ? 'bg-blue-50 text-blue-900 border-blue-200' : 'bg-white text-slate-700 border-slate-200'">
              <span>{{ roleService.isChef() ? '👨‍🍳 Line Chef Control' : '👁️ Captain Pass Monitor' }}</span>
              <span class="text-[10px] text-slate-400">({{ roleService.currentUser().name }})</span>
            </span>
            <button
              (click)="bellChime()"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <app-icon name="bell" [size]="14"></app-icon>
              <span>Test Chime</span>
            </button>
          </div>
        </div>

        <!-- Station Filter Bar -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Kitchen Station:</span>
          @for (st of stations; track st) {
            <button
              (click)="selectedStation.set(st)"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
              [ngClass]="selectedStation() === st ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
            >
              {{ st }}
            </button>
          }
        </div>

        <!-- Kanban 3 Columns Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- 1. NEW ORDERS COLUMN -->
          <div class="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 flex flex-col h-[calc(100vh-14rem)]">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                <h3 class="font-bold text-sm text-slate-900">New Orders</h3>
              </div>
              <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-blue-700 shadow-2xs">
                {{ newOrders().length }}
              </span>
            </div>

            <div class="flex-1 overflow-y-auto space-y-3 pr-1">
              @for (order of newOrders(); track order.id) {
                <div class="bg-white rounded-xl border-2 border-blue-200 shadow-sm p-4 space-y-3 animate-in fade-in">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-extrabold text-sm text-slate-900">{{ order.orderNumber }}</span>
                      <span class="text-[11px] font-bold text-blue-600 block">
                        {{ order.tableNumber ? 'Table ' + order.tableNumber : order.type | uppercase }}
                      </span>
                    </div>
                    <div class="text-right">
                      <span class="text-[10px] text-slate-400 block">{{ order.createdAt }}</span>
                      <span class="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {{ order.elapsedMinutes || 2 }}m elapsed
                      </span>
                    </div>
                  </div>

                  <!-- Items list -->
                  <div class="space-y-1.5 py-2 border-y border-slate-100 text-xs">
                    @for (item of order.items; track item.id) {
                      <div class="flex items-start justify-between font-semibold text-slate-800">
                        <span>{{ item.quantity }}x {{ item.name }}</span>
                        @if (item.variant) {
                          <span class="text-[10px] text-slate-400">({{ item.variant }})</span>
                        }
                      </div>
                      @if (item.instructions) {
                        <div class="text-[10px] text-amber-700 bg-amber-50 p-1 rounded font-medium">
                          Note: {{ item.instructions }}
                        </div>
                      }
                    }
                  </div>

                  @if (order.notes) {
                    <div class="text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded-lg font-medium">
                      ⚠️ {{ order.notes }}
                    </div>
                  }

                  <button
                    (click)="moveOrder(order.id, 'preparing')"
                    class="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Accept & Start Prep</span>
                    <app-icon name="chevron-right" [size]="14"></app-icon>
                  </button>
                </div>
              } @empty {
                <div class="text-center py-16 text-slate-400 text-xs">
                  No new tickets waiting
                </div>
              }
            </div>
          </div>

          <!-- 2. PREPARING COLUMN -->
          <div class="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 flex flex-col h-[calc(100vh-14rem)]">
            <div class="flex items-center justify-between pb-3 border-b border-amber-200/80 mb-3">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                <h3 class="font-bold text-sm text-slate-900">Preparing</h3>
              </div>
              <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-amber-700 shadow-2xs">
                {{ preparingOrders().length }}
              </span>
            </div>

            <div class="flex-1 overflow-y-auto space-y-3 pr-1">
              @for (order of preparingOrders(); track order.id) {
                <div class="bg-white rounded-xl border-2 border-amber-300 shadow-sm p-4 space-y-3 animate-in fade-in">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-extrabold text-sm text-slate-900">{{ order.orderNumber }}</span>
                      <span class="text-[11px] font-bold text-amber-600 block">
                        {{ order.tableNumber ? 'Table ' + order.tableNumber : order.type | uppercase }}
                      </span>
                    </div>
                    <!-- Urgent timer badge -->
                    <div class="text-right">
                      <span
                        class="text-[11px] font-extrabold px-2 py-0.5 rounded-md inline-block shadow-2xs"
                        [ngClass]="(order.elapsedMinutes || 14) > 18 ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse' : 'bg-amber-100 text-amber-800'"
                      >
                        ⏱️ {{ order.elapsedMinutes || 14 }}m / {{ order.prepTimeMinutes }}m
                      </span>
                    </div>
                  </div>

                  <!-- Items list -->
                  <div class="space-y-1.5 py-2 border-y border-slate-100 text-xs">
                    @for (item of order.items; track item.id) {
                      <div class="flex items-start justify-between font-semibold text-slate-800">
                        <span>{{ item.quantity }}x {{ item.name }}</span>
                        @if (item.variant) {
                          <span class="text-[10px] text-slate-400">({{ item.variant }})</span>
                        }
                      </div>
                    }
                  </div>

                  @if (order.notes) {
                    <div class="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                      "{{ order.notes }}"
                    </div>
                  }

                  <button
                    (click)="moveOrder(order.id, 'ready')"
                    class="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Mark Cooked & Ready</span>
                    <app-icon name="check" [size]="14"></app-icon>
                  </button>
                </div>
              } @empty {
                <div class="text-center py-16 text-slate-400 text-xs">
                  No orders currently cooking
                </div>
              }
            </div>
          </div>

          <!-- 3. READY TO SERVE COLUMN -->
          <div class="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 flex flex-col h-[calc(100vh-14rem)]">
            <div class="flex items-center justify-between pb-3 border-b border-emerald-200/80 mb-3">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 class="font-bold text-sm text-slate-900">Ready to Serve / Dispatch</h3>
              </div>
              <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-emerald-700 shadow-2xs">
                {{ readyOrders().length }}
              </span>
            </div>

            <div class="flex-1 overflow-y-auto space-y-3 pr-1">
              @for (order of readyOrders(); track order.id) {
                <div class="bg-white rounded-xl border-2 border-emerald-300 shadow-sm p-4 space-y-3 animate-in fade-in">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-extrabold text-sm text-slate-900">{{ order.orderNumber }}</span>
                      <span class="text-[11px] font-bold text-emerald-600 block">
                        {{ order.tableNumber ? 'Table ' + order.tableNumber : order.type | uppercase }}
                      </span>
                    </div>
                    <span class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Ready at Pass
                    </span>
                  </div>

                  <!-- Items list -->
                  <div class="space-y-1.5 py-2 border-y border-slate-100 text-xs">
                    @for (item of order.items; track item.id) {
                      <div class="flex items-start justify-between font-semibold text-slate-800">
                        <span>{{ item.quantity }}x {{ item.name }}</span>
                      </div>
                    }
                  </div>

                  <div class="text-[11px] text-slate-500">
                    Server: <span class="font-semibold text-slate-800">{{ order.serverName || 'Waitstaff' }}</span>
                  </div>

                  <button
                    (click)="moveOrder(order.id, 'served')"
                    class="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Bump Ticket (Served / Out)</span>
                    <app-icon name="check" [size]="14"></app-icon>
                  </button>
                </div>
              } @empty {
                <div class="text-center py-16 text-slate-400 text-xs">
                  No plates waiting at the pass
                </div>
              }
            </div>
          </div>
        </div>

        <!-- 86 LIST MODAL (PetPooja Chef Out-of-Stock Toggle) -->
        @if (show86Modal()) {
          <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs text-slate-700 animate-in zoom-in-95">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    86
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-slate-900">Kitchen 86 List (Sold Out Management)</h3>
                    <p class="text-[11px] text-slate-500">Toggle dishes out-of-stock when raw materials deplete in pantry.</p>
                  </div>
                </div>
                <button (click)="show86Modal.set(false)" class="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <app-icon name="x" [size]="18"></app-icon>
                </button>
              </div>

              <div class="my-4 max-h-96 overflow-y-auto space-y-2 pr-1">
                @for (item of hospitality.menuItems(); track item.id) {
                  <div class="flex items-center justify-between p-3 rounded-2xl border transition-all"
                    [ngClass]="item.isAvailable ? 'bg-white border-slate-200' : 'bg-rose-50/50 border-rose-200'">
                    <div class="flex items-center gap-3">
                      <img [src]="item.image" class="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                      <div>
                        <div class="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span class="w-2 h-2 rounded-full" [ngClass]="item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                          {{ item.name }}
                        </div>
                        <span class="text-[11px] text-slate-500">₹{{ item.price }} · {{ item.category }}</span>
                      </div>
                    </div>

                    <button
                      (click)="toggle86(item.id, item.name, item.isAvailable)"
                      class="px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                      [ngClass]="item.isAvailable ? 'bg-slate-100 text-slate-700 hover:bg-rose-100 hover:text-rose-700' : 'bg-rose-600 text-white shadow-xs'"
                    >
                      <span>{{ item.isAvailable ? 'Available' : '86ed (Sold Out)' }}</span>
                    </button>
                  </div>
                }
              </div>

              <div class="flex items-center justify-between pt-3 border-t border-slate-100">
                <span class="text-slate-500 text-[11px]">Changes sync instantly to Waiter handhelds and Cashier POS.</span>
                <button
                  (click)="show86Modal.set(false)"
                  class="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class KdsComponent {
  public hospitality = inject(HospitalityService);
  public entitlements = inject(EntitlementsService);
  public roleService = inject(RoleService);
  private toast = inject(ToastService);

  show86Modal = signal(false);
  selectedStation = signal<string>('All Stations');

  readonly stations = [
    'All Stations',
    'Tandoor & Starters',
    'Curry & Gravy',
    'Breads & Rice',
    'Beverages & Desserts',
  ];

  readonly orders = this.hospitality.filteredOrders;

  readonly soldOutItemsCount = computed(() => {
    return this.hospitality.menuItems().filter((i) => !i.isAvailable).length;
  });

  readonly newOrders = computed(() => {
    return this.orders().filter((o) => o.status === 'pending' || o.status === 'accepted');
  });

  readonly preparingOrders = computed(() => {
    return this.orders().filter((o) => o.status === 'preparing');
  });

  readonly readyOrders = computed(() => {
    return this.orders().filter((o) => o.status === 'ready');
  });

  constructor() {}

  moveOrder(orderId: string, nextStatus: OrderStatus) {
    this.hospitality.updateOrderStatus(orderId, nextStatus);
  }

  toggle86(itemId: string, itemName: string, currentlyAvailable: boolean) {
    this.hospitality.toggleItemAvailability(itemId);
    if (currentlyAvailable) {
      this.toast.error('Item 86ed (Sold Out)', `${itemName} is now marked SOLD OUT across POS and Waiter handhelds.`);
    } else {
      this.toast.success('Item Back in Stock', `${itemName} is restored to active live ordering.`);
    }
  }

  bellChime() {
    this.toast.info('Kitchen Chime', 'KDS notification alert sounded across line displays.');
  }
}
