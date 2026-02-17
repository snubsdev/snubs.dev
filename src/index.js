const funny404 = [
  "This link has vanished into the void!",
  "404: Link not found. Maybe it's hiding?",
  "Oops! This shortcut took a wrong turn.",
  "Link expired. Probably chasing squirrels.",
  "404 Error: Link went on an adventure without you.",
  "Thank you for locating me, but unfortunately your link is in another castle."
];

const funny401 = [
  "Unauthorized! special access only.",
  "Access denied. Only fluffy creatures allowed.",
  "401: Not fluffy."
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
    const hostname = url.hostname;

    if (hostname === 'api.snubs.dev' || hostname === "api.go-to.wtf") {
      // API domain - only allow management operations
      if (url.pathname === '/l/c' && request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed', message: 'Only POST requests are allowed for this endpoint' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (request.method === 'POST' && url.pathname === '/l/c') {
      // Handle create short URL
      if (request.headers.get('X-Fluffy') !== 'true') {
        return new Response(JSON.stringify({ error: 'Not fluffy enough', message: randomMessage(funny401) }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await request.json();
        const originalUrl = body.url;
        const customSlug = body.slug;

        if (!originalUrl) {
          return new Response(JSON.stringify({ error: 'Bad Request', message: randomMessage(funny400) }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Use custom slug or generate random
        const shortCode = customSlug || Math.random().toString(36).substring(2, 8);

        // Store in KV (overwrite if exists)
        await env.URLS.put(shortCode, originalUrl);

        // Return the short URL
        const shortUrl = `https://snubs.dev/${shortCode}`;
        return new Response(JSON.stringify({ shortUrl }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: 'Bad Request', message: randomMessage(funny400) }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    } else if (request.method === 'PUT' && url.pathname.startsWith('/l/')) {
      // Handle update short URL
      if (request.headers.get('X-Fluffy') !== 'true') {
        return new Response(JSON.stringify({ error: 'Unauthorized', message: randomMessage(funny401) }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const slug = url.pathname.split('/l/')[1];
      if (!slug) {
        return new Response(JSON.stringify({ error: 'Bad Request', message: randomMessage(funny400) }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await request.json();
        const newUrl = body.url;

        if (!newUrl) {
          return new Response(JSON.stringify({ error: 'Bad Request', message: randomMessage(funny400) }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check if exists
        const existing = await env.URLS.get(slug);
        if (!existing) {
          return new Response(JSON.stringify({ error: 'Not Found', message: randomMessage(funny404) }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Update
        await env.URLS.put(slug, newUrl);
        return new Response(JSON.stringify({ shortUrl: `${url.origin}/${slug}` }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: 'Bad Request', message: randomMessage(funny400) }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    } else if (request.method === 'DELETE' && url.pathname.startsWith('/l/')) {
      // Handle delete short URL
      if (request.headers.get('X-Fluffy') !== 'true') {
        return new Response(JSON.stringify({ error: 'Unauthorized', message: randomMessage(funny401) }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const slug = url.pathname.split('/l/')[1];
      if (!slug) {
        return new Response(JSON.stringify({ error: 'Bad Request', message: randomMessage(funny400) }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const existing = await env.URLS.get(slug);
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Not Found', message: randomMessage(funny404) }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await env.URLS.delete(slug);
      return new Response('Deleted', { status: 200 });

    } else if (request.method === 'GET' && url.pathname === '/health') {
      const keys = await env.URLS.list();
      const urlCount = keys.keys.length;
      const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        urlCount: urlCount,
        versionId: versionId,
        versionTag: versionTag,
        versionTimestamp: versionTimestamp
      };
      return new Response(JSON.stringify(health), {
        headers: { 'Content-Type': 'application/json' }
      });

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

    } else if (request.method === 'GET' && url.pathname === '/') {
      return new Response(JSON.stringify({ message: 'Deployment is running', code: 200 }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({ error: 'Not Found', message: randomMessage(funny404) }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    } else if (hostname === 'snubs.dev' || hostname === 'fluffy-links.sdsv.workers.dev' || hostname === "scarlets.group" || hostname === "go-to.wtf") {
      // Public domain - redirects and homepage
      if (request.method === 'GET' && url.pathname === '/') {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&display=swap">
  <meta property="og:title" content="Fluffy Links">
  <meta property="og:description" content="A private URL shortener service">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://${hostname}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Fluffy Links">
  <meta name="twitter:description" content="A private URL shortener service">
  <title>Fluffy Links</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Geist';
      background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
      color: #e0e0e0;
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
      position: relative;
    }
    .container {
      max-width: 600px;
      width: 90%;
      margin: 20px;
      padding: 30px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    h1 {
      color: #fff;
      text-align: center;
      margin-bottom: 10px;
      font-size: 2.2rem;
      font-weight: 700;
      font-family: 'Orkney';
    }
    .subtitle {
      text-align: center;
      color: #bbb;
      margin-bottom: 30px;
      font-size: 1.1rem;
    }
    strong {
      color: #fff;
    }
    @media (max-width: 480px) {
      .container {
        padding: 20px;
        margin: 10px;
      }
      h1 { font-size: 1.8rem; }
      h2 { font-size: 1.3rem; }
      li { padding: 12px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Fluffy Links</h1>
    <p class="subtitle">A private URL shortener service</p>
  </div>
</body>
</html>
      `;
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
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
    } else {
      return new Response('Domain not supported', { status: 404 });
    }
  }
};