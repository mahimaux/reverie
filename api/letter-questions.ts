import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ReadingContext } from '../lib/types';
import { generateJSON, MODELS } from '../server/anthropic';
import { guard, logMetric } from '../server/http';
import { letterQuestionsPrompt, PERSONA } from '../server/persona';
import { isQuestions } from '../server/schemas';

/** POST /letter-questions (TRD §5 / §7.5). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const body = guard<{ context?: ReadingContext }>(req, res);
  if (!body) return;
  if (!body.context?.situation) {
    res.status(400).json({ error: 'missing_context' });
    return;
  }

  const start = Date.now();
  try {
    const result = await generateJSON(
      {
        system: PERSONA,
        user: letterQuestionsPrompt(body.context),
        model: MODELS.quick,
        maxTokens: 500,
        effort: 'low',
      },
      isQuestions,
    );
    logMetric('letter-questions', Date.now() - start, true);
    res.status(200).json(result);
  } catch {
    logMetric('letter-questions', Date.now() - start, false);
    res.status(502).json({ error: 'generation_failed' });
  }
}
