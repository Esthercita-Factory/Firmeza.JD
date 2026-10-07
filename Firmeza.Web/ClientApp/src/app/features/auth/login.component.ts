import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-wrapper d-flex align-items-center justify-content-center">
      <div class="card panel p-5 border-0" style="max-width: 400px; width: 100%;">
        <div class="text-center mb-4">
          <h2 class="hud-text text-primary d-flex align-items-center justify-content-center">
            <i class="bi bi-hexagon-fill me-2"></i> FIRMEZA
          </h2>
          <p class="text-muted small">Ingresa tus credenciales para acceder</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="mb-3">
            <label class="form-label text-muted small fw-bold">Correo Electrónico</label>
            <input type="email" class="form-control" formControlName="email" placeholder="admin@firmeza.com">
          </div>
          
          <div class="mb-4">
            <label class="form-label text-muted small fw-bold">Contraseña</label>
            <input type="password" class="form-control" formControlName="password" placeholder="••••••••">
          </div>

          <button type="submit" class="btn btn-primary w-100 py-2 hud-active" [disabled]="loginForm.invalid || isLoading">
            <span *ngIf="!isLoading">Ingresar al Sistema</span>
            <span *ngIf="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          </button>
          
          <div class="text-danger mt-3 text-center small" *ngIf="errorMsg">
            {{ errorMsg }}
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      background-color: var(--bg-base);
    }
    .form-control {
      background-color: var(--bg-base);
      border: 1px solid var(--border-color);
      color: var(--text-main);
    }
    .form-control:focus {
      background-color: var(--bg-base);
      color: var(--text-main);
      border-color: var(--accent-primary);
      box-shadow: var(--accent-glow);
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loginForm = this.fb.group({
    email: ['admin@firmeza.com', [Validators.required, Validators.email]],
    password: ['Admin123!', Validators.required]
  });

  isLoading = false;
  errorMsg = '';

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMsg = '';
      this.auth.login(this.loginForm.value).subscribe({
        next: () => {
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMsg = 'Credenciales inválidas. Intente nuevamente.';
        }
      });
    }
  }
}
