import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SalesService } from '../../core/services/sales.service';
import { Sale } from '../../core/models/models';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="hud-sales-page">
      
      <!-- Encabezado de la página -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="h1-title m-0">Registro de Ventas y Facturas</h2>
          <p class="text-muted small m-0">Historial completo de despachos, comprobantes y recaudos</p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button class="btn-hud-secondary" (click)="exportExcel()" title="Exportar historial de ventas a Excel">
            <i class="bi bi-file-earmark-excel text-cyan"></i>
            <span>Exportar Excel</span>
          </button>
          <button class="btn-hud-secondary" (click)="exportPdf()" title="Exportar reporte de ventas a PDF">
            <i class="bi bi-file-earmark-pdf text-danger"></i>
            <span>Reporte PDF</span>
          </button>
          <a routerLink="/pos" class="btn-hud-primary text-decoration-none">
            <i class="bi bi-cart-plus-fill"></i>
            <span>Nueva Venta (POS)</span>
          </a>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="hud-panel p-3 mb-3">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-6">
            <div class="hud-search-box">
              <i class="bi bi-search"></i>
              <input type="text" 
                     class="form-control" 
                     [(ngModel)]="searchQuery" 
                     placeholder="Buscar por número de factura o cliente..." />
            </div>
          </div>
          <div class="col-12 col-md-6 text-md-end text-muted small">
            <span>Total ventas registradas: <strong class="text-cyan tabular-nums">{{ salesList().length }}</strong></span>
          </div>
        </div>
      </div>

      <!-- Tabla HUD de Ventas -->
      <div class="hud-panel overflow-hidden">
        
        <div *ngIf="filteredSales().length === 0" class="p-5 text-center text-muted">
          <i class="bi bi-receipt fs-1 mb-2 d-block text-cyan"></i>
          <h5>No se encontraron registros de ventas</h5>
          <p class="small">No hay transacciones que coincidan con la búsqueda actual.</p>
          <a routerLink="/pos" class="btn-hud-primary btn-sm mt-2 text-decoration-none">
            <i class="bi bi-cart-plus me-1"></i> Realizar Primera Venta
          </a>
        </div>

        <!-- Tabla Desktop -->
        <div class="hud-table-wrapper d-none d-md-block" *ngIf="filteredSales().length > 0">
          <table class="hud-table">
            <thead>
              <tr>
                <th>Nº Factura</th>
                <th>Fecha y Hora</th>
                <th>Cliente</th>
                <th class="text-center">Artículos</th>
                <th>Subtotal</th>
                <th>IVA (19%)</th>
                <th class="text-end">Total Pagado</th>
                <th class="text-end">Comprobante</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of filteredSales()" class="cursor-pointer" (click)="viewSale(s)">
                <td><span class="badge-status status-info fw-bold tabular-nums">{{ s.invoiceNumber }}</span></td>
                <td><span class="text-muted tabular-nums small">{{ s.date | date:'dd/MM/yyyy HH:mm' }}</span></td>
                <td><strong class="text-main">{{ s.customerName }}</strong></td>
                <td class="text-center"><span class="tabular-nums">{{ s.itemsCount }}</span></td>
                <td><span class="tabular-nums text-muted">$ {{ s.subtotal.toLocaleString('es-CO') }}</span></td>
                <td><span class="tabular-nums text-muted">$ {{ s.tax.toLocaleString('es-CO') }}</span></td>
                <td class="text-end">
                  <span class="price-tag fw-bold text-cyan tabular-nums">
                    $ {{ s.totalAmount.toLocaleString('es-CO') }}
                  </span>
                </td>
                <td class="text-end">
                  <a [href]="'http://localhost:5035/api/sales/' + s.id + '/receipt'" target="_blank" class="btn-hud-icon btn-sm me-1 text-decoration-none" (click)="$event.stopPropagation()" title="Descargar PDF">
                    <i class="bi bi-file-earmark-pdf text-cyan"></i>
                  </a>
                  <button class="btn-hud-icon btn-sm" (click)="viewSale(s); $event.stopPropagation()" title="Ver Comprobante">
                    <i class="bi bi-file-earmark-text"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tarjetas Móvil -->
        <div class="d-md-none p-3" *ngIf="filteredSales().length > 0">
          <div *ngFor="let s of filteredSales()" class="hud-panel p-3 mb-2 border cursor-pointer" (click)="viewSale(s)">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="badge-status status-info tabular-nums">{{ s.invoiceNumber }}</span>
              <span class="price-tag fw-bold text-cyan tabular-nums">$ {{ s.totalAmount.toLocaleString('es-CO') }}</span>
            </div>
            <h5 class="m-0 mb-1">{{ s.customerName }}</h5>
            <div class="d-flex justify-content-between text-muted small pt-2 border-top">
              <span>{{ s.date | date:'dd/MM/yyyy HH:mm' }}</span>
              <span>{{ s.itemsCount }} artículos</span>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- MODAL DETALLE DE FACTURA / COMPROBANTE -->
    <div class="modal-backdrop-hud" *ngIf="selectedSale()" (click)="selectedSale.set(null)">
      <div class="modal-receipt hud-panel hud-bracket p-4" (click)="$event.stopPropagation()">
        
        <div class="receipt-header text-center pb-3 border-bottom mb-3">
          <h3 class="m-0 firmeza-logo-brand text-cyan">FIRMEZA MATERIALES</h3>
          <p class="text-muted small m-0">Comprobante de Venta e Inventario</p>
          <div class="invoice-tag mt-2">
            <span class="badge-status status-success tabular-nums">FACTURA: {{ selectedSale()?.invoiceNumber }}</span>
          </div>
        </div>

        <div class="receipt-details mb-3">
          <div class="d-flex justify-content-between small text-muted mb-1">
            <span>Fecha Emisión:</span>
            <span class="tabular-nums text-main">{{ selectedSale()?.date | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <div class="d-flex justify-content-between small text-muted mb-1">
            <span>Cliente:</span>
            <span class="text-main fw-semibold">{{ selectedSale()?.customerName }}</span>
          </div>
          <div class="d-flex justify-content-between small text-muted">
            <span>Estado:</span>
            <span class="text-success fw-bold">{{ selectedSale()?.status }}</span>
          </div>
        </div>

        <!-- Tabla de items -->
        <div class="receipt-table-wrapper mb-3 border rounded overflow-hidden">
          <table class="hud-table">
            <thead>
              <tr>
                <th>Material</th>
                <th class="text-center">Cant.</th>
                <th class="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of selectedSale()?.details">
                <td>{{ d.productName }}</td>
                <td class="text-center tabular-nums">{{ d.quantity }}</td>
                <td class="text-end tabular-nums">$ {{ d.subtotal.toLocaleString('es-CO') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totales -->
        <div class="receipt-totals p-2 rounded mb-3 bg-base">
          <div class="d-flex justify-content-between small text-muted mb-1">
            <span>Subtotal:</span>
            <span class="tabular-nums">$ {{ selectedSale()?.subtotal?.toLocaleString('es-CO') }}</span>
          </div>
          <div class="d-flex justify-content-between small text-muted mb-1">
            <span>IVA (19%):</span>
            <span class="tabular-nums">$ {{ selectedSale()?.tax?.toLocaleString('es-CO') }}</span>
          </div>
          <div class="d-flex justify-content-between fw-bold fs-5 pt-1 border-top">
            <span class="text-main">TOTAL FACTURADO:</span>
            <span class="text-cyan tabular-nums">$ {{ selectedSale()?.totalAmount?.toLocaleString('es-CO') }}</span>
          </div>
        </div>

        <div class="d-flex gap-2">
          <a [href]="'http://localhost:5035/api/sales/' + selectedSale()?.id + '/receipt'" target="_blank" class="btn-hud-primary flex-grow-1 text-center text-decoration-none d-flex align-items-center justify-content-center">
            <i class="bi bi-file-earmark-pdf me-1"></i> Descargar PDF
          </a>
          <button class="btn-hud-secondary" (click)="print()">
            <i class="bi bi-printer me-1"></i> Imprimir
          </button>
          <button class="btn-hud-secondary" (click)="selectedSale.set(null)">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .hud-sales-page {
      min-width: 0;
    }

    .modal-backdrop-hud {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(4, 8, 16, 0.8);
      backdrop-filter: blur(4px);
      z-index: 2100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-receipt {
      width: 100%;
      max-width: 520px;
      border: 1px solid var(--accent-primary);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), var(--accent-primary-glow);
    }

    .bg-base {
      background-color: var(--bg-base);
    }
  `]
})
export class SalesComponent {
  private salesService = inject(SalesService);

  searchQuery = '';
  selectedSale = signal<Sale | null>(null);

  salesList = computed(() => this.salesService.getAll());

  filteredSales = computed(() => {
    let list = this.salesList();
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(s => 
        s.invoiceNumber.toLowerCase().includes(q) || 
        s.customerName.toLowerCase().includes(q)
      );
    }
    return list;
  });

  viewSale(s: Sale) {
    this.selectedSale.set(s);
  }

  print() {
    window.print();
  }

  exportExcel() {
    this.downloadFile('/api/export/sales/excel', 'Ventas_Firmeza.xlsx');
  }

  exportPdf() {
    this.downloadFile('/api/export/sales/pdf', 'Reporte_Ventas_Firmeza.pdf');
  }

  private downloadFile(endpoint: string, filename: string) {
    const token = localStorage.getItem('firmeza-token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`http://localhost:5035${endpoint}`, { headers })
      .then(res => {
        if (!res.ok) throw new Error('Error al descargar el archivo.');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error(err);
      });
  }
}
