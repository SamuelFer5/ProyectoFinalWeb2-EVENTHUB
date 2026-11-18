const express = require('express');
const categoryController = require('../controllers/categoryController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
} = require('../validators/categoryValidator');

const router = express.Router();

router.get('/', categoryController.listCategories);
router.get('/:id', validate(categoryIdParamSchema), categoryController.getCategoryById);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createCategorySchema),
  categoryController.createCategory
);
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(categoryIdParamSchema),
  categoryController.deleteCategory
);

module.exports = router;
