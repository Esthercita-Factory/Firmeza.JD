import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1080;">
      <div *ngFor="let toast of toastService.toasts()" 
           class="toast show align-items-center hud-panel toast-slide-in mb-2 p-1"
           [ngClass]="'toast-' + toast.type"
           role="alert" 
           aria-live="assertive" 
           aria-atomic="true">
        <div class="d-flex align-items-center justify-content-between w-100 p-2">
          <div class="d-flex align-items-center gap-2">
            <div class="toast-icon-wrapper d-flex align-items-center justify-content-center" [ngClass]="'icon-' + toast.type">
              <i class="bi fs-5" [ngClass]="toast.icon"></i>
            </div>
            <div class="toast-content">
              <span class="toast-text fw-medium">{{ toast.message }}</span>
            </div>
          </div>
          <button type="button" 
                  class="btn-close-hud ms-3" 
                  (click)="toastService.remove(toast.id)"
                  aria-label="Cerrar notificación">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast {
      min-width: 300px;
      max-width: 420px;
      background-color: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    .toast-text {
      color: var(--text-main);
      font-size: 13.5px;
    }
    .toast-icon-wrapper {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      flex-shrink: 0;
    }
    .icon-success {
      background-color: var(--color-success-bg);
      color: var(--color-success);
    }
    .icon-warning {
      background-color: var(--color-warning-bg);
      color: var(--color-warning);
    }
    .icon-danger {
      background-color: var(--color-danger-bg);
      color: var(--color-danger);
    }
    .icon-info {
      background-color: var(--accent-primary-soft);
      color: var(--accent-primary);
    }
    .toast-success { border-left: 3px solid var(--color-success); }
    .toast-warning { border-left: 3px solid var(--color-warning); }
    .toast-danger  { border-left: 3px solid var(--color-danger); }
    .toast-info    { border-left: 3px solid var(--accent-primary); }

    .btn-close-hud {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 18px;
      padding: 2px 6px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      transition: color var(--transition-fast), background-color var(--transition-fast);
    }
    .btn-close-hud:hover {
      color: var(--text-main);
      background-color: var(--bg-panel-hover);
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
