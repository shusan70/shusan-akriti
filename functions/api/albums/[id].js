
import { isAdmin } from '../_auth.js';

export async function onRequestPatch({ request, params, env }) {
  if (!(await isAdmin(request, env))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);

  if (!Number.isInteger(id) || id < 1) {
    return Response.json({ error: 'Invalid album ID' }, { status: 400 });
  }

  try {
    const data = await request.json();
    const name = String(data.name || '').trim();
    const description = String(data.description || '').trim();

    if (!name || name.length > 100 || description.length > 500) {
      return Response.json({ error: 'Invalid album details' }, { status: 400 });
    }

    const album = await env.DB.prepare(
      'SELECT id FROM albums WHERE id = ?'
    ).bind(id).first();

    if (!album) {
      return Response.json({ error: 'Album not found' }, { status: 404 });
    }

    await env.DB.prepare(
      'UPDATE albums SET name = ?, description = ? WHERE id = ?'
    ).bind(name, description, id).run();

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: 'Could not update album. Name may already exist.' },
      { status: 400 }
    );
  }
}

export async function onRequestDelete({ request, params, env }) {
  if (!(await isAdmin(request, env))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);

  if (!Number.isInteger(id) || id < 1) {
    return Response.json({ error: 'Invalid album ID' }, { status: 400 });
  }

  try {
    const album = await env.DB.prepare(
      'SELECT id FROM albums WHERE id = ?'
    ).bind(id).first();

    if (!album) {
      return Response.json({ error: 'Album not found' }, { status: 404 });
    }

    await env.DB.batch([
      env.DB.prepare('DELETE FROM photos WHERE album_id = ?').bind(id),
      env.DB.prepare('DELETE FROM albums WHERE id = ?').bind(id)
    ]);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Could not delete album' }, { status: 500 });
  }
}
