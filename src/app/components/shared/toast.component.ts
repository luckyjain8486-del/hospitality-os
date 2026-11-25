import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      @for (t of toastService.toasts(); track t.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm transition-all duration-300 transform translate-y-0"
          [ngClass]="{
            'bg-white border-emerald-200 text-slate-800 shadow-emerald-500/10': t.type === 'success',
            'bg-white border-blue-200 text-slate-800 shadow-blue-500/10': t.type === 'info',
            'bg-white border-amber-200 text-slate-800 shadow-amber-500/10': t.type === 'warning',
            'bg-white border-rose-200 text-slate-800 shadow-rose-500/10': t.type === 'error'
          }"
        >
          <div
            class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
            [ngClass]="{
              'bg-emerald-50 text-emerald-600': t.type === 'success',
              'bg-blue-50 text-blue-600': t.type === 'info',
              'bg-amber-50 text-amber-600': t.type === 'warning',
              'bg-rose-50 text-rose-600': t.type === 'error'
            }"
          >
            @switch (t.type) {
              @case ('success') { <app-icon name="check" [size]="16"></app-icon> }
              @case ('warning') { <app-icon name="alert-circle" [size]="16"></app-icon> }
              @case ('error') { <app-icon name="x" [size]="16"></app-icon> }
              @default { <app-icon name="help" [size]="16"></app-icon> }
            }
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-slate-900 leading-snug">{{ t.title }}</h4>
            <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">{{ t.message }}</p>
          </div>
          <button
            (click)="toastService.remove(t.id)"
            class="text-slate-400 hover:text-slate-600 p-1 -mr-1 rounded-md transition-colors"
          >
            <app-icon name="x" [size]="14"></app-icon>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
