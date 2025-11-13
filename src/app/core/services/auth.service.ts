import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

/**
 * Servicio que encapsula la autenticación y gestión del token JWT.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) { }

  /**
   * Autentica al usuario contra el backend y persiste el token recibido.
   *
   * @param credentials Credenciales de acceso ingresadas por el usuario.
   * @returns Observable con la respuesta del backend.
   */
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


  /**
   * Registra un nuevo usuario en el sistema.
   *
   * @param data Información requerida para el registro.
   */
  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/registro`, data);
  }

  /**
   * Obtiene el token JWT almacenado en `localStorage`.
   */
  getToken(): string | null {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  }

  /**
   * Extrae el nombre de usuario almacenado en el token JWT.
   *
   * @returns El identificador del usuario o `null` si no se puede resolver.
   */
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


  /**
   * Cierra la sesión limpiando los datos almacenados.
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Indica si existe una sesión autenticada.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }


}
