import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { QA, ReadingContext } from '../lib/types';
import { generateJSON, MODELS } from '../server/anthropic';
import { guard, logMetric } from '../server/http';
import { letterPrompt, PERSONA } from '../server/persona';
import { isLetter } from '../server/schemas';

/** POST /letter (TRD §5 / §7.6). Uses the richer model by default. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const body = guard<{ context?: ReadingContext; letterQA?: QA[]; firstName?: string }>(
    req,
    res,
  );
  if (!body) return;
  if (!body.context?.situation) {
    res.status(400).json({ error: 'missing_context' });
    return;
  }
  const qa = Array.isArray(body.letterQA) ? body.letterQA : [];

  const start = Date.now();
  try {
    const result = await generateJSON(
      {
        system: PERSONA,
        user: letterPrompt(body.context, qa, body.firstName),
        model: MODELS.letter,
        maxTokens: 900,
        effort: 'medium',
      },
      isLetter,
    );
    logMetric('letter', Date.now() - start, true);
    res.status(200).json(result);
  } catch {
    logMetric('letter', Date.now() - start, false);
    res.status(502).json({ error: 'generation_failed' });
  }
}
