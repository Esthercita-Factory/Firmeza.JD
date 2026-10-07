import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="hud-text m-0">Dashboard</h3>
        <p class="text-muted small m-0">Resumen de la actividad del negocio</p>
      </div>
      <button class="btn btn-primary hud-active rounded-pill px-4">
        <i class="bi bi-file-earmark-bar-graph me-2"></i> Reporte
      </button>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-12 col-md-4">
        <div class="card h-100 border-0">
          <div class="card-body p-4 d-flex align-items-center">
            <div class="rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 48px; height: 48px; background-color: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success);">
              <i class="bi bi-currency-dollar fs-4"></i>
            </div>
            <div>
              <p class="text-muted small mb-1 text-uppercase fw-bold">Ventas del Día</p>
              <h4 class="hud-text m-0">$45,230.00</h4>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-12 col-md-4">
        <div class="card h-100 border-0">
          <div class="card-body p-4 d-flex align-items-center">
            <div class="rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 48px; height: 48px; background-color: color-mix(in srgb, var(--accent-primary) 15%, transparent); color: var(--accent-primary);">
              <i class="bi bi-people fs-4"></i>
            </div>
            <div>
              <p class="text-muted small mb-1 text-uppercase fw-bold">Nuevos Clientes</p>
              <h4 class="hud-text m-0">12</h4>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-12 col-md-4">
        <div class="card h-100 border-0">
          <div class="card-body p-4 d-flex align-items-center">
            <div class="rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 48px; height: 48px; background-color: color-mix(in srgb, var(--color-danger) 15%, transparent); color: var(--color-danger);">
              <i class="bi bi-box-seam fs-4"></i>
            </div>
            <div>
              <p class="text-muted small mb-1 text-uppercase fw-bold">Stock Bajo</p>
              <h4 class="hud-text m-0">5 <span class="text-danger small fs-6 ms-1"><i class="bi bi-arrow-down-right"></i></span></h4>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card border-0 p-4" style="height: 300px;">
      <div class="d-flex align-items-center justify-content-center h-100 text-muted">
        <div class="text-center">
          <i class="bi bi-bar-chart-line fs-1 mb-2 opacity-50"></i>
          <p>Gráfico de ventas aquí</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .card:hover {
      transform: translateY(-2px);
    }
    body.theme-dark .card:hover {
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      border-color: var(--accent-primary);
    }
  `]
})
export class DashboardComponent {}
