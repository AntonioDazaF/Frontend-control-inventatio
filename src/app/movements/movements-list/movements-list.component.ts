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
    FormsModule,
    RouterModule
  ],
  templateUrl: './movement-list.component.html',
  styleUrls: ['./movement-list.component.css']
})
export class MovementListComponent implements OnInit {
  displayedColumns: string[] = ['id', 'producto', 'tipo', 'cantidad', 'fecha', 'usuario'];
  movimientos: any[] = [];
  searchTerm = '';
  usuarioActual: string | null = null;

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

  loadMovimientos(): void {
  this.api.getMovimientos().subscribe({
    next: (data) => {
      this.movimientos = Array.isArray(data) ? data : data.content || [];

      // Si el producto llega como ID, intenta mapearlo al nombre
      this.api.getProductos().subscribe((productos) => {
        this.movimientos.forEach((m) => {
          if (typeof m.producto === 'string' || !m.producto) {
            const prod = productos.find((p: any) => p.id === m.productoId || p.id === m.producto);
            m.producto = prod ? prod : { nombre: '—' };
          }
        });
      });
    },
    error: (err) => console.error('Error cargando movimientos:', err)
  });
}


  filtrar(): void {
    const term = this.searchTerm.toLowerCase();
    this.movimientos = this.movimientos.filter((m) =>
      m.producto?.nombre?.toLowerCase().includes(term)
    );
  }

  nuevoMovimiento(): void {
    this.router.navigate(['/movements/new']);
  }
}
