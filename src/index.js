const errorCache = new Map();
const CACHE_TTL = 3600;

const errorPrompts = {
  400: "Generate a witty 400 Bad Request error message with a fluffy/squirrel theme. Keep it under 60 characters. Playful and whimsical. Just the message, no explanation.",
  401: "Generate a witty 401 Unauthorized error message with a fluffy/squirrel theme. Keep it under 60 characters. Playful and whimsical. Just the message, no explanation.",
  404: "Generate a witty 404 Not Found error message with a fluffy/squirrel theme. Keep it under 60 characters. Playful and whimsical. Just the message, no explanation."
};

async function sendDiscordWebhook(env, action, slug, url, oldUrl = null) {
  if (!env.DISCORD_WEBHOOK_URL) return;

  const colors = {
    create: 0x2ecc71,
    update: 0xf39c12,
    delete: 0xe74c3c
  };

  const actionVerbs = {
    create: "Created",
    update: "Updated",
    delete: "Deleted"
  };

  const embed = {
    embeds: [{
      title: `${actionVerbs[action]} Short Link`,
      color: colors[action],
      fields: [
        {
          name: "Slug",
          value: `\`${slug}\``,
          inline: true
        },
        {
          name: "URL",
          value: url ? `[${new URL(url).hostname}](${url})` : "*deleted*",
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "Fluffy Links",
        icon_url: "https://go-to.wtf/icon"
      }
    }]
  };

  if (oldUrl && action === "update") {
    embed.embeds[0].fields.push({
      name: "Old URL",
      value: `[${new URL(oldUrl).hostname}](${oldUrl})`,
      inline: false
    });
  }

  try {
    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(embed)
    });
  } catch (e) {}
}

async function generateAIErrorMessage(env, statusCode) {
  const cacheKey = `error_${statusCode}`;
  
  const cached = errorCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return cached.message;
  }

  const response = await env.AI.run(
    "@cf/meta/llama-3.1-8b-instruct-fast",
    { prompt: errorPrompts[statusCode] }
  );

  const message = response.response?.trim() || response.trim();
  
  errorCache.set(cacheKey, {
    message,
    expires: Date.now() + (CACHE_TTL * 1000)
  });

  return message;
}

export default {
  async fetch(request, env) {
    const { id: versionId, tag: versionTag, timestamp: versionTimestamp } = env.CF_VERSION_METADATA;
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
        return new Response(JSON.stringify({ error: 'Not fluffy enough', message: await generateAIErrorMessage(env, 401) }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await request.json();
        const originalUrl = body.url;
        const customSlug = body.slug;

        if (!originalUrl) {
          return new Response(JSON.stringify({ error: 'Bad Request', message: await generateAIErrorMessage(env, 400) }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Use custom slug or generate random
        const shortCode = customSlug || Math.random().toString(36).substring(2, 8);

        // Store in KV (overwrite if exists)
        await env.URLS.put(shortCode, originalUrl);

        // Send Discord webhook
        await sendDiscordWebhook(env, "create", shortCode, originalUrl);

        // Return the short URL
        const shortUrl = `https://snubs.dev/${shortCode}`;
        return new Response(JSON.stringify({ shortUrl }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: 'Bad Request', message: await generateAIErrorMessage(env, 400) }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    } else if (request.method === 'PUT' && url.pathname.startsWith('/l/')) {
      // Handle update short URL
      if (request.headers.get('X-Fluffy') !== 'true') {
        return new Response(JSON.stringify({ error: 'Unauthorized', message: await generateAIErrorMessage(env, 401) }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const slug = url.pathname.split('/l/')[1];
      if (!slug) {
        return new Response(JSON.stringify({ error: 'Bad Request', message: await generateAIErrorMessage(env, 400) }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await request.json();
        const newUrl = body.url;

        if (!newUrl) {
          return new Response(JSON.stringify({ error: 'Bad Request', message: await generateAIErrorMessage(env, 400) }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check if exists
        const existing = await env.URLS.get(slug);
        if (!existing) {
          return new Response(JSON.stringify({ error: 'Not Found', message: await generateAIErrorMessage(env, 404) }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Update
        await env.URLS.put(slug, newUrl);

        // Send Discord webhook
        await sendDiscordWebhook(env, "update", slug, newUrl, existing);

        return new Response(JSON.stringify({ shortUrl: `${url.origin}/${slug}` }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: 'Bad Request', message: await generateAIErrorMessage(env, 400) }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    } else if (request.method === 'DELETE' && url.pathname.startsWith('/l/')) {
      // Handle delete short URL
      if (request.headers.get('X-Fluffy') !== 'true') {
        return new Response(JSON.stringify({ error: 'Unauthorized', message: await generateAIErrorMessage(env, 401) }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const slug = url.pathname.split('/l/')[1];
      if (!slug) {
        return new Response(JSON.stringify({ error: 'Bad Request', message: await generateAIErrorMessage(env, 400) }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const existing = await env.URLS.get(slug);
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Not Found', message: await generateAIErrorMessage(env, 404) }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await env.URLS.delete(slug);

      // Send Discord webhook
      await sendDiscordWebhook(env, "delete", slug, existing);

      return new Response('Deleted', { status: 200 });

    } else if (request.method === 'GET' && url.pathname === '/health') {
      const keys = await env.URLS.list();
      const urlCount = keys.keys.length;
      const health = {
        status: 'OK',
        urlCount: urlCount,
        versionId: versionId,
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
      return new Response(JSON.stringify({"deployment_id": versionId, "deployed_at": versionTimestamp, "links": [stats]}), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (request.method === 'GET' && url.pathname === '/') {
      return new Response(JSON.stringify({ message: 'Deployment is running', code: 200, "deployment_id": versionId, "deployed_at": versionTimestamp }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({ error: 'Not Found', message: await generateAIErrorMessage(env, 404) }), {
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
        return new Response(await generateAIErrorMessage(env, 404), { status: 404 });
      }

      return Response.redirect(originalUrl, 302);

    } else {
      return new Response(await generateAIErrorMessage(env, 404), { status: 404 });
    }
    } else {
      return new Response('Domain not supported', { status: 404 });
    }
  }
};