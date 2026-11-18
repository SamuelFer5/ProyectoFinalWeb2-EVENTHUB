const eventService = require('../services/eventService');

async function listPublicEvents(req, res) {
  const result = await eventService.listPublicEvents(req.validated?.query || req.query);
  res.json(result);
}

async function listMyEvents(req, res) {
  const result = await eventService.listOrganizerEvents(
    req.user._id,
    req.validated?.query || req.query
  );
  res.json(result);
}

async function listAllEvents(req, res) {
  const result = await eventService.listAllEventsForAdmin(req.validated?.query || req.query);
  res.json(result);
}

async function getEventById(req, res) {
  const event = await eventService.getEventById(req.params.id, req.user || null);
  res.json({ data: event });
}

async function createEvent(req, res) {
  const event = await eventService.createEvent(req.body, req.user._id);
  res.status(201).json({ data: event });
}

async function updateEvent(req, res) {
  const event = await eventService.updateEvent(req.params.id, req.body, req.user);
  res.json({ data: event });
}

async function publishEvent(req, res) {
  const event = await eventService.publishEvent(req.params.id, req.user);
  res.json({ data: event });
}

async function cancelEvent(req, res) {
  const event = await eventService.cancelEvent(req.params.id, req.user);
  res.json({ data: event });
}

async function uploadImage(req, res) {
  const event = await eventService.uploadEventImage(req.params.id, req.file, req.user);
  res.json({ data: event });
}

module.exports = {
  listPublicEvents,
  listMyEvents,
  listAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  publishEvent,
  cancelEvent,
  uploadImage,
};
