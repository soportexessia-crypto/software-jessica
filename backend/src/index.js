require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const connectDB = require('./db');

const app = express();

// Autoevaluación y compilación dinámica del frontend (Self-healing)
global.buildLogs = 'No background execution needed (Frontend build already exists).';
global.buildError = null;

const distPath = path.join(__dirname, '../../dist');
const indexPath = path.join(distPath, 'index.html');
console.log('🔍 Checking frontend build at:', indexPath);
if (!fs.existsSync(indexPath)) {
  console.log('⚠️ Frontend build not found! Attempting to build dynamically in the background...');
  global.buildLogs = 'Build in progress... Check back in a few seconds.';
  exec('npm run build', { cwd: path.join(__dirname, '../..') }, (error, stdout, stderr) => {
    if (error) {
      global.buildError = {
        message: error.message,
        stdout: stdout ? stdout.toString() : '',
        stderr: stderr ? stderr.toString() : ''
      };
      console.error('❌ Dynamic frontend build failed:', error.message);
    } else {
      global.buildLogs = stdout ? stdout.toString() : 'Success!';
      console.log('✅ Dynamic frontend build completed successfully!');
    }
  });
} else {
  console.log('✅ Frontend build found at:', indexPath);
}

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
  res.json({ status: 'ok', version: '1.0.1', app: 'XESSIA Backend' });
});

// Logs de compilación dinámica para diagnóstico
app.get('/api/build-logs', (req, res) => {
  res.json({
    logs: global.buildLogs,
    error: global.buildError
  });
});

// Redirigir cualquier otra petición al index.html del frontend (para soporte de React Router/SPA)
app.get(['/', '/*splat'], (req, res, next) => {
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
