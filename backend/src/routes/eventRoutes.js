const express = require('express');
const eventController = require('../controllers/eventController');
const authenticate = require('../middlewares/authMiddleware');
const optionalAuthenticate = require('../middlewares/optionalAuthMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { uploadEventImage } = require('../middlewares/uploadMiddleware');
const {
  eventIdParamSchema,
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
} = require('../validators/eventValidator');

const router = express.Router();

router.get('/', validate(listEventsQuerySchema), eventController.listPublicEvents);
router.get(
  '/mine',
  authenticate,
  authorize('organizer', 'admin'),
  validate(listEventsQuerySchema),
  eventController.listMyEvents
);
router.get(
  '/admin/all',
  authenticate,
  authorize('admin'),
  validate(listEventsQuerySchema),
  eventController.listAllEvents
);
router.get('/:id', optionalAuthenticate, validate(eventIdParamSchema), eventController.getEventById);

router.post(
  '/',
  authenticate,
  authorize('organizer', 'admin'),
  validate(createEventSchema),
  eventController.createEvent
);
router.patch(
  '/:id',
  authenticate,
  authorize('organizer', 'admin'),
  validate(updateEventSchema),
  eventController.updateEvent
);
router.patch(
  '/:id/publish',
  authenticate,
  authorize('organizer', 'admin'),
  validate(eventIdParamSchema),
  eventController.publishEvent
);
router.patch(
  '/:id/cancel',
  authenticate,
  authorize('organizer', 'admin'),
  validate(eventIdParamSchema),
  eventController.cancelEvent
);
router.post(
  '/:id/image',
  authenticate,
  authorize('organizer', 'admin'),
  validate(eventIdParamSchema),
  uploadEventImage,
  eventController.uploadImage
);

module.exports = router;
