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
    this.api.get<DashboardResumen>('dashboard/resumen').subscribe({
      next: (data: DashboardResumen) => {
        this.resumen = data;

        this.chartData = {
          ...this.chartData,
          datasets: [
            {
              ...this.chartData.datasets[0],
              data: [
                data.totalProductos ?? 0,
                data.movimientos ?? 0,
                data.alertasActivas ?? 0,
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
                data.productosDisponibles ?? 0,
                data.stockBajo ?? 0,
                data.productosAgotados ?? 0,
              ],
            },
          ],
        };
      },
      error: (err: unknown) => console.error('Error cargando resumen', err),
    });
  }
}
