const { Event } = require('../models/Event');

function createEvent(data) {
  return Event.create(data);
}

function findById(id) {
  return Event.findById(id)
    .populate('category', 'name slug')
    .populate('organizer', 'name email');
}

function findRawById(id) {
  return Event.findById(id);
}

async function listEvents({ filter = {}, sort = { date: 1 }, skip = 0, limit = 10 }) {
  const [items, total] = await Promise.all([
    Event.find(filter)
      .populate('category', 'name slug')
      .populate('organizer', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Event.countDocuments(filter),
  ]);
  return { items, total };
}

function countByCategory(categoryId) {
  return Event.countDocuments({ category: categoryId });
}

module.exports = {
  createEvent,
  findById,
  findRawById,
  listEvents,
  countByCategory,
};
