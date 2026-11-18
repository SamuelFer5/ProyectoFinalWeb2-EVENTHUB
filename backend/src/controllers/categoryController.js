const categoryService = require('../services/categoryService');

async function listCategories(req, res) {
  const includeInactive = req.query.includeInactive === 'true';
  const categories = await categoryService.listCategories({ includeInactive });
  res.json({ data: categories });
}

async function getCategoryById(req, res) {
  const category = await categoryService.getCategoryById(req.params.id);
  res.json({ data: category });
}

async function createCategory(req, res) {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json({ data: category });
}

async function updateCategory(req, res) {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.json({ data: category });
}

async function deleteCategory(req, res) {
  const result = await categoryService.deleteCategory(req.params.id);
  res.json({ data: result });
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
