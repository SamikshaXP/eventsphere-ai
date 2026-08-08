import mongoose from 'mongoose';

export const TICKET_TYPE = Object.freeze({
  STANDARD: 'STANDARD',
  VIP: 'VIP',
  STUDENT: 'STUDENT'
});

export const TICKET_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED'
});

const ticketSchema = new mongoose.Schema(
  {
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: [true, 'Registration reference is required'],
      unique: true,
      index: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    ticketNumber: {
      type: String,
      required: [true, 'Ticket number is required'],
      unique: true,
      index: true
    },
    qrToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    ticketType: {
      type: String,
      enum: Object.values(TICKET_TYPE),
      default: TICKET_TYPE.STANDARD,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.ACTIVE,
      required: true
    },
    issuedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

ticketSchema.index({ user: 1, event: 1 });

export const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
