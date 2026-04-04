import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Coins, Check, Sparkles, User, Shield, Cpu, Zap, Ghost, MonitorPlay, Lock, Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const Route = createFileRoute('/cosmetics')({
  component: CosmeticsPage,
})

type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary'
type Category = 'Avatar' | 'Title' | 'Border' | 'Pet'

interface CosmeticItem {
  id: string
  name: string
  description: string
  price: number
  rarity: Rarity
  category: Category
  icon?: React.ReactNode
  isOwned?: boolean
  isEquipped?: boolean
}

const ITEMS: CosmeticItem[] = [
  // Avatars
  { id: '1', name: 'Cyber Samurai', description: 'A sleek, neon-infused digital warrior ready to slash through code.', price: 1500, rarity: 'Epic', category: 'Avatar', isOwned: true, isEquipped: true, icon: <User className="w-12 h-12"/> },
  { id: '2', name: 'Glitch Master', description: 'They say you can see the matrix when you equip this.', price: 2500, rarity: 'Legendary', category: 'Avatar', isOwned: false, icon: <Ghost className="w-12 h-12"/> },
  { id: '3', name: 'Rookie Coder', description: 'Standard issue profile picture for all Lockin users.', price: 0, rarity: 'Common', category: 'Avatar', isOwned: true, isEquipped: false, icon: <User className="w-12 h-12"/> },
  
  // Titles
  { id: '4', name: '10x Developer', description: 'Writes code faster than the compiler can parse it.', price: 500, rarity: 'Rare', category: 'Title', isOwned: false },
  { id: '5', name: 'Bug Hunter', description: 'Exterminator of logical errors and memory leaks.', price: 800, rarity: 'Epic', category: 'Title', isOwned: true, isEquipped: false },
  { id: '6', name: 'Stack Overflow Guru', description: 'Copy-pasting your way directly to production.', price: 200, rarity: 'Common', category: 'Title', isOwned: true, isEquipped: true },
  
  // Borders
  { id: '7', name: 'Neon Pulse Frame', description: 'A glowing rim around your profile.', price: 1200, rarity: 'Epic', category: 'Border', isOwned: false, icon: <Zap className="w-10 h-10"/> },
  { id: '8', name: 'Iron Defender', description: 'Solid protection against bad vibes.', price: 400, rarity: 'Common', category: 'Border', isOwned: false, icon: <Shield className="w-10 h-10"/> },
  
  // Pets
  { id: '9', name: 'Syntax Slime', description: 'A squishy companion that eats semicolons. Gives +5% XP.', price: 3000, rarity: 'Legendary', category: 'Pet', isOwned: false, icon: <Cpu className="w-10 h-10"/> },
  { id: '10', name: 'Byte Dog', description: 'A loyal digital dog. Barks when code breaks.', price: 1200, rarity: 'Rare', category: 'Pet', isOwned: true, isEquipped: false, icon: <MonitorPlay className="w-10 h-10"/> },
]

const RARITY_STYLES = {
  Common: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  Rare: 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
  Epic: 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
  Legendary: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)] border-b-2'
}

