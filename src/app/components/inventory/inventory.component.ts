import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalityService } from '../../services/hospitality.service';
import { EntitlementsService } from '../../services/entitlements.service';
import { RoleService } from '../../services/role.service';
import { InventoryItem } from '../../models/hospitality.model';
import { IconComponent } from '../shared/icon.component';
import { LockedFeatureComponent } from '../shared/locked-feature.component';
import { RoleGuardGateComponent } from '../shared/role-guard-gate.component';
import { ToastService } from '../../services/toast.service';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, LockedFeatureComponent, RoleGuardGateComponent],
  template: `
    @if (!roleService.hasPermission('canAdjustInventory')) {
      <app-role-guard-gate requiredRole="Chef or General Manager"></app-role-guard-gate>
    } @else if (!entitlements.isFeatureEnabled('feat-inventory')) {
      <app-locked-feature
        featureTitle="Raw Material Inventory & Wastage Management"
        planRequirement="Growth"
        description="Track ingredient levels, automate purchase orders, log wastage, and receive low-stock alerts before your kitchen runs out."
      ></app-locked-feature>
    } @else {
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Inventory & Raw Materials</h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                {{ lowStockCount() }} Low Stock Alerts
              </span>
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-900 border-blue-200">
                👨‍🍳 {{ roleService.currentUser().name }}
              </span>
            </div>
            <p class="text-sm text-slate-500 mt-0.5">
              Manage pantry ingredients, stock adjustments, vendor orders, and kitchen wastage.
            </p>
          </div>

          <div class="flex items-center gap-2.5">
            <button
              (click)="exportCsv()"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors"
            >
              <app-icon name="download" [size]="15"></app-icon>
              <span>Export Stock</span>
            </button>
            <button
              (click)="showPoModal.set(true)"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm"
            >
              <app-icon name="plus" [size]="16" class="text-emerald-400"></app-icon>
              <span>Create Purchase Order</span>
            </button>
          </div>
        </div>

        <!-- Inventory KPI Overview -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span class="text-xs text-slate-500 font-medium">Total Stock Valuation</span>
            <div class="text-xl font-bold text-slate-900 mt-1">₹1,48,200</div>
            <span class="text-[11px] text-slate-400">Across 10 tracked ingredients</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span class="text-xs text-slate-500 font-medium">Critical Depletions</span>
            <div class="text-xl font-bold text-rose-600 mt-1">{{ criticalCount() }} Items</div>
            <span class="text-[11px] text-rose-500 font-semibold">Immediate reorder required</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span class="text-xs text-slate-500 font-medium">Wastage Recorded (MTD)</span>
            <div class="text-xl font-bold text-amber-600 mt-1">11.5 kg</div>
            <span class="text-[11px] text-emerald-600 font-semibold">↓ 1.8% vs last month</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span class="text-xs text-slate-500 font-medium">Approved Suppliers</span>
            <div class="text-xl font-bold text-slate-900 mt-1">6 Active</div>
            <span class="text-[11px] text-slate-400">Muhana Mandi, Amul, Saras</span>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button
              (click)="statusFilter.set('all')"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold"
              [ngClass]="statusFilter() === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            >
              All Stock
            </button>
            <button
              (click)="statusFilter.set('low')"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold"
              [ngClass]="statusFilter() === 'low' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            >
              Low & Critical
            </button>
            <button
              (click)="statusFilter.set('healthy')"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold"
              [ngClass]="statusFilter() === 'healthy' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            >
              Healthy
            </button>
          </div>

          <div class="relative w-64">
            <app-icon name="search" [size]="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
            <input
              type="text"
              placeholder="Search ingredient, supplier..."
              [(ngModel)]="searchQuery"
              class="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:outline-none"
            />
          </div>
        </div>

        <!-- Inventory Items Table -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-600">
              <thead class="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100">
                <tr>
                  <th class="px-5 py-3.5">Raw Material</th>
                  <th class="px-5 py-3.5">Category</th>
                  <th class="px-5 py-3.5">Current Stock</th>
                  <th class="px-5 py-3.5">Min Threshold</th>
                  <th class="px-5 py-3.5">Unit Cost</th>
                  <th class="px-5 py-3.5">Supplier</th>
                  <th class="px-5 py-3.5">Health Status</th>
                  <th class="px-5 py-3.5 text-right">Stock Adjust</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of filteredInventory(); track item.id) {
                  <tr class="hover:bg-slate-50/60 transition-colors">
                    <td class="px-5 py-3.5 font-bold text-slate-900">
                      {{ item.name }}
                      <span class="text-[10px] text-slate-400 font-normal block">Restocked: {{ item.lastRestocked }}</span>
                    </td>
                    <td class="px-5 py-3.5">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
                        {{ item.category }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 font-bold text-slate-900 text-sm">
                      {{ item.currentStock }} {{ item.unit }}
                    </td>
                    <td class="px-5 py-3.5 font-medium text-slate-500">
                      {{ item.minStock }} {{ item.unit }}
                    </td>
                    <td class="px-5 py-3.5 font-semibold text-slate-800">
                      ₹{{ item.unitCost }} / {{ item.unit }}
                    </td>
                    <td class="px-5 py-3.5">
                      <div class="font-medium text-slate-800">{{ item.supplierName }}</div>
                    </td>
                    <td class="px-5 py-3.5">
                      <span
                        class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1.5"
                        [ngClass]="{
                          'bg-emerald-50 text-emerald-800 border border-emerald-200': item.status === 'healthy',
                          'bg-amber-50 text-amber-800 border border-amber-200': item.status === 'low',
                          'bg-rose-50 text-rose-800 border border-rose-200 animate-pulse': item.status === 'critical'
                        }"
                      >
                        <span class="w-1.5 h-1.5 rounded-full"
                          [ngClass]="{
                            'bg-emerald-500': item.status === 'healthy',
                            'bg-amber-500': item.status === 'low',
                            'bg-rose-500': item.status === 'critical'
                          }"
                        ></span>
                        {{ item.status }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-right">
                      <button
                        (click)="openAdjustModal(item)"
                        class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs"
                      >
                        Adjust Stock ±
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- STOCK ADJUSTMENT MODAL -->
        @if (adjustingItem()) {
          <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 class="text-base font-bold text-slate-900">Adjust {{ adjustingItem()!.name }}</h3>
                <button (click)="adjustingItem.set(null)" class="text-slate-400 hover:text-slate-600">
                  <app-icon name="x" [size]="16"></app-icon>
                </button>
              </div>

              <div class="space-y-4 my-4">
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span class="text-slate-500 block">Current Stock:</span>
                  <span class="text-base font-bold text-slate-900">
                    {{ adjustingItem()!.currentStock }} {{ adjustingItem()!.unit }}
                  </span>
                </div>

                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Adjustment Quantity (±)</label>
                  <input
                    type="number"
                    [(ngModel)]="adjustAmount"
                    placeholder="e.g. 5 to add, -2 to deduct"
                    class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                  />
                  <span class="text-[10px] text-slate-400 mt-1 block">Positive adds stock, negative logs consumption/wastage.</span>
                </div>

                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Reason for Adjustment</label>
                  <select [(ngModel)]="adjustReason" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <option value="Restock Delivery">Restock Delivery Received</option>
                    <option value="Kitchen Wastage / Spoilage">Kitchen Wastage / Spoilage</option>
                    <option value="Physical Audit Count Discrepancy">Physical Audit Count Discrepancy</option>
                    <option value="Chef Prep Deduction">Chef Prep Deduction</option>
                  </select>
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  (click)="adjustingItem.set(null)"
                  class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  (click)="confirmStockAdjustment()"
                  class="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  Apply Adjustment
                </button>
              </div>
            </div>
          </div>
        }

        <!-- PURCHASE ORDER CREATION MODAL -->
        @if (showPoModal()) {
          <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 class="text-base font-bold text-slate-900">Create Supplier Purchase Order</h3>
                <button (click)="showPoModal.set(false)" class="text-slate-400 hover:text-slate-600">
                  <app-icon name="x" [size]="16"></app-icon>
                </button>
              </div>

              <div class="space-y-4 my-4">
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Select Supplier</label>
                  <select [(ngModel)]="poSupplier" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <option value="Muhana Mandi Direct">Muhana Mandi Direct (Vegetables)</option>
                    <option value="Saras Dairy Federation">Saras Dairy Federation (Paneer, Ghee)</option>
                    <option value="Amul Dairy Supply">Amul Dairy Supply (Milk & Cream)</option>
                    <option value="Shree Krishna Agro Mills">Shree Krishna Agro Mills (Flour, Rice)</option>
                  </select>
                </div>

                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Primary Material</label>
                  <select [(ngModel)]="poItemName" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                    @for (it of hospitality.inventory(); track it.id) {
                      <option [value]="it.name">{{ it.name }} (Current: {{ it.currentStock }} {{ it.unit }})</option>
                    }
                  </select>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="font-semibold text-slate-700 block mb-1">Reorder Quantity</label>
                    <input type="number" [(ngModel)]="poQty" min="1" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                  </div>
                  <div>
                    <label class="font-semibold text-slate-700 block mb-1">Delivery Due Date</label>
                    <input type="text" [(ngModel)]="poDate" placeholder="Tomorrow morning" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  (click)="showPoModal.set(false)"
                  class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  (click)="sendPurchaseOrder()"
                  class="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  Dispatch Purchase Order (PO)
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class InventoryComponent {
  statusFilter = signal<'all' | 'low' | 'healthy'>('all');
  searchQuery = '';

  adjustingItem = signal<InventoryItem | null>(null);
  adjustAmount = 10;
  adjustReason = 'Restock Delivery';

  showPoModal = signal(false);
  poSupplier = 'Muhana Mandi Direct';
  poItemName = 'Fresh Farm Tomatoes';
  poQty = 25;
  poDate = 'Tomorrow 07:00 AM';

  readonly lowStockCount = computed(() => this.hospitality.inventory().filter((i) => i.status === 'low' || i.status === 'critical').length);
  readonly criticalCount = computed(() => this.hospitality.inventory().filter((i) => i.status === 'critical').length);

  readonly filteredInventory = computed(() => {
    const filter = this.statusFilter();
    const q = this.searchQuery.toLowerCase().trim();

    return this.hospitality.inventory().filter((item) => {
      if (filter === 'low' && item.status !== 'low' && item.status !== 'critical') return false;
      if (filter === 'healthy' && item.status !== 'healthy') return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.supplierName.toLowerCase().includes(q);
    });
  });

  constructor(
    public hospitality: HospitalityService,
    public entitlements: EntitlementsService,
    public roleService: RoleService,
    private toast: ToastService,
    private exporter: ExportService
  ) {}

  openAdjustModal(item: InventoryItem) {
    this.adjustingItem.set(item);
    this.adjustAmount = 5;
    this.adjustReason = 'Restock Delivery';
  }

  confirmStockAdjustment() {
    const item = this.adjustingItem();
    if (item && this.adjustAmount !== 0) {
      this.hospitality.adjustInventoryStock(item.id, this.adjustAmount, this.adjustReason);
      this.adjustingItem.set(null);
    }
  }

  sendPurchaseOrder() {
    this.toast.success('Purchase Order Dispatched', `PO for ${this.poQty} of ${this.poItemName} transmitted to ${this.poSupplier}.`);
    this.showPoModal.set(false);
  }

  exportCsv() {
    const headers = ['Ingredient Name', 'Category', 'Current Stock', 'Unit', 'Min Threshold', 'Unit Cost (INR)', 'Supplier', 'Status'];
    const rows = this.hospitality.inventory().map((i) => [
      i.name,
      i.category,
      i.currentStock,
      i.unit,
      i.minStock,
      i.unitCost,
      i.supplierName,
      i.status,
    ]);
    this.exporter.downloadCsv('HospitalityOS-Inventory-Stock', headers, rows);
  }
}
