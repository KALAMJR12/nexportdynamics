export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === 'GET') {
      const result = await env.DB.prepare('SELECT * FROM advisories ORDER BY published_at DESC LIMIT 200').all();
      return jsonResponse(result.results || [], 200);
    }

    if (request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body || !body.title || !body.body) {
        return jsonResponse({ ok: false, error: 'Missing fields' }, 400);
      }

      const row = await env.DB.prepare(`
        INSERT INTO advisories (title, body, severity, published)
        VALUES (?, ?, ?, 1)
      `).bind(
        String(body.title).trim(),
        String(body.body).trim(),
        ['info', 'warning', 'critical'].includes(body.severity) ? body.severity : 'info'
      ).run();

      const created = await env.DB.prepare('SELECT * FROM advisories WHERE id = ?').bind(row.meta.last_row_id).first();
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
      if (body.title) {
        updates.push('title = ?');
        params.push(String(body.title).trim());
      }
      if (body.body) {
        updates.push('body = ?');
        params.push(String(body.body).trim());
      }
      if (body.severity) {
        updates.push('severity = ?');
        params.push(['info', 'warning', 'critical'].includes(body.severity) ? body.severity : 'info');
      }

      if (!updates.length) {
        return jsonResponse({ ok: false, error: 'No update fields' }, 400);
      }

      params.push(body.id);
      await env.DB.prepare(`UPDATE advisories SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
      const row = await env.DB.prepare('SELECT * FROM advisories WHERE id = ?').bind(body.id).first();
      return jsonResponse({ ok: true, item: row }, 200);
    }

    if (request.method === 'DELETE') {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      if (!id) return jsonResponse({ ok: false, error: 'Missing id' }, 400);
      await env.DB.prepare('UPDATE advisories SET published = 0 WHERE id = ?').bind(id).run();
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
