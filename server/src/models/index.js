import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, index: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  venue: { type: String, required: true },
  city: { type: String, required: true, index: true },
  startAt: { type: Date, required: true, index: true },
  endAt: { type: Date, required: true },
  capacity: { type: Number, required: true, min: 1 },
  price: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['draft', 'published', 'sold-out', 'completed', 'cancelled'], default: 'draft' },
  imageTone: { type: String, default: 'violet' },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

eventSchema.index({ title: 'text', description: 'text', venue: 'text', city: 'text' });

const registrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  attendeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ticketCode: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['confirmed', 'waitlisted', 'cancelled', 'checked-in'], default: 'confirmed' },
  registeredAt: { type: Date, default: Date.now }
}, { timestamps: true });

registrationSchema.index({ eventId: 1, attendeeId: 1 }, { unique: true });

const checkInSchema = new mongoose.Schema({
  registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true, unique: true },
  checkedInAt: { type: Date, default: Date.now },
  checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Event = mongoose.model('Event', eventSchema);
export const Registration = mongoose.model('Registration', registrationSchema);
export const CheckIn = mongoose.model('CheckIn', checkInSchema);
