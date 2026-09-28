const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  advertiser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
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
  adCreativeUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
