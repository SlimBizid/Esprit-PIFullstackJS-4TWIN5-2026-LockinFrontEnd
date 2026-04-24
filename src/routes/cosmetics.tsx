import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Coins,
  ImageOff,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  MessageDialog,
  type MessageDialogState,
} from '@/components/message-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  COSMETIC_RARITIES,
  COSMETIC_TYPES,
  COSMETIC_TYPE_LABELS,
  type Cosmetic,
  type CosmeticRarity,
  type CosmeticType,
} from '@/models/cosmetic'
import { api, useIsAdmin, useIsAuthenticated } from '@/stores/userStore'

const FETCH_LIMIT = 200

const RARITY_STYLES: Record<
  CosmeticRarity,
  { badge: string; accent: string; label: string }
> = {
  common: {
    badge: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
    accent: 'from-slate-500/20 to-transparent',
    label: 'Common',
  },
  rare: {
    badge: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
    accent: 'from-sky-500/20 to-transparent',
    label: 'Rare',
  },
  epic: {
    badge: 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200',
    accent: 'from-fuchsia-500/20 to-transparent',
    label: 'Epic',
  },
  legendary: {
    badge: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    accent: 'from-amber-500/20 to-transparent',
    label: 'Legendary',
  },
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback

  const message = error.response?.data?.message

  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string' && message.trim()) return message
  if (error.response?.status === 401) return 'You must be logged in.'
  if (error.response?.status === 403)
    return 'You do not have permission to perform this action.'

  return fallback
}

function formatPrice(price: number | null) {
  if (price == null) return 'Reward only'
  return `${price.toLocaleString()} coins`
}

type CosmeticFormState = {
  imageUrl: string
  cosmeticTitle: string
  cosmeticDescription: string
  cosmeticRarity: CosmeticRarity
  cosmeticType: CosmeticType
  achievementId: string
  price: string
}

const DEFAULT_FORM: CosmeticFormState = {
  imageUrl: '',
  cosmeticTitle: '',
  cosmeticDescription: '',
  cosmeticRarity: 'common',
  cosmeticType: 'avatar',
  achievementId: '',
  price: '',
}

function cosmeticToForm(cosmetic: Cosmetic): CosmeticFormState {
  return {
    imageUrl: cosmetic.imageUrl,
    cosmeticTitle: cosmetic.cosmeticTitle,
    cosmeticDescription: cosmetic.cosmeticDescription,
    cosmeticRarity: cosmetic.cosmeticRarity,
    cosmeticType: cosmetic.cosmeticType,
    achievementId: cosmetic.achievementId ?? '',
    price: cosmetic.price?.toString() ?? '',
  }
}

function validateForm(form: CosmeticFormState): string | null {
  if (!form.imageUrl.trim()) return 'Image URL is required.'
  if (!form.cosmeticTitle.trim()) return 'Title is required.'
  if (!form.cosmeticDescription.trim()) return 'Description is required.'

  if (
    form.achievementId.trim() &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      form.achievementId.trim(),
    )
  ) {
    return 'Achievement ID must be a valid UUID.'
  }

  if (form.price.trim()) {
    const price = Number(form.price)
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(price)) {
      return 'Price must be a non-negative whole number.'
    }
  }

  if (form.achievementId.trim() && form.price.trim()) {
    return 'A cosmetic linked to an achievement cannot have a price.'
  }

  return null
}

function buildPayload(form: CosmeticFormState) {
  return {
    imageUrl: form.imageUrl.trim(),
    cosmeticTitle: form.cosmeticTitle.trim(),
    cosmeticDescription: form.cosmeticDescription.trim(),
    cosmeticRarity: form.cosmeticRarity,
    cosmeticType: form.cosmeticType,
    achievementId: form.achievementId.trim() || null,
    price: form.price.trim() ? Number(form.price.trim()) : null,
  }
}

type ShopCardProps = {
  cosmetic: Cosmetic
  isAdmin: boolean
  onDelete: (cosmetic: Cosmetic) => void
  onEdit: (cosmetic: Cosmetic) => void
}

