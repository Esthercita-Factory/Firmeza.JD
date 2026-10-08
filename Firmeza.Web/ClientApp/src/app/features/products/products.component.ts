import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Product } from '../../core/models/models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hud-products-page">
      
      <!-- Encabezado de la página con buscador, filtros y botones de acción -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="h1-title m-0">Catálogo de Materiales</h2>
          <p class="text-muted small m-0">Inventario central, control de existencias y precios de venta</p>
        </div>

        <div class="d-flex flex-wrap align-items-center gap-2">
          <!-- Carga Masiva Excel EPPlus -->
          <button class="btn-hud-secondary" (click)="openImportModal()" title="Carga masiva de datos desnormalizados con EPPlus">
            <i class="bi bi-file-earmark-spreadsheet-fill text-success"></i>
            <span>Importar Excel</span>
          </button>

          <!-- Exportar Excel -->
          <button class="btn-hud-secondary" (click)="exportExcel()" title="Exportar catálogo a Excel">
            <i class="bi bi-file-earmark-excel text-cyan"></i>
            <span>Excel</span>
          </button>

          <!-- Exportar PDF -->
          <button class="btn-hud-secondary" (click)="exportPdf()" title="Exportar reporte de inventario a PDF">
            <i class="bi bi-file-earmark-pdf text-danger"></i>
            <span>PDF</span>
          </button>

          <button class="btn-hud-primary" (click)="openCreateDrawer()">
            <i class="bi bi-plus-lg"></i>
            <span>Nuevo Material</span>
          </button>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="hud-panel p-3 mb-3">
        <div class="row g-2 align-items-center">
          <!-- Buscador -->
          <div class="col-12 col-md-5">
            <div class="hud-search-box">
              <i class="bi bi-search"></i>
              <input type="text" 
                     class="form-control" 
                     [(ngModel)]="searchQuery" 
                     placeholder="Buscar por nombre, código SKU o categoría..." />
            </div>
          </div>

          <!-- Filtro por Categoría -->
          <div class="col-6 col-md-4">
            <select class="form-select" [(ngModel)]="selectedCategory">
              <option value="Todas">Todas las Categorías</option>
              <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
            </select>
          </div>

          <!-- Filtro por Estado de Stock -->
          <div class="col-6 col-md-3">
            <select class="form-select" [(ngModel)]="selectedStockFilter">
              <option value="Todos">Todos los Stocks</option>
              <option value="Sano">Stock Sano (>20)</option>
              <option value="Medio">Stock Medio (6-20)</option>
              <option value="Critico">Stock Crítico (≤5)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tabla HUD de Productos (Desktop) / Cards (Móvil) -->
      <div class="hud-panel overflow-hidden">
        
        <!-- Estado Vacío -->
        <div *ngIf="paginatedProducts().length === 0" class="p-5 text-center text-muted">
          <i class="bi bi-box-seam fs-1 mb-2 d-block text-cyan"></i>
          <h5>No se encontraron productos</h5>
          <p class="small">No existen registros que coincidan con los criterios de búsqueda.</p>
          <button class="btn-hud-primary btn-sm mt-2" (click)="openCreateDrawer()">
            <i class="bi bi-plus-circle me-1"></i> Registrar Primer Material
          </button>
        </div>

        <!-- Vista de Tabla para Desktop -->
        <div class="hud-table-wrapper d-none d-md-block" *ngIf="paginatedProducts().length > 0">
          <table class="hud-table">
            <thead>
              <tr>
                <th class="cursor-pointer" (click)="toggleSort('sku')">
                  SKU <i class="bi" [ngClass]="getSortIcon('sku')"></i>
                </th>
                <th class="cursor-pointer" (click)="toggleSort('name')">
                  Material <i class="bi" [ngClass]="getSortIcon('name')"></i>
                </th>
                <th>Categoría</th>
                <th class="cursor-pointer" (click)="toggleSort('price')">
                  Precio Unitario <i class="bi" [ngClass]="getSortIcon('price')"></i>
                </th>
                <th class="cursor-pointer" (click)="toggleSort('stock')">
                  Existencias <i class="bi" [ngClass]="getSortIcon('stock')"></i>
                </th>
                <th>Estado</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of paginatedProducts()">
                <td><span class="text-muted tabular-nums">{{ p.sku }}</span></td>
                <td>
                  <strong class="text-main d-block">{{ p.name }}</strong>
                  <span class="text-muted small" *ngIf="p.description">{{ p.description }}</span>
                </td>
                <td><span class="text-muted">{{ p.category }}</span></td>
                <td>
                  <span class="price-tag fw-bold tabular-nums">
                    $ {{ p.price.toLocaleString('es-CO') }}
                  </span>
                </td>
                <td>
                  <span class="tabular-nums fw-medium">
                    {{ p.stock }} {{ p.unit }}
                  </span>
                  <span class="text-muted small ms-1">(Mín: {{ p.minStock }})</span>
                </td>
                <td>
                  <span class="badge-status" [ngClass]="getStockBadgeClass(p)">
                    <span class="badge-status-dot"></span>
                    <span>{{ getStockBadgeText(p) }}</span>
                  </span>
                </td>
                <td class="text-end">
                  <div class="d-inline-flex gap-1">
                    <button class="btn-hud-icon btn-sm" (click)="openEditDrawer(p)" title="Editar material">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn-hud-icon btn-sm text-danger" (click)="askDelete(p)" title="Eliminar material">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Vista de Tarjetas para Móvil según requerimiento del brief -->
        <div class="d-md-none p-3" *ngIf="paginatedProducts().length > 0">
          <div *ngFor="let p of paginatedProducts()" class="hud-panel p-3 mb-2 border">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="text-muted small tabular-nums">{{ p.sku }}</span>
              <span class="badge-status" [ngClass]="getStockBadgeClass(p)">
                <span class="badge-status-dot"></span>
                <span>{{ getStockBadgeText(p) }}</span>
              </span>
            </div>
            <h5 class="m-0 mb-1">{{ p.name }}</h5>
            <div class="text-muted small mb-2">{{ p.category }}</div>
            <div class="d-flex justify-content-between align-items-center pt-2 border-top">
              <span class="price-tag fs-5 fw-bold text-cyan tabular-nums">$ {{ p.price.toLocaleString('es-CO') }}</span>
              <div class="d-flex gap-1">
                <button class="btn-hud-icon btn-sm" (click)="openEditDrawer(p)"><i class="bi bi-pencil"></i></button>
                <button class="btn-hud-icon btn-sm text-danger" (click)="askDelete(p)"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </div>
        </div>

        <!-- Paginación -->
        <div class="p-3 border-top d-flex align-items-center justify-content-between small text-muted">
          <div>
            Mostrando <span class="text-main fw-bold">{{ startIndex() + 1 }}</span> a 
            <span class="text-main fw-bold">{{ endIndex() }}</span> de 
            <span class="text-main fw-bold">{{ filteredList().length }}</span> materiales
          </div>
          <div class="d-flex gap-1">
            <button class="btn-hud-secondary btn-sm" [disabled]="currentPage() === 1" (click)="currentPage.set(currentPage() - 1)">
              <i class="bi bi-chevron-left"></i> Anterior
            </button>
            <button class="btn-hud-secondary btn-sm" [disabled]="endIndex() >= filteredList().length" (click)="currentPage.set(currentPage() + 1)">
              Siguiente <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>

      </div>

    </div>

    <!-- PANEL LATERAL DESLIZABLE (SLIDE-OVER DRAWER) PARA CREAR / EDITAR SIN SALIR DE LA PÁGINA -->
    <div class="drawer-backdrop" *ngIf="isDrawerOpen()" (click)="closeDrawer()">
      <div class="drawer-panel hud-panel hud-bracket p-4 d-flex flex-column" (click)="$event.stopPropagation()">
        
        <div class="drawer-header d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
          <div>
            <h3 class="m-0 h2-title">{{ editingProduct() ? 'Editar Material' : 'Nuevo Material de Obra' }}</h3>
            <span class="text-muted small">Especificaciones técnicas y niveles de inventario</span>
          </div>
          <button class="btn-hud-icon" (click)="closeDrawer()" aria-label="Cerrar panel">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <form class="drawer-form flex-grow-1 overflow-auto pe-1" (ngSubmit)="saveProduct()">
          <div class="mb-3">
            <label class="form-label text-muted small fw-bold">Nombre del Material *</label>
            <input type="text" class="form-control" [(ngModel)]="formData.name" name="name" required placeholder="Ej. Cemento Portland Gris 50kg" />
          </div>

          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label text-muted small fw-bold">Código SKU / Referencia *</label>
              <input type="text" class="form-control" [(ngModel)]="formData.sku" name="sku" required placeholder="Ej. CEM-ARG-50" />
            </div>
            <div class="col-6">
              <label class="form-label text-muted small fw-bold">Unidad de Medida *</label>
              <input type="text" class="form-control" [(ngModel)]="formData.unit" name="unit" required placeholder="Ej. Bulto, m³, Unidad" />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label text-muted small fw-bold">Categoría *</label>
            <select class="form-select" [(ngModel)]="formData.category" name="category" required>
              <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
            </select>
          </div>

          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label text-muted small fw-bold">Precio de Venta ($ COP) *</label>
              <input type="number" class="form-control tabular-nums" [(ngModel)]="formData.price" name="price" required min="100" />
            </div>
            <div class="col-6">
              <label class="form-label text-muted small fw-bold">Stock Inicial *</label>
              <input type="number" class="form-control tabular-nums" [(ngModel)]="formData.stock" name="stock" required min="0" />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label text-muted small fw-bold">Stock Mínimo de Alerta *</label>
            <input type="number" class="form-control tabular-nums" [(ngModel)]="formData.minStock" name="minStock" required min="1" />
            <span class="text-muted text-tag">Cuando el inventario caiga a este número o menos, el HUD mostrará alerta roja.</span>
          </div>

          <div class="mb-4">
            <label class="form-label text-muted small fw-bold">Descripción Técnica</label>
            <textarea class="form-control" rows="3" [(ngModel)]="formData.description" name="description" placeholder="Usos recomendados, resistencia o normas técnicas..."></textarea>
          </div>

          <div class="drawer-actions pt-3 border-top d-flex gap-2">
            <button type="button" class="btn-hud-secondary flex-grow-1" (click)="closeDrawer()">
              Cancelar
            </button>
            <button type="submit" class="btn-hud-primary flex-grow-1" [disabled]="!formData.name || !formData.price">
              <i class="bi bi-save me-1"></i> Guardar Material
            </button>
          </div>
        </form>

      </div>
    </div>

    <!-- MODAL DE CONFIRMACIÓN ANTES DE ELIMINAR (Principio UX del brief) -->
    <div class="modal-backdrop-hud" *ngIf="productToDelete()" (click)="productToDelete.set(null)">
      <div class="modal-dialog-hud hud-panel p-4" (click)="$event.stopPropagation()">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="modal-icon-danger bg-danger-soft text-danger p-3 rounded-circle">
            <i class="bi bi-exclamation-triangle-fill fs-3"></i>
          </div>
          <div>
            <h4 class="m-0 text-danger">Confirmar Eliminación</h4>
            <p class="text-muted small m-0">Acción destructiva permanente</p>
          </div>
        </div>

        <p class="mb-4">
          ¿Estás seguro de que deseas eliminar <strong>{{ productToDelete()?.name }}</strong> del inventario? 
          Esta acción no se puede deshacer y retirará el producto del catálogo de ventas.
        </p>

        <div class="d-flex justify-content-end gap-2">
          <button class="btn-hud-secondary" (click)="productToDelete.set(null)">
            Cancelar
          </button>
          <button class="btn-hud-primary bg-danger border-danger text-white" (click)="confirmDelete()">
            Sí, Eliminar Material
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DE CARGA MASIVA EXCEL CON EPPLUS -->
    <div class="modal-backdrop-hud" *ngIf="showImportModal()" (click)="closeImportModal()">
      <div class="modal-dialog-hud hud-panel p-4" style="max-width: 620px;" (click)="$event.stopPropagation()">
        
        <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
          <div class="d-flex align-items-center gap-2">
            <div class="modal-icon-success bg-cyan-soft text-cyan p-2 rounded">
              <i class="bi bi-file-earmark-spreadsheet-fill fs-4"></i>
            </div>
            <div>
              <h4 class="m-0 text-main">Carga Masiva de Datos (Excel EPPlus)</h4>
              <p class="text-muted small m-0">Normalización automática de datos desorganizados en memoria</p>
            </div>
          </div>
          <button class="btn-hud-icon btn-sm" (click)="closeImportModal()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="alert-info-box p-3 mb-3 rounded border">
          <div class="d-flex align-items-start gap-2">
            <i class="bi bi-info-circle-fill text-cyan mt-1"></i>
            <div class="small">
              <strong>Soporta datos desnormalizados:</strong> Sube archivos <code>.xlsx</code> con columnas mezcladas de clientes, productos y ventas. El motor dividirá y relacionará automáticamente la información en PostgreSQL.
            </div>
          </div>
          <div class="mt-2 text-end">
            <button class="btn-hud-secondary btn-sm" (click)="downloadTemplate()">
              <i class="bi bi-download me-1"></i> Descargar Plantilla Modelo (.xlsx)
            </button>
          </div>
        </div>

        <!-- Selector de archivo -->
        <div class="mb-3">
          <label class="form-label text-muted small fw-bold">Seleccionar archivo Excel (.xlsx)</label>
          <input type="file" 
                 class="form-control" 
                 accept=".xlsx,.xls" 
                 (change)="onFileSelected($event)" />
        </div>

        <!-- Indicador de carga -->
        <div *ngIf="isImporting()" class="text-center py-4 text-cyan">
          <div class="spinner-border mb-2" role="status"></div>
          <div>Normalizando columnas e importando a base de datos...</div>
        </div>

        <!-- Resultado del procesamiento -->
        <div *ngIf="importResult()" class="import-results-box p-3 rounded mb-3 border">
          <div class="d-flex align-items-center gap-2 mb-2">
            <i class="bi" [ngClass]="importResult()?.success ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-warning'"></i>
            <strong [class.text-success]="importResult()?.success" [class.text-warning]="!importResult()?.success">
              {{ importResult()?.message }}
            </strong>
          </div>

          <!-- Métricas -->
          <div class="row g-2 text-center my-2">
            <div class="col-3">
              <div class="p-2 border rounded bg-base">
                <div class="small text-muted">Filas</div>
                <div class="fw-bold tabular-nums text-cyan">{{ importResult()?.totalRows }}</div>
              </div>
            </div>
            <div class="col-3">
              <div class="p-2 border rounded bg-base">
                <div class="small text-muted">Productos</div>
                <div class="fw-bold tabular-nums text-success">+{{ importResult()?.productsImported }}</div>
              </div>
            </div>
            <div class="col-3">
              <div class="p-2 border rounded bg-base">
                <div class="small text-muted">Clientes</div>
                <div class="fw-bold tabular-nums text-success">+{{ importResult()?.customersImported }}</div>
              </div>
            </div>
            <div class="col-3">
              <div class="p-2 border rounded bg-base">
                <div class="small text-muted">Ventas</div>
                <div class="fw-bold tabular-nums text-cyan">{{ importResult()?.salesImported }}</div>
              </div>
            </div>
          </div>

          <!-- Lista de Advertencias / Errores -->
          <div *ngIf="importResult()?.warnings?.length > 0" class="mt-2">
            <span class="badge bg-warning text-dark mb-1">Advertencias ({{ importResult()?.warnings?.length }}):</span>
            <ul class="small text-muted ps-3 m-0" style="max-height: 80px; overflow-y: auto;">
              <li *ngFor="let w of importResult()?.warnings">{{ w }}</li>
            </ul>
          </div>

          <div *ngIf="importResult()?.errors?.length > 0" class="mt-2">
            <span class="badge bg-danger text-white mb-1">Inconsistencias Detectadas ({{ importResult()?.errors?.length }}):</span>
            <ul class="small text-danger ps-3 m-0" style="max-height: 80px; overflow-y: auto;">
              <li *ngFor="let e of importResult()?.errors">{{ e }}</li>
            </ul>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 pt-2 border-top">
          <button class="btn-hud-secondary" (click)="closeImportModal()">
            Cerrar
          </button>
          <button class="btn-hud-primary" 
                  [disabled]="!selectedFile || isImporting()"
                  (click)="processImport()">
            <i class="bi bi-cloud-arrow-up-fill me-1"></i> Procesar e Importar
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .hud-products-page {
      min-width: 0;
    }

    /* Drawer Lateral Deslizable */
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

    /* Modal Destructivo */
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
export class ProductsComponent {
  private productsService = inject(ProductsService);
  private toastService = inject(ToastService);

