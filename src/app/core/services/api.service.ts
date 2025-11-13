import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';

/**
 * Servicio responsable de centralizar las llamadas HTTP al backend REST.
 *
 * Se exponen métodos específicos para los módulos de productos, movimientos,
 * reportes y dashboard, además de utilidades comunes como la descarga de
 * archivos. Las rutas se resuelven automáticamente a partir de la
 * configuración base definida por la propiedad `baseUrl`.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  /**
   * Realiza una petición GET genérica hacia el endpoint indicado.
   *
   * @typeParam T Tipo de dato esperado como respuesta.
   * @param endpoint Ruta relativa que se anexará al `baseUrl`.
   * @returns Observable con la respuesta tipada.
   */
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`);
  }

  // ----------------------------
  // 🔹 Productos
  // ----------------------------
  /**
   * Obtiene la lista completa de productos.
   *
   * @param params Parámetros opcionales de consulta tales como filtros.
   */
  getProductos(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/productos`, { params });
  }

  /**
   * Recupera los productos utilizando paginación desde el backend.
   *
   * @param page Número de página (base cero) solicitado.
   * @param size Cantidad de registros por página.
   */
  getProductosPage(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/productos/page`, {
      params: {
        page: page.toString(),
        size: size.toString()
      }
    });
  }

  /**
   * Busca productos coincidentes con un término.
   *
   * @param query Texto de búsqueda enviado al backend.
   */
  searchProductos(query: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/productos/search`, {
      params: { q: query }
    });
  }

  /**
   * Obtiene el detalle de un producto concreto.
   *
   * @param id Identificador único del producto.
   */
  getProducto(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/productos/${id}`);
  }

  /**
   * Crea un nuevo producto.
   *
   * @param dto Datos del producto a persistir.
   */
  createProducto(dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/productos`, dto);
  }

  /**
   * Actualiza parcialmente un producto existente.
   *
   * @param id Identificador del producto a modificar.
   * @param dto Campos que se desean actualizar.
   */
  updateProducto(id: string, dto: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/productos/${id}`, dto);
  }

  /**
   * Elimina el producto indicado.
   *
   * @param id Identificador del producto a eliminar.
   */
  deleteProducto(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/productos/${id}`);
  }

  // ----------------------------
  // 🔹 Movimientos
  // ----------------------------
  /**
   * Recupera los movimientos registrados, permitiendo parámetros opcionales
   * de paginación.
   *
   * @param page Página solicitada (base cero).
   * @param size Cantidad de resultados por página.
   */
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

  /**
   * Versión accesible del método {@link ApiService.getMovimientos} con valores
   * por defecto para paginación.
   */
  getMovimientosPage(page: number = 0, size: number = 10): Observable<any> {
    return this.getMovimientos(page, size);
  }

  /**
   * Registra un nuevo movimiento de inventario.
   *
   * @param dto Datos del movimiento a crear.
   */
  createMovimiento(dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/movimientos`, dto);
  }

  // ----------------------------
  // 🔹 Alertas (simulado)
  // ----------------------------
  /**
   * Devuelve un listado simulado de alertas cuando el backend real aún no se
   * encuentra disponible.
   */
  getAlertas(): Observable<any[]> {
    return of([
      { mensaje: 'Stock bajo en Celular Samsung', tipo: 'warning', fecha: '2025-11-12' },
      { mensaje: 'Producto Laptop agotado', tipo: 'error', fecha: '2025-11-11' }
    ]);
  }

  // ----------------------------
  // 🔹 Reportes
  // ----------------------------
  /**
   * Solicita un reporte en formato PDF o Excel al backend.
   *
   * @param endpoint Ruta del reporte (relativa o absoluta).
   * @param tipo Formato requerido: `pdf` o `excel`.
   */
  getReport(endpoint: string, tipo: string = 'pdf'): Observable<Blob> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      Accept: tipo === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'
    });
    return this.http.get(`${this.baseUrl}${endpoint}`, { headers, responseType: 'blob' });
  }

  /**
   * Descarga y dispara la descarga de un archivo generado por el backend.
   *
   * @param endpoint Ruta del recurso a descargar.
   * @param nombreArchivo Nombre sugerido para el archivo descargado.
   * @param tipo Formato del archivo solicitado.
   */
  descargarArchivo(endpoint: string, nombreArchivo: string, tipo: 'pdf' | 'excel' = 'pdf'): void {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      Accept: tipo === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = this.resolverUrl(endpoint);

    this.http.get(url, { headers, responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const link = document.createElement('a');
          const objectUrl = window.URL.createObjectURL(blob);
          link.href = objectUrl;
          link.download = nombreArchivo;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(objectUrl);
        },
        error: (err) => console.error('Error descargando archivo:', err)
      });
  }

  /**
   * Normaliza un endpoint relativo o absoluto para componer la URL final.
   *
   * @param endpoint Ruta tal como se recibe desde los componentes.
   * @returns URL absoluta hacia el recurso solicitado.
   */
  private resolverUrl(endpoint: string): string {
    if (/^https?:\/\//i.test(endpoint)) {
      return endpoint;
    }

    const normalizado = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${normalizado}`;
  }

  // ----------------------------
  // 🔹 Dashboard
  // ----------------------------
  /**
   * Recupera la información resumida del dashboard.
   */
  getDashboardResumen(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/resumen`);
  }
}
