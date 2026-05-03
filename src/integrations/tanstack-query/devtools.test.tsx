import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtoolsPanel: () => 'Mock Devtools Panel',
}))

import devtools from '@/integrations/tanstack-query/devtools'

describe('tanstack query devtools registration', () => {
  it('exports the expected devtools metadata', () => {
    expect(devtools.name).toBe('Tanstack Query')
    expect(devtools.render).toBeTruthy()
  })
})
