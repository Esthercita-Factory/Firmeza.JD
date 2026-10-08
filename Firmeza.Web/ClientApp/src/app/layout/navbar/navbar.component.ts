import { Component, inject, signal, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import { CommandPaletteService } from '../../shared/components/command-palette/command-palette.service';
import { ProductsService } from '../../core/services/products.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { CartService } from '../../core/services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="hud-topbar px-3 px-lg-4 py-2 d-flex align-items-center justify-content-between">
      
      <!-- Left side: Mobile menu toggle + Global Search (Ctrl+K) -->
      <div class="d-flex align-items-center gap-2 gap-lg-3 flex-grow-1">
        <!-- Mobile hamburger toggle -->
        <button class="btn-hud-icon d-lg-none" (click)="toggleMobileSidebar()" aria-label="Abrir menú de navegación">
          <i class="bi bi-list fs-4"></i>
        </button>

        <!-- Command Palette Trigger -->
        <div class="hud-search-trigger d-flex align-items-center justify-content-between px-3 py-2 cursor-pointer"
             (click)="paletteService.open()"
             title="Buscar producto, cliente o ejecutar acción (Ctrl+K)">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-search text-muted"></i>
            <span class="search-label text-muted">Buscar o saltar a módulo...</span>
          </div>
          <div class="shortcut-badge d-none d-sm-inline-flex align-items-center gap-1">
            <span>Ctrl</span>
            <span>+</span>
            <span>K</span>
          </div>
        </div>
      </div>

      <!-- Right side: Notifications, Theme Switcher, User Menu -->
      <div class="d-flex align-items-center gap-2 gap-md-3">

        <!-- Shopping Cart Icon with Live Count -->
        <button class="btn-hud-icon position-relative"
                (click)="goToCart()"
                title="Ver carrito de compras">
          <i class="bi bi-cart3"></i>
          <span *ngIf="cartService.count() > 0" class="notification-badge-pulse">
            {{ cartService.count() }}
          </span>
        </button>
        
        <!-- Low Stock Notifications Dropdown (Solo Administrador) -->
        <div class="position-relative notification-container" *ngIf="authService.isAdmin()">
          <button class="btn-hud-icon position-relative" 
                  (click)="toggleNotifications()"
                  [class.active]="showNotifications()"
                  aria-label="Alertas de stock bajo">
            <i class="bi bi-bell"></i>
            <span *ngIf="lowStockProducts().length > 0" 
                  class="notification-badge-pulse"
                  [attr.aria-label]="lowStockProducts().length + ' alertas de stock bajo'">
              {{ lowStockProducts().length }}
            </span>
          </button>

          <!-- Notifications Dropdown Popover -->
          <div class="hud-notifications-popover hud-panel" *ngIf="showNotifications()">
            <div class="popover-header d-flex align-items-center justify-content-between p-3 border-bottom">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-exclamation-triangle-fill text-warning"></i>
                <span class="fw-semibold">Alertas de Stock Bajo</span>
              </div>
              <span class="badge-status status-danger">
                {{ lowStockProducts().length }} críticas
              </span>
            </div>

            <div class="popover-body p-2" *ngIf="lowStockProducts().length > 0; else noAlerts">
              <div *ngFor="let p of lowStockProducts()" class="notification-item p-2 mb-1 rounded d-flex align-items-center justify-content-between">
                <div>
                  <div class="product-alert-name fw-medium">{{ p.name }}</div>
                  <div class="product-alert-meta text-muted">
                    Stock: <span class="text-danger fw-bold tabular-nums">{{ p.stock }} {{ p.unit }}</span> 
                    (Mín: {{ p.minStock }})
                  </div>
                </div>
                <button class="btn-quick-restock btn-hud-primary" 
                        (click)="quickRestock(p.id, 20)"
                        title="Reponer +20 unidades de inmediato">
                  +20
                </button>
              </div>
            </div>

            <ng-template #noAlerts>
              <div class="text-center py-4 text-muted">
                <i class="bi bi-check-circle-fill text-success fs-3 mb-2 d-block"></i>
                <span class="small">Todo el inventario cuenta con stock óptimo</span>
              </div>
            </ng-template>

            <div class="popover-footer p-2 border-top text-center">
              <a href="javascript:void(0)" (click)="goToProducts()" class="text-cyan small fw-medium">
                Ver todos los productos <i class="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>

        <!-- Light / Dark Mode Toggle -->
        <button class="btn-hud-icon theme-toggle-btn" 
                (click)="themeService.toggleTheme()" 
                [title]="themeService.isDarkMode() ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'"
                aria-label="Alternar tema visual">
          <i class="bi" [class.bi-moon-stars-fill]="!themeService.isDarkMode()" [class.bi-sun-fill]="themeService.isDarkMode()"></i>
        </button>

        <div class="vr my-2" style="background-color: var(--border-color);"></div>

        <!-- User Profile Dropdown -->
        <div class="position-relative user-menu-container">
          <div class="user-pill d-flex align-items-center gap-2 cursor-pointer p-1 pe-2 rounded"
               (click)="toggleUserMenu()">
            <div class="user-avatar d-flex align-items-center justify-content-center">
              <span>{{ (authService.userName() || authService.userRole() || 'US').substring(0, 2).toUpperCase() }}</span>
            </div>
            <div class="d-none d-md-block text-start lh-sm">
              <div class="user-name fw-semibold">{{ authService.userName() || 'Usuario' }}</div>
              <div class="user-role text-cyan">{{ authService.userRole() || 'Cliente' }}</div>
            </div>
            <i class="bi bi-chevron-down text-muted small ms-1"></i>
          </div>

          <!-- User dropdown menu -->
          <div class="user-dropdown hud-panel" *ngIf="showUserMenu()">
            <div class="p-3 border-bottom">
              <div class="fw-bold text-truncate" style="max-width: 200px;">{{ authService.userEmail() || (authService.isAuthenticated() ? 'cliente@firmeza.com' : 'Invitado') }}</div>
              <span class="badge-status status-success mt-1">Rol: {{ authService.userRole() || 'Cliente' }}</span>
            </div>
            <div class="p-1">
              <ng-container *ngIf="authService.isAdmin()">
                <button class="user-menu-item w-100 text-start" (click)="goToPos()">
                  <i class="bi bi-cart me-2 text-cyan"></i> Nueva Venta (POS)
                </button>
                <button class="user-menu-item w-100 text-start" (click)="goToDashboard()">
                  <i class="bi bi-speedometer2 me-2 text-cyan"></i> Dashboard
                </button>
              </ng-container>

              <ng-container *ngIf="authService.isClient()">
                <button class="user-menu-item w-100 text-start" (click)="goToShop()">
                  <i class="bi bi-shop me-2 text-cyan"></i> Catálogo Tienda
                </button>
                <button class="user-menu-item w-100 text-start" (click)="goToCart()">
                  <i class="bi bi-cart3 me-2 text-cyan"></i> Mi Carrito
                </button>
                <button class="user-menu-item w-100 text-start" (click)="router.navigate(['/mis-compras']); showUserMenu.set(false);">
                  <i class="bi bi-bag-check me-2 text-cyan"></i> Mis Pedidos
                </button>
              </ng-container>

              <div class="hud-divider my-1"></div>
              <button class="user-menu-item w-100 text-start text-danger" (click)="logout()">
                <i class="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

      </div>

    </header>
  `,
  styles: [`
    .hud-topbar {
      background-color: var(--bg-panel);
      border-bottom: 1px solid var(--border-color);
      min-height: 64px;
      z-index: 1020;
    }

    .hud-search-trigger {
      background-color: var(--bg-base);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-pill);
      min-width: 220px;
      max-width: 440px;
      width: 100%;
      height: 40px;
      transition: all var(--transition-fast);
      cursor: pointer;
    }
    .hud-search-trigger:hover {
      border-color: var(--accent-primary);
      box-shadow: var(--accent-primary-glow);
    }
    .search-label {
      font-size: 13.5px;
    }

    .shortcut-badge {
      background-color: var(--bg-panel);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: 11px;
      padding: 1px 7px;
      border-radius: 4px;
      font-family: var(--font-heading);
      letter-spacing: 0.05em;
    }

    .notification-badge-pulse {
      position: absolute;
      top: -4px;
      right: -4px;
      background-color: var(--color-danger);
      color: white;
      font-size: 10.5px;
      font-weight: 700;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--bg-panel);
      animation: liveDotPulse 2s infinite;
    }

    .hud-notifications-popover {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 340px;
      z-index: 1050;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
      border: 1px solid var(--border-color);
    }

    .notification-item {
      background-color: var(--bg-base);
      border: 1px solid var(--border-color);
    }
    .product-alert-name {
      font-size: 13px;
    }
    .product-alert-meta {
      font-size: 11.5px;
    }
    .btn-quick-restock {
      font-size: 11px;
      padding: 3px 8px;
      min-height: 28px;
      height: 28px;
    }

    .user-pill {
      border: 1px solid transparent;
      transition: all var(--transition-fast);
    }
    .user-pill:hover {
      background-color: var(--bg-panel-hover);
      border-color: var(--border-color);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
      color: #0B1020;
      font-weight: 700;
      font-size: 13px;
      font-family: var(--font-heading);
    }

    .user-name {
      font-size: 13.5px;
      color: var(--text-main);
    }
    .user-role {
      font-size: 11px;
      font-weight: 600;
    }

    .user-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 220px;
      z-index: 1050;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
    }

    .user-menu-item {
      background: transparent;
      border: none;
      color: var(--text-main);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: all var(--transition-fast);
    }
    .user-menu-item:hover {
      background-color: var(--bg-panel-hover);
    }
    .text-cyan {
      color: var(--accent-primary);
    }
  `]
})
export class NavbarComponent {
  themeService = inject(ThemeService);
  paletteService = inject(CommandPaletteService);
  productsService = inject(ProductsService);
  authService = inject(AuthService);
  cartService = inject(CartService);
  toastService = inject(ToastService);
  router = inject(Router);
  private elementRef = inject(ElementRef);

  @Output() toggleMobileSidebarEvent = new EventEmitter<void>();

  showNotifications = signal<boolean>(false);
  showUserMenu = signal<boolean>(false);

  lowStockProducts = () => {
    return this.productsService.getAll().filter(p => p.stock <= p.minStock);
  };

  toggleMobileSidebar() {
    this.toggleMobileSidebarEvent.emit();
  }

  toggleNotifications() {
    this.showNotifications.set(!this.showNotifications());
    this.showUserMenu.set(false);
  }

  toggleUserMenu() {
    this.showUserMenu.set(!this.showUserMenu());
    this.showNotifications.set(false);
  }

  quickRestock(productId: number, quantity: number) {
    const p = this.productsService.replenishStock(productId, quantity);
    if (p) {
      this.toastService.show(`Se añadieron +${quantity} ${p.unit} a ${p.name}`, 'success');
    }
  }

  goToProducts() {
    this.showNotifications.set(false);
    this.router.navigate(['/products']);
  }

  goToShop() {
    this.showUserMenu.set(false);
    this.router.navigate(['/tienda']);
  }

  goToPos() {
    this.showUserMenu.set(false);
    this.router.navigate(['/pos']);
  }

  goToCart() {
    this.router.navigate(['/carrito']);
  }

  goToDashboard() {
    this.showUserMenu.set(false);
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.showUserMenu.set(false);
    this.authService.logout();
    this.toastService.show('Sesión cerrada correctamente', 'info');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showNotifications.set(false);
      this.showUserMenu.set(false);
    }
  }
}
