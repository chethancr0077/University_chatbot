const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const queryExecutor = require('../ai/queryExecutor');
const { dbAll } = require('../../database/db');

// GET /api/admin/dashboard
router.get('/dashboard', optionalAuth, async (req, res) => {
  try {
    const kpis = await queryExecutor.getUniversityKPIs();
    const depts = await queryExecutor.getDepartmentPerformance();
    const riskStudents = await dbAll(
      `SELECT s.student_id, s.usn, s.full_name, s.cgpa, s.sgpa, s.prev_sgpa, s.risk_level, s.risk_reason, d.code AS dept_code
       FROM students s
       JOIN departments d ON s.dept_id = d.dept_id
       WHERE s.risk_level IN ('HIGH', 'MEDIUM')
       ORDER BY CASE WHEN s.risk_level = 'HIGH' THEN 1 ELSE 2 END, s.cgpa ASC`
    );

    const failureRates = await queryExecutor.getSubjectFailureRates();

    res.json({
      kpis,
      departments: depts,
      riskStudents,
      failureRates
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch admin dashboard.' });
  }
});

// GET /api/admin/students
router.get('/students', optionalAuth, async (req, res) => {
  try {
    const students = await dbAll(
      `SELECT s.*, d.name AS dept_name, d.code AS dept_code
       FROM students s
       JOIN departments d ON s.dept_id = d.dept_id
       ORDER BY s.cgpa DESC`
    );
    res.json(students);
  } catch (err) {
    console.error('Admin students error:', err);
    res.status(500).json({ error: 'Failed to fetch students list.' });
  }
});

// GET /api/admin/faculty
router.get('/faculty', optionalAuth, async (req, res) => {
  try {
    const faculty = await queryExecutor.getFacultyInfo('');
    res.json(faculty);
  } catch (err) {
    console.error('Admin faculty error:', err);
    res.status(500).json({ error: 'Failed to fetch faculty list.' });
  }
});

module.exports = router;
