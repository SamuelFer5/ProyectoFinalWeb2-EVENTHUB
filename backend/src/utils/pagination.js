function getPagination(query = {}, defaults = { limit: 10, maxLimit: 50 }) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const rawLimit = Number.parseInt(query.limit, 10) || defaults.limit;
  const limit = Math.min(defaults.maxLimit, Math.max(1, rawLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

function buildPaginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

module.exports = { getPagination, buildPaginatedResponse };
