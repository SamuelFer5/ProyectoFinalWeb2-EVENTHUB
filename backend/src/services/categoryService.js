const HttpError = require('../utils/HttpError');
const categoryRepository = require('../repositories/categoryRepository');
const eventRepository = require('../repositories/eventRepository');

function createSlug(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function listCategories({ includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { isActive: true };
  const categories = await categoryRepository.listCategories(filter);
  return categories.map((cat) => cat.toJSON());
}

async function getCategoryById(id) {
  const category = await categoryRepository.findById(id);
  if (!category) {
    throw new HttpError(404, 'Categoria no encontrada');
  }
  return category.toJSON();
}

async function createCategory({ name, description = '' }) {
  const slug = createSlug(name);
  if (!slug) {
    throw new HttpError(400, 'El nombre de la categoria no es valido');
  }

  const existing = await categoryRepository.findByNameOrSlug(name, slug);
  if (existing) {
    throw new HttpError(409, 'Ya existe una categoria con ese nombre');
  }

  const category = await categoryRepository.createCategory({ name, slug, description });
  return category.toJSON();
}

async function updateCategory(id, updates) {
  const payload = { ...updates };

  if (updates.name !== undefined) {
    const slug = createSlug(updates.name);
    if (!slug) {
      throw new HttpError(400, 'El nombre de la categoria no es valido');
    }
    const existing = await categoryRepository.findByNameOrSlug(updates.name, slug, id);
    if (existing) {
      throw new HttpError(409, 'Ya existe otra categoria con ese nombre');
    }
    payload.slug = slug;
  }

  const updated = await categoryRepository.updateById(id, payload);
  if (!updated) {
    throw new HttpError(404, 'Categoria no encontrada');
  }
  return updated.toJSON();
}

async function deleteCategory(id) {
  const associatedEvents = await eventRepository.countByCategory(id);
  if (associatedEvents > 0) {
    throw new HttpError(409, 'No se puede eliminar una categoria con eventos asociados');
  }

  const deleted = await categoryRepository.deleteById(id);
  if (!deleted) {
    throw new HttpError(404, 'Categoria no encontrada');
  }
  return { message: 'Categoria eliminada correctamente' };
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
