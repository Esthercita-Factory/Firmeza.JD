import { Injectable, inject } from '@angular/core';
import { ProductsService } from './products.service';
import { SalesService } from './sales.service';
import { CustomersService } from './customers.service';
import { DashboardSummary } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private productsService = inject(ProductsService);
  private salesService = inject(SalesService);
  private customersService = inject(CustomersService);

  getSummary(): DashboardSummary {
    const products = this.productsService.getAll();
    const sales = this.salesService.getAll();
    const customers = this.customersService.getAll();

    // Filtro de bajo stock
    const lowStockAlerts = products.filter(p => p.stock <= p.minStock);

    // Ventas de hoy
    const today = new Date().toISOString().slice(0, 10);
    const todaySalesList = sales.filter(s => s.date.toString().startsWith(today));
    const todaySales = todaySalesList.reduce((sum, s) => sum + s.totalAmount, 0) || 3185630;

    // Ticket promedio
    const totalSalesAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const averageTicket = sales.length > 0 ? Math.round(totalSalesAmount / sales.length) : 740000;

    return {
      todaySales,
      todaySalesChange: 14.8, // +14.8%
      newCustomers: customers.length,
      newCustomersChange: 12.5,
      lowStockProductsCount: lowStockAlerts.length,
      averageTicket,
      averageTicketChange: 5.2,
      weeklySales: [
        { day: 'Lun', amount: 2450000 },
        { day: 'Mar', amount: 3890000 },
        { day: 'Mié', amount: 4120000 },
        { day: 'Jue', amount: 3450000 },
        { day: 'Vie', amount: 5670000 },
        { day: 'Sáb', amount: 4890000 },
        { day: 'Hoy', amount: todaySales, isToday: true }
      ],
      topProducts: [
        { name: 'Cemento Gris Argos 50kg', quantitySold: 1240, percentage: 88 },
        { name: 'Varilla Corrugada 1/2" x 6m', quantitySold: 980, percentage: 72 },
        { name: 'Ladrillo Farol Limpio', quantitySold: 3200, percentage: 65 },
        { name: 'Arena Lavada M3', quantitySold: 145, percentage: 50 },
        { name: 'Pintura Vinilo Tipo 1 Blanco', quantitySold: 88, percentage: 38 }
      ],
      lowStockAlerts
    };
  }
}
