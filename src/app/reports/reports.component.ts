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
  private chart?: Chart;
  private readonly pageSize = 100;
  private movimientoIds = new Set<string>();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarResumen();
  }

  cargarResumen(): void {
    this.movimientosData = [];
    this.movimientoIds.clear();
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }

    this.cargarPaginaMovimientos();
  }

  private cargarPaginaMovimientos(page: number = 0): void {
    this.api.getMovimientos(page, this.pageSize).subscribe({
      next: (data: any) => {
        const paginaActual = Array.isArray(data) ? data : data.content || [];

        if (!paginaActual.length) {
          this.renderChart();
          return;
        }

        const nuevosMovimientos = paginaActual.filter((movimiento: any) => {
          const identificador = this.obtenerIdentificadorMovimiento(movimiento);
          if (!identificador) {
            return true;
          }
          if (this.movimientoIds.has(identificador)) {
            return false;
          }
          this.movimientoIds.add(identificador);
          return true;
        });

        this.movimientosData.push(...nuevosMovimientos);

        if (Array.isArray(data)) {
          this.renderChart();
          return;
        }

        const totalElements = typeof data.totalElements === 'number' ? data.totalElements : undefined;
        const totalPages = typeof data.totalPages === 'number'
          ? data.totalPages
          : totalElements && data.size
            ? Math.ceil(totalElements / data.size)
            : undefined;
        const currentPage = typeof data.number === 'number' ? data.number : page;

        const hayMasPaginas = totalPages !== undefined && currentPage + 1 < totalPages;
        const faltanElementos = totalElements !== undefined && this.movimientosData.length < totalElements;
        const paginaLlena = paginaActual.length === (data.size ?? this.pageSize);
        const seAgregaronNuevos = nuevosMovimientos.length > 0;

        if (hayMasPaginas || faltanElementos || (paginaLlena && seAgregaronNuevos)) {
          this.cargarPaginaMovimientos(currentPage + 1);
        } else {
          this.renderChart();
        }
      },
      error: (err) => {
        console.error('Error cargando reportes:', err);
        this.renderChart();
      }
    });
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
      return `ref:${movimiento.productoId}-${movimiento.fecha}-${movimiento.tipo ?? ''}`;
    }

    return null;
  }

  renderChart(): void {
    const ctx = document.getElementById('movimientosChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const totales = this.movimientosData.reduce((acc, movimiento) => {
      const tipo = (movimiento?.tipo || '').toUpperCase();
      if (tipo === 'ENTRADA') {
        acc.entradas += 1;
      } else if (tipo === 'SALIDA') {
        acc.salidas += 1;
      }
      return acc;
    }, { entradas: 0, salidas: 0 });

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Entradas', 'Salidas'],
        datasets: [{
          label: 'Movimientos',
          data: [totales.entradas, totales.salidas],
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
