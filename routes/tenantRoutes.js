const express = require('express');
const router = express.Router();
const { verifyToken, tenantOnly, checkTenantValidity } = require('../middleware/auth');

// Controllers
const { getStats } = require('../controllers/dashboardController');
const classController = require('../controllers/classController');
const studentController = require('../controllers/studentController');
const attendanceController = require('../controllers/attendanceController');
const examController = require('../controllers/examController');

// All routes require tenant authentication and validity check
router.use(verifyToken, tenantOnly, checkTenantValidity);

// Dashboard
router.get('/stats', getStats);

// Classes
router.get('/classes', classController.getClasses);
router.get('/classes/:id', classController.getClass);
router.post('/classes', classController.createClass);
router.put('/classes/:id', classController.updateClass);
router.delete('/classes/:id', classController.deleteClass);

// Students
router.get('/students', studentController.getStudents);
router.get('/students/:id', studentController.getStudent);
router.post('/students', studentController.createStudent);
router.put('/students/:id', studentController.updateStudent);
router.get('/students/:id/qr', studentController.getQRCode);

// Attendance
router.get('/attendance/:classId/:date', attendanceController.getClassAttendance);
router.post('/attendance', attendanceController.saveAttendance);
router.get('/attendance/report', attendanceController.getAttendanceReport);
router.get('/attendance/stats', attendanceController.getAttendanceStats);

// Exams
router.get('/exams', examController.getExams);
router.get('/exams/:id', examController.getExam);
router.post('/exams', examController.createExam);
router.put('/exams/:id', examController.updateExam);
router.delete('/exams/:id', examController.deleteExam);

// Marks
router.get('/exams/:examId/marks', examController.getMarks);
router.post('/marks', examController.saveMarks);

// Reports
router.get('/reports/student/:studentId', examController.getStudentReport);

module.exports = router;