function CosmeticsPage() {
  const [balance, setBalance] = useState(4200)
  const [items, setItems] = useState<CosmeticItem[]>(ITEMS)
  const [activeCategory, setActiveCategory] = useState<Category>('Avatar')
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handlePurchase = (id: string, price: number, name: string) => {
    if (balance >= price) {
      setBalance(b => b - price)
      setItems(prev => prev.map(item => item.id === id ? { ...item, isOwned: true } : item))
      showToast(`Item acheté : ${name}`)
    } else {
      showToast('Fonds insuffisants !')
    }
  }

  const handleEquip = (id: string, category: Category, name: string) => {
    setItems(prev => prev.map(item => {
      if (item.category !== category) return item
      if (item.id === id) return { ...item, isEquipped: true }
      return { ...item, isEquipped: false }
    }))
    showToast(`Équipé : ${name}`)
  }

  const filteredItems = items.filter(item => 
    item.category === activeCategory && 
    (activeTab === 'shop' ? true : item.isOwned)
  )

  const activeTitle = items.find(i => i.category === 'Title' && i.isEquipped)?.name || 'No Title'
  const activePet = items.find(i => i.category === 'Pet' && i.isEquipped)

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 font-sans selection:bg-purple-500/30 relative overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Toast Notification */}
      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-zinc-900/90 border border-zinc-700 shadow-2xl backdrop-blur-md transition-all duration-300 flex items-center gap-3 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="font-medium text-sm">{toastMessage}</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 pt-24">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Store & Inventory</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-white mb-2">
              LOCKIN Cosmetics
            </h1>
            <p className="text-zinc-400 max-w-lg text-lg">
              Spend your hard-earned <span className="text-yellow-400 font-semibold">Lockin Coins</span> to customize your digital presence and show off your achievements.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mr-2">Your Balance</p>
            <div className="flex items-center gap-3 px-6 py-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-xl backdrop-blur-md">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Coins className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-2xl text-yellow-400 leading-tight">{balance.toLocaleString()}</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Lockin Coins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Interface */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Sidebar - Player Identity & Navigation */}
          <div className="w-full lg:w-80 flex flex-col gap-6 flex-shrink-0">
            
            {/* Player Identity Card */}
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-28 h-28 rounded-full p-1.5 mb-5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                  <Avatar className="w-full h-full border-[6px] border-zinc-950 bg-zinc-900">
                    <AvatarFallback className="text-4xl font-black text-purple-300">Z</AvatarFallback>
                  </Avatar>
                </div>
                
                <h2 className="text-2xl font-black text-white mb-1">Zied Sghaier</h2>
                <div className="px-3 py-1 bg-zinc-800/50 rounded-lg border border-zinc-700 backdrop-blur-sm mb-6">
                  <p className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 uppercase tracking-widest">
                    {activeTitle}
                  </p>
                </div>

                <div className="w-full pt-6 border-t border-zinc-800/80 flex items-center justify-between">
                  {activePet ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                        {activePet.icon}
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Active Pet</p>
                        <p className="text-sm font-semibold text-zinc-200">{activePet.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 opacity-50">
                      <div className="w-10 h-10 rounded-xl border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-zinc-400">No Pet Equipped</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-Navigation Categories */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-3 backdrop-blur-md">
              <nav className="flex flex-col gap-1">
                {['Avatar', 'Title', 'Border', 'Pet'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat as Category)}
                    className={`flex items-center justify-between px-5 py-4 text-left rounded-2xl transition-all font-medium ${
                      activeCategory === cat 
                        ? 'bg-gradient-to-r from-purple-600/20 to-transparent text-white border-l-2 border-purple-500' 
                        : 'text-zinc-400 border-l-2 border-transparent hover:bg-zinc-800/50 hover:text-zinc-200'
                    }`}
                  >
                    <span>{cat}s</span>
                    {activeCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,1)]" />}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Right Content Area - Shop / Inventory */}
          <div className="flex-1">
            <Tabs defaultValue="shop" onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              
              {/* Modern Tabs aligned right with search placeholder */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <TabsList className="bg-zinc-900/80 border border-zinc-800 p-1.5 rounded-2xl h-14 w-full sm:w-auto">
                  <TabsTrigger value="shop" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-10 font-bold tracking-wide transition-all">Boutique</TabsTrigger>
                  <TabsTrigger value="inventory" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-10 font-bold tracking-wide transition-all">Inventaire</TabsTrigger>
                </TabsList>
                
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Search cosmetics..." 
                    disabled
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* TABS CONTENT */}
              <TabsContent value="shop" className="m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredItems.map(item => (
                    <StoreCard 
                      key={item.id} 
                      item={item} 
                      onAction={() => handlePurchase(item.id, item.price, item.name)} 
                      mode="shop"
                      affordable={balance >= item.price}
                    />
                  ))}
                  {filteredItems.length === 0 && <EmptyState mode="shop" />}
                </div>
              </TabsContent>

              <TabsContent value="inventory" className="m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredItems.map(item => (
                    <StoreCard 
                      key={item.id} 
                      item={item} 
                      onAction={() => handleEquip(item.id, item.category, item.name)} 
                      mode="inventory"
                    />
                  ))}
                  {filteredItems.length === 0 && <EmptyState mode="inventory" />}
                </div>
              </TabsContent>
            </Tabs>
          </div>

        </div>
      </div>
    </div>
  )
}

