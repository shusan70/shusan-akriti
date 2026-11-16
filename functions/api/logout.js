
export async function onRequestPost() {
  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Set-Cookie': 'sa_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
      }
    }
  );
}
