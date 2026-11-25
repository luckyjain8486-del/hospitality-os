import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HospitalityService } from '../../services/hospitality.service';
import { RoleService } from '../../services/role.service';
import { TableItem, TableStatus } from '../../models/hospitality.model';
import { IconComponent } from '../shared/icon.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Floor Plan Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Floor & Table Management</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {{ occupiedCount() }}/{{ hospitality.tables().length }} Occupied
            </span>
            <!-- Role indicator badge -->
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
              [ngClass]="{
                'bg-amber-50 text-amber-900 border-amber-200': roleService.isWaiter(),
                'bg-emerald-50 text-emerald-900 border-emerald-200': roleService.isCashier(),
                'bg-blue-50 text-blue-900 border-blue-200': roleService.isChef(),
                'bg-purple-50 text-purple-900 border-purple-200': roleService.isManager()
              }">
              {{ roleService.currentUser().name }} ({{ roleService.currentRole() | uppercase }})
            </span>
          </div>
          <p class="text-sm text-slate-500 mt-0.5">
            @if (roleService.isWaiter()) {
              Captain Floor Operations · Table seating, live covers turnover, table shifting, and KOT punching.
            } @else if (roleService.isCashier()) {
              Cashier Table Register · Table pre-settlement bills and counter cash collection.
            } @else {
              Interactive floor plan, active covers, table transfer, and advance dining reservations.
            }
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            (click)="showReservationModal.set(true)"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm cursor-pointer"
          >
            <app-icon name="calendar" [size]="15" class="text-emerald-400"></app-icon>
            <span>Reserve Table</span>
          </button>
          <button
            (click)="showTransferModal.set(true)"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
          >
            <app-icon name="refresh" [size]="14"></app-icon>
            <span>Transfer / Merge</span>
          </button>
        </div>
      </div>

      <!-- Zone Tabs & Status Legend -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Zone Tabs -->
        <div class="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 overflow-x-auto">
          @for (zone of zones; track zone) {
            <button
              (click)="selectedZone.set(zone)"
              class="px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
              [ngClass]="{ 'bg-white text-slate-900 shadow-xs': selectedZone() === zone }"
            >
              {{ zone }}
            </button>
          }
        </div>

        <!-- Status Legend -->
        <div class="flex items-center gap-3 text-xs font-medium">
          <span class="flex items-center gap-1.5 text-slate-600">
            <span class="w-3 h-3 rounded-md bg-emerald-500"></span> Available ({{ availableCount() }})
          </span>
          <span class="flex items-center gap-1.5 text-slate-600">
            <span class="w-3 h-3 rounded-md bg-indigo-600"></span> Occupied ({{ occupiedCount() }})
          </span>
          <span class="flex items-center gap-1.5 text-slate-600">
            <span class="w-3 h-3 rounded-md bg-amber-500"></span> Billing ({{ billingCount() }})
          </span>
          <span class="flex items-center gap-1.5 text-slate-600">
            <span class="w-3 h-3 rounded-md bg-purple-500"></span> Reserved ({{ reservedCount() }})
          </span>
        </div>
      </div>

      <!-- Interactive Floor Map Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        @for (table of filteredTables(); track table.id) {
          <div
            (click)="selectTable(table)"
            class="bg-white rounded-2xl border-2 p-4 flex flex-col justify-between transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group min-h-[140px]"
            [ngClass]="{
              'border-emerald-200 hover:border-emerald-400': table.status === 'available',
              'border-indigo-200 bg-indigo-50/20 hover:border-indigo-400': table.status === 'occupied',
              'border-amber-200 bg-amber-50/20 hover:border-amber-400': table.status === 'billing',
              'border-purple-200 bg-purple-50/20 hover:border-purple-400': table.status === 'reserved'
            }"
          >
            <!-- Card Header -->
            <div class="flex items-center justify-between">
              <span class="font-black text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                {{ table.tableNumber }}
              </span>
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                [ngClass]="{
                  'bg-emerald-100 text-emerald-800': table.status === 'available',
                  'bg-indigo-100 text-indigo-800': table.status === 'occupied',
                  'bg-amber-100 text-amber-800': table.status === 'billing',
                  'bg-purple-100 text-purple-800': table.status === 'reserved'
                }"
              >
                {{ table.status }}
              </span>
            </div>

            <!-- Card Body / Status details -->
            <div class="my-2 space-y-1">
              <div class="text-[11px] text-slate-400 flex items-center gap-1">
                <app-icon name="users" [size]="12"></app-icon>
                <span>{{ table.capacity }} Seats · {{ table.zone }}</span>
              </div>

              @if (table.status === 'occupied' || table.status === 'billing') {
                <div class="font-extrabold text-sm text-slate-900">
                  ₹{{ table.currentAmount || 0 | number:'1.0-0' }}
                </div>
                <div class="text-[10px] text-slate-500 font-medium">
                  ⏱️ {{ table.durationMinutes || 35 }} mins occupied
                </div>
              } @else if (table.status === 'reserved' && table.reservedFor) {
                <div class="text-xs font-bold text-purple-900 truncate">
                  {{ table.reservedFor.guestName }}
                </div>
                <div class="text-[10px] text-purple-600 font-medium">
                  At {{ table.reservedFor.time }} ({{ table.reservedFor.partySize }} guests)
                </div>
              } @else {
                <div class="text-[11px] text-emerald-600 font-semibold pt-2">
                  Ready for Guests
                </div>
              }
            </div>

            <!-- Quick Action button -->
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span class="text-slate-400 font-medium truncate max-w-[80px]">
                {{ table.server || 'Open' }}
              </span>
              <span class="text-indigo-600 font-semibold group-hover:underline">
                Manage →
              </span>
            </div>
          </div>
        }
      </div>

      <!-- TABLE DETAIL SIDE DRAWER -->
      @if (selectedTable()) {
        <div class="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div class="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <!-- Header -->
            <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-xl font-extrabold text-slate-900">{{ selectedTable()!.tableNumber }}</h3>
                  <span
                    class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                    [ngClass]="{
                      'bg-emerald-100 text-emerald-800': selectedTable()!.status === 'available',
                      'bg-indigo-100 text-indigo-800': selectedTable()!.status === 'occupied',
                      'bg-amber-100 text-amber-800': selectedTable()!.status === 'billing',
                      'bg-purple-100 text-purple-800': selectedTable()!.status === 'reserved'
                    }"
                  >
                    {{ selectedTable()!.status }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ selectedTable()!.zone }} · Capacity: {{ selectedTable()!.capacity }} covers
                </p>
              </div>
              <button
                (click)="selectedTable.set(null)"
                class="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <!-- Drawer Body -->
            <div class="p-5 space-y-6 flex-1 text-xs text-slate-700">
              <!-- Current Order / Occupancy Info -->
              <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
                <span class="font-bold text-xs uppercase text-slate-400 block tracking-wider">Live Table Metrics</span>
                <div class="flex justify-between">
                  <span class="text-slate-500">Current Ticket Amount:</span>
                  <span class="font-bold text-sm text-slate-900">₹{{ selectedTable()!.currentAmount || 0 | number:'1.0-2' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Occupied Since:</span>
                  <span class="font-semibold text-slate-800">{{ selectedTable()!.occupiedSince || 'Not occupied' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Elapsed Time:</span>
                  <span class="font-semibold text-slate-800">{{ selectedTable()!.durationMinutes ? selectedTable()!.durationMinutes + ' minutes' : 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Assigned Captain:</span>
                  <span class="font-semibold text-slate-800">{{ selectedTable()!.server || 'Mukesh Singh' }}</span>
                </div>
              </div>

              <!-- Quick Status Transitions -->
              <div>
                <span class="font-bold text-xs uppercase text-slate-400 block mb-2 tracking-wider">Update Table Status</span>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    (click)="updateStatus('available')"
                    class="p-2.5 rounded-xl border font-semibold text-center transition-all"
                    [ngClass]="selectedTable()!.status === 'available' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'"
                  >
                    🟢 Available (Cleaned)
                  </button>
                  <button
                    (click)="updateStatus('occupied')"
                    class="p-2.5 rounded-xl border font-semibold text-center transition-all"
                    [ngClass]="selectedTable()!.status === 'occupied' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'"
                  >
                    🔵 Occupied (Seated)
                  </button>
                  <button
                    (click)="updateStatus('billing')"
                    class="p-2.5 rounded-xl border font-semibold text-center transition-all"
                    [ngClass]="selectedTable()!.status === 'billing' ? 'bg-amber-500 text-white border-amber-500 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'"
                  >
                    🟡 Billing (Settling)
                  </button>
                  <button
                    (click)="updateStatus('reserved')"
                    class="p-2.5 rounded-xl border font-semibold text-center transition-all"
                    [ngClass]="selectedTable()!.status === 'reserved' ? 'bg-purple-600 text-white border-purple-600 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'"
                  >
                    🟣 Reserved (Blocked)
                  </button>
                </div>
              </div>

              <!-- POS Ordering / Settlement Shortcut -->
              <div class="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <h4 class="font-bold text-slate-900 text-xs">
                  {{ roleService.isCashier() ? 'Counter Bill Settlement' : 'Punch Order for ' + selectedTable()!.tableNumber }}
                </h4>
                <p class="text-[11px] text-slate-500 leading-relaxed">
                  {{ roleService.isCashier()
                    ? 'Open billing desk pre-loaded with this table order to collect payment via UPI, Card, or Cash.'
                    : 'Open POS terminal pre-configured with this table number to add starters, main courses, and drinks.' }}
                </p>
                <button
                  (click)="openPosForTable()"
                  class="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 shadow-xs cursor-pointer"
                >
                  <app-icon name="pos" [size]="14" class="text-emerald-400"></app-icon>
                  <span>
                    {{ roleService.isCashier()
                      ? 'Settle Bill for Table ' + selectedTable()!.tableNumber
                      : (roleService.isWaiter() ? 'Punch Table KOT' : 'Launch POS for ' + selectedTable()!.tableNumber) }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Drawer Footer -->
            <div class="p-5 border-t border-slate-100 bg-slate-50/60 flex items-center gap-3">
              <button
                (click)="selectedTable.set(null)"
                class="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      }

      <!-- RESERVATION MODAL -->
      @if (showReservationModal()) {
        <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-900">Create Dining Reservation</h3>
              <button (click)="showReservationModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <div class="space-y-3.5 my-4">
              <div>
                <label class="font-semibold text-slate-700 block mb-1">Guest Full Name</label>
                <input type="text" [(ngModel)]="resGuestName" placeholder="e.g. Vikramaditya Rathore" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label class="font-semibold text-slate-700 block mb-1">Mobile Number</label>
                <input type="text" [(ngModel)]="resPhone" placeholder="+91 98290 55443" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Target Table</label>
                  <select [(ngModel)]="resTableNumber" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                    @for (t of hospitality.tables(); track t.id) {
                      <option [value]="t.tableNumber">{{ t.tableNumber }} ({{ t.capacity }}p) - {{ t.zone }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Reservation Time</label>
                  <input type="text" [(ngModel)]="resTime" placeholder="08:00 PM" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                </div>
              </div>
              <div>
                <label class="font-semibold text-slate-700 block mb-1">Party Size (Guests)</label>
                <input type="number" [(ngModel)]="resPartySize" min="1" max="20" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                (click)="showReservationModal.set(false)"
                class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                (click)="confirmReservation()"
                class="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      }

      <!-- TRANSFER TABLE MODAL -->
      @if (showTransferModal()) {
        <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-900">Transfer / Shift Table</h3>
              <button (click)="showTransferModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <div class="space-y-4 my-4">
              <div>
                <label class="font-semibold text-slate-700 block mb-1">From Table (Occupied)</label>
                <select [(ngModel)]="transferSource" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                  @for (t of occupiedTablesList(); track t.id) {
                    <option [value]="t.tableNumber">{{ t.tableNumber }} (₹{{ t.currentAmount || 0 }})</option>
                  }
                </select>
              </div>

              <div>
                <label class="font-semibold text-slate-700 block mb-1">To Table (Available)</label>
                <select [(ngModel)]="transferTarget" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                  @for (t of availableTablesList(); track t.id) {
                    <option [value]="t.tableNumber">{{ t.tableNumber }} ({{ t.capacity }} seats) - {{ t.zone }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                (click)="showTransferModal.set(false)"
                class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                (click)="executeTableTransfer()"
                class="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
              >
                Transfer Now
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class TablesComponent {
  selectedZone = signal<string>('All Zones');
  selectedTable = signal<TableItem | null>(null);

  showReservationModal = signal(false);
  showTransferModal = signal(false);

  // Reservation inputs
  resGuestName = 'Dr. Vivek Soni';
  resPhone = '+91 98290 66778';
  resTableNumber = 'T-05';
  resTime = '08:00 PM';
  resPartySize = 4;

  // Transfer inputs
  transferSource = 'T-03';
  transferTarget = 'T-01';

  readonly zones = ['All Zones', 'Ground Floor', 'Rooftop Terrace', 'Family Lounge', 'Courtyard'];

  readonly filteredTables = computed(() => {
    const zone = this.selectedZone();
    if (zone === 'All Zones') return this.hospitality.tables();
    return this.hospitality.tables().filter((t) => t.zone === zone);
  });

  readonly occupiedCount = computed(() => this.hospitality.tables().filter((t) => t.status === 'occupied').length);
  readonly availableCount = computed(() => this.hospitality.tables().filter((t) => t.status === 'available').length);
  readonly billingCount = computed(() => this.hospitality.tables().filter((t) => t.status === 'billing').length);
  readonly reservedCount = computed(() => this.hospitality.tables().filter((t) => t.status === 'reserved').length);

  readonly occupiedTablesList = computed(() => this.hospitality.tables().filter((t) => t.status === 'occupied' || t.status === 'billing'));
  readonly availableTablesList = computed(() => this.hospitality.tables().filter((t) => t.status === 'available'));

  constructor(
    public hospitality: HospitalityService,
    public roleService: RoleService,
    private toast: ToastService,
    private router: Router
  ) {}

  selectTable(table: TableItem) {
    this.selectedTable.set(table);
  }

  updateStatus(status: TableStatus) {
    const table = this.selectedTable();
    if (table) {
      this.hospitality.updateTableStatus(table.tableNumber, status);
      this.selectedTable.set({ ...table, status });
      this.toast.success('Table Status Updated', `${table.tableNumber} is now marked ${status.toUpperCase()}`);
    }
  }

  openPosForTable() {
    const table = this.selectedTable();
    if (table) {
      this.hospitality.posSelectedTable.set(table.tableNumber);
      this.selectedTable.set(null);
      this.router.navigate(['/pos']);
    }
  }

  confirmReservation() {
    this.hospitality.updateTableStatus(this.resTableNumber, 'reserved');
    this.toast.success('Reservation Confirmed', `Table ${this.resTableNumber} booked for ${this.resGuestName} at ${this.resTime}`);
    this.showReservationModal.set(false);
  }

  executeTableTransfer() {
    this.hospitality.transferTable(this.transferSource, this.transferTarget);
    this.showTransferModal.set(false);
  }
}