function ShopCard({ cosmetic, isAdmin, onDelete, onEdit }: ShopCardProps) {
  const [imageError, setImageError] = useState(false)
  const rarity = RARITY_STYLES[cosmetic.cosmeticRarity]

  return (
    <Link
      to="/cosmetic/$id"
      params={{ id: cosmetic.id }}
      className="group relative overflow-hidden border border-border/60 bg-card/90 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_18px_45px_rgba(0,0,0,0.28)]"
    >
      <div
        className={`absolute inset-x-0 top-0 h-40 bg-gradient-to-b ${rarity.accent}`}
      />

      {isAdmin ? (
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-none"
            onClick={(event) => {
              event.preventDefault()
              onEdit(cosmetic)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8 rounded-none"
            onClick={(event) => {
              event.preventDefault()
              onDelete(cosmetic)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <div className="relative flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <Badge className={rarity.badge}>{rarity.label}</Badge>
          <Badge variant="outline" className="rounded-none capitalize">
            {COSMETIC_TYPE_LABELS[cosmetic.cosmeticType]}
          </Badge>
        </div>

        <div className="aspect-[4/3] overflow-hidden border border-border/60 bg-muted/30">
          {imageError ? (
            <div className="flex h-full items-center justify-center">
              <ImageOff className="h-10 w-10 text-muted-foreground/40" />
            </div>
          ) : (
            <img
              src={cosmetic.imageUrl}
              alt={cosmetic.cosmeticTitle}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-black leading-tight text-foreground">
              {cosmetic.cosmeticTitle}
            </h2>
            <div className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary">
              <Coins className="h-4 w-4" />
              {formatPrice(cosmetic.price)}
            </div>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {cosmetic.cosmeticDescription}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-sm">
          <span className="text-muted-foreground">Open cosmetic</span>
          <ArrowRight className="h-4 w-4 text-primary" />
        </div>
      </div>
    </Link>
  )
}

type CosmeticFormDialogProps = {
  editing: Cosmetic | null
  form: CosmeticFormState
  formError: string | null
  isPending: boolean
  onChange: (patch: Partial<CosmeticFormState>) => void
  onClose: () => void
  onSubmit: () => void
  open: boolean
}

function CosmeticFormDialog({
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
              <Label htmlFor="cosmetic-achievement-id">
                Achievement ID{' '}
                <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="cosmetic-achievement-id"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={form.achievementId}
                onChange={(event) =>
                  onChange({ achievementId: event.target.value })
                }
              />
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

export const Route = createFileRoute('/cosmetics')({
  component: CosmeticsPage,
})

function CosmeticsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isAdmin = useIsAdmin()
  const isAuthenticated = useIsAuthenticated()

  const [typeFilter, setTypeFilter] = useState<CosmeticType | 'all'>('all')
  const [rarityFilter, setRarityFilter] = useState<CosmeticRarity | 'all'>(
    'all',
  )
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Cosmetic | null>(null)
  const [form, setForm] = useState<CosmeticFormState>(DEFAULT_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Cosmetic | null>(null)
  const [message, setMessage] = useState<MessageDialogState | null>(null)

  const shopQuery = useQuery({
    queryKey: ['cosmetics', 'shop'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await api.get('/cosmetics/shop', {
        params: { page: 1, limit: FETCH_LIMIT },
      })
      return data as {
        data: Cosmetic[]
        total: number
        page: number
        lastPage: number
      }
    },
  })

  const filteredCosmetics = useMemo(() => {
    const cosmetics = shopQuery.data?.data ?? []
    return cosmetics.filter((cosmetic) => {
      if (typeFilter !== 'all' && cosmetic.cosmeticType !== typeFilter) {
        return false
      }
      if (rarityFilter !== 'all' && cosmetic.cosmeticRarity !== rarityFilter) {
        return false
      }
      return true
    })
  }, [rarityFilter, shopQuery.data?.data, typeFilter])

  const createMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildPayload>) =>
      api.post('/cosmetics', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cosmetics'] })
      closeForm()
      setMessage({
        title: 'Cosmetic created',
        description: 'The cosmetic is now available in the content pipeline.',
      })
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, 'Failed to create cosmetic.'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: ReturnType<typeof buildPayload>
    }) => api.patch(`/cosmetics/${id}`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cosmetics'] })
      closeForm()
      setMessage({
        title: 'Cosmetic updated',
        description: 'The cosmetic has been updated successfully.',
      })
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, 'Failed to update cosmetic.'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cosmetics/${id}`),
    onSuccess: async () => {
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['cosmetics'] })
      setMessage({
        title: 'Cosmetic deleted',
        description: 'The cosmetic has been removed.',
      })
    },
    onError: (error) => {
      setDeleteTarget(null)
      setMessage({
        title: 'Delete failed',
        description: getErrorMessage(error, 'Failed to delete cosmetic.'),
        variant: 'destructive',
      })
    },
  })

  function openCreate() {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(cosmetic: Cosmetic) {
    setEditing(cosmetic)
    setForm(cosmeticToForm(cosmetic))
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setFormError(null)
  }

  function handleSubmit() {
    const validationError = validateForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    const payload = buildPayload(form)
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload })
      return
    }

    createMutation.mutate(payload)
  }

  if (!isAuthenticated) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm space-y-4 text-center">
          <Alert>
            <ShoppingBag className="h-4 w-4" />
            <AlertTitle>Sign in to enter the shop</AlertTitle>
            <AlertDescription>
              Cosmetics are available once you are logged in.
            </AlertDescription>
          </Alert>
          <Button onClick={() => void navigate({ to: '/auth/login' })}>
            Go to login
          </Button>
        </div>
      </main>
    )
  }

  if (shopQuery.isError) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load the shop</AlertTitle>
          <AlertDescription>
            {getErrorMessage(
              shopQuery.error,
              'An unexpected error occurred while loading cosmetics.',
            )}
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden border border-primary/15 bg-[linear-gradient(135deg,rgba(0,207,186,0.16),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] px-6 py-10 sm:px-8">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(0,207,186,0.18),transparent_60%)] opacity-70" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Badge variant="outline" className="rounded-none border-primary/30">
              LockIN Shop
            </Badge>
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-foreground">
                Cosmetics
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Browse the collection of purchasable cosmetics. Each piece is
                crafted to feel like a trophy, even before buying is wired in.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border border-border/60 bg-background/70 px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Shop items
              </div>
              <div className="mt-1 text-2xl font-black">
                {shopQuery.data?.total ?? 0}
              </div>
            </div>
            <div className="border border-border/60 bg-background/70 px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Filtered
              </div>
              <div className="mt-1 text-2xl font-black">
                {filteredCosmetics.length}
              </div>
            </div>
            <div className="border border-border/60 bg-background/70 px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Prices live
              </div>
              <div className="mt-1 text-2xl font-black">Ready</div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 border border-border/60 bg-card/70 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={typeFilter}
            onValueChange={(value) =>
              setTypeFilter(value as CosmeticType | 'all')
            }
          >
            <TabsList className="rounded-none">
              <TabsTrigger value="all">All</TabsTrigger>
              {COSMETIC_TYPES.map((type) => (
                <TabsTrigger key={type} value={type}>
                  {COSMETIC_TYPE_LABELS[type]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={rarityFilter}
              onValueChange={(value) =>
                setRarityFilter(value as CosmeticRarity | 'all')
              }
            >
              <SelectTrigger className="w-44 rounded-none">
                <SelectValue placeholder="All rarities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rarities</SelectItem>
                {COSMETIC_RARITIES.map((rarity) => (
                  <SelectItem key={rarity} value={rarity}>
                    {RARITY_STYLES[rarity].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin ? (
              <Button onClick={openCreate} className="rounded-none">
                <Plus className="mr-2 h-4 w-4" />
                Add cosmetic
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {shopQuery.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[4/5] animate-pulse border border-border/60 bg-muted/40"
            />
          ))}
        </div>
      ) : filteredCosmetics.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No shop cosmetics found</CardTitle>
            <CardDescription>
              Try a different filter combination or add a new priced cosmetic as
              an admin.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCosmetics.map((cosmetic) => (
            <ShopCard
              key={cosmetic.id}
              cosmetic={cosmetic}
              isAdmin={isAdmin}
              onDelete={setDeleteTarget}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      <CosmeticFormDialog
        open={formOpen}
        editing={editing}
        form={form}
        formError={formError}
        isPending={createMutation.isPending || updateMutation.isPending}
        onChange={(patch) => {
          setForm((current) => ({ ...current, ...patch }))
          setFormError(null)
        }}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete cosmetic"
        description={`Are you sure you want to delete "${deleteTarget?.cosmeticTitle}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id)
          }
        }}
      />

      <MessageDialog
        message={message}
        onOpenChange={(open) => {
          if (!open) {
            setMessage(null)
          }
        }}
      />
    </main>
  )
}
