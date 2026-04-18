const express             = require('express');
const router              = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect }         = require('../middlewares/auth.middleware');

router.post('/register', register);  // public
router.post('/login',    login);     // public
router.get('/me',        protect, getMe); // protected

module.exports = router;