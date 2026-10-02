const router = require('express').Router();
const { auth, requireRole, wrap } = require('../middleware/auth');
const studentsController = require('../controllers/studentsController');

router.get('/me/transcript', auth, requireRole('STUDENT'), wrap(studentsController.myTranscript));
router.get('/', auth, requireRole('ADMIN', 'TEACHER'), wrap(studentsController.list));
router.get('/:id/transcript', auth, requireRole('ADMIN', 'TEACHER'), wrap(studentsController.transcript));
router.post('/', auth, requireRole('ADMIN'), wrap(studentsController.create));
router.put('/:id', auth, requireRole('ADMIN'), wrap(studentsController.update));
router.delete('/:id', auth, requireRole('ADMIN'), wrap(studentsController.remove));

module.exports = router;
