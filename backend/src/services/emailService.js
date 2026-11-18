const { Resend } = require('resend');
const { env } = require('../config/env');

const resendClient = env.email.resendApiKey ? new Resend(env.email.resendApiKey) : null;
const testInbox = [];

async function sendEmail({ to, subject, html, text }) {
  if (env.isTest) {
    const entry = { to, subject, html, text, sentAt: new Date() };
    testInbox.push(entry);
    return { id: `test-${testInbox.length}`, simulated: true };
  }

  if (!resendClient) {
    console.log(`[Email local] Para: ${to} | Asunto: ${subject}`);
    if (text) console.log(text);
    return { id: 'local-console', simulated: true };
  }

  const { data, error } = await resendClient.emails.send({
    from: env.email.from,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Error enviando correo con Resend: ${error.message}`);
  }

  return data;
}

async function sendVerificationEmail(user, token) {
  const verifyUrl = `${env.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: user.email,
    subject: 'Verifica tu correo en EventHub',
    html: `
      <h2>Hola ${user.name}</h2>
      <p>Gracias por registrarte en EventHub. Haz clic en el siguiente enlace para verificar tu cuenta:</p>
      <p><a href="${verifyUrl}">Verificar correo</a></p>
      <p>Este enlace vence en 24 horas.</p>
    `,
    text: `Hola ${user.name}, verifica tu correo en EventHub usando este enlace: ${verifyUrl}`,
  });
}

async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${env.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: user.email,
    subject: 'Recuperacion de contrasena - EventHub',
    html: `
      <h2>Hola ${user.name}</h2>
      <p>Recibimos una solicitud para restablecer tu contrasena en EventHub.</p>
      <p><a href="${resetUrl}">Restablecer contrasena</a></p>
      <p>Este enlace es de un solo uso y vence en 30 minutos. Si no lo solicitaste, puedes ignorar este correo.</p>
    `,
    text: `Hola ${user.name}, restablece tu contrasena aqui: ${resetUrl} (vence en 30 minutos).`,
  });
}

function getTestInbox() {
  return testInbox;
}

function clearTestInbox() {
  testInbox.length = 0;
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  getTestInbox,
  clearTestInbox,
};
