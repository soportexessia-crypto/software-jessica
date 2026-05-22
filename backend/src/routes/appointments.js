const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Procedure = require('../models/Procedure');
const auth = require('../middleware/auth');

// GET /api/appointments — todas las citas (con filtros opcionales ?date=&doctorId=&patientId=)
router.get('/', auth, async (req, res) => {
  try {
    const { date, doctorId, patientId, status } = req.query;
    let filter = {};
    if (date)      filter.date = date;
    if (doctorId)  filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;
    if (status)    filter.status = status;

    const appointments = await Appointment.find(filter).sort({ date: -1, time: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/appointments/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Cita no encontrada.' });
    res.json(appt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/appointments — crear cita
router.post('/', auth, async (req, res) => {
  try {
    const appt = new Appointment({
      ...req.body,
      paidAmount: 0,
      paymentStatus: 'deuda'
    });
    await appt.save();

    // Sumar la deuda al paciente
    const procedure = await Procedure.findOne({ code: req.body.procedureCode });
    if (procedure) {
      await Patient.findByIdAndUpdate(req.body.patientId, {
        $inc: { debt: procedure.price }
      });
    }

    res.status(201).json(appt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/appointments/:id — editar cita o cambiar estado
router.patch('/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Cita no encontrada.' });

    const updatedFields = req.body;

    // Si cambia el monto pagado, recalcular paymentStatus y debt del paciente
    if (updatedFields.paidAmount !== undefined) {
      const procedure = await Procedure.findOne({ code: appt.procedureCode });
      const fullPrice = procedure ? procedure.price : 0;
      const newPaid = updatedFields.paidAmount;
      const diffPaid = newPaid - appt.paidAmount;

      updatedFields.paymentStatus = newPaid >= fullPrice ? 'pagado'
        : newPaid > 0 ? 'parcial'
        : 'deuda';

      // Ajustar deuda del paciente
      if (diffPaid !== 0) {
        await Patient.findByIdAndUpdate(appt.patientId, {
          $inc: { debt: -diffPaid }
        });
        // Asegurar que la deuda no quede negativa
        await Patient.updateOne(
          { _id: appt.patientId, debt: { $lt: 0 } },
          { $set: { debt: 0 } }
        );
      }
    }

    Object.assign(appt, updatedFields);
    await appt.save();
    res.json(appt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/appointments/:id — cancelar (soft)
router.delete('/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'cancelada' } },
      { new: true }
    );
    if (!appt) return res.status(404).json({ error: 'Cita no encontrada.' });
    res.json({ message: 'Cita cancelada.', appointment: appt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
