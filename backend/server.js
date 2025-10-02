const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AuraFlow backend is running' });
});

app.listen(PORT, () => {
  console.log(`AuraFlow backend running on port ${PORT}`);
});
