/**
 * UniMate AI Master Application Controller
 * Handles SRN Authentication, Session Verification, Role States, and Theme
 */

window.currentUser = null;
window.currentProfile = null;
let currentAuthRole = 'student';

// 1. Initialize User Session
async function initSession() {
  const token = localStorage.getItem('unimate_token');
  const authModal = document.getElementById('authModal');

  if (token) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserState(data.user, data.profile);
        authModal?.classList.add('hidden');
        if (typeof loadConversations === 'function') loadConversations();
        return;
      }
    } catch (e) {
      console.warn('Session verification failed, requesting SRN sign-in.');
    }
  }

  // Not authenticated: Show mandatory SRN Authentication Portal
  localStorage.removeItem('unimate_token');
  authModal?.classList.remove('hidden');
  lucide.createIcons();
}

// 2. Select Auth Role Tab in Modal
function selectAuthRole(role) {
  currentAuthRole = role;
  const label = document.getElementById('authSrnLabel');
  const input = document.getElementById('authSrnInput');

  // Highlight active tab
  document.querySelectorAll('.auth-role-tab').forEach(tab => {
    tab.className = 'auth-role-tab py-1.5 rounded-lg font-medium text-gray-400 hover:text-white transition-all';
  });

  if (role === 'student') {
    document.getElementById('tabRoleStudent').className = 'auth-role-tab py-1.5 rounded-lg font-semibold bg-indigo-600 text-white transition-all';
    label.innerText = 'Student Registration Number (SRN)';
    input.placeholder = 'e.g. 1MS21CS001';
  } else if (role === 'faculty') {
    document.getElementById('tabRoleFaculty').className = 'auth-role-tab py-1.5 rounded-lg font-semibold bg-emerald-600 text-white transition-all';
    label.innerText = 'Faculty Employee ID / SRN';
    input.placeholder = 'e.g. FAC-CSE-001';
  } else {
    document.getElementById('tabRoleAdmin').className = 'auth-role-tab py-1.5 rounded-lg font-semibold bg-purple-600 text-white transition-all';
    label.innerText = 'Administrator ID / SRN';
    input.placeholder = 'e.g. ADMIN-001';
  }
}

// 3. Quick-Fill Demo Credentials
function fillDemoCredentials(srn, password, role) {
  selectAuthRole(role);
  const srnInput = document.getElementById('authSrnInput');
  const passInput = document.getElementById('authPasswordInput');
  if (srnInput) srnInput.value = srn;
  if (passInput) passInput.value = password;
  hideAuthError();
}

