const errorHandler = (err, req, res, next) => {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('ERROR MESSAGE:', err.message);
  console.error('ERROR STACK:', err.stack);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;