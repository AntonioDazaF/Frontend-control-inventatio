export interface DashboardSummary {
  totalProductos: number;
  stockBajo: number;
  totalMovimientos: number;
  alertasActivas: number;
  topProductosVendidos?: { nombre: string; cantidad: number }[];
}