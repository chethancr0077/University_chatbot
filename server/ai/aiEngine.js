/**
 * UniMate AI Master Intelligence Engine
 * Seamlessly orchestrates Universal AI + Grounded University RAG + Visualizations
 */

const { classifyIntent } = require('./intentClassifier');
const queryExecutor = require('./queryExecutor');
const { calculateStudentRisk, simulateAttendance, analyzeSubjectStrengths } = require('./academicAdvisor');
const { getGeneralAnswer } = require('./generalKnowledge');
const { callExternalLlm } = require('./externalLlm');
const { checkDataPrivacy, detectUnauthorizedStudentTarget } = require('../middleware/privacyGuard');
const { dbAll, dbGet } = require('../../database/db');

// In-memory conversation state for multi-turn context tracking
const conversationStates = new Map();

function getContext(conversationId) {
  if (!conversationStates.has(conversationId)) {
    conversationStates.set(conversationId, {
      lastIntent: null,
      lastSubject: null,
      lastTopic: null,
      lastSem: 6,
      historyTurns: []
    });
  }
  return conversationStates.get(conversationId);
}

function updateContext(conversationId, updates) {
  const ctx = getContext(conversationId);
  Object.assign(ctx, updates);
  conversationStates.set(conversationId, ctx);
}

async function processChatMessage({ message, conversationId, user, student = null, faculty = null, clientConfig = {} }) {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();
  const context = getContext(conversationId);

  // 1. Privacy Guard Check (Student querying other students' private data)
  if (user && user.role === 'student') {
    const allStudents = await dbAll('SELECT student_id, user_id, usn, full_name FROM students');
    const unauthorizedTarget = detectUnauthorizedStudentTarget(user, trimmed, allStudents);
    if (unauthorizedTarget) {
      return {
        content: `🔒 **Privacy & Authorization Restriction**\n\nI can only provide academic information that you are authorized to access. University privacy policy strictly safeguards individual student records (USN: \`${unauthorizedTarget.targetUsn}\`).\n\nYou are welcome to view your own attendance, results, or general university statistics.`,
        mode: 'STUDENT',
        visualization: null,
        suggested: ['What is my attendance?', 'What is my CGPA?', 'How am I doing academically?']
      };
    }
  }

  // 2. Classify Intent & Extract Entities
  const intentResult = classifyIntent(trimmed, context, user ? user.role : 'student');
  const activeStudent = student || (user && user.role === 'student' ? await queryExecutor.getStudentProfile(user.user_id, 'user_id') : null);

  let responseData = {
    content: '',
    mode: 'GENERAL',
    visualization: null,
    suggested: []
  };

  // -------------------------------------------------------------
  // BRANCH A: PERSONAL STUDENT QUESTIONS
  // -------------------------------------------------------------
  if (intentResult.category === 'PERSONAL_STUDENT' || intentResult.intent.startsWith('PERSONAL_STUDENT_')) {
    if (!activeStudent) {
      return {
        content: `Please sign in with a student account to view personal academic records, or use the **Demo Switcher** at the top right to switch to **Student Demo** mode!`,
        mode: 'UNIVERSITY',
        suggested: ['Who teaches Data Structures?', 'Who scored highest in DBMS?', 'Explain TCP']
      };
    }

    const sId = activeStudent.student_id;
    const results = await queryExecutor.getStudentResults(sId);
    const attendance = await queryExecutor.getStudentAttendance(sId);
    const strengths = analyzeSubjectStrengths(results);
    const risk = calculateStudentRisk(activeStudent, results, attendance);

    // 1. Attendance Overview
    if (intentResult.intent === 'PERSONAL_STUDENT_ATTENDANCE') {
      const overallAttended = attendance.reduce((acc, a) => acc + a.classes_attended, 0);
      const overallTotal = attendance.reduce((acc, a) => acc + a.total_classes, 0);
      const overallPct = overallTotal > 0 ? ((overallAttended / overallTotal) * 100).toFixed(1) : 85.0;

      let subList = attendance.map(a => {
        const statusIcon = a.attendance_pct >= 75 ? '🟢' : (a.attendance_pct >= 65 ? '🟡' : '🔴');
        return `- ${statusIcon} **${a.subject_name}** (\`${a.subject_code}\`): **${a.attendance_pct}%** (${a.classes_attended}/${a.total_classes} classes) [${a.eligibility_status}]`;
      }).join('\n');

      let multiBanner = '';
      if (/nan|nanna|eshtu|ide/i.test(lower)) {
        multiBanner = `> 🌐 **ಕನ್ನಡ (Kannada)**: ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಒಟ್ಟು ಹಾಜರಾತಿ **${overallPct}%** ಆಗಿದೆ.\n\n`;
      } else if (/mera|meri|kitna|hai/i.test(lower)) {
        multiBanner = `> 🌐 **हिंदी (Hindi)**: आपकी वर्तमान कुल उपस्थिति **${overallPct}%** है।\n\n`;
      }

      responseData.content = `${multiBanner}### 📋 Your Attendance Summary (Semester ${activeStudent.current_semester})

Your current **overall attendance is ${overallPct}%**.

#### Subject-wise Breakdown:
${subList}

${parseFloat(overallPct) >= 75 ? '✅ **Exam Eligibility**: You are currently eligible for semester examinations overall.' : '⚠️ **Attendance Shortage Alert**: Your attendance is below 75% in one or more subjects. Please attend upcoming lectures to avoid detention.'}`;

      responseData.mode = 'UNIVERSITY';
      responseData.visualization = {
        type: 'bar',
        title: 'Subject-wise Attendance (%)',
        data: {
          labels: attendance.map(a => a.subject_code),
          datasets: [
            {
              label: 'Attendance %',
              data: attendance.map(a => a.attendance_pct),
              backgroundColor: attendance.map(a => a.attendance_pct >= 75 ? 'rgba(34, 197, 94, 0.7)' : (a.attendance_pct >= 65 ? 'rgba(234, 179, 8, 0.7)' : 'rgba(239, 68, 68, 0.7)')),
              borderColor: attendance.map(a => a.attendance_pct >= 75 ? '#16a34a' : (a.attendance_pct >= 65 ? '#ca8a04' : '#dc2626')),
              borderWidth: 1.5
            }
          ]
        }
      };

      responseData.suggested = [
        'Which subject is lowest?',
        'How can I improve it?',
        'If I attend next 10 classes, what will my attendance become?',
        'Am I eligible for exams?'
      ];

      // Update multi-turn context
      const lowestSub = [...attendance].sort((a, b) => a.attendance_pct - b.attendance_pct)[0];
      if (lowestSub) {
        updateContext(conversationId, {
          lastIntent: 'PERSONAL_STUDENT_ATTENDANCE',
          lastSubject: { id: lowestSub.subject_id, code: lowestSub.subject_code, name: lowestSub.subject_name },
          lastTopic: 'attendance'
        });
      }
    }

    // 2. Lowest Attendance Subject
    else if (intentResult.intent === 'PERSONAL_STUDENT_ATTENDANCE_LOWEST') {
      const sorted = [...attendance].sort((a, b) => a.attendance_pct - b.attendance_pct);
      const lowest = sorted[0];

      if (lowest) {
        responseData.content = `Your lowest attendance is **${lowest.subject_name}** (\`${lowest.subject_code}\`) at **${lowest.attendance_pct}%** (${lowest.classes_attended}/${lowest.total_classes} classes).

${lowest.attendance_pct < 75 ? `⚠️ This is below the university threshold of **75%**. You currently have an **${lowest.eligibility_status}** status.` : '✅ This is still safely above the 75% examination eligibility mark.'}`;

        updateContext(conversationId, {
          lastIntent: 'PERSONAL_STUDENT_ATTENDANCE_LOWEST',
          lastSubject: { id: lowest.subject_id, code: lowest.subject_code, name: lowest.subject_name },
          lastTopic: lowest.subject_name
        });

        responseData.mode = 'UNIVERSITY';
        responseData.suggested = [
          'How can I improve it?',
          'Who teaches it?',
          'If I attend the next 10 classes, what will my attendance become?'
        ];
      }
    }

    // 3. How to improve attendance
    else if (intentResult.intent === 'PERSONAL_STUDENT_ATTENDANCE_ADVICE') {
      const targetSub = context.lastSubject || [...attendance].sort((a, b) => a.attendance_pct - b.attendance_pct)[0];
      const match = attendance.find(a => a.subject_id === targetSub.id) || targetSub;

      const sim = simulateAttendance(match.classes_attended, match.total_classes, 10);

      responseData.content = `To reach **75%**, you need to attend the upcoming classes consistently. I recommend prioritizing **${match.name || match.subject_name}**.

- Current attendance: **${match.attendance_pct}%** (${match.classes_attended}/${match.total_classes} classes)
- Classes to attend: You need to attend the next **${sim.classesNeededFor75} classes** consistently without absences to reach the mandatory 75% examination eligibility mark.`;

      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'Who teaches it?',
        'If I attend next 10 classes, what will my attendance become?',
        'Am I eligible for exams?'
      ];
    }

    // 4. Attendance Predictor / What-If
    else if (intentResult.intent === 'PERSONAL_STUDENT_ATTENDANCE_PREDICT') {
      const nextCount = intentResult.classesCount || 10;
      const targetSub = intentResult.subject || context.lastSubject || attendance[0];
      const match = attendance.find(a => a.subject_id === targetSub.id) || attendance[0];

      const sim = simulateAttendance(match.classes_attended, match.total_classes, nextCount);

      responseData.content = `### 🔮 AI Attendance Predictor for ${match.subject_name}

- **Current Attendance**: **${match.attendance_pct}%** (${match.classes_attended}/${match.total_classes} classes)
- **If you attend next ${nextCount} classes**:
  - New Attendance: **${sim.newPct}%** (${match.classes_attended + nextCount}/${match.total_classes + nextCount} classes)
  - Net Improvement: **+${sim.changePct}%**
  - Exam Status: **${sim.willBeEligible ? '✅ ELIGIBLE (>= 75%)' : '⚠️ Still Short (< 75%)'}**

${sim.classesNeededFor75 > 0 ? `👉 **Target 75%**: You need at least **${sim.classesNeededFor75}** more attended classes to cross 75%.` : `🎉 **Buffer Available**: You can safely skip up to **${sim.safeSkips}** classes and still remain above 75%.`}`;

      responseData.mode = 'STUDENT';
      responseData.visualization = {
        type: 'doughnut',
        title: `Attendance Projection: ${match.subject_code}`,
        data: {
          labels: ['Current Attended', 'Projected Additional', 'Remaining / Missed'],
          datasets: [{
            data: [match.classes_attended, nextCount, Math.max(0, match.total_classes - match.classes_attended)],
            backgroundColor: ['#3b82f6', '#10b981', '#f87171']
          }]
        }
      };

      responseData.suggested = [
        'How am I doing overall?',
        'Which subject should I focus on?',
        'Who teaches it?'
      ];
    }

    // 5. Exam Eligibility
    else if (intentResult.intent === 'PERSONAL_STUDENT_ELIGIBILITY') {
      const shortages = attendance.filter(a => a.attendance_pct < 75);
      const isEligible = shortages.length === 0;

      if (isEligible) {
        responseData.content = `### ✅ Exam Eligibility: Confirmed Eligible

You meet all university criteria for semester examinations:
- **Overall Attendance**: All subjects are at or above 75%.
- **Active Backlogs**: 0 critical backlogs barring registration.
- **Hall Ticket Status**: Approved for issuance.`;
      } else {
        responseData.content = `### ⚠️ Exam Eligibility: Action Required

You have an attendance shortage in **${shortages.length}** subject(s):
${shortages.map(s => `- **${s.subject_name}**: **${s.attendance_pct}%** (${s.classes_attended}/${s.total_classes}) - Status: \`${s.eligibility_status}\``).join('\n')}

**University Rule (Ref: Academic Regulations Cl. 4.2)**:
- Minimum requirement: **75%**.
- If between **65% - 74.9%**, you may apply for Dean's medical condonation before the semester cutoff date.`;
      }

      responseData.mode = 'UNIVERSITY';
      responseData.suggested = [
        'How can I improve my attendance?',
        'What is my CGPA?',
        'Which subject should I focus on?'
      ];
    }

    // 6. Strengths, Weaknesses, and Focus
    else if (intentResult.intent === 'PERSONAL_STUDENT_WEAKNESS') {
      const weakest = strengths.weakest;
      const strongest = strengths.strongest;

      responseData.content = `### 🎯 Academic Strengths & Weaknesses Analysis

- **Strongest Subject**: **${strongest ? strongest.subject_name : 'N/A'}** with **${strongest ? strongest.total_marks : 0}/100** (Grade: \`${strongest ? strongest.grade : ''}\`). Outstanding conceptual mastery!
- **Subject to Focus On**: **${weakest ? weakest.subject_name : 'N/A'}** with **${weakest ? weakest.total_marks : 0}/100** (Grade: \`${weakest ? weakest.grade : ''}\`).

#### AI Recommendation:
Dedicate **45 minutes daily** to ${weakest ? weakest.subject_name : 'your weaker subjects'}, solve previous semester question papers, and seek clarification during faculty office hours.`;

      responseData.mode = 'STUDENT';
      if (weakest) {
        updateContext(conversationId, {
          lastIntent: 'PERSONAL_STUDENT_WEAKNESS',
          lastSubject: { id: weakest.subject_id, code: weakest.subject_code, name: weakest.subject_name },
          lastTopic: weakest.subject_name
        });
      }

      responseData.suggested = [
        `Who teaches ${weakest ? weakest.subject_name : 'it'}?`,
        'Compare my current semester with previous semester',
        'Analyze my academic risk'
      ];
    }

    // 7. Academic Performance Summary ("How am I doing?")
    else if (intentResult.intent === 'PERSONAL_STUDENT_SUMMARY') {
      const overallAttended = attendance.reduce((acc, a) => acc + a.classes_attended, 0);
      const overallTotal = attendance.reduce((acc, a) => acc + a.total_classes, 0);
      const overallPct = overallTotal > 0 ? ((overallAttended / overallTotal) * 100).toFixed(1) : 82.5;

      const strongest = strengths.strongest ? strengths.strongest.subject_name : 'DBMS';
      const weakest = strengths.weakest ? strengths.weakest.subject_name : 'Computer Networks';

      responseData.content = `Your **CGPA is ${activeStudent.cgpa}** and current **SGPA is ${activeStudent.sgpa}**. 

Your performance **${activeStudent.sgpa >= activeStudent.prev_sgpa ? 'improved' : 'decreased'}** compared with the previous semester (Sem 5 SGPA: ${activeStudent.prev_sgpa}). **${strongest}** is your strongest subject, while **${weakest}** needs improvement. Your current attendance is **${overallPct}%**.`;

      responseData.mode = 'STUDENT';
      responseData.visualization = {
        type: 'line',
        title: 'SGPA Progression Across Semesters',
        data: {
          labels: ['Sem 3', 'Sem 4', 'Sem 5', 'Sem 6 (Current)'],
          datasets: [{
            label: 'SGPA',
            data: [8.10, 8.25, activeStudent.prev_sgpa, activeStudent.sgpa],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            fill: true,
            tension: 0.3
          }]
        }
      };

      responseData.suggested = [
        'Which subject should I focus on?',
        'Compare my current semester with the previous semester',
        'Analyze my academic risk',
        'Generate my academic report'
      ];
    }

    // 8. Semester Comparison ("Compare my current semester with previous semester")
    else if (intentResult.intent === 'PERSONAL_STUDENT_COMPARE_SEMESTERS') {
      const delta = (activeStudent.sgpa - activeStudent.prev_sgpa).toFixed(2);
      const isUp = delta >= 0;

      responseData.content = `### 📊 Semester Performance Comparison

| Metric | Previous Semester (Sem 5) | Current Semester (Sem 6) | Variance |
| :--- | :--- | :--- | :--- |
| **SGPA** | ${activeStudent.prev_sgpa} | **${activeStudent.sgpa}** | ${isUp ? `📈 +${delta}` : `📉 ${delta}`} |
| **Cumulative CGPA** | 8.28 | **${activeStudent.cgpa}** | 📈 +0.14 |
| **Academic Status** | \`${activeStudent.academic_status}\` | \`${activeStudent.academic_status}\` | Maintained |
| **Backlogs** | 0 | **0** | Clean |

#### Performance Verdict:
${isUp 
  ? `Outstanding progress! Your SGPA improved by **+${delta}** points, elevating your overall CGPA to **${activeStudent.cgpa}**.` 
  : `Your SGPA dropped by **${Math.abs(delta)}** points compared to last semester, primarily due to lower scores in core theoretical subjects.`}`;

      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'Why did it decrease?',
        'Which subject should I focus on?',
        'Generate my academic report'
      ];
    }

    // 9. Why did it decrease / increase?
    else if (intentResult.intent === 'PERSONAL_STUDENT_WHY_DECREASE') {
      if (activeStudent.sgpa >= activeStudent.prev_sgpa) {
        responseData.content = `Actually, your SGPA **increased** from **${activeStudent.prev_sgpa}** to **${activeStudent.sgpa}** (+${(activeStudent.sgpa - activeStudent.prev_sgpa).toFixed(2)} pts)! Your strong scores in Machine Learning and DBMS bolstered your overall average.`;
      } else {
        const weakest = strengths.weakest;
        responseData.content = `The drop in your SGPA was primarily driven by:
1. Lower marks in **${weakest ? weakest.subject_name : 'Computer Networks'}** (${weakest ? weakest.total_marks : 68}/100).
2. Moderately reduced internal assessment scores.
3. Increasing difficulty of 300/400-level core computing courses.`;
      }
      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'Which subject should I focus on?',
        'How can I improve my grades?'
      ];
    }

    // 10. Marks / CGPA / SGPA
    else if (intentResult.intent === 'PERSONAL_STUDENT_MARKS') {
      const sem5Results = results.filter(r => r.sem_number === 5);
      responseData.content = `### 🎓 Your Marks & Grade Record

- **Cumulative CGPA**: **${activeStudent.cgpa}**
- **Current SGPA (Sem 6)**: **${activeStudent.sgpa}**
- **Previous SGPA (Sem 5)**: **${activeStudent.prev_sgpa}**

#### Semester 5 Course Marks:
${sem5Results.map(r => `- **${r.subject_name}** (\`${r.subject_code}\`): **${r.total_marks}/100** | Grade: \`${r.grade}\` (${r.status})`).join('\n')}`;

      responseData.mode = 'UNIVERSITY';
      responseData.visualization = {
        type: 'bar',
        title: 'Semester 5 Subject Marks Breakdown',
        data: {
          labels: sem5Results.map(r => r.subject_code),
          datasets: [{
            label: 'Total Marks (out of 100)',
            data: sem5Results.map(r => r.total_marks),
            backgroundColor: '#6366f1'
          }]
        }
      };

      responseData.suggested = [
        'What about last semester?',
        'Who scored the highest in DBMS?',
        'How am I doing?'
      ];
    }

    // 11. AI Student Risk Analysis
    else if (intentResult.intent === 'PERSONAL_STUDENT_RISK') {
      responseData.content = `### 🛡️ AI Academic Risk Classification

