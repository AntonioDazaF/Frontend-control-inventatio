import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-movement-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule
  ],
  templateUrl: './movement-form.component.html',
  styleUrls: ['./movement-form.component.css']
})
export class MovementFormComponent implements OnInit {
  form!: FormGroup;
  productos: any[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private snackBar: MatSnackBar // ✅ asegurarse que sea MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      tipo: ['', Validators.required],
      productoId: ['', Validators.required],
      cantidad: [0, [Validators.required, Validators.min(1)]],
      observacion: ['']
    });

    this.loadProductos();
  }

  loadProductos(): void {
    this.api.getProductos().subscribe({
      next: (data) => (this.productos = Array.isArray(data) ? data : data.content || []),
      error: (err) => console.error('Error cargando productos:', err)
    });
  }

  save(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.api.createMovimiento(this.form.value).subscribe({
      next: () => {
        this.snackBar.open('Movimiento registrado correctamente', 'Cerrar', { duration: 2500 });
        this.router.navigate(['/movements']);
      },
      error: (err) => {
        console.error('Error guardando movimiento', err);
        this.snackBar.open('Error al registrar movimiento', 'Cerrar', { duration: 2500 });
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/movements']);
  }
}
