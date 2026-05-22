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
    const passwordHash = await bcrypt.hash('xessia2024', 10);
    const user = await User.create({
      name: 'Jessica Restrepo',
      email: 'jessica@catalinaevaodontologia.com',
      passwordHash,
      role: 'Secretaria'
    });

    // 2. Doctores
    const doctors = await Doctor.insertMany([
      { name: 'Dra. Valentina Gómez',      specialty: 'Ortodoncia',                  workingDays: ['Lunes','Martes','Miércoles','Viernes'],           workingHours: '08:00 - 16:00', color: '#0f766e', avatar: 'VG' },
      { name: 'Dr. Carlos Mendoza',         specialty: 'Cirugía Oral & Implantes',    workingDays: ['Martes','Miércoles','Jueves'],                    workingHours: '09:00 - 18:00', color: '#1e3a8a', avatar: 'CM' },
      { name: 'Dra. Camila Restrepo',       specialty: 'Estética & Rehabilitación',   workingDays: ['Lunes','Jueves','Viernes'],                       workingHours: '08:00 - 17:00', color: '#4338ca', avatar: 'CR' },
      { name: 'Dr. Andrés Felipe Ortiz',    specialty: 'Odontopediatría & Integral',  workingDays: ['Lunes','Martes','Miércoles','Jueves','Viernes'],  workingHours: '07:30 - 16:30', color: '#0369a1', avatar: 'AO' },
    ]);

    // 3. Procedimientos
    const procedures = await Procedure.insertMany([
      { code: 'LIMP-01',  name: 'Limpieza Dental Profunda + Profilaxis',          category: 'LIMPIEZA Y PREVENCIÓN',        duration: 45,  price: 120000,  color: 'verde',   specialist: 'Todos',              favorite: true },
      { code: 'CONT-10',  name: 'Control de Ortodoncia Técnica Roth',              category: 'ORTODONCIA',                    duration: 30,  price: 90000,   color: 'azul',    specialist: doctors[0]._id.toString(), favorite: true },
      { code: 'RES-01',   name: 'Resina Estética Fotocurable',                    category: 'RESTAURACIÓN Y ESTÉTICA',      duration: 45,  price: 150000,  color: 'amarillo',specialist: 'Todos',              favorite: true },
      { code: 'DIAG-01',  name: 'Consulta Primera Vez + Diagnóstico',             category: 'CONSULTAS',                    duration: 30,  price: 50000,   color: 'gris',    specialist: 'Todos' },
      { code: 'RX-01',    name: 'Rayos X Periapical Interproximal',               category: 'RADIOLOGÍA',                   duration: 15,  price: 45000,   color: 'azul',    specialist: 'Todos',              alert: 'Este procedimiento requiere que el paciente use chaleco de plomo protector.' },
      { code: 'CIR-02',   name: 'Extracción Quirúrgica de Tercer Molar',          category: 'CIRUGÍA',                      duration: 60,  price: 350000,  color: 'rojo',    specialist: doctors[1]._id.toString(), alert: 'Requiere radiografía periapical o panorámica reciente.' },
      { code: 'BLANQ-01', name: 'Blanqueamiento Dental Clínico Láser',            category: 'LIMPIEZA Y PREVENCIÓN',        duration: 60,  price: 480000,  color: 'verde',   specialist: doctors[2]._id.toString() },
      { code: 'PROT-03',  name: 'Colocación Prótesis Flexible de 3 Elementos',   category: 'PRÓTESIS Y REHABILITACIÓN',    duration: 90,  price: 1200000, color: 'gris',    specialist: doctors[2]._id.toString(), alert: 'Requiere toma previa de impresiones de silicona.' },
    ]);

    // 4. Pacientes de ejemplo
    const patients = await Patient.insertMany([
      { name: 'María Camila Restrepo Cardona', document: '1020493821', phone: '+57 312 849 5723', whatsapp: '573128495723', address: 'Calle 10 # 43A - 25, El Poblado, Medellín', birthDate: '1995-08-15', gender: 'Femenino', email: 'm.camila.restrepo@gmail.com', eps: 'EPS SURA', allergies: 'Penicilina y derivados', observations: 'Paciente con ortodoncia activa. Extremadamente puntual.', debt: 0 },
      { name: 'Juan Sebastián Montoya Ruiz',   document: '71293847',   phone: '+57 315 284 9472', whatsapp: '573152849472', address: 'Carrera 48 # 26 Sur - 84, Envigado',       birthDate: '1988-12-03', gender: 'Masculino', email: 'juan.montoya88@gmail.com',       eps: 'Sanitas EPS',              allergies: 'Ninguna conocida', observations: 'Requiere abonos en efectivo debido a subsidio empresarial.', debt: 150000 },
      { name: 'Lucía Fernanda Tobón Castro',   document: '1039482910', phone: '+57 320 482 9182', whatsapp: '573204829182', address: 'Calle 77 Sur # 40 - 12, Sabaneta',        birthDate: '2001-04-22', gender: 'Femenino', email: 'lu.tobonc@outlook.com',           eps: 'Colsanitas Medicina Prepagada', allergies: 'Ninguna conocida', observations: 'Paciente ansiosa ante los ruidos del taladro, requiere manejo de relajación.', debt: 0 },
    ]);

    res.json({
      message: '✅ Base de datos inicializada correctamente.',
      counts: {
        users: 1,
        doctors: doctors.length,
        procedures: procedures.length,
        patients: patients.length
      },
      loginCredentials: {
        email: 'jessica@catalinaevaodontologia.com',
        password: 'xessia2024'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