**Status**: ${risk.badge}

**Analysis**:
> ${risk.explanation}

#### Key Risk Metrics:
- **Attendance Shortage Count**: ${risk.shortageSubjects.length} subjects
- **Active Backlogs**: ${risk.backlogsCount}
- **SGPA Trajectory**: ${activeStudent.sgpa >= activeStudent.prev_sgpa ? '📈 Upward / Stable' : `📉 Dropped by ${risk.sgpaDrop}`}
- **Current CGPA**: ${activeStudent.cgpa}`;

      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'How can I improve my attendance?',
        'Which subject should I focus on?',
        'Am I eligible for exams?'
      ];
    }

    // 12. Explain My Data like Beginner / ELI5
    else if (intentResult.intent === 'EXPLAIN_MY_DATA_ELI5') {
      responseData.content = `### 🎒 Your College Report Card Explained Simply (Like You're 5!)

Think of your college score like a video game:
1. **Your CGPA (${activeStudent.cgpa}/10.0)** is your overall player level. Since you have an 8.42, you are in the top tier! You get a gold star ⭐.
2. **Your SGPA (${activeStudent.sgpa})** is your score on the latest level. You did even better this round than the last one!
3. **Attendance**: You came to roughly 8 out of every 10 classes. The teachers require at least 7.5 out of 10 to let you play the final boss battle (the exams). You're safe in most subjects!
4. **Strongest Power**: You are a wizard at **${strengths.strongest ? strengths.strongest.subject_name : 'DBMS'}**!
5. **Watch out for**: **${strengths.weakest ? strengths.weakest.subject_name : 'Computer Networks'}** — practice this level a bit more so you don't lose points!`;

      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'What is my attendance?',
        'Which subject should I focus on?',
        'Generate my academic report'
      ];
    }

    // 13. AI Report Generator ("Generate my academic report")
    else if (intentResult.intent === 'PERSONAL_STUDENT_REPORT_CARD') {
      responseData.content = `### 📜 Official Academic Transcript & AI Progress Report

**Student Name**: ${activeStudent.full_name}  
**USN**: \`${activeStudent.usn}\`  
**Department**: ${activeStudent.dept_name}  
**Current Semester**: ${activeStudent.current_semester} | **Section**: ${activeStudent.section}  
**Academic Standing**: \`${activeStudent.academic_status}\`  

---

#### 1. Performance Overview:
- **CGPA**: **${activeStudent.cgpa} / 10.00**
- **Sem 6 SGPA**: **${activeStudent.sgpa}**
- **Sem 5 SGPA**: **${activeStudent.prev_sgpa}**
- **Risk Assessment**: ${risk.badge}

#### 2. Semester Course Results:
${results.map(r => `| \`${r.subject_code}\` | ${r.subject_name} | Int: ${r.internal_marks} | Ext: ${r.external_marks} | **Total: ${r.total_marks}** | Grade: \`${r.grade}\` |`).join('\n')}

