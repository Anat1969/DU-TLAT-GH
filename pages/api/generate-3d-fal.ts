import type { NextApiRequest, NextApiResponse } from 'next';

const FAL_KEY = process.env.FAL_KEY;
const FAL_BASE = 'https://queue.fal.run';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!FAL_KEY) {
    return res.status(500).json({ error: 'FAL_KEY not configured. Get $20 free at https://fal.ai' });
  }

  if (req.method === 'POST') return handlePost(req, res);
  if (req.method === 'GET') return handleGet(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

  try {
    // Use Hyper3D Rodin via fal.ai
    const dataUrl = imageBase64.includes(',') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

    const response = await fetch(`${FAL_BASE}/fal-ai/hyper3d/rodin`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: dataUrl,
        geometry_file_format: 'glb',
        material: 'PBR',
        quality: 'medium',
        tier: 'Regular',
      }),
    });

    const data = await response.json() as any;
    console.log('fal.ai response:', JSON.stringify(data));

    if (!response.ok) {
      throw new Error(data.detail || data.message || `fal.ai error: ${response.status}`);
    }

    // fal.ai queue returns request_id for polling
    if (data.request_id) {
      return res.status(200).json({ taskId: data.request_id });
    }

    // If immediate result (unlikely for 3D)
    if (data.model_mesh?.url) {
      return res.status(200).json({ status: 'completed', modelUrl: data.model_mesh.url });
    }

    throw new Error('Unexpected response from fal.ai');
  } catch (err: any) {
    console.error('fal.ai error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { taskId } = req.query;
  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ error: 'taskId required' });
  }

  try {
    const response = await fetch(`${FAL_BASE}/fal-ai/hyper3d/rodin/requests/${taskId}/status`, {
      headers: { Authorization: `Key ${FAL_KEY}` },
    });

    const data = await response.json() as any;

    if (data.status === 'COMPLETED') {
      // Fetch the actual result
      const resultRes = await fetch(`${FAL_BASE}/fal-ai/hyper3d/rodin/requests/${taskId}`, {
        headers: { Authorization: `Key ${FAL_KEY}` },
      });
      const result = await resultRes.json() as any;
      const modelUrl = result.model_mesh?.url;

      if (modelUrl) {
        return res.status(200).json({ taskId, status: 'completed', modelUrl });
      }
      return res.status(200).json({ taskId, status: 'completed', error: 'No model URL in result' });
    } else if (data.status === 'FAILED') {
      return res.status(200).json({ taskId, status: 'failed', error: data.error || 'Generation failed' });
    }

    return res.status(200).json({ taskId, status: 'processing' });
  } catch (err: any) {
    console.error('fal.ai poll error:', err);
    return res.status(500).json({ error: err.message });
  }
}
