/**
 * UniMate AI Interactive Dashboards Controller
 * Renders tailored dashboards for Student, Faculty, and Admin roles.
 */

let activeDashboardChart1 = null;
let activeDashboardChart2 = null;

async function openDashboardModal() {
  const container = document.getElementById('dashboardContent');
  const title = document.getElementById('dashboardTitle');
  const subtitle = document.getElementById('dashboardSubtitle');
  const role = window.currentUser ? window.currentUser.role : 'student';

  container.innerHTML = `<div class="text-center py-12 text-gray-400">Loading live ${role} dashboard...</div>`;
  openModal('dashboardModal');

  try {
    if (role === 'student') {
      title.innerText = 'Student Academic Dashboard';
      subtitle.innerText = 'Personalized Performance, Attendance & AI Study Insights';
      await renderStudentDashboard(container);
    } else if (role === 'faculty') {
      title.innerText = 'Faculty Academic Dashboard';
      subtitle.innerText = 'Course Oversight, Class Attendance & Student Shortage Monitoring';
      await renderFacultyDashboard(container);
    } else {
      title.innerText = 'Admin Executive Dashboard';
      subtitle.innerText = 'University-Wide Performance, Department Benchmarks & Risk Oversight';
      await renderAdminDashboard(container);
    }
    lucide.createIcons();
  } catch (err) {
    console.error('Dashboard load error:', err);
    container.innerHTML = `<div class="text-red-400 text-center py-8">Failed to load dashboard data.</div>`;
  }
}

