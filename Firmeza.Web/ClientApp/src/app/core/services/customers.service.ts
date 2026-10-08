import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Customer } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5035/api/customers';

  private initialCustomers: Customer[] = [
    { id: 1, name: 'Constructora Los Andes S.A.S', document: '900.452.881-2', email: 'compras@losandes.com', phone: '+57 310 458 9201', address: 'Cra 45 # 78-12, Sector Industrial', age: 38, totalPurchases: 45200000 },
    { id: 2, name: 'Inversiones Bogotá y Cía.', document: '830.119.450-7', email: 'proyectos@inverbogota.com', phone: '+57 320 890 1144', address: 'Calle 100 # 19A-40 Of. 501', age: 45, totalPurchases: 28400000 },
    { id: 3, name: 'Maestro Juan Carlos Pérez', document: '79.845.120', email: 'maestrojuan@gmail.com', phone: '+57 312 673 8921', address: 'Transversal 14 # 45-20', age: 52, totalPurchases: 8900000 },
    { id: 4, name: 'Obras Civiles Bolívar Ltda.', document: '860.034.901-1', email: 'adquisiciones@obrasbolivar.com', phone: '+57 315 229 4433', address: 'Av. Las Américas # 68-80', age: 41, totalPurchases: 62100000 },
    { id: 5, name: 'Ferretería y Acabados del Norte', document: '901.203.499-5', email: 'contacto@ferrenorte.com', phone: '+57 317 800 2311', address: 'Cra 15 # 134-22', age: 34, totalPurchases: 14750000 },
    { id: 6, name: 'Ingeniero Andrés Restrepo', document: '1.020.765.432', email: 'andres.restrepo@civileng.co', phone: '+57 300 554 1122', address: 'Carrera 7 # 120-10', age: 29, totalPurchases: 5400000 }
  ];

  public customers = signal<Customer[]>(this.initialCustomers);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const saved = localStorage.getItem('firmeza_customers');
    if (saved) {
      try {
        this.customers.set(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Error parseando clientes almacenados', e);
      }
    }
    this.persist();
  }

  private persist() {
    localStorage.setItem('firmeza_customers', JSON.stringify(this.customers()));
  }

  getAll(): Customer[] {
    return this.customers();
  }

  getById(id: number): Customer | undefined {
    return this.customers().find(c => c.id === id);
  }

  create(customer: Omit<Customer, 'id'>): Customer {
    const nextId = Math.max(0, ...this.customers().map(c => c.id)) + 1;
    const newCustomer: Customer = { ...customer, id: nextId, totalPurchases: customer.totalPurchases || 0 };
    this.customers.update(list => [newCustomer, ...list]);
    this.persist();
    return newCustomer;
  }

  update(id: number, updated: Partial<Customer>): boolean {
    let success = false;
    this.customers.update(list => list.map(c => {
      if (c.id === id) {
        success = true;
        return { ...c, ...updated };
      }
      return c;
    }));
    if (success) this.persist();
    return success;
  }

  delete(id: number): boolean {
    let success = false;
    this.customers.update(list => {
      const filtered = list.filter(c => c.id !== id);
      if (filtered.length !== list.length) success = true;
      return filtered;
    });
    if (success) this.persist();
    return success;
  }
}
