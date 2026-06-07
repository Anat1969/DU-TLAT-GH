import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

/**
 * Generates a depth map from an image using client-side canvas analysis.
 * Returns the original image as-is — depth estimation happens in the browser
 * using edge detection + luminance analysis (no API needed, works offline).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // This endpoint just validates the image and returns it.
  // Actual depth map generation happens client-side in DepthViewer
  // using canvas pixel analysis (luminance → depth).
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

  return res.status(200).json({ success: true });
}
