const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const doctors = await Doctor.find({ active: true }).sort({ name: 1 });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor no encontrado.' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();
    res.status(201).json(doctor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doctor) return res.status(404).json({ error: 'Doctor no encontrado.' });
    res.json(doctor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Doctor.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Doctor desactivado.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
