import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HospitalityService } from '../../services/hospitality.service';
import { EntitlementsService } from '../../services/entitlements.service';
import { RoleService } from '../../services/role.service';
import { IconComponent } from '../shared/icon.component';
import { RoleGuardGateComponent } from '../shared/role-guard-gate.component';
import { Order, OrderStatus } from '../../models/hospitality.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, RoleGuardGateComponent],
  template: `
    @if (!roleService.isManager()) {
      <app-role-guard-gate requiredRole="General Manager"></app-role-guard-gate>
    } @else {
      <div class="space-y-6">
        <!-- Welcome Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Good morning, {{ roleService.currentUser().name }}</h1>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Operations
              </span>
            </div>
            <p class="text-sm text-slate-500 mt-0.5">
              Here's what's happening with your business today across {{ hospitality.currentOutlet()?.name || 'all Jaipur outlets' }}.
            </p>
          </div>

        <div class="flex items-center gap-2.5">
          <a
            routerLink="/pos"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm"
          >
            <app-icon name="pos" [size]="16" class="text-emerald-400"></app-icon>
            <span>Open POS Terminal</span>
          </a>
          <a
            routerLink="/orders"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors"
          >
            <app-icon name="orders" [size]="15"></app-icon>
            <span>View All Orders</span>
          </a>
        </div>
      </div>

      <!-- 6 Major KPI Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <!-- Total Revenue -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-medium">Total Revenue</span>
            <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <app-icon name="billing" [size]="14"></app-icon>
            </div>
          </div>
          <div class="text-xl font-bold text-slate-900">
            ₹{{ metrics().totalRevenue | number:'1.0-0' }}
          </div>
          <div class="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
            <span>↑ 14.2%</span>
            <span class="text-slate-400 font-normal">vs yesterday</span>
          </div>
        </div>

        <!-- Total Orders -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-medium">Total Orders</span>
            <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <app-icon name="orders" [size]="14"></app-icon>
            </div>
          </div>
          <div class="text-xl font-bold text-slate-900">
            {{ metrics().totalOrders }}
          </div>
          <div class="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
            <span>↑ 8.4%</span>
            <span class="text-slate-400 font-normal">pace normal</span>
          </div>
        </div>

        <!-- Average Order Value (AOV) -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-medium">Avg Order Value</span>
            <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <app-icon name="tag" [size]="14"></app-icon>
            </div>
          </div>
          <div class="text-xl font-bold text-slate-900">
            ₹{{ metrics().avgOrderValue }}
          </div>
          <div class="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
            <span>↑ ₹42</span>
            <span class="text-slate-400 font-normal">higher combos</span>
          </div>
        </div>

        <!-- Active Tables -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-medium">Active Tables</span>
            <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <app-icon name="tables" [size]="14"></app-icon>
            </div>
          </div>
          <div class="text-xl font-bold text-slate-900">
            {{ metrics().occupiedTables }} / {{ metrics().totalTables }}
          </div>
          <div class="flex items-center gap-1 mt-1 text-[11px] text-amber-600 font-semibold">
            <span>75% Occupancy</span>
          </div>
        </div>

        <!-- New Customers -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-medium">New Guests</span>
            <div class="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <app-icon name="customers" [size]="14"></app-icon>
            </div>
          </div>
          <div class="text-xl font-bold text-slate-900">
            {{ metrics().newCustomers }}
          </div>
          <div class="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
            <span>+12 today</span>
          </div>
        </div>

        <!-- Repeat Customer Rate -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-medium">Repeat Rate</span>
            <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <app-icon name="loyalty" [size]="14"></app-icon>
            </div>
          </div>
          <div class="text-xl font-bold text-slate-900">
            {{ metrics().repeatCustomerRate }}%
          </div>
          <div class="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
            <span>Top tier loyalty</span>
          </div>
        </div>
      </div>

      <!-- Main Visual Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Revenue Analytics Chart (2 Columns) -->
        <div class="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 class="text-base font-bold text-slate-900">Revenue Analytics</h2>
              <p class="text-xs text-slate-500">Hourly sales volume vs prior period benchmark</p>
            </div>

            <!-- Time toggle -->
            <div class="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                (click)="chartTimeframe.set('hourly')"
                class="px-3 py-1 rounded-lg transition-all"
                [ngClass]="{ 'bg-white text-slate-900 shadow-xs': chartTimeframe() === 'hourly' }"
              >
                Today (Hourly)
              </button>
              <button
                (click)="chartTimeframe.set('weekly')"
                class="px-3 py-1 rounded-lg transition-all"
                [ngClass]="{ 'bg-white text-slate-900 shadow-xs': chartTimeframe() === 'weekly' }"
              >
                Last 7 Days
              </button>
              <button
                (click)="chartTimeframe.set('monthly')"
                class="px-3 py-1 rounded-lg transition-all"
                [ngClass]="{ 'bg-white text-slate-900 shadow-xs': chartTimeframe() === 'monthly' }"
              >
                Month to Date
              </button>
            </div>
          </div>

          <!-- Interactive Responsive SVG Bar/Line Chart -->
          <div class="h-64 w-full flex flex-col justify-end">
            <div class="h-52 flex items-end justify-between gap-2 border-b border-slate-200/80 pb-2">
              @for (bar of activeChartData(); track bar.label) {
                <div class="flex-1 flex flex-col items-center gap-1 group relative">
                  <!-- Hover tooltip -->
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                    {{ bar.label }}: ₹{{ bar.value | number:'1.0-0' }} ({{ bar.orders }} orders)
                  </div>
                  <!-- Bar Fill -->
                  <div class="w-full max-w-[36px] bg-slate-100 rounded-t-lg relative overflow-hidden flex flex-col justify-end h-44">
                    <div
                      class="w-full bg-gradient-to-t from-slate-900 to-indigo-700 rounded-t-lg transition-all duration-500 group-hover:from-emerald-600 group-hover:to-teal-500"
                      [style.height.%]="bar.heightPercent"
                    ></div>
                  </div>
                  <!-- Label -->
                  <span class="text-[10px] text-slate-400 font-medium truncate w-full text-center">
                    {{ bar.label }}
                  </span>
                </div>
              }
            </div>

            <!-- Chart legend -->
            <div class="flex items-center justify-between text-xs text-slate-500 pt-3">
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                  Current Revenue
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Peak Rush Hour
                </span>
              </div>
              <span class="font-medium text-slate-700">Peak today: 01:00 PM (Lunch Rush)</span>
            </div>
          </div>
        </div>

        <!-- Order Distribution Donut / Breakdown (1 Column) -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-bold text-slate-900">Order Channels</h2>
              <span class="text-xs text-slate-400 font-medium">Real-time</span>
            </div>

            <!-- Donut Visual -->
            <div class="relative w-40 h-40 mx-auto my-3 flex items-center justify-center">
              <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
                <!-- Dine-in (58%) -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#172B4D" stroke-width="3.5" stroke-dasharray="58 42" stroke-dashoffset="0" />
                <!-- Takeaway (24%) -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" stroke-width="3.5" stroke-dasharray="24 76" stroke-dashoffset="-58" />
                <!-- Delivery (18%) -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" stroke-width="3.5" stroke-dasharray="18 82" stroke-dashoffset="-82" />
              </svg>
              <div class="absolute text-center">
                <span class="text-xs text-slate-400 block font-medium">Total</span>
                <span class="text-xl font-extrabold text-slate-900">248</span>
              </div>
            </div>

            <!-- Breakdown list -->
            <div class="space-y-2 mt-4 text-xs">
              <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#172B4D]"></span>
                  <span class="font-semibold text-slate-800">Dine-in</span>
                </div>
                <div class="text-right">
                  <span class="font-bold text-slate-900">144 orders</span>
                  <span class="text-slate-400 ml-1">(58%)</span>
                </div>
              </div>
              <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span class="font-semibold text-slate-800">Takeaway & Parcel</span>
                </div>
                <div class="text-right">
                  <span class="font-bold text-slate-900">60 orders</span>
                  <span class="text-slate-400 ml-1">(24%)</span>
                </div>
              </div>
              <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span class="font-semibold text-slate-800">Direct Delivery</span>
                </div>
                <div class="text-right">
                  <span class="font-bold text-slate-900">44 orders</span>
                  <span class="text-slate-400 ml-1">(18%)</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Avg Table Turnover:</span>
            <span class="font-bold text-slate-800">48 mins</span>
          </div>
        </div>
      </div>

      <!-- Second Row: Top Selling Dishes & Live Kitchen Status & Payment Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Top Selling Dishes -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-bold text-slate-900">Top Selling Items</h2>
              <p class="text-xs text-slate-500">Highest grossing dishes today</p>
            </div>
            <a routerLink="/menu" class="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
              Edit Menu →
            </a>
          </div>

          <div class="space-y-3">
            @for (item of topDishes(); track item.name) {
              <div class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div class="flex items-center gap-3">
                  <img [src]="item.image" [alt]="item.name" class="w-10 h-10 rounded-xl object-cover border border-slate-200/80 shadow-2xs" />
                  <div>
                    <h4 class="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full" [ngClass]="item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                      {{ item.name }}
                    </h4>
                    <span class="text-[11px] text-slate-500">{{ item.ordersCount }} orders sold</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-xs text-slate-900">₹{{ item.revenue | number:'1.0-0' }}</div>
                  <span class="text-[10px] text-emerald-600 font-semibold">+{{ item.growth }}%</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Live Kitchen Status -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-base font-bold text-slate-900">Live Kitchen (KDS)</h2>
                <p class="text-xs text-slate-500">Active tickets & prep efficiency</p>
              </div>
              <a routerLink="/kds" class="text-xs text-amber-600 hover:text-amber-700 font-semibold">
                Open KDS →
              </a>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center mb-4">
              <div class="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                <span class="text-xs text-blue-700 font-medium">New Tickets</span>
                <div class="text-lg font-bold text-blue-900 mt-0.5">3</div>
              </div>
              <div class="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                <span class="text-xs text-amber-700 font-medium">Preparing</span>
                <div class="text-lg font-bold text-amber-900 mt-0.5">5</div>
              </div>
              <div class="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <span class="text-xs text-emerald-700 font-medium">Ready</span>
                <div class="text-lg font-bold text-emerald-900 mt-0.5">2</div>
              </div>
            </div>

            <div class="space-y-2 text-xs">
              <div class="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span class="font-semibold text-slate-800">Average Preparation Time</span>
                  <p class="text-[11px] text-slate-400">Target: under 18 mins</p>
                </div>
                <span class="text-xs font-bold text-slate-900 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                  14.5 mins
                </span>
              </div>
              <div class="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span class="font-semibold text-slate-800">Delayed Tickets (>20 min)</span>
                  <p class="text-[11px] text-slate-400">Alert threshold</p>
                </div>
                <span class="text-xs font-bold text-emerald-600 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                  0 Delayed
                </span>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span class="text-slate-500">Chef In-Charge:</span>
            <span class="font-semibold text-slate-800">Master Chef Sanjeev Rawat</span>
          </div>
        </div>

        <!-- Payment Breakdown & CRM Snapshot -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-base font-bold text-slate-900">Settlements & Pay Modes</h2>
                <p class="text-xs text-slate-500">Today's collection split</p>
              </div>
              <span class="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                100% Reconciled
              </span>
            </div>

            <!-- Payment progress bars -->
            <div class="space-y-3 text-xs">
              <div>
                <div class="flex justify-between font-medium mb-1">
                  <span class="text-slate-700">UPI / QR Code (PhonePe, GPay, Paytm)</span>
                  <span class="font-bold text-slate-900">₹1,07,010 (58%)</span>
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div class="bg-indigo-600 h-full rounded-full" style="width: 58%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between font-medium mb-1">
                  <span class="text-slate-700">Cards (Visa, Mastercard, RuPay)</span>
                  <span class="font-bold text-slate-900">₹44,280 (24%)</span>
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full" style="width: 24%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between font-medium mb-1">
                  <span class="text-slate-700">Cash Settlements</span>
                  <span class="font-bold text-slate-900">₹25,830 (14%)</span>
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div class="bg-amber-500 h-full rounded-full" style="width: 14%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between font-medium mb-1">
                  <span class="text-slate-700">Hotel Folio Room Charge</span>
                  <span class="font-bold text-slate-900">₹7,380 (4%)</span>
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div class="bg-purple-500 h-full rounded-full" style="width: 4%"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Net GST Collected (5%):</span>
            <span class="font-bold text-slate-800">₹8,785.70</span>
          </div>
        </div>
      </div>

      <!-- Recent Orders Live Table -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-slate-900">Recent Live Orders</h2>
            <p class="text-xs text-slate-500">Real-time order progression and fulfillment</p>
          </div>
          <a routerLink="/orders" class="text-xs font-semibold text-slate-900 hover:text-indigo-600 flex items-center gap-1">
            <span>Full order table</span>
            <app-icon name="chevron-right" [size]="14"></app-icon>
          </a>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th class="px-5 py-3">Order #</th>
                <th class="px-5 py-3">Type</th>
                <th class="px-5 py-3">Customer / Table</th>
                <th class="px-5 py-3">Ordered Items</th>
                <th class="px-5 py-3">Amount</th>
                <th class="px-5 py-3">Status</th>
                <th class="px-5 py-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (order of hospitality.filteredOrders().slice(0, 5); track order.id) {
                <tr class="hover:bg-slate-50/60 transition-colors">
                  <td class="px-5 py-3.5 font-bold text-slate-900">
                    {{ order.orderNumber }}
                    <span class="text-[10px] text-slate-400 font-normal block">{{ order.createdAt }}</span>
                  </td>
                  <td class="px-5 py-3.5">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                      [ngClass]="{
                        'bg-blue-50 text-blue-700 border border-blue-200/60': order.type === 'dine-in',
                        'bg-emerald-50 text-emerald-700 border border-emerald-200/60': order.type === 'takeaway',
                        'bg-amber-50 text-amber-700 border border-amber-200/60': order.type === 'delivery',
                        'bg-purple-50 text-purple-700 border border-purple-200/60': order.type === 'parcel'
                      }"
                    >
                      {{ order.type }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="font-semibold text-slate-900">{{ order.customerName }}</div>
                    <div class="text-[11px] text-slate-400">
                      {{ order.tableNumber ? 'Table ' + order.tableNumber : order.customerPhone }}
                    </div>
                  </td>
                  <td class="px-5 py-3.5 max-w-xs truncate">
                    @for (item of order.items; track item.id; let last = $last) {
                      <span>{{ item.quantity }}x {{ item.name }}{{ !last ? ', ' : '' }}</span>
                    }
                  </td>
                  <td class="px-5 py-3.5 font-bold text-slate-900">
                    ₹{{ order.total | number:'1.0-2' }}
                    <span class="text-[10px] uppercase font-semibold text-emerald-600 block">
                      {{ order.paymentMethod }} · {{ order.paymentStatus }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5">
                    <span
                      class="px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5"
                      [ngClass]="{
                        'bg-amber-100 text-amber-800': order.status === 'preparing',
                        'bg-emerald-100 text-emerald-800': order.status === 'ready' || order.status === 'completed' || order.status === 'served',
                        'bg-blue-100 text-blue-800': order.status === 'accepted',
                        'bg-slate-100 text-slate-800': order.status === 'pending',
                        'bg-rose-100 text-rose-800': order.status === 'cancelled'
                      }"
                    >
                      <span class="w-1.5 h-1.5 rounded-full"
                        [ngClass]="{
                          'bg-amber-500 animate-pulse': order.status === 'preparing',
                          'bg-emerald-500': order.status === 'ready' || order.status === 'completed' || order.status === 'served',
                          'bg-blue-500': order.status === 'accepted',
                          'bg-slate-500': order.status === 'pending',
                          'bg-rose-500': order.status === 'cancelled'
                        }"
                      ></span>
                      {{ order.status | uppercase }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 text-right">
                    <button
                      (click)="advanceOrderStatus(order)"
                      class="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] shadow-2xs transition-colors"
                    >
                      Advance Status →
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  }
  `,
})
export class DashboardComponent {
  public hospitality = inject(HospitalityService);
  public entitlements = inject(EntitlementsService);
  public roleService = inject(RoleService);

