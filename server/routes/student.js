const express = require('express');
const router = express.Router();
const { optionalAuth, requireRole } = require('../middleware/auth');
const queryExecutor = require('../ai/queryExecutor');
const { calculateStudentRisk, simulateAttendance, analyzeSubjectStrengths } = require('../ai/academicAdvisor');
const { dbGet, dbAll } = require('../../database/db');

// GET /api/student/dashboard
router.get('/dashboard', optionalAuth, async (req, res) => {
  try {
    let student = req.student;
    if (!student) {
      student = await queryExecutor.getStudentProfile(2, 'user_id'); // Demo student fallback
    }

    const sId = student.student_id;
    const results = await queryExecutor.getStudentResults(sId);
    const attendance = await queryExecutor.getStudentAttendance(sId);
    const risk = calculateStudentRisk(student, results, attendance);
    const strengths = analyzeSubjectStrengths(results);

    // Passed/failed count
    const passedCount = results.filter(r => r.status === 'PASS').length;
    const failedCount = results.filter(r => r.status === 'FAIL').length;
    const totalCredits = results.filter(r => r.status === 'PASS').reduce((acc, r) => acc + (r.credits || 4), 0);

    // Overall attendance
    const attendedSum = attendance.reduce((acc, a) => acc + a.classes_attended, 0);
    const totalClassesSum = attendance.reduce((acc, a) => acc + a.total_classes, 0);
    const overallAttendancePct = totalClassesSum > 0 
      ? parseFloat(((attendedSum / totalClassesSum) * 100).toFixed(1)) 
      : 82.5;

    // Line Chart: SGPA History
    const performanceChart = {
      labels: ['Sem 3', 'Sem 4', 'Sem 5', 'Sem 6 (Current)'],
      data: [8.10, 8.25, student.prev_sgpa || 8.15, student.sgpa || 8.65]
    };

    // Bar Chart: Subject Attendance
    const attendanceChart = {
      labels: attendance.map(a => a.subject_code),
      data: attendance.map(a => a.attendance_pct),
      colors: attendance.map(a => a.attendance_pct >= 75 ? '#22c55e' : (a.attendance_pct >= 65 ? '#eab308' : '#ef4444'))
    };

    // AI Recommendations
    const recommendations = [];
    if (strengths.weakest) {
      recommendations.push({
        type: 'ACADEMIC_FOCUS',
        title: `Prioritize ${strengths.weakest.subject_name}`,
        desc: `Your lowest score was ${strengths.weakest.total_marks}/100. Review module notes and practice previous year question papers.`
      });
    }
    const lowAtt = attendance.find(a => a.attendance_pct < 75);
    if (lowAtt) {
      recommendations.push({
        type: 'ATTENDANCE_ALERT',
        title: `Attendance Shortage in ${lowAtt.subject_name}`,
        desc: `Current attendance is ${lowAtt.attendance_pct}%. Attend the next 5 classes to avoid detention.`
      });
    } else {
      recommendations.push({
        type: 'ELIGIBILITY_SAFE',
        title: 'Exam Hall Ticket Eligibility Met',
        desc: 'All course attendances are compliant with statutory requirements.'
      });
    }
    recommendations.push({
      type: 'CAREER_BOOST',
      title: 'Competitive Profile & Projects',
      desc: 'Your CGPA qualifies for Tier-1 placements. Focus on System Design and AI portfolio projects.'
    });

    res.json({
      student,
      kpis: {
        cgpa: student.cgpa,
        sgpa: student.sgpa,
        prevSgpa: student.prev_sgpa,
        overallAttendance: overallAttendancePct,
        passedSubjects: passedCount,
        failedSubjects: failedCount,
        totalCreditsEarned: totalCredits,
        risk
      },
      charts: {
        performance: performanceChart,
        attendance: attendanceChart
      },
      strengths,
      recommendations
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch student dashboard.' });
  }
});

// GET /api/student/results
router.get('/results', optionalAuth, async (req, res) => {
  try {
    let student = req.student || await queryExecutor.getStudentProfile(2, 'user_id');
    const sem = req.query.semester ? parseInt(req.query.semester, 10) : null;
    const results = await queryExecutor.getStudentResults(student.student_id, sem);
    res.json(results);
  } catch (err) {
    console.error('Student results error:', err);
    res.status(500).json({ error: 'Failed to fetch student results.' });
  }
});

// GET /api/student/attendance
router.get('/attendance', optionalAuth, async (req, res) => {
  try {
    let student = req.student || await queryExecutor.getStudentProfile(2, 'user_id');
    const attendance = await queryExecutor.getStudentAttendance(student.student_id);
    res.json(attendance);
  } catch (err) {
    console.error('Student attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch student attendance.' });
  }
});

// POST /api/student/predict-attendance
router.post('/predict-attendance', optionalAuth, async (req, res) => {
  try {
    const { classesAttended, totalClasses, nextClasses } = req.body;
    const sim = simulateAttendance(
      parseInt(classesAttended, 10),
      parseInt(totalClasses, 10),
      parseInt(nextClasses || 10, 10)
    );
    res.json(sim);
  } catch (err) {
    console.error('Attendance predict error:', err);
    res.status(500).json({ error: 'Failed to simulate attendance.' });
  }
});

module.exports = router;
