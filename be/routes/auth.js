const router = require('express').Router();
const { auth, wrap } = require('../middleware/auth');
const authController = require('../controllers/authController');

router.post('/login', wrap(authController.login));

router.get('/me', auth, wrap(authController.me));

router.post('/change-password', auth, wrap(authController.changePassword));

module.exports = router;
