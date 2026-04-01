import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import {
  Terminal,
  ChevronLeft,
  Play,
  Send,
  ShieldCheck,
  AlertCircle,
  Code2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Editor, loader } from '@monaco-editor/react'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import { useQuery } from '@tanstack/react-query'
import { api, useIsAuthenticated } from '@/stores/userStore'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Challenge } from '@/models/challenge'
import type { EditorLanguage } from '@/models/editor-language'
import type { TestResult } from '@/models/test-result'
import { LANGUAGE_FILE_EXTENSIONS } from '@/models/language-file-extensions'
import { LANGUAGE_LABELS } from '@/models/lagnuage-labels'

const challengeSearchSchema = z.object({
  id: z.coerce.number().int().positive(),
})

function formatDifficulty(difficulty: Challenge['difficulty']) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

function parseValue(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function normalizeValue(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value)
}

function getStarterCode() {
  return [
    'function solution(...args) {',
    '  // Implement your answer here.',
    '  return args',
    '}',
  ].join('\n')
}

function getStarterCodeForLanguage(
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
        '#include <vector>',
        '#include <string>',
        'using namespace std;',
        '',
        'class Solution {',
        'public:',
        '    void solution() {',
        '        // Implement your answer here.',
        '    }',
        '};',
      ].join('\n')
    case 'javascript':
    default:
      return backendStarterCode || getStarterCode()
  }
}

function getInitialCode(challenge?: Challenge) {
  return getStarterCodeForLanguage('javascript', challenge)
}

