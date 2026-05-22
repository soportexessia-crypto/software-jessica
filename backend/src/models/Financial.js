const mongoose = require('mongoose');

const FinancialSchema = new mongoose.Schema({
  patientId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
  appointmentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  date:           { type: String, required: true }, // YYYY-MM-DD HH:MM
  amount:         { type: Number, required: true },
  method: {
    type: String,
    enum: ['Efectivo', 'Tarjeta', 'Transferencia', 'Nequi', 'Daviplata'],
    required: true
  },
  type: {
    type: String,
    enum: ['Ingreso', 'Egreso'],
    required: true
  },
  notes:          { type: String, default: '' },
  receiptPhotoUrl: { type: String, default: '' } // URL foto comprobante de egreso
}, { timestamps: true });

// Índice para filtrar por fecha
FinancialSchema.index({ date: 1 });
FinancialSchema.index({ patientId: 1 });

module.exports = mongoose.model('Financial', FinancialSchema);
