const mongoose = require('mongoose');

const ProcedureSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['CONSULTAS', 'LIMPIEZA Y PREVENCIÓN', 'RADIOLOGÍA', 'ORTODONCIA', 'CIRUGÍA', 'RESTAURACIÓN Y ESTÉTICA', 'PRÓTESIS Y REHABILITACIÓN'],
    required: true
  },
  duration: { type: Number, required: true }, // minutos
  price: { type: Number, required: true },    // COP
  color: { type: String, default: 'azul' },
  specialist: { type: String, default: 'Todos' }, // doctorId o "Todos"
  notes: { type: String },
  alert: { type: String },
  favorite: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Procedure', ProcedureSchema);
