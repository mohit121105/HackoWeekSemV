// Aether Chat Assistant Client Application
// Featuring Suggestion Cards, Speech Synthesis, Markdown parsing, and Clipboard copying

// API Endpoints
const API_BASE = '/api';
const ENDPOINTS = {
  history: `${API_BASE}/history`,
  chat: `${API_BASE}/chat`
};

// DOM Elements
const sidebarEl = document.getElementById('sidebar');
const menuToggleEl = document.getElementById('menu-toggle');
const messagesContainerEl = document.getElementById('messages-container');
const welcomeHeroEl = document.getElementById('welcome-hero');
const chatFormEl = document.getElementById('chat-form');
const messageInputEl = document.getElementById('message-input');
const sendBtnEl = document.getElementById('send-btn');
const charCounterEl = document.getElementById('char-counter');
const clearBtnEl = document.getElementById('clear-btn');
const newChatBtnEl = document.getElementById('new-chat-btn');
const ttsGlobalToggleEl = document.getElementById('tts-global-toggle');
const ttsIconEl = document.getElementById('tts-icon');

// Global App State
let ttsEnabled = false;
window.messageCache = {}; // Cache raw text messages for copy/speak actions

// Initialization
async function init() {
  setupEventListeners();
  await loadHistory();
}

// Load Chat History
async function loadHistory() {
  try {
    const response = await fetch(ENDPOINTS.history);
    if (!response.ok) throw new Error('Failed to retrieve history');
    const history = await response.json();
    
    messagesContainerEl.innerHTML = '';
    window.messageCache = {};
    
    if (history.length > 0) {
      welcomeHeroEl.style.display = 'none';
      history.forEach(msg => {
        if (msg.sender === 'user') {
          appendUserMessage(msg.text, msg.timestamp);
        } else {
          appendBotMessage(msg.text, msg.timestamp);
        }
      });
      scrollToBottom();
    } else {
      welcomeHeroEl.style.display = 'block';
    }
  } catch (error) {
    console.error('History load failed:', error);
    showSystemMessage('Could not connect to the local server. Please ensure the backend is running on port 3000.');
  }
}

// Append User Message to UI
function appendUserMessage(text, time) {
  const msgEl = document.createElement('div');
  msgEl.className = 'message user';
  msgEl.innerHTML = `
    <div class="msg-sender-label">You</div>
    <div class="msg-body">${formatMessageText(text)}</div>
    <div class="msg-meta">${time}</div>
  `;
  messagesContainerEl.appendChild(msgEl);
}

// Append Bot Message to UI
function appendBotMessage(text, time) {
  const messageId = 'msg_' + Math.random().toString(36).substring(2, 9);
  window.messageCache[messageId] = text; // Cache raw response text

  const msgEl = document.createElement('div');
  msgEl.className = 'message bot';
  msgEl.innerHTML = `
    <div class="msg-sender-label">Aether</div>
    <div class="msg-body" id="${messageId}">${formatMessageText(text)}</div>
    <div class="msg-actions">
      <button class="action-btn-mini" onclick="copyMessageText(this, '${messageId}')" title="Copy to clipboard">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
      <button class="action-btn-mini speaker-btn" onclick="speakMessageText(this, '${messageId}')" title="Read response aloud">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
      </button>
    </div>
    <div class="msg-meta">${time}</div>
  `;
  messagesContainerEl.appendChild(msgEl);
}

// Show/Hide Typing Indicator
let typingIndicatorEl = null;

