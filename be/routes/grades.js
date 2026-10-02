const router = require('express').Router();
const multer = require('multer');
const { auth, requireRole, wrap } = require('../middleware/auth');
const gradesController = require('../controllers/gradesController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const staff = [auth, requireRole('ADMIN', 'TEACHER')];

router.get('/meta', auth, wrap(gradesController.meta));
router.get('/offerings', ...staff, wrap(gradesController.offerings));
router.get('/offerings/:id/students', ...staff, wrap(gradesController.offeringStudents));
router.post('/offerings/:id/enroll', ...staff, wrap(gradesController.enroll));
router.put('/grades/enrollment/:enrollmentId', ...staff, wrap(gradesController.updateGrade));
router.delete('/grades/:id', ...staff, wrap(gradesController.deleteGrade));
router.get('/grades/:id/history', ...staff, wrap(gradesController.gradeHistory));
router.get('/grades', ...staff, wrap(gradesController.listGrades));
router.get('/import/template', ...staff, wrap(gradesController.importTemplate));
router.post('/import/grades', ...staff, upload.single('file'), wrap(gradesController.importGrades));

module.exports = router;