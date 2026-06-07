import type { NextApiRequest, NextApiResponse } from 'next';

const TRIPO_API_KEY = process.env.TRIPO_API_KEY;
const TRIPO_BASE = 'https://api.tripo3d.ai/v2/openapi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!TRIPO_API_KEY || TRIPO_API_KEY === 'your-tripo3d-api-key-here') {
    return res.status(500).json({ error: 'TRIPO_API_KEY not configured' });
  }

  if (req.method === 'POST') {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    try {
      const r = await fetch(`${TRIPO_BASE}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TRIPO_API_KEY}` },
        body: JSON.stringify({ type: 'text_to_model', prompt }),
      });
      const data = await r.json() as any;
      if (!r.ok) throw new Error(data.message || 'Failed to create task');
      const taskId = data.data?.task_id;
      if (!taskId) throw new Error('No task_id in response');
      return res.status(200).json({ taskId });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    const { taskId } = req.query;
    if (!taskId || typeof taskId !== 'string') return res.status(400).json({ error: 'taskId required' });

    try {
      const r = await fetch(`${TRIPO_BASE}/task/${taskId}`, {
        headers: { Authorization: `Bearer ${TRIPO_API_KEY}` },
      });
      const data = await r.json() as any;
      if (!r.ok) throw new Error(data.message || 'Failed to check status');

      const status = data.data?.status;
      const modelUrl = data.data?.output?.model || data.data?.model?.url;

      if (status === 'succeeded' && modelUrl) {
        return res.status(200).json({ taskId, status: 'completed', modelUrl });
      } else if (status === 'failed') {
        return res.status(200).json({ taskId, status: 'failed' });
      }
      return res.status(200).json({ taskId, status: status || 'processing' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