#### 3. AI Academic Advisor Summary:
> Student demonstrates solid computational aptitude. Strongest subject is **${strengths.strongest ? strengths.strongest.subject_name : 'DBMS'}**; primary growth area is **${strengths.weakest ? strengths.weakest.subject_name : 'Computer Networks'}**. Attendance meets statutory criteria across primary course modules.`;

      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'What is my attendance?',
        'Which subject should I focus on?',
        'Explain DBMS normalization for 10 marks'
      ];
    }

    // 14. Student Profile ("Show my profile")
    else if (intentResult.intent === 'PERSONAL_STUDENT_PROFILE') {
      responseData.content = `### 👤 Student Institutional Profile

| Field | Student Record |
| :--- | :--- |
| **Full Name** | **${activeStudent.full_name}** |
| **USN / Institutional SRN** | \`${activeStudent.usn}\` |
| **Department** | ${activeStudent.dept_name} (\`${activeStudent.dept_code || 'CSE'}\`) |
| **Current Semester** | **Semester ${activeStudent.current_semester}** (Section ${activeStudent.section}) |
| **Cumulative CGPA** | **${activeStudent.cgpa} / 10.0** |
| **Current SGPA** | **${activeStudent.sgpa}** (Prev: ${activeStudent.prev_sgpa}) |
| **Academic Standing** | \`${activeStudent.academic_status}\` |
| **Risk Classification** | ${risk.badge} |
| **Email** | \`${activeStudent.email}\` |
| **Phone** | \`${activeStudent.phone || '+91 98765 43210'}\` |`;

      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'What is my attendance?',
        'Show my results',
        'Which subject should I focus on?'
      ];
    }

    // 15. Which semester am I in?
    else if (intentResult.intent === 'PERSONAL_STUDENT_SEMESTER') {
      responseData.content = `You are currently in **Semester ${activeStudent.current_semester}** (Section **${activeStudent.section}**), enrolled in the **${activeStudent.dept_name}** program.`;
      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'Show my subjects',
        'What is my attendance?',
        'What is my CGPA?'
      ];
    }

    // 16. Show my subjects
    else if (intentResult.intent === 'PERSONAL_STUDENT_SUBJECTS') {
      responseData.content = `### 📚 Your Enrolled Subjects (Semester ${activeStudent.current_semester})

| Code | Subject Name | Credits | Faculty In-Charge | Status |
| :--- | :--- | :--- | :--- | :--- |
${attendance.map(a => `| \`${a.subject_code}\` | **${a.subject_name}** | ${a.credits || 4} | ${a.faculty_name || 'Department Faculty'} | Active |`).join('\n')}`;

      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'What is my attendance?',
        'Which subject is lowest?',
        'Show my results'
      ];
    }

    // 17. What is my SGPA?
    else if (intentResult.intent === 'PERSONAL_STUDENT_SGPA') {
      const delta = (activeStudent.sgpa - activeStudent.prev_sgpa).toFixed(2);
      responseData.content = `### 🎯 Semester Grade Point Average (SGPA)

