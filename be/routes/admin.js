const router = require('express').Router();
const { auth, requireRole, wrap } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(auth, requireRole('ADMIN'));

router.get('/users', wrap(adminController.listUsers));
router.patch('/users/:id/active', wrap(adminController.setActive));
router.post('/users/:id/reset-password', wrap(adminController.resetPassword));

module.exports = router;