  searchQuery = '';
  selectedCategory = 'Todas';
  selectedStockFilter = 'Todos';
  currentPage = signal<number>(1);
  pageSize = 7;

  sortColumn = signal<keyof Product>('id');
  sortAsc = signal<boolean>(true);

  isDrawerOpen = signal<boolean>(false);
  editingProduct = signal<Product | null>(null);
  productToDelete = signal<Product | null>(null);

  categories: string[] = [
    'Cementos & Mezclas',
    'Acero & Hierro',
    'Ladrillos & Bloques',
    'Áridos & Agregados',
    'Pinturas & Acabados',
    'Herramientas',
    'Tuberías & PVC'
  ];

  formData: Partial<Product> = {
    name: '',
    sku: '',
    category: 'Cementos & Mezclas',
    unit: 'Unidad',
    price: 0,
    stock: 0,
    minStock: 10,
    description: ''
  };

  filteredList = computed(() => {
    let list = this.productsService.getAll();
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (this.selectedCategory !== 'Todas') {
      list = list.filter(p => p.category === this.selectedCategory);
    }
    if (this.selectedStockFilter === 'Sano') {
      list = list.filter(p => p.stock > p.minStock * 2);
    } else if (this.selectedStockFilter === 'Medio') {
      list = list.filter(p => p.stock <= p.minStock * 2 && p.stock > p.minStock);
    } else if (this.selectedStockFilter === 'Critico') {
      list = list.filter(p => p.stock <= p.minStock);
    }

    const col = this.sortColumn();
    const asc = this.sortAsc();
    return [...list].sort((a, b) => {
      const valA = a[col] ?? '';
      const valB = b[col] ?? '';
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
  });

  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize);
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize, this.filteredList().length));

  paginatedProducts = computed(() => {
    return this.filteredList().slice(this.startIndex(), this.endIndex());
  });

  toggleSort(col: keyof Product) {
    if (this.sortColumn() === col) {
      this.sortAsc.set(!this.sortAsc());
    } else {
      this.sortColumn.set(col);
      this.sortAsc.set(true);
    }
  }

  getSortIcon(col: keyof Product): string {
    if (this.sortColumn() !== col) return 'bi-arrow-down-up opacity-25';
    return this.sortAsc() ? 'bi-sort-up text-cyan' : 'bi-sort-down text-cyan';
  }

  getStockBadgeClass(p: Product): string {
    if (p.stock <= p.minStock) return 'status-danger';
    if (p.stock <= p.minStock * 2) return 'status-warning';
    return 'status-success';
  }

  getStockBadgeText(p: Product): string {
    if (p.stock <= p.minStock) return 'Stock Crítico';
    if (p.stock <= p.minStock * 2) return 'Stock Medio';
    return 'Stock Sano';
  }

  openCreateDrawer() {
    this.editingProduct.set(null);
    this.formData = {
      name: '',
      sku: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Cementos & Mezclas',
      unit: 'Unidad',
      price: 25000,
      stock: 50,
      minStock: 10,
      description: ''
    };
    this.isDrawerOpen.set(true);
  }

  openEditDrawer(p: Product) {
    this.editingProduct.set(p);
    this.formData = { ...p };
    this.isDrawerOpen.set(true);
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
    this.editingProduct.set(null);
  }

  saveProduct() {
    if (!this.formData.name || !this.formData.price) return;

    if (this.editingProduct()) {
      this.productsService.update(this.editingProduct()!.id, this.formData);
      this.toastService.show(`Material ${this.formData.name} actualizado con éxito`, 'success');
    } else {
      this.productsService.create(this.formData as any);
      this.toastService.show(`Material ${this.formData.name} registrado en inventario`, 'success');
    }
    this.closeDrawer();
  }

  askDelete(p: Product) {
    this.productToDelete.set(p);
  }

  confirmDelete() {
    const p = this.productToDelete();
    if (p) {
      this.productsService.delete(p.id);
      this.toastService.show(`Material ${p.name} eliminado del inventario`, 'warning');
      this.productToDelete.set(null);
    }
  }

  // --- CARGA MASIVA EXCEL (EPPlus) & EXPORTACIONES ---
  showImportModal = signal<boolean>(false);
  selectedFile: File | null = null;
  isImporting = signal<boolean>(false);
  importResult = signal<any | null>(null);

  openImportModal() {
    this.showImportModal.set(true);
    this.selectedFile = null;
    this.importResult.set(null);
  }

  closeImportModal() {
    this.showImportModal.set(false);
    if (this.importResult()) {
      this.productsService.refreshFromApi();
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      this.importResult.set(null);
    }
  }

  downloadTemplate() {
    this.downloadFile('/api/import/template', 'Plantilla_Carga_Masiva_Firmeza.xlsx');
  }

  processImport() {
    if (!this.selectedFile) return;

    this.isImporting.set(true);
    this.importResult.set(null);

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    const token = localStorage.getItem('firmeza-token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('http://localhost:5035/api/import/excel', {
      method: 'POST',
      headers,
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        this.isImporting.set(false);
        this.importResult.set(data);
        if (data.success || data.productsImported > 0) {
          this.toastService.show('Importación completada con éxito', 'success');
          this.productsService.refreshFromApi();
        } else {
          this.toastService.show('Finalizado con observaciones/errores', 'warning');
        }
      })
      .catch(err => {
        this.isImporting.set(false);
        this.toastService.show(err.message || 'Error al procesar archivo', 'danger');
      });
  }

  exportExcel() {
    this.downloadFile('/api/export/products/excel', 'Productos_Firmeza.xlsx');
  }

  exportPdf() {
    this.downloadFile('/api/export/products/pdf', 'Reporte_Inventario_Firmeza.pdf');
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
        this.toastService.show(`Descarga iniciada: ${filename}`, 'info');
      })
      .catch(err => {
        this.toastService.show(err.message || 'Error en la descarga', 'danger');
      });
  }
}
