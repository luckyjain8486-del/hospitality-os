import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalityService } from '../../services/hospitality.service';
import { EntitlementsService } from '../../services/entitlements.service';
import { RoleService } from '../../services/role.service';
import { IconComponent } from './icon.component';
import { ToastService } from '../../services/toast.service';
import { RoleSwitcherModalComponent } from './role-switcher-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, RoleSwitcherModalComponent],
  template: `
    <header class="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <!-- Left: Search & Outlet Breadcrumb -->
      <div class="flex items-center gap-4 flex-1 max-w-lg">
        <div class="relative w-full">
          <app-icon
            name="search"
            [size]="16"
            class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          ></app-icon>
          <input
            type="text"
            placeholder="Search orders, dishes, tables, guests... (Cmd+K)"
            [ngModel]="hospitality.searchQuery()"
            (ngModelChange)="hospitality.searchQuery.set($event)"
            class="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200/90 focus:border-slate-400 focus:outline-none transition-all shadow-inner/5"
          />
          @if (hospitality.searchQuery()) {
            <button
              (click)="hospitality.searchQuery.set('')"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <app-icon name="x" [size]="14"></app-icon>
            </button>
          }
        </div>
      </div>

      <!-- Right: Role Switcher, Outlets, Date Filter, Notifications & User -->
      <div class="flex items-center gap-3">
        <!-- PETPOOJA ROLE SWITCHER PILL (VERY PROMINENT) -->
        <div class="relative">
          <button
            (click)="toggleRoleDropdown()"
            class="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            [ngClass]="{
              'bg-slate-900 text-white border-slate-900': roleService.isManager(),
              'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100': roleService.isWaiter(),
              'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100': roleService.isChef(),
              'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100': roleService.isCashier()
            }"
            title="Switch PetPooja Staff Profile (Waiter, Chef, Cashier, Manager)"
          >
            <span class="text-sm">
              {{ roleService.isManager() ? '👔' : roleService.isWaiter() ? '🍽️' : roleService.isChef() ? '👨‍🍳' : '💳' }}
            </span>
            <div class="text-left leading-tight">
              <span class="block text-[11px] font-black tracking-tight">
                {{ roleService.currentUser().name }}
              </span>
              <span class="block text-[9px] uppercase font-bold tracking-wider opacity-80">
                {{ roleService.currentRole() }} MODE
              </span>
            </div>
            <app-icon name="chevron-down" [size]="12" class="opacity-70 ml-1"></app-icon>
          </button>

          <!-- Quick Role Dropdown -->
          @if (showRoleDropdown()) {
            <div class="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in duration-100">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span class="font-bold text-xs text-slate-900">PetPooja Staff Terminal</span>
                <span class="text-[10px] text-slate-400 font-mono">Select Role</span>
              </div>

              <div class="space-y-1.5 text-xs">
                @for (staff of roleService.allStaff(); track staff.id) {
                  <button
                    (click)="selectRole(staff)"
                    class="w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all"
                    [ngClass]="roleService.currentUser().id === staff.id ? 'border-slate-900 bg-slate-50 font-bold shadow-2xs' : 'border-transparent hover:bg-slate-50 text-slate-700'"
                  >
                    <div class="flex items-center gap-2.5">
                      <span class="text-base">
                        {{ staff.role === 'manager' ? '👔' : staff.role === 'waiter' ? '🍽️' : staff.role === 'chef' ? '👨‍🍳' : '💳' }}
                      </span>
                      <div>
                        <div class="font-bold text-slate-900 text-xs">{{ staff.name }}</div>
                        <span class="text-[10px] text-slate-500 capitalize block">{{ staff.role }} · PIN: {{ staff.pin }}</span>
                      </div>
                    </div>
                    @if (roleService.currentUser().id === staff.id) {
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    }
                  </button>
                }
              </div>

              <div class="pt-2.5 mt-2 border-t border-slate-100">
                <button
                  (click)="openFullRoleModal()"
                  class="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] text-center block"
                >
                  View Role Permissions Matrix →
                </button>
              </div>
            </div>
          }
        </div>

        @if (!hospitality.isSuperAdmin() && roleService.isManager()) {
          <!-- Outlet Selector (Only visible to Manager) -->
          <div class="relative hidden sm:block">
            <div class="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700">
              <app-icon name="map-pin" [size]="13" class="text-slate-400"></app-icon>
              <select
                [ngModel]="hospitality.selectedOutletId()"
                (ngModelChange)="hospitality.setOutlet($event)"
                class="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">All Outlets (Jaipur)</option>
                @for (outlet of hospitality.outlets(); track outlet.id) {
                  <option [value]="outlet.id">{{ outlet.name }}</option>
                }
              </select>
            </div>
          </div>
        }

        <!-- Notification Bell with Flyout -->
        <div class="relative">
          <button
            (click)="toggleNotifications()"
            class="relative w-9 h-9 rounded-xl border border-slate-200/90 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <app-icon name="bell" [size]="17"></app-icon>
            <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </button>

          @if (showNotifications()) {
            <div class="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 z-50">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <span class="font-semibold text-sm text-slate-900">Live Activity Feed</span>
                <span class="text-xs text-emerald-600 font-medium">3 New Alerts</span>
              </div>
              <div class="space-y-3 mt-3 text-xs">
                <div class="flex items-start gap-2.5 p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span class="w-2 h-2 rounded-full bg-amber-500 mt-1 flex-shrink-0"></span>
                  <div>
                    <p class="font-semibold text-slate-900">Low Stock Alert: Refined Maida</p>
                    <p class="text-slate-500 mt-0.5">Stock has reached 5 bags (Min threshold: 30 bags)</p>
                    <span class="text-[10px] text-slate-400 mt-1 block">4 mins ago</span>
                  </div>
                </div>
                <div class="flex items-start gap-2.5 p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></span>
                  <div>
                    <p class="font-semibold text-slate-900">VIP Arrival: Vikramaditya Rathore</p>
                    <p class="text-slate-500 mt-0.5">Table T-04 requested at Jaipur Central</p>
                    <span class="text-[10px] text-slate-400 mt-1 block">18 mins ago</span>
                  </div>
                </div>
                <div class="flex items-start gap-2.5 p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                  <span class="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0"></span>
                  <div>
                    <p class="font-semibold text-slate-900">Front Desk: Room 101 Check-In</p>
                    <p class="text-slate-500 mt-0.5">Harshwardhan Jain checked into Deluxe 101</p>
                    <span class="text-[10px] text-slate-400 mt-1 block">35 mins ago</span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- User Profile Avatar & Dropdown -->
        <div class="relative">
          <button
            (click)="toggleUserMenu()"
            class="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/70 transition-all cursor-pointer"
          >
            <div
              class="w-8 h-8 rounded-full text-white font-black text-xs flex items-center justify-center shadow-xs"
              [ngClass]="{
                'bg-slate-900': roleService.isManager(),
                'bg-amber-500': roleService.isWaiter(),
                'bg-blue-600': roleService.isChef(),
                'bg-emerald-600': roleService.isCashier()
              }"
            >
              {{ roleService.currentUser().avatarText }}
            </div>
            <div class="text-left hidden lg:block leading-tight">
              <div class="text-xs font-bold text-slate-900">{{ roleService.currentUser().name }}</div>
              <div class="text-[11px] text-slate-500 flex items-center gap-1 capitalize">
                <span>{{ roleService.currentRole() }}</span>
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
            </div>
            <app-icon name="chevron-down" [size]="14" class="text-slate-400"></app-icon>
          </button>

          @if (showUserMenu()) {
            <div class="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50">
              <div class="p-3 border-b border-slate-100">
                <p class="font-bold text-xs text-slate-900">{{ roleService.currentUser().name }}</p>
                <p class="text-[11px] text-slate-500">{{ roleService.currentUser().title }}</p>
                <div class="mt-2 flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                    PIN: {{ roleService.currentUser().pin }}
                  </span>
                  <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                    {{ entitlements.currentPlan() }} Plan
                  </span>
                </div>
              </div>
              <div class="p-1 text-xs text-slate-700 space-y-0.5">
                <button
                  (click)="openFullRoleModal(); showUserMenu.set(false)"
                  class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <app-icon name="users" [size]="15"></app-icon>
                  Switch PetPooja Staff Role
                </button>
                @if (roleService.isManager()) {
                  <button
                    (click)="hospitality.toggleSuperAdmin(); showUserMenu.set(false)"
                    class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <app-icon [name]="hospitality.isSuperAdmin() ? 'store' : 'shield'" [size]="15"></app-icon>
                    {{ hospitality.isSuperAdmin() ? 'Restaurant Mode' : 'Super Admin Mode' }}
                  </button>
                }
                <button
                  (click)="hospitality.resetAllDemoData(); showUserMenu.set(false)"
                  class="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                >
                  <app-icon name="refresh" [size]="15"></app-icon>
                  Reset Demo Data
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </header>

    <!-- Modal Child Component for Full Staff Switching -->
    <app-role-switcher-modal #roleModal></app-role-switcher-modal>
  `,
})
export class HeaderComponent {
  @ViewChild('roleModal') roleModal!: RoleSwitcherModalComponent;

  showNotifications = signal(false);
  showUserMenu = signal(false);
  showRoleDropdown = signal(false);

  constructor(
    public hospitality: HospitalityService,
    public entitlements: EntitlementsService,
    public roleService: RoleService,
    private toast: ToastService
  ) {}

  toggleNotifications() {
    this.showNotifications.update((v) => !v);
    this.showUserMenu.set(false);
    this.showRoleDropdown.set(false);
  }

  toggleUserMenu() {
    this.showUserMenu.update((v) => !v);
    this.showNotifications.set(false);
    this.showRoleDropdown.set(false);
  }

  toggleRoleDropdown() {
    this.showRoleDropdown.update((v) => !v);
    this.showUserMenu.set(false);
    this.showNotifications.set(false);
  }

  selectRole(staff: any) {
    this.roleService.switchUser(staff);
    this.showRoleDropdown.set(false);
  }

  openFullRoleModal() {
    this.showRoleDropdown.set(false);
    this.roleModal.open();
  }
}
