// HackoWeek Bot — Client Application
// DeepSeek-style UI with Gemini 2.5 Flash backend

const API_BASE = '/api';
const ENDPOINTS = { history: `${API_BASE}/history`, chat: `${API_BASE}/chat` };

// DOM refs
const sidebarEl         = document.getElementById('sidebar');
const sidebarOverlayEl  = document.getElementById('sidebar-overlay');
const menuToggleEl      = document.getElementById('menu-toggle');
const messagesEl        = document.getElementById('messages-container');
const welcomeScreenEl   = document.getElementById('welcome-screen');
const chatFormEl        = document.getElementById('chat-form');
const messageInputEl    = document.getElementById('message-input');
const sendBtnEl         = document.getElementById('send-btn');
const charCounterEl     = document.getElementById('char-counter');
const clearBtnEl        = document.getElementById('clear-btn');
const newChatBtnEl      = document.getElementById('new-chat-btn');
const ttsToggleEl       = document.getElementById('tts-global-toggle');
const chatAreaEl        = document.getElementById('chat-area');

// State
let ttsEnabled = false;
let activeSpeakerBtn = null;
window.messageCache = {};

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  setupEventListeners();
  await loadHistory();
}

// ─── Load History ─────────────────────────────────────────────────────────────
async function loadHistory() {
  try {
    const res = await fetch(ENDPOINTS.history);
    if (!res.ok) throw new Error('History fetch failed');
    const history = await res.json();

    messagesEl.innerHTML = '';
    window.messageCache = {};

    if (history.length > 0) {
      hideWelcome();
      history.forEach(msg => {
        if (msg.sender === 'user') appendUserMessage(msg.text, msg.timestamp);
        else appendBotMessage(msg.text, msg.timestamp);
      });
      scrollToBottom();
    } else {
      showWelcome();
    }
  } catch (err) {
    console.error('History load error:', err);
    showSystemMessage('Could not connect to server. Make sure the backend is running on port 3000.');
  }
}

// ─── Show / Hide Welcome ──────────────────────────────────────────────────────
function showWelcome() { if (welcomeScreenEl) welcomeScreenEl.style.display = 'flex'; }
function hideWelcome() { if (welcomeScreenEl) welcomeScreenEl.style.display = 'none'; }

// ─── Append Messages ──────────────────────────────────────────────────────────
function appendUserMessage(text, time) {
  const el = document.createElement('div');
  el.className = 'message user';
  el.innerHTML = `
    <div class="msg-inner">
      <div class="msg-avatar user-av">Y</div>
      <div class="msg-content">
        <div class="msg-name">You</div>
        <div class="msg-text">${formatMessageText(text)}</div>
        <div class="msg-time">${time}</div>
      </div>
    </div>`;
  messagesEl.appendChild(el);
}

