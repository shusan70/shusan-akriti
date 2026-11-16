
export async function onRequestGet({ params, env }) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id < 1) {
    return new Response('Invalid image ID', { status: 400 });
  }

  try {
    const photo = await env.DB.prepare(
      'SELECT image, mime_type FROM photos WHERE id = ?'
    ).bind(id).first();

    if (!photo || !photo.image) {
      return new Response('Image not found', { status: 404 });
    }

    return new Response(photo.image, {
      headers: {
        'Content-Type': photo.mime_type || 'image/webp',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch {
    return new Response('Unable to load image', { status: 500 });
  }
}
