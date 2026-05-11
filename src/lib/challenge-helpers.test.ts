import { describe, expect, it } from 'vitest'

import type { Challenge } from '@/models/challenge'
import {
  buildCodeByLanguage,
  buildCssBattleDocument,
  buildCssBattleStarterMarkup,
  buildInitialQuizAnswers,
  formatDifficulty,
  getCaseInputValue,
  getEditorPath,
  getStarterCodeForLanguage,
  parseCssBattleColors,
  parseCssColor,
} from '@/lib/challenge-helpers'

const baseChallenge: Challenge = {
  id: 1,
  title: 'Demo',
  content: '...',
  starterCode: 'function solution() { return 1 }',
  starterCodes: {},
  examples: [],
  constraints: [],
  conditions: [],
  cases: [],
  quizQuestions: [],
  difficulty: 'easy',
  type: 'solo',
  topics: [],
  acceptanceRate: 0,
}

describe('challenge helpers', () => {
  it('formatDifficulty capitalizes first letter', () => {
    expect(formatDifficulty('easy')).toBe('Easy')
    expect(formatDifficulty('medium')).toBe('Medium')
    expect(formatDifficulty('hard')).toBe('Hard')
  })

  it('getStarterCodeForLanguage uses backend starterCodes when available', () => {
    const challenge: Challenge = {
      ...baseChallenge,
      starterCode: 'legacy js',
      starterCodes: {
        javascript: 'js from starterCodes',
        python: 'py from starterCodes',
      },
    }

    expect(getStarterCodeForLanguage('javascript', challenge)).toBe(
      'js from starterCodes',
    )
    expect(getStarterCodeForLanguage('python', challenge)).toBe(
      'py from starterCodes',
    )
  })

  it('getStarterCodeForLanguage falls back per-language templates', () => {
    const challenge: Challenge = {
      ...baseChallenge,
      starterCode: '',
      starterCodes: {},
    }

    expect(getStarterCodeForLanguage('typescript', challenge)).toContain(
      'function solution',
    )
    expect(getStarterCodeForLanguage('python', challenge)).toContain(
      'def solution',
    )
    expect(getStarterCodeForLanguage('java', challenge)).toContain(
      'class Solution',
    )
    expect(getStarterCodeForLanguage('cpp', challenge)).toContain(
      'class Solution',
    )
  })

  it('buildCodeByLanguage returns a code map for all languages', () => {
    const challenge: Challenge = {
      ...baseChallenge,
      starterCodes: { typescript: 'ts code' },
      starterCode: 'js code',
    }

    const map = buildCodeByLanguage(challenge)
    expect(Object.keys(map).sort()).toEqual(
      ['cpp', 'java', 'javascript', 'python', 'typescript'].sort(),
    )
    expect(map.javascript).toBe('js code')
    expect(map.typescript).toBe('ts code')
  })

  it('getEditorPath uses language file extensions', () => {
    expect(getEditorPath(123, 'javascript')).toBe('challenge-123/solution.js')
    expect(getEditorPath(123, 'typescript')).toBe('challenge-123/solution.ts')
    expect(getEditorPath(123, 'python')).toBe('challenge-123/solution.py')
    expect(getEditorPath(123, 'java')).toBe('challenge-123/solution.java')
    expect(getEditorPath(123, 'cpp')).toBe('challenge-123/solution.cpp')
  })

  it('buildInitialQuizAnswers initializes all question ids with empty arrays', () => {
    const challenge: Challenge = {
      ...baseChallenge,
      quizQuestions: [
        {
          id: 'q1',
          prompt: 'Q1',
          options: [{ id: 'a', text: 'A' }],
          correctOptionIds: ['a'],
        },
        {
          id: 'q2',
          prompt: 'Q2',
          options: [{ id: 'b', text: 'B' }],
          correctOptionIds: ['b'],
        },
      ],
    }

    expect(buildInitialQuizAnswers(challenge)).toEqual({ q1: [], q2: [] })
    expect(buildInitialQuizAnswers(undefined)).toEqual({})
  })

  it('getCaseInputValue returns matching input values and empty string otherwise', () => {
    expect(getCaseInputValue(null, 'x')).toBe('')

    const testCase = {
      inputs: [
        { type: 'a', value: 'A' },
        { type: 'b', value: 'B' },
      ],
      expectedOutput: 'ignored',
    }

    expect(getCaseInputValue(testCase, 'a')).toBe('A')
    expect(getCaseInputValue(testCase, 'missing')).toBe('')
  })

  it('buildCssBattleDocument embeds html/css/background', () => {
    const doc = buildCssBattleDocument('<div />', 'div{color:red;}', '#000')
    expect(doc).toContain('<body><div /></body>')
    expect(doc).toContain('div{color:red;}')
    expect(doc).toContain('background: #000')
  })

  it('buildCssBattleStarterMarkup includes style only when css is non-empty', () => {
    expect(buildCssBattleStarterMarkup(' <div></div> ', '  ')).toBe(
      '<div></div>',
    )

    expect(buildCssBattleStarterMarkup(' <div></div> ', '  div { }  ')).toBe(
      '<style>div { }</style>\n<div></div>',
    )
  })

  it('parseCssColor parses rgb/rgba with defaults for invalid input', () => {
    expect(parseCssColor('rgb(10, 20, 30)')).toEqual({
      r: 10,
      g: 20,
      b: 30,
      a: 1,
    })
    expect(parseCssColor('rgba(1,2,3,0.5)')).toEqual({
      r: 1,
      g: 2,
      b: 3,
      a: 0.5,
    })
    expect(parseCssColor('not-a-color')).toEqual({ r: 0, g: 0, b: 0, a: 1 })
  })

  it('parseCssBattleColors supports JSON arrays and newline/comma lists', () => {
    expect(parseCssBattleColors('')).toEqual([])
    expect(parseCssBattleColors('["#fff", "  ", null, "#000"]')).toEqual([
      '#fff',
      '#000',
    ])

    expect(parseCssBattleColors('  #fff,\n#000  ')).toEqual(['#fff', '#000'])
  })
})
