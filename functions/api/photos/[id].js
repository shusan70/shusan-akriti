
import { isAdmin } from '../_auth.js';

export async function onRequestDelete({ request, params, env }) {
  if (!(await isAdmin(request, env))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);

  if (!Number.isInteger(id) || id < 1) {
    return Response.json({ error: 'Invalid photo ID' }, { status: 400 });
  }

  try {
    const result = await env.DB.prepare(
      'DELETE FROM photos WHERE id = ?'
    ).bind(id).run();

    if (!result.meta?.changes) {
      return Response.json({ error: 'Photo not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Could not delete photo' }, { status: 500 });
  }
}
