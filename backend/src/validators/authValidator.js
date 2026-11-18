const { z } = require('zod');

const passwordField = z
  .string({ error: 'La contrasena es requerida' })
  .min(8, 'La contrasena debe tener al menos 8 caracteres')
  .max(128, 'La contrasena no puede superar los 128 caracteres');

const registerSchema = {
  body: z.object({
    name: z
      .string({ error: 'El nombre es requerido' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(80, 'El nombre no puede superar los 80 caracteres'),
    email: z
      .string({ error: 'El correo es requerido' })
      .trim()
      .toLowerCase()
      .email('El correo electronico no es valido'),
    password: passwordField,
    role: z.enum(['attendee', 'organizer']).optional().default('attendee'),
  }),
};

const loginSchema = {
  body: z.object({
    email: z
      .string({ error: 'El correo es requerido' })
      .trim()
      .toLowerCase()
      .email('El correo electronico no es valido'),
    password: z.string({ error: 'La contrasena es requerida' }).min(1, 'La contrasena es requerida'),
  }),
};

const googleLoginSchema = {
  body: z.object({
    idToken: z.string({ error: 'El token de Google es requerido' }).min(10, 'Token de Google invalido'),
  }),
};

const refreshSchema = {
  body: z.object({
    refreshToken: z.string({ error: 'El refresh token es requerido' }).min(10, 'Refresh token invalido'),
  }),
};

const verifyEmailSchema = {
  body: z.object({
    token: z.string({ error: 'El token de verificacion es requerido' }).min(10, 'Token invalido'),
  }),
};

const emailOnlySchema = {
  body: z.object({
    email: z
      .string({ error: 'El correo es requerido' })
      .trim()
      .toLowerCase()
      .email('El correo electronico no es valido'),
  }),
};

const resetPasswordSchema = {
  body: z.object({
    token: z.string({ error: 'El token es requerido' }).min(10, 'Token invalido'),
    newPassword: passwordField,
  }),
};

module.exports = {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  refreshSchema,
  verifyEmailSchema,
  emailOnlySchema,
  resetPasswordSchema,
};
