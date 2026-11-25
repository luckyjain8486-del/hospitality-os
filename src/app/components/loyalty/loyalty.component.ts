import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalityService } from '../../services/hospitality.service';
import { RoleService } from '../../services/role.service';
import { LoyaltyCoupon } from '../../models/hospitality.model';
import { IconComponent } from '../shared/icon.component';
import { RoleGuardGateComponent } from '../shared/role-guard-gate.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-loyalty',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, RoleGuardGateComponent],
  template: `
    @if (!roleService.isManager()) {
      <app-role-guard-gate requiredRole="General Manager"></app-role-guard-gate>
    } @else {
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Loyalty & Rewards Management</h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                ★ Active Rewards Program
              </span>
            </div>
            <p class="text-sm text-slate-500 mt-0.5">
              Configure dining tiers, promotional coupon codes, points issuance and referral incentives.
            </p>
          </div>

        <div class="flex items-center gap-2.5">
          <button
            (click)="showCouponModal.set(true)"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm"
          >
            <app-icon name="plus" [size]="16" class="text-amber-400"></app-icon>
            <span>Create Promo Coupon</span>
          </button>
        </div>
      </div>

      <!-- Top Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Total Loyalty Members</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">642</div>
          <span class="text-[11px] text-emerald-600 font-semibold">↑ +38 enrolled this month</span>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Points Issued (MTD)</span>
          <div class="text-2xl font-bold text-indigo-600 mt-1">48,250 pts</div>
          <span class="text-[11px] text-slate-400">₹1 spend = 1 point</span>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Points Redeemed</span>
          <div class="text-2xl font-bold text-emerald-600 mt-1">19,450 pts</div>
          <span class="text-[11px] text-slate-400">Equivalent to ₹19,450 in value</span>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Active Coupons</span>
          <div class="text-2xl font-bold text-amber-600 mt-1">{{ hospitality.coupons().length }} Codes</div>
          <span class="text-[11px] text-slate-400">902 total redemptions</span>
        </div>
      </div>

      <!-- Membership Tiers Section -->
      <div>
        <h2 class="text-base font-bold text-slate-900 mb-3">Membership Tier Architecture</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Silver Tier -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
            <div class="w-2 h-full bg-slate-400 absolute left-0 top-0"></div>
            <div class="flex items-center justify-between mb-3">
              <div>
                <span class="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Entry Level</span>
                <h3 class="text-lg font-black text-slate-900">Silver Club</h3>
              </div>
              <div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                Ag
              </div>
            </div>
            <p class="text-xs text-slate-500 mb-4">0 – 1,000 Lifetime Dining Points</p>
            <ul class="space-y-2 text-xs text-slate-700">
              <li class="flex items-center gap-2">
                <app-icon name="check" [size]="14" class="text-slate-600"></app-icon>
                <span>Earn 1 point per ₹10 spent</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" [size]="14" class="text-slate-600"></app-icon>
                <span>Birthday dessert voucher</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" [size]="14" class="text-slate-600"></app-icon>
                <span>Digital bill receipts via WhatsApp</span>
              </li>
            </ul>
          </div>

          <!-- Gold Tier -->
          <div class="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-xs relative overflow-hidden">
            <div class="w-2 h-full bg-amber-400 absolute left-0 top-0"></div>
            <div class="flex items-center justify-between mb-3">
              <div>
                <span class="text-xs uppercase font-extrabold text-amber-600 tracking-wider">Most Popular</span>
                <h3 class="text-lg font-black text-slate-900">Gold Elite</h3>
              </div>
              <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                Au
              </div>
            </div>
            <p class="text-xs text-slate-500 mb-4">1,001 – 3,000 Lifetime Dining Points</p>
            <ul class="space-y-2 text-xs text-slate-700">
              <li class="flex items-center gap-2">
                <app-icon name="check" [size]="14" class="text-amber-600"></app-icon>
                <span>Earn 1.5 points per ₹10 spent</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" [size]="14" class="text-amber-600"></app-icon>
                <span>Priority table reservation booking</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" [size]="14" class="text-amber-600"></app-icon>
                <span>Complimentary mocktail on arrival</span>
              </li>
            </ul>
          </div>

          <!-- Platinum Tier -->
          <div class="bg-white rounded-2xl border-2 border-indigo-300 p-5 shadow-xs relative overflow-hidden">
            <div class="w-2 h-full bg-indigo-600 absolute left-0 top-0"></div>
            <div class="flex items-center justify-between mb-3">
              <div>
                <span class="text-xs uppercase font-extrabold text-indigo-600 tracking-wider">VIP Tier</span>
                <h3 class="text-lg font-black text-slate-900">Platinum Heritage</h3>
              </div>
              <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                Pt
              </div>
            </div>
            <p class="text-xs text-slate-500 mb-4">3,001+ Lifetime Dining Points</p>
            <ul class="space-y-2 text-xs text-slate-700">
              <li class="flex items-center gap-2">
                <app-icon name="check" [size]="14" class="text-indigo-600"></app-icon>
                <span>Earn 2.0 points per ₹10 spent</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" [size]="14" class="text-indigo-600"></app-icon>
                <span>Guaranteed table even during peak rush</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" [size]="14" class="text-indigo-600"></app-icon>
                <span>Chef's bespoke tasting menu preview</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Coupons Management Table -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-slate-900">Promotional Coupons & Discounts</h2>
            <p class="text-xs text-slate-500">Live codes redeemable at POS register and digital orders</p>
          </div>
          <button
            (click)="showCouponModal.set(true)"
            class="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
          >
            + New Promo Code
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th class="px-5 py-3.5">Coupon Code</th>
                <th class="px-5 py-3.5">Offer Description</th>
                <th class="px-5 py-3.5">Discount Value</th>
                <th class="px-5 py-3.5">Min Spend</th>
                <th class="px-5 py-3.5">Valid Until</th>
                <th class="px-5 py-3.5">Redemptions</th>
                <th class="px-5 py-3.5">Status</th>
                <th class="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (coupon of hospitality.coupons(); track coupon.id) {
                <tr class="hover:bg-slate-50/60 transition-colors">
                  <td class="px-5 py-3.5 font-bold font-mono text-sm text-slate-900">
                    <span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {{ coupon.code }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 max-w-xs text-slate-700">
                    {{ coupon.description }}
                  </td>
                  <td class="px-5 py-3.5 font-bold text-emerald-600 text-xs">
                    {{ coupon.discountType === 'percentage' ? coupon.discountValue + '% OFF' : '₹' + coupon.discountValue + ' FLAT OFF' }}
                  </td>
                  <td class="px-5 py-3.5 font-medium text-slate-700">
                    ₹{{ coupon.minSpend }}
                  </td>
                  <td class="px-5 py-3.5 font-medium text-slate-500">
                    {{ coupon.validUntil }}
                  </td>
                  <td class="px-5 py-3.5 font-bold text-slate-900">
                    {{ coupon.usageCount }} used
                  </td>
                  <td class="px-5 py-3.5">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </td>
                  <td class="px-5 py-3.5 text-right">
                    <button
                      (click)="copyCode(coupon.code)"
                      class="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 text-[11px]"
                    >
                      Copy
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- CREATE COUPON MODAL -->
      @if (showCouponModal()) {
        <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-900">Create New Coupon Code</h3>
              <button (click)="showCouponModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <div class="space-y-4 my-4">
              <div>
                <label class="font-semibold text-slate-700 block mb-1">Coupon Promo Code</label>
                <input
                  type="text"
                  [(ngModel)]="newCode"
                  placeholder="e.g. JAIPUR20"
                  class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 uppercase font-mono font-bold"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Discount Type</label>
                  <select [(ngModel)]="newType" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed INR (₹)</option>
                  </select>
                </div>
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Discount Value</label>
                  <input type="number" [(ngModel)]="newValue" min="1" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 font-bold" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Min Spend (₹)</label>
                  <input type="number" [(ngModel)]="newMinSpend" min="0" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Expiry Date</label>
                  <input type="text" [(ngModel)]="newExpiry" placeholder="2026-12-31" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                </div>
              </div>

              <div>
                <label class="font-semibold text-slate-700 block mb-1">Description</label>
                <input type="text" [(ngModel)]="newDescription" placeholder="Flat 20% off for weekend dining..." class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                (click)="showCouponModal.set(false)"
                class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                (click)="createCoupon()"
                class="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
              >
                Publish Coupon
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  }
  `,
})
export class LoyaltyComponent {
  public roleService = inject(RoleService);
  showCouponModal = signal(false);

  newCode = '';
  newType: 'percentage' | 'fixed' = 'percentage';
  newValue = 20;
  newMinSpend = 800;
  newExpiry = '2026-12-31';
  newDescription = '';

  constructor(
    public hospitality: HospitalityService,
    private toast: ToastService
  ) {}

  copyCode(code: string) {
    navigator.clipboard?.writeText(code);
    this.toast.success('Coupon Copied', `Code ${code} copied to clipboard.`);
  }

  createCoupon() {
    if (!this.newCode) {
      this.toast.error('Validation Error', 'Coupon code is required');
      return;
    }

    this.hospitality.addCoupon({
      code: this.newCode.toUpperCase(),
      description: this.newDescription || `Special promotional offer: ${this.newValue}${this.newType === 'percentage' ? '%' : '₹'} off.`,
      discountType: this.newType,
      discountValue: this.newValue,
      minSpend: this.newMinSpend,
      validUntil: this.newExpiry,
    });

    this.showCouponModal.set(false);
  }
}
