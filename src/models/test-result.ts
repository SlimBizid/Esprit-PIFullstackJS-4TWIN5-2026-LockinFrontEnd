export type TestResult = {
  passed: boolean
  actual: string
  expected: string
  runtime: string
  memoryKb?: number | null
  status?: string
}
