import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';
import { EntitlementsService } from '../../services/entitlements.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-locked-feature',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="bg-gradient-to-b from-slate-50 to-white border border-slate-200/80 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm my-8">
      <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
        <app-icon name="lock" [size]="28"></app-icon>
      </div>

      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/70 text-amber-800 mb-3">
        <app-icon name="sparkles" [size]="12"></app-icon>
        {{ planRequirement }} Feature
      </span>

      <h3 class="text-xl font-bold text-slate-900 mb-2">{{ featureTitle }}</h3>
      <p class="text-sm text-slate-600 mb-6 leading-relaxed">
        {{ description || 'This premium capability is part of the ' + planRequirement + ' tier. Unlock enterprise automation, multi-unit governance, and deep operational analytics.' }}
      </p>

      <div class="flex items-center justify-center gap-3">
        <button
          (click)="upgradePlan()"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm"
        >
          <app-icon name="sparkles" [size]="15" class="text-amber-400"></app-icon>
          Instant Upgrade to {{ planRequirement }}
        </button>
        <button
          (click)="contactSupport()"
          class="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors"
        >
          Contact Super Admin
        </button>
      </div>
    </div>
  `,
})
export class LockedFeatureComponent {
  @Input() featureTitle: string = 'Enterprise Feature';
  @Input() planRequirement: string = 'Enterprise';
  @Input() description?: string;

  constructor(
    private entitlements: EntitlementsService,
    private toast: ToastService
  ) {}

  upgradePlan() {
    this.entitlements.setPlan('Enterprise');
    this.toast.success('Plan Upgraded', 'Your organization is now upgraded to the Enterprise tier! All modules unlocked.');
  }

  contactSupport() {
    this.toast.info('Request Dispatched', 'A feature entitlement request was logged for platform administrators.');
  }
}
