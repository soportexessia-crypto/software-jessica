const mongoose = require('mongoose');

const OdontogramToothSchema = new mongoose.Schema({
  vestibular: { type: String, enum: ['caries', 'conducto', 'corona', 'none'], default: 'none' },
  palatina:   { type: String, enum: ['caries', 'conducto', 'corona', 'none'], default: 'none' },
  distal:     { type: String, enum: ['caries', 'conducto', 'corona', 'none'], default: 'none' },
  mesial:     { type: String, enum: ['caries', 'conducto', 'corona', 'none'], default: 'none' },
  oclusal:    { type: String, enum: ['caries', 'conducto', 'corona', 'none'], default: 'none' },
}, { _id: false });

const PatientSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  document:     { type: String, required: true, unique: true },
  phone:        { type: String, default: '' },
  whatsapp:     { type: String, default: '' },
  address:      { type: String, default: '' },
  birthDate:    { type: String, default: '' },
  gender:       { type: String, enum: ['Femenino', 'Masculino', 'Otro'], default: 'Femenino' },
  email:        { type: String, default: '' },
  eps:          { type: String, default: '' },
  allergies:    { type: String, default: '' },
  observations: { type: String, default: '' },
  photoUrl:     { type: String, default: '' },
  debt:         { type: Number, default: 0 },
  odontogram:   { type: Map, of: OdontogramToothSchema, default: {} },
  active:       { type: Boolean, default: true }
}, { timestamps: true });

// Index para búsqueda rápida
PatientSchema.index({ name: 'text', document: 'text' });

module.exports = mongoose.model('Patient', PatientSchema);
