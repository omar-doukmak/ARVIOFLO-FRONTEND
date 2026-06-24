(function() {
  // Read config
  var config = window.ArvioChatConfig || {};
  var API_URL = config.apiUrl || 'https://api.arvioflo.com';
  var API_KEY = config.apiKey || '';

  // Create container
  var host = document.createElement('div');
  host.id = 'arvio-widget-host';
  document.body.appendChild(host);

  // Shadow DOM isolates all styles
  var shadow = host.attachShadow({ mode: 'open' });

  // Load font
  var fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap';
  fontLink.rel = 'stylesheet';
  shadow.appendChild(fontLink);

  // Styles
  var style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :host { all: initial; font-family: 'DM Sans', sans-serif; }

    .arvio-trigger {
      position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
      width: 60px; height: 60px; border-radius: 50%; border: none;
      background: linear-gradient(135deg, #1a2b5e 0%, #2a6e9e 100%);
      color: #fff; cursor: pointer;
      box-shadow: 0 4px 20px rgba(26,43,94,0.30);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      font-family: 'DM Sans', sans-serif;
    }
    .arvio-trigger:hover { transform: scale(1.06); box-shadow: 0 6px 28px rgba(26,43,94,0.38); }
    .arvio-trigger svg { width: 28px; height: 28px; stroke: #fff; fill: none; stroke-width: 1.8; }
    .arvio-trigger.hidden { display: none !important; }

    .arvio-window {
      position: fixed; bottom: 96px; right: 24px; z-index: 2147483646;
      width: 380px; height: 520px;
      background: #ffffff; border: 1px solid rgba(26,43,94,0.10);
      border-radius: 14px; overflow: hidden;
      display: none; flex-direction: column;
      box-shadow: 0 8px 40px rgba(26,43,94,0.15);
      font-family: 'DM Sans', sans-serif;
      transition: all 0.25s ease;
    }
    .arvio-window.open { display: flex; }
    .arvio-window.maximized {
      width: 100vw; height: 100vh; bottom: 0; right: 0;
      border-radius: 0;
    }
    .arvio-window.maximized .arvio-msgs { padding: 28px 24px; gap: 16px; }
    .arvio-window.maximized .arvio-bubble { font-size: 16px; padding: 14px 18px; }
    .arvio-window.maximized .arvio-input-area { padding: 16px 24px; }
    .arvio-window.maximized .arvio-input { font-size: 16px; }
    .arvio-window.maximized .arvio-input-row { padding: 14px 16px; border-radius: 16px; }
    .arvio-window.maximized .arvio-send { width: 36px; height: 36px; }
    .arvio-window.maximized .arvio-header { padding: 18px 24px; }
    .arvio-window.maximized .arvio-header-name { font-size: 17px; }
    .arvio-window.maximized .arvio-header-role { font-size: 13px; }
    .arvio-window.maximized .arvio-footer { padding: 10px; font-size: 12px; }
    .arvio-window.maximized .arvio-msg { max-width: 680px; }

    .arvio-header {
      padding: 14px 16px; display: flex; align-items: center; gap: 10px;
      background: linear-gradient(135deg, #1a2b5e 0%, #2a6e9e 100%);
      color: #fff; flex-shrink: 0;
    }
    .arvio-header-info { flex: 1; }
    .arvio-header-name { font-size: 15px; font-weight: 600; color: #fff; }
    .arvio-header-role { font-size: 12px; opacity: 0.75; color: #fff; }
    .arvio-header-actions { display: flex; gap: 4px; }
    .arvio-header-btn {
      width: 28px; height: 28px; border: none;
      background: rgba(255,255,255,0.12); border-radius: 6px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .arvio-header-btn:hover { background: rgba(255,255,255,0.25); }
    .arvio-header-btn svg { width: 14px; height: 14px; stroke: #fff; stroke-width: 2; fill: none; }

    .arvio-msgs {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
      background: #f5f7fa; scroll-behavior: smooth;
    }
    .arvio-msgs::-webkit-scrollbar { width: 3px; }
    .arvio-msgs::-webkit-scrollbar-track { background: transparent; }
    .arvio-msgs::-webkit-scrollbar-thumb { background: rgba(26,43,94,0.15); border-radius: 3px; }

    .arvio-msg { max-width: 85%; width: fit-content; animation: arvioFadeUp 0.25s ease both; }
    .arvio-msg.user { align-self: flex-end; }
    @keyframes arvioFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .arvio-bubble {
      padding: 10px 14px; border-radius: 12px; font-size: 14px;
      line-height: 1.55; unicode-bidi: plaintext; text-align: start;
      font-family: 'DM Sans', sans-serif; color: #1a2b5e;
    }
    .arvio-msg.bot .arvio-bubble {
      background: #ffffff; border: 1px solid rgba(26,43,94,0.10);
      border-bottom-left-radius: 4px; color: #1a2b5e;
    }
    .arvio-msg.user .arvio-bubble {
      background: linear-gradient(135deg, #1a2b5e 0%, #2a6e9e 100%);
      color: #fff; border-bottom-right-radius: 4px;
    }
    .arvio-bubble a { color: #2a8cb5; text-decoration: underline; }
    .arvio-bubble img { max-width: 100%; border-radius: 6px; margin-top: 6px; display: block; }

    @keyframes arvioDotFade { 0%,100% { opacity: 0.2; } 50% { opacity: 1; } }
    .arvio-dots { display: flex; gap: 5px; padding: 3px 2px; }
    .arvio-dot {
      width: 6px; height: 6px; background: #1a2b5e; border-radius: 50%;
      animation: arvioDotFade 1.4s ease-in-out infinite;
    }
    .arvio-dot:nth-child(2) { animation-delay: 0.2s; }
    .arvio-dot:nth-child(3) { animation-delay: 0.4s; }
    .arvio-slow { font-size: 11px; color: rgba(26,43,94,0.30); font-style: italic; margin-top: 5px; }

    .arvio-input-area {
      padding: 12px; border-top: 1px solid rgba(26,43,94,0.10);
      background: #ffffff; flex-shrink: 0;
    }
    .arvio-input-row {
      display: flex; gap: 8px; align-items: center;
      background: #f5f7fa; border: 1px solid rgba(26,43,94,0.10);
      border-radius: 12px; padding: 10px 12px; transition: border-color 0.2s;
    }
    .arvio-input-row:hover { border-color: rgba(26,43,94,0.30); }
    .arvio-input-row:focus-within { border-color: #1a2b5e; }
    .arvio-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: #1a2b5e; font-family: 'DM Sans', sans-serif; font-size: 14px;
      resize: none; max-height: 80px; line-height: 1.5; margin: 0; padding: 0;
    }
    .arvio-input::placeholder { color: rgba(26,43,94,0.30); }
    .arvio-send {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #1a2b5e 0%, #2a6e9e 100%);
      border: none; border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.18s; flex-shrink: 0;
    }
    .arvio-send:hover { opacity: 0.8; }
    .arvio-send:disabled { opacity: 0.3; cursor: default; }
    .arvio-send svg { width: 13px; height: 13px; stroke: #fff; stroke-width: 2.5; fill: none; }

    .arvio-footer {
      text-align: center; padding: 6px; font-size: 11px;
      color: rgba(26,43,94,0.50); background: #ffffff;
      border-top: 1px solid rgba(26,43,94,0.10);
      font-family: 'DM Sans', sans-serif;
    }
    .arvio-footer a { color: #2a8cb5; text-decoration: none; }

    @media (max-width: 500px) {
      .arvio-trigger { bottom: 16px; right: 16px; width: 54px; height: 54px; }
      .arvio-trigger svg { width: 24px; height: 24px; }
      .arvio-window {
        width: calc(100vw - 24px); height: 70vh;
        bottom: 80px; right: 12px; border-radius: 14px;
      }
      .arvio-window.maximized {
        width: 100vw; height: 100vh;
        bottom: 0; right: 0; border-radius: 0;
        padding-top: env(safe-area-inset-top, 0px);
      }
    }
  `;
  shadow.appendChild(style);

  // HTML
  var wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <button class="arvio-trigger" id="arvioTrigger">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    </button>
    <div class="arvio-window" id="arvioWindow">
      <div class="arvio-header">
        <div class="arvio-header-info">
          <div class="arvio-header-name">Arvio</div>
          <div class="arvio-header-role">AI Assistant</div>
        </div>
        <div class="arvio-header-actions">
          <button class="arvio-header-btn" id="arvioMax" title="Maximize">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          </button>
          <button class="arvio-header-btn" id="arvioClose" title="Close">
            <svg viewBox="0 0 24 24" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div class="arvio-msgs" id="arvioMsgs"></div>
      <div class="arvio-input-area">
        <div class="arvio-input-row">
          <textarea class="arvio-input" id="arvioInput" placeholder="Ask us anything..." rows="1"></textarea>
          <button class="arvio-send" id="arvioSend">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
          </button>
        </div>
      </div>
      <div class="arvio-footer">Powered by <a href="https://arvioflo.com" target="_blank">Arvioflo</a></div>
    </div>
  `;
  shadow.appendChild(wrapper);

  // References
  var trigger = shadow.getElementById('arvioTrigger');
  var win = shadow.getElementById('arvioWindow');
  var msgs = shadow.getElementById('arvioMsgs');
  var input = shadow.getElementById('arvioInput');
  var sendBtn = shadow.getElementById('arvioSend');
  var maxBtn = shadow.getElementById('arvioMax');
  var closeBtn = shadow.getElementById('arvioClose');

  var sessionId = crypto.randomUUID();
  var initialized = false;
  var maximized = false;

  // Toggle
  trigger.addEventListener('click', function() {
    win.classList.toggle('open');
    trigger.classList.toggle('hidden');
    if (!initialized) {
      initialized = true;
      setTimeout(function() { addBot("Hello! How can we help you today?"); }, 400);
    }
  });

  // Maximize
  maxBtn.addEventListener('click', function() {
    maximized = !maximized;
    win.classList.toggle('maximized', maximized);
  });

  // Close
  closeBtn.addEventListener('click', function() {
    win.classList.remove('open', 'maximized');
    trigger.classList.remove('hidden');
    maximized = false;
  });

  // Click outside to close
  document.addEventListener('click', function(e) {
    if (win.classList.contains('open') && !host.contains(e.target)) {
      win.classList.remove('open', 'maximized');
      trigger.classList.remove('hidden');
      maximized = false;
    }
  });

  // Add bot message
  function addBot(text, imageUrl) {
    var m = document.createElement('div');
    m.className = 'arvio-msg bot';
    var img = imageUrl ? '<img src="' + imageUrl + '" />' : '';
    m.innerHTML = '<div class="arvio-bubble">' + linkify(text) + img + '</div>';
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // Add user message
  function addUser(text) {
    var m = document.createElement('div');
    m.className = 'arvio-msg user';
    m.innerHTML = '<div class="arvio-bubble">' + escapeHTML(text) + '</div>';
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // Typing indicator
  function showTyping() {
    var t = document.createElement('div');
    t.id = 'arvioTyping';
    t.className = 'arvio-msg bot';
    t.innerHTML = '<div class="arvio-bubble"><div class="arvio-dots"><div class="arvio-dot"></div><div class="arvio-dot"></div><div class="arvio-dot"></div></div></div>';
    msgs.appendChild(t);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    var t = shadow.getElementById('arvioTyping');
    if (t) t.remove();
  }

  // Send
  function sendMessage() {
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    addUser(text);
    sendBtn.disabled = true;
    showTyping();

    var timeout = setTimeout(function() {
      var t = shadow.getElementById('arvioTyping');
      if (t && !t.querySelector('.arvio-slow')) {
        var note = document.createElement('div');
        note.className = 'arvio-slow';
        note.textContent = 'Still thinking...';
        t.querySelector('.arvio-bubble').appendChild(note);
      }
    }, 10000);

    fetch(API_URL + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ message: text, session_id: sessionId })
    })
    .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(data) {
      clearTimeout(timeout); removeTyping();
      addBot(data.reply, data.image_url);
      sendBtn.disabled = false;
    })
    .catch(function() {
      clearTimeout(timeout); removeTyping();
      addBot("Sorry, I'm having trouble connecting. Please try again.");
      sendBtn.disabled = false;
    });
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  input.addEventListener('input', function() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  });

  function linkify(text) {
    text = text.replace(/Image:\s*/gi, '');
    return text.replace(/(https?:\/\/[^\s]+)/g, function(url) {
      if (url.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
        return '<img src="' + url + '" />';
      }
      return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
    });
  }

  function escapeHTML(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
})();
