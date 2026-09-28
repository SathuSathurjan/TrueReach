const mongoose = require('mongoose');

const impressionSchema = new mongoose.Schema({
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true,
  },
  timeslot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timeslot',
    required: true,
  },
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true,
  },
  people_count: {
    type: Number,
    required: true,
    min: 0,
  },
  vehicle_count: {
    type: Number,
    required: true,
    min: 0,
  },
  recorded_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Impression', impressionSchema);
