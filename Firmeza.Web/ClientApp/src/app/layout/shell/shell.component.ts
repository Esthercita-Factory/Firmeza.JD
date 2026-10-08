import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommandPaletteComponent } from '../../shared/components/command-palette/command-palette.component';

interface BreadcrumbItem {
  label: string;
  url?: string;
  active?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterModule,
    SidebarComponent, 
    NavbarComponent, 
    CommandPaletteComponent
  ],
  template: `
    <div class="hud-app-layout d-flex h-100" [class.sidebar-is-collapsed]="isSidebarCollapsed()">
      
      <!-- Collapsible Sidebar -->
      <app-sidebar [isCollapsed]="isSidebarCollapsed()"
                   [isMobileOpen]="isMobileOpen()"
                   (collapseChange)="onSidebarCollapseChange($event)"
                   (closeMobileEvent)="isMobileOpen.set(false)">
      </app-sidebar>

      <!-- Main App Container -->
      <div class="hud-main-wrapper flex-grow-1 d-flex flex-column" style="min-width: 0;">
        <!-- Topbar / Navbar -->
        <app-navbar (toggleMobileSidebarEvent)="toggleMobileSidebar()"></app-navbar>

        <!-- Breadcrumbs bar (for internal navigation as requested in brief) -->
        <div class="hud-breadcrumbs-bar px-3 px-lg-4 py-2 d-flex align-items-center justify-content-between">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb m-0 d-flex align-items-center gap-1">
              <li class="breadcrumb-item">
                <a routerLink="/dashboard" class="d-flex align-items-center gap-1 text-muted text-decoration-none small">
                  <i class="bi bi-house-door"></i>
                  <span>Firmeza</span>
                </a>
              </li>
              <li *ngFor="let item of breadcrumbs()" 
                  class="breadcrumb-item d-flex align-items-center gap-1 small"
                  [class.active]="item.active"
                  [attr.aria-current]="item.active ? 'page' : null">
                <span class="breadcrumb-separator text-muted">/</span>
                <a *ngIf="item.url && !item.active" [routerLink]="item.url" class="text-muted text-decoration-none">
                  {{ item.label }}
                </a>
                <span *ngIf="item.active" class="text-cyan fw-medium">
                  {{ item.label }}
                </span>
              </li>
            </ol>
          </nav>

          <div class="d-none d-md-flex align-items-center gap-2">
            <span class="system-time small text-muted tabular-nums">{{ currentTime() }}</span>
          </div>
        </div>

        <!-- Scrollable Router Outlet Area -->
        <main class="hud-main-content flex-grow-1 p-3 p-lg-4">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Global Command Palette (Ctrl+K) -->
      <app-command-palette></app-command-palette>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background-color: var(--bg-base);
    }

    .hud-app-layout {
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }

    .hud-main-wrapper {
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .hud-breadcrumbs-bar {
      background-color: var(--bg-base);
      border-bottom: 1px solid var(--border-color);
      min-height: 38px;
    }

    .breadcrumb-separator {
      font-size: 11px;
    }

    .text-cyan {
      color: var(--accent-primary);
    }

    .system-time {
      font-size: 11.5px;
      font-family: var(--font-numbers);
      letter-spacing: 0.05em;
    }

    .hud-main-content {
      overflow-y: auto;
      overflow-x: hidden;
      background-color: var(--bg-base);
      height: calc(100vh - 64px - 38px);
    }
  `]
})
export class ShellComponent {
  private router = inject(Router);

  isSidebarCollapsed = signal<boolean>(false);
  isMobileOpen = signal<boolean>(false);
  currentTime = signal<string>('');
  breadcrumbs = signal<BreadcrumbItem[]>([]);

  constructor() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    this.updateBreadcrumbs(this.router.url);
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateBreadcrumbs(event.urlAfterRedirects || event.url);
      });
  }

  private updateClock() {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }

  private updateBreadcrumbs(url: string) {
    const cleanUrl = url.split('?')[0];
    const crumbs: BreadcrumbItem[] = [];

    if (cleanUrl.includes('/pos')) {
      crumbs.push({ label: 'Ventas', url: '/sales' });
      crumbs.push({ label: 'Nueva Venta (POS)', active: true });
    } else if (cleanUrl.includes('/dashboard')) {
      crumbs.push({ label: 'Panel de Control', active: true });
    } else if (cleanUrl.includes('/products')) {
      crumbs.push({ label: 'Inventario', url: '/products' });
      crumbs.push({ label: 'Productos', active: true });
    } else if (cleanUrl.includes('/customers')) {
      crumbs.push({ label: 'Directorio', url: '/customers' });
      crumbs.push({ label: 'Clientes', active: true });
    } else if (cleanUrl.includes('/sales')) {
      crumbs.push({ label: 'Facturación', url: '/sales' });
      crumbs.push({ label: 'Registro de Ventas', active: true });
    } else {
      crumbs.push({ label: 'Dashboard', active: true });
    }

    this.breadcrumbs.set(crumbs);
  }

  onSidebarCollapseChange(collapsed: boolean) {
    this.isSidebarCollapsed.set(collapsed);
  }

  toggleMobileSidebar() {
    this.isMobileOpen.set(!this.isMobileOpen());
  }
}
