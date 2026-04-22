import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Clock3,
  RotateCcw,
  ShieldCheck,
  ShieldX,
  Siren,
  Trophy,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Challenge, ChallengeCase } from '@/models/challenge'

const CHARACTER_IMPORTS = import.meta.glob(
  '../../public/TNMC_/characters/*.png',
  {
    eager: true,
    import: 'default',
  },
) as Record<string, string>

const CHARACTER_SPRITES = Object.values(CHARACTER_IMPORTS).sort()
const DEFAULT_CHARACTER_SPRITE = '/TNMC_/characters/Terry_Davis.png'
const DEFAULT_TIME_LIMIT_MS = 15_000
const CHARACTER_ENTER_MS = 700
const CASE_REVEAL_MS = 2_750
const CHARACTER_EXIT_MS = 900
const POST_DECISION_HOLD_MS = 3_000

const TNMC_ASSETS = {
  background: '/TNMC_/TNMC_bg.png',
  walls: '/TNMC_/TNMC_walls.png',
  window: '/TNMC_/TNMC_sliding_window.png',
  lights: '/TNMC_/TNMC_lights.png',
  deny: '/TNMC_/TNMC_button.png',
  denyPressed: '/TNMC_/TNMC_button_pressed.png',
  accept: '/TNMC_/TNMC_accept_button.png',
  acceptPressed: '/TNMC_/TNMC_accept_button_pressed.png',
} as const

const PRE_REVIEW_DIALOG = [
  'I wrote this at 3 AM. Please be gentle.',
  'It works on my machine ¯\\_(ツ)_/¯',
  'Is it giving production-ready or is it giving severance package?',
  'Don’t look, just trust me bro.',
  'I cooked. Promise.',
  'Gemini said this was totally fine.',
  'No cap, this might break prod.',
  'Praying to the linter gods right now.',
  'I wrote this myself, no cap, on god fr fr',
]

const ACCEPT_DIALOG = [
  'W PR. We take those.',
  'Wait, really? I mean... obviously.',
  'Merging this before you change your mind.',
  'Time to go pretend I am working for the rest of the day.',
  'It’s giving 10x developer.',
  'May the servers have mercy on us all.',
  'Deploying on a Friday, let’s go.',
  'Slayyy 💅. Straight to main.',
]

const DENY_DIALOG = [
  'Bruh, it’s a feature, not a bug.',
  'Caught me lacking.',
  'Fine, I’ll go cry and ask Slim to fix it.',
  'My imposter syndrome just leveled up.',
  'Guess I am cooked.',
  'L reviewer.',
  'Bold of you to assume I know how to fix that.',
  'You’re just jealous of my 7-layer nested if-statements.',
]

type ReviewDecision = 'accept' | 'deny'
type ReviewOutcome = ReviewDecision | 'timeout'
type CharacterPhase = 'entering' | 'arrived' | 'ready' | 'accepting' | 'denying'

type ReviewCase = {
  id: string
  code: string
  language: string
  expectedDecision: ReviewDecision
  title: string
  note: string
  author: string
  rationale: string
  timeLimitMs: number
}

type ReviewResult = {
  caseId: string
  title: string
  expectedDecision: ReviewDecision
  selectedDecision: ReviewOutcome
  correct: boolean
  timedOut: boolean
  elapsedMs: number
}

function detectLanguageLabel(value: string) {
  const normalized = value.trim().toLowerCase()

  switch (normalized) {
    case 'ts':
      return 'typescript'
    case 'js':
      return 'javascript'
    case 'py':
      return 'python'
    default:
      return normalized || 'plaintext'
  }
}

function parseDecision(value: string): ReviewDecision {
  const normalized = value.trim().toLowerCase()

  if (
    [
      'accept',
      'accepted',
      'approve',
      'approved',
      'allow',
      'pass',
      'true',
      '1',
    ].includes(normalized)
  ) {
    return 'accept'
  }

  return 'deny'
}

function parseTimeLimitMs(inputs: Map<string, string>) {
  const rawValue =
    inputs.get('timelimitms') ??
    inputs.get('time_limit_ms') ??
    inputs.get('timelimit') ??
    inputs.get('time_limit') ??
    inputs.get('time')

  if (!rawValue) {
    return DEFAULT_TIME_LIMIT_MS
  }

  const parsed = Number(rawValue)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TIME_LIMIT_MS
  }

  return parsed >= 1000 ? parsed : parsed * 1000
}