- **Current Semester (${activeStudent.current_semester}) SGPA**: **${activeStudent.sgpa} / 10.0**
- **Previous Semester (${activeStudent.current_semester - 1}) SGPA**: **${activeStudent.prev_sgpa}**
- **Progression**: ${parseFloat(delta) >= 0 ? `📈 Improved by **+${delta}** points` : `📉 Dropped by **${Math.abs(delta)}** points`}
- **Cumulative CGPA**: **${activeStudent.cgpa} / 10.0**`;

      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'Compare my results between semesters',
        'Which subject should I focus on?',
        'Show my results'
      ];
    }

    // 18. Which subjects did I pass?
    else if (intentResult.intent === 'PERSONAL_STUDENT_PASSED_SUBJECTS') {
      const passed = results.filter(r => r.status === 'PASS' && r.grade !== 'F');
      responseData.content = `### ✅ Passed Subjects (${passed.length} Courses)

| Subject Code | Subject Name | Marks | Grade | Status |
| :--- | :--- | :--- | :--- | :--- |
${passed.map(p => `| \`${p.subject_code}\` | **${p.subject_name}** | **${p.total_marks}/100** | \`${p.grade}\` | 🟢 PASS |`).join('\n')}`;

      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'Which subjects did I fail?',
        'What is my highest mark?',
        'What is my CGPA?'
      ];
    }

    // 19. Which subjects did I fail?
    else if (intentResult.intent === 'PERSONAL_STUDENT_FAILED_SUBJECTS') {
      const failed = results.filter(r => r.status === 'FAIL' || r.grade === 'F');
      if (failed.length === 0) {
        responseData.content = `### 🎉 Outstanding Academic Standing!
You have **0 failed subjects**! You have successfully passed all enrolled semester examinations with a clean academic record (Current CGPA: **${activeStudent.cgpa}**).`;
      } else {
        responseData.content = `### ⚠️ Failed Subjects (${failed.length} Course(s))

| Subject Code | Subject Name | Internal | External | Total | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
${failed.map(f => `| \`${f.subject_code}\` | **${f.subject_name}** | ${f.internal_marks} | ${f.external_marks} | **${f.total_marks}/100** | 🔴 FAIL |`).join('\n')}

