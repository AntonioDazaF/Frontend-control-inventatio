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
export class ReportsComponent implements OnInit {
  movimientosData: any[] = [];
  private chart?: Chart;
  private readonly pageSize = 100;
  private movimientoIds = new Set<string>();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
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

      const stock = this.toNumber(producto?.stock);
      const minimo = this.toNumber(producto?.minimo);
      const precio = this.toNumber(producto?.precioUnitario);

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
      const tipo = (movimiento?.tipo || '').toUpperCase();
      if (filtroTipo && tipo !== filtroTipo) {
        return;
      }

      const fecha = this.parseFecha(movimiento?.fecha);
      if (!fecha) {
        return;
      }

      const clave = fecha.toISOString().slice(0, 10);
      if (!mapa.has(clave)) {
        mapa.set(clave, { entradas: 0, salidas: 0 });
      }

      const registro = mapa.get(clave)!;
      const cantidad = usarCantidad ? this.toNumber(movimiento?.cantidad, 0) : 1;

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
      entradas: ultimas.map((clave) => mapa.get(clave)?.entradas ?? 0),
      salidas: ultimas.map((clave) => mapa.get(clave)?.salidas ?? 0),
    };
  }

  private agruparPorProducto(movimientos: any[], tipo: 'ENTRADA' | 'SALIDA') {
    if (!Array.isArray(movimientos)) {
      return { labels: [], valores: [] };
    }

    const mapa = new Map<string, number>();

    movimientos.forEach((movimiento) => {
      if ((movimiento?.tipo || '').toUpperCase() !== tipo) {
        return;
      }

      const producto =
        movimiento?.producto?.nombre ||
        movimiento?.productoNombre ||
        movimiento?.producto?.sku ||
        movimiento?.producto?.codigo ||
        'Producto';

      const cantidad = this.toNumber(movimiento?.cantidad, 0);
      mapa.set(producto, (mapa.get(producto) ?? 0) + cantidad);
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
}
