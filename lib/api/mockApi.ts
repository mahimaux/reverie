/**
 * On-device mock of the Reverie AI backend (TRD §5 to §7).
 *
 * IMPORTANT: this is a FRONTEND build with no Anthropic key and no proxy, so
 * there's no live LLM doing real language understanding. To get as close as
 * possible to the "pocket therapist" behaviour the product wants, this module
 * runs a rule-based analysis of the user's own words and then:
 *   - detects negative self-talk and gently refutes it (it does NOT just agree),
 *   - reads the Chapter 1 situation for its theme + who it's about,
 *   - asks Chapter 2 follow-up questions anchored to that situation,
 *   - asks Chapter 3 questions that are personalised and re-worded every reading,
 *   - writes a letter grounded only in the current session.
 *
 * Swapping to the real Claude backend (which would do true per-input
 * understanding) is a single change behind `client.ts`.
 */
import type {
  ChapterOneResult,
  ChapterThreeResult,
  ChapterTwoResult,
  GeneratedQuestion,
  ReadingContext,
} from '../types';

// ---- timing ----------------------------------------------------------------

const LATENCY_MIN = 1300;
const LATENCY_MAX = 2200;
const delay = () =>
  new Promise<void>((res) =>
    setTimeout(res, LATENCY_MIN + Math.random() * (LATENCY_MAX - LATENCY_MIN)),
  );

// ---- tiny text utils -------------------------------------------------------

