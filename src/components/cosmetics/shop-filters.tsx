import { Plus, Search, SlidersHorizontal } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RARITY_STYLES } from '@/components/cosmetics/constants'
import { Input } from '@/components/ui/input'
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
  type CosmeticRarity,
  type CosmeticType,
} from '@/models/cosmetic'

type ShopFiltersProps = {
  activeFilterCount: number
  isAdmin: boolean
  onOpenCreate: () => void
  onReset: () => void
  onRarityChange: (value: CosmeticRarity | 'all') => void
  onSearchChange: (value: string) => void
  onTypeChange: (value: CosmeticType | 'all') => void
  rarityFilter: CosmeticRarity | 'all'
  searchQuery: string
  typeFilter: CosmeticType | 'all'
}

export function ShopFilters({
  activeFilterCount,
  isAdmin,
  onOpenCreate,
  onReset,
  onRarityChange,
  onSearchChange,
  onTypeChange,
  rarityFilter,
  searchQuery,
  typeFilter,
}: ShopFiltersProps) {
  return (
    <section className="border border-border/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(9,13,24,0.96))] p-5 shadow-[0_20px_40px_rgba(0,0,0,0.22)]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-primary/70">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Store navigation
            </div>
            <h2 className="text-2xl font-black text-foreground">
              Hunt the drop that fits your profile
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Search by name, filter by rarity, and browse the category shelf
              that matches your current obsession.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeFilterCount > 0 ? (
              <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-primary">
                {activeFilterCount} active filter
                {activeFilterCount > 1 ? 's' : ''}
              </Badge>
            ) : null}

            {isAdmin ? (
              <Button
                onClick={onOpenCreate}
                className="h-10 rounded-full px-5"
              >
                <Plus className="h-4 w-4" />
                New cosmetic
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search the item shop"
              className="h-12 rounded-full border-border/70 bg-background/50 pl-11 pr-4"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={rarityFilter}
              onValueChange={(value) =>
                onRarityChange(value as CosmeticRarity | 'all')
              }
            >
              <SelectTrigger className="h-12 w-48 rounded-full border-border/70 bg-background/50 px-4">
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

            {activeFilterCount > 0 ? (
              <Button
                variant="outline"
                className="h-12 rounded-full px-5"
                onClick={onReset}
              >
                Reset
              </Button>
            ) : null}
          </div>
        </div>

        <Tabs
          value={typeFilter}
          onValueChange={(value) => onTypeChange(value as CosmeticType | 'all')}
        >
          <TabsList
            variant="line"
            className="h-auto w-full flex-wrap justify-start gap-2 rounded-none p-0"
          >
            <TabsTrigger
              value="all"
              className="rounded-full border border-border/70 bg-background/45 px-4 py-2 text-muted-foreground data-[state=active]:border-primary/30 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground"
            >
              All drops
            </TabsTrigger>
            {COSMETIC_TYPES.map((type) => (
              <TabsTrigger
                key={type}
                value={type}
                className="rounded-full border border-border/70 bg-background/45 px-4 py-2 text-muted-foreground data-[state=active]:border-primary/30 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground"
              >
                {COSMETIC_TYPE_LABELS[type]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </section>
  )
}
