import mongoose from 'mongoose';

export const EVENT_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
});

export const EVENT_VISIBILITY = Object.freeze({
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE'
});

export const LOCATION_TYPE = Object.freeze({
  PHYSICAL: 'PHYSICAL',
  ONLINE: 'ONLINE',
  HYBRID: 'HYBRID'
});

export const ALLOWED_TRANSITIONS = Object.freeze({
  DRAFT: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.CANCELLED],
  PUBLISHED: [EVENT_STATUS.ONGOING, EVENT_STATUS.CANCELLED],
  ONGOING: [EVENT_STATUS.COMPLETED],
  COMPLETED: [],
  CANCELLED: []
});

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization reference is required'],
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user reference is required'],
      index: true
    },
    category: {
      type: String,
      required: [true, 'Event category is required'],
      trim: true,
      index: true
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true
    },
    locationType: {
      type: String,
      enum: Object.values(LOCATION_TYPE),
      default: LOCATION_TYPE.PHYSICAL,
      required: true
    },
    venue: {
      type: String,
      default: '',
      trim: true
    },
    onlineLink: {
      type: String,
      default: '',
      trim: true
    },
    capacity: {
      type: Number,
      required: [true, 'Event capacity is required'],
      min: [1, 'Capacity must be a positive integer (at least 1)']
    },
    registrationStart: {
      type: Date
    },
    registrationEnd: {
      type: Date
    },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.DRAFT,
      required: true,
      index: true
    },
    visibility: {
      type: String,
      enum: Object.values(EVENT_VISIBILITY),
      default: EVENT_VISIBILITY.PUBLIC,
      required: true,
      index: true
    },
    bannerImage: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound Indexes for queries
eventSchema.index({ organization: 1, status: 1 });
eventSchema.index({ organization: 1, startDate: 1 });

// Mongoose Pre-validate hook for date relationships
eventSchema.pre('validate', function () {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }

  if (this.registrationStart && this.registrationEnd && this.registrationEnd < this.registrationStart) {
    this.invalidate('registrationEnd', 'Registration end date cannot be before registration start date');
  }

  if (this.registrationEnd && this.startDate && this.registrationEnd > this.startDate) {
    this.invalidate('registrationEnd', 'Registration end date cannot be after event start date');
  }

  if (this.capacity !== undefined && (!Number.isInteger(this.capacity) || this.capacity < 1)) {
    this.invalidate('capacity', 'Capacity must be a positive integer (at least 1)');
  }
});

export const Event = mongoose.model('Event', eventSchema);
export default Event;
