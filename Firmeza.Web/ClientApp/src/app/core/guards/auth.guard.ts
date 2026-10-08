import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const requiredRoles = route.data['roles'] as string[];
    if (requiredRoles && !requiredRoles.includes(authService.userRole())) {
      if (authService.userRole() === 'Cliente') {
        router.navigate(['/tienda']);
      } else {
        router.navigate(['/dashboard']);
      }
      return false;
    }
    return true;
  }
  
  router.navigate(['/home']);
  return false;
};
