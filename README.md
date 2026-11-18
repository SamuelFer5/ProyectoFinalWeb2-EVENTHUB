# EventHub - Proyecto Final Web II

Plataforma Full Stack para la publicacion, administracion y reservacion de eventos.

Equipo: Samuel Fernandez Ramirez y Alejandro Corrales Rivera.

## Arquitectura general

El proyecto esta organizado de forma modular y separada por responsabilidades:

```
ProyectoFinalWeb2-EVENTHUB/
  backend/        API REST en Node.js + Express 5 + MongoDB (Mongoose)
  frontend/       Aplicacion Nuxt 4 + Vue 3 (segunda fase)
  serverless/     Cloudflare Worker para reportes y Cron Triggers (segunda fase)
```

### Capas del backend

```
backend/src/
  config/         Variables de entorno y conexion a MongoDB
  models/         Esquemas y modelos de Mongoose
  repositories/   Consultas directas a base de datos
  services/       Logica de negocio e integraciones (correo, almacenamiento)
  controllers/    Manejo de peticiones y respuestas HTTP
  routes/         Definicion de endpoints y middlewares por ruta
  middlewares/    Autenticacion, roles, validacion, rate limit, logs y errores
  validators/     Esquemas de validacion con Zod
  utils/          Utilidades reutilizables (HttpError, tokens, paginacion)
  docs/           Especificacion OpenAPI para Swagger UI y Scalar
```

## Requisitos locales

- Node.js 24+
- MongoDB local o MongoDB Atlas

## Instalacion y ejecucion (Backend)

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Documentacion interactiva disponible al iniciar el servidor:
- Swagger UI: `http://localhost:3000/docs`
- Scalar: `http://localhost:3000/docs/scalar`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

## Pruebas automatizadas

Las pruebas corren con Jest y Supertest usando una base de datos separada (`MONGODB_URI_TEST`).

```bash
cd backend
npm test
```

## Division del desarrollo

### Primera mitad (completada en el backend base)
- Estructura modular de Express, middlewares globales (Helmet, CORS, rate limit, logger, validacion Zod y manejo centralizado de errores).
- Autenticacion completa: registro, login, Argon2, JWT access + refresh tokens con sesiones en MongoDB, Google OAuth 2.0, verificacion de correo y recuperacion de contrasena con Resend.
- Usuarios y autorizacion por roles (`admin`, `organizer`, `attendee`).
- Gestion de categorias y eventos con filtros, paginacion y subida de imagenes a almacenamiento S3/R2.
- Documentacion OpenAPI (Swagger + Scalar) y pruebas unitarias y de integracion de estos modulos.

### Segunda mitad (pendiente para la siguiente entrega)
- Reservaciones con control atomico de concurrencia en MongoDB y entradas digitales con codigo QR de un solo uso.
- Comentarios, calificaciones y moderacion.
- Dashboards de organizador y administrador con agregaciones de MongoDB.
- Funcion serverless (Cloudflare Worker + R2 + Cron Trigger) para reportes automaticos y recordatorios.
- Frontend completo en Nuxt 4 y despliegue publico.
