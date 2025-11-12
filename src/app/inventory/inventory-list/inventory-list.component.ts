import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; 
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.css']
})
export class InventoryListComponent implements OnInit {
  displayedColumns: string[] = [
    'id',
    'nombre',
    'categoria',
    'stock',
    'stockMaximo',
    'estado',
    'precio',
    'acciones'
  ];

  productos: any[] = [];
  private productosPagina: any[] = [];
  totalItems = 0;
  pageSize = 5;
  currentPage = 0;
  searchTerm = '';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadProductos();
  }

  loadProductos(page: number = this.currentPage, size: number = this.pageSize): void {
    this.api.getProductosPage(page, size).subscribe({
      next: (data) => {
        const productos = Array.isArray(data) ? data : data?.content ?? [];
        this.productosPagina = productos.map((producto: any) => ({ ...producto }));

        if (!Array.isArray(data)) {
          this.totalItems = data?.totalElements ?? productos.length;
          this.currentPage = data?.number ?? page;
          this.pageSize = data?.size ?? size;
        } else {
          this.totalItems = productos.length;
          this.currentPage = page;
          this.pageSize = size;
        }

        this.applySearch();
      },
      error: (err) => console.error('Error cargando productos:', err)
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.loadProductos(event.pageIndex, event.pageSize);
  }

  applySearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.productos = term
      ? this.productosPagina.filter((producto) =>
          [producto?.nombre, producto?.categoria]
            .filter((value): value is string => typeof value === 'string')
            .some((value) => value.toLowerCase().includes(term))
        )
      : [...this.productosPagina];
  }

  editar(id: string): void {
    this.router.navigate(['/inventory/edit', id]);
  }

  eliminar(id: string): void {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      this.api.deleteProducto(id).subscribe({
        next: () => this.loadProductos(),
        error: (err) => console.error('Error al eliminar producto:', err)
      });
    }
  }

  getEstado(p: any): string {
    if (p.stock === 0) return 'Agotado';
    if (p.stock < p.minimo) return 'Bajo';
    if (p.stock >= p.minimo && p.stock < p.stockMaximo) return 'Disponible';
    return 'En Stock Máximo';
  }

  getEstadoClass(p: any): string {
    if (p.stock === 0) return 'estado-rojo';
    if (p.stock < p.minimo) return 'estado-naranja';
    if (p.stock >= p.minimo && p.stock < p.stockMaximo) return 'estado-verde';
    return 'estado-azul';
  }
}
