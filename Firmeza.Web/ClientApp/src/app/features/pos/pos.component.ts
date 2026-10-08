import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { CustomersService } from '../../core/services/customers.service';
import { SalesService } from '../../core/services/sales.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Product, SaleDetail, Sale } from '../../core/models/models';

interface CartItem extends SaleDetail {
  availableStock: number;
  unit: string;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hud-pos-layout">
      <!-- ZONA IZQUIERDA: CATÁLOGO DE PRODUCTOS -->
      <section class="pos-catalog-section d-flex flex-column">
        
        <!-- Header del catálogo con buscador y chips de categoría -->
        <div class="pos-catalog-header hud-panel p-3 mb-3">
          <div class="hud-search-box mb-3">
            <i class="bi bi-search fs-5"></i>
            <input type="text" 
                   class="form-control" 
                   [(ngModel)]="searchQuery" 
                   placeholder="Buscar material por nombre, código SKU o categoría..."
                   autofocus />
            <button *ngIf="searchQuery" 
                    class="btn-clear-search" 
                    (click)="searchQuery = ''"
                    aria-label="Limpiar búsqueda">
              <i class="bi bi-x-circle-fill"></i>
            </button>
          </div>

          <!-- Chips de categorías -->
          <div class="category-chips-wrapper d-flex align-items-center gap-2 overflow-auto pb-1">
            <button *ngFor="let cat of categories" 
                    class="hud-chip"
                    [class.active]="selectedCategory() === cat"
                    (click)="selectedCategory.set(cat)">
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Grid de tarjetas de productos -->
        <div class="pos-products-grid flex-grow-1">
          <div *ngIf="filteredProducts().length === 0" class="hud-panel p-5 text-center text-muted">
            <i class="bi bi-inbox fs-1 mb-2 d-block text-cyan"></i>
            <h5>No se encontraron materiales</h5>
            <p class="small">Prueba ajustando el término de búsqueda o cambiando de categoría.</p>
            <button class="btn-hud-secondary btn-sm mt-2" (click)="resetFilters()">
              Restablecer filtros
            </button>
          </div>

          <div class="products-grid">
            <div *ngFor="let product of filteredProducts()" 
                 class="product-card hud-panel hud-panel-hoverable cursor-pointer p-3 d-flex flex-column justify-content-between"
                 (click)="addToCart(product)">
              
              <!-- Encabezado de la tarjeta con categoría y SKU -->
              <div class="d-flex align-items-start justify-content-between mb-2">
                <span class="product-category-tag text-muted">{{ product.category }}</span>
                <span class="product-sku-tag text-muted tabular-nums">{{ product.sku }}</span>
              </div>

              <!-- Nombre del producto -->
              <h4 class="product-title mb-2">{{ product.name }}</h4>

              <!-- Indicador de stock con punto de color según regla del brief -->
              <div class="mb-3">
                <span class="badge-status" [ngClass]="getStockStatusClass(product)">
                  <span class="badge-status-dot"></span>
                  <span class="status-label">
                    {{ getStockStatusLabel(product) }}: 
                    <strong class="tabular-nums">{{ product.stock }} {{ product.unit }}</strong>
                  </span>
                </span>
              </div>

              <!-- Pie de la tarjeta con precio grande y botón rápido -->
              <div class="product-footer d-flex align-items-center justify-content-between pt-2 border-top">
                <div class="product-price tabular-nums">
                  <span class="currency-symbol">$</span>{{ product.price.toLocaleString('es-CO') }}
                </div>
                <button class="btn-add-quick" title="Agregar al carrito">
                  <i class="bi bi-plus-lg"></i>
                </button>
              </div>

            </div>
          </div>
        </div>

      </section>

      <!-- ZONA DERECHA: CARRITO FIJO DE VENTA -->
      <aside class="pos-cart-section hud-panel hud-bracket d-flex flex-column">
        
