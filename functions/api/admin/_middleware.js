const JWKS_CACHE = { keys: null, expiresAt: 0 };

async function getAccessKeys(issuer) {
  const now = Date.now();
  if (JWKS_CACHE.keys && now < JWKS_CACHE.expiresAt) {
    return JWKS_CACHE.keys;
  }

  const certsUrl = `${issuer.replace(/\/$/, '')}/cdn-cgi/access/certs`;
  const response = await fetch(certsUrl, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error('Unable to fetch Cloudflare Access keys');
  }
  const data = await response.json();
  JWKS_CACHE.keys = data.keys || [];
  JWKS_CACHE.expiresAt = now + 60 * 60 * 1000;
  return JWKS_CACHE.keys;
}

function base64UrlDecodeBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function base64UrlDecode(value) {
  return new TextDecoder().decode(base64UrlDecodeBytes(value));
}

function parseJsonFromBase64(value) {
  try {
    return JSON.parse(base64UrlDecode(value));
  } catch (error) {
    return null;
  }
}

async function verifyJwt(token, audience, issuer) {
  if (!token || !audience || !issuer) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const header = parseJsonFromBase64(parts[0]);
  const payload = parseJsonFromBase64(parts[1]);
  if (!header || !payload) return null;
  const validAudience = Array.isArray(payload.aud)
    ? payload.aud.includes(audience)
    : payload.aud === audience;
  const expectedIssuer = issuer.replace(/\/$/, '');
  if (header.alg !== 'RS256' || !validAudience || payload.iss !== expectedIssuer) return null;

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now || (payload.nbf && payload.nbf > now)) return null;

  const jwks = await getAccessKeys(expectedIssuer);
  const key = jwks.find(item => item.kid === header.kid);
  if (!key) return null;

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    key,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBytes = base64UrlDecodeBytes(parts[2]);
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const valid = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, cryptoKey, signatureBytes, data);
  if (!valid) return null;

  return payload;
}

export async function onRequest(context) {
  const { request, env, next, data } = context;
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion');
  const audience = env.ACCESS_AUD;
  const issuer = env.ACCESS_ISSUER;

  if (!audience || !issuer) {
    return jsonResponse({ ok: false, error: 'Admin authentication is not configured' }, 503);
  }

  if (!assertion) {
    return jsonResponse({ ok: false, error: 'Cloudflare Access authentication required' }, 401);
  }

  try {
    const payload = await verifyJwt(assertion, audience, issuer);
    if (!payload) {
      return jsonResponse({ ok: false, error: 'Forbidden' }, 403);
    }

    data.user = { email: payload.email || null };
    return next();
  } catch (error) {
    return jsonResponse({ ok: false, error: 'Unable to verify Cloudflare Access token' }, 503);
  }
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
