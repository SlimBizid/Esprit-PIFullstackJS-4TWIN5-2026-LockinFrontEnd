import { AlertCircle } from 'lucide-react'

import { RARITY_STYLES } from '@/components/cosmetics/constants'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  COSMETIC_RARITIES,
  COSMETIC_TYPES,
  COSMETIC_TYPE_LABELS,
  type Cosmetic,
  type CosmeticRarity,
  type CosmeticType,
} from '@/models/cosmetic'
import type {
  AchievementOption,
  CosmeticFormState,
} from '@/models/cosmetics-shop'

type CosmeticFormDialogProps = {
  achievements: AchievementOption[]
  achievementsError: string | null
  achievementsLoading: boolean
  editing: Cosmetic | null
  form: CosmeticFormState
  formError: string | null
  isPending: boolean
  onChange: (patch: Partial<CosmeticFormState>) => void
  onClose: () => void
  onSubmit: () => void
  open: boolean
}

export function CosmeticFormDialog({
  achievements,
  achievementsError,
  achievementsLoading,
  editing,
  form,
  formError,
  isPending,
  onChange,
  onClose,
  onSubmit,
  open,
}: CosmeticFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit cosmetic' : 'New cosmetic'}</DialogTitle>
          <DialogDescription>
            Cosmetics sold in the shop need a price. Cosmetics linked to an
            achievement must leave the price empty.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {formError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation error</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cosmetic-image-url">Image URL</Label>
              <Input
                id="cosmetic-image-url"
                placeholder="https://example.com/cosmetic.png"
                value={form.imageUrl}
                onChange={(event) => onChange({ imageUrl: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cosmetic-title">Title</Label>
              <Input
                id="cosmetic-title"
                placeholder="Signal Crown"
                value={form.cosmeticTitle}
                onChange={(event) =>
                  onChange({ cosmeticTitle: event.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cosmetic-price">Price</Label>
              <Input
                id="cosmetic-price"
                placeholder="1200"
                inputMode="numeric"
                value={form.price}
                onChange={(event) => onChange({ price: event.target.value })}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cosmetic-description">Description</Label>
              <Input
                id="cosmetic-description"
                placeholder="A polished reward for coders who like to stand out."
                value={form.cosmeticDescription}
                onChange={(event) =>
                  onChange({ cosmeticDescription: event.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.cosmeticType}
                onValueChange={(value) =>
                  onChange({ cosmeticType: value as CosmeticType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COSMETIC_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {COSMETIC_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rarity</Label>
              <Select
                value={form.cosmeticRarity}
                onValueChange={(value) =>
                  onChange({ cosmeticRarity: value as CosmeticRarity })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COSMETIC_RARITIES.map((rarity) => (
                    <SelectItem key={rarity} value={rarity}>
                      {RARITY_STYLES[rarity].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Achievement reward link</Label>
              <Select
                value={form.achievementId || 'none'}
                onValueChange={(value) =>
                  onChange({ achievementId: value === 'none' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      achievementsLoading
                        ? 'Loading achievements...'
                        : 'No achievement linked'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No achievement linked</SelectItem>
                  {achievements.map((achievement) => (
                    <SelectItem key={achievement.id} value={achievement.id}>
                      {achievement.name} ({achievement.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pick an achievement to add this cosmetic to that reward pool.
              </p>
              {achievementsError ? (
                <p className="text-xs text-destructive">{achievementsError}</p>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending
              ? editing
                ? 'Saving...'
                : 'Creating...'
              : editing
                ? 'Save changes'
                : 'Create cosmetic'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
