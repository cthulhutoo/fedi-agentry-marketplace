'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { ListingCard } from './components/marketplace/ListingCard'
import { PaymentFlow } from './components/marketplace/PaymentFlow'
import { useWallet } from './hooks/useWallet'
import { 
  CATEGORIES, 
  CONDITIONS, 
  formatPrice, 
  formatNpub,
  cn 
} from '@/lib/utils'
import { ListingWithSeller, User, Listing } from '@/lib/drizzle/schema'

// Mock data for prototype - in production this would come from API/database
const MOCK_LISTINGS: ListingWithSeller[] = [
  {
    id: 1,
    cuid: 'list_001',
    sellerId: 1,
    title: 'Sony WH-1000XM5 Headphones',
    description: 'Excellent noise cancelling headphones, barely used. Comes with original case and cables. Perfect for working from home or travel.',
    priceSats: 2500000,
    currency: 'SATS',
    category: 'electronics',
    condition: 'like_new',
    location: 'San Francisco, CA',
    lat: '37.7749',
    lng: '-122.4194',
    images: [],
    status: 'active',
    timeSold: null,
    escrowEnabled: true,
    directPaymentEnabled: true,
    mintUrl: 'https://mint.minibits.cash/Bitcoin',
    viewCount: 42,
    timeCreated: new Date(Date.now() - 86400000 * 2).toISOString(),
    timeUpdated: new Date(Date.now() - 86400000 * 2).toISOString(),
    seller: {
      id: 1,
      pubkey: '21b089a016de25e7c3b865839e5c3f942833e1f8e9e15c63fb13eaece6aca196',
      npub: 'npub1yxcgngqkmcj70sacvkpeuhpljs5r8c0ca8s4cclmz04wee4v5xtqfn9e7x',
      nip05: 'stateless@agentry.com',
      agentId: 'd167a1c7aa6b',
      did: 'did:agentry:242b836293233567378f3107fde42b4d',
      reputationScore: '4.8',
      totalTransactions: 12,
      successfulTransactions: 11,
      timeCreated: new Date().toISOString(),
    } as User,
  },
  {
    id: 2,
    cuid: 'list_002', 
    sellerId: 2,
    title: 'Vintage Motorcycle - Honda CB750',
    description: '1976 Honda CB750 in great condition. Recently serviced, new tires, runs perfectly. Classic bike with original paint.',
    priceSats: 15000000,
    currency: 'SATS',
    category: 'vehicles',
    condition: 'good',
    location: 'Austin, TX',
    lat: '30.2672',
    lng: '-97.7431',
    images: [],
    status: 'active',
    timeSold: null,
    escrowEnabled: true,
    directPaymentEnabled: false,
    mintUrl: 'https://mint.minibits.cash/Bitcoin',
    viewCount: 156,
    timeCreated: new Date(Date.now() - 86400000 * 5).toISOString(),
    timeUpdated: new Date(Date.now() - 86400000 * 5).toISOString(),
    seller: {
      id: 2,
      pubkey: 'abc123def456',
      npub: 'npub1abc123def456',
      nip05: null,
      agentId: null,
      did: null,
      reputationScore: '3.5',
      totalTransactions: 3,
      successfulTransactions: 2,
      timeCreated: new Date().toISOString(),
    } as User,
  },
  {
    id: 3,
    cuid: 'list_003',
    sellerId: 3,
    title: 'Mid-Century Modern Coffee Table',
    description: 'Beautiful walnut coffee table, authentic mid-century design. Minor scratches but structurally perfect.',
    priceSats: 800000,
    currency: 'SATS',
    category: 'furniture',
    condition: 'good',
    location: 'Brooklyn, NY',
    lat: '40.6782',
    lng: '-73.9442',
    images: [],
    status: 'active',
    timeSold: null,
    escrowEnabled: true,
    directPaymentEnabled: true,
    mintUrl: 'https://mint.minibits.cash/Bitcoin',
    viewCount: 23,
    timeCreated: new Date(Date.now() - 86400000).toISOString(),
    timeUpdated: new Date(Date.now() - 86400000).toISOString(),
    seller: {
      id: 3,
      pubkey: 'xyz789abc123',
      npub: 'npub1xyz789abc123',
      nip05: 'furnitureguy@agentry.com',
      agentId: 'abc789',
      did: 'did:agentry:xyz',
      reputationScore: '5.0',
      totalTransactions: 8,
      successfulTransactions: 8,
      timeCreated: new Date().toISOString(),
    } as User,
  },
  {
    id: 4,
    cuid: 'list_004',
    sellerId: 1,
    title: 'MacBook Pro M3 14-inch',
    description: 'Latest MacBook Pro with M3 chip, 18GB RAM, 512GB SSD. Only 3 months old, still under warranty.',
    priceSats: 4500000,
    currency: 'SATS',
    category: 'electronics',
    condition: 'like_new',
    location: 'San Francisco, CA',
    images: [],
    status: 'active',
    escrowEnabled: true,
    directPaymentEnabled: true,
    mintUrl: 'https://mint.minibits.cash/Bitcoin',
    viewCount: 89,
    timeCreated: new Date(Date.now() - 43200000).toISOString(),
    timeUpdated: new Date(Date.now() - 43200000).toISOString(),
    seller: {
      id: 1,
      pubkey: '21b089a016de25e7c3b865839e5c3f942833e1f8e9e15c63fb13eaece6aca196',
      npub: 'npub1yxcgngqkmcj70sacvkpeuhpljs5r8c0ca8s4cclmz04wee4v5xtqfn9e7x',
      nip05: 'stateless@agentry.com',
      agentId: 'd167a1c7aa6b',
      did: 'did:agentry:242b836293233567378f3107fde42b4d',
      reputationScore: '4.8',
      totalTransactions: 12,
      successfulTransactions: 11,
      timeCreated: new Date().toISOString(),
    } as User,
  },
  {
    id: 5,
    cuid: 'list_005',
    sellerId: 4,
    title: 'Fixie Bike - Custom Build',
    description: 'Custom fixed gear bike with carbon fiber fork, bullhorn handlebars. Great for city riding.',
    priceSats: 350000,
    currency: 'SATS',
    category: 'sports',
    condition: 'good',
    location: 'Portland, OR',
    images: [],
    status: 'active',
    escrowEnabled: false,
    directPaymentEnabled: true,
    mintUrl: 'https://mint.minibits.cash/Bitcoin',
    viewCount: 34,
    timeCreated: new Date(Date.now() - 172800000).toISOString(),
    timeUpdated: new Date(Date.now() - 172800000).toISOString(),
    seller: {
      id: 4,
      pubkey: 'bike456xyz',
      npub: 'npub1bike456xyz',
      nip05: null,
      agentId: null,
      did: null,
      reputationScore: '4.2',
      totalTransactions: 5,
      successfulTransactions: 5,
      timeCreated: new Date().toISOString(),
    } as User,
  },
  {
    id: 6,
    cuid: 'list_006',
    sellerId: 5,
    title: 'Leather Jacket - Vintage',
    description: 'Genuine leather biker jacket from the 80s. Perfect condition, no tears or major scuffs.',
    priceSats: 420000,
    currency: 'SATS',
    category: 'clothing',
    condition: 'good',
    location: 'Los Angeles, CA',
    images: [],
    status: 'active',
    escrowEnabled: true,
    directPaymentEnabled: true,
    mintUrl: 'https://mint.minibits.cash/Bitcoin',
    viewCount: 67,
    timeCreated: new Date(Date.now() - 259200000).toISOString(),
    timeUpdated: new Date(Date.now() - 259200000).toISOString(),
    seller: {
      id: 5,
      pubkey: 'leather789',
      npub: 'npub1leather789',
      nip05: 'vintage@agentry.com',
      agentId: 'leather123',
      did: 'did:agentry:leather',
      reputationScore: '4.9',
      totalTransactions: 20,
      successfulTransactions: 19,
      timeCreated: new Date().toISOString(),
    } as User,
  },
]

