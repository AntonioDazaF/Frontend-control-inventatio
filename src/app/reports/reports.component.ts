import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../app/core/services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  LineController,
  LineElement,
  PointElement,
  Filler
} from 'chart.js';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  LineController,
  LineElement,
  PointElement,
  Filler
);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, OnDestroy {
  resumen = {
    totalProductos: 0,
    valorTotal: 0,
    stockBajo: 0,
    categorias: 0,
  };

  private readonly pageSize = 200;
  private charts: Chart[] = [];

  private toNumber(valor: any, defecto = 0): number {
    const numero = Number(valor);
    if (Number.isFinite(numero)) {
      return numero;
    }
    return defecto;
  }

  private formatearFechaCorta(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es', {
      month: 'short',
      day: '2-digit',
    });
  }

  private parseFecha(fecha: any): Date | null {
    if (!fecha) {
      return null;
    }

    if (fecha instanceof Date) {
      return fecha;
    }

    if (typeof fecha === 'string' || typeof fecha === 'number') {
      const parsed = new Date(fecha);
      if (Number.isFinite(parsed.getTime())) {
        return parsed;
      }
      return null;
    }

    if (
      typeof fecha === 'object' &&
      fecha !== null &&
      (fecha as any).year !== undefined &&
      (fecha as any).monthValue !== undefined &&
      (fecha as any).dayOfMonth !== undefined
    ) {
      const data = fecha as { year: number; monthValue: number; dayOfMonth: number };
      return new Date(data.year, data.monthValue - 1, data.dayOfMonth);
    }

    return null;
  }

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destruirCharts();
  }

  private cargarDatos(): void {
    forkJoin({
      productos: this.obtenerProductos(),
      movimientos: this.obtenerMovimientos()
    }).subscribe(({ productos, movimientos }) => {
      this.resumen = this.calcularResumen(productos);
      this.destruirCharts();
      this.renderTendenciasChart(movimientos);
      this.renderConsumoChart(movimientos);
      this.renderRecepcionChart(movimientos);
    });
  }

  private obtenerProductos(): Observable<any[]> {
    return this.api.getProductos().pipe(
      map((response: any) => {
        if (!response) {
          return [];
        }
        if (Array.isArray(response)) {
          return response;
        }

        const contenido = response && response.content;
        if (Array.isArray(contenido)) {
          return contenido;
        }

        const items = response && response.items;
        if (Array.isArray(items)) {
          return items;
        }

        return [];
      }),
      catchError((err) => {
        console.error('Error cargando productos para reportes', err);
        return of([]);
      })
    );
  }

  private obtenerMovimientos(
    page = 0,
    size = this.pageSize,
    acumulado: any[] = [],
    ids: Set<string> = new Set()
  ): Observable<any[]> {
    return this.api.getMovimientos(page, size).pipe(
      switchMap((data: any) => {
        const paginaActual = Array.isArray(data) ? data : (data && data.content) || [];

        if (!paginaActual.length) {
          return of(acumulado);
        }

        const nuevosMovimientos = paginaActual.filter((movimiento: any) => {
          const identificador = this.obtenerIdentificadorMovimiento(movimiento);
          if (!identificador) {
            return true;
          }
          if (ids.has(identificador)) {
            return false;
          }
          ids.add(identificador);
          return true;
        });

        const acumuladoActual = [...acumulado, ...nuevosMovimientos];

        if (Array.isArray(data)) {
          const paginaLlena = paginaActual.length === size;
          if (paginaLlena && nuevosMovimientos.length) {
            return this.obtenerMovimientos(page + 1, size, acumuladoActual, ids);
          }
          return of(acumuladoActual);
        }

        const sizeActual = data && typeof data.size === 'number' ? data.size : size;
        const currentPage = data && typeof data.number === 'number' ? data.number : page;
        const totalElements = data && typeof data.totalElements === 'number' ? data.totalElements : undefined;
        const totalPages =
          data && typeof data.totalPages === 'number'
            ? data.totalPages
            : totalElements && sizeActual
              ? Math.ceil(totalElements / sizeActual)
              : undefined;

        const hayMasPaginas = totalPages !== undefined && currentPage + 1 < totalPages;
        const faltanElementos = totalElements !== undefined && acumuladoActual.length < totalElements;
        const paginaLlena = paginaActual.length === sizeActual;

        if (hayMasPaginas || faltanElementos || (paginaLlena && nuevosMovimientos.length)) {
          return this.obtenerMovimientos(currentPage + 1, sizeActual, acumuladoActual, ids);
        }

        return of(acumuladoActual);
      }),
      catchError((err) => {
        console.error('Error cargando movimientos para reportes', err);
        return of(acumulado);
      })
    );
  }

  private obtenerIdentificadorMovimiento(movimiento: any): string | null {
    if (movimiento == null || typeof movimiento !== 'object') {
      return null;
    }

    if (movimiento.id !== undefined && movimiento.id !== null) {
      return `id:${movimiento.id}`;
    }

    if (movimiento.codigo !== undefined && movimiento.codigo !== null) {
      return `codigo:${movimiento.codigo}`;
    }

    if (movimiento.productoId !== undefined && movimiento.fecha) {
      const tipo = movimiento.tipo ? movimiento.tipo : '';
      return `ref:${movimiento.productoId}-${movimiento.fecha}-${tipo}`;
    }

    return null;
  }

  private calcularResumen(productos: any[]): { totalProductos: number; valorTotal: number; stockBajo: number; categorias: number } {
    if (!Array.isArray(productos)) {
      return this.resumen;
    }

    const categoriasMarcadas: Record<string, boolean> = {};
    let stockBajo = 0;
    let valorTotal = 0;
    let totalCategorias = 0;

    for (let i = 0; i < productos.length; i += 1) {
      const producto = productos[i];
      if (!producto || typeof producto !== 'object') {
        continue;
      }

      const categoriaActual = producto.categoria;
      if (categoriaActual && !categoriasMarcadas[categoriaActual]) {
        categoriasMarcadas[categoriaActual] = true;
        totalCategorias += 1;
      }

      const stock = this.toNumber((producto as any).stock);
      const minimo = this.toNumber((producto as any).minimo);
      const precio = this.toNumber((producto as any).precioUnitario);

      if (stock <= 0 || (minimo > 0 && stock < minimo)) {
        stockBajo += 1;
      }

      valorTotal += stock * precio;
    }

    return {
      totalProductos: productos.length,
      valorTotal,
      stockBajo,
      categorias: totalCategorias,
    };
  }

  private renderTendenciasChart(movimientos: any[]): void {
    const canvas = document.getElementById('tendenciasChart') as HTMLCanvasElement;
    if (!canvas) {
      return;
    }

    const tendencias = this.agruparPorFecha(movimientos);
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: tendencias.labels,
        datasets: [
          {
            label: 'Entradas',
            data: tendencias.entradas,
            backgroundColor: '#2563eb',
            borderRadius: 18,
            maxBarThickness: 48,
          },
          {
            label: 'Salidas',
            data: tendencias.salidas,
            backgroundColor: '#f43f5e',
            borderRadius: 18,
            maxBarThickness: 48,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              color: '#475569',
              font: { family: 'Inter', size: 12, weight: 600 }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { family: 'Inter', size: 12, weight: 600 } }
          },
          y: {
            grid: { color: 'rgba(148, 163, 184, 0.2)' },
            ticks: { color: '#94a3b8', precision: 0 }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  private renderConsumoChart(movimientos: any[]): void {
    const canvas = document.getElementById('consumoChart') as HTMLCanvasElement;
    if (!canvas) {
      return;
    }

    const consumo = this.agruparPorProducto(movimientos, 'SALIDA');
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: consumo.labels,
        datasets: [
          {
            label: 'Unidades consumidas',
            data: consumo.valores,
            backgroundColor: '#f97316',
            borderRadius: 16,
            maxBarThickness: 36,
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(148, 163, 184, 0.2)' },
            ticks: { color: '#94a3b8', precision: 0 }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#475569', font: { family: 'Inter', size: 12, weight: 600 } }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  private renderRecepcionChart(movimientos: any[]): void {
    const canvas = document.getElementById('recepcionChart') as HTMLCanvasElement;
    if (!canvas) {
      return;
    }

    const recepcion = this.agruparPorFecha(movimientos, 'ENTRADA', true);
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: recepcion.labels,
        datasets: [
          {
            label: 'Unidades recibidas',
            data: recepcion.entradas,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { family: 'Inter', size: 12, weight: 600 } }
          },
          y: {
            grid: { color: 'rgba(148, 163, 184, 0.2)' },
            ticks: { color: '#94a3b8', precision: 0 }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  private agruparPorFecha(movimientos: any[], filtroTipo?: string, usarCantidad = false) {
    if (!Array.isArray(movimientos)) {
      return { labels: [], entradas: [], salidas: [] };
    }

    const acumulado: Record<string, { entradas: number; salidas: number }> = {};

    for (let i = 0; i < movimientos.length; i += 1) {
      const movimiento = movimientos[i];
      if (!movimiento) {
        continue;
      }

      const tipo = ((movimiento.tipo || '') as string).toUpperCase();
      if (filtroTipo && tipo !== filtroTipo) {
        continue;
      }

      const fecha = this.parseFecha((movimiento as any).fecha);
      if (!fecha) {
        continue;
      }

      const clave = fecha.toISOString().slice(0, 10);
      if (!acumulado[clave]) {
        acumulado[clave] = { entradas: 0, salidas: 0 };
      }

      const cantidad = usarCantidad ? this.toNumber((movimiento as any).cantidad, 0) : 1;

      if (tipo === 'ENTRADA') {
        acumulado[clave].entradas += cantidad;
      } else if (tipo === 'SALIDA') {
        acumulado[clave].salidas += cantidad;
      }
    }

    const clavesOrdenadas = Object.keys(acumulado).sort();
    const ultimas = clavesOrdenadas.slice(-8);
    const etiquetas: string[] = [];
    const entradas: number[] = [];
    const salidas: number[] = [];

    for (let i = 0; i < ultimas.length; i += 1) {
      const clave = ultimas[i];
      const registro = acumulado[clave];
      etiquetas.push(this.formatearFechaCorta(clave));
      entradas.push(registro ? registro.entradas : 0);
      salidas.push(registro ? registro.salidas : 0);
    }

    return { labels: etiquetas, entradas, salidas };
  }

  private agruparPorProducto(movimientos: any[], tipo: 'ENTRADA' | 'SALIDA') {
    if (!Array.isArray(movimientos)) {
      return { labels: [], valores: [] };
    }

    const acumulado: Record<string, number> = {};

    for (let i = 0; i < movimientos.length; i += 1) {
      const movimiento = movimientos[i];
      if (!movimiento) {
        continue;
      }

      const tipoMovimiento = ((movimiento.tipo || '') as string).toUpperCase();
      if (tipoMovimiento !== tipo) {
        continue;
      }

      const productoOrigen = movimiento.producto || {};
      const nombre = (productoOrigen && productoOrigen.nombre) || movimiento.productoNombre || '';
      const sku = (productoOrigen && productoOrigen.sku) || (productoOrigen && productoOrigen.codigo) || '';
      const etiqueta = nombre || sku || 'Producto';

      const cantidad = this.toNumber((movimiento as any).cantidad, 0);
      const acumuladoActual = acumulado[etiqueta] || 0;
      acumulado[etiqueta] = acumuladoActual + cantidad;
    }

    const entradasOrdenadas = Object.keys(acumulado)
      .map((clave) => ({ producto: clave, cantidad: acumulado[clave] }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6);

    const etiquetas: string[] = [];
    const valores: number[] = [];

    for (let i = 0; i < entradasOrdenadas.length; i += 1) {
      etiquetas.push(entradasOrdenadas[i].producto);
      valores.push(entradasOrdenadas[i].cantidad);
    }

    return { labels: etiquetas, valores };
  }

  descargarInventarioPDF(): void {
    this.api.descargarArchivo('/reportes/inventario/pdf', 'inventario.pdf');
  }

  descargarMovimientosPDF(): void {
    this.api.descargarArchivo('/reportes/movimientos/pdf', 'movimientos.pdf');
  }

  descargarInventarioExcel(): void {
    this.api.descargarArchivo('/reportes/inventario/excel', 'inventario.xlsx', 'excel');
  }

  private destruirCharts(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
  }
}
