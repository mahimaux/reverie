import type { VercelRequest, VercelResponse } from '@vercel/node';
import { safetyCheck } from '../lib/api/safety';
import { guard } from '../server/http';

/** POST /safety-check (TRD §5 / §8). Standalone screening of free text. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const body = guard<{ text?: string }>(req, res);
  if (!body) return;
  const text = (body.text || '').toString();
  res.status(200).json(safetyCheck(text));
}
