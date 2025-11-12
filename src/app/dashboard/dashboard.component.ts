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
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from '../../app/core/services/api.service';

type BarChartData = ChartData<'bar'>;
type PieChartData = ChartData<'pie'>;

interface DashboardResumen {
  totalProductos: number;
  movimientos: number;
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

  chartData: BarChartData = {
    labels: ['Productos', 'Movimientos', 'Alertas'],
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
      resumen: this.api.get<DashboardResumen>('dashboard/resumen').pipe(
        catchError((error) => {
          console.error('Error cargando resumen', error);
          return of<Partial<DashboardResumen>>({});
        })
      ),
      movimientos: this.api.getMovimientosPage(0, 1).pipe(
        catchError((error) => {
          console.error('Error cargando movimientos', error);
          return of([]);
        })
      ),
      productos: this.api.getProductos().pipe(
        catchError((error) => {
          console.error('Error cargando productos', error);
          return of([]);
        })
      ),
    })
      .pipe(
        map(({ resumen, movimientos, productos }) => {
          const movimientosData = Array.isArray(movimientos)
            ? movimientos
            : movimientos?.content ?? [];
          const totalMovimientos = Array.isArray(movimientos)
            ? movimientos.length
            : movimientos?.totalElements ?? movimientosData.length ?? 0;

          const productosData = Array.isArray(productos)
            ? productos
            : productos?.content ?? [];

          const distribution = productosData.reduce(
            (acc: InventoryDistribution, producto: any) => {
              const stock = Number(producto?.stock ?? 0);
              const minimo = Number(producto?.minimo ?? 0);

              if (stock <= 0) {
                acc.agotados += 1;
              } else if (stock <= minimo) {
                acc.stockBajo += 1;
              } else {
                acc.disponibles += 1;
              }

              return acc;
            },
            { disponibles: 0, stockBajo: 0, agotados: 0 } as InventoryDistribution
          );

          const totalProductos =
            resumen?.totalProductos ?? productosData.length ?? 0;

          return {
            resumen: {
              ...resumen,
              totalProductos,
              movimientos: totalMovimientos,
              productosDisponibles:
                resumen?.productosDisponibles ?? distribution.disponibles,
              stockBajo: resumen?.stockBajo ?? distribution.stockBajo,
              productosAgotados:
                resumen?.productosAgotados ?? distribution.agotados,
            },
            chartData: {
              labels: this.chartData.labels,
              datasets: [
                {
                  ...this.chartData.datasets[0],
                  data: [
                    totalProductos,
                    totalMovimientos,
                    resumen?.alertasActivas ?? 0,
                  ],
                },
              ],
            },
            pieData: {
              labels: this.pieData.labels,
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
            },
          };
        })
      )
      .subscribe(({ resumen, chartData, pieData }) => {
        this.resumen = resumen;
        this.chartData = chartData;
        this.pieData = pieData;
      });
  }
}
