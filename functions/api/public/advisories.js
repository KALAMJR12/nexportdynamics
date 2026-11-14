export async function onRequest(context) {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '5', 10);
    const limit = Number.isNaN(requestedLimit) ? 5 : Math.max(1, Math.min(requestedLimit, 20));

    const result = await env.DB.prepare(`
      SELECT id, title, body, severity, published_at
      FROM advisories
      WHERE published = 1
      ORDER BY published_at DESC
      LIMIT ?
    `).bind(limit).all();

    return jsonResponse(result.results || [], 200);
  } catch (error) {
    return jsonResponse({ ok: false, error: 'Unable to load advisories' }, 500);
  }
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
