import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type ShortcutItem = {
  action: string
  shortcuts: string[]
}

type KeyboardShortcutsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description: string
  items: ShortcutItem[]
  footerNote?: string
}

function ShortcutKey({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
  title = 'Keyboard Shortcuts',
  description,
  items,
  footerNote,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-foreground">
          {items.map((item) => (
            <div
              key={`${item.action}-${item.shortcuts.join('-')}`}
              className="flex items-center justify-between gap-4"
            >
              <span>{item.action}</span>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {item.shortcuts.map((shortcut) => (
                  <ShortcutKey key={shortcut}>{shortcut}</ShortcutKey>
                ))}
              </div>
            </div>
          ))}
          {footerNote ? (
            <p className="text-xs text-muted-foreground">{footerNote}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