function appendBotMessage(text, time) {
  const msgId = 'msg_' + Math.random().toString(36).substring(2, 9);
  window.messageCache[msgId] = text;

  const el = document.createElement('div');
  el.className = 'message bot';
  el.innerHTML = `
    <div class="msg-inner">
      <div class="msg-avatar bot-av">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
      <div class="msg-content">
        <div class="msg-name">HackoWeek Bot</div>
        <div class="msg-text" id="${msgId}">${formatMessageText(text)}</div>
        <div class="msg-actions">
          <button class="msg-action-btn" onclick="copyMessageText(this,'${msgId}')" title="Copy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          </button>
          <button class="msg-action-btn speaker-btn" onclick="speakMessageText(this,'${msgId}')" title="Read aloud">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            Listen
          </button>
        </div>
        <div class="msg-time">${time}</div>
      </div>
    </div>`;
  messagesEl.appendChild(el);
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
let typingEl = null;

function showTypingIndicator() {
  if (typingEl) return;
  typingEl = document.createElement('div');
  typingEl.className = 'message bot temp-typing';
  typingEl.innerHTML = `
    <div class="msg-inner">
      <div class="msg-avatar bot-av">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
      <div class="msg-content">
        <div class="msg-name">HackoWeek Bot</div>
        <div class="msg-text">
          <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </div>
    </div>`;
  messagesEl.appendChild(typingEl);
  scrollToBottom();
}

function removeTypingIndicator() {
  if (typingEl) { typingEl.remove(); typingEl = null; }
}

// ─── System Error Message ─────────────────────────────────────────────────────
function showSystemMessage(text) {
  const el = document.createElement('div');
  el.className = 'message bot system-msg';
  el.innerHTML = `
    <div class="msg-inner">
      <div class="msg-content">
        <div class="msg-name">System</div>
        <div class="msg-text">${escapeHTML(text)}</div>
      </div>
    </div>`;
  messagesEl.appendChild(el);
  scrollToBottom();
}

// ─── Send Message ─────────────────────────────────────────────────────────────
async function handleChatSubmit(e) {
  if (e) e.preventDefault();
  const text = messageInputEl.value.trim();
  if (!text) return;

  hideWelcome();

  // Reset input
  messageInputEl.value = '';
  messageInputEl.style.height = 'auto';
  sendBtnEl.disabled = true;
  updateCharCounter(0);

  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  appendUserMessage(text, ts);
  scrollToBottom();
  showTypingIndicator();

  try {
    const t0 = Date.now();
    const res = await fetch(ENDPOINTS.chat, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();

    const delay = Math.max(500 - (Date.now() - t0), 0);
    setTimeout(() => {
      removeTypingIndicator();
      appendBotMessage(data.text, data.timestamp);
      scrollToBottom();

      // Auto TTS
      if (ttsEnabled) {
        const lastId = Object.keys(window.messageCache).pop();
        const lastBtn = messagesEl.lastElementChild?.querySelector('.speaker-btn');
        if (lastBtn && lastId) window.speakMessageText(lastBtn, lastId);
      }
    }, delay);

  } catch (err) {
    console.error('Chat error:', err);
    removeTypingIndicator();
    showSystemMessage('Failed to get a response. Check your server connection.');
  }
}

// ─── Clear / New Chat ─────────────────────────────────────────────────────────
async function clearConversation() {
  if (!confirm('Clear this conversation?')) return;
  try {
    await fetch(ENDPOINTS.history, { method: 'DELETE' });
    window.speechSynthesis.cancel();
    messagesEl.innerHTML = '';
    window.messageCache = {};
    showWelcome();
  } catch {
    alert('Failed to clear conversation.');
  }
}

// ─── Char counter ─────────────────────────────────────────────────────────────
function updateCharCounter(len) { charCounterEl.textContent = `${len} / 4000`; }

// ─── Markdown Formatter ───────────────────────────────────────────────────────
function formatMessageText(text) {
  const lines = text.split('\n');
  let inCode = false, codeBuf = [], codeLang = '';
  let inList = false;
  const out = [];

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCode) {
        inCode = false;
        out.push(renderCodeBlock(codeLang, codeBuf.join('\n')));
        codeBuf = []; codeLang = '';
      } else {
        inCode = true;
        codeLang = line.trim().slice(3).trim() || 'code';
      }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    const listMatch = line.match(/^([*\-+]|(\d+)\.)[ \t]+(.*)/);
    if (listMatch) {
      const tag = listMatch[2] ? 'ol' : 'ul';
      if (!inList) { inList = tag; out.push(`<${tag}>`); }
      out.push(`<li>${parseInline(listMatch[3])}</li>`);
      continue;
    } else if (inList) { out.push(`</${inList}>`); inList = false; }

    if      (line.startsWith('### ')) out.push(`<h3>${parseInline(line.slice(4))}</h3>`);
    else if (line.startsWith('## '))  out.push(`<h2>${parseInline(line.slice(3))}</h2>`);
    else if (line.startsWith('# '))   out.push(`<h1>${parseInline(line.slice(2))}</h1>`);
    else if (line.trim() === '')      out.push('<div style="height:8px"></div>');
    else                              out.push(`<p>${parseInline(line)}</p>`);
  }

  if (inCode)  out.push(renderCodeBlock(codeLang, codeBuf.join('\n')));
  if (inList)  out.push(`</${inList}>`);
  return out.join('\n');
}

function parseInline(text) {
  let s = escapeHTML(text);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  return s;
}

