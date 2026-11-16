
export async function onRequestPost({ request, env }) {
  try {
    const { password } = await request.json();

    if (!env.ADMIN_PASSWORD) {
      return Response.json(
        { error: 'Admin password is not configured' },
        { status: 500 }
      );
    }

    if (
      typeof password !== 'string' ||
      password.length > 200 ||
      password !== env.ADMIN_PASSWORD
    ) {
      return Response.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    const token = crypto.randomUUID() + crypto.randomUUID();

    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Set-Cookie': `sa_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers }
    );
  } catch {
    return Response.json({ error: 'Login failed' }, { status: 400 });
  }
}