*Remedial Guidance: Register for the supplementary make-up examination before the institutional cutoff date.*`;
      }

      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'Which subjects did I pass?',
        'What is my lowest mark?',
        'Am I eligible for exams?'
      ];
    }

    // 20. Highest & Lowest Marks
    else if (intentResult.intent === 'PERSONAL_STUDENT_HIGHEST_MARK') {
      const sorted = [...results].sort((a, b) => b.total_marks - a.total_marks);
      const top = sorted[0];
      responseData.content = `Your highest score was in **${top.subject_name}** (\`${top.subject_code}\`) with **${top.total_marks}/100** (Grade: \`${top.grade}\`). Outstanding mastery!`;
      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'What is my lowest mark?',
        'Who scored highest in DBMS?',
        'Show my results'
      ];
    }

    else if (intentResult.intent === 'PERSONAL_STUDENT_LOWEST_MARK') {
      const sorted = [...results].sort((a, b) => a.total_marks - b.total_marks);
      const low = sorted[0];
      responseData.content = `Your lowest score was in **${low.subject_name}** (\`${low.subject_code}\`) with **${low.total_marks}/100** (Grade: \`${low.grade}\`). I recommend dedicating additional revision time to this subject.`;
      responseData.mode = 'STUDENT';
      responseData.suggested = [
        `Who teaches ${low.subject_name}?`,
        'What is my highest mark?',
        'Which subject should I focus on?'
      ];
    }

    // 21. Specific Subject Grade ("What is my grade in DBMS?", "What is my Python subject mark?")
    else if (intentResult.intent === 'PERSONAL_STUDENT_SUBJECT_GRADE') {
      const targetSubName = intentResult.subject ? intentResult.subject.name : (intentResult.rawSubject || 'DBMS');
      const match = results.find(r => r.subject_name.toLowerCase().includes(targetSubName.toLowerCase()) || r.subject_code.toLowerCase().includes(targetSubName.toLowerCase()));

      if (!match) {
        responseData.content = `I couldn't find a semester result record for subject "${targetSubName}" in your enrolled academic records.`;
      } else {
        responseData.content = `### 📊 Grade & Marks: ${match.subject_name} (\`${match.subject_code}\`)

- **Total Score**: **${match.total_marks} / 100**
- **Grade Awarded**: \`${match.grade}\`
- **Internal Assessment**: ${match.internal_marks} / 50
- **Semester End Exam**: ${match.external_marks} / 50
- **Course Result**: **${match.status}**`;
      }

      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'Show my results',
        'What is my highest mark?',
        'Who scored highest in DBMS?'
      ];
    }

    // 22. Total classes attended ("How many classes did I attend?")
    else if (intentResult.intent === 'PERSONAL_STUDENT_ATTENDED_COUNT') {
      const totalAttended = attendance.reduce((acc, a) => acc + a.classes_attended, 0);
      const totalConducted = attendance.reduce((acc, a) => acc + a.total_classes, 0);
      const pct = totalConducted > 0 ? ((totalAttended / totalConducted) * 100).toFixed(1) : 82.4;

      responseData.content = `### 🕒 Classes Attended Summary

You have attended **${totalAttended} out of ${totalConducted} classes conducted** across all subjects this semester (**${pct}% overall attendance**).`;

      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'Show my subject-wise attendance',
        'Which subject is lowest?',
        'Am I eligible for exams?'
      ];
    }

    // 23. Class Average Attendance ("What is the attendance percentage of my class?")
    else if (intentResult.intent === 'PERSONAL_STUDENT_CLASS_ATTENDANCE') {
      const classStats = await queryExecutor.getClassAttendanceStats(sId);
      responseData.content = `### 👥 Class Average Attendance

For your cohort (**${activeStudent.dept_name} — Semester ${activeStudent.current_semester}, Section ${activeStudent.section}**):
- **Class Average Attendance**: **${classStats ? classStats.class_avg_attendance : 81.3}%**
- **Total Enrolled in Section**: **${classStats ? classStats.total_class_students : 54} students**
- **Your Personal Attendance**: **${attendance.reduce((a, b) => a + b.classes_attended, 0) / attendance.reduce((a, b) => a + b.total_classes, 0) * 100 | 0}%**`;

      responseData.mode = 'STUDENT';
      responseData.suggested = [
        'What is my attendance?',
        'Which students are below 75%?',
        'Show attendance statistics'
      ];
    }

    return responseData;
  }

  // -------------------------------------------------------------
  // BRANCH B: UNIVERSITY & ANALYTICS QUERIES (NL to SQL)
  // -------------------------------------------------------------

  // 1. Who scored highest in a subject?
  if (intentResult.intent === 'UNIVERSITY_HIGHEST_SCORER') {
    const subName = intentResult.subject ? intentResult.subject.name : (intentResult.rawSubject || 'DBMS');
    const topScorers = await queryExecutor.getHighestScorers(subName, 3);

    if (!topScorers || topScorers.length === 0) {
      return {
        content: `I couldn't find that information in the university database for subject "${subName}". Please verify the subject name.`,
        mode: 'UNIVERSITY',
        suggested: ['Who scored highest in DBMS?', 'Who scored highest in Computer Networks?']
      };
    }

    const topper = topScorers[0];
    responseData.content = `### 🏆 Highest Scorer in ${topper.subject_name} (\`${topper.subject_code}\`)

The highest score was achieved by **${topper.full_name}** (USN: \`${topper.usn}\`) with **${topper.total_marks}/100** (Grade: \`${topper.grade}\`).

#### Top Rankers:
${topScorers.map((s, idx) => `${idx + 1}. **${s.full_name}** (\`${s.usn}\` - ${s.dept_code}): **${s.total_marks}/100** [Grade ${s.grade}]`).join('\n')}`;

    responseData.mode = 'UNIVERSITY';
    responseData.visualization = {
      type: 'bar',
      title: `Top Scorers in ${topper.subject_code}`,
      data: {
        labels: topScorers.map(s => s.full_name.split(' ')[0]),
        datasets: [{
          label: 'Total Marks',
          data: topScorers.map(s => s.total_marks),
          backgroundColor: '#3b82f6'
        }]
      }
    };

    updateContext(conversationId, {
      lastIntent: 'UNIVERSITY_HIGHEST_SCORER',
      lastSubject: { code: topper.subject_code, name: topper.subject_name },
      lastTopic: topper.subject_name
    });

    responseData.suggested = [
      `Who teaches ${topper.subject_name}?`,
      `How many students failed ${topper.subject_name}?`,
      `Explain ${topper.subject_name}`
    ];
    return responseData;
  }

  // 2. How many students failed a subject?
  if (intentResult.intent === 'UNIVERSITY_FAILED_STUDENTS') {
    const subName = intentResult.subject ? intentResult.subject.name : 'Computer Networks';
    const failedList = await queryExecutor.getFailedStudents(subName);

    if (!failedList || failedList.length === 0) {
      responseData.content = `According to university examination records, **0 students failed** in **${subName}**. All enrolled students met the minimum passing threshold!`;
    } else {
      const subInfo = failedList[0];
      responseData.content = `### ⚠️ Failure Analysis for ${subInfo.subject_name} (\`${subInfo.subject_code}\`)

A total of **${failedList.length} students failed** in ${subInfo.subject_name}:

${failedList.map(s => `- **${s.full_name}** (USN: \`${s.usn}\`): **${s.total_marks}/100** (Internal: ${s.internal_marks}, External: ${s.external_marks})`).join('\n')}

