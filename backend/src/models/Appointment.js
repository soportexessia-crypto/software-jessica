const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor',  required: true },
  procedureCode: { type: String, required: true },
  date:          { type: String, required: true }, // YYYY-MM-DD
  time:          { type: String, required: true }, // HH:MM
  duration:      { type: Number, required: true }, // minutos
  status: {
    type: String,
    enum: ['confirmada', 'pendiente', 'cancelada', 'enproceso', 'finalizada'],
    default: 'pendiente'
  },
  paymentStatus: {
    type: String,
    enum: ['pagado', 'parcial', 'deuda'],
    default: 'deuda'
  },
  paidAmount: { type: Number, default: 0 },
  notes:      { type: String, default: '' }
}, { timestamps: true });

// Índice para filtrar citas por fecha y doctor rápidamente
AppointmentSchema.index({ date: 1, doctorId: 1 });
AppointmentSchema.index({ patientId: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
