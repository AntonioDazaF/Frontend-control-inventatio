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
  totalItems = 0;
  pageSize = 5;
  currentPage = 0;
  searchTerm = '';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadProductos();
  }

  loadProductos(): void {
    this.api.getProductos().subscribe({
      next: (data) => {
        this.productos = Array.isArray(data) ? data : data.content || [];
        this.totalItems = data.totalElements || this.productos.length;
      },
      error: (err) => console.error('Error cargando productos:', err)
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.loadProductos();
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