        <!-- Header del carrito -->
        <div class="hud-panel-header p-3 border-bottom d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <div class="cart-icon-wrapper" [class.animate-cart-pulse]="cartPulsing()">
              <i class="bi bi-cart3 text-cyan fs-5"></i>
            </div>
            <div>
              <h3 class="cart-title m-0">Carrito de Venta</h3>
              <span class="text-muted small">Items: <strong class="text-cyan tabular-nums">{{ totalItems() }}</strong></span>
            </div>
          </div>

          <button *ngIf="cartItems().length > 0" 
                  class="btn-clear-cart text-danger small" 
                  (click)="clearCart()"
                  title="Vaciar carrito de venta">
            <i class="bi bi-trash"></i> Vaciar
          </button>
        </div>

        <!-- Selector de Cliente -->
        <div class="cart-customer-selector p-3 border-bottom">
          <label class="form-label text-muted small fw-bold mb-1 d-flex align-items-center justify-content-between">
            <span>Cliente Facturación</span>
            <span class="text-cyan small cursor-pointer" (click)="selectedCustomerId.set(1)">Restablecer</span>
          </label>
          <select class="form-select" [(ngModel)]="selectedCustomerId">
            <option *ngFor="let c of customers()" [value]="c.id">
              {{ c.name }} · {{ c.document }}
            </option>
          </select>
        </div>

        <!-- Lista de items en el carrito -->
        <div class="cart-items-list flex-grow-1 p-3 overflow-auto">
          
          <div *ngIf="cartItems().length === 0" class="empty-cart-state text-center py-5 text-muted">
            <div class="empty-cart-icon mb-3">
              <i class="bi bi-cart-x fs-1 text-muted"></i>
            </div>
            <h6>Carrito vacío</h6>
            <p class="small text-muted mb-0">Selecciona materiales del catálogo izquierdo para armar el pedido de obra.</p>
          </div>

          <div *ngFor="let item of cartItems()" class="cart-item-card p-2 mb-2 rounded border">
            <div class="d-flex align-items-start justify-content-between mb-1">
              <span class="cart-item-name fw-medium">{{ item.productName }}</span>
              <button class="btn-remove-item text-danger" (click)="removeFromCart(item.productId)" title="Quitar ítem">
                <i class="bi bi-x"></i>
              </button>
            </div>

            <div class="d-flex align-items-center justify-content-between">
              <!-- Controles + y - -->
              <div class="quantity-stepper d-flex align-items-center">
                <button class="btn-step" (click)="decrementQuantity(item.productId)">
                  <i class="bi bi-dash"></i>
                </button>
                <input type="number" 
                       class="step-input tabular-nums text-center" 
                       [(ngModel)]="item.quantity" 
                       (change)="validateQuantity(item)"
                       min="1" />
                <button class="btn-step" (click)="incrementQuantity(item.productId)">
                  <i class="bi bi-plus"></i>
                </button>
              </div>

              <!-- Subtotal por ítem -->
              <div class="text-end">
                <div class="cart-item-unit-price text-muted small tabular-nums">
                  $ {{ item.unitPrice.toLocaleString('es-CO') }} c/u
                </div>
                <div class="cart-item-total fw-bold tabular-nums">
                  $ {{ item.subtotal.toLocaleString('es-CO') }}
                </div>
              </div>
            </div>

            <!-- Aviso en línea sin bloquear si excede el stock disponible (regla del brief) -->
            <div *ngIf="item.quantity > item.availableStock" class="cart-stock-warning mt-2 p-1 px-2 rounded">
              <i class="bi bi-exclamation-triangle-fill text-warning me-1"></i>
              <span>Supera stock físico disponible (<strong>{{ item.availableStock }} {{ item.unit }}</strong>). Se registrará como pedido especial.</span>
            </div>
          </div>

        </div>

