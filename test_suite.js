const http = require('http');

const PORT = 3000;
let studentToken = '';
let facultyToken = '';
let adminToken = '';
let conversationId = 'test-conv-' + Date.now();

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting UniMate AI Comprehensive Test Suite...\n');
  let passed = 0;
  let total = 0;

  async function assertTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Health check
  await assertTest('Health Check (/api/health)', async () => {
    const res = await request({ hostname: 'localhost', port: PORT, path: '/api/health', method: 'GET' });
    if (res.status !== 200 || res.body.status !== 'online') throw new Error(`Status ${res.status}`);
  });

  // 2. Direct SRN Authentication Tests
  await assertTest('SRN Auth - Student Login (SRN: 1MS21CS001)', async () => {
    const res = await request({
      hostname: 'localhost', port: PORT, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { srn: '1MS21CS001', password: 'password123' });
    if (res.status !== 200 || !res.body.token || res.body.user.role !== 'student') throw new Error('Student SRN login failed');
    studentToken = res.body.token;
  });

  await assertTest('SRN Auth - Faculty Login (ID: FAC-CSE-001)', async () => {
    const res = await request({
      hostname: 'localhost', port: PORT, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { srn: 'FAC-CSE-001', password: 'password123' });
    if (res.status !== 200 || !res.body.token || res.body.user.role !== 'faculty') throw new Error('Faculty SRN login failed');
    facultyToken = res.body.token;
  });

  await assertTest('SRN Auth - Admin Login (ID: ADMIN-001)', async () => {
    const res = await request({
      hostname: 'localhost', port: PORT, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { srn: 'ADMIN-001', password: 'password123' });
    if (res.status !== 200 || !res.body.token || res.body.user.role !== 'admin') throw new Error('Admin SRN login failed');
    adminToken = res.body.token;
  });

  await assertTest('SRN Auth - Rejection of Invalid SRN', async () => {
    const res = await request({
      hostname: 'localhost', port: PORT, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { srn: 'FAKE-SRN-999', password: 'password123' });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await assertTest('Unauthenticated Request Rejection (No Token)', async () => {
    const res = await request({
      hostname: 'localhost', port: PORT, path: '/api/chat/message', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { message: 'What is my attendance?' });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 3. Student Dashboard API
  await assertTest('Student Dashboard API', async () => {
    const res = await request({
      hostname: 'localhost', port: PORT, path: '/api/student/dashboard', method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    if (res.status !== 200 || !res.body.student || res.body.kpis.cgpa !== 8.42) {
      throw new Error(`Unexpected CGPA: ${res.body?.kpis?.cgpa}`);
    }
  });

  // 4. Attendance Predictor API
  await assertTest('Attendance Predictor Simulator API', async () => {
    const res = await request({
      hostname: 'localhost', port: PORT, path: '/api/student/predict-attendance', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` }
    }, { classesAttended: 38, totalClasses: 50, nextClasses: 10 });
    if (res.status !== 200 || res.body.newPct !== 80.0) {
      throw new Error(`Expected newPct 80.0, got ${res.body.newPct}`);
    }
  });

  // Helper for sending chat message
  async function sendChat(message) {
    const res = await request({
      hostname: 'localhost', port: PORT, path: '/api/chat/message', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` }
    }, { message, conversationId });
    return res.body;
  }

  // 5. Chat Test: Greeting
  await assertTest('Chat: Greeting ("Hi")', async () => {
    const res = await sendChat('Hi');
    if (!res.content || !res.content.includes('UniMate AI')) throw new Error('Invalid greeting');
  });

  // 6. Chat Test: Personal Attendance ("What is my attendance?")
  await assertTest('Chat: Personal Attendance ("What is my attendance?")', async () => {
    const res = await sendChat('What is my attendance?');
    if (!res.content.includes('attendance is') || !res.visualization || res.visualization.type !== 'bar') {
      throw new Error('Expected attendance breakdown with bar chart');
    }
    if (!res.suggested || res.suggested.length === 0 || !res.suggested.some(s => s.toLowerCase().includes('subject') || s.toLowerCase().includes('classes') || s.toLowerCase().includes('lowest'))) {
      throw new Error('Expected contextual suggestions related to attendance');
    }
  });

  // 7. Chat Test: Multi-turn Lowest Subject ("Which subject is lowest?")
  await assertTest('Chat: Contextual Follow-up ("Which subject is lowest?")', async () => {
    const res = await sendChat('Which subject is lowest?');
    if (!res.content.toLowerCase().includes('lowest attendance is') || !res.content.includes('Computer Networks')) {
      throw new Error(`Expected lowest attendance for Computer Networks, got: ${res.content}`);
    }
    if (!res.suggested || res.suggested.length === 0) {
      throw new Error('Expected follow-up suggestions for lowest subject');
    }
  });

  // 8. Chat Test: Multi-turn Advice ("How can I improve it?")
  await assertTest('Chat: Contextual Follow-up ("How can I improve it?")', async () => {
    const res = await sendChat('How can I improve it?');
    if (!res.content.includes('75%') || !res.content.includes('prioritizing')) {
      throw new Error(`Did not return improvement action plan, got: ${res.content}`);
    }
  });

  // 9. Chat Test: Multi-turn Faculty Lookup ("Who teaches it?")
  await assertTest('Chat: Contextual Follow-up ("Who teaches it?")', async () => {
    const res = await sendChat('Who teaches it?');
    if (!res.content.includes('Rajesh Kumar')) {
      throw new Error(`Expected Dr. Rajesh Kumar for Computer Networks, got: ${res.content}`);
    }
  });

  // 10. Chat Test: Seamless Switch to General AI ("Explain TCP")
  await assertTest('Chat: Seamless Switch to General AI ("Explain TCP")', async () => {
    const res = await sendChat('Explain TCP');
    if (!res.content.includes('Transmission Control Protocol') || !res.content.includes('3-Way Handshake')) {
      throw new Error('TCP explanation missing');
    }
    if (!res.suggested || res.suggested.length === 0 || !res.suggested.some(s => s.toLowerCase().includes('tcp') || s.toLowerCase().includes('client'))) {
      throw new Error('Expected contextual TCP follow-up suggestions');
    }
  });

  // 11. Chat Test: General AI Programming ("Give me a Java program for TCP client")
  await assertTest('Chat: General AI Programming ("Give me a Java program for TCP client")', async () => {
    const res = await sendChat('Give me a Java program for TCP client');
    if (!res.content.includes('class TCPClient') || !res.content.includes('Socket')) {
      throw new Error('Java code missing');
    }
  });

  // 12. Chat Test: University Database Query ("Who scored the highest in DBMS?")
  await assertTest('Chat: NL DB Query ("Who scored the highest in DBMS?")', async () => {
    const res = await sendChat('Who scored the highest in DBMS?');
    if (!res.content.includes('Sneha Patel') || !res.content.includes('98/100')) {
      throw new Error(`Expected Sneha Patel with 98 marks, got: ${res.content.slice(0, 100)}`);
    }
  });

  // 13. Chat Test: University Database Query ("How many students failed Computer Networks?")
  await assertTest('Chat: NL DB Query ("How many students failed Computer Networks?")', async () => {
    const res = await sendChat('How many students failed Computer Networks?');
    if (!res.content.includes('failed') || !res.content.includes('Rahul Verma')) {
      throw new Error('Did not identify failed students correctly');
    }
  });

  // 14. Chat Test: Department Comparison ("Which department has the highest pass percentage?")
  await assertTest('Chat: NL DB Query ("Which department has the highest pass percentage?")', async () => {
    const res = await sendChat('Which department has the highest pass percentage?');
    if (!res.content.includes('Computer Science') || !res.visualization) {
      throw new Error('Department comparison with chart missing');
    }
  });

  // 15. Chat Test: Attendance Shortage Query ("Show students below 75% attendance")
  await assertTest('Chat: NL DB Query ("Show students below 75% attendance")', async () => {
    const res = await sendChat('Show students below 75% attendance');
    if (!res.content.toLowerCase().includes('below 75%') || !res.visualization) {
      throw new Error('Attendance shortage list missing');
    }
  });

  // 16. Chat Test: Academic Advisor ("Am I eligible for exams?")
  await assertTest('Chat: Academic Advisor ("Am I eligible for exams?")', async () => {
    const res = await sendChat('Am I eligible for exams?');
    if (!res.content.includes('Exam Eligibility')) {
      throw new Error('Exam eligibility response missing');
    }
  });

  // 17. Chat Test: Semester Comparison ("Compare my current semester with the previous semester")
  await assertTest('Chat: Semester Comparison', async () => {
    const res = await sendChat('Compare my current semester with the previous semester');
    if (!res.content.includes('SGPA') || !res.content.includes('8.65')) {
      throw new Error('Semester comparison table missing');
    }
  });

  // 18. Chat Test: General AI 10-Mark Normalization ("Explain DBMS normalization for 10 marks")
  await assertTest('Chat: 10-Mark Exam Answer ("Explain DBMS normalization for 10 marks")', async () => {
    const res = await sendChat('Explain DBMS normalization for 10 marks');
    if (!res.content.includes('1NF') || !res.content.includes('2NF') || !res.content.includes('3NF') || !res.content.includes('BCNF')) {
      throw new Error('Normalization levels missing');
    }
  });

  // 19. Privacy Guard Test: Student attempting to snoop on another student's marks
  await assertTest('Privacy Guard: Student snooping on Rahul Verma marks', async () => {
    const res = await sendChat('Show me Rahul Verma marks');
    if (!res.content.includes('Privacy & Authorization Restriction') && !res.content.includes('authorized to access')) {
      throw new Error('Privacy restriction did not trigger for peer marks query');
    }
  });

  // 20. Zero Hallucination Test: Querying non-existent university subject
  await assertTest('Zero Hallucination: Non-existent subject query', async () => {
    const res = await sendChat('Who scored the highest in Advanced Rocket Propulsion XYZ999?');
    if (!res.content.includes("couldn't find that information in the university database")) {
      throw new Error('Hallucination safeguard did not trigger');
    }
  });

  console.log(`\n📊 Test Results: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
  if (passed === total) {
    console.log('🎉 ALL 20 CRITICAL SYSTEM TESTS PASSED PERFECTLY!');
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
});
