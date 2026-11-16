
import { isAdmin } from '../_auth.js';

export async function onRequestDelete({ request, params, env }) {
  if (!(await isAdmin(request, env))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);

  if (!Number.isInteger(id) || id < 1) {
    return Response.json({ error: 'Invalid album ID' }, { status: 400 });
  }

  try {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM photos WHERE album_id = ?').bind(id),
      env.DB.prepare('DELETE FROM albums WHERE id = ?').bind(id)
    ]);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Could not delete album' }, { status: 500 });
  }
}
