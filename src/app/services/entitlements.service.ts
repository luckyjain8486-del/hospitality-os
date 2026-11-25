import { Injectable, signal, computed } from '@angular/core';
import { FeatureEntitlement } from '../models/hospitality.model';
import { INITIAL_ENTITLEMENTS } from './hospitality-data';

@Injectable({
  providedIn: 'root',
})
export class EntitlementsService {
  private readonly STORAGE_KEY = 'hospitalityos_entitlements_v1';
  private readonly PLAN_STORAGE_KEY = 'hospitalityos_current_plan_v1';

  // Current tenant subscription plan
  readonly currentPlan = signal<'Starter' | 'Growth' | 'Enterprise'>('Growth');

  // List of all platform features with their plan matrix
  readonly entitlements = signal<FeatureEntitlement[]>(this.loadEntitlements());

  constructor() {
    this.loadSavedPlan();
  }

  private loadEntitlements(): FeatureEntitlement[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading entitlements from localStorage', e);
    }
    return INITIAL_ENTITLEMENTS;
  }

  private loadSavedPlan() {
    try {
      const savedPlan = localStorage.getItem(this.PLAN_STORAGE_KEY);
      if (savedPlan && ['Starter', 'Growth', 'Enterprise'].includes(savedPlan)) {
        this.currentPlan.set(savedPlan as any);
      }
    } catch (e) {
      console.error('Error loading plan from localStorage', e);
    }
  }

  setPlan(plan: 'Starter' | 'Growth' | 'Enterprise') {
    this.currentPlan.set(plan);
    try {
      localStorage.setItem(this.PLAN_STORAGE_KEY, plan);
    } catch (e) {}
  }

  toggleFeatureForPlan(featureId: string, plan: 'starter' | 'growth' | 'enterprise') {
    this.entitlements.update((list) => {
      const updated = list.map((item) => {
        if (item.id === featureId) {
          return {
            ...item,
            [plan]: !item[plan],
          };
        }
        return item;
      });
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }

  isFeatureEnabled(featureId: string): boolean {
    const feature = this.entitlements().find((f) => f.id === featureId);
    if (!feature) return true;

    const plan = this.currentPlan().toLowerCase() as 'starter' | 'growth' | 'enterprise';
    return !!feature[plan];
  }

  getFeature(featureId: string): FeatureEntitlement | undefined {
    return this.entitlements().find((f) => f.id === featureId);
  }

  resetEntitlements() {
    this.entitlements.set(INITIAL_ENTITLEMENTS);
    this.currentPlan.set('Growth');
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.PLAN_STORAGE_KEY);
    } catch (e) {}
  }
}
