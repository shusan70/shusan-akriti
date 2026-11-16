
export async function onRequestGet({ params, env }) {
  try {
    const photo = await env.DB.prepare(
      'SELECT image, mime_type FROM photos WHERE id = ?'
    ).bind(params.id).first();

    if (!photo) {
      return new Response('Image not found', { status: 404 });
    }

    return new Response(photo.image, {
      headers: {
        'Content-Type': photo.mime_type || 'image/webp',
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch {
    return new Response('Image error', { status: 500 });
  }
}
