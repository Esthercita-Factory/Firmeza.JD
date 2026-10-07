import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="sidebar panel h-100 p-3 d-flex flex-column">
      <div class="brand mb-4 px-2">
        <h2 class="hud-text text-primary m-0 d-flex align-items-center">
          <i class="bi bi-hexagon-fill me-2"></i> FIRMEZA
        </h2>
      </div>

      <nav class="nav flex-column gap-2">
        <a class="nav-link rounded" routerLink="/dashboard" routerLinkActive="active">
          <i class="bi bi-grid-1x2-fill me-2"></i> Dashboard
        </a>
        <a class="nav-link rounded" routerLink="/pos" routerLinkActive="active">
          <i class="bi bi-cart-fill me-2"></i> Nueva Venta
        </a>
        <div class="mt-3 mb-1 px-2 text-uppercase text-muted" style="font-size: 0.75rem; letter-spacing: 1px;">Gestión</div>
        <a class="nav-link rounded" routerLink="/products" routerLinkActive="active">
          <i class="bi bi-box-seam-fill me-2"></i> Productos
        </a>
        <a class="nav-link rounded" routerLink="/customers" routerLinkActive="active">
          <i class="bi bi-people-fill me-2"></i> Clientes
        </a>
        <a class="nav-link rounded" routerLink="/sales" routerLinkActive="active">
          <i class="bi bi-receipt me-2"></i> Ventas
        </a>
      </nav>
      
      <div class="mt-auto">
        <div class="card bg-transparent border-0 shadow-none p-2 text-center hud-text">
          <small class="text-muted">v2.0 (Angular)</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      border-right: var(--panel-border);
      border-top: none;
      border-bottom: none;
      border-left: none;
      border-radius: 0;
    }
    
    .nav-link {
      color: var(--text-muted);
      font-weight: 500;
      transition: all 0.2s ease;
      padding: 0.75rem 1rem;
    }
    
    .nav-link:hover {
      color: var(--text-main);
      background-color: color-mix(in srgb, var(--bg-base) 80%, var(--bg-panel));
    }
    
    .nav-link.active {
      color: var(--accent-primary);
      background-color: color-mix(in srgb, var(--accent-primary) 10%, transparent);
      border-left: 3px solid var(--accent-primary);
      border-radius: 0 6px 6px 0 !important;
    }
    
    body.theme-dark .nav-link.active {
      box-shadow: inset 2px 0 10px rgba(6, 182, 212, 0.1);
      border-color: var(--accent-primary);
    }
  `]
})
export class SidebarComponent {}
