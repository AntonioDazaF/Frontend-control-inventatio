# 🚀 Frontend – Control de Inventario

Aplicación desarrollada en **Angular 20** (con *standalone components* + **Angular Material**) para gestionar **inventario, movimientos, usuarios, reportes** y monitoreo en tiempo real.  
Consume un backend **REST + WebSockets** en `http://localhost:8080`, protege rutas con **JWT**, muestra dashboards con gráficos y permite descargar reportes **PDF/Excel**.

---

## 🧩 Tecnologías principales

- **Angular 20**, Angular Material y CDK  
- **Standalone routing** (`provideRouter`) + `@angular/ssr`  
- **RxJS**, `ng2-charts` y Chart.js  
- **STOMP** con `@stomp/stompjs` + `sockjs-client` para tiempo real  
- **Node + Express** (via `server.ts`) para SSR

---

## 📦 Requisitos

| Herramienta | Versión sugerida |
|-------------|------------------|
| Node.js     | ≥ 20.11 LTS      |
| npm         | ≥ 10             |
| Angular CLI | `npm install -g @angular/cli@20` |
| Backend     | API/WS en `http://localhost:8080` |

---

## ▶️ Puesta en marcha


npm install
npm start                           # Servidor de desarrollo en http://localhost:4200
npm run build                       # Genera dist/browser y dist/server
npm run serve:ssr:inventory-frontend # SSR en http://localhost:4000


⚙️ Configuración de entorno

ApiService y AuthService usan la URL base http://localhost:8080/api.
Si necesitas otro host, configura environment.ts o variables de entorno antes de compilar.

El interceptor HTTP agrega automáticamente el token guardado en localStorage.

El AuthGuard redirige a /login si no existe JWT o está expirado.

🏗️ Arquitectura funcional
auth / login

Formulario con modo login/registro, validaciones, feedback visual y consumo de AuthService.

layout + shared/components (navbar, sidebar)

Estructura principal para navegación y protección de rutas.

dashboard

Tarjetas + gráficos (bar/pie) consumiendo ApiService.getDashboardResumen() y datos de inventario.

inventory

Listado con paginación, búsqueda local y formulario (alta/edición) vía Reactive Forms.

movements

Tabla paginada de movimientos, filtros por producto y formulario para entradas/salidas.

reports

Descarga de reportes PDF/Excel y gráfico que resume toda la paginación de movimientos.

core

Servicios globales (ApiService, AuthService, WebSocketService), guards e interceptor JWT.

alerts (placeholder)

Preparado para alertas en tiempo real utilizando WebSockets.

🧠 Servicios clave
AuthService

Login/registro

Persistencia y lectura del token (localStorage)

getUserFromToken() para mostrar datos en la UI

ApiService

CRUD de productos, movimientos, dashboard y reportes

Helpers para paginación

Descarga de archivos PDF/Excel

WebSocketService

Conexión a /ws vía SockJS/STOMP

Expone productUpdates$ y alerts$ para recibir eventos en vivo

🔄 Flujos importantes
🔐 Autenticación

LoginComponent → AuthService.login() → guarda token → AuthGuard habilita acceso → interceptor añade Authorization a cada request.

📦 Inventario

InventoryListComponent → /productos/page → búsqueda local → rutas /inventory/new o /inventory/edit/:id → CRUD vía ApiService.

🔁 Movimientos y Reportes

getMovimientosPage con paginación

Resolución de nombres de productos

Formulario para entradas/salidas

ReportsComponent pagina todos los movimientos antes de graficar

⚡ Alertas en tiempo real

Suscripción a /topic/productos y /topic/alertas (observables listos para usar).

🧪 Pruebas y calidad

Unit tests:

npm test


(Karma + Jasmine. Cobertura para guards, interceptor, servicios y componentes base)

Estilo:
Prettier (configurado en package.json) y linter de Angular.

Recomendación:
Añadir pruebas para InventoryListComponent y MovementFormComponent.

🌐 SSR & Despliegue

npm run build genera dist/browser + dist/server.

npm run serve:ssr:inventory-frontend inicia la app renderizada con Express.

Para producción: levantar el servidor Node (ideal con PM2) usando process.env.PORT.
