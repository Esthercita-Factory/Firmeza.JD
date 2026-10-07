import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1055">
      <div *ngFor="let toast of toastService.toasts()" class="toast show align-items-center border-0 panel hud-active mb-2" role="alert" aria-live="assertive" aria-atomic="true"
           [ngClass]="'border-' + toast.type">
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center gap-2">
            <i class="bi fs-5 text-{{toast.type}}" [ngClass]="toast.icon"></i>
            <span class="text-main">{{ toast.message }}</span>
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" (click)="toastService.remove(toast.id)"></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast {
      background-color: var(--bg-panel);
      box-shadow: var(--panel-shadow);
      color: var(--text-main);
    }
    body.theme-dark .toast {
      border: 1px solid var(--border-color);
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
