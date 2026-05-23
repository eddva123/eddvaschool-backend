import express from 'express';
import {
  onboardTeacher,
  onboardStudent,
  getCurriculum,
  createClass,
  createSubject,
  createTopic,
  addChapter,
  listTeachers,
  listStudents,
} from '../controllers/superAdminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('SUPER_ADMIN'));

// Onboard users
router.post('/teachers', onboardTeacher);
router.get('/teachers', listTeachers);
router.post('/students', onboardStudent);
router.get('/students', listStudents);

// Curriculum (classes → subjects → topics → chapters)
router.get('/curriculum', getCurriculum);
router.post('/curriculum/classes', createClass);
router.post('/curriculum/subjects', createSubject);
router.post('/curriculum/topics', createTopic);
router.post('/curriculum/topics/:topicId/chapters', addChapter);

export default router;
