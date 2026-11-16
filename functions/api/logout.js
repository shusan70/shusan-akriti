
async function getKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createToken(secret) {
  const expiry = String(Date.now() + 8 * 60 * 60 * 1000);
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(expiry)
  );

  const encoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${expiry}.${encoded}`;
}

export async function isAdmin(request, env) {
  if (!env.ADMIN_PASSWORD) return false;

  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)sa_admin=([^;]+)/);
  if (!match) return false;

  const [expiry, signature] = match[1].split('.');
  if (!expiry || !signature || Number(expiry) < Date.now()) return false;

  try {
    const key = await getKey(env.ADMIN_PASSWORD);
    const encoded = signature.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(
      atob(encoded + '='.repeat((4 - encoded.length % 4) % 4)),
      c => c.charCodeAt(0)
    );

    return await crypto.subtle.verify(
      'HMAC', key, bytes, new TextEncoder().encode(expiry)
    );
  } catch {
    return false;
  }
}
