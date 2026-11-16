
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, name, description, created_at FROM albums ORDER BY id DESC'
    ).all();

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: 'Could not load albums' }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const cookie = request.headers.get('Cookie') || '';

  if (!cookie.includes('sa_admin=')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const name = String(data.name || '').trim();
    const description = String(data.description || '').trim();

    if (!name) {
      return Response.json({ error: 'Album name is required' }, { status: 400 });
    }

    await env.DB.prepare(
      'INSERT INTO albums (name, description) VALUES (?, ?)'
    ).bind(name, description).run();

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Could not create album' }, { status: 500 });
  }
}
