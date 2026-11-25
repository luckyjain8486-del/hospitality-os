import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalityService } from '../../services/hospitality.service';
import { RoleService } from '../../services/role.service';
import { Customer, CustomerSegment, LoyaltyTier } from '../../models/hospitality.model';
import { IconComponent } from '../shared/icon.component';
import { RoleGuardGateComponent } from '../shared/role-guard-gate.component';
import { ToastService } from '../../services/toast.service';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-crm',
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
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Customer Relationship Management (CRM)</h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {{ hospitality.customers().length }} Registered Guests
              </span>
            </div>
            <p class="text-sm text-slate-500 mt-0.5">
              360° guest profiles, VIP tracking, lifetime dining expenditure and visit retention.
            </p>
          </div>

        <div class="flex items-center gap-2.5">
          <button
            (click)="exportCsv()"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors"
          >
            <app-icon name="download" [size]="15"></app-icon>
            <span>Export Guests</span>
          </button>
          <button
            (click)="showAddModal.set(true)"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm"
          >
            <app-icon name="plus" [size]="16" class="text-emerald-400"></app-icon>
            <span>Add New Guest</span>
          </button>
        </div>
      </div>

      <!-- Segment Filter Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          (click)="selectedSegment.set('all')"
          class="p-4 rounded-2xl border text-left transition-all"
          [ngClass]="selectedSegment() === 'all' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
        >
          <span class="text-xs opacity-75 font-medium block">All Guests</span>
          <div class="text-2xl font-bold mt-1">{{ hospitality.customers().length }}</div>
        </button>

        <button
          (click)="selectedSegment.set('VIP')"
          class="p-4 rounded-2xl border text-left transition-all"
          [ngClass]="selectedSegment() === 'VIP' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
        >
          <span class="text-xs opacity-75 font-medium block">★ VIP Dining Club</span>
          <div class="text-2xl font-bold mt-1">{{ countSegment('VIP') }}</div>
        </button>

        <button
          (click)="selectedSegment.set('Regular')"
          class="p-4 rounded-2xl border text-left transition-all"
          [ngClass]="selectedSegment() === 'Regular' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
        >
          <span class="text-xs opacity-75 font-medium block">Regular Guests</span>
          <div class="text-2xl font-bold mt-1">{{ countSegment('Regular') }}</div>
        </button>

        <button
          (click)="selectedSegment.set('At Risk')"
          class="p-4 rounded-2xl border text-left transition-all"
          [ngClass]="selectedSegment() === 'At Risk' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
        >
          <span class="text-xs opacity-75 font-medium block">At Risk (>30d no visit)</span>
          <div class="text-2xl font-bold mt-1">{{ countSegment('At Risk') }}</div>
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div class="relative flex-1 max-w-md">
          <app-icon name="search" [size]="14" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
          <input
            type="text"
            placeholder="Search by guest name, phone, email, notes..."
            [(ngModel)]="searchQuery"
            class="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:outline-none"
          />
        </div>

        <span class="text-xs text-slate-500 font-medium">
          Showing {{ filteredCustomers().length }} matching guests
        </span>
      </div>

      <!-- Customer Directory Table -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th class="px-5 py-3.5">Guest Profile</th>
                <th class="px-5 py-3.5">Contact Details</th>
                <th class="px-5 py-3.5">Segment & Tier</th>
                <th class="px-5 py-3.5">Visits Count</th>
                <th class="px-5 py-3.5">Lifetime Spend</th>
                <th class="px-5 py-3.5">Loyalty Points</th>
                <th class="px-5 py-3.5">Last Visit</th>
                <th class="px-5 py-3.5 text-right">View 360°</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (cust of filteredCustomers(); track cust.id) {
                <tr
                  (click)="selectedCustomer.set(cust)"
                  class="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                      <img [src]="cust.avatar" class="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      <div>
                        <div class="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {{ cust.name }}
                        </div>
                        <span class="text-[10px] text-slate-400 block line-clamp-1 max-w-[150px]">{{ cust.notes }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="font-semibold text-slate-800">{{ cust.phone }}</div>
                    <span class="text-[11px] text-slate-400">{{ cust.email }}</span>
                  </td>
                  <td class="px-5 py-3.5">
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
                      [ngClass]="{
                        'bg-purple-100 text-purple-800 border border-purple-200': cust.segment === 'VIP',
                        'bg-emerald-100 text-emerald-800 border border-emerald-200': cust.segment === 'Regular',
                        'bg-blue-100 text-blue-800 border border-blue-200': cust.segment === 'New',
                        'bg-amber-100 text-amber-800 border border-amber-200': cust.segment === 'At Risk'
                      }"
                    >
                      {{ cust.segment }}
                    </span>
                    <span class="text-[10px] font-bold text-slate-500 block mt-0.5">
                      {{ cust.tier }} Tier
                    </span>
                  </td>
                  <td class="px-5 py-3.5 font-bold text-slate-900">
                    {{ cust.totalVisits }} visits
                  </td>
                  <td class="px-5 py-3.5 font-bold text-slate-900 text-sm">
                    ₹{{ cust.totalSpent | number:'1.0-0' }}
                  </td>
                  <td class="px-5 py-3.5">
                    <span class="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      ★ {{ cust.loyaltyPoints }} pts
                    </span>
                  </td>
                  <td class="px-5 py-3.5 font-medium text-slate-600">
                    {{ cust.lastVisitDate }}
                  </td>
                  <td class="px-5 py-3.5 text-right">
                    <button class="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 text-xs">
                      Profile →
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- CUSTOMER DETAIL DRAWER -->
      @if (selectedCustomer()) {
        <div class="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div class="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <!-- Header -->
            <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div class="flex items-center gap-3">
                <img [src]="selectedCustomer()!.avatar" class="w-12 h-12 rounded-full object-cover border-2 border-indigo-200" />
                <div>
                  <h3 class="text-base font-bold text-slate-900">{{ selectedCustomer()!.name }}</h3>
                  <span class="text-xs font-semibold text-indigo-600">{{ selectedCustomer()!.tier }} Member · {{ selectedCustomer()!.segment }}</span>
                </div>
              </div>
              <button (click)="selectedCustomer.set(null)" class="text-slate-400 hover:text-slate-600">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <!-- Content -->
            <div class="p-5 space-y-5 flex-1 text-xs text-slate-700">
              <!-- Stats Row -->
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span class="text-[10px] text-slate-400 block">Total Spend</span>
                  <div class="font-bold text-sm text-slate-900 mt-0.5">₹{{ selectedCustomer()!.totalSpent | number:'1.0-0' }}</div>
                </div>
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span class="text-[10px] text-slate-400 block">Visits</span>
                  <div class="font-bold text-sm text-slate-900 mt-0.5">{{ selectedCustomer()!.totalVisits }}</div>
                </div>
                <div class="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span class="text-[10px] text-amber-700 block">Reward Points</span>
                  <div class="font-bold text-sm text-amber-900 mt-0.5">★ {{ selectedCustomer()!.loyaltyPoints }}</div>
                </div>
              </div>

              <!-- Contact & Details -->
              <div class="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div class="flex justify-between">
                  <span class="text-slate-400">Phone:</span>
                  <span class="font-mono font-semibold text-slate-800">{{ selectedCustomer()!.phone }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Email:</span>
                  <span class="font-medium text-slate-800">{{ selectedCustomer()!.email }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Last Seen:</span>
                  <span class="font-medium text-slate-800">{{ selectedCustomer()!.lastVisitDate }}</span>
                </div>
              </div>

              <!-- Favorite Items -->
              <div>
                <span class="font-bold text-slate-900 block mb-2">Favorite Dishes:</span>
                <div class="flex flex-wrap gap-1.5">
                  @for (fav of selectedCustomer()!.favoriteItems; track fav) {
                    <span class="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                      🍛 {{ fav }}
                    </span>
                  }
                </div>
              </div>

              <!-- Notes / Special Care -->
              <div>
                <span class="font-bold text-slate-900 block mb-1">Staff Hospitality Notes:</span>
                <p class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed italic">
                  "{{ selectedCustomer()!.notes }}"
                </p>
              </div>

              <!-- Quick Action: Issue Complementary Coupon -->
              <div class="pt-2 border-t border-slate-200">
                <button
                  (click)="sendPersonalPromo()"
                  class="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800"
                >
                  <app-icon name="sparkles" [size]="14" class="text-amber-400"></app-icon>
                  <span>Dispatch VIP Exclusive Offer SMS</span>
                </button>
              </div>
            </div>

            <!-- Drawer Footer -->
            <div class="p-5 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
              <button
                (click)="selectedCustomer.set(null)"
                class="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ADD GUEST MODAL -->
      @if (showAddModal()) {
        <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-900">Add Guest to CRM</h3>
              <button (click)="showAddModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <div class="space-y-3.5 my-4">
              <div>
                <label class="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input type="text" [(ngModel)]="newCustName" placeholder="e.g. Radhika Sharma" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <input type="text" [(ngModel)]="newCustPhone" placeholder="+91 98290 00112" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Email</label>
                  <input type="email" [(ngModel)]="newCustEmail" placeholder="radhika@example.com" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Segment</label>
                  <select [(ngModel)]="newCustSegment" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <option value="New">New Guest</option>
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Membership Tier</label>
                  <select [(ngModel)]="newCustTier" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="font-semibold text-slate-700 block mb-1">Dietary Preferences & Notes</label>
                <input type="text" [(ngModel)]="newCustNotes" placeholder="Prefers corner table, Jain food preferences..." class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                (click)="showAddModal.set(false)"
                class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                (click)="saveNewGuest()"
                class="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
              >
                Save Guest Profile
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  }
  `,
})
export class CrmComponent {
  public roleService = inject(RoleService);
  selectedSegment = signal<'all' | CustomerSegment>('all');
  searchQuery = '';
  selectedCustomer = signal<Customer | null>(null);
  showAddModal = signal(false);

  newCustName = '';
  newCustPhone = '';
  newCustEmail = '';
  newCustSegment: CustomerSegment = 'New';
  newCustTier: LoyaltyTier = 'Silver';
  newCustNotes = '';

  readonly filteredCustomers = computed(() => {
    const seg = this.selectedSegment();
    const q = this.searchQuery.toLowerCase().trim();

    return this.hospitality.customers().filter((c) => {
      if (seg !== 'all' && c.segment !== seg) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q)
      );
    });
  });

  constructor(
    public hospitality: HospitalityService,
    private toast: ToastService,
    private exporter: ExportService
  ) {}

  countSegment(seg: CustomerSegment): number {
    return this.hospitality.customers().filter((c) => c.segment === seg).length;
  }

  sendPersonalPromo() {
    this.toast.success('SMS Dispatched', `VIP festive promotion code sent to ${this.selectedCustomer()?.phone}`);
  }

  saveNewGuest() {
    if (!this.newCustName || !this.newCustPhone) {
      this.toast.error('Validation Error', 'Guest name and phone are required');
      return;
    }

    this.hospitality.addCustomer({
      name: this.newCustName,
      phone: this.newCustPhone,
      email: this.newCustEmail || 'guest@dining.in',
      segment: this.newCustSegment,
      tier: this.newCustTier,
      totalVisits: 1,
      totalSpent: 0,
      loyaltyPoints: 100,
      lastVisitDate: 'Today',
      favoriteItems: ['Paneer Tikka Angara'],
      notes: this.newCustNotes || 'First time walk-in guest.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    });

    this.showAddModal.set(false);
  }

  exportCsv() {
    const headers = ['Guest Name', 'Phone', 'Email', 'Segment', 'Tier', 'Visits', 'Total Spent (INR)', 'Loyalty Points', 'Last Visit'];
    const rows = this.hospitality.customers().map((c) => [
      c.name,
      c.phone,
      c.email,
      c.segment,
      c.tier,
      c.totalVisits,
      c.totalSpent,
      c.loyaltyPoints,
      c.lastVisitDate,
    ]);
    this.exporter.downloadCsv('HospitalityOS-CRM-Guests', headers, rows);
  }
}
