export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === 'GET') {
      const result = await env.DB.prepare('SELECT * FROM feedback ORDER BY created_at DESC LIMIT 200').all();
      return jsonResponse(result.results || [], 200);
    }

    if (request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body || !body.client_name || !body.quote) {
        return jsonResponse({ ok: false, error: 'Missing fields' }, 400);
      }

      const row = await env.DB.prepare(`
        INSERT INTO feedback (client_name, company, service, quote, rating, published)
        VALUES (?, ?, ?, ?, ?, 1)
      `).bind(
        String(body.client_name).trim(),
        String(body.company || '').trim() || null,
        String(body.service || '').trim() || null,
        String(body.quote).trim(),
        Number(body.rating || 0) || null
      ).run();

      const created = await env.DB.prepare('SELECT * FROM feedback WHERE id = ?').bind(row.meta.last_row_id).first();
      return jsonResponse({ ok: true, item: created }, 200);
    }

    if (request.method === 'PATCH') {
      const body = await request.json().catch(() => null);
      if (!body || !body.id) {
        return jsonResponse({ ok: false, error: 'Missing id' }, 400);
      }

      const updates = [];
      const params = [];
      if (body.published !== undefined) {
        updates.push('published = ?');
        params.push(Number(body.published) ? 1 : 0);
      }
      if (body.quote) {
        updates.push('quote = ?');
        params.push(String(body.quote).trim());
      }
      if (body.client_name) {
        updates.push('client_name = ?');
        params.push(String(body.client_name).trim());
      }
      if (body.company !== undefined) {
        updates.push('company = ?');
        params.push(String(body.company).trim() || null);
      }
      if (body.service !== undefined) {
        updates.push('service = ?');
        params.push(String(body.service).trim() || null);
      }
      if (body.rating !== undefined) {
        updates.push('rating = ?');
        params.push(Number(body.rating) || null);
      }

      if (!updates.length) {
        return jsonResponse({ ok: false, error: 'No update fields' }, 400);
      }

      params.push(body.id);
      await env.DB.prepare(`UPDATE feedback SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
      const row = await env.DB.prepare('SELECT * FROM feedback WHERE id = ?').bind(body.id).first();
      return jsonResponse({ ok: true, item: row }, 200);
    }

    if (request.method === 'DELETE') {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      if (!id) return jsonResponse({ ok: false, error: 'Missing id' }, 400);
      await env.DB.prepare('UPDATE feedback SET published = 0 WHERE id = ?').bind(id).run();
      return jsonResponse({ ok: true }, 200);
    }

    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
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
