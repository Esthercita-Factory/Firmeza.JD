import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/models';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5035/api/products';

  // Datos iniciales de catálogo de materiales de construcción con categorías y niveles de stock
  private initialProducts: Product[] = [
    { id: 1, name: 'Cemento Gris Argos Tipo 1 (50kg)', category: 'Cementos & Mezclas', sku: 'CEM-ARG-50', price: 34500, stock: 120, minStock: 25, unit: 'Bulto', description: 'Cemento portland para uso estructural general y mampostería.' },
    { id: 2, name: 'Varilla Corrugada 1/2" x 6m W60', category: 'Acero & Hierro', sku: 'VAR-COR-12', price: 29800, stock: 85, minStock: 20, unit: 'Unidad', description: 'Acero de refuerzo corrugado sismorresistente norma NTC 2289.' },
    { id: 3, name: 'Ladrillo Farol Limpio 10x20x30', category: 'Ladrillos & Bloques', sku: 'LAD-FAR-10', price: 1850, stock: 450, minStock: 100, unit: 'Unidad', description: 'Ladrillo arcilla cocida para muros divisorios y fachadas.' },
    { id: 4, name: 'Arena Lavada de Río (M3)', category: 'Áridos & Agregados', sku: 'ARE-RIO-M3', price: 78000, stock: 14, minStock: 15, unit: 'm³', description: 'Arena lavada clasificada para mezclas de concreto y pañete.' },
    { id: 5, name: 'Grava Triturada 1/2" (M3)', category: 'Áridos & Agregados', sku: 'GRA-TRI-12', price: 85000, stock: 18, minStock: 15, unit: 'm³', description: 'Agregado grueso para fundición de zapatas, vigas y columnas.' },
    { id: 6, name: 'Pintura Vinilo Tipo 1 Blanco (5 Gal)', category: 'Pinturas & Acabados', sku: 'PIN-VIN-05', price: 142000, stock: 4, minStock: 10, unit: 'Cuñete', description: 'Pintura base agua alta lavabilidad y cubrimiento para interiores.' },
    { id: 7, name: 'Tubo PVC Sanitario 3" x 3m', category: 'Tuberías & PVC', sku: 'PVC-SAN-03', price: 42500, stock: 3, minStock: 8, unit: 'Tubo', description: 'Tubería rígida de PVC para desagües de aguas servidas.' },
    { id: 8, name: 'Malla Electrosoldada 4mm 2.15x6m', category: 'Acero & Hierro', sku: 'MAL-ELE-4M', price: 68900, stock: 2, minStock: 6, unit: 'Hoja', description: 'Refuerzo para losas de contrapiso y pavimentos.' },
    { id: 9, name: 'Carretilla Obra Pesada 60L Herragro', category: 'Herramientas', sku: 'HER-CAR-60', price: 215000, stock: 9, minStock: 5, unit: 'Unidad', description: 'Tolva en lámina calibre 18, llanta neumática reforzada.' },
    { id: 10, name: 'Pala Redonda Cabo Madera No. 4', category: 'Herramientas', sku: 'HER-PAL-04', price: 38000, stock: 28, minStock: 10, unit: 'Unidad', description: 'Pala con collarín de refuerzo para movimiento de tierras.' },
    { id: 11, name: 'Bloque de Cemento No. 5 (15x20x40)', category: 'Ladrillos & Bloques', sku: 'BLO-CEM-15', price: 3200, stock: 310, minStock: 60, unit: 'Unidad', description: 'Bloque estructural vibrocompactado de alta resistencia.' },
    { id: 12, name: 'Impermeabilizante Sika 1 (4kg)', category: 'Pinturas & Acabados', sku: 'IMP-SIK-04', price: 54900, stock: 5, minStock: 8, unit: 'Galón', description: 'Aditivo líquido impermeabilizante para morteros y pañetes.' }
  ];

  public products = signal<Product[]>(this.initialProducts);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const saved = localStorage.getItem('firmeza_products');
    if (saved) {
      try {
        this.products.set(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Error parseando productos almacenados', e);
      }
    }
    this.persist();
  }

  private persist() {
    localStorage.setItem('firmeza_products', JSON.stringify(this.products()));
  }

  getAll() {
    return this.products();
  }

  refreshFromApi() {
    this.http.get<any[]>('http://localhost:5035/api/products').pipe(
      tap(apiProds => {
        if (apiProds && apiProds.length > 0) {
          const mapped: Product[] = apiProds.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category || 'Materiales',
            sku: p.sku || `FZ-${p.id}`,
            price: p.price,
            stock: p.stock,
            minStock: p.minStock || 10,
            unit: p.unit || 'Unidad',
            description: p.description || ''
          }));
          this.products.set(mapped);
          this.persist();
        }
      }),
      catchError(() => of([]))
    ).subscribe();
  }

  getById(id: number): Product | undefined {
    return this.products().find(p => p.id === id);
  }

  create(product: Omit<Product, 'id'>): Product {
    const nextId = Math.max(0, ...this.products().map(p => p.id)) + 1;
    const newProduct: Product = { ...product, id: nextId };
    this.products.update(list => [newProduct, ...list]);
    this.persist();
    return newProduct;
  }

  update(id: number, updated: Partial<Product>): boolean {
    let success = false;
    this.products.update(list => list.map(p => {
      if (p.id === id) {
        success = true;
        return { ...p, ...updated };
      }
      return p;
    }));
    if (success) this.persist();
    return success;
  }

  delete(id: number): boolean {
    let success = false;
    this.products.update(list => {
      const filtered = list.filter(p => p.id !== id);
      if (filtered.length !== list.length) success = true;
      return filtered;
    });
    if (success) this.persist();
    return success;
  }

  replenishStock(id: number, addedQuantity: number): Product | undefined {
    let updatedProduct: Product | undefined;
    this.products.update(list => list.map(p => {
      if (p.id === id) {
        updatedProduct = { ...p, stock: p.stock + addedQuantity };
        return updatedProduct;
      }
      return p;
    }));
    if (updatedProduct) this.persist();
    return updatedProduct;
  }

  reduceStock(id: number, quantity: number): boolean {
    let success = false;
    this.products.update(list => list.map(p => {
      if (p.id === id) {
        const newStock = Math.max(0, p.stock - quantity);
        success = true;
        return { ...p, stock: newStock };
      }
      return p;
    }));
    if (success) this.persist();
    return success;
  }
}
