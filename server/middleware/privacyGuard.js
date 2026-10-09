/**
 * Privacy Guard & RBAC Checker
 * Enforces role-based data isolation so students cannot inspect other students' personal records.
 */

function checkDataPrivacy(user, targetStudent, actionType = 'VIEW_MARKS') {
  if (!user) {
    return {
      allowed: false,
      message: 'I can only provide academic information that you are authorized to access. Please sign in.'
    };
  }

  // Admins have university-wide oversight
  if (user.role === 'admin') {
    return { allowed: true };
  }

  // Faculty can access academic records of students
  if (user.role === 'faculty') {
    return { allowed: true };
  }

  // Students can only access their OWN data
  if (user.role === 'student') {
    if (!targetStudent) {
      return { allowed: true }; // General public/university info is ok
    }

    // Check if target matches authenticated student
    const isSelf = (targetStudent.student_id && targetStudent.student_id === user.student_id) ||
                   (targetStudent.user_id && targetStudent.user_id === user.user_id) ||
                   (targetStudent.usn && targetStudent.usn.toLowerCase() === (user.usn || '').toLowerCase());

    if (!isSelf) {
      return {
        allowed: false,
        message: '🔒 **Privacy Restriction**: I can only provide academic information that you are authorized to access. You cannot view another student\'s private marks, grades, or attendance records.'
      };
    }
  }

  return { allowed: true };
}

// Regex detector for unauthorized peer student snooping
function detectUnauthorizedStudentTarget(user, queryText, knownStudents = []) {
  if (user.role === 'admin' || user.role === 'faculty') {
    return null; // Allowed
  }

  const lower = queryText.toLowerCase();

  // If query specifically mentions another student's name or USN while logged in as a student
  for (const st of knownStudents) {
    if (st.user_id === user.user_id) continue; // It's themself

    const nameParts = st.full_name.toLowerCase().split(' ');
    const firstName = nameParts[0];
    const usnMatch = lower.includes(st.usn.toLowerCase());
    const fullNameMatch = lower.includes(st.full_name.toLowerCase());
    const firstNameMatch = firstName.length > 3 && new RegExp(`\\b${firstName}\\b`, 'i').test(lower);

    // If looking up marks, attendance, results, score, CGPA of someone else
    const isAcademicLookup = /mark|score|grade|cgpa|sgpa|result|attendance|percentage|fail|pass/i.test(lower);

    if ((usnMatch || fullNameMatch || (firstNameMatch && isAcademicLookup)) && isAcademicLookup) {
      return {
        targetName: st.full_name,
        targetUsn: st.usn,
        violation: true
      };
    }
  }

  return null;
}

module.exports = {
  checkDataPrivacy,
  detectUnauthorizedStudentTarget
};
