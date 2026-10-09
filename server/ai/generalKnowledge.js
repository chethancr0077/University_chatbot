/**
 * UniMate AI General Knowledge & Educational Engine
 * Provides grounded, rich, high-quality responses for non-university and educational topics.
 */

const KNOWLEDGE_BASE = {
  ai: {
    standard: `### 🤖 Artificial Intelligence (AI)

**Artificial Intelligence** refers to the simulation of human intelligence in computer systems designed to think, learn, reason, and solve problems autonomously.

#### 1. Core Pillars of AI:
- **Machine Learning (ML)**: Algorithms that learn patterns from empirical data rather than relying solely on hardcoded rules (e.g., Random Forests, Gradient Boosting).
- **Deep Learning (DL)**: Multi-layered artificial neural networks modeled loosely after the human brain (e.g., CNNs for computer vision, Transformers for LLMs).
- **Natural Language Processing (NLP)**: Enabling computers to understand, interpret, and generate human languages.
- **Computer Vision**: Acquiring, processing, and analyzing digital images and video feeds.

#### 2. Key Applications:
- **Autonomous Vehicles**: Real-time object detection and path planning.
- **Healthcare**: Early diagnostic cancer detection through medical imaging.
- **Conversational Agents**: Large Language Models like UniMate AI and ChatGPT.`,
    simple: `### 💡 Artificial Intelligence (Explained Simply)

Imagine teaching a child to recognize a dog. Instead of writing down 10,000 rules like *"has fur, 4 legs, barking noise"*, you simply show them 100 pictures of dogs. Eventually, the child's brain learns what makes a dog a dog.

**Artificial Intelligence works the same way:**
Instead of a human programmer writing instructions for every single possibility, we feed the computer millions of examples. The computer finds the hidden patterns itself so it can make smart decisions when it sees new things!`,
    example: `### 🚗 Real-World Example of AI

Consider **Netflix or Spotify recommendations**:
1. When you watch sci-fi thrillers like *Inception* or *Interstellar*, the AI maps your preferences against millions of other users.
2. It discovers: *"Users who enjoyed Inception also rated Oppenheimer 9/10"*.
3. Without any human curator manually picking movies for you, the algorithm recommends *Oppenheimer* automatically at the top of your feed.`
  },

  tcp: {
    standard: `### 🌐 Transmission Control Protocol (TCP)

**TCP (Transmission Control Protocol)** is a fundamental core protocol of the Internet Protocol suite operating at the **Transport Layer (Layer 4)**. It provides reliable, ordered, and error-checked delivery of a stream of octets between computers running on an IP network.

#### 1. Key Characteristics:
- **Connection-Oriented**: A dedicated logical connection is established before any application data is transmitted.
- **Reliable Delivery**: Uses positive acknowledgments (ACK), sequence numbers, and retransmission timers.
- **Flow Control**: Uses a sliding window mechanism to ensure the sender does not overwhelm the receiver.
- **Congestion Control**: Implements Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery.

#### 2. The 3-Way Handshake (Connection Establishment):
\`\`\`text
Client                                  Server
  |                                        |
  | -------- 1. SYN (seq = x) -----------> |  (Client initiates connection)
  |                                        |
  | <------- 2. SYN-ACK (ack=x+1,seq=y) -- |  (Server acknowledges & syncs)
  |                                        |
  | -------- 3. ACK (ack = y+1) ---------> |  (Client acknowledges; ESTABLISHED)
\`\`\``,
    clientJava: `### ☕ Java TCP Client Program

Here is a robust, production-ready implementation of a TCP Client in Java that connects to a server, transmits a message, and reads the reply:

\`\`\`java
import java.io.*;
import java.net.*;

public class TCPClient {
    public static void main(String[] args) {
        String serverHost = "localhost";
        int serverPort = 8080;

        System.out.println("Connecting to TCP Server on " + serverHost + ":" + serverPort + "...");

        try (Socket socket = new Socket(serverHost, serverPort)) {
            // Output stream to write data to server
            OutputStream output = socket.getOutputStream();
            PrintWriter writer = new PrintWriter(output, true);

            // Input stream to read response from server
            InputStream input = socket.getInputStream();
            BufferedReader reader = new BufferedReader(new InputStreamReader(input));

            // Send message to server
            String messageToSend = "Hello from UniMate TCP Client!";
            writer.println(messageToSend);
            System.out.println("Sent: " + messageToSend);

            // Read response
            String response = reader.readLine();
            System.out.println("Server Response: " + response);

        } catch (UnknownHostException ex) {
            System.err.println("Server not found: " + ex.getMessage());
        } catch (IOException ex) {
            System.err.println("I/O error: " + ex.getMessage());
        }
    }
}
\`\`\`

#### How to run:
1. Compile: \`javac TCPClient.java\`
2. Run: \`java TCPClient\``
  },

  dbmsNormalization: `### 📚 DBMS Normalization (Complete 10-Mark University Answer)

#### 1. Definition & Need
**Normalization** is the systematic approach of decomposing tables to eliminate data redundancy (repetition) and prevent **insertion, deletion, and update anomalies**.

---

#### 2. Normal Forms Detailed:

##### A. First Normal Form (1NF)
- **Rule**: Each column must contain atomic (indivisible) values. No repeating groups or multi-valued attributes.
- **Example Violation**: \`Student(ID, Name, Subjects)\` where Subjects = *"DBMS, CN, OS"*.
- **Fix**: Split into separate individual rows: \`(101, Aarav, DBMS)\`, \`(101, Aarav, CN)\`.

##### B. Second Normal Form (2NF)
- **Rule**: Must be in **1NF** AND have **NO Partial Dependency** (i.e., every non-prime attribute must depend on the whole candidate key, not just a part of a composite key).
- **Applies when**: The primary key is composite (e.g., \`StudentID + CourseID\`).
- **Fix**: Decompose into \`StudentCourses(StudentID, CourseID)\` and \`Courses(CourseID, CourseFee)\`.

##### C. Third Normal Form (3NF)
- **Rule**: Must be in **2NF** AND have **NO Transitive Dependency** (i.e., if $X \\to Y$ and $Y \\to Z$, then a non-prime attribute $Z$ must not depend on non-prime attribute $Y$).
- **Formal condition**: For every non-trivial functional dependency $X \\to Y$, either:
  1. $X$ is a Super Key, OR
  2. $Y$ is a Prime Attribute.

##### D. Boyce-Codd Normal Form (BCNF / 3.5NF)
- **Rule**: A stricter version of 3NF. For every non-trivial functional dependency $X \\to Y$, **$X$ MUST be a Super Key**.

---

#### Summary Table for Exams:
| Normal Form | Eliminates | Primary Requirement |
| :--- | :--- | :--- |
| **1NF** | Multi-valued attributes | Atomic domain values only |
| **2NF** | Partial Dependency | Fully functionally dependent on PK |
| **3NF** | Transitive Dependency | $X$ is Super Key OR $Y$ is prime attribute |
| **BCNF** | Overlapping Candidate Keys | $X$ must always be a Super Key |`,

  osProcessManagement: `### 💻 Operating System: Process Management

#### 1. What is a Process?
A **Process** is a program in execution. It includes the program code (text section), current activity (program counter, processor registers), stack (temporary data like function parameters), and heap (dynamically allocated memory).

#### 2. Process States & Life Cycle:
1. **New**: The process is being created.
2. **Ready**: The process is waiting to be assigned to a CPU core.
3. **Running**: Instructions are actively executing on the CPU.
4. **Waiting (Blocked)**: The process is waiting for an I/O event or signal.
5. **Terminated**: The process has finished execution.

#### 3. Process Control Block (PCB):
The OS maintains a PCB for each process storing:
- Process ID (PID)
- Process State
- Program Counter (PC)
- CPU Registers & Scheduling Info
- Memory-Management Info (Page tables, base/limit registers)

#### 4. CPU Scheduling Algorithms:
- **FCFS (First-Come, First-Served)**: Non-preemptive; prone to convoy effect.
- **SJF (Shortest Job First)**: Optimal average waiting time; requires burst time prediction.
- **Round Robin (RR)**: Preemptive; uses a fixed time slice / quantum. Essential for time-sharing systems.
- **Priority Scheduling**: Processes executed based on assigned priority.`
};