        <!-- Resumen financiero y Botón de confirmación -->
        <div class="pos-cart-footer p-3 border-top">
          <div class="financial-summary mb-3">
            <div class="d-flex justify-content-between text-muted mb-1 small">
              <span>Subtotal (Base):</span>
              <span class="tabular-nums">$ {{ subtotal().toLocaleString('es-CO') }}</span>
            </div>
            <div class="d-flex justify-content-between text-muted mb-2 small">
              <span>IVA (19%):</span>
              <span class="tabular-nums">$ {{ tax().toLocaleString('es-CO') }}</span>
            </div>
            <div class="hud-divider my-2"></div>
            <div class="d-flex justify-content-between align-items-baseline">
              <span class="total-label fw-bold">TOTAL</span>
              <span class="total-amount text-cyan tabular-nums">
                $ {{ totalAmount().toLocaleString('es-CO') }}
              </span>
            </div>
          </div>

          <!-- Botón principal Confirmar Venta -->
          <button class="btn-confirm-sale btn-hud-primary w-100 py-3" 
                  [disabled]="cartItems().length === 0"
                  (click)="confirmSale()">
            <i class="bi bi-check2-circle fs-5"></i>
            <span>Confirmar Venta</span>
          </button>
        </div>

      </aside>
    </div>

    <!-- MODAL DE RESUMEN Y COMPROBANTE AL CONFIRMAR VENTA -->
    <div class="modal-backdrop-hud" *ngIf="completedSale()" (click)="closeReceiptModal()">
      <div class="modal-receipt hud-panel hud-bracket p-4" (click)="$event.stopPropagation()">
        
        <div class="receipt-header text-center pb-3 border-bottom mb-3">
          <div class="receipt-icon mb-2">
            <i class="bi bi-check-circle-fill text-success fs-1"></i>
          </div>
          <h3 class="m-0 firmeza-logo-brand text-cyan">FIRMEZA MATERIALES</h3>
          <p class="text-muted small m-0">Comprobante Oficial de Despacho y Venta</p>
          <div class="invoice-tag mt-2">
            <span class="badge-status status-success tabular-nums">FACTURA: {{ completedSale()?.invoiceNumber }}</span>
          </div>
        </div>