function renderCodeBlock(lang, code) {
  const id = 'cb_' + Math.random().toString(36).slice(2, 9);
  return `
    <div class="code-block-container">
      <div class="code-header-bar">
        <span class="code-lang-label">${lang || 'code'}</span>
        <button type="button" class="code-copy-btn" onclick="copyCodeText('${id}')" id="${id}_btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span class="copy-text">Copy</span>
        </button>
      </div>
      <pre><code id="${id}">${escapeHTML(code).trim()}</code></pre>
    </div>`;
}

function escapeHTML(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
           .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function scrollToBottom() {
  chatAreaEl.scrollTop = chatAreaEl.scrollHeight;
}

// ─── Global Actions ───────────────────────────────────────────────────────────
window.copyCodeText = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    const btn = document.getElementById(id + '_btn');
    const lbl = btn.querySelector('.copy-text');
    lbl.textContent = 'Copied!';
    setTimeout(() => lbl.textContent = 'Copy', 2000);
  });
};

window.copyMessageText = function(btn, id) {
  const raw = window.messageCache[id];
  if (!raw) return;
  navigator.clipboard.writeText(raw).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
    setTimeout(() => btn.innerHTML = orig, 2000);
  });
};

window.speakMessageText = function(btn, id) {
  const raw = window.messageCache[id];
  if (!raw) return;
  if (window.speechSynthesis.speaking && activeSpeakerBtn === btn) {
    window.speechSynthesis.cancel(); resetSpeakers(); return;
  }
  window.speechSynthesis.cancel(); resetSpeakers();
  const utt = new SpeechSynthesisUtterance(raw);
  utt.onend = utt.onerror = () => { btn.classList.remove('speaking'); if (activeSpeakerBtn === btn) activeSpeakerBtn = null; };
  btn.classList.add('speaking');
  activeSpeakerBtn = btn;
  window.speechSynthesis.speak(utt);
};

function resetSpeakers() {
  document.querySelectorAll('.speaker-btn').forEach(b => b.classList.remove('speaking'));
  activeSpeakerBtn = null;
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
function setupEventListeners() {
  chatFormEl.addEventListener('submit', handleChatSubmit);

  messageInputEl.addEventListener('input', function() {
    const len = this.value.length;
    updateCharCounter(len);
    sendBtnEl.disabled = this.value.trim().length === 0;
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
  });

  messageInputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (this.value.trim()) handleChatSubmit();
    }
  });

  // Suggestion cards
  document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.dataset.prompt;
      if (!prompt) return;
      messageInputEl.value = prompt;
      updateCharCounter(prompt.length);
      sendBtnEl.disabled = false;
      messageInputEl.style.height = 'auto';
      messageInputEl.style.height = Math.min(messageInputEl.scrollHeight, 200) + 'px';
      handleChatSubmit();
    });
  });

  // TTS toggle
  ttsToggleEl.addEventListener('click', () => {
    ttsEnabled = !ttsEnabled;
    ttsToggleEl.classList.toggle('active', ttsEnabled);
    ttsToggleEl.title = ttsEnabled ? 'Voice readout: ON' : 'Toggle voice readout';
    if (!ttsEnabled) { window.speechSynthesis.cancel(); resetSpeakers(); }
  });

  // Sidebar toggle (mobile)
  menuToggleEl.addEventListener('click', e => {
    e.stopPropagation();
    sidebarEl.classList.toggle('open');
    sidebarOverlayEl.classList.toggle('visible');
  });

  sidebarOverlayEl.addEventListener('click', () => {
    sidebarEl.classList.remove('open');
    sidebarOverlayEl.classList.remove('visible');
  });

  // Clear
  clearBtnEl.addEventListener('click', clearConversation);

  // New Chat
  newChatBtnEl.addEventListener('click', async () => {
    if (messagesEl.children.length === 0) return;
    if (!confirm('Start a new chat? Current session will be cleared.')) return;
    try {
      await fetch(ENDPOINTS.history, { method: 'DELETE' });
      window.speechSynthesis.cancel();
      messagesEl.innerHTML = '';
      window.messageCache = {};
      showWelcome();
    } catch (e) { console.error(e); }
  });
}

// Boot
document.addEventListener('DOMContentLoaded', init);