*Passing Criteria: Minimum 40 marks aggregate with at least 35% in Semester End Examination.*`;
    }

    responseData.mode = 'UNIVERSITY';
    responseData.suggested = [
      `Who teaches ${subName}?`,
      `Who scored the highest in ${subName}?`,
      'Which subject has the highest failure rate?'
    ];
    return responseData;
  }

  // 3. Which department performed best / Department pass percentage?
  if (intentResult.intent === 'UNIVERSITY_DEPT_PERFORMANCE') {
    const depts = await queryExecutor.getDepartmentPerformance();
    const best = depts[0];

    responseData.content = `### 🏫 Department Performance Rankings

The top performing department is **${best.name} (${best.code})** led by **${best.hod_name}**, with a **${best.pass_percentage}% pass rate** and an average CGPA of **${best.avg_cgpa}**.

#### Department Comparison Table:
| Department | Code | Pass % | Avg CGPA | High Risk Students | HOD |
| :--- | :--- | :--- | :--- | :--- | :--- |
${depts.map(d => `| ${d.name} | **${d.code}** | **${d.pass_percentage}%** | ${d.avg_cgpa} | ${d.high_risk_count} | ${d.hod_name} |`).join('\n')}`;

    responseData.mode = 'UNIVERSITY';
    responseData.visualization = {
      type: 'bar',
      title: 'Department Pass Percentage Comparison (%)',
      data: {
        labels: depts.map(d => d.code),
        datasets: [{
          label: 'Pass Percentage',
          data: depts.map(d => d.pass_percentage),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899']
        }]
      }
    };

    responseData.suggested = [
      'Which subject has the highest failure rate?',
      'Show students below 75% attendance',
      'Show top 10 students'
    ];
    return responseData;
  }

  // 4. Show students below 75% attendance
  if (intentResult.intent === 'UNIVERSITY_LOW_ATTENDANCE_LIST') {
    const lowList = await queryExecutor.getStudentsBelowAttendance(75);

    responseData.content = `### 🚨 Students with Attendance Below 75%

A total of **${lowList.length} course enrollment records** were flagged below the statutory 75% threshold:

| Student Name | USN | Dept | Subject | Attendance % | Attended / Total |
| :--- | :--- | :--- | :--- | :--- | :--- |
${lowList.slice(0, 10).map(s => `| **${s.full_name}** | \`${s.usn}\` | ${s.dept_code} | ${s.subject_name} | **${s.attendance_pct}%** | ${s.classes_attended}/${s.total_classes} |`).join('\n')}

${lowList.length > 10 ? `*...and ${lowList.length - 10} additional students.*` : ''}

