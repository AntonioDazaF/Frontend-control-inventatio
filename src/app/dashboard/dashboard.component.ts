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

  chartData: BarChartData = {
    labels: ['Productos', 'Movimientos Hoy', 'Alertas'],
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

  private toNumber(valor: unknown, defecto = 0): number {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : defecto;
  }
}
