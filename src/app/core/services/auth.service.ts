import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) { }

  login(credentials: { nombreUsuario: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials).pipe(
      tap((response: any) => {
        console.log('Respuesta de login:', response);
        if (response?.token) {
          // Guarda el token JWT
          localStorage.setItem('token', response.token);
          // Guarda información del usuario si viene en la respuesta
          if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
          }
        }
      })
    );
  }


  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/registro`, data);
  }

  getToken(): string | null {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  }
  getUserFromToken(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || null;
    } catch (e) {
      console.error('Error decodificando token', e);
      return null;
    }
  }


  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }


}
