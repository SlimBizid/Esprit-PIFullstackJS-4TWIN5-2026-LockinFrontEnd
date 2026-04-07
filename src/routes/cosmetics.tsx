import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ImageOff,
} from 'lucide-react'
import { api, useIsAdmin, useIsAuthenticated } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  MessageDialog,
  type MessageDialogState,
} from '@/components/message-dialog'
import type { Cosmetic, CosmeticRarity, CosmeticType } from '@/models/cosmetic'

// ─── Constants ──────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 12
const FETCH_LIMIT = 200

const RARITY_ORDER: CosmeticRarity[] = ['common', 'rare', 'epic', 'legendary']

const RARITY_STYLES: Record<
  CosmeticRarity,
  { badge: string; ring: string; glow: string; label: string }
> = {
  common: {
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    ring: 'ring-1 ring-slate-500/30',
    glow: '',
    label: 'Common',
  },
  rare: {
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    ring: 'ring-1 ring-blue-500/40',
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.15)]',
    label: 'Rare',
  },
  epic: {
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    ring: 'ring-2 ring-purple-500/50',
    glow: 'shadow-[0_0_16px_rgba(168,85,247,0.2)]',
    label: 'Epic',
  },
  legendary: {
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    ring: 'ring-2 ring-amber-500/60',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    label: 'Legendary',
  },
}

const TYPE_LABELS: Record<CosmeticType, string> = {
  skin: 'Skin',
  emote: 'Emote',
  avatar: 'Avatar',
  banner: 'Banner',
}

