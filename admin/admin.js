const CONTACT_WHATSAPP = '2349071612635';
const tabButtons = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
const userEmail = document.getElementById('user-email');
const messagesBody = document.getElementById('messages-body');
const feedbackList = document.getElementById('feedback-list');
const advisoryList = document.getElementById('advisory-list');

function setActiveTab(name) {
  tabButtons.forEach(button => button.classList.toggle('is-active', button.dataset.tab === name));
  panels.forEach(panel => panel.classList.toggle('is-active', panel.id === `panel-${name}`));
}

tabButtons.forEach(button => {
  button.addEventListener('click', () => setActiveTab(button.dataset.tab));
});

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (response.status === 401 || response.status === 403 || response.status === 503) {
    showAccessNotice(response.status);
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function showAccessNotice(status) {
  if (document.querySelector('.alert-box')) return;
  const alertBox = document.createElement('div');
  alertBox.className = 'alert-box';
  const message = status === 503
    ? 'Admin authentication is not configured. Configure Cloudflare Access before using this dashboard.'
    : 'Cloudflare Access is required. Open this dashboard through the protected admin URL.';
  alertBox.innerHTML = `<span>${message}</span><button type="button" id="reload-admin">Reload</button>`;
  document.querySelector('main').prepend(alertBox);
  document.getElementById('reload-admin').addEventListener('click', () => location.reload());
}

async function loadWhoAmI() {
  try {
    const data = await api('/api/admin/whoami');
    const email = data.user && data.user.email ? data.user.email : 'Unknown user';
    userEmail.textContent = email;
  } catch (error) {
    userEmail.textContent = 'Unknown';
  }
}

function renderMessages(rows) {
  messagesBody.innerHTML = rows.map(item => `
    <tr>
      <td>${new Date(item.created_at).toLocaleString()}</td>
      <td>${escapeHtml(item.type || '')}</td>
      <td>${escapeHtml(item.name || '')}</td>
      <td>${escapeHtml(item.company || '')}</td>
      <td>${escapeHtml(item.service || '')}</td>
      <td>${escapeHtml([item.origin, item.destination].filter(Boolean).join(' → '))}</td>
      <td>
        <select class="status-select" data-id="${Number(item.id)}" data-status="${escapeHtml(item.status || 'new')}">
          <option value="new" ${item.status === 'new' ? 'selected' : ''}>New</option>
          <option value="contacted" ${item.status === 'contacted' ? 'selected' : ''}>Contacted</option>
          <option value="quoted" ${item.status === 'quoted' ? 'selected' : ''}>Quoted</option>
          <option value="closed" ${item.status === 'closed' ? 'selected' : ''}>Closed</option>
        </select>
      </td>
      <td>
        <a href="https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(`Hello ${item.name || 'there'},\nThanks for reaching out about ${item.service || 'your request'}.`)}" target="_blank" rel="noopener noreferrer">WA</a>
      </td>
    </tr>
    <tr>
      <td colspan="8">
        <div class="message-detail">
          <strong>Email:</strong> ${escapeHtml(item.email || '—')}<br>
          <strong>Phone:</strong> ${escapeHtml(item.phone || '—')}<br>
          ${escapeHtml(item.message || 'No message provided.')}
        </div>
      </td>
    </tr>
  `).join('');

  messagesBody.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', async event => {
      const id = Number(event.target.dataset.id);
      const status = event.target.value;
      try {
        await api('/api/admin/messages', {
          method: 'PATCH',
          body: JSON.stringify({ id, status })
        });
      } catch (error) {
        // ignore, UI already shows expired state
      }
    });
  });
}

async function loadMessages() {
  try {
    const rows = await api('/api/admin/messages');
    renderMessages(rows || []);
  } catch (error) {
    // no-op
  }
}

async function loadFeedback() {
  try {
    const rows = await api('/api/admin/feedback');
    feedbackList.innerHTML = (rows || []).map(item => `
      <div class="item-card">
        <div class="item-row">
          <strong>${escapeHtml(item.client_name || 'Client')}</strong>
          <div class="toggle-wrap">
            <label><input type="checkbox" data-type="feedback" data-id="${item.id}" ${item.published ? 'checked' : ''}> Published</label>
          </div>
        </div>
        <div>${escapeHtml(item.company || '—')} • ${escapeHtml(item.service || 'General')}</div>
        <div>“${escapeHtml(item.quote || '')}”</div>
        <div class="rating">Rating: ${'★'.repeat(item.rating || 0)}${'☆'.repeat(Math.max(0, 5 - (item.rating || 0)))}</div>
      </div>
    `).join('');

    feedbackList.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', async event => {
        const id = Number(event.target.dataset.id);
        await api('/api/admin/feedback', {
          method: 'PATCH',
          body: JSON.stringify({ id, published: event.target.checked ? 1 : 0 })
        });
      });
    });
  } catch (error) {
    // no-op
  }
}

async function loadAdvisories() {
  try {
    const rows = await api('/api/admin/advisories');
    advisoryList.innerHTML = (rows || []).map(item => `
      <div class="item-card">
        <div class="item-row">
          <strong>${escapeHtml(item.title || 'Advisory')}</strong>
          <div class="toggle-wrap">
            <label><input type="checkbox" data-type="advisory" data-id="${item.id}" ${item.published ? 'checked' : ''}> Published</label>
          </div>
        </div>
        <div><span class="badge">${item.severity || 'info'}</span></div>
        <div>${escapeHtml(item.body || '')}</div>
      </div>
    `).join('');

    advisoryList.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', async event => {
        const id = Number(event.target.dataset.id);
        await api('/api/admin/advisories', {
          method: 'PATCH',
          body: JSON.stringify({ id, published: event.target.checked ? 1 : 0 })
        });
      });
    });
  } catch (error) {
    // no-op
  }
}

document.getElementById('feedback-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());
  await api('/api/admin/feedback', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  form.reset();
  loadFeedback();
});

document.getElementById('advisory-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());
  await api('/api/admin/advisories', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  form.reset();
  loadAdvisories();
});

loadWhoAmI();
loadMessages();
loadFeedback();
loadAdvisories();
setInterval(loadMessages, 120000);
