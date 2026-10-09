const { dbGet, dbAll } = require('../../database/db');

/**
 * Safe Parameterized University Database Query Executor
 */

// 1. Get detailed student profile
async function getStudentProfile(identifier, type = 'user_id') {
  let query = `
    SELECT s.*, d.name AS dept_name, d.code AS dept_code, d.location AS dept_location,
           u.email AS user_email, u.role
    FROM students s
    JOIN departments d ON s.dept_id = d.dept_id
    JOIN users u ON s.user_id = u.user_id
  `;
  if (type === 'student_id') {
    query += ` WHERE s.student_id = ?`;
  } else if (type === 'usn') {
    query += ` WHERE UPPER(s.usn) = UPPER(?)`;
  } else {
    query += ` WHERE s.user_id = ?`;
  }
  return await dbGet(query, [identifier]);
}

// 2. Get student semester results
async function getStudentResults(studentId, semNumber = null) {
  let query = `
    SELECT r.*, sub.code AS subject_code, sub.name AS subject_name, sub.credits,
           sem.sem_number, sem.academic_year
    FROM results r
    JOIN subjects sub ON r.subject_id = sub.subject_id
    JOIN semesters sem ON r.semester_id = sem.semester_id
    WHERE r.student_id = ?
  `;
  const params = [studentId];
  if (semNumber) {
    query += ` AND r.sem_number = ?`;
    params.push(semNumber);
  }
  query += ` ORDER BY r.sem_number DESC, r.total_marks DESC`;
  return await dbAll(query, params);
}

// 3. Get student attendance records
async function getStudentAttendance(studentId, semNumber = null) {
  let query = `
    SELECT a.*, sub.code AS subject_code, sub.name AS subject_name, sub.credits,
           f.full_name AS faculty_name, f.email AS faculty_email
    FROM attendance a
    JOIN subjects sub ON a.subject_id = sub.subject_id
    LEFT JOIN faculty_subjects fs ON sub.subject_id = fs.subject_id
    LEFT JOIN faculty f ON fs.faculty_id = f.faculty_id
    WHERE a.student_id = ?
  `;
  const params = [studentId];
  if (semNumber) {
    query += ` AND a.semester_id IN (SELECT semester_id FROM semesters WHERE sem_number = ?)`;
    params.push(semNumber);
  }
  query += ` ORDER BY a.attendance_pct ASC`;
  return await dbAll(query, params);
}

// 4. Highest scorers in subject
async function getHighestScorers(subjectKeyword, limit = 5) {
  const query = `
    SELECT r.total_marks, r.grade, s.full_name, s.usn, d.code AS dept_code, sub.name AS subject_name, sub.code AS subject_code
    FROM results r
    JOIN students s ON r.student_id = s.student_id
    JOIN departments d ON s.dept_id = d.dept_id
    JOIN subjects sub ON r.subject_id = sub.subject_id
    WHERE (LOWER(sub.name) LIKE ? OR LOWER(sub.code) LIKE ?)
    ORDER BY r.total_marks DESC
    LIMIT ?
  `;
  const term = `%${subjectKeyword.toLowerCase().trim()}%`;
  return await dbAll(query, [term, term, limit]);
}

// 5. Failed students in subject
async function getFailedStudents(subjectKeyword) {
  const query = `
    SELECT r.total_marks, r.internal_marks, r.external_marks, s.full_name, s.usn, d.code AS dept_code,
           sub.name AS subject_name, sub.code AS subject_code
    FROM results r
    JOIN students s ON r.student_id = s.student_id
    JOIN departments d ON s.dept_id = d.dept_id
    JOIN subjects sub ON r.subject_id = sub.subject_id
    WHERE (LOWER(sub.name) LIKE ? OR LOWER(sub.code) LIKE ?)
      AND (r.status = 'FAIL' OR r.grade = 'F')
    ORDER BY r.total_marks ASC
  `;
  const term = `%${subjectKeyword.toLowerCase().trim()}%`;
  return await dbAll(query, [term, term]);
}

