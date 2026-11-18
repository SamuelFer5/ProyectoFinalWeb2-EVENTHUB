const express = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const {
  userIdParamSchema,
  updateProfileSchema,
  listUsersSchema,
  adminUpdateUserSchema,
} = require('../validators/userValidator');

const router = express.Router();

router.get('/me', authenticate, userController.getMyProfile);
router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateMyProfile);

router.get('/', authenticate, authorize('admin'), validate(listUsersSchema), userController.listUsers);
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(userIdParamSchema),
  userController.getUserById
);
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(adminUpdateUserSchema),
  userController.adminUpdateUser
);

module.exports = router;
