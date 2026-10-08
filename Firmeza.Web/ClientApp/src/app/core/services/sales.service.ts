import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Sale, SaleDetail } from '../models/models';
import { ProductsService } from './products.service';
import { CustomersService } from './customers.service';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private http = inject(HttpClient);
  private productsService = inject(ProductsService);
  private customersService = inject(CustomersService);
  private apiUrl = 'http://localhost:5035/api/sales';

  private initialSales: Sale[] = [
    {
      id: 101,
      invoiceNumber: 'FZ-2026-0101',
      date: '2026-10-07T14:35:00',
      customerId: 1,
      customerName: 'Constructora Los Andes S.A.S',
      itemsCount: 40,
      subtotal: 1380000,
      tax: 262200,
      totalAmount: 1642200,
      status: 'Confirmada',
      details: [
        { productId: 1, productName: 'Cemento Gris Argos Tipo 1 (50kg)', quantity: 40, unitPrice: 34500, subtotal: 1380000 }
      ]
    },
    {
      id: 102,
      invoiceNumber: 'FZ-2026-0102',
      date: '2026-10-07T11:20:00',
      customerId: 3,
      customerName: 'Maestro Juan Carlos Pérez',
      itemsCount: 15,
      subtotal: 447000,
      tax: 84930,
      totalAmount: 531930,
      status: 'Entregada',
      details: [
        { productId: 2, productName: 'Varilla Corrugada 1/2" x 6m W60', quantity: 15, unitPrice: 29800, subtotal: 447000 }
      ]
    },
    {
      id: 103,
      invoiceNumber: 'FZ-2026-0103',
      date: '2026-10-06T16:45:00',
      customerId: 4,
      customerName: 'Obras Civiles Bolívar Ltda.',
      itemsCount: 300,
      subtotal: 555000,
      tax: 105450,
      totalAmount: 660450,
      status: 'Confirmada',
      details: [
        { productId: 3, productName: 'Ladrillo Farol Limpio 10x20x30', quantity: 300, unitPrice: 1850, subtotal: 555000 }
      ]
    },
    {
      id: 104,
      invoiceNumber: 'FZ-2026-0104',
      date: '2026-10-06T09:15:00',
      customerId: 2,
      customerName: 'Inversiones Bogotá y Cía.',
      itemsCount: 10,
      subtotal: 850000,
      tax: 161500,
      totalAmount: 1011500,
      status: 'Pendiente',
      details: [
        { productId: 5, productName: 'Grava Triturada 1/2" (M3)', quantity: 10, unitPrice: 85000, subtotal: 850000 }
      ]
    }
  ];

  public sales = signal<Sale[]>(this.initialSales);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const saved = localStorage.getItem('firmeza_sales');
    if (saved) {
      try {
        this.sales.set(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Error parseando ventas almacenadas', e);
      }
    }
    this.persist();
  }

  private persist() {
    localStorage.setItem('firmeza_sales', JSON.stringify(this.sales()));
  }

  getAll(): Sale[] {
    return this.sales();
  }

  getById(id: number): Sale | undefined {
    return this.sales().find(s => s.id === id);
  }

  createSale(param1: number | { productId: number; quantity: number }[], param2?: any[]): Sale {
    let customerId = 1;
    let rawDetails: { productId: number; quantity: number; unitPrice?: number; productName?: string }[] = [];

    if (typeof param1 === 'number') {
      customerId = param1;
      rawDetails = param2 || [];
    } else {
      rawDetails = param1;
      customerId = 1; // Default cliente general / autenticado
    }

    const customer = this.customersService.getById(customerId) || { name: 'Cliente General (Web / POS)' };

    const details: SaleDetail[] = rawDetails.map(d => {
      const p = this.productsService.getById(d.productId);
      const unitPrice = d.unitPrice || p?.price || 0;
      return {
        productId: d.productId,
        productName: d.productName || p?.name || `Producto #${d.productId}`,
        quantity: d.quantity,
        unitPrice,
        subtotal: d.quantity * unitPrice
      };
    });

    const totalAmount = details.reduce((sum, d) => sum + d.subtotal, 0);
    // IVA 19% desglosado exactamente con fórmula del dominio (InventoryCalculator)
    const subtotal = Math.round(totalAmount / 1.19 * 100) / 100;
    const tax = Math.round((totalAmount - subtotal) * 100) / 100;
    const itemsCount = details.reduce((sum, d) => sum + d.quantity, 0);

    const nextId = Math.max(100, ...this.sales().map(s => s.id)) + 1;
    const invoiceNumber = `VTA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(nextId).padStart(4, '0')}`;

    // Si es del POS directo, confirmamos y descontamos stock
    const isDirectPOS = typeof param1 === 'number';
    if (isDirectPOS) {
      for (const item of details) {
        this.productsService.reduceStock(item.productId, item.quantity);
      }
    }

    const newSale: Sale = {
      id: nextId,
      invoiceNumber,
      date: new Date().toISOString(),
      customerId,
      customerName: customer.name,
      itemsCount,
      subtotal,
      tax,
      totalAmount,
      details,
      status: isDirectPOS ? 'Confirmada' : 'Pendiente'
    };

    this.sales.update(list => [newSale, ...list]);
    this.persist();

    return newSale;
  }

  updateStatus(saleId: number, newStatus: string): Sale | undefined {
    let updatedSale: Sale | undefined;

    this.sales.update(list => list.map(s => {
      if (s.id !== saleId) return s;

      // Si pasa a Confirmada desde Pendiente, descontar stock
      if (newStatus === 'Confirmada' && s.status === 'Pendiente') {
        for (const item of s.details) {
          this.productsService.reduceStock(item.productId, item.quantity);
        }
      }

      // Si pasa a Cancelada desde Confirmada, restaurar stock
      if (newStatus === 'Cancelada' && s.status === 'Confirmada') {
        for (const item of s.details) {
          this.productsService.replenishStock(item.productId, item.quantity);
        }
      }

      updatedSale = { ...s, status: newStatus as any };
      return updatedSale;
    }));

    this.persist();
    return updatedSale;
  }
}
