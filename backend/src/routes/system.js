const express = require('express');
const router = express.Router();

// GET /api/system/version
router.get('/version', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;

  res.json({
    minVersion: process.env.MIN_VERSION || '1.0.1',
    latestVersion: process.env.LATEST_VERSION || '1.0.1',
    downloadWindows: process.env.DOWNLOAD_WINDOWS || `${baseUrl}/uploads/releases/XESSIA_Setup.exe`,
    downloadAndroid: process.env.DOWNLOAD_ANDROID || `${baseUrl}/uploads/releases/XESSIA.apk`
  });
});

module.exports = router;
