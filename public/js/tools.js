/**
 * UniMate AI Tools & Modals Controller
 */

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    lucide.createIcons();
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Close modal when clicking on backdrop
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('fixed') && e.target.classList.contains('backdrop-blur-md')) {
    e.target.classList.add('hidden');
  }
});

// 1. Attendance Predictor Simulation
async function runAttendanceSimulation() {
  const attended = parseInt(document.getElementById('predAttended').value, 10);
  const total = parseInt(document.getElementById('predTotal').value, 10);
  const next = parseInt(document.getElementById('predNext').value, 10);
  const resultDiv = document.getElementById('predResult');

  if (isNaN(attended) || isNaN(total) || isNaN(next) || total <= 0) {
    alert('Please enter valid positive numbers.');
    return;
  }

  try {
    const res = await fetch('/api/student/predict-attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('unimate_token') || ''}`
      },
      body: JSON.stringify({ classesAttended: attended, totalClasses: total, nextClasses: next })
    });
    const sim = await res.json();

    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = `
      <div class="font-bold text-white mb-1 flex items-center justify-between">
        <span>Projection Result:</span>
        <span class="${sim.newPct >= 75 ? 'text-emerald-400' : 'text-amber-400'} font-extrabold text-sm">${sim.newPct}%</span>
      </div>
      <p class="text-gray-300">Current: <strong>${sim.currentPct}%</strong> (${sim.classesAttended}/${sim.totalClasses})</p>
      <p class="text-gray-300">If you attend next ${sim.nextClassesToAttend} classes: <strong>${sim.newPct}%</strong> (+${sim.changePct}%)</p>
      <p class="mt-1 font-semibold ${sim.willBeEligible ? 'text-emerald-400' : 'text-amber-400'}">
        ${sim.willBeEligible ? '✅ You will be eligible for examinations (>= 75%)!' : '⚠️ Still below statutory 75% requirement.'}
      </p>
      ${sim.classesNeededFor75 > 0 ? `<p class="text-gray-400">Classes needed to reach 75%: <strong>${sim.classesNeededFor75}</strong></p>` : `<p class="text-emerald-400">Safe skips buffer: <strong>${sim.safeSkips}</strong> classes</p>`}
    `;
  } catch (err) {
    console.error('Simulation error:', err);
  }
}

// 2. Open Academic Report Card Modal
async function openReportCardModal() {
  const container = document.getElementById('reportCardPrintArea');
  container.innerHTML = `<div class="text-center py-8 text-gray-400">Generating institutional transcript...</div>`;
  openModal('reportCardModal');

  try {
    const res = await fetch('/api/student/dashboard', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('unimate_token') || ''}` }
    });
    const data = await res.json();
    const st = data.student;
    const kpis = data.kpis;

    const resultsRes = await fetch('/api/student/results', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('unimate_token') || ''}` }
    });
    const results = await resultsRes.json();

    container.innerHTML = `
      <!-- Transcript Header -->
      <div class="border-b-2 border-indigo-500/30 pb-4 text-center space-y-1">
        <h2 class="text-lg font-black text-white tracking-wide uppercase">Visvesvaraya Technological University</h2>
        <h3 class="text-sm font-semibold text-indigo-400">Office of the Registrar (Evaluation) — Academic Report</h3>
        <p class="text-[11px] text-gray-400">Official Consolidated Grade & Performance Record</p>
      </div>

      <!-- Student Credentials Table -->
      <div class="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
        <div>
          <p class="text-gray-400">Candidate Name: <strong class="text-white">${st.full_name}</strong></p>
          <p class="text-gray-400">University Seat No (USN): <strong class="text-indigo-400 font-mono">${st.usn}</strong></p>
          <p class="text-gray-400">Department: <strong class="text-white">${st.dept_name}</strong></p>
        </div>
        <div>
          <p class="text-gray-400">Current Semester: <strong class="text-white">Semester ${st.current_semester} (Sec ${st.section})</strong></p>
          <p class="text-gray-400">Cumulative GPA (CGPA): <strong class="text-emerald-400 text-sm font-extrabold">${st.cgpa} / 10.0</strong></p>
          <p class="text-gray-400">Current SGPA: <strong class="text-white font-bold">${st.sgpa}</strong> (Prev: ${st.prev_sgpa})</p>
        </div>
      </div>

      <!-- Course Marks Record -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border border-white/10 rounded-lg overflow-hidden">
          <thead class="bg-white/10 text-white font-bold">
            <tr>
              <th class="p-2.5">Code</th>
              <th class="p-2.5">Course Title</th>
              <th class="p-2.5">Credits</th>
              <th class="p-2.5">Internal</th>
              <th class="p-2.5">External</th>
              <th class="p-2.5">Total</th>
              <th class="p-2.5">Grade</th>
              <th class="p-2.5">Result</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10 text-gray-200">
            ${results.map(r => `
              <tr class="hover:bg-white/5">
                <td class="p-2 font-mono text-indigo-400">${r.subject_code}</td>
                <td class="p-2 font-medium">${r.subject_name}</td>
                <td class="p-2">${r.credits || 4}</td>
                <td class="p-2">${r.internal_marks}</td>
                <td class="p-2">${r.external_marks}</td>
                <td class="p-2 font-bold">${r.total_marks}</td>
                <td class="p-2 font-bold">${r.grade}</td>
                <td class="p-2 font-semibold ${r.status === 'PASS' ? 'text-emerald-400' : 'text-red-400'}">${r.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Academic Summary & Risk Rationale -->
      <div class="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
        <h4 class="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <span>AI Academic Assessment:</span>
          <span>${kpis.risk.badge}</span>
        </h4>
        <p class="text-gray-300">${kpis.risk.explanation}</p>
        <p class="text-gray-400 text-[11px]">Overall Course Attendance: <strong>${kpis.overallAttendance}%</strong> | Total Earned Credits: <strong>${kpis.totalCreditsEarned}</strong></p>
      </div>

      <!-- Footer Seal -->
      <div class="pt-4 flex justify-between items-end border-t border-white/10 text-[11px] text-gray-500">
        <div>
          <p>Generated by UniMate AI Verification Engine</p>
          <p>Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="text-right">
          <p class="font-serif italic text-gray-400">Digitally Verified</p>
          <p class="font-bold text-gray-300">Controller of Examinations</p>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Report card error:', err);
    container.innerHTML = `<div class="text-red-400 py-6 text-center">Failed to load academic transcript.</div>`;
  }
}

