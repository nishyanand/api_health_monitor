const express = require('express');
const errorHandler = require('./src/middlewares/errorHandler');
const app = express();

app.use(express.json());

// Health check route (always good to have)
app.get('/', (req, res) => {
  res.json({ message: 'API Health Monitor is running 🟢' });
});

module.exports = app;
app.use(errorHandler);