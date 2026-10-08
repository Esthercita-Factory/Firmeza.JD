import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '../../core/services/customers.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Customer } from '../../core/models/models';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hud-customers-page">
      
      <!-- Encabezado de la página -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="h1-title m-0">Directorio de Clientes</h2>
          <p class="text-muted small m-0">Padrón de constructoras, contratistas y maestros de obra</p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button class="btn-hud-secondary" (click)="exportExcel()" title="Exportar directorio de clientes a Excel">
            <i class="bi bi-file-earmark-excel text-cyan"></i>
            <span>Exportar Excel</span>
          </button>

          <button class="btn-hud-primary" (click)="openCreateDrawer()">
            <i class="bi bi-person-plus-fill"></i>
            <span>Nuevo Cliente</span>
          </button>
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
                     placeholder="Buscar por razón social, nombre o cédula/NIT..." />
            </div>
          </div>
          <div class="col-12 col-md-6 text-md-end text-muted small">
            <span>Total clientes registrados: <strong class="text-cyan tabular-nums">{{ customersList().length }}</strong></span>
          </div>
        </div>
      </div>

      <!-- Tabla HUD de Clientes (Desktop) / Cards (Móvil) -->
      <div class="hud-panel overflow-hidden">
        
        <!-- Estado Vacío -->
        <div *ngIf="filteredCustomers().length === 0" class="p-5 text-center text-muted">
          <i class="bi bi-people fs-1 mb-2 d-block text-cyan"></i>
          <h5>No se encontraron clientes</h5>
          <p class="small">No existen registros que coincidan con la búsqueda ingresada.</p>
          <button class="btn-hud-primary btn-sm mt-2" (click)="openCreateDrawer()">
            <i class="bi bi-person-plus me-1"></i> Registrar Primer Cliente
          </button>
        </div>

        <!-- Tabla Desktop -->
        <div class="hud-table-wrapper d-none d-md-block" *ngIf="filteredCustomers().length > 0">
          <table class="hud-table">
            <thead>
              <tr>
                <th>Documento / NIT</th>
                <th>Cliente / Razón Social</th>
                <th>Contacto</th>
                <th>Dirección Obra</th>
                <th class="text-end">Total Compras</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filteredCustomers()">
                <td><span class="text-muted tabular-nums fw-medium">{{ c.document }}</span></td>
                <td>
                  <strong class="text-main d-block">{{ c.name }}</strong>
                  <span class="text-muted small" *ngIf="c.age">Edad/Antigüedad: {{ c.age }} años</span>
                </td>
                <td>
                  <div class="d-flex flex-column small">
                    <span class="text-main" *ngIf="c.phone"><i class="bi bi-telephone me-1 text-muted"></i>{{ c.phone }}</span>
                    <span class="text-muted" *ngIf="c.email"><i class="bi bi-envelope me-1 text-muted"></i>{{ c.email }}</span>
                  </div>
                </td>
                <td><span class="text-muted small">{{ c.address || 'Principal Bogotá' }}</span></td>
                <td class="text-end">
                  <span class="price-tag fw-bold text-cyan tabular-nums">
                    $ {{ (c.totalPurchases || 0).toLocaleString('es-CO') }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="d-inline-flex gap-1">
                    <button class="btn-hud-icon btn-sm" (click)="openEditDrawer(c)" title="Editar cliente">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn-hud-icon btn-sm text-danger" (click)="askDelete(c)" title="Eliminar cliente">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tarjetas Móvil -->
        <div class="d-md-none p-3" *ngIf="filteredCustomers().length > 0">
          <div *ngFor="let c of filteredCustomers()" class="hud-panel p-3 mb-2 border">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="text-muted small tabular-nums">{{ c.document }}</span>
              <span class="price-tag small fw-bold text-cyan tabular-nums">$ {{ (c.totalPurchases || 0).toLocaleString('es-CO') }}</span>
            </div>
            <h5 class="m-0 mb-1">{{ c.name }}</h5>
            <div class="text-muted small mb-2">{{ c.phone }} · {{ c.email }}</div>
            <div class="d-flex justify-content-end gap-1 pt-2 border-top">
              <button class="btn-hud-icon btn-sm" (click)="openEditDrawer(c)"><i class="bi bi-pencil"></i></button>
              <button class="btn-hud-icon btn-sm text-danger" (click)="askDelete(c)"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- PANEL LATERAL DESLIZABLE (SLIDE-OVER DRAWER) -->
    <div class="drawer-backdrop" *ngIf="isDrawerOpen()" (click)="closeDrawer()">
      <div class="drawer-panel hud-panel hud-bracket p-4 d-flex flex-column" (click)="$event.stopPropagation()">
        
        <div class="drawer-header d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
          <div>
            <h3 class="m-0 h2-title">{{ editingCustomer() ? 'Editar Cliente' : 'Nuevo Cliente' }}</h3>
            <span class="text-muted small">Datos de facturación y despacho</span>
          </div>
          <button class="btn-hud-icon" (click)="closeDrawer()" aria-label="Cerrar panel">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <form class="drawer-form flex-grow-1 overflow-auto pe-1" (ngSubmit)="saveCustomer()">
          <div class="mb-3">
            <label class="form-label text-muted small fw-bold">Nombre Completo o Razón Social *</label>
            <input type="text" class="form-control" [(ngModel)]="formData.name" name="name" required placeholder="Ej. Constructora El Sol S.A.S" />
          </div>

          <div class="row g-2 mb-3">
            <div class="col-7">
              <label class="form-label text-muted small fw-bold">Cédula o NIT *</label>
              <input type="text" class="form-control tabular-nums" [(ngModel)]="formData.document" name="document" required placeholder="Ej. 900.123.456-7" />
            </div>
            <div class="col-5">
              <label class="form-label text-muted small fw-bold">Edad / Antigüedad</label>
              <input type="number" class="form-control tabular-nums" [(ngModel)]="formData.age" name="age" min="18" placeholder="Años" />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label text-muted small fw-bold">Teléfono de Contacto</label>
            <input type="tel" class="form-control tabular-nums" [(ngModel)]="formData.phone" name="phone" placeholder="+57 310 123 4567" />
          </div>

          <div class="mb-3">
            <label class="form-label text-muted small fw-bold">Correo Electrónico (Facturación Electrónica)</label>
            <input type="email" class="form-control" [(ngModel)]="formData.email" name="email" placeholder="facturacion@empresa.com" />
          </div>

          <div class="mb-4">
            <label class="form-label text-muted small fw-bold">Dirección de Despacho u Oficina</label>
            <input type="text" class="form-control" [(ngModel)]="formData.address" name="address" placeholder="Ej. Carrera 15 # 93-40 Of. 302" />
          </div>

          <div class="drawer-actions pt-3 border-top d-flex gap-2">
            <button type="button" class="btn-hud-secondary flex-grow-1" (click)="closeDrawer()">
              Cancelar
            </button>
            <button type="submit" class="btn-hud-primary flex-grow-1" [disabled]="!formData.name || !formData.document">
              <i class="bi bi-save me-1"></i> Guardar Cliente
            </button>
          </div>
        </form>

      </div>
    </div>

    <!-- MODAL DE CONFIRMACIÓN ANTES DE ELIMINAR -->
    <div class="modal-backdrop-hud" *ngIf="customerToDelete()" (click)="customerToDelete.set(null)">
      <div class="modal-dialog-hud hud-panel p-4" (click)="$event.stopPropagation()">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="modal-icon-danger bg-danger-soft text-danger p-3 rounded-circle">
            <i class="bi bi-person-x-fill fs-3"></i>
          </div>
          <div>
            <h4 class="m-0 text-danger">Eliminar Cliente</h4>
            <p class="text-muted small m-0">Acción destructiva permanente</p>
          </div>
        </div>

        <p class="mb-4">
          ¿Estás seguro de que deseas eliminar al cliente <strong>{{ customerToDelete()?.name }}</strong>?
        </p>

        <div class="d-flex justify-content-end gap-2">
          <button class="btn-hud-secondary" (click)="customerToDelete.set(null)">
            Cancelar
          </button>
          <button class="btn-hud-primary bg-danger border-danger text-white" (click)="confirmDelete()">
            Sí, Eliminar Cliente
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hud-customers-page {
      min-width: 0;
    }

    .drawer-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(4, 8, 16, 0.7);
      backdrop-filter: blur(4px);
      z-index: 2000;
      display: flex;
      justify-content: flex-end;
      animation: fadeIn 0.2s ease;
    }

    .drawer-panel {
      width: 100%;
      max-width: 460px;
      height: 100%;
      border-radius: 0;
      border-left: 1px solid var(--accent-primary);
      border-top: none;
      border-right: none;
      border-bottom: none;
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
      animation: slideDrawer 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideDrawer {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .modal-backdrop-hud {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(4, 8, 16, 0.8);
      z-index: 2100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-dialog-hud {
      width: 100%;
      max-width: 480px;
      border: 1px solid var(--color-danger);
    }

    .bg-danger-soft {
      background-color: var(--color-danger-bg);
    }
  `]
})
export class CustomersComponent {
  private customersService = inject(CustomersService);
  private toastService = inject(ToastService);

  searchQuery = '';
  isDrawerOpen = signal<boolean>(false);
  editingCustomer = signal<Customer | null>(null);
  customerToDelete = signal<Customer | null>(null);

  customersList = computed(() => this.customersService.getAll());

  formData: Partial<Customer> = {
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    age: 35
  };

  filteredCustomers = computed(() => {
    let list = this.customersList();
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.document.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q))
      );
    }
    return list;
  });

  openCreateDrawer() {
    this.editingCustomer.set(null);
    this.formData = {
      name: '',
      document: '',
      phone: '+57 3',
      email: '',
      address: '',
      age: 35
    };
    this.isDrawerOpen.set(true);
  }

  openEditDrawer(c: Customer) {
    this.editingCustomer.set(c);
    this.formData = { ...c };
    this.isDrawerOpen.set(true);
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
    this.editingCustomer.set(null);
  }

  saveCustomer() {
    if (!this.formData.name || !this.formData.document) return;

    if (this.editingCustomer()) {
      this.customersService.update(this.editingCustomer()!.id, this.formData);
      this.toastService.show(`Cliente ${this.formData.name} actualizado`, 'success');
    } else {
      this.customersService.create(this.formData as any);
      this.toastService.show(`Cliente ${this.formData.name} registrado con éxito`, 'success');
    }
    this.closeDrawer();
  }

  askDelete(c: Customer) {
    this.customerToDelete.set(c);
  }

  confirmDelete() {
    const c = this.customerToDelete();
    if (c) {
      this.customersService.delete(c.id);
      this.toastService.show(`Cliente ${c.name} eliminado`, 'warning');
      this.customerToDelete.set(null);
    }
  }

  exportExcel() {
    const token = localStorage.getItem('firmeza-token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('http://localhost:5035/api/export/customers/excel', { headers })
      .then(res => {
        if (!res.ok) throw new Error('Error al descargar reporte de clientes.');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Clientes_Firmeza.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        this.toastService.show('Descarga de clientes iniciada', 'info');
      })
      .catch(err => {
        this.toastService.show(err.message || 'Error en la descarga', 'danger');
      });
  }
}