function showTypingIndicator() {
  if (typingIndicatorEl) return;
  
  typingIndicatorEl = document.createElement('div');
  typingIndicatorEl.className = 'message bot temp-typing';
  typingIndicatorEl.innerHTML = `
    <div class="msg-sender-label">Aether</div>
    <div class="msg-body">
      <div class="typing-wrapper">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  messagesContainerEl.appendChild(typingIndicatorEl);
  scrollToBottom();
}

function removeTypingIndicator() {
  if (typingIndicatorEl) {
    typingIndicatorEl.remove();
    typingIndicatorEl = null;
  }
}

// Show system error bubble
function showSystemMessage(text) {
  const msgEl = document.createElement('div');
  msgEl.className = 'message bot';
  msgEl.innerHTML = `
    <div class="msg-sender-label">System</div>
    <div class="msg-body" style="color: #c2410c; background-color: #fcefe9; padding: 12px 16px; border-radius: 8px; border: 1px solid #f8d3c5;">
      ${escapeHTML(text)}
    </div>
  `;
  messagesContainerEl.appendChild(msgEl);
  scrollToBottom();
}

// Send Chat Message
async function handleChatSubmit(e) {
  if (e) e.preventDefault();
  const text = messageInputEl.value.trim();
  if (!text) return;

  // Clear welcome screen on first message
  if (welcomeHeroEl.style.display !== 'none') {
    welcomeHeroEl.style.display = 'none';
  }

  // Reset Input state
  messageInputEl.value = '';
  messageInputEl.style.height = 'auto';
  sendBtnEl.classList.remove('active');
  updateCharCounter(0);

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Render user prompt
  appendUserMessage(text, timestamp);
  scrollToBottom();
  
  // Show Typing status
  showTypingIndicator();

  try {
    const startTime = Date.now();
    const response = await fetch(ENDPOINTS.chat, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });

    if (!response.ok) throw new Error('API Error');
    const data = await response.json();

    // Artificial delay to make transitions feel realistic
    const elapsed = Date.now() - startTime;
    const delay = Math.max(600 - elapsed, 0);

    setTimeout(() => {
      removeTypingIndicator();
      appendBotMessage(data.text, data.timestamp);
      scrollToBottom();

      // Trigger automatic TTS if enabled
      if (ttsEnabled) {
        const lastMsgId = Object.keys(window.messageCache).pop();
        const lastSpeakerBtn = messagesContainerEl.lastChild.previousSibling.querySelector('.speaker-btn');
        if (lastSpeakerBtn) {
          window.speakMessageText(lastSpeakerBtn, lastMsgId);
        }
      }
    }, delay);

  } catch (error) {
    console.error('Chat post failed:', error);
    removeTypingIndicator();
    showSystemMessage('Unable to send message. Connection to the REST API server was lost.');
  }
}

// Clear History
async function clearConversation() {
  if (!confirm('Are you sure you want to clear this conversation?')) return;
  
  try {
    const response = await fetch(ENDPOINTS.history, { method: 'DELETE' });
    if (!response.ok) throw new Error('Clear failed');
    
    // Stop speaking if active
    window.speechSynthesis.cancel();
    
    messagesContainerEl.innerHTML = '';
    window.messageCache = {};
    welcomeHeroEl.style.display = 'block';
  } catch (error) {
    console.error('Clear failed:', error);
    alert('Failed to clear conversation on the server.');
  }
}

// Update character count display
function updateCharCounter(length) {
  charCounterEl.textContent = `${length} / 2000`;
}

// Markdown formatting logic: supports Lists, Headers, Paragraphs, Bold, Inline code, and Copyable Codeblocks
function formatMessageText(text) {
  let lines = text.split('\n');
  let inCodeBlock = false;
  let codeBlockContent = [];
  let codeLang = '';
  let inList = false;
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Check code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        result.push(renderCodeBlock(codeLang, codeBlockContent.join('\n')));
        codeBlockContent = [];
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = line.trim().substring(3).trim() || 'code';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Check lists
    const listMatch = line.match(/^([*\-+]|\d+\.)\s+(.*)/);
    if (listMatch) {
      if (!inList) {
        inList = true;
        result.push('<ul>');
      }
      result.push(`<li>${parseInlineMarkdown(listMatch[2])}</li>`);
      continue;
    } else {
      if (inList) {
        inList = false;
        result.push('</ul>');
      }
    }

    // Check headers
    if (line.startsWith('### ')) {
      result.push(`<h3>${parseInlineMarkdown(line.substring(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      result.push(`<h2>${parseInlineMarkdown(line.substring(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      result.push(`<h1>${parseInlineMarkdown(line.substring(2))}</h1>`);
    } else if (line.trim() === '') {
      result.push('<div style="height: 10px;"></div>');
    } else {
      result.push(`<p>${parseInlineMarkdown(line)}</p>`);
    }
  }

  if (inList) {
    result.push('</ul>');
  }

  return result.join('\n');
}

// Inline formatting (bold, inline backtick code blocks)
function parseInlineMarkdown(text) {
  let escaped = escapeHTML(text);
  
  // Bold: **text**
  escaped = escaped.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
  
  // Inline Code: `code`
  escaped = escaped.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  
  return escaped;
}

// Render formatted pre block inside a container with action title and copy button
function renderCodeBlock(lang, code) {
  const uniqId = 'code_' + Math.random().toString(36).substring(2, 9);
  
  return `
    <div class="code-block-container">
      <div class="code-header-bar">
        <span class="code-lang-label">${lang || 'code'}</span>
        <button type="button" class="code-copy-btn" onclick="copyCodeText('${uniqId}')" id="${uniqId}_btn">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span class="copy-text">Copy code</span>
        </button>
      </div>
      <pre><code class="language-${lang}" id="${uniqId}">${escapeHTML(code).trim()}</code></pre>
    </div>
  `;
}

// Escape HTML utility
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Auto scroll message feed
function scrollToBottom() {
  messagesContainerEl.scrollTop = messagesContainerEl.scrollHeight;
}

// Interactive Global Functions (placed on window to be reachable by dynamically rendered HTML click attributes)

window.copyCodeText = function(codeId) {
  const codeEl = document.getElementById(codeId);
  if (!codeEl) return;
  const text = codeEl.textContent;
  
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(codeId + '_btn');
    const label = btn.querySelector('.copy-text');
    label.textContent = 'Copied!';
    setTimeout(() => {
      label.textContent = 'Copy code';
    }, 2000);
  });
};

window.copyMessageText = function(btn, messageId) {
  const rawText = window.messageCache[messageId];
  if (!rawText) return;
  
  navigator.clipboard.writeText(rawText).then(() => {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
    setTimeout(() => {
      btn.innerHTML = originalHTML;
    }, 2000);
  });
};

let activeSpeakerBtn = null;

window.speakMessageText = function(btn, messageId) {
  const rawText = window.messageCache[messageId];
  if (!rawText) return;

  // Toggle off if clicking the speaker currently speaking
  if (window.speechSynthesis.speaking && activeSpeakerBtn === btn) {
    window.speechSynthesis.cancel();
    resetSpeakerButtons();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  resetSpeakerButtons();

  const utterance = new SpeechSynthesisUtterance(rawText);
  utterance.onend = () => {
    btn.classList.remove('speaking');
    if (activeSpeakerBtn === btn) activeSpeakerBtn = null;
  };
  utterance.onerror = () => {
    btn.classList.remove('speaking');
    if (activeSpeakerBtn === btn) activeSpeakerBtn = null;
  };

  btn.classList.add('speaking');
  activeSpeakerBtn = btn;
  window.speechSynthesis.speak(utterance);
};

function resetSpeakerButtons() {
  document.querySelectorAll('.action-btn-mini').forEach(el => {
    el.classList.remove('speaking');
  });
  activeSpeakerBtn = null;
}

// Event Listeners Setup
function setupEventListeners() {
  chatFormEl.addEventListener('submit', handleChatSubmit);
  
  messageInputEl.addEventListener('input', function () {
    const len = this.value.length;
    updateCharCounter(len);
    
    // Toggle send button active class
    if (this.value.trim().length > 0) {
      sendBtnEl.classList.add('active');
    } else {
      sendBtnEl.classList.remove('active');
    }
    
    // Auto height expansion
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight - 4) + 'px';
  });

  messageInputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (this.value.trim().length > 0) {
        handleChatSubmit();
      }
    }
  });

  // Suggestion card clicks
  document.querySelectorAll('.chip-card').forEach(chip => {
    chip.addEventListener('click', function() {
      const prompt = this.dataset.prompt;
      if (!prompt) return;
      
      messageInputEl.value = prompt;
      updateCharCounter(prompt.length);
      sendBtnEl.classList.add('active');
      messageInputEl.focus();
      
      // Auto expand input field height for long prompts
      messageInputEl.style.height = 'auto';
      messageInputEl.style.height = (messageInputEl.scrollHeight - 4) + 'px';
      
      // Send immediately
      handleChatSubmit();
    });
  });

  // Global TTS toggle button
  ttsGlobalToggleEl.addEventListener('click', () => {
    ttsEnabled = !ttsEnabled;
    if (ttsEnabled) {
      ttsGlobalToggleEl.classList.add('active');
      ttsGlobalToggleEl.title = "Text-to-speech auto-play: On";
    } else {
      ttsGlobalToggleEl.classList.remove('active');
      ttsGlobalToggleEl.title = "Toggle response speak out";
      window.speechSynthesis.cancel();
      resetSpeakerButtons();
    }
  });

  // Sidebar Menu Toggle
  menuToggleEl.addEventListener('click', () => {
    sidebarEl.classList.toggle('open');
  });

  document.querySelector('.chat-workspace').addEventListener('click', () => {
    if (sidebarEl.classList.contains('open')) {
      sidebarEl.classList.remove('open');
    }
  });

  // Clear logs button
  clearBtnEl.addEventListener('click', clearConversation);

  // New Chat action
  newChatBtnEl.addEventListener('click', async () => {
    if (messagesContainerEl.children.length === 0) return;
    if (confirm('Start a new conversation? This will clear current session messages.')) {
      try {
        await fetch(ENDPOINTS.history, { method: 'DELETE' });
        window.speechSynthesis.cancel();
        messagesContainerEl.innerHTML = '';
        window.messageCache = {};
        welcomeHeroEl.style.display = 'block';
      } catch (e) {
        console.error(e);
      }
    }
  });
}

// Run app init on load
document.addEventListener('DOMContentLoaded', init);
