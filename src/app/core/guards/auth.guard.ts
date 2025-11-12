import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.auth.getToken();

    // ✅ Asegura que el token sea válido y no esté vacío
    if (token && token.length > 10) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
