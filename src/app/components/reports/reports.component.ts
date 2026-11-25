import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalityService } from '../../services/hospitality.service';
import { RoleService } from '../../services/role.service';
import { IconComponent } from '../shared/icon.component';
import { RoleGuardGateComponent } from '../shared/role-guard-gate.component';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, RoleGuardGateComponent],
  template: `
    @if (!roleService.hasPermission('canViewReports')) {
      <app-role-guard-gate requiredRole="Cashier or General Manager"></app-role-guard-gate>
    } @else {
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Executive Reports & Analytics</h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Tax & P&L Reconciled
              </span>
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-900 border-emerald-200">
                {{ roleService.currentUser().name }} ({{ roleService.currentRole() | uppercase }})
              </span>
            </div>
          <p class="text-sm text-slate-500 mt-0.5">
            Cross-outlet sales performance, menu profitability margins, tax compliance and guest retention.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            (click)="exportCurrentReport()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm cursor-pointer"
          >
            <app-icon name="download" [size]="15" class="text-emerald-400"></app-icon>
            <span>Export Executive Report (CSV)</span>
          </button>
        </div>
      </div>

      <!-- Date Range & Report Category Selector -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Report Types -->
        <div class="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 overflow-x-auto">
          <button
            (click)="activeReport.set('sales')"
            class="px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
            [ngClass]="activeReport() === 'sales' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'"
          >
            Sales Performance
          </button>
          <button
            (click)="activeReport.set('outlets')"
            class="px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
            [ngClass]="activeReport() === 'outlets' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'"
          >
            Outlet Comparison
          </button>
          <button
            (click)="activeReport.set('tax')"
            class="px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
            [ngClass]="activeReport() === 'tax' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'"
          >
            GST & Taxes (5%/18%)
          </button>
          <button
            (click)="activeReport.set('products')"
            class="px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
            [ngClass]="activeReport() === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'"
          >
            Dish Profitability
          </button>
        </div>

        <!-- Date Filter Buttons -->
        <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs font-medium text-slate-600">
          <button
            (click)="timeframe.set('today')"
            class="px-2.5 py-1 rounded-lg transition-all"
            [ngClass]="timeframe() === 'today' ? 'bg-white font-bold text-slate-900 shadow-xs' : ''"
          >
            Today
          </button>
          <button
            (click)="timeframe.set('week')"
            class="px-2.5 py-1 rounded-lg transition-all"
            [ngClass]="timeframe() === 'week' ? 'bg-white font-bold text-slate-900 shadow-xs' : ''"
          >
            Last 7 Days
          </button>
          <button
            (click)="timeframe.set('month')"
            class="px-2.5 py-1 rounded-lg transition-all"
            [ngClass]="timeframe() === 'month' ? 'bg-white font-bold text-slate-900 shadow-xs' : ''"
          >
            This Month
          </button>
        </div>
      </div>

      <!-- REPORT 1: SALES PERFORMANCE -->
      @if (activeReport() === 'sales') {
        <div class="space-y-6">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs text-slate-500 font-medium">Gross Dining Revenue</span>
              <div class="text-xl font-bold text-slate-900 mt-1">₹1,84,500.00</div>
              <span class="text-[11px] text-emerald-600 font-semibold">+14.2% vs target</span>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs text-slate-500 font-medium">Hotel Room Revenue</span>
              <div class="text-xl font-bold text-slate-900 mt-1">₹1,75,950.00</div>
              <span class="text-[11px] text-indigo-600 font-semibold">88% occupancy</span>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs text-slate-500 font-medium">Combined Turnover</span>
              <div class="text-xl font-bold text-emerald-600 mt-1">₹3,60,450.00</div>
              <span class="text-[11px] text-slate-400">Total blended gross</span>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs text-slate-500 font-medium">Net Profit (EBITDA Est)</span>
              <div class="text-xl font-bold text-slate-900 mt-1">₹1,18,940.00</div>
              <span class="text-[11px] text-emerald-600 font-semibold">33.0% net margin</span>
            </div>
          </div>

          <!-- Trend Bar Chart -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 class="text-sm font-bold text-slate-900 mb-1">Sales Breakdown by Outlet (Today)</h3>
            <p class="text-xs text-slate-500 mb-6">Real-time revenue split across Jaipur units</p>

            <div class="space-y-4 text-xs">
              <div>
                <div class="flex justify-between font-bold mb-1">
                  <span>Jaipur Central - MI Road</span>
                  <span class="text-slate-900">₹98,400 (53.3%)</span>
                </div>
                <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div class="bg-slate-900 h-full rounded-full" style="width: 53.3%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between font-bold mb-1">
                  <span>Malviya Nagar - WTP Mall</span>
                  <span class="text-slate-900">₹54,600 (29.6%)</span>
                </div>
                <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full" style="width: 29.6%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between font-bold mb-1">
                  <span>Vaishali Nagar - Queens Road</span>
                  <span class="text-slate-900">₹31,500 (17.1%)</span>
                </div>
                <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div class="bg-amber-500 h-full rounded-full" style="width: 17.1%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- REPORT 2: OUTLET COMPARISON -->
      @if (activeReport() === 'outlets') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="p-5 border-b border-slate-100">
            <h3 class="font-bold text-sm text-slate-900">Outlet Performance Matrix</h3>
            <p class="text-xs text-slate-500">Benchmark sales, covers, average ticket size and staff capacity</p>
          </div>
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th class="px-5 py-3">Outlet Unit</th>
                <th class="px-5 py-3">Location</th>
                <th class="px-5 py-3">Tables</th>
                <th class="px-5 py-3">Staff Strength</th>
                <th class="px-5 py-3">Today Revenue</th>
                <th class="px-5 py-3">Avg Order Value</th>
                <th class="px-5 py-3">Satisfaction Rating</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr class="hover:bg-slate-50/60">
                <td class="px-5 py-3.5 font-bold text-slate-900">Jaipur Central - MI Road</td>
                <td class="px-5 py-3.5 text-slate-500">MI Road, Jaipur</td>
                <td class="px-5 py-3.5 font-semibold text-slate-800">24 Tables</td>
                <td class="px-5 py-3.5">38 Staff Members</td>
                <td class="px-5 py-3.5 font-bold text-emerald-600">₹98,400</td>
                <td class="px-5 py-3.5 font-semibold text-slate-900">₹812</td>
                <td class="px-5 py-3.5 font-bold text-amber-500">★ 4.8 / 5.0</td>
              </tr>
              <tr class="hover:bg-slate-50/60">
                <td class="px-5 py-3.5 font-bold text-slate-900">Malviya Nagar - WTP Mall</td>
                <td class="px-5 py-3.5 text-slate-500">JLN Marg, Jaipur</td>
                <td class="px-5 py-3.5 font-semibold text-slate-800">18 Tables</td>
                <td class="px-5 py-3.5">26 Staff Members</td>
                <td class="px-5 py-3.5 font-bold text-emerald-600">₹54,600</td>
                <td class="px-5 py-3.5 font-semibold text-slate-900">₹695</td>
                <td class="px-5 py-3.5 font-bold text-amber-500">★ 4.7 / 5.0</td>
              </tr>
              <tr class="hover:bg-slate-50/60">
                <td class="px-5 py-3.5 font-bold text-slate-900">Vaishali Nagar - Queens Road</td>
                <td class="px-5 py-3.5 text-slate-500">Amrapali Marg, Jaipur</td>
                <td class="px-5 py-3.5 font-semibold text-slate-800">16 Tables</td>
                <td class="px-5 py-3.5">22 Staff Members</td>
                <td class="px-5 py-3.5 font-bold text-emerald-600">₹31,500</td>
                <td class="px-5 py-3.5 font-semibold text-slate-900">₹620</td>
                <td class="px-5 py-3.5 font-bold text-amber-500">★ 4.6 / 5.0</td>
              </tr>
            </tbody>
          </table>
        </div>
      }

      <!-- REPORT 3: TAX & GST COMPLIANCE -->
      @if (activeReport() === 'tax') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-sm text-slate-900">GST Compliance & Tax Ledger</h3>
              <p class="text-xs text-slate-500">Detailed breakdown of Central GST (CGST) and State GST (SGST)</p>
            </div>
            <span class="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold text-xs">
              GSTR-1 Ready
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span class="text-xs text-slate-500 font-medium">Food & Beverage (5% GST)</span>
              <div class="text-lg font-bold text-slate-900 mt-1">₹8,785.70</div>
              <span class="text-[11px] text-slate-400">CGST ₹4,392.85 | SGST ₹4,392.85</span>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span class="text-xs text-slate-500 font-medium">Hotel Stays (12% / 18% GST)</span>
              <div class="text-lg font-bold text-slate-900 mt-1">₹26,392.50</div>
              <span class="text-[11px] text-slate-400">CGST ₹13,196.25 | SGST ₹13,196.25</span>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span class="text-xs text-slate-500 font-medium">Total Tax Collected</span>
              <div class="text-lg font-bold text-indigo-700 mt-1">₹35,178.20</div>
              <span class="text-[11px] text-emerald-600 font-semibold">100% verified against invoices</span>
            </div>
          </div>
        </div>
      }

      <!-- REPORT 4: DISH PROFITABILITY -->
      @if (activeReport() === 'products') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="p-5 border-b border-slate-100">
            <h3 class="font-bold text-sm text-slate-900">Menu Engineering & Margin Analysis</h3>
            <p class="text-xs text-slate-500">Stars, Workhorses, Puzzles and Dogs analysis</p>
          </div>
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th class="px-5 py-3">Menu Dish</th>
                <th class="px-5 py-3">Category</th>
                <th class="px-5 py-3">Price</th>
                <th class="px-5 py-3">Cost</th>
                <th class="px-5 py-3">Gross Margin</th>
                <th class="px-5 py-3">Classification</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (item of hospitality.menuItems(); track item.id) {
                <tr class="hover:bg-slate-50/60">
                  <td class="px-5 py-3.5 font-bold text-slate-900">{{ item.name }}</td>
                  <td class="px-5 py-3.5 uppercase text-[10px]">{{ item.category }}</td>
                  <td class="px-5 py-3.5 font-semibold text-slate-900">₹{{ item.price }}</td>
                  <td class="px-5 py-3.5 text-slate-500">₹{{ item.costPrice }}</td>
                  <td class="px-5 py-3.5 font-bold text-emerald-600">
                    {{ Math.round(((item.price - item.costPrice) / item.price) * 100) }}%
                  </td>
                  <td class="px-5 py-3.5">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                      [ngClass]="item.isBestseller ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'"
                    >
                      {{ item.isBestseller ? '★ Star Menu Item' : 'Solid Contributor' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  }
  `,
})
export class ReportsComponent {
  activeReport = signal<'sales' | 'outlets' | 'tax' | 'products'>('sales');
  timeframe = signal<'today' | 'week' | 'month'>('today');

  readonly Math = Math;

  constructor(
    public hospitality: HospitalityService,
    public roleService: RoleService,
    private exporter: ExportService
  ) {}

  exportCurrentReport() {
    const headers = ['Category', 'Metric', 'Value (INR)', 'Growth Indicator'];
    const rows = [
      ['Gross Dining Revenue', 'Total Dining Sales', 184500, '+14.2%'],
      ['Hotel Rooms Revenue', 'Total Stay Sales', 175950, '88% Occupancy'],
      ['Combined Gross Turnover', 'Total Turn', 360450, 'Reconciled'],
      ['Net Profit Estimate', 'EBITDA (33%)', 118940, '+2.4% margin'],
      ['Central GST (CGST)', 'Tax collected', 17589.1, 'GSTIN Verified'],
      ['State GST (SGST)', 'Tax collected', 17589.1, 'GSTIN Verified'],
    ];
    this.exporter.downloadCsv('HospitalityOS-Executive-Report', headers, rows);
  }
}
