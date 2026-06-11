import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { QA, ReadingContext } from '../lib/types';
import { generateJSON, MODELS } from '../server/anthropic';
import { guard, logMetric } from '../server/http';
import { affirmationsPrompt, PERSONA } from '../server/persona';
import { isAffirmations } from '../server/schemas';

/** POST /affirmations (TRD §5 / §7.4). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const body = guard<{ context?: ReadingContext; superpowerQA?: QA[] }>(req, res);
  if (!body) return;
  if (!body.context?.situation) {
    res.status(400).json({ error: 'missing_context' });
    return;
  }
  const qa = Array.isArray(body.superpowerQA) ? body.superpowerQA : [];

  const start = Date.now();
  try {
    const result = await generateJSON(
      {
        system: PERSONA,
        user: affirmationsPrompt(body.context, qa),
        model: MODELS.quick,
        maxTokens: 400,
        effort: 'low',
      },
      isAffirmations,
    );
    logMetric('affirmations', Date.now() - start, true);
    res.status(200).json(result);
  } catch {
    logMetric('affirmations', Date.now() - start, false);
    res.status(502).json({ error: 'generation_failed' });
  }
}
