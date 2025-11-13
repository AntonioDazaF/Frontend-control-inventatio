# Frontend Control de Inventario

Aplicación Angular (standalone components + Angular Material) para gestionar inventario, movimientos, usuarios y reportes de un almacén. Consume un backend REST/WS en `http://localhost:8080`, muestra tableros con charts, protege rutas con JWT y soporta descargas de reportes PDF/Excel.

## 🚀 Tecnologías principales

- **Angular 20** + Angular Material y CDK
- Standalone routing (`provideRouter`) y `@angular/ssr` para renderizado híbrido
- **RxJS** y `ng2-charts`/Chart.js para datos y visualizaciones
- **STOMP** (`@stomp/stompjs` + `sockjs-client`) para alertas/productos en tiempo real
- **Express** (via `server.ts`) para servir la app SSR en Node

## 📋 Requisitos

| Herramienta | Versión sugerida |
|-------------|------------------|
| Node.js     | ≥ 20.11 LTS      |
| npm         | ≥ 10             |
| Angular CLI | `npm install -g @angular/cli@20` |
| Backend     | API/WS disponible en `http://localhost:8080` |

## ⚡ Puesta en marcha
```bash
npm install
npm start          # ng serve en http://localhost:4200
npm run build      # genera dist/browser y dist/server
npm run serve:ssr:inventory-frontend  # sirve build SSR en http://localhost:4000
```

## ⚙️ Configuración de entorno

El `ApiService` y el `AuthService` tienen la URL base embebida (`http://localhost:8080/api`). Si necesitas otro host, crea un `environment.ts` o usa variables de entorno para sobreescribirla antes de construir.

El interceptor HTTP agrega automáticamente el token almacenado en `localStorage`. El guard `AuthGuard` rerutea a `/login` si el token falta o es corto.

## 🏗️ Arquitectura funcional

| Módulo | Responsabilidad |
|--------|-----------------|
| **auth/login** | Formulario dual (login/registro) con validaciones, feedback y alternancia de vista. Consume `AuthService` para login/registro y guarda token/usuario. |
| **layout** + `shared/components/navbar/sidebar` | Estructura principal de la app con navegación lateral y superior. |
| **dashboard** | Resumen visual (tarjetas + bar/pie charts) usando `ApiService.getDashboardResumen()` y datos de productos para calcular distribución de stock. |
| **inventory** | Listado paginado con búsqueda local y form reactivo para alta/edición. Usa `ApiService` para CRUD y muestra estados calculados (agotado, bajo, etc.). |
| **movements** | Tabla paginada de movimientos, filtro por producto, obtención del usuario autenticado desde el JWT y formulario para registrar entradas/salidas. |
| **reports** | Descarga de reportes PDF/Excel y gráfico que agrega todas las páginas de movimientos antes de renderizar el resumen. |
| **core** | Servicios reutilizables (`ApiService`, `AuthService`, `WebSocketService`), guards e interceptor que centralizan autenticación/comunicación. |
| **alerts** (placeholder) | Espacio para futuras alertas en tiempo real, ya soportadas por `WebSocketService`. |

## 🔧 Servicios clave

### AuthService
- Login/registro, persistencia y lectura de token/JWT (`localStorage`)
- `getUserFromToken()` decodifica el payload para mostrar el usuario en UI

### ApiService
- Capa única para Productos, Movimientos, Dashboard, Reportes y Alertas simuladas
- Incluye helpers para paginación flexible y descargas de archivos

### WebSocketService
- Conecta a `/ws` vía SockJS/STOMP
- Expone `productUpdates$` y `alerts$` como Subjects para que cualquier componente reciba eventos en vivo

## 🔄 Flujos destacados

**Autenticación:**  
`LoginComponent` → `AuthService.login()` → token guardado → `AuthGuard` permite el acceso a la `LayoutComponent`; el interceptor agrega `Authorization` en cada request.

**Inventario:**  
`InventoryListComponent` pide `/productos/page`, permite búsqueda local, abre el formulario en rutas `/inventory/new` o `/inventory/edit/:id`, y emite CRUD vía `ApiService`.

**Movimientos/Reportes:**  
La lista hace `getMovimientosPage`, resuelve nombres de productos y ofrece navegación a un formulario que registra entradas/salidas. `ReportsComponent` pagina todos los movimientos antes de graficar y expone descargas directas de reportes.

**Alertas en tiempo real (opcional):**  
Conectar `WebSocketService` desde dashboard/listados para reaccionar a `/topic/productos` y `/topic/alertas` (ya expuestos como observables).

## 🧪 Pruebas y calidad

- **Unit tests:** `npm test` (Karma + Jasmine). Existen specs básicos para guards, interceptor, componentes clave y servicios (`*.spec.ts`)
- **Estilo:** se usa Prettier (config en `package.json`) y el linter de Angular CLI (ejecutar `ng lint` si se habilita)
- **Recomendaciones:** añadir pruebas para `InventoryListComponent` y `MovementFormComponent` al cubrir flujos de paginación/formulario; crear mocks del `ApiService`

## 🌐 SSR y despliegue

1. `npm run build` genera `dist/browser` y `dist/server`
2. Ejecuta `npm run serve:ssr:inventory-frontend` para probar la build renderizada por Express (`src/server.ts`)
3. Para producción, despliega los artefactos y levanta el servidor Node (puedes usar PM2; el archivo ya maneja `process.env.PORT`)

## 📝 Próximos pasos sugeridos

- [ ] Externalizar las URLs del backend mediante `environment.*.ts` o variables de entorno
- [ ] Documentar colecciones de Postman/Swagger del backend y enlazarlas desde este README
- [ ] Añadir un diagrama simple (PlantUML o Mermaid) que muestre el flujo Auth → Layout → Módulos para complementar la explicación textual

---

**¡Listo para usar!** 🎉 Cualquier duda o sugerencia, no dudes en abrir un issue.
