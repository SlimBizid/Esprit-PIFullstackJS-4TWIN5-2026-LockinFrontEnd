import type { Challenge } from '@/models/challenge'
import type { EditorLanguage } from '@/models/editor-language'
import { LANGUAGE_FILE_EXTENSIONS } from '@/models/language-file-extensions'

export function formatDifficulty(difficulty: Challenge['difficulty']) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

export function getStarterCode() {
  return [
    'function solution(...args) {',
    '  // Implement your answer here.',
    '  return args',
    '}',
  ].join('\n')
}

export function getStarterCodeForLanguage(
  language: EditorLanguage,
  challenge?: Challenge,
) {
  const backendStarterCode =
    challenge?.starterCodes?.[language]?.trim() ||
    (language === 'javascript' ? challenge?.starterCode?.trim() : '')

  if (backendStarterCode) {
    return backendStarterCode
  }

  switch (language) {
    case 'typescript':
      return [
        'function solution(...args: unknown[]): unknown {',
        '  // Implement your answer here.',
        '  return args',
        '}',
      ].join('\n')
    case 'python':
      return [
        'def solution(*args):',
        '    # Implement your answer here.',
        '    return args',
      ].join('\n')
    case 'java':
      return [
        'class Solution {',
        '    public Object solution(Object... args) {',
        '        // Implement your answer here.',
        '        return args;',
        '    }',
        '}',
      ].join('\n')
    case 'cpp':
      return [
        'class Solution {',
        'public:',
        '    JsonValue solution(const std::vector<JsonValue>& args) {',
        '        // Implement your answer here.',
        '        return args.empty() ? JsonValue(nullptr) : args[0];',
        '    }',
        '};',
      ].join('\n')
    case 'javascript':
    default:
      return backendStarterCode || getStarterCode()
  }
}

export function getInitialCode(challenge?: Challenge) {
  return getStarterCodeForLanguage('javascript', challenge)
}

export function buildCodeByLanguage(
  challenge?: Challenge,
): Record<EditorLanguage, string> {
  return {
    javascript: getInitialCode(challenge),
    typescript: getStarterCodeForLanguage('typescript', challenge),
    python: getStarterCodeForLanguage('python', challenge),
    java: getStarterCodeForLanguage('java', challenge),
    cpp: getStarterCodeForLanguage('cpp', challenge),
  }
}

export function getEditorPath(id: number, language: EditorLanguage) {
  return `challenge-${id}/solution.${LANGUAGE_FILE_EXTENSIONS[language]}`
}

export function buildInitialQuizAnswers(challenge?: Challenge) {
  return Object.fromEntries(
    (challenge?.quizQuestions ?? []).map((question) => [question.id, []]),
  ) as Record<string, string[]>
}

export function getCaseInputValue(
  testCase: Challenge['cases'][number] | null | undefined,
  type: string,
) {
  if (!testCase) return ''

  const match = testCase.inputs.find((input) => input.type === type)
  return match?.value ?? ''
}

export const DEFAULT_CSS_BATTLE_VIEWPORT = { width: 400, height: 300 }
export const DEFAULT_CSS_BATTLE_BACKGROUND = '#ffffff'
export const CSS_BATTLE_GRID = { columns: 40, rows: 30 }

export function buildCssBattleDocument(
  html: string,
  css: string,
  background: string,
) {
  return `<!doctype html>\n<html>\n  <head>\n    <style>\n      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: ${background}; }\n      ${css}\n    </style>\n  </head>\n  <body>${html}</body>\n</html>`
}

export function buildCssBattleStarterMarkup(html: string, css: string) {
  const trimmedCss = css.trim()
  const trimmedHtml = html.trim()

  if (!trimmedCss) {
    return trimmedHtml
  }

  return `<style>${trimmedCss}</style>\n${trimmedHtml}`
}

export function parseCssColor(value: string) {
  const match = value.match(/rgba?\(([^)]+)\)/i)
  if (!match) return { r: 0, g: 0, b: 0, a: 1 }

  const [r, g, b, a] = match[1]
    .split(',')
    .map((part) => part.trim())
    .map((part, index) => (index === 3 ? Number(part) : Number(part)))

  return {
    r: Number.isFinite(r) ? r : 0,
    g: Number.isFinite(g) ? g : 0,
    b: Number.isFinite(b) ? b : 0,
    a: Number.isFinite(a) ? a : 1,
  }
}

export function parseCssBattleColors(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return [] as string[]
  }

  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => String(entry ?? '').trim())
        .filter((entry) => entry.length > 0)
    }
  } catch {
    // Fallback parsing below.
  }

  return trimmed
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}
