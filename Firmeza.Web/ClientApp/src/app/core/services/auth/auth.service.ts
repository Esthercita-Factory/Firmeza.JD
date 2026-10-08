import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export interface CustomerSignupData {
  companyOrFullName: string;
  email: string;
  password: string;
  taxId?: string;
  phoneNumber?: string;
  address?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly TOKEN_KEY = 'firmeza-token';
  private readonly ROLE_KEY = 'firmeza-role';
  private readonly EMAIL_KEY = 'firmeza-email';
  private readonly NAME_KEY = 'firmeza-name';
  
  public isAuthenticated = signal<boolean>(false);
  public userRole = signal<string>('');
  public userEmail = signal<string>('');
  public userName = signal<string>('');

  public isClient = computed(() => this.userRole() === 'Cliente');
  public isAdmin = computed(() => this.userRole() === 'Administrador');

  constructor() {
    this.checkToken();
  }

  private checkToken() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const role = localStorage.getItem(this.ROLE_KEY);
    const email = localStorage.getItem(this.EMAIL_KEY);
    const name = localStorage.getItem(this.NAME_KEY);
    if (token && role) {
      this.isAuthenticated.set(true);
      this.userRole.set(role);
      this.userEmail.set(email || '');
      this.userName.set(name || (role === 'Cliente' ? 'Cliente Firmeza' : 'Administrador'));
    }
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post<any>('http://localhost:5035/api/auth/login', credentials).pipe(
      tap(res => {
        if (res && res.token) {
          const role = res.role || 'Cliente';
          const email = credentials.email;
          const name = res.fullName || (role === 'Cliente' ? email.split('@')[0] : 'Administrador');

          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(this.ROLE_KEY, role);
          localStorage.setItem(this.EMAIL_KEY, email);
          localStorage.setItem(this.NAME_KEY, name);

          this.isAuthenticated.set(true);
          this.userRole.set(role);
          this.userEmail.set(email);
          this.userName.set(name);

          if (role === 'Cliente') {
            this.router.navigate(['/tienda']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        }
      })
    );
  }

  register(data: CustomerSignupData) {
    return this.http.post<any>('http://localhost:5035/api/customer-requests/signup', data);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.EMAIL_KEY);
    localStorage.removeItem(this.NAME_KEY);
    this.isAuthenticated.set(false);
    this.userRole.set('');
    this.userEmail.set('');
    this.userName.set('');
    this.router.navigate(['/home']);
  }

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