function buildCodeByLanguage(
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

function getEditorPath(id: number, language: EditorLanguage) {
  return `challenge-${id}/solution.${LANGUAGE_FILE_EXTENSIONS[language]}`
}

export const Route = createFileRoute('/challenge')({
  validateSearch: challengeSearchSchema,
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { id } = Route.useSearch()
  const isAuthenticated = useIsAuthenticated()
  const { theme } = useTheme()
  const [selectedLanguage, setSelectedLanguage] =
    useState<EditorLanguage>('javascript')
  const [codeByLanguage, setCodeByLanguage] =
    useState<Record<EditorLanguage, string>>(buildCodeByLanguage)
  const [activeTestCase, setActiveTestCase] = useState(0)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const challengeQuery = useQuery({
    queryKey: ['challenge', id],
    queryFn: async () => {
      const { data } = await api.get<Challenge>(`/challenges/${id}`)
      return data
    },
  })

  const challenge = challengeQuery.data
  const testCases = challenge?.cases ?? []
  const examples = challenge?.examples ?? []
  const constraints = challenge?.constraints ?? []
  const conditions = challenge?.conditions ?? []
  const code = codeByLanguage[selectedLanguage]
  const isRunnableLanguage = selectedLanguage === 'javascript'

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateEditorTheme = () => {
      const style = getComputedStyle(document.documentElement)

      const colors = {
        background: style.getPropertyValue('--background').trim(),
        foreground: style.getPropertyValue('--foreground').trim(),
        primary: style.getPropertyValue('--primary').trim(),
        accent: style.getPropertyValue('--accent').trim(),
        muted: style.getPropertyValue('--muted-foreground').trim(),
        rare: style.getPropertyValue('--rare').trim(),
        epic: style.getPropertyValue('--epic').trim(),
        destructive: style.getPropertyValue('--destructive').trim(),
      }

      loader.init().then((monaco) => {
        monaco.editor.defineTheme('lockin-theme', {
          base: theme === 'light' ? 'vs' : 'vs-dark',
          inherit: true,
          rules: [
            { token: 'comment', foreground: colors.muted, fontStyle: 'italic' },
            { token: 'keyword', foreground: colors.rare },
            { token: 'number', foreground: colors.epic },
            { token: 'string', foreground: colors.destructive },
          ],
          colors: {
            'editor.background': colors.background,
            'editor.foreground': colors.foreground,
            'editorCursor.foreground': colors.foreground,
            'editor.lineHighlightBackground': colors.accent + '20',
            'editorLineNumber.foreground': colors.muted,
            'editor.selectionBackground': colors.primary + '33',
          },
        })

        monaco.editor.setTheme('lockin-theme')
      })
    }

    const rafId = requestAnimationFrame(() => {
      updateEditorTheme()
    })

    return () => cancelAnimationFrame(rafId)
  }, [theme])

  useEffect(() => {
    setActiveTestCase(0)
    setTestResults([])
    setSelectedLanguage('javascript')
    setCodeByLanguage(buildCodeByLanguage(challenge))
  }, [challenge, id])

  const activeCase = useMemo(
    () => testCases[activeTestCase] ?? null,
    [activeTestCase, testCases],
  )
  const runTestsTooltip = !isAuthenticated
    ? 'Log in to run tests'
    : testCases.length === 0
      ? 'No test cases available'
      : !isRunnableLanguage
        ? 'Test execution currently supports JavaScript only'
        : isRunning
          ? 'Running tests'
          : 'Run the visible test cases'
  const submitTooltip = !isAuthenticated
    ? 'Log in to submit solutions'
    : testCases.length === 0
      ? 'No test cases available'
      : !isRunnableLanguage
        ? 'Submission currently supports JavaScript only'
        : 'Submit your solution'

  const handleRunTests = () => {
    if (!isAuthenticated || !challenge || !isRunnableLanguage) return

    setIsRunning(true)

    const newResults: TestResult[] = []

    try {
      const userFunction = new Function(`
        ${code}
        return typeof solution !== 'undefined' ? solution : null;
      `)()

      if (!userFunction) {
        throw new Error(
          "Function 'solution' not found. Please keep the function name as solution.",
        )
      }

      testCases.forEach((testCase) => {
        const parsedInputs = testCase.inputs.map((input) =>
          parseValue(input.value),
        )
        const expectedValue = parseValue(testCase.expectedOutput)
        const start = performance.now()

        try {
          const actualValue = userFunction(...parsedInputs)
          const end = performance.now()
          const normalizedActual = normalizeValue(actualValue)
          const normalizedExpected = normalizeValue(expectedValue)

          newResults.push({
            passed: normalizedActual === normalizedExpected,
            actual: normalizedActual,
            expected: normalizedExpected,
            runtime: (end - start).toFixed(4),
          })
        } catch (execError) {
          const message =
            execError instanceof Error ? execError.message : 'Unknown error'

          newResults.push({
            passed: false,
            actual: `Runtime Error: ${message}`,
            expected: normalizeValue(expectedValue),
            runtime: '0.0000',
          })
        }
      })

      setTestResults(newResults)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert(`Compilation Error: ${message}`)
    } finally {
      setIsRunning(false)
    }
  }

  if (challengeQuery.isLoading) {
    return (
      <div className="mt-16 flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading challenge...
      </div>
    )
  }

  if (challengeQuery.isError || !challenge) {
    return (
      <div className="mt-16 mx-auto max-w-3xl p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Challenge unavailable</AlertTitle>
          <AlertDescription>
            Unable to load this challenge from the backend.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const allPassed =
    testResults.length > 0 && testResults.every((result) => result.passed)

  return (
    <div className="flex flex-col h-screen bg-background text-muted-foreground mt-16">
      <nav className="h-12 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary-foreground"
                onClick={() => navigate({ to: '/challenges' })}
                aria-label="Back to challenges"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to challenges</TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-foreground text-sm tracking-wider uppercase">
              {challenge.title}
            </span>
            <Badge className="bg-primary/10 text-primary border-primary text-[10px] h-5 uppercase">
              {formatDifficulty(challenge.difficulty)}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Environment Ready
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-100 border-r border-foreground/5 flex flex-col bg-background">
          <div className="p-6 space-y-8 overflow-y-auto">
            <div className="space-y-2">
              <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em]">
                Mission Briefing
              </h3>
              <h1 className="text-3xl text-foreground uppercase tracking-tight">
                {challenge.title}
              </h1>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-foreground">
              {challenge.content
                .split('\n')
                .filter(Boolean)
                .map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
                <Code2 className="w-4 h-4" /> Examples
              </div>

              {examples.length > 0 ? (
                examples.map((example, index) => (
                  <div
                    key={`${example}-${index}`}
                    className="rounded-lg border border-foreground/5 bg-foreground/1 p-4 space-y-2 font-mono text-[13px]"
                  >
                    <div className="text-foreground">Example {index + 1}:</div>
                    <div className="text-muted-foreground whitespace-pre-wrap">
                      {example}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">
                  No examples provided.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-foreground/5 bg-foreground/2 p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-rarity-legendary">
                  <AlertCircle className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-widest">
                    Constraints
                  </h4>
                </div>
                <ul className="space-y-2 font-mono text-[12px] text-foreground">
                  {constraints.length > 0 ? (
                    constraints.map((constraint, index) => (
                      <li key={`${constraint}-${index}`}>{constraint}</li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">
                      No constraints provided.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-foreground/5 bg-foreground/2 p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-widest">
                  Victory Conditions
                </h4>
              </div>
              <ul className="space-y-3">
                {conditions.length > 0 ? (
                  conditions.map((condition, index) => (
                    <li
                      key={`${condition}-${index}`}
                      className="flex items-start gap-3 text-xs text-foreground"
                    >
                      <div className="w-1 h-1 rounded-full bg-foreground mt-1.5" />
                      {condition}
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-muted-foreground">
                    No specific victory conditions provided.
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-auto p-6 border-t border-foreground/5">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">
                Acceptance Rate
              </span>
              <span className="text-[10px] font-mono text-primary">
                {Number(challenge.acceptanceRate).toFixed(1)}%
              </span>
            </div>
            <Progress
              value={Number(challenge.acceptanceRate)}
              className="h-1 bg-primary-foreground"
            />
          </div>
        </aside>

        <main className="flex-1 min-h-0 flex flex-col relative bg-background">
          <div className="flex flex-1 min-h-0 flex-col font-mono text-sm leading-6">
            <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 bg-muted/10">
              <div className="grid gap-1">
                <Label
                  htmlFor="challenge-editor-language"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Editor Language
                </Label>
                <p className="text-xs text-muted-foreground">
                  Syntax highlighting and starter templates switch with the
                  selected language.
                </p>
              </div>
              <Select
                value={selectedLanguage}
                onValueChange={(value) =>
                  setSelectedLanguage(value as EditorLanguage)
                }
              >
                <SelectTrigger id="challenge-editor-language" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-h-0 flex-1">
              <Editor
                key={`${id}-${selectedLanguage}`}
                path={getEditorPath(id, selectedLanguage)}
                language={selectedLanguage}
                options={{
                  minimap: { enabled: true },
                  padding: { top: 24 },
                  readOnly: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
                value={code}
                onChange={(value) =>
                  setCodeByLanguage((current) => ({
                    ...current,
                    [selectedLanguage]: value || '',
                  }))
                }
                theme="lockin-theme"
                loading={
                  <div className="h-full w-full bg-background animate-pulse" />
                }
              />
            </div>
          </div>
          <div className="flex flex-1 min-h-0 flex-col border-t border-border bg-background overflow-hidden">
            <div className="flex items-center h-10 border-b border-border bg-muted/20 px-4 gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-4">
                Test Runner
              </span>
              {testCases.map((_, index) => (
                <Button
                  key={index}
                  onClick={() => setActiveTestCase(index)}
                  variant={activeTestCase === index ? 'default' : 'secondary'}
                  className="rounded-none h-full font-bold"
                >
                  CASE_{index + 1}
                </Button>
              ))}
              <div className="flex h-full gap-3 ml-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button
                        variant="outline"
                        onClick={handleRunTests}
                        disabled={
                          isRunning ||
                          !isAuthenticated ||
                          testCases.length === 0 ||
                          !isRunnableLanguage
                        }
                        className="h-full rounded-none bg-transparent border-foreground/10 hover:bg-primary-foreground text-xs font-bold gap-2"
                      >
                        <Play
                          className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`}
                        />
                        {isRunning ? 'EXECUTING...' : 'RUN TESTS'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{runTestsTooltip}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button
                        disabled={
                          !isAuthenticated ||
                          testCases.length === 0 ||
                          !isRunnableLanguage
                        }
                        onClick={() => {
                          if (!isAuthenticated || !isRunnableLanguage) return

                          if (allPassed) {
                            alert(
                              'MISSION ACCOMPLISHED: taw nzidou il logic mta3 il submission.',
                            )
                          } else {
                            alert('CRITICAL ERROR: code failed.')
                          }
                        }}
                        className="h-full rounded-none bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,207,186,0.4)] text-xs font-bold gap-2 px-8 disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" /> SUBMIT
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{submitTooltip}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="border-b border-border p-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Login Required</AlertTitle>
                  <AlertDescription>
                    Guests can view the challenge, but running tests and
                    submitting code require a signed-in account.
                  </AlertDescription>
                </Alert>
              </div>
            ) : !isRunnableLanguage ? (
              <div className="border-b border-border p-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Execution Limited To JavaScript</AlertTitle>
                  <AlertDescription>
                    Language switching is available in the editor UI, but test
                    execution and submission currently only work for JavaScript.
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}

            <div className="flex-1 p-6 overflow-y-auto font-mono">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      Input Parameters
                    </span>
                    <div className="h-px w-4 bg-border" />
                  </div>

                  {activeCase ? (
                    <div className="grid grid-cols-2 gap-4">
                      {activeCase.inputs.map((input, index) => (
                        <div
                          key={`${input.type}-${index}`}
                          className="bg-muted/30 p-3 rounded border border-border/50"
                        >
                          <div className="text-[9px] text-primary mb-1 uppercase tracking-tighter">
                            {input.type}
                          </div>
                          <div className="text-sm text-foreground wrap-break-word">
                            {input.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No test cases available for this challenge.
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      Execution Output
                    </span>
                    <div className="h-px w-4 bg-border" />
                  </div>

                  {testResults[activeTestCase] ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground uppercase">
                            Actual
                          </span>
                          <div
                            className={`p-3 rounded border font-bold ${
                              testResults[activeTestCase].passed
                                ? 'bg-green-500/5 border-green-500/20 text-green-500'
                                : 'bg-destructive/5 border-destructive/20 text-destructive'
                            }`}
                          >
                            {testResults[activeTestCase].actual}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground uppercase">
                            Expected
                          </span>
                          <div className="bg-muted/30 p-3 rounded border border-border text-foreground">
                            {testResults[activeTestCase].expected}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                        <span className="flex items-center gap-1">
                          <Terminal className="w-3 h-3" /> Runtime:{' '}
                          {testResults[activeTestCase].runtime}ms
                        </span>
                        <span
                          className={
                            testResults[activeTestCase].passed
                              ? 'text-green-500'
                              : 'text-destructive'
                          }
                        >
                          {testResults[activeTestCase].passed
                            ? 'STATUS: SUCCESS'
                            : 'STATUS: FAILURE'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/5">
                      <div className="p-3 rounded-full bg-muted/20 mb-2">
                        <Play className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-widest animate-pulse">
                        Waiting for compilation...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="h-20 border-t border-foreground/5 bg-background flex items-center justify-between px-6">
            <div className="flex items-center gap-4 bg-primary-foreground border border-foreground/10 p-2 pr-6 rounded-lg">
              <div className="w-10 h-10 rounded bg-linear-to-br from-primary to-blue-600 p-px">
                <div className="w-full h-full bg-background rounded flex items-center justify-center overflow-hidden">
                  <img
                    src="/cat.jpg"
                    alt="Pet"
                    className="w-full h-full object-cover opacity-80"
                  />
                </div>
              </div>
              <div>
                <h5 className="text-[10px] font-bold text-foreground leading-none">
                  NEON DRAGON
                </h5>
                <p className="text-[10px] text-primary uppercase font-bold tracking-tighter">
                  Buff Active: +15% XP
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
