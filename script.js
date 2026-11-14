const CONTACT = { whatsapp: '2349071612635', email: 'ceo@nexportpro.com', phone: '+2349071612635' };
const MINERALS = [
  { name: 'Lead Ore', grade: '60–65% Pb', quantity: 'Up to 500 MT / month', port: 'Lekki, Nigeria', incoterm: 'FOB', available: true },
  { name: 'Lithium Ore', grade: '5.5% Li₂O (typical)', quantity: 'Subject to availability', port: 'Lagos, Nigeria', incoterm: 'FOB', available: true },
  { name: 'Zinc Ore', grade: '45–55% Zn', quantity: 'Up to 300 MT / month', port: 'Lekki, Nigeria', incoterm: 'FOB', available: true },
  { name: 'Iron Ore', grade: '62% Fe (typical)', quantity: 'Bulk enquiries only', port: 'Lagos, Nigeria', incoterm: 'FOB / CIF', available: false }
];

function buildWhatsAppLink(text) {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
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

function formatTimestamp(date) {
  return new Date(date).toISOString();
}

function relativeDate(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
}

function getServiceKey(value) {
  if (!value) return '';
  const match = value.toLowerCase();
  if (match.includes('minerals')) return 'Minerals Resources';
  if (match.includes('ocean')) return 'Ocean Freight';
  if (match.includes('haulage') || match.includes('transport')) return 'Transport & Haulage';
  if (match.includes('import')) return 'Import & Export';
  if (match.includes('clearing')) return 'Clearing & Forwarding';
  return value;
}

function prefillFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const serviceParam = params.get('service');
  const commodityParam = params.get('commodity');
  const serviceField = document.getElementById('service');
  const commodityField = document.getElementById('commodity');
  if (serviceField && serviceParam) {
    const mapped = getServiceKey(serviceParam);
    if (Array.from(serviceField.options).some(option => option.value === mapped || option.text === mapped)) {
      serviceField.value = mapped;
    }
  }
  if (commodityField && commodityParam) {
    commodityField.value = decodeURIComponent(commodityParam).replace(/\+/g, ' ');
  }
}

