import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { AlertCircle, ArrowLeft, Coins, ShoppingBag } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  COSMETIC_TYPE_LABELS,
  type Cosmetic,
  type CosmeticRarity,
} from '@/models/cosmetic'
import { api, useIsAuthenticated } from '@/stores/userStore'

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

  const cosmeticQuery = useQuery({
    queryKey: ['cosmetics', 'detail', id],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await api.get(`/cosmetics/${id}`)
      return data as Cosmetic
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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <Button asChild variant="outline" className="w-fit rounded-none">
        <Link to="/cosmetics">
          <ArrowLeft className="h-4 w-4" />
          Back to shop
        </Link>
      </Button>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden border border-border/60 bg-card/80">
          <div className="aspect-square bg-muted/30">
            <img
              src={cosmetic.imageUrl}
              alt={cosmetic.cosmeticTitle}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <Card className="rounded-none">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-none capitalize">
                {COSMETIC_TYPE_LABELS[cosmetic.cosmeticType]}
              </Badge>
              <Badge className="rounded-none">
                {RARITY_LABELS[cosmetic.cosmeticRarity]}
              </Badge>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black tracking-tight">
                {cosmetic.cosmeticTitle}
              </CardTitle>
              <CardDescription className="text-base leading-7">
                {cosmetic.cosmeticDescription}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border border-border/60 bg-muted/20 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Price
              </div>
              <div className="mt-2 flex items-center gap-2 text-2xl font-black text-primary">
                <Coins className="h-5 w-5" />
                {formatPrice(cosmetic.price)}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="rounded-none">
                <ShoppingBag className="h-4 w-4" />
                Buy
              </Button>
              <Button asChild variant="outline" className="rounded-none">
                <Link to="/cosmetics">Keep browsing</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
