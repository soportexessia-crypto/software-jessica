const express = require('express');
const router = express.Router();
const Procedure = require('../models/Procedure');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { favorite } = req.query;
    let filter = { active: true };
    if (favorite === 'true') filter.favorite = true;
    const procedures = await Procedure.find(filter).sort({ category: 1, name: 1 });
    res.json(procedures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:code', auth, async (req, res) => {
  try {
    const procedure = await Procedure.findOne({ code: req.params.code.toUpperCase() });
    if (!procedure) return res.status(404).json({ error: 'Procedimiento no encontrado.' });
    res.json(procedure);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const procedure = new Procedure(req.body);
    await procedure.save();
    res.status(201).json(procedure);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Ya existe un procedimiento con ese código.' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const procedure = await Procedure.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!procedure) return res.status(404).json({ error: 'Procedimiento no encontrado.' });
    res.json(procedure);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Procedure.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Procedimiento desactivado.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