function StoreCard({ item, onAction, mode, affordable }: { item: CosmeticItem, onAction: () => void, mode: 'shop'|'inventory', affordable?: boolean }) {
  const isLegendary = item.rarity === 'Legendary'
  
  return (
    <div className={`group relative bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 rounded-3xl transition-all duration-500 overflow-hidden hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/20 flex flex-col ${mode === 'inventory' && item.isEquipped ? 'ring-2 ring-purple-500 ring-offset-4 ring-offset-[#050508]' : ''}`}>
      
      {/* Visual Header of the Card */}
      <div className={`h-32 flex items-center justify-center relative overflow-hidden ${isLegendary ? 'bg-zinc-950' : 'bg-zinc-950/50'}`}>
        {/* Glow behind icon */}
        <div className={`absolute inset-0 blur-3xl opacity-30 ${
          item.rarity === 'Legendary' ? 'bg-yellow-500' :
          item.rarity === 'Epic' ? 'bg-purple-500' :
          item.rarity === 'Rare' ? 'bg-blue-500' : 'bg-zinc-500'
        }`} />
        
        <div className={`relative z-10 transition-transform duration-500 group-hover:scale-110 ${isLegendary ? 'text-yellow-400' : 'text-zinc-300'}`}>
          {item.icon || <User className="w-12 h-12" />}
        </div>
        
        {/* Rarity Label Top Right */}
        <div className="absolute top-4 right-4 z-20">
          <Badge variant="outline" className={`${RARITY_STYLES[item.rarity]} font-bold text-[10px] tracking-widest px-2.5 py-0.5 border`}>
            {item.rarity}
          </Badge>
        </div>
      </div>

      {/* Card Info Section */}
      <div className="p-6 flex-1 flex flex-col bg-gradient-to-b from-zinc-900 to-zinc-950">
        <h3 className={`text-xl font-black mb-2 transition-colors ${isLegendary ? 'text-yellow-400' : 'text-white group-hover:text-purple-300'}`}>
          {item.name}
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6 flex-1">
          {item.description}
        </p>

        {/* Action Button & Price */}
        <div className="pt-5 border-t border-zinc-800/80 flex flex-col gap-4 mt-auto">
          {mode === 'shop' ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-zinc-800/50">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className={`font-black tracking-tight ${affordable ? 'text-white' : 'text-red-400'}`}>
                  {item.price === 0 ? 'FREE' : item.price.toLocaleString()}
                </span>
              </div>
              
              {item.isOwned ? (
                <div className="flex items-center gap-1.5 text-zinc-500 font-bold text-sm px-3 py-1.5">
                  <Check className="w-4 h-4" /> Owned
                </div>
              ) : (
                <Button 
                  onClick={onAction}
                  disabled={!affordable}
                  className={`rounded-xl font-bold px-6 shadow-lg ${
                    isLegendary 
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-yellow-950 shadow-yellow-500/20' 
                      : 'bg-white hover:bg-zinc-200 text-black shadow-white/10'
                  }`}
                >
                  Buy Now
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className={`text-xs font-bold uppercase tracking-wider ${item.isEquipped ? 'text-purple-400' : 'text-zinc-600'}`}>
                {item.isEquipped ? 'Active' : 'Stored'}
              </span>
              <Button 
                onClick={onAction}
                variant={item.isEquipped ? "secondary" : "default"}
                className={`rounded-xl font-bold px-6 ${
                  item.isEquipped 
                    ? "bg-zinc-800 text-zinc-400 pointer-events-none" 
                    : isLegendary 
                      ? "bg-yellow-500 hover:bg-yellow-400 text-yellow-950" 
                      : "bg-purple-600 hover:bg-purple-500 text-white"
                }`}
              >
                {item.isEquipped ? 'Equipped' : 'Equip'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ mode }: { mode: 'shop' | 'inventory' }) {
  return (
    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl">
      <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        {mode === 'shop' ? <Lock className="w-6 h-6 text-zinc-600" /> : <Search className="w-6 h-6 text-zinc-600" />}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">
        {mode === 'shop' ? 'Sold Out' : 'Empty Inventory'}
      </h3>
      <p className="text-zinc-500 max-w-sm">
        {mode === 'shop' 
          ? "There are no more items available in this category. Check back later for new drops!"
          : "You haven't purchased any items in this category yet. Visit the shop to get some!"}
      </p>
    </div>
  )
}
