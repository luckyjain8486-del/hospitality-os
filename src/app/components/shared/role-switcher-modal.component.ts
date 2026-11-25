import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../services/role.service';
import { StaffUser } from '../../models/hospitality.model';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-role-switcher-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 text-slate-800 animate-in zoom-in-95 duration-150">
          <!-- Header -->
          <div class="flex items-start justify-between pb-4 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 tracking-wider">
                  PetPooja POS Role Switching
                </span>
                <span class="text-xs text-slate-400">Station Terminal #01</span>
              </div>
              <h2 class="text-xl font-black text-slate-900 tracking-tight mt-1">Select Active Staff Terminal Profile</h2>
              <p class="text-xs text-slate-500 mt-0.5">
                Switch staff mode to simulate role-based authorization for Captains, Line Chefs, Cashiers, and Managers.
              </p>
            </div>
            <button
              (click)="close()"
              class="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700"
            >
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <!-- 4 Roles Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            @for (staff of roleService.allStaff(); track staff.id) {
              <div
                (click)="selectStaff(staff)"
                class="p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between hover:shadow-md text-left group"
                [ngClass]="{
                  'border-slate-900 bg-slate-50/70 shadow-xs ring-2 ring-slate-900/10': roleService.currentUser().id === staff.id,
                  'border-slate-200 hover:border-slate-400 bg-white': roleService.currentUser().id !== staff.id
                }"
              >
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-2xs"
                        [ngClass]="{
                          'bg-slate-900': staff.role === 'manager',
                          'bg-amber-500': staff.role === 'waiter',
                          'bg-blue-600': staff.role === 'chef',
                          'bg-emerald-600': staff.role === 'cashier'
                        }"
                      >
                        {{ staff.avatarText }}
                      </div>
                      <div>
                        <h4 class="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {{ staff.name }}
                        </h4>
                        <span class="text-[10px] font-semibold text-slate-500 block">
                          {{ staff.title }}
                        </span>
                      </div>
                    </div>

                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                      [ngClass]="{
                        'bg-slate-900 text-white': staff.role === 'manager',
                        'bg-amber-100 text-amber-800': staff.role === 'waiter',
                        'bg-blue-100 text-blue-800': staff.role === 'chef',
                        'bg-emerald-100 text-emerald-800': staff.role === 'cashier'
                      }"
                    >
                      {{ staff.role }}
                    </span>
                  </div>

                  <p class="text-xs text-slate-500 leading-relaxed mb-3">
                    {{ staff.description }}
                  </p>
                </div>

                <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span class="text-[11px] font-mono text-slate-400 font-medium">
                    PIN: <strong class="text-slate-800">{{ staff.pin }}</strong>
                  </span>

                  <span
                    class="font-bold text-xs flex items-center gap-1"
                    [ngClass]="roleService.currentUser().id === staff.id ? 'text-emerald-600' : 'text-slate-600 group-hover:text-slate-900'"
                  >
                    @if (roleService.currentUser().id === staff.id) {
                      <span>✓ Current Profile</span>
                    } @else {
                      <span>Switch to this Role →</span>
                    }
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
            <div class="flex items-center gap-2">
              <app-icon name="shield" [size]="16" class="text-indigo-600"></app-icon>
              <span><strong>Manager Override PIN:</strong> Use <strong>1234</strong> anytime a role encounters a restricted action.</span>
            </div>
            <button
              (click)="close()"
              class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class RoleSwitcherModalComponent {
  isOpen = signal(false);

  constructor(public roleService: RoleService) {}

  open() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  selectStaff(staff: StaffUser) {
    this.roleService.switchUser(staff);
    this.close();
  }
}
