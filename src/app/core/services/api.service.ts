import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // ✅ Importar 'of' de RxJS

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // 🔹 Método genérico
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`);
  }

  // ----------------------------
  // 🔹 Productos
  // ----------------------------
  getProductos(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/productos`, { params });
  }

  getProductosPage(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/productos/page`, {
      params: { page, size }
    });
  }

  searchProductos(query: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/productos/search`, {
      params: { q: query }
    });
  }

  getProducto(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/productos/${id}`);
  }

  createProducto(dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/productos`, dto);
  }

  updateProducto(id: string, dto: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/productos/${id}`, dto);
  }

  deleteProducto(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/productos/${id}`);
  }

  // ----------------------------
  // 🔹 Movimientos
  // ----------------------------
  getMovimientos(page?: number, size?: number): Observable<any> {
    const params: Record<string, string> = {};

    if (page !== undefined) {
      params['page'] = page.toString();
    }

    if (size !== undefined) {
      params['size'] = size.toString();
    }

    return this.http.get(`${this.baseUrl}/movimientos`, {
      params: Object.keys(params).length ? params : undefined
    });
  }

  getMovimientosPage(page: number = 0, size: number = 10): Observable<any> {
    return this.getMovimientos(page, size);
  }

  createMovimiento(dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/movimientos`, dto);
  }

  // ----------------------------
  // 🔹 Alertas (simulado)
  // ----------------------------
  getAlertas(): Observable<any[]> {
    return of([
      { mensaje: 'Stock bajo en Celular Samsung', tipo: 'warning', fecha: '2025-11-12' },
      { mensaje: 'Producto Laptop agotado', tipo: 'error', fecha: '2025-11-11' }
    ]);
  }

  // ----------------------------
  // 🔹 Reportes
  // ----------------------------
  getReport(endpoint: string, tipo: string = 'pdf'): Observable<Blob> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      Accept: tipo === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'
    });
    return this.http.get(`${this.baseUrl}${endpoint}`, { headers, responseType: 'blob' });
  }

descargarArchivo(endpoint: string, nombreArchivo: string): void {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    Accept: 'application/pdf'
  };

  this.http.get(`${this.baseUrl}${endpoint}`, { headers, responseType: 'blob' })
    .subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error descargando archivo:', err)
    });
}

  // ----------------------------
  // 🔹 Dashboard
  // ----------------------------
  getDashboardResumen(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/resumen`);
  }
}