function normalizeReviewCase(
  reviewCase: ChallengeCase,
  index: number,
): ReviewCase {
  const inputs = new Map(
    reviewCase.inputs.map((input) => [
      input.type.trim().toLowerCase(),
      input.value,
    ]),
  )
  const fallbackCode =
    reviewCase.inputs.find((input) => input.value.trim().length > 0)?.value ??
    ''

  return {
    id: `tnmc-${index + 1}`,
    code: inputs.get('code') ?? inputs.get('snippet') ?? fallbackCode,
    language: detectLanguageLabel(
      inputs.get('language') ?? inputs.get('lang') ?? '',
    ),
    expectedDecision: parseDecision(reviewCase.expectedOutput),
    title: inputs.get('title') ?? inputs.get('name') ?? `Case ${index + 1}`,
    note:
      inputs.get('note') ??
      inputs.get('prompt') ??
      inputs.get('summary') ??
      'Make the call before the timer expires.',
    author: inputs.get('author') ?? inputs.get('candidate') ?? 'Unknown coder',
    rationale: inputs.get('rationale') ?? inputs.get('reason') ?? '',
    timeLimitMs: parseTimeLimitMs(inputs),
  }
}

function getCharacterSprite(previousSprite: string | null) {
  const sprites =
    CHARACTER_SPRITES.length > 0
      ? CHARACTER_SPRITES
      : [DEFAULT_CHARACTER_SPRITE]

  if (sprites.length === 1) {
    return sprites[0]
  }

  const nextOptions = sprites.filter((sprite) => sprite !== previousSprite)
  return (
    nextOptions[Math.floor(Math.random() * nextOptions.length)] ?? sprites[0]
  )
}

function getRandomItem(items: string[]) {
  return items[Math.floor(Math.random() * items.length)] ?? ''
}

