const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  workingDays: [{ type: String }],
  workingHours: { type: String },
  color: { type: String, default: '#00A3FF' },
  avatar: { type: String },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);
