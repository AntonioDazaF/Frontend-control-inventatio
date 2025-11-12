import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-movements-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './movement-list.component.html',
  styleUrls: ['./movement-list.component.css']
})
export class MovementListComponent implements OnInit {
  displayedColumns: string[] = ['fecha', 'tipo', 'producto', 'cantidad', 'usuario'];
  movimientos: any[] = [];
  private movimientosPagina: any[] = [];
  searchTerm = '';
  usuarioActual: string | null = null;
  totalMovimientos = 0;
  pageSize = 10;
  pageIndex = 0;
  readonly pageSizeOptions = [10, 25, 50, 100];
  tipoFiltro: 'todos' | 'entrada' | 'salida' = 'todos';

  constructor(
    private api: ApiService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Obtener el usuario autenticado desde el token
    this.usuarioActual = this.authService.getUserFromToken();
    this.loadMovimientos();
  }

  loadMovimientos(page: number = this.pageIndex, size: number = this.pageSize): void {
    this.api.getMovimientosPage(page, size).subscribe({
      next: (data) => {
        const movimientos = Array.isArray(data) ? data : data.content || [];
        this.movimientosPagina = movimientos.map((m: any) => ({ ...m }));

        if (!Array.isArray(data)) {
          this.totalMovimientos = data.totalElements ?? movimientos.length;
          this.pageIndex = data.number ?? page;
          this.pageSize = data.size ?? size;
        } else {
          this.totalMovimientos = movimientos.length;
          this.pageIndex = page;
          this.pageSize = size;
        }

        this.aplicarFiltro();
        this.resolveProductos();
      },
      error: (err) => console.error('Error cargando movimientos:', err)
    });
  }

  private resolveProductos(): void {
    this.api.getProductos().subscribe({
      next: (productos) => {
        this.movimientosPagina.forEach((m) => {
          if (typeof m.producto === 'string' || !m.producto) {
            const prod = productos.find((p: any) => p.id === m.productoId || p.id === m.producto);
            m.producto = prod ? prod : { nombre: '—' };
          }
        });
        this.aplicarFiltro();
      },
      error: () => this.aplicarFiltro()
    });
  }

  filtrar(): void {
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.movimientos = this.movimientosPagina.filter((m) => {
      const nombre = (m.producto?.nombre || m.productoNombre || '').toLowerCase();
      const coincideBusqueda = term ? nombre.includes(term) : true;
      const tipo = (m.tipo || '').toUpperCase();
      const coincideTipo =
        this.tipoFiltro === 'todos'
          ? true
          : this.tipoFiltro === 'entrada'
            ? tipo === 'ENTRADA'
            : tipo === 'SALIDA';

      return coincideBusqueda && coincideTipo;
    });
  }

  cambiarPagina(evento: PageEvent): void {
    this.pageIndex = evento.pageIndex;
    this.pageSize = evento.pageSize;
    this.loadMovimientos(evento.pageIndex, evento.pageSize);
  }

  nuevoMovimiento(): void {
    this.router.navigate(['/movements/new']);
  }

  cambiarFiltro(tipo: 'todos' | 'entrada' | 'salida'): void {
    this.tipoFiltro = tipo;
    this.aplicarFiltro();
  }
}
