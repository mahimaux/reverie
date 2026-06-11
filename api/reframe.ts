import type { VercelRequest, VercelResponse } from '@vercel/node';
import { safetyCheck } from '../lib/api/safety';
import type { FeelingTag } from '../lib/types';
import { generateJSON, MODELS } from '../server/anthropic';
import { guard, logMetric } from '../server/http';
import { PERSONA, reframePrompt } from '../server/persona';
import { isChapterOne } from '../server/schemas';

/** POST /reframe (+ inline /safety-check, TRD §5 / §8). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const body = guard<{ feelings?: FeelingTag[]; situation?: string }>(req, res);
  if (!body) return;

  const feelings = Array.isArray(body.feelings) ? body.feelings.slice(0, 3) : [];
  const situation = (body.situation || '').toString();
  if (!situation.trim()) {
    res.status(400).json({ error: 'missing_situation' });
    return;
  }

  // Safety pre-check runs before the reframe (TRD §8).
  const safety = safetyCheck(situation);
  if (!safety.ok) {
    res.status(200).json({ safe: false, safety });
    return;
  }

  const start = Date.now();
  try {
    const result = await generateJSON(
      {
        system: PERSONA,
        user: reframePrompt(feelings, situation),
        model: MODELS.quick,
        maxTokens: 700,
        effort: 'low',
      },
      isChapterOne,
    );
    logMetric('reframe', Date.now() - start, true);
    res.status(200).json({ safe: true, result });
  } catch (e) {
    logMetric('reframe', Date.now() - start, false);
    res.status(502).json({ error: 'generation_failed' });
  }
}
