const Category = require('../models/Category');

function createCategory(data) {
  return Category.create(data);
}

function findById(id) {
  return Category.findById(id);
}

function findByNameOrSlug(name, slug, excludeId = null) {
  const filter = {
    $or: [{ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, { slug }],
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return Category.findOne(filter);
}

function listCategories(filter = {}) {
  return Category.find(filter).sort({ name: 1 });
}

function updateById(id, updates) {
  return Category.findByIdAndUpdate(id, updates, { returnDocument: 'after', runValidators: true });
}

function deleteById(id) {
  return Category.findByIdAndDelete(id);
}

module.exports = {
  createCategory,
  findById,
  findByNameOrSlug,
  listCategories,
  updateById,
  deleteById,
};
