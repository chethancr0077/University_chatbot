/**
 * Intent Classifier & Semantic Entity Extractor
 */

const KNOWN_SUBJECTS = [
  { key: 'dbms', patterns: ['dbms', 'database management', 'database', 'databases', 'sql'], id: 6, code: 'CS502', name: 'Database Management Systems' },
  { key: 'cn', patterns: ['cn', 'computer networks', 'networking', 'networks', 'network'], id: 5, code: 'CS501', name: 'Computer Networks' },
  { key: 'ds', patterns: ['ds', 'data structures', 'data structure', 'dsa'], id: 12, code: 'CS301', name: 'Data Structures and Applications' },
  { key: 'ml', patterns: ['ml', 'machine learning', 'deep learning', 'neural net'], id: 1, code: 'CS601', name: 'Machine Learning' },
  { key: 'cloud', patterns: ['cloud', 'cloud computing', 'devops', 'aws'], id: 2, code: 'CS602', name: 'Cloud Computing & DevOps' },
  { key: 'web', patterns: ['web', 'web tech', 'web technologies', 'fullstack'], id: 3, code: 'CS603', name: 'Web Technologies & Frameworks' },
  { key: 'security', patterns: ['security', 'information security', 'cybersecurity', 'crypto'], id: 4, code: 'CS604', name: 'Information & Network Security' },
  { key: 'os', patterns: ['os', 'operating systems', 'operating system', 'linux kernel'], id: 10, code: 'CS402', name: 'Operating Systems' },
  { key: 'daa', patterns: ['daa', 'algorithms', 'design and analysis of algorithms'], id: 9, code: 'CS401', name: 'Design & Analysis of Algorithms' },
  { key: 'toc', patterns: ['toc', 'theory of computation', 'automata'], id: 8, code: 'CS504', name: 'Theory of Computation' },
  { key: 'se', patterns: ['se', 'software engineering', 'agile'], id: 7, code: 'CS503', name: 'Software Engineering & Agile' },
  { key: 'java', patterns: ['java', 'oop', 'object oriented'], id: 13, code: 'CS302', name: 'Object Oriented Programming with Java' },
  { key: 'dsp', patterns: ['dsp', 'digital signal processing'], id: 19, code: 'EC501', name: 'Digital Signal Processing' },
  { key: 'vlsi', patterns: ['vlsi', 'vlsi design'], id: 17, code: 'EC601', name: 'VLSI Design & Embedded Systems' },
  { key: 'bigdata', patterns: ['big data', 'analytics', 'hadoop'], id: 14, code: 'IS601', name: 'Big Data Analytics' },
  { key: 'thermo', patterns: ['thermo', 'thermodynamics'], id: 22, code: 'ME501', name: 'Thermodynamics & IC Engines' }
];

function extractSubject(text) {
  const lower = text.toLowerCase();
  for (const s of KNOWN_SUBJECTS) {
    for (const pat of s.patterns) {
      const regex = new RegExp(`\\b${pat}\\b`, 'i');
      if (regex.test(lower)) {
        return s;
      }
    }
  }
  return null;
}

function extractSemester(text) {
  const match = text.match(/\b(sem(?:ester)?\s*([1-8])|([1-8])(?:st|nd|rd|th)?\s*sem(?:ester)?)\b/i);
  if (match) {
    return parseInt(match[2] || match[3], 10);
  }
  if (/\b(last|previous)\s+sem(?:ester)?\b/i.test(text)) {
    return 'PREVIOUS';
  }
  if (/\b(current|this)\s+sem(?:ester)?\b/i.test(text)) {
    return 'CURRENT';
  }
  return null;
}

function extractClassesToAttend(text) {
  const match = text.match(/\b(?:attend|next)\s+(\d+)\s+classes\b/i) || text.match(/\b(\d+)\s+classes\b/i);
  return match ? parseInt(match[1], 10) : 10;
}

