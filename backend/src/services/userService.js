const HttpError = require('../utils/HttpError');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');
const userRepository = require('../repositories/userRepository');
const sessionRepository = require('../repositories/sessionRepository');

async function updateProfile(userId, { name }) {
  const user = await userRepository.updateById(userId, { name });
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }
  return user.toPublic();
}

async function listUsers(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.role) {
    filter.role = query.role;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true';
  }

  if (query.search) {
    const regex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const { items, total } = await userRepository.listUsers({ filter, skip, limit });
  return buildPaginatedResponse(
    items.map((item) => item.toPublic()),
    total,
    page,
    limit
  );
}

async function getUserById(id) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }
  return user.toPublic();
}

async function adminUpdateUser(targetUserId, updates, currentAdminId) {
  if (targetUserId === currentAdminId.toString()) {
    if (updates.isActive === false) {
      throw new HttpError(400, 'No puedes desactivar tu propia cuenta de administrador');
    }
    if (updates.role && updates.role !== 'admin') {
      throw new HttpError(400, 'No puedes cambiar tu propio rol de administrador');
    }
  }

  const user = await userRepository.updateById(targetUserId, updates);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  if (updates.isActive === false) {
    await sessionRepository.revokeAllByUser(user._id);
  }

  return user.toPublic();
}

module.exports = {
  updateProfile,
  listUsers,
  getUserById,
  adminUpdateUser,
};
