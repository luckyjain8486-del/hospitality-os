import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalityService } from '../../services/hospitality.service';
import { RoleService } from '../../services/role.service';
import { Order, OrderStatus, OrderType, PaymentMethod } from '../../models/hospitality.model';
import { IconComponent } from '../shared/icon.component';
import { ToastService } from '../../services/toast.service';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Header with stats & actions -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Order Management</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {{ filteredOrders().length }} Orders
            </span>
            <!-- Role indicator pill -->
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
              [ngClass]="{
                'bg-amber-50 text-amber-900 border-amber-200': roleService.isWaiter(),
                'bg-emerald-50 text-emerald-900 border-emerald-200': roleService.isCashier(),
                'bg-blue-50 text-blue-900 border-blue-200': roleService.isChef(),
                'bg-purple-50 text-purple-900 border-purple-200': roleService.isManager()
              }">
              {{ roleService.currentUser().name }} ({{ roleService.currentRole() | uppercase }})
            </span>
          </div>
          <p class="text-sm text-slate-500 mt-0.5">
            @if (roleService.isWaiter()) {
              Floor Waitstaff View · Active table tickets. Cancellations require General Manager PIN (1234).
            } @else if (roleService.isCashier()) {
              Cashier Billing Counter · Settle customer payments, verify invoices, and print tax receipts.
            } @else if (roleService.isChef()) {
              Kitchen Production View · Live preparation pipeline and plate staging status.
            } @else {
              Master Operations View · Unrestricted management across all ticket states and voids.
            }
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            (click)="exportCsv()"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
          >
            <app-icon name="download" [size]="15"></app-icon>
            <span>Export CSV</span>
          </button>
          <button
            (click)="showNewOrderModal.set(true)"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm cursor-pointer"
          >
            <app-icon name="plus" [size]="16" class="text-emerald-400"></app-icon>
            <span>Create New Order</span>
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Search bar -->
        <div class="relative flex-1 max-w-md">
          <app-icon name="search" [size]="15" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
          <input
            type="text"
            placeholder="Search by order #, customer name, phone, table..."
            [(ngModel)]="searchFilter"
            class="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 transition-all"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs">
          <!-- Type Filter -->
          <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 font-medium text-slate-700">
            <span class="text-slate-400">Type:</span>
            <select [(ngModel)]="typeFilter" class="bg-transparent font-semibold focus:outline-none cursor-pointer">
              <option value="all">All Types</option>
              <option value="dine-in">Dine-in</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
              <option value="parcel">Parcel</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 font-medium text-slate-700">
            <span class="text-slate-400">Status:</span>
            <select [(ngModel)]="statusFilter" class="bg-transparent font-semibold focus:outline-none cursor-pointer">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <!-- Reset Filter -->
          @if (searchFilter() || typeFilter() !== 'all' || statusFilter() !== 'all') {
            <button
              (click)="resetFilters()"
              class="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
            >
              Clear
            </button>
          }
        </div>
      </div>

      <!-- Orders Data Table -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th class="px-5 py-3.5">Order Number</th>
                <th class="px-5 py-3.5">Type & Table</th>
                <th class="px-5 py-3.5">Customer</th>
                <th class="px-5 py-3.5">Outlet</th>
                <th class="px-5 py-3.5">Items Summary</th>
                <th class="px-5 py-3.5">Total & Payment</th>
                <th class="px-5 py-3.5">Order Status</th>
                <th class="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (order of filteredOrders(); track order.id) {
                <tr
                  (click)="openOrderDetails(order)"
                  class="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  <td class="px-5 py-3.5 font-bold text-slate-900">
                    <div class="flex items-center gap-1.5">
                      <span>{{ order.orderNumber }}</span>
                    </div>
                    <span class="text-[10px] text-slate-400 font-normal block">{{ order.createdAt }}</span>
                  </td>
                  <td class="px-5 py-3.5">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider block w-max"
                      [ngClass]="{
                        'bg-blue-50 text-blue-700 border border-blue-200/60': order.type === 'dine-in',
                        'bg-emerald-50 text-emerald-700 border border-emerald-200/60': order.type === 'takeaway',
                        'bg-amber-50 text-amber-700 border border-amber-200/60': order.type === 'delivery',
                        'bg-purple-50 text-purple-700 border border-purple-200/60': order.type === 'parcel'
                      }"
                    >
                      {{ order.type }}
                    </span>
                    @if (order.tableNumber) {
                      <span class="text-[11px] font-semibold text-slate-700 mt-1 block">
                        Table: {{ order.tableNumber }}
                      </span>
                    }
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="font-semibold text-slate-900">{{ order.customerName }}</div>
                    <div class="text-[11px] text-slate-400">{{ order.customerPhone }}</div>
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="font-medium text-slate-800 truncate max-w-[140px]">{{ order.outletName }}</div>
                    <span class="text-[10px] text-slate-400">Server: {{ order.serverName || 'Unassigned' }}</span>
                  </td>
                  <td class="px-5 py-3.5 max-w-xs">
                    <div class="truncate text-slate-700 font-medium">
                      @for (item of order.items; track item.id; let last = $last) {
                        <span>{{ item.quantity }}x {{ item.name }}{{ !last ? ', ' : '' }}</span>
                      }
                    </div>
                    <span class="text-[10px] text-slate-400 block">{{ order.items.length }} distinct items</span>
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="font-bold text-slate-900 text-sm">₹{{ order.total | number:'1.0-2' }}</div>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                        {{ order.paymentStatus }}
                      </span>
                      <span class="text-[10px] uppercase text-slate-400 font-mono">
                        {{ order.paymentMethod }}
                      </span>
                    </div>
                  </td>
                  <td class="px-5 py-3.5" (click)="$event.stopPropagation()">
                    <!-- Interactive Status Dropdown -->
                    <select
                      [ngModel]="order.status"
                      (ngModelChange)="onStatusChange(order, $event)"
                      class="px-2.5 py-1 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer"
                      [ngClass]="{
                        'bg-amber-50 text-amber-800 border-amber-200': order.status === 'preparing',
                        'bg-emerald-50 text-emerald-800 border-emerald-200': order.status === 'ready' || order.status === 'completed' || order.status === 'served',
                        'bg-blue-50 text-blue-800 border-blue-200': order.status === 'accepted',
                        'bg-slate-100 text-slate-800 border-slate-200': order.status === 'pending',
                        'bg-rose-50 text-rose-800 border-rose-200': order.status === 'cancelled'
                      }"
                    >
                      <option value="pending">PENDING</option>
                      <option value="accepted">ACCEPTED</option>
                      <option value="preparing">PREPARING</option>
                      <option value="ready">READY</option>
                      <option value="served">SERVED</option>
                      <option value="completed">COMPLETED</option>
                      <option value="cancelled">CANCELLED</option>
                    </select>
                  </td>
                  <td class="px-5 py-3.5 text-right" (click)="$event.stopPropagation()">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        (click)="printBill(order)"
                        class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Print Customer Bill / KOT"
                      >
                        <app-icon name="printer" [size]="14"></app-icon>
                      </button>
                      <button
                        (click)="openOrderDetails(order)"
                        class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="View Full Details Drawer"
                      >
                        <app-icon name="eye" [size]="14"></app-icon>
                      </button>
                      @if (order.status !== 'cancelled' && order.status !== 'completed') {
                        <button
                          (click)="confirmCancelOrder(order)"
                          class="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Cancel Order"
                        >
                          <app-icon name="x" [size]="14"></app-icon>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="text-center py-12 text-slate-400">
                    <app-icon name="orders" [size]="32" class="mx-auto mb-2 opacity-50"></app-icon>
                    <p class="font-semibold text-slate-600">No orders found</p>
                    <p class="text-xs mt-0.5">Try adjusting your filters or search terms.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- ORDER DETAILS SIDE DRAWER -->
      @if (selectedOrder()) {
        <div class="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div class="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <!-- Drawer Header -->
            <div class="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-bold text-slate-900">{{ selectedOrder()!.orderNumber }}</h3>
                  <span class="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">
                    {{ selectedOrder()!.type }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">{{ selectedOrder()!.outletName }} · {{ selectedOrder()!.createdAt }}</p>
              </div>
              <button
                (click)="selectedOrder.set(null)"
                class="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <!-- Drawer Body -->
            <div class="p-5 space-y-6 flex-1 text-xs text-slate-700">
              <!-- Customer & Table Card -->
              <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-slate-500">Customer:</span>
                  <span class="font-bold text-slate-900">{{ selectedOrder()!.customerName }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-500">Phone:</span>
                  <span class="font-mono text-slate-800">{{ selectedOrder()!.customerPhone }}</span>
                </div>
                @if (selectedOrder()!.tableNumber) {
                  <div class="flex items-center justify-between">
                    <span class="text-slate-500">Assigned Table:</span>
                    <span class="font-bold text-indigo-700">{{ selectedOrder()!.tableNumber }}</span>
                  </div>
                }
                <div class="flex items-center justify-between">
                  <span class="text-slate-500">Assigned Server:</span>
                  <span class="font-semibold text-slate-900">{{ selectedOrder()!.serverName || 'Mukesh Singh' }}</span>
                </div>
                @if (selectedOrder()!.notes) {
                  <div class="pt-2 border-t border-slate-200/60 text-[11px] text-amber-800 bg-amber-50/60 p-2 rounded-lg">
                    <span class="font-semibold block mb-0.5">Special Instructions:</span>
                    {{ selectedOrder()!.notes }}
                  </div>
                }
              </div>

              <!-- Order Items List -->
              <div>
                <h4 class="font-bold text-xs uppercase text-slate-400 mb-3 tracking-wider">Ordered Items</h4>
                <div class="space-y-2.5">
                  @for (item of selectedOrder()!.items; track item.id) {
                    <div class="p-3 rounded-xl border border-slate-200/80 bg-white flex items-start justify-between">
                      <div class="space-y-0.5">
                        <div class="font-bold text-slate-900 text-xs">
                          {{ item.quantity }}x {{ item.name }}
                        </div>
                        @if (item.variant) {
                          <span class="text-[10px] text-slate-500 block">Variant: {{ item.variant }}</span>
                        }
                        @if (item.modifiers && item.modifiers.length > 0) {
                          <span class="text-[10px] text-emerald-600 block">Extras: {{ item.modifiers.join(', ') }}</span>
                        }
                        @if (item.instructions) {
                          <span class="text-[10px] text-slate-400 italic block">"{{ item.instructions }}"</span>
                        }
                      </div>
                      <div class="font-bold text-slate-900 text-xs text-right">
                        ₹{{ item.price * item.quantity | number:'1.0-2' }}
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Payment Breakdown -->
              <div class="space-y-2 pt-2 border-t border-slate-200">
                <div class="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span class="font-medium text-slate-900">₹{{ selectedOrder()!.subtotal | number:'1.0-2' }}</span>
                </div>
                @if (selectedOrder()!.discount > 0) {
                  <div class="flex justify-between text-emerald-600 font-medium">
                    <span>Discount Applied:</span>
                    <span>-₹{{ selectedOrder()!.discount | number:'1.0-2' }}</span>
                  </div>
                }
                <div class="flex justify-between text-slate-500">
                  <span>GST (5%):</span>
                  <span class="font-medium text-slate-900">₹{{ selectedOrder()!.tax | number:'1.0-2' }}</span>
                </div>
                @if (selectedOrder()!.serviceCharge > 0) {
                  <div class="flex justify-between text-slate-500">
                    <span>Service Charge (5%):</span>
                    <span class="font-medium text-slate-900">₹{{ selectedOrder()!.serviceCharge | number:'1.0-2' }}</span>
                  </div>
                }
                <div class="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span class="text-base text-emerald-600">₹{{ selectedOrder()!.total | number:'1.0-2' }}</span>
                </div>
              </div>

              <!-- Status Changer -->
              <div>
                <label class="font-bold text-xs uppercase text-slate-400 block mb-2 tracking-wider">Change Order Status</label>
                <div class="grid grid-cols-3 gap-2">
                  @for (st of ['pending', 'accepted', 'preparing', 'ready', 'served', 'completed']; track st) {
                    <button
                      (click)="onStatusChange(selectedOrder()!, $any(st))"
                      class="px-2.5 py-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer"
                      [ngClass]="selectedOrder()!.status === st ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
                    >
                      {{ st }}
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- Drawer Footer Actions -->
            <div class="p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 sticky bottom-0">
              <button
                (click)="printBill(selectedOrder()!)"
                class="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <app-icon name="printer" [size]="15"></app-icon>
                <span>Print Bill (GST)</span>
              </button>
              <button
                (click)="selectedOrder.set(null)"
                class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      }

      <!-- PRINT BILL PREVIEW MODAL -->
      @if (printingOrder()) {
        <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-slate-900 font-mono text-xs">
            <div class="text-center pb-4 border-b border-dashed border-slate-300">
              <h2 class="text-base font-extrabold uppercase">HospitalityOS</h2>
              <p class="text-[11px] text-slate-500">{{ printingOrder()!.outletName }}</p>
              <p class="text-[10px] text-slate-400">GSTIN: 08AAACH7489M1Z8</p>
              <div class="mt-2 text-[10px] text-slate-500">
                Order: {{ printingOrder()!.orderNumber }} · {{ printingOrder()!.createdAt }}
              </div>
            </div>

            <div class="py-3 border-b border-dashed border-slate-300 space-y-1.5">
              @for (item of printingOrder()!.items; track item.id) {
                <div class="flex justify-between">
                  <span>{{ item.quantity }}x {{ item.name }}</span>
                  <span>₹{{ item.price * item.quantity | number:'1.0-2' }}</span>
                </div>
              }
            </div>

            <div class="py-3 border-b border-dashed border-slate-300 space-y-1 text-slate-600">
              <div class="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{{ printingOrder()!.subtotal | number:'1.0-2' }}</span>
              </div>
              @if (printingOrder()!.discount > 0) {
                <div class="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-₹{{ printingOrder()!.discount | number:'1.0-2' }}</span>
                </div>
              }
              <div class="flex justify-between">
                <span>CGST (2.5%):</span>
                <span>₹{{ printingOrder()!.tax / 2 | number:'1.0-2' }}</span>
              </div>
              <div class="flex justify-between">
                <span>SGST (2.5%):</span>
                <span>₹{{ printingOrder()!.tax / 2 | number:'1.0-2' }}</span>
              </div>
              <div class="flex justify-between font-bold text-slate-900 text-sm pt-2">
                <span>TOTAL AMOUNT:</span>
                <span>₹{{ printingOrder()!.total | number:'1.0-2' }}</span>
              </div>
            </div>

            <div class="text-center pt-4 text-[10px] text-slate-400 space-y-1">
              <p>Payment: {{ printingOrder()!.paymentMethod | uppercase }} ({{ printingOrder()!.paymentStatus | uppercase }})</p>
              <p>*** Thank You! Please Visit Again ***</p>
            </div>

            <div class="mt-6 flex items-center gap-2 font-sans">
              <button
                (click)="simulatePhysicalPrint()"
                class="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2"
              >
                <app-icon name="printer" [size]="14"></app-icon>
                <span>Trigger Print</span>
              </button>
              <button
                (click)="printingOrder.set(null)"
                class="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      }

      <!-- CREATE NEW ORDER MODAL -->
      @if (showNewOrderModal()) {
        <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-900">Create Quick Order</h3>
              <button (click)="showNewOrderModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <div class="space-y-4 my-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Order Channel</label>
                  <select [(ngModel)]="newOrderType" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <option value="dine-in">Dine-in</option>
                    <option value="takeaway">Takeaway</option>
                    <option value="delivery">Delivery</option>
                    <option value="parcel">Parcel</option>
                  </select>
                </div>
                @if (newOrderType === 'dine-in') {
                  <div>
                    <label class="font-semibold text-slate-700 block mb-1">Table Number</label>
                    <select [(ngModel)]="newOrderTable" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                      @for (t of hospitality.tables(); track t.id) {
                        <option [value]="t.tableNumber">{{ t.tableNumber }} ({{ t.zone }})</option>
                      }
                    </select>
                  </div>
                }
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Customer Name</label>
                  <input type="text" [(ngModel)]="newOrderCustomer" placeholder="e.g. Priya Sharma" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Customer Phone</label>
                  <input type="text" [(ngModel)]="newOrderPhone" placeholder="+91 98290 12345" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                </div>
              </div>

              <div>
                <label class="font-semibold text-slate-700 block mb-1">Select Main Dish</label>
                <select [(ngModel)]="newOrderDishId" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                  @for (item of hospitality.menuItems(); track item.id) {
                    <option [value]="item.id">{{ item.name }} — ₹{{ item.price }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="font-semibold text-slate-700 block mb-1">Payment Method</label>
                <div class="grid grid-cols-3 gap-2">
                  @for (pm of ['upi', 'card', 'cash']; track pm) {
                    <button
                      type="button"
                      (click)="newOrderPaymentMethod = $any(pm)"
                      class="py-2 rounded-xl border text-center uppercase font-bold text-xs"
                      [ngClass]="newOrderPaymentMethod === pm ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'"
                    >
                      {{ pm }}
                    </button>
                  }
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                (click)="showNewOrderModal.set(false)"
                class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                (click)="submitQuickOrder()"
                class="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
              >
                Create & Send to Kitchen
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class OrdersComponent {
  searchFilter = signal('');
  typeFilter = signal<string>('all');
  statusFilter = signal<string>('all');

  selectedOrder = signal<Order | null>(null);
  printingOrder = signal<Order | null>(null);
  showNewOrderModal = signal(false);

  // Quick order state
  newOrderType: OrderType = 'dine-in';
  newOrderTable: string = 'T-01';
  newOrderCustomer: string = 'Vikramaditya Rathore';
  newOrderPhone: string = '+91 98290 88221';
  newOrderDishId: string = 'item-1';
  newOrderPaymentMethod: PaymentMethod = 'upi';

  readonly filteredOrders = computed(() => {
    const list = this.hospitality.filteredOrders();
    const query = this.searchFilter().toLowerCase().trim();
    const type = this.typeFilter();
    const status = this.statusFilter();

    return list.filter((ord) => {
      if (type !== 'all' && ord.type !== type) return false;
      if (status !== 'all' && ord.status !== status) return false;
      if (!query) return true;
      return (
        ord.orderNumber.toLowerCase().includes(query) ||
        ord.customerName.toLowerCase().includes(query) ||
        ord.customerPhone.toLowerCase().includes(query) ||
        (ord.tableNumber && ord.tableNumber.toLowerCase().includes(query))
      );
    });
  });

  public hospitality = inject(HospitalityService);
  public roleService = inject(RoleService);
  private toast = inject(ToastService);
  private exporter = inject(ExportService);

  resetFilters() {
    this.searchFilter.set('');
    this.typeFilter.set('all');
    this.statusFilter.set('all');
  }

  openOrderDetails(order: Order) {
    this.selectedOrder.set(order);
  }

  printBill(order: Order) {
    this.printingOrder.set(order);
  }

  simulatePhysicalPrint() {
    this.toast.success('Thermal Bill Printed', `Receipt sent to billing printer for ${this.printingOrder()?.orderNumber}`);
    this.printingOrder.set(null);
  }

  onStatusChange(order: Order, newStatus: OrderStatus) {
    if (newStatus === 'cancelled') {
      this.confirmCancelOrder(order);
      return;
    }

    if (newStatus === 'completed' && this.roleService.isWaiter()) {
      // PetPooja constraint: Waiter cannot settle/close bill without Manager authorization
      this.roleService.requestManagerPin(`Settle & Finalize Order [${order.orderNumber}]`, () => {
        this.hospitality.updateOrderStatus(order.id, newStatus);
        if (this.selectedOrder()?.id === order.id) {
          this.selectedOrder()!.status = newStatus;
        }
      });
      return;
    }

    this.hospitality.updateOrderStatus(order.id, newStatus);
    if (this.selectedOrder()?.id === order.id) {
      this.selectedOrder()!.status = newStatus;
    }
  }

  confirmCancelOrder(order: Order) {
    if (this.roleService.isManager()) {
      if (confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) {
        this.hospitality.cancelOrder(order.id);
      }
    } else {
      // PetPooja role constraint: Waiter / Cashier cancel order requires Manager PIN override
      this.roleService.requestManagerPin(`Void/Cancel Order [${order.orderNumber}]`, () => {
        this.hospitality.cancelOrder(order.id);
      });
    }
  }

  submitQuickOrder() {
    const dish = this.hospitality.menuItems().find((i) => i.id === this.newOrderDishId) || this.hospitality.menuItems()[0];
    const subtotal = dish.price;
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = subtotal + tax;

    this.hospitality.createOrder({
      type: this.newOrderType,
      tableNumber: this.newOrderType === 'dine-in' ? this.newOrderTable : undefined,
      customerName: this.newOrderCustomer,
      customerPhone: this.newOrderPhone,
      items: [{ id: 'oi-' + Date.now(), menuItemId: dish.id, name: dish.name, quantity: 1, price: dish.price }],
      subtotal,
      tax,
      discount: 0,
      serviceCharge: 0,
      total,
      paymentMethod: this.newOrderPaymentMethod,
      paymentStatus: 'paid',
    });

    this.showNewOrderModal.set(false);
  }

  exportCsv() {
    const headers = ['Order Number', 'Type', 'Table', 'Customer', 'Phone', 'Outlet', 'Subtotal (INR)', 'Tax', 'Total (INR)', 'Payment Status', 'Order Status', 'Created At'];
    const rows = this.filteredOrders().map((o) => [
      o.orderNumber,
      o.type,
      o.tableNumber || 'N/A',
      o.customerName,
      o.customerPhone,
      o.outletName,
      o.subtotal,
      o.tax,
      o.total,
      o.paymentStatus,
      o.status,
      o.createdAt,
    ]);
    this.exporter.downloadCsv('HospitalityOS-Orders', headers, rows);
  }
}
