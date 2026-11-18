const { Schema, model } = require('mongoose');

const sessionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    ip: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.refreshTokenHash;
        return ret;
      },
    },
  }
);

// MongoDB elimina automaticamente las sesiones cuando vence expiresAt.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = model('Session', sessionSchema);

module.exports = Session;