// 6. Students below attendance threshold
async function getStudentsBelowAttendance(threshold = 75, deptId = null) {
  let query = `
    SELECT a.attendance_pct, a.classes_attended, a.total_classes, a.eligibility_status,
           s.full_name, s.usn, d.code AS dept_code, sub.name AS subject_name, sub.code AS subject_code
    FROM attendance a
    JOIN students s ON a.student_id = s.student_id
    JOIN departments d ON s.dept_id = d.dept_id
    JOIN subjects sub ON a.subject_id = sub.subject_id
    WHERE a.attendance_pct < ?
  `;
  const params = [threshold];
  if (deptId) {
    query += ` AND s.dept_id = ?`;
    params.push(deptId);
  }
  query += ` ORDER BY a.attendance_pct ASC`;
  return await dbAll(query, params);
}

// 7. Faculty lookup
async function getFacultyInfo(keyword) {
  const query = `
    SELECT f.*, d.name AS dept_name, d.code AS dept_code,
           GROUP_CONCAT(sub.code || ': ' || sub.name, ', ') AS subjects_taught
    FROM faculty f
    JOIN departments d ON f.dept_id = d.dept_id
    LEFT JOIN faculty_subjects fs ON f.faculty_id = fs.faculty_id
    LEFT JOIN subjects sub ON fs.subject_id = sub.subject_id
    WHERE LOWER(f.full_name) LIKE ?
       OR LOWER(f.employee_id) LIKE ?
       OR LOWER(f.specialization) LIKE ?
       OR LOWER(sub.name) LIKE ?
       OR LOWER(sub.code) LIKE ?
       OR LOWER(d.code) LIKE ?
    GROUP BY f.faculty_id
  `;
  const term = `%${keyword.toLowerCase().trim()}%`;
  return await dbAll(query, [term, term, term, term, term, term]);
}

// 8. Department Performance comparison
async function getDepartmentPerformance() {
  const query = `
    SELECT d.dept_id, d.code, d.name, d.hod_name,
           COUNT(DISTINCT s.student_id) AS total_students,
           ROUND(AVG(s.cgpa), 2) AS avg_cgpa,
           ROUND(AVG(s.sgpa), 2) AS avg_sgpa,
           SUM(CASE WHEN s.risk_level = 'HIGH' THEN 1 ELSE 0 END) AS high_risk_count,
           SUM(CASE WHEN s.risk_level = 'LOW' THEN 1 ELSE 0 END) AS low_risk_count,
           ROUND(100.0 * SUM(CASE WHEN r.status = 'PASS' THEN 1 ELSE 0 END) / NULLIF(COUNT(r.result_id), 0), 1) AS pass_percentage
    FROM departments d
    LEFT JOIN students s ON d.dept_id = s.dept_id
    LEFT JOIN results r ON s.student_id = r.student_id
    GROUP BY d.dept_id
    ORDER BY pass_percentage DESC, avg_cgpa DESC
  `;
  return await dbAll(query);
}

