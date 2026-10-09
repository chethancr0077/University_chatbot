# 🎓 UniMate AI — Universal Campus Assistant & Academic Intelligence

> **“Ask anything. Get intelligent answers. Your university data, academic insights, and AI assistance — all in one conversation.”**

UniMate AI is a production-grade, AI-powered conversational university intelligence platform built for the **PromptWars Hackathon**. It bridges general-purpose artificial intelligence with enterprise university relational databases, empowering students, faculty, and administrators to interact with academic data entirely through natural language without touching SQL or navigating disjointed student portals.

---

## 🌟 Key Architecture & Highlights

```
                                  [ User Browser ]
                                         │
                         (REST API / JWT Session Auth)
                                         │
                                         ▼
                             [ Express.js Server ]
                                         │
               ┌─────────────────────────┴────────────────────────┐
               ▼                                                  ▼
     [ Privacy Guard & RBAC ]                        [ Master AI Engine ]
     (Student data isolation)                        (Intent & Query Parser)
               │                                                  │
               ▼                                                  ▼
   [ SQLite Relational DB ]                             [ Decision Router ]
   (54 Students, 11 Faculty,                 ┌────────────────────┼────────────────────┐
    4 Depts, Results & Attendance)           ▼                    ▼                    ▼
                                       [ University RAG ]   [ Academic Advisor ]  [ Universal AI ]
                                       - Grounded Queries   - Risk Classifier    - Coding (Java/Python/SQL)
                                       - Zero Hallucination - What-If Predictor  - Math & CS Theory
                                       - Dynamic Chart Data - Recommendations    - Writing & Translations
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (Tested on Node v24)
- **NPM**: v9+

### 2. Setup & Installation
```bash
# Clone or navigate to the project directory
cd Bank_management_system

# Install dependencies (already installed if pre-configured)
npm install

# Seed the database with 54 students, 11 faculty, results, and rules
npm run seed

# Start the application server
npm start
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 🔑 Demo Accounts (Instant 1-Click Access)

Use the 1-Click Demo Switcher in the top bar or sign in manually with these pre-seeded accounts:

| Role | Email | Password | Details & Context |
| :--- | :--- | :--- | :--- |
| **🎓 Student** | `student@unimate.ai` | `password123` | **Aarav Sharma** (USN: `1MS21CS001`), Sem 6 CSE. CGPA: 8.42, SGPA: 8.65. Overall Attendance: 82.5%. |
| **👨‍🏫 Faculty** | `faculty@unimate.ai` | `password123` | **Dr. Rajesh Kumar** (HOD & Professor, CSE). Teaches Computer Networks & DBMS. |
| **🏛️ Admin** | `admin@unimate.ai` | `password123` | **University Registrar / Dean of Academics**. Full university-wide oversight. |

---

## 🧠 Core Capabilities & Features

### 1. Universal AI Chatbot
- **Computer Science & Coding**: Python, Java, C++, JavaScript, React, SQL.
- **Academic Theory**: Operating Systems Process Management, Computer Networks (OSI 7 Layers, TCP/IP, TCP 3-Way Handshake), DBMS Normalization (1NF, 2NF, 3NF, BCNF for 10 marks).
- **Mathematics**: Probability, Bayes' Theorem, Calculus, Linear Algebra, Equation solvers.
- **Professional Writing**: Email to professor, project abstracts, resume summaries.
- **Multilingual Translation**: English to Kannada and Hindi.
- **Context Awareness**: Multi-turn resolution of *"it"*, *"that subject"*, *"last semester"*, and *"why did it decrease?"*.

### 2. Grounded University Mode & Natural Language DB Querying
- Safe internal translation of natural language questions into database queries.
- **Strict Grounding Rule**: Never invents or hallucinates marks, attendance, faculty, or CGPA. If not in the database, responds: *"I couldn't find that information in the university database."*
- Examples:
  - *"What is my attendance?"* → Retrieves authenticated student's breakdown.
  - *"Who scored the highest in DBMS?"* → Returns Sneha Patel (98/100).
  - *"How many students failed Computer Networks?"* → Identifies failed candidates with scores.
  - *"Which department has the highest pass percentage?"* → Ranks departments with pass rates.
  - *"Show students below 75% attendance"* → Lists flagged students.
  - *"Who teaches Data Structures?"* → Returns faculty profile, cabin, and office hours.

### 3. Personal Student Assistant & Academic Advisor
- **Comprehensive Performance Summary**: CGPA, SGPA progression, credit count, examination eligibility.
- **Strengths & Weaknesses Identification**: Pinpoints strongest and weakest subjects with custom study recommendations.
- **Semester Comparison**: Comparative table contrasting current vs previous semester SGPA and variance.

