
export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const albumId = url.searchParams.get('album_id');

    let query = `
      SELECT id, album_id, caption, created_at
      FROM photos
    `;

    let statement;

    if (albumId) {
      statement = env.DB.prepare(
        query + ' WHERE album_id = ? ORDER BY id DESC'
      ).bind(albumId);
    } else {
      statement = env.DB.prepare(query + ' ORDER BY id DESC');
    }

    const { results } = await statement.all();
    return Response.json(results);
  } catch {
    return Response.json({ error: 'Could not load photos' }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  if (!(request.headers.get('Cookie') || '').includes('sa_admin=')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const albumId = Number(form.get('album_id'));
    const caption = String(form.get('caption') || '');
    const file = form.get('image');

    if (!albumId || !file || typeof file.arrayBuffer !== 'function') {
      return Response.json({ error: 'Album and image required' }, { status: 400 });
    }

    if (file.size > 1800000 || file.type !== 'image/webp') {
      return Response.json({ error: 'Upload WebP images under 1.8MB' }, { status: 400 });
    }

    await env.DB.prepare(
      'INSERT INTO photos (album_id, caption, image, mime_type) VALUES (?, ?, ?, ?)'
    ).bind(albumId, caption, await file.arrayBuffer(), 'image/webp').run();

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
