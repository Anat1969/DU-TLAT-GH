import type { NextApiRequest, NextApiResponse } from 'next';
import { Anthropic } from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

  try {
    let mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
    let base64Data = imageBase64;

    if (imageBase64.includes(',')) {
      const [header, data] = imageBase64.split(',');
      base64Data = data;
      if (header.includes('image/png')) mimeType = 'image/png';
      else if (header.includes('image/webp')) mimeType = 'image/webp';
    }

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: base64Data },
          },
          {
            type: 'text',
            text: 'Describe this image as a detailed 3D model prompt. Focus on: shapes, materials, textures, lighting, composition, and spatial relationships. Write only the prompt, no preamble, under 150 words.',
          },
        ],
      }],
    });

    const prompt = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    if (!prompt) throw new Error('No prompt generated');

    return res.status(200).json({ prompt });
  } catch (err: any) {
    console.error('Vision error:', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze image' });
  }
}
