import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
/**
 * Gestiona los formularios de autenticación y registro de usuarios.
 */
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  loading = false;
  isRegisterMode = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  /** @inheritDoc */
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      nombreUsuario: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      nombreUsuario: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      roles: ['', Validators.required]
    });
  }

  /**
   * Alterna entre los modos de inicio de sesión y registro.
   */
  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
  }

  /**
   * Cambia la visibilidad del campo de contraseña.
   */
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  /**
   * Controla el envío del formulario según el modo seleccionado.
   */
  onSubmit(): void {
    if (!this.isRegisterMode) {
      this.login();
    } else {
      this.registerUser();
    }
  }

  /**
   * Envía las credenciales para autenticar al usuario.
   */
  private login(): void {
    if (this.loginForm.invalid) {
      this.snackBar.open('Completa todos los campos', 'Cerrar', { duration: 2500 });
      return;
    }

    this.loading = true;
    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: () => {
        this.snackBar.open('Inicio de sesión exitoso', 'Cerrar', { duration: 2000 });
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.snackBar.open('Credenciales incorrectas', 'Cerrar', { duration: 2500 });
        this.loading = false;
      }
    });
  }

  /**
   * Envía los datos del formulario de registro para crear un nuevo usuario.
   */
  private registerUser(): void {
    if (this.registerForm.invalid) {
      this.snackBar.open('Por favor completa todos los campos correctamente', 'Cerrar', { duration: 2500 });
      return;
    }

    this.loading = true;
    const userData = {
      nombreUsuario: this.registerForm.value.nombreUsuario, 
      password: this.registerForm.value.password,
      roles: [this.registerForm.value.roles] 
    };

    this.authService.register(userData).subscribe({
      next: () => {
        this.snackBar.open('Usuario registrado correctamente', 'Cerrar', { duration: 2000 });
        this.isRegisterMode = false;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Error al registrar usuario', 'Cerrar', { duration: 2500 });
        this.loading = false;
      }
    });
  }
}
