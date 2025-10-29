export interface User {
  id?: string;
  nombreUsuario: string;
  correo?: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'OPERADOR';
  token?: string;
}