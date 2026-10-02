const router = require('express').Router();
const { auth, requireRole, wrap } = require('../middleware/auth');
const statsController = require('../controllers/statsController');

router.use(auth, requireRole('ADMIN', 'TEACHER'));

router.get('/overview', wrap(statsController.overview));

router.get('/by-subject', wrap(statsController.bySubject));

router.get('/by-semester', wrap(statsController.bySemester));

router.get('/distribution', wrap(statsController.distribution));

router.get('/by-department', wrap(statsController.byDepartment));

module.exports = router;
