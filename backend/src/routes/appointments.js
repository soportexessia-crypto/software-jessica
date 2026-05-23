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
    const discount = req.body.discount !== undefined ? Number(req.body.discount) : 0;
    const paidAmount = req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : 0;

    const procedure = await Procedure.findOne({ code: req.body.procedureCode });
    let finalPrice = 0;
    if (procedure) {
      finalPrice = Math.round(procedure.price * (1 - discount / 100));
    }

    const outstandingDebt = finalPrice - paidAmount;
    let paymentStatus = 'deuda';
    if (paidAmount >= finalPrice) {
      paymentStatus = 'pagado';
    } else if (paidAmount > 0) {
      paymentStatus = 'parcial';
    }

    const appt = new Appointment({
      ...req.body,
      discount,
      paidAmount,
      paymentStatus
    });
    await appt.save();

    // Increment patient debt by outstandingDebt only!
    if (outstandingDebt > 0) {
      await Patient.findByIdAndUpdate(req.body.patientId, {
        $inc: { debt: outstandingDebt }
      });
    }

    // Also, if paidAmount > 0, we automatically register a financial record (Ingreso)
    if (paidAmount > 0) {
      const Financial = require('../models/Financial');
      const finRecord = new Financial({
        patientId: req.body.patientId,
        appointmentId: appt._id,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        amount: paidAmount,
        method: req.body.paymentMethod || 'Efectivo',
        type: 'Ingreso',
        notes: `Abono inicial para cita de ${procedure ? procedure.name : 'Tratamiento'}`
      });
      await finRecord.save();
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

    // Calcular el estado de deuda anterior
    const oldProcedureCode = appt.procedureCode;
    const oldDiscount = appt.discount || 0;
    const oldPaidAmount = appt.paidAmount || 0;
    const oldProcedure = await Procedure.findOne({ code: oldProcedureCode });
    const oldPrice = oldProcedure ? oldProcedure.price : 0;
    const oldFinalPrice = Math.round(oldPrice * (1 - oldDiscount / 100));
    const oldDebtContrib = oldFinalPrice - oldPaidAmount;

    // Obtener los nuevos valores
    const newProcedureCode = updatedFields.procedureCode !== undefined ? updatedFields.procedureCode : appt.procedureCode;
    const newDiscount = updatedFields.discount !== undefined ? Number(updatedFields.discount) : (appt.discount || 0);
    const newPaidAmount = updatedFields.paidAmount !== undefined ? Number(updatedFields.paidAmount) : (appt.paidAmount || 0);
    
    const newProcedure = await Procedure.findOne({ code: newProcedureCode });
    const newPrice = newProcedure ? newProcedure.price : 0;
    const newFinalPrice = Math.round(newPrice * (1 - newDiscount / 100));
    const newDebtContrib = newFinalPrice - newPaidAmount;

    // Calcular diferencia diferencial
    const diffDebt = newDebtContrib - oldDebtContrib;

    // Actualizar paymentStatus en base a los nuevos valores
    updatedFields.paymentStatus = newPaidAmount >= newFinalPrice ? 'pagado'
      : newPaidAmount > 0 ? 'parcial'
      : 'deuda';

    // Ajustar la deuda del paciente diferencialmente
    if (diffDebt !== 0) {
      await Patient.findByIdAndUpdate(appt.patientId, {
        $inc: { debt: diffDebt }
      });
      // Asegurar que la deuda no quede negativa
      await Patient.updateOne(
        { _id: appt.patientId, debt: { $lt: 0 } },
        { $set: { debt: 0 } }
      );
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
