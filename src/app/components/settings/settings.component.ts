import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalityService } from '../../services/hospitality.service';
import { RoleService } from '../../services/role.service';
import { IconComponent } from '../shared/icon.component';
import { RoleGuardGateComponent } from '../shared/role-guard-gate.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, RoleGuardGateComponent],
  template: `
    @if (!roleService.isManager()) {
      <app-role-guard-gate requiredRole="General Manager"></app-role-guard-gate>
    } @else {
      <div class="space-y-6 max-w-4xl">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Organization & Outlet Settings</h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                Settings & Hardware
              </span>
            </div>
            <p class="text-sm text-slate-500 mt-0.5">
              Configure your brand identity, outlets, thermal receipt printing and demonstration state.
            </p>
          </div>
        </div>

      <!-- Business Profile Card -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 class="font-bold text-sm text-slate-900">Brand Identity & Legal Profile</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="font-semibold text-slate-700 block mb-1">Brand Trading Name</label>
            <input type="text" [(ngModel)]="brandName" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label class="font-semibold text-slate-700 block mb-1">Company Legal Entity</label>
            <input type="text" [(ngModel)]="legalEntity" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label class="font-semibold text-slate-700 block mb-1">GSTIN Tax Registration</label>
            <input type="text" [(ngModel)]="gstin" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 font-mono" />
          </div>
          <div>
            <label class="font-semibold text-slate-700 block mb-1">Default Base Currency</label>
            <input type="text" value="INR (₹) - Indian Rupee" disabled class="w-full p-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-500 font-bold" />
          </div>
        </div>
        <div class="pt-2 flex justify-end">
          <button (click)="saveProfile()" class="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800">
            Save Profile Changes
          </button>
        </div>
      </div>

      <!-- Outlets List -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold text-sm text-slate-900">Licensed Restaurant Outlets (3 of 5)</h3>
            <p class="text-xs text-slate-500">Each outlet has isolated floor plans, KDS routing, and POS terminals</p>
          </div>
        </div>

        <div class="space-y-3 text-xs">
          @for (outlet of hospitality.outlets(); track outlet.id) {
            <div class="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 class="font-bold text-slate-900 text-sm">{{ outlet.name }}</h4>
                <p class="text-slate-500">{{ outlet.location }} · {{ outlet.phone }}</p>
              </div>
              <div class="flex items-center gap-4 text-right">
                <div>
                  <span class="font-bold text-slate-800 block">{{ outlet.tablesCount }} Tables</span>
                  <span class="text-[11px] text-slate-400">{{ outlet.staffCount }} Staff</span>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Thermal Printer & Hardware Test -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
        <h3 class="font-bold text-sm text-slate-900">Receipt Printers & KOT Hardware</h3>
        <p class="text-xs text-slate-500">ESC/POS thermal printer integration for kitchen and customer billing</p>
        <div class="flex items-center gap-3 pt-2">
          <button
            (click)="testPrintReceipt()"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center gap-2"
          >
            <app-icon name="printer" [size]="14"></app-icon>
            <span>Test Customer Bill Printer (ESC/POS)</span>
          </button>
          <button
            (click)="testPrintKot()"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center gap-2"
          >
            <app-icon name="printer" [size]="14"></app-icon>
            <span>Test Kitchen KOT Printer (Pass)</span>
          </button>
        </div>
      </div>

      <!-- Demo Reset Danger Card -->
      <div class="bg-rose-50/50 rounded-2xl border border-rose-200 p-6 space-y-3">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
            <app-icon name="alert-circle" [size]="18"></app-icon>
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-sm text-rose-950">Reset Demo State</h3>
            <p class="text-xs text-rose-700 mt-0.5 leading-relaxed">
              Reset all orders, tables, inventory modifications, guest logs, and custom coupons back to the pristine demonstration state.
            </p>
          </div>
          <button
            (click)="resetDemo()"
            class="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            Reset All Demo Data
          </button>
        </div>
      </div>
    </div>
  }
  `,
})
export class SettingsComponent {
  brandName = 'The Royal Amber Hospitality';
  legalEntity = 'Amber Heritage Dining Pvt Ltd';
  gstin = '08AAACH7489M1Z8';

  constructor(
    public hospitality: HospitalityService,
    public roleService: RoleService,
    private toast: ToastService
  ) {}

  saveProfile() {
    this.toast.success('Settings Saved', 'Business profile and tax parameters updated.');
  }

  testPrintReceipt() {
    this.toast.success('Thermal Print Sent', 'ESC/POS test receipt transmitted to Front Desk Printer.');
  }

  testPrintKot() {
    this.toast.success('Kitchen Ticket Printed', 'KOT #01 transmitted to Tandoor/Curry Kitchen station.');
  }

  resetDemo() {
    if (confirm('Are you sure you want to reset all mock data to the default demonstration state?')) {
      this.hospitality.resetAllDemoData();
    }
  }
}