function classifyIntent(text, conversationContext = {}, userRole = 'student') {
  const lower = text.toLowerCase().trim();

  // 1. Contextual follow-ups based on history
  const lastIntent = conversationContext.lastIntent || null;
  const lastSubject = conversationContext.lastSubject || null;
  const lastTopic = conversationContext.lastTopic || null;

  // Short follow-up phrases
  if (/^(explain it simply|explain simply|simplify it|make it simpler|in simple words|eli5)$/i.test(lower)) {
    return {
      intent: 'GENERAL_AI_SIMPLIFY',
      category: 'GENERAL_AI',
      contextTopic: lastTopic || 'previous topic'
    };
  }

  if (/^(give me an example|example please|code example|show example)$/i.test(lower)) {
    return {
      intent: 'GENERAL_AI_EXAMPLE',
      category: 'GENERAL_AI',
      contextTopic: lastTopic || 'previous topic'
    };
  }

  if (/^why did it decrease\??$/i.test(lower) || /why did (my marks|it) drop\??/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_WHY_DECREASE',
      category: 'PERSONAL_STUDENT'
    };
  }

  if (/^(what about last semester|what about previous semester|and last sem\??)$/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_PREVIOUS_SEMESTER',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Contextual follow-up: Which subject is lowest?
  if (/which (?:subject )?is (?:the )?(lowest|worst|least)|lowest subject|lowest attendance/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_ATTENDANCE_LOWEST',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Contextual follow-up: How can I improve it?
  if (/how (?:can i|to) improve (it|this|attendance|my attendance)|how (?:can i|to) improve\??|what should i do to improve/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_ATTENDANCE_ADVICE',
      category: 'PERSONAL_STUDENT'
    };
  }

  if (/who teaches (it|this|that subject)\??/i.test(lower) && lastSubject) {
    return {
      intent: 'UNIVERSITY_FACULTY_LOOKUP',
      category: 'UNIVERSITY_GENERAL',
      subject: lastSubject
    };
  }

  // 2. Multilingual & Personal Student Queries
  const isMultilingual = /\b(nan|nanna|eshtu|ide|mera|meri|kitna|hai|mujhe|apna)\b/i.test(lower);
  const isPersonalQuery = /\b(my|i|am i|me|mine|nan|nanna|mera|meri|mujhe|apna)\b/i.test(lower) || isMultilingual;

  // Student Profile
  if (isPersonalQuery && /show (?:my )?profile|my details|who am i|student profile/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_PROFILE',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Semester Comparison ("Compare my current semester with the previous semester", "Compare my results between semesters")
  if (isPersonalQuery && (/compare.*semester/i.test(lower) || /semester comparison/i.test(lower) || /compare.*results/i.test(lower))) {
    return {
      intent: 'PERSONAL_STUDENT_COMPARE_SEMESTERS',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Which semester am I in?
  if (isPersonalQuery && (/which semester (?:am i in|i am in)/i.test(lower) || /what semester am i in/i.test(lower) || /^(?:what is )?my current semester\??$/i.test(lower.trim()))) {
    return {
      intent: 'PERSONAL_STUDENT_SEMESTER',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Show my subjects
  if (isPersonalQuery && /show (?:my )?subjects|my enrolled subjects|what are my subjects|which subjects do i have/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_SUBJECTS',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Attendance Predictor / What-if
  if (/if i attend.*classes|what will my attendance become|how many classes.*skip|attendance predictor|calculate attendance if/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_ATTENDANCE_PREDICT',
      category: 'PERSONAL_STUDENT',
      classesCount: extractClassesToAttend(lower),
      subject: extractSubject(lower)
    };
  }

  // Class Average Attendance ("What is the attendance percentage of my class?")
  if (/attendance percentage of my class|class attendance percentage|my class attendance|class average attendance/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_CLASS_ATTENDANCE',
      category: 'PERSONAL_STUDENT'
    };
  }

  // How many classes did I attend?
  if (isPersonalQuery && /how many classes (?:did i attend|i attended)|total classes attended by me/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_ATTENDED_COUNT',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Attendance shortage / check (Including Kannada "nan attendance eshtu ide" & Hindi "mera attendance kitna hai")
  if (isPersonalQuery && /attendance|present|absent|classes attended|bunk|eshtu ide|kitna hai/i.test(lower)) {
    if (/lowest|worst|least/i.test(lower)) {
      return {
        intent: 'PERSONAL_STUDENT_ATTENDANCE_LOWEST',
        category: 'PERSONAL_STUDENT',
        isMultilingual
      };
    }
    if (/how can i improve|how to improve|what should i do/i.test(lower)) {
      return {
        intent: 'PERSONAL_STUDENT_ATTENDANCE_ADVICE',
        category: 'MIXED',
        isMultilingual
      };
    }
    return {
      intent: 'PERSONAL_STUDENT_ATTENDANCE',
      category: 'PERSONAL_STUDENT',
      subject: extractSubject(lower),
      isMultilingual
    };
  }

  // Passed subjects ("Which subjects did I pass?")
  if (isPersonalQuery && /which subjects? (?:did i pass|passed)|subjects? passed|passed subjects?/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_PASSED_SUBJECTS',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Failed subjects ("Which subjects did I fail?")
  if (isPersonalQuery && /which subjects? (?:did i fail|failed)|subjects? failed|failed subjects?|did i fail any/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_FAILED_SUBJECTS',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Highest mark ("What is my highest mark?")
  if (isPersonalQuery && /highest mark|my highest mark|top mark|best subject score/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_HIGHEST_MARK',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Lowest mark ("What is my lowest mark?")
  if (isPersonalQuery && /lowest mark|my lowest mark|worst mark|lowest score/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_LOWEST_MARK',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Specific Subject Grade / Marks ("What is my grade in DBMS?", "What is my Python subject mark?")
  if (isPersonalQuery && (/(?:what is|show) my (?:grade|marks?|score|result) in/i.test(lower) || /what is my .* subject mark/i.test(lower))) {
    const sub = extractSubject(lower);
    return {
      intent: 'PERSONAL_STUDENT_SUBJECT_GRADE',
      category: 'PERSONAL_STUDENT',
      subject: sub,
      rawSubject: sub ? sub.name : lower.replace(/.*(?:in|my)\s+/i, '').replace(/subject|mark|grade/g, '').trim()
    };
  }

  // What is my SGPA?
  if (isPersonalQuery && /sgpa\b/i.test(lower) && !/cgpa/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_SGPA',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Exam Eligibility
  if (isPersonalQuery && /eligible|eligibility|admit card|hall ticket|allowed to write|can i write exams?/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_ELIGIBILITY',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Focus & Weak Subjects
  if (isPersonalQuery && /which subject should i focus|weak(est)? subject|where should i improve|my weakness|study advice/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_WEAKNESS',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Semester Comparison
  if (isPersonalQuery && /compare.*semester|compare my (?:current.*previous|results between semesters)|semester comparison|improvement/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_COMPARE_SEMESTERS',
      category: 'PERSONAL_STUDENT'
    };
  }

  // General "How am I doing?" / "Analyze my performance"
  if (isPersonalQuery && /how am i doing|academic performance summary|analyze my (academic )?performance|how is my performance|my progress/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_SUMMARY',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Personal Academic Report Card
  if (isPersonalQuery && /report card|academic report|my report|summarize my academic profile/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_REPORT_CARD',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Class Subject Results ("Show Python results for my class", "Show DBMS results for my class")
  if (/results for (?:my )?class/i.test(lower)) {
    const sub = extractSubject(lower);
    return {
      intent: 'UNIVERSITY_CLASS_SUBJECT_RESULTS',
      category: 'ANALYTICS',
      subject: sub,
      rawSubject: sub ? sub.name : lower.replace(/.*show\s+/i, '').replace(/results.*/i, '').trim()
    };
  }

  // Personal Marks / Results / CGPA
  if (isPersonalQuery && /marks|grade|cgpa|score|results?|backlog/i.test(lower)) {
    const sem = extractSemester(lower);
    const sub = extractSubject(lower);
    return {
      intent: 'PERSONAL_STUDENT_MARKS',
      category: 'PERSONAL_STUDENT',
      semester: sem,
      subject: sub,
      isMultilingual
    };
  }

  // Personal Risk analysis
  if (isPersonalQuery && /risk|am i at risk|danger|probation|academic risk/i.test(lower)) {
    return {
      intent: 'PERSONAL_STUDENT_RISK',
      category: 'PERSONAL_STUDENT'
    };
  }

  // Explain my data like beginner / ELI5
  if (/explain my (performance|data|marks|profile) like (a beginner|i'm a beginner|i am 5|simple)/i.test(lower)) {
    return {
      intent: 'EXPLAIN_MY_DATA_ELI5',
      category: 'PERSONAL_STUDENT'
    };
  }

  // 3. University-wide Database Queries (NL to SQL)
  // Who is the HOD of CSE / ECE / ISE / ME?
  if (/who is (?:the )?hod of|hod of (cse|ise|ece|me)/i.test(lower)) {
    const deptMatch = lower.match(/hod of\s+([a-z]+)/i);
    const deptCode = deptMatch ? deptMatch[1].toUpperCase() : 'CSE';
    return {
      intent: 'UNIVERSITY_HOD_LOOKUP',
      category: 'UNIVERSITY_GENERAL',
      deptCode
    };
  }

  // Show CSE faculty / Show faculty from ECE
  if (/show (cse|ise|ece|me) faculty|show faculty (?:from|of) (?:the )?(cse|ise|ece|me)|faculty in (cse|ise|ece|me)/i.test(lower)) {
    const deptMatch = lower.match(/(?:show|from|in)\s+(?:the\s+)?([a-z]{2,4})\s+faculty|faculty (?:from|of|in) (?:the )?([a-z]{2,4})/i);
    const deptCode = (deptMatch ? (deptMatch[1] || deptMatch[2]) : 'CSE').toUpperCase();
    return {
      intent: 'UNIVERSITY_FACULTY_BY_DEPT',
      category: 'UNIVERSITY_GENERAL',
      deptCode
    };
  }

  // What subjects are available?
  if (/what subjects are available|show (?:all )?available subjects|list available subjects/i.test(lower)) {
    return {
      intent: 'UNIVERSITY_AVAILABLE_SUBJECTS',
      category: 'UNIVERSITY_GENERAL'
    };
  }

  // How many students are in CSE?
  if (/how many students (?:are in|in) (cse|ise|ece|me)/i.test(lower)) {
    const deptMatch = lower.match(/in\s+([a-z]{2,4})/i);
    const deptCode = deptMatch ? deptMatch[1].toUpperCase() : 'CSE';
    return {
      intent: 'UNIVERSITY_DEPT_STUDENT_COUNT',
      category: 'ANALYTICS',
      deptCode
    };
  }

  // Show faculty information (directory)
  if (/show faculty information|show faculty\b|faculty directory/i.test(lower)) {
    return {
      intent: 'UNIVERSITY_FACULTY_DIRECTORY',
      category: 'UNIVERSITY_GENERAL'
    };
  }

  // Show department information
  if (/show department information|department details|show departments|list departments/i.test(lower)) {
    return {
      intent: 'UNIVERSITY_DEPARTMENT_INFO',
      category: 'UNIVERSITY_GENERAL'
    };
  }

  // Pass vs Fail Statistics ("Show pass/fail statistics", "Show pass and fail students")
  if (/pass\s*(?:vs|\/|and)\s*fail|pass.*statistics|pass percentage of university|failure statistics/i.test(lower)) {
    return {
      intent: 'UNIVERSITY_PASS_FAIL_STATS',
      category: 'ANALYTICS'
    };
  }

  // Class Subject Results ("Show Python results for my class", "Show DBMS results for my class")
  if (/results for (?:my )?class/i.test(lower)) {
    const sub = extractSubject(lower);
    return {
      intent: 'UNIVERSITY_CLASS_SUBJECT_RESULTS',
      category: 'ANALYTICS',
      subject: sub,
      rawSubject: sub ? sub.name : lower.replace(/.*show\s+/i, '').replace(/results.*/i, '').trim()
    };
  }

  // Highest Scorer in a subject
  if (/who (?:scored|got) the highest|highest marks? in|topper in|top scorer in/i.test(lower)) {
    const sub = extractSubject(lower);
    return {
      intent: 'UNIVERSITY_HIGHEST_SCORER',
      category: 'ANALYTICS',
      subject: sub,
      rawSubject: sub ? sub.name : lower.replace(/.*highest (?:marks? in|scorer in)?\s*/i, '').trim()
    };
  }

  // Failed students in subject
  if (/how many students failed|who failed in|failed.*students?|failure count in/i.test(lower)) {
    const sub = extractSubject(lower);
    return {
      intent: 'UNIVERSITY_FAILED_STUDENTS',
      category: 'ANALYTICS',
      subject: sub
    };
  }

  // Department comparison / pass percentage
  if (/which department (?:performed best|has the highest pass|is best)|department pass percentage|compare departments/i.test(lower)) {
    return {
      intent: 'UNIVERSITY_DEPT_PERFORMANCE',
      category: 'ANALYTICS'
    };
  }

  // Students below 75% attendance & Attendance Statistics
  if (/which students are below 75|students below 75|below 75% attendance|show attendance statistics|attendance statistics\b|attendance shortage list|who has attendance below 75|show low attendance/i.test(lower)) {
    return {
      intent: 'UNIVERSITY_LOW_ATTENDANCE_LIST',
      category: 'ANALYTICS'
    };
  }

  // Top 10 students
  if (/top 10 students|top-?performing students|rank 1 to 10|university toppers/i.test(lower)) {
    return {
      intent: 'UNIVERSITY_TOP_STUDENTS',
      category: 'ANALYTICS'
    };
  }

  // Faculty Lookup ("Who teaches Operating Systems?", "Who teaches DBMS?", "Who is Dr. XYZ?")
  if (/who teaches|faculty (?:for|of)|teacher for|professor for|cabin of|office of|contact.*faculty|who is dr\b|who is prof\b/i.test(lower)) {
    const sub = extractSubject(lower);
    return {
      intent: 'UNIVERSITY_FACULTY_LOOKUP',
      category: 'UNIVERSITY_GENERAL',
      subject: sub,
      keyword: sub ? sub.name : lower.replace(/.*(teaches|who is|faculty for)\s*/i, '').trim()
    };
  }

  // University Attendance / Pass Rules
  if (/attendance rule|minimum attendance required|condonation rule|passing marks rule|exam rules/i.test(lower)) {
    return {
      intent: 'UNIVERSITY_RULES',
      category: 'UNIVERSITY_GENERAL'
    };
  }

  // Admin University Report / Overview / Statistics
  if (/how many students are enrolled|university academic report|university pass percentage|show university statistics|overall statistics|admin dashboard stats/i.test(lower)) {
    return {
      intent: 'ADMIN_UNIVERSITY_REPORT',
      category: 'ADMIN_ANALYTICS'
    };
  }

  // Subject failure rates
  if (/highest failure rate|subject failure rates|hardest subject|most failed subject/i.test(lower)) {
    return {
      intent: 'UNIVERSITY_FAILURE_RATES',
      category: 'ANALYTICS'
    };
  }

  // 4. General AI queries (Weather, Calculations, Knowledge, Programming, Writing)
  // Weather
  if (/what is the weather|weather today|current weather|weather forecast/i.test(lower)) {
    return {
      intent: 'GENERAL_AI_WEATHER',
      category: 'GENERAL_AI'
    };
  }

  // Math & Calculations ("Calculate 25 × 45", "Solve equation")
  if (/(?:calculate|compute|solve)?\s*\d+\s*[\+\-\*\/×÷]\s*\d+/i.test(lower) || /calculate|probability|bayes theorem|equation|derivative|integral/i.test(lower)) {
    return {
      intent: 'GENERAL_AI_MATH',
      category: 'GENERAL_AI'
    };
  }

  // General Knowledge: Capital of France
  if (/capital of france/i.test(lower)) {
    return {
      intent: 'GENERAL_AI_KNOWLEDGE',
      category: 'GENERAL_AI'
    };
  }

  // Python Explanation vs Python Program
  if (/what is python\b/i.test(lower)) {
    return {
      intent: 'GENERAL_AI_PYTHON',
      category: 'GENERAL_AI'
    };
  }

  // Explain error
  if (/explain this error|troubleshoot error|debug error|common error/i.test(lower)) {
    return {
      intent: 'GENERAL_AI_ERROR',
      category: 'GENERAL_AI'
    };
  }

  // Resume help
  if (/help me write a resume|how to write a resume|resume template/i.test(lower)) {
    return {
      intent: 'GENERAL_AI_RESUME',
      category: 'GENERAL_AI'
    };
  }

  // Professional message / Writing
  if (/create a professional message|professional message|draft a message|write (?:an? )?(email|mail)/i.test(lower)) {
    return {
      intent: 'GENERAL_AI_WRITING',
      category: 'GENERAL_AI'
    };
  }

  // Project Idea
  if (/create a project idea|suggest projects|project ideas/i.test(lower)) {
    return {
      intent: 'GENERAL_AI_PROJECTS',
      category: 'GENERAL_AI'
    };
  }

  // 4. General AI queries (Coding, Math, Writing, Science, Translation, General)
  // Translation
  if (/translate (?:this )?into (kannada|hindi|french|spanish|german)/i.test(lower)) {
    const targetLang = lower.match(/into\s+([a-z]+)/i)[1];
    return {
      intent: 'GENERAL_AI_TRANSLATION',
      category: 'GENERAL_AI',
      targetLang
    };
  }

  // Professional Writing
  if (/write (?:an? )?(email|mail) to (?:my )?professor|create a project abstract|write a resume summary|draft a letter/i.test(lower)) {
    return {
      intent: 'GENERAL_AI_WRITING',
      category: 'GENERAL_AI'
    };
  }

  // Programming / Coding
  if (/program for|code for|implement|write a program|function to|algorithm for|fibonacci|binary search|tcp client|in (java|python|c\+\+|c|javascript|react|sql)/i.test(lower) ||
      /\b(java|python|c\+\+|javascript|sql|react)\b/i.test(lower) && /write|example|code|program/i.test(lower)) {
    return {
      intent: 'GENERAL_AI_PROGRAMMING',
      category: 'GENERAL_AI',
      subTopic: extractSubject(lower)
    };
  }

  // Mathematics
  if (/solve|calculate|probability|bayes theorem|equation|derivative|integral|eigenvalue/i.test(lower) && !isPersonalQuery) {
    return {
      intent: 'GENERAL_AI_MATH',
      category: 'GENERAL_AI'
    };
  }

  // Educational Explanations (DBMS Normalization, OS process management, TCP, etc.)
  if (/explain (normalization|dbms normalization|process management|operating system|tcp|tcp 3-way|osi model|artificial intelligence|machine learning|binary tree)/i.test(lower)) {
    return {
      intent: 'GENERAL_AI_EXPLANATION',
      category: 'GENERAL_AI',
      tenMarks: /10 marks|detailed|in-depth/i.test(lower)
    };
  }

  // Greetings
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup|howdy)\b/i.test(lower)) {
    return {
      intent: 'GENERAL_AI_GREETING',
      category: 'GENERAL_AI'
    };
  }

  // Default fallback: General AI
  return {
    intent: 'GENERAL_AI_DEFAULT',
    category: 'GENERAL_AI'
  };
}

module.exports = {
  classifyIntent,
  extractSubject,
  extractSemester,
  KNOWN_SUBJECTS
};
