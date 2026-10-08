import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Product } from '../../core/models/models';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="shop-container">
      <!-- HEADER DEL CATÁLOGO HUD -->
      <div class="hud-catalog-header">
        <div>
          <div class="hud-tag">PORTAL DE MATERIALES & SUMINISTROS</div>
          <h1 class="hud-catalog-title">CATÁLOGO DE PRODUCTOS</h1>
          <p class="hud-catalog-subtitle">Explora inventario disponible y genera pedidos de despacho directo para obra.</p>
        </div>

        <div class="hud-cart-summary">
          <a routerLink="/carrito" class="cart-pill-btn">
            <span class="cart-icon">🛒</span>
            <span class="cart-text">MI CARRITO</span>
            <span class="cart-badge tabular-nums">{{ cartService.count() }}</span>
            <span class="cart-total tabular-nums">{{ cartService.total() | currency:'USD':'symbol':'1.2-2' }}</span>
          </a>
        </div>
      </div>

      <!-- BARRA DE BÚSQUEDA Y FILTROS -->
      <div class="hud-filter-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Buscar por código SKU, cemento, perfiles, arena..."
            class="hud-input"
          />
        </div>

        <div class="category-chips">
          <button
            class="category-chip"
            [class.active]="selectedCategory() === 'ALL'"
            (click)="selectedCategory.set('ALL')">
            TODOS ({{ products().length }})
          </button>
          <button
            *ngFor="let cat of categories()"
            class="category-chip"
            [class.active]="selectedCategory() === cat"
            (click)="selectedCategory.set(cat)">
            {{ cat | uppercase }}
          </button>
        </div>
      </div>

      <!-- GRILLA DE PRODUCTOS -->
      <div class="product-grid" *ngIf="filteredProducts().length > 0; else noProducts">
        <div class="product-card" *ngFor="let p of filteredProducts()">
          <div class="card-status-line" [class.low-stock]="p.stock <= p.minStock && p.stock > 0" [class.no-stock]="p.stock === 0"></div>
          
          <div class="card-header">
            <span class="sku-tag">{{ p.sku || 'MAT-' + p.id }}</span>
            <span class="stock-pill" [class.pill-danger]="p.stock === 0" [class.pill-warning]="p.stock > 0 && p.stock <= p.minStock" [class.pill-success]="p.stock > p.minStock">
              {{ p.stock === 0 ? 'AGOTADO' : (p.stock + ' ' + p.unit) }}
            </span>
          </div>

          <div class="card-body">
            <h3 class="product-name">{{ p.name }}</h3>
            <span class="product-category">{{ p.category }}</span>
            <p class="product-desc">{{ p.description || 'Suministro industrial certificado para construcción civil.' }}</p>
          </div>

          <div class="card-footer">
            <div class="price-box">
              <span class="price-label">PRECIO (IVA INC.)</span>
              <span class="price-value tabular-nums">{{ p.price | currency:'USD':'symbol':'1.2-2' }}</span>
            </div>

            <div class="action-box">
              <button
                class="hud-btn-add"
                [disabled]="p.stock === 0 || cartService.availableToAdd(p) === 0"
                (click)="addToCart(p)">
                <span *ngIf="cartService.quantityOf(p.id) === 0">AGREGAR</span>
                <span *ngIf="cartService.quantityOf(p.id) > 0">
                  EN CARRITO ({{ cartService.quantityOf(p.id) }}) +
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ng-template #noProducts>
        <div class="hud-empty-box">
          <div class="empty-icon">📦</div>
          <h3>No se encontraron productos</h3>
          <p>Intenta con otros términos de búsqueda o selecciona otra categoría.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .shop-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .hud-catalog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: var(--bg-panel);
      border: 1px solid var(--border-panel);
      padding: 1.5rem;
      border-radius: 6px;
      position: relative;
    }

    .hud-tag {
      font-size: 0.65rem;
      letter-spacing: 0.15em;
      color: var(--accent-cyan);
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .hud-catalog-title {
      font-family: var(--font-brand);
      font-size: 1.6rem;
      margin: 0;
      letter-spacing: 0.05em;
      color: var(--text-primary);
    }

    .hud-catalog-subtitle {
      margin: 0.25rem 0 0;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .cart-pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      background: rgba(34, 211, 238, 0.1);
      border: 1px solid var(--accent-cyan);
      color: var(--accent-cyan);
      padding: 0.6rem 1.1rem;
      border-radius: 40px;
      text-decoration: none;
      font-weight: 600;
      box-shadow: 0 0 15px rgba(34, 211, 238, 0.15);
      transition: all 0.2s ease;
    }

    .cart-pill-btn:hover {
      background: var(--accent-cyan);
      color: #0b1020;
    }

    .cart-badge {
      background: var(--accent-cyan);
      color: #0b1020;
      padding: 0.1rem 0.45rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 800;
    }

    .cart-pill-btn:hover .cart-badge {
      background: #0b1020;
      color: var(--accent-cyan);
    }

    .cart-total {
      font-family: var(--font-metrics);
      font-weight: 700;
      margin-left: 0.3rem;
    }

    .hud-filter-bar {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: var(--bg-panel);
      border: 1px solid var(--border-panel);
      padding: 1rem 1.25rem;
      border-radius: 6px;
    }

    .search-box {
      display: flex;
      align-items: center;
      background: var(--bg-canvas);
      border: 1px solid var(--border-panel);
      border-radius: 4px;
      padding: 0.5rem 0.75rem;
      gap: 0.5rem;
    }

    .hud-input {
      background: transparent;
      border: none;
      color: var(--text-primary);
      width: 100%;
      outline: none;
      font-family: var(--font-base);
      font-size: 0.9rem;
    }

    .category-chips {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .category-chip {
      background: transparent;
      border: 1px solid var(--border-panel);
      color: var(--text-muted);
      padding: 0.35rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .category-chip.active, .category-chip:hover {
      border-color: var(--accent-cyan);
      color: var(--accent-cyan);
      background: rgba(34, 211, 238, 0.05);
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .product-card {
      background: var(--bg-panel);
      border: 1px solid var(--border-panel);
      border-radius: 6px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .product-card:hover {
      transform: translateY(-2px);
      border-color: var(--accent-cyan);
    }

    .card-status-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--accent-cyan);
    }

    .card-status-line.low-stock { background: var(--status-warning); }
    .card-status-line.no-stock { background: var(--status-danger); }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .sku-tag {
      font-size: 0.7rem;
      color: var(--text-muted);
      font-family: var(--font-metrics);
    }

    .stock-pill {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }

    .pill-success { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
    .pill-warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
    .pill-danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

    .product-name {
      font-size: 1.05rem;
      font-family: var(--font-metrics);
      color: var(--text-primary);
      margin: 0 0 0.25rem;
    }

    .product-category {
      font-size: 0.7rem;
      color: var(--accent-violet);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .product-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin: 0.5rem 0 1rem;
      line-height: 1.3;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 1rem;
      border-top: 1px solid var(--border-panel);
    }

    .price-box {
      display: flex;
      flex-direction: column;
    }

    .price-label {
      font-size: 0.6rem;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .price-value {
      font-size: 1.25rem;
      font-weight: 700;
      font-family: var(--font-metrics);
      color: var(--text-primary);
    }

    .hud-btn-add {
      background: var(--accent-cyan);
      color: #0b1020;
      border: none;
      padding: 0.45rem 0.85rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .hud-btn-add:hover:not(:disabled) {
      filter: brightness(1.15);
      box-shadow: 0 0 10px rgba(34, 211, 238, 0.4);
    }

    .hud-btn-add:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .hud-empty-box {
      text-align: center;
      padding: 3rem;
      background: var(--bg-panel);
      border: 1px solid var(--border-panel);
      border-radius: 6px;
      color: var(--text-muted);
    }
  `]
})
export class ShopComponent {
  private productsService = inject(ProductsService);
  public cartService = inject(CartService);
  private toastService = inject(ToastService);

  searchQuery = '';
  selectedCategory = signal<string>('ALL');

  products = this.productsService.products;

  categories = computed(() => {
    const set = new Set<string>();
    this.products().forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  });

  filteredProducts = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.products().filter(p => {
      const matchesQ = !q || p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
      const matchesCat = cat === 'ALL' || p.category === cat;
      return matchesQ && matchesCat;
    });
  });

  addToCart(product: Product) {
    this.cartService.add(product, 1);
    this.toastService.showSuccess(`Agregado al carrito: ${product.name}`);
  }
}
