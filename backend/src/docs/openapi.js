const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'EventHub API',
    version: '1.0.0',
    description:
      'API REST de EventHub para la gestion de usuarios, categorias, eventos y reservaciones.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor local',
    },
  ],
  tags: [
    { name: 'Sistema', description: 'Estado del servicio' },
    { name: 'Autenticacion', description: 'Registro, login, JWT, sesiones, OAuth y recuperacion' },
    { name: 'Usuarios', description: 'Perfil y administracion de usuarios y roles' },
    { name: 'Categorias', description: 'Catalogo y administracion de categorias' },
    { name: 'Eventos', description: 'Publicacion, busqueda y administracion de eventos' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          requestId: { type: 'string' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'organizer', 'attendee'] },
          authProvider: { type: 'string', enum: ['local', 'google'] },
          isEmailVerified: { type: 'boolean' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      Event: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          category: { $ref: '#/components/schemas/Category' },
          imageUrl: { type: 'string' },
          location: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          capacity: { type: 'integer' },
          availableSpots: { type: 'integer' },
          price: { type: 'number' },
          status: { type: 'string', enum: ['draft', 'published', 'cancelled', 'completed'] },
          averageRating: { type: 'number' },
          reviewsCount: { type: 'integer' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Verificar estado de la API',
        responses: {
          200: { description: 'Servicio operativo' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Autenticacion'],
        summary: 'Registrar usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Samuel Fernandez' },
                  email: { type: 'string', format: 'email', example: 'samuel@eventhub.cr' },
                  password: { type: 'string', example: 'Segura1234!' },
                  role: { type: 'string', enum: ['attendee', 'organizer'], default: 'attendee' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuario registrado y correo de verificacion enviado' },
          400: { description: 'Datos invalidos' },
          409: { description: 'Correo ya registrado' },
        },
      },
    },
    '/api/auth/verify-email': {
      post: {
        tags: ['Autenticacion'],
        summary: 'Verificar correo electronico con token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: { token: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Correo verificado' },
          400: { description: 'Token invalido o expirado' },
        },
      },
    },
    '/api/auth/resend-verification': {
      post: {
        tags: ['Autenticacion'],
        summary: 'Reenviar correo de verificacion',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Solicitud procesada' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Autenticacion'],
        summary: 'Iniciar sesion con correo y contrasena',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Access token y refresh token emitidos' },
          401: { description: 'Credenciales invalidas' },
          403: { description: 'Cuenta sin verificar o inactiva' },
        },
      },
    },
    '/api/auth/google': {
      post: {
        tags: ['Autenticacion'],
        summary: 'Iniciar sesion con Google OAuth 2.0 (ID Token)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idToken'],
                properties: { idToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Sesion iniciada con Google' },
          401: { description: 'Token de Google invalido' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Autenticacion'],
        summary: 'Renovar access token y rotar refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Tokens renovados' },
          401: { description: 'Refresh token invalido o sesion revocada' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Autenticacion'],
        summary: 'Cerrar sesion actual',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Sesion cerrada' },
        },
      },
    },
    '/api/auth/logout-all': {
      post: {
        tags: ['Autenticacion'],
        summary: 'Cerrar todas las sesiones activas del usuario',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Todas las sesiones revocadas' },
          401: { description: 'No autenticado' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Autenticacion'],
        summary: 'Obtener usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Perfil del usuario actual' },
          401: { description: 'No autenticado' },
        },
      },
    },
    '/api/auth/sessions': {
      get: {
        tags: ['Autenticacion'],
        summary: 'Listar sesiones activas del usuario',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Lista de sesiones activas' },
          401: { description: 'No autenticado' },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Autenticacion'],
        summary: 'Solicitar recuperacion de contrasena',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Correo enviado si la cuenta existe' },
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Autenticacion'],
        summary: 'Restablecer contrasena usando token de un solo uso',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: {
                  token: { type: 'string' },
                  newPassword: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Contrasena actualizada y sesiones revocadas' },
          400: { description: 'Token invalido o expirado' },
        },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Usuarios'],
        summary: 'Consultar perfil propio',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Perfil actual' } },
      },
      patch: {
        tags: ['Usuarios'],
        summary: 'Actualizar nombre del perfil propio',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Perfil actualizado' } },
      },
    },
    '/api/users': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar usuarios (solo administrador)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'organizer', 'attendee'] } },
          { name: 'isActive', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Listado paginado de usuarios' },
          403: { description: 'Permisos insuficientes' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Obtener detalle de usuario (solo administrador)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Usuario encontrado' }, 404: { description: 'No encontrado' } },
      },
      patch: {
        tags: ['Usuarios'],
        summary: 'Cambiar rol o estado activo de un usuario (solo administrador)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['admin', 'organizer', 'attendee'] },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Usuario actualizado' } },
      },
    },
    '/api/categories': {
      get: {
        tags: ['Categorias'],
        summary: 'Listar categorias activas',
        responses: { 200: { description: 'Listado de categorias' } },
      },
      post: {
        tags: ['Categorias'],
        summary: 'Crear categoria (solo administrador)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Tecnologia' },
                  description: { type: 'string', example: 'Charlas, talleres y conferencias tech' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Categoria creada' },
          409: { description: 'Categoria duplicada' },
        },
      },
    },
    '/api/categories/{id}': {
      get: {
        tags: ['Categorias'],
        summary: 'Obtener categoria por ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detalle de categoria' }, 404: { description: 'No encontrada' } },
      },
      patch: {
        tags: ['Categorias'],
        summary: 'Actualizar categoria (solo administrador)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Categoria actualizada' } },
      },
      delete: {
        tags: ['Categorias'],
        summary: 'Eliminar categoria sin eventos asociados (solo administrador)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Categoria eliminada' }, 409: { description: 'Tiene eventos asociados' } },
      },
    },
    '/api/events': {
      get: {
        tags: ['Eventos'],
        summary: 'Buscar y filtrar eventos publicados',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'free', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['date_asc', 'date_desc', 'price_asc', 'price_desc', 'newest'] } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Listado paginado de eventos publicados' } },
      },
      post: {
        tags: ['Eventos'],
        summary: 'Crear evento (organizador o administrador)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'category', 'location', 'date', 'capacity'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  location: { type: 'string' },
                  date: { type: 'string', format: 'date-time' },
                  capacity: { type: 'integer' },
                  price: { type: 'number' },
                  status: { type: 'string', enum: ['draft', 'published'] },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Evento creado' }, 403: { description: 'Sin permisos' } },
      },
    },
    '/api/events/mine': {
      get: {
        tags: ['Eventos'],
        summary: 'Listar eventos del organizador autenticado',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Eventos del organizador' } },
      },
    },
    '/api/events/admin/all': {
      get: {
        tags: ['Eventos'],
        summary: 'Listar todos los eventos (solo administrador)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Listado completo de eventos' } },
      },
    },
    '/api/events/{id}': {
      get: {
        tags: ['Eventos'],
        summary: 'Obtener detalle de un evento',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detalle del evento' }, 404: { description: 'No encontrado' } },
      },
      patch: {
        tags: ['Eventos'],
        summary: 'Actualizar evento propio (o administrador)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Evento actualizado' }, 403: { description: 'Sin permisos' } },
      },
    },
    '/api/events/{id}/publish': {
      patch: {
        tags: ['Eventos'],
        summary: 'Publicar evento en estado borrador',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Evento publicado' } },
      },
    },
    '/api/events/{id}/cancel': {
      patch: {
        tags: ['Eventos'],
        summary: 'Cancelar evento',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Evento cancelado' } },
      },
    },
    '/api/events/{id}/image': {
      post: {
        tags: ['Eventos'],
        summary: 'Subir imagen del evento a almacenamiento externo (S3/R2)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Imagen subida y asociada al evento' } },
      },
    },
  },
};

module.exports = openapiSpec;
