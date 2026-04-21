import { useEffect, useState } from 'react'
import { Contrast, MoonStar, Settings, Sun, Type } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type TextSize = 'default' | 'large' | 'x-large'

interface AccessibilitySettings {
  textSize: TextSize
  reduceMotion: boolean
  highContrast: boolean
}

const STORAGE_KEY = 'bytebattle:accessibility-settings'

const defaultSettings: AccessibilitySettings = {
  textSize: 'default',
  reduceMotion: false,
  highContrast: false,
}

function readStoredSettings(): AccessibilitySettings {
  if (typeof window === 'undefined') return defaultSettings

  const rawValue = window.localStorage.getItem(STORAGE_KEY)
  if (!rawValue) return defaultSettings

  try {
    const parsed = JSON.parse(rawValue) as Partial<AccessibilitySettings>

    return {
      textSize:
        parsed.textSize === 'large' || parsed.textSize === 'x-large'
          ? parsed.textSize
          : 'default',
      reduceMotion: Boolean(parsed.reduceMotion),
      highContrast: Boolean(parsed.highContrast),
    }
  } catch {
    return defaultSettings
  }
}

function applySettingsToDocument(settings: AccessibilitySettings) {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  root.dataset.fontSize = settings.textSize
  root.dataset.motion = settings.reduceMotion ? 'reduce' : 'default'
  root.dataset.contrast = settings.highContrast ? 'high' : 'default'
}

export default function AccessibilitySettingsMenu({
  mobile = false,
}: {
  mobile?: boolean
}) {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] =
    useState<AccessibilitySettings>(readStoredSettings)

  useEffect(() => {
    applySettingsToDocument(settings)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }
  }, [settings])

  const activeTheme = theme ?? 'system'

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={mobile ? 'default' : 'sm'}
          className={mobile ? 'w-full h-12 text-base justify-center' : ''}
          aria-label="Open accessibility settings"
        >
          <Settings className="size-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Accessibility Settings</DialogTitle>
          <DialogDescription>
            Customize readability and motion preferences for this device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section aria-labelledby="theme-setting-title" className="space-y-3">
            <p id="theme-setting-title" className="text-sm font-semibold">
              Theme
            </p>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={activeTheme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                aria-pressed={activeTheme === 'light'}
              >
                <Sun className="size-4" aria-hidden="true" />
                Light
              </Button>
              <Button
                variant={activeTheme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                aria-pressed={activeTheme === 'dark'}
              >
                <MoonStar className="size-4" aria-hidden="true" />
                Dark
              </Button>
              <Button
                variant={activeTheme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
                aria-pressed={activeTheme === 'system'}
              >
                System
              </Button>
            </div>
          </section>

          <section
            aria-labelledby="text-size-setting-title"
            className="space-y-3"
          >
            <p id="text-size-setting-title" className="text-sm font-semibold">
              Text size
            </p>

            <Select
              value={settings.textSize}
              onValueChange={(value) => {
                setSettings((previous) => ({
                  ...previous,
                  textSize: value as TextSize,
                }))
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose text size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  <span className="inline-flex items-center gap-2">
                    <Type className="size-4" aria-hidden="true" />
                    Default
                  </span>
                </SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="x-large">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </section>

          <section aria-labelledby="visual-setting-title" className="space-y-3">
            <p id="visual-setting-title" className="text-sm font-semibold">
              Visual preferences
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant={settings.reduceMotion ? 'default' : 'outline'}
                onClick={() => {
                  setSettings((previous) => ({
                    ...previous,
                    reduceMotion: !previous.reduceMotion,
                  }))
                }}
                aria-pressed={settings.reduceMotion}
                className="justify-start"
              >
                Reduce motion
              </Button>

              <Button
                variant={settings.highContrast ? 'default' : 'outline'}
                onClick={() => {
                  setSettings((previous) => ({
                    ...previous,
                    highContrast: !previous.highContrast,
                  }))
                }}
                aria-pressed={settings.highContrast}
                className="justify-start"
              >
                <Contrast className="size-4" aria-hidden="true" />
                High contrast
              </Button>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setTheme('system')
              setSettings(defaultSettings)
            }}
          >
            Reset to defaults
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
