export interface Product {
  id?: string;
  nombre: string;
  categoria: string;
  sku: string;
  stock: number;
  precioUnitario: number;
  descripcion?: string;
  fechaRegistro?: Date;
}