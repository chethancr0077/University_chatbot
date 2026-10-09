/**
 * Academic Advisor & Risk Engine
 * Computes analytics, risk classifications, what-if attendance simulations, and recommendations.
 */

function calculateStudentRisk(student, results = [], attendanceRecords = []) {
  const issues = [];
  let riskLevel = 'LOW';

  // 1. Attendance Check
  let lowestAttendancePct = 100;
  let overallAttended = 0;
  let overallTotal = 0;
  let shortageSubjects = [];

  for (const a of attendanceRecords) {
    overallAttended += a.classes_attended;
    overallTotal += a.total_classes;
    if (a.attendance_pct < lowestAttendancePct) {
      lowestAttendancePct = a.attendance_pct;
    }
    if (a.attendance_pct < 75) {
      shortageSubjects.push(`${a.subject_name || a.code} (${a.attendance_pct}%)`);
    }
  }

  const avgAttendance = overallTotal > 0 ? parseFloat(((overallAttended / overallTotal) * 100).toFixed(1)) : 85;

  if (avgAttendance < 65 || lowestAttendancePct < 60) {
    riskLevel = 'HIGH';
    issues.push(`Critical attendance shortage: Overall is ${avgAttendance}%, lowest subject at ${lowestAttendancePct}%`);
  } else if (avgAttendance < 75 || shortageSubjects.length > 0) {
    if (riskLevel !== 'HIGH') riskLevel = 'MEDIUM';
    issues.push(`Attendance below 75% in: ${shortageSubjects.join(', ')}`);
  }

  // 2. Failed Subjects & Backlogs
  const failedResults = results.filter(r => r.status === 'FAIL' || r.grade === 'F');
  if (failedResults.length >= 2) {
    riskLevel = 'HIGH';
    issues.push(`Multiple active backlogs (${failedResults.length} subjects: ${failedResults.map(r => r.subject_name || r.code).join(', ')})`);
  } else if (failedResults.length === 1) {
    if (riskLevel !== 'HIGH') riskLevel = 'MEDIUM';
    issues.push(`1 active backlog in ${failedResults[0].subject_name || failedResults[0].code}`);
  }

  // 3. Falling SGPA Trend
  if (student.prev_sgpa && student.sgpa) {
    const drop = student.prev_sgpa - student.sgpa;
    if (drop >= 1.5) {
      riskLevel = 'HIGH';
      issues.push(`Steep academic decline: SGPA dropped sharply by ${drop.toFixed(2)} (from ${student.prev_sgpa} to ${student.sgpa})`);
    } else if (drop >= 0.5) {
      if (riskLevel !== 'HIGH') riskLevel = 'MEDIUM';
      issues.push(`SGPA decreased by ${drop.toFixed(2)} compared to last semester`);
    }
  }

  // 4. Low CGPA check
  if (student.cgpa < 6.0) {
    riskLevel = 'HIGH';
    issues.push(`CGPA is ${student.cgpa}, below recommended academic standing threshold`);
  } else if (student.cgpa < 6.8) {
    if (riskLevel !== 'HIGH') riskLevel = 'MEDIUM';
    issues.push(`CGPA is ${student.cgpa}`);
  }

  const badge = riskLevel === 'HIGH' ? '🔴 High Risk' : (riskLevel === 'MEDIUM' ? '🟡 Medium Risk' : '🟢 Low Risk');
  const explanation = issues.length > 0 
    ? issues.join('; ') 
    : 'Strong academic performance with steady SGPA and compliant attendance.';

  return {
    riskLevel,
    badge,
    explanation,
    avgAttendance,
    lowestAttendancePct,
    shortageSubjects,
    backlogsCount: failedResults.length,
    sgpaDrop: (student.prev_sgpa && student.sgpa) ? (student.prev_sgpa - student.sgpa).toFixed(2) : 0
  };
}

// Attendance What-If Predictor
function simulateAttendance(classesAttended, totalClasses, nextClassesToAttend = 10) {
  const currentPct = parseFloat(((classesAttended / totalClasses) * 100).toFixed(1));
  const newAttended = classesAttended + nextClassesToAttend;
  const newTotal = totalClasses + nextClassesToAttend;
  const newPct = parseFloat(((newAttended / newTotal) * 100).toFixed(1));
  const changePct = parseFloat((newPct - currentPct).toFixed(1));

  // Classes needed to reach 75%
  let classesNeededFor75 = 0;
  if (currentPct < 75) {
    // (A + x) / (T + x) = 0.75 => A + x = 0.75T + 0.75x => 0.25x = 0.75T - A => x = 3T - 4A
    const needed = Math.ceil((0.75 * totalClasses - classesAttended) / 0.25);
    classesNeededFor75 = Math.max(0, needed);
  }

  // Classes student can safely skip while staying >= 75%
  let safeSkips = 0;
  if (currentPct >= 75) {
    // A / (T + y) >= 0.75 => T + y <= A / 0.75 => y <= (A / 0.75) - T
    const maxTotalAllowed = Math.floor(classesAttended / 0.75);
    safeSkips = Math.max(0, maxTotalAllowed - totalClasses);
  }

  return {
    currentPct,
    classesAttended,
    totalClasses,
    nextClassesToAttend,
    newPct,
    changePct,
    classesNeededFor75,
    safeSkips,
    willBeEligible: newPct >= 75
  };
}

// Analyze strengths and weaknesses from marks
function analyzeSubjectStrengths(results = []) {
  if (!results.length) return { strongest: null, weakest: null, passedCount: 0, failedCount: 0, avgMarks: 0 };

  const sorted = [...results].sort((a, b) => b.total_marks - a.total_marks);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const totalSum = results.reduce((acc, r) => acc + r.total_marks, 0);
  const avgMarks = parseFloat((totalSum / results.length).toFixed(1));

  return {
    strongest,
    weakest,
    passedCount: passed,
    failedCount: failed,
    avgMarks,
    sorted
  };
}

module.exports = {
  calculateStudentRisk,
  simulateAttendance,
  analyzeSubjectStrengths
};
