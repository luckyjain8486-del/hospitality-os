import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastsSignal = signal<Toast[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  show(type: 'success' | 'info' | 'warning' | 'error', title: string, message: string, durationMs = 4000) {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newToast: Toast = { id, type, title, message, timestamp: Date.now() };

    this.toastsSignal.update((list) => [...list, newToast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.remove(id);
      }, durationMs);
    }
  }

  success(title: string, message: string) {
    this.show('success', title, message);
  }

  info(title: string, message: string) {
    this.show('info', title, message);
  }

  warning(title: string, message: string) {
    this.show('warning', title, message);
  }

  error(title: string, message: string) {
    this.show('error', title, message);
  }

  remove(id: string) {
    this.toastsSignal.update((list) => list.filter((t) => t.id !== id));
  }
}
