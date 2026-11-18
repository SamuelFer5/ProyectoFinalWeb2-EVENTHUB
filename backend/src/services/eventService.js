const HttpError = require('../utils/HttpError');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');
const eventRepository = require('../repositories/eventRepository');
const categoryRepository = require('../repositories/categoryRepository');
const storageService = require('./storageService');

const SORT_OPTIONS = {
  date_asc: { date: 1 },
  date_desc: { date: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureCanManageEvent(event, user) {
  const isOwner = event.organizer.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new HttpError(403, 'No tienes permisos para administrar este evento');
  }
}

function buildEventFilter(query = {}) {
  const filter = {};

  if (query.category) {
    filter.category = query.category;
  }

  if (query.location) {
    filter.location = new RegExp(escapeRegex(query.location), 'i');
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ title: regex }, { description: regex }, { location: regex }];
  }

  if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) filter.date.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.date.$lte = new Date(query.dateTo);
  }

  if (query.free === 'true') {
    filter.price = 0;
  } else {
    const minPrice = query.minPrice !== undefined ? Number(query.minPrice) : null;
    const maxPrice = query.maxPrice !== undefined ? Number(query.maxPrice) : null;

    if ((minPrice !== null && !Number.isNaN(minPrice)) || (maxPrice !== null && !Number.isNaN(maxPrice))) {
      filter.price = {};
      if (minPrice !== null && !Number.isNaN(minPrice)) filter.price.$gte = minPrice;
      if (maxPrice !== null && !Number.isNaN(maxPrice)) filter.price.$lte = maxPrice;
    }
  }

  return filter;
}

async function listPublicEvents(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const filter = buildEventFilter(query);
  filter.status = 'published';

  const sort = SORT_OPTIONS[query.sort] || SORT_OPTIONS.date_asc;
  const { items, total } = await eventRepository.listEvents({ filter, sort, skip, limit });

  return buildPaginatedResponse(
    items.map((item) => item.toJSON()),
    total,
    page,
    limit
  );
}

async function listOrganizerEvents(organizerId, query = {}) {
  const { page, limit, skip } = getPagination(query);
  const filter = buildEventFilter(query);
  filter.organizer = organizerId;

  if (query.status) {
    filter.status = query.status;
  }

  const sort = SORT_OPTIONS[query.sort] || SORT_OPTIONS.newest;
  const { items, total } = await eventRepository.listEvents({ filter, sort, skip, limit });

  return buildPaginatedResponse(
    items.map((item) => item.toJSON()),
    total,
    page,
    limit
  );
}

async function listAllEventsForAdmin(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const filter = buildEventFilter(query);

  if (query.status) {
    filter.status = query.status;
  }

  const sort = SORT_OPTIONS[query.sort] || SORT_OPTIONS.newest;
  const { items, total } = await eventRepository.listEvents({ filter, sort, skip, limit });

  return buildPaginatedResponse(
    items.map((item) => item.toJSON()),
    total,
    page,
    limit
  );
}

async function getEventById(id, currentUser = null) {
  const event = await eventRepository.findById(id);
  if (!event) {
    throw new HttpError(404, 'Evento no encontrado');
  }

  if (event.status === 'draft' || event.status === 'cancelled') {
    const organizerId = event.organizer?._id?.toString() || event.organizer?.toString();
    const isOwner = currentUser && organizerId === currentUser._id.toString();
    const isAdmin = currentUser && currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new HttpError(404, 'Evento no encontrado');
    }
  }

  return event.toJSON();
}

async function createEvent(data, organizerId) {
  const eventDate = new Date(data.date);
  if (eventDate <= new Date()) {
    throw new HttpError(400, 'La fecha del evento debe ser futura');
  }

  const category = await categoryRepository.findById(data.category);
  if (!category || !category.isActive) {
    throw new HttpError(400, 'La categoria seleccionada no existe o esta inactiva');
  }

  const created = await eventRepository.createEvent({
    title: data.title,
    description: data.description,
    category: data.category,
    location: data.location,
    date: eventDate,
    capacity: data.capacity,
    availableSpots: data.capacity,
    price: data.price ?? 0,
    imageUrl: data.imageUrl || '',
    status: data.status || 'draft',
    organizer: organizerId,
  });

  const populated = await eventRepository.findById(created._id);
  return populated.toJSON();
}

