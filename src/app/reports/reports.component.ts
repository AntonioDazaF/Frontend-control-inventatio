import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../app/core/services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  movimientosData: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarResumen();
  }

  cargarResumen(): void {
    this.api.getMovimientos().subscribe({
      next: (data: any) => {
        this.movimientosData = Array.isArray(data) ? data : data.content || [];
        this.renderChart();
      },
      error: (err) => {
        console.error('Error cargando reportes:', err);
      }
    });
  }

  renderChart(): void {
    const ctx = document.getElementById('movimientosChart') as HTMLCanvasElement;
    if (!ctx) return;

    const entradas = this.movimientosData.filter(m => m.tipo === 'ENTRADA').length;
    const salidas = this.movimientosData.filter(m => m.tipo === 'SALIDA').length;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Entradas', 'Salidas'],
        datasets: [{
          label: 'Movimientos',
          data: [entradas, salidas],
          backgroundColor: ['#42a5f5', '#ef5350']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Movimientos Totales'
          },
          legend: {
            display: false
          }
        }
      }
    });
  }

  descargarInventarioPDF(): void {
    this.api.descargarArchivo('/api/reportes/inventario/pdf', 'inventario.pdf');
  }

  descargarMovimientosPDF(): void {
    this.api.descargarArchivo('/api/reportes/movimientos/pdf', 'movimientos.pdf');
  }

  descargarInventarioExcel(): void {
    this.api.descargarArchivo('/api/reportes/inventario/excel', 'inventario.xlsx');
  }
}
