const { z } = require('zod');

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ID de categoria invalido');

const categoryIdParamSchema = {
  params: z.object({
    id: objectId,
  }),
};

const createCategorySchema = {
  body: z.object({
    name: z
      .string({ error: 'El nombre de la categoria es requerido' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(60, 'El nombre no puede superar los 60 caracteres'),
    description: z
      .string()
      .trim()
      .max(250, 'La descripcion no puede superar los 250 caracteres')
      .optional()
      .default(''),
  }),
};

const updateCategorySchema = {
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(60, 'El nombre no puede superar los 60 caracteres')
        .optional(),
      description: z
        .string()
        .trim()
        .max(250, 'La descripcion no puede superar los 250 caracteres')
        .optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (data) =>
        data.name !== undefined || data.description !== undefined || data.isActive !== undefined,
      { message: 'Debes enviar al menos un campo para actualizar' }
    ),
};

module.exports = {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
};