  chartTimeframe = signal<'hourly' | 'weekly' | 'monthly'>('hourly');
  readonly metrics = this.hospitality.kpiMetrics;

  readonly hourlyData = [
    { label: '09 AM', value: 8200, orders: 12, heightPercent: 25 },
    { label: '10 AM', value: 14500, orders: 19, heightPercent: 40 },
    { label: '11 AM', value: 19800, orders: 26, heightPercent: 55 },
    { label: '12 PM', value: 28400, orders: 38, heightPercent: 78 },
    { label: '01 PM', value: 36500, orders: 49, heightPercent: 100 },
    { label: '02 PM', value: 31200, orders: 41, heightPercent: 85 },
    { label: '03 PM', value: 18400, orders: 24, heightPercent: 50 },
    { label: '04 PM', value: 12800, orders: 17, heightPercent: 35 },
    { label: '05 PM', value: 14700, orders: 22, heightPercent: 40 },
  ];

  readonly weeklyData = [
    { label: 'Mon', value: 142000, orders: 190, heightPercent: 65 },
    { label: 'Tue', value: 156000, orders: 210, heightPercent: 72 },
    { label: 'Wed', value: 168000, orders: 225, heightPercent: 78 },
    { label: 'Thu', value: 159000, orders: 215, heightPercent: 74 },
    { label: 'Fri', value: 198000, orders: 265, heightPercent: 90 },
    { label: 'Sat', value: 245000, orders: 320, heightPercent: 100 },
    { label: 'Sun', value: 232000, orders: 305, heightPercent: 95 },
  ];

