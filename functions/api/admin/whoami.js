export async function onRequest(context) {
  const { data } = context;
  return new Response(JSON.stringify({ ok: true, user: data.user || null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