const COSMETIC_TYPES: CosmeticType[] = ['skin', 'emote', 'avatar', 'banner']
const COSMETIC_RARITIES: CosmeticRarity[] = [
  'common',
  'rare',
  'epic',
  'legendary',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Form state ──────────────────────────────────────────────────────────────

type CosmeticFormState = {
  imageUrl: string
  cosmeticTitle: string
  cosmeticDescription: string
  cosmeticRarity: CosmeticRarity
  cosmeticType: CosmeticType
  achievementId: string
}

const DEFAULT_FORM: CosmeticFormState = {
  imageUrl: '',
  cosmeticTitle: '',
  cosmeticDescription: '',
  cosmeticRarity: 'common',
  cosmeticType: 'avatar',
  achievementId: '',
}

function cosmeticToForm(c: Cosmetic): CosmeticFormState {
  return {
    imageUrl: c.imageUrl,
    cosmeticTitle: c.cosmeticTitle,
    cosmeticDescription: c.cosmeticDescription,
    cosmeticRarity: c.cosmeticRarity,
    cosmeticType: c.cosmeticType,
    achievementId: c.achievementId ?? '',
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
  )
    return 'Achievement ID must be a valid UUID.'
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
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type CosmeticCardProps = {
  cosmetic: Cosmetic
  isAdmin: boolean
  onEdit: (cosmetic: Cosmetic) => void
  onDelete: (cosmetic: Cosmetic) => void
}

function CosmeticCard({
  cosmetic,
  isAdmin,
  onEdit,
  onDelete,
}: CosmeticCardProps) {
  const rarity = RARITY_STYLES[cosmetic.cosmeticRarity]
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className={`group relative flex flex-col rounded-xl overflow-hidden bg-card border border-border transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 ${rarity.ring} ${rarity.glow}`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {!imgError ? (
          <img
            src={cosmetic.imageUrl}
            alt={cosmetic.cosmeticTitle}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}

        {/* Rarity ribbon */}
        <span
          className={`absolute top-2 left-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${rarity.badge}`}
        >
          {rarity.label}
        </span>

        {/* Admin actions overlay */}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7"
              onClick={() => onEdit(cosmetic)}
              aria-label="Edit cosmetic"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-7 w-7"
              onClick={() => onDelete(cosmetic)}
              aria-label="Delete cosmetic"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight line-clamp-1">
            {cosmetic.cosmeticTitle}
          </p>
          <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
            {TYPE_LABELS[cosmetic.cosmeticType]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {cosmetic.cosmeticDescription}
        </p>
      </div>
    </div>
  )
}

// ─── Form dialog ──────────────────────────────────────────────────────────────

type CosmeticFormDialogProps = {
  open: boolean
  editing: Cosmetic | null
  form: CosmeticFormState
  formError: string | null
  isPending: boolean
  onChange: (patch: Partial<CosmeticFormState>) => void
  onSubmit: () => void
  onClose: () => void
}

function CosmeticFormDialog({
  open,
  editing,
  form,
  formError,
  isPending,
  onChange,
  onSubmit,
  onClose,
}: CosmeticFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit Cosmetic' : 'New Cosmetic'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update the details of this cosmetic item.'
              : 'Fill in the details to add a new cosmetic to the shop.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation error</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              placeholder="https://example.com/image.png"
              value={form.imageUrl}
              onChange={(e) => onChange({ imageUrl: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cosmeticTitle">Title</Label>
            <Input
              id="cosmeticTitle"
              placeholder="Shadow Cloak"
              value={form.cosmeticTitle}
              onChange={(e) => onChange({ cosmeticTitle: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cosmeticDescription">Description</Label>
            <Input
              id="cosmeticDescription"
              placeholder="A dark cloak worn by the most dedicated coders."
              value={form.cosmeticDescription}
              onChange={(e) =>
                onChange({ cosmeticDescription: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select
                value={form.cosmeticType}
                onValueChange={(v) =>
                  onChange({ cosmeticType: v as CosmeticType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COSMETIC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Rarity</Label>
              <Select
                value={form.cosmeticRarity}
                onValueChange={(v) =>
                  onChange({ cosmeticRarity: v as CosmeticRarity })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COSMETIC_RARITIES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {RARITY_STYLES[r].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="achievementId">
              Achievement ID{' '}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="achievementId"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={form.achievementId}
              onChange={(e) => onChange({ achievementId: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending
              ? editing
                ? 'Saving…'
                : 'Creating…'
              : editing
                ? 'Save changes'
                : 'Create cosmetic'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/cosmetics')({
  component: CosmeticsPage,
})

function CosmeticsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isAdmin = useIsAdmin()
  const isAuthenticated = useIsAuthenticated()

  // ── Filter / pagination state
  const [typeFilter, setTypeFilter] = useState<CosmeticType | 'all'>('all')
  const [rarityFilter, setRarityFilter] = useState<CosmeticRarity | 'all'>(
    'all',
  )
  const [page, setPage] = useState(1)

  // ── Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Cosmetic | null>(null)
  const [form, setForm] = useState<CosmeticFormState>(DEFAULT_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Cosmetic | null>(null)
  const [message, setMessage] = useState<MessageDialogState | null>(null)

  // ── Fetch
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cosmetics'],
    queryFn: async () => {
      const { data } = await api.get('/cosmetics', {
        params: { page: 1, limit: FETCH_LIMIT },
      })
      return data as {
        data: Cosmetic[]
        total: number
        page: number
        lastPage: number
      }
    },
    enabled: isAuthenticated,
  })

  // ── Filtered + paginated cosmetics
  const filtered = useMemo(() => {
    if (!data) return []
    return data.data.filter((c) => {
      if (typeFilter !== 'all' && c.cosmeticType !== typeFilter) return false
      if (rarityFilter !== 'all' && c.cosmeticRarity !== rarityFilter)
        return false
      return true
    })
  }, [data, typeFilter, rarityFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  // Reset to page 1 when filters change
  function applyTypeFilter(v: CosmeticType | 'all') {
    setTypeFilter(v)
    setPage(1)
  }

  function applyRarityFilter(v: CosmeticRarity | 'all') {
    setRarityFilter(v)
    setPage(1)
  }

  // ── Create mutation
  const createMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildPayload>) =>
      api.post('/cosmetics', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cosmetics'] })
      closeForm()
      setMessage({
        title: 'Cosmetic created',
        description: 'The new cosmetic has been added to the shop.',
      })
    },
    onError: (err) => {
      setFormError(getErrorMessage(err, 'Failed to create cosmetic.'))
    },
  })

  // ── Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: ReturnType<typeof buildPayload>
    }) => api.patch(`/cosmetics/${id}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cosmetics'] })
      closeForm()
      setMessage({
        title: 'Cosmetic updated',
        description: 'The cosmetic has been saved successfully.',
      })
    },
    onError: (err) => {
      setFormError(getErrorMessage(err, 'Failed to update cosmetic.'))
    },
  })

  // ── Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cosmetics/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cosmetics'] })
      setDeleteTarget(null)
      setMessage({
        title: 'Cosmetic deleted',
        description: 'The cosmetic has been removed from the shop.',
      })
    },
    onError: (err) => {
      setDeleteTarget(null)
      setMessage({
        title: 'Delete failed',
        description: getErrorMessage(err, 'Failed to delete cosmetic.'),
        variant: 'destructive',
      })
    },
  })

  // ── Form handlers
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

  function handleFormChange(patch: Partial<CosmeticFormState>) {
    setForm((prev) => ({ ...prev, ...patch }))
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
    } else {
      createMutation.mutate(payload)
    }
  }

  // ── Not authenticated
  if (!isAuthenticated) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication required</AlertTitle>
            <AlertDescription>
              You need to be logged in to browse the cosmetics shop.
            </AlertDescription>
          </Alert>
          <Button onClick={() => void navigate({ to: '/auth/login' })}>
            Go to login
          </Button>
        </div>
      </main>
    )
  }

  // ── Fetch error
  if (isError) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load cosmetics</AlertTitle>
          <AlertDescription>
            {getErrorMessage(error, 'An unexpected error occurred.')}
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cosmetics Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading
              ? 'Loading items…'
              : `${filtered.length} item${filtered.length !== 1 ? 's' : ''} available`}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add cosmetic
          </Button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={typeFilter}
          onValueChange={(v) => applyTypeFilter(v as CosmeticType | 'all')}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {COSMETIC_TYPES.map((t) => (
              <TabsTrigger key={t} value={t}>
                {TYPE_LABELS[t]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Select
          value={rarityFilter}
          onValueChange={(v) => applyRarityFilter(v as CosmeticRarity | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All rarities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All rarities</SelectItem>
            {RARITY_ORDER.map((r) => (
              <SelectItem key={r} value={r}>
                {RARITY_STYLES[r].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-muted animate-pulse aspect-[3/4]"
            />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <p className="text-muted-foreground text-sm">
            No cosmetics match the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {paginated.map((cosmetic) => (
            <CosmeticCard
              key={cosmetic.id}
              cosmetic={cosmetic}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            </PaginationItem>

            <PaginationItem>
              <span className="px-4 text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
            </PaginationItem>

            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* ── Dialogs ── */}
      <CosmeticFormDialog
        open={formOpen}
        editing={editing}
        form={form}
        formError={formError}
        isPending={createMutation.isPending || updateMutation.isPending}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
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
        onOpenChange={(v) => !v && setMessage(null)}
      />
    </main>
  )
}
