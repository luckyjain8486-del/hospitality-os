import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalityService } from '../../services/hospitality.service';
import { EntitlementsService } from '../../services/entitlements.service';
import { RoleService } from '../../services/role.service';
import { HotelReservation, HousekeepingStatus, Room, RoomStatus, RoomType } from '../../models/hospitality.model';
import { IconComponent } from '../shared/icon.component';
import { LockedFeatureComponent } from '../shared/locked-feature.component';
import { RoleGuardGateComponent } from '../shared/role-guard-gate.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-hotel',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, LockedFeatureComponent, RoleGuardGateComponent],
  template: `
    @if (!roleService.hasPermission('canAccessHotelPms')) {
      <app-role-guard-gate requiredRole="General Manager / Front Desk"></app-role-guard-gate>
    } @else if (!entitlements.isFeatureEnabled('feat-pms-rooms')) {
      <app-locked-feature
        featureTitle="Hotel Management (PMS & Front Desk)"
        planRequirement="Growth"
        description="Comprehensive property management: visual room timeline, reservations, folio billing, keycard check-in, and housekeeping dispatch."
      ></app-locked-feature>
    } @else {
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Hotel Property Management (PMS)</h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                Amber Heritage Palace Hotel
              </span>
            </div>
            <p class="text-sm text-slate-500 mt-0.5">
              Live room status, front desk check-in/out, housekeeping workflow, and guest reservations.
            </p>
          </div>

          <div class="flex items-center gap-2.5">
            <button
              (click)="showWalkInModal.set(true)"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm"
            >
              <app-icon name="plus" [size]="16" class="text-indigo-400"></app-icon>
              <span>Walk-in Check-In</span>
            </button>
          </div>
        </div>

        <!-- PMS KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span class="text-xs text-slate-500 font-medium">Total Rooms</span>
            <div class="text-2xl font-bold text-slate-900 mt-1">{{ hospitality.rooms().length }} Keys</div>
            <span class="text-[11px] text-slate-400">Deluxe & Suites</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
            <span class="text-xs text-emerald-800 font-medium">Available</span>
            <div class="text-2xl font-bold text-emerald-600 mt-1">{{ availableRoomsCount() }}</div>
            <span class="text-[11px] text-emerald-700">Ready for check-in</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
            <span class="text-xs text-indigo-800 font-medium">Occupied</span>
            <div class="text-2xl font-bold text-indigo-700 mt-1">{{ occupiedRoomsCount() }}</div>
            <span class="text-[11px] text-indigo-600 font-semibold">{{ occupancyPercent() }}% Occupancy</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-xs">
            <span class="text-xs text-purple-800 font-medium">Reserved</span>
            <div class="text-2xl font-bold text-purple-700 mt-1">{{ reservedRoomsCount() }}</div>
            <span class="text-[11px] text-purple-600">Arriving today</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
            <span class="text-xs text-amber-800 font-medium">Housekeeping</span>
            <div class="text-2xl font-bold text-amber-700 mt-1">{{ dirtyRoomsCount() }} Dirty</div>
            <span class="text-[11px] text-amber-600">Cleaning queued</span>
          </div>
        </div>

        <!-- PMS Tabs: Rooms Grid vs Reservations vs Housekeeping vs Visual Occupancy -->
        <div class="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div class="flex items-center gap-1 text-xs font-semibold">
            <button
              (click)="activeTab.set('rooms')"
              class="px-4 py-2 rounded-xl transition-all"
              [ngClass]="activeTab() === 'rooms' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'"
            >
              Rooms & Front Desk
            </button>
            <button
              (click)="activeTab.set('timeline')"
              class="px-4 py-2 rounded-xl transition-all"
              [ngClass]="activeTab() === 'timeline' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'"
            >
              Visual Occupancy Timeline
            </button>
            <button
              (click)="activeTab.set('reservations')"
              class="px-4 py-2 rounded-xl transition-all"
              [ngClass]="activeTab() === 'reservations' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'"
            >
              Bookings & Folios ({{ hospitality.reservations().length }})
            </button>
            <button
              (click)="activeTab.set('housekeeping')"
              class="px-4 py-2 rounded-xl transition-all"
              [ngClass]="activeTab() === 'housekeeping' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'"
            >
              Housekeeping Dispatch
            </button>
          </div>
        </div>

        <!-- TAB 1: ROOMS & FRONT DESK GRID -->
        @if (activeTab() === 'rooms') {
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            @for (room of hospitality.rooms(); track room.id) {
              <div
                class="bg-white rounded-2xl border-2 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                [ngClass]="{
                  'border-emerald-200': room.status === 'available',
                  'border-indigo-200 bg-indigo-50/10': room.status === 'occupied',
                  'border-purple-200 bg-purple-50/10': room.status === 'reserved',
                  'border-rose-200 bg-rose-50/10': room.status === 'maintenance'
                }"
              >
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xl font-black text-slate-900">Room {{ room.roomNumber }}</span>
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      [ngClass]="{
                        'bg-emerald-100 text-emerald-800': room.status === 'available',
                        'bg-indigo-100 text-indigo-800': room.status === 'occupied',
                        'bg-purple-100 text-purple-800': room.status === 'reserved',
                        'bg-rose-100 text-rose-800': room.status === 'maintenance'
                      }"
                    >
                      {{ room.status }}
                    </span>
                  </div>

                  <div class="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>{{ room.type }}</span>
                    <span class="text-slate-500 font-normal">Floor {{ room.floor }}</span>
                  </div>

                  <div class="text-xs font-bold text-slate-900 mt-2">
                    ₹{{ room.pricePerNight | number:'1.0-0' }} <span class="text-[10px] text-slate-400 font-normal">/ night</span>
                  </div>

                  <!-- Guest info if occupied -->
                  @if (room.status === 'occupied' && room.currentGuest) {
                    <div class="mt-3 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1 text-xs">
                      <div class="font-bold text-indigo-950">{{ room.currentGuest.name }}</div>
                      <div class="text-[11px] text-indigo-700">Check-out: {{ room.currentGuest.checkOut }}</div>
                      <div class="text-[11px] font-semibold text-indigo-900">Folio: ₹{{ room.currentGuest.folioAmount | number:'1.0-0' }}</div>
                    </div>
                  }

                  <!-- Housekeeping badge -->
                  <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span class="text-slate-400">Housekeeping:</span>
                    <span
                      class="font-bold capitalize px-2 py-0.5 rounded-md"
                      [ngClass]="{
                        'bg-emerald-50 text-emerald-700': room.housekeeping === 'clean',
                        'bg-amber-50 text-amber-700': room.housekeeping === 'dirty',
                        'bg-blue-50 text-blue-700': room.housekeeping === 'in-progress',
                        'bg-purple-50 text-purple-700': room.housekeeping === 'inspecting'
                      }"
                    >
                      {{ room.housekeeping }}
                    </span>
                  </div>
                </div>

                <!-- Action Button -->
                <div class="pt-4 mt-3 border-t border-slate-100">
                  @if (room.status === 'available') {
                    <button
                      (click)="assignWalkIn(room)"
                      class="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                    >
                      Check-In Guest →
                    </button>
                  } @else if (room.status === 'occupied') {
                    <button
                      (click)="checkOutRoom(room)"
                      class="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                    >
                      Check-Out & Settle Folio
                    </button>
                  } @else {
                    <button
                      (click)="hospitality.updateRoomStatus(room.id, 'available', 'clean')"
                      class="w-full py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                    >
                      Mark Available
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- TAB 2: VISUAL OCCUPANCY TIMELINE -->
        @if (activeTab() === 'timeline') {
          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs overflow-x-auto">
            <h3 class="text-sm font-bold text-slate-900 mb-1">7-Day Visual Room Occupancy Gantt</h3>
            <p class="text-xs text-slate-500 mb-4">Live room-night booking chart across property floors</p>

            <table class="w-full text-xs text-left">
              <thead>
                <tr class="border-b border-slate-200 text-slate-400 text-[11px] font-bold">
                  <th class="py-2 px-3 w-40">Room</th>
                  <th class="py-2 px-3 text-center">Mon 23</th>
                  <th class="py-2 px-3 text-center bg-slate-50 text-slate-900">Today 24</th>
                  <th class="py-2 px-3 text-center">Wed 25</th>
                  <th class="py-2 px-3 text-center">Thu 26</th>
                  <th class="py-2 px-3 text-center">Fri 27</th>
                  <th class="py-2 px-3 text-center">Sat 28</th>
                  <th class="py-2 px-3 text-center">Sun 29</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (room of hospitality.rooms(); track room.id) {
                  <tr>
                    <td class="py-3 px-3 font-bold text-slate-900">
                      {{ room.roomNumber }}
                      <span class="text-[10px] text-slate-400 font-normal block">{{ room.type }}</span>
                    </td>
                    <!-- Days -->
                    <td class="py-3 px-2 text-center">
                      <div class="h-8 rounded-lg bg-indigo-100 text-indigo-800 font-semibold text-[10px] flex items-center justify-center">
                        Booked
                      </div>
                    </td>
                    <td class="py-3 px-2 text-center bg-slate-50/80">
                      <div
                        class="h-8 rounded-lg font-bold text-[10px] flex items-center justify-center shadow-2xs"
                        [ngClass]="room.status === 'occupied' ? 'bg-indigo-600 text-white' : room.status === 'reserved' ? 'bg-purple-600 text-white' : 'bg-emerald-100 text-emerald-800'"
                      >
                        {{ room.status === 'occupied' ? 'Occupied' : room.status === 'reserved' ? 'Reserved' : 'Vacant' }}
                      </div>
                    </td>
                    <td class="py-3 px-2 text-center">
                      <div class="h-8 rounded-lg text-[10px] flex items-center justify-center"
                        [ngClass]="room.status === 'occupied' ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'bg-slate-50 text-slate-400'">
                        {{ room.status === 'occupied' ? 'Stay' : 'Open' }}
                      </div>
                    </td>
                    <td class="py-3 px-2 text-center">
                      <div class="h-8 rounded-lg text-[10px] flex items-center justify-center"
                        [ngClass]="room.floor === 3 ? 'bg-purple-100 text-purple-800 font-semibold' : 'bg-slate-50 text-slate-400'">
                        {{ room.floor === 3 ? 'VIP' : 'Open' }}
                      </div>
                    </td>
                    <td class="py-3 px-2 text-center">
                      <div class="h-8 rounded-lg bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center">
                        Weekend Rush
                      </div>
                    </td>
                    <td class="py-3 px-2 text-center">
                      <div class="h-8 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                        100% Sold
                      </div>
                    </td>
                    <td class="py-3 px-2 text-center">
                      <div class="h-8 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                        100% Sold
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- TAB 3: RESERVATIONS LIST -->
        @if (activeTab() === 'reservations') {
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div class="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="font-bold text-sm text-slate-900">Guest Bookings & Stays</h3>
                <p class="text-xs text-slate-500">Advance deposits, stay duration and room assignments</p>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600">
                <thead class="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th class="px-5 py-3.5">Booking #</th>
                    <th class="px-5 py-3.5">Guest Name</th>
                    <th class="px-5 py-3.5">Room & Type</th>
                    <th class="px-5 py-3.5">Dates</th>
                    <th class="px-5 py-3.5">Stay Value</th>
                    <th class="px-5 py-3.5">Booking Status</th>
                    <th class="px-5 py-3.5 text-right">Front Desk Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (res of hospitality.reservations(); track res.id) {
                    <tr class="hover:bg-slate-50/60 transition-colors">
                      <td class="px-5 py-3.5 font-bold font-mono text-slate-900">
                        {{ res.bookingNumber }}
                      </td>
                      <td class="px-5 py-3.5">
                        <div class="font-bold text-slate-900">{{ res.guestName }}</div>
                        <span class="text-[11px] text-slate-400">{{ res.guestPhone }}</span>
                      </td>
                      <td class="px-5 py-3.5">
                        <div class="font-bold text-indigo-700">Room {{ res.roomNumber }}</div>
                        <span class="text-[11px] text-slate-500">{{ res.roomType }}</span>
                      </td>
                      <td class="px-5 py-3.5 font-medium text-slate-700">
                        {{ res.checkIn }} → {{ res.checkOut }}
                        <span class="text-[10px] text-slate-400 block">({{ res.nights }} nights)</span>
                      </td>
                      <td class="px-5 py-3.5">
                        <div class="font-bold text-slate-900 text-sm">₹{{ res.totalAmount | number:'1.0-0' }}</div>
                        <span class="text-[10px] font-bold text-emerald-600 uppercase">{{ res.paymentStatus }}</span>
                      </td>
                      <td class="px-5 py-3.5">
                        <span
                          class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
                          [ngClass]="{
                            'bg-emerald-100 text-emerald-800': res.status === 'checked-in',
                            'bg-purple-100 text-purple-800': res.status === 'confirmed',
                            'bg-slate-100 text-slate-800': res.status === 'checked-out'
                          }"
                        >
                          {{ res.status }}
                        </span>
                      </td>
                      <td class="px-5 py-3.5 text-right">
                        @if (res.status === 'confirmed') {
                          <button
                            (click)="hospitality.checkInGuest(res.id)"
                            class="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-2xs"
                          >
                            Check-In →
                          </button>
                        } @else if (res.status === 'checked-in') {
                          <button
                            (click)="hospitality.checkOutGuest(res.id)"
                            class="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-2xs"
                          >
                            Check-Out
                          </button>
                        } @else {
                          <span class="text-slate-400 font-medium">Completed</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- TAB 4: HOUSEKEEPING DISPATCH -->
        @if (activeTab() === 'housekeeping') {
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              @for (room of hospitality.rooms(); track room.id) {
                <div class="bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="font-extrabold text-slate-900 text-sm">Room {{ room.roomNumber }} ({{ room.type }})</span>
                    <span
                      class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase"
                      [ngClass]="{
                        'bg-emerald-100 text-emerald-800': room.housekeeping === 'clean',
                        'bg-amber-100 text-amber-800': room.housekeeping === 'dirty',
                        'bg-blue-100 text-blue-800': room.housekeeping === 'in-progress',
                        'bg-purple-100 text-purple-800': room.housekeeping === 'inspecting'
                      }"
                    >
                      {{ room.housekeeping }}
                    </span>
                  </div>

                  <div class="text-xs text-slate-500">
                    Floor {{ room.floor }} · Current Occupancy: <span class="font-semibold text-slate-800">{{ room.status | uppercase }}</span>
                  </div>

                  <div class="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
                    <button
                      (click)="hospitality.updateRoomStatus(room.id, room.status, 'clean')"
                      class="py-1.5 rounded-lg border border-emerald-200 text-emerald-800 hover:bg-emerald-50 text-[11px] font-bold"
                    >
                      ✓ Mark Clean
                    </button>
                    <button
                      (click)="hospitality.updateRoomStatus(room.id, room.status, 'in-progress')"
                      class="py-1.5 rounded-lg border border-blue-200 text-blue-800 hover:bg-blue-50 text-[11px] font-bold"
                    >
                      ↻ Cleaning
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- WALK-IN BOOKING MODAL -->
        @if (showWalkInModal()) {
          <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 class="text-base font-bold text-slate-900">Front Desk Walk-In Check-In</h3>
                <button (click)="showWalkInModal.set(false)" class="text-slate-400 hover:text-slate-600">
                  <app-icon name="x" [size]="16"></app-icon>
                </button>
              </div>

              <div class="space-y-4 my-4">
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Guest Name</label>
                  <input type="text" [(ngModel)]="walkInGuest" placeholder="e.g. Anand Mahindra" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Contact Phone</label>
                  <input type="text" [(ngModel)]="walkInPhone" placeholder="+91 98290 99887" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="font-semibold text-slate-700 block mb-1">Select Available Room</label>
                    <select [(ngModel)]="walkInRoom" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                      @for (rm of hospitality.rooms(); track rm.id) {
                        @if (rm.status === 'available') {
                          <option [value]="rm.roomNumber">Room {{ rm.roomNumber }} ({{ rm.type }})</option>
                        }
                      }
                    </select>
                  </div>
                  <div>
                    <label class="font-semibold text-slate-700 block mb-1">Stay Duration (Nights)</label>
                    <input type="number" [(ngModel)]="walkInNights" min="1" max="30" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  (click)="showWalkInModal.set(false)"
                  class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  (click)="confirmWalkIn()"
                  class="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  Check-In & Issue Keycard
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class HotelComponent {
  activeTab = signal<'rooms' | 'timeline' | 'reservations' | 'housekeeping'>('rooms');
  showWalkInModal = signal(false);

  walkInGuest = 'Lt. Col. Abhinav Rathore';
  walkInPhone = '+91 98290 33445';
  walkInRoom = '102';
  walkInNights = 3;

  readonly availableRoomsCount = computed(() => this.hospitality.rooms().filter((r) => r.status === 'available').length);
  readonly occupiedRoomsCount = computed(() => this.hospitality.rooms().filter((r) => r.status === 'occupied').length);
  readonly reservedRoomsCount = computed(() => this.hospitality.rooms().filter((r) => r.status === 'reserved').length);
  readonly dirtyRoomsCount = computed(() => this.hospitality.rooms().filter((r) => r.housekeeping === 'dirty').length);

  readonly occupancyPercent = computed(() => {
    const total = this.hospitality.rooms().length;
    if (total === 0) return 0;
    return Math.round((this.occupiedRoomsCount() / total) * 100);
  });

  constructor(
    public hospitality: HospitalityService,
    public entitlements: EntitlementsService,
    public roleService: RoleService,
    private toast: ToastService
  ) {}

  assignWalkIn(room: Room) {
    this.walkInRoom = room.roomNumber;
    this.showWalkInModal.set(true);
  }

  confirmWalkIn() {
    this.hospitality.updateRoomStatus(this.walkInRoom, 'occupied', 'clean');
    this.toast.success('Check-In Complete', `Guest ${this.walkInGuest} checked into Room ${this.walkInRoom}.`);
    this.showWalkInModal.set(false);
  }

  checkOutRoom(room: Room) {
    this.hospitality.updateRoomStatus(room.id, 'available', 'dirty');
    this.toast.info('Guest Checked-Out', `Room ${room.roomNumber} folio settled. Room flagged dirty for housekeeping.`);
  }
}
