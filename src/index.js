const funny404 = [
  "This link has vanished into the void!",
  "404: Link not found. Maybe it's hiding?",
  "Oops! This shortcut took a wrong turn.",
  "Link expired. Probably chasing squirrels.",
  "404 Error: Link went on an adventure without you.",
  "Thank you for locating me, but unfortunately your link is in another castle."
];

const funny401 = [
  "Unauthorized! Fluffy access only.",
  "X-Fluffy header missing. Are you fluffy enough?",
  "Access denied. Only fluffy creatures allowed.",
  "401: Not fluffy. Try again with more fluff."
];

const funny400 = [
  "Bad request. Did you forget the magic word?",
  "400: Invalid data. URL required, fluff optional.",
  "Missing something? Like your URL?",
  "Bad JSON or missing fields. Try harder!"
];

function randomMessage(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/l/c') {
      // Handle create short URL
      if (request.headers.get('X-Fluffy') !== 'true') {
        return new Response(randomMessage(funny401), { status: 401 });
      }

      try {
        const body = await request.json();
        const originalUrl = body.url;
        const customSlug = body.slug;

        if (!originalUrl) {
          return new Response(randomMessage(funny400), { status: 400 });
        }

        // Use custom slug or generate random
        const shortCode = customSlug || Math.random().toString(36).substring(2, 8);

        // Store in KV (overwrite if exists)
        await env.URLS.put(shortCode, originalUrl);

        // Return the short URL
        const shortUrl = `${url.origin}/${shortCode}`;
        return new Response(JSON.stringify({ shortUrl }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(randomMessage(funny400), { status: 400 });
      }

    } else if (request.method === 'PUT' && url.pathname.startsWith('/l/')) {
      // Handle update short URL
      if (request.headers.get('X-Fluffy') !== 'true') {
        return new Response(randomMessage(funny401), { status: 401 });
      }

      const slug = url.pathname.split('/l/')[1];
      if (!slug) {
        return new Response(randomMessage(funny400), { status: 400 });
      }

      try {
        const body = await request.json();
        const newUrl = body.url;

        if (!newUrl) {
          return new Response(randomMessage(funny400), { status: 400 });
        }

        // Check if exists
        const existing = await env.URLS.get(slug);
        if (!existing) {
          return new Response(randomMessage(funny404), { status: 404 });
        }

        // Update
        await env.URLS.put(slug, newUrl);
        return new Response(JSON.stringify({ shortUrl: `${url.origin}/${slug}` }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(randomMessage(funny400), { status: 400 });
      }

    } else if (request.method === 'DELETE' && url.pathname.startsWith('/l/')) {
      // Handle delete short URL
      if (request.headers.get('X-Fluffy') !== 'true') {
        return new Response(randomMessage(funny401), { status: 401 });
      }

      const slug = url.pathname.split('/l/')[1];
      if (!slug) {
        return new Response(randomMessage(funny400), { status: 400 });
      }

      const existing = await env.URLS.get(slug);
      if (!existing) {
        return new Response(randomMessage(funny404), { status: 404 });
      }

      await env.URLS.delete(slug);
      return new Response('Deleted', { status: 200 });

    } else if (request.method === 'GET' && url.pathname === '/') {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Snubs.dev URL Shortener</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #121212; color: #fff; }
    h1 { color: #fff; }
    code { background: #333; padding: 2px 4px; border-radius: 3px; color: #fff; }
    ul { color: #ccc; }
  </style>
</head>
<body>
  <h1>Snubs.dev URL Shortener</h1>
  <p>A private URL shortener service.</p>
  <h2>Public Endpoints</h2>
  <ul>
    <li><strong>GET /&lt;shortcode&gt;</strong> - Redirect to original URL</li>
    <li><strong>GET /health</strong> - Health check</li>
    <li><strong>GET /stats</strong> - View all short links</li>
  </ul>
</body>
</html>
      `;
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });

    } else if (request.method === 'GET' && url.pathname === '/health') {
      return new Response('OK', { status: 200 });

    } else if (request.method === 'GET' && url.pathname === '/stats') {
      const keys = await env.URLS.list();
      const stats = {};
      for (const key of keys.keys) {
        const originalUrl = await env.URLS.get(key.name);
        stats[key.name] = originalUrl;
      }
      return new Response(JSON.stringify(stats), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (request.method === 'GET' && url.pathname.length > 1 && !url.pathname.startsWith('/l/')) {
      // Handle redirect
      const shortCode = url.pathname.slice(1);

      const originalUrl = await env.URLS.get(shortCode);
      if (!originalUrl) {
        return new Response(randomMessage(funny404), { status: 404 });
      }

      return Response.redirect(originalUrl, 302);

    } else {
      return new Response(randomMessage(funny404), { status: 404 });
    }
  }
};