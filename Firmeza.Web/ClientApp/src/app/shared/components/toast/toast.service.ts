import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private counter = 0;

  show(message: string, type: 'success' | 'warning' | 'danger' | 'info' = 'info') {
    const id = this.counter++;
    let icon = 'bi-info-circle';
    if (type === 'success') icon = 'bi-check-circle';
    if (type === 'warning') icon = 'bi-exclamation-triangle';
    if (type === 'danger') icon = 'bi-x-circle';

    this.toasts.update(t => [...t, { id, message, type, icon }]);
    setTimeout(() => this.remove(id), 5000);
  }

  remove(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
