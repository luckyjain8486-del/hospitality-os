import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HospitalityService } from '../../services/hospitality.service';
import { EntitlementsService } from '../../services/entitlements.service';
import { RoleService } from '../../services/role.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside class="w-64 bg-white border-r border-slate-200/90 h-screen flex flex-col flex-shrink-0 select-none overflow-y-auto">
      <!-- Logo Header -->
      <div class="p-5 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-[#172B4D] flex items-center justify-center text-white font-bold text-base shadow-sm ring-2 ring-emerald-500/20">
            <span class="text-emerald-400 font-extrabold tracking-tight">H</span>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-slate-900 text-sm tracking-tight">HospitalityOS</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                [ngClass]="hospitality.isSuperAdmin() ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-800'">
                {{ hospitality.isSuperAdmin() ? 'Platform' : entitlements.currentPlan() }}
              </span>
            </div>
            <p class="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">
              PetPooja RBAC Engine
            </p>
          </div>
        </div>
      </div>

      <!-- Navigation Content -->
      <nav class="flex-1 px-3 py-4 space-y-5 text-xs font-medium">
        @if (hospitality.isSuperAdmin()) {
          <!-- SUPER ADMIN NAVIGATION (Only in Super Admin Mode) -->
          <div>
            <div class="px-3 pb-2 text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <app-icon name="shield" [size]="12"></app-icon>
              <span>Platform Super Admin</span>
            </div>
            <div class="space-y-1">
              <a
                routerLink="/super-admin"
                routerLinkActive="bg-indigo-50/80 text-indigo-900 font-semibold"
                [routerLinkActiveOptions]="{ exact: true }"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <app-icon name="dashboard" [size]="16" class="text-indigo-600"></app-icon>
                <span>Platform Dashboard</span>
              </a>
              <a
                routerLink="/super-admin/tenants"
                routerLinkActive="bg-indigo-50/80 text-indigo-900 font-semibold"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <app-icon name="store" [size]="16" class="text-indigo-600"></app-icon>
                <span>Tenants & Outlets</span>
              </a>
              <a
                routerLink="/super-admin/entitlements"
                routerLinkActive="bg-indigo-50/80 text-indigo-900 font-semibold"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <app-icon name="lock" [size]="16" class="text-indigo-600"></app-icon>
                <span>Feature Entitlements</span>
              </a>
              <a
                routerLink="/super-admin/plans"
                routerLinkActive="bg-indigo-50/80 text-indigo-900 font-semibold"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <app-icon name="tag" [size]="16" class="text-indigo-600"></app-icon>
                <span>SaaS Plans & Pricing</span>
              </a>
              <a
                routerLink="/super-admin/analytics"
                routerLinkActive="bg-indigo-50/80 text-indigo-900 font-semibold"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <app-icon name="reports" [size]="16" class="text-indigo-600"></app-icon>
                <span>Platform MRR & Logs</span>
              </a>
            </div>
          </div>
        } @else if (roleService.isWaiter()) {
          <!-- ================= ROLE: WAITER / CAPTAIN ================= -->
          <div>
            <div class="px-3 pb-2 text-[10px] font-black text-amber-700 uppercase tracking-wider flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <span>🍽️</span>
                <span>Captain Floor Desk</span>
              </span>
              <span class="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono text-[9px]">WAITER</span>
            </div>

            <div class="space-y-1">
              <a
                routerLink="/tables"
                routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <div class="flex items-center gap-2.5">
                  <app-icon name="tables" [size]="16" class="text-amber-500"></app-icon>
                  <span>Floor & Tables</span>
                </div>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                  SEAT
                </span>
              </a>

              <a
                routerLink="/pos"
                routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <div class="flex items-center gap-2.5">
                  <app-icon name="pos" [size]="16" class="text-emerald-500"></app-icon>
                  <span>Punch Order (KOT)</span>
                </div>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  FAST
                </span>
              </a>

              <a
                routerLink="/orders"
                routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <div class="flex items-center gap-2.5">
                  <app-icon name="orders" [size]="16"></app-icon>
                  <span>Active Table Tickets</span>
                </div>
                <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {{ hospitality.orders().length }}
                </span>
              </a>

              <a
                routerLink="/menu"
                routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <app-icon name="menu" [size]="16"></app-icon>
                <span>Menu & Recipe Guide</span>
              </a>
            </div>
          </div>
        } @else if (roleService.isChef()) {
          <!-- ================= ROLE: CHEF (KITCHEN) ================= -->
          <div>
            <div class="px-3 pb-2 text-[10px] font-black text-blue-700 uppercase tracking-wider flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <span>👨‍🍳</span>
                <span>Hot Kitchen Line</span>
              </span>
              <span class="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono text-[9px]">CHEF</span>
            </div>

            <div class="space-y-1">
              <a
                routerLink="/kds"
                routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <div class="flex items-center gap-2.5">
                  <app-icon name="kds" [size]="16" class="text-amber-500"></app-icon>
                  <span>Kitchen Display (KDS)</span>
                </div>
                <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              </a>

              <a
                routerLink="/orders"
                routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <div class="flex items-center gap-2.5">
                  <app-icon name="orders" [size]="16"></app-icon>
                  <span>Kitchen Orders Queue</span>
                </div>
                <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  LIVE
                </span>
              </a>

              <a
                routerLink="/menu"
                routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <div class="flex items-center gap-2.5">
                  <app-icon name="menu" [size]="16"></app-icon>
                  <span>86 Item (Sold-Out) Toggle</span>
                </div>
                <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                  86 LIST
                </span>
              </a>

              <a
                routerLink="/inventory"
                routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <div class="flex items-center gap-2.5">
                  <app-icon name="inventory" [size]="16"></app-icon>
                  <span>Pantry Stock Alerts</span>
                </div>
                <span class="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  RAW
                </span>
              </a>
            </div>
          </div>
        } @else if (roleService.isCashier()) {
          <!-- ================= ROLE: CASHIER / COUNTER ================= -->
          <div>
            <div class="px-3 pb-2 text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <span>💳</span>
                <span>Billing & Counter</span>
              </span>
              <span class="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono text-[9px]">CASHIER</span>
            </div>

            <div class="space-y-1">
              <a
                routerLink="/pos"
                routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <div class="flex items-center gap-2.5">
                  <app-icon name="pos" [size]="16" class="text-emerald-500"></app-icon>
                  <span>Counter POS Terminal</span>
                </div>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  SETTLE
                </span>
              </a>

              <a
                routerLink="/orders"
                routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <div class="flex items-center gap-2.5">
                  <app-icon name="orders" [size]="16"></app-icon>
                  <span>Billing & Settlements</span>
                </div>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                  PRINT
                </span>
              </a>

              <a
                routerLink="/tables"
                routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <app-icon name="tables" [size]="16"></app-icon>
                <span>Floor Billing Status</span>
              </a>

              <a
                routerLink="/reports"
                routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <app-icon name="billing" [size]="16"></app-icon>
                <span>Shift Sales & Register</span>
              </a>
            </div>
          </div>
        } @else {
          <!-- ================= ROLE: MANAGER (FULL SUITE) ================= -->

          <!-- SECTION: RESTAURANT -->
          <div>
            <button
              (click)="restaurantCollapsed.set(!restaurantCollapsed())"
              class="w-full flex items-center justify-between px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600"
            >
              <span>Restaurant Operations</span>
              <app-icon [name]="restaurantCollapsed() ? 'chevron-right' : 'chevron-down'" [size]="12"></app-icon>
            </button>

            @if (!restaurantCollapsed()) {
              <div class="space-y-0.5 mt-1">
                <a
                  routerLink="/dashboard"
                  routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                  [routerLinkActiveOptions]="{ exact: true }"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <app-icon name="dashboard" [size]="16"></app-icon>
                  <span>Dashboard</span>
                </a>
                <a
                  routerLink="/orders"
                  routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                  class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <div class="flex items-center gap-2.5">
                    <app-icon name="orders" [size]="16"></app-icon>
                    <span>Orders</span>
                  </div>
                  <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {{ hospitality.orders().length }}
                  </span>
                </a>
                <a
                  routerLink="/pos"
                  routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                  class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <div class="flex items-center gap-2.5">
                    <app-icon name="pos" [size]="16" class="text-emerald-500"></app-icon>
                    <span class="font-semibold text-slate-900">POS Terminal</span>
                  </div>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    FAST
                  </span>
                </a>
                <a
                  routerLink="/kds"
                  routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                  class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <div class="flex items-center gap-2.5">
                    <app-icon name="kds" [size]="16" class="text-amber-500"></app-icon>
                    <span>Kitchen (KDS)</span>
                  </div>
                  <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                </a>
                <a
                  routerLink="/tables"
                  routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <app-icon name="tables" [size]="16"></app-icon>
                  <span>Floor & Tables</span>
                </a>
                <a
                  routerLink="/menu"
                  routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <app-icon name="menu" [size]="16"></app-icon>
                  <span>Menu & Pricing</span>
                </a>
                <a
                  routerLink="/inventory"
                  routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                  class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <div class="flex items-center gap-2.5">
                    <app-icon name="inventory" [size]="16"></app-icon>
                    <span>Inventory & Stock</span>
                  </div>
                  <span class="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                    Alerts
                  </span>
                </a>
              </div>
            }
          </div>

          <!-- SECTION: HOTEL (PMS) -->
          <div>
            <button
              (click)="hotelCollapsed.set(!hotelCollapsed())"
              class="w-full flex items-center justify-between px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600"
            >
              <span>Hotel (PMS)</span>
              <app-icon [name]="hotelCollapsed() ? 'chevron-right' : 'chevron-down'" [size]="12"></app-icon>
            </button>

            @if (!hotelCollapsed()) {
              <div class="space-y-0.5 mt-1">
                <a
                  routerLink="/hotel"
                  routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <app-icon name="bed" [size]="16"></app-icon>
                  <span>Rooms & Front Desk</span>
                </a>
              </div>
            }
          </div>

          <!-- SECTION: CUSTOMER CRM -->
          <div>
            <button
              (click)="crmCollapsed.set(!crmCollapsed())"
              class="w-full flex items-center justify-between px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600"
            >
              <span>Guest Experience</span>
              <app-icon [name]="crmCollapsed() ? 'chevron-right' : 'chevron-down'" [size]="12"></app-icon>
            </button>

            @if (!crmCollapsed()) {
              <div class="space-y-0.5 mt-1">
                <a
                  routerLink="/customers"
                  routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <app-icon name="customers" [size]="16"></app-icon>
                  <span>Customer CRM</span>
                </a>
                <a
                  routerLink="/loyalty"
                  routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <app-icon name="loyalty" [size]="16"></app-icon>
                  <span>Loyalty & Coupons</span>
                </a>
              </div>
            }
          </div>

          <!-- SECTION: ADMINISTRATION -->
          <div>
            <button
              (click)="adminCollapsed.set(!adminCollapsed())"
              class="w-full flex items-center justify-between px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600"
            >
              <span>Administration</span>
              <app-icon [name]="adminCollapsed() ? 'chevron-right' : 'chevron-down'" [size]="12"></app-icon>
            </button>

            @if (!adminCollapsed()) {
              <div class="space-y-0.5 mt-1">
                <a
                  routerLink="/reports"
                  routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <app-icon name="reports" [size]="16"></app-icon>
                  <span>Analytics & Reports</span>
                </a>
                <a
                  routerLink="/billing"
                  routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                  class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <div class="flex items-center gap-2.5">
                    <app-icon name="billing" [size]="16"></app-icon>
                    <span>Plans & Billing</span>
                  </div>
                  <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                    {{ entitlements.currentPlan() }}
                  </span>
                </a>
                <a
                  routerLink="/settings"
                  routerLinkActive="bg-slate-900 text-white font-semibold shadow-xs"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <app-icon name="settings" [size]="16"></app-icon>
                  <span>Settings & Outlets</span>
                </a>
              </div>
            }
          </div>
        }
      </nav>

      <!-- Sidebar Footer: Active Role & Switcher -->
      <div class="p-3 border-t border-slate-100 bg-slate-50/60">
        <div class="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded-lg text-white font-black text-[10px] flex items-center justify-center shadow-2xs"
                [ngClass]="{
                  'bg-slate-900': roleService.isManager(),
                  'bg-amber-500': roleService.isWaiter(),
                  'bg-blue-600': roleService.isChef(),
                  'bg-emerald-600': roleService.isCashier()
                }"
              >
                {{ roleService.currentUser().avatarText }}
              </div>
              <div class="leading-none">
                <span class="text-xs font-bold text-slate-900 block truncate max-w-[100px]">
                  {{ roleService.currentUser().name }}
                </span>
                <span class="text-[9px] font-bold uppercase text-slate-400">
                  {{ roleService.currentRole() }}
                </span>
              </div>
            </div>

            <button
              (click)="roleService.switchRole('manager')"
              *ngIf="!roleService.isManager()"
              class="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
              title="Quick switch to Manager"
            >
              Reset
            </button>
          </div>

          <p class="text-[10px] text-slate-400 leading-tight truncate">
            {{ roleService.currentUser().title }}
          </p>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  restaurantCollapsed = signal(false);
  hotelCollapsed = signal(false);
  crmCollapsed = signal(false);
  adminCollapsed = signal(false);

  constructor(
    public hospitality: HospitalityService,
    public entitlements: EntitlementsService,
    public roleService: RoleService
  ) {}
}