// 9. University KPIs (for Admin and University queries)
async function getUniversityKPIs() {
  const studentsCount = (await dbGet(`SELECT COUNT(*) AS count FROM students`)).count;
  const facultyCount = (await dbGet(`SELECT COUNT(*) AS count FROM faculty`)).count;
  const deptCount = (await dbGet(`SELECT COUNT(*) AS count FROM departments`)).count;
  const avgCgpa = (await dbGet(`SELECT ROUND(AVG(cgpa), 2) AS val FROM students`)).val;
  
  const resultsStats = await dbGet(`
    SELECT 
      COUNT(*) AS total_results,
      SUM(CASE WHEN status = 'PASS' THEN 1 ELSE 0 END) AS passed,
      SUM(CASE WHEN status = 'FAIL' THEN 1 ELSE 0 END) AS failed
    FROM results
  `);

  const attendanceStats = await dbGet(`
    SELECT 
      ROUND(AVG(attendance_pct), 1) AS avg_attendance,
      SUM(CASE WHEN attendance_pct < 75 THEN 1 ELSE 0 END) AS shortage_count
    FROM attendance
  `);

  const riskStats = await dbGet(`
    SELECT 
      SUM(CASE WHEN risk_level = 'HIGH' THEN 1 ELSE 0 END) AS high_risk,
      SUM(CASE WHEN risk_level = 'MEDIUM' THEN 1 ELSE 0 END) AS medium_risk,
      SUM(CASE WHEN risk_level = 'LOW' THEN 1 ELSE 0 END) AS low_risk
    FROM students
  `);

  const passPct = resultsStats.total_results > 0
    ? parseFloat(((resultsStats.passed / resultsStats.total_results) * 100).toFixed(1))
    : 0;

  return {
    studentsCount,
    facultyCount,
    deptCount,
    avgCgpa,
    totalResults: resultsStats.total_results,
    passedCount: resultsStats.passed,
    failedCount: resultsStats.failed,
    passPercentage: passPct,
    avgAttendance: attendanceStats.avg_attendance,
    attendanceShortageCount: attendanceStats.shortage_count,
    highRiskStudents: riskStats.high_risk,
    mediumRiskStudents: riskStats.medium_risk,
    lowRiskStudents: riskStats.low_risk
  };
}

// 10. Top 10 University Students
async function getTop10Students(deptId = null) {
  let query = `
    SELECT s.usn, s.full_name, s.cgpa, s.sgpa, d.code AS dept_code
    FROM students s
    JOIN departments d ON s.dept_id = d.dept_id
  `;
  const params = [];
  if (deptId) {
    query += ` WHERE s.dept_id = ?`;
    params.push(deptId);
  }
  query += ` ORDER BY s.cgpa DESC, s.sgpa DESC LIMIT 10`;
  return await dbAll(query, params);
}

// 11. Subject Failure Rates
async function getSubjectFailureRates() {
  const query = `
    SELECT sub.code, sub.name, d.code AS dept_code,
           COUNT(r.result_id) AS total_enrolled,
           SUM(CASE WHEN r.status = 'FAIL' OR r.grade = 'F' THEN 1 ELSE 0 END) AS failed_count,
           ROUND(100.0 * SUM(CASE WHEN r.status = 'FAIL' OR r.grade = 'F' THEN 1 ELSE 0 END) / COUNT(r.result_id), 1) AS failure_rate,
           ROUND(AVG(r.total_marks), 1) AS avg_marks
    FROM subjects sub
    JOIN departments d ON sub.dept_id = d.dept_id
    JOIN results r ON sub.subject_id = r.subject_id
    GROUP BY sub.subject_id
    HAVING total_enrolled > 0
    ORDER BY failure_rate DESC
    LIMIT 10
  `;
  return await dbAll(query);
}

// 12. University Rules
async function getUniversityRules(category = null) {
  let query = `SELECT * FROM university_rules`;
  const params = [];
  if (category) {
    query += ` WHERE UPPER(rule_category) = UPPER(?)`;
    params.push(category);
  }
  return await dbAll(query, params);
}

// 13. Department Information & HOD lookup
async function getDepartmentInfo(deptCode = null) {
  let query = `
    SELECT d.*, 
           COUNT(DISTINCT s.student_id) AS student_count,
           COUNT(DISTINCT f.faculty_id) AS faculty_count
    FROM departments d
    LEFT JOIN students s ON d.dept_id = s.dept_id
    LEFT JOIN faculty f ON d.dept_id = f.dept_id
  `;
  const params = [];
  if (deptCode) {
    query += ` WHERE UPPER(d.code) = UPPER(?) OR LOWER(d.name) LIKE ?`;
    params.push(deptCode, `%${deptCode.toLowerCase()}%`);
  }
  query += ` GROUP BY d.dept_id ORDER BY d.code ASC`;
  return await dbAll(query, params);
}

