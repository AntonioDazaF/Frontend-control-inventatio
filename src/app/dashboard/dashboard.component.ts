import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables
} from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { ApiService } from '../../app/core/services/api.service';

type BarChartData = ChartData<'bar'>;
type PieChartData = ChartData<'doughnut'>;

interface DashboardResumen {
  totalProductos: number;
  movimientos: number;
  movimientosHoy: number;
  alertasActivas: number;
  productosDisponibles: number;
  stockBajo: number;
  productosAgotados: number;
}

type InventoryDistribution = {
  disponibles: number;
  stockBajo: number;
  agotados: number;
};

interface TopProductoVista {
  codigo: string;
  nombre: string;
  stock: number;
  estadoLabel: string;
  estadoClass: 'success' | 'warning' | 'danger';
}

interface MovimientoReciente {
  descripcion: string;
  fecha: Date;
  cantidad: number;
  signo: '+' | '-';
  tipoClass: 'entrada' | 'salida';
  icono: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule, 
    BaseChartDirective
  ],
  providers: [
    ApiService,
    provideCharts(withDefaultRegisterables()),
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  resumen: Partial<DashboardResumen> = {};
  private readonly movimientosPageSize = 100;
  fechaActual = new Date();
  topProductos: TopProductoVista[] = [];
  movimientosRecientes: MovimientoReciente[] = [];

  chartData: BarChartData = {
    labels: [],
    datasets: [
      {
        label: 'Entradas',
        data: [],
        backgroundColor: '#3b82f6',
        borderRadius: 14,
        maxBarThickness: 48,
      },
      {
        label: 'Salidas',
        data: [],
        backgroundColor: '#f43f5e',
        borderRadius: 14,
        maxBarThickness: 48,
      },
    ],
  };

  pieData: PieChartData = {
    labels: ['Disponibles', 'Stock Bajo', 'Agotados'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#2563eb', '#f59e0b', '#f43f5e'],
        borderWidth: 0,
      },
    ],
  };

  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            family: 'Inter',
            size: 12,
            weight: 600,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.2)',
        },
        ticks: {
          color: '#94a3b8',
          font: {
            family: 'Inter',
            size: 12,
          },
          precision: 0,
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          color: '#475569',
          font: {
            family: 'Inter',
            size: 12,
            weight: 600,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y ?? 0}`,
        },
      },
    },
  };
  pieOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          color: '#475569',
          font: {
            family: 'Inter',
            size: 12,
            weight: 600,
          },
        },
      },
    },
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    forkJoin({
      resumen: this.api.getDashboardResumen().pipe(
        catchError((err) => {
          console.error('Error cargando resumen', err);
          return of(null);
        })
      ),
      productos: this.api.getProductos().pipe(
        catchError((err) => {
          console.error('Error cargando productos para dashboard', err);
          return of([]);
        }),
        map((response: any) => {
          if (!response) {
            return [];
          }

          if (Array.isArray(response)) {
            return response;
          }

          if (Array.isArray(response?.content)) {
            return response.content;
          }

          if (Array.isArray(response?.items)) {
            return response.items;
          }

          return [];
        })
      ),
      movimientos: this.cargarMovimientos()
    }).subscribe(({ resumen, productos, movimientos }) => {
      const distribution = this.calcularDistribucion(productos);
      const totalProductos = resumen?.totalProductos ?? productos.length;
      const movimientosTotales = resumen?.movimientos ?? movimientos?.length ?? resumen?.movimientosHoy ?? 0;
      const movimientosDelDia = this.contarMovimientosDeHoy(movimientos) ?? resumen?.movimientosHoy ?? movimientosTotales;

      const stockBajoTotal = distribution.stockBajo;
      const alertasActivas = Math.max(stockBajoTotal, this.toNumber(resumen?.alertasActivas));

      const resumenCalculado: Partial<DashboardResumen> = {
        ...resumen,
        totalProductos,
        movimientos: movimientosTotales,
        movimientosHoy: movimientosDelDia,
        productosDisponibles: distribution.disponibles,
        stockBajo: stockBajoTotal,
        productosAgotados: distribution.agotados,
        alertasActivas,
      };

      this.resumen = resumenCalculado;

      const tendencia = this.agruparMovimientosPorDia(movimientos);

      this.chartData = {
        ...this.chartData,
        labels: tendencia.labels,
        datasets: [
          {
            ...this.chartData.datasets[0],
            data: tendencia.entradas,
          },
          {
            ...this.chartData.datasets[1],
            data: tendencia.salidas,
          }
        ],
      };

      this.pieData = {
        ...this.pieData,
        datasets: [
          {
            ...this.pieData.datasets[0],
            data: [
              distribution.disponibles,
              distribution.stockBajo,
              distribution.agotados,
            ],
          },
        ],
      };

      this.topProductos = this.obtenerTopProductos(productos);
      this.movimientosRecientes = this.obtenerMovimientosRecientes(movimientos);
    });
  }

  private calcularDistribucion(productos: any[]): InventoryDistribution {
    return productos.reduce<InventoryDistribution>((acumulado, producto) => {
      const stock = this.toNumber(producto?.stock);
      const minimo = this.toNumber(producto?.minimo);

      if (stock <= 0) {
        acumulado.agotados += 1;
        return acumulado;
      }

      if (minimo > 0 && stock < minimo) {
        acumulado.stockBajo += 1;
        return acumulado;
      }

      acumulado.disponibles += 1;
      return acumulado;
    }, { disponibles: 0, stockBajo: 0, agotados: 0 });
  }

  private cargarMovimientos(
    page = 0,
    size = this.movimientosPageSize,
    acumulado: any[] = [],
    ids: Set<string> = new Set()
  ): Observable<any[]> {
    return this.api.getMovimientos(page, size).pipe(
      switchMap((data: any) => {
        const paginaActual = Array.isArray(data) ? data : data?.content || [];

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
            return this.cargarMovimientos(page + 1, size, acumuladoActual, ids);
          }

          return of(acumuladoActual);
        }

        const sizeActual = typeof data?.size === 'number' ? data.size : size;
        const currentPage = typeof data?.number === 'number' ? data.number : page;

        const totalElements = typeof data?.totalElements === 'number' ? data.totalElements : undefined;
        const totalPages = typeof data?.totalPages === 'number'
          ? data.totalPages
          : totalElements && sizeActual
            ? Math.ceil(totalElements / sizeActual)
            : undefined;

        const hayMasPaginas = totalPages !== undefined && currentPage + 1 < totalPages;
        const faltanElementos = totalElements !== undefined && acumuladoActual.length < totalElements;
        const paginaLlena = paginaActual.length === sizeActual;

        if (hayMasPaginas || faltanElementos || (paginaLlena && nuevosMovimientos.length)) {
          return this.cargarMovimientos(currentPage + 1, sizeActual, acumuladoActual, ids);
        }

        return of(acumuladoActual);
      }),
      catchError((err) => {
        console.error('Error obteniendo movimientos', err);
        return of(acumulado);
      })
    );
  }

  private obtenerIdentificadorMovimiento(movimiento: any): string | null {
    if (!movimiento || typeof movimiento !== 'object') {
      return null;
    }

    if (movimiento.id !== undefined && movimiento.id !== null) {
      return `id:${movimiento.id}`;
    }

    if (movimiento.codigo !== undefined && movimiento.codigo !== null) {
      return `codigo:${movimiento.codigo}`;
    }

    if (movimiento.productoId !== undefined && movimiento.fecha) {
      return `ref:${movimiento.productoId}-${movimiento.fecha}-${movimiento.tipo ?? ''}`;
    }

    return null;
  }

  private contarMovimientosDeHoy(movimientos: any[] | null | undefined): number {
    if (!Array.isArray(movimientos)) {
      return 0;
    }

    return movimientos.reduce((total, movimiento) => {
      return this.esMovimientoDeHoy(movimiento?.fecha) ? total + 1 : total;
    }, 0);
  }

  private esMovimientoDeHoy(fecha: unknown): boolean {
    if (!fecha) {
      return false;
    }

    const hoy = new Date();
    const hoyISO = hoy.toISOString().slice(0, 10);

    if (fecha instanceof Date) {
      const fechaISO = fecha.toISOString().slice(0, 10);
      return fechaISO === hoyISO;
    }

    if (typeof fecha === 'string') {
      return fecha.slice(0, 10) === hoyISO;
    }

    if (typeof fecha === 'number') {
      const fechaNumero = new Date(fecha);
      if (!Number.isFinite(fechaNumero.getTime())) {
        return false;
      }
      return fechaNumero.toISOString().slice(0, 10) === hoyISO;
    }

    if (typeof fecha === 'object' && 'year' in (fecha as any) && 'monthValue' in (fecha as any) && 'dayOfMonth' in (fecha as any)) {
      const { year, monthValue, dayOfMonth } = fecha as { year: number; monthValue: number; dayOfMonth: number };
      const fechaFormateada = `${year.toString().padStart(4, '0')}-${monthValue.toString().padStart(2, '0')}-${dayOfMonth.toString().padStart(2, '0')}`;
      return fechaFormateada === hoyISO;
    }

    return false;
  }

  private agruparMovimientosPorDia(movimientos: any[] | null | undefined) {
    if (!Array.isArray(movimientos) || !movimientos.length) {
      return { labels: [], entradas: [], salidas: [] };
    }

    const agrupado = movimientos.reduce<Record<string, { entradas: number; salidas: number }>>((acc, movimiento) => {
      const fecha = this.parseFecha(movimiento?.fecha);
      if (!fecha) {
        return acc;
      }

      const clave = fecha.toISOString().slice(0, 10);
      if (!acc[clave]) {
        acc[clave] = { entradas: 0, salidas: 0 };
      }

      const tipo = (movimiento?.tipo || '').toUpperCase();
      if (tipo === 'ENTRADA') {
        acc[clave].entradas += 1;
      } else if (tipo === 'SALIDA') {
        acc[clave].salidas += 1;
      }

      return acc;
    }, {});

    const clavesOrdenadas = Object.keys(agrupado).sort();
    const ultimas = clavesOrdenadas.slice(-6);

    return {
      labels: ultimas.map((clave) => this.formatearFechaCorta(clave)),
      entradas: ultimas.map((clave) => agrupado[clave]?.entradas ?? 0),
      salidas: ultimas.map((clave) => agrupado[clave]?.salidas ?? 0),
    };
  }

  private formatearFechaCorta(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es', {
      month: 'short',
      day: '2-digit',
    });
  }

  private obtenerTopProductos(productos: any[]): TopProductoVista[] {
    if (!Array.isArray(productos)) {
      return [];
    }

    const ordenados = [...productos].sort((a, b) => this.toNumber(b?.stock) - this.toNumber(a?.stock));

    return ordenados.slice(0, 5).map((producto) => {
      const stock = this.toNumber(producto?.stock);
      const minimo = this.toNumber(producto?.minimo);
      const codigo = producto?.sku || producto?.codigo || producto?.id || '—';
      const nombre = producto?.nombre || 'Producto sin nombre';

      if (stock <= 0) {
        return { codigo, nombre, stock, estadoLabel: 'Agotado', estadoClass: 'danger' };
      }

      if (minimo > 0 && stock < minimo) {
        return { codigo, nombre, stock, estadoLabel: 'Crítico', estadoClass: 'warning' };
      }

      return { codigo, nombre, stock, estadoLabel: 'Normal', estadoClass: 'success' };
    });
  }

  private obtenerMovimientosRecientes(movimientos: any[] | null | undefined): MovimientoReciente[] {
    if (!Array.isArray(movimientos)) {
      return [];
    }

    return [...movimientos]
      .map((movimiento) => {
        const fecha = this.parseFecha(movimiento?.fecha);
        const cantidad = this.toNumber(movimiento?.cantidad);
        const tipo = (movimiento?.tipo || '').toUpperCase();
        const producto =
          movimiento?.producto?.nombre ||
          movimiento?.productoNombre ||
          movimiento?.producto?.sku ||
          movimiento?.producto?.codigo ||
          'Producto';

        return {
          fecha,
          cantidad,
          descripcion: `${tipo === 'SALIDA' ? 'Salida' : 'Entrada'} · ${producto}`,
          signo: tipo === 'SALIDA' ? '-' : '+',
          tipoClass: tipo === 'SALIDA' ? 'salida' as const : 'entrada' as const,
          icono: tipo === 'SALIDA' ? 'south_east' : 'north_east',
        };
      })
      .filter((movimiento): movimiento is MovimientoReciente => Boolean(movimiento.fecha))
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 5);
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

  private toNumber(valor: unknown, defecto = 0): number {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : defecto;
  }
}
