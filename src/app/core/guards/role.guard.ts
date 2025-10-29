import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {jwtDecode} from 'jwt-decode';

interface JwtPayload {
  role?: string;
  [key: string]: any;
}

export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decoded: JwtPayload = jwtDecode(token);
    const allowedRoles = route.data['roles'] as string[];

    if (decoded.role && allowedRoles.includes(decoded.role)) {
      return true;
    } else {
      router.navigate(['/dashboard']);
      return false;
    }
  } catch (error) {
    console.error('Error al decodificar token:', error);
    router.navigate(['/login']);
    return false;
  }
};