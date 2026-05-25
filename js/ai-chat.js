// Simple AI Chat Overlay for ExploreMath
// Uses OpenAI API (GPT-3.5/4, user-provided API Key, stored in browser only)

(function() {
  // Styles for floating button and chat window
  const style = document.createElement('style');
  style.innerHTML = `
  .ai-fab-btn {position:fixed;bottom:2rem;right:2.2rem;z-index:9002;padding:.9rem 1.6rem;background:linear-gradient(120deg,#7c6dfa,#3dd6f5);color:#fff;font-family:'Syne',sans-serif;font-weight:900;font-size:1.11rem;border-radius:25px;box-shadow:0 4px 24px rgba(85,75,250,.34);border:none;display:flex;align-items:center;gap:.65rem;cursor:pointer;transition:transform .18s}
  .ai-fab-btn:hover {transform:scale(1.07);}
  #ai-chatbox {position:fixed;bottom:5.8rem;right:2.4rem;z-index:9003;width:360px;max-width:94vw;background:#181c25;border-radius:19px;box-shadow:0 16px 60px #0a0a0c70;padding:0;display:none;flex-direction:column;overflow:hidden}
  #ai-chatbox.open {display:flex;}
  #ai-chat-header {background:linear-gradient(90deg,#7c6dfa 40%,#3dd6f5 100%);color:#fff;font-weight:900;font-family:'Syne',sans-serif;padding:1.1rem 1.2rem;display:flex;align-items:center;justify-content:space-between;font-size:1.13rem;}
  #ai-chat-header button {background:none;border:none;color:#fff;font-size:1.2rem;font-weight:900;cursor:pointer}
  #ai-chat-history {background:#12151f;padding:1.2rem 1.18rem;height:280px;max-height:33vh;overflow-y:auto;font-size:1.01rem;display:flex;flex-direction:column;gap:.65rem;}
  .ai-msg {margin-bottom:.4rem;}
  .ai-msg.user {align-self:flex-end;background:linear-gradient(90deg,#3dd6f5 30%,#7c6dfa 100%);color:#181c25;padding:.49rem 1.1rem;border-radius:13px 13px 3px 13px;max-width:80%;}
  .ai-msg.assistant {align-self:flex-start;background:#232940;color:#f8fafb;padding:.49rem 1.1rem;border-radius:13px 13px 13px 3px;max-width:90%;white-space:pre-wrap;}
  #ai-chatbox form {display:flex;padding:1rem 1rem 1rem 1.09rem;background:#191b20}
  #ai-chatbox input, #ai-apikey-input {flex:1;border-radius:7px;border:1.5px solid #383b47;padding:.65rem 1rem;font-size:1rem;background:#171a22;color:#eaeaea;font-family:'DM Sans',sans-serif;margin-right:.7rem}
  #ai-chatbox button[type=submit] {background:linear-gradient(100deg,#33d8e2,#836dfa 87%);color:#fff;font-weight:900;border:none; border-radius:7px; padding:.66rem 1.3rem; font-size:.99rem;cursor:pointer;transition:all .15s}
  #ai-apikey-zone {padding:.7rem 1.13rem;background:#181c25;display:flex;flex-direction:column;gap:.6rem;}
  #ai-apikey-zonelabel {color:#8cd8f7;font-size:.98rem;font-weight:700;letter-spacing:.02em;}
  #ai-apikey-input {margin:0 0 0 0;width:100%;box-sizing:border-box}
  #ai-apikey-save {background:linear-gradient(100deg,#36e8e2,#736dfd 87%);color:#fff;font-weight:700;border:none; border-radius:7px; padding:.4rem 1.1rem; font-size:.99rem;cursor:pointer;margin-top:3px}
  #ai-apierror {color:#fd5666;font-size:.92rem;font-weight:700;}
  `;
  document.head.appendChild(style);

  // Insert the floating button
  const aiBtn = document.createElement('button');
  aiBtn.className = 'ai-fab-btn';
  aiBtn.innerHTML = '💬 Ask AI';
  aiBtn.onclick = function() {
    aiChatbox.classList.toggle('open');
    if (aiChatbox.classList.contains('open')) aiMsgInput.focus();
    scrollChatToBottom();
  };
  document.body.appendChild(aiBtn);

  // Insert the chatbox
  const aiChatbox = document.createElement('div');
  aiChatbox.id = 'ai-chatbox';
  aiChatbox.innerHTML = `
    <div id="ai-chat-header">ExploreMath AI <button title="Close AI" onclick="this.closest('#ai-chatbox').classList.remove('open')">✕</button></div>
    <div id="ai-chat-history"><div class="ai-msg assistant">👋 Hello! I am your ExploreMath AI Tutor. You can ask me about math, science, or this platform!</div></div>
    <div id="ai-apikey-zone">
      <div id="ai-apikey-zonelabel">Paste your OpenAI API key here &nbsp;<a href='https://platform.openai.com/api-keys' target='_blank' style='color:#3dd6f5;text-decoration:underline'>(get it)</a></div>
      <input id="ai-apikey-input" type="password" placeholder="sk-..." autocomplete="off">
      <button id="ai-apikey-save">Save Key</button>
      <div id="ai-apierror"></div>
    </div>
    <form>
      <input id="ai-msg-input" type="text" required autocomplete="off" placeholder="Type your question..." />
      <button type="submit">➤</button>
    </form>
  `;
  document.body.appendChild(aiChatbox);

  const aiHistory = aiChatbox.querySelector('#ai-chat-history');
  const aiMsgInput = aiChatbox.querySelector('#ai-msg-input');
  const apiKeyZone = aiChatbox.querySelector('#ai-apikey-zone');
  const apiKeyInput = aiChatbox.querySelector('#ai-apikey-input');
  const apiKeySave = aiChatbox.querySelector('#ai-apikey-save');
  const apiKeyError = aiChatbox.querySelector('#ai-apierror');

  // LocalStorage helpers for API key
  const LS_KEY = 'exploremath_openai_key';
  function getKey() {return localStorage.getItem(LS_KEY) || ''}
  function setKey(v) {localStorage.setItem(LS_KEY,v||'')}

  // Restore key
  apiKeyInput.value = getKey();
  if (getKey()) apiKeyZone.style.display = 'none';
  else apiKeyZone.style.display = '';

  apiKeySave.onclick = function() {
    if (/^sk-/.test(apiKeyInput.value.trim())) {
      setKey(apiKeyInput.value.trim());
      apiKeyZone.style.display = 'none';
      apiKeyError.textContent = '';
    } else {
      apiKeyError.textContent = 'API key must start with sk-...';
    }
  };

  aiChatbox.querySelector('form').onsubmit = async function(e) {
    e.preventDefault();
    if (!getKey()) { apiKeyZone.style.display = ''; apiKeyInput.focus(); return; }
    const msg = aiMsgInput.value.trim();
    if (!msg) return;
    aiMsgInput.value = '';
    addMsg(msg,'user');
    addMsg('⏳ Thinking...','assistant');
    scrollChatToBottom();
    try {
      const answer = await fetchAI(msg);
      replaceLastMsg(answer,'assistant');
    } catch (err) {
      replaceLastMsg('[AI error: '+(err.message||'unknown error')+']','assistant');
    }
    scrollChatToBottom();
  };

  function addMsg(text,role) {
    const el = document.createElement('div');
    el.className = 'ai-msg ' + role;
    el.textContent = text;
    aiHistory.appendChild(el);
    scrollChatToBottom();
  }
  function replaceLastMsg(text,role) {
    const ms = aiHistory.querySelectorAll('.ai-msg.'+role);
    if (ms.length) ms[ms.length-1].textContent = text;
    scrollChatToBottom();
  }
  function scrollChatToBottom() { aiHistory.scrollTop = aiHistory.scrollHeight+120; }

  // Call OpenAI API
  async function fetchAI(question) {
    const messages = Array.from(aiHistory.querySelectorAll('.ai-msg'))
      .filter(m => m.textContent.trim() && (m.classList.contains('user') || m.classList.contains('assistant')))
      .map(m => ({role: m.classList.contains('user')?'user':'assistant', content: m.textContent.trim()}));
    messages.push({role:'user', content: question});
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json', 'Authorization':'Bearer '+getKey()
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 900
      })
    });
    if (!resp.ok) throw new Error("API error
"+resp.status);
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim()||'[No answer received]';
  }
})();
