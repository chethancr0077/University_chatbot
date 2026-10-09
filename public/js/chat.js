/**
 * UniMate AI Conversational Stream & Chat Controller
 */

let activeConversationId = null;
const renderedCharts = new Map();

// Configure Marked.js
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

// 1. Submit User Message
async function handleChatSubmit(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text) return;

  // Clear input & reset height
  input.value = '';
  input.style.height = 'auto';

  // Hide welcome hero if shown
  document.getElementById('welcomeHero')?.classList.add('hidden');

  // Append user message immediately
  appendUserMessage(text);

  // Show typing indicator
  const indicator = document.getElementById('typingIndicator');
  indicator.classList.remove('hidden');
  scrollToBottom();

  try {
    const res = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('unimate_token') || ''}`
      },
      body: JSON.stringify({
        message: text,
        conversationId: activeConversationId,
        clientConfig: {
          provider: localStorage.getItem('unimate_provider') || 'builtin',
          apiKey: localStorage.getItem('unimate_api_key') || null
        }
      })
    });

    const data = await res.json();
    indicator.classList.add('hidden');

    if (data.error) {
      appendAssistantMessage({
        content: `⚠️ **Error**: ${data.error}`,
        mode: 'GENERAL'
      });
      return;
    }

    activeConversationId = data.conversationId;

    // Append Assistant response with rich visual widgets
    appendAssistantMessage(data);

    // Speak if TTS enabled
    if (window.ttsEnabled) {
      speakText(data.content);
    }

    // Refresh conversation list in sidebar
    loadConversations();

  } catch (err) {
    console.error('Chat error:', err);
    indicator.classList.add('hidden');
    appendAssistantMessage({
      content: `⚠️ **Connection Error**: Failed to reach UniMate AI server. Please make sure the backend is active.`,
      mode: 'GENERAL'
    });
  }
}

// 2. Append User Message
function appendUserMessage(text) {
  const container = document.getElementById('messagesContainer');
  const msgEl = document.createElement('div');
  msgEl.className = 'flex justify-end';

  const userInitial = window.currentUser ? window.currentUser.username.slice(0, 2).toUpperCase() : 'ME';

  msgEl.innerHTML = `
    <div class="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-[#2e384d] text-gray-100 p-4 border border-white/10 shadow-lg space-y-1">
      <div class="text-xs font-semibold text-indigo-300 mb-1 flex items-center justify-end gap-1.5">
        <span>You</span>
        <div class="w-4 h-4 rounded-full bg-indigo-500/30 text-[9px] flex items-center justify-center font-mono">${userInitial}</div>
      </div>
      <div class="text-sm leading-relaxed whitespace-pre-wrap">${escapeHtml(text)}</div>
    </div>
  `;
  container.appendChild(msgEl);
  scrollToBottom();
}

// 3. Append Assistant Message
function appendAssistantMessage(data) {
  const container = document.getElementById('messagesContainer');
  const msgEl = document.createElement('div');
  msgEl.className = 'flex items-start gap-3 w-full';

  const modeBadge = getModeBadge(data.mode);
  const parsedHtml = marked.parse(data.content || '');
  const chartId = data.visualization ? 'chart-' + Math.random().toString(36).substring(2, 9) : null;

  msgEl.innerHTML = `
    <!-- UniMate Bot Avatar -->
    <div class="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20 mt-1">
      <i data-lucide="bot" class="w-4 h-4"></i>
    </div>

    <!-- Message Bubble -->
    <div class="flex-1 max-w-[92%] sm:max-w-[88%] rounded-2xl rounded-tl-sm bg-[#111827]/90 border border-white/10 p-4 md:p-5 shadow-xl space-y-3">
      <!-- Top Mode Badge -->
      <div class="flex items-center justify-between pb-1 border-b border-white/5">
        <div class="flex items-center gap-2">
          <span class="font-bold text-xs text-white">UniMate AI</span>
          ${modeBadge}
        </div>
        <div class="flex items-center gap-1 text-gray-400">
          <button onclick="copyResponseText(this)" title="Copy text" class="p-1 hover:text-white rounded hover:bg-white/10 transition-colors">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="speakResponseText(this)" title="Read aloud" class="p-1 hover:text-white rounded hover:bg-white/10 transition-colors">
            <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>

      <!-- Markdown Body -->
      <div class="markdown-body text-gray-200">
        ${parsedHtml}
      </div>

      <!-- Dynamic Embedded Visualization (Chart.js) -->
      ${data.visualization ? `
        <div class="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 mt-3">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-white text-xs flex items-center gap-1.5">
              <i data-lucide="bar-chart-2" class="w-3.5 h-3.5 text-indigo-400"></i>
              <span>${data.visualization.title || 'Data Analytics'}</span>
            </h4>
            <span class="text-[10px] uppercase font-bold text-gray-400 px-1.5 py-0.5 rounded bg-white/5">${data.visualization.type}</span>
          </div>
          <div class="h-56 relative w-full">
            <canvas id="${chartId}"></canvas>
          </div>
        </div>
      ` : ''}

      <!-- Contextual Related Question Suggestions -->
      ${data.suggested && data.suggested.length > 0 ? `
        <div class="pt-2.5 mt-2.5 border-t border-white/5 space-y-1.5">
          <div class="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
            <i data-lucide="sparkles" class="w-3 h-3 text-indigo-400"></i>
            <span>Suggested Questions:</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${data.suggested.map(prompt => `
              <button onclick="sendQuickPrompt('${escapeSingleQuotes(prompt)}')" class="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 hover:border-indigo-500/50 text-xs text-indigo-200 hover:text-white transition-all text-left flex items-center gap-1.5 group cursor-pointer shadow-sm">
                <i data-lucide="arrow-right-circle" class="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0"></i>
                <span>${escapeHtml(prompt)}</span>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  container.appendChild(msgEl);
  lucide.createIcons();
  attachCodeCopyButtons(msgEl);

  // Render Dynamic Chart if specified
  if (data.visualization && chartId) {
    setTimeout(() => {
      renderChatVisualization(chartId, data.visualization);
    }, 120);
  }

  scrollToBottom();
}