function formatDuration(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`
}

function getPerformanceLabel(accuracy: number, timedOutCount: number) {
  if (accuracy === 100 && timedOutCount === 0) {
    return 'Perfect gatekeeper'
  }

  if (accuracy >= 80) {
    return 'Sharp instincts'
  }

  if (accuracy >= 60) {
    return 'Serviceable paranoia'
  }

  return 'Needs a tighter review loop'
}

export function ThatsNotMyCoderChallenge({
  challenge,
  onBack,
}: {
  challenge: Challenge
  onBack: () => void
}) {
  const reviewCases = useMemo(
    () =>
      challenge.cases
        .map(normalizeReviewCase)
        .filter((item) => item.code.trim().length > 0),
    [challenge.cases],
  )
  const [sessionKey, setSessionKey] = useState(0)
  const [caseIndex, setCaseIndex] = useState(0)
  const [results, setResults] = useState<ReviewResult[]>([])
  const [timeRemainingMs, setTimeRemainingMs] = useState(
    reviewCases[0]?.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS,
  )
  const [characterPhase, setCharacterPhase] =
    useState<CharacterPhase>('entering')
  const [activeCharacter, setActiveCharacter] = useState(() =>
    getCharacterSprite(null),
  )
  const [pressedDecision, setPressedDecision] = useState<ReviewDecision | null>(
    null,
  )
  const [feedback, setFeedback] = useState<{
    selectedDecision: ReviewOutcome
    correct: boolean
  } | null>(null)
  const [characterDialog, setCharacterDialog] = useState('')
  const [isFinished, setIsFinished] = useState(reviewCases.length === 0)
  const startedAtRef = useRef(performance.now())
  const resolvingRef = useRef(false)
  const activeCaseRef = useRef<ReviewCase | null>(null)
  const caseIndexRef = useRef(0)
  const timeRemainingRef = useRef(
    reviewCases[0]?.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS,
  )
  const characterPhaseRef = useRef<CharacterPhase>('entering')

  const activeCase = reviewCases[caseIndex] ?? null

  useEffect(() => {
    activeCaseRef.current = activeCase
    caseIndexRef.current = caseIndex
    timeRemainingRef.current = timeRemainingMs
    characterPhaseRef.current = characterPhase
  }, [activeCase, caseIndex, characterPhase, timeRemainingMs])

  useEffect(() => {
    setSessionKey(0)
    setCaseIndex(0)
    setResults([])
    setTimeRemainingMs(reviewCases[0]?.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS)
    setCharacterPhase('entering')
    setActiveCharacter(getCharacterSprite(null))
    setPressedDecision(null)
    setFeedback(null)
    setCharacterDialog('')
    setIsFinished(reviewCases.length === 0)
  }, [challenge.id, reviewCases])

  useEffect(() => {
    if (!activeCase || isFinished) {
      return
    }

    resolvingRef.current = false
    startedAtRef.current = performance.now()
    setTimeRemainingMs(activeCase.timeLimitMs)
    timeRemainingRef.current = activeCase.timeLimitMs
    setCharacterPhase('entering')
    setPressedDecision(null)
    setFeedback(null)
    setCharacterDialog(getRandomItem(PRE_REVIEW_DIALOG))
    setActiveCharacter((current) => getCharacterSprite(current))

    const arrivalTimeoutId = window.setTimeout(() => {
      setCharacterPhase('arrived')
    }, CHARACTER_ENTER_MS)

    const revealTimeoutId = window.setTimeout(() => {
      setCharacterPhase('ready')
    }, CHARACTER_ENTER_MS + CASE_REVEAL_MS)

    return () => {
      window.clearTimeout(arrivalTimeoutId)
      window.clearTimeout(revealTimeoutId)
    }
  }, [activeCase, isFinished, sessionKey])

  useEffect(() => {
    if (!activeCase || isFinished || characterPhase !== 'ready') {
      return
    }

    const deadline = performance.now() + activeCase.timeLimitMs
    let frameId = 0

    const tick = () => {
      const remaining = Math.max(0, deadline - performance.now())
      setTimeRemainingMs(remaining)
      timeRemainingRef.current = remaining

      if (remaining <= 0) {
        settleCase('timeout')
        return
      }

      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [activeCase, characterPhase, isFinished, sessionKey])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isFinished || !activeCase || characterPhase !== 'ready') {
        return
      }

      if (event.key.toLowerCase() === 'a') {
        event.preventDefault()
        settleCase('accept')
      }

      if (event.key.toLowerCase() === 'd') {
        event.preventDefault()
        settleCase('deny')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeCase, characterPhase, isFinished, sessionKey])

  function restartSession() {
    setSessionKey((current) => current + 1)
    setCaseIndex(0)
    setResults([])
    setTimeRemainingMs(reviewCases[0]?.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS)
    timeRemainingRef.current =
      reviewCases[0]?.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS
    setCharacterPhase('entering')
    setPressedDecision(null)
    setFeedback(null)
    setIsFinished(reviewCases.length === 0)
    setActiveCharacter(getCharacterSprite(null))
  }

  function settleCase(selectedDecision: ReviewOutcome) {
    const currentCase = activeCaseRef.current

    if (
      !currentCase ||
      characterPhaseRef.current !== 'ready' ||
      resolvingRef.current
    ) {
      return
    }

    resolvingRef.current = true

    if (selectedDecision !== 'timeout') {
      setPressedDecision(selectedDecision)
    }

    const elapsedMs = currentCase.timeLimitMs - timeRemainingRef.current
    const correct = selectedDecision === currentCase.expectedDecision
    const timedOut = selectedDecision === 'timeout'

    setFeedback({
      selectedDecision,
      correct,
    })
    setCharacterDialog(
      getRandomItem(
        selectedDecision === 'accept' ? ACCEPT_DIALOG : DENY_DIALOG,
      ),
    )
    setCharacterPhase(selectedDecision === 'accept' ? 'accepting' : 'denying')

    const nextResult: ReviewResult = {
      caseId: currentCase.id,
      title: currentCase.title,
      expectedDecision: currentCase.expectedDecision,
      selectedDecision,
      correct,
      timedOut,
      elapsedMs: Math.max(0, elapsedMs),
    }

    window.setTimeout(() => {
      setResults((current) => [...current, nextResult])

      if (caseIndexRef.current >= reviewCases.length - 1) {
        setIsFinished(true)
        return
      }

      setCaseIndex((current) => current + 1)
    }, CHARACTER_EXIT_MS + POST_DECISION_HOLD_MS)
  }

  const reviewedCount = results.length
  const totalCases = reviewCases.length
  const progress = totalCases === 0 ? 0 : (reviewedCount / totalCases) * 100
  const accuracy =
    results.length === 0
      ? 0
      : Math.round(
          (results.filter((result) => result.correct).length / results.length) *
            100,
        )
  const timedOutCount = results.filter((result) => result.timedOut).length
  const totalTimeSpentMs = results.reduce(
    (sum, result) => sum + result.elapsedMs,
    0,
  )
  const timeProgress =
    activeCase == null
      ? 0
      : Math.max(
          0,
          Math.min(100, (timeRemainingMs / activeCase.timeLimitMs) * 100),
        )
  const sceneCharacterClass =
    characterPhase === 'accepting'
      ? 'translate-x-[-140%]'
      : characterPhase === 'denying'
        ? 'translate-x-[120%]'
        : characterPhase === 'ready' || characterPhase === 'arrived'
          ? 'translate-x-[-50%]'
          : 'translate-x-[115%]'
  const hasEntranceFinished =
    characterPhase === 'ready' ||
    characterPhase === 'accepting' ||
    characterPhase === 'denying' ||
    isFinished

  if (reviewCases.length === 0) {
    return (
      <div className="mt-16 min-h-screen bg-[#090d14] px-4 py-8 text-[#e7edf6]">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              className="rounded-none border border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to challenges
            </Button>
            <Badge className="rounded-none border border-[#ffcc66]/30 bg-[#ffcc66]/10 text-[#ffcc66]">
              That&apos;s Not My Coder
            </Badge>
          </div>

          <div className="rounded-none border border-white/10 bg-[#111827]/90 p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
            <Siren className="mx-auto mb-4 h-8 w-8 text-[#ff7b72]" />
            <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white">
              No review cases configured
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#aeb8c7]">
              This challenge type expects entries in <code>cases</code> where
              each case contains a <code>code</code> input and an expected
              output of <code>accept</code> or <code>deny</code>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-16 min-h-screen bg-[radial-gradient(circle_at_top,#172130_0%,#090d14_55%,#04060a_100%)] px-4 py-6 text-[#edf4ff]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-none border border-white/10 bg-[#0c1119]/80 px-5 py-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              className="rounded-none border border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Badge className="rounded-none border border-[#ffcc66]/30 bg-[#ffcc66]/10 text-[#ffcc66]">
              That&apos;s Not My Coder
            </Badge>
            <Badge className="rounded-none border border-[#76f7bf]/30 bg-[#76f7bf]/10 text-[#76f7bf]">
              {challenge.difficulty.toUpperCase()}
            </Badge>
          </div>

          <div className="grid gap-1 text-right">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#7f8ca3]">
              Review Queue
            </p>
            <h1 className="text-lg font-black uppercase tracking-[0.2em] text-white">
              {challenge.title}
            </h1>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_22rem]">
          <section className="overflow-hidden rounded-none border border-white/10 bg-[#080c13] shadow-[0_35px_90px_rgba(0,0,0,0.55)]">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img
                src={TNMC_ASSETS.background}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-cover [image-rendering:pixelated]"
              />

              <img
                key={`${activeCharacter}-${caseIndex}-${sessionKey}`}
                src={activeCharacter}
                alt=""
                className={`pointer-events-none absolute bottom-[13%] left-1/2 h-[72%] w-auto max-w-none [image-rendering:pixelated] transition-transform duration-[900ms] ease-[cubic-bezier(0.25,0.9,0.25,1)] ${sceneCharacterClass}`}
              />

              <img
                src={TNMC_ASSETS.walls}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-cover [image-rendering:pixelated]"
              />
              <img
                src={TNMC_ASSETS.window}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-cover [image-rendering:pixelated]"
              />

              {!hasEntranceFinished && characterDialog ? (
                <div className="absolute right-[12%] top-[22%] max-w-[28%] border border-white/10 bg-[#08111d]/92 px-3 py-2 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_rgba(0,0,0,0.35)] sm:text-[0.68rem]">
                  {characterDialog}
                </div>
              ) : null}

              {hasEntranceFinished || isFinished ? (
                <div className="absolute left-1/2 top-[16%] w-[54%] -translate-x-1/2 rounded-none border border-[#9ae6ff]/20 bg-[#040914]/88 p-[clamp(0.65rem,1.8vw,1.1rem)] shadow-[0_20px_50px_rgba(0,0,0,0.38)]">
                  {activeCase && !isFinished ? (
                    <div className="flex h-full flex-col gap-3">
                      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                        <div>
                          <p className="text-[0.5rem] font-bold uppercase tracking-[0.32em] text-[#9ec0ff]">
                            Timer
                          </p>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-none bg-white/10">
                            <div
                              className={`h-full rounded-none transition-all duration-150 ${
                                timeProgress <= 25
                                  ? 'bg-[#ff6b6b]'
                                  : 'bg-[#7cf0a5]'
                              }`}
                              style={{ width: `${timeProgress}%` }}
                            />
                          </div>
                          <p className="mt-2 text-[0.55rem] font-bold uppercase tracking-[0.24em] text-white sm:text-[0.64rem]">
                            {formatDuration(timeRemainingMs)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[0.55rem] font-bold uppercase tracking-[0.35em] text-[#79a9ff]">
                            {activeCase.author}
                          </p>
                          <h2 className="mt-1 text-[clamp(0.9rem,1.6vw,1.2rem)] font-black uppercase tracking-[0.18em] text-white">
                            {activeCase.title}
                          </h2>
                          <Badge className="mt-2 rounded-none border border-white/10 bg-white/5 text-[0.55rem] uppercase tracking-[0.25em] text-[#dbe7ff]">
                            {activeCase.language}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-[0.62rem] leading-5 text-[#aeb8c7] sm:text-xs">
                        {activeCase.note}
                      </p>

                      <pre className="hide-scrollbar min-h-0 min-w-0 flex-1 overflow-auto rounded-none border border-white/8 bg-[#02050c] p-[clamp(0.65rem,1.6vw,1rem)] font-mono text-[0.55rem] leading-[1.45] whitespace-pre-wrap break-all text-[#c8facc] sm:text-[0.68rem]">
                        <code>{activeCase.code}</code>
                      </pre>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                      <Trophy className="h-10 w-10 text-[#ffcc66]" />
                      <div>
                        <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#79a9ff]">
                          Session complete
                        </p>
                        <h2 className="mt-2 text-[clamp(1.2rem,2.5vw,1.8rem)] font-black uppercase tracking-[0.22em] text-white">
                          {getPerformanceLabel(accuracy, timedOutCount)}
                        </h2>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="pointer-events-none absolute inset-0">
                <img
                  src={
                    pressedDecision === 'accept'
                      ? TNMC_ASSETS.denyPressed
                      : TNMC_ASSETS.deny
                  }
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover [image-rendering:pixelated]"
                />
                <img
                  src={
                    pressedDecision === 'deny'
                      ? TNMC_ASSETS.acceptPressed
                      : TNMC_ASSETS.accept
                  }
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover [image-rendering:pixelated]"
                />
              </div>

              <div className="absolute inset-0 z-10">
                <button
                  type="button"
                  className="absolute bottom-[6%] left-[8%] h-[18%] w-[30%] cursor-pointer rounded-none bg-transparent disabled:cursor-not-allowed"
                  onClick={() => settleCase('accept')}
                  disabled={characterPhase !== 'ready' || isFinished}
                  aria-label="Accept this coder"
                />

                <button
                  type="button"
                  className="absolute bottom-[6%] right-[8%] h-[18%] w-[30%] cursor-pointer rounded-none bg-transparent disabled:cursor-not-allowed"
                  onClick={() => settleCase('deny')}
                  disabled={characterPhase !== 'ready' || isFinished}
                  aria-label="Deny this coder"
                />
              </div>

              <img
                src={TNMC_ASSETS.lights}
                alt=""
                className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${
                  timeProgress <= 25 && hasEntranceFinished
                    ? 'brightness-110'
                    : ''
                } [image-rendering:pixelated]`}
              />

              {feedback ? (
                <div className="absolute bottom-[23%] right-[11%] w-[25%] rounded-none border border-white/10 bg-[#07111d]/90 p-3 shadow-[0_12px_35px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center gap-2">
                    {feedback.correct ? (
                      <ShieldCheck className="h-4 w-4 text-[#7cf0a5]" />
                    ) : (
                      <ShieldX className="h-4 w-4 text-[#ff8a80]" />
                    )}
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-white sm:text-[0.72rem]">
                      {feedback.selectedDecision === 'timeout'
                        ? 'Time up'
                        : feedback.correct
                          ? 'Correct call'
                          : 'Wrong call'}
                    </p>
                  </div>
                  {activeCase ? (
                    <p className="mt-2 text-[0.55rem] leading-5 text-[#aeb8c7] sm:text-[0.66rem]">
                      Expected verdict:{' '}
                      <span className="font-bold uppercase text-white">
                        {activeCase.expectedDecision}
                      </span>
                      {activeCase.rationale ? ` • ${activeCase.rationale}` : ''}
                    </p>
                  ) : null}
                  {characterDialog ? (
                    <p className="mt-3 border-t border-white/10 pt-3 text-[0.55rem] font-bold uppercase tracking-[0.18em] text-white sm:text-[0.64rem]">
                      {characterDialog}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <div className="rounded-none border border-white/10 bg-[#0c1119]/85 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#7f8ca3]">
                Progress
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-none bg-white/10">
                <div
                  className="h-full rounded-none bg-[linear-gradient(90deg,#65f0b0_0%,#64b6ff_100%)] transition-all duration-300"
                  style={{ width: `${isFinished ? 100 : progress}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-none border border-white/8 bg-white/5 p-3">
                  <p className="text-[0.65rem] uppercase tracking-[0.3em] text-[#7f8ca3]">
                    Current
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {Math.min(caseIndex + (isFinished ? 1 : 1), totalCases)}/
                    {totalCases}
                  </p>
                </div>
                <div className="rounded-none border border-white/8 bg-white/5 p-3">
                  <p className="text-[0.65rem] uppercase tracking-[0.3em] text-[#7f8ca3]">
                    Accuracy
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {accuracy}%
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-none border border-white/10 bg-[#0c1119]/85 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#7f8ca3]">
                Review Notes
              </p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-none border border-[#7cf0a5]/15 bg-[#7cf0a5]/6 p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#7cf0a5]" />
                    <span className="text-sm font-bold text-white">
                      {results.filter((result) => result.correct).length}{' '}
                      correct calls
                    </span>
                  </div>
                </div>
                <div className="rounded-none border border-[#ff8a80]/15 bg-[#ff8a80]/6 p-3">
                  <div className="flex items-center gap-2">
                    <ShieldX className="h-4 w-4 text-[#ff8a80]" />
                    <span className="text-sm font-bold text-white">
                      {results.filter((result) => !result.correct).length}{' '}
                      misses
                    </span>
                  </div>
                </div>
                <div className="rounded-none border border-[#ffd166]/15 bg-[#ffd166]/6 p-3">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-[#ffd166]" />
                    <span className="text-sm font-bold text-white">
                      {timedOutCount} timeouts
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-none border border-white/10 bg-[#0c1119]/85 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#7f8ca3]">
                Debrief
              </p>
              {isFinished ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-none border border-[#ffcc66]/20 bg-[#ffcc66]/8 p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ffcc66]">
                      {getPerformanceLabel(accuracy, timedOutCount)}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[#d3dceb]">
                      You cleared{' '}
                      {results.filter((result) => result.correct).length} out of{' '}
                      {totalCases} reviews with {timedOutCount} timeout
                      {timedOutCount === 1 ? '' : 's'} in{' '}
                      {formatDuration(totalTimeSpentMs)}.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    {results.map((result) => (
                      <div
                        key={result.caseId}
                        className="rounded-none border border-white/8 bg-white/5 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-white">
                            {result.title}
                          </p>
                          <Badge
                            className={`rounded-none border ${
                              result.correct
                                ? 'border-[#7cf0a5]/30 bg-[#7cf0a5]/10 text-[#7cf0a5]'
                                : 'border-[#ff8a80]/30 bg-[#ff8a80]/10 text-[#ff8a80]'
                            }`}
                          >
                            {result.correct ? 'Correct' : 'Miss'}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs text-[#aeb8c7]">
                          You chose{' '}
                          <span className="font-bold uppercase text-white">
                            {result.selectedDecision}
                          </span>{' '}
                          and the correct answer was{' '}
                          <span className="font-bold uppercase text-white">
                            {result.expectedDecision}
                          </span>
                          . Time spent: {formatDuration(result.elapsedMs)}.
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      className="rounded-none bg-[#76f7bf] px-5 text-[#08111d] hover:bg-[#92ffd1]"
                      onClick={restartSession}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Review again
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-none border border-white/10 bg-white/5 text-white hover:bg-white/10"
                      onClick={onBack}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to challenges
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-sm leading-7 text-[#aeb8c7]">
                  <p>{challenge.content}</p>
                  <p>
                    Each case uses the challenge&apos;s <code>cases</code>{' '}
                    array: put the snippet under an input with type{' '}
                    <code>code</code>, and set the case{' '}
                    <code>expectedOutput</code> to <code>accept</code> or{' '}
                    <code>deny</code>.
                  </p>
                  <div className="rounded-none border border-white/8 bg-white/5 p-3 text-xs leading-6 text-[#cbd5e1]">
                    Optional input keys: <code>title</code>, <code>author</code>
                    , <code>language</code>, <code>note</code>,{' '}
                    <code>rationale</code>, <code>timeLimit</code>.
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
