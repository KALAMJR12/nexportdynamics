export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const contentLength = Number(request.headers.get('content-length') || '0');
    if (contentLength > 8192) {
      return jsonResponse({ ok: false, error: 'Payload too large' }, 400);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
    }

    const allowedTypes = ['quote', 'feedback', 'advisory_reply', 'other'];
    const type = String(body.type || '').trim();
    if (!allowedTypes.includes(type)) {
      return jsonResponse({ ok: false, error: 'Invalid type' }, 400);
    }

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const message = String(body.message || '').trim();
    const honeypot = String(body._gotcha || '').trim();

    if (honeypot) {
      return jsonResponse({ ok: false, error: 'Rejected' }, 400);
    }

    if (type === 'quote') {
      if (!name || (!email && !phone)) {
        return jsonResponse({ ok: false, error: 'Name and contact required' }, 400);
      }
    }

    const urlsInMessage = (message.match(/https?:\/\/\S+/gi) || []).length;
    if (urlsInMessage > 3) {
      return jsonResponse({ ok: false, error: 'Rejected' }, 400);
    }

    const sql = `
      INSERT INTO messages (
        type, name, company, email, phone, service, origin, destination, commodity,
        weight_volume, readiness, incoterm, message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await env.DB.prepare(sql).bind(
      type,
      name || null,
      String(body.company || '').trim() || null,
      email || null,
      phone || null,
      String(body.service || '').trim() || null,
      String(body.origin || '').trim() || null,
      String(body.destination || '').trim() || null,
      String(body.commodity || '').trim() || null,
      String(body.weight_volume || '').trim() || null,
      String(body.readiness || '').trim() || null,
      String(body.incoterm || '').trim() || null,
      message || null
    ).run();

    return jsonResponse({ ok: true, id: result.meta.last_row_id }, 200);
  } catch (error) {
    return jsonResponse({ ok: false, error: 'Internal error' }, 500);
  }
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
