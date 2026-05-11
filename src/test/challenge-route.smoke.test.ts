import { describe, expect, it, vi } from 'vitest'

vi.mock('@monaco-editor/react', () => ({
  Editor: () => null,
  loader: {
    init: async () => ({
      editor: {
        setTheme: () => {},
        defineTheme: () => {},
      },
    }),
  },
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => options,
  lazyRouteComponent: () => () => null,
  redirect: (value: unknown) => value,
  useNavigate: () => () => {},
}))

describe('challenge route module', () => {
  it('imports without throwing and exports Route', async () => {
    const mod = await import('@/routes/challenge')
    expect(mod.Route).toBeTruthy()
  })
})
