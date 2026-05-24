const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Financial = require('../models/Financial');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Procedure = require('../models/Procedure');
const auth = require('../middleware/auth');

// Configurar multer para guardar fotos de comprobantes
const uploadDir = path.join(__dirname, '../../uploads/receipts');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `receipt-${unique}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes.'));
  }
});

// GET /api/financials — todos los registros de caja
router.get('/', auth, async (req, res) => {
  try {
    const { date, type, patientId } = req.query;
    let filter = {};
    if (date)      filter.date = { $regex: `^${date}` };
    if (type)      filter.type = type;
    if (patientId) filter.patientId = patientId;

    const records = await Financial.find(filter).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/financials — registrar ingreso o egreso
router.post('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const dateStr = req.body.date || req.body.localDate || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const record = new Financial({ ...req.body, date: dateStr });
    await record.save();

    // Si es Ingreso de un paciente → reducir su deuda
    if (record.type === 'Ingreso' && record.patientId) {
      await Patient.findByIdAndUpdate(record.patientId, {
        $inc: { debt: -record.amount }
      });
      // Nunca deuda negativa
      await Patient.updateOne(
        { _id: record.patientId, debt: { $lt: 0 } },
        { $set: { debt: 0 } }
      );

      // Si tiene cita vinculada → actualizar su paidAmount y paymentStatus
      if (record.appointmentId) {
        const appt = await Appointment.findById(record.appointmentId);
        if (appt) {
          const newPaid = appt.paidAmount + record.amount;
          const procedure = await Procedure.findOne({ code: appt.procedureCode });
          const price = procedure ? procedure.price : 0;
          const pStatus = newPaid >= price ? 'pagado' : newPaid > 0 ? 'parcial' : 'deuda';
          appt.paidAmount = newPaid;
          appt.paymentStatus = pStatus;
          await appt.save();
        }
      }
    }

    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/financials/upload-receipt — subir foto de comprobante
router.post('/upload-receipt', auth, upload.single('receipt'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });
  const url = `/uploads/receipts/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
