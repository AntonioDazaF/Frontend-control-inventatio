export interface Movement {
  id?: string;
  tipo: 'ENTRADA' | 'SALIDA';
  productoId: string;
  cantidad: number;
  fechaMovimiento?: Date;
  usuarioResponsable?: string;
}