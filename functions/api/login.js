
import { createToken } from './_auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const password = data.password;

    if (!env.ADMIN_PASSWORD) {
      return Response.json(
        { error: 'Admin password not configured' },
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

    const token = await createToken(env.ADMIN_PASSWORD);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'Set-Cookie': `sa_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`
        }
      }
    );
  } catch {
    return Response.json(
      { error: 'Login failed' },
      { status: 400 }
    );
  }
}
