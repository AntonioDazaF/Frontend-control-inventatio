export interface Alert {
  id?: string;
  mensaje: string;
  severidad: 'CRITICA' | 'ADVERTENCIA' | 'INFORMACION';
  estado: 'ACTIVA' | 'RESUELTA';
  fechaCreacion?: Date;
}