export default function MarketplacePage() {
  const { 
    weblnEnabled, 
    nostrConnected, 
    pubkey, 
    walletAlias, 
    environment,
    isLoading,
    initialize 
  } = useWallet()

  const [listings, setListings] = useState<ListingWithSeller[]>(MOCK_LISTINGS)
  const [filteredListings, setFilteredListings] = useState<ListingWithSeller[]>(MOCK_LISTINGS)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000000])
  const [selectedListing, setSelectedListing] = useState<ListingWithSeller | null>(null)
  const [showPaymentFlow, setShowPaymentFlow] = useState(false)
  const [showCreateListing, setShowCreateListing] = useState(false)
  const [activeTab, setActiveTab] = useState<'browse' | 'selling' | 'orders'>('browse')

  // Filter listings based on search and category
  useEffect(() => {
    let filtered = listings

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(l => l.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(l =>
        l.title.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query) ||
        l.location?.toLowerCase().includes(query)
      )
    }

    filtered = filtered.filter(l => 
      l.priceSats >= priceRange[0] && l.priceSats <= priceRange[1]
    )

    setFilteredListings(filtered)
  }, [listings, selectedCategory, searchQuery, priceRange])

  const handleBuy = useCallback((listing: ListingWithSeller) => {
    if (!weblnEnabled || !nostrConnected) {
      toast.error('Please connect your wallet first')
      initialize()
      return
    }
    setSelectedListing(listing)
    setShowPaymentFlow(true)
  }, [weblnEnabled, nostrConnected, initialize])

  const handleMessage = useCallback(async (listing: ListingWithSeller) => {
    if (!nostrConnected) {
      toast.error('Please connect your Nostr identity')
      initialize()
      return
    }
    // In real implementation, would open DM modal
    toast.success(`Opening chat with ${formatNpub(listing.seller.npub || '')}`)
  }, [nostrConnected, initialize])

  const handlePaymentComplete = useCallback((transactionId: string) => {
    toast.success(`Transaction ${transactionId.slice(0, 8)}... created!`)
    setShowPaymentFlow(false)
    setSelectedListing(null)
  }, [])

  const handleCreateListing = useCallback((newListing: Partial<Listing>) => {
    const listing: ListingWithSeller = {
      ...newListing,
      id: listings.length + 1,
      cuid: `list_${Date.now()}`,
      sellerId: 1,
      seller: MOCK_LISTINGS[0].seller,
      viewCount: 0,
      timeCreated: new Date().toISOString(),
      timeUpdated: new Date().toISOString(),
    } as ListingWithSeller

    setListings(prev => [listing, ...prev])
    setShowCreateListing(false)
    toast.success('Listing created!')
  }, [listings])

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center text-2xl">
                🏪
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  Fedi Marketplace
                </h1>
                <p className="text-xs text-neutral-500">Powered by Agentry</p>
              </div>
            </div>

            {/* Wallet Status */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  weblnEnabled ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="text-neutral-600 dark:text-neutral-400">
                  {weblnEnabled ? "⚡ Connected" : "⚡ Disconnected"}
                </span>
                {nostrConnected && pubkey && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-500 ml-2" />
                    <span className="text-neutral-600 dark:text-neutral-400">
                      🔑 {formatNpub(pubkey)}
                    </span>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setShowCreateListing(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Sell Item
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search items, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                selectedCategory === 'all'
                  ? "bg-orange-500 text-white"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
              )}
            >
              All Items
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                  selectedCategory === cat.id
                    ? "bg-orange-500 text-white"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
                )}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onClick={(l) => setSelectedListing(l)}
              onBuy={handleBuy}
              onMessage={handleMessage}
            />
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              No listings found
            </h3>
            <p className="text-neutral-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Payment Flow Modal */}
      {showPaymentFlow && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <PaymentFlow
            listing={selectedListing}
            buyerAgentId="demo_buyer_001"
            onComplete={handlePaymentComplete}
            onCancel={() => {
              setShowPaymentFlow(false)
              setSelectedListing(null)
            }}
          />
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <CreateListingForm
            onSubmit={handleCreateListing}
            onCancel={() => setShowCreateListing(false)}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-neutral-500">
          <p>Fedi Marketplace • Bridging Fedi and Agentry</p>
          <p className="mt-2">
            ⚡ WebLN {weblnEnabled ? 'Connected' : 'Disconnected'} • 
            🔑 Nostr {nostrConnected ? 'Connected' : 'Disconnected'}
          </p>
        </div>
      </footer>
    </main>
  )
}