  readonly monthlyData = [
    { label: 'W1', value: 980000, orders: 1320, heightPercent: 75 },
    { label: 'W2', value: 1120000, orders: 1480, heightPercent: 85 },
    { label: 'W3', value: 1280000, orders: 1690, heightPercent: 98 },
    { label: 'W4 (Est)', value: 1310000, orders: 1720, heightPercent: 100 },
  ];

  readonly activeChartData = computed(() => {
    switch (this.chartTimeframe()) {
      case 'weekly':
        return this.weeklyData;
      case 'monthly':
        return this.monthlyData;
      default:
        return this.hourlyData;
    }
  });

  readonly topDishes = signal([
    {
      name: 'Paneer Tikka Angara',
      ordersCount: 78,
      revenue: 21840,
      growth: 18,
      isVeg: true,
      image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dal Makhani Bukhara',
      ordersCount: 72,
      revenue: 18720,
      growth: 14,
      isVeg: true,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Royal Dum Veg Biryani',
      ordersCount: 64,
      revenue: 15360,
      growth: 22,
      isVeg: true,
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Murgh Makhani (Butter Chicken)',
      ordersCount: 48,
      revenue: 17280,
      growth: 12,
      isVeg: false,
      image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Handcrafted Cold Coffee',
      ordersCount: 56,
      revenue: 7840,
      growth: 30,
      isVeg: true,
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=120&auto=format&fit=crop&q=80',
    },
  ]);

  constructor() {}

  advanceOrderStatus(order: Order) {
    const sequence: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'served', 'completed'];
    const currIdx = sequence.indexOf(order.status);
    if (currIdx > -1 && currIdx < sequence.length - 1) {
      const next = sequence[currIdx + 1];
      this.hospitality.updateOrderStatus(order.id, next);
    }
  }
}
