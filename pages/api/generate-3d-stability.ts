import type { NextApiRequest, NextApiResponse } from 'next';

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!STABILITY_API_KEY) {
    return res.status(500).json({ error: 'STABILITY_API_KEY not configured. Get one free at https://platform.stability.ai' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

  try {
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
    formData.append('image', new Blob([imageBuffer], { type: mimeType }), `image.${ext}`);

    const response = await fetch('https://api.stability.ai/v2beta/3d/stable-fast-3d', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STABILITY_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Stability API error: ${response.status} - ${errText}`);
    }

    // SF3D returns the GLB file directly as binary
    const glbBuffer = await response.arrayBuffer();
    const glbBase64 = Buffer.from(glbBuffer).toString('base64');

    return res.status(200).json({
      status: 'completed',
      modelBase64: glbBase64,
      format: 'glb',
    });
  } catch (err: any) {
    console.error('Stability 3D error:', err);
    return res.status(500).json({ error: err.message });
  }
}
