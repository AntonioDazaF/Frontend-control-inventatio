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
type PieChartData = ChartData<'pie'>;

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

  chartData: BarChartData = {
    labels: ['Productos', 'Movimientos Hoy', 'Alertas'],
    datasets: [
      {
        label: 'Totales',
        data: [0, 0, 0],
        backgroundColor: ['#1976d2', '#43a047', '#e53935'],
      },
    ],
  };

  pieData: PieChartData = {
    labels: ['Disponibles', 'Stock Bajo', 'Agotados'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#42a5f5', '#ffb300', '#e53935'],
      },
    ],
  };

  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };
  pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
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
      movimientosHoy: this.cargarMovimientosHoy()
    }).subscribe(({ resumen, productos, movimientosHoy }) => {
      const distribution = this.calcularDistribucion(productos);
      const totalProductos = resumen?.totalProductos ?? productos.length;
      const movimientosTotales = resumen?.movimientos ?? resumen?.movimientosHoy ?? 0;
      const movimientosDelDia = movimientosHoy ?? resumen?.movimientosHoy ?? movimientosTotales;

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

      this.chartData = {
        ...this.chartData,
        datasets: [
          {
            ...this.chartData.datasets[0],
            data: [
              resumenCalculado.totalProductos ?? 0,
              resumenCalculado.movimientosHoy ?? resumenCalculado.movimientos ?? 0,
              resumenCalculado.alertasActivas ?? 0,
            ],
          },
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

  private cargarMovimientosHoy(): Observable<number | null> {
    return this.contarMovimientosHoy().pipe(
      catchError((err) => {
        console.error('Error obteniendo movimientos de hoy', err);
        return of(null);
      })
    );
  }

  private contarMovimientosHoy(
    page = 0,
    pageSize = this.movimientosPageSize,
    acumuladoHoy = 0,
    ids: Set<string> = new Set(),
    procesados = 0
  ): Observable<number> {
    return this.api.getMovimientos(page, pageSize).pipe(
      switchMap((data: any) => {
        const paginaActual = Array.isArray(data) ? data : data?.content || [];

        if (!paginaActual.length) {
          return of(acumuladoHoy);
        }

        let nuevosHoy = 0;
        let procesadosPagina = 0;

        paginaActual.forEach((movimiento: any) => {
          const identificador = this.obtenerIdentificadorMovimiento(movimiento);
          if (identificador && ids.has(identificador)) {
            return;
          }

          if (identificador) {
            ids.add(identificador);
          }

          procesadosPagina += 1;

          if (this.esMovimientoDeHoy(movimiento?.fecha)) {
            nuevosHoy += 1;
          }
        });

        const acumuladoProcesados = procesados + procesadosPagina;
        const size = typeof data?.size === 'number' ? data.size : pageSize;
        const currentPage = typeof data?.number === 'number' ? data.number : page;

        if (Array.isArray(data)) {
          const paginaLlena = paginaActual.length === pageSize;
          if (paginaLlena && procesadosPagina > 0) {
            return this.contarMovimientosHoy(currentPage + 1, pageSize, acumuladoHoy + nuevosHoy, ids, acumuladoProcesados);
          }

          return of(acumuladoHoy + nuevosHoy);
        }

        const totalElements = typeof data?.totalElements === 'number' ? data.totalElements : undefined;
        const totalPages = typeof data?.totalPages === 'number'
          ? data.totalPages
          : totalElements && size
            ? Math.ceil(totalElements / size)
            : undefined;

        const hayMasPaginas = totalPages !== undefined && currentPage + 1 < totalPages;
        const faltanElementos = totalElements !== undefined && acumuladoProcesados < totalElements;
        const paginaLlena = paginaActual.length === size;
        const seAgregaronNuevos = procesadosPagina > 0;

        if (hayMasPaginas || faltanElementos || (paginaLlena && seAgregaronNuevos)) {
          return this.contarMovimientosHoy(currentPage + 1, size, acumuladoHoy + nuevosHoy, ids, acumuladoProcesados);
        }

        return of(acumuladoHoy + nuevosHoy);
      }),
      catchError((err) => {
        console.error('Error contando movimientos de hoy', err);
        return of(acumuladoHoy);
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

  private toNumber(valor: unknown, defecto = 0): number {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : defecto;
  }
}