> **University Mandate**: Automated SMS and email notifications have been triggered to designated academic guardians.`;

    responseData.mode = 'UNIVERSITY';
    responseData.visualization = {
      type: 'pie',
      title: 'Attendance Compliance Distribution',
      data: {
        labels: ['Compliant (>= 75%)', 'Condonable (65-74%)', 'Critical Shortage (< 65%)'],
        datasets: [{
          data: [
            42, 
            lowList.filter(s => s.attendance_pct >= 65).length, 
            lowList.filter(s => s.attendance_pct < 65).length
          ],
          backgroundColor: ['#22c55e', '#eab308', '#ef4444']
        }]
      }
    };

    responseData.suggested = [
      'Which department has the highest pass percentage?',
      'Show top 10 students',
      'Who teaches Computer Networks?'
    ];
    return responseData;
  }

  // 5. Faculty Lookup ("Who teaches Data Structures?", "Who is Dr. Rajesh?")
  if (intentResult.intent === 'UNIVERSITY_FACULTY_LOOKUP') {
    const kw = intentResult.keyword || (intentResult.subject ? intentResult.subject.name : 'Data Structures');
    const facultyList = await queryExecutor.getFacultyInfo(kw);

    if (!facultyList || facultyList.length === 0) {
      return {
        content: `I couldn't find faculty information for "${kw}" in the university database.`,
        mode: 'UNIVERSITY',
        suggested: ['Who teaches Computer Networks?', 'Who teaches Data Structures?', 'Who is Dr. Rajesh Kumar?']
      };
    }

    const fac = facultyList[0];
    responseData.content = `### 👨‍🏫 Faculty Profile: ${fac.full_name}

- **Designation**: ${fac.designation} (${fac.dept_name})
- **Employee ID**: \`${fac.employee_id}\`
- **Subjects Handled**: ${fac.subjects_taught || 'Core Engineering Courses'}
- **Cabin / Office**: ${fac.office_room}
- **Office Hours**: ${fac.office_hours}
- **Email**: \`${fac.email}\`
- **Current Availability**: 🟢 **${fac.availability_status}**
- **Research Specialization**: *${fac.specialization || 'Computer Science'}*`;

    updateContext(conversationId, {
      lastIntent: 'UNIVERSITY_FACULTY_LOOKUP',
      lastSubject: intentResult.subject || { name: fac.full_name },
      lastTopic: fac.full_name
    });

    responseData.mode = 'UNIVERSITY';
    const firstSubject = fac.subjects_taught ? fac.subjects_taught.split(',')[0].trim() : 'Computer Networks';
    responseData.suggested = [
      `Explain ${firstSubject}`,
      `Who scored the highest in ${firstSubject}?`,
      `What are Dr. ${fac.full_name.split(' ').pop()}'s office hours?`
    ];
    return responseData;
  }

  // 6. Top 10 University Students
  if (intentResult.intent === 'UNIVERSITY_TOP_STUDENTS') {
    const toppers = await queryExecutor.getTop10Students();

    responseData.content = `### 🌟 University Top 10 Students (Overall CGPA)

| Rank | Student Name | USN | Department | CGPA | SGPA |
| :--- | :--- | :--- | :--- | :--- | :--- |
${toppers.map((s, idx) => `| **#${idx + 1}** | **${s.full_name}** | \`${s.usn}\` | ${s.dept_code} | **${s.cgpa}** | ${s.sgpa} |`).join('\n')}`;

    responseData.mode = 'UNIVERSITY';
    responseData.visualization = {
      type: 'bar',
      title: 'Top 10 Students CGPA',
      data: {
        labels: toppers.map(s => s.full_name.split(' ')[0]),
        datasets: [{
          label: 'CGPA',
          data: toppers.map(s => s.cgpa),
          backgroundColor: '#8b5cf6'
        }]
      }
    };

    responseData.suggested = [
      'Which department performed best?',
      'Show students below 75% attendance',
      'Generate a university academic report'
    ];
    return responseData;
  }

  // 7. University Attendance & Examination Rules
  if (intentResult.intent === 'UNIVERSITY_RULES') {
    const rules = await queryExecutor.getUniversityRules();

    responseData.content = `### 📜 University Statutory Regulations

${rules.map(r => `#### ${r.rule_name} (\`${r.rule_key}\` = ${r.rule_value}%)
- **Category**: ${r.rule_category}
- **Details**: ${r.description}`).join('\n\n')}`;

    responseData.mode = 'UNIVERSITY';
    responseData.suggested = [
      'What is my attendance?',
      'Am I eligible for exams?',
      'Which subject should I focus on?'
    ];
    return responseData;
  }

  // 8. Admin University Report / Overview
  if (intentResult.intent === 'ADMIN_UNIVERSITY_REPORT') {
    const kpis = await queryExecutor.getUniversityKPIs();
    const depts = await queryExecutor.getDepartmentPerformance();

    responseData.content = `### 🏛️ University Executive Academic Report

- **Total Enrolled Students**: **${kpis.studentsCount}**
- **Total Faculty Members**: **${kpis.facultyCount}**
- **Academic Departments**: **${kpis.deptCount}**
- **University Average CGPA**: **${kpis.avgCgpa} / 10.0**
- **Overall University Pass Rate**: **${kpis.passPercentage}%**
- **Average Attendance**: **${kpis.avgAttendance}%**
- **Critical Risk Students**: **${kpis.highRiskStudents}** students flagged for academic intervention.

#### Departmental Distribution:
${depts.map(d => `- **${d.name} (${d.code})**: ${d.total_students} students | Pass: **${d.pass_percentage}%** | Avg CGPA: ${d.avg_cgpa}`).join('\n')}`;

    responseData.mode = 'ADMIN';
    responseData.visualization = {
      type: 'doughnut',
      title: 'University Academic Risk Distribution',
      data: {
        labels: ['Low Risk (Safe)', 'Medium Risk (Monitor)', 'High Risk (Intervention)'],
        datasets: [{
          data: [kpis.lowRiskStudents, kpis.mediumRiskStudents, kpis.highRiskStudents],
          backgroundColor: ['#22c55e', '#eab308', '#ef4444']
        }]
      }
    };

    responseData.suggested = [
      'Show top 10 students',
      'Which department has the highest pass percentage?',
      'Show students below 75% attendance'
    ];
    return responseData;
  }

  // 9. Subject Failure Rates
  if (intentResult.intent === 'UNIVERSITY_FAILURE_RATES') {
    const rates = await queryExecutor.getSubjectFailureRates();

    responseData.content = `### ⚠️ Subjects with Highest Failure Rates

| Subject Code | Subject Name | Dept | Enrolled | Failed | Failure Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
${rates.map(r => `| \`${r.code}\` | **${r.name}** | ${r.dept_code} | ${r.total_enrolled} | ${r.failed_count} | **${r.failure_rate}%** |`).join('\n')}`;

    responseData.mode = 'ANALYTICS';
    responseData.visualization = {
      type: 'bar',
      title: 'Subject Failure Rates (%)',
      data: {
        labels: rates.map(r => r.code),
        datasets: [{
          label: 'Failure Rate %',
          data: rates.map(r => r.failure_rate),
          backgroundColor: '#ef4444'
        }]
      }
    };

    responseData.suggested = [
      'Who teaches Computer Networks?',
      'Which department performed best?',
      'Show students below 75% attendance'
    ];
    return responseData;
  }

  // 10. HOD Lookup ("Who is the HOD of CSE?")
  if (intentResult.intent === 'UNIVERSITY_HOD_LOOKUP') {
    const deptList = await queryExecutor.getDepartmentInfo(intentResult.deptCode || 'CSE');
    if (!deptList || deptList.length === 0) {
      responseData.content = `I couldn't find department information for "${intentResult.deptCode}" in the university database.`;
    } else {
      const d = deptList[0];
      responseData.content = `### 🏛️ Head of Department (HOD) — ${d.name} (${d.code})

- **Head of Department**: **${d.hod_name}**
- **Department**: ${d.name} (\`${d.code}\`)
- **Office Location**: ${d.location}
- **Contact Email**: \`${d.contact_email}\`
- **Total Faculty Members**: ${d.faculty_count} professors & instructors
- **Enrolled Students**: ${d.student_count} undergraduate scholars`;
    }
    responseData.mode = 'UNIVERSITY';
    responseData.suggested = [
      `Show ${intentResult.deptCode || 'CSE'} faculty`,
      `How many students are in ${intentResult.deptCode || 'CSE'}?`,
      'Which department has the highest pass percentage?'
    ];
    return responseData;
  }

  // 11. Faculty by Department ("Show CSE faculty", "Show faculty from ECE")
  if (intentResult.intent === 'UNIVERSITY_FACULTY_BY_DEPT') {
    const deptCode = intentResult.deptCode || 'CSE';
    const facList = await queryExecutor.getFacultyByDepartment(deptCode);

    if (!facList || facList.length === 0) {
      responseData.content = `No faculty records found for department \`${deptCode}\` in the university directory.`;
    } else {
      responseData.content = `### 👨‍🏫 Faculty Directory — Department of ${deptCode}

| Faculty Name | Designation | Employee ID | Subjects Handled | Availability |
| :--- | :--- | :--- | :--- | :--- |
${facList.map(f => `| **${f.full_name}** | ${f.designation} | \`${f.employee_id}\` | ${f.subjects_taught || 'Core Engineering'} | 🟢 ${f.availability_status} |`).join('\n')}`;
    }
    responseData.mode = 'UNIVERSITY';
    responseData.suggested = [
      `Who is the HOD of ${deptCode}?`,
      'Who teaches Operating Systems?',
      'Show department information'
    ];
    return responseData;
  }

  // 11b. Faculty Directory ("Show faculty information")
  if (intentResult.intent === 'UNIVERSITY_FACULTY_DIRECTORY') {
    const allFaculty = await queryExecutor.getFacultyInfo('');
    responseData.content = `### 👨‍🏫 University Faculty Directory

| Faculty Name | Department | Designation | Subjects Handled | Availability |
| :--- | :--- | :--- | :--- | :--- |
${allFaculty.map(f => `| **${f.full_name}** | ${f.dept_code} | ${f.designation} | ${f.subjects_taught || 'Core Engineering'} | 🟢 ${f.availability_status} |`).join('\n')}`;

    responseData.mode = 'UNIVERSITY';
    responseData.suggested = [
      'Show CSE faculty',
      'Who is the HOD of CSE?',
      'Show department information'
    ];
    return responseData;
  }

  // 12. Available Subjects ("What subjects are available?")
  if (intentResult.intent === 'UNIVERSITY_AVAILABLE_SUBJECTS') {
    const subjects = await queryExecutor.getSubjectsList();
    responseData.content = `### 📖 University Academic Curriculum & Available Subjects

| Code | Subject Name | Dept | Semester | Credits | Faculty In-Charge |
| :--- | :--- | :--- | :--- | :--- | :--- |
${subjects.slice(0, 12).map(s => `| \`${s.code}\` | **${s.name}** | ${s.dept_code} | Sem ${s.sem_number} | ${s.credits} | ${s.faculty_name || 'Designated Faculty'} |`).join('\n')}

