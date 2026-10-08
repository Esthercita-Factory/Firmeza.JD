import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { SalesService } from '../../core/services/sales.service';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="checkout-layout">
      <div class="hud-box main-panel">
        <div class="panel-header">
          <div>
            <span class="hud-code">CHECKOUT & SOLICITUD</span>
            <h2>CARRITO DE COMPRAS</h2>
          </div>
          <button *ngIf="!cartService.isEmpty()" class="hud-btn-clear" (click)="cartService.clear()">
            VACIAR CARRITO
          </button>
        </div>

        <div *ngIf="cartService.isEmpty()" class="empty-cart-state">
          <div class="empty-icon">🛒</div>
          <h3>Tu carrito está vacío</h3>
          <p>Explora nuestro catálogo de productos y selecciona los materiales necesarios.</p>
          <a routerLink="/tienda" class="hud-btn-primary">IR AL CATÁLOGO</a>
        </div>

        <div *ngIf="!cartService.isEmpty()" class="cart-table-wrapper">
          <table class="hud-table">
            <thead>
              <tr>
                <th>MATERIAL / PRODUCTO</th>
                <th>PRECIO UNIT.</th>
                <th>CANTIDAD</th>
                <th>SUBTOTAL</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of cartService.lines()">
                <td>
                  <div class="item-title">{{ item.product.name }}</div>
                  <div class="item-sku">{{ item.product.sku }} &bull; {{ item.product.category }}</div>
                </td>
                <td class="tabular-nums">{{ item.product.price | currency:'USD':'symbol':'1.2-2' }}</td>
                <td>
                  <div class="quantity-controller">
                    <button class="qty-btn" (click)="cartService.decrement(item.product.id)">-</button>
                    <span class="qty-val tabular-nums">{{ item.quantity }}</span>
                    <button
                      class="qty-btn"
                      [disabled]="cartService.availableToAdd(item.product) === 0"
                      (click)="cartService.increment(item.product.id)">
                      +
                    </button>
                  </div>
                </td>
                <td class="tabular-nums fw-bold">
                  {{ (item.product.price * item.quantity) | currency:'USD':'symbol':'1.2-2' }}
                </td>
                <td>
                  <button class="btn-remove" (click)="cartService.remove(item.product.id)">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- RESUMEN DE LIQUIDACIÓN Y ENVÍO -->
      <div class="hud-box summary-panel" *ngIf="!cartService.isEmpty()">
        <div class="panel-header">
          <span class="hud-code">DESGLOSE FISCAL (IVA 19%)</span>
          <h3>RESUMEN DE SOLICITUD</h3>
        </div>

        <div class="summary-rows">
          <div class="summary-row">
            <span>Artículos seleccionados:</span>
            <span class="tabular-nums">{{ cartService.count() }} uds.</span>
          </div>
          <div class="summary-row">
            <span>Base Imponible (Neto):</span>
            <span class="tabular-nums">{{ cartService.subtotalBase() | currency:'USD':'symbol':'1.2-2' }}</span>
          </div>
          <div class="summary-row">
            <span>IVA Estimado (19%):</span>
            <span class="tabular-nums">{{ cartService.iva() | currency:'USD':'symbol':'1.2-2' }}</span>
          </div>

          <div class="summary-divider"></div>

          <div class="summary-row total-row">
            <span>TOTAL A PAGAR:</span>
            <span class="tabular-nums total-val">{{ cartService.total() | currency:'USD':'symbol':'1.2-2' }}</span>
          </div>
        </div>

        <div class="hud-notice-box">
          <span class="notice-icon">ℹ️</span>
          <p>
            Al presionar <strong>SOLICITAR PEDIDO</strong>, tu orden se generará en estado
            <span class="badge-pending">Pendiente</span>. Un ejecutivo validará inventario y coordinará despacho antes de confirmar.
          </p>
        </div>

        <button
          class="hud-btn-confirm"
          [disabled]="isSubmitting"
          (click)="submitOrder()">
          <span *ngIf="!isSubmitting">SOLICITAR PEDIDO &rarr;</span>
          <span *ngIf="isSubmitting">PROCESANDO SOLICITUD...</span>
        </button>

        <a routerLink="/tienda" class="hud-btn-back">&larr; Seguir comprando materiales</a>
      </div>
    </div>
  `,
  styles: [`
    .checkout-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 1.5rem;
      align-items: flex-start;
    }

    @media (max-width: 900px) {
      .checkout-layout {
        grid-template-columns: 1fr;
      }
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
      align-items: flex-start;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-panel);
      padding-bottom: 0.75rem;
    }

    .hud-code {
      font-size: 0.65rem;
      color: var(--accent-cyan);
      font-weight: 700;
      letter-spacing: 0.1em;
    }

    .panel-header h2, .panel-header h3 {
      margin: 0.2rem 0 0;
      font-family: var(--font-metrics);
      color: var(--text-primary);
    }

    .hud-btn-clear {
      background: transparent;
      border: 1px solid var(--border-panel);
      color: var(--text-muted);
      font-size: 0.7rem;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      cursor: pointer;
    }

    .hud-btn-clear:hover {
      border-color: var(--status-danger);
      color: var(--status-danger);
    }

    .empty-cart-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
    }

    .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }

    .hud-btn-primary {
      display: inline-block;
      margin-top: 1rem;
      background: var(--accent-cyan);
      color: #0b1020;
      padding: 0.6rem 1.2rem;
      border-radius: 4px;
      font-weight: 700;
      text-decoration: none;
    }

    .hud-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .hud-table th {
      text-align: left;
      font-size: 0.65rem;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      padding: 0.75rem 0.5rem;
      border-bottom: 1px solid var(--border-panel);
    }

    .hud-table td {
      padding: 1rem 0.5rem;
      border-bottom: 1px solid var(--border-panel);
      color: var(--text-primary);
    }

    .item-title { font-weight: 600; font-size: 0.95rem; }
    .item-sku { font-size: 0.7rem; color: var(--text-muted); }

    .quantity-controller {
      display: inline-flex;
      align-items: center;
      background: var(--bg-canvas);
      border: 1px solid var(--border-panel);
      border-radius: 4px;
    }

    .qty-btn {
      background: transparent;
      border: none;
      color: var(--text-primary);
      width: 28px;
      height: 28px;
      font-weight: 700;
      cursor: pointer;
    }

    .qty-btn:hover:not(:disabled) {
      color: var(--accent-cyan);
    }

    .qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .qty-val {
      padding: 0 0.5rem;
      font-size: 0.85rem;
      min-width: 24px;
      text-align: center;
    }

    .btn-remove {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.9rem;
    }

    .btn-remove:hover { color: var(--status-danger); }

    .summary-rows {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin-bottom: 1.25rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .summary-divider {
      height: 1px;
      background: var(--border-panel);
      margin: 0.5rem 0;
    }

    .total-row {
      color: var(--text-primary);
      font-size: 1.05rem;
      font-weight: 700;
    }

    .total-val {
      color: var(--accent-cyan);
      font-size: 1.35rem;
      font-family: var(--font-metrics);
    }

    .hud-notice-box {
      display: flex;
      gap: 0.6rem;
      background: rgba(34, 211, 238, 0.05);
      border: 1px solid rgba(34, 211, 238, 0.2);
      border-radius: 4px;
      padding: 0.75rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      line-height: 1.4;
    }

    .badge-pending {
      color: var(--status-warning);
      font-weight: 700;
    }

    .hud-btn-confirm {
      width: 100%;
      background: var(--accent-cyan);
      color: #0b1020;
      border: none;
      padding: 0.85rem;
      font-weight: 800;
      border-radius: 4px;
      font-size: 0.9rem;
      letter-spacing: 0.05em;
      cursor: pointer;
      box-shadow: 0 0 15px rgba(34, 211, 238, 0.25);
      transition: all 0.2s ease;
    }

    .hud-btn-confirm:hover:not(:disabled) {
      filter: brightness(1.15);
      box-shadow: 0 0 25px rgba(34, 211, 238, 0.45);
    }

    .hud-btn-back {
      display: block;
      text-align: center;
      margin-top: 1rem;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.75rem;
    }

    .hud-btn-back:hover { color: var(--accent-cyan); }
  `]
})
export class CheckoutComponent {
  public cartService = inject(CartService);
  private salesService = inject(SalesService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  isSubmitting = false;

  async submitOrder() {
    if (this.cartService.isEmpty()) return;

    this.isSubmitting = true;
    try {
      const details = this.cartService.lines().map(line => ({
        productId: line.product.id,
        quantity: line.quantity
      }));

      await this.salesService.createSale(details);
      this.toastService.showSuccess('¡Compra realizada con éxito! El comprobante oficial en PDF fue enviado a tu correo electrónico.');
      this.cartService.clear();
      this.router.navigate(['/mis-compras']);
    } catch (err: any) {
      this.toastService.showError(err?.message || 'Error al procesar la solicitud.');
    } finally {
      this.isSubmitting = false;
    }
  }
}
