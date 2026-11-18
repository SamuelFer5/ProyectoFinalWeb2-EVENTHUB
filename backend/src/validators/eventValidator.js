const { z } = require('zod');
const { EVENT_STATUSES } = require('../models/Event');

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ID invalido');

const dateString = z
  .string({ error: 'La fecha es requerida' })
  .refine((value) => !Number.isNaN(Date.parse(value)), 'La fecha no tiene un formato valido');

const eventIdParamSchema = {
  params: z.object({
    id: objectId,
  }),
};

const createEventSchema = {
  body: z.object({
    title: z
      .string({ error: 'El titulo es requerido' })
      .trim()
      .min(3, 'El titulo debe tener al menos 3 caracteres')
      .max(120, 'El titulo no puede superar los 120 caracteres'),
    description: z
      .string({ error: 'La descripcion es requerida' })
      .trim()
      .min(10, 'La descripcion debe tener al menos 10 caracteres')
      .max(2000, 'La descripcion no puede superar los 2000 caracteres'),
    category: objectId,
    location: z
      .string({ error: 'La ubicacion es requerida' })
      .trim()
      .min(3, 'La ubicacion debe tener al menos 3 caracteres')
      .max(200, 'La ubicacion no puede superar los 200 caracteres'),
    date: dateString,
    capacity: z
      .number({ error: 'La capacidad debe ser un numero' })
      .int('La capacidad debe ser un numero entero')
      .min(1, 'La capacidad minima es 1')
      .max(100000, 'La capacidad maxima es 100000'),
    price: z
      .number({ error: 'El precio debe ser un numero' })
      .min(0, 'El precio no puede ser negativo')
      .optional()
      .default(0),
    imageUrl: z.string().url('La URL de imagen no es valida').optional().default(''),
    status: z.enum(['draft', 'published']).optional().default('draft'),
  }),
};

const updateEventSchema = {
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(3, 'El titulo debe tener al menos 3 caracteres')
        .max(120, 'El titulo no puede superar los 120 caracteres')
        .optional(),
      description: z
        .string()
        .trim()
        .min(10, 'La descripcion debe tener al menos 10 caracteres')
        .max(2000, 'La descripcion no puede superar los 2000 caracteres')
        .optional(),
      category: objectId.optional(),
      location: z
        .string()
        .trim()
        .min(3, 'La ubicacion debe tener al menos 3 caracteres')
        .max(200, 'La ubicacion no puede superar los 200 caracteres')
        .optional(),
      date: dateString.optional(),
      capacity: z
        .number()
        .int('La capacidad debe ser un numero entero')
        .min(1, 'La capacidad minima es 1')
        .max(100000, 'La capacidad maxima es 100000')
        .optional(),
      price: z.number().min(0, 'El precio no puede ser negativo').optional(),
      imageUrl: z.string().url('La URL de imagen no es valida').optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debes enviar al menos un campo para actualizar',
    }),
};

const listEventsQuerySchema = {
  query: z.object({
    category: objectId.optional(),
    location: z.string().trim().max(120).optional(),
    search: z.string().trim().max(120).optional(),
    dateFrom: dateString.optional(),
    dateTo: dateString.optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    free: z.enum(['true', 'false']).optional(),
    status: z.enum(EVENT_STATUSES).optional(),
    sort: z.enum(['date_asc', 'date_desc', 'price_asc', 'price_desc', 'newest']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

module.exports = {
  eventIdParamSchema,
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
};
