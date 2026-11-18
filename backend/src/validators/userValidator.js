const { z } = require('zod');
const { ROLES } = require('../models/User');

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ID invalido');

const userIdParamSchema = {
  params: z.object({
    id: objectId,
  }),
};

const updateProfileSchema = {
  body: z.object({
    name: z
      .string({ error: 'El nombre es requerido' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(80, 'El nombre no puede superar los 80 caracteres'),
  }),
};

const listUsersSchema = {
  query: z.object({
    role: z.enum(ROLES).optional(),
    isActive: z.enum(['true', 'false']).optional(),
    search: z.string().trim().max(80).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

const adminUpdateUserSchema = {
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      role: z.enum(ROLES).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => data.role !== undefined || data.isActive !== undefined, {
      message: 'Debes enviar al menos role o isActive para actualizar',
    }),
};

module.exports = {
  userIdParamSchema,
  updateProfileSchema,
  listUsersSchema,
  adminUpdateUserSchema,
};
