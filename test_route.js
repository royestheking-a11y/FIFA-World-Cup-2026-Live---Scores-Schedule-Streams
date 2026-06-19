const express = require('express');
const app = express();
try {
  app.get('/{*splat}', (req, res) => res.send('OK'));
  console.log('Route added successfully');
} catch (e) {
  console.error('Error adding route:', e.message);
}