### 4. AI Student Risk Analysis
- Automatically audits:
  - Low attendance (<75% warning, <65% critical detention)
  - Active backlogs & failed subjects
  - Steep SGPA drops (≥ 0.5 to 1.5 points)
- Classifies students:
  - 🟢 **Low Risk**: Consistent performance & safe attendance.
  - 🟡 **Medium Risk**: Borderline attendance (65–74%) or minor SGPA drop.
  - 🔴 **High Risk**: Multiple backlogs, critical attendance (<65%), probation.

### 5. Dynamic In-Chat Data Visualizations (Chart.js)
Whenever responses include numerical comparisons or distributions, UniMate AI dynamically embeds interactive charts into the chat bubble:
- **Bar Charts**: Subject attendance breakdown, department pass percentages, top scorers.
- **Line Charts**: Semester SGPA trajectories.
- **Doughnut / Pie Charts**: Attendance compliance, risk distributions.

### 6. Role-Based Access Control (RBAC) & Privacy Guard
- **Student Privacy Enforcement**: Students can only access their own private marks and attendance.
  - If a student asks *"Show Rahul's marks"*, UniMate AI refuses: *"🔒 I can only provide academic information that you are authorized to access."*
- **Faculty Oversight**: Authorized access to assigned course sections and student attendance records.
- **Admin Oversight**: University-level aggregate metrics and institutional audits.

---

## 🏆 Hackathon Wow Factor Tools

1. **🔮 AI Attendance What-If Predictor**:
   - Interactive calculator: *"If I attend the next 10 classes, what will my attendance become?"*
   - Computes projected percentage, improvement delta, and safe skip buffer.
2. **📜 Official Academic Transcript Generator**:
   - Produces an official university transcript with printable/PDF styling, course grades, CGPA, and institutional stamp.
3. **💡 Automated AI Insights Panel**:
   - Discovers patterns across campus: department benchmarks, curriculum failure bottlenecks, and toppers.
4. **🎙️ Multi-Modal Voice Assistant**:
   - Speech-to-Text via Web Speech API with pulsing visual feedback.
   - Text-to-Speech (TTS) response playback.
5. **🌓 Dark & Light Theme**:
   - Glassmorphism design system with persistence.

---

## 🧪 Example Test Prompts for Evaluation

Try these queries sequentially in the chat to see seamless mode switching:

```text
1. "Hi"
2. "What is my attendance?"
3. "Which subject is lowest?"
4. "How can I improve it?"
5. "If I attend the next 10 classes, what will my attendance become?"
6. "Who teaches it?"
7. "Explain TCP"
8. "Give me a Java program for TCP client"
9. "Who scored the highest in DBMS?"
10. "Explain DBMS normalization for 10 marks"
11. "Am I eligible for exams?"
12. "Compare my current semester with the previous semester"
```

---

## 📁 Repository Structure

```
├── database/
│   ├── unimate.db          # SQLite relational database
│   ├── schema.sql          # SQL table schema definitions
│   ├── seed.js             # 54 students, 11 faculty, results, attendance seeder
│   └── db.js               # Promisified database client
├── server/
│   ├── ai/
│   │   ├── aiEngine.js         # Master RAG & universal reasoning orchestrator
│   │   ├── intentClassifier.js # NLP intent & parameter extraction
│   │   ├── queryExecutor.js    # Parameterized SQL query executor
│   │   ├── academicAdvisor.js  # Risk engine & what-if simulator
│   │   ├── generalKnowledge.js # Educational & coding knowledge base
│   │   └── externalLlm.js      # Gemini/OpenAI API fallback connector
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication & session verification
│   │   └── privacyGuard.js     # RBAC & student data isolation
│   └── routes/
│       ├── auth.js             # Login, session, and 1-click demo switcher
│       ├── chat.js             # Conversational stream & message history
│       ├── student.js          # Student metrics, results, attendance
│       ├── faculty.js          # Faculty class monitoring & shortages
│       ├── admin.js            # Executive university analytics
│       └── analytics.js        # AI Insights hub & department rankings
├── public/
│   ├── index.html          # Modern responsive ChatGPT-style UI
│   ├── css/styles.css      # Glassmorphism styling, markdown, theme vars
│   └── js/
│       ├── app.js          # Role switcher, theme, initialization
│       ├── chat.js         # Chat stream, Chart.js widgets, copy code
│       ├── dashboard.js    # Interactive Student/Faculty/Admin dashboards
│       ├── tools.js        # Modals, transcript generator, simulator
│       └── voice.js        # Web Speech API STT and TTS
├── server.js               # Express application entry point
├── package.json
└── README.md
```
