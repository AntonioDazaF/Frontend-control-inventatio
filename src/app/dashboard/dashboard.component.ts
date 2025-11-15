import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables
} from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { forkJoin, merge, of, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from '../../app/core/services/api.service';
import { WebSocketService } from '../core/services/websocket.service';

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
/**
 * Renderiza la vista principal con métricas resumidas y gráficas del estado
 * del inventario.
 */
export class DashboardComponent implements OnInit, OnDestroy {
  resumen: Partial<DashboardResumen> = {};
  private readonly movimientosPageSize = 100;
  private subscriptions = new Subscription();

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

  constructor(
    private api: ApiService,
    private webSocket: WebSocketService
  ) {}

  /** @inheritDoc */
  ngOnInit(): void {
    this.webSocket.connect();
    this.loadDashboardData();

    const updates$ = merge(
      this.webSocket.productUpdates$,
      this.webSocket.alerts$
    );

    this.subscriptions.add(
      updates$.subscribe(() => this.loadDashboardData())
    );
  }

  /** @inheritDoc */
  ngOnDestroy(): void {
    this.webSocket.disconnect();
    this.subscriptions.unsubscribe();
  }

  /**
   * Calcula la distribución de inventario según la disponibilidad de stock.
   *
   * @param productos Colección de productos del inventario.
   */
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

  /**
   * Convierte un valor arbitrario a número garantizando un valor por defecto.
   *
   * @param valor Entrada a convertir.
   * @param defecto Valor retornado cuando la conversión no es válida.
   */
  private toNumber(valor: unknown, defecto = 0): number {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : defecto;
  }

  /**
   * Solicita al backend la información del dashboard y refresca los datos
   * visualizados.
   */
  private loadDashboardData(): void {
    const dashboardLoad$ = forkJoin({
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
      )
    }).subscribe(({ resumen, productos }) => {
      const distribution = this.calcularDistribucion(productos);
      const totalProductos = resumen?.totalProductos ?? productos.length;
      const movimientos = resumen?.movimientos ?? 0;

      const resumenCalculado: Partial<DashboardResumen> = {
        ...resumen,
        totalProductos,
        movimientos,
        productosDisponibles: distribution.disponibles,
        stockBajo: distribution.stockBajo,
        productosAgotados: distribution.agotados,
        alertasActivas: distribution.stockBajo,
      };

      this.resumen = resumenCalculado;

      this.chartData = {
        ...this.chartData,
        datasets: [
          {
            ...this.chartData.datasets[0],
            data: [
              resumenCalculado.totalProductos ?? 0,
              resumenCalculado.movimientos ?? 0,
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

    this.subscriptions.add(dashboardLoad$);
  }
}
