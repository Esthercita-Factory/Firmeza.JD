import { Component, inject, computed, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandPaletteService } from './command-palette.service';
import { ProductsService } from '../../../core/services/products.service';
import { CustomersService } from '../../../core/services/customers.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth/auth.service';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  category: 'Navegación' | 'Acción' | 'Producto' | 'Cliente';
  action: () => void;
  badge?: string;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hud-palette-backdrop" *ngIf="paletteService.isOpen()" (click)="onBackdropClick($event)">
      <div class="hud-palette-modal hud-panel hud-bracket" (click)="$event.stopPropagation()">
        <!-- Header con buscador -->
        <div class="hud-palette-search">
          <i class="bi bi-search text-muted fs-5"></i>
          <input #searchInput
                 type="text" 
                 class="hud-palette-input" 
                 [(ngModel)]="query" 
                 (keydown)="handleKeyDown($event)"
                 placeholder="Escribe un comando, producto o navega a un módulo... (Esc para salir)" />
          <span class="hud-palette-esc" (click)="paletteService.close()">ESC</span>
        </div>

        <div class="hud-divider m-0"></div>

        <!-- Resultados -->
        <div class="hud-palette-results">
          <div *ngIf="filteredCommands().length === 0" class="text-center py-4 text-muted">
            <i class="bi bi-slash-circle fs-3 mb-2 d-block"></i>
            <span>No se encontraron resultados para "{{ query }}"</span>
          </div>

          <div *ngFor="let item of filteredCommands(); let i = index" 
               class="hud-palette-item" 
               [class.active]="selectedIndex() === i"
               (mouseenter)="selectedIndex.set(i)"
               (click)="execute(item)">
            <div class="d-flex align-items-center gap-3 flex-grow-1">
              <div class="item-icon-box">
                <i class="bi" [ngClass]="item.icon"></i>
              </div>
              <div>
                <div class="item-title">{{ item.title }}</div>
                <div class="item-subtitle text-muted" *ngIf="item.subtitle">{{ item.subtitle }}</div>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2">
              <span class="badge-item-cat">{{ item.category }}</span>
              <span class="badge-stock-info" *ngIf="item.badge">{{ item.badge }}</span>
              <i class="bi bi-arrow-return-left text-muted enter-icon" *ngIf="selectedIndex() === i"></i>
            </div>
          </div>
        </div>

        <!-- Footer con atajos de ayuda -->
        <div class="hud-palette-footer d-flex align-items-center justify-content-between text-muted">
          <div class="d-flex align-items-center gap-3">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navegar</span>
            <span><kbd>↵</kbd> Seleccionar</span>
            <span><kbd>ESC</kbd> Cerrar</span>
          </div>
          <div class="d-flex align-items-center gap-1">
            <span class="live-indicator-dot me-1"></span>
            <span>FIRMEZA HUD</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hud-palette-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(4, 8, 16, 0.75);
      backdrop-filter: blur(6px);
      z-index: 2000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 10vh;
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .hud-palette-modal {
      width: 100%;
      max-width: 620px;
      background-color: var(--bg-panel);
      border: 1px solid var(--accent-primary);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), var(--accent-primary-glow);
      border-radius: var(--radius-card);
      overflow: hidden;
    }

    .hud-palette-search {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
    }

    .hud-palette-input {
      background: transparent;
      border: none;
      color: var(--text-main);
      font-size: 15px;
      width: 100%;
      outline: none;
      font-family: var(--font-body);
    }
    .hud-palette-input::placeholder {
      color: var(--text-muted);
    }

    .hud-palette-esc {
      background-color: var(--bg-panel-hover);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 2px 8px;
      font-size: 11px;
      border-radius: 4px;
      cursor: pointer;
    }

    .hud-palette-results {
      max-height: 380px;
      overflow-y: auto;
      padding: 8px;
    }

    .hud-palette-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color var(--transition-fast), border-color var(--transition-fast);
      border: 1px solid transparent;
      margin-bottom: 2px;
    }

    .hud-palette-item:hover, .hud-palette-item.active {
      background-color: var(--bg-panel-hover);
      border-color: var(--border-highlight);
    }

    .hud-palette-item.active {
      border-color: var(--accent-primary);
      box-shadow: inset 0 0 10px rgba(34, 211, 238, 0.08);
    }

    .item-icon-box {
      width: 34px;
      height: 34px;
      border-radius: 6px;
      background-color: var(--bg-base);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-primary);
    }

    .item-title {
      color: var(--text-main);
      font-weight: 500;
      font-size: 14px;
    }
    .item-subtitle {
      font-size: 12px;
    }

    .badge-item-cat {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background-color: var(--bg-base);
      color: var(--text-muted);
      border: 1px solid var(--border-color);
    }

    .badge-stock-info {
      font-size: 12px;
      color: var(--accent-primary);
      font-family: var(--font-numbers);
    }

    .enter-icon {
      font-size: 12px;
    }

    .hud-palette-footer {
      padding: 10px 18px;
      background-color: var(--bg-base);
      border-top: 1px solid var(--border-color);
      font-size: 12px;
    }
    kbd {
      background-color: var(--bg-panel);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 10px;
    }
  `]
})
export class CommandPaletteComponent implements AfterViewChecked {
  paletteService = inject(CommandPaletteService);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private customersService = inject(CustomersService);
  private themeService = inject(ThemeService);
  public authService = inject(AuthService);

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  private wasOpen = false;

  query = '';
  selectedIndex = signal<number>(0);

  ngAfterViewChecked(): void {
    if (this.paletteService.isOpen() && !this.wasOpen) {
      this.wasOpen = true;
      setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
    } else if (!this.paletteService.isOpen()) {
      this.wasOpen = false;
    }
  }

  onBackdropClick(event: MouseEvent) {
    this.paletteService.close();
  }

  filteredCommands = computed(() => {
    const q = this.query.trim().toLowerCase();
    const isClient = this.authService.isClient();
    const items: CommandItem[] = [];

    if (isClient) {
      // Navegación para Cliente
      items.push(
        {
          id: 'nav-shop',
          title: 'Catálogo de Materiales',
          subtitle: 'Explorar productos y solicitar materiales',
          icon: 'bi-shop',
          category: 'Navegación',
          action: () => this.navigate('/tienda')
        },
        {
          id: 'nav-cart',
          title: 'Mi Carrito de Compras',
          subtitle: 'Ver artículos seleccionados y finalizar pedido',
          icon: 'bi-cart3',
          category: 'Navegación',
          action: () => this.navigate('/carrito')
        },
        {
          id: 'nav-orders',
          title: 'Mis Pedidos & Comprobantes',
          subtitle: 'Historial de compras y recibos en PDF',
          icon: 'bi-bag-check',
          category: 'Navegación',
          action: () => this.navigate('/mis-compras')
        }
      );
    } else {
      // Navegación para Administrador
      items.push(
        {
          id: 'nav-pos',
          title: 'Nueva Venta (POS)',
          subtitle: 'Punto de venta y facturación inmediata',
          icon: 'bi-cart-check',
          category: 'Navegación',
          action: () => this.navigate('/pos')
        },
        {
          id: 'nav-dash',
          title: 'Dashboard de Control',
          subtitle: 'Métricas, telemetría y estado general',
          icon: 'bi-grid-1x2',
          category: 'Navegación',
          action: () => this.navigate('/dashboard')
        },
        {
          id: 'nav-prod',
          title: 'Catálogo de Productos (ERP)',
          subtitle: 'Inventario de materiales y stock',
          icon: 'bi-box-seam',
          category: 'Navegación',
          action: () => this.navigate('/products')
        },
        {
          id: 'nav-cust',
          title: 'Directorio de Clientes',
          subtitle: 'Constructores y clientes registrados',
          icon: 'bi-people',
          category: 'Navegación',
          action: () => this.navigate('/customers')
        },
        {
          id: 'nav-sales',
          title: 'Historial de Ventas',
          subtitle: 'Registro de ventas y facturas emitidas',
          icon: 'bi-receipt',
          category: 'Navegación',
          action: () => this.navigate('/sales')
        }
      );
    }

    // Acciones globales
    items.push({
      id: 'act-theme',
      title: 'Alternar Modo Claro / Oscuro',
      subtitle: 'Cambiar paleta visual del sistema',
      icon: 'bi-circle-half',
      category: 'Acción',
      action: () => {
        this.themeService.toggleTheme();
        this.paletteService.close();
      }
    });

    // Productos
    const products = this.productsService.getAll();
    for (const p of products) {
      items.push({
        id: `prod-${p.id}`,
        title: p.name,
        subtitle: `${p.category} · Ref: ${p.sku}`,
        icon: 'bi-box',
        category: 'Producto',
        badge: `$${p.price.toLocaleString('es-CO')} | Stock: ${p.stock}`,
        action: () => {
          this.navigate(isClient ? '/tienda' : '/pos');
        }
      });
    }

    // Clientes (Solo para Administrador)
    if (!isClient) {
      const customers = this.customersService.getAll();
      for (const c of customers) {
        items.push({
          id: `cust-${c.id}`,
          title: c.name,
          subtitle: `Doc: ${c.document} · Tel: ${c.phone || 'N/A'}`,
          icon: 'bi-person',
          category: 'Cliente',
          action: () => {
            this.navigate('/customers');
          }
        });
      }
    }

    if (!q) {
      return items.slice(0, 10);
    }

    return items
      .filter(item => 
        item.title.toLowerCase().includes(q) || 
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
      )
      .slice(0, 12);
  });

  handleKeyDown(event: KeyboardEvent) {
    const list = this.filteredCommands();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex.update(i => (i + 1) % (list.length || 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex.update(i => (i - 1 + list.length) % (list.length || 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (list[this.selectedIndex()]) {
        this.execute(list[this.selectedIndex()]);
      }
    }
  }

  execute(item: CommandItem) {
    item.action();
  }

  private navigate(url: string) {
    this.router.navigate([url]);
    this.paletteService.close();
  }
}
