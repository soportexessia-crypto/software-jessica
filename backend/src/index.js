require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');

const app = express();

// Conectar a MongoDB Atlas
connectDB();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Permitir cualquier origen (Capacitor mobile, Electron, desarrollo, etc.) o sin origen (Postman/cURL)
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos subidos (fotos de comprobantes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Servir el frontend compilado (React)
app.use(express.static(path.join(__dirname, '../../dist')));

// Rutas
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/patients',     require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/financials',   require('./routes/financials'));
app.use('/api/doctors',      require('./routes/doctors'));
app.use('/api/procedures',   require('./routes/procedures'));
app.use('/api/system',       require('./routes/system'));
app.use('/api/seed',         require('./routes/seed'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', app: 'XESSIA Backend' });
});

// Redirigir cualquier otra petición al index.html del frontend (para soporte de React Router/SPA)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 XESSIA Backend corriendo en http://localhost:${PORT}`);
});

module.exports = app;
