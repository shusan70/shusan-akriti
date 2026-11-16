
import { isAdmin } from './_auth.js';

export async function onRequestGet({ request, env }) {
  try {
    const albumId = new URL(request.url).searchParams.get('album_id');

    const statement = albumId
      ? env.DB.prepare(
          'SELECT id, album_id, caption, created_at FROM photos WHERE album_id = ? ORDER BY id DESC'
        ).bind(albumId)
      : env.DB.prepare(
          'SELECT id, album_id, caption, created_at FROM photos ORDER BY id DESC'
        );

    const { results } = await statement.all();
    return Response.json(results);
  } catch {
    return Response.json({ error: 'Could not load photos' }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const albumId = Number(form.get('album_id'));
    const caption = String(form.get('caption') || '').trim();
    const file = form.get('image');

    if (!Number.isInteger(albumId) || albumId < 1 ||
        !file || typeof file.arrayBuffer !== 'function') {
      return Response.json({ error: 'Album and image required' }, { status: 400 });
    }

    if (file.size < 1 || file.size > 1800000 || file.type !== 'image/webp') {
      return Response.json({ error: 'Use WebP images under 1.8MB' }, { status: 400 });
    }

    const album = await env.DB.prepare(
      'SELECT id FROM albums WHERE id = ?'
    ).bind(albumId).first();

    if (!album) {
      return Response.json({ error: 'Album not found' }, { status: 404 });
    }

    const bytes = await file.arrayBuffer();
    const header = new Uint8Array(bytes);

    if (
      header.length < 12 ||
      String.fromCharCode(...header.slice(0, 4)) !== 'RIFF' ||
      String.fromCharCode(...header.slice(8, 12)) !== 'WEBP'
    ) {
      return Response.json({ error: 'Invalid WebP image' }, { status: 400 });
    }

    await env.DB.prepare(
      'INSERT INTO photos (album_id, caption, image, mime_type) VALUES (?, ?, ?, ?)'
    ).bind(albumId, caption.slice(0, 200), bytes, 'image/webp').run();

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Photo upload failed' }, { status: 500 });
  }
}
