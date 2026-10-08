import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { authGuard } from './core/guards/auth.guard';
import { unauthGuard } from './core/guards/unauth.guard';

export const routes: Routes = [
  // 1. LANDING PAGE EXTERIOR (Solo visible cuando NO está autenticado)
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [unauthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
    canActivate: [unauthGuard]
  },

  // 2. CABINA HUD COMPLETA CON SIDEBAR, TELEMETRÍA Y GRÁFICOS (Protegida por authGuard)
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { roles: ['Administrador'] }
      },
      { 
        path: 'pos', 
        loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent),
        data: { roles: ['Administrador'] }
      },
      { 
        path: 'products', 
        loadComponent: () => import('./features/products/products.component').then(m => m.ProductsComponent),
        data: { roles: ['Administrador'] }
      },
      { 
        path: 'customers', 
        loadComponent: () => import('./features/customers/customers.component').then(m => m.CustomersComponent),
        data: { roles: ['Administrador'] }
      },
      { 
        path: 'sales', 
        loadComponent: () => import('./features/sales/sales.component').then(m => m.SalesComponent),
        data: { roles: ['Administrador'] }
      },
      { 
        path: 'tienda', 
        loadComponent: () => import('./features/shop/shop.component').then(m => m.ShopComponent) 
      },
      { 
        path: 'carrito', 
        loadComponent: () => import('./features/shop/checkout.component').then(m => m.CheckoutComponent) 
      },
      { 
        path: 'mis-compras', 
        loadComponent: () => import('./features/shop/my-orders.component').then(m => m.MyOrdersComponent) 
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
