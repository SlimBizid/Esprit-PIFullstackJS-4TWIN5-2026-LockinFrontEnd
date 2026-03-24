import { createFileRoute } from '@tanstack/react-router'
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
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export const Route = createFileRoute('/challenge')({
  component: RouteComponent,
})

function RouteComponent() {
  const difficulty = 'easy'
  const title = `two sum`
  const task = (
    <>
      <p>
        Given an array of integers{' '}
        <code className="text-primary bg-primary/5 px-1 rounded">nums</code> and
        an integer{' '}
        <code className="text-primary bg-primary/5 px-1 rounded">target</code>,
        return indices of the two numbers such that they add up to target.
      </p>
      <p>
        You may assume that each input would have{' '}
        <strong className="text-foreground">exactly one solution</strong>, and
        you may not use the same element twice.
      </p>
      <p>You can return the answer in any order.</p>
    </>
  )
  const examples = [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
    },
    { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    { input: 'nums = [3,3], target = 6', output: '[0,1]' },
  ]
  const constraints = [
    '2 <= nums.length <= 10⁴',
    '-10⁹ <= nums[i] <= 10⁹',
    '-10⁹ <= target <= 10⁹',
    'Only one valid answer exists.',
  ]
  const followup =
    'Can you come up with an algorithm that is less than O(n²) time complexity?'
  const conditions = [
    'Function must return exact expected output',
    'Time complexity must not exceed O(n)',
    'No external libraries permitted',
  ]
  const [code, setCode] = useState(
    'function twoSum(nums, target) {\n\tconst map = new Map(); // val : index\n\tfor (let i = 0; i < nums.length; i++) {\n\t\tconst complement = target - nums[i];\n\t\tif (map.has(complement)) {\n\t\t\treturn [map.get(complement), i];\n\t\t}\n\t\tmap.set(nums[i], i);\n\t}\n}',
  )

  const { theme } = useTheme()

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

  const [activeTestCase, setActiveTestCase] = useState(0)
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const handleRunTests = () => {
    setIsRunning(true)

    const newResults: any[] = []

    try {
      const userFunction = new Function(`
      ${code} 
      return typeof twoSum !== 'undefined' ? twoSum : null;
    `)()

      if (!userFunction) {
        throw new Error(
          "Function 'twoSum' not found. Please do not rename the function.",
        )
      }

      testInputs.forEach((input, i) => {
        const start = performance.now()

        try {
          const actualValue = userFunction(input.nums, input.target)
          const end = performance.now()

          const expectedValue = JSON.parse(examples[i].output)
          const isCorrect =
            JSON.stringify(actualValue) === JSON.stringify(expectedValue)

          newResults.push({
            passed: isCorrect,
            actual: JSON.stringify(actualValue),
            expected: examples[i].output,
            runtime: (end - start).toFixed(4),
          })
        } catch (execError: any) {
          newResults.push({
            passed: false,
            actual: `Runtime Error: ${execError.message}`,
            expected: examples[i].output,
            runtime: '0.0000',
          })
        }
      })

      setTestResults(newResults)
    } catch (err: any) {
      alert(`Compilation Error: ${err.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const testInputs = [
    { nums: [2, 7, 11, 15], target: 9 },
    { nums: [3, 2, 4], target: 6 },
    { nums: [3, 3], target: 6 },
  ]

  return (
    <div className="flex flex-col h-screen bg-background text-muted-foreground mt-16">
      <nav className="h-12 border-b border-border flex items-center justify-between px-4 ">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-foreground text-sm tracking-wider uppercase">
              {title}
            </span>
            <Badge className="bg-primary/10 text-primary border-primary text-[10px] h-5 uppercase">
              {difficulty}
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
              <h1 className="text-3xl text-foreground uppercase tracking-tight uppercase">
                {title}
              </h1>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-foreground">
              {task}
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
                <Code2 className="w-4 h-4" /> Examples
              </div>

              {examples.map((ex, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-foreground/5 bg-foreground/1 p-4 space-y-2 font-mono text-[13px]"
                >
                  <div className="text-foreground">Example {i + 1}:</div>
                  <div>
                    <span className="text-primary">Input:</span>{' '}
                    <span className="text-muted-foreground">{ex.input}</span>
                  </div>
                  <div>
                    <span className="text-primary">Output:</span>{' '}
                    <span className="text-muted-foreground">{ex.output}</span>
                  </div>
                  {ex.explanation && (
                    <div>
                      <span className="text-foreground italic">
                        // {ex.explanation}
                      </span>
                    </div>
                  )}
                </div>
              ))}
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
                  {constraints.map((constraint, i) => (
                    <li key={i}>{constraint}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-foreground/5">
                <h4 className="text-[10px] font-bold text-primary uppercase mb-2 tracking-tighter">
                  Follow-up:
                </h4>
                <p className="text-xs text-foreground italic">{followup}</p>
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
                {conditions.map((condition, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-xs text-foreground"
                  >
                    <div className="w-1 h-1 rounded-full bg-foreground mt-1.5" />
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-auto p-6 border-t border-foreground/5">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">
                Session Progress
              </span>
              <span className="text-[10px] font-mono text-primary">65%</span>
            </div>
            <Progress value={65} className="h-1 bg-primary-foreground" />
          </div>
        </aside>

        <main className="flex-1 flex flex-col relative bg-background">
          <div className="flex-1 font-mono text-sm leading-6">
            <Editor
              defaultLanguage="javascript"
              options={{
                minimap: { enabled: true },
                padding: { top: 24 },
                readOnly: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="lockin-theme"
              loading={
                <div className="h-full w-full bg-background animate-pulse" />
              }
            />
          </div>
          <div className="flex-1 border-t border-border bg-background flex flex-col overflow-hidden">
            <div className="flex items-center h-10 border-b border-border bg-muted/20 px-4 gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-4">
                Test Runner
              </span>
              {examples.map((_, i) => (
                <Button
                  key={i}
                  onClick={() => setActiveTestCase(i)}
                  variant={`${activeTestCase === i ? 'default' : 'secondary'}`}
                  className={`rounded-none h-full font-bold`}
                >
                  CASE_{i + 1}
                </Button>
              ))}
              <div className="flex h-full  gap-3 ml-auto">
                <Button
                  variant="outline"
                  onClick={handleRunTests}
                  disabled={isRunning}
                  className=" h-full rounded-none bg-transparent border-foreground/10 hover:bg-primary-foreground text-xs font-bold gap-2"
                >
                  <Play
                    className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`}
                  />
                  {isRunning ? 'EXECUTING...' : 'RUN TESTS'}
                </Button>

                <Button
                  onClick={() => {
                    const allPassed =
                      testResults.length > 0 &&
                      testResults.every((r) => r.passed)
                    if (allPassed) {
                      alert(
                        'MISSION ACCOMPLISHED: taw nzidou il logic mta3 il submission.',
                      )
                    } else {
                      alert('CRITICAL ERROR: code failed.')
                    }
                  }}
                  className="h-full rounded-none bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,207,186,0.4)] text-xs font-bold gap-2 px-8"
                >
                  <Send className="w-3 h-3" /> SUBMIT
                </Button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto font-mono">
              <div className=" space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      Input Parameters
                    </span>
                    <div className="h-px w-4 bg-border" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-3 rounded border border-border/50">
                      <div className="text-[9px] text-primary mb-1 uppercase tracking-tighter">
                        nums
                      </div>
                      <div className="text-sm text-foreground">
                        [{testInputs[activeTestCase].nums.join(', ')}]
                      </div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded border border-border/50">
                      <div className="text-[9px] text-primary mb-1 uppercase tracking-tighter">
                        target
                      </div>
                      <div className="text-sm text-foreground">
                        {testInputs[activeTestCase].target}
                      </div>
                    </div>
                  </div>
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
