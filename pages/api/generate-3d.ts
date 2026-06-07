import type { NextApiRequest, NextApiResponse } from 'next';

const TRIPO_API_KEY = process.env.TRIPO_API_KEY;
const TRIPO_BASE = 'https://api.tripo3d.ai/v2/openapi';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!TRIPO_API_KEY || TRIPO_API_KEY === 'your-tripo3d-api-key-here') {
    return res.status(500).json({ error: 'TRIPO_API_KEY not configured' });
  }

  if (req.method === 'POST') return handlePost(req, res);
  if (req.method === 'GET') return handleGet(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

  try {
    // Step 1: Upload image to Tripo3D → get file_token
    let base64Data = imageBase64;
    let mimeType = 'image/jpeg';
    if (imageBase64.includes(',')) {
      const [header, data] = imageBase64.split(',');
      base64Data = data;
      if (header.includes('image/png')) mimeType = 'image/png';
    }

    const imageBuffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';

    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: mimeType }), `image.${ext}`);

    const uploadRes = await fetch(`${TRIPO_BASE}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TRIPO_API_KEY}` },
      body: formData,
    });

    const uploadData = await uploadRes.json() as any;
    console.log('Upload response:', JSON.stringify(uploadData));

    if (!uploadRes.ok) {
      throw new Error(uploadData.message || `Upload failed: ${uploadRes.status}`);
    }

    const fileToken = uploadData.data?.image_token;
    if (!fileToken) {
      throw new Error('No image_token in upload response');
    }

    // Step 2: Create image_to_model task
    const taskRes = await fetch(`${TRIPO_BASE}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TRIPO_API_KEY}`,
      },
      body: JSON.stringify({
        type: 'image_to_model',
        file: {
          type: ext,
          file_token: fileToken,
        },
      }),
    });

    const taskData = await taskRes.json() as any;
    console.log('Task response:', JSON.stringify(taskData));

    if (!taskRes.ok) {
      throw new Error(taskData.message || `Task creation failed: ${taskRes.status}`);
    }

    const taskId = taskData.data?.task_id;
    if (!taskId) {
      throw new Error('No task_id in response');
    }

    return res.status(200).json({ taskId });
  } catch (err: any) {
    console.error('Generate 3D error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { taskId } = req.query;
  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ error: 'taskId required' });
  }

  try {
    const r = await fetch(`${TRIPO_BASE}/task/${taskId}`, {
      headers: { Authorization: `Bearer ${TRIPO_API_KEY}` },
    });

    const data = await r.json() as any;
    console.log('Poll response:', JSON.stringify(data));

    if (!r.ok) {
      throw new Error(data.message || 'Failed to check status');
    }

    const status = data.data?.status;
    // Tripo3D returns model URL in various paths
    const modelUrl =
      data.data?.output?.model ||
      data.data?.output?.rendered_image ||
      data.data?.model?.url;

    if (status === 'succeeded' && modelUrl) {
      return res.status(200).json({ taskId, status: 'completed', modelUrl });
    } else if (status === 'failed') {
      return res.status(200).json({ taskId, status: 'failed', error: data.data?.message || 'Generation failed' });
    }

    return res.status(200).json({ taskId, status: status || 'processing' });
  } catch (err: any) {
    console.error('Poll error:', err);
    return res.status(500).json({ error: err.message });
  }
}
