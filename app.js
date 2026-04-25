const express = require('express');
const errorHandler = require('./src/middlewares/errorHandler');
const apiRoutes = require('./src/routes/api.routes');
const authRoutes   = require('./src/routes/auth.routes');
const app = express();

app.use(express.json());
// routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
// Health check route (always good to have)
app.get('/', (req, res) => {
  res.json({ message: 'API Health Monitor is running 🟢' });
});
app.use(errorHandler);
module.exports = app;
