import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-reports-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.css']
})
export class ReportsListComponent implements OnInit {
  cargando = false;
  errorMsg = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    // opcional: podrías cargar algún resumen si lo deseas
  }

  descargarInventarioPDF(): void {
    this.errorMsg = '';
    this.cargando = true;
    this.api.descargarArchivo('/reportes/inventario/pdf', 'reporte_inventario.pdf');
    this.cargando = false;
  }

  descargarMovimientosPDF(): void {
    this.errorMsg = '';
    this.cargando = true;
    this.api.descargarArchivo('/reportes/movimientos/pdf', 'reporte_movimientos.pdf');
    this.cargando = false;
  }

  descargarInventarioExcel(): void {
    this.errorMsg = '';
    this.cargando = true;
    this.api.descargarArchivo('/reportes/inventario/excel', 'reporte_inventario.xlsx', 'excel');
    this.cargando = false;
  }
}
