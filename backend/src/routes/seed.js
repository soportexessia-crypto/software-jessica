const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Doctor = require('../models/Doctor');
const Procedure = require('../models/Procedure');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Financial = require('../models/Financial');
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * POST /api/seed
 * Poblar la base de datos con los datos iniciales de la clínica.
 * Solo se debe ejecutar UNA VEZ al configurar la aplicación por primera vez.
 * Protegido con una clave secreta de semilla (SEED_SECRET en .env)
 */
router.post('/', async (req, res) => {
  try {
    const { seedSecret } = req.body;
    if (seedSecret !== process.env.SEED_SECRET) {
      return res.status(403).json({ error: 'Clave de semilla incorrecta.' });
    }

    // Limpiar colecciones
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Procedure.deleteMany({}),
      Patient.deleteMany({}),
      Appointment.deleteMany({}),
      Financial.deleteMany({})
    ]);

    // 1. Usuario: Jessica Restrepo (Secretaria)
    const passwordHash = await bcrypt.hash('Gaby12873*', 10);
    const user = await User.create({
      name: 'Jessica Restrepo',
      email: 'soporte.xessia@gmail.com',
      passwordHash,
      role: 'Secretaria'
    });

    // 2. Doctores (Se inicia vacío para que se cree desde la interfaz)
    const doctors = [];

    // 3. Procedimientos (Se inicia vacío para que se cree desde la interfaz)
    const procedures = [];

    // 4. Pacientes (Se inicia vacío para que se cree desde la interfaz)
    const patients = [];

    res.json({
      message: '✅ Base de datos inicializada correctamente.',
      counts: {
        users: 1,
        doctors: 0,
        procedures: 0,
        patients: 0
      },
      loginCredentials: {
        email: 'soporte.xessia@gmail.com',
        password: 'Gaby12873*'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