// Create Listing Form Component
function CreateListingForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (listing: Partial<Listing>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priceSats: '',
    category: 'other',
    condition: 'good',
    location: '',
    escrowEnabled: true,
    directPaymentEnabled: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      priceSats: parseInt(formData.priceSats),
      status: 'active',
    })
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Create New Listing</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            required
            value={formData.title}
            onChange={e => setFormData(d => ({ ...d, title: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border dark:border-neutral-700 dark:bg-neutral-800"
            placeholder="What are you selling?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            required
            value={formData.description}
            onChange={e => setFormData(d => ({ ...d, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border dark:border-neutral-700 dark:bg-neutral-800 h-24"
            placeholder="Describe your item..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price (sats)</label>
            <input
              required
              type="number"
              min="1"
              value={formData.priceSats}
              onChange={e => setFormData(d => ({ ...d, priceSats: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-neutral-700 dark:bg-neutral-800"
              placeholder="100000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={formData.category}
              onChange={e => setFormData(d => ({ ...d, category: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-neutral-700 dark:bg-neutral-800"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Condition</label>
            <select
              value={formData.condition}
              onChange={e => setFormData(d => ({ ...d, condition: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-neutral-700 dark:bg-neutral-800"
            >
              {CONDITIONS.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              value={formData.location}
              onChange={e => setFormData(d => ({ ...d, location: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-neutral-700 dark:bg-neutral-800"
              placeholder="City, State"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.escrowEnabled}
              onChange={e => setFormData(d => ({ ...d, escrowEnabled: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">Enable Escrow</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.directPaymentEnabled}
              onChange={e => setFormData(d => ({ ...d, directPaymentEnabled: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">Allow Direct Payment</span>
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
          >
            Create Listing
          </button>
        </div>
      </form>
    </div>
  )
}