// 4. Handle SRN Login Submission
async function handleSrnLogin(e) {
  if (e) e.preventDefault();
  const srnInput = document.getElementById('authSrnInput');
  const passInput = document.getElementById('authPasswordInput');
  const submitBtn = document.getElementById('authSubmitBtn');
  const srn = srnInput.value.trim();
  const password = passInput.value;

  if (!srn || !password) {
    showAuthError('Please enter both your SRN/ID and password.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>Verifying credentials...</span>`;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ srn, password })
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      showAuthError(data.error || 'Authentication failed. Please verify your SRN and password.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Authenticate with SRN</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;
      lucide.createIcons();
      return;
    }

    // Success: store token and initialize session
    localStorage.setItem('unimate_token', data.token);
    setUserState(data.user, data.profile);
    document.getElementById('authModal')?.classList.add('hidden');
    hideAuthError();

    showToast(`Authenticated as ${data.profile ? data.profile.full_name : data.user.username} (${(data.user.role).toUpperCase()})`);

    // Reset input fields
    srnInput.value = '';
    passInput.value = '';

    // Initialize chat & conversations
    if (typeof startNewChat === 'function') startNewChat();

  } catch (err) {
    console.error('Login error:', err);
    showAuthError('Connection error. Please ensure the UniMate server is running.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Authenticate with SRN</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;
    lucide.createIcons();
  }
}

function showAuthError(msg) {
  const banner = document.getElementById('authErrorBanner');
  if (banner) {
    banner.innerText = msg;
    banner.classList.remove('hidden');
  }
}

function hideAuthError() {
  const banner = document.getElementById('authErrorBanner');
  if (banner) {
    banner.classList.add('hidden');
  }
}

// 5. Logout User / Switch SRN
function logoutUser() {
  localStorage.removeItem('unimate_token');
  window.currentUser = null;
  window.currentProfile = null;

  // Clear chat screen
  document.getElementById('messagesContainer').innerHTML = '';
  document.getElementById('welcomeHero')?.classList.remove('hidden');
  document.getElementById('conversationsList').innerHTML = '';

  // Show Auth Portal
  const authModal = document.getElementById('authModal');
  authModal?.classList.remove('hidden');
  hideAuthError();

  showToast('Logged out. Please authenticate with your SRN to continue.');
  lucide.createIcons();
}

// 6. Set User State & Update UI Badges
function setUserState(user, profile) {
  window.currentUser = user;
  window.currentProfile = profile;

  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRoleBadge');
  const srnEl = document.getElementById('userSrn');
  const headerSrn = document.getElementById('headerSrn');
  const avatarEl = document.getElementById('userAvatar');
  const heroSubtitle = document.getElementById('heroSubtitle');

  const activeSrn = profile ? (profile.srn || profile.usn || profile.employee_id) : user.username;

  if (nameEl) nameEl.innerText = profile ? profile.full_name : user.username;
  if (srnEl) srnEl.innerText = activeSrn;
  if (headerSrn) headerSrn.innerText = activeSrn;

  if (roleEl) {
    roleEl.innerText = user.role.toUpperCase();
    if (user.role === 'student') {
      roleEl.className = 'text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase';
    } else if (user.role === 'faculty') {
      roleEl.className = 'text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase';
    } else {
      roleEl.className = 'text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase';
    }
  }

  if (avatarEl) {
    const initials = (profile ? profile.full_name : user.username)
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    avatarEl.innerText = initials;
  }

  if (heroSubtitle) {
    if (user.role === 'student') {
      heroSubtitle.innerText = `Welcome ${profile ? profile.full_name : 'Student'} (SRN: ${activeSrn})! Ask questions about your attendance, results, faculty, or any general engineering topic.`;
    } else if (user.role === 'faculty') {
      heroSubtitle.innerText = `Welcome ${profile ? profile.full_name : 'Professor'} (Faculty ID: ${activeSrn})! Directly ask about your class attendance, shortages, or subject performance.`;
    } else {
      heroSubtitle.innerText = `Welcome Administrator (ID: ${activeSrn})! Ask about university-wide pass rates, enrollments, and academic risks.`;
    }
  }

  lucide.createIcons();
}

// 7. Toast Notification
function showToast(msg) {
  const existing = document.getElementById('uniToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'uniToast';
  toast.className = 'fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-xs shadow-2xl flex items-center gap-2 border border-indigo-400/30';
  toast.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i><span>${msg}</span>`;
  document.body.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => toast.remove(), 2500);
}

// 8. Theme Switcher (Dark / Light)
function initTheme() {
  const savedTheme = localStorage.getItem('unimate_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    updateThemeIcon(themeBtn, savedTheme);
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('unimate_theme', nextTheme);
      updateThemeIcon(themeBtn, nextTheme);
    });
  }
}

function updateThemeIcon(btn, theme) {
  if (theme === 'light') {
    btn.innerHTML = `<i data-lucide="moon" class="w-4 h-4 text-indigo-600"></i>`;
  } else {
    btn.innerHTML = `<i data-lucide="sun" class="w-4 h-4 text-gray-300"></i>`;
  }
  lucide.createIcons();
}

// 9. Mobile Sidebar Drawer
function initSidebarDrawer() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const closeBtn = document.getElementById('sidebarCloseBtn');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
    });
  }

  if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', () => {
      sidebar.classList.add('-translate-x-full');
    });
  }

  function handleResize() {
    if (window.innerWidth < 1024) {
      sidebar.classList.add('-translate-x-full');
      sidebar.classList.add('absolute');
    } else {
      sidebar.classList.remove('-translate-x-full');
      sidebar.classList.remove('absolute');
    }
  }

  window.addEventListener('resize', handleResize);
  handleResize();
}

// Document Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebarDrawer();
  document.getElementById('srnLoginForm')?.addEventListener('submit', handleSrnLogin);
  initSession();
});