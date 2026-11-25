import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../services/role.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-manager-pin-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    @if (roleService.showPinModal()) {
      <div class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-slate-800 text-center animate-in zoom-in-95 duration-150">
          <!-- Icon Header -->
          <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <app-icon name="shield" [size]="28"></app-icon>
          </div>

          <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 mb-2">
            PetPooja Authorization Protocol
          </div>

          <h3 class="text-lg font-black text-slate-900">Manager Override Required</h3>
          <p class="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
            Role <span class="font-bold text-slate-800 uppercase">[{{ roleService.currentRole() }}]</span> requires General Manager PIN authorization for:
            <span class="font-bold text-indigo-700 block mt-0.5">"{{ roleService.pendingActionName() }}"</span>
          </p>

          <!-- PIN Display Dots -->
          <div class="flex items-center justify-center gap-3 mb-5">
            @for (i of [0, 1, 2, 3]; track i) {
              <div
                class="w-4 h-4 rounded-full border-2 transition-all"
                [ngClass]="enteredPin().length > i ? 'bg-slate-900 border-slate-900 scale-110' : 'border-slate-300 bg-slate-100'"
              ></div>
            }
          </div>

          <!-- Numeric Numpad -->
          <div class="grid grid-cols-3 gap-2.5 max-w-[220px] mx-auto mb-4">
            @for (digit of ['1', '2', '3', '4', '5', '6', '7', '8', '9']; track digit) {
              <button
                (click)="appendDigit(digit)"
                class="w-16 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/90 font-bold text-base text-slate-900 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
              >
                {{ digit }}
              </button>
            }
            <button
              (click)="clearPin()"
              class="w-16 h-12 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all flex items-center justify-center cursor-pointer"
            >
              Clear
            </button>
            <button
              (click)="appendDigit('0')"
              class="w-16 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 font-bold text-base text-slate-900 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
            >
              0
            </button>
            <button
              (click)="submitPin()"
              class="w-16 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center cursor-pointer"
            >
              OK
            </button>
          </div>

          <!-- Quick Test Bypass -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              (click)="autoFillManagerPin()"
              class="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] underline cursor-pointer"
            >
              ⚡ Quick Fill Manager PIN (1234)
            </button>

            <button
              (click)="roleService.closePinModal(); clearPin()"
              class="text-slate-400 hover:text-slate-600 font-semibold text-[11px]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ManagerPinModalComponent {
  enteredPin = signal('');

  constructor(public roleService: RoleService) {}

  appendDigit(digit: string) {
    if (this.enteredPin().length < 4) {
      this.enteredPin.update((p) => p + digit);
      if (this.enteredPin().length === 4) {
        // Auto-submit on 4th digit
        setTimeout(() => this.submitPin(), 100);
      }
    }
  }

  clearPin() {
    this.enteredPin.set('');
  }

  submitPin() {
    if (this.enteredPin().length > 0) {
      const ok = this.roleService.submitManagerPin(this.enteredPin());
      if (!ok) {
        this.clearPin();
      }
    }
  }

  autoFillManagerPin() {
    this.enteredPin.set('1234');
    setTimeout(() => this.submitPin(), 100);
  }
}
