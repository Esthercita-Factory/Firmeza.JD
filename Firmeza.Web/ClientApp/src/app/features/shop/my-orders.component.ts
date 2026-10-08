import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SalesService } from '../../core/services/sales.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Sale } from '../../core/models/models';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="orders-container">
      <div class="hud-box">
        <div class="panel-header">
          <div>
            <span class="hud-code">HISTORIAL DE COMPRAS & SEGUIMIENTO</span>
            <h2>MIS PEDIDOS Y SOLICITUDES</h2>
          </div>
          <a routerLink="/tienda" class="hud-btn-primary">+ NUEVA SOLICITUD</a>
        </div>

        <div *ngIf="loading()" class="hud-loading">
          Cargando solicitudes...
        </div>

        <div *ngIf="!loading() && orders().length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>Aún no tienes solicitudes de pedidos</h3>
          <p>Explora el catálogo para agregar cemento, acero, áridos y solicitar cotización formal.</p>
          <a routerLink="/tienda" class="hud-btn-primary">EXPLORAR CATÁLOGO</a>
        </div>

        <div *ngIf="!loading() && orders().length > 0" class="orders-list">
          <div class="order-card" *ngFor="let order of orders()">
            <div class="order-header">
              <div class="order-id-date">
                <span class="order-number">{{ order.invoiceNumber || 'VTA-' + order.id }}</span>
                <span class="order-date">{{ order.date | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>

              <div class="order-status-actions">
                <span class="status-badge" [ngClass]="getStatusClass(order.status)">
                  {{ getStatusLabel(order.status) }}
                </span>
                <a
                  [href]="'http://localhost:5035/api/sales/' + order.id + '/receipt'"
                  target="_blank"
                  class="btn-pdf-order"
                  title="Descargar comprobante oficial en PDF">
                  📄 PDF
                </a>
                <button
                  *ngIf="order.status === 'Pendiente' || order.status === 'Pending'"
                  class="btn-cancel-order"
                  (click)="cancelOrder(order.id)">
                  Cancelar Solicitud
                </button>
              </div>
            </div>

            <div class="order-summary-row">
              <div class="metric-item">
                <span class="metric-label">LÍNEAS</span>
                <span class="metric-val tabular-nums">{{ order.details ? order.details.length : order.itemsCount }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">SUBTOTAL NETO</span>
                <span class="metric-val tabular-nums">{{ order.subtotal | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">IVA (19%)</span>
                <span class="metric-val tabular-nums">{{ order.tax | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
              <div class="metric-item total-item">
                <span class="metric-label">TOTAL FACTURADO</span>
                <span class="metric-val tabular-nums highlight">{{ order.totalAmount | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
            </div>

            <!-- DETALLES DE PRODUCTOS SI EXISTEN -->
            <div class="order-details-table" *ngIf="order.details && order.details.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>PRODUCTO</th>
                    <th>CANT.</th>
                    <th>PRECIO UNIT.</th>
                    <th>SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let d of order.details">
                    <td>{{ d.productName }}</td>
                    <td class="tabular-nums">{{ d.quantity }}</td>
                    <td class="tabular-nums">{{ d.unitPrice | currency:'USD':'symbol':'1.2-2' }}</td>
                    <td class="tabular-nums">{{ (d.quantity * d.unitPrice) | currency:'USD':'symbol':'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orders-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .hud-box {
      background: var(--bg-panel);
      border: 1px solid var(--border-panel);
      border-radius: 6px;
      padding: 1.5rem;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-panel);
      padding-bottom: 0.75rem;
    }

    .hud-code {
      font-size: 0.65rem;
      color: var(--accent-cyan);
      font-weight: 700;
      letter-spacing: 0.1em;
    }

    .panel-header h2 {
      margin: 0.2rem 0 0;
      font-family: var(--font-metrics);
      color: var(--text-primary);
    }

    .hud-btn-primary {
      background: var(--accent-cyan);
      color: #0b1020;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.75rem;
      text-decoration: none;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
    }

    .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .order-card {
      background: var(--bg-canvas);
      border: 1px solid var(--border-panel);
      border-radius: 6px;
      padding: 1.25rem;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .order-number {
      font-family: var(--font-metrics);
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-right: 0.75rem;
    }

    .order-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .order-status-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .status-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .badge-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-confirmed { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
    .badge-delivered { background: rgba(34, 211, 238, 0.15); color: #22d3ee; border: 1px solid rgba(34, 211, 238, 0.3); }
    .badge-cancelled { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

    .btn-pdf-order {
      background: rgba(34, 211, 238, 0.1);
      border: 1px solid rgba(34, 211, 238, 0.4);
      color: var(--accent-cyan);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.25rem 0.55rem;
      border-radius: 4px;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-pdf-order:hover {
      background: var(--accent-cyan);
      color: #0b1020;
    }

    .btn-cancel-order {
      background: transparent;
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #ef4444;
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-cancel-order:hover {
      background: rgba(239, 68, 68, 0.15);
    }

    .order-summary-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      background: var(--bg-panel);
      padding: 0.75rem 1rem;
      border-radius: 4px;
      margin-bottom: 0.75rem;
    }

    @media (max-width: 600px) {
      .order-summary-row {
        grid-template-columns: 1fr 1fr;
      }
    }

    .metric-label {
      font-size: 0.6rem;
      color: var(--text-muted);
      display: block;
    }

    .metric-val {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .metric-val.highlight {
      color: var(--accent-cyan);
      font-weight: 700;
    }

    .order-details-table table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;
    }

    .order-details-table th {
      text-align: left;
      color: var(--text-muted);
      padding: 0.4rem 0.5rem;
      border-bottom: 1px solid var(--border-panel);
    }

    .order-details-table td {
      padding: 0.4rem 0.5rem;
      border-bottom: 1px solid var(--border-panel);
      color: var(--text-primary);
    }
  `]
})
export class MyOrdersComponent implements OnInit {
  private salesService = inject(SalesService);
  private toastService = inject(ToastService);

  orders = this.salesService.sales;
  loading = signal(false);

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    // En el backend GET /api/sales para rol Cliente ya filtra automáticamente por las suyas
    this.loading.set(false);
  }

  getStatusClass(status: string) {
    const s = status?.toLowerCase();
    if (s.includes('pend')) return 'badge-pending';
    if (s.includes('conf')) return 'badge-confirmed';
    if (s.includes('entr') || s.includes('deli')) return 'badge-delivered';
    return 'badge-cancelled';
  }

  getStatusLabel(status: string) {
    const s = status?.toLowerCase();
    if (s.includes('pend')) return 'Pendiente';
    if (s.includes('conf')) return 'Confirmada';
    if (s.includes('entr') || s.includes('deli')) return 'Entregada';
    if (s.includes('canc')) return 'Cancelada';
    return status;
  }

  async cancelOrder(id: number) {
    if (!confirm('¿Estás seguro de cancelar esta solicitud de pedido?')) return;

    try {
      // Endpoint /api/sales/{id}/cancel
      await this.salesService.updateStatus(id, 'Cancelada');
      this.toastService.showSuccess('Solicitud cancelada exitosamente.');
    } catch (err: any) {
      this.toastService.showError(err?.message || 'No se pudo cancelar la solicitud.');
    }
  }
}
