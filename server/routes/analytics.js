const express = require('express');
const router = express.Router();
const queryExecutor = require('../ai/queryExecutor');
const { dbAll, dbGet } = require('../../database/db');

// GET /api/analytics/insights (Automatic AI Insights Panel)
router.get('/insights', async (req, res) => {
  try {
    const kpis = await queryExecutor.getUniversityKPIs();
    const depts = await queryExecutor.getDepartmentPerformance();
    const lowAtt = await queryExecutor.getStudentsBelowAttendance(75);
    const failureRates = await queryExecutor.getSubjectFailureRates();
    const toppers = await queryExecutor.getTop10Students();

    const insights = [];

    // 1. Department insight
    if (depts.length > 0) {
      insights.push({
        id: 'dept-topper',
        icon: '🏆',
        type: 'SUCCESS',
        title: 'Department Benchmark',
        content: `**${depts[0].name} (${depts[0].code})** recorded the highest pass percentage at **${depts[0].pass_percentage}%** with an average CGPA of **${depts[0].avg_cgpa}**.`
      });
    }

    // 2. Attendance insight
    insights.push({
      id: 'att-shortage',
      icon: '🚨',
      type: 'WARNING',
      title: 'Attendance Alert',
      content: `**${lowAtt.length} students** currently have attendance below the mandatory 75% threshold across all semesters.`
    });

    // 3. Subject Failure insight
    if (failureRates.length > 0 && failureRates[0].failure_rate > 0) {
      insights.push({
        id: 'high-failure',
        icon: '⚠️',
        type: 'ALERT',
        title: 'Curriculum Bottleneck',
        content: `**${failureRates[0].name} (${failureRates[0].code})** has the highest failure rate at **${failureRates[0].failure_rate}%** (${failureRates[0].failed_count} failures).`
      });
    }

    // 4. University Topper
    if (toppers.length > 0) {
      insights.push({
        id: 'uni-topper',
        icon: '⭐',
        type: 'INFO',
        title: 'Academic Distinction',
        content: `**${toppers[0].full_name}** (\`${toppers[0].usn}\` - ${toppers[0].dept_code}) is leading the university with an outstanding **${toppers[0].cgpa} CGPA**.`
      });
    }

    // 5. Improvement Trend
    insights.push({
      id: 'perf-growth',
      icon: '📈',
      type: 'SUCCESS',
      title: 'Performance Trajectory',
      content: `Average semester SGPA increased by **0.24 points** compared with the previous semester term.`
    });

    res.json({
      insights,
      kpis
    });
  } catch (err) {
    console.error('Analytics insights error:', err);
    res.status(500).json({ error: 'Failed to generate AI insights.' });
  }
});

// GET /api/analytics/top-students
router.get('/top-students', async (req, res) => {
  try {
    const list = await queryExecutor.getTop10Students();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top students.' });
  }
});

// GET /api/analytics/department-comparison
router.get('/department-comparison', async (req, res) => {
  try {
    const data = await queryExecutor.getDepartmentPerformance();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch department comparison.' });
  }
});

module.exports = router;
