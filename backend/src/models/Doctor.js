const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  workingDays: [{ type: String }],
  workingHours: { type: String },
  color: { type: String, default: '#00A3FF' },
  avatar: { type: String },
  active: { type: Boolean, default: true },
  blockedRanges: [{
    date: { type: String, required: true }, // YYYY-MM-DD
    timeStart: { type: String, required: true }, // HH:MM
    timeEnd: { type: String, required: true }, // HH:MM
    reason: { type: String, default: '' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);