// 1. Student Dashboard
async function renderStudentDashboard(container) {
  const res = await fetch('/api/student/dashboard', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('unimate_token') || ''}` }
  });
  const data = await res.json();
  const st = data.student;
  const kpis = data.kpis;

  container.innerHTML = `
    <!-- Top KPI Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <div class="text-[11px] font-semibold text-gray-400 uppercase">Cumulative CGPA</div>
        <div class="text-2xl font-extrabold text-white mt-1">${st.cgpa} <span class="text-xs text-gray-400">/ 10</span></div>
        <div class="text-[11px] text-emerald-400 mt-0.5">Top 15% in Dept</div>
      </div>

      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <div class="text-[11px] font-semibold text-gray-400 uppercase">Current SGPA</div>
        <div class="text-2xl font-extrabold text-indigo-400 mt-1">${st.sgpa}</div>
        <div class="text-[11px] text-gray-400 mt-0.5">Prev Sem: ${st.prev_sgpa}</div>
      </div>

      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <div class="text-[11px] font-semibold text-gray-400 uppercase">Overall Attendance</div>
        <div class="text-2xl font-extrabold ${kpis.overallAttendance >= 75 ? 'text-emerald-400' : 'text-amber-400'} mt-1">
          ${kpis.overallAttendance}%
        </div>
        <div class="text-[11px] ${kpis.overallAttendance >= 75 ? 'text-emerald-400' : 'text-amber-400'} mt-0.5">
          ${kpis.overallAttendance >= 75 ? 'Eligible for SEE' : 'Shortage Alert'}
        </div>
      </div>

      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <div class="text-[11px] font-semibold text-gray-400 uppercase">Credits Earned</div>
        <div class="text-2xl font-extrabold text-white mt-1">${kpis.totalCreditsEarned}</div>
        <div class="text-[11px] text-gray-400 mt-0.5">${kpis.passedSubjects} Passed • ${kpis.failedSubjects} Backlogs</div>
      </div>
    </div>

    <!-- AI Academic Risk Alert -->
    <div class="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
      <div class="text-2xl">${kpis.risk.riskLevel === 'HIGH' ? '🔴' : (kpis.risk.riskLevel === 'MEDIUM' ? '🟡' : '🟢')}</div>
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <h4 class="font-bold text-white text-sm">Academic Risk Classification:</h4>
          <span class="font-extrabold text-xs text-white">${kpis.risk.badge}</span>
        </div>
        <p class="text-xs text-gray-300 mt-1 leading-relaxed">${kpis.risk.explanation}</p>
      </div>
    </div>

    <!-- Live Charts Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <h4 class="font-bold text-white text-xs mb-3 flex items-center gap-2">
          <i data-lucide="trending-up" class="w-3.5 h-3.5 text-indigo-400"></i>
          <span>SGPA Progression (Semesters 3-6)</span>
        </h4>
        <div class="h-52 relative">
          <canvas id="studentSgpaChart"></canvas>
        </div>
      </div>

      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <h4 class="font-bold text-white text-xs mb-3 flex items-center gap-2">
          <i data-lucide="bar-chart-2" class="w-3.5 h-3.5 text-emerald-400"></i>
          <span>Subject Attendance (%) vs 75% Cutoff</span>
        </h4>
        <div class="h-52 relative">
          <canvas id="studentAttendanceChart"></canvas>
        </div>
      </div>
    </div>

    <!-- AI Recommendations -->
    <div class="space-y-2">
      <h4 class="font-bold text-white text-xs uppercase tracking-wider">AI Advisor Recommendations</h4>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        ${data.recommendations.map(r => `
          <div class="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div class="text-xs font-bold text-indigo-300">${r.title}</div>
            <p class="text-[11px] text-gray-400 leading-relaxed">${r.desc}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Render Charts
  setTimeout(() => {
    const ctx1 = document.getElementById('studentSgpaChart');
    if (ctx1) {
      if (activeDashboardChart1) activeDashboardChart1.destroy();
      activeDashboardChart1 = new Chart(ctx1, {
        type: 'line',
        data: {
          labels: data.charts.performance.labels,
          datasets: [{
            label: 'SGPA',
            data: data.charts.performance.data,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#818cf8',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 6.0, max: 10.0, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
            x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
          }
        }
      });
    }

    const ctx2 = document.getElementById('studentAttendanceChart');
    if (ctx2) {
      if (activeDashboardChart2) activeDashboardChart2.destroy();
      activeDashboardChart2 = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: data.charts.attendance.labels,
          datasets: [{
            label: 'Attendance %',
            data: data.charts.attendance.data,
            backgroundColor: data.charts.attendance.colors,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
            x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
          }
        }
      });
    }
  }, 100);
}

// 2. Faculty Dashboard
async function renderFacultyDashboard(container) {
  const res = await fetch('/api/faculty/dashboard', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('unimate_token') || ''}` }
  });
  const data = await res.json();
  const fac = data.faculty;
  const kpis = data.kpis;

  container.innerHTML = `
    <!-- Faculty KPIs -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <div class="text-[11px] font-semibold text-gray-400 uppercase">Enrolled Students</div>
        <div class="text-2xl font-extrabold text-white mt-1">${kpis.totalStudents}</div>
        <div class="text-[11px] text-gray-400 mt-0.5">Across ${kpis.subjectsCount} course sections</div>
      </div>

      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <div class="text-[11px] font-semibold text-gray-400 uppercase">Average Attendance</div>
        <div class="text-2xl font-extrabold text-emerald-400 mt-1">${kpis.avgAttendance}%</div>
        <div class="text-[11px] text-gray-400 mt-0.5">Compliant overall</div>
      </div>

      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <div class="text-[11px] font-semibold text-gray-400 uppercase">Class Pass Rate</div>
        <div class="text-2xl font-extrabold text-indigo-400 mt-1">${kpis.passPercentage}%</div>
        <div class="text-[11px] text-gray-400 mt-0.5">Semester examinations</div>
      </div>

      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <div class="text-[11px] font-semibold text-gray-400 uppercase">Attendance Shortages</div>
        <div class="text-2xl font-extrabold text-amber-400 mt-1">${kpis.shortageCount}</div>
        <div class="text-[11px] text-amber-400 mt-0.5">Students below 75%</div>
      </div>
    </div>

    <!-- Courses Handled List -->
    <div class="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
      <h4 class="font-bold text-white text-xs uppercase tracking-wider">Courses Handled by ${fac.full_name}</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${data.subjects.map(s => `
          <div class="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <div class="font-semibold text-white text-xs">${s.name} (\`${s.code}\`)</div>
              <div class="text-[11px] text-gray-400">Credits: ${s.credits} • Section ${s.section}</div>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">50 Classes</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Students Below 75% Alert Table -->
    <div class="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-white text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <i data-lucide="alert-triangle" class="w-4 h-4"></i>
          <span>Students Requiring Attendance Intervention (< 75%)</span>
        </h4>
        <span class="text-xs text-gray-400">${data.lowAttendanceList.length} total alerts</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border border-white/10 rounded-lg text-xs">
          <thead class="bg-white/10 text-white font-semibold">
            <tr>
              <th class="p-2.5">Student Name</th>
              <th class="p-2.5">USN</th>
              <th class="p-2.5">Course</th>
              <th class="p-2.5">Attendance %</th>
              <th class="p-2.5">Attended / Total</th>
              <th class="p-2.5">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10 text-gray-300">
            ${data.lowAttendanceList.map(s => `
              <tr class="hover:bg-white/5">
                <td class="p-2.5 font-bold text-white">${s.full_name}</td>
                <td class="p-2.5 font-mono text-indigo-400">${s.usn}</td>
                <td class="p-2.5">${s.subject_name}</td>
                <td class="p-2.5 font-extrabold text-amber-400">${s.attendance_pct}%</td>
                <td class="p-2.5">${s.classes_attended}/${s.total_classes}</td>
                <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">${s.eligibility_status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 3. Admin Dashboard
async function renderAdminDashboard(container) {
  const res = await fetch('/api/admin/dashboard', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('unimate_token') || ''}` }
  });
  const data = await res.json();
  const kpis = data.kpis;
  const depts = data.departments;

  container.innerHTML = `
    <!-- Executive University KPIs -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <div class="text-[11px] font-semibold text-gray-400 uppercase">Total Students</div>
        <div class="text-2xl font-extrabold text-white mt-1">${kpis.studentsCount}</div>
        <div class="text-[11px] text-gray-400 mt-0.5">Enrolled across 4 branches</div>
      </div>

      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <div class="text-[11px] font-semibold text-gray-400 uppercase">Total Faculty</div>
        <div class="text-2xl font-extrabold text-white mt-1">${kpis.facultyCount}</div>
        <div class="text-[11px] text-gray-400 mt-0.5">Professors & Associate Profs</div>
      </div>

      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <div class="text-[11px] font-semibold text-gray-400 uppercase">Pass Percentage</div>
        <div class="text-2xl font-extrabold text-emerald-400 mt-1">${kpis.passPercentage}%</div>
        <div class="text-[11px] text-emerald-400 mt-0.5">University-wide average</div>
      </div>

      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <div class="text-[11px] font-semibold text-gray-400 uppercase">Average CGPA</div>
        <div class="text-2xl font-extrabold text-indigo-400 mt-1">${kpis.avgCgpa}</div>
        <div class="text-[11px] text-gray-400 mt-0.5">Scale of 10.0</div>
      </div>

      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <div class="text-[11px] font-semibold text-gray-400 uppercase">High Risk Students</div>
        <div class="text-2xl font-extrabold text-red-400 mt-1">${kpis.highRiskStudents}</div>
        <div class="text-[11px] text-red-400 mt-0.5">Intervention required</div>
      </div>
    </div>

    <!-- Department Comparison Chart -->
    <div class="p-4 rounded-xl bg-white/5 border border-white/10">
      <h4 class="font-bold text-white text-xs mb-3 flex items-center gap-2">
        <i data-lucide="bar-chart-2" class="w-3.5 h-3.5 text-indigo-400"></i>
        <span>Department Pass Rate Benchmark (%)</span>
      </h4>
      <div class="h-56 relative">
        <canvas id="adminDeptChart"></canvas>
      </div>
    </div>

    <!-- University Risk Audit Table -->
    <div class="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-white text-xs uppercase tracking-wider text-red-400 flex items-center gap-1.5">
          <i data-lucide="shield-alert" class="w-4 h-4"></i>
          <span>Academic Risk Audit & Intervention Roster</span>
        </h4>
        <span class="text-xs text-gray-400">${data.riskStudents.length} Flagged Candidates</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border border-white/10 rounded-lg text-xs">
          <thead class="bg-white/10 text-white font-semibold">
            <tr>
              <th class="p-2.5">Student Name</th>
              <th class="p-2.5">USN</th>
              <th class="p-2.5">Dept</th>
              <th class="p-2.5">CGPA</th>
              <th class="p-2.5">Risk Level</th>
              <th class="p-2.5">Diagnosis / Rationale</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10 text-gray-300">
            ${data.riskStudents.map(s => `
              <tr class="hover:bg-white/5">
                <td class="p-2.5 font-bold text-white">${s.full_name}</td>
                <td class="p-2.5 font-mono text-indigo-400">${s.usn}</td>
                <td class="p-2.5">${s.dept_code}</td>
                <td class="p-2.5 font-bold">${s.cgpa}</td>
                <td class="p-2.5">
                  <span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${s.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
                    ${s.risk_level === 'HIGH' ? '🔴 HIGH' : '🟡 MEDIUM'}
                  </span>
                </td>
                <td class="p-2.5 text-[11px] text-gray-400">${s.risk_reason || 'Under review'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Render Department Bar Chart
  setTimeout(() => {
    const ctx = document.getElementById('adminDeptChart');
    if (ctx) {
      if (activeDashboardChart1) activeDashboardChart1.destroy();
      activeDashboardChart1 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: depts.map(d => d.code),
          datasets: [{
            label: 'Pass Percentage (%)',
            data: depts.map(d => d.pass_percentage),
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { min: 70, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
            x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
          }
        }
      });
    }
  }, 100);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('navDashboardBtn')?.addEventListener('click', openDashboardModal);
});
