const mongoose = require('mongoose');

const timeslotSchema = new mongoose.Schema({
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'unavailable'],
    default: 'available',
  },
}, { timestamps: true });

module.exports = mongoose.model('Timeslot', timeslotSchema);
