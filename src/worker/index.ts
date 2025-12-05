import { R2Bucket, ScheduledEvent, ExecutionContext } from '@cloudflare/workers-types';

export interface Env {
  IMAGES_BUCKET: R2Bucket;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method === 'POST') {
      return handleUpload(request, env);
    }
    return new Response('Method not allowed', { status: 405 });
  },

  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    await cleanupOldImages(env);
  },
};

export default worker;

async function handleUpload(request: Request, env: Env): Promise<Response> {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new Response('No file provided', { status: 400 });
  }

  const key = `${Date.now()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  await env.IMAGES_BUCKET.put(key, arrayBuffer, {
    customMetadata: {
      uploadedAt: new Date().toISOString(),
    },
  });

  const url = `https://r2.snubs.dev/${key}`; // Replace with actual domain

  return new Response(JSON.stringify({ url, key }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function cleanupOldImages(env: Env) {
  const cutoff = new Date(Date.now() - 8 * 60 * 60 * 1000); // 8 hours ago

  const list = await env.IMAGES_BUCKET.list();
  for (const obj of list.objects) {
    if (obj.customMetadata?.uploadedAt) {
      const uploadedAt = new Date(obj.customMetadata.uploadedAt);
      if (uploadedAt < cutoff) {
        await env.IMAGES_BUCKET.delete(obj.key);
      }
    }
  }
}