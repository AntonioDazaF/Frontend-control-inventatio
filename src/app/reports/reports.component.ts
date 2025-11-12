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

    const categorias = new Set<string>();
    let stockBajo = 0;
    let valorTotal = 0;

    productos.forEach((producto) => {
      if (producto && producto.categoria) {
        categorias.add(producto.categoria);
      }

      const stock = this.toNumber(producto && producto.stock);
      const minimo = this.toNumber(producto && producto.minimo);
      const precio = this.toNumber(producto && producto.precioUnitario);

      if (stock <= 0 || (minimo > 0 && stock < minimo)) {
        stockBajo += 1;
      }

      valorTotal += stock * precio;
    });

    return {
      totalProductos: productos.length,
      valorTotal,
      stockBajo,
      categorias: categorias.size,
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

    const mapa = new Map<string, { entradas: number; salidas: number }>();

    movimientos.forEach((movimiento) => {
      const tipo = ((movimiento && movimiento.tipo) || '').toUpperCase();
      if (filtroTipo && tipo !== filtroTipo) {
        return;
      }

      const fecha = this.parseFecha(movimiento ? movimiento.fecha : undefined);
      if (!fecha) {
        return;
      }

      const clave = fecha.toISOString().slice(0, 10);
      if (!mapa.has(clave)) {
        mapa.set(clave, { entradas: 0, salidas: 0 });
      }

      const registro = mapa.get(clave)!;
      const cantidad = usarCantidad ? this.toNumber(movimiento ? movimiento.cantidad : undefined, 0) : 1;

      if (tipo === 'ENTRADA') {
        registro.entradas += cantidad;
      } else if (tipo === 'SALIDA') {
        registro.salidas += cantidad;
      }
    });

    const clavesOrdenadas = Array.from(mapa.keys()).sort();
    const ultimas = clavesOrdenadas.slice(-8);

    return {
      labels: ultimas.map((clave) => this.formatearFechaCorta(clave)),
      entradas: ultimas.map((clave) => {
        const registro = mapa.get(clave);
        return registro ? registro.entradas : 0;
      }),
      salidas: ultimas.map((clave) => {
        const registro = mapa.get(clave);
        return registro ? registro.salidas : 0;
      }),
    };
  }

  private agruparPorProducto(movimientos: any[], tipo: 'ENTRADA' | 'SALIDA') {
    if (!Array.isArray(movimientos)) {
      return { labels: [], valores: [] };
    }

    const mapa = new Map<string, number>();

    movimientos.forEach((movimiento) => {
      const tipoMovimiento = ((movimiento && movimiento.tipo) || '').toUpperCase();
      if (tipoMovimiento !== tipo) {
        return;
      }

      const producto =
        (movimiento && movimiento.producto && movimiento.producto.nombre) ||
        (movimiento && movimiento.productoNombre) ||
        (movimiento && movimiento.producto && movimiento.producto.sku) ||
        (movimiento && movimiento.producto && movimiento.producto.codigo) ||
        'Producto';

      const cantidad = this.toNumber(movimiento ? movimiento.cantidad : undefined, 0);
      const acumulado = mapa.has(producto) ? mapa.get(producto)! : 0;
      mapa.set(producto, acumulado + cantidad);
    });

    const ordenado = Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      labels: ordenado.map(([producto]) => producto),
      valores: ordenado.map(([, cantidad]) => cantidad),
    };
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

  private formatearFechaCorta(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es', {
      month: 'short',
      day: '2-digit',
    });
  }

  private parseFecha(fecha: unknown): Date | null {
    if (!fecha) {
      return null;
    }

    if (fecha instanceof Date) {
      return fecha;
    }

    if (typeof fecha === 'string' || typeof fecha === 'number') {
      const date = new Date(fecha);
      return Number.isFinite(date.getTime()) ? date : null;
    }

    if (
      typeof fecha === 'object' &&
      fecha !== null &&
      'year' in (fecha as any) &&
      'monthValue' in (fecha as any) &&
      'dayOfMonth' in (fecha as any)
    ) {
      const { year, monthValue, dayOfMonth } = fecha as { year: number; monthValue: number; dayOfMonth: number };
      return new Date(year, monthValue - 1, dayOfMonth);
    }

    return null;
  }

  private destruirCharts(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
  }

  private toNumber(valor: unknown, defecto = 0): number {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : defecto;
  }
}
