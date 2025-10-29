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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  loading = false;
  isRegisterMode = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      nombreUsuario: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      nombreUsuario: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      roles: ['OPERADOR', Validators.required] // valor por defecto
    });
  }

  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
  }

  onSubmit(): void {
    if (this.isRegisterMode) {
      this.registerUser();
    } else {
      this.loginUser();
    }
  }

private loginUser(): void {
  if (this.loginForm.invalid) {
    this.snackBar.open('Completa todos los campos', 'Cerrar', { duration: 2500 });
    return;
  }

  this.loading = true;
  const credentials = this.loginForm.value;

  this.authService.login(credentials).subscribe({
    next: (response) => {
      this.snackBar.open('Inicio de sesión exitoso', 'Cerrar', { duration: 2000 });

      
      if (response && response.token) {
        this.authService.setToken(response.token);
      }

      
      this.loading = false;
      this.router.navigate(['/dashboard']);
    },
    error: () => {
      this.snackBar.open('Credenciales incorrectas', 'Cerrar', { duration: 2500 });
      this.loading = false; 
    }
  });
}

  private registerUser(): void {
    if (this.registerForm.invalid) {
      this.snackBar.open('Por favor completa todos los campos correctamente', 'Cerrar', { duration: 2500 });
      return;
    }

    const { password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.snackBar.open('Las contraseñas no coinciden', 'Cerrar', { duration: 2500 });
      return;
    }

    this.loading = true;

    this.authService.register(this.registerForm.value).subscribe({
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