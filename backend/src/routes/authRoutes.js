const express = require('express');
const authController = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { authLimiter } = require('../middlewares/rateLimiter');
const {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  refreshSchema,
  verifyEmailSchema,
  emailOnlySchema,
  resetPasswordSchema,
} = require('../validators/authValidator');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), authController.verifyEmail);
router.post(
  '/resend-verification',
  authLimiter,
  validate(emailOnlySchema),
  authController.resendVerification
);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/google', authLimiter, validate(googleLoginSchema), authController.loginWithGoogle);
router.post('/refresh', authLimiter, validate(refreshSchema), authController.refresh);
router.post('/logout', validate(refreshSchema), authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.me);
router.get('/sessions', authenticate, authController.listSessions);
router.post('/forgot-password', authLimiter, validate(emailOnlySchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
