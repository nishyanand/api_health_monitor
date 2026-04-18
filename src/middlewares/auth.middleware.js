const jwt = require('jsonwebtoken');

function protect(req, res, next) {
  try {
    // token must be sent in header like:
    // Authorization: Bearer eyJhbGci...
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login first.',
      });
    }

    // extract token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    // verify token — throws error if invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // attach userId to request so controllers can use it
    req.userId = decoded.userId;

    // move to next middleware or controller
    next();

  } catch (error) {
    // token is invalid or expired
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.',
    });
  }
}

module.exports = { protect };