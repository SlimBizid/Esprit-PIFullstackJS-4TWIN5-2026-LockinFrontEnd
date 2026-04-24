import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Shield,
  ShoppingBag,
  Sparkles,
  Tag,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  COSMETIC_TYPE_LABELS,
  type Cosmetic,
  type CosmeticRarity,
} from '@/models/cosmetic'
import { api, initializeAuth, useIsAuthenticated, useUser } from '@/stores/userStore'

type CosmeticDetail = Cosmetic & {
  owned?: boolean
}

const RARITY_LABELS: Record<CosmeticRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback

  const message = error.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string' && message.trim()) return message
  return fallback
}

function formatPrice(price: number | null) {
  if (price == null) return 'Reward only'
  return `${price.toLocaleString()} coins`
}

export const Route = createFileRoute('/cosmetic/$id')({
  component: CosmeticDetailsPage,
})

function CosmeticDetailsPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const isAuthenticated = useIsAuthenticated()
  const currentUser = useUser()
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)

  const cosmeticQuery = useQuery({
    queryKey: ['cosmetics', 'detail', id],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await api.get(`/cosmetics/${id}`)
      return data as CosmeticDetail
    },
  })

  if (!isAuthenticated) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm space-y-4 text-center">
          <Alert>
            <ShoppingBag className="h-4 w-4" />
            <AlertTitle>Sign in to view cosmetics</AlertTitle>
            <AlertDescription>
              You need to log in before browsing shop details.
            </AlertDescription>
          </Alert>
          <Button onClick={() => void navigate({ to: '/auth/login' })}>
            Go to login
          </Button>
        </div>
      </main>
    )
  }

  if (cosmeticQuery.isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">
          Loading cosmetic...
        </p>
      </main>
    )
  }

  if (cosmeticQuery.isError || !cosmeticQuery.data) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load cosmetic</AlertTitle>
          <AlertDescription>
            {getErrorMessage(
              cosmeticQuery.error,
              'This cosmetic could not be loaded.',
            )}
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  const cosmetic = cosmeticQuery.data
  const canBuy = cosmetic.price != null && !cosmetic.owned

  async function handleBuy() {
    try {
      setIsPurchasing(true)
      setPurchaseError(null)
      setPurchaseSuccess(null)
      await api.post(`/cosmetics/buy/${cosmetic.id}`)
      await initializeAuth()
      setPurchaseSuccess('Cosmetic purchased successfully.')
      await cosmeticQuery.refetch()
    } catch (error) {
      setPurchaseError(
        getErrorMessage(error, 'This cosmetic could not be purchased.'),
      )
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <Button asChild variant="outline" className="w-fit">
        <Link to="/cosmetics">
          <ArrowLeft className="h-4 w-4" />
          Back to shop
        </Link>
      </Button>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden border-border/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,11,20,0.98))] py-0 shadow-[0_24px_60px_rgba(0,0,0,0.32)]">
          <div className="relative aspect-square overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,207,186,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.18))]" />
            <img
              src={cosmetic.imageUrl}
              alt={cosmetic.cosmeticTitle}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(2,6,13,0.92))] px-6 pb-6 pt-16">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="border border-white/10 bg-black/40 text-white">
                  {COSMETIC_TYPE_LABELS[cosmetic.cosmeticType]}
                </Badge>
                <Badge className="bg-primary/90 text-primary-foreground">
                  {RARITY_LABELS[cosmetic.cosmeticRarity]}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="h-full border-border/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(8,12,22,0.98))] shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
          <CardHeader className="space-y-4 border-b border-border/60">
            <Badge variant="outline" className="w-fit border-primary/25 bg-primary/10 text-primary">
              Featured cosmetic
            </Badge>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                {cosmetic.cosmeticTitle}
              </CardTitle>
              <CardDescription className="text-base leading-7 text-muted-foreground">
                {cosmetic.cosmeticDescription}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="gap-3 border-border/60 bg-background/35 py-4 shadow-none">
                <CardHeader className="px-4">
                  <CardDescription className="flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-muted-foreground">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    Price
                  </CardDescription>
                  <CardTitle className="text-2xl font-black text-primary">
                    {formatPrice(cosmetic.price)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="gap-3 border-border/60 bg-background/35 py-4 shadow-none">
                <CardHeader className="px-4">
                  <CardDescription className="flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    Type
                  </CardDescription>
                  <CardTitle className="text-xl font-black text-foreground">
                    {COSMETIC_TYPE_LABELS[cosmetic.cosmeticType]}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {currentUser ? (
              <Card className="gap-3 border-border/60 bg-background/30 py-4 shadow-none">
                <CardHeader className="px-4">
                  <CardDescription className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground">
                    Balance
                  </CardDescription>
                  <CardTitle className="text-2xl font-black text-foreground">
                    {currentUser.coins.toLocaleString()} coins
                  </CardTitle>
                </CardHeader>
              </Card>
            ) : null}

            <Card className="gap-4 border-border/60 bg-background/30 py-5 shadow-none">
              <CardHeader className="px-5">
                <CardDescription className="flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Cosmetic notes
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 text-sm leading-7 text-muted-foreground">
                Add this item to give your profile a stronger presence in the
                shop rotation. The current artwork, rarity, and category are all
                tuned to keep it feeling collectible instead of generic.
              </CardContent>
            </Card>

            {purchaseError ? (
              <Alert variant="destructive">
                <AlertTitle>Purchase failed</AlertTitle>
                <AlertDescription>{purchaseError}</AlertDescription>
              </Alert>
            ) : null}

            {purchaseSuccess ? (
              <Alert>
                <AlertTitle>Purchase complete</AlertTitle>
                <AlertDescription>{purchaseSuccess}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex-1" />
          </CardContent>

          <CardFooter className="mt-auto flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row">
            <Button
              className="w-full sm:flex-1"
              disabled={!canBuy || isPurchasing}
              onClick={() => void handleBuy()}
            >
              <ShoppingBag className="h-4 w-4" />
              {cosmetic.owned
                ? 'Owned'
                : !canBuy
                ? 'Reward only'
                : isPurchasing
                  ? 'Buying...'
                  : 'Buy'}
            </Button>
            <Button asChild variant="outline" className="w-full sm:flex-1">
              <Link to="/cosmetics">Keep browsing</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}