function setupGlobe() {
  const canvas = document.getElementById('world3d');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const loader = document.getElementById('loader');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 650);
      }
    }, 500);
  });

  let mouseX = 0;
  let mouseY = 0;
  let time = 0;
  window.addEventListener('pointermove', e => {
    mouseX = (e.clientX / innerWidth - 0.5) * 2;
    mouseY = (e.clientY / innerHeight - 0.5) * 2;
  });

  function drawGlobe(cx, cy, r) {
    ctx.save();
    ctx.translate(cx + mouseX * 18, cy + mouseY * 8);
    const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.08, 0, 0, r);
    grad.addColorStop(0, '#4cc8ff');
    grad.addColorStop(0.42, '#0878c9');
    grad.addColorStop(1, '#031f4d');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#3cbaff66';
    ctx.shadowBlur = 45;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = '#a9e7ff55';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      const yy = i * r * 0.32;
      ctx.beginPath();
      ctx.ellipse(0, yy, r * Math.sqrt(Math.max(0.1, 1 - (i * 0.24) ** 2)), r * 0.23, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = -2; i <= 2; i++) {
      const xx = i * r * 0.28;
      ctx.beginPath();
      ctx.ellipse(xx, 0, r * 0.25, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#8edfff55';
    [[-55, -35, 70, 32], [-20, 20, 50, 38], [55, 0, 65, 25]].forEach(([x, y, w, h]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    ctx.strokeStyle = '#ff7b13';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r + 18, -0.55, 2.5);
    ctx.stroke();
    ctx.fillStyle = '#ff8a18';
    ctx.beginPath();
    ctx.arc(r * 0.55, -r * 0.75, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    time += 0.008;
    const w = innerWidth;
    const h = innerHeight;
    ctx.clearRect(0, 0, w, h);

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, 'rgba(225,246,255,.15)');
    bg.addColorStop(1, 'rgba(0,82,145,.18)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 65; i++) {
      const x = (i * 173) % w;
      const y = (i * 97 + h * 0.15) % h;
      const pulse = 0.45 + 0.35 * Math.sin(time * 2 + i);
      ctx.fillStyle = `rgba(20,130,205,${pulse})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const cx = Math.min(w * 0.73, w - 310);
    const cy = h * 0.47;
    const r = Math.min(190, w * 0.16);
    drawGlobe(cx, cy, r);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#ff7b1370';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, r + 40 + i * 25, 55 + i * 16, (i * 0.7) + time * 0.05, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < 8; i++) {
      const x = cx - r * 1.2 + i * 34;
      const y = cy + r * 1.08 + (i % 2) * 13 + Math.sin(time + i) * 5;
      ctx.fillStyle = i % 2 ? '#ff7b13' : '#075ead';
      ctx.fillRect(x, y, 27, 15);
      ctx.strokeStyle = '#ffffff55';
      ctx.strokeRect(x, y, 27, 15);
    }
    requestAnimationFrame(draw);
  }

  draw();
}

function setupSmoothAnchorLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function renderMinerals() {
  const wrap = document.getElementById('minerals-table-wrap');
  if (!wrap) return;

  const isMobile = window.matchMedia('(max-width: 950px)').matches;

  if (isMobile) {
    wrap.innerHTML = `
      <div class="mineral-cards">
        ${MINERALS.map(mineral => `
          <article class="mineral-card">
            <h4>${mineral.name}</h4>
            <div class="meta"><strong>Grade:</strong> ${mineral.grade}</div>
            <div class="meta"><strong>Available quantity:</strong> ${mineral.quantity}</div>
            <div class="meta"><strong>Loading port:</strong> ${mineral.port}</div>
            <div class="meta"><strong>Incoterm:</strong> ${mineral.incoterm}</div>
            <button type="button" data-name="${mineral.name}" class="request-specs">Request specs →</button>
          </article>
        `).join('')}
      </div>
    `;
  } else {
    wrap.innerHTML = `
      <div class="table-wrap">
        <table class="minerals-table">
          <thead>
            <tr>
              <th>Mineral</th>
              <th>Grade</th>
              <th>Available quantity</th>
              <th>Loading port</th>
              <th>Incoterm</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${MINERALS.map(mineral => `
              <tr>
                <td>${mineral.name}</td>
                <td>${mineral.grade}</td>
                <td>${mineral.quantity}</td>
                <td>${mineral.port}</td>
                <td>${mineral.incoterm}</td>
                <td><button type="button" data-name="${mineral.name}" class="request-specs">Request specs →</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  wrap.querySelectorAll('.request-specs').forEach(button => {
    button.addEventListener('click', () => {
      const mineralName = button.getAttribute('data-name');
      const serviceField = document.getElementById('service');
      const commodityField = document.getElementById('commodity');
      const emailField = document.getElementById('email');
      if (serviceField) serviceField.value = 'Minerals Resources';
      if (commodityField) commodityField.value = mineralName;
      if (emailField) emailField.focus();
      const url = new URL(window.location.href);
      url.searchParams.set('service', 'Minerals');
      url.searchParams.set('commodity', mineralName);
      window.history.replaceState({}, '', url);
      document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function setupQuoteForm() {
  const form = document.getElementById('quote-form');
  const statusNode = document.getElementById('form-status');
  const successCard = document.getElementById('quote-success');
  const fallbackNote = document.getElementById('fallback-note');
  const whatsappSuccess = document.getElementById('whatsapp-success');
  const submitAnother = document.getElementById('submit-another');

  if (!form) return;

  prefillFromQuery();

  const validate = () => {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const service = document.getElementById('service').value.trim();
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();

    if (!name) return 'Please enter your name.';
    if (!service) return 'Please select a service.';
    if (!origin) return 'Please enter an origin location.';
    if (!destination) return 'Please enter a destination location.';
    if (!email && !phone) return 'Please provide either an email or phone number.';
    return '';
  };

  const resetForm = () => {
    form.reset();
    form.hidden = false;
    document.getElementById('service').value = '';
    successCard.hidden = true;
    statusNode.textContent = '';
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      statusNode.textContent = validationError;
      return;
    }

    const payload = {
      type: 'quote',
      name: document.getElementById('name').value.trim(),
      company: document.getElementById('company').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      service: document.getElementById('service').value,
      origin: document.getElementById('origin').value.trim(),
      destination: document.getElementById('destination').value.trim(),
      commodity: document.getElementById('commodity').value.trim(),
      weight_volume: document.getElementById('weight-volume').value.trim(),
      readiness: document.getElementById('readiness').value,
      incoterm: document.getElementById('incoterm').value,
      message: document.getElementById('message').value.trim(),
      _gotcha: document.getElementById('gotcha').value.trim()
    };

    const summary = [
      'Nexport quote request',
      `Name: ${payload.name}`,
      `Company: ${payload.company || 'Not provided'}`,
      `Service: ${payload.service}`,
      `Route: ${payload.origin} → ${payload.destination}`,
      `Commodity: ${payload.commodity || 'Not provided'}`,
      `Email: ${payload.email || 'Not provided'}`,
      `Phone: ${payload.phone || 'Not provided'}`,
      `Message: ${payload.message || 'No additional notes'}`
    ].join('\n');

    statusNode.textContent = '';
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Unavailable');
      }

      const data = await response.json();
      if (data.ok) {
        const waLink = buildWhatsAppLink(summary + '\n\nReference: ' + data.id);
        whatsappSuccess.href = waLink;
        form.hidden = true;
        successCard.hidden = false;
        fallbackNote.hidden = true;
      } else {
        statusNode.textContent = data.error || 'Unable to send your request right now.';
      }
    } catch (error) {
      const fallbackUrl = buildWhatsAppLink(summary);
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      fallbackNote.hidden = false;
      successCard.hidden = false;
      whatsappSuccess.href = fallbackUrl;
      form.hidden = true;
      statusNode.textContent = 'We have opened WhatsApp so you can send this to our team directly.';
    }
  });

  submitAnother.addEventListener('click', resetForm);

  const serviceField = document.getElementById('service');
  const weightField = document.getElementById('weight-volume');
  const toggleCbm = document.getElementById('toggle-cbm');
  const cbmPanel = document.createElement('div');
  cbmPanel.className = 'tools-card';
  cbmPanel.innerHTML = `
    <div class="cbm-grid">
      <div class="field-wrap">
        <label for="cbm-length">Length (cm)</label>
        <input id="cbm-length" type="number" min="0" step="0.01" value="100">
      </div>
      <div class="field-wrap">
        <label for="cbm-width">Width (cm)</label>
        <input id="cbm-width" type="number" min="0" step="0.01" value="80">
      </div>
      <div class="field-wrap">
        <label for="cbm-height">Height (cm)</label>
        <input id="cbm-height" type="number" min="0" step="0.01" value="60">
      </div>
      <div class="field-wrap">
        <label for="cbm-qty">Quantity</label>
        <input id="cbm-qty" type="number" min="0" step="1" value="2">
      </div>
      <div class="field-wrap">
        <label for="cbm-unit">Unit</label>
        <select id="cbm-unit">
          <option value="cm">cm</option>
          <option value="in">inches</option>
        </select>
      </div>
    </div>
    <div class="cbm-results">
      <div><strong>Total CBM:</strong> <span id="cbm-result">0.96</span></div>
      <div><strong>Ocean LCL chargeable:</strong> <span id="ocean-result">960 kg</span></div>
      <div><strong>Air chargeable:</strong> <span id="air-result">160.32 kg</span></div>
      <div class="fallback-note">Indicative only. Final chargeable weight depends on carrier rules and packing.</div>
      <button id="use-cbm" class="btn primary" type="button">Use in quote</button>
    </div>
  `;
  cbmPanel.hidden = true;
  form.insertBefore(cbmPanel, document.getElementById('form-status'));

  const cbmState = {
    length: () => Number(document.getElementById('cbm-length').value || 0),
    width: () => Number(document.getElementById('cbm-width').value || 0),
    height: () => Number(document.getElementById('cbm-height').value || 0),
    qty: () => Number(document.getElementById('cbm-qty').value || 0),
    unit: () => document.getElementById('cbm-unit').value,
    actualWeight: () => 0
  };

  const recalc = () => {
    const totalCbm = cbmState.unit() === 'cm'
      ? (cbmState.length() * cbmState.width() * cbmState.height() * cbmState.qty()) / 1000000
      : (cbmState.length() * cbmState.width() * cbmState.height() * cbmState.qty()) / 61023.7;
    const ocean = Math.max(cbmState.actualWeight(), totalCbm * 1000);
    const air = Math.max(cbmState.actualWeight(), totalCbm * 167);
    document.getElementById('cbm-result').textContent = totalCbm.toFixed(2) + ' CBM';
    document.getElementById('ocean-result').textContent = ocean.toFixed(2) + ' kg';
    document.getElementById('air-result').textContent = air.toFixed(2) + ' kg';
  };

  ['cbm-length', 'cbm-width', 'cbm-height', 'cbm-qty', 'cbm-unit'].forEach(id => {
    document.getElementById(id).addEventListener('input', recalc);
    document.getElementById(id).addEventListener('change', recalc);
  });

  toggleCbm.addEventListener('click', () => {
    cbmPanel.hidden = !cbmPanel.hidden;
    if (!cbmPanel.hidden) recalc();
  });

  document.getElementById('use-cbm').addEventListener('click', () => {
    const resultText = document.getElementById('cbm-result').textContent;
    const oceanText = document.getElementById('ocean-result').textContent;
    const airText = document.getElementById('air-result').textContent;
    const value = `${resultText} • Ocean chargeable ${oceanText} • Air chargeable ${airText}`;
    if (weightField) {
      weightField.value = value;
    }
    if (serviceField && !serviceField.value) {
      serviceField.value = 'Ocean Freight';
    }
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    cbmPanel.hidden = true;
  });
}

function setupTracking() {
  const button = document.getElementById('tracking-button');
  const input = document.getElementById('tracking-reference');
  if (!button || !input) return;

  button.addEventListener('click', () => {
    const value = input.value.trim();
    if (!value) {
      input.focus();
      return;
    }
    const text = [
      'Tracking request — Nexport website',
      `Reference: ${value}`,
      `Sent: ${formatTimestamp(new Date())}`
    ].join('\n');
    window.open(buildWhatsAppLink(text), '_blank', 'noopener,noreferrer');
  });
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error('Unable to fetch data');
  }
  return response.json();
}

function setupFeedbackAndAdvisories() {
  const feedbackGrid = document.getElementById('feedback-grid');
  const advisoriesList = document.getElementById('advisories-list');
  const viewAllButton = document.getElementById('view-all-advisories');

  async function loadFeedback() {
    if (!feedbackGrid) return;
    try {
      const data = await fetchJson('/api/public/feedback');
      const rows = Array.isArray(data) ? data : data.items || [];
      if (rows.length) {
        feedbackGrid.innerHTML = rows.slice(0, 3).map(item => `
          <article class="feedback-card">
            <div class="feedback-header">
              <div class="feedback-name">${escapeHtml(item.client_name || 'Client')}</div>
              <div class="rating">${'★'.repeat(Math.max(0, Math.min(5, Number(item.rating || 0))))}${'☆'.repeat(5 - Math.max(0, Math.min(5, Number(item.rating || 0))))}</div>
            </div>
            <div class="feedback-company">${escapeHtml(item.company || 'Client')}</div>
            <div class="feedback-service">${escapeHtml(item.service || 'General service')}</div>
            <div class="feedback-quote">“${escapeHtml(item.quote || '')}”</div>
          </article>
        `).join('');
        return;
      }
    } catch (error) {
      // Display the empty state below when public data is unavailable.
    }

    feedbackGrid.innerHTML = '<p class="content-empty">Client feedback will appear here when available.</p>';
  }

  async function loadAdvisories(limit = 3) {
    if (!advisoriesList) return;
    try {
      const data = await fetchJson(`/api/public/advisories?limit=${limit}`);
      const rows = Array.isArray(data) ? data : data.items || [];
      if (rows.length) {
        advisoriesList.innerHTML = rows.map(item => {
          const severity = ['info', 'warning', 'critical'].includes(item.severity) ? item.severity : 'info';
          return `
          <article class="advisory-item">
            <div class="advisory-top">
              <span class="badge ${severity}">${severity}</span>
              <span class="advisory-date">${relativeDate(item.published_at)}</span>
            </div>
            <h4>${escapeHtml(item.title || '')}</h4>
            <p>${escapeHtml(item.body || '')}</p>
          </article>
        `;
        }).join('');
        return;
      }
    } catch (error) {
      // Display the empty state below when public data is unavailable.
    }

    advisoriesList.innerHTML = '<p class="content-empty">There are no current advisories.</p>';
  }

  if (viewAllButton) {
    viewAllButton.addEventListener('click', async () => {
      await loadAdvisories(20);
    });
  }

  loadFeedback();
  loadAdvisories();
}

document.addEventListener('DOMContentLoaded', () => {
  setupGlobe();
  setupSmoothAnchorLinks();
  renderMinerals();
  setupQuoteForm();
  setupTracking();
  setupFeedbackAndAdvisories();
  window.addEventListener('resize', renderMinerals);
  prefillFromQuery();
});