// 3. AI Insights Hub
async function openInsightsModal() {
  const container = document.getElementById('insightsContent');
  container.innerHTML = `<div class="text-center py-6 text-gray-400">Analyzing campus intelligence patterns...</div>`;
  openModal('insightsModal');

  try {
    const res = await fetch('/api/analytics/insights');
    const data = await res.json();

    container.innerHTML = data.insights.map(item => `
      <div class="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-start gap-3.5">
        <div class="text-2xl">${item.icon}</div>
        <div class="flex-1 space-y-1">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-white text-sm">${item.title}</h4>
            <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-300">${item.type}</span>
          </div>
          <div class="text-xs text-gray-300 leading-relaxed">${marked.parse(item.content)}</div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Insights error:', err);
    container.innerHTML = `<div class="text-red-400 py-6 text-center">Failed to load insights.</div>`;
  }
}

// 4. Settings Management
function saveSettings() {
  const provider = document.getElementById('settingProvider').value;
  const rate = document.getElementById('settingVoiceRate').value;

  localStorage.setItem('unimate_provider', provider);
  localStorage.setItem('unimate_voice_rate', rate);

  closeModal('settingsModal');
  alert('Settings saved successfully!');
}

function loadSettings() {
  const provider = localStorage.getItem('unimate_provider') || 'gemini';
  const rate = localStorage.getItem('unimate_voice_rate') || '1.0';

  if (document.getElementById('settingProvider')) document.getElementById('settingProvider').value = provider;
  if (document.getElementById('settingVoiceRate')) document.getElementById('settingVoiceRate').value = rate;
}

// Quick Prompt Helper modal
function showPromptHelpers() {
  const prompts = [
    'What is my attendance?',
    'Which subject should I focus on?',
    'Who scored the highest in DBMS?',
    'How many students failed Computer Networks?',
    'Which department has the highest pass percentage?',
    'Show students below 75% attendance',
    'Who teaches Data Structures?',
    'Am I eligible for exams?',
    'Compare my current semester with the previous semester',
    'Explain DBMS normalization for 10 marks',
    'Explain operating system process management',
    'Give me a simple Java program for Fibonacci',
    'Translate this into Kannada'
  ];

  const choice = prompt("Select a prompt number:\n" + prompts.map((p, i) => `${i + 1}. ${p}`).join("\n"));
  if (choice) {
    const idx = parseInt(choice, 10) - 1;
    if (idx >= 0 && idx < prompts.length) {
      sendQuickPrompt(prompts[idx]);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  document.getElementById('navPredictorBtn')?.addEventListener('click', () => openModal('predictorModal'));
  document.getElementById('navInsightsBtn')?.addEventListener('click', openInsightsModal);
  document.getElementById('openReportBtn')?.addEventListener('click', openReportCardModal);
  document.getElementById('settingsBtn')?.addEventListener('click', () => openModal('settingsModal'));
  document.getElementById('roleSwitcherBtn')?.addEventListener('click', () => openModal('roleModal'));
});
