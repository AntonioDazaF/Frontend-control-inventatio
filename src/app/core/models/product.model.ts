export interface Product {
  id?: string;
  nombre: string;
  categoria: string;
  sku: string;
  stock: number;
  precio: number;
  descripcion?: string;
  fechaRegistro?: Date;
}