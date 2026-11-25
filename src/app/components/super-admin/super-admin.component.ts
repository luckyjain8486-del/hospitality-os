import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalityService } from '../../services/hospitality.service';
import { EntitlementsService } from '../../services/entitlements.service';
import { FeatureEntitlement, Tenant } from '../../models/hospitality.model';
import { IconComponent } from '../shared/icon.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Super Admin Header -->
      <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500 text-white tracking-wider">
                PLATFORM SUPER ADMIN CONTROL PLANE
              </span>
              <span class="text-xs text-slate-300">HospitalityOS Global Fleet Management</span>
            </div>
            <h1 class="text-2xl font-black tracking-tight">SaaS Command Center & Entitlements</h1>
            <p class="text-xs text-slate-300 max-w-xl">
              Control SaaS tenant provisioning, live feature matrix toggles, billing MRR, and global platform telemetry.
            </p>
          </div>

          <div class="flex items-center gap-2.5">
            <button
              (click)="hospitality.toggleSuperAdmin()"
              class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2"
            >
              <app-icon name="store" [size]="14"></app-icon>
              <span>Switch to Restaurant View</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Platform Fleet Metrics -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Total Tenants</span>
          <div class="text-2xl font-extrabold text-slate-900 mt-1">48</div>
          <span class="text-[11px] text-emerald-600 font-semibold">+4 this month</span>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Active Subs</span>
          <div class="text-2xl font-extrabold text-emerald-600 mt-1">44</div>
          <span class="text-[11px] text-slate-400">91.6% paying</span>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Monthly MRR</span>
          <div class="text-2xl font-extrabold text-indigo-700 mt-1">₹3,42,000</div>
          <span class="text-[11px] text-emerald-600 font-semibold">↑ 18.2% ARR run-rate</span>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Total Outlets</span>
          <div class="text-2xl font-extrabold text-slate-900 mt-1">142</div>
          <span class="text-[11px] text-slate-400">Across 12 cities</span>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Platform Users</span>
          <div class="text-2xl font-extrabold text-slate-900 mt-1">890</div>
          <span class="text-[11px] text-slate-400">Captains, Chefs, GMs</span>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Trial Accounts</span>
          <div class="text-2xl font-extrabold text-amber-600 mt-1">4</div>
          <span class="text-[11px] text-amber-700 font-semibold">14-day trials active</span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div class="flex items-center gap-1 text-xs font-semibold">
          <button
            (click)="activeTab.set('entitlements')"
            class="px-4 py-2 rounded-xl transition-all"
            [ngClass]="activeTab() === 'entitlements' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            ★ Feature Entitlement Matrix
          </button>
          <button
            (click)="activeTab.set('tenants')"
            class="px-4 py-2 rounded-xl transition-all"
            [ngClass]="activeTab() === 'tenants' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            Tenant Organizations ({{ hospitality.tenants().length }})
          </button>
          <button
            (click)="activeTab.set('audit')"
            class="px-4 py-2 rounded-xl transition-all"
            [ngClass]="activeTab() === 'audit' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            Platform Audit Trail
          </button>
        </div>
      </div>

      <!-- TAB 1: FEATURE ENTITLEMENT MATRIX (THE HERO SUPER ADMIN SCREEN) -->
      @if (activeTab() === 'entitlements') {
        <div class="space-y-4">
          <div class="bg-indigo-50/70 border border-indigo-200/80 p-4 rounded-2xl flex items-center justify-between text-xs">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <app-icon name="lock" [size]="16"></app-icon>
              </div>
              <div>
                <h4 class="font-bold text-indigo-950">Live SaaS Entitlement Controller</h4>
                <p class="text-indigo-700 mt-0.5">
                  Toggling any feature checkbox immediately locks or unlocks that capability in the tenant's app view.
                </p>
              </div>
            </div>

            <button
              (click)="entitlements.resetEntitlements(); toast.success('Entitlements Reset', 'Matrix restored to default.')"
              class="px-3 py-1.5 rounded-xl border border-indigo-300 bg-white text-indigo-900 font-semibold hover:bg-indigo-50"
            >
              Reset to Standard Defaults
            </button>
          </div>

          <!-- Feature Matrix Table Grouped by Module -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600">
                <thead class="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th class="px-5 py-3.5">Platform Capability / Feature</th>
                    <th class="px-5 py-3.5">Module Group</th>
                    <th class="px-5 py-3.5 text-center">Starter Plan (₹2.4k)</th>
                    <th class="px-5 py-3.5 text-center">Growth Plan (₹6.9k)</th>
                    <th class="px-5 py-3.5 text-center">Enterprise Plan (₹18.9k)</th>
                    <th class="px-5 py-3.5 text-right">Live Preview Test</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (feat of entitlements.entitlements(); track feat.id) {
                    <tr class="hover:bg-slate-50/60 transition-colors">
                      <td class="px-5 py-3.5">
                        <div class="font-bold text-slate-900 text-xs">{{ feat.name }}</div>
                        <span class="text-[11px] text-slate-400 block max-w-sm leading-tight">{{ feat.description }}</span>
                      </td>
                      <td class="px-5 py-3.5">
                        <span
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          [ngClass]="{
                            'bg-blue-100 text-blue-800': feat.module === 'Restaurant',
                            'bg-purple-100 text-purple-800': feat.module === 'Hotel',
                            'bg-emerald-100 text-emerald-800': feat.module === 'CRM',
                            'bg-slate-100 text-slate-800': feat.module === 'Platform'
                          }"
                        >
                          {{ feat.module }}
                        </span>
                      </td>

                      <!-- Starter Toggle -->
                      <td class="px-5 py-3.5 text-center">
                        <button
                          (click)="entitlements.toggleFeatureForPlan(feat.id, 'starter')"
                          class="w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer"
                          [ngClass]="feat.starter ? 'bg-emerald-500 text-white shadow-2xs' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'"
                        >
                          <app-icon [name]="feat.starter ? 'check' : 'x'" [size]="14"></app-icon>
                        </button>
                      </td>

                      <!-- Growth Toggle -->
                      <td class="px-5 py-3.5 text-center">
                        <button
                          (click)="entitlements.toggleFeatureForPlan(feat.id, 'growth')"
                          class="w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer"
                          [ngClass]="feat.growth ? 'bg-emerald-500 text-white shadow-2xs' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'"
                        >
                          <app-icon [name]="feat.growth ? 'check' : 'x'" [size]="14"></app-icon>
                        </button>
                      </td>

                      <!-- Enterprise Toggle -->
                      <td class="px-5 py-3.5 text-center">
                        <button
                          (click)="entitlements.toggleFeatureForPlan(feat.id, 'enterprise')"
                          class="w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer"
                          [ngClass]="feat.enterprise ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'"
                        >
                          <app-icon [name]="feat.enterprise ? 'check' : 'x'" [size]="14"></app-icon>
                        </button>
                      </td>

                      <!-- Status & Impersonate -->
                      <td class="px-5 py-3.5 text-right">
                        <span
                          class="text-[11px] font-bold"
                          [ngClass]="entitlements.isFeatureEnabled(feat.id) ? 'text-emerald-600' : 'text-rose-500'"
                        >
                          {{ entitlements.isFeatureEnabled(feat.id) ? '● Active on Current Plan' : '🔒 Locked (Upgrade Screen)' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- TAB 2: TENANT MANAGEMENT -->
      @if (activeTab() === 'tenants') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-sm text-slate-900">Provisioned Hospitality Brands</h3>
              <p class="text-xs text-slate-500">Corporate entities, subscribed plans, outlet footprints and MRR</p>
            </div>
          </div>

          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th class="px-5 py-3.5">Organization / Tenant</th>
                <th class="px-5 py-3.5">Plan Tier</th>
                <th class="px-5 py-3.5">Outlets Licensed</th>
                <th class="px-5 py-3.5">Active Staff</th>
                <th class="px-5 py-3.5">MRR Contribution</th>
                <th class="px-5 py-3.5">Status</th>
                <th class="px-5 py-3.5 text-right">Admin Controls</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (tenant of hospitality.tenants(); track tenant.id) {
                <tr class="hover:bg-slate-50/60 transition-colors">
                  <td class="px-5 py-3.5">
                    <div class="font-bold text-slate-900 text-xs">{{ tenant.name }}</div>
                    <span class="text-[10px] text-slate-400 block">{{ tenant.legalEntity }} · {{ tenant.contactEmail }}</span>
                  </td>
                  <td class="px-5 py-3.5">
                    <span
                      class="px-2 py-0.5 rounded font-bold text-[10px] uppercase"
                      [ngClass]="{
                        'bg-slate-100 text-slate-800': tenant.plan === 'Starter',
                        'bg-emerald-100 text-emerald-800': tenant.plan === 'Growth',
                        'bg-indigo-100 text-indigo-800': tenant.plan === 'Enterprise'
                      }"
                    >
                      {{ tenant.plan }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 font-bold text-slate-800">
                    {{ tenant.outletsCount }} Outlets
                  </td>
                  <td class="px-5 py-3.5 font-medium text-slate-700">
                    {{ tenant.activeUsers }} Users
                  </td>
                  <td class="px-5 py-3.5 font-extrabold text-slate-900">
                    ₹{{ tenant.mrr | number:'1.0-0' }} / mo
                  </td>
                  <td class="px-5 py-3.5">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                      [ngClass]="tenant.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : tenant.status === 'Trial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'"
                    >
                      {{ tenant.status }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 text-right">
                    <button
                      (click)="toggleTenantStatus(tenant)"
                      class="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 text-[11px]"
                    >
                      {{ tenant.status === 'Active' ? 'Suspend' : 'Activate' }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- TAB 3: PLATFORM AUDIT TRAIL -->
      @if (activeTab() === 'audit') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <h3 class="font-bold text-sm text-slate-900 mb-2">Immutable Security & Governance Audit Logs</h3>
          <div class="space-y-2 text-xs font-mono">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span class="text-slate-800">[2026-11-24 13:14:02] SuperAdmin Lucky Jain toggled feature feat-kds -> ENABLED for Growth Tier</span>
              <span class="text-slate-400">IP: 103.24.188.12 (Jaipur, IN)</span>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span class="text-slate-800">[2026-11-24 12:48:19] Order #HOS-2481 settled for ₹1,265 via UPI (Ref: 432890123)</span>
              <span class="text-slate-400">POS-TERMINAL-01</span>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span class="text-slate-800">[2026-11-24 11:30:45] Tenant The Royal Amber Group upgraded subscription to Growth Plan</span>
              <span class="text-slate-400">Gateway: Razorpay Subscriptions</span>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span class="text-slate-800">[2026-11-24 09:15:00] Daily Night Audit & Housekeeping Reset completed across 32 Rooms</span>
              <span class="text-slate-400">PMS-CRON-ENGINE</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class SuperAdminComponent {
  activeTab = signal<'entitlements' | 'tenants' | 'audit'>('entitlements');

  constructor(
    public hospitality: HospitalityService,
    public entitlements: EntitlementsService,
    public toast: ToastService
  ) {}

  toggleTenantStatus(tenant: Tenant) {
    tenant.status = tenant.status === 'Active' ? 'Suspended' : 'Active';
    this.toast.info('Tenant Status Changed', `${tenant.name} is now ${tenant.status}`);
  }
}
