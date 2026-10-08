import { Component, signal, Output, EventEmitter, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="hud-sidebar d-flex flex-column h-100" 
           [class.collapsed]="isCollapsed"
           [class.mobile-open]="isMobileOpen">
      
      <!-- Brand / Logo -->
      <div class="sidebar-header d-flex align-items-center justify-content-between px-3 py-3 border-bottom">
        <a [routerLink]="authService.isClient() ? '/tienda' : '/dashboard'" class="d-flex align-items-center gap-2 text-decoration-none">
          <div class="logo-symbol d-flex align-items-center justify-content-center">
            <i class="bi bi-layers-half text-cyan"></i>
          </div>
          <div class="brand-text" *ngIf="!isCollapsed">
            <span class="firmeza-logo-brand text-main">FIRMEZA</span>
            <span class="hud-tag">{{ authService.isClient() ? 'PORTAL CLIENTE' : 'POS · HUD' }}</span>
          </div>
        </a>

        <!-- Collapse toggle button (desktop) -->
        <button class="btn-toggle-sidebar d-none d-lg-flex" 
                (click)="toggleCollapse()" 
                [title]="isCollapsed ? 'Expandir menú' : 'Colapsar menú'">
          <i class="bi" [class.bi-chevron-left]="!isCollapsed" [class.bi-chevron-right]="isCollapsed"></i>
        </button>

        <!-- Close button (mobile) -->
        <button class="btn-toggle-sidebar d-lg-none" (click)="closeMobile()">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Navigation links -->
      <nav class="sidebar-nav flex-grow-1 py-3 px-2 d-flex flex-column gap-1">
        
        <!-- SECCIÓN OPERACIONES (ADMIN) -->
        <ng-container *ngIf="authService.isAdmin()">
          <div class="nav-section-title px-2 py-1 text-uppercase" *ngIf="!isCollapsed">
            Operaciones
          </div>

          <!-- POS - Nueva Venta (Destacado para Admin) -->
          <a class="sidebar-link pos-highlight" 
             routerLink="/pos" 
             routerLinkActive="active"
             [title]="isCollapsed ? 'Nueva Venta (POS)' : ''">
            <div class="link-icon">
              <i class="bi bi-cart-plus-fill"></i>
            </div>
            <span class="link-text" *ngIf="!isCollapsed">Nueva Venta</span>
            <span class="badge-star ms-auto" *ngIf="!isCollapsed">POS</span>
          </a>

          <!-- Dashboard de Control (Gráficos y Métricas) -->
          <a class="sidebar-link" 
             routerLink="/dashboard" 
             routerLinkActive="active"
             [title]="isCollapsed ? 'Dashboard de Control' : ''">
            <div class="link-icon">
              <i class="bi bi-grid-1x2-fill"></i>
            </div>
            <span class="link-text" *ngIf="!isCollapsed">Dashboard</span>
          </a>
        </ng-container>

        <!-- SECCIÓN GESTIÓN (ADMIN) -->
        <ng-container *ngIf="authService.isAdmin()">
          <div class="nav-section-title px-2 pt-3 pb-1 text-uppercase" *ngIf="!isCollapsed">
            Gestión ERP
          </div>

          <!-- Productos -->
          <a class="sidebar-link" 
             routerLink="/products" 
             routerLinkActive="active"
             [title]="isCollapsed ? 'Productos e Inventario' : ''">
            <div class="link-icon">
              <i class="bi bi-box-seam-fill"></i>
            </div>
            <span class="link-text" *ngIf="!isCollapsed">Productos</span>
          </a>

          <!-- Clientes -->
          <a class="sidebar-link" 
             routerLink="/customers" 
             routerLinkActive="active"
             [title]="isCollapsed ? 'Clientes' : ''">
            <div class="link-icon">
              <i class="bi bi-people-fill"></i>
            </div>
            <span class="link-text" *ngIf="!isCollapsed">Clientes</span>
          </a>

          <!-- Ventas -->
          <a class="sidebar-link" 
             routerLink="/sales" 
             routerLinkActive="active"
             [title]="isCollapsed ? 'Historial de Ventas' : ''">
            <div class="link-icon">
              <i class="bi bi-receipt"></i>
            </div>
            <span class="link-text" *ngIf="!isCollapsed">Ventas</span>
          </a>
        </ng-container>

        <!-- SECCIÓN TIENDA Y PEDIDOS -->
        <div class="nav-section-title px-2 pt-3 pb-1 text-uppercase" *ngIf="!isCollapsed">
          Tienda & Pedidos
        </div>

        <!-- Catálogo Tienda -->
        <a class="sidebar-link" 
           routerLink="/tienda" 
           routerLinkActive="active"
           [title]="isCollapsed ? 'Catálogo de Productos' : ''">
          <div class="link-icon">
            <i class="bi bi-shop"></i>
          </div>
          <span class="link-text" *ngIf="!isCollapsed">Catálogo Tienda</span>
        </a>

        <!-- Mi Carrito -->
        <a class="sidebar-link" 
           routerLink="/carrito" 
           routerLinkActive="active"
           [title]="isCollapsed ? 'Carrito de Compras' : ''">
          <div class="link-icon">
            <i class="bi bi-cart3"></i>
          </div>
          <span class="link-text" *ngIf="!isCollapsed">Mi Carrito</span>
        </a>

        <!-- Mis Pedidos -->
        <a class="sidebar-link" 
           routerLink="/mis-compras" 
           routerLinkActive="active"
           [title]="isCollapsed ? 'Mis Pedidos & Comprobantes' : ''">
          <div class="link-icon">
            <i class="bi bi-bag-check"></i>
          </div>
          <span class="link-text" *ngIf="!isCollapsed">Mis Pedidos</span>
        </a>

      </nav>

      <!-- System status bottom bar -->
      <div class="sidebar-footer p-3 border-top">
        <div class="system-status d-flex align-items-center gap-2" *ngIf="!isCollapsed">
          <span class="live-indicator-dot"></span>
          <div class="d-flex flex-column">
            <span class="status-title">CABINA EN VIVO</span>
            <span class="status-sub">Sincronizado</span>
          </div>
        </div>
        <div class="text-center" *ngIf="isCollapsed" title="Sistema en línea y sincronizado">
          <span class="live-indicator-dot"></span>
        </div>
      </div>

    </aside>

    <!-- Backdrop for mobile drawer -->
    <div class="mobile-backdrop d-lg-none" *ngIf="isMobileOpen" (click)="closeMobile()"></div>
  `,
  styles: [`
    .hud-sidebar {
      width: 250px;
      background-color: var(--bg-panel);
      border-right: 1px solid var(--border-color);
      transition: width var(--transition-smooth), transform var(--transition-smooth);
      position: relative;
      z-index: 1040;
    }

    .hud-sidebar.collapsed {
      width: 76px;
    }

    .logo-symbol {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
      border: 1px solid var(--accent-primary);
      box-shadow: 0 0 10px rgba(34, 211, 238, 0.25);
    }

    .text-cyan {
      color: var(--accent-primary);
      font-size: 1.15rem;
    }

    .firmeza-logo-brand {
      font-size: 1.05rem;
      display: block;
      line-height: 1.1;
      letter-spacing: 0.1em;
    }

    .hud-tag {
      font-size: 10px;
      color: var(--accent-primary);
      font-family: var(--font-heading);
      letter-spacing: 0.12em;
    }

    .btn-toggle-sidebar {
      width: 30px;
      height: 30px;
      border-radius: 6px;
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .btn-toggle-sidebar:hover {
      color: var(--accent-primary);
      border-color: var(--accent-primary);
    }

    .nav-section-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }

    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-weight: 500;
      text-decoration: none;
      transition: all var(--transition-fast);
      position: relative;
    }

    .sidebar-link:hover {
      color: var(--text-main);
      background-color: var(--bg-panel-hover);
    }

    .sidebar-link.active {
      color: var(--accent-primary);
      background-color: var(--accent-primary-soft);
      border: 1px solid var(--accent-primary);
      box-shadow: var(--accent-primary-glow);
    }

    .sidebar-link.pos-highlight {
      border: 1px dashed rgba(34, 211, 238, 0.4);
    }
    .sidebar-link.pos-highlight:hover {
      border-color: var(--accent-primary);
    }

    .link-icon {
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      flex-shrink: 0;
    }

    .link-text {
      white-space: nowrap;
      font-size: 13.5px;
    }

    .badge-star {
      background: var(--accent-primary);
      color: #0B1020;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      font-family: var(--font-heading);
    }

    .sidebar-footer {
      background: var(--bg-base);
    }

    .status-title {
      font-family: var(--font-heading);
      font-size: 11px;
      font-weight: 600;
      color: var(--color-success);
      letter-spacing: 0.05em;
    }
    .status-sub {
      font-size: 10px;
      color: var(--text-muted);
    }

    /* Mobile drawer */
    @media (max-width: 991.98px) {
      .hud-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        transform: translateX(-100%);
        width: 260px !important;
      }
      .hud-sidebar.mobile-open {
        transform: translateX(0);
      }
      .mobile-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(4px);
        z-index: 1030;
      }
    }
  `]
})
export class SidebarComponent {
  public authService = inject(AuthService);
  @Input() isCollapsed = false;
  @Input() isMobileOpen = false;
  @Output() collapseChange = new EventEmitter<boolean>();
  @Output() closeMobileEvent = new EventEmitter<void>();

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.collapseChange.emit(this.isCollapsed);
  }

  closeMobile() {
    this.isMobileOpen = false;
    this.closeMobileEvent.emit();
  }
}
