import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { AlertCircle, ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'

import { CosmeticFormDialog } from '@/components/cosmetics/cosmetic-form-dialog'
import {
  buildCosmeticPayload,
  cosmeticToForm,
  DEFAULT_FORM,
  validateCosmeticForm,
} from '@/components/cosmetics/form-utils'
import { filterShopCosmetics } from '@/components/cosmetics/utils'
import { ShopCard } from '@/components/cosmetics/shop-card'
import { ShopFilters } from '@/components/cosmetics/shop-filters'
import { ShopHero } from '@/components/cosmetics/shop-hero'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  MessageDialog,
  type MessageDialogState,
} from '@/components/message-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAchievementOptions } from '@/hooks/use-achievement-options'
import { useShopCosmetics } from '@/hooks/use-shop-cosmetics'
import {
  getApiErrorMessage,
} from '@/lib/api-error'
import {
  type Cosmetic,
  type CosmeticRarity,
  type CosmeticType,
} from '@/models/cosmetic'
import type { CosmeticFormState } from '@/models/cosmetics-shop'
import { api, useIsAdmin, useIsAuthenticated } from '@/stores/userStore'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Cosmetic | null>(null)
  const [form, setForm] = useState<CosmeticFormState>(DEFAULT_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Cosmetic | null>(null)
  const [message, setMessage] = useState<MessageDialogState | null>(null)

  const shopQuery = useShopCosmetics(isAuthenticated)
  const achievementsQuery = useAchievementOptions(isAdmin && isAuthenticated)

  const filteredCosmetics = useMemo(
    () =>
      filterShopCosmetics(
        shopQuery.data?.data ?? [],
        typeFilter,
        rarityFilter,
        searchQuery,
      ),
    [rarityFilter, searchQuery, shopQuery.data?.data, typeFilter],
  )

  const featuredCosmetic = shopQuery.data?.data?.[0] ?? null

  const createMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildCosmeticPayload>) =>
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
      payload: ReturnType<typeof buildCosmeticPayload>
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
    const validationError = validateCosmeticForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    const payload = buildCosmeticPayload(form)

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload })
      return
    }

    createMutation.mutate(payload)
  }

  function resetFilters() {
    setSearchQuery('')
    setTypeFilter('all')
    setRarityFilter('all')
  }

  const activeFilterCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (rarityFilter !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0)

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
      <ShopHero featuredCosmetic={featuredCosmetic} />

      <ShopFilters
        activeFilterCount={activeFilterCount}
        isAdmin={isAdmin}
        onOpenCreate={openCreate}
        onRarityChange={setRarityFilter}
        onReset={resetFilters}
        onSearchChange={setSearchQuery}
        onTypeChange={setTypeFilter}
        rarityFilter={rarityFilter}
        searchQuery={searchQuery}
        typeFilter={typeFilter}
      />

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
        <Card className="border-dashed border-border/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.86),rgba(8,12,22,0.95))] shadow-[0_16px_34px_rgba(0,0,0,0.2)]">
          <CardHeader>
            <CardTitle className="text-foreground">
              Nothing matches this window display
            </CardTitle>
            <CardDescription>
              Try a broader search, reset the filters, or add a fresh piece to
              the storefront as an admin.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70">
                Collection
              </p>
              <h2 className="mt-2 text-2xl font-black text-foreground">
                Shop the shelf
              </h2>
            </div>
          </div>

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
        </section>
      )}

      <CosmeticFormDialog
        achievements={achievementsQuery.data ?? []}
        achievementsError={
          achievementsQuery.isError
            ? getApiErrorMessage(
                achievementsQuery.error,
                'Achievements could not be loaded.',
              )
            : null
        }
        achievementsLoading={achievementsQuery.isLoading}
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
