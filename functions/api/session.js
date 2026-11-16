
import { isAdmin } from './_auth.js';

export async function onRequestGet({ request, env }) {
  const authenticated = await isAdmin(request, env);

  return Response.json(
    { authenticated },
    {
      headers: { 'Cache-Control': 'no-store' }
    }
  );
}
