import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="hud-home-landing">

      <!-- HEADER DE LA LANDING (ARRIBA A LA DERECHA ESTÁ PARA REGISTRARSE) -->
      <header class="landing-header sticky-top px-3 px-lg-5 py-3 d-flex align-items-center justify-content-between border-bottom">
        
        <!-- Logo Corporativo -->
        <a routerLink="/home" class="d-flex align-items-center gap-2 text-decoration-none">
          <div class="brand-logo-box d-flex align-items-center justify-content-center">
            <i class="bi bi-layers-half text-cyan fs-4"></i>
          </div>
          <div>
            <span class="firmeza-logo-brand text-main fs-4 fw-bold">FIRMEZA</span>
            <span class="d-block brand-sub-label text-muted">MATERIALES & CONSTRUCCIÓN</span>
          </div>
        </a>

        <!-- Enlaces Informativos -->
        <nav class="d-none d-md-flex align-items-center gap-4">
          <a routerLink="/tienda" class="nav-link-landing text-decoration-none">
            <i class="bi bi-shop me-1 text-cyan"></i> Catálogo Tienda
          </a>
          <span class="text-muted small">·</span>
          <span class="text-muted small font-monospace">
            <i class="bi bi-telephone me-1 text-cyan"></i> PBX: (+57) 601 555-0199
          </span>
        </nav>

        <!-- ACCIONES ARRIBA A LA DERECHA: INICIAR SESIÓN Y REGISTRARSE -->
        <div class="d-flex align-items-center gap-2 gap-sm-3">
          <a routerLink="/login" class="btn-landing-login text-decoration-none">
            <i class="bi bi-box-arrow-in-right me-1"></i> Iniciar Sesión
          </a>
          <a routerLink="/login" [queryParams]="{ tab: 'register' }" class="btn-landing-register text-decoration-none">
            <i class="bi bi-person-plus-fill me-1"></i> Registrarse
          </a>
        </div>

      </header>

      <!-- CUERPO DE LA LANDING PAGE -->
      <main class="container-fluid px-3 px-lg-5 py-4">

        <!-- HERO BANNER HUD -->
        <div class="hud-hero-card hud-panel hud-bracket p-4 p-lg-5 mb-4 position-relative overflow-hidden">
          <div class="hero-bg-grid"></div>
          <div class="hero-glow-orb"></div>

          <div class="position-relative z-1">
            <div class="d-inline-flex align-items-center gap-2 mb-3 px-3 py-1 hud-badge-tech">
              <span class="live-dot-cyan"></span>
              <span class="tech-label">SISTEMA ERP & SUMINISTRO INDUSTRIAL DE MATERIALES</span>
            </div>

            <h1 class="hero-title display-5 fw-bold text-main mb-3">
              FIRMEZA <span class="text-cyan">MATERIALES</span>
            </h1>

            <p class="hero-subtitle text-muted lead mb-4" style="max-width: 680px;">
              Plataforma centralizada de distribución para obras civiles, constructoras y maestros. 
              Suministro garantizado de cemento, acero figurado, mampostería y áridos con facturación digital 
              y despacho en sitio en menos de 24 horas.
            </p>

            <div class="d-flex flex-wrap gap-3">
              <a routerLink="/tienda" class="btn-hud-primary px-4 py-3 d-inline-flex align-items-center gap-2 text-decoration-none">
                <i class="bi bi-shop fs-5"></i>
                <span class="fw-bold">EXPLORAR CATÁLOGO DE MATERIALES</span>
              </a>

              <a routerLink="/login" [queryParams]="{ tab: 'register' }" class="btn-hud-secondary px-4 py-3 d-inline-flex align-items-center gap-2 text-decoration-none border-cyan">
                <i class="bi bi-person-plus-fill fs-5 text-cyan"></i>
                <span>REGISTRARSE COMO CLIENTE</span>
              </a>
            </div>
          </div>
        </div>

        <!-- TELEMETRÍA Y MÉTRICAS OPERATIVAS -->
        <div class="row g-3 mb-4">
          <div class="col-12 col-sm-6 col-lg-3">
            <div class="hud-panel p-3 h-100 border-kpi">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="kpi-tag text-muted small">DISPONIBILIDAD STOCK</span>
                <i class="bi bi-shield-check text-cyan fs-5"></i>
              </div>
              <div class="kpi-value display-6 fw-bold text-cyan tabular-nums">99.8%</div>
              <div class="kpi-desc text-muted small mt-1">Bodega principal abastecida</div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <div class="hud-panel p-3 h-100 border-kpi">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="kpi-tag text-muted small">DESPACHO EN OBRA</span>
                <i class="bi bi-truck text-cyan fs-5"></i>
              </div>
              <div class="kpi-value display-6 fw-bold text-main tabular-nums">&lt; 24h</div>
              <div class="kpi-desc text-muted small mt-1">Flota logística metropolitana</div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <div class="hud-panel p-3 h-100 border-kpi">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="kpi-tag text-muted small">NORMATIVA TÉCNICA</span>
                <i class="bi bi-award text-cyan fs-5"></i>
              </div>
              <div class="kpi-value display-6 fw-bold text-cyan tabular-nums">NTC</div>
              <div class="kpi-desc text-muted small mt-1">Certificación NSR-10 / ICONTEC</div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <div class="hud-panel p-3 h-100 border-kpi">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="kpi-tag text-muted small">COMPROBANTES DIGITALES</span>
                <i class="bi bi-envelope-check text-cyan fs-5"></i>
              </div>
              <div class="kpi-value display-6 fw-bold text-main tabular-nums">PDF + Email</div>
              <div class="kpi-desc text-muted small mt-1">Envío inmediato vía SMTP Gmail</div>
            </div>
          </div>
        </div>

        <!-- LÍNEAS DE MATERIALES DESTACADAS -->
        <div class="hud-panel p-4 mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <div>
              <h4 class="m-0 text-main fw-bold">LÍNEAS DE SUMINISTRO PRINCIPALES</h4>
              <span class="text-muted small">Materiales con precio regulado e inventario garantizado</span>
            </div>
            <a routerLink="/tienda" class="btn-hud-secondary btn-sm text-decoration-none">
              Ver Todo el Catálogo <i class="bi bi-arrow-right ms-1"></i>
            </a>
          </div>

          <div class="row g-3">
            <div class="col-12 col-md-6 col-lg-3">
              <div class="category-card p-3 rounded h-100 border">
                <div class="category-icon mb-2 text-cyan fs-2">
                  <i class="bi bi-box-seam"></i>
                </div>
                <h5 class="text-main fw-bold mb-1">Cemento & Conglomerantes</h5>
                <p class="text-muted small mb-3">Cemento Gris Argos Tipo 1 (50kg), aditivos y mezclas listas para fundición estructural.</p>
                <a routerLink="/tienda" class="category-link text-cyan small fw-bold text-decoration-none">
                  Cotizar cemento <i class="bi bi-chevron-right"></i>
                </a>
              </div>
            </div>

            <div class="col-12 col-md-6 col-lg-3">
              <div class="category-card p-3 rounded h-100 border">
                <div class="category-icon mb-2 text-cyan fs-2">
                  <i class="bi bi-bezier2"></i>
                </div>
                <h5 class="text-main fw-bold mb-1">Acero & Varilla Corrugada</h5>
                <p class="text-muted small mb-3">Varilla W60 1/2" x 6m, mallas electrosoldadas y alambre negro para amarre estructural.</p>
                <a routerLink="/tienda" class="category-link text-cyan small fw-bold text-decoration-none">
                  Cotizar acero <i class="bi bi-chevron-right"></i>
                </a>
              </div>
            </div>

            <div class="col-12 col-md-6 col-lg-3">
              <div class="category-card p-3 rounded h-100 border">
                <div class="category-icon mb-2 text-cyan fs-2">
                  <i class="bi bi-bricks"></i>
                </div>
                <h5 class="text-main fw-bold mb-1">Mampostería & Ladrillos</h5>
                <p class="text-muted small mb-3">Ladrillo Farol Limpio 10x20x30, bloques estructurales y tolete común de alta resistencia.</p>
                <a routerLink="/tienda" class="category-link text-cyan small fw-bold text-decoration-none">
                  Cotizar mampostería <i class="bi bi-chevron-right"></i>
                </a>
              </div>
            </div>

            <div class="col-12 col-md-6 col-lg-3">
              <div class="category-card p-3 rounded h-100 border">
                <div class="category-icon mb-2 text-cyan fs-2">
                  <i class="bi bi-layers-half"></i>
                </div>
                <h5 class="text-main fw-bold mb-1">Áridos & Agregados (M³)</h5>
                <p class="text-muted small mb-3">Arena de río lavada, grava triturada 1/2" y base granular para placa y afirmado.</p>
                <a routerLink="/tienda" class="category-link text-cyan small fw-bold text-decoration-none">
                  Cotizar áridos <i class="bi bi-chevron-right"></i>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER BANNER HUD -->
        <div class="hud-panel p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div>
            <div class="fw-bold text-main fs-5">¿Requieres un pedido especial para tu proyecto u obra?</div>
            <div class="text-muted small">Regístrate como cliente para acceder a tarifas preferenciales y facturación digital.</div>
          </div>
          <div class="d-flex gap-2">
            <a routerLink="/login" [queryParams]="{ tab: 'register' }" class="btn-hud-primary px-4 py-2 text-decoration-none">
              <i class="bi bi-person-plus me-1"></i> Registrarse Ahora
            </a>
          </div>
        </div>

      </main>

      <!-- FOOTER CORPORATIVO -->
      <footer class="landing-footer py-4 px-3 px-lg-5 border-top mt-5">
        <div class="container-fluid p-0 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div class="d-flex align-items-center gap-2">
            <span class="live-dot-cyan"></span>
            <span class="text-muted small">
              <strong>FIRMEZA S.A.S.</strong> · NIT: 900.543.210-9 · Régimen Común · Bodega Central Industrial #45-12
            </span>
          </div>
          <div class="text-muted small">
            PBX: (+57) 601 555-0199 · soporte&#64;firmeza.com · Despacho y Logística en Obra
          </div>
        </div>
      </footer>

    </div>
  `,
  styles: [`
    .hud-home-landing {
      min-height: 100vh;
      background-color: var(--bg-base);
      color: var(--text-main);
    }

    .landing-header {
      background-color: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      z-index: 1020;
    }

    .brand-logo-box {
      width: 42px;
      height: 42px;
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
      border: 1px solid var(--accent-primary);
      box-shadow: 0 0 12px rgba(34, 211, 238, 0.25);
    }

    .brand-sub-label {
      font-size: 9.5px;
      letter-spacing: 0.1em;
      font-weight: 600;
    }

    .nav-link-landing {
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.9rem;
      transition: color 0.2s;
    }

    .nav-link-landing:hover {
      color: var(--accent-primary);
    }

    .btn-landing-login {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 7px 16px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-landing-login:hover {
      border-color: var(--accent-primary);
      color: var(--accent-primary);
    }

    .btn-landing-register {
      background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
      color: #040810;
      border: 1px solid var(--accent-primary);
      padding: 7px 18px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 700;
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.35);
      transition: all 0.2s;
    }

    .btn-landing-register:hover {
      background: #22d3ee;
      transform: translateY(-1px);
      box-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
    }

    .hud-hero-card {
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%);
      border: 1px solid var(--accent-primary);
      box-shadow: 0 0 30px rgba(34, 211, 238, 0.15);
    }

    .hero-bg-grid {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-size: 24px 24px;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      pointer-events: none;
    }

    .hero-glow-orb {
      position: absolute;
      top: -50px;
      right: -50px;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(34, 211, 238, 0.18) 0%, transparent 70%);
      pointer-events: none;
    }

    .hud-badge-tech {
      background: rgba(34, 211, 238, 0.1);
      border: 1px solid rgba(34, 211, 238, 0.3);
      border-radius: 4px;
    }

    .live-dot-cyan {
      width: 8px;
      height: 8px;
      background-color: var(--accent-primary);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--accent-primary);
    }

    .tech-label {
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      color: var(--accent-primary);
      font-weight: 700;
    }

    .hero-title {
      font-family: var(--font-metrics);
      letter-spacing: -0.02em;
    }

    .text-cyan {
      color: var(--accent-primary);
    }

    .border-kpi {
      border: 1px solid var(--border-color);
      transition: border-color 0.2s, transform 0.2s;
    }

    .border-kpi:hover {
      border-color: var(--accent-primary);
      transform: translateY(-2px);
    }

    .category-card {
      background: var(--bg-panel);
      border-color: var(--border-color) !important;
      transition: all 0.2s;
    }

    .category-card:hover {
      border-color: var(--accent-primary) !important;
      background: rgba(34, 211, 238, 0.04);
      transform: translateY(-2px);
    }

    .landing-footer {
      background-color: rgba(15, 23, 42, 0.6);
      border-color: var(--border-color) !important;
    }
  `]
})
export class HomeComponent {
  public authService = inject(AuthService);
  public cartService = inject(CartService);
}
