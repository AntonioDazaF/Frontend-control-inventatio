Frontend – Control de Inventario

Aplicación desarrollada en Angular con componentes standalone y Angular Material para gestionar inventario, movimientos, usuarios y reportes. Consume un backend REST/WebSocket en http://localhost:8080, ofrece tableros visuales con gráficos, protege rutas mediante JWT y permite descargas de reportes en PDF y Excel.

Tecnologías principales

Angular 20 + Angular Material + CDK

Enrutamiento standalone (provideRouter) y Renderizado Híbrido con @angular/ssr

RxJS y Chart.js / ng2-charts para visualización de datos

STOMP + SockJS para actualizaciones en tiempo real

Express (via server.ts) para servir la versión SSR en Node.js

Requisitos
Herramienta	Versión recomendada
Node.js	≥ 20.11 LTS
npm	≥ 10
Angular CLI	@angular/cli@20
Backend	API/WS disponible en http://localhost:8080
Puesta en marcha
npm install
npm start                     # ng serve → http://localhost:4200
npm run build                 # genera dist/browser y dist/server
npm run serve:ssr:inventory-frontend   # SSR → http://localhost:4000

Configuración de entorno

ApiService y AuthService usan como base http://localhost:8080/api.

Para cambiar el host, crea un environment.ts o usa variables de entorno antes de construir.

El interceptor HTTP agrega automáticamente el token desde localStorage.

AuthGuard redirige a /login si el token no existe o es inválido.

Arquitectura funcional
Módulo	Responsabilidad
auth/login	Formulario dual (login/registro) con validaciones, feedback y alternancia de vista. Maneja token y usuario mediante AuthService.
layout + shared/components/navbar + sidebar	Layout principal y navegación de la aplicación protegida.
dashboard	Resumen visual del inventario (tarjetas + gráficos). Consume ApiService.getDashboardResumen().
inventory	Listado paginado, búsqueda local y formulario reactivo para crear/editar productos. Usa CRUD de ApiService.
movements	Tabla paginada de movimientos, filtros, obtención del usuario desde JWT y formulario para entradas/salidas.
reports	Descarga de reportes PDF/Excel y gráfico que compila todos los movimientos antes de generar el resumen.
core	Servicios globales (ApiService, AuthService, WebSocketService), guards e interceptor central de autenticación.
alerts (placeholder)	Espacio para futuras alertas en tiempo real mediante WebSocketService.
Servicios clave
AuthService

Login y registro

Persistencia y lectura del token JWT (localStorage)

getUserFromToken() para obtener datos del usuario en UI

ApiService

Capa unificada para Productos, Movimientos, Dashboard, Reportes y Alertas

Helpers para paginación

Descarga de archivos PDF/Excel

WebSocketService

Conexión a /ws mediante SockJS/STOMP

Expone productUpdates$ y alerts$ como observables para eventos en tiempo real

Flujos destacados
Autenticación

LoginComponent → AuthService.login() → guardado del token → AuthGuard permite acceso al layout → interceptor adjunta el token en cada petición.

Inventario

InventoryListComponent consulta /productos/page, permite búsqueda, abre formulario en /inventory/new o /inventory/edit/:id, y ejecuta CRUD mediante ApiService.

Movimientos y Reportes

El listado usa getMovimientosPage, resuelve nombres de productos y navega a un formulario para registrar entradas/salidas.
ReportsComponent agrega todas las páginas de movimientos antes de graficar y permite descargas directas de reportes.

Alertas en tiempo real (opcional)

Cualquier componente puede suscribirse a /topic/productos y /topic/alertas usando WebSocketService.

Pruebas y calidad

Unit tests: npm test (Karma + Jasmine)

Prettier configurado en package.json

Linter de Angular (ng lint, si está habilitado)

Recomendación: agregar pruebas para InventoryListComponent y MovementFormComponent con mocks del ApiService

SSR y despliegue

npm run build genera dist/browser y dist/server

npm run serve:ssr:inventory-frontend levanta la build SSR desde server.ts

Para producción: desplegar artefactos y ejecutar servidor Node (ej. con PM2)

server.ts ya respeta process.env.PORT

