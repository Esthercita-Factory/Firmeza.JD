import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly TOKEN_KEY = 'firmeza-token';
  private readonly ROLE_KEY = 'firmeza-role';
  
  public isAuthenticated = signal<boolean>(false);
  public userRole = signal<string>('');

  constructor() {
    this.checkToken();
  }

  private checkToken() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const role = localStorage.getItem(this.ROLE_KEY);
    if (token && role) {
      this.isAuthenticated.set(true);
      this.userRole.set(role);
    }
  }

  login(credentials: any) {
    return this.http.post<any>('http://localhost:5180/api/auth/login', credentials).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(this.ROLE_KEY, res.role);
          this.isAuthenticated.set(true);
          this.userRole.set(res.role);
          this.router.navigate(['/']);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    this.isAuthenticated.set(false);
    this.userRole.set('');
    this.router.navigate(['/login']);
  }

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