// 14. Faculty by Department (e.g., "Show CSE faculty", "Show faculty from ECE")
async function getFacultyByDepartment(deptCode) {
  const query = `
    SELECT f.*, d.name AS dept_name, d.code AS dept_code,
           GROUP_CONCAT(sub.code || ': ' || sub.name, ', ') AS subjects_taught
    FROM faculty f
    JOIN departments d ON f.dept_id = d.dept_id
    LEFT JOIN faculty_subjects fs ON f.faculty_id = fs.faculty_id
    LEFT JOIN subjects sub ON fs.subject_id = sub.subject_id
    WHERE UPPER(d.code) = UPPER(?) OR LOWER(d.name) LIKE ?
    GROUP BY f.faculty_id
    ORDER BY f.designation DESC, f.full_name ASC
  `;
  const term = `%${deptCode.toLowerCase()}%`;
  return await dbAll(query, [deptCode, term]);
}

// 15. All Available Subjects
async function getSubjectsList(deptCode = null, semNumber = null) {
  let query = `
    SELECT sub.*, d.code AS dept_code, d.name AS dept_name,
           f.full_name AS faculty_name
    FROM subjects sub
    JOIN departments d ON sub.dept_id = d.dept_id
    LEFT JOIN faculty_subjects fs ON sub.subject_id = fs.subject_id
    LEFT JOIN faculty f ON fs.faculty_id = f.faculty_id
    WHERE 1=1
  `;
  const params = [];
  if (deptCode) {
    query += ` AND (UPPER(d.code) = UPPER(?) OR LOWER(d.name) LIKE ?)`;
    params.push(deptCode, `%${deptCode.toLowerCase()}%`);
  }
  if (semNumber) {
    query += ` AND sub.sem_number = ?`;
    params.push(semNumber);
  }
  query += ` ORDER BY sub.sem_number ASC, sub.code ASC`;
  return await dbAll(query, params);
}

// 16. Class Average Attendance
async function getClassAttendanceStats(studentId) {
  const student = await dbGet(`SELECT dept_id, current_semester, section FROM students WHERE student_id = ?`, [studentId]);
  if (!student) return null;

  const query = `
    SELECT 
      ROUND(AVG(a.attendance_pct), 1) AS class_avg_attendance,
      COUNT(DISTINCT s.student_id) AS total_class_students,
      SUM(CASE WHEN a.attendance_pct >= 75 THEN 1 ELSE 0 END) AS eligible_records,
      COUNT(a.attendance_id) AS total_records
    FROM students s
    JOIN attendance a ON s.student_id = a.student_id
    WHERE s.dept_id = ? AND s.current_semester = ? AND s.section = ?
  `;
  const stats = await dbGet(query, [student.dept_id, student.current_semester, student.section]);
  return {
    ...stats,
    dept_id: student.dept_id,
    current_semester: student.current_semester,
    section: student.section
  };
}

// 17. University Pass vs Fail Overall Statistics
async function getPassFailStats() {
  const query = `
    SELECT 
      COUNT(*) AS total_records,
      SUM(CASE WHEN status = 'PASS' THEN 1 ELSE 0 END) AS passed,
      SUM(CASE WHEN status = 'FAIL' OR grade = 'F' THEN 1 ELSE 0 END) AS failed
    FROM results
  `;
  const row = await dbGet(query);
  const total = row.total_records || 1;
  const passPct = parseFloat(((row.passed / total) * 100).toFixed(1));
  const failPct = parseFloat(((row.failed / total) * 100).toFixed(1));
  return {
    totalRecords: row.total_records,
    passed: row.passed,
    failed: row.failed,
    passPercentage: passPct,
    failPercentage: failPct
  };
}

module.exports = {
  getStudentProfile,
  getStudentResults,
  getStudentAttendance,
  getHighestScorers,
  getFailedStudents,
  getStudentsBelowAttendance,
  getFacultyInfo,
  getFacultyByDepartment,
  getDepartmentPerformance,
  getDepartmentInfo,
  getSubjectsList,
  getClassAttendanceStats,
  getPassFailStats,
  getUniversityKPIs,
  getTop10Students,
  getSubjectFailureRates,
  getUniversityRules
};
