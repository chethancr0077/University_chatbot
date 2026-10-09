-- UniMate AI Relational Database Schema
-- SQLite 3 Compatible

PRAGMA foreign_keys = ON;

-- 1. Departments
CREATE TABLE IF NOT EXISTS departments (
    dept_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    hod_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    location TEXT NOT NULL,
    established_year INTEGER DEFAULT 2005
);

-- 2. Courses
CREATE TABLE IF NOT EXISTS courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    dept_id INTEGER NOT NULL REFERENCES departments(dept_id),
    degree TEXT NOT NULL DEFAULT 'B.Tech',
    total_semesters INTEGER NOT NULL DEFAULT 8
);

-- 3. Semesters
CREATE TABLE IF NOT EXISTS semesters (
    semester_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sem_number INTEGER NOT NULL,
    academic_year TEXT NOT NULL,
    term TEXT NOT NULL CHECK(term IN ('ODD', 'EVEN')),
    is_current INTEGER NOT NULL DEFAULT 0,
    start_date TEXT,
    end_date TEXT
);

-- 4. Subjects
CREATE TABLE IF NOT EXISTS subjects (
    subject_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    dept_id INTEGER NOT NULL REFERENCES departments(dept_id),
    sem_number INTEGER NOT NULL,
    credits INTEGER NOT NULL DEFAULT 4,
    total_classes INTEGER NOT NULL DEFAULT 50,
    syllabus_summary TEXT
);

-- 5. Users
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'faculty', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Students
CREATE TABLE IF NOT EXISTS students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    usn TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    dept_id INTEGER NOT NULL REFERENCES departments(dept_id),
    current_semester INTEGER NOT NULL DEFAULT 6,
    section TEXT NOT NULL DEFAULT 'A',
    cgpa REAL NOT NULL DEFAULT 0.0,
    sgpa REAL NOT NULL DEFAULT 0.0,
    prev_sgpa REAL NOT NULL DEFAULT 0.0,
    academic_status TEXT NOT NULL DEFAULT 'ACTIVE',
    risk_level TEXT NOT NULL DEFAULT 'LOW' CHECK(risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    risk_reason TEXT,
    admission_year INTEGER DEFAULT 2021
);

-- 7. Faculty
CREATE TABLE IF NOT EXISTS faculty (
    faculty_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    dept_id INTEGER NOT NULL REFERENCES departments(dept_id),
    designation TEXT NOT NULL,
    office_room TEXT NOT NULL,
    office_hours TEXT NOT NULL,
    availability_status TEXT NOT NULL DEFAULT 'Available',
    specialization TEXT
);

-- 8. Faculty Subject Mapping
CREATE TABLE IF NOT EXISTS faculty_subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id INTEGER NOT NULL REFERENCES faculty(faculty_id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    section TEXT NOT NULL DEFAULT 'A',
    academic_year TEXT NOT NULL DEFAULT '2025-2026'
);

-- 9. Class Sections
CREATE TABLE IF NOT EXISTS class_sections (
    section_id INTEGER PRIMARY KEY AUTOINCREMENT,
    dept_id INTEGER NOT NULL REFERENCES departments(dept_id),
    sem_number INTEGER NOT NULL,
    section_name TEXT NOT NULL,
    faculty_advisor_id INTEGER REFERENCES faculty(faculty_id),
    classroom TEXT NOT NULL
);

-- 10. Results (Historical and Current)
CREATE TABLE IF NOT EXISTS results (
    result_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    semester_id INTEGER NOT NULL REFERENCES semesters(semester_id),
    sem_number INTEGER NOT NULL,
    internal_marks REAL NOT NULL,
    external_marks REAL NOT NULL,
    total_marks REAL NOT NULL,
    grade TEXT NOT NULL,
    grade_points REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('PASS', 'FAIL')),
    exam_date TEXT
);

-- 11. Attendance
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    semester_id INTEGER NOT NULL REFERENCES semesters(semester_id),
    total_classes INTEGER NOT NULL DEFAULT 50,
    classes_attended INTEGER NOT NULL,
    attendance_pct REAL NOT NULL,
    eligibility_status TEXT NOT NULL CHECK(eligibility_status IN ('ELIGIBLE', 'SHORTAGE', 'CONDONED')),
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 12. University Rules & Regulations
CREATE TABLE IF NOT EXISTS university_rules (
    rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_category TEXT NOT NULL,
    rule_key TEXT NOT NULL UNIQUE,
    rule_name TEXT NOT NULL,
    rule_value TEXT NOT NULL,
    description TEXT NOT NULL
);

-- 13. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    conversation_id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. Messages
CREATE TABLE IF NOT EXISTS messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    mode TEXT DEFAULT 'GENERAL',
    visualization_type TEXT,
    visualization_data TEXT,
    suggested_followups TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_usn ON students(usn);
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(dept_id);
CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_subject ON results(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject ON attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);