        <div class="receipt-details mb-3">
          <div class="d-flex justify-content-between small text-muted mb-1">
            <span>Fecha y Hora:</span>
            <span class="tabular-nums text-main">{{ completedSale()?.date | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <div class="d-flex justify-content-between small text-muted mb-1">
            <span>Cliente:</span>
            <span class="text-main fw-semibold">{{ completedSale()?.customerName }}</span>
          </div>
          <div class="d-flex justify-content-between small text-muted">
            <span>Estado:</span>
            <span class="text-success fw-bold">Completada & Despachada</span>
          </div>
        </div>

        <!-- Tabla de items del comprobante -->
        <div class="receipt-table-wrapper mb-3 border rounded overflow-hidden">
          <table class="hud-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th class="text-center">Cant.</th>
                <th class="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of completedSale()?.details">
                <td>{{ d.productName }}</td>
                <td class="text-center tabular-nums">{{ d.quantity }}</td>
                <td class="text-end tabular-nums">$ {{ d.subtotal.toLocaleString('es-CO') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Resumen final del comprobante -->
        <div class="receipt-totals p-2 rounded mb-3 bg-base">
          <div class="d-flex justify-content-between small text-muted mb-1">
            <span>Subtotal:</span>
            <span class="tabular-nums">$ {{ completedSale()?.subtotal?.toLocaleString('es-CO') }}</span>
          </div>
          <div class="d-flex justify-content-between small text-muted mb-1">
            <span>IVA (19%):</span>
            <span class="tabular-nums">$ {{ completedSale()?.tax?.toLocaleString('es-CO') }}</span>
          </div>
          <div class="d-flex justify-content-between fw-bold fs-5 pt-1 border-top">
            <span class="text-main">TOTAL PAGADO:</span>
            <span class="text-cyan tabular-nums">$ {{ completedSale()?.totalAmount?.toLocaleString('es-CO') }}</span>
          </div>
        </div>

        <!-- Botones de acción del modal -->
        <div class="d-flex gap-2">
          <button class="btn-hud-secondary flex-grow-1" (click)="printReceipt()">
            <i class="bi bi-printer me-1"></i> Imprimir Recibo
          </button>
          <button class="btn-hud-primary flex-grow-1" (click)="closeReceiptModal()">
            <i class="bi bi-plus-circle me-1"></i> Nueva Venta
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .hud-pos-layout {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 1.5rem;
      height: 100%;
      min-height: calc(100vh - 150px);
    }

    @media (max-width: 1199.98px) {
      .hud-pos-layout {
        grid-template-columns: 1fr 360px;
        gap: 1rem;
      }
    }

    @media (max-width: 991.98px) {
      .hud-pos-layout {
        display: flex;
        flex-direction: column;
        height: auto;
      }
      .pos-cart-section {
        min-height: 480px;
      }
    }

    /* Catálogo */
    .pos-catalog-section {
      min-width: 0;
    }

    .btn-clear-search {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
    }

    .category-chips-wrapper::-webkit-scrollbar {
      height: 4px;
    }

    /* Grid de tarjetas de producto */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }

    .product-card {
      min-height: 190px;
      border-radius: var(--radius-card);
      border: 1px solid var(--border-color);
      transition: all var(--transition-fast);
      user-select: none;
    }

    .product-category-tag {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .product-sku-tag {
      font-size: 11px;
      font-family: var(--font-numbers);
    }

    .product-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-main);
      line-height: 1.3;
    }

    .status-label {
      font-size: 11.5px;
    }

    .product-price {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-main);
    }
    .currency-symbol {
      font-size: 14px;
      margin-right: 2px;
      color: var(--accent-primary);
    }

    .btn-add-quick {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background-color: var(--accent-primary-soft);
      border: 1px solid var(--accent-primary);
      color: var(--accent-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
    }
    .product-card:hover .btn-add-quick {
      background-color: var(--accent-primary);
      color: #0B1020;
      box-shadow: 0 0 10px rgba(34, 211, 238, 0.4);
    }

    /* Carrito Fijo */
    .pos-cart-section {
      height: calc(100vh - 150px);
      position: sticky;
      top: 1rem;
      border-radius: var(--radius-card);
    }

    .cart-title {
      font-size: 16px;
      font-weight: 700;
    }

    .cart-icon-wrapper {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: var(--accent-primary-soft);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-clear-cart {
      background: none;
      border: none;
      cursor: pointer;
      font-weight: 500;
    }

    .cart-item-card {
      background-color: var(--bg-panel-hover);
      border-color: var(--border-color) !important;
    }

    .cart-item-name {
      font-size: 13px;
      color: var(--text-main);
      max-width: 280px;
    }

    .btn-remove-item {
      background: none;
      border: none;
      font-size: 18px;
      padding: 0;
      cursor: pointer;
      line-height: 1;
    }

    .quantity-stepper {
      background-color: var(--bg-base);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      overflow: hidden;
    }

    .btn-step {
      width: 28px;
      height: 28px;
      background: none;
      border: none;
      color: var(--text-main);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color var(--transition-fast);
    }
    .btn-step:hover {
      background-color: var(--bg-panel-active);
      color: var(--accent-primary);
    }

    .step-input {
      width: 40px;
      height: 28px;
      border: none;
      background: transparent;
      color: var(--text-main);
      font-weight: 600;
      font-size: 13px;
      outline: none;
    }

    .cart-item-total {
      font-size: 14px;
      color: var(--text-main);
    }

    .cart-stock-warning {
      background-color: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: var(--color-warning);
      font-size: 11.5px;
      line-height: 1.3;
    }

    .total-label {
      font-size: 16px;
      font-family: var(--font-heading);
      letter-spacing: 0.05em;
    }

    .total-amount {
      font-size: 24px;
      font-weight: 700;
      color: var(--accent-primary);
      text-shadow: 0 0 12px rgba(34, 211, 238, 0.25);
    }

    .btn-confirm-sale {
      font-size: 16px;
    }

    /* Modal Comprobante */
    .modal-backdrop-hud {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(4, 8, 16, 0.8);
      backdrop-filter: blur(6px);
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
    .text-cyan {
      color: var(--accent-primary);
    }
  `]
})
export class PosComponent {
  private productsService = inject(ProductsService);
  private customersService = inject(CustomersService);
  private salesService = inject(SalesService);
  private toastService = inject(ToastService);

  searchQuery = '';
  selectedCategory = signal<string>('Todos');
  selectedCustomerId = signal<number>(1);
  cartItems = signal<CartItem[]>([]);
  cartPulsing = signal<boolean>(false);
  completedSale = signal<Sale | null>(null);

  categories: string[] = [
    'Todos',
    'Cementos & Mezclas',
    'Acero & Hierro',
    'Ladrillos & Bloques',
    'Áridos & Agregados',
    'Pinturas & Acabados',
    'Herramientas',
    'Tuberías & PVC'
  ];

  customers = computed(() => this.customersService.getAll());

  filteredProducts = computed(() => {
    let list = this.productsService.getAll();
    const cat = this.selectedCategory();
    if (cat !== 'Todos') {
      list = list.filter(p => p.category === cat);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return list;
  });

  totalItems = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.quantity, 0);
  });

  subtotal = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.subtotal, 0);
  });

  tax = computed(() => {
    return Math.round(this.subtotal() * 0.19); // IVA 19%
  });

  totalAmount = computed(() => {
    return this.subtotal() + this.tax();
  });

  getStockStatusClass(p: Product): string {
    if (p.stock <= p.minStock) return 'status-danger';
    if (p.stock <= p.minStock * 2) return 'status-warning';
    return 'status-success';
  }

  getStockStatusLabel(p: Product): string {
    if (p.stock <= p.minStock) return 'Stock Crítico';
    if (p.stock <= p.minStock * 2) return 'Stock Medio';
    return 'Stock Sano';
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedCategory.set('Todos');
  }

  addToCart(product: Product) {
    this.triggerCartPulse();

    this.cartItems.update(items => {
      const existing = items.find(i => i.productId === product.id);
      if (existing) {
        return items.map(i => {
          if (i.productId === product.id) {
            const newQty = i.quantity + 1;
            return {
              ...i,
              quantity: newQty,
              subtotal: newQty * i.unitPrice
            };
          }
          return i;
        });
      } else {
        const newItem: CartItem = {
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
          subtotal: product.price,
          availableStock: product.stock,
          unit: product.unit
        };
        return [...items, newItem];
      }
    });

    this.toastService.show(`+1 ${product.name} agregado`, 'info');
  }

  incrementQuantity(productId: number) {
    this.cartItems.update(items => items.map(i => {
      if (i.productId === productId) {
        const q = i.quantity + 1;
        return { ...i, quantity: q, subtotal: q * i.unitPrice };
      }
      return i;
    }));
  }

  decrementQuantity(productId: number) {
    this.cartItems.update(items => {
      return items.map(i => {
        if (i.productId === productId) {
          const q = Math.max(1, i.quantity - 1);
          return { ...i, quantity: q, subtotal: q * i.unitPrice };
        }
        return i;
      });
    });
  }

  validateQuantity(item: CartItem) {
    if (item.quantity < 1) item.quantity = 1;
    item.subtotal = item.quantity * item.unitPrice;
  }

  removeFromCart(productId: number) {
    this.cartItems.update(items => items.filter(i => i.productId !== productId));
  }

  clearCart() {
    this.cartItems.set([]);
  }

  private triggerCartPulse() {
    this.cartPulsing.set(true);
    setTimeout(() => this.cartPulsing.set(false), 350);
  }

  confirmSale() {
    if (this.cartItems().length === 0) return;

    const details: SaleDetail[] = this.cartItems().map(i => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal
    }));

    const newSale = this.salesService.createSale(Number(this.selectedCustomerId()), details);
    this.completedSale.set(newSale);
    this.clearCart();
    this.toastService.show(`¡Venta ${newSale.invoiceNumber} confirmada y despachada!`, 'success');
  }

  closeReceiptModal() {
    this.completedSale.set(null);
  }

  printReceipt() {
    window.print();
  }
}
