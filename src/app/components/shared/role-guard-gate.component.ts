import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RoleService } from '../../services/role.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-role-guard-gate',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm text-center">
      <div class="w-16 h-16 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center mx-auto mb-4">
        <app-icon name="lock" [size]="32"></app-icon>
      </div>

      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 mb-3">
        PetPooja Role Permissions Guard
      </div>

      <h2 class="text-xl font-black text-slate-900 tracking-tight mb-2">
        Restricted to {{ requiredRole }} Role
      </h2>

      <p class="text-xs text-slate-500 mb-5 leading-relaxed max-w-md mx-auto">
        You are currently logged in as
        <span class="font-bold text-slate-900 uppercase">[{{ roleService.currentUser().name }} · {{ roleService.currentRole() }}]</span>.
        This screen requires elevated permissions.
      </p>

      <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-6 text-left text-xs space-y-2">
        <div class="font-bold text-slate-800">Allowed views for your role:</div>
        <div class="flex flex-wrap gap-1.5">
          @for (rt of roleService.currentUser().allowedRoutes; track rt) {
            <span class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-700">
              {{ rt }}
            </span>
          }
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          (click)="roleService.switchRole('manager')"
          class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <app-icon name="shield" [size]="15" class="text-emerald-400"></app-icon>
          <span>Switch to General Manager (Lucky Jain)</span>
        </button>

        <button
          (click)="goBack()"
          class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-700 cursor-pointer"
        >
          Return to My Floor
        </button>
      </div>
    </div>
  `,
})
export class RoleGuardGateComponent {
  @Input() requiredRole: string = 'General Manager';

  constructor(
    public roleService: RoleService,
    private router: Router
  ) {}

  goBack() {
    const allowed = this.roleService.currentUser().allowedRoutes[0] || '/dashboard';
    this.router.navigate([allowed]);
  }
}
