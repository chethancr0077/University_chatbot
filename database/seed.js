const bcrypt = require('bcryptjs');
const { getDb, dbExec, dbRun, dbGet, dbAll, initSchema } = require('./db');

async function seedDatabase() {
  console.log('🌱 Starting UniMate AI Database Seeding...');
  
  // Re-initialize schema
  await initSchema();
  
  const defaultPassword = 'password123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  
  const db = getDb();

  // Clear existing data cleanly in correct order
  await dbExec(`
    DELETE FROM messages;
    DELETE FROM conversations;
    DELETE FROM results;
    DELETE FROM attendance;
    DELETE FROM faculty_subjects;
    DELETE FROM class_sections;
    DELETE FROM students;
    DELETE FROM faculty;
    DELETE FROM users;
    DELETE FROM subjects;
    DELETE FROM semesters;
    DELETE FROM courses;
    DELETE FROM departments;
    DELETE FROM university_rules;
    DELETE FROM sqlite_sequence;
  `);

  console.log('🧹 Cleaned existing tables and reset sequences.');

  // 1. Seed Departments
  const departments = [
    { code: 'CSE', name: 'Computer Science and Engineering', hod: 'Dr. Rajesh Kumar', email: 'hod.cse@unimate.ai', loc: 'Academic Block A, 3rd Floor' },
    { code: 'ISE', name: 'Information Science and Engineering', hod: 'Dr. Sunita Rao', email: 'hod.ise@unimate.ai', loc: 'Academic Block B, 2nd Floor' },
    { code: 'ECE', name: 'Electronics and Communication Engineering', hod: 'Dr. Anand Verma', email: 'hod.ece@unimate.ai', loc: 'Academic Block C, 1st Floor' },
    { code: 'ME', name: 'Mechanical Engineering', hod: 'Dr. Ramesh Patil', email: 'hod.me@unimate.ai', loc: 'Mechanical Block, Ground Floor' }
  ];

  for (const d of departments) {
    await dbRun(
      `INSERT INTO departments (code, name, hod_name, contact_email, location) VALUES (?, ?, ?, ?, ?)`,
      [d.code, d.name, d.hod, d.email, d.loc]
    );
  }
  console.log('✅ Departments seeded.');

  // 2. Seed Courses
  const courses = [
    { code: 'BTECH-CSE', name: 'B.Tech in Computer Science and Engineering', dept_id: 1, degree: 'B.Tech', total_semesters: 8 },
    { code: 'BTECH-ISE', name: 'B.Tech in Information Science and Engineering', dept_id: 2, degree: 'B.Tech', total_semesters: 8 },
    { code: 'BTECH-ECE', name: 'B.Tech in Electronics and Communication Engineering', dept_id: 3, degree: 'B.Tech', total_semesters: 8 },
    { code: 'BTECH-ME', name: 'B.Tech in Mechanical Engineering', dept_id: 4, degree: 'B.Tech', total_semesters: 8 }
  ];

  for (const c of courses) {
    await dbRun(
      `INSERT INTO courses (code, name, dept_id, degree, total_semesters) VALUES (?, ?, ?, ?, ?)`,
      [c.code, c.name, c.dept_id, c.degree, c.total_semesters]
    );
  }
  console.log('✅ Courses seeded.');

  // 3. Seed Semesters
  const semesters = [
    { sem_number: 1, academic_year: '2023-2024', term: 'ODD', is_current: 0, start_date: '2023-08-01', end_date: '2023-12-15' },
    { sem_number: 2, academic_year: '2023-2024', term: 'EVEN', is_current: 0, start_date: '2024-01-10', end_date: '2024-05-20' },
    { sem_number: 3, academic_year: '2024-2025', term: 'ODD', is_current: 0, start_date: '2024-08-01', end_date: '2024-12-15' },
    { sem_number: 4, academic_year: '2024-2025', term: 'EVEN', is_current: 0, start_date: '2025-01-10', end_date: '2025-05-20' },
    { sem_number: 5, academic_year: '2025-2026', term: 'ODD', is_current: 0, start_date: '2025-08-01', end_date: '2025-12-15' },
    { sem_number: 6, academic_year: '2025-2026', term: 'EVEN', is_current: 1, start_date: '2026-01-10', end_date: '2026-05-30' }
  ];

  for (const s of semesters) {
    await dbRun(
      `INSERT INTO semesters (sem_number, academic_year, term, is_current, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)`,
      [s.sem_number, s.academic_year, s.term, s.is_current, s.start_date, s.end_date]
    );
  }
  console.log('✅ Semesters seeded.');

  // 4. Seed Subjects
  const subjects = [
    // CSE Sem 6 (Current)
    { code: 'CS601', name: 'Machine Learning', dept_id: 1, sem: 6, credits: 4, classes: 50, summary: 'Supervised, Unsupervised learning, Neural Networks, Model evaluation' },
    { code: 'CS602', name: 'Cloud Computing & DevOps', dept_id: 1, sem: 6, credits: 4, classes: 48, summary: 'AWS, Docker, Kubernetes, CI/CD pipelines, Serverless architecture' },
    { code: 'CS603', name: 'Web Technologies & Frameworks', dept_id: 1, sem: 6, credits: 3, classes: 45, summary: 'Fullstack JS, React, Node.js, REST APIs, Microservices' },
    { code: 'CS604', name: 'Information & Network Security', dept_id: 1, sem: 6, credits: 3, classes: 42, summary: 'Cryptography, Public Key Infra, Threat Modeling, Ethical Hacking' },

    // CSE Sem 5 (Previous)
    { code: 'CS501', name: 'Computer Networks', dept_id: 1, sem: 5, credits: 4, classes: 52, summary: 'OSI/TCP-IP models, Routing algorithms, Transport protocols (TCP/UDP), Sockets' },
    { code: 'CS502', name: 'Database Management Systems', dept_id: 1, sem: 5, credits: 4, classes: 50, summary: 'Relational algebra, SQL, Normalization, ACID transactions, Indexing' },
    { code: 'CS503', name: 'Software Engineering & Agile', dept_id: 1, sem: 5, credits: 3, classes: 46, summary: 'SDLC, Agile Scrum, UML modeling, Testing strategies, Design patterns' },
    { code: 'CS504', name: 'Theory of Computation', dept_id: 1, sem: 5, credits: 4, classes: 48, summary: 'Automata theory, Regular expressions, Context-Free Grammars, Turing Machines' },

    // CSE Sem 4
    { code: 'CS401', name: 'Design & Analysis of Algorithms', dept_id: 1, sem: 4, credits: 4, classes: 50, summary: 'Divide & Conquer, Greedy, Dynamic Programming, Graph algorithms, NP-Completeness' },
    { code: 'CS402', name: 'Operating Systems', dept_id: 1, sem: 4, credits: 4, classes: 50, summary: 'Processes, Threads, CPU scheduling, Memory management, Virtual memory, File systems' },
    { code: 'CS403', name: 'Microcontrollers & Embedded Systems', dept_id: 1, sem: 4, credits: 3, classes: 44, summary: 'ARM Cortex architecture, Embedded C, Interfacing, Interrupts' },

    // CSE Sem 3
    { code: 'CS301', name: 'Data Structures and Applications', dept_id: 1, sem: 3, credits: 4, classes: 52, summary: 'Arrays, Stacks, Queues, Linked Lists, Trees, Graphs, Hashing' },
    { code: 'CS302', name: 'Object Oriented Programming with Java', dept_id: 1, sem: 3, credits: 3, classes: 48, summary: 'OOP principles, Inheritance, Polymorphism, Collections, Exception handling' },

    // ISE Subjects
    { code: 'IS601', name: 'Big Data Analytics', dept_id: 2, sem: 6, credits: 4, classes: 50, summary: 'Hadoop, Spark, MapReduce, NoSQL databases, Data pipelines' },
    { code: 'IS602', name: 'Software Architecture', dept_id: 2, sem: 6, credits: 3, classes: 45, summary: 'Architectural styles, Microservices, Domain Driven Design' },
    { code: 'IS501', name: 'Data Mining and Warehousing', dept_id: 2, sem: 5, credits: 4, classes: 50, summary: 'Association rules, Clustering, OLAP, ETL' },

    // ECE Subjects
    { code: 'EC601', name: 'VLSI Design & Embedded Systems', dept_id: 3, sem: 6, credits: 4, classes: 50, summary: 'CMOS logic, Verilog HDL, FPGA synthesis' },
    { code: 'EC602', name: 'Wireless Communication', dept_id: 3, sem: 6, credits: 4, classes: 48, summary: 'Cellular networks, 5G, MIMO, Channel fading' },
    { code: 'EC501', name: 'Digital Signal Processing', dept_id: 3, sem: 5, credits: 4, classes: 50, summary: 'DFT, FFT, IIR/FIR filters, Multirate DSP' },

    // ME Subjects
    { code: 'ME601', name: 'Heat and Mass Transfer', dept_id: 4, sem: 6, credits: 4, classes: 50, summary: 'Conduction, Convection, Radiation, Heat exchangers' },
    { code: 'ME602', name: 'Computer Integrated Manufacturing', dept_id: 4, sem: 6, credits: 3, classes: 45, summary: 'CNC programming, Robotics, CAD/CAM systems' },
    { code: 'ME501', name: 'Thermodynamics & IC Engines', dept_id: 4, sem: 5, credits: 4, classes: 50, summary: 'Carnot cycle, Otto/Diesel cycles, Combustion' }
  ];

  for (const sub of subjects) {
    await dbRun(
      `INSERT INTO subjects (code, name, dept_id, sem_number, credits, total_classes, syllabus_summary) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sub.code, sub.name, sub.dept_id, sub.sem, sub.credits, sub.classes, sub.summary]
    );
  }
  console.log('✅ Subjects seeded.');

  // 5. Seed University Rules
  const rules = [
    { category: 'ATTENDANCE', key: 'min_attendance_pct', name: 'Minimum Attendance Requirement', val: '75', desc: 'Students must maintain a minimum of 75% attendance in each course to be eligible for Semester End Examinations.' },
    { category: 'ATTENDANCE', key: 'condonation_min_pct', name: 'Condonation Threshold', val: '65', desc: 'Attendance between 65% and 74.9% may be condoned by the Dean on valid medical or institutional representation grounds.' },
    { category: 'ATTENDANCE', key: 'critical_shortage_pct', name: 'Critical Shortage Threshold', val: '65', desc: 'Attendance below 65% results in automatic detention (NSAR - No Shortage Attendance Relief).' },
    { category: 'EXAMINATION', key: 'min_pass_total_marks', name: 'Subject Passing Mark', val: '40', desc: 'A minimum of 40% aggregate marks (Internal + External) is mandatory to pass a course.' },
    { category: 'EXAMINATION', key: 'min_pass_external_marks', name: 'Semester End Passing Mark', val: '35', desc: 'A minimum of 35% in Semester End Examination (SEE) is required to pass.' },
    { category: 'PROMOTION', key: 'max_active_backlogs', name: 'Maximum Active Backlogs for Promotion', val: '4', desc: 'A student can have a maximum of 4 active backlogs from previous years to promote to the next academic year.' },
    { category: 'GRADING', key: 'cgpa_first_class_distinction', name: 'First Class with Distinction', val: '8.25', desc: 'CGPA of 8.25 and above qualifies for First Class with Distinction.' },
    { category: 'GRADING', key: 'cgpa_academic_probation', name: 'Academic Probation', val: '5.00', desc: 'CGPA below 5.00 places student on Academic Probation with mandatory counseling.' }
  ];

  for (const r of rules) {
    await dbRun(
      `INSERT INTO university_rules (rule_category, rule_key, rule_name, rule_value, description) VALUES (?, ?, ?, ?, ?)`,
      [r.category, r.key, r.name, r.val, r.desc]
    );
  }
  console.log('✅ University rules seeded.');

  // 6. Seed Faculty & Users
  const facultyList = [
    { name: 'Dr. Rajesh Kumar', empId: 'FAC-CSE-001', email: 'faculty@unimate.ai', phone: '+91 98765 43210', dept_id: 1, desig: 'Professor & HOD', room: 'CS-301, Block A', hours: 'Mon-Thu 2:00 PM - 4:00 PM', spec: 'Computer Networks, Distributed Databases', subjects: [5, 6] }, // CS501, CS502
    { name: 'Dr. Sunita Rao', empId: 'FAC-ISE-001', email: 'sunita.rao@unimate.ai', phone: '+91 98765 43211', dept_id: 2, desig: 'Professor & HOD', room: 'IS-201, Block B', hours: 'Tue-Fri 3:00 PM - 5:00 PM', spec: 'Big Data, Cloud Architectures', subjects: [14, 16] }, // IS601, IS501
    { name: 'Dr. Anand Verma', empId: 'FAC-ECE-001', email: 'anand.verma@unimate.ai', phone: '+91 98765 43212', dept_id: 3, desig: 'Professor & HOD', room: 'EC-104, Block C', hours: 'Mon-Wed 11:00 AM - 1:00 PM', spec: 'Signal Processing, Wireless Systems', subjects: [19] }, // EC501
    { name: 'Dr. Ramesh Patil', empId: 'FAC-ME-001', email: 'ramesh.patil@unimate.ai', phone: '+91 98765 43213', dept_id: 4, desig: 'Professor & HOD', room: 'ME-101, Mech Block', hours: 'Mon-Thu 10:00 AM - 12:00 PM', spec: 'Thermodynamics, Heat Engines', subjects: [22] }, // ME501
    { name: 'Prof. Priya Nair', empId: 'FAC-CSE-002', email: 'priya.nair@unimate.ai', phone: '+91 98765 43214', dept_id: 1, desig: 'Associate Professor', room: 'CS-305, Block A', hours: 'Wed-Fri 2:00 PM - 4:00 PM', spec: 'Machine Learning, Deep Neural Networks', subjects: [1, 12] }, // CS601, CS301
    { name: 'Prof. Vikram Mehta', empId: 'FAC-CSE-003', email: 'vikram.mehta@unimate.ai', phone: '+91 98765 43215', dept_id: 1, desig: 'Assistant Professor', room: 'CS-308, Block A', hours: 'Mon-Fri 3:30 PM - 5:00 PM', spec: 'Operating Systems, Web Engineering', subjects: [3, 10] }, // CS603, CS402
    { name: 'Prof. Neha Gupta', empId: 'FAC-CSE-004', email: 'neha.gupta@unimate.ai', phone: '+91 98765 43216', dept_id: 1, desig: 'Assistant Professor', room: 'CS-310, Block A', hours: 'Tue-Thu 1:00 PM - 3:00 PM', spec: 'Cybersecurity, Cryptography', subjects: [4, 9] }, // CS604, CS401
    { name: 'Prof. Arvind Kulkarni', empId: 'FAC-ECE-002', email: 'arvind.kulkarni@unimate.ai', phone: '+91 98765 43217', dept_id: 3, desig: 'Associate Professor', room: 'EC-202, Block C', hours: 'Mon-Wed 2:00 PM - 4:00 PM', spec: 'VLSI Architectures, Microelectronics', subjects: [17, 18] }, // EC601, EC602
    { name: 'Prof. Deepa Sharma', empId: 'FAC-ISE-002', email: 'deepa.sharma@unimate.ai', phone: '+91 98765 43218', dept_id: 2, desig: 'Associate Professor', room: 'IS-205, Block B', hours: 'Mon-Thu 11:00 AM - 1:00 PM', spec: 'Software Architecture, Java Technologies', subjects: [13, 15] }, // CS302, IS602
    { name: 'Prof. Suresh Hegde', empId: 'FAC-ME-002', email: 'suresh.hegde@unimate.ai', phone: '+91 98765 43219', dept_id: 4, desig: 'Assistant Professor', room: 'ME-203, Mech Block', hours: 'Tue-Fri 2:00 PM - 4:00 PM', spec: 'Fluid Dynamics, Robotics & Automation', subjects: [20, 21] }, // ME601, ME602
    { name: 'Prof. Meenakshi Sundaram', empId: 'FAC-CSE-005', email: 'meenakshi.s@unimate.ai', phone: '+91 98765 43220', dept_id: 1, desig: 'Assistant Professor', room: 'CS-312, Block A', hours: 'Mon-Thu 1:30 PM - 3:30 PM', spec: 'Software Engineering, Agile Methodologies', subjects: [7, 2] } // CS503, CS602
  ];

  // Insert Admin User with SRN / ID 'ADMIN-001'
  const adminUserRes = await dbRun(
    `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['ADMIN-001', 'admin@unimate.ai', hashedPassword, 'admin']
  );
  console.log(`✅ Admin account created: SRN ADMIN-001 (ID: ${adminUserRes.lastID})`);

  // Insert Faculty Users & Faculty records with Faculty ID / SRN
  for (const f of facultyList) {
    const userRes = await dbRun(
      `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [f.empId, f.email, hashedPassword, 'faculty']
    );
    const facRes = await dbRun(
      `INSERT INTO faculty (user_id, employee_id, full_name, email, phone, dept_id, designation, office_room, office_hours, availability_status, specialization) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userRes.lastID, f.empId, f.name, f.email, f.phone, f.dept_id, f.desig, f.room, f.hours, 'Available', f.spec]
    );

    // Map subjects handled
    for (const subId of f.subjects) {
      await dbRun(
        `INSERT INTO faculty_subjects (faculty_id, subject_id, section, academic_year) VALUES (?, ?, ?, ?)`,
        [facRes.lastID, subId, 'A', '2025-2026']
      );
    }
  }
  console.log('✅ 11 Faculty accounts & subject mappings created.');

  // 7. Seed Class Sections
  await dbRun(`INSERT INTO class_sections (dept_id, sem_number, section_name, faculty_advisor_id, classroom) VALUES (1, 6, 'A', 1, 'LH-301')`);
  await dbRun(`INSERT INTO class_sections (dept_id, sem_number, section_name, faculty_advisor_id, classroom) VALUES (1, 6, 'B', 5, 'LH-302')`);
  await dbRun(`INSERT INTO class_sections (dept_id, sem_number, section_name, faculty_advisor_id, classroom) VALUES (2, 6, 'A', 2, 'LH-201')`);
  await dbRun(`INSERT INTO class_sections (dept_id, sem_number, section_name, faculty_advisor_id, classroom) VALUES (3, 6, 'A', 3, 'LH-101')`);
  await dbRun(`INSERT INTO class_sections (dept_id, sem_number, section_name, faculty_advisor_id, classroom) VALUES (4, 6, 'A', 4, 'LH-001')`);

  // 8. Generate 54 Realistic Students across 4 Departments
  console.log('🎓 Generating 54 realistic students and historical academic records...');

  const studentDefs = [
    // CSE Students (25 students)
    { name: 'Aarav Sharma', usn: '1MS21CS001', email: 'student@unimate.ai', dept: 1, cgpa: 8.42, sgpa: 8.65, prev_sgpa: 8.15, status: 'ACTIVE', risk: 'LOW', reason: 'High performance; consistent improvement from Sem 5' },
    { name: 'Sneha Patel', usn: '1MS21CS002', email: 'sneha.patel@unimate.ai', dept: 1, cgpa: 9.68, sgpa: 9.75, prev_sgpa: 9.60, status: 'ACTIVE', risk: 'LOW', reason: 'Department topper, exceptional academic consistency' },
    { name: 'Rohan Deshmukh', usn: '1MS21CS003', email: 'rohan.deshmukh@unimate.ai', dept: 1, cgpa: 9.45, sgpa: 9.50, prev_sgpa: 9.38, status: 'ACTIVE', risk: 'LOW', reason: 'Top 3 rank in semester, strong competitive coding profile' },
    { name: 'Ananya Iyer', usn: '1MS21CS004', email: 'ananya.iyer@unimate.ai', dept: 1, cgpa: 8.85, sgpa: 8.90, prev_sgpa: 8.80, status: 'ACTIVE', risk: 'LOW', reason: 'Consistent above 8.5 CGPA' },
    { name: 'Karthik Reddy', usn: '1MS21CS005', email: 'karthik.reddy@unimate.ai', dept: 1, cgpa: 8.12, sgpa: 8.25, prev_sgpa: 8.00, status: 'ACTIVE', risk: 'LOW', reason: 'Good steady progress' },
    { name: 'Pooja Hegde', usn: '1MS21CS006', email: 'pooja.hegde@unimate.ai', dept: 1, cgpa: 7.95, sgpa: 8.10, prev_sgpa: 7.80, status: 'ACTIVE', risk: 'LOW', reason: 'Steady progress, good participation' },
    { name: 'Aditya Kulkarni', usn: '1MS21CS007', email: 'aditya.kulkarni@unimate.ai', dept: 1, cgpa: 7.65, sgpa: 7.80, prev_sgpa: 7.50, status: 'ACTIVE', risk: 'LOW', reason: 'Above average performance' },
    { name: 'Meera Nambiar', usn: '1MS21CS008', email: 'meera.nambiar@unimate.ai', dept: 1, cgpa: 8.35, sgpa: 8.40, prev_sgpa: 8.30, status: 'ACTIVE', risk: 'LOW', reason: 'Consistent grades in core theory' },
    { name: 'Vikrant Singh', usn: '1MS21CS009', email: 'vikrant.singh@unimate.ai', dept: 1, cgpa: 7.20, sgpa: 7.35, prev_sgpa: 7.05, status: 'ACTIVE', risk: 'LOW', reason: 'Satisfactory academic progress' },
    { name: 'Deepika Sen', usn: '1MS21CS010', email: 'deepika.sen@unimate.ai', dept: 1, cgpa: 8.70, sgpa: 8.80, prev_sgpa: 8.60, status: 'ACTIVE', risk: 'LOW', reason: 'Excellent practical and internal scores' },
    { name: 'Harish Babu', usn: '1MS21CS011', email: 'harish.babu@unimate.ai', dept: 1, cgpa: 7.40, sgpa: 7.20, prev_sgpa: 7.60, status: 'ACTIVE', risk: 'MEDIUM', reason: 'Minor drop in SGPA, attendance at 74% in one subject' },
    { name: 'Divya Soni', usn: '1MS21CS012', email: 'divya.soni@unimate.ai', dept: 1, cgpa: 8.05, sgpa: 8.15, prev_sgpa: 7.95, status: 'ACTIVE', risk: 'LOW', reason: 'Solid standing across courses' },
    { name: 'Gautam Menon', usn: '1MS21CS013', email: 'gautam.menon@unimate.ai', dept: 1, cgpa: 7.50, sgpa: 7.60, prev_sgpa: 7.40, status: 'ACTIVE', risk: 'LOW', reason: 'Normal academic status' },
    // HIGH RISK STUDENT: Low attendance (62%), failed 2 subjects in Sem 5, falling SGPA
    { name: 'Rahul Verma', usn: '1MS21CS014', email: 'rahul.verma@unimate.ai', dept: 1, cgpa: 6.42, sgpa: 5.40, prev_sgpa: 7.80, status: 'PROBATION', risk: 'HIGH', reason: 'Critical: Attendance is 62%, failed Computer Networks & TOC in Sem 5, and SGPA dropped sharply from 7.80 to 5.40' },
    { name: 'Kavya Pillai', usn: '1MS21CS015', email: 'kavya.pillai@unimate.ai', dept: 1, cgpa: 8.95, sgpa: 9.05, prev_sgpa: 8.85, status: 'ACTIVE', risk: 'LOW', reason: 'Top tier consistency' },
    { name: 'Manoj Kumar', usn: '1MS21CS016', email: 'manoj.kumar@unimate.ai', dept: 1, cgpa: 7.10, sgpa: 6.90, prev_sgpa: 7.30, status: 'ACTIVE', risk: 'MEDIUM', reason: 'Attendance borderline at 73.5%, weak score in Machine Learning' },
    { name: 'Preeti Bhat', usn: '1MS21CS017', email: 'preeti.bhat@unimate.ai', dept: 1, cgpa: 8.25, sgpa: 8.35, prev_sgpa: 8.15, status: 'ACTIVE', risk: 'LOW', reason: 'Good steady academic status' },
    { name: 'Siddharth Roy', usn: '1MS21CS018', email: 'siddharth.roy@unimate.ai', dept: 1, cgpa: 7.75, sgpa: 7.85, prev_sgpa: 7.65, status: 'ACTIVE', risk: 'LOW', reason: 'Consistent track record' },
    { name: 'Shreya Nair', usn: '1MS21CS019', email: 'shreya.nair@unimate.ai', dept: 1, cgpa: 8.60, sgpa: 8.70, prev_sgpa: 8.50, status: 'ACTIVE', risk: 'LOW', reason: 'High performance student' },
    // MEDIUM RISK STUDENT: 1 backlog, attendance 71%
    { name: 'Pooja Joshi', usn: '1MS21CS020', email: 'pooja.joshi@unimate.ai', dept: 1, cgpa: 6.85, sgpa: 6.50, prev_sgpa: 7.20, status: 'ACTIVE', risk: 'MEDIUM', reason: 'Attendance is 71% in Information Security, 1 backlog in Sem 5' },
    { name: 'Varun Teja', usn: '1MS21CS021', email: 'varun.teja@unimate.ai', dept: 1, cgpa: 6.70, sgpa: 5.80, prev_sgpa: 7.60, status: 'ACTIVE', risk: 'HIGH', reason: 'Attendance is 63.5%, failed Computer Networks in Sem 5' },
    { name: 'Tanvi Shah', usn: '1MS21CS022', email: 'tanvi.shah@unimate.ai', dept: 1, cgpa: 8.55, sgpa: 8.65, prev_sgpa: 8.45, status: 'ACTIVE', risk: 'LOW', reason: 'Strong academic performance' },
    { name: 'Abhishek Rao', usn: '1MS21CS023', email: 'abhishek.rao@unimate.ai', dept: 1, cgpa: 7.80, sgpa: 7.90, prev_sgpa: 7.70, status: 'ACTIVE', risk: 'LOW', reason: 'Good progress' },
    { name: 'Swati Kamath', usn: '1MS21CS024', email: 'swati.kamath@unimate.ai', dept: 1, cgpa: 8.30, sgpa: 8.40, prev_sgpa: 8.20, status: 'ACTIVE', risk: 'LOW', reason: 'Consistent performer' },
    { name: 'Naveen Raj', usn: '1MS21CS025', email: 'naveen.raj@unimate.ai', dept: 1, cgpa: 7.35, sgpa: 7.45, prev_sgpa: 7.25, status: 'ACTIVE', risk: 'LOW', reason: 'Satisfactory progress' },

    // ISE Students (10 students)
    { name: 'Akash Shetty', usn: '1MS21IS001', email: 'akash.shetty@unimate.ai', dept: 2, cgpa: 9.32, sgpa: 9.40, prev_sgpa: 9.25, status: 'ACTIVE', risk: 'LOW', reason: 'ISE Department topper' },
    { name: 'Ritu Agarwal', usn: '1MS21IS002', email: 'ritu.agarwal@unimate.ai', dept: 2, cgpa: 8.90, sgpa: 9.00, prev_sgpa: 8.80, status: 'ACTIVE', risk: 'LOW', reason: 'Excellent academic performance' },
    { name: 'Sanjay Krishnan', usn: '1MS21IS003', email: 'sanjay.k@unimate.ai', dept: 2, cgpa: 8.45, sgpa: 8.55, prev_sgpa: 8.35, status: 'ACTIVE', risk: 'LOW', reason: 'High performance' },
    { name: 'Bhavna Das', usn: '1MS21IS004', email: 'bhavna.das@unimate.ai', dept: 2, cgpa: 8.10, sgpa: 8.20, prev_sgpa: 8.00, status: 'ACTIVE', risk: 'LOW', reason: 'Consistent scores' },
    { name: 'Kiran Nayak', usn: '1MS21IS005', email: 'kiran.nayak@unimate.ai', dept: 2, cgpa: 7.60, sgpa: 7.70, prev_sgpa: 7.50, status: 'ACTIVE', risk: 'LOW', reason: 'Good steady progress' },
    { name: 'Monika Paul', usn: '1MS21IS006', email: 'monika.paul@unimate.ai', dept: 2, cgpa: 7.25, sgpa: 7.10, prev_sgpa: 7.40, status: 'ACTIVE', risk: 'LOW', reason: 'Average standing' },
    { name: 'Chirag Parekh', usn: '1MS21IS007', email: 'chirag.parekh@unimate.ai', dept: 2, cgpa: 6.95, sgpa: 6.60, prev_sgpa: 7.30, status: 'ACTIVE', risk: 'MEDIUM', reason: 'Attendance shortage in Big Data (69%)' },
    { name: 'Nandini Sen', usn: '1MS21IS008', email: 'nandini.sen@unimate.ai', dept: 2, cgpa: 8.75, sgpa: 8.85, prev_sgpa: 8.65, status: 'ACTIVE', risk: 'LOW', reason: 'Consistent top ranker' },
    { name: 'Pranav Joshi', usn: '1MS21IS009', email: 'pranav.joshi@unimate.ai', dept: 2, cgpa: 7.85, sgpa: 7.95, prev_sgpa: 7.75, status: 'ACTIVE', risk: 'LOW', reason: 'Good academic standing' },
    { name: 'Divakar Rao', usn: '1MS21IS010', email: 'divakar.rao@unimate.ai', dept: 2, cgpa: 6.30, sgpa: 5.60, prev_sgpa: 7.00, status: 'PROBATION', risk: 'HIGH', reason: 'Attendance is 61%, failed Data Mining in Sem 5' },

    // ECE Students (10 students)
    { name: 'Aditya Hegde', usn: '1MS21EC001', email: 'aditya.hegde@unimate.ai', dept: 3, cgpa: 9.20, sgpa: 9.30, prev_sgpa: 9.10, status: 'ACTIVE', risk: 'LOW', reason: 'ECE Department topper' },
    { name: 'Sowmya Rao', usn: '1MS21EC002', email: 'sowmya.rao@unimate.ai', dept: 3, cgpa: 8.80, sgpa: 8.90, prev_sgpa: 8.70, status: 'ACTIVE', risk: 'LOW', reason: 'Strong core electronics grades' },
    { name: 'Tarun Murthy', usn: '1MS21EC003', email: 'tarun.murthy@unimate.ai', dept: 3, cgpa: 8.35, sgpa: 8.45, prev_sgpa: 8.25, status: 'ACTIVE', risk: 'LOW', reason: 'Solid standing' },
    { name: 'Archana Varma', usn: '1MS21EC004', email: 'archana.varma@unimate.ai', dept: 3, cgpa: 7.90, sgpa: 8.00, prev_sgpa: 7.80, status: 'ACTIVE', risk: 'LOW', reason: 'Good progress' },
    { name: 'Girish Prabhu', usn: '1MS21EC005', email: 'girish.prabhu@unimate.ai', dept: 3, cgpa: 7.40, sgpa: 7.50, prev_sgpa: 7.30, status: 'ACTIVE', risk: 'LOW', reason: 'Satisfactory' },
    { name: 'Lavanya Nair', usn: '1MS21EC006', email: 'lavanya.nair@unimate.ai', dept: 3, cgpa: 8.50, sgpa: 8.60, prev_sgpa: 8.40, status: 'ACTIVE', risk: 'LOW', reason: 'High performance' },
    { name: 'Nikhil Bhat', usn: '1MS21EC007', email: 'nikhil.bhat@unimate.ai', dept: 3, cgpa: 6.25, sgpa: 5.20, prev_sgpa: 7.30, status: 'PROBATION', risk: 'HIGH', reason: 'Attendance 64%, failed DSP in Sem 5, steep drop in SGPA' },
    { name: 'Rashmi Kulal', usn: '1MS21EC008', email: 'rashmi.kulal@unimate.ai', dept: 3, cgpa: 7.70, sgpa: 7.80, prev_sgpa: 7.60, status: 'ACTIVE', risk: 'LOW', reason: 'Consistent' },
    { name: 'Vinay Kumar', usn: '1MS21EC009', email: 'vinay.kumar@unimate.ai', dept: 3, cgpa: 8.05, sgpa: 8.15, prev_sgpa: 7.95, status: 'ACTIVE', risk: 'LOW', reason: 'Steady progress' },
    { name: 'Tejaswini M', usn: '1MS21EC010', email: 'tejaswini.m@unimate.ai', dept: 3, cgpa: 7.15, sgpa: 6.80, prev_sgpa: 7.50, status: 'ACTIVE', risk: 'MEDIUM', reason: 'Attendance borderline at 72%, low internal test scores' },

    // ME Students (9 students)
    { name: 'Siddheshwar Gowda', usn: '1MS21ME001', email: 'siddheshwar.g@unimate.ai', dept: 4, cgpa: 9.10, sgpa: 9.15, prev_sgpa: 9.05, status: 'ACTIVE', risk: 'LOW', reason: 'Mechanical Department topper' },
    { name: 'Pradeep Shenoy', usn: '1MS21ME002', email: 'pradeep.shenoy@unimate.ai', dept: 4, cgpa: 8.40, sgpa: 8.50, prev_sgpa: 8.30, status: 'ACTIVE', risk: 'LOW', reason: 'Strong design & thermal scores' },
    { name: 'Bharath Gowda', usn: '1MS21ME003', email: 'bharath.gowda@unimate.ai', dept: 4, cgpa: 7.80, sgpa: 7.90, prev_sgpa: 7.70, status: 'ACTIVE', risk: 'LOW', reason: 'Good academic standing' },
    { name: 'Anupama Pai', usn: '1MS21ME004', email: 'anupama.pai@unimate.ai', dept: 4, cgpa: 8.65, sgpa: 8.75, prev_sgpa: 8.55, status: 'ACTIVE', risk: 'LOW', reason: 'High performance' },
    { name: 'Chethan Kumar', usn: '1MS21ME005', email: 'chethan.kumar@unimate.ai', dept: 4, cgpa: 7.30, sgpa: 7.40, prev_sgpa: 7.20, status: 'ACTIVE', risk: 'LOW', reason: 'Satisfactory' },
    { name: 'Kavitha Shetty', usn: '1MS21ME006', email: 'kavitha.shetty@unimate.ai', dept: 4, cgpa: 8.00, sgpa: 8.10, prev_sgpa: 7.90, status: 'ACTIVE', risk: 'LOW', reason: 'Consistent' },
    { name: 'Ganesh Naik', usn: '1MS21ME007', email: 'ganesh.naik@unimate.ai', dept: 4, cgpa: 6.15, sgpa: 5.10, prev_sgpa: 7.20, status: 'PROBATION', risk: 'HIGH', reason: 'Attendance is 59%, failed Thermodynamics in Sem 5' },
    { name: 'Harsha Vardhan', usn: '1MS21ME008', email: 'harsha.v@unimate.ai', dept: 4, cgpa: 7.55, sgpa: 7.65, prev_sgpa: 7.45, status: 'ACTIVE', risk: 'LOW', reason: 'Steady progress' },
    { name: 'Shweta Kulkarni', usn: '1MS21ME009', email: 'shweta.k@unimate.ai', dept: 4, cgpa: 8.25, sgpa: 8.35, prev_sgpa: 8.15, status: 'ACTIVE', risk: 'LOW', reason: 'Good standing' }
  ];

  const studentIdMap = {};

  for (const st of studentDefs) {
    const userRes = await dbRun(
      `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [st.usn.toUpperCase(), st.email, hashedPassword, 'student']
    );

    const sRes = await dbRun(
      `INSERT INTO students (user_id, usn, full_name, email, phone, dept_id, current_semester, section, cgpa, sgpa, prev_sgpa, academic_status, risk_level, risk_reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userRes.lastID,
        st.usn,
        st.name,
        st.email,
        '+91 9' + Math.floor(100000000 + Math.random() * 900000000),
        st.dept,
        6,
        'A',
        st.cgpa,
        st.sgpa,
        st.prev_sgpa,
        st.status,
        st.risk,
        st.reason
      ]
    );

    studentIdMap[st.usn] = sRes.lastID;
  }
  console.log(`✅ Seeded ${Object.keys(studentIdMap).length} students.`);

  // 9. Seed Comprehensive Results & Attendance
  console.log('📊 Seeding detailed semester results and subject attendance...');

  // Helper for grade from marks
  function getGrade(total) {
    if (total >= 90) return { grade: 'O', pts: 10, status: 'PASS' };
    if (total >= 80) return { grade: 'A+', pts: 9, status: 'PASS' };
    if (total >= 70) return { grade: 'A', pts: 8, status: 'PASS' };
    if (total >= 60) return { grade: 'B+', pts: 7, status: 'PASS' };
    if (total >= 50) return { grade: 'B', pts: 6, status: 'PASS' };
    if (total >= 40) return { grade: 'C', pts: 5, status: 'PASS' };
    return { grade: 'F', pts: 0, status: 'FAIL' };
  }

  // Pre-seed specific historical results for Sem 5 and Sem 6 (in-progress/midterms)
  // For CSE students:
  // Subjects:
  // CS501: CN (id 5)
  // CS502: DBMS (id 6)
  // CS503: SE (id 7)
  // CS504: TOC (id 8)
  // Sem 6 subjects:
  // CS601: ML (id 1)
  // CS602: Cloud (id 2)
  // CS603: Web Tech (id 3)
  // CS604: Info Sec (id 4)

  for (const st of studentDefs) {
    const sId = studentIdMap[st.usn];
    const isCSE = st.dept === 1;
    const isAarav = st.usn === '1MS21CS001';
    const isSneha = st.usn === '1MS21CS002';
    const isRahul = st.usn === '1MS21CS014'; // high risk
    const isVarun = st.usn === '1MS21CS021'; // high risk
    const isNikhil = st.usn === '1MS21EC007'; // high risk
    const isGanesh = st.usn === '1MS21ME007'; // high risk

    if (isCSE) {
      // Sem 5 Results
      // Specific scores for notable students:
      let dbmsMarks = Math.round(st.cgpa * 9.5 + (Math.random() * 4 - 2));
      let cnMarks = Math.round(st.cgpa * 9.0 + (Math.random() * 4 - 2));
      let seMarks = Math.round(st.cgpa * 9.2 + (Math.random() * 4 - 2));
      let tocMarks = Math.round(st.cgpa * 8.8 + (Math.random() * 4 - 2));

      if (isSneha) {
        dbmsMarks = 98; // Sneha highest in DBMS!
        cnMarks = 96;
        seMarks = 97;
        tocMarks = 97;
      } else if (isAarav) {
        dbmsMarks = 94; // Aarav strong in DBMS!
        cnMarks = 68;   // Aarav's weaker subject in Sem 5
        seMarks = 86;
        tocMarks = 82;
      } else if (isRahul) {
        dbmsMarks = 52;
        cnMarks = 32;   // FAILED Computer Networks!
        seMarks = 58;
        tocMarks = 34;   // FAILED TOC!
      } else if (isVarun) {
        dbmsMarks = 60;
        cnMarks = 34;   // FAILED Computer Networks!
        seMarks = 62;
        tocMarks = 58;
      }

      const sem5Subs = [
        { id: 5, total: cnMarks },
        { id: 6, total: dbmsMarks },
        { id: 7, total: seMarks },
        { id: 8, total: tocMarks }
      ];

      for (const sub of sem5Subs) {
        const total = Math.min(100, Math.max(25, sub.total));
        const internal = Math.round(total * 0.4);
        const external = total - internal;
        const g = getGrade(total);

        await dbRun(
          `INSERT INTO results (student_id, subject_id, semester_id, sem_number, internal_marks, external_marks, total_marks, grade, grade_points, status, exam_date)
           VALUES (?, ?, 5, 5, ?, ?, ?, ?, ?, ?, '2025-12-10')`,
          [sId, sub.id, internal, external, total, g.grade, g.pts, g.status]
        );
      }

      // Sem 4 Results (Historical for comparison)
      const sem4Subs = [
        { id: 9, name: 'DAA', base: st.cgpa * 8.8 },
        { id: 10, name: 'OS', base: st.cgpa * 9.0 },
        { id: 11, name: 'Microcontrollers', base: st.cgpa * 8.5 }
      ];
      for (const sub of sem4Subs) {
        const total = Math.min(100, Math.max(35, Math.round(sub.base + (Math.random() * 4 - 2))));
        const internal = Math.round(total * 0.4);
        const external = total - internal;
        const g = getGrade(total);
        await dbRun(
          `INSERT INTO results (student_id, subject_id, semester_id, sem_number, internal_marks, external_marks, total_marks, grade, grade_points, status, exam_date)
           VALUES (?, ?, 4, 4, ?, ?, ?, ?, ?, ?, '2025-05-15')`,
          [sId, sub.id, internal, external, total, g.grade, g.pts, g.status]
        );
      }

      // Sem 6 Attendance (Current Semester)
      // Subjects: CS601 (50 classes), CS602 (48 classes), CS603 (45 classes), CS501 Computer Networks (50 classes)
      const sem6Subs = [
        { id: 1, total: 50 },
        { id: 2, total: 48 },
        { id: 3, total: 45 },
        { id: 5, total: 50 } // Computer Networks
      ];

      for (const sub of sem6Subs) {
        let attended;
        if (isAarav) {
          // Aarav Sharma attendance (82% overall):
          // ML: 44/50 = 88%
          // Cloud: 42/48 = 87.5%
          // Web Tech: 39/45 = 86.7%
          // Computer Networks: 34/50 = 68% (Lowest subject, taught by Dr. Rajesh Kumar)
          if (sub.id === 1) attended = 44;
          else if (sub.id === 2) attended = 42;
          else if (sub.id === 3) attended = 39;
          else attended = 34; // 68%
        } else if (isRahul) {
          // Rahul Verma: Critical low attendance (62%)
          attended = Math.round(sub.total * (0.58 + Math.random() * 0.08));
        } else if (isVarun) {
          attended = Math.round(sub.total * (0.60 + Math.random() * 0.07));
        } else if (st.risk === 'MEDIUM') {
          attended = Math.round(sub.total * (0.71 + Math.random() * 0.04));
        } else {
          attended = Math.round(sub.total * (0.80 + Math.random() * 0.16));
        }

        const pct = parseFloat(((attended / sub.total) * 100).toFixed(1));
        const elig = pct >= 75 ? 'ELIGIBLE' : (pct >= 65 ? 'CONDONED' : 'SHORTAGE');

        await dbRun(
          `INSERT INTO attendance (student_id, subject_id, semester_id, total_classes, classes_attended, attendance_pct, eligibility_status)
           VALUES (?, ?, 6, ?, ?, ?, ?)`,
          [sId, sub.id, sub.total, attended, pct, elig]
        );
      }

    } else if (st.dept === 2) { // ISE
      // Sem 5 Data
      const isDivakar = st.usn === '1MS21IS010';
      const isChirag = st.usn === '1MS21IS007';
      const dmMarks = isDivakar ? 34 : Math.round(st.cgpa * 9.2);
      const g = getGrade(dmMarks);
      await dbRun(
        `INSERT INTO results (student_id, subject_id, semester_id, sem_number, internal_marks, external_marks, total_marks, grade, grade_points, status, exam_date)
         VALUES (?, 16, 5, 5, ?, ?, ?, ?, ?, ?, '2025-12-10')`,
        [sId, Math.round(dmMarks * 0.4), dmMarks - Math.round(dmMarks * 0.4), dmMarks, g.grade, g.pts, g.status]
      );

      // Sem 6 Attendance (IS601: 50, IS602: 45)
      const iseSubs = [{ id: 14, total: 50 }, { id: 15, total: 45 }];
      for (const sub of iseSubs) {
        let attended = Math.round(sub.total * (isDivakar ? 0.61 : (isChirag ? 0.69 : 0.84)));
        const pct = parseFloat(((attended / sub.total) * 100).toFixed(1));
        const elig = pct >= 75 ? 'ELIGIBLE' : (pct >= 65 ? 'CONDONED' : 'SHORTAGE');
        await dbRun(
          `INSERT INTO attendance (student_id, subject_id, semester_id, total_classes, classes_attended, attendance_pct, eligibility_status)
           VALUES (?, ?, 6, ?, ?, ?, ?)`,
          [sId, sub.id, sub.total, attended, pct, elig]
        );
      }

    } else if (st.dept === 3) { // ECE
      const dspMarks = isNikhil ? 35 : Math.round(st.cgpa * 9.1);
      const g = getGrade(dspMarks);
      await dbRun(
        `INSERT INTO results (student_id, subject_id, semester_id, sem_number, internal_marks, external_marks, total_marks, grade, grade_points, status, exam_date)
         VALUES (?, 19, 5, 5, ?, ?, ?, ?, ?, ?, '2025-12-10')`,
        [sId, Math.round(dspMarks * 0.4), dspMarks - Math.round(dspMarks * 0.4), dspMarks, g.grade, g.pts, g.status]
      );

      // Sem 6 Attendance (EC601: 50, EC602: 48)
      const eceSubs = [{ id: 17, total: 50 }, { id: 18, total: 48 }];
      for (const sub of eceSubs) {
        let attended = Math.round(sub.total * (isNikhil ? 0.64 : 0.86));
        const pct = parseFloat(((attended / sub.total) * 100).toFixed(1));
        const elig = pct >= 75 ? 'ELIGIBLE' : (pct >= 65 ? 'CONDONED' : 'SHORTAGE');
        await dbRun(
          `INSERT INTO attendance (student_id, subject_id, semester_id, total_classes, classes_attended, attendance_pct, eligibility_status)
           VALUES (?, ?, 6, ?, ?, ?, ?)`,
          [sId, sub.id, sub.total, attended, pct, elig]
        );
      }

    } else if (st.dept === 4) { // ME
      const thermoMarks = isGanesh ? 33 : Math.round(st.cgpa * 8.9);
      const g = getGrade(thermoMarks);
      await dbRun(
        `INSERT INTO results (student_id, subject_id, semester_id, sem_number, internal_marks, external_marks, total_marks, grade, grade_points, status, exam_date)
         VALUES (?, 22, 5, 5, ?, ?, ?, ?, ?, ?, '2025-12-10')`,
        [sId, Math.round(thermoMarks * 0.4), thermoMarks - Math.round(thermoMarks * 0.4), thermoMarks, g.grade, g.pts, g.status]
      );

      // Sem 6 Attendance (ME601: 50, ME602: 45)
      const meSubs = [{ id: 20, total: 50 }, { id: 21, total: 45 }];
      for (const sub of meSubs) {
        let attended = Math.round(sub.total * (isGanesh ? 0.59 : 0.85));
        const pct = parseFloat(((attended / sub.total) * 100).toFixed(1));
        const elig = pct >= 75 ? 'ELIGIBLE' : (pct >= 65 ? 'CONDONED' : 'SHORTAGE');
        await dbRun(
          `INSERT INTO attendance (student_id, subject_id, semester_id, total_classes, classes_attended, attendance_pct, eligibility_status)
           VALUES (?, ?, 6, ?, ?, ?, ?)`,
          [sId, sub.id, sub.total, attended, pct, elig]
        );
      }
    }
  }

  console.log('✅ Academic results and attendance records generated successfully.');

  // 10. Pre-seed an initial default conversation for the demo student
  const aaravUserId = (await dbGet(`SELECT user_id FROM users WHERE email = 'student@unimate.ai'`)).user_id;
  const convId = 'conv-demo-001';
  await dbRun(
    `INSERT INTO conversations (conversation_id, user_id, title) VALUES (?, ?, ?)`,
    [convId, aaravUserId, 'Welcome to UniMate AI']
  );

  await dbRun(
    `INSERT INTO messages (conversation_id, role, content, mode, visualization_type, visualization_data, suggested_followups) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      convId,
      'assistant',
      `Hello Aarav! 👋 I'm **UniMate AI**, your personal AI companion & university assistant.

I can seamlessly assist you with:
- **Your University Records**: Attendance, SGPA/CGPA, exam eligibility, backlog analysis
- **Academic Guidance**: What subjects to focus on, exam preparation advice, attendance simulation
- **General AI Intelligence**: Programming (Python, C++, Java, React, SQL), Mathematics, Operating Systems, Computer Networks, professional emails & more!

Feel free to ask questions like *"What is my attendance?"*, *"Who teaches Computer Networks?"*, or *"Explain TCP 3-way handshake in simple words"*.`,
      'UNIVERSITY',
      null,
      null,
      JSON.stringify([
        'What is my current attendance?',
        'How am I doing academically?',
        'Which subject should I focus on?',
        'Explain DBMS normalization for 10 marks'
      ])
    ]
  );

  console.log('🎉 UniMate AI database seeded completely with demo data!');
  console.log('----------------------------------------------------');
  console.log('Demo Accounts:');
  console.log('1. Student : student@unimate.ai  | Password: password123 (Aarav Sharma, USN 1MS21CS001)');
  console.log('2. Faculty : faculty@unimate.ai  | Password: password123 (Dr. Rajesh Kumar, HOD CSE)');
  console.log('3. Admin   : admin@unimate.ai    | Password: password123 (Registrar / Dean)');
  console.log('----------------------------------------------------');
}

if (require.main === module) {
  seedDatabase().catch((err) => {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
