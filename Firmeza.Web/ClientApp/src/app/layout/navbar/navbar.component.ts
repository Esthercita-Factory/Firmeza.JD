import { Component, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgIf],
  template: `
    <header class="panel px-4 py-3 d-flex align-items-center justify-content-between" style="border-radius: 0; border-bottom: var(--panel-border); border-top: none; border-left: none; border-right: none;">
      
      <div class="d-flex align-items-center">
        <button class="btn btn-sm btn-link d-lg-none me-3 p-0 text-muted">
          <i class="bi bi-list fs-4"></i>
        </button>
        
        <div class="search-palette rounded-pill d-flex align-items-center px-3 py-2 cursor-pointer" title="Paleta de Comandos">
          <i class="bi bi-search text-muted me-2"></i>
          <span class="text-muted small me-4">Buscar módulo o crear venta...</span>
          <span class="badge bg-secondary text-light ms-auto">Ctrl + K</span>
        </div>
      </div>

      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-icon theme-toggle rounded-circle" (click)="themeService.toggleTheme()">
          <i class="bi" [class.bi-moon-fill]="!themeService.isDarkMode()" [class.bi-sun-fill]="themeService.isDarkMode()"></i>
        </button>
        
        <div class="vr mx-1"></div>
        
        <div class="d-flex align-items-center gap-2 cursor-pointer">
          <div class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;">
            A
          </div>
          <div class="d-none d-md-block lh-1">
            <div class="small fw-bold">Admin</div>
            <div class="text-muted" style="font-size: 0.7rem;">Administrador</div>
          </div>
        </div>
      </div>

    </header>
  `,
  styles: [`
    .search-palette {
      background-color: var(--bg-base);
      border: 1px solid var(--border-color);
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    .search-palette:hover {
      border-color: var(--accent-primary);
      box-shadow: var(--accent-glow);
    }
    
    .btn-icon {
      width: 38px;
      height: 38px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-base);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      transition: all 0.2s;
    }
    
    .btn-icon:hover {
      color: var(--accent-primary);
      border-color: var(--accent-primary);
    }
    
    body.theme-dark .btn-icon:hover {
      box-shadow: var(--accent-glow);
    }
    
    .cursor-pointer { cursor: pointer; }
  `]
})
export class NavbarComponent {
  themeService = inject(ThemeService);
}
