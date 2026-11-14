export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    if (request.method === 'GET') {
      const statusFilter = url.searchParams.get('status');
      const typeFilter = url.searchParams.get('type');
      const params = [];
      let sql = `SELECT * FROM messages WHERE 1 = 1`;

      if (statusFilter) {
        sql += ' AND status = ?';
        params.push(statusFilter);
      }
      if (typeFilter) {
        sql += ' AND type = ?';
        params.push(typeFilter);
      }

      sql += ' ORDER BY created_at DESC LIMIT 200';
      const result = await env.DB.prepare(sql).bind(...params).all();
      return jsonResponse(result.results || [], 200);
    }

    if (request.method === 'PATCH') {
      const body = await request.json().catch(() => null);
      if (!body || !body.id || !body.status) {
        return jsonResponse({ ok: false, error: 'Invalid payload' }, 400);
      }

      const valid = ['new', 'contacted', 'quoted', 'closed'];
      if (!valid.includes(body.status)) {
        return jsonResponse({ ok: false, error: 'Invalid status' }, 400);
      }

      const update = await env.DB.prepare('UPDATE messages SET status = ? WHERE id = ?').bind(body.status, body.id).run();
      const row = await env.DB.prepare('SELECT * FROM messages WHERE id = ?').bind(body.id).first();
      if (row) {
        return jsonResponse({ ok: true, item: row }, 200);
      }
      return jsonResponse({ ok: false, error: 'Not found' }, 404);
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
