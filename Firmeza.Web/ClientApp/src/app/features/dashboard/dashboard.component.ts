import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { ProductsService } from '../../core/services/products.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Product } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="hud-dashboard-view">
      
      <!-- Header de la pantalla -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="h1-title m-0 d-flex align-items-center gap-2">
            <span>Cabina de Control de Obra</span>
            <span class="live-indicator-dot" title="Telemetría en tiempo real activa"></span>
          </h2>
          <p class="text-muted small m-0">Monitoreo de despacho, facturación y niveles de acopio en tiempo real</p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button class="btn-hud-secondary btn-sm" (click)="refreshDashboard()">
            <i class="bi bi-arrow-clockwise me-1"></i> Sincronizar
          </button>
          <a routerLink="/pos" class="btn-hud-primary btn-sm text-decoration-none">
            <i class="bi bi-cart-plus me-1"></i> Nueva Venta (POS)
          </a>
        </div>
      </div>

      <!-- Fila superior: 4 tarjetas de métricas con animación de conteo numérico -->
      <div class="row g-3 mb-4">
        
        <!-- Tarjeta 1: Ventas del Día -->
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="hud-panel hud-panel-hoverable hud-bracket p-3 h-100 d-flex flex-column justify-content-between">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="metric-label text-muted text-uppercase">Ventas del Día</span>
              <div class="metric-icon-box bg-cyan-soft text-cyan">
                <i class="bi bi-currency-dollar fs-5"></i>
              </div>
            </div>
            <div>
              <div class="metric-number text-main tabular-nums">
                $ {{ animatedTodaySales().toLocaleString('es-CO') }}
              </div>
              <div class="d-flex align-items-center gap-1 mt-1">
                <span class="badge-status status-success small">
                  <i class="bi bi-arrow-up-right"></i> +{{ summary.todaySalesChange }}%
                </span>
                <span class="text-muted text-tag ms-1">vs día anterior</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjeta 2: Nuevos Clientes -->
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="hud-panel hud-panel-hoverable hud-bracket p-3 h-100 d-flex flex-column justify-content-between">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="metric-label text-muted text-uppercase">Clientes Activos</span>
              <div class="metric-icon-box bg-purple-soft text-purple">
                <i class="bi bi-people-fill fs-5"></i>
              </div>
            </div>
            <div>
              <div class="metric-number text-main tabular-nums">
                {{ animatedCustomers() }}
              </div>
              <div class="d-flex align-items-center gap-1 mt-1">
                <span class="badge-status status-success small">
                  <i class="bi bi-arrow-up-right"></i> +{{ summary.newCustomersChange }}%
                </span>
                <span class="text-muted text-tag ms-1">este mes</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjeta 3: Alertas Stock Bajo -->
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="hud-panel hud-panel-hoverable hud-bracket p-3 h-100 d-flex flex-column justify-content-between">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="metric-label text-muted text-uppercase">Stock Crítico</span>
              <div class="metric-icon-box bg-danger-soft text-danger">
                <i class="bi bi-shield-exclamation fs-5"></i>
              </div>
            </div>
            <div>
              <div class="metric-number text-danger tabular-nums">
                {{ animatedLowStock() }} <span class="fs-6 text-muted">materiales</span>
              </div>
              <div class="d-flex align-items-center gap-1 mt-1">
                <span class="badge-status status-danger small">
                  <i class="bi bi-exclamation-triangle"></i> Requiere Reposición
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjeta 4: Ticket Promedio -->
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="hud-panel hud-panel-hoverable hud-bracket p-3 h-100 d-flex flex-column justify-content-between">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="metric-label text-muted text-uppercase">Ticket Promedio</span>
              <div class="metric-icon-box bg-amber-soft text-warning">
                <i class="bi bi-receipt fs-5"></i>
              </div>
            </div>
            <div>
              <div class="metric-number text-main tabular-nums">
                $ {{ animatedTicket().toLocaleString('es-CO') }}
              </div>
              <div class="d-flex align-items-center gap-1 mt-1">
                <span class="badge-status status-success small">
                  <i class="bi bi-arrow-up-right"></i> +{{ summary.averageTicketChange }}%
                </span>
                <span class="text-muted text-tag ms-1">promedio obra</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Fila intermedia: Gráfica de ventas semanales + Productos más vendidos -->
      <div class="row g-4 mb-4">
        
        <!-- Gráfica de Ventas Semanales (HUD Bar Chart con día de hoy resaltado) -->
        <div class="col-12 col-lg-8">
          <div class="hud-panel p-4 h-100 d-flex flex-column justify-content-between">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
              <div>
                <h3 class="h3-title m-0">Curva de Facturación Semanal</h3>
                <span class="text-muted small">Desempeño diario de ventas con acento en la jornada en curso</span>
              </div>
              <div class="d-flex align-items-center gap-2">
                <span class="badge-status status-info">
                  <span class="badge-status-dot"></span> Hoy: Resaltado Cian
                </span>
              </div>
            </div>

            <!-- Gráfico de Barras HUD -->
            <div class="hud-chart-container py-3">
              <div class="bars-container d-flex align-items-end justify-content-between h-100">
                <div *ngFor="let item of summary.weeklySales" class="chart-column d-flex flex-column align-items-center flex-grow-1">
                  
                  <!-- Tooltip de valor en la barra -->
                  <div class="bar-value-tooltip small tabular-nums mb-2" [class.highlighted-tooltip]="item.isToday">
                    $ {{ (item.amount / 1000000).toFixed(1) }}M
                  </div>

                  <!-- Barra animada -->
                  <div class="chart-bar-wrapper w-100 d-flex justify-content-center">
                    <div class="chart-bar" 
                         [class.today-bar]="item.isToday"
                         [style.height.%]="getBarHeight(item.amount)">
                      <div class="bar-shine" *ngIf="item.isToday"></div>
                    </div>
                  </div>

                  <!-- Etiqueta del día -->
                  <div class="chart-day-label mt-2" [class.today-label]="item.isToday">
                    {{ item.day }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer del gráfico con métricas de resumen -->
            <div class="chart-footer-stats d-flex align-items-center justify-content-between pt-3 border-top mt-3 small text-muted">
              <div>Pico de ventas: <strong class="text-main tabular-nums">Viernes ($5.67M)</strong></div>
              <div>Semana acumulada: <strong class="text-cyan tabular-nums">$28.66M COP</strong></div>
            </div>
          </div>
        </div>

        <!-- Productos Más Vendidos -->
        <div class="col-12 col-lg-4">
          <div class="hud-panel p-4 h-100 d-flex flex-column">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h3 class="h3-title m-0">Top Materiales</h3>
              <span class="badge-tag text-muted">Por volumen</span>
            </div>
            
            <div class="top-products-list flex-grow-1 d-flex flex-column justify-content-around">
              <div *ngFor="let item of summary.topProducts; let i = index" class="top-product-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <div class="d-flex align-items-center gap-2">
                    <span class="rank-badge" [class.rank-1]="i === 0">#{{ i + 1 }}</span>
                    <span class="product-name fw-medium">{{ item.name }}</span>
                  </div>
                  <span class="quantity-sold tabular-nums small fw-bold">{{ item.quantitySold }} un.</span>
                </div>
                
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" [style.width.%]="item.percentage" [class.top-fill]="i === 0"></div>
                </div>
              </div>
            </div>

            <div class="pt-3 border-top text-center">
              <a routerLink="/products" class="text-cyan small fw-medium text-decoration-none">
                Ver inventario completo <i class="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>

      </div>

      <!-- Fila inferior: Alertas de Stock Bajo con acción rápida de reposición -->
      <div class="row">
        <div class="col-12">
          <div class="hud-panel p-4">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h3 class="h3-title m-0 d-flex align-items-center gap-2">
                  <i class="bi bi-exclamation-triangle-fill text-danger"></i>
                  <span>Materiales con Alerta de Reposición Inmediata</span>
                </h3>
                <span class="text-muted small">Items con existencias iguales o inferiores al punto de reorden fijado</span>
              </div>
              <span class="badge-status status-danger">
                {{ criticalProducts().length }} materiales críticos
              </span>
            </div>

            <div class="hud-table-wrapper" *ngIf="criticalProducts().length > 0; else allStockHealthy">
              <table class="hud-table">
                <thead>
                  <tr>
                    <th>Código / SKU</th>
                    <th>Material</th>
                    <th>Categoría</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Estado</th>
                    <th class="text-end">Acción Rápida</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of criticalProducts()">
                    <td><span class="text-muted tabular-nums">{{ p.sku }}</span></td>
                    <td><strong class="text-main">{{ p.name }}</strong></td>
                    <td><span class="text-muted">{{ p.category }}</span></td>
                    <td>
                      <span class="fw-bold tabular-nums" [ngClass]="p.stock <= 5 ? 'text-danger' : 'text-warning'">
                        {{ p.stock }} {{ p.unit }}
                      </span>
                    </td>
                    <td><span class="text-muted tabular-nums">{{ p.minStock }} {{ p.unit }}</span></td>
                    <td>
                      <span class="badge-status" [ngClass]="p.stock <= 5 ? 'status-danger' : 'status-warning'">
                        <span class="badge-status-dot"></span>
                        <span>{{ p.stock <= 5 ? 'Crítico' : 'Bajo' }}</span>
                      </span>
                    </td>
                    <td class="text-end">
                      <button class="btn-hud-primary btn-sm py-1 px-3" 
                              (click)="replenishStock(p, 50)"
                              title="Solicitar e ingresar +50 unidades de manera inmediata">
                        <i class="bi bi-plus-lg me-1"></i> Reponer +50
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ng-template #allStockHealthy>
              <div class="text-center py-4 text-muted">
                <i class="bi bi-shield-check text-success fs-1 mb-2 d-block"></i>
                <h5>Todo el inventario está en niveles óptimos</h5>
                <p class="small">No hay materiales en alerta de agotamiento en este momento.</p>
              </div>
            </ng-template>

          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .hud-dashboard-view {
      min-width: 0;
    }

    .metric-label {
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.06em;
    }

    .metric-number {
      font-size: 26px;
      font-weight: 700;
      line-height: 1.1;
    }

    .metric-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bg-cyan-soft {
      background-color: var(--accent-primary-soft);
    }
    .bg-purple-soft {
      background-color: var(--accent-secondary-soft);
    }
    .bg-danger-soft {
      background-color: var(--color-danger-bg);
    }
    .bg-amber-soft {
      background-color: var(--color-warning-bg);
    }

    .text-cyan { color: var(--accent-primary); }
    .text-purple { color: var(--accent-secondary); }

    /* Gráfico de Barras HUD */
    .hud-chart-container {
      height: 240px;
      position: relative;
    }

    .chart-bar-wrapper {
      height: 180px;
      align-items: flex-end;
    }

    .chart-bar {
      width: 36px;
      border-radius: 6px 6px 0 0;
      background: linear-gradient(180deg, var(--accent-secondary) 0%, rgba(139, 92, 246, 0.4) 100%);
      transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform var(--transition-fast);
      position: relative;
    }
    .chart-bar:hover {
      transform: scaleY(1.03);
      filter: brightness(1.2);
    }

    /* Barra del día actual resaltada con cian eléctrico */
    .today-bar {
      background: linear-gradient(180deg, var(--accent-primary) 0%, rgba(34, 211, 238, 0.5) 100%) !important;
      box-shadow: 0 0 16px rgba(34, 211, 238, 0.45);
      border: 1px solid var(--accent-primary);
    }

    .bar-value-tooltip {
      font-size: 11px;
      color: var(--text-muted);
    }
    .highlighted-tooltip {
      color: var(--accent-primary);
      font-weight: 700;
    }

    .chart-day-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .today-label {
      color: var(--accent-primary);
      font-weight: 700;
    }

    .status-info {
      background-color: var(--accent-primary-soft);
      color: var(--accent-primary);
      border: 1px solid rgba(34, 211, 238, 0.3);
    }

    /* Top Productos */
    .rank-badge {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background-color: var(--bg-base);
      border: 1px solid var(--border-color);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      font-family: var(--font-numbers);
    }
    .rank-1 {
      border-color: var(--accent-primary);
      color: var(--accent-primary);
      box-shadow: 0 0 8px rgba(34, 211, 238, 0.25);
    }

    .progress-bar-container {
      height: 6px;
      background-color: var(--bg-base);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 3px;
      background: linear-gradient(90deg, var(--accent-secondary), var(--accent-primary));
      transition: width 0.8s ease-in-out;
    }
    .top-fill {
      box-shadow: 0 0 8px rgba(34, 211, 238, 0.4);
    }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private productsService = inject(ProductsService);
  private toastService = inject(ToastService);

  summary = this.dashboardService.getSummary();

  // Señales de animación de conteo numérico de 0 al valor final (microinteracción del brief)
  animatedTodaySales = signal<number>(0);
  animatedCustomers = signal<number>(0);
  animatedLowStock = signal<number>(0);
  animatedTicket = signal<number>(0);

  criticalProducts = computed(() => {
    return this.productsService.getAll().filter(p => p.stock <= p.minStock);
  });

  ngOnInit(): void {
    this.runCountersAnimation();
  }

  refreshDashboard() {
    this.summary = this.dashboardService.getSummary();
    this.runCountersAnimation();
    this.toastService.show('Datos del panel sincronizados en tiempo real', 'info');
  }

  // Animación numérica fluida del valor inicial a la meta
  private runCountersAnimation() {
    const duration = 650; // ms
    const startTime = performance.now();

    const targetSales = this.summary.todaySales;
    const targetCust = this.summary.newCustomers;
    const targetLow = this.criticalProducts().length;
    const targetTicket = this.summary.averageTicket;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      this.animatedTodaySales.set(Math.round(targetSales * easeProgress));
      this.animatedCustomers.set(Math.round(targetCust * easeProgress));
      this.animatedLowStock.set(Math.round(targetLow * easeProgress));
      this.animatedTicket.set(Math.round(targetTicket * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  getBarHeight(amount: number): number {
    const max = 6000000;
    return Math.min(100, Math.max(15, (amount / max) * 100));
  }

  replenishStock(product: Product, quantity: number) {
    const updated = this.productsService.replenishStock(product.id, quantity);
    if (updated) {
      this.toastService.show(`Se añadieron +${quantity} ${product.unit} de ${product.name}`, 'success');
      this.summary = this.dashboardService.getSummary();
    }
  }
}