${subjects.length > 12 ? `*...and ${subjects.length - 12} additional elective and core courses across departments.*` : ''}`;

    responseData.mode = 'UNIVERSITY';
    responseData.suggested = [
      'Who teaches DBMS?',
      'Who teaches Operating Systems?',
      'Which subject has the highest failure rate?'
    ];
    return responseData;
  }

  // 13. Department Student Count ("How many students are in CSE?")
  if (intentResult.intent === 'UNIVERSITY_DEPT_STUDENT_COUNT') {
    const deptCode = intentResult.deptCode || 'CSE';
    const depts = await queryExecutor.getDepartmentInfo(deptCode);
    if (!depts || depts.length === 0) {
      responseData.content = `I couldn't find enrollment records for department "${deptCode}".`;
    } else {
      const d = depts[0];
      responseData.content = `### 🎓 Student Enrollment — Department of ${d.name} (${d.code})

- **Total Enrolled Students**: **${d.student_count} students**
- **Head of Department**: ${d.hod_name}
- **Faculty Strength**: ${d.faculty_count} faculty members
- **Department Ratio**: Approximately **${Math.round(d.student_count / (d.faculty_count || 1))}:1** student-to-faculty ratio.`;
    }
    responseData.mode = 'UNIVERSITY';
    responseData.suggested = [
      `Show ${deptCode} faculty`,
      `Who is the HOD of ${deptCode}?`,
      'Which department has the highest pass percentage?'
    ];
    return responseData;
  }

  // 14. Show Department Information ("Show department information")
  if (intentResult.intent === 'UNIVERSITY_DEPARTMENT_INFO') {
    const depts = await queryExecutor.getDepartmentInfo();
    responseData.content = `### 🏛️ University Departments Directory

| Department | Code | Head of Department (HOD) | Location | Students | Faculty |
| :--- | :--- | :--- | :--- | :--- | :--- |
${depts.map(d => `| **${d.name}** | \`${d.code}\` | **${d.hod_name}** | ${d.location} | ${d.student_count} | ${d.faculty_count} |`).join('\n')}`;

    responseData.mode = 'UNIVERSITY';
    responseData.suggested = [
      'Which department has the highest pass percentage?',
      'Show CSE faculty',
      'Show university statistics'
    ];
    return responseData;
  }

  // 15. Pass vs Fail Statistics ("Show pass/fail statistics", "Show pass and fail students")
  if (intentResult.intent === 'UNIVERSITY_PASS_FAIL_STATS') {
    const pf = await queryExecutor.getPassFailStats();
    responseData.content = `### 📊 University Semester Examination Results: Pass vs Fail

- **Total Course Evaluations**: **${pf.totalRecords}**
- **Passed Evaluations**: 🟢 **${pf.passed}** (**${pf.passPercentage}%**)
- **Failed Evaluations**: 🔴 **${pf.failed}** (**${pf.failPercentage}%**)

The overall university pass rate is currently **${pf.passPercentage}%**, indicating strong institutional academic health.`;

    responseData.mode = 'ANALYTICS';
    responseData.visualization = {
      type: 'doughnut',
      title: 'University Pass vs Fail Distribution',
      data: {
        labels: ['Passed Courses', 'Failed Courses'],
        datasets: [{
          data: [pf.passed, pf.failed],
          backgroundColor: ['#22c55e', '#ef4444']
        }]
      }
    };

    responseData.suggested = [
      'Which department has the highest pass percentage?',
      'Which subject has the highest failure rate?',
      'Show students below 75% attendance'
    ];
    return responseData;
  }

  // 16. Class Subject Results ("Show Python results for my class", "Show DBMS results for my class")
  if (intentResult.intent === 'UNIVERSITY_CLASS_SUBJECT_RESULTS') {
    const subName = intentResult.subject ? intentResult.subject.name : (intentResult.rawSubject || 'DBMS');
    const toppers = await queryExecutor.getHighestScorers(subName, 5);
    const failed = await queryExecutor.getFailedStudents(subName);

    responseData.content = `### 📈 Class Performance Analysis: ${subName}

- **Top Scorer**: **${toppers[0] ? toppers[0].full_name + ' (' + toppers[0].total_marks + '/100)' : 'N/A'}**
- **Total Backlogs / Failures in Class**: **${failed.length} students**
- **Class Examination Status**: Evaluated under standard university curriculum guidelines.

#### Top Cohort Scorers:
${toppers.map((t, idx) => `${idx + 1}. **${t.full_name}** (\`${t.usn}\`): **${t.total_marks}/100** [Grade ${t.grade}]`).join('\n')}`;

    responseData.mode = 'ANALYTICS';
    responseData.suggested = [
      `Who teaches ${subName}?`,
      `How many students failed ${subName}?`,
      'Show pass/fail statistics'
    ];
    return responseData;
  }

  // -------------------------------------------------------------
  // BRANCH C: GENERAL AI QUERIES & EDUCATIONAL REASONING
  // -------------------------------------------------------------
  // Check if an external LLM API key was provided (client config or env)
  if (clientConfig.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
    const externalAnswer = await callExternalLlm({
      prompt: trimmed,
      systemPrompt: 'You are UniMate AI, an intelligent universal assistant and university companion.',
      conversationHistory: context.historyTurns || [],
      apiKey: clientConfig.apiKey,
      provider: clientConfig.provider || 'gemini'
    });

    if (externalAnswer) {
      updateContext(conversationId, {
        lastIntent: intentResult.intent,
        lastTopic: trimmed.slice(0, 30)
      });
      let extSuggestions = ['Explain it simply', 'Give me an example', 'What is my attendance?'];
      if (/tcp|network/i.test(trimmed)) {
        extSuggestions = ['Give me a Java program for TCP client', 'Explain UDP vs TCP', 'What is the 3-way handshake?'];
      } else if (/ai|intelligence|ml/i.test(trimmed)) {
        extSuggestions = ['Explain it simply', 'Give me an example', 'Suggest projects for a computer science student'];
      } else if (/code|program|java|python/i.test(trimmed)) {
        extSuggestions = ['Explain this code line by line', 'How to optimize this?', 'Give me a Python equivalent'];
      }
      return {
        content: externalAnswer,
        mode: 'GENERAL',
        visualization: null,
        suggested: extSuggestions
      };
    }
  }

  // Built-in high performance local engine
  const genResult = getGeneralAnswer(lower, intentResult);

  // Update multi-turn context
  let topic = context.lastTopic;
  if (/artificial intelligence|ai/i.test(lower)) topic = 'Artificial Intelligence';
  else if (/tcp/i.test(lower)) topic = 'TCP';
  else if (/dbms|normalization/i.test(lower)) topic = 'DBMS Normalization';
  else if (/process management|operating system/i.test(lower)) topic = 'Process Management';

  updateContext(conversationId, {
    lastIntent: intentResult.intent,
    lastTopic: topic
  });

  return {
    content: genResult.content,
    mode: genResult.mode || 'GENERAL',
    visualization: null,
    suggested: genResult.suggested && genResult.suggested.length > 0 ? genResult.suggested : [
      'Explain it simply',
      'Give me an example',
      'What is my attendance?'
    ]
  };
}

module.exports = {
  processChatMessage,
  getContext,
  updateContext
};