function clean(s?: string): string {
  return (s || '').replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '');
}
function capFirst(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function snippet(text: string, max = 90): string {
  const c = clean(text);
  if (c.length <= max) return c;
  return c.slice(0, max).replace(/[,.;:\s]+\S*$/, '') + '…';
}
function feelingsPhrase(feelings: string[]): string {
  const f = feelings.map((x) => x.toLowerCase());
  if (f.length === 0) return 'small';
  if (f.length === 1) return f[0];
  if (f.length === 2) return `${f[0]} and ${f[1]}`;
  return `${f.slice(0, -1).join(', ')}, and ${f[f.length - 1]}`;
}
function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
/** Pick `n` distinct random items, preserving none of the original order. */
function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

// ---- negative self-talk detection + refutation -----------------------------
// The whole point: when someone says something cruel about themselves, we name
// it and push back warmly, with reasons, like a good therapist would.

type NegKind =
  | 'worthless'
  | 'unlovable'
  | 'hopeless'
  | 'failure'
  | 'notEnough'
  | 'ugly'
  | 'stupid'
  | 'unseen'
  | 'behind'
  | 'alone';

interface NegRule {
  kind: NegKind;
  priority: number; // higher = address this first
  re: RegExp;
  refute: string[]; // warm, reason-backed pushbacks (no em dashes)
}

const NEG_RULES: NegRule[] = [
  {
    kind: 'worthless',
    priority: 100,
    re: /\b(worthless|useless|pointless|i don'?t matter|don'?t matter|a burden|burden to|no point in me|good for nothing)\b/i,
    refute: [
      "You are not worthless, and you are not a burden. The world is genuinely better with you in it, even on the days you can't feel that.",
      "I won't agree that you don't matter, because it simply isn't true. Mattering was never something you had to earn. You already do, just by being here.",
    ],
  },
  {
    kind: 'unlovable',
    priority: 95,
    re: /\b(unlovable|nobody (loves|likes|wants) me|no one (loves|likes|wants) me|never (be )?loved|not loved|nobody cares|no one cares)\b/i,
    refute: [
      "The feeling that you're unloved is real, but it is not the truth. You are deeply lovable, and a quiet season of feeling unwanted does not change a thing about that.",
      "You are not unlovable. Not even close. Being unseen for a while is painful, but it is not proof of anything except that the right people haven't gotten close enough yet.",
    ],
  },
  {
    kind: 'hopeless',
    priority: 90,
    re: /\b(hopeless|no hope|never get better|nothing (ever )?works|what'?s the point|give up on (myself|life)|never going to (be|get) (okay|better))\b/i,
    refute: [
      "It makes sense that hope feels far away right now. But feeling hopeless is a symptom of how heavy today is, not a forecast of your future. This lifts. It really does.",
      "I hear how tired you are. Hopeless is what exhaustion feels like from the inside, and it lies. Things can still change, and so can how this feels.",
    ],
  },
  {
    kind: 'failure',
    priority: 80,
    re: /\b(i'?m a failure|i am a failure|such a failure|i (always )?(fail|failed|mess (it )?up|screw (it )?up)|can'?t do anything right|i ruin everything)\b/i,
    refute: [
      "You are not a failure. You are someone who keeps trying, which most people quietly avoid, and trying is the opposite of failing.",
      "One hard outcome is not a verdict on you. A failure is an event, never a person, and definitely never you.",
    ],
  },
  {
    kind: 'notEnough',
    priority: 70,
    re: /\b(not (good |smart |pretty |talented )?enough|never enough|i'?m not enough|not enough for)\b/i,
    refute: [
      "You are not 'not enough.' Enough was never the price of being worthy, and you cleared that bar the day you were born.",
      "Whoever taught you that you had to be more before you counted was wrong. You are already enough, exactly at this size.",
    ],
  },
  {
    kind: 'ugly',
    priority: 60,
    re: /\b(ugly|hideous|disgusting|hate (how i look|my (face|body))|too (fat|skinny|short)|not pretty)\b/i,
    refute: [
      "You are not ugly. Your worth was never a beauty contest, and the people who love you have never once seen you as a list of flaws.",
      "I'm not going to let that one stand. You are not ugly. On your hardest days your mind edits you cruelly, and it is not an honest mirror.",
    ],
  },
  {
    kind: 'stupid',
    priority: 55,
    re: /\b(stupid|dumb|an idiot|so dumb|not smart|i'?m slow|brainless)\b/i,
    refute: [
      "You are not stupid. A tough moment is never a measure of your mind, and the fact that you're reflecting this honestly already proves otherwise.",
      "Nope, not buying 'stupid.' You're being hard on a brain that is doing its best under real pressure.",
    ],
  },
  {
    kind: 'unseen',
    priority: 45,
    re: /\b(never (feel )?seen|feel invisible|invisible|never (picked|chosen|noticed|prioriti[sz]ed|wanted)|overlooked|no one (sees|notices) me)\b/i,
    refute: [
      "Being unseen is one of the loneliest feelings there is, and I'm sorry you're carrying it. But not being noticed is not the same as not being remarkable. You are easy to overlook only because you don't shove yourself into the spotlight, never because you don't deserve to be seen.",
      "You deserve to be seen, fully. Going unnoticed for a while says everything about who's been paying attention and nothing about how much there is to notice in you.",
    ],
  },
  {
    kind: 'behind',
    priority: 35,
    re: /\b(behind in life|falling behind|so far behind|too late|left it too late|everyone(?:'?s| is| else is) ahead|wasted (my|so much) time)\b/i,
    refute: [
      "You're not behind. There is no shared timeline you're losing at. You're exactly on your own, and it is moving at precisely the right speed.",
      "Behind compared to who? The clock you're racing isn't real. You haven't run out of time, I promise.",
    ],
  },
  {
    kind: 'alone',
    priority: 30,
    re: /\b(so alone|all alone|lonely|by myself|i have no (friends|one)|no one (is )?(there|here) for me)\b/i,
    refute: [
      "Feeling alone is so heavy, and I'm sorry it's pressing on you tonight. But alone right now is not alone forever, and you are more held than this moment is letting you feel.",
      "Loneliness can make you feel unwanted, but it isn't the truth about you. You are good company, and the right people are still finding their way to you.",
    ],
  },
];

interface NegHit {
  kind: NegKind;
  phrase: string; // the user's own matched words, cleaned
  refute: string;
}

/** All negative self-statements found, strongest first. */
function detectNegatives(text: string): NegHit[] {
  const hits: { rule: NegRule; phrase: string }[] = [];
  for (const rule of NEG_RULES) {
    const m = rule.re.exec(text);
    if (m) hits.push({ rule, phrase: clean(m[0]) });
  }
  hits.sort((a, b) => b.rule.priority - a.rule.priority);
  return hits.map((h) => ({ kind: h.rule.kind, phrase: h.phrase, refute: rand(h.rule.refute) }));
}

// ---- situation theme + comparison target -----------------------------------

type ThemeKey =
  | 'career'
  | 'money'
  | 'love'
  | 'social'
  | 'looks'
  | 'online'
  | 'talent'
  | 'generic';

const THEME_PATTERNS: { key: ThemeKey; re: RegExp; noun: string }[] = [
  { key: 'career', re: /\b(promot|job|career|work|boss|coworker|colleague|salary|raise|director|manager|role|hired|startup|company|business|intern)\b/i, noun: 'your work and career' },
  { key: 'money', re: /\b(house|mortgage|money|rich|wealth|afford|apartment|car|bought|buy|debt|broke|rent|finance)\b/i, noun: 'money and the home stuff' },
  { key: 'love', re: /\b(wedding|married|marry|engaged|engagement|boyfriend|girlfriend|partner|\bex\b|dating|relationship|husband|wife|single|crush|love life)\b/i, noun: 'the relationship side of things' },
  { key: 'looks', re: /\b(pretty|beautiful|looks|body|weight|skin|attractive|gorgeous|\bhot\b|\bfit\b|ugly|face|mirror)\b/i, noun: 'how you see yourself' },
  { key: 'online', re: /\b(instagram|insta|followers|posted|posting|\bpost\b|tiktok|likes|online|feed|story|stories|reels|viral|social media)\b/i, noun: 'the online comparing' },
  { key: 'talent', re: /\b(talent|talented|skilled|gifted|artist|musician|writer|paint|sing|smart|grades|exam|degree|creative|good at)\b/i, noun: 'your talent and craft' },
  { key: 'social', re: /\b(party|friends|social|group|hangout|gathering|popular|charming|funny|confident|crowd|seen|picked|chosen|invisible)\b/i, noun: 'feeling seen around others' },
];

const WHO_PATTERNS: { re: RegExp; phrase: string }[] = [
  { re: /\bex[-\s]?(boyfriend|girlfriend|partner)?\b/i, phrase: 'your ex' },
  { re: /\bbest friend\b/i, phrase: 'your best friend' },
  { re: /\bfriend\b/i, phrase: 'that friend' },
  { re: /\b(coworker|colleague|workmate)\b/i, phrase: 'that coworker' },
  { re: /\bsister\b/i, phrase: 'your sister' },
  { re: /\bbrother\b/i, phrase: 'your brother' },
  { re: /\bcousin\b/i, phrase: 'your cousin' },
  { re: /\b(classmate|schoolmate)\b/i, phrase: 'that classmate' },
  { re: /\bstranger\b/i, phrase: 'that stranger' },
  { re: /\b(everyone|everybody)\b/i, phrase: 'everyone else' },
];

interface Insight {
  raw: string;
  snip: string;
  who: string;
  hasWho: boolean;
  theme: ThemeKey;
  themeNoun: string;
  negatives: NegHit[];
  feel: string;
}

function analyze(ctx: { situation: string; feelings: string[] }): Insight {
  const situation = ctx.situation || '';
  const theme = THEME_PATTERNS.find((t) => t.re.test(situation));
  const who = WHO_PATTERNS.find((w) => w.re.test(situation));
  return {
    raw: situation,
    snip: snippet(situation),
    who: who ? who.phrase : 'them',
    hasWho: !!who,
    theme: theme ? theme.key : 'generic',
    themeNoun: theme ? theme.noun : 'all of this',
    negatives: detectNegatives(situation),
    feel: feelingsPhrase(ctx.feelings),
  };
}

// ---- Chapter 1: reframe (console + refute, then turn it) -------------------

export async function reframe(
  feelings: string[],
  situation: string,
): Promise<ChapterOneResult> {
  await delay();
  const ins = analyze({ situation, feelings });

  if (ins.negatives.length > 0) {
    // Lead by naming the cruel belief and pushing back on it, with warmth.
    const top = ins.negatives[0];
    const behindTheScenes =
      `Okay, I read what you wrote, and I want to stop on one thing before anything else. ` +
      `You said "${top.phrase}". I'm not going to just nod along to that, because it isn't true. ` +
      `${top.refute} Feeling ${ins.feel} right now is real and allowed, but a feeling is not a fact about your worth.`;
    const secondary = ins.negatives[1];
    const flip =
      (secondary
        ? `And "${secondary.phrase}"? ${secondary.refute} `
        : '') +
      `Here's what I actually notice in what you shared: the fact that this hurts means you care, deeply, and the world quietly needs people who feel things as honestly as you do. You are not too much and not too little. You are needed, exactly as you are right now.`;
    return { behindTheScenes, flip };
  }

  // No explicit self-attack: do the highlight-reel reframe.
  const behindOptions = [
    `Real talk for a second. Feeling ${ins.feel} after this makes complete sense, and you're allowed to feel it. But here's what you didn't get to see: whatever you're measuring yourself against ("${ins.snip}") is the trailer, not the movie. You're comparing your full, unedited day to ${ins.hasWho ? `${ins.who}'s` : "someone's"} three best seconds.`,
    `First, what you're feeling is fair. Feeling ${ins.feel} doesn't make you dramatic, it makes you human. Still, the thing stinging you ("${ins.snip}") almost certainly cost more than it showed. The false starts, the help, the timing, the quiet nights nobody posts. You only ever saw the highlight.`,
    `Hey. The ${ins.feel} is real and I'm not going to talk you out of it. But notice what's missing from the picture. Behind "${ins.snip}" there's a whole reel of edits: the parts that didn't work, the luck that lined up, the cost ${ins.hasWho ? ins.who : 'they'} would never put on display.`,
  ];
  const flipOptions = [
    `And here's the quiet thing this is pointing at: you only ache for what you genuinely care about. This isn't proof you're behind, it's a compass. It's showing you what matters to you, and the world has room for exactly that.`,
    `So let's flip it. The sting is your own wanting, waving at you. It isn't saying you're less. It's pointing at where your heart wants to go, and that direction needs someone like you walking it.`,
    `But notice: comparison only stings where you secretly hope. That's not a wound, it's a clue, and it's naming something worth reaching for. You belong on the way to it.`,
  ];
  return { behindTheScenes: rand(behindOptions), flip: rand(flipOptions) };
}

// ---- Chapter 2: follow-up questions, anchored to Chapter 1 -----------------

export async function superpowerQuestions(
  ctx: ReadingContext,
): Promise<GeneratedQuestion[]> {
  await delay();
  const ins = analyze(ctx);

  // Q1 always anchors directly to what they wrote (a true follow-up).
  const anchor: GeneratedQuestion = {
    id: 'q1',
    text: `You wrote: "${ins.snip}". Sitting with it now, what part of that stings the most?`,
    placeholder: 'e.g. feeling like i was left behind',
  };

  // A pool of therapist-style follow-ups, all tied back to their situation.
  const pool: GeneratedQuestion[] = [
    { id: 'p', text: `You felt ${ins.feel}. When do you first remember feeling that way?`, placeholder: 'e.g. back in school' },
    { id: 'p', text: `If your closest friend felt ${ins.feel} about ${ins.themeNoun}, what would you gently say to them?`, placeholder: 'e.g. that they are doing okay' },
    { id: 'p', text: `When you picture ${ins.who}, what do you imagine they have that you feel you're missing?`, placeholder: 'e.g. confidence' },
    { id: 'p', text: 'What is one thing you handled in that situation that you have given yourself zero credit for?', placeholder: 'e.g. i stayed kind' },
    { id: 'p', text: `What do the people who love you see in you that you struggle to see in yourself?`, placeholder: 'e.g. that i try so hard' },
    { id: 'p', text: `What would feel different in your day if this comparison just... let go of you?`, placeholder: 'e.g. i could breathe' },
  ];

  // If they were cruel to themselves, ask a question that gently interrogates it.
  if (ins.negatives.length > 0) {
    pool.unshift({
      id: 'p',
      text: `You said something like "${ins.negatives[0].phrase}". Whose voice does that really sound like? Is it even yours?`,
      placeholder: 'e.g. not really mine',
    });
  }

  const chosen = sample(pool, 2).map((q, i) => ({ ...q, id: `q${i + 2}` }));
  return [anchor, ...chosen];
}

// ---- Chapter 2: affirmations (analyse each answer, reassure, refute) -------

export async function affirmations(ctx: ReadingContext): Promise<ChapterTwoResult> {
  await delay();
  const qa = ctx.superpowerQA ?? [];
  const answered = qa.map((x) => clean(x.a)).filter((a) => a.length > 0);

  const lines: string[] = [];
  for (const a of answered) {
    if (lines.length >= 3) break;
    const negs = detectNegatives(a);
    if (negs.length > 0) {
      // They put themselves down in the answer too: push back, don't agree.
      lines.push(`You wrote "${a}". ${negs[0].refute}`);
    } else {
      const display = capFirst(a);
      lines.push(
        rand([
          `“${display}.” Hold onto that, because it is exactly the kind of thing that matters most.`,
          `“${display}” is not a small thing. It is quiet proof of who you already are.`,
          `The people around you feel this more than they ever say out loud: “${display}.”`,
          `“${display}” is the part of you that no comparison can touch.`,
        ]),
      );
    }
  }

  const fallback = [
    'You are not behind. You are on your own clock, and it keeps perfect time.',
    'You are rare, not replaceable, and the people near you already feel it.',
    'Nobody else carries your particular kind of light, and the world is better for it.',
    'Where you are right now is allowed to be enough, because you are.',
  ];
  let f = 0;
  while (lines.length < 3) lines.push(fallback[f++]);

  return { affirmations: [lines[0], lines[1], lines[2]] };
}

// ---- Chapter 3: questions (fixed roles, re-worded + personalised each time) -
// Roles stay in order (working, horizon, fear, want) so the letter can read
// them by index, but the wording is freshly chosen and tied to Chapter 1.

export async function letterQuestions(
  ctx: ReadingContext,
): Promise<GeneratedQuestion[]> {
  await delay();
  const ins = analyze(ctx);

  const workingByTheme: Partial<Record<ThemeKey, string[]>> = {
    career: [
      `Setting ${ins.who} aside, what are you quietly working toward in your own work?`,
      `What is the work goal that's actually yours, not a race against ${ins.who}?`,
      `What is one thing you're slowly building toward in your career, even on tired days?`,
    ],
    money: [
      'What are you slowly building toward, money or home wise?',
      'What would "settled" actually look like for you, in your own words?',
    ],
    love: [
      'When it comes to love, what are you quietly hoping will find you?',
      'What kind of closeness are you really longing for?',
    ],
    social: [
      'What kind of being-seen are you quietly hoping for?',
      'What would it look like to feel genuinely wanted in a room?',
    ],
    looks: [
      'What would help you feel more at home in your own skin?',
      'What is one thing you wish you could finally make peace with about yourself?',
    ],
    online: [
      'Away from the feed, what are you actually working toward?',
      'If no one was watching or counting, what would you keep reaching for?',
    ],
    talent: [
      'With your craft, what are you quietly working toward?',
      'What do you want to make or do, just because it is yours?',
    ],
  };
  const workingGeneric = [
    'What are you quietly working toward right now, just for you?',
    'What is the thing you keep reaching for, even on the hard days?',
    'If no one was judging, what would you keep working toward?',
  ];
  const working = rand(workingByTheme[ins.theme] ?? workingGeneric);

  const horizon = rand([
    'How far ahead should future-you write from? A year, five, ten?',
    "Picture future-you who feels okay again. How many years from now is that?",
    'When you imagine this working out, how far away does it feel? A year? Five?',
  ]);

  const fear = ins.negatives.length
    ? rand([
        `What are you most afraid is true about you right now? Say it, and future-you will answer it.`,
        `What's the fear underneath all this that you rarely let yourself admit?`,
      ])
    : rand([
        `What about ${ins.themeNoun} are you most scared won't work out?`,
        `What's the worst story your mind tells you about where this is heading?`,
        'What fear keeps looping in your head when you think about this?',
      ]);

  const want = rand([
    'What does future-you have that present-you wants most?',
    'If you could feel just one thing again, what would it be?',
    'What would you most love to hear is going to be okay?',
  ]);

  return [
    { id: 'q1', text: working, placeholder: 'e.g. finishing what i started' },
    { id: 'q2', text: horizon, placeholder: 'e.g. 5 years' },
    { id: 'q3', text: fear, placeholder: 'e.g. that i left it too late' },
    { id: 'q4', text: want, placeholder: 'e.g. a real sense of peace' },
  ];
}

// ---- Chapter 3: the letter (this session only, unique, consoling) ----------

export async function letter(
  ctx: ReadingContext,
  firstName?: string,
): Promise<ChapterThreeResult> {
  await delay();
  const ins = analyze(ctx);

  const qa = ctx.letterQA ?? [];
  const working = clean(qa[0]?.a);
  const horizonRaw = clean(qa[1]?.a);
  const fear = clean(qa[2]?.a);
  const want = clean(qa[3]?.a);

  const name = firstName?.trim();
  const hi = name ? `Dear ${name},` : 'Hi you,';
  const sign = name || 'Future you';
  const horizon = horizonRaw
    ? /\d/.test(horizonRaw)
      ? `${horizonRaw} from now`
      : horizonRaw
    : 'a few years from now';

  const openings = [
    `I'm writing from ${horizon}, and the first thing I want to say is simple: you are going to be okay. More than okay.`,
    `It's ${horizon}, and I wish you could see what I can see from here. You made it, and it was gentler than you feared.`,
    `From ${horizon}, looking back, I want to start with the thing you most need to hear tonight: it works out.`,
  ];
  const situationLines = [
    `That day you felt ${ins.feel} about "${ins.snip}"? From where I sit now, it was never the whole story about you.`,
    `I remember the night you wrote about "${ins.snip}" and felt ${ins.feel}. You weren't falling behind. You were just early to your own life.`,
    `You felt ${ins.feel} over "${ins.snip}," and I understand why. But that moment was one chapter, not the ending.`,
  ];

  // If they were unkind to themselves, future-you answers it directly.
  const refuteLine =
    ins.negatives.length > 0
      ? `And that thing you believed about yourself, "${ins.negatives[0].phrase}"? ${ins.negatives[0].refute}`
      : '';

  const workingLine = working
    ? `You told me you were quietly working toward "${working}." I need you to know it mattered, and it grew into something bigger than you could see back then.`
    : `That quiet thing you were working on? It grew into more than you could see at the time.`;
  const fearLine = fear
    ? `The part you were scared of, "${fear}," I won't pretend it was a straight line. But you got through it, and it shaped you in ways you'd actually thank it for now.`
    : `The things you were scared of did not break you. They shaped you in ways you would thank them for now.`;
  const wantLine = want
    ? `You wanted "${want}" more than you let on. I'm writing to tell you it finds its way to you.`
    : `The thing you wanted most, the one you barely said out loud, finds its way to you.`;
  const closings = [
    `Be a little gentler with yourself, okay? I'm so proud of where you're standing, even if you can't feel it yet.`,
    `So breathe, and trust your own pace. I'm proud of you, and I've got us from here.`,
    `Keep going at your own speed. You're doing better than you think, and I love you for not giving up.`,
  ];

  const paras = [rand(openings), rand(situationLines)];
  if (refuteLine) paras.push(refuteLine);
  paras.push(workingLine, fearLine);
  if (want) paras.push(wantLine);
  paras.push(rand(closings));

  const body = `${hi}\n\n${paras.join('\n\n')}\n\nLove,\n${sign} 🤍`;
  return { letter: body };
}
