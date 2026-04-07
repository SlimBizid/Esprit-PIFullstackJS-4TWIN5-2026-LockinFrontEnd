import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export type MessageDialogState = {
  title: string
  description: string
  variant?: 'default' | 'destructive'
}

type MessageDialogProps = {
  message: MessageDialogState | null
  onOpenChange: (open: boolean) => void
}

export function MessageDialog({ message, onOpenChange }: MessageDialogProps) {
  const open = !!message

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {message?.variant === 'destructive' ? (
          <>
            <DialogHeader>
              <DialogTitle>{message.title}</DialogTitle>
              <DialogDescription>
                Review the details below.
              </DialogDescription>
            </DialogHeader>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{message.title}</AlertTitle>
              <AlertDescription>{message.description}</AlertDescription>
            </Alert>
          </>
        ) : (
          <DialogHeader>
            <DialogTitle>{message?.title}</DialogTitle>
            <DialogDescription>{message?.description}</DialogDescription>
          </DialogHeader>
        )}
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
