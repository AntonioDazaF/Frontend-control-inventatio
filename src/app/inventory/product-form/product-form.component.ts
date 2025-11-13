import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../../core/services/api.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-form',
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
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
/**
 * Permite crear o editar productos del inventario, gestionando validaciones y
 * notificaciones al usuario.
 */
export class ProductFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  categorias = ['Tecnología', 'Electrónica', 'Hogar', 'Ropa', 'Alimentos', 'Accesorios'];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  /** @inheritDoc */
  ngOnInit(): void {
    this.form = this.fb.group({
      id: [null],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      categoria: ['', Validators.required],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      minimo: [0, [Validators.required, Validators.min(0)]],
      stockMaximo: [0, [Validators.required, Validators.min(0)]],
      sku: [''],
      descripcion: ['']
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.loadProducto(id);
    }
  }

  /**
   * Carga en el formulario los datos de un producto existente.
   *
   * @param id Identificador del producto a consultar.
   */
  loadProducto(id: string): void {
    this.api.getProducto(id).subscribe({
      next: (data) => {
        this.form.patchValue({
          ...data,
          precioUnitario: Number(data.precioUnitario),
          stock: Number(data.stock),
          minimo: Number(data.minimo),
          stockMaximo: Number(data.stockMaximo)
        });
      },
      error: (err) => {
        console.error('Error cargando producto', err);
        this.snackBar.open('Error al cargar producto', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Convierte a numéricos los campos que lo requieren antes de enviar al
   * backend.
   */
  private ensureNumericValues(): void {
    ['precioUnitario', 'stock', 'minimo', 'stockMaximo'].forEach((key) => {
      const control = this.form.get(key);
      if (control && control.value !== null && control.value !== '' && !isNaN(control.value)) {
        control.setValue(Number(control.value));
      }
    });
  }

  /**
   * Verifica si un control tiene un error específico para mostrar mensajes.
   *
   * @param controlName Nombre del control en el formulario.
   * @param errorName Identificador del error a evaluar.
   */
  hasError(controlName: string, errorName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.hasError(errorName) && (control.dirty || control.touched));
  }

  /**
   * Envía el formulario creando o actualizando el producto en el backend.
   */
  save(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.ensureNumericValues();
    const dto = {
      ...this.form.value,
      precioUnitario: Number(this.form.value.precioUnitario),
      stock: Number(this.form.value.stock),
      minimo: Number(this.form.value.minimo),
      stockMaximo: Number(this.form.value.stockMaximo)
    };

    console.log('Datos enviados al backend:', dto);

    const request = this.isEdit
      ? this.api.updateProducto(this.form.value.id, dto)
      : this.api.createProducto(dto);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Producto actualizado correctamente' : 'Producto creado correctamente',
          'Cerrar',
          { duration: 2500 }
        );
        this.router.navigate(['/inventory']);
      },
      error: (err) => {
        console.error('Error guardando producto', err);
        this.snackBar.open('Error al guardar el producto', 'Cerrar', { duration: 3000 });
      },
      complete: () => (this.loading = false)
    });
  }

  /**
   * Cancela la edición y regresa al listado de inventario.
   */
  cancel(): void {
    this.router.navigate(['/inventory']);
  }
}
