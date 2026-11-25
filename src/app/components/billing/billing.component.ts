import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntitlementsService } from '../../services/entitlements.service';
import { RoleService } from '../../services/role.service';
import { IconComponent } from '../shared/icon.component';
import { RoleGuardGateComponent } from '../shared/role-guard-gate.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, IconComponent, RoleGuardGateComponent],
  template: `
    @if (!roleService.isManager()) {
      <app-role-guard-gate requiredRole="General Manager"></app-role-guard-gate>
    } @else {
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Subscription & SaaS Billing</h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Active Subscription
              </span>
            </div>
            <p class="text-sm text-slate-500 mt-0.5">
              Manage your HospitalityOS plan, outlet quotas, feature entitlements and billing receipts.
            </p>
          </div>

        <div class="flex items-center gap-2.5">
          <span class="text-xs font-mono font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            Next renewal: 14 Dec 2026
          </span>
        </div>
      </div>

      <!-- Current Plan Status Banner -->
      <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div class="absolute right-0 top-0 w-80 h-full bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-emerald-400 text-slate-950">
                CURRENT TIER
              </span>
              <span class="text-xs text-slate-300">Renews automatically via UPI Autopay</span>
            </div>
            <h2 class="text-2xl font-black tracking-tight">{{ entitlements.currentPlan() }} Commercial Plan</h2>
            <p class="text-xs text-slate-300 max-w-xl leading-relaxed">
              Powering multi-outlet restaurant dining, live kitchen display screens, ingredient inventory deductions, and guest CRM rewards.
            </p>
          </div>

          <div class="flex items-center gap-3">
            @if (entitlements.currentPlan() !== 'Enterprise') {
              <button
                (click)="upgradeToEnterprise()"
                class="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <app-icon name="sparkles" [size]="15"></app-icon>
                <span>Upgrade to Enterprise (PMS + All)</span>
              </button>
            } @else {
              <div class="px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs border border-white/20">
                ✓ Full Enterprise Tier Active
              </div>
            }
          </div>
        </div>

        <!-- Usage Meters -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
          <div>
            <div class="flex justify-between font-semibold mb-1 text-slate-300">
              <span>Licensed Outlets:</span>
              <span class="text-white font-bold">3 of 5 used</span>
            </div>
            <div class="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div class="bg-emerald-400 h-full rounded-full" style="width: 60%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between font-semibold mb-1 text-slate-300">
              <span>Staff User Accounts:</span>
              <span class="text-white font-bold">14 of 20 seats</span>
            </div>
            <div class="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div class="bg-indigo-400 h-full rounded-full" style="width: 70%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between font-semibold mb-1 text-slate-300">
              <span>Monthly Dining Orders:</span>
              <span class="text-white font-bold">1,842 of 5,000</span>
            </div>
            <div class="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div class="bg-amber-400 h-full rounded-full" style="width: 37%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Plan Pricing Cards -->
      <div>
        <h2 class="text-base font-bold text-slate-900 mb-4">Available HospitalityOS Plans</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Starter -->
          <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
            [ngClass]="{ 'ring-2 ring-slate-900': entitlements.currentPlan() === 'Starter' }">
            <div>
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold text-base text-slate-900">Starter</h3>
                @if (entitlements.currentPlan() === 'Starter') {
                  <span class="text-[10px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">Active</span>
                }
              </div>
              <div class="text-2xl font-black text-slate-900 mb-1">₹2,499 <span class="text-xs font-normal text-slate-400">/ month</span></div>
              <p class="text-xs text-slate-500 mb-5">Ideal for standalone cafés and small diners needing quick POS.</p>

              <ul class="space-y-2.5 text-xs text-slate-700">
                <li class="flex items-center gap-2">✓ High-speed POS Terminal</li>
                <li class="flex items-center gap-2">✓ Menu Management & Variants</li>
                <li class="flex items-center gap-2">✓ Basic Daily Sales Reports</li>
                <li class="flex items-center gap-2 text-slate-400">✗ Kitchen Display (KDS)</li>
                <li class="flex items-center gap-2 text-slate-400">✗ Inventory & Stock Deduction</li>
                <li class="flex items-center gap-2 text-slate-400">✗ Hotel PMS & Rooms</li>
              </ul>
            </div>

            <button
              (click)="changePlan('Starter')"
              class="w-full py-2.5 mt-6 rounded-xl border border-slate-300 font-bold text-xs hover:bg-slate-50 text-slate-800"
            >
              {{ entitlements.currentPlan() === 'Starter' ? 'Current Tier' : 'Downgrade to Starter' }}
            </button>
          </div>

          <!-- Growth -->
          <div class="bg-white rounded-3xl border-2 border-emerald-500 p-6 shadow-md flex flex-col justify-between relative"
            [ngClass]="{ 'ring-2 ring-emerald-500': entitlements.currentPlan() === 'Growth' }">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-extrabold text-[10px] uppercase px-3 py-0.5 rounded-full shadow-xs">
              Recommended for Multi-Outlet
            </div>

            <div>
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold text-base text-slate-900">Growth</h3>
                @if (entitlements.currentPlan() === 'Growth') {
                  <span class="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Current Plan</span>
                }
              </div>
              <div class="text-2xl font-black text-slate-900 mb-1">₹6,999 <span class="text-xs font-normal text-slate-400">/ month</span></div>
              <p class="text-xs text-slate-500 mb-5">Everything needed to scale up to 5 restaurant outlets.</p>

              <ul class="space-y-2.5 text-xs text-slate-700">
                <li class="flex items-center gap-2 font-semibold text-slate-900">✓ Everything in Starter</li>
                <li class="flex items-center gap-2">✓ Live Kitchen Display (KDS)</li>
                <li class="flex items-center gap-2">✓ Raw Material Inventory & Wastage</li>
                <li class="flex items-center gap-2">✓ Guest CRM & Loyalty Coupons</li>
                <li class="flex items-center gap-2">✓ Hotel PMS Front Desk (Standard)</li>
                <li class="flex items-center gap-2">✓ 5 Outlets Licensed</li>
              </ul>
            </div>

            <button
              (click)="changePlan('Growth')"
              class="w-full py-2.5 mt-6 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
            >
              {{ entitlements.currentPlan() === 'Growth' ? 'Current Active Tier' : 'Switch to Growth' }}
            </button>
          </div>

          <!-- Enterprise -->
          <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
            [ngClass]="{ 'ring-2 ring-indigo-600': entitlements.currentPlan() === 'Enterprise' }">
            <div>
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold text-base text-slate-900">Enterprise</h3>
                @if (entitlements.currentPlan() === 'Enterprise') {
                  <span class="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">Active</span>
                }
              </div>
              <div class="text-2xl font-black text-slate-900 mb-1">₹18,999 <span class="text-xs font-normal text-slate-400">/ month</span></div>
              <p class="text-xs text-slate-500 mb-5">For hotel chains, luxury resorts and high-volume dining groups.</p>

              <ul class="space-y-2.5 text-xs text-slate-700">
                <li class="flex items-center gap-2 font-semibold text-slate-900">✓ Everything in Growth</li>
                <li class="flex items-center gap-2">✓ Unlimited Outlets & Locations</li>
                <li class="flex items-center gap-2">✓ Full Hotel PMS & Guest Folio Night Audit</li>
                <li class="flex items-center gap-2">✓ Custom API & Accounting Webhooks</li>
                <li class="flex items-center gap-2">✓ Granular RBAC Permissions & Audit Logs</li>
                <li class="flex items-center gap-2">✓ 24/7 Dedicated Account Manager</li>
              </ul>
            </div>

            <button
              (click)="changePlan('Enterprise')"
              class="w-full py-2.5 mt-6 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700"
            >
              {{ entitlements.currentPlan() === 'Enterprise' ? 'Current Tier' : 'Upgrade to Enterprise' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Invoice History Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-5 border-b border-slate-100">
          <h3 class="font-bold text-sm text-slate-900">Invoice History</h3>
          <p class="text-xs text-slate-500">Download GST tax invoices for business accounting</p>
        </div>
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th class="px-5 py-3">Invoice Number</th>
              <th class="px-5 py-3">Billing Period</th>
              <th class="px-5 py-3">Plan Details</th>
              <th class="px-5 py-3">Amount (INR)</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3 text-right">Receipt</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr class="hover:bg-slate-50/60">
              <td class="px-5 py-3.5 font-bold font-mono text-slate-900">INV-2026-11-042</td>
              <td class="px-5 py-3.5">14 Nov 2026 – 13 Dec 2026</td>
              <td class="px-5 py-3.5 font-semibold text-slate-800">Growth Plan (5 Outlets)</td>
              <td class="px-5 py-3.5 font-bold text-slate-900">₹6,999.00</td>
              <td class="px-5 py-3.5"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">PAID</span></td>
              <td class="px-5 py-3.5 text-right">
                <button (click)="downloadReceipt('INV-2026-11-042')" class="text-indigo-600 font-semibold hover:underline">Download PDF</button>
              </td>
            </tr>
            <tr class="hover:bg-slate-50/60">
              <td class="px-5 py-3.5 font-bold font-mono text-slate-900">INV-2026-10-039</td>
              <td class="px-5 py-3.5">14 Oct 2026 – 13 Nov 2026</td>
              <td class="px-5 py-3.5 font-semibold text-slate-800">Growth Plan (5 Outlets)</td>
              <td class="px-5 py-3.5 font-bold text-slate-900">₹6,999.00</td>
              <td class="px-5 py-3.5"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">PAID</span></td>
              <td class="px-5 py-3.5 text-right">
                <button (click)="downloadReceipt('INV-2026-10-039')" class="text-indigo-600 font-semibold hover:underline">Download PDF</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  }
  `,
})
export class BillingComponent {
  constructor(
    public entitlements: EntitlementsService,
    public roleService: RoleService,
    private toast: ToastService
  ) {}

  upgradeToEnterprise() {
    this.entitlements.setPlan('Enterprise');
    this.toast.success('Upgraded to Enterprise', 'Enterprise features, PMS Folio, and multi-unit governance unlocked!');
  }

  changePlan(plan: 'Starter' | 'Growth' | 'Enterprise') {
    this.entitlements.setPlan(plan);
    this.toast.success('Plan Updated', `HospitalityOS tier changed to ${plan}.`);
  }

  downloadReceipt(invNum: string) {
    this.toast.info('Downloading Invoice', `Generated official tax invoice PDF for ${invNum}.`);
  }
}
