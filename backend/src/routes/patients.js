const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');

// GET /api/patients — todos los pacientes activos
router.get('/', auth, async (req, res) => {
  try {
    const { q } = req.query;
    let filter = { active: true };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { document: { $regex: q, $options: 'i' } }
      ];
    }
    const patients = await Patient.find(filter).sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/patients/:id — un paciente
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado.' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/patients — crear paciente
router.post('/', auth, async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Ya existe un paciente con ese número de documento.' });
    }
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/patients/:id — actualizar datos del paciente
router.patch('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado.' });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/patients/:id/odontogram — actualizar un diente del odontograma
router.patch('/:id/odontogram', auth, async (req, res) => {
  try {
    const { toothNumber, section, state } = req.body;
    if (!toothNumber || !section || !state) {
      return res.status(400).json({ error: 'toothNumber, section y state son obligatorios.' });
    }
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: { [`odontogram.${toothNumber}.${section}`]: state } },
      { new: true }
    );
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado.' });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/patients/:id — soft delete
router.delete('/:id', auth, async (req, res) => {
  try {
    // Cancelar citas pendientes del paciente
    await Appointment.updateMany(
      { patientId: req.params.id, status: { $nin: ['cancelada', 'finalizada'] } },
      { $set: { status: 'cancelada' } }
    );
    await Patient.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Paciente eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