async function updateEvent(id, updates, user) {
  const event = await eventRepository.findRawById(id);
  if (!event) {
    throw new HttpError(404, 'Evento no encontrado');
  }

  ensureCanManageEvent(event, user);

  if (event.status === 'cancelled' || event.status === 'completed') {
    throw new HttpError(400, 'No se puede modificar un evento cancelado o finalizado');
  }

  if (updates.date !== undefined) {
    const nextDate = new Date(updates.date);
    if (nextDate <= new Date()) {
      throw new HttpError(400, 'La fecha del evento debe ser futura');
    }
    event.date = nextDate;
  }

  if (updates.category !== undefined) {
    const category = await categoryRepository.findById(updates.category);
    if (!category || !category.isActive) {
      throw new HttpError(400, 'La categoria seleccionada no existe o esta inactiva');
    }
    event.category = updates.category;
  }

  if (updates.capacity !== undefined) {
    const reservedSpots = event.capacity - event.availableSpots;
    if (updates.capacity < reservedSpots) {
      throw new HttpError(
        400,
        `La capacidad no puede ser menor a los espacios ya reservados (${reservedSpots})`
      );
    }
    event.capacity = updates.capacity;
    event.availableSpots = updates.capacity - reservedSpots;
  }

  if (updates.title !== undefined) event.title = updates.title;
  if (updates.description !== undefined) event.description = updates.description;
  if (updates.location !== undefined) event.location = updates.location;
  if (updates.price !== undefined) event.price = updates.price;
  if (updates.imageUrl !== undefined) event.imageUrl = updates.imageUrl;

  await event.save();

  const populated = await eventRepository.findById(event._id);
  return populated.toJSON();
}

async function publishEvent(id, user) {
  const event = await eventRepository.findRawById(id);
  if (!event) {
    throw new HttpError(404, 'Evento no encontrado');
  }

  ensureCanManageEvent(event, user);

  if (event.status !== 'draft') {
    throw new HttpError(400, 'Solo se pueden publicar eventos en estado borrador');
  }

  if (event.date <= new Date()) {
    throw new HttpError(400, 'No se puede publicar un evento con fecha pasada');
  }

  event.status = 'published';
  await event.save();

  const populated = await eventRepository.findById(event._id);
  return populated.toJSON();
}

async function cancelEvent(id, user) {
  const event = await eventRepository.findRawById(id);
  if (!event) {
    throw new HttpError(404, 'Evento no encontrado');
  }

  ensureCanManageEvent(event, user);

  if (event.status === 'cancelled' || event.status === 'completed') {
    throw new HttpError(400, 'El evento ya fue cancelado o finalizado');
  }

  event.status = 'cancelled';
  await event.save();

  const populated = await eventRepository.findById(event._id);
  return populated.toJSON();
}

async function uploadEventImage(id, file, user) {
  if (!file) {
    throw new HttpError(400, 'Debes adjuntar una imagen en el campo image');
  }

  const event = await eventRepository.findRawById(id);
  if (!event) {
    throw new HttpError(404, 'Evento no encontrado');
  }

  ensureCanManageEvent(event, user);

  const previousKey = event.imageKey;
  const uploaded = await storageService.uploadFile({
    buffer: file.buffer,
    contentType: file.mimetype,
    originalName: file.originalname,
    folder: 'events',
  });

  event.imageUrl = uploaded.url;
  event.imageKey = uploaded.key;
  await event.save();

  if (previousKey) {
    await storageService.deleteFile(previousKey).catch(() => {});
  }

  const populated = await eventRepository.findById(event._id);
  return populated.toJSON();
}

module.exports = {
  listPublicEvents,
  listOrganizerEvents,
  listAllEventsForAdmin,
  getEventById,
  createEvent,
  updateEvent,
  publishEvent,
  cancelEvent,
  uploadEventImage,
};