function getGeneralAnswer(lowerText, intentObj = {}) {
  // 1. Follow-up "Explain it simply"
  if (intentObj.intent === 'GENERAL_AI_SIMPLIFY') {
    return {
      content: KNOWLEDGE_BASE.ai.simple,
      mode: 'GENERAL',
      suggested: ['Give me an example', 'How is AI used in robotics?', 'Explain Machine Learning simply']
    };
  }

  // 2. Follow-up "Give me an example"
  if (intentObj.intent === 'GENERAL_AI_EXAMPLE') {
    return {
      content: KNOWLEDGE_BASE.ai.example,
      mode: 'GENERAL',
      suggested: ['What is the difference between AI and ML?', 'Give me a simple Python AI example']
    };
  }

  // 3. AI Explanation
  if (/artificial intelligence|what is ai\b/i.test(lowerText)) {
    return {
      content: KNOWLEDGE_BASE.ai.standard,
      mode: 'GENERAL',
      suggested: ['Explain it simply', 'Give me an example', 'What is the difference between AI and ML?']
    };
  }

  // 4. TCP Explanation
  if (/explain tcp|tcp protocol|transmission control protocol|tcp 3-way/i.test(lowerText)) {
    return {
      content: KNOWLEDGE_BASE.tcp.standard,
      mode: 'GENERAL',
      suggested: ['Give me a Java program for TCP client', 'Explain UDP vs TCP', 'What is flow control in TCP?']
    };
  }

  // 5. TCP Client Java Program
  if (/tcp client|java.*tcp/i.test(lowerText)) {
    return {
      content: KNOWLEDGE_BASE.tcp.clientJava,
      mode: 'GENERAL',
      suggested: ['Give me a TCP Server in Java', 'Explain TCP 3-way handshake', 'How does TCP handle packet loss?']
    };
  }

  // 6. Java Fibonacci Program
  if (/fibonacci|simple java program for fibonacci/i.test(lowerText)) {
    return {
      content: `### ☕ Java Program for Fibonacci Series

Here is a clean Java program calculating the Fibonacci series using an iterative approach ($O(n)$ time, $O(1)$ space):

\`\`\`java
import java.util.Scanner;

public class Fibonacci {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter number of terms: ");
        int n = scanner.nextInt();

        int first = 0, second = 1;

        System.out.println("Fibonacci Series up to " + n + " terms:");
        for (int i = 1; i <= n; i++) {
            System.out.print(first + " ");
            int next = first + second;
            first = second;
            second = next;
        }
        System.out.println();
        scanner.close();
    }
}
\`\`\`

#### Complexity:
- **Time Complexity**: $\\mathcal{O}(n)$
- **Space Complexity**: $\\mathcal{O}(1)$ (Auxiliary)`,
      mode: 'GENERAL',
      suggested: ['Show recursive Fibonacci in Java', 'Fibonacci using Dynamic Programming', 'Binary search in Java']
    };
  }

  // 7. DBMS Normalization (10 marks)
  if (/normalization|dbms normalization/i.test(lowerText)) {
    return {
      content: KNOWLEDGE_BASE.dbmsNormalization,
      mode: 'GENERAL',
      suggested: ['What is BCNF vs 3NF?', 'Explain ACID properties in DBMS', 'Who scored highest in DBMS?']
    };
  }

  // 8. OS Process Management
  if (/process management|operating system process/i.test(lowerText)) {
    return {
      content: KNOWLEDGE_BASE.osProcessManagement,
      mode: 'GENERAL',
      suggested: ['Explain CPU Scheduling algorithms', 'What is a deadlock and how to prevent it?', 'Explain virtual memory']
    };
  }

  // 9. Important Computer Networks Questions
  if (/important.*computer networks questions|cn questions/i.test(lowerText)) {
    return {
      content: `### 📝 High-Yield Computer Networks Exam Questions

Here are the top exam questions frequently asked for semester examinations:

#### 10-Mark Questions:
1. **Explain the OSI 7-Layer Reference Model** with functions of each layer and protocols used.
2. **Describe TCP 3-Way Handshake** and Connection Termination with sequence diagrams.
3. **Compare Distance Vector Routing vs Link State Routing** with routing table updates.
4. **Explain IPv4 vs IPv6 Header formats** and IP subnetting with a numerical example.

#### 5-Mark Questions:
1. Differentiate between **TCP and UDP**.
2. Explain the **Leaky Bucket and Token Bucket** traffic shaping algorithms.
3. What is the role of **ARP (Address Resolution Protocol)** and **DNS**?
4. Explain **CSMA/CD protocol** and binary exponential backoff.`,
      mode: 'GENERAL',
      suggested: ['Explain TCP', 'Give me a Java program for TCP client', 'Who teaches Computer Networks?']
    };
  }

  // 10. Write an email to professor
  if (/email to (?:my )?professor|write.*email/i.test(lowerText)) {
    return {
      content: `### ✉️ Professional Email Template to Professor

**Subject**: Request for Academic Guidance / Meeting Regarding [Topic/Course Name]

Dear Professor [Professor's Last Name],

I hope this email finds you well.

I am [Your Name], currently a 6th-semester student in your [Subject Name, e.g., Computer Networks] course (USN: [Your USN]).

I am writing to politely request a brief 15-minute meeting during your upcoming office hours. I have been reviewing [specific topic or project concept, e.g., Socket Programming implementation], and I would greatly value your insights on a few technical clarifications.

I am available during your posted office hours on [Day of week, e.g., Tuesday between 2:00 PM and 3:30 PM], or at any other time convenient to your schedule.

Thank you very much for your time and continued guidance.

Warm regards,

**[Your Full Name]**  
B.Tech Computer Science & Engineering  
University Roll / USN: [Your USN]  
Email: [Your Student Email]`,
      mode: 'GENERAL',
      suggested: ['Draft a sick leave email to professor', 'Write a project abstract', 'Write a resume summary']
    };
  }

  // 11. Project Abstract
  if (/project abstract/i.test(lowerText)) {
    return {
      content: `### 📄 Engineering Project Abstract Template

**Title**: UniMate AI: Intelligent Multi-Modal Campus Assistant with Grounded Academic RAG

**Abstract**:
> Contemporary university students and faculty navigate fragmented software portals for grades, attendance tracking, and syllabus guidance, alongside separate generative AI tools for academic problem-solving. This paper introduces **UniMate AI**, a unified conversational intelligence platform that bridges general-purpose artificial intelligence with role-based enterprise university databases. Employing a grounded Natural Language to SQL semantic parser, UniMate AI safely retrieves authorized institutional records without data hallucination, enforces stringent Role-Based Access Control (RBAC), and computes real-time academic risk indices (Low, Medium, High). In parallel, an integrated pedagogical knowledge engine provides step-by-step code generation and mathematical analysis. Benchmarking demonstrates sub-second query latency and zero privacy leakage across peer student boundaries.`,
      mode: 'GENERAL',
      suggested: ['Write a resume summary for CSE student', 'Suggest projects for a computer science student']
    };
  }

  // 12. Resume Summary
  if (/resume summary/i.test(lowerText)) {
    return {
      content: `### 💼 Professional Resume Summary for Computer Science Student

> *"Motivated Computer Science & Engineering undergraduate with a strong academic foundation (CGPA 8.4+) and hands-on experience in full-stack web development, relational database design (SQL), and machine learning pipelines. Demonstrated leadership in architecting end-to-end intelligent web applications with Node.js and React. Passionate about software engineering, distributed systems, and solving complex algorithmic challenges."*`,
      mode: 'GENERAL',
      suggested: ['Suggest projects for a computer science student', 'Help me prepare for an interview']
    };
  }

  // 13. Translations (Kannada & Hindi)
  if (intentObj.intent === 'GENERAL_AI_TRANSLATION' || /translate into (kannada|hindi)/i.test(lowerText)) {
    const isKannada = /kannada/i.test(lowerText);
    if (isKannada) {
      return {
        content: `### 🌐 Kannada Translation (ಕನ್ನಡ ಅನುವಾದ)

- **English**: *"Hello! Welcome to UniMate AI. I can answer your questions and assist with your university academics."*
- **Kannada**: **"ನಮಸ್ಕಾರ! UniMate AI ಗೆ ಸ್ವಾಗತ. ನಾನು ನಿಮ್ಮ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಬಲ್ಲೆ ಮತ್ತು ನಿಮ್ಮ ವಿಶ್ವವಿದ್ಯಾಲಯದ ಶೈಕ್ಷಣಿಕ ಕಾರ್ಯಗಳಿಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ."**

- **English**: *"What is my attendance?"*
- **Kannada**: **"ನನ್ನ ಹಾಜರಾತಿ (Attendance) ಎಷ್ಟಿದೆ?"**

- **English**: *"All the best for your examinations!"*
- **Kannada**: **"ನಿಮ್ಮ ಪರೀಕ್ಷೆಗಳಿಗೆ ಶುಭ ಹಾರೈಕೆಗಳು!"**`,
        mode: 'GENERAL',
        suggested: ['Translate into Hindi', 'Explain DBMS normalization for 10 marks']
      };
    } else {
      return {
        content: `### 🌐 Hindi Translation (हिंदी अनुवाद)

- **English**: *"Hello! Welcome to UniMate AI. I can answer your questions and assist with your university academics."*
- **Hindi**: **"नमस्ते! UniMate AI में आपका स्वागत है। मैं आपके प्रश्नों के उत्तर दे सकता हूँ और आपके विश्वविद्यालय के शैक्षणिक कार्यों में सहायता कर सकता हूँ।"**

- **English**: *"What is my attendance?"*
- **Hindi**: **"मेरी उपस्थिति (Attendance) कितनी है?"**

- **English**: *"All the best for your examinations!"*
- **Hindi**: **"आपकी परीक्षाओं के लिए शुभकामनाएँ!"**`,
        mode: 'GENERAL',
        suggested: ['Translate into Kannada', 'Suggest projects for a computer science student']
      };
    }
  }

  // 14. Career Guidance: Projects ("Create a project idea")
  if (intentObj.intent === 'GENERAL_AI_PROJECTS' || /suggest projects|project ideas|create a project idea/i.test(lowerText)) {
    return {
      content: `### 💡 Top Computer Science Project Ideas (Industry-Grade)

1. **Intelligent Campus Assistant (UniMate AI)**
   - *Tech*: Node.js, Express, SQLite/PostgreSQL, Natural Language Processing, Chart.js.
   - *Highlight*: Unified general AI + grounded university DB querying with role isolation.

2. **Distributed Microservices Task Orchestrator**
   - *Tech*: Go or Java Spring Boot, Redis Pub/Sub, Docker, Kubernetes.
   - *Highlight*: High-throughput distributed scheduling with automated fault tolerance.

3. **Real-Time Collaborative Code Editor with AI Autocomplete**
   - *Tech*: React, WebSockets, CRDTs (Yjs), WebAssembly.
   - *Highlight*: Zero-conflict concurrent multi-user editing in the browser.

4. **Medical Image Classification via Deep Convolutional Networks**
   - *Tech*: Python, PyTorch, ResNet-50, Grad-CAM visualization, FastAPI.
   - *Highlight*: Explainable AI identifying radiological anomalies.`,
      mode: 'GENERAL',
      suggested: ['Help me prepare for an interview', 'How to write a resume summary']
    };
  }

  // 15. Career Guidance: Interview prep
  if (/interview/i.test(lowerText)) {
    return {
      content: `### 🎯 Tech Interview Preparation Blueprint

#### 1. Data Structures & Algorithms (DSA):
- Arrays, HashMaps, Two-Pointers, Sliding Window.
- Trees (DFS, BFS), Graphs (Dijkstra, Topological Sort), Dynamic Programming.

#### 2. Core CS Fundamentals:
- **Operating Systems**: Concurrency, Semaphores, Deadlocks, Paging.
- **DBMS**: ACID guarantees, B-Tree indexes, Normalization forms.
- **Computer Networks**: TCP vs UDP, DNS lookup resolution, HTTP/2 vs HTTP/3.

#### 3. Behavioral Questions (STAR Method):
- **S**ituation, **T**ask, **A**ction, **R**esult.
- Prepare stories about challenging technical roadblocks and team conflicts.`,
      mode: 'GENERAL',
      suggested: ['Explain operating system process management', 'Explain TCP 3-way handshake']
    };
  }

  // 16. Mathematics (Equation / Probability)
  if (/probability|solve/i.test(lowerText)) {
    return {
      content: `### 📐 Probability Explained Simply

**Probability** is the mathematical measure of the likelihood that an event will occur, represented on a continuous scale between **0** (impossible event) and **1** (certain event).

$$\\text{Probability } P(E) = \\frac{\\text{Number of favorable outcomes}}{\\text{Total number of possible outcomes}}$$

#### Key Theorems:
1. **Addition Rule**: $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$
2. **Conditional Probability**: $P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}$
3. **Bayes' Theorem**:
$$P(A \\mid B) = \\frac{P(B \\mid A) \\cdot P(A)}{P(B)}$$
*Used extensively in spam filtering, medical diagnostics, and Bayesian Machine Learning.*`,
      mode: 'GENERAL',
      suggested: ['Solve a quadratic equation', 'Explain Bayes Theorem with an example']
    };
  }

  // 17. Weather Query
  if (intentObj.intent === 'GENERAL_AI_WEATHER' || /what is the weather|weather today|current weather/i.test(lowerText)) {
    return {
      content: `### ⛅ Campus & Local Weather Report

- **Current Conditions**: Mostly Sunny & Pleasant 🌤️
- **Temperature**: **26°C** (78.8°F)
- **Humidity**: **62%**
- **Wind**: 12 km/h NE
- **Air Quality Index (AQI)**: 45 (*Good / Healthy*)
- **Forecast**: Mild temperatures throughout the day with clear skies in the evening.

*Note: For live real-time meteorological forecasts across any city globally, enter an API key in Settings.*`,
      mode: 'GENERAL',
      suggested: ['What is artificial intelligence?', 'Calculate 25 × 45', 'What is my attendance?']
    };
  }

  // 18. Arithmetic & Calculations ("Calculate 25 × 45")
  const mathCalcMatch = lowerText.match(/(?:calculate|solve|what is|compute)?\s*(\d+(?:\.\d+)?)\s*([\+\-\*\/×÷xX])\s*(\d+(?:\.\d+)?)/i);
  if (mathCalcMatch) {
    const n1 = parseFloat(mathCalcMatch[1]);
    const sym = mathCalcMatch[2];
    const n2 = parseFloat(mathCalcMatch[3]);
    let ans = 0;
    let opTitle = 'Multiplication';
    if (sym === '+') { ans = n1 + n2; opTitle = 'Addition'; }
    else if (sym === '-') { ans = n1 - n2; opTitle = 'Subtraction'; }
    else if (sym === '*' || sym === '×' || sym === 'x' || sym === 'X') { ans = n1 * n2; opTitle = 'Multiplication'; }
    else if (sym === '/' || sym === '÷') { ans = n2 !== 0 ? (n1 / n2) : 'Undefined (division by zero)'; opTitle = 'Division'; }

    return {
      content: `### 🧮 Calculation Result

$$\\mathbf{${n1} \\times ${n2} = ${ans}}$$

**Detailed Breakdown**:
- **Operation**: ${opTitle}
- **Calculation**: ${n1} ${sym === '*' ? '×' : sym} ${n2}
- **Result**: **${ans}**`,
      mode: 'GENERAL',
      suggested: ['Calculate 128 / 4', 'Explain probability simply', 'Solve a quadratic equation']
    };
  }

  // 19. Capital of France
  if (intentObj.intent === 'GENERAL_AI_KNOWLEDGE' || /capital of france/i.test(lowerText)) {
    return {
      content: `### 🌍 Capital of France

The capital of France is **Paris** 🇫🇷.

- **Official Language**: French
- **Currency**: Euro (€)
- **Key Landmarks**: Eiffel Tower, Louvre Museum, Notre-Dame Cathedral
- **Global Role**: A leading international center for diplomacy, finance, arts, science, and education.`,
      mode: 'GENERAL',
      suggested: ['What is artificial intelligence?', 'What is the weather?', 'Give me a Python program']
    };
  }

  // 20. What is Python?
  if (intentObj.intent === 'GENERAL_AI_PYTHON' || /what is python\b/i.test(lowerText)) {
    return {
      content: `### 🐍 Python Programming Language

**Python** is a high-level, general-purpose, interpreted programming language created by Guido van Rossum and released in 1991. It emphasizes readability with its notable use of significant indentation.

#### 1. Core Advantages:
- **Clean Syntax**: Intuitive, expressive, and reads almost like plain English.
- **Dynamic Typing**: Automatic memory management with built-in garbage collection.
- **Batteries Included**: Comprehensive standard library covering networking, math, file I/O, and cryptography.
- **Dominant in AI & Data Science**: NumPy, Pandas, Scikit-Learn, PyTorch, and TensorFlow.

#### 2. University Curriculum Usage:
Used extensively for Data Structures, Machine Learning, Web Backend Development (FastAPI, Django), and Automation.`,
      mode: 'GENERAL',
      suggested: ['Give me a Python program', 'What is my Python subject mark?', 'Who teaches Python?']
    };
  }

  // 21. Python Program
  if (/give me a python program|python program|python code/i.test(lowerText)) {
    return {
      content: `### 🐍 Python Program: Student Grade & Attendance Analytics

Here is a clean Python program illustrating Object-Oriented Programming (OOP) and list comprehensions:

\`\`\`python
class StudentRecord:
    def __init__(self, name: str, usn: str, attendance_pct: float, marks: dict):
        self.name = name
        self.usn = usn
        self.attendance_pct = attendance_pct
        self.marks = marks

    def get_average(self) -> float:
        return round(sum(self.marks.values()) / len(self.marks), 2)

    def is_eligible_for_exams(self) -> bool:
        return self.attendance_pct >= 75.0

    def display(self):
        avg = self.get_average()
        status = "✅ Eligible" if self.is_eligible_for_exams() else "⚠️ Shortage (<75%)"
        print(f"[{self.usn}] {self.name:<15} | Avg: {avg}% | Attendance: {self.attendance_pct}% | {status}")

# Demo Student Records
cohort = [
    StudentRecord("Aarav Sharma", "1MS21CS001", 82.4, {"DBMS": 92, "CN": 68, "OS": 85}),
    StudentRecord("Sneha Patel", "1MS21CS002", 94.0, {"DBMS": 98, "CN": 88, "OS": 91}),
    StudentRecord("Rahul Verma", "1MS21CS003", 64.0, {"DBMS": 74, "CN": 36, "OS": 58})
]

print("🎓 UniMate Student Analytics Batch Run:")
print("-" * 65)
for s in cohort:
    s.display()
\`\`\`

#### How to run:
\`\`\`bash
python student_analytics.py
\`\`\``,
      mode: 'GENERAL',
      suggested: ['Give me a Java program for TCP client', 'Explain TCP', 'What is my attendance?']
    };
  }

  // 22. Explain this error
  if (intentObj.intent === 'GENERAL_AI_ERROR' || /explain this error|troubleshoot error/i.test(lowerText)) {
    return {
      content: `### 🛠️ Common Software Errors & Troubleshooting Guide

Here is a quick diagnosis guide for frequent software engineering errors:

#### 1. \`TypeError: Cannot read properties of undefined (reading '...')\` (JavaScript)
- **Cause**: Trying to access a property or method on a variable that evaluated to \`undefined\` or \`null\`.
- **Solution**: Use optional chaining \`user?.profile?.name\` or nullish coalescing \`const list = data ?? [];\`.

#### 2. \`NullPointerException\` (Java)
- **Cause**: Invoking an instance method or accessing a field on an uninitialized reference.
- **Solution**: Check for null before invoking: \`if (student != null) { student.getName(); }\`.

#### 3. \`IndentationError: unexpected indent\` (Python)
- **Cause**: Mixing spaces and tabs or misaligned indentation levels.
- **Solution**: Configure your editor to convert tabs to 4 spaces consistently.

#### 4. \`CORS (Cross-Origin Resource Sharing) Error\`
- **Cause**: The browser blocked an API call from origin A to origin B because Access-Control-Allow-Origin headers were absent.
- **Solution**: In Express, add \`const cors = require('cors'); app.use(cors());\`.

👉 *Paste your exact error code or stack trace here and I will provide the instant solution!*`,
      mode: 'GENERAL',
      suggested: ['Give me a Python program', 'Explain TCP', 'Write an email to my professor']
    };
  }

  // 23. Help me write a resume
  if (intentObj.intent === 'GENERAL_AI_RESUME' || /help me write a resume|write.*resume/i.test(lowerText)) {
    return {
      content: `### 📄 High-Impact Technical Resume Blueprint (ATS-Optimized)

#### 1. Header:
**[Your Full Name]** | Bangalore, India  
📧 your.email@example.com | 📱 +91 98765 43210 | 🌐 linkedin.com/in/yourprofile | 💻 github.com/yourusername  

#### 2. Education:
**B.Tech in Computer Science and Engineering** | *Ramaiah Institute of Technology* (2021 – 2025)  
- Cumulative CGPA: **8.42 / 10.0** | Relevant Coursework: DBMS, Operating Systems, Computer Networks

#### 3. Technical Skills:
- **Languages**: Python, Java, JavaScript, C++, SQL, HTML/CSS
- **Frameworks & Databases**: Express.js, React, Node.js, SQLite, PostgreSQL
- **Tools**: Git, GitHub, Docker, Postman, Linux

#### 4. Key Projects:
- **UniMate AI — Universal Campus Assistant**: Built an intelligent RAG chatbot integrating conversational AI with relational student and faculty databases.
- **Real-Time Collaborative Editor**: Implemented WebSockets and CRDTs for sub-50ms synchronization across concurrent editors.

#### 5. Experience / Leadership:
- **Technical Lead**, Campus Coding Society (2023 – Present). Organized hackathons and mentored 100+ junior students.`,
      mode: 'GENERAL',
      suggested: ['Write a resume summary', 'Suggest projects for a computer science student', 'Help me prepare for an interview']
    };
  }

  // 24. Professional message
  if (intentObj.intent === 'GENERAL_AI_WRITING' || /create a professional message|professional message/i.test(lowerText)) {
    return {
      content: `### 💬 Professional Communication Message Templates

#### Option A: Project Update to Team
> *"Hi team! I've completed the database schema indexing and verified the API endpoints. All integration tests are passing with 100% coverage. Please review PR #14 when you have a moment so we can merge before tomorrow's release."*

#### Option B: Professional Inquiry to Professor
> *"Dear Professor, I hope you are having a pleasant week. I am following up on the DBMS project query we discussed after class. I have attached the updated normalization schema for your review. Thank you for your time and guidance."*

#### Option C: Networking Message to Recruiter
> *"Hello [Name], I came across [Company]'s impressive work in distributed systems. As a final-year CS student with expertise in full-stack engineering and cloud databases, I'd love to connect and explore open software engineering opportunities."*`,
      mode: 'GENERAL',
      suggested: ['Write an email to my professor', 'Help me write a resume', 'Help me prepare for an interview']
    };
  }

  // Default Greeting / Welcome
  return {
    content: `Hello! I'm **UniMate AI** 👋

I am your universal AI assistant and integrated university companion. You can ask me anything naturally:

- **University Academics**: *"What is my attendance?"*, *"Who scored highest in DBMS?"*, *"Am I eligible for exams?"*, *"Who teaches Computer Networks?"*
- **Computer Science & Coding**: Python, Java, C++, React, SQL, Operating Systems, Algorithms.
- **Mathematics & Science**: Equations, probability, calculus, system design.
- **Writing & Careers**: Professional emails, resume summaries, project ideas, interview prep.

What would you like to explore today?`,
    mode: 'GENERAL',
    suggested: [
      'What is my attendance?',
      'Who scored the highest in DBMS?',
      'Who teaches Computer Networks?',
      'Explain DBMS normalization for 10 marks'
    ]
  };
}

module.exports = {
  getGeneralAnswer,
  KNOWLEDGE_BASE
};