// 4. Render Dynamic Chart.js Widget in Chat
function renderChatVisualization(canvasId, viz) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (renderedCharts.has(canvasId)) {
    renderedCharts.get(canvasId).destroy();
  }

  const chart = new Chart(ctx, {
    type: viz.type || 'bar',
    data: viz.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: viz.type === 'pie' || viz.type === 'doughnut',
          labels: { color: '#9ca3af', font: { size: 11 } }
        }
      },
      scales: (viz.type === 'pie' || viz.type === 'doughnut') ? {} : {
        y: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#9ca3af', font: { size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#9ca3af', font: { size: 10 } }
        }
      }
    }
  });

  renderedCharts.set(canvasId, chart);
}

// 5. Code Copy Buttons
function attachCodeCopyButtons(container) {
  const pres = container.querySelectorAll('pre');
  pres.forEach(pre => {
    if (pre.querySelector('.copy-code-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'copy-code-btn absolute top-2 right-2 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-[10px] font-mono flex items-center gap-1 transition-colors';
    btn.innerHTML = `<i data-lucide="copy" class="w-3 h-3"></i><span>Copy</span>`;

    btn.onclick = () => {
      const code = pre.querySelector('code')?.innerText || pre.innerText;
      navigator.clipboard.writeText(code);
      btn.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-emerald-400"></i><span>Copied!</span>`;
      lucide.createIcons();
      setTimeout(() => {
        btn.innerHTML = `<i data-lucide="copy" class="w-3 h-3"></i><span>Copy</span>`;
        lucide.createIcons();
      }, 2000);
    };

    pre.appendChild(btn);
  });
  lucide.createIcons();
}

// 6. Helpers
function getModeBadge(mode) {
  switch (mode) {
    case 'UNIVERSITY':
      return `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">🎓 University Mode</span>`;
    case 'STUDENT':
      return `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">🛡️ Academic Advisor</span>`;
    case 'ANALYTICS':
    case 'ADMIN':
      return `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">📊 Campus Analytics</span>`;
    case 'MIXED':
      return `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">✨ Grounded + AI Advisor</span>`;
    default:
      return `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">🌐 Universal AI</span>`;
  }
}

function sendQuickPrompt(promptText) {
  const input = document.getElementById('messageInput');
  input.value = promptText;
  handleChatSubmit();
}

function copyResponseText(btn) {
  const bubble = btn.closest('.rounded-2xl');
  const markdownText = bubble.querySelector('.markdown-body')?.innerText || '';
  navigator.clipboard.writeText(markdownText);
  alert('Response copied to clipboard!');
}

function speakResponseText(btn) {
  const bubble = btn.closest('.rounded-2xl');
  const markdownText = bubble.querySelector('.markdown-body')?.innerText || '';
  speakText(markdownText);
}

function scrollToBottom() {
  const scrollArea = document.getElementById('chatScrollArea');
  if (scrollArea) {
    scrollArea.scrollTop = scrollArea.scrollHeight;
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeSingleQuotes(str) {
  return str.replace(/'/g, "\\'");
}

// 7. Conversations History in Sidebar
async function loadConversations() {
  const list = document.getElementById('conversationsList');
  const token = localStorage.getItem('unimate_token');
  const searchVal = document.getElementById('convSearchInput')?.value.toLowerCase().trim() || '';
  if (!list || !token) {
    if (list) list.innerHTML = '';
    return;
  }

  try {
    const res = await fetch('/api/chat/conversations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('unimate_token');
        list.innerHTML = '';
        return;
      }
      throw new Error(`Conversation request failed (${res.status}).`);
    }

    const convs = await res.json();
    if (!Array.isArray(convs)) throw new Error('Conversation response was not a list.');

    const filtered = searchVal 
      ? convs.filter(c => c.title.toLowerCase().includes(searchVal))
      : convs;

    if (filtered.length === 0) {
      list.innerHTML = `<div class="text-[11px] text-gray-500 px-2 py-3">No conversations found.</div>`;
      return;
    }

    list.innerHTML = `
      <div class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">Recent Chats</div>
      ${filtered.map(c => `
        <div onclick="selectConversation('${c.conversation_id}')" class="group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${c.conversation_id === activeConversationId ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}">
          <div class="flex items-center gap-2 overflow-hidden">
            <i data-lucide="message-square" class="w-3.5 h-3.5 shrink-0 ${c.conversation_id === activeConversationId ? 'text-indigo-400' : 'text-gray-500'}"></i>
            <span class="truncate">${escapeHtml(c.title)}</span>
          </div>
          <button onclick="deleteConversation(event, '${c.conversation_id}')" title="Delete chat" class="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity">
            <i data-lucide="trash-2" class="w-3 h-3"></i>
          </button>
        </div>
      `).join('')}
    `;

    lucide.createIcons();

  } catch (err) {
    console.error('Load convs error:', err);
  }
}

async function selectConversation(convId) {
  activeConversationId = convId;
  const container = document.getElementById('messagesContainer');
  container.innerHTML = '';
  document.getElementById('welcomeHero')?.classList.add('hidden');

  try {
    const res = await fetch(`/api/chat/conversations/${convId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('unimate_token') || ''}` }
    });
    const data = await res.json();

    if (data.messages && data.messages.length > 0) {
      for (const m of data.messages) {
        if (m.role === 'user') {
          appendUserMessage(m.content);
        } else {
          appendAssistantMessage({
            content: m.content,
            mode: m.mode,
            visualization: m.visualization,
            suggested: m.suggested
          });
        }
      }
    } else {
      document.getElementById('welcomeHero')?.classList.remove('hidden');
    }

    loadConversations();
  } catch (err) {
    console.error('Select conv error:', err);
  }
}

async function startNewChat() {
  try {
    const res = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('unimate_token') || ''}`
      },
      body: JSON.stringify({ title: 'New Conversation' })
    });
    const data = await res.json();
    activeConversationId = data.conversationId;

    document.getElementById('messagesContainer').innerHTML = '';
    document.getElementById('welcomeHero')?.classList.remove('hidden');
    document.getElementById('messageInput').focus();

    loadConversations();
  } catch (err) {
    console.error('New chat error:', err);
  }
}

async function deleteConversation(e, convId) {
  if (e) e.stopPropagation();
  if (!confirm('Are you sure you want to delete this chat?')) return;

  try {
    await fetch(`/api/chat/conversations/${convId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('unimate_token') || ''}` }
    });

    if (activeConversationId === convId) {
      startNewChat();
    } else {
      loadConversations();
    }
  } catch (err) {
    console.error('Delete conv error:', err);
  }
}

async function clearAllChats() {
  if (!confirm('Are you sure you want to clear all chat conversations?')) return;

  try {
    await fetch('/api/chat/conversations', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('unimate_token') || ''}` }
    });
    startNewChat();
  } catch (err) {
    console.error('Clear all chats error:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('chatForm')?.addEventListener('submit', handleChatSubmit);
  document.getElementById('newChatBtn')?.addEventListener('click', startNewChat);
  document.getElementById('clearChatBtn')?.addEventListener('click', () => {
    document.getElementById('messagesContainer').innerHTML = '';
    document.getElementById('welcomeHero')?.classList.remove('hidden');
  });
  document.getElementById('clearAllChatsBtn')?.addEventListener('click', clearAllChats);
  document.getElementById('convSearchInput')?.addEventListener('input', loadConversations);

  // Auto-grow textarea
  const input = document.getElementById('messageInput');
  if (input) {
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChatSubmit();
      }
    });
  }

  // Global Ctrl+K shortcut for New Chat
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      startNewChat();
    }
  });

  loadConversations();
});
