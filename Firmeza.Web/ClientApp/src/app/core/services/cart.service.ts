import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../models/models';

export interface CartLine {
  product: Product;
  quantity: number;
}

export const TAX_RATE = 0.19;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly items = signal<CartLine[]>([]);

  readonly lines = this.items.asReadonly();

  readonly count = computed(() => this.items().reduce((sum, line) => sum + line.quantity, 0));

  readonly isEmpty = computed(() => this.items().length === 0);

  /** Suma de cantidad x precio unitario con IVA incluido */
  readonly total = computed(() =>
    this.items().reduce((sum, line) => sum + line.quantity * line.product.price, 0)
  );

  /**
   * Cálculo unificado de impuestos según regla de negocio de Firmeza (InventoryCalculator)
   */
  readonly taxes = computed(() => {
    const total = this.total();
    const scale = 100;
    const rounded = (value: number) => Math.round(Math.abs(value) * scale + Number.EPSILON) / scale * Math.sign(value);
    const subtotalBase = rounded(total / (1 + TAX_RATE));
    return {
      subtotalBase,
      tax: rounded(total - subtotalBase),
      rate: TAX_RATE
    };
  });

  readonly subtotalBase = computed(() => this.taxes().subtotalBase);
  readonly iva = computed(() => this.taxes().tax);

  quantityOf(productId: number): number {
    return this.items().find((line) => line.product.id === productId)?.quantity ?? 0;
  }

  availableToAdd(product: Product): number {
    return Math.max(0, product.stock - this.quantityOf(product.id));
  }

  add(product: Product, quantity = 1): void {
    if (quantity <= 0) return;

    this.items.update((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);

      if (existing) {
        return lines.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: Math.min(line.quantity + quantity, product.stock) }
            : line
        );
      }

      return [...lines, { product, quantity: Math.min(quantity, product.stock) }];
    });
  }

  setQuantity(productId: number, quantity: number): void {
    this.items.update((lines) =>
      lines
        .map((line) => {
          if (line.product.id !== productId) return line;
          if (quantity <= 0) return null;
          return { ...line, quantity: Math.min(quantity, line.product.stock) };
        })
        .filter((line): line is CartLine => line !== null)
    );
  }

  increment(productId: number): void {
    this.setQuantity(productId, this.quantityOf(productId) + 1);
  }

  decrement(productId: number): void {
    this.setQuantity(productId, this.quantityOf(productId) - 1);
  }

  remove(productId: number): void {
    this.items.update((lines) => lines.filter((line) => line.product.id !== productId));
  }

  clear(): void {
    this.items.set([]);
  }
}
