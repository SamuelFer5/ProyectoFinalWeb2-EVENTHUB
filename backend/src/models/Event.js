const { Schema, model } = require('mongoose');

const EVENT_STATUSES = ['draft', 'published', 'cancelled', 'completed'];

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imageKey: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    date: {
      type: Date,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 100000,
    },
    availableSpots: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: EVENT_STATUSES,
      default: 'draft',
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ organizer: 1, createdAt: -1 });

const Event = model('Event', eventSchema);

module.exports = { Event, EVENT_STATUSES };
