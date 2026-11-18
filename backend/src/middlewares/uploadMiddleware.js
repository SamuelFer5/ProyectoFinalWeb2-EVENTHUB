const multer = require('multer');
const HttpError = require('../utils/HttpError');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter(_req, file, callback) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return callback(new HttpError(400, 'Solo se permiten imagenes JPG, PNG o WebP'));
    }
    callback(null, true);
  },
});

const uploadEventImage = upload.single('image');

module.exports = { uploadEventImage };
