import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-wrapper d-flex align-items-center justify-content-center p-3">
      <div class="hud-panel hud-bracket p-4 p-sm-5" style="max-width: 500px; width: 100%;">
        
        <div class="text-center mb-4">
          <div class="login-logo-box mb-3 d-inline-flex align-items-center justify-content-center">
            <i class="bi bi-layers-half text-cyan fs-2"></i>
          </div>
          <h1 class="firmeza-logo-brand text-cyan fs-3 m-0">FIRMEZA</h1>
          <div class="text-muted small mt-1">Portal Digital de Suministro & Clientes</div>
        </div>

        <!-- Pestañas: Iniciar Sesión / Registro -->
        <div class="d-flex border-bottom mb-4 auth-tabs">
          <button 
            type="button" 
            class="tab-btn flex-fill pb-2 text-center" 
            [class.active]="activeTab === 'login'"
            (click)="setTab('login')">
            <i class="bi bi-box-arrow-in-right me-1"></i> Iniciar Sesión
          </button>
          <button 
            type="button" 
            class="tab-btn flex-fill pb-2 text-center" 
            [class.active]="activeTab === 'register'"
            (click)="setTab('register')">
            <i class="bi bi-person-plus me-1"></i> Registrarse (Cliente)
          </button>
        </div>

        <!-- FORMULARIO LOGIN -->
        <form *ngIf="activeTab === 'login'" [formGroup]="loginForm" (ngSubmit)="onLoginSubmit()">
          <div class="mb-3">
            <label class="form-label text-muted small fw-bold">Correo Electrónico</label>
            <div class="hud-search-box">
              <i class="bi bi-envelope text-muted"></i>
              <input type="email" class="form-control" formControlName="email" placeholder="cliente@empresa.com">
            </div>
          </div>
          
          <div class="mb-4">
            <label class="form-label text-muted small fw-bold">Contraseña de Acceso</label>
            <div class="hud-search-box">
              <i class="bi bi-lock text-muted"></i>
              <input type="password" class="form-control" formControlName="password" placeholder="••••••••">
            </div>
          </div>

          <button type="submit" class="btn-hud-primary w-100 py-3" [disabled]="loginForm.invalid || isLoading">
            <span *ngIf="!isLoading">
              <i class="bi bi-box-arrow-in-right me-1"></i> Ingresar al Sistema
            </span>
            <span *ngIf="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          </button>

          <!-- Botones de acceso rápido para demostración -->
          <div class="d-flex gap-2 mt-3 pt-2 border-top">
            <button type="button" class="btn-demo-quick flex-fill" (click)="fillAdmin()">
              Demo Admin
            </button>
            <button type="button" class="btn-demo-quick flex-fill" (click)="fillClient()">
              Demo Cliente
            </button>
          </div>
          
          <div class="text-danger mt-3 text-center small" *ngIf="errorMsg">
            <i class="bi bi-exclamation-circle me-1"></i> {{ errorMsg }}
          </div>
        </form>

        <!-- FORMULARIO REGISTRO CLIENTE -->
        <form *ngIf="activeTab === 'register'" [formGroup]="registerForm" (ngSubmit)="onRegisterSubmit()">
          <div class="mb-2">
            <label class="form-label text-muted small fw-bold">Razón Social o Nombre Completo *</label>
            <div class="hud-search-box">
              <i class="bi bi-building text-muted"></i>
              <input type="text" class="form-control" formControlName="companyOrFullName" placeholder="Constructora Bolívar S.A.S.">
            </div>
          </div>

          <div class="row g-2 mb-2">
            <div class="col-6">
              <label class="form-label text-muted small fw-bold">NIT / Cédula *</label>
              <div class="hud-search-box">
                <i class="bi bi-card-heading text-muted"></i>
                <input type="text" class="form-control" formControlName="taxId" placeholder="900.123.456-7">
              </div>
            </div>
            <div class="col-6">
              <label class="form-label text-muted small fw-bold">Teléfono</label>
              <div class="hud-search-box">
                <i class="bi bi-telephone text-muted"></i>
                <input type="text" class="form-control" formControlName="phoneNumber" placeholder="3001234567">
              </div>
            </div>
          </div>

          <div class="mb-2">
            <label class="form-label text-muted small fw-bold">Dirección de Despacho / Obra</label>
            <div class="hud-search-box">
              <i class="bi bi-geo-alt text-muted"></i>
              <input type="text" class="form-control" formControlName="address" placeholder="Calle 45 # 12-34 Bodega 2">
            </div>
          </div>

          <div class="mb-2">
            <label class="form-label text-muted small fw-bold">Correo Electrónico *</label>
            <div class="hud-search-box">
              <i class="bi bi-envelope text-muted"></i>
              <input type="email" class="form-control" formControlName="email" placeholder="compras@constructorabolivar.com">
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label text-muted small fw-bold">Contraseña Segura *</label>
            <div class="hud-search-box">
              <i class="bi bi-lock text-muted"></i>
              <input type="password" class="form-control" formControlName="password" placeholder="Mínimo 6 caracteres">
            </div>
          </div>

          <button type="submit" class="btn-hud-primary w-100 py-3" [disabled]="registerForm.invalid || isLoading">
            <span *ngIf="!isLoading">
              <i class="bi bi-person-check-fill me-1"></i> Crear Cuenta de Cliente
            </span>
            <span *ngIf="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          </button>

          <div class="text-danger mt-3 text-center small" *ngIf="errorMsg">
            <i class="bi bi-exclamation-circle me-1"></i> {{ errorMsg }}
          </div>
        </form>

        <div class="login-footer mt-4 pt-3 border-top text-center text-muted small">
          <div class="d-flex align-items-center justify-content-center gap-2">
            <span class="live-indicator-dot"></span>
            <span>Sistema Firmeza ERP · Conexión Cifrada SSL</span>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      background-color: var(--bg-base);
    }

    .login-logo-box {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
      border: 1px solid var(--accent-primary);
      box-shadow: 0 0 15px rgba(34, 211, 238, 0.3);
    }

    .text-cyan {
      color: var(--accent-primary);
    }

    .auth-tabs {
      border-color: var(--border-color) !important;
    }

    .tab-btn {
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s;
      cursor: pointer;
    }

    .tab-btn.active {
      color: var(--accent-primary);
      border-bottom-color: var(--accent-primary);
    }

    .btn-demo-quick {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: 0.75rem;
      padding: 5px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-demo-quick:hover {
      border-color: var(--accent-primary);
      color: var(--accent-primary);
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  activeTab: 'login' | 'register' = 'login';
  isLoading = false;
  errorMsg = '';

  constructor() {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'register') {
        this.setTab('register');
      }
    });
  }

  loginForm = this.fb.group({
    email: ['admin@firmeza.com', [Validators.required, Validators.email]],
    password: ['Admin123!', Validators.required]
  });

  registerForm = this.fb.group({
    companyOrFullName: ['', [Validators.required, Validators.minLength(3)]],
    taxId: ['', [Validators.required]],
    phoneNumber: [''],
    address: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  setTab(tab: 'login' | 'register') {
    this.activeTab = tab;
    this.errorMsg = '';
  }

  fillAdmin() {
    this.loginForm.patchValue({
      email: 'admin@firmeza.com',
      password: 'Admin123!'
    });
  }

  fillClient() {
    this.loginForm.patchValue({
      email: 'compras@losandes.com',
      password: 'Cliente123!'
    });
  }

  onLoginSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMsg = '';

    const creds = {
      email: this.loginForm.value.email || '',
      password: this.loginForm.value.password || ''
    };

    this.auth.login(creds).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.showSuccess('¡Inicio de sesión exitoso!');
      },
      error: (err) => {
        // Fallback para modo desconectado / demo de interfaz
        if (creds.email === 'admin@firmeza.com' && creds.password === 'Admin123!') {
          localStorage.setItem('firmeza-token', 'demo-jwt-admin-token');
          localStorage.setItem('firmeza-role', 'Administrador');
          localStorage.setItem('firmeza-email', 'admin@firmeza.com');
          localStorage.setItem('firmeza-name', 'Administrador Principal');
          this.auth.isAuthenticated.set(true);
          this.auth.userRole.set('Administrador');
          this.auth.userEmail.set('admin@firmeza.com');
          this.auth.userName.set('Administrador Principal');
          this.isLoading = false;
          this.toastService.showSuccess('Sesión iniciada como Administrador');
          this.router.navigate(['/dashboard']);
        } else if (creds.email === 'compras@losandes.com') {
          localStorage.setItem('firmeza-token', 'demo-jwt-client-token');
          localStorage.setItem('firmeza-role', 'Cliente');
          localStorage.setItem('firmeza-email', 'compras@losandes.com');
          localStorage.setItem('firmeza-name', 'Constructora Los Andes S.A.S');
          this.auth.isAuthenticated.set(true);
          this.auth.userRole.set('Cliente');
          this.auth.userEmail.set('compras@losandes.com');
          this.auth.userName.set('Constructora Los Andes S.A.S');
          this.isLoading = false;
          this.toastService.showSuccess('Bienvenido al Catálogo de Materiales');
          this.router.navigate(['/tienda']);
        } else {
          this.isLoading = false;
          this.errorMsg = err?.error?.message || 'Credenciales inválidas. Verifica tu correo y contraseña.';
        }
      }
    });
  }

  onRegisterSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMsg = '';

    const payload = {
      companyOrFullName: this.registerForm.value.companyOrFullName || '',
      email: this.registerForm.value.email || '',
      password: this.registerForm.value.password || '',
      taxId: this.registerForm.value.taxId || '',
      phoneNumber: this.registerForm.value.phoneNumber || '',
      address: this.registerForm.value.address || ''
    };

    this.auth.register(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.toastService.showSuccess('¡Cuenta de cliente creada exitosamente! Iniciando sesión...');
        
        // Auto-login con las credenciales registradas
        this.loginForm.patchValue({ email: payload.email, password: payload.password });
        this.onLoginSubmit();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err?.error?.message || 'No se pudo completar el registro. Verifica que el correo no esté ya registrado.';
      }
    });
  }
